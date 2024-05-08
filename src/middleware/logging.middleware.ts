import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export async function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
    const timestamp = new Date().toISOString();
    const { method, url } = req;
    const logEntry = `${timestamp} - Method: ${method}, URL: ${url}\n`;

    const logDirectory = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDirectory)) {
        try {
            fs.mkdirSync(logDirectory, { recursive: true });
        } catch (err) {
            console.error('Error creating log directory:', err);
        }
    }

    try {
        await fs.promises.appendFile(path.join(logDirectory, 'audit-log.txt'), logEntry, { encoding: "utf8" });
    } catch (err) {
        console.error('Error writing to log file:', err);
    }

    console.log(logEntry); 
    next();
}
