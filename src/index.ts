import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as fs from 'fs';
import * as path from 'path';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import routes from './routes'; 

dotenv.config();

const app = express();

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
    const { method, url } = req;
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - Method: ${method}, URL: ${url}\n`;

    try {
        fs.appendFileSync(path.join(__dirname, 'audit-log.txt'), logEntry, { encoding: 'utf8' });
    } catch (err) {
        console.error('Failed to write audit log:', err);
    }

    console.log(logEntry);
    next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.split(' ')[1] || '';

    if (!token) {
        return res.status(401).json({ message: 'Token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        req.user = decoded as JwtPayload;
        next();
    });
});

app.use(routes);

app.use('/api/idp', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/idp': '' },
}));

app.use('/api/video', createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/video': '' },
}));

app.listen(3000, () => {
    console.log('Gateway Microservice listening on port 3000!');
});
