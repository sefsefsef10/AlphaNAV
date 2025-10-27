# Audit Logging System - Implementation Guide

## Overview

AlphaNAV includes a comprehensive audit logging system that tracks all security-critical operations for compliance, security monitoring, and troubleshooting. Every important action is logged with user context, timestamp, and change history.

## Architecture

### Database Schema

The `audit_logs` table (`shared/schema.ts`) stores:
- **userId**: Who performed the action
- **userRole**: User's role at time of action
- **action**: What was done (e.g., 'create', 'approve_draw_request')
- **entityType**: Type of entity affected (e.g., 'facility', 'draw_request')
- **entityId**: ID of the affected entity
- **changes**: JSON object with before/after state (optional)
- **ipAddress**: User's IP address
- **userAgent**: User's browser/client info
- **createdAt**: Timestamp of the action

### Indexes
- `idx_audit_logs_user_id_created_at` - Fast queries by user and time range
- `idx_audit_logs_entity_type_id` - Fast queries by entity type and ID

## Usage

### 1. Manual Logging

Use `createAuditLog()` for custom audit logging:

```typescript
import { createAuditLog, AuditActions, EntityTypes } from "./auditLogger";

// Example: Log a facility approval
await createAuditLog({
  userId: req.user.id,
  userRole: req.user.role,
  action: AuditActions.APPROVE_FACILITY,
  entityType: EntityTypes.FACILITY,
  entityId: facilityId,
  changes: {
    before: { status: 'pending' },
    after: { status: 'active' },
  },
  req, // Express request object (for IP and user agent)
});
```

### 2. Middleware-Based Logging

Use `auditLog()` middleware to automatically log successful requests:

```typescript
import { auditLog, AuditActions, EntityTypes } from "./auditMiddleware";

// Example: Automatically log draw request creation
router.post('/api/facilities/:facilityId/draw-requests',
  isAuthenticated,
  auditLog(AuditActions.CREATE_DRAW_REQUEST, EntityTypes.DRAW_REQUEST, (req) => req.body.id),
  async (req, res) => {
    // Your route handler
  }
);
```

### 3. Access Denied Logging

Log unauthorized access attempts:

```typescript
import { auditAccessDenied } from "./auditMiddleware";

// Example: Log when GP tries to access another GP's facility
if (!canAccess) {
  await auditAccessDenied(EntityTypes.FACILITY)(req, res, () => {});
  return res.status(403).json({ error: "Access denied" });
}
```

### 4. Authentication Event Logging

Log login, logout, and token refresh events:

```typescript
import { auditAuthEvent, AuditActions } from "./auditMiddleware";

// Example: Log successful login
await auditAuthEvent(
  AuditActions.LOGIN,
  req,
  user.id,
  user.role
);
```

## Standard Actions

Use these constants for consistency:

```typescript
AuditActions.LOGIN
AuditActions.LOGOUT
AuditActions.TOKEN_REFRESH

AuditActions.CREATE
AuditActions.UPDATE
AuditActions.DELETE
AuditActions.VIEW

AuditActions.APPROVE_FACILITY
AuditActions.REJECT_FACILITY
AuditActions.CLOSE_FACILITY

AuditActions.CREATE_DRAW_REQUEST
AuditActions.APPROVE_DRAW_REQUEST
AuditActions.REJECT_DRAW_REQUEST

AuditActions.CHECK_COVENANT
AuditActions.UPDATE_COVENANT_STATUS

AuditActions.UPLOAD_DOCUMENT
AuditActions.DOWNLOAD_DOCUMENT
AuditActions.GENERATE_DOCUMENT
AuditActions.DELETE_DOCUMENT

AuditActions.SUBMIT_DEAL
AuditActions.SUBMIT_TERM_SHEET

AuditActions.CREATE_CASH_FLOW
AuditActions.RECORD_PAYMENT

AuditActions.ACCESS_DENIED
AuditActions.PERMISSION_ERROR
```

## Standard Entity Types

```typescript
EntityTypes.USER
EntityTypes.FACILITY
EntityTypes.PROSPECT
EntityTypes.COVENANT
EntityTypes.DRAW_REQUEST
EntityTypes.DOCUMENT
EntityTypes.ADVISOR_DEAL
EntityTypes.TERM_SHEET
EntityTypes.CASH_FLOW
EntityTypes.NOTIFICATION
EntityTypes.MESSAGE
EntityTypes.ONBOARDING_SESSION
```

## Querying Audit Logs

### Get all actions by a user
```sql
SELECT * FROM audit_logs
WHERE user_id = 'user123'
ORDER BY created_at DESC
LIMIT 100;
```

### Get all actions on a specific facility
```sql
SELECT * FROM audit_logs
WHERE entity_type = 'facility'
AND entity_id = 'facility-1'
ORDER BY created_at DESC;
```

### Get all access denied events
```sql
SELECT * FROM audit_logs
WHERE action = 'access_denied'
ORDER BY created_at DESC;
```

