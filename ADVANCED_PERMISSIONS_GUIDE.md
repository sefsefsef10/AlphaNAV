# Advanced Permission System - Implementation Guide

## Overview

AlphaNAV currently implements a basic role-based access control (RBAC) system with three roles: Operations, Advisor, and GP. This guide outlines how to extend the system to support advanced permission scenarios for enterprise deployments.

## Current System (RBAC)

### Current Roles

```typescript
type UserRole = 'operations' | 'advisor' | 'gp' | 'admin';
```

### Current Authorization Pattern

```typescript
// server/routes.ts
async function validateFacilityOwnership(
  facilityId: string,
  user: Express.User
): Promise<{ success: true } | { success: false; error: string }> {
  // Operations and admin can access everything
  if (user.role === 'operations' || user.role === 'admin') {
    return { success: true };
  }
  
  // GP users can only access their own facilities
  if (user.role === 'gp') {
    const facility = await db.query.facilities.findFirst({
      where: eq(facilities.id, facilityId)
    });
    
    if (facility?.ownerId !== user.id) {
      return { success: false, error: 'Access denied' };
    }
  }
  
  return { success: true };
}
```

### Current Limitations

- ❌ No granular permissions (e.g., "can_approve_draws" vs "can_view_draws")
- ❌ No permission inheritance or hierarchies
- ❌ No custom roles or role templates
- ❌ No team-based permissions
- ❌ No time-based or conditional access
- ❌ No audit trail for permission changes

---

## Advanced Permission Scenarios

### Scenario 1: Fine-Grained Permissions

**Use Case**: COO can approve draw requests but not create facilities

**Current**: Can't do this - operations role has all permissions  
**Advanced**: Separate "create_facility" and "approve_draw_request" permissions

### Scenario 2: Team-Based Access

**Use Case**: Multiple GP users from same fund should access the same facilities

**Current**: Only owner can access  
**Advanced**: Team membership with shared facility access

### Scenario 3: Limited-Time Access

**Use Case**: Auditor needs read-only access to all facilities for 30 days

**Current**: Would need to manually create/remove account  
**Advanced**: Time-bounded permissions with auto-expiry

### Scenario 4: Conditional Access

**Use Case**: Junior analyst can approve draws <$1M, senior analyst can approve any amount

**Current**: All-or-nothing approval rights  
**Advanced**: Conditional permissions based on attributes (amount, facility type, etc.)

---

## Implementation Approach

### Option 1: Permission-Based System (Recommended)

#### Database Schema Extension

Add to `shared/schema.ts`:

```typescript
// Permissions table
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  resource: varchar("resource", { length: 50 }).notNull(), // 'facility', 'draw_request', etc.
  action: varchar("action", { length: 50 }).notNull(), // 'create', 'read', 'update', 'delete', 'approve'
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_permissions_resource_action").on(table.resource, table.action),
]);

// Roles table (extends current role system)
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false), // true for 'operations', 'advisor', 'gp'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Role-Permission mapping
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_role_permissions_role").on(table.roleId),
  index("idx_role_permissions_permission").on(table.permissionId),
]);

// User-Role mapping (replaces single role field)
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  expiresAt: timestamp("expires_at"), // Optional: for time-bounded access
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_user_roles_user").on(table.userId),
  index("idx_user_roles_role").on(table.roleId),
]);
```

#### Permission Checking Middleware

Create `server/permissions.ts`:

```typescript
import { db } from "./db";
import { permissions, rolePermissions, userRoles } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const userPermissions = await db
    .select({ permission: permissions.name })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(permissions.resource, resource),
        eq(permissions.action, action)
      )
    );
  
  return userPermissions.length > 0;
}

export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !('id' in req.user)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const permitted = await hasPermission(
      String(req.user.id),
      resource,
      action
    );
    
    if (!permitted) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: `Missing permission: ${action} on ${resource}`
      });
    }
    
    next();
  };
}
```

#### Usage in Routes

```typescript
import { requirePermission } from "./permissions";

// Old approach: requireRole(['operations', 'admin'])
// New approach: requirePermission(resource, action)

router.post('/api/facilities',
  isAuthenticated,
  requirePermission('facility', 'create'),
  async (req, res) => {
    // Create facility
  }
);

router.post('/api/draw-requests/:id/approve',
  isAuthenticated,
  requirePermission('draw_request', 'approve'),
  async (req, res) => {
    // Approve draw request
  }
);
```

#### Seed Permissions

Create `server/seedPermissions.ts`:

```typescript
import { db } from "./db";
import { permissions, roles, rolePermissions } from "@shared/schema";

export async function seedPermissions() {
  // Create permissions
  const perms = await db.insert(permissions).values([
    // Facility permissions
    { name: 'create_facility', resource: 'facility', action: 'create', description: 'Can create new facilities' },
    { name: 'read_facility', resource: 'facility', action: 'read', description: 'Can view facilities' },
    { name: 'update_facility', resource: 'facility', action: 'update', description: 'Can edit facilities' },
    { name: 'delete_facility', resource: 'facility', action: 'delete', description: 'Can delete facilities' },
    
    // Draw request permissions
    { name: 'create_draw_request', resource: 'draw_request', action: 'create', description: 'Can create draw requests' },
    { name: 'approve_draw_request', resource: 'draw_request', action: 'approve', description: 'Can approve draw requests' },
    { name: 'reject_draw_request', resource: 'draw_request', action: 'reject', description: 'Can reject draw requests' },
    
    // Document permissions
    { name: 'upload_document', resource: 'document', action: 'upload', description: 'Can upload documents' },
    { name: 'download_document', resource: 'document', action: 'download', description: 'Can download documents' },
    { name: 'delete_document', resource: 'document', action: 'delete', description: 'Can delete documents' },
    
    // Covenant permissions
    { name: 'check_covenant', resource: 'covenant', action: 'check', description: 'Can check covenant status' },
    { name: 'update_covenant', resource: 'covenant', action: 'update', description: 'Can update covenant thresholds' },
    
    // Portfolio permissions
    { name: 'view_portfolio', resource: 'portfolio', action: 'read', description: 'Can view portfolio analytics' },
  ]).returning();
  
  // Create system roles
  const systemRoles = await db.insert(roles).values([
    { name: 'operations', description: 'Full operations team access', isSystem: true },
    { name: 'advisor', description: 'Advisor/placement agent access', isSystem: true },
    { name: 'gp', description: 'General partner access', isSystem: true },
    { name: 'admin', description: 'System administrator', isSystem: true },
  ]).returning();
  
  // Map all permissions to operations role
  const operationsRole = systemRoles.find(r => r.name === 'operations');
  if (operationsRole) {
    await db.insert(rolePermissions).values(
      perms.map(p => ({
        roleId: operationsRole.id,
        permissionId: p.id,
      }))
    );
  }
  
  // Map specific permissions to GP role
  const gpRole = systemRoles.find(r => r.name === 'gp');
  if (gpRole) {
    const gpPerms = perms.filter(p => [
      'read_facility',
      'create_draw_request',
      'upload_document',
      'download_document',
      'check_covenant'
    ].includes(p.name));
    
    await db.insert(rolePermissions).values(
      gpPerms.map(p => ({
        roleId: gpRole.id,
        permissionId: p.id,
      }))
    );
  }
}
```

---

### Option 2: Attribute-Based Access Control (ABAC)

#### For Complex Conditional Logic

Create `server/abac.ts`:

```typescript
type PolicyContext = {
  user: {
    id: string;
    role: string;
    department?: string;
    seniority?: string;
  };
  resource: {
    type: string;
    ownerId?: string;
    amount?: number;
    status?: string;
  };
  action: string;
  environment: {
    time: Date;
    ipAddress: string;
  };
};

type Policy = (context: PolicyContext) => boolean;

// Define policies
const policies: Record<string, Policy> = {
  // Junior analyst can only approve draws <$1M
  approve_draw_junior: (ctx) => {
    return (
      ctx.user.seniority === 'junior' &&
      ctx.action === 'approve' &&
      ctx.resource.type === 'draw_request' &&
      (ctx.resource.amount || 0) < 1000000
    );
  },
  
  // Senior analyst can approve any draw
  approve_draw_senior: (ctx) => {
    return (
      ctx.user.seniority === 'senior' &&
      ctx.action === 'approve' &&
      ctx.resource.type === 'draw_request'
    );
  },
  
  // Can only access during business hours
  business_hours_only: (ctx) => {
    const hour = ctx.environment.time.getHours();
    return hour >= 9 && hour < 17;
  },
};

export function checkPolicy(
  policyName: string,
  context: PolicyContext
): boolean {
  const policy = policies[policyName];
  if (!policy) {
    throw new Error(`Policy ${policyName} not found`);
  }
  return policy(context);
}
```

---

## Team-Based Access

### Database Schema

```typescript
// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Team members
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 50 }).notNull().default('member'), // 'owner', 'admin', 'member'
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => [
  index("idx_team_members_team").on(table.teamId),
  index("idx_team_members_user").on(table.userId),
]);

// Team facility access
export const teamFacilities = pgTable("team_facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  facilityId: varchar("facility_id").notNull().references(() => facilities.id, { onDelete: 'cascade' }),
  accessLevel: varchar("access_level", { length: 20 }).notNull().default('read'), // 'read', 'write', 'admin'
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
}, (table) => [
  index("idx_team_facilities_team").on(table.teamId),
  index("idx_team_facilities_facility").on(table.facilityId),
]);
```

