require('dotenv').config();

const mongoose = require('mongoose');
const logger = require("./utils/logger");
const  express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const {RateLimiterRedis} = require('rate-limiter-flexible')
const Redis = require('ioredis')

const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const routes = require('./routes/identity-service');
const { error } = require('winston');
const errorHandler = require("./middleware/errorHandler.js");

const app = express();
const PORT = process.env.PORT || 3001;



//connect to mongodb
mongoose
.connect(process.env.MONGODB_URI)
.then(() => logger.info('Connected to mongodb'))
.catch(e => logger.error("Mongo connection error",e));

const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on('connect', () => logger.info('Connected to Redis'));
redisClient.on('error', (err) => logger.error('Redis connection error', err));


//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req,res,next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body ${JSON.stringify(req.body)}`);
    next();
});

//DDos protection and rate limiting 
const rateLimiter = new RateLimiterRedis({
    storeClient : redisClient,
    keyPrefix : 'middleare',
    points : 10,//Each user (or IP) is allowed 10 requests…
    duration : 1 //…per 1 second.
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn(`Rate Limit exceeded for IP : ${req.ip}`);
        res.status(429).json({success : false, message : "Too many requests"});
    })
});

// Ip based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
    windowMS : 15*60*1000, //15 min
    max : 50,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req,res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP : ${req.ip}`);
        res.status(429).json({ success : false, message : "Too many requests"});
    },
    store : new RedisStore({
        sendCommand : (...args) => redisClient.call(...args),
    }),

}); 

// apply this sensitiveEndpointsLimiter to our routes
app.use('/api/auth/register', sensitiveEndpointsLimiter);

//Routes
app.use('/api/auth', routes)

//error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Identity service running on port ${PORT}`);
});

//unhandled promise rejection

process.on('unhandledRejection',(reason,promise) => {
    logger.error('Unhandled Rejection at ',promise, "reason : ",reason);
})



