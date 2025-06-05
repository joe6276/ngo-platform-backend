import { NextFunction, Request, Response } from "express";
import { User } from "../database/models/User";
import jwt from 'jsonwebtoken'
import { AuthenticatedRequest } from "../types/auth";
import dotenv from 'dotenv';
import { Permission, UserRole } from "../types/rbac.types";
import { hasPermission } from "../config/permissions";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'No token provided' });
        return
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };

        const user = await User.findByPk(decoded.userId);
        if (!user) {
            res.status(401).json({ message: 'Invalid user' });
            return
        }

        req.user = user;
        req.userRole = user.role;
        next();
    } catch (error: any) {
        console.error('Auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message
        });
    }
};

export const requirePermission = (permission: Permission) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.userRole) {
            res.status(401).json({ error: 'Authentication required' });
            return
        }

        if (!hasPermission(req.userRole, permission)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return
        }

        next();
    };
};

export const requireRole = (roles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.userRole) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Insufficient role privileges' });
        }

        next();
    };
};
export default isAuthenticated