import logger from "../utils/logger.js";
import type { NextFunction, Request, Response } from "express";

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    logger.info({
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
    next();
}