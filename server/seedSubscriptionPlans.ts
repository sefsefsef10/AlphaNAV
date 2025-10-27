import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";

/**
 * Seed subscription plans for AlphaNAV billing
 * 
 * Pricing Strategy:
 * - Starter: $499/month - For GPs testing NAV lending (1-3 facilities)
 * - Professional: $1,999/month - For active NAV borrowers (4-10 facilities)
 * - Enterprise: $4,999/month - For large firms + lenders (unlimited)
 * 
 * Value Prop: Platform saves 100 bps ($306K) on $100M portfolio
 * Even Enterprise tier = 1.6% of annual savings
 */

export async function seedSubscriptionPlans() {
  console.log("Seeding subscription plans...");

  try {
    // Check if plans already exist
    const existing = await db.select().from(subscriptionPlans);
    if (existing.length > 0) {
      console.log(`Found ${existing.length} existing subscription plans. Skipping seed.`);
      return;
    }

    // Note: You'll need to create these products in Stripe dashboard first
    // and replace with your actual Stripe Price IDs
    const plans = [
      {
        name: "Starter",
        tier: "starter",
        stripePriceId: process.env.STRIPE_PRICE_ID_STARTER || "price_starter_placeholder",
        stripeProductId: process.env.STRIPE_PRODUCT_ID_STARTER || "prod_starter_placeholder",
        price: 49900, // $499/month
        currency: "usd",
        maxFacilities: 3,
        maxUsers: 2,
        maxStorage: 10, // 10 GB
        aiExtractions: 50, // 50 AI extractions per month
        features: [
          "Up to 3 NAV facilities",
          "2 team members",
          "50 AI document extractions/month",
          "Covenant monitoring & alerts",
          "Draw request management",
          "Document vault (10GB)",
          "Portfolio analytics",
          "Email support"
        ],
        isActive: true,
      },
      {
        name: "Professional",
        tier: "professional",
        stripePriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL || "price_professional_placeholder",
        stripeProductId: process.env.STRIPE_PRODUCT_ID_PROFESSIONAL || "prod_professional_placeholder",
        price: 199900, // $1,999/month
        currency: "usd",
        maxFacilities: 10,
        maxUsers: 10,
        maxStorage: 50, // 50 GB
        aiExtractions: 200, // 200 AI extractions per month
        features: [
          "Up to 10 NAV facilities",
          "10 team members",
          "200 AI document extractions/month",
          "Automated covenant monitoring",
          "Advanced portfolio analytics",
          "Legal document generation",
          "Cash flow forecasting",
          "API access",
          "Document vault (50GB)",
          "Priority email support",
          "Dedicated account manager"
        ],
        isActive: true,
      },
      {
        name: "Enterprise",
        tier: "enterprise",
        stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || "price_enterprise_placeholder",
        stripeProductId: process.env.STRIPE_PRODUCT_ID_ENTERPRISE || "prod_enterprise_placeholder",
        price: 499900, // $4,999/month
        currency: "usd",
        maxFacilities: 999, // Unlimited (soft cap)
        maxUsers: 999, // Unlimited (soft cap)
        maxStorage: 500, // 500 GB
        aiExtractions: 1000, // 1000 AI extractions per month
        features: [
          "Unlimited NAV facilities",
          "Unlimited team members",
          "1000+ AI document extractions/month",
          "Automated covenant monitoring",
          "Advanced portfolio analytics",
          "Legal document generation",
          "Cash flow forecasting",
          "Full API access",
          "Document vault (500GB)",
          "White-label options",
          "Custom integrations",
          "Dedicated support team",
          "SLA guarantee (99.9% uptime)",
          "Custom reporting",
          "Data export capabilities",
          "Audit logging",
          "SSO/SAML support (coming soon)"
        ],
        isActive: true,
      },
    ];

    await db.insert(subscriptionPlans).values(plans);

    console.log(`✅ Successfully seeded ${plans.length} subscription plans`);
    console.log("\nPricing Tiers:");
    console.log("- Starter: $499/month (1-3 facilities)");
    console.log("- Professional: $1,999/month (4-10 facilities)");
    console.log("- Enterprise: $4,999/month (unlimited)");
    console.log("\n⚠️  IMPORTANT: Update Stripe Price IDs in environment variables:");
    console.log("- STRIPE_PRICE_ID_STARTER");
    console.log("- STRIPE_PRICE_ID_PROFESSIONAL");
    console.log("- STRIPE_PRICE_ID_ENTERPRISE");
    console.log("- STRIPE_PRODUCT_ID_STARTER");
    console.log("- STRIPE_PRODUCT_ID_PROFESSIONAL");
    console.log("- STRIPE_PRODUCT_ID_ENTERPRISE");
  } catch (error) {
    console.error("Error seeding subscription plans:", error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSubscriptionPlans()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
