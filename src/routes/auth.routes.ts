import { Router } from "express";
import { changePassword, getProfile, login, logout, refreshToken, register } from "../controllers/auth.controller";
import isAuthenticated from "../middlewares/auth.middleware";

const authRouter = Router()

authRouter.post('/login',
    login)

authRouter.post('/register',
    register)

authRouter.post('/logout',
    logout)

authRouter.post('/refresh-token',
    refreshToken)

authRouter.get('/profile',
    isAuthenticated,
    getProfile)

authRouter.post('/change-password',
    changePassword)

export default authRouter;