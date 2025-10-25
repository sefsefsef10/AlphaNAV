# AI Cost Monitoring & Control Setup Guide

## Overview
AlphaNAV uses two AI services that require cost monitoring and budget controls:
1. **OpenAI (GPT-4)**: Document analysis and processing
2. **Google Gemini (2.0 Flash)**: Fund data extraction and compliance analysis

This guide explains how to set up billing alerts, monitor usage, and implement cost controls for production deployment.

## Current AI Usage in AlphaNAV

### Gemini Integration (PRIMARY AI PROVIDER)
- **Model**: Gemini 2.0 Flash (text-only)
- **Use Cases**:
  - **PRIMARY**: Fund document extraction (fundName, AUM, vintage, sectors, etc.)
  - Eligibility assessment with confidence scoring
  - Covenant breach risk analysis
  - Document data extraction from uploaded files
- **Environment Variable**: `GEMINI_API_KEY`
- **Code Location**: `server/routes.ts`, `server/services/aiExtraction.ts`
- **Why Gemini**: 20x cheaper than GPT-4, fast enough for document processing

### OpenAI Integration (OPTIONAL/FUTURE)
- **Model**: GPT-4-turbo (if enabled)
- **Use Cases**: 
  - Reserved for future features (legal document generation, compliance reports)
  - Currently **NOT USED** in production code
- **Environment Variable**: `OPENAI_API_KEY`
- **Status**: API key configured but not actively called in current codebase

**⚠️ IMPORTANT**: AlphaNAV primarily uses Gemini for all AI operations. OpenAI costs will be near-zero unless future features are added.

## Step 1: OpenAI Cost Monitoring Setup

### 1.1 Access OpenAI Dashboard
1. Go to https://platform.openai.com/
2. Log in with your OpenAI account
3. Navigate to **Settings** → **Organization** → **Billing**

### 1.2 Set Up Billing Alerts

1. Click **Billing** → **Limits**
2. Configure **Usage limits**:

   **Recommended Thresholds**:
   - **Soft limit (notification)**: $50/month
   - **Hard limit (auto-stop)**: $100/month
   
   **For Production**:
   - **Soft limit**: $100/month
   - **Medium limit**: $200/month
   - **Hard limit**: $500/month (prevents runaway costs)

3. Configure **Email notifications**:
   - **50% of limit**: Email to team@alphanav.com
   - **75% of limit**: Email + Slack alert
   - **90% of limit**: Urgent alert to ops team
   - **100% of limit**: API access suspended automatically

### 1.3 Monitor OpenAI Usage

**Daily Monitoring**:
1. Go to **Usage** dashboard
2. Check:
   - Tokens used today vs. average
   - Cost per request
   - Most expensive API calls
   - Error rate (failed requests still cost money)

**Weekly Review**:
- Total spend vs. budget
- Cost per customer/transaction
- Identify unusual spikes
- Review and optimize prompts

### 1.4 Cost Optimization Strategies

**Reduce OpenAI Costs** (if/when OpenAI is used):

1. **Current Strategy: Use Gemini Instead**:
   - AlphaNAV uses Gemini 2.0 Flash (20x cheaper than GPT-4)
   - Only enable OpenAI if specific use cases require it

2. **If enabling OpenAI features**:
   - Use GPT-4-turbo (50% cheaper than GPT-4)
   - Implement caching for repeated operations
   - Optimize prompts to minimize token usage

3. **Rate limiting**:
   - Limit AI calls per user per hour (already implemented)
   - Prevent abuse and runaway costs

### 1.5 OpenAI Budget Calculator

**Status**: OpenAI not actively used in current implementation

**Estimated Monthly Costs** (if GPT-4-turbo is enabled):
- **Document extraction**: ~$0.03 per document (500 tokens)
- **Legal doc generation**: ~$0.10 per document (2,000 tokens)
- **Compliance reports**: ~$0.05 per report (1,000 tokens)

**Example Scenarios** (if OpenAI features are enabled):
- **10 deals/month**: ~$2/month
- **50 deals/month**: ~$10/month
- **200 deals/month**: ~$40/month
- **1,000 deals/month**: ~$200/month

**Recommended Approach**: Monitor Gemini costs first. Only enable OpenAI if specific features require GPT-4's capabilities.

**Pricing** (as of 2024):
- **GPT-4-turbo**: $10/1M input tokens, $30/1M output tokens
- **GPT-4**: $30/1M input tokens, $60/1M output tokens (not recommended)

## Step 2: Google Gemini Cost Monitoring Setup

### 2.1 Access Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Select your project (or create one)
3. Enable **Gemini API** (Generative Language API)

### 2.2 Set Up Budget Alerts

1. Go to **Billing** → **Budgets & Alerts**
2. Click **Create Budget**
3. Configure:

   **Budget Details**:
   - **Name**: Gemini API Budget
   - **Projects**: Select your project
   - **Services**: Select "Generative Language API"
   - **Budget amount**: $100/month

4. **Set alert thresholds**:
   - Alert at 50%: $50
   - Alert at 75%: $75
   - Alert at 90%: $90
   - Alert at 100%: $100

