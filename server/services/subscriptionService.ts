import { db } from "../db";
import { subscriptions, subscriptionPlans, facilities, users } from "@shared/schema";
import { eq, and, count } from "drizzle-orm";

/**
 * Subscription Service - Manage feature gates and tier limits
 */

export interface TierLimits {
  maxFacilities: number;
  maxUsers: number;
  maxStorage: number;
  aiExtractions: number;
  canUpgrade: boolean;
  nextTier?: string;
}

export interface UsageStatus {
  currentUsage: number;
  limit: number;
  percentage: number;
  exceeded: boolean;
  approaching: boolean; // 80%+ of limit
}

export interface SubscriptionCheck {
  allowed: boolean;
  message?: string;
  currentTier: string;
  limits: TierLimits;
  usage?: UsageStatus;
}

/**
 * Get user's current subscription and tier limits
 */
export async function getUserSubscription(userId: string) {
  const [subscription] = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      tier: subscriptions.tier,
      status: subscriptions.status,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      planName: subscriptionPlans.name,
      planTier: subscriptionPlans.tier,
      maxFacilities: subscriptionPlans.maxFacilities,
      maxUsers: subscriptionPlans.maxUsers,
      maxStorage: subscriptionPlans.maxStorage,
      aiExtractions: subscriptionPlans.aiExtractions,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.tier, subscriptionPlans.tier))
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  return subscription;
}

/**
 * Get current facility count for a user
 */
export async function getUserFacilityCount(userId: string): Promise<number> {
  // Count facilities created by this user (GP) or managed by operations
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user[0]) {
    return 0;
  }

  let facilityCount = 0;

  if (user[0].role === "gp") {
    // For GP users, count facilities where they are the gpUserId
    const result = await db
      .select({ count: count() })
      .from(facilities)
      .where(eq(facilities.gpUserId, userId));
    facilityCount = result[0]?.count || 0;
  } else if (user[0].role === "operations" || user[0].role === "admin") {
    // For operations/admin, they manage all facilities (no limit for internal users)
    return 0; // No limit enforcement for operations/admin
  }

  return facilityCount;
}

/**
 * Check if user can create a new facility based on their subscription tier
 */
export async function canCreateFacility(userId: string): Promise<SubscriptionCheck> {
  const subscription = await getUserSubscription(userId);
  
  // If no active subscription, use free tier limits (0 facilities)
  if (!subscription) {
    return {
      allowed: false,
      message: "No active subscription. Please subscribe to create facilities.",
      currentTier: "none",
      limits: {
        maxFacilities: 0,
        maxUsers: 0,
        maxStorage: 0,
        aiExtractions: 0,
        canUpgrade: true,
        nextTier: "starter",
      },
      usage: {
        currentUsage: 0,
        limit: 0,
        percentage: 0,
        exceeded: true,
        approaching: false,
      },
    };
  }

  const currentCount = await getUserFacilityCount(userId);
  const limit = subscription.maxFacilities;
  
  // Enterprise tier has "unlimited" represented as -1 or very high number
  const isUnlimited = limit < 0 || limit >= 9999;
  
  // Calculate percentage only for limited tiers
  const percentage = (!isUnlimited && limit > 0) ? (currentCount / limit) * 100 : 0;
  
  // Normalize unlimited for UI display
  const displayLimit = isUnlimited ? 0 : limit;

  const usage: UsageStatus = {
    currentUsage: currentCount,
    limit: displayLimit,
    percentage: percentage,
    exceeded: !isUnlimited && currentCount >= limit,
    approaching: !isUnlimited && percentage >= 80,
  };

  const allowed = isUnlimited || currentCount < limit;

  const tierOrder = ["starter", "professional", "enterprise"];
  const currentTierIndex = tierOrder.indexOf(subscription.planTier);
  const nextTier = currentTierIndex < tierOrder.length - 1 
    ? tierOrder[currentTierIndex + 1] 
    : undefined;

  return {
    allowed,
    message: allowed 
      ? undefined 
      : `Facility limit reached. Your ${subscription.planName} plan allows ${limit} facilities. Please upgrade to create more.`,
    currentTier: subscription.planTier,
    limits: {
      maxFacilities: isUnlimited ? -1 : subscription.maxFacilities, // Keep -1 for API clarity
      maxUsers: subscription.maxUsers,
      maxStorage: subscription.maxStorage,
      aiExtractions: subscription.aiExtractions,
      canUpgrade: !!nextTier,
      nextTier,
    },
    usage,
  };
}

/**
 * Check if user approaching their facility limit (80%+)
 */
export async function shouldShowUpgradePrompt(userId: string): Promise<{
  show: boolean;
  message?: string;
  tierName?: string;
  nextTier?: string;
}> {
  const check = await canCreateFacility(userId);
  
  if (!check.usage) {
    return { show: false };
  }

  // Never show upgrade prompt for unlimited tiers
  if (check.limits.maxFacilities === -1) {
    return { show: false };
  }

  // Show upgrade prompt if approaching limit (80%+) or exceeded
  if (check.usage.approaching || check.usage.exceeded) {
    return {
      show: true,
      message: check.usage.exceeded
        ? `You've reached your facility limit (${check.usage.currentUsage}/${check.usage.limit}). Upgrade to add more facilities.`
        : `You're using ${check.usage.currentUsage} of ${check.usage.limit} facilities (${Math.round(check.usage.percentage)}%). Consider upgrading soon.`,
      tierName: check.currentTier,
      nextTier: check.limits.nextTier,
    };
  }

  return { show: false };
}
