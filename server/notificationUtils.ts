import { db } from "./db";
import { notifications } from "@shared/schema";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  priority?: "low" | "medium" | "high" | "urgent";
  actionUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    title,
    message,
    type = "info",
    priority = "medium",
    actionUrl,
  } = params;

  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        message,
        type,
        priority,
        actionUrl: actionUrl || null,
        isRead: false,
      })
      .returning();

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Helper functions for common notification scenarios

export async function notifyDealStatusChange(
  userId: string,
  dealId: string,
  fundName: string,
  oldStatus: string,
  newStatus: string
) {
  return await createNotification({
    userId,
    title: "Deal Status Updated",
    message: `${fundName} moved from ${oldStatus} to ${newStatus}`,
    type: "info",
    priority: "medium",
    actionUrl: `/advisor/deals/${dealId}`,
  });
}

export async function notifyTermSheetReceived(
  userId: string,
  dealId: string,
  fundName: string,
  lenderName: string
) {
  return await createNotification({
    userId,
    title: "New Term Sheet Received",
    message: `${lenderName} submitted a term sheet for ${fundName}`,
    type: "success",
    priority: "high",
    actionUrl: `/advisor/deals/${dealId}`,
  });
}

export async function notifyLenderResponse(
  userId: string,
  dealId: string,
  fundName: string,
  lenderName: string,
  response: string
) {
  return await createNotification({
    userId,
    title: "Lender Responded",
    message: `${lenderName} ${response} for ${fundName}`,
    type: response === "accepted" ? "success" : "warning",
    priority: "medium",
    actionUrl: `/advisor/deals/${dealId}`,
  });
}

export async function notifyProspectEligibility(
  userId: string,
  prospectId: string,
  fundName: string,
  status: string
) {
  const isEligible = status === "eligible";
  return await createNotification({
    userId,
    title: isEligible ? "Prospect Approved" : "Prospect Needs Review",
    message: isEligible 
      ? `${fundName} has been approved for NAV financing` 
      : `${fundName} requires additional review`,
    type: isEligible ? "success" : "warning",
    priority: isEligible ? "high" : "medium",
    actionUrl: `/gp/prospects/${prospectId}`,
  });
}

export async function notifyCovenantBreach(
  userId: string,
  facilityId: string,
  covenantType: string,
  currentValue: number,
  threshold: number
) {
  return await createNotification({
    userId,
    title: "Covenant Breach Alert",
    message: `${covenantType}: Current ${currentValue} exceeds threshold ${threshold}`,
    type: "error",
    priority: "urgent",
    actionUrl: `/facilities/${facilityId}`,
  });
}

export async function notifyDrawRequestApproved(
  userId: string,
  facilityId: string,
  amount: number
) {
  return await createNotification({
    userId,
    title: "Draw Request Approved",
    message: `Your $${(amount / 1000000).toFixed(1)}M draw request has been approved`,
    type: "success",
    priority: "high",
    actionUrl: `/facilities/${facilityId}`,
  });
}

export async function notifyICApproval(
  userId: string,
  dealId: string,
  fundName: string,
  approved: boolean
) {
  return await createNotification({
    userId,
    title: approved ? "IC Approval Granted" : "IC Decision Required",
    message: approved 
      ? `Investment Committee approved ${fundName}` 
      : `Investment Committee reviewing ${fundName}`,
    type: approved ? "success" : "info",
    priority: "high",
    actionUrl: `/operations/deals/${dealId}`,
  });
}
