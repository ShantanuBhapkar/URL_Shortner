import winston from "winston";
import dotenv from 'dotenv';
dotenv.config();

const logLevel = process.env.NODE_ENV;
let transports : winston.transport[] =[new winston.transports.Console()];
  if(logLevel != 'production'){
        transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
        transports.push(new winston.transports.File({ filename: 'logs/combined.log' }));
    }  // in production we want to log only to console to avoid file system issues in cloud environments, and also because we might be using a logging service that collects logs from stdout.
       // in development we log to both console and files for easier debugging and persistence of logs.

const logger = winston.createLogger({
    level:'info',
    format: winston.format.combine(winston.format.timestamp(), 
        winston.format.json()),
    transports
});

export default logger;