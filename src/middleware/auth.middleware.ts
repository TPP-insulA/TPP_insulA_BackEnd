import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';
import { ApiError } from './error.middleware';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        name: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

interface JwtPayload {
  id: string;
}

/**
 * Middleware to protect routes that require authentication
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'default_secret'
      ) as JwtPayload;

      // Get user from token
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Set user in request object
      req.user = user;

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      const err = new Error('Not authorized, token failed') as ApiError;
      err.statusCode = 401;
      next(err);
    }
  } else {
    const err = new Error('Not authorized, no token') as ApiError;
    err.statusCode = 401;
    next(err);
  }
};