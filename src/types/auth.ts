import { Request } from "express";
import { UserRole } from "./rbac.types";
import { User } from "../database/models/User";

export interface AuthenticatedRequest extends Request {
    user?: User;
    userRole?: UserRole;
}