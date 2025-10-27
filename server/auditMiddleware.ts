import { type Request, type Response, type NextFunction } from "express";
import { createAuditLog, AuditActions, EntityTypes } from "./auditLogger";

/**
 * Middleware to automatically log successful requests
 * Usage: Add after route handler to log on success
 */
export function auditLog(action: string, entityType: string, getEntityId?: (req: Request, res: Response) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send to intercept response
    const originalSend = res.send;
    
    res.send = function(data: any): Response {
      // Only log on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Get user from session
        if (req.user && 'id' in req.user && 'role' in req.user) {
          const entityId = getEntityId ? getEntityId(req, res) : req.params.id || req.body?.id || 'unknown';
          
          // Extract relevant changes for audit trail
          let changes = undefined;
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            changes = {
              method: req.method,
              body: req.body,
              params: req.params,
            };
          }
          
          // Log asynchronously without blocking response
          createAuditLog({
            userId: String(req.user.id),
            userRole: String(req.user.role),
            action,
            entityType,
            entityId: String(entityId),
            changes,
            req,
          }).catch(err => {
            console.error('[AUDIT MIDDLEWARE ERROR]', err);
          });
        }
      }
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Middleware to log access denied events
 * Usage: Add in error handling when returning 403
 */
export function auditAccessDenied(entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.user && 'id' in req.user && 'role' in req.user) {
      const entityId = req.params.id || req.params.facilityId || req.params.dealId || 'unknown';
      
      await createAuditLog({
        userId: String(req.user.id),
        userRole: String(req.user.role),
        action: AuditActions.ACCESS_DENIED,
        entityType,
        entityId: String(entityId),
        changes: {
          url: req.url,
          method: req.method,
          reason: 'Insufficient permissions',
        },
        req,
      }).catch(err => {
        console.error('[AUDIT ACCESS DENIED ERROR]', err);
      });
    }
    
    next();
  };
}

/**
 * Middleware to log authentication events
 */
export async function auditAuthEvent(
  action: typeof AuditActions.LOGIN | typeof AuditActions.LOGOUT | typeof AuditActions.TOKEN_REFRESH,
  req: Request,
  userId: string,
  userRole: string
) {
  await createAuditLog({
    userId,
    userRole,
    action,
    entityType: EntityTypes.USER,
    entityId: userId,
    changes: {
      method: action,
      timestamp: new Date().toISOString(),
    },
    req,
  });
}

// Export for use in routes
export { AuditActions, EntityTypes };