### Get all actions in date range
```sql
SELECT * FROM audit_logs
WHERE created_at BETWEEN '2025-10-01' AND '2025-10-31'
ORDER BY created_at DESC;
```

## Best Practices

### 1. **Always Log Security-Critical Operations**
- Authentication events (login, logout, token refresh)
- Authorization failures (access denied)
- Data modifications (create, update, delete)
- Financial operations (draw requests, cash flows, payments)
- Document operations (upload, download, generate, delete)

### 2. **Include Meaningful Change Data**
For updates, include before/after state:
```typescript
changes: {
  before: { status: 'pending', amount: 1000000 },
  after: { status: 'approved', amount: 1500000 },
}
```

### 3. **Don't Log Sensitive Data**
Never log:
- Passwords
- API keys
- Session tokens
- Credit card numbers
- SSNs or other PII

### 4. **Handle Errors Gracefully**
Audit logging failures should NEVER break the application:
```typescript
try {
  await createAuditLog({ ... });
} catch (error) {
  // Log error but don't throw
  console.error('[AUDIT LOG ERROR]', error);
}
```

### 5. **Use Async Logging**
Don't block responses waiting for audit logs:
```typescript
// Good: Fire and forget
createAuditLog({ ... }).catch(err => console.error(err));

// Bad: Blocks response
await createAuditLog({ ... });
```

## Compliance & Security

### SOC 2 Requirements
Audit logs help satisfy SOC 2 requirements:
- **CC6.1**: Logical access controls
- **CC6.2**: Prior to issuing system credentials and privileges
- **CC6.3**: Removes access when appropriate
- **CC7.2**: Monitoring of system components
- **CC7.3**: Timely detection of system-related events

### Data Retention
- **Production**: Retain audit logs for minimum 1 year (7 years for financial compliance)
- **Development/Staging**: Retain for 30 days

### Privacy Considerations
- IP addresses and user agents are PII
- Comply with GDPR/CCPA for data subject requests
- Provide audit log export for data portability

## Performance Considerations

### Indexes
Current indexes support fast queries:
- By user and time: `idx_audit_logs_user_id_created_at`
- By entity: `idx_audit_logs_entity_type_id`

### Scaling
For high-volume systems:
1. Partition table by date (monthly/quarterly)
2. Archive old logs to separate storage
3. Consider async queue (Redis/SQS) for writes
4. Use read replicas for audit log queries

### Monitoring
Set up alerts for:
- Unusual spike in access denied events (potential attack)
- Multiple failed login attempts (credential stuffing)
- Large number of deletions (potential data loss)
- Admin actions outside business hours (suspicious activity)

## Integration Checklist

✅ **Critical Operations to Log:**
- [x] User login/logout
- [ ] Facility create/update/delete
- [ ] Draw request submit/approve/reject
- [ ] Cash flow create/record payment
- [ ] Document upload/download/delete
- [ ] Covenant compliance check
- [ ] User permission changes
- [ ] Bulk data exports
- [ ] Admin actions

## Example Implementations

### Complete Example: Draw Request Approval

```typescript
router.patch('/api/draw-requests/:id/approve',
  isAuthenticated,
  requireRole(['operations', 'admin']),
  async (req, res) => {
    const { id } = req.params;
    
    // Get current state for audit trail
    const [currentRequest] = await db
      .select()
      .from(drawRequests)
      .where(eq(drawRequests.id, id));
    
    if (!currentRequest) {
      return res.status(404).json({ error: "Draw request not found" });
    }
    
    // Update status
    const [updated] = await db
      .update(drawRequests)
      .set({ 
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date(),
      })
      .where(eq(drawRequests.id, id))
      .returning();
    
    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: AuditActions.APPROVE_DRAW_REQUEST,
      entityType: EntityTypes.DRAW_REQUEST,
      entityId: id,
      changes: {
        before: { status: currentRequest.status },
        after: { status: 'approved', approvedBy: req.user.id },
        amount: currentRequest.amount,
        facilityId: currentRequest.facilityId,
      },
      req,
    });
    
    res.json(updated);
  }
);
```

## Status

✅ **Implementation Complete**:
- Database schema created
- Core logging functions implemented
- Middleware helpers created
- Documentation complete

⚠️ **Integration Pending**:
- Add to authentication routes
- Add to facility management routes
- Add to draw request routes
- Add to document operations
- Add to advisor operations

## Next Steps

1. Add audit logging to all authentication routes
2. Add audit logging to facility CRUD operations
3. Add audit logging to draw request workflows
4. Add audit logging to document operations
5. Create audit log viewer page in frontend
6. Set up monitoring alerts for suspicious patterns

## Support

For questions or issues with audit logging:
- Check logs: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;`
- Review implementation: `server/auditLogger.ts` and `server/auditMiddleware.ts`
- Test in development: Set `NODE_ENV=development` to see console logs
