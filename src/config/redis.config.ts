import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL;
if(!redisUrl){
    console.error('REDIS_URL is not defined in environment variables');
    throw new Error('REDIS_URL is required');
}
const redisClient = createClient({ url:redisUrl });

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
}
);

redisClient.connect().then(() => {
  console.log('Connected to Redis');
}).catch((err) => {
  console.error('Could not connect to Redis', err);
});
export default redisClient;

