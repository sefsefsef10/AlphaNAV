/**
 * Billing Service - Stripe integration for subscription management
 * Reference: blueprint:javascript_stripe
 */

import Stripe from "stripe";
import { db } from "./db";
import { users, subscriptions, invoices, usageRecords, subscriptionPlans } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Let Stripe SDK use its default API version for compatibility
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

/**
 * Create or retrieve Stripe customer for user
 */
export async function getOrCreateStripeCustomer(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error("User not found");
  }

  // Return existing customer
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email || undefined,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
    metadata: {
      userId: user.id,
      role: user.role,
    },
  });

  // Update user with Stripe customer ID
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  return customer.id;
}

/**
 * Create subscription for user with transaction handling
 */
export async function createSubscription(userId: string, tier: 'starter' | 'professional' | 'enterprise') {
  // Get subscription plan
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(and(
      eq(subscriptionPlans.tier, tier),
      eq(subscriptionPlans.isActive, true)
    ));

  if (!plan) {
    throw new Error(`Subscription plan "${tier}" not found`);
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(userId);

  let stripeSubscription: any;
  let subscription: any;

  try {
    // Create Stripe subscription
    stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: plan.stripePriceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription in database - if this fails, we need to cancel the Stripe subscription
    try {
      [subscription] = await db
        .insert(subscriptions)
        .values({
          userId,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: customerId,
          stripePriceId: plan.stripePriceId,
          tier,
          status: stripeSubscription.status,
          currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end || false,
          trialStart: (stripeSubscription as any).trial_start ? new Date((stripeSubscription as any).trial_start * 1000) : null,
          trialEnd: (stripeSubscription as any).trial_end ? new Date((stripeSubscription as any).trial_end * 1000) : null,
        })
        .returning();

      // Update user with subscription ID - if this fails, delete the subscription record
      try {
        await db
          .update(users)
          .set({ stripeSubscriptionId: stripeSubscription.id })
          .where(eq(users.id, userId));
      } catch (userUpdateError) {
        // Delete the subscription record we just created
        await db
          .delete(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));
        throw userUpdateError;
      }

    } catch (dbError) {
      // Rollback: Cancel the Stripe subscription since we couldn't save it to the database
      console.error('Failed to save subscription to database, rolling back Stripe subscription:', dbError);
      try {
        await stripe.subscriptions.cancel(stripeSubscription.id);
      } catch (rollbackError) {
        console.error('Failed to rollback Stripe subscription:', rollbackError);
      }
      throw new Error('Failed to create subscription: Database error. Stripe subscription has been canceled.');
    }

    // Get client secret from payment intent
    const latestInvoice = stripeSubscription.latest_invoice;
    let clientSecret: string | null = null;
    if (latestInvoice && typeof latestInvoice === 'object') {
      const paymentIntent = (latestInvoice as any).payment_intent;
      if (paymentIntent && typeof paymentIntent === 'object') {
        clientSecret = (paymentIntent as any).client_secret || null;
      }
    }

    return {
      subscription,
      clientSecret,
    };
  } catch (error) {
    // If Stripe subscription creation failed, just re-throw
    if (!stripeSubscription) {
      throw error;
    }
    // Otherwise, error was already handled in the rollback logic above
    throw error;
  }
}

/**
 * Get subscription for user
 */
export async function getUserSubscription(userId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  return subscription;
}

/**
 * Update subscription (upgrade/downgrade) with rollback handling
 */
