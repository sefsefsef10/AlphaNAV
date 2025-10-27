# ML Training & Fund Admin Integration Requirements

## Predictive Breach ML Model - Training Requirements

### Current Implementation (v1.0)
- **Type**: Heuristic-based rule engine
- **Accuracy**: ~70-80% (estimated, not validated)
- **Method**: Weighted scoring based on:
  - Current covenant status proximity to breach threshold
  - Historical cash flow trends (3-6 month patterns)
  - Facility utilization rate
  - Borrower risk category

### Requirements for ML Model Training (v2.0)

#### Data Collection Needed
1. **Historical Covenant Data** (minimum 2 years):
   - Covenant values over time
   - Actual breach events (dates, types, resolutions)
   - False positives from current system
   - Seasonal patterns

2. **Facility Characteristics**:
   - Fund vintage
   - Asset class (PE, VC, real estate, etc.)
   - Geography
   - Size (AUM, commitment)
   - LP concentration

3. **Market Data**:
   - Interest rate environment
   - Economic indicators (GDP, employment)
   - Sector-specific performance metrics
   - Comparable fund performance

4. **Outcome Labels**:
   - Breaches that occurred (1) vs. did not occur (0)
   - Time to breach (if occurred)
   - Severity of breach (minor, material, default)

#### Minimum Data Requirements
- **Sample Size**: 500+ facility-months of data
- **Positive Cases**: 50+ actual breach events
- **Feature Count**: 15-25 engineered features
- **Temporal Split**: 70% training, 15% validation, 15% test (time-based, not random)

#### Model Architecture Recommendations
1. **Gradient Boosted Trees** (XGBoost, LightGBM)
   - Best for tabular financial data
   - Handles non-linear relationships
   - Built-in feature importance
   - Fast inference

2. **Alternative: Random Forest**
   - More interpretable than GBM
   - Robust to outliers
   - Ensemble approach reduces overfitting

3. **Not Recommended: Deep Learning**
   - Requires 10x more data
   - Less interpretable (regulatory concern)
   - Overkill for this problem size

#### Feature Engineering
```python
# Example features to engineer:
- covenant_headroom_pct = (current_value - threshold) / threshold
- cash_flow_trend_3mo = linear_regression_slope(cash_flows[-90:])
- utilization_velocity = (current_ltv - avg_ltv_6mo) / avg_ltv_6mo
- days_since_last_draw
- number_of_extensions
- sector_stress_index (from market data)
```

#### Performance Targets
- **Precision**: >85% (minimize false alarms)
- **Recall**: >75% (catch most real breaches)
- **F1 Score**: >80%
- **AUC-ROC**: >0.90
- **Time to Breach Accuracy**: ±15 days (for 30/90-day predictions)

#### Implementation Steps
1. Export historical data from production database
2. Clean and normalize data (handle missing values, outliers)
3. Split data temporally (no data leakage)
4. Train baseline model (XGBoost)
5. Hyperparameter tuning (grid search or Bayesian optimization)
6. Validate on holdout test set
7. A/B test against heuristic model (30 days)
8. Deploy to production if >20% improvement in F1 score

#### Monitoring Post-Deployment
- Track precision/recall weekly
- Monthly model retraining
- Feature drift detection
- Concept drift monitoring (market regime changes)

---

## Fund Administrator Integrations

### Overview
Connect to fund administrators (SS&C Intralinks, Alter Domus, Apex, etc.) to automatically sync:
- NAV data (fund valuations)
- Portfolio holdings
- Capital calls and distributions
- LP commitments

### Current Implementation
- **Schema**: `fundAdminConnections`, `fundAdminSyncLogs` tables created
- **Connection Types**: API, SFTP, Email, Manual
- **Status**: Backend schema ready, no active connections

### Integration Requirements by Provider

#### 1. SS&C Intralinks
**Connection Type**: REST API

**API Credentials Needed**:
- `SSC_API_KEY` (secret)
- `SSC_API_SECRET` (secret)
- `SSC_BASE_URL` (e.g., `https://api.intralinks.com/v2`)
- `SSC_CLIENT_ID`

**Data Available**:
- Fund NAV (daily, monthly)
- Portfolio company valuations
- Capital call schedules
- Distribution notices
- Investor statements

**Sync Frequency**: Daily (NAV), Real-time (capital events)

**Setup Steps**:
1. Contact SS&C sales to request API access
2. Complete data processing agreement (DPA)
3. Receive API credentials
4. Store credentials in Replit Secrets
5. Test connection in sandbox environment
6. Configure sync schedules in AlphaNAV

**API Documentation**: https://developer.intralinks.com/docs/

---

#### 2. Alter Domus
**Connection Type**: SFTP + Email notifications

