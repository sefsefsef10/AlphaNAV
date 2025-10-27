# Database Encryption at Rest - Configuration Guide

## Overview

This guide covers implementing encryption at rest for AlphaNAV's PostgreSQL database hosted on Neon. Encryption at rest protects data stored on disk from unauthorized access, meeting compliance requirements for SOC 2, GDPR, and financial services regulations.

## Current Status

✅ **Encryption in Transit**: Already enabled  
- All database connections use TLS/SSL
- Enforced via `sslmode=require` in connection string
- Protects data during transmission

⚠️ **Encryption at Rest**: Requires configuration  
- Data on disk not encrypted by default
- Needs Neon platform configuration or upgrade

---

## Option 1: Neon Built-in Encryption (Recommended)

### Overview
Neon provides transparent data encryption (TDE) on paid plans, encrypting all data at rest using AES-256.

### Requirements
- **Neon Plan**: Scale or Business plan
- **Cost**: Starting at $19/month (Scale plan)
- **Setup Time**: 5 minutes
- **Downtime**: None (seamless migration)

### Implementation Steps

#### Step 1: Upgrade Neon Plan

1. Log in to [Neon Console](https://console.neon.tech)
2. Navigate to **Settings** → **Billing**
3. Upgrade to **Scale** or **Business** plan
4. Confirm payment details

#### Step 2: Enable Encryption at Rest

1. Go to **Settings** → **Security**
2. Enable **"Encryption at Rest"**
3. Select encryption key management:
   - **Neon-managed keys**: Easier, recommended for most cases
   - **Customer-managed keys (BYOK)**: More control, available on Business plan

4. Click **"Enable Encryption"**

#### Step 3: Verify Encryption

```sql
-- Check encryption status
SELECT * FROM pg_settings WHERE name LIKE '%encrypt%';

-- Verify TLS connection
SELECT * FROM pg_settings WHERE name = 'ssl';
```

#### Step 4: Update Application (No Changes Required)

Your application connection string remains the same. Encryption is transparent:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/alphanav?sslmode=require
```

### Benefits
✅ No application code changes  
✅ Automatic key rotation  
✅ FIPS 140-2 compliant  
✅ Zero performance overhead  
✅ SOC 2 compliant  

### Costs
- **Scale Plan**: $19/month + usage
- **Business Plan**: Contact Neon sales

---

## Option 2: Application-Level Encryption

### Overview
Encrypt sensitive fields at the application level using Node.js crypto module.

### Requirements
- **Cost**: Free
- **Setup Time**: 2-4 hours
- **Maintenance**: Manual key rotation
- **Performance**: ~10-20% overhead

### Implementation Steps

#### Step 1: Generate Encryption Key

```bash
# Generate a 256-bit encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to Replit Secrets:
```env
ENCRYPTION_KEY=your_generated_key_here
```

#### Step 2: Create Encryption Utility

Create `server/encryption.ts`:

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'base64');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const tag = cipher.getAuthTag();
  
  // Format: iv:tag:encrypted
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivBase64, tagBase64, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivBase64, 'base64');
  const tag = Buffer.from(tagBase64, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

#### Step 3: Encrypt Sensitive Fields

```typescript
import { encrypt, decrypt } from './encryption';

// Before storing in database
const encryptedSSN = encrypt(user.ssn);
await db.insert(users).values({
  ...user,
  ssn: encryptedSSN
});

// After retrieving from database
const [user] = await db.select().from(users).where(eq(users.id, userId));
const decryptedSSN = decrypt(user.ssn);
```

#### Step 4: Update Schema (Optional)

Mark encrypted fields in schema for documentation:

```typescript
// shared/schema.ts
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: text("email").notNull(),
  // Encrypted field - stores encrypted value
  ssn: text("ssn"), // Encrypted at rest
});
```

### Fields to Encrypt
Consider encrypting:
- Social Security Numbers (SSN)
- Tax IDs (EIN)
- Bank account numbers
- Credit card details (if stored - generally avoid)
- Personal health information
- Proprietary financial data

### Benefits
✅ Full control over encryption  
✅ No additional cost  
✅ Works with any database

### Drawbacks
❌ Cannot query encrypted fields directly  
❌ Manual key rotation required  
❌ Performance overhead  
❌ More complex to implement  
❌ Risk of implementation errors

---

## Option 3: PostgreSQL pgcrypto Extension

### Overview
Use PostgreSQL's built-in encryption extension for column-level encryption.

### Implementation Steps

#### Step 1: Enable Extension

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

#### Step 2: Encrypt Data

```sql
-- Insert encrypted data
INSERT INTO users (id, email, ssn)
VALUES (
  'user_123',
  'john@example.com',
  pgp_sym_encrypt('123-45-6789', 'encryption_key')
);

-- Query encrypted data
SELECT
  id,
  email,
  pgp_sym_decrypt(ssn::bytea, 'encryption_key') AS ssn
FROM users
WHERE id = 'user_123';
```

#### Step 3: Create Helper Functions

```sql
-- Create encryption helper function
CREATE OR REPLACE FUNCTION encrypt_text(text_to_encrypt TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_encrypt(text_to_encrypt, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;

-- Create decryption helper function
CREATE OR REPLACE FUNCTION decrypt_text(encrypted_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_text::bytea, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;
```

### Benefits
✅ Native PostgreSQL support  
✅ Good performance  
✅ Flexible encryption options

### Drawbacks
❌ Requires SQL changes  
❌ Complex queries  
❌ ORM compatibility issues  

---

## Comparison Matrix

| Feature | Neon Built-in | Application-Level | pgcrypto Extension |
|---------|---------------|-------------------|-------------------|
| **Setup Complexity** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐ Moderate | ⭐⭐⭐ Moderate |
| **Cost** | $19+/month | Free | Free |
| **Performance** | ⭐⭐⭐⭐⭐ Native | ⭐⭐⭐ Overhead | ⭐⭐⭐⭐ Good |
| **Query Support** | ⭐⭐⭐⭐⭐ Full | ⭐ Limited | ⭐⭐ Limited |
| **Key Management** | ⭐⭐⭐⭐⭐ Automatic | ⭐⭐ Manual | ⭐⭐⭐ Manual |
| **Compliance** | ⭐⭐⭐⭐⭐ SOC 2 Ready | ⭐⭐⭐ Custom | ⭐⭐⭐ Custom |
| **Maintenance** | ⭐⭐⭐⭐⭐ Zero | ⭐⭐ High | ⭐⭐⭐ Medium |

**Recommendation**: **Neon Built-in Encryption** for production deployments

---

## Security Best Practices

### 1. Key Management

**DO**:
✅ Store encryption keys in secure secret management (Replit Secrets, AWS Secrets Manager)  
✅ Use different keys for development and production  
✅ Rotate keys regularly (annually minimum)  
✅ Use 256-bit keys (AES-256)

**DON'T**:
❌ Store keys in code or version control  
❌ Reuse keys across environments  
❌ Share keys via insecure channels  
❌ Use weak keys (<256 bits)

### 2. Key Rotation

For application-level encryption, implement key rotation:

```typescript
// Support multiple encryption keys
const CURRENT_KEY_ID = 'v2';
const KEYS = {
  v1: Buffer.from(process.env.ENCRYPTION_KEY_V1!, 'base64'),
  v2: Buffer.from(process.env.ENCRYPTION_KEY_V2!, 'base64'),
};

export function encrypt(text: string): string {
  const key = KEYS[CURRENT_KEY_ID];
  // ... encryption logic ...
  // Prepend key ID: keyId:iv:tag:encrypted
  return `${CURRENT_KEY_ID}:${iv}:${tag}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [keyId, iv, tag, encrypted] = encryptedData.split(':');
  const key = KEYS[keyId as keyof typeof KEYS];
  // ... decryption logic ...
}
```

### 3. Compliance Requirements

#### SOC 2
- ✅ Encryption at rest for all sensitive data
- ✅ Documented key management procedures
- ✅ Access controls for encryption keys
- ✅ Regular key rotation schedule

#### GDPR
- ✅ Encryption of personal data
- ✅ Pseudonymization where possible
- ✅ Data subject right to erasure (crypto-shredding)

#### PCI DSS (if storing payment data)
- ✅ AES-256 encryption minimum
- ✅ Secure key management
- ✅ Key rotation every 12 months
- ⚠️ **Recommendation**: Use Stripe/payment processor instead

### 4. Audit Trail

Log all encryption key operations:
- Key generation
- Key rotation
- Key access
- Decryption events (in audit logs)

---

## Testing Encryption

### Test Encryption Implementation

```typescript
// test/encryption.test.ts
import { encrypt, decrypt } from '../server/encryption';