export async function updateSubscription(userId: string, newTier: 'starter' | 'professional' | 'enterprise') {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    throw new Error("No active subscription found");
  }

  // Store old values for potential rollback
  const oldTier = subscription.tier;
  const oldPriceId = subscription.stripePriceId;

  // Get new plan
  const [newPlan] = await db
    .select()
    .from(subscriptionPlans)
    .where(and(
      eq(subscriptionPlans.tier, newTier),
      eq(subscriptionPlans.isActive, true)
    ));

  if (!newPlan) {
    throw new Error(`Subscription plan "${newTier}" not found`);
  }

  let stripeSubscription: any;
  let updatedSubscription: any;

  try {
    // Update Stripe subscription
    stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: newPlan.stripePriceId,
        }],
        proration_behavior: 'create_prorations',
      }
    );

    // Update database - if this fails, we need to rollback the Stripe subscription
    try {
      await db
        .update(subscriptions)
        .set({
          stripePriceId: newPlan.stripePriceId,
          tier: newTier,
          status: updatedSubscription.status,
          currentPeriodStart: new Date((updatedSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId));

    } catch (dbError) {
      // Rollback: Revert the Stripe subscription to the old plan
      console.error('Failed to update subscription in database, rolling back Stripe subscription:', dbError);
      try {
        await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            items: [{
              id: stripeSubscription.items.data[0].id,
              price: oldPriceId,
            }],
          }
        );
      } catch (rollbackError) {
        console.error('Failed to rollback Stripe subscription:', rollbackError);
      }
      throw new Error('Failed to update subscription: Database error. Stripe subscription has been reverted.');
    }

    return await getUserSubscription(userId);
  } catch (error) {
    // If Stripe update failed, just re-throw
    if (!updatedSubscription) {
      throw error;
    }
    // Otherwise, error was already handled in the rollback logic above
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true) {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    throw new Error("No active subscription found");
  }

  if (cancelAtPeriodEnd) {
    // Cancel at end of billing period
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));
  } else {
    // Cancel immediately
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));

    // Remove subscription ID from user
    await db
      .update(users)
      .set({ stripeSubscriptionId: null })
      .where(eq(users.id, userId));
  }

  return await getUserSubscription(userId);
}

/**
 * Track usage for metered billing
 */
export async function trackUsage(
  userId: string,
  metricType: 'api_calls' | 'ai_extractions' | 'documents_generated' | 'storage_gb',
  quantity: number,
  metadata?: Record<string, any>
) {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    console.warn(`Usage tracked for user ${userId} without active subscription`);
  }

  await db.insert(usageRecords).values({
    userId,
    subscriptionId: subscription?.id || 'none',
    metricType,
    quantity,
    metadata: metadata || null,
    facilityId: metadata?.facilityId || null,
  });
}

/**
 * Get usage summary for current billing period
 */
export async function getUsageSummary(userId: string) {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return null;
  }

  const usage = await db
    .select()
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        eq(usageRecords.subscriptionId, subscription.id)
      )
    );

  // Aggregate by metric type
  const summary: Record<string, number> = {};
  usage.forEach(record => {
    summary[record.metricType] = (summary[record.metricType] || 0) + record.quantity;
  });

  // Get plan limits
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.tier, subscription.tier));

  return {
    usage: summary,
    limits: plan ? {
      maxFacilities: plan.maxFacilities,
      maxUsers: plan.maxUsers,
      maxStorage: plan.maxStorage,
      aiExtractions: plan.aiExtractions,
    } : null,
    period: {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    },
  };
}

/**
 * Get invoices for user
 */
export async function getUserInvoices(userId: string) {
  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt));
}

/**
 * Create Stripe checkout session for new subscription
 */
export async function createCheckoutSession(
  userId: string,
  tier: 'starter' | 'professional' | 'enterprise',
  successUrl: string,
  cancelUrl: string
) {
  const customerId = await getOrCreateStripeCustomer(userId);

  // Get plan
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(and(
      eq(subscriptionPlans.tier, tier),
      eq(subscriptionPlans.isActive, true)
    ));

  if (!plan) {
    throw new Error(`Subscription plan "${tier}" not found`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
      price: plan.stripePriceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  return session;
}

/**
 * Create billing portal session (for customers to manage subscriptions)
 */
export async function createBillingPortalSession(userId: string, returnUrl: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user?.stripeCustomerId) {
    throw new Error("No Stripe customer found for user");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * List all active subscription plans
 */
export async function getSubscriptionPlans() {
  return await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true));
}