**Credentials Needed**:
- `ALTERDOMUS_SFTP_HOST` (e.g., `sftp.alterdomus.com`)
- `ALTERDOMUS_SFTP_USERNAME` (secret)
- `ALTERDOMUS_SFTP_PASSWORD` (secret)
- `ALTERDOMUS_EMAIL` (for notifications)

**Data Available**:
- Monthly NAV reports (PDF + CSV)
- Quarterly investor reports
- Audited financial statements

**Sync Frequency**: Monthly (after NAV finalization)

**Setup Steps**:
1. Request SFTP access from Alter Domus client services
2. Configure SSH keys for secure connection
3. Set up automated file polling (daily)
4. Parse CSV/PDF files using existing document extraction service
5. Email alerts for new files

**File Format**: CSV with headers: `FundName,AsOfDate,NAV,AUM,NumInvestments`

---

#### 3. Apex Fund Services
**Connection Type**: REST API

**API Credentials Needed**:
- `APEX_API_KEY` (secret)
- `APEX_API_SECRET` (secret)
- `APEX_ENVIRONMENT` (`sandbox` or `production`)

**Data Available**:
- Real-time NAV updates
- Portfolio company data
- Transaction history
- LP capital accounts

**Sync Frequency**: Hourly (NAV), Real-time (transactions)

**Setup Steps**:
1. Sign API access agreement with Apex
2. Receive sandbox credentials for testing
3. Implement OAuth 2.0 flow (client credentials grant)
4. Map Apex data schema to AlphaNAV schema
5. Deploy to production after testing

**API Documentation**: https://developer.apexfunds.com/

---

### Common Integration Challenges

#### 1. Data Mapping
**Challenge**: Each fund admin uses different field names and formats
**Solution**: 
- Create mapping configuration per provider
- Store in `fundAdminConnections.metadata` (JSONB)
```json
{
  "fieldMapping": {
    "nav": "netAssetValue",
    "aum": "assetsUnderManagement",
    "dateField": "valuationDate"
  }
}
```

#### 2. Authentication Refresh
**Challenge**: API tokens expire (often 24-72 hours)
**Solution**:
- Implement OAuth refresh token flow
- Store refresh tokens securely
- Auto-refresh before expiration

#### 3. Rate Limiting
**Challenge**: APIs have request limits (e.g., 100 req/min)
**Solution**:
- Implement exponential backoff
- Queue requests during high volume
- Cache frequently accessed data

#### 4. Data Quality
**Challenge**: Missing or inconsistent data
**Solution**:
- Validate all incoming data against schema
- Log validation errors to `fundAdminSyncLogs.syncErrors`
- Send alerts for critical data gaps

### Security Requirements

#### All Integrations Must Have:
1. **Encryption in Transit**: TLS 1.2+ for all connections
2. **Encryption at Rest**: Credentials stored in Replit Secrets (encrypted)
3. **Audit Logging**: All sync operations logged to `fundAdminSyncLogs`
4. **Access Controls**: API keys tied to specific facilities (not global)
5. **Data Retention**: Sync logs retained for 7 years (SOC 2 requirement)

### Testing Strategy
1. **Sandbox Testing**: Use provider sandbox environments first
2. **Data Validation**: Compare synced data against manual exports
3. **Error Handling**: Test connection failures, timeouts, invalid data
4. **Performance**: Ensure sync completes within SLA (< 5 minutes for daily NAV)
5. **Alerting**: Verify notifications sent on sync failures

### Cost Estimates
- **SS&C Intralinks API**: $500-$2,000/month (depends on volume)
- **Alter Domus SFTP**: Included in fund admin fees (typically)
- **Apex API**: $1,000-$3,000/month + transaction fees

### Compliance Considerations
- **SOC 2 Type II**: All fund admins must have SOC 2 certification
- **GDPR**: Data processing agreement (DPA) required if EU data
- **PCI DSS**: Not applicable (no payment card data)

---

## Next Steps

### ML Model Training (Priority: High)
1. Export 2+ years of covenant monitoring data
2. Engage data science consultant or use internal ML team
3. Budget: $20K-$50K for model development
4. Timeline: 2-3 months

### Fund Admin Integrations (Priority: Medium)
1. Identify top 3 fund admins used by customers
2. Contact each to request API access
3. Negotiate pricing and contracts
4. Implement one integration as proof-of-concept
5. Timeline: 1-2 months per integration

### Recommended Order
1. **SS&C Intralinks** (largest market share, ~40% of PE funds)
2. **Apex Fund Services** (growing rapidly, modern API)
3. **Alter Domus** (strong in Europe)
4. Others as customer demand requires

---

**Document Version**: 1.0  
**Last Updated**: October 27, 2025  
**Next Review**: January 2026
