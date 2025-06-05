import { UserRole, Permission } from '../types/rbac.types';
import { hasPermission, getUserPermissions } from '../config/permissions';
import { User } from '../database/models/User';

export class RBACService {
    static async checkUserPermission(userId: string, permission: Permission): Promise<boolean> {
        const user = await User.findByPk(userId);
        if (!user || !user.isActive) {
            return false;
        }
        return hasPermission(user.role, permission);
    }

    static async getUserRole(userId: string): Promise<UserRole | null> {
        const user = await User.findByPk(userId);
        return user?.role || null;
    }

    static async getUserPermissions(userId: string): Promise<Permission[]> {
        const user = await User.findByPk(userId);
        if (!user || !user.isActive) {
            return [];
        }
        return getUserPermissions(user.role);
    }

    static async canAccessResource(
        userId: string,
        resourceType: string,
        resourceId?: string,
        action: string = 'read'
    ): Promise<boolean> {
        const user = await User.findByPk(userId);
        if (!user || !user.isActive) {
            return false;
        }

        // Construct permission string
        const permission = `${action}_${resourceType}` as Permission;

        if (!hasPermission(user.role, permission)) {
            return false;
        }

        // Additional checks for resource ownership
        if (user.role === UserRole.VOLUNTEER || user.role === UserRole.DONOR) {
            return await this.checkResourceOwnership(userId, resourceType, resourceId);
        }

        return true;
    }

    private static async checkResourceOwnership(
        userId: string,
        resourceType: string,
        resourceId?: string
    ): Promise<boolean> {
        if (!resourceId) return true;

        // Implement resource ownership checks based on your business logic
        // This is a simplified example
        switch (resourceType) {
            case 'user':
                return resourceId === userId;
            case 'feedback':
                // Check if user created this feedback
                // You'll need to implement this based on your models
                return true; // Placeholder
            case 'event':
                // Check if volunteer is assigned to this event
                // You'll need to implement this based on your models
                return true; // Placeholder
            default:
                return false;
        }
    }
}