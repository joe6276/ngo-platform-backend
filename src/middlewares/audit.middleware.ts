import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../database/models/AuditLog';
import { AuthenticatedRequest } from '../types/auth';

export const auditLogger = (resource: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const originalSend = res.send;
        const startTime = Date.now();

        // Store original body for comparison
        const originalBody = { ...req.body };

        res.send = function (body: any) {
            const duration = Date.now() - startTime;

            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                // Determine action based on HTTP method
                let action = '';
                switch (req.method.toUpperCase()) {
                    case 'POST': action = 'CREATE'; break;
                    case 'PUT':
                    case 'PATCH': action = 'UPDATE'; break;
                    case 'DELETE': action = 'DELETE'; break;
                    case 'GET': action = 'READ'; break;
                    default: action = req.method;
                }

                // Log the action
                AuditLog.create({
                    userId: req.user.id,
                    action: `${action}_${resource.toUpperCase()}`,
                    resource,
                    resourceId: req.params.id || null,
                    oldValues: req.method === 'PUT' || req.method === 'PATCH' ? originalBody : null,
                    newValues: req.method !== 'GET' ? req.body : null,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent') || ''
                }).catch(error => {
                    console.error('Audit logging error:', error);
                });
            }

            return originalSend.call(this, body);
        };

        next();
    };
};
