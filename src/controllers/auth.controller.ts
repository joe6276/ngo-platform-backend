import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../database/models/User';
import { AuthenticatedRequest } from '../types/auth';
import dotenv from 'dotenv'
import { UserRole } from '../types/rbac.types';
import { RBACService } from '../services/rbac.service';
import { Organization } from '../database/models/Organization';
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const REFRESH_EXPIRES_IN = '7d';

const generateAccessToken = (user: User) => {
    return jwt.sign({
        userId: user.id,
        role: user.role,
        email: user.email
    }, JWT_SECRET!, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

const generateRefreshToken = (user: User) => {
    return jwt.sign({ id: user.id }, REFRESH_SECRET!, {
        expiresIn: REFRESH_EXPIRES_IN,
    });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            res.status(400).json({
                success: false,
                message: 'Login failed',
                error: 'Account  already exists',
            });
            return
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const organization = await Organization.create({ name: firstName });

        const user = await User.create({ firstName, lastName, email, password: hashedPassword, role: UserRole.ADMIN, organizationId: organization.id });

        const token = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.status(201).json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }, token, refreshToken });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Register failed',
            error: error.errors?.map((e: any) => e.message) || error.message,
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({
                success: false,
                message: 'Login failed',
                error: 'Invalid credentials ',
            });
            return
        }
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Login failed',
                error: 'Your account was deactivated, please contact you adminstrator!',
            });
            return
        }
        await user.update({ lastLoginAt: new Date() });

        const permissions = await RBACService.getUserPermissions(user.id);


        const token = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.status(200).json({
            success: true,
            message: 'Login success',
            data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, token, refreshToken, permissions },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.errors?.map((e: any) => e.message) || error.message,
        });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({ message: 'Refresh token required' });
            return
        }
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET!) as { id: string };
        const user = await User.findByPk(decoded.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return
        }

        const newToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.status(200).json({ token: newToken, refreshToken: newRefreshToken });
    } catch (error: any) {
        res.status(403).json({
            success: false,
            message: 'Token Refresh Failed',
            error: error.errors?.map((e: any) => e.message) || error.message,
        });
    }
};

export const logout = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Logged out' });
};


export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return
        }

        if (!oldPassword || !newPassword) {
            res.status(400).json({ error: 'Old and new passwords are required' });
            return
        }

        if (newPassword.length < 8) {
            res.status(400).json({ error: 'New password must be at least 8 characters' });
            return
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return
        }

        const isValidPassword = await bcrypt.compare(oldPassword, user.password);
        if (!isValidPassword) {
            res.status(400).json({ error: 'Invalid current password' });
            return
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 12);
        await user.update({ passwordHash: newPasswordHash });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return
        }

        const permissions = await RBACService.getUserPermissions(req.user.id);
        const { password, ...userProfile } = req.user.toJSON();

        res.json({
            user: userProfile,
            permissions
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};