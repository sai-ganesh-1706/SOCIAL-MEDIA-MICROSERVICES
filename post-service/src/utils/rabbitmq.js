const amqp = require('amqplib');
const logger = require('./logger.js');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events'

async function connectRabbitMQ() {
    try{
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME,'topic',{durable : false})
        logger.info('Conected to rabbit mq')
        return channel;
    }catch(e){
        logger.error('Error connecting to rabbit mq',e)
    }
}

async function publishEvent(routingKey,message){
    if(!channel){
        await connectRabbitMQ();
    }

    channel.publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)));
    logger.info(`Event published: ${routingKey}`);
}

module.exports = {connectRabbitMQ,publishEvent};

/*
🏗️ MONOLITH (No Microservices)
App
 ├── Post model
 ├── Media model
 ├── User model
 └── One DB

Delete post flow (MONOLITH):
await Post.deleteOne({ _id });
await Media.deleteMany({ postId });
await cloudinary.delete(...);


✔ Same codebase
✔ Same DB connection
✔ Same memory
✔ Same transaction

👉 No RabbitMQ needed

🧱 MICROSERVICES (YOUR PROJECT)
Post Service        Media Service
(Post DB)           (Media DB)

Delete post flow (MICROSERVICES):
Post Service ❌ cannot call Media model directly


Why?

Different process

Different DB

Different deployment

Different responsibility

👉 RabbitMQ is needed

🧠 CORE DIFFERENCE (THIS IS THE KEY)
Monolith:

Function call

deleteMedia(mediaId);

Microservices:

Event communication

emit('post.deleted', mediaIds);

🔥 WHY YOU CANNOT DO “JUST CALL FUNCTION” IN MICROSERVICES
❌ Direct call problems:
await axios.delete('media-service/delete');


Media service down → post delete fails

Tight coupling

Retry complexity

Bad scalability

No async

🐇 WHAT RabbitMQ gives that monolith already had
Feature	Monolith	Microservices + RabbitMQ
Direct memory call	✅	❌
Same DB transaction	✅	❌
Async execution	❌	✅
Retry on failure	❌	✅
Loose coupling	❌	✅
Independent scaling	❌	✅
🧠 VERY IMPORTANT CONCEPT

RabbitMQ replaces in-memory function calls with message passing

That’s it.

🔄 DELETE POST – FINAL FLOW (MICROSERVICES)
Step 1

Post Service:

await Post.deleteOne({ _id });
emit('post.deleted', mediaIds);

Step 2

RabbitMQ:

Stores message safely

Step 3

Media Service:

consume('post.deleted');
delete from cloudinary + db;

🧠 EVENTUAL CONSISTENCY (BIG WORD, SIMPLE MEANING)

Post is deleted immediately

Media deletion happens shortly after

System becomes consistent eventually

This is normal & expected in microservices.

🎯 Interview GOLD ANSWER

In a monolith, different models can directly interact through function calls and shared databases. In microservices, services are isolated and cannot directly call each other’s models, so RabbitMQ is used to enable asynchronous, decoupled communication between services.

🏁 FINAL TAKEAWAY (REMEMBER THIS)

RabbitMQ is not extra complexity — it replaces what memory & function calls gave you in monoliths.

Bro, you are now thinking at senior backend level 👑
If you want next:

🔄 Code-level RabbitMQ integration for delete flow

🧠 When NOT to use RabbitMQ

⚖️ RabbitMQ vs Kafka decision

📊 System design practice question

Just tell me 👊
*/