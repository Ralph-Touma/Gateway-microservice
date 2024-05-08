import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Authentication required." });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token." });
        }
        req.user = decoded as JwtPayload;
        next();
    });
});

router.all('/:service/:path*', async (req: Request, res: Response) => {
    const { service, path } = req.params;
    const targetUrl = `http://${service}:3000/${path}`;

    try {
        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: { ...req.headers, authorization: req.headers.authorization || '' }
        });
        res.json(response.data);
    } catch (error) {
        console.error(`Error forwarding request to ${targetUrl}:`, error.message);
        res.status(500).json({ message: `Unable to connect to the ${service} service.` });
    }
});

export default router;
