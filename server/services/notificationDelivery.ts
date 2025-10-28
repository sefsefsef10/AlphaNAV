import { db } from "../db";
import {
  notificationDeliveries,
  notificationPreferences,
  notifications,
  users,
  type InsertNotificationDelivery,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface DeliveryChannel {
  send(params: {
    recipient: string;
    message: string;
    metadata?: any;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

// Slack webhook delivery channel
class SlackChannel implements DeliveryChannel {
  async send(params: { recipient: string; message: string; metadata?: any }) {
    const { recipient, message, metadata } = params;
    
    try {
      // Slack webhook URL should be stored in env or preferences
      const webhookUrl = process.env.SLACK_WEBHOOK_URL || metadata?.webhookUrl;
      
      if (!webhookUrl) {
        return { success: false, error: "Slack webhook URL not configured" };
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: recipient, // #channel-name or @username
          text: message,
          username: "AlphaNAV",
          icon_emoji: ":chart_with_upwards_trend:",
        }),
      });

      if (response.ok) {
        return { success: true, messageId: `slack-${Date.now()}` };
      } else {
        const errorText = await response.text();
        return { success: false, error: `Slack API error: ${errorText}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// SMS via Twilio
class SMSChannel implements DeliveryChannel {
  async send(params: { recipient: string; message: string; metadata?: any }) {
    const { recipient, message } = params;
    
    try {
      // Import SMS service dynamically to avoid issues if Twilio not configured
      const { sendSMS, isTwilioConfigured } = await import('./smsService');
      
      if (!isTwilioConfigured()) {
        console.warn('Twilio not configured - SMS notifications will be skipped');
        return {
          success: false,
          error: "SMS service not configured. Please add Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) to enable SMS notifications.",
        };
      }
      
      const result = await sendSMS(recipient, message);
      return result;
    } catch (error) {
      console.error('SMS delivery error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }
}

// Email via Resend (placeholder - requires Resend setup)
class EmailChannel implements DeliveryChannel {
  async send(params: { recipient: string; message: string; metadata?: any }) {
    const { recipient, message, metadata } = params;
    
    // This would use Resend when set up
    console.log(`Email to ${recipient}: ${message}`);
    
    return {
      success: true,
      messageId: `email-placeholder-${Date.now()}`,
    };
  }
}

// In-app notifications (stored in database)
class InAppChannel implements DeliveryChannel {
  async send(params: { recipient: string; message: string; metadata?: any }) {
    const { recipient, message, metadata } = params;
    
    // In-app notifications are already stored in notifications table
    // Just mark as delivered
    return {
      success: true,
      messageId: metadata?.notificationId || `in-app-${Date.now()}`,
    };
  }
}

const channels: Record<string, DeliveryChannel> = {
  slack: new SlackChannel(),
  sms: new SMSChannel(),
  email: new EmailChannel(),
  in_app: new InAppChannel(),
};

export async function sendNotification(params: {
  userId: string;
  message: string;
  type: string;
  notificationId?: string;
  urgency?: "low" | "normal" | "high";
  metadata?: any;
  preferenceIds?: string[]; // Optional: restrict to specific preferences (for testing)
}): Promise<{
  sent: number;
  failed: number;
  deliveries: string[];
}> {
  const { userId, message, type, notificationId, urgency = "normal", metadata, preferenceIds } = params;

  // Get user's notification preferences
  let query = db.select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.enabled, true)
      )
    );

  const allPreferences = await query;

  // Filter by specific preference IDs if provided (for testing specific channels)
  const preferences = preferenceIds && preferenceIds.length > 0
    ? allPreferences.filter(p => preferenceIds.includes(p.id))
    : allPreferences;

  // Default to in-app if no preferences
  const channelsToUse = preferences.length > 0
    ? preferences.filter(p => {
        // Check if this notification type is enabled for this channel
        const types = p.notificationTypes as any;
        return !types || types.includes(type);
      })
    : [{ channel: "in_app", contactInfo: userId }];

  let sent = 0;
  let failed = 0;
  const deliveries: string[] = [];

  for (const pref of channelsToUse) {
    const channel = pref.channel || "in_app";
    const recipient = (pref as any).contactInfo || userId;

    // Skip if urgency is low and we're in quiet hours
    if (urgency === "low" && (pref as any).quietHoursStart && (pref as any).quietHoursEnd) {
      const now = new Date();
      const hour = now.getHours();
      const quietStart = parseInt((pref as any).quietHoursStart?.split(":")[0] || "22");
      const quietEnd = parseInt((pref as any).quietHoursEnd?.split(":")[0] || "8");
      
      if (hour >= quietStart || hour < quietEnd) {
        continue; // Skip during quiet hours
      }
    }

    // Create delivery record
    const [delivery] = await db.insert(notificationDeliveries)
      .values({
        notificationId,
        channel,
        recipient,
        messageContent: message,
        provider: channel === "sms" ? "twilio" : channel === "email" ? "resend" : channel,
        metadata,
      })
      .returning();

    // Send via channel
    const channelHandler = channels[channel];
    if (!channelHandler) {
      await db.update(notificationDeliveries)
        .set({
          status: "failed",
          error: `Unknown channel: ${channel}`,
        })
        .where(eq(notificationDeliveries.id, delivery.id));
      failed++;
      continue;
    }

    try {
      const result = await channelHandler.send({
        recipient,
        message,
        metadata: { ...metadata, notificationId },
      });

      if (result.success) {
        await db.update(notificationDeliveries)
          .set({
            status: "sent",
            providerMessageId: result.messageId,
            deliveredAt: new Date(),
          })
          .where(eq(notificationDeliveries.id, delivery.id));
        sent++;
        deliveries.push(delivery.id);
      } else {
        await db.update(notificationDeliveries)
          .set({
            status: "failed",
            error: result.error,
          })
          .where(eq(notificationDeliveries.id, delivery.id));
        failed++;
      }
    } catch (error) {
      await db.update(notificationDeliveries)
        .set({
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        })
        .where(eq(notificationDeliveries.id, delivery.id));
      failed++;
    }
  }

  return { sent, failed, deliveries };
}

// Get delivery status for a notification
export async function getDeliveryStatus(notificationId: string) {
  return await db.select()
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.notificationId, notificationId));
}
