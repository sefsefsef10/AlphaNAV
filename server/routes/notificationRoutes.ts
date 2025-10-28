import express from "express";
import { db } from "../db";
import {
  notificationPreferences,
  insertNotificationPreferenceSchema,
  type NotificationPreference,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { isValidPhoneNumber } from "../services/smsService";

const router = express.Router();

// Get user's notification preferences
router.get("/preferences", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const preferences = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    res.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ error: "Failed to fetch notification preferences" });
  }
});

// Create notification preference
router.post("/preferences", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate phone number if channel is SMS
    if (req.body.channel === "sms" && req.body.contactInfo) {
      if (!isValidPhoneNumber(req.body.contactInfo)) {
        return res.status(400).json({
          error: "Invalid phone number format. Please use E.164 format (e.g., +15551234567)",
        });
      }
    }

    const validatedData = insertNotificationPreferenceSchema.parse({
      ...req.body,
      userId,
    });

    const [preference] = await db.insert(notificationPreferences)
      .values(validatedData)
      .returning();

    res.status(201).json(preference);
  } catch (error) {
    console.error("Error creating notification preference:", error);
    res.status(400).json({ error: "Failed to create notification preference" });
  }
});

// Update notification preference
router.patch("/preferences/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Verify ownership
    const [existing] = await db.select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.id, id),
          eq(notificationPreferences.userId, userId)
        )
      );

    if (!existing) {
      return res.status(404).json({ error: "Notification preference not found" });
    }

    // Validate phone number if updating SMS contact info
    if (req.body.contactInfo && (existing.channel === "sms" || req.body.channel === "sms")) {
      if (!isValidPhoneNumber(req.body.contactInfo)) {
        return res.status(400).json({
          error: "Invalid phone number format. Please use E.164 format (e.g., +15551234567)",
        });
      }
    }

    const [updated] = await db.update(notificationPreferences)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating notification preference:", error);
    res.status(400).json({ error: "Failed to update notification preference" });
  }
});

// Delete notification preference
router.delete("/preferences/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Verify ownership
    const [existing] = await db.select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.id, id),
          eq(notificationPreferences.userId, userId)
        )
      );

    if (!existing) {
      return res.status(404).json({ error: "Notification preference not found" });
    }

    await db.delete(notificationPreferences)
      .where(eq(notificationPreferences.id, id));

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting notification preference:", error);
    res.status(500).json({ error: "Failed to delete notification preference" });
  }
});

// Test notification (send test message to verify settings)
router.post("/preferences/:id/test", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    // Verify ownership
    const [preference] = await db.select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.id, id),
          eq(notificationPreferences.userId, userId)
        )
      );

    if (!preference) {
      return res.status(404).json({ error: "Notification preference not found" });
    }

    // Send test notification
    const { sendNotification } = await import("../services/notificationDelivery");
    
    const result = await sendNotification({
      userId,
      message: `Test notification from AlphaNAV. Your ${preference.channel} notifications are configured correctly!`,
      type: "system_test",
      urgency: "normal",
    });

    res.json({
      success: result.sent > 0,
      sent: result.sent,
      failed: result.failed,
      message: result.sent > 0 
        ? "Test notification sent successfully!" 
        : "Failed to send test notification. Please check your settings.",
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

export default router;
