import { db } from './db';
import { users, prospects, facilities, covenants, advisorDeals, termSheets, lenderInvitations, notifications, onboardingSessions, drawRequests, messages } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Comprehensive test data seeding script for AlphaNAV
 * Creates realistic data for testing all features across 3 user roles
 */

export async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');

  try {
    // Clear existing test data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing test data...');
    await db.delete(messages);
    await db.delete(drawRequests);
    await db.delete(notifications);
    await db.delete(lenderInvitations);
    await db.delete(termSheets);
    await db.delete(advisorDeals);
    await db.delete(covenants);
    await db.delete(facilities);
    await db.delete(prospects);
    await db.delete(onboardingSessions);
    // Don't delete users - keep existing accounts
    console.log('✅ Cleared existing data\n');

    // ===== STEP 1: Create Users =====
    console.log('👥 Creating test users...');
    
    // Operations users
    const opsUsers = await db.insert(users).values([
      {
        id: 'ops-user-1',
        email: 'sarah.chen@naviq.com',
        firstName: 'Sarah',
        lastName: 'Chen',
        role: 'operations',
      },
      {
        id: 'ops-user-2',
        email: 'michael.rodriguez@naviq.com',
        firstName: 'Michael',
        lastName: 'Rodriguez',
        role: 'operations',
      },
      {
        id: 'ops-user-3',
        email: 'emily.thompson@naviq.com',
        firstName: 'Emily',
        lastName: 'Thompson',
        role: 'operations',
      },
    ]).onConflictDoNothing().returning();

    // Advisor users
    const advisorUsers = await db.insert(users).values([
      {
        id: 'advisor-user-1',
        email: 'alex.kim@placementgroup.com',
        firstName: 'Alex',
        lastName: 'Kim',
        role: 'advisor',
        advisorId: 'advisor-1',
      },
      {
        id: 'advisor-user-2',
        email: 'jennifer.patel@dealmakers.com',
        firstName: 'Jennifer',
        lastName: 'Patel',
        role: 'advisor',
        advisorId: 'advisor-2',
      },
      {
        id: 'advisor-user-3',
        email: 'david.cohen@capitaladvisors.com',
        firstName: 'David',
        lastName: 'Cohen',
        role: 'advisor',
        advisorId: 'advisor-3',
      },
    ]).onConflictDoNothing().returning();

    // GP users
    const gpUsers = await db.insert(users).values([
      {
        id: 'gp-user-1',
        email: 'robert.mason@acmegrowth.com',
        firstName: 'Robert',
        lastName: 'Mason',
        role: 'gp',
      },
      {
        id: 'gp-user-2',
        email: 'lisa.nguyen@summitequity.com',
        firstName: 'Lisa',
        lastName: 'Nguyen',
        role: 'gp',
      },
      {
        id: 'gp-user-3',
        email: 'james.anderson@peakventures.com',
        firstName: 'James',
        lastName: 'Anderson',
        role: 'gp',
      },
    ]).onConflictDoNothing().returning();

    console.log(`✅ Created ${opsUsers.length + advisorUsers.length + gpUsers.length} users\n`);

    // ===== STEP 2: Create Prospects =====
    console.log('🎯 Creating prospects...');
    
    const prospectData = await db.insert(prospects).values([
      // High-priority prospects (strong fit)
      {
        fundName: 'Acme Growth Partners II',
        fundSize: 250000000, // $250M
        vintage: 2019,
        portfolioCount: 8,
        sectors: ['Software', 'Healthcare', 'Fintech'],
        stage: 'Initial Contact',
        loanNeedScore: 85,
        borrowerQualityScore: 90,
        engagementScore: 75,
        overallScore: 85,
        recommendation: 'Strong fit - pursue aggressively',
        contactName: 'Robert Mason',
        contactEmail: 'robert.mason@acmegrowth.com',
        contactPhone: '415-555-0101',
        eligibilityStatus: 'eligible',
        eligibilityNotes: 'Meets all criteria: AUM within range, 4+ year vintage, diversified portfolio',
        source: 'direct_inquiry',
      },
      {
        fundName: 'Summit Equity Fund III',
        fundSize: 350000000, // $350M
        vintage: 2018,
        portfolioCount: 12,
        sectors: ['Manufacturing', 'Consumer Goods', 'Business Services'],
        stage: 'Underwriting',
        loanNeedScore: 80,
        borrowerQualityScore: 85,
        engagementScore: 90,
        overallScore: 85,
        recommendation: 'Proceed to term sheet',
        contactName: 'Lisa Nguyen',
        contactEmail: 'lisa.nguyen@summitequity.com',
        contactPhone: '212-555-0102',
        eligibilityStatus: 'eligible',
        eligibilityNotes: 'Strong track record, conservative leverage requested',
        source: 'advisor_referral',
      },
      {
        fundName: 'Peak Ventures IV',
        fundSize: 180000000, // $180M
        vintage: 2020,
        portfolioCount: 6,
        sectors: ['Technology', 'Software', 'E-commerce'],
        stage: 'Due Diligence',
        loanNeedScore: 75,
        borrowerQualityScore: 80,
        engagementScore: 85,
        overallScore: 80,
        recommendation: 'Good fit - standard diligence',
        contactName: 'James Anderson',
        contactEmail: 'james.anderson@peakventures.com',
        contactPhone: '650-555-0103',
        eligibilityStatus: 'eligible',
        eligibilityNotes: 'Newer vintage but strong portfolio companies',
        source: 'direct_inquiry',
      },
      
      // Medium-priority prospects
      {
        fundName: 'Harbor Capital Fund II',
        fundSize: 450000000, // $450M (upper limit)
        vintage: 2017,
        portfolioCount: 15,
        sectors: ['Energy', 'Infrastructure', 'Utilities'],
        stage: 'Proposal Sent',
        loanNeedScore: 70,
        borrowerQualityScore: 75,
        engagementScore: 60,
        overallScore: 70,
        recommendation: 'Monitor engagement level',
        contactName: 'Patricia Williams',
        contactEmail: 'p.williams@harborcapital.com',
        contactPhone: '617-555-0104',
        eligibilityStatus: 'eligible',
        eligibilityNotes: 'At upper AUM limit, lower engagement',
        source: 'conference',
      },
      {
        fundName: 'Catalyst Growth Partners',
        fundSize: 120000000, // $120M
        vintage: 2021,
        portfolioCount: 5,
        sectors: ['Healthcare', 'Biotech', 'Medical Devices'],
        stage: 'Initial Contact',
        loanNeedScore: 65,
        borrowerQualityScore: 70,
        engagementScore: 70,
        overallScore: 68,
        recommendation: 'Qualified lead - follow up',
        contactName: 'Dr. Maria Garcia',
        contactEmail: 'm.garcia@catalystgrowth.com',
        contactPhone: '858-555-0105',
        eligibilityStatus: 'eligible',
        eligibilityNotes: 'Near lower AUM limit, specialized sector',
        source: 'linkedin',
      },
      
      // Ineligible or low-priority prospects
      {
        fundName: 'Micro Ventures Fund I',
        fundSize: 75000000, // $75M (too small)
        vintage: 2022,
        portfolioCount: 4,
        sectors: ['Software', 'SaaS'],
        stage: 'Initial Contact',
        loanNeedScore: 60,
        borrowerQualityScore: 65,
        engagementScore: 50,
        overallScore: 55,
        recommendation: 'Below minimum AUM threshold',
        contactName: 'Kevin Lee',
        contactEmail: 'k.lee@microventures.com',
        contactPhone: '408-555-0106',
        eligibilityStatus: 'ineligible',
        eligibilityNotes: 'AUM below $100M minimum',
        source: 'website',
      },
      {
        fundName: 'Titan Capital Fund V',
        fundSize: 650000000, // $650M (too large)
        vintage: 2016,
        portfolioCount: 20,
        sectors: ['Diversified'],
        stage: 'Not Interested',
        loanNeedScore: 50,
        borrowerQualityScore: 85,
        engagementScore: 30,
        overallScore: 50,
        recommendation: 'Outside target market',
        contactName: 'William Thompson',
        contactEmail: 'w.thompson@titancapital.com',
        contactPhone: '646-555-0107',
        eligibilityStatus: 'ineligible',
        eligibilityNotes: 'AUM exceeds $500M maximum',
        source: 'cold_outreach',
      },
    ]).returning();

    console.log(`✅ Created ${prospectData.length} prospects\n`);

    // ===== STEP 3: Create Facilities =====
    console.log('🏦 Creating facilities...');
    
    const facilityData = await db.insert(facilities).values([
      // Active facilities
      {
        id: 'facility-1',
        prospectId: prospectData[0].id,
        fundName: 'Acme Growth Partners II',
        status: 'active',
        principalAmount: 25000000, // $25M
        outstandingBalance: 25000000,
        interestRate: 850, // 8.50% (stored as basis points)
        ltvRatio: 10, // 10% (stored as integer)
        maturityDate: new Date('2027-12-31'),
        originationDate: new Date('2024-01-15'),
        paymentSchedule: 'quarterly',
      },
      {
        id: 'facility-2',
        prospectId: prospectData[1].id,
        fundName: 'Summit Equity Fund III',
        status: 'active',
        principalAmount: 35000000, // $35M
        outstandingBalance: 35000000,
        interestRate: 900, // 9.00%
        ltvRatio: 11, // 10.5% rounded to 11%
        maturityDate: new Date('2028-06-30'),
        originationDate: new Date('2024-03-01'),
        paymentSchedule: 'quarterly',
      },
      {
        id: 'facility-3',
        prospectId: prospectData[2].id,
        fundName: 'Peak Ventures IV',
        status: 'active',
        principalAmount: 18000000, // $18M
        outstandingBalance: 18000000,
        interestRate: 875, // 8.75%
        ltvRatio: 14, // 14% (near breach threshold of 15%)
        maturityDate: new Date('2027-09-30'),
        originationDate: new Date('2024-04-15'),
        paymentSchedule: 'monthly',
      },
      
      // Pending facilities
      {
        id: 'facility-4',
        prospectId: prospectData[3].id,
        fundName: 'Harbor Capital Fund II',
        status: 'pending',
        principalAmount: 40000000, // $40M
        outstandingBalance: 0, // Not yet funded
        interestRate: 925, // 9.25%
        ltvRatio: 9, // 9%
        maturityDate: new Date('2028-12-31'),
        originationDate: new Date('2024-10-01'),
        paymentSchedule: 'quarterly',
      },
      
      // Closed facility
      {
        id: 'facility-5',
        prospectId: prospectData[4].id,
        fundName: 'Catalyst Growth Partners',
        status: 'closed',
        principalAmount: 12000000, // $12M
        outstandingBalance: 0, // Fully repaid
        interestRate: 825, // 8.25%
        ltvRatio: 8, // 8%
        maturityDate: new Date('2026-12-31'),
        originationDate: new Date('2023-06-01'),
        paymentSchedule: 'quarterly',
      },
    ]).returning();

    console.log(`✅ Created ${facilityData.length} facilities\n`);

    // ===== STEP 4: Create Covenants =====
    console.log('📋 Creating covenants...');
    
    const covenantData = await db.insert(covenants).values([
      // Facility 1 - All compliant
      {
        facilityId: 'facility-1',
        covenantType: 'ltv_covenant',
        thresholdOperator: 'less_than',
        thresholdValue: 150, // 15.0% (stored as 15.0 * 10 for precision)
        currentValue: 100, // 10.0%
        status: 'compliant',
        lastChecked: new Date(),
        checkFrequency: 'quarterly',
      },
      {
        facilityId: 'facility-1',
        covenantType: 'minimum_nav',
        thresholdOperator: 'greater_than',
        thresholdValue: 200000000, // $200M
        currentValue: 250000000, // $250M
        status: 'compliant',
        lastChecked: new Date(),
        checkFrequency: 'quarterly',
      },
      {
        facilityId: 'facility-1',
        covenantType: 'diversification',
        thresholdOperator: 'less_than',
        thresholdValue: 200, // 20.0% concentration limit
        currentValue: 150, // 15.0%
        status: 'compliant',
        lastChecked: new Date(),
        checkFrequency: 'quarterly',
      },
      
      // Facility 2 - Warning state
      {
        facilityId: 'facility-2',
        covenantType: 'ltv_covenant',
        thresholdOperator: 'less_than',
        thresholdValue: 150, // 15.0%
        currentValue: 138, // 13.8% (92% of threshold - warning!)
        status: 'warning',
        lastChecked: new Date(),
        checkFrequency: 'quarterly',
      },
      {
        facilityId: 'facility-2',
        covenantType: 'minimum_nav',
        thresholdOperator: 'greater_than',
        thresholdValue: 300000000,
        currentValue: 335000000,
        status: 'compliant',
        lastChecked: new Date(),
        checkFrequency: 'quarterly',
      },
      
      // Facility 3 - Breach state
      {
        facilityId: 'facility-3',
        covenantType: 'ltv_covenant',
        thresholdOperator: 'less_than',
        thresholdValue: 150, // 15.0%
        currentValue: 162, // 16.2% - BREACHED!
        status: 'breach',
        lastChecked: new Date(),
        breachNotified: true,
        checkFrequency: 'monthly',
      },
      {
        facilityId: 'facility-3',
        covenantType: 'minimum_nav',
        thresholdOperator: 'greater_than',
        thresholdValue: 150000000,
        currentValue: 124000000, // Also breached
        status: 'breach',
        lastChecked: new Date(),
        breachNotified: true,
        checkFrequency: 'monthly',
      },
      
      // Facility 4 - Pending (not yet active)
      {
        facilityId: 'facility-4',
        covenantType: 'ltv_covenant',
        thresholdOperator: 'less_than',
        thresholdValue: 120, // 12.0%
        currentValue: 90, // 9.0%
        status: 'compliant',
        lastChecked: null, // Not checked yet
        checkFrequency: 'quarterly',
      },
    ]).returning();

    console.log(`✅ Created ${covenantData.length} covenants\n`);

    // ===== STEP 5: Create Advisor Deals =====
    console.log('🤝 Creating advisor deals...');
    
    const advisorDealData = await db.insert(advisorDeals).values([
      {
        advisorId: 'advisor-1',
        gpFundName: 'Redwood Growth Fund IV',
        gpContactName: 'Sarah Mitchell',
        gpContactEmail: 's.mitchell@redwoodgrowth.com',
        gpContactPhone: '415-555-0301',
        isAnonymized: true,
        status: 'submitted',
        loanAmount: 30000000,
        urgency: 'standard',
        fundAum: 280000000,
        fundVintage: 2020,
        fundPortfolioCount: 9,
        fundSectors: ['Software', 'Technology', 'Healthcare'],
        borrowingPermitted: true,
        navIqStatus: 'reviewing',
      },
      {
        advisorId: 'advisor-2',
        gpFundName: 'Horizon Equity Partners II',
        gpContactName: 'Thomas Lee',
        gpContactEmail: 't.lee@horizonequity.com',
        gpContactPhone: '212-555-0302',
        isAnonymized: true,
        status: 'submitted',
        loanAmount: 45000000,
        urgency: 'high',
        fundAum: 420000000,
        fundVintage: 2019,
        fundPortfolioCount: 14,
        fundSectors: ['Manufacturing', 'Business Services', 'Consumer'],
        borrowingPermitted: true,
        navIqStatus: 'term_sheet_sent',
        navIqTermSheetDate: new Date('2024-10-15'),
      },
      {
        advisorId: 'advisor-1',
        gpFundName: 'Evergreen Capital Fund III',
        gpContactName: 'Amanda Green',
        gpContactEmail: 'a.green@evergreencapital.com',
        gpContactPhone: '617-555-0303',
        isAnonymized: false,
        status: 'closed',
        loanAmount: 25000000,
        urgency: 'standard',
        fundAum: 210000000,
        fundVintage: 2021,
        fundPortfolioCount: 7,
        fundSectors: ['Clean Energy', 'Sustainability', 'Environmental'],
        borrowingPermitted: true,
        navIqStatus: 'won',
        winner: 'NAV IQ Capital',
        commissionEarned: 125000, // $125K commission
        closeDate: new Date('2024-09-15'),
        daysToClose: 45,
      },
    ]).returning();

    console.log(`✅ Created ${advisorDealData.length} advisor deals\n`);

    // ===== STEP 6: Create Notifications =====
    console.log('🔔 Creating notifications...');
    
    const notificationData = await db.insert(notifications).values([
      // Operations notifications
      {
        userId: 'ops-user-1',
        type: 'error',
        title: 'Covenant Breach Detected',
        message: 'Facility "Peak Ventures IV" has breached LTV covenant (16.2% vs 15% max)',
        read: false,
        relatedEntityType: 'facility',
        relatedEntityId: 'facility-3',
      },
      {
        userId: 'ops-user-1',
        type: 'warning',
        title: 'Covenant Warning',
        message: 'Facility "Summit Equity Fund III" approaching LTV limit (13.8% vs 15% max)',
        read: false,
        relatedEntityType: 'facility',
        relatedEntityId: 'facility-2',
      },
      {
        userId: 'ops-user-1',
        type: 'info',
        title: 'New Prospect Eligible',
        message: 'Prospect "Acme Growth Partners II" meets all eligibility criteria',
        read: true,
        relatedEntityType: 'prospect',
        relatedEntityId: prospectData[0].id,
      },
      
      // Advisor notifications
      {
        userId: 'advisor-user-1',
        type: 'info',
        title: 'Term Sheet Received',
        message: 'NAV IQ Capital submitted term sheet for "Redwood Growth Fund IV"',
        read: false,
        relatedEntityType: 'advisor_deal',
        relatedEntityId: advisorDealData[0].id,
      },
      {
        userId: 'advisor-user-2',
        type: 'info',
        title: 'Deal Status Update',
        message: 'All lenders invited for "Horizon Equity Partners II"',
        read: true,
        relatedEntityType: 'advisor_deal',
        relatedEntityId: advisorDealData[1].id,
      },
      
      // GP notifications
      {
        userId: 'gp-user-3',
        type: 'error',
        title: 'Covenant Breach',
        message: 'Your facility has breached LTV covenant. Please contact your relationship manager.',
        read: false,
        relatedEntityType: 'facility',
        relatedEntityId: 'facility-3',
      },
      {
        userId: 'gp-user-1',
        type: 'info',
        title: 'Quarterly Report Due',
        message: 'Please submit Q3 2024 NAV report by October 31',
        read: true,
        relatedEntityType: 'facility',
        relatedEntityId: 'facility-1',
      },
    ]).returning();

    console.log(`✅ Created ${notificationData.length} notifications\n`);

    // ===== STEP 7: Create Onboarding Sessions =====
    console.log('📝 Creating onboarding sessions...');
    
    const onboardingData = await db.insert(onboardingSessions).values([
      {
        fundName: 'Sequoia Growth Partners',
        contactName: 'Rachel Green',
        contactEmail: 'rachel.green@sequoiagrowth.com',
        contactPhone: '415-555-0200',
        currentStep: 4,
        status: 'completed',
        extractedData: {
          fundName: 'Sequoia Growth Partners',
          vintage: 2020,
          aum: 220000000,
          portfolioCount: 7,
          sectors: ['Software', 'Cloud Infrastructure', 'AI/ML'],
          keyPersonnel: ['Rachel Green - Managing Partner', 'Ross Geller - Investment Partner'],
          borrowingPermitted: true,
          eligibility: {
            aumInRange: true,
            vintageOk: true,
            portfolioCountOk: true,
            eligible: true,
          },
          confidenceScore: 88,
        },
        confirmedData: {
          fundName: 'Sequoia Growth Partners',
          vintage: 2020,
          aum: 220000000,
          portfolioCount: 7,
          sectors: ['Software', 'Cloud Infrastructure', 'AI/ML'],
          keyPersonnel: ['Rachel Green', 'Ross Geller'],
        },
      },
      {
        fundName: 'Oakmont Capital Fund II',
        contactName: 'Monica Bing',
        contactEmail: 'm.bing@oakmontcapital.com',
        contactPhone: '212-555-0201',
        currentStep: 3,
        status: 'in_progress',
        extractedData: {
          fundName: 'Oakmont Capital Fund II',
          vintage: 2019,
          aum: 175000000,
          portfolioCount: 6,
          confidenceScore: 75,
        },
        confirmedData: null,
      },
    ]).returning();

    console.log(`✅ Created ${onboardingData.length} onboarding sessions\n`);

    // ===== SUMMARY =====
    console.log('\n✅ Test data seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${opsUsers.length} ops, ${advisorUsers.length} advisors, ${gpUsers.length} GPs`);
    console.log(`   - Prospects: ${prospectData.length} (${prospectData.filter(p => p.eligibilityStatus === 'eligible').length} eligible)`);
    console.log(`   - Facilities: ${facilityData.length} (${facilityData.filter(f => f.status === 'active').length} active)`);
    console.log(`   - Covenants: ${covenantData.length} (${covenantData.filter(c => c.status === 'compliant').length} compliant, ${covenantData.filter(c => c.status === 'warning').length} warning, ${covenantData.filter(c => c.status === 'breach').length} breach)`);
    console.log(`   - Advisor Deals: ${advisorDealData.length}`);
    console.log(`   - Notifications: ${notificationData.length}`);
    console.log(`   - Onboarding Sessions: ${onboardingData.length}`);
    console.log('\n🚀 Ready for testing!');

    return {
      users: { operations: opsUsers, advisors: advisorUsers, gps: gpUsers },
      prospects: prospectData,
      facilities: facilityData,
      covenants: covenantData,
      advisorDeals: advisorDealData,
      notifications: notificationData,
      onboardingSessions: onboardingData,
    };

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData()
    .then(() => {
      console.log('\n✨ Seeding complete - exiting');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error);
      process.exit(1);
    });
}
