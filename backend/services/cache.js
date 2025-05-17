const redis = require('redis');
const { promisify } = require('util');
const { monitoring } = require('./monitoring');

// Configuración de Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (error) => {
  console.error('Redis error:', error);
  monitoring.createSystemAlert(
    'redis',
    1,
    0,
    `Error en conexión con Redis: ${error.message}`
  );
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
  monitoring.createSystemAlert(
    'redis',
    0,
    1,
    'Conexión exitosa con Redis'
  );
});

// Promisificar las funciones Redis
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);
const keysAsync = promisify(redisClient.keys).bind(redisClient);
const ttlAsync = promisify(redisClient.ttl).bind(redisClient);

// Clase de Cache
class Cache {
  constructor() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      totalQueries: 0,
      cacheSize: 0
    };
  }

  // Generar clave única para la caché
  generateCacheKey(query, params) {
    return JSON.stringify({
      query: query.replace(/\s+/g, ' ').trim(),
      params: params || []
    });
  }

  // Obtener de caché
  async getFromCache(query, params) {
    try {
      const key = this.generateCacheKey(query, params);
      const cachedData = await getAsync(key);

      if (cachedData) {
        this.cacheStats.hits++;
        monitoring.metrics.cacheHits++;
        return JSON.parse(cachedData);
      }

      this.cacheStats.misses++;
      monitoring.metrics.cacheMisses++;
      return null;
    } catch (error) {
      monitoring.createSystemAlert(
        'cache',
        1,
        0,
        `Error al obtener de caché: ${error.message}`
      );
      throw new Error(`Error al obtener de caché: ${error.message}`);
    }
  }

  // Guardar en caché
  async setInCache(query, params, data, duration = 300) {
    try {
      const key = this.generateCacheKey(query, params);
      const cacheData = JSON.stringify(data);

      await setAsync(key, cacheData, 'EX', duration);
      this.cacheStats.totalQueries++;
      
      // Actualizar estadísticas de caché
      const ttl = await ttlAsync(key);
      this.cacheStats.cacheSize = await keysAsync('*').then(keys => keys.length);

      monitoring.metrics.cacheSize = this.cacheStats.cacheSize;
      monitoring.metrics.cacheTTL = ttl;
    } catch (error) {
      monitoring.createSystemAlert(
        'cache',
        1,
        0,
        `Error al guardar en caché: ${error.message}`
      );
      throw new Error(`Error al guardar en caché: ${error.message}`);
    }
  }

  // Invalidar caché
  async invalidateCache(query, params) {
    try {
      const key = this.generateCacheKey(query, params);
      await delAsync(key);
      this.cacheStats.invalidations++;
      monitoring.metrics.cacheInvalidations++;
    } catch (error) {
      monitoring.createSystemAlert(
        'cache',
        1,
        0,
        `Error al invalidar caché: ${error.message}`
      );
      throw new Error(`Error al invalidar caché: ${error.message}`);
    }
  }

  // Obtener estadísticas de caché
  async getCacheStats() {
    try {
      return {
        ...this.cacheStats,
        hitRate: this.cacheStats.totalQueries > 0
          ? (this.cacheStats.hits / this.cacheStats.totalQueries) * 100
          : 0,
        missRate: this.cacheStats.totalQueries > 0
          ? (this.cacheStats.misses / this.cacheStats.totalQueries) * 100
          : 0
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Limpiar caché por tipo de consulta
  async clearCacheByType(type) {
    try {
      const keys = await keysAsync(`*${type}*`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => delAsync(key)));
        this.cacheStats.invalidations += keys.length;
        monitoring.metrics.cacheInvalidations += keys.length;
      }
    } catch (error) {
      monitoring.createSystemAlert(
        'cache',
        1,
        0,
        `Error al limpiar caché por tipo: ${error.message}`
      );
      throw new Error(`Error al limpiar caché por tipo: ${error.message}`);
    }
  }

  // Limpiar toda la caché
  async clearAllCache() {
    try {
      const keys = await keysAsync('*');
      if (keys.length > 0) {
        await Promise.all(keys.map(key => delAsync(key)));
        this.cacheStats.cacheSize = 0;
        this.cacheStats.invalidations += keys.length;
        monitoring.metrics.cacheSize = 0;
        monitoring.metrics.cacheInvalidations += keys.length;
      }
    } catch (error) {
      monitoring.createSystemAlert(
        'cache',
        1,
        0,
        `Error al limpiar toda la caché: ${error.message}`
      );
      throw new Error(`Error al limpiar toda la caché: ${error.message}`);
    }
  }

  // Manejar caché automático
  async autoCache(query, params, data, duration, cacheRules) {
    try {
      // Verificar reglas de caché
      if (!cacheRules || !cacheRules.enabled) {
        return;
      }

      // Verificar tipo de consulta
      if (cacheRules.types && !cacheRules.types.includes(query.type)) {
        return;
      }

      // Verificar frecuencia de consulta
      if (cacheRules.frequency && cacheRules.frequency > 1) {
        const key = this.generateCacheKey(query, params);
        const lastAccess = await getAsync(`${key}:access`);
        
        if (lastAccess) {
          const now = Date.now();
          const diff = (now - parseInt(lastAccess)) / 1000;
          if (diff < cacheRules.frequency) {
            return;
          }
        }

        await setAsync(`${key}:access`, Date.now(), 'EX', cacheRules.frequency);
      }

      // Guardar en caché
      await this.setInCache(query, params, data, duration);
    } catch (error) {
      monitoring.createSystemAlert(
        'cache',
        1,
        0,
        `Error en caché automático: ${error.message}`
      );
      throw new Error(`Error en caché automático: ${error.message}`);
    }
  }
}

module.exports = new Cache();
