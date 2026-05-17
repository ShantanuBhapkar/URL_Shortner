import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import rateLimit from 'express-rate-limit';
import { createShortUrl, getStats } from './controller.js';
import { redirectToOriginalUrl } from './controller.js';
import CustomError from './middleware/errormiddleware.js';
import { loggerMiddleware } from './middleware/loggermiddleware.js';

const app = express();
app.set('trust proxy', 1);  // tells to trust the first proxy in front of it, which is important for rate limiting to work correctly when behind a proxy.
const limiter = rateLimit({
    windowMs: 15*60*1000, 
    max:10,
    message: 'Too many requests from this IP, please try again later'
})
  
app.use(express.json());
app.use(loggerMiddleware);
app.use(limiter);
app.post('/shorten', createShortUrl);
app.get('/stats/:code', getStats);
app.get('/:code',redirectToOriginalUrl);

app.use((err : any, req : express.Request, res : express.Response,next: express.NextFunction) => {
    console.error(err);
    if(err instanceof CustomError){
      return  res.status(err.statusCode).json({ error: err.message });
    }
   return  res.status(500).send(
      'Something went wrong, please try later'
    );
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