describe('Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = 'sensitive data';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    
    expect(encrypted).not.toBe(original);
    expect(decrypted).toBe(original);
  });
  
  it('should produce different ciphertext for same input', () => {
    const text = 'test data';
    const encrypted1 = encrypt(text);
    const encrypted2 = encrypt(text);
    
    expect(encrypted1).not.toBe(encrypted2); // Different IVs
  });
});
```

### Verify Neon Encryption

```sql
-- Check if data is encrypted on disk
-- This requires database admin access
SELECT
  pg_size_pretty(pg_database_size('alphanav')) AS size,
  datname,
  encoding
FROM pg_database
WHERE datname = 'alphanav';
```

---

## Implementation Checklist

### For Neon Built-in Encryption (Recommended)

- [ ] Upgrade to Neon Scale or Business plan
- [ ] Enable encryption at rest in Neon console
- [ ] Verify encryption status
- [ ] Document encryption configuration
- [ ] Add to compliance documentation
- [ ] Schedule annual encryption review

### For Application-Level Encryption

- [ ] Generate 256-bit encryption key
- [ ] Add key to Replit Secrets
- [ ] Implement encryption utility (`server/encryption.ts`)
- [ ] Identify sensitive fields to encrypt
- [ ] Update application code to encrypt/decrypt
- [ ] Test encryption/decryption thoroughly
- [ ] Document encrypted fields
- [ ] Implement key rotation strategy
- [ ] Add encryption to audit logs
- [ ] Create key rotation procedure

### For All Approaches

- [ ] Document encryption method in production docs
- [ ] Train team on encryption procedures
- [ ] Add encryption status to health check
- [ ] Include in disaster recovery plan
- [ ] Review annually for compliance

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Encryption Operations**
   - Encryption failures
   - Decryption errors
   - Performance impact

2. **Key Access**
   - Unauthorized key access attempts
   - Key rotation events
   - Key storage integrity

3. **Compliance**
   - Encryption coverage (% of sensitive data encrypted)
   - Key age (trigger rotation alerts)
   - Audit log completeness

### Alert Thresholds

```yaml
# Example alert configuration
alerts:
  - name: "Encryption Failure Rate High"
    condition: "encryption_errors > 10 per hour"
    severity: "critical"
  
  - name: "Encryption Key Rotation Overdue"
    condition: "key_age > 365 days"
    severity: "high"
  
  - name: "Decryption Performance Degraded"
    condition: "decryption_time_p95 > 100ms"
    severity: "warning"