5. **Configure notifications**:
   - Email: team@alphanav.com
   - Pub/Sub topic (optional): For Slack integration
   - Monitoring channel: For alerting integration

### 2.3 Monitor Gemini Usage

**Access Usage Dashboard**:
1. Go to **APIs & Services** → **Enabled APIs**
2. Click **Generative Language API**
3. Click **Quotas & System Limits**
4. View **Metrics**

**Key Metrics to Track**:
- **Requests per day**
- **Tokens consumed**
- **Average cost per request**
- **Error rate** (4xx/5xx)

### 2.4 Set Up Quota Limits

**Prevent Runaway Costs**:
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Click **Edit API key**
4. Under **API restrictions**:
   - Restrict key to **Generative Language API** only
   - Set **Quota limits**:
     - **Requests per day**: 1,000
     - **Requests per 100 seconds**: 100
     - **Requests per second**: 10

### 2.5 Gemini Cost Optimization

**Reduce Gemini Costs**:

1. **Use Gemini Flash instead of Pro**:
   - 20x cheaper than Gemini Pro
   - Fast enough for most tasks
   - AlphaNAV already uses Gemini 2.0 Flash ✅

2. **Implement rate limiting**:
   ```typescript
   const rateLimiter = rateLimit({
     windowMs: 60 * 60 * 1000, // 1 hour
     max: 100, // 100 requests per hour per user
   });
   app.use('/api/prospects/upload-and-extract', rateLimiter);
   ```

3. **Cache extraction results**:
   - Store extracted fund data in database
   - Don't re-extract same document

4. **Optimize prompt length**:
   - Shorter prompts = lower costs
   - Extract only necessary fields

### 2.6 Gemini Budget Calculator

**Estimated Monthly Costs** (Gemini 2.0 Flash):
- **Document extraction**: ~$0.001 per document (1,000 tokens)
- **Eligibility assessment**: ~$0.002 per assessment (2,000 tokens)
- **Covenant analysis**: ~$0.001 per analysis (1,000 tokens)

**Example Scenarios**:
- **10 deals/month**: $0.04/month
- **50 deals/month**: $0.20/month
- **200 deals/month**: $0.80/month
- **1,000 deals/month**: $4.00/month

**Pricing** (as of 2024):
- **Gemini 2.0 Flash**: $0.075/$0.30 per 1M characters (input/output)
- **Gemini 2.0 Pro**: $1.50/$6.00 per 1M characters (20x more expensive)

## Step 3: Combined Cost Monitoring Dashboard

### 3.1 Create Unified Monitoring

**Tools to Use**:
- **Google Sheets** (simple, free)
- **Grafana** (advanced, self-hosted)
- **Datadog** (enterprise, paid)

**Example: Google Sheets Dashboard**

Create columns:
- Date
- OpenAI Requests
- OpenAI Cost ($)
- Gemini Requests
- Gemini Cost ($)
- Total AI Cost ($)
- Budget Remaining ($)

**Daily Update Script** (optional):
```bash
#!/bin/bash
# Fetch usage from OpenAI and Gemini APIs
# Update Google Sheets via API
# Send alert if over budget
```

### 3.2 Weekly Cost Review Checklist

Every Monday:
- [ ] Check OpenAI usage dashboard
- [ ] Check Gemini usage dashboard
- [ ] Calculate total AI spend for week
- [ ] Compare to weekly budget (monthly / 4)
- [ ] Identify cost spikes or anomalies
- [ ] Review error rates (failed requests cost money)
- [ ] Update forecast for month-end spend

### 3.3 Monthly Cost Analysis

Every month-end:
- [ ] Total AI spend vs. budget
- [ ] Cost per customer/deal
- [ ] Most expensive AI operations
- [ ] ROI analysis (time saved vs. cost)
- [ ] Optimization opportunities
- [ ] Budget adjustments for next month

## Step 4: Cost Optimization Best Practices

### 4.1 Implement Rate Limiting (Application-Level)

**Backend Rate Limiting**:
```typescript
// Limit AI calls per user
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI requests per hour per user
  message: 'Too many AI requests, please try again later',
});

app.use('/api/prospects/upload-and-extract', aiRateLimiter);
app.use('/api/facilities/:id/generate-document', aiRateLimiter);
```

### 4.2 Implement Caching

**Cache Expensive AI Calls**:
```typescript
// Example: Cache document extractions
const extractionCache = new Map();

async function extractFundData(documentId: string) {
  const cacheKey = `extract-${documentId}`;
  
  if (extractionCache.has(cacheKey)) {
    return extractionCache.get(cacheKey);
  }
  
  const result = await callGeminiAPI(documentId);
  extractionCache.set(cacheKey, result);
  
  return result;
}
```

### 4.3 Monitor and Alert on Anomalies

**Set Up Anomaly Detection**:
- Alert if daily cost > 2x average
- Alert if error rate > 5%
- Alert if single user consumes > 25% of daily budget

**Slack Integration** (optional):
```typescript
async function sendCostAlert(message: string) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `⚠️ AI Cost Alert: ${message}`,
    }),
  });
}

if (dailyCost > DAILY_BUDGET * 2) {
  await sendCostAlert(`Daily cost ($${dailyCost}) exceeded 2x budget!`);
}
```

