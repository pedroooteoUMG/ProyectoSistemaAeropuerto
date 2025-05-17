const redis = require('redis');
const { promisify } = require('util');

// Configuración de Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (error) => {
  console.error('Redis error:', error);
});

// Promisificar las funciones Redis
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

// Middleware de cache
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    try {
      // Generar clave única para la caché basada en la URL y parámetros
      const cacheKey = JSON.stringify({
        url: req.url,
        query: req.query,
        method: req.method
      });

      // Verificar si existe en caché
      const cachedData = await getAsync(cacheKey);

      if (cachedData) {
        const { data, headers } = JSON.parse(cachedData);
        Object.keys(headers).forEach(key => {
          res.setHeader(key, headers[key]);
        });
        res.send(data);
        return;
      }

      // Si no existe en caché, continuar con el middleware siguiente
      res.originalSend = res.send;
      res.send = async (body) => {
        // Guardar en caché
        await setAsync(cacheKey, JSON.stringify({
          data: body,
          headers: {
            'Content-Type': res.getHeader('Content-Type')
          }
        }), 'EX', duration);

        res.originalSend(body);
      };

      next();
    } catch (error) {
      console.error('Error en middleware de cache:', error);
      next();
    }
  };
};

// Middleware para invalidar cache
const invalidateCache = async (req, res, next) => {
  try {
    // Generar clave única para la caché basada en la URL y parámetros
    const cacheKey = JSON.stringify({
      url: req.url,
      query: req.query,
      method: req.method
    });

    // Invalidar cache
    await delAsync(cacheKey);

    next();
  } catch (error) {
    console.error('Error al invalidar cache:', error);
    next();
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache
};
