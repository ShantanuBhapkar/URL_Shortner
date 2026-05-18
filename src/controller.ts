import pool from "./config/postgres.js"; 
import dotenv from 'dotenv';
dotenv.config();
import type { NextFunction, Request, Response, } from 'express';
import CustomError from "./middleware/errormiddleware.js";
import { nanoid } from 'nanoid';
import logger from "./utils/logger.js";
import redisClient from "./config/redis.config.js";
import { Query } from "pg";
import { error } from "node:console";

interface ShortenrequestBody {
  url: string;
}

interface Shortcode_param{
    code: string;
}

export const createShortUrl = async (req : Request<{},{},ShortenrequestBody>, res : Response , next : NextFunction) : Promise<void> => {
 const { url } = req.body;
 if (!url) {
     res.status(400).json({ error: 'URL is required' });
     return;
  }
  const result = await pool.query('SELECT short_code FROM urls WHERE original_url = $1', [url]);
  if(result.rows.length > 0){
    res.json({ shortCode: result.rows[0].short_code, shortUrl: `${process.env.BASE_URL}/${result.rows[0].short_code}` });
    return;
  }
  let shortCode : string;
  let attempts : number = 0;
  while(attempts<3){
    try{
     shortCode = nanoid(6);
     await pool.query('INSERT INTO urls (original_url, short_code) VALUES ($1, $2)', [url, shortCode]);

     res.status(201).json({ shortCode, shortUrl: `${process.env.BASE_URL}${shortCode}` });  
     return;
  }catch(err : any){
     if(err.code === '23505'){
        attempts++;
        continue;
     }
     logger.error(err);
     return next(new CustomError('Database error', 500));
  }
  }
   
  res.status(500).json({ error: 'Could not generate a unique short code, please try again' });
  return;

}

export const redirectToOriginalUrl = async (req : Request<Shortcode_param,{},{}>, res : Response , next : NextFunction) : Promise<void> => {
  try{
    const code :string = req.params.code;
    const cachedUrl = await redisClient.get(`url:${code}`);
    if (cachedUrl) {
      res.redirect(cachedUrl);
      await pool.query('UPDATE urls SET click_count = click_count + 1 WHERE short_code =$1', [code]);
      return;
    }
    const result = await pool.query('UPDATE urls SET click_count = click_count + 1 WHERE short_code =$1 RETURNING original_url',[code]);
    if(result.rows.length === 0){
        res.status(404).json({error:'Not found'});
        return;
    }
    const url = result.rows[0].original_url;
    res.redirect(url);
    await redisClient.setEx(`url:${code}`, 3600, url);
    return;
  }catch(err){
    logger.error(err);
    return next(new CustomError('Database error', 500));
  }
}

export const getStats = async (req : Request<Shortcode_param, {}, {}>, res : Response , next : NextFunction) : Promise<void> => {
    try{
        const code : string = req.params.code;
        const result = await pool.query('SELECT original_url, click_count, short_code FROM urls WHERE short_code = $1', [code]);
      if(result.rows.length === 0){
          res.status(404).json({error:'Not found'});
          return;
      }
        const { original_url, click_count, short_code } = result.rows[0];
        res.json({ original_url, click_count, short_code });  
    }catch(err){
        logger.error(err);
        return next(new CustomError('Database error', 500));
    }
}
