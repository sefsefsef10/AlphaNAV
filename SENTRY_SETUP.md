# Sentry Error Tracking Setup Guide

## Overview
Sentry provides real-time error tracking and performance monitoring for both the backend (Node.js/Express) and frontend (React) of AlphaNAV. This guide walks through the complete setup process for production deployment.

## Prerequisites
- Sentry account (free tier available at https://sentry.io)
- Access to Replit project secrets/environment variables
- Production deployment of AlphaNAV

## Step 1: Create Sentry Projects

### 1.1 Create Account
1. Go to https://sentry.io
2. Sign up or log in
3. Create a new organization (or use existing)

### 1.2 Create Backend Project
1. Click "Projects" → "Create Project"
2. Select platform: **Node.js** / **Express**
3. Set alert frequency: **On every new issue**
4. Name: `alphanav-backend`
5. Click "Create Project"
6. **Copy the DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
7. Save this as `SENTRY_DSN` for the backend

### 1.3 Create Frontend Project
1. Click "Projects" → "Create Project"
2. Select platform: **React**
3. Set alert frequency: **On every new issue**
4. Name: `alphanav-frontend`
5. Click "Create Project"
6. **Copy the DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
7. Save this as `VITE_SENTRY_DSN` for the frontend

## Step 2: Configure Environment Variables

### 2.1 Backend Environment Variable
Add to Replit Secrets:
```
Key: SENTRY_DSN
Value: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### 2.2 Frontend Environment Variable
Add to Replit Secrets:
```
Key: VITE_SENTRY_DSN
Value: https://yyyyy@yyyyy.ingest.sentry.io/yyyyy
```

**Important**: 
- The backend uses `SENTRY_DSN` (no prefix)
- The frontend uses `VITE_SENTRY_DSN` (with VITE_ prefix for Vite to expose it)
- These should be **different DSNs** from two different Sentry projects

### 2.3 Environment Check
Make sure `NODE_ENV=production` is set in your production deployment.

## Step 3: Verify Integration

### 3.1 Backend Verification
The backend Sentry integration is in `server/index.ts`:
- **Automatic**: Captures unhandled errors and exceptions
- **Manual**: Use `Sentry.captureException(error)` for custom error tracking
- **Performance**: 10% of requests sampled for performance monitoring

Test by intentionally throwing an error in a route:
```typescript
app.get('/api/test-sentry', () => {
  throw new Error('Sentry backend test error');
});
```

### 3.2 Frontend Verification
The frontend Sentry integration is in `client/src/main.tsx`:
- **Automatic**: Captures unhandled errors and promise rejections
- **Session Replay**: 10% of sessions recorded, 100% of error sessions
- **Performance**: 10% of page loads sampled

Test by adding a test button:
```tsx
<button onClick={() => {
  throw new Error('Sentry frontend test error');
}}>
  Test Sentry
</button>
```

### 3.3 Check Sentry Dashboard
1. Go to https://sentry.io
2. Navigate to "Issues"
3. You should see the test errors appear within seconds
4. Click into an issue to see:
   - Stack traces
   - Request details
   - User context
   - Breadcrumbs (for frontend)
   - Session replays (for frontend errors)

## Step 4: Production Monitoring

### 4.1 Alert Configuration
Set up alerts for critical errors:

1. Go to **Alerts** → **Create Alert**
2. Configure:
   - **Name**: "Critical Errors - AlphaNAV Backend"
   - **Conditions**: When an event is first seen
   - **Severity**: High
   - **Notifications**: Email, Slack (if integrated)

Recommended alerts:
- New errors detected
- Error spike (>50 events in 5 minutes)
- Performance degradation (>1s average response time)

### 4.2 Release Tracking
Tag releases for better error tracking:

```typescript
// In server/index.ts (add to Sentry.init)
release: process.env.RELEASE_VERSION || 'dev',
```

Set `RELEASE_VERSION` environment variable during deployment:
```bash
RELEASE_VERSION=v1.2.3
```

### 4.3 User Context
Track which user experienced errors (already configured in auth middleware):

```typescript
// Example: Add to authentication middleware
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});
```

## Step 5: Performance Monitoring

### 5.1 Transaction Sampling
Currently set to 10% (`tracesSampleRate: 0.1`) to control costs. Adjust based on:
- **Development/Staging**: 1.0 (100%)
- **Production (low traffic)**: 0.5 (50%)
- **Production (high traffic)**: 0.1 (10%)

### 5.2 Session Replay Sampling and Privacy
Frontend session replay settings:
- **Regular sessions**: 10% sampled (`replaysSessionSampleRate: 0.1`)
- **Error sessions**: 100% captured (`replaysOnErrorSampleRate: 1.0`)
- **Privacy Protection**:
  - `maskAllText: true` - All text content is masked to protect sensitive financial data
  - `blockAllMedia: true` - All media (images, videos) is blocked
  - `maskAllInputs: true` - All form inputs are masked

**IMPORTANT for Financial Platforms**: 
Session replay is configured with strict privacy controls to prevent recording of:
- NAV values and fund performance data
- Deal terms and pricing information
- User PII (emails, names, addresses)
- Form inputs (passwords, financial data)

This ensures compliance with data privacy requirements for financial services platforms.

Adjust based on budget:
- Session replays consume more quota
- Focus on error sessions to minimize costs
- Consider disabling replays entirely if privacy concerns outweigh debugging benefits

## Step 6: Security Best Practices

### 6.1 Sensitive Data
Sentry automatically scrubs common sensitive patterns. Review captured data to ensure:
- No API keys logged
- No passwords or tokens
- No PII beyond necessary user context

### 6.2 CSP Configuration
Content Security Policy already allows Sentry:
```typescript
connectSrc: ["https://*.sentry.io"]
```

### 6.3 Rate Limiting
Sentry has built-in rate limiting, but you can add custom limits:

```typescript
// In Sentry.init()
beforeSend(event, hint) {
  // Don't send errors if rate limit exceeded
  if (rateLimitExceeded()) {
    return null;
  }
  return event;
},
```

## Step 7: Cost Management

### 7.1 Quota Monitoring
1. Go to **Settings** → **Subscription**
2. View current quota usage
3. Set up quota alerts:
   - 70% quota consumed
   - 90% quota consumed

### 7.2 Recommended Quotas (Free Tier)
Sentry free tier includes:
- **5,000 errors/month**
- **10,000 performance units/month**
- **500 replays/month**

For production:
- Consider **Team plan** ($26/month) for higher limits
- Adjust sampling rates to stay within budget

### 7.3 Filter Noisy Errors
Add filters to ignore common, non-critical errors:

```typescript
// In Sentry.init()
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Non-Error promise rejection captured',
  // Add more patterns as needed
],
```

## Step 8: Integration with Deployment Checklist

Add to production deployment workflow:

1. ✅ Configure `SENTRY_DSN` and `VITE_SENTRY_DSN` in Replit Secrets
2. ✅ Set `NODE_ENV=production`
3. ✅ Verify Sentry initialization on first production deploy
4. ✅ Test error reporting with intentional error
5. ✅ Set up alert notifications (email/Slack)
6. ✅ Configure quota alerts (70%/90%)
7. ✅ Review and configure release tracking

## Troubleshooting

### Errors Not Appearing in Sentry

**Check 1**: Verify environment variables are set
```bash
echo $SENTRY_DSN
echo $VITE_SENTRY_DSN
```

**Check 2**: Confirm `NODE_ENV=production`
```bash
echo $NODE_ENV
```

**Check 3**: Check browser console for Sentry init errors
- Open DevTools → Console
- Look for Sentry-related errors

**Check 4**: Verify CSP isn't blocking Sentry
- Check for CSP violations in browser console
- Ensure `https://*.sentry.io` is in `connectSrc`

