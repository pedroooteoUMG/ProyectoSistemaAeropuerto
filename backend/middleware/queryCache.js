const { cache } = require('../services/cache');
const { monitoring } = require('../services/monitoring');
const { executeQuery, executeProcedure } = require('../services/database');

// Middleware de caché para consultas específicas
const queryCacheMiddleware = (cacheRules = {}) => {
  return async (req, res, next) => {
    try {
      // Verificar si la caché está habilitada
      if (!cacheRules.enabled) {
        return next();
      }

      // Obtener la consulta y parámetros
      const query = req.query || {};
      const params = req.body || {};

      // Verificar si la consulta está en caché
      const cachedData = await cache.getFromCache(query, params);

      if (cachedData) {
        // Si está en caché, usar los datos de caché
        res.cacheHit = true;
        res.cacheDuration = cachedData.duration;
        res.json(cachedData.data);
        return;
      }

      // Si no está en caché, ejecutar la consulta
      let result;
      if (req.method === 'GET') {
        result = await executeQuery(query.sql, params);
      } else if (req.method === 'POST') {
        result = await executeProcedure(query.sql, params);
      }

      // Guardar en caché
      await cache.setInCache(query, params, {
        data: result,
        duration: cacheRules.duration || 300,
        timestamp: Date.now()
      }, cacheRules.duration || 300);

      next();
    } catch (error) {
      monitoring.createSystemAlert(
        'query_cache',
        1,
        0,
        `Error en caché de consulta: ${error.message}`
      );
      next(error);
    }
  };
};

// Decorador para caché automático
const cacheQuery = (cacheRules = {}) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      try {
        // Obtener la consulta y parámetros
        const query = args[0];
        const params = args[1] || {};

        // Verificar si la consulta está en caché
        const cachedData = await cache.getFromCache(query, params);

        if (cachedData) {
          return cachedData.data;
        }

        // Si no está en caché, ejecutar el método original
        const result = await originalMethod.apply(this, args);

        // Guardar en caché
        await cache.setInCache(query, params, {
          data: result,
          duration: cacheRules.duration || 300,
          timestamp: Date.now()
        }, cacheRules.duration || 300);

        return result;
      } catch (error) {
        monitoring.createSystemAlert(
          'query_cache',
          1,
          0,
          `Error en caché de consulta: ${error.message}`
        );
        throw error;
      }
    };

    return descriptor;
  };
};

// Middleware para caché de reportes
const reportCacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    try {
      // Obtener parámetros de la consulta
      const params = {
        ...req.query,
        ...req.body
      };

      // Verificar si el reporte está en caché
      const cachedData = await cache.getFromCache('report', params);

      if (cachedData) {
        res.cacheHit = true;
        res.cacheDuration = cachedData.duration;
        res.json(cachedData.data);
        return;
      }

      next();
    } catch (error) {
      monitoring.createSystemAlert(
        'report_cache',
        1,
        0,
        `Error en caché de reporte: ${error.message}`
      );
      next(error);
    }
  };
};

// Middleware para caché de listas
const listCacheMiddleware = (duration = 600) => {
  return async (req, res, next) => {
    try {
      // Obtener parámetros de la consulta
      const params = {
        ...req.query,
        ...req.body
      };

      // Verificar si la lista está en caché
      const cachedData = await cache.getFromCache('list', params);

      if (cachedData) {
        res.cacheHit = true;
        res.cacheDuration = cachedData.duration;
        res.json(cachedData.data);
        return;
      }

      next();
    } catch (error) {
      monitoring.createSystemAlert(
        'list_cache',
        1,
        0,
        `Error en caché de lista: ${error.message}`
      );
      next(error);
    }
  };
};

module.exports = {
  queryCacheMiddleware,
  cacheQuery,
  reportCacheMiddleware,
  listCacheMiddleware
};
