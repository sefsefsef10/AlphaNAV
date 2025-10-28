import { db } from "../db";
import { covenants, notifications, facilities } from "../../shared/schema";
import { eq, and, lte, sql } from "drizzle-orm";

export interface CovenantCheckResult {
  covenantId: string;
  previousStatus: string;
  newStatus: string;
  currentValue: number;
  thresholdValue: number;
  breachDetected: boolean;
}

/**
 * Calculate covenant status based on current value vs threshold
 */
export function calculateCovenantStatus(
  currentValue: number,
  thresholdValue: number,
  operator: string
): "compliant" | "warning" | "breach" {
  const difference = Math.abs(currentValue - thresholdValue);
  const warningThreshold = thresholdValue * 0.1; // 10% buffer for warning status
  
  let isBreached = false;
  let isNearBreach = false;

  switch (operator) {
    case "less_than":
      isBreached = currentValue >= thresholdValue;
      isNearBreach = currentValue >= (thresholdValue - warningThreshold);
      break;
    case "less_than_equal":
      isBreached = currentValue > thresholdValue;
      isNearBreach = currentValue > (thresholdValue - warningThreshold);
      break;
    case "greater_than":
      isBreached = currentValue <= thresholdValue;
      isNearBreach = currentValue <= (thresholdValue + warningThreshold);
      break;
    case "greater_than_equal":
      isBreached = currentValue < thresholdValue;
      isNearBreach = currentValue < (thresholdValue + warningThreshold);
      break;
    default:
      console.error(`Unknown operator: ${operator}`);
      return "compliant";
  }

  if (isBreached) {
    return "breach";
  } else if (isNearBreach) {
    return "warning";
  } else {
    return "compliant";
  }
}

/**
 * Create notification for covenant breach or warning
 */
async function createCovenantNotification(
  facilityId: string,
  covenantId: string,
  covenantType: string,
  status: string,
  currentValue: number,
  thresholdValue: number,
  userId: string
) {
  const facility = await db.query.facilities.findFirst({
    where: eq(facilities.id, facilityId),
  });

  if (!facility) {
    console.error(`Facility ${facilityId} not found for notification`);
    return;
  }

  const isBreach = status === "breach";
  const title = isBreach
    ? `🚨 Covenant Breach Detected`
    : `⚠️ Covenant Warning`;

  const message = isBreach
    ? `URGENT: ${covenantType} covenant has been breached for facility ${facility.fundName}. Current value: ${currentValue}, Threshold: ${thresholdValue}. Immediate action required.`
    : `Warning: ${covenantType} covenant is approaching breach threshold for facility ${facility.fundName}. Current value: ${currentValue}, Threshold: ${thresholdValue}.`;

  const [notification] = await db.insert(notifications).values({
    userId,
    type: isBreach ? "covenant_breach" : "covenant_warning",
    title,
    message,
    relatedEntityType: "covenant",
    relatedEntityId: covenantId,
    actionUrl: `/operations/covenant-monitoring?facilityId=${facilityId}`,
    isRead: false,
    priority: isBreach ? "urgent" : "high",
  }).returning();

  console.log(`Created ${status} notification for covenant ${covenantId}`);

  // Send multi-channel notifications (SMS, Slack) if configured
  try {
    const { sendNotification } = await import('./notificationDelivery');
    await sendNotification({
      userId,
      message,
      type: isBreach ? "covenant_breach" : "covenant_warning",
      notificationId: notification.id,
      urgency: isBreach ? "high" : "normal",
    });
  } catch (error) {
    console.error('Failed to send multi-channel notifications:', error);
    // Don't throw - notification was created in DB, delivery is best-effort
  }
}

/**
 * Check a single covenant and update its status
 */
