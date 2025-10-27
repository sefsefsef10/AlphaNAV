import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";

/**
 * Seed subscription plans for AlphaNAV billing
 * 
 * Pricing Strategy (Per Business Plan):
 * - Starter: $2,500/month - For GPs testing NAV lending (up to 5 facilities)
 * - Professional: $7,500/month - For active NAV borrowers (up to 20 facilities)
 * - Enterprise: Custom pricing - For large firms + lenders (unlimited facilities)
 * 
 * Value Prop: Platform saves 100 bps ($306K) on $100M portfolio
 * Even Enterprise tier = <2% of annual savings
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
        price: 250000, // $2,500/month (per business plan)
        currency: "usd",
        maxFacilities: 5, // Per business plan requirement
        maxUsers: 2,
        maxStorage: 10, // 10 GB
        aiExtractions: 50, // 50 AI extractions per month
        features: [
          "Up to 5 NAV facilities",
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
        price: 750000, // $7,500/month (per business plan)
        currency: "usd",
        maxFacilities: 20, // Per business plan requirement
        maxUsers: 10,
        maxStorage: 50, // 50 GB
        aiExtractions: 200, // 200 AI extractions per month
        features: [
          "Up to 20 NAV facilities",
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
        price: 0, // Custom pricing (quoted per customer)
        currency: "usd",
        maxFacilities: -1, // Unlimited (-1 indicates no limit)
        maxUsers: -1, // Unlimited
        maxStorage: 500, // 500 GB
        aiExtractions: 1000, // 1000+ AI extractions per month
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
    console.log("\nPricing Tiers (Per Business Plan):");
    console.log("- Starter: $2,500/month (up to 5 facilities)");
    console.log("- Professional: $7,500/month (up to 20 facilities)");
    console.log("- Enterprise: Custom pricing (unlimited facilities)");
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
