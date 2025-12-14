require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const proxy = require('express-http-proxy');

const logger = require('./utils/logger.js');
const errorHandler = require('./middleware/errorHandler.js');
const { validateToken } = require('./middleware/authMiddleware.js');

const app = express();
const PORT = process.env.PORT || 3000;

/* =======================
   Redis Setup
======================= */
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on('connect', () =>
  logger.info('Connected to Redis')
);
redisClient.on('error', (err) =>
  logger.error('Redis connection error', err)
);

/* =======================
   Global Middlewares
======================= */
app.use(helmet());
app.use(cors());

/**
 * 🚨 IMPORTANT:
 * Do NOT parse multipart/form-data in API Gateway
 */
app.use((req, res, next) => {
  const contentType = req.headers['content-type'];

  if (contentType && contentType.startsWith('multipart/form-data')) {
    return next(); // let media-service + multer handle it
  }

  express.json()(req, res, next);
});

/* =======================
   Rate Limiting (Redis)
======================= */
const rateLimitOptions = rateLimit({
  windowMS: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests',
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(rateLimitOptions);

/* =======================
   Logger (Safe for uploads)
======================= */
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);

  if (req.is('application/json')) {
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
  } else {
    logger.info('Non-JSON request (likely multipart/form-data)');
  }

  next();
});

/* =======================
   Proxy Common Options
======================= */
const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, '/api');
  },
  proxyErrorHandler: (err, res) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  },
};

/* =======================
   Identity Service Proxy
======================= */
app.use(
  '/v1/auth',
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(
        `Response from Identity service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

/* =======================
   Post Service Proxy
======================= */
app.use(
  '/v1/posts',
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(
        `Response from Post service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

/* =======================
   Media Service Proxy (FILES)
======================= */
app.use(
  '/v1/media',
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    parseReqBody: false, // 🔥 REQUIRED FOR FILE UPLOADS
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;

      const contentType = srcReq.headers['content-type'];
      if (!contentType || !contentType.startsWith('multipart/form-data')) {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
      }

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(
        `Response from Media service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

// SEARCH SERVICE PROXY
app.use(
  '/v1/search',
  validateToken,
  proxy(process.env.SEARCH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(
        `Response from Search service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

/* =======================
   Error Handler
======================= */
app.use(errorHandler);

/* =======================
   Start Server
======================= */
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Identity service → ${process.env.IDENTITY_SERVICE_URL}`);
  logger.info(`Post service → ${process.env.POST_SERVICE_URL}`);
  logger.info(`Media service → ${process.env.MEDIA_SERVICE_URL}`);
  logger.info(`Search service → ${process.env.SEARCH_SERVICE_URL}`);
});