export async function checkCovenant(
  covenantId: string,
  currentValue: number,
  userId: string
): Promise<CovenantCheckResult> {
  const covenant = await db.query.covenants.findFirst({
    where: eq(covenants.id, covenantId),
  });

  if (!covenant) {
    throw new Error(`Covenant ${covenantId} not found`);
  }

  const previousStatus = covenant.status;
  const newStatus = calculateCovenantStatus(
    currentValue,
    covenant.thresholdValue,
    covenant.thresholdOperator
  );

  const breachDetected = newStatus === "breach" && previousStatus !== "breach";
  const warningDetected = newStatus === "warning" && previousStatus === "compliant";

  // Calculate next check date based on frequency
  const nextCheckDate = new Date();
  switch (covenant.checkFrequency) {
    case "monthly":
      nextCheckDate.setMonth(nextCheckDate.getMonth() + 1);
      break;
    case "quarterly":
      nextCheckDate.setMonth(nextCheckDate.getMonth() + 3);
      break;
    case "annual":
      nextCheckDate.setFullYear(nextCheckDate.getFullYear() + 1);
      break;
  }

  // Update covenant in database
  await db
    .update(covenants)
    .set({
      currentValue,
      status: newStatus,
      lastChecked: new Date(),
      nextCheckDate,
      breachNotified: breachDetected ? true : covenant.breachNotified,
      updatedAt: new Date(),
    })
    .where(eq(covenants.id, covenantId));

  // Create notification if status worsened
  if (breachDetected || warningDetected) {
    await createCovenantNotification(
      covenant.facilityId,
      covenantId,
      covenant.covenantType,
      newStatus,
      currentValue,
      covenant.thresholdValue,
      userId
    );
  }

  console.log(
    `Covenant ${covenantId} checked: ${previousStatus} → ${newStatus} (value: ${currentValue})`
  );

  return {
    covenantId,
    previousStatus,
    newStatus,
    currentValue,
    thresholdValue: covenant.thresholdValue,
    breachDetected,
  };
}

/**
 * Check all covenants that are due for review
 * This should be run on a schedule (e.g., daily cron job)
 */
export async function checkAllDueCovenants(): Promise<CovenantCheckResult[]> {
  console.log("Starting automated covenant monitoring check...");

  // Find all covenants due for checking (nextCheckDate <= today)
  const dueCovenants = await db.query.covenants.findMany({
    where: lte(covenants.nextCheckDate, new Date()),
  });

  console.log(`Found ${dueCovenants.length} covenants due for checking`);

  const results: CovenantCheckResult[] = [];

  for (const covenant of dueCovenants) {
    try {
      // For automated checks, we need to fetch the current value from the facility
      // In a real system, this would pull from financial data sources
      // For now, we'll use the existing currentValue or skip if null
      
      if (covenant.currentValue === null) {
        console.warn(
          `Covenant ${covenant.id} has no current value set, skipping automated check`
        );
        continue;
      }

      // Find facility owner/operations team member to notify
      const facility = await db.query.facilities.findFirst({
        where: eq(facilities.id, covenant.facilityId),
      });

      if (!facility) {
        console.error(`Facility ${covenant.facilityId} not found, skipping covenant ${covenant.id}`);
        continue;
      }

      // Use facility's assigned user or default to operations team
      // TODO: In production, query users table for operations role
      const userId = facility.id; // Placeholder - should be actual user ID

      const result = await checkCovenant(
        covenant.id,
        covenant.currentValue,
        userId
      );
      
      results.push(result);
    } catch (error) {
      console.error(`Error checking covenant ${covenant.id}:`, error);
    }
  }

  console.log(
    `Automated covenant monitoring complete: ${results.length} covenants checked`
  );

  return results;
}

/**
 * Manual covenant check triggered by user
 */
export async function manualCovenantCheck(
  facilityId: string,
  userId: string
): Promise<CovenantCheckResult[]> {
  console.log(`Manual covenant check for facility ${facilityId} by user ${userId}`);

  const facilityCovenants = await db.query.covenants.findMany({
    where: eq(covenants.facilityId, facilityId),
  });

  const results: CovenantCheckResult[] = [];

  for (const covenant of facilityCovenants) {
    if (covenant.currentValue === null) {
      console.warn(`Covenant ${covenant.id} has no current value, skipping`);
      continue;
    }

    try {
      const result = await checkCovenant(
        covenant.id,
        covenant.currentValue,
        userId
      );
      results.push(result);
    } catch (error) {
      console.error(`Error checking covenant ${covenant.id}:`, error);
    }
  }

  return results;
}

/**
 * Get covenant breach summary for a facility
 */
export async function getCovenantBreachSummary(facilityId: string) {
  const facilityCovenants = await db.query.covenants.findMany({
    where: eq(covenants.facilityId, facilityId),
  });

  const summary = {
    total: facilityCovenants.length,
    compliant: facilityCovenants.filter((c: any) => c.status === "compliant").length,
    warning: facilityCovenants.filter((c: any) => c.status === "warning").length,
    breach: facilityCovenants.filter((c: any) => c.status === "breach").length,
    breaches: facilityCovenants.filter((c: any) => c.status === "breach"),
  };

  return summary;
}
