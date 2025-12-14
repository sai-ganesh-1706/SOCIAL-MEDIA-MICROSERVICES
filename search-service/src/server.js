require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require("cors")
const helmet = require("helmet")
const Redis = require('ioredis');
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const {connectRabbitMQ, consumeEvent} = require('./utils/rabbitmq')
const searchRoutes = require('./routes/search-routes');
const {handlePostCreated, handlePostDeleted} = require('./eventHandlers/search-event-handler');

const app = express();
const PORT = process.env.PORT || 3004

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



app.use('/api/search',searchRoutes);

app.use(errorHandler);

async function startServer(){
    try{
        await connectRabbitMQ();

        await consumeEvent('post.created',handlePostCreated);
        await consumeEvent('post.deleted',handlePostDeleted);

        app.listen(PORT, () => {
            logger.info(`Search service is running on port : ${PORT}`)
        })
    }catch(e){
        logger.error(e,'Failed to start search service')
        process.exit(1);
    }
}

startServer();