### Team Access Validation

```typescript
export async function hasTeamAccess(
  userId: string,
  facilityId: string,
  requiredAccessLevel: 'read' | 'write' | 'admin' = 'read'
): Promise<boolean> {
  const teamAccess = await db
    .select()
    .from(teamMembers)
    .innerJoin(teamFacilities, eq(teamMembers.teamId, teamFacilities.teamId))
    .where(
      and(
        eq(teamMembers.userId, userId),
        eq(teamFacilities.facilityId, facilityId)
      )
    );
  
  if (teamAccess.length === 0) {
    return false;
  }
  
  // Check access level hierarchy: admin > write > read
  const accessLevels = ['read', 'write', 'admin'];
  const userLevel = accessLevels.indexOf(teamAccess[0].team_facilities.accessLevel);
  const requiredLevel = accessLevels.indexOf(requiredAccessLevel);
  
  return userLevel >= requiredLevel;
}
```

---

## Migration Strategy

### Phase 1: Backward Compatible (Recommended First Step)

1. Keep existing `user.role` field
2. Add new permission tables
3. Seed permissions based on current roles
4. Run both systems in parallel
5. Gradually migrate routes to new system

### Phase 2: Full Migration

1. Move all routes to permission-based checks
2. Remove old role-based checks
3. Deprecate `user.role` field (keep for display purposes)
4. Update frontend to use new permission API

### Phase 3: Advanced Features

1. Add team-based access
2. Implement time-bounded permissions
3. Add ABAC for conditional logic
4. Build permission management UI

---

## Frontend Integration

### Check Permissions in React

Create `client/src/hooks/usePermission.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';

export function usePermission(resource: string, action: string) {
  return useQuery({
    queryKey: ['/api/permissions/check', resource, action],
    queryFn: async () => {
      const res = await fetch(`/api/permissions/check?resource=${resource}&action=${action}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.permitted;
    },
  });
}

// Usage
function ApproveDrawButton({ drawRequestId }: { drawRequestId: string }) {
  const { data: canApprove } = usePermission('draw_request', 'approve');
  
  if (!canApprove) {
    return null; // Hide button if no permission
  }
  
  return (
    <Button onClick={() => approveDrawRequest(drawRequestId)}>
      Approve
    </Button>
  );
}
```

---

## Testing Permissions

### Unit Tests

```typescript
describe('Permissions', () => {
  it('should grant permission for operations role', async () => {
    const permitted = await hasPermission('user_ops', 'facility', 'create');
    expect(permitted).toBe(true);
  });
  
  it('should deny permission for GP role', async () => {
    const permitted = await hasPermission('user_gp', 'facility', 'create');
    expect(permitted).toBe(false);
  });
  
  it('should respect time-bounded permissions', async () => {
    // Create time-bounded permission (expires tomorrow)
    await grantPermission('user_auditor', 'facility', 'read', {
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    
    const permitted = await hasPermission('user_auditor', 'facility', 'read');
    expect(permitted).toBe(true);
  });
});
```

---

## Status & Recommendations

### Current State
✅ Basic RBAC with 4 roles  
✅ Multi-tenant isolation (GP ownership)  
✅ Role-based route protection

### Recommended Next Steps

**For MVP/Early Stage**:
1. Keep current RBAC system
2. Add audit logging for permission checks
3. Document permission requirements for each role

**For Growth Stage** (10-50 customers):
1. Implement Option 1 (Permission-Based System)
2. Add team-based access
3. Build permission management UI

**For Enterprise Stage** (50+ customers):
1. Add ABAC for complex conditional logic
2. Implement time-bounded permissions
3. Add permission inheritance/hierarchies
4. Build comprehensive audit trail for permission changes

### Estimated Implementation Time

- **Option 1 (Permissions)**: 2-3 days
- **Team-Based Access**: 1-2 days
- **Option 2 (ABAC)**: 3-4 days
- **Frontend Integration**: 1-2 days
- **Testing**: 1-2 days

**Total**: 1-2 weeks for full advanced permission system

---

## Support

For questions about permission system design:
- Review existing code: `server/routes.ts` (validateFacilityOwnership function)
- Reference industry standards: OAuth 2.0 scopes, AWS IAM policies
- Consult security best practices: OWASP Access Control guidelines

---

*Last Updated: October 27, 2025*  
*Status: Design document - not yet implemented*