### Performance Issues

**Symptom**: App feels slower after Sentry integration

**Solution**: Reduce sampling rates
```typescript
tracesSampleRate: 0.05, // 5% instead of 10%
replaysSessionSampleRate: 0.05, // 5% instead of 10%
```

### Too Many Quota Alerts

**Symptom**: Frequently hitting Sentry quota limits

**Solutions**:
1. Reduce sampling rates further
2. Add more `ignoreErrors` patterns
3. Upgrade to paid plan if errors are legitimate
4. Filter duplicate/spam errors

## Support Resources

- **Sentry Documentation**: https://docs.sentry.io/
- **Node.js SDK**: https://docs.sentry.io/platforms/node/
- **React SDK**: https://docs.sentry.io/platforms/javascript/guides/react/
- **Sentry Support**: support@sentry.io

## Implementation Status

✅ **Backend Integration**: Configured in `server/index.ts` using Sentry v10.x API
  - Uses `Sentry.setupExpressErrorHandler(app)` for modern error handling
  - Includes request context and user IP tracking
  - 10% transaction sampling for performance monitoring

✅ **Frontend Integration**: Configured in `client/src/main.tsx`
  - Browser tracing for performance monitoring
  - Session replay with strict privacy controls

✅ **CSP Updated**: Allows both `https://*.sentry.io` and `https://*.ingest.sentry.io`
  - Dashboard access for configuration
  - Event ingestion endpoint for error reporting

✅ **Production-Only**: Only activates when `NODE_ENV=production` and DSN is set
  - No performance impact in development
  - Graceful degradation if DSN not provided

✅ **Privacy & Security**: 
  - All text content masked in session replays
  - All media blocked in session replays
  - All form inputs masked
  - Compliant with financial services data privacy requirements

✅ **Error Handler**: Backend uses `setupExpressErrorHandler` (Sentry v10.x+)
✅ **Session Replay**: Enabled with strict privacy masking for financial data protection

**Next Steps**:
1. Create Sentry account and projects
2. Add DSN environment variables to Replit Secrets
3. Deploy to production
4. Test error reporting
5. Configure alerts and monitoring