### 4.4 Implement Fallback Mechanisms

**Graceful Degradation**:
```typescript
async function extractWithFallback(document: Document) {
  try {
    // Try Gemini first (cheaper)
    return await extractWithGemini(document);
  } catch (error) {
    if (budgetExceeded()) {
      // Fall back to manual extraction form
      return { requiresManualReview: true };
    }
    // Try OpenAI as backup
    return await extractWithOpenAI(document);
  }
}
```

## Step 5: Production Deployment Checklist

Before going live:

**OpenAI**:
- [ ] Set up OpenAI account and billing
- [ ] Add `OPENAI_API_KEY` to Replit Secrets
- [ ] Configure soft limit ($50) and hard limit ($100)
- [ ] Set up email alerts (50%, 75%, 90%, 100%)
- [ ] Test API calls work correctly
- [ ] Document API key rotation procedure

**Gemini**:
- [ ] Create Google Cloud project
- [ ] Enable Generative Language API
- [ ] Add `GEMINI_API_KEY` to Replit Secrets
- [ ] Set up budget ($100/month)
- [ ] Configure alert thresholds (50%, 75%, 90%, 100%)
- [ ] Set quota limits (1,000 req/day)
- [ ] Test API calls work correctly

**Monitoring**:
- [ ] Create cost tracking spreadsheet
- [ ] Set up weekly review calendar reminders
- [ ] Configure Slack alerts (optional)
- [ ] Document cost optimization procedures
- [ ] Train team on budget monitoring

**Cost Controls**:
- [ ] Implement application-level rate limiting
- [ ] Add caching for expensive operations
- [ ] Test fallback mechanisms
- [ ] Verify error handling doesn't waste credits

## Step 6: Cost Scenarios & Contingencies

### Scenario 1: Budget Exceeded (>90%)

**Immediate Actions**:
1. Review usage logs for anomalies
2. Check for API abuse or bugs
3. Implement stricter rate limits temporarily
4. Notify team of budget status
5. Consider increasing budget if usage is legitimate

### Scenario 2: API Key Compromised

**Response Plan**:
1. Immediately revoke compromised key
2. Generate new API key
3. Update `OPENAI_API_KEY` or `GEMINI_API_KEY` in Replit Secrets
4. Restart application
5. Review usage during compromise period
6. Dispute fraudulent charges with provider

### Scenario 3: Unexpected Cost Spike

**Investigation Steps**:
1. Check recent code deployments
2. Review error rates (retries cost money)
3. Identify users with unusual activity
4. Check for infinite loops or bugs
5. Implement immediate fixes
6. Add monitoring to prevent recurrence

## Step 7: Long-Term Cost Management

### Monthly Review Process
1. **Week 1**: Analyze previous month's Gemini spend
2. **Week 2**: Identify optimization opportunities
3. **Week 3**: Implement cost-saving measures
4. **Week 4**: Forecast next month's budget

### Quarterly Optimization
- Review and update prompt templates for Gemini
- Monitor Gemini 2.0 Flash pricing changes
- Analyze ROI of AI features
- Consider tiered pricing for users if costs grow
- Evaluate if OpenAI features should be enabled

### Annual Planning
- Budget allocation for AI services
- Evaluate alternative providers (Claude, Mistral)
- Review Gemini model updates and pricing
- Plan for model upgrades and deprecations

## Cost Summary

### Expected Monthly AI Costs (Production) - Gemini Primary

**Low Volume** (10-50 deals/month):
- Gemini: $0.04-$0.20
- OpenAI: $0 (not used)
- **Total**: ~$0.05-$0.25/month

**Medium Volume** (100-200 deals/month):
- Gemini: $0.40-$0.80
- OpenAI: $0 (not used)
- **Total**: ~$0.50-$1.00/month

**High Volume** (500-1,000 deals/month):
- Gemini: $2-$4
- OpenAI: $0 (not used)
- **Total**: ~$2-$5/month

**Very High Volume** (5,000-10,000 deals/month):
- Gemini: $20-$40
- OpenAI: $0 (not used)
- **Total**: ~$20-$40/month

**Recommended Budget**: 
- Start with $25/month Gemini budget
- Set $50/month hard limit
- Only configure OpenAI if specific features require GPT-4 capabilities

## Support Resources

- **OpenAI Help**: https://help.openai.com/
- **OpenAI Pricing**: https://openai.com/pricing
- **Google Cloud Billing**: https://cloud.google.com/billing/docs
- **Gemini Pricing**: https://ai.google.dev/pricing
- **AlphaNAV Ops Team**: ops@alphanav.com

## Implementation Status

🔲 **Create OpenAI account and configure billing**
🔲 **Set up OpenAI budget alerts ($50/$100)**
🔲 **Create Google Cloud project for Gemini**
🔲 **Configure Gemini budget alerts ($100)**
🔲 **Implement rate limiting in application**
🔲 **Set up cost tracking dashboard**
🔲 **Schedule weekly cost review meetings**
🔲 **Test all AI integrations with real API keys**
