import { UserRole, Permission, RolePermissions } from '../types/rbac.types';

export const ROLE_PERMISSIONS: RolePermissions = {
    [UserRole.ADMIN]: [
        ...Object.values(Permission)
    ],

    [UserRole.PROGRAM_MANAGER]: [
        // Goals
        Permission.READ_GOAL,

        // Kpis
        Permission.CREATE_KPI,
        Permission.READ_KPI,
        Permission.UPDATE_KPI,

        // Events
        Permission.CREATE_EVENT,
        Permission.READ_EVENT,
        Permission.UPDATE_EVENT,
        Permission.APPROVE_EVENT,

        // Donations
        Permission.READ_DONATION,

        // Volunteers
        Permission.READ_VOLUNTEER,
        Permission.UPDATE_VOLUNTEER,
        Permission.ASSIGN_VOLUNTEER,

        // Feedback & Testimonials
        Permission.CREATE_FEEDBACK,
        Permission.READ_FEEDBACK,
        Permission.UPDATE_FEEDBACK,
        Permission.APPROVE_TESTIMONIAL,

        // Reports
        Permission.CREATE_REPORT,
        Permission.READ_REPORT,
        Permission.READ_ALL_REPORTS
    ],

    [UserRole.VOLUNTEER]: [
        // Limited event access
        Permission.READ_EVENT,
        Permission.UPDATE_EVENT, // Only their assigned events

        // Feedback submission
        Permission.CREATE_FEEDBACK,
        Permission.READ_FEEDBACK, // Only their own

        // Basic profile access
        Permission.READ_USER, // Only their own profile
        Permission.UPDATE_USER // Only their own profile
    ],

    [UserRole.DONOR]: [
        // Read-only access to impact reports
        Permission.READ_REPORT,
        Permission.READ_GOAL,
        Permission.READ_KPI,
        Permission.READ_EVENT,
        Permission.READ_DONATION, 
        Permission.CREATE_DONATION, 
        Permission.READ_USER 
    ]
};

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
    return ROLE_PERMISSIONS[userRole].includes(permission);
};

export const getUserPermissions = (userRole: UserRole): Permission[] => {
    return ROLE_PERMISSIONS[userRole];
};