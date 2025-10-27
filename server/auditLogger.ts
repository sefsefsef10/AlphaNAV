import { type Request } from "express";
import { db } from "./db";
import { auditLogs, type InsertAuditLog } from "@shared/schema";
import * as Sentry from "@sentry/node";

export interface AuditLogParams {
  userId: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: any;
  req?: Request;
}

/**
 * Create an audit log entry for security-critical operations
 * This provides a comprehensive audit trail for compliance and security monitoring
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const logEntry: InsertAuditLog = {
      userId: params.userId,
      userRole: params.userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes ? JSON.stringify(params.changes) : null,
      ipAddress: params.req?.ip || params.req?.socket.remoteAddress || null,
      userAgent: params.req?.headers['user-agent'] || null,
    };

    await db.insert(auditLogs).values(logEntry);
    
    // Log to console in development for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUDIT]', {
        user: `${params.userRole}:${params.userId}`,
        action: params.action,
        entity: `${params.entityType}:${params.entityId}`,
      });
    }
  } catch (error) {
    // Don't let audit logging failures break the application
    // But capture them in Sentry for investigation
    console.error('[AUDIT LOG ERROR]', error);
    Sentry.captureException(error, {
      tags: {
        component: 'audit-logging',
        entityType: params.entityType,
        action: params.action,
      },
    });
  }
}

/**
 * Audit log action constants for consistency
 */
export const AuditActions = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  TOKEN_REFRESH: 'token_refresh',
  
  // CRUD Operations
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  
  // Facility Operations
  APPROVE_FACILITY: 'approve_facility',
  REJECT_FACILITY: 'reject_facility',
  CLOSE_FACILITY: 'close_facility',
  
  // Draw Requests
  CREATE_DRAW_REQUEST: 'create_draw_request',
  APPROVE_DRAW_REQUEST: 'approve_draw_request',
  REJECT_DRAW_REQUEST: 'reject_draw_request',
  
  // Covenants
  CHECK_COVENANT: 'check_covenant',
  UPDATE_COVENANT_STATUS: 'update_covenant_status',
  
  // Documents
  UPLOAD_DOCUMENT: 'upload_document',
  DOWNLOAD_DOCUMENT: 'download_document',
  GENERATE_DOCUMENT: 'generate_document',
  DELETE_DOCUMENT: 'delete_document',
  
  // Advisor Operations
  SUBMIT_DEAL: 'submit_deal',
  SUBMIT_TERM_SHEET: 'submit_term_sheet',
  
  // Cash Flow
  CREATE_CASH_FLOW: 'create_cash_flow',
  RECORD_PAYMENT: 'record_payment',
  
  // Access Control
  ACCESS_DENIED: 'access_denied',
  PERMISSION_ERROR: 'permission_error',
} as const;

/**
 * Entity type constants for consistency
 */
export const EntityTypes = {
  USER: 'user',
  FACILITY: 'facility',
  PROSPECT: 'prospect',
  COVENANT: 'covenant',
  DRAW_REQUEST: 'draw_request',
  DOCUMENT: 'document',
  ADVISOR_DEAL: 'advisor_deal',
  TERM_SHEET: 'term_sheet',
  CASH_FLOW: 'cash_flow',
  NOTIFICATION: 'notification',
  MESSAGE: 'message',
  ONBOARDING_SESSION: 'onboarding_session',
} as const;
