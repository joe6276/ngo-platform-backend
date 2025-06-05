export enum UserRole {
    ADMIN = 'admin',
    PROGRAM_MANAGER = 'program_manager',
    VOLUNTEER = 'volunteer',
    DONOR = 'donor'
}

export enum Permission {
    // Goals
    CREATE_GOAL = 'create_goal',
    READ_GOAL = 'read_goal',
    UPDATE_GOAL = 'update_goal',
    DELETE_GOAL = 'delete_goal',

    // Kpis
    CREATE_KPI = 'create_kpi',
    READ_KPI = 'read_kpi',
    UPDATE_KPI = 'update_kpi',
    DELETE_KPI = 'delete_kpi',

    // Events
    CREATE_EVENT = 'create_event',
    READ_EVENT = 'read_event',
    UPDATE_EVENT = 'update_event',
    DELETE_EVENT = 'delete_event',
    APPROVE_EVENT = 'approve_event',

    // Donations
    CREATE_DONATION = 'create_donation',
    READ_DONATION = 'read_donation',
    UPDATE_DONATION = 'update_donation',
    DELETE_DONATION = 'delete_donation',

    // Volunteers
    CREATE_VOLUNTEER = 'create_volunteer',
    READ_VOLUNTEER = 'read_volunteer',
    UPDATE_VOLUNTEER = 'update_volunteer',
    DELETE_VOLUNTEER = 'delete_volunteer',
    ASSIGN_VOLUNTEER = 'assign_volunteer',

    // Feedback & Testimonials
    CREATE_FEEDBACK = 'create_feedback',
    READ_FEEDBACK = 'read_feedback',
    UPDATE_FEEDBACK = 'update_feedback',
    DELETE_FEEDBACK = 'delete_feedback',
    APPROVE_TESTIMONIAL = 'approve_testimonial',

    // Reports
    CREATE_REPORT = 'create_report',
    READ_REPORT = 'read_report',
    READ_ALL_REPORTS = 'read_all_reports',

    // User Management
    CREATE_USER = 'create_user',
    READ_USER = 'read_user',
    UPDATE_USER = 'update_user',
    DELETE_USER = 'delete_user',

    // System
    READ_AUDIT_LOGS = 'read_audit_logs',
    MANAGE_SYSTEM = 'manage_system'
}

export interface RolePermissions {
    [UserRole.ADMIN]: Permission[];
    [UserRole.PROGRAM_MANAGER]: Permission[];
    [UserRole.VOLUNTEER]: Permission[];
    [UserRole.DONOR]: Permission[];
}