```

---

## Disaster Recovery

### Backup Encryption Keys

1. **Store in multiple secure locations**:
   - Primary: Replit Secrets
   - Backup: AWS Secrets Manager or HashiCorp Vault
   - Offline: Encrypted USB drive in safe

2. **Document key recovery procedure**:
   ```markdown
   1. Access backup secret store
   2. Retrieve encryption key
   3. Update production environment variables
   4. Restart application
   5. Verify decryption works
   ```

### Data Recovery

If encryption keys are lost:
- **Neon Built-in**: Contact Neon support (they have backups)
- **Application-Level**: Data is **permanently lost** if keys lost
- **Prevention**: Always maintain secure key backups

---

## Cost Analysis

### Neon Built-in Encryption

**Scale Plan**: $19/month base + usage
- ✅ Includes: Encryption at rest, automated key management
- ✅ No development time required
- ✅ No ongoing maintenance

**Total Cost**: ~$20-50/month depending on usage

### Application-Level Encryption

**Development**: 8-16 hours @ $150/hour = $1,200-$2,400 one-time
**Maintenance**: 2 hours/year @ $150/hour = $300/year
**Performance**: ~10-20% increased server costs

**Total Cost**: $1,500-$3,000 first year, $300+/year ongoing

**Recommendation**: Neon built-in encryption is more cost-effective for most deployments.

---

## Support & Resources

- **Neon Documentation**: https://neon.tech/docs/security/encryption
- **PostgreSQL pgcrypto**: https://www.postgresql.org/docs/current/pgcrypto.html
- **Node.js Crypto**: https://nodejs.org/api/crypto.html
- **NIST Encryption Standards**: https://csrc.nist.gov/publications/fips

---

## Status

✅ **Current State**: Encryption in transit enabled  
⚠️ **Next Step**: Choose encryption at rest option  
🎯 **Recommendation**: Neon built-in encryption (Scale plan)

---

*Last Updated: October 27, 2025*  
*Next Review: October 27, 2026*
