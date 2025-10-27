import twilio from "twilio";

/**
 * SMS Service for sending MFA backup codes and notifications
 * Uses Twilio integration for secure credential management
 */

let twilioClient: ReturnType<typeof twilio> | null = null;

/**
 * Initialize Twilio client with credentials
 */
function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured. Please set up the Twilio integration.");
    }

    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

/**
 * Send SMS message via Twilio
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    if (!isTwilioConfigured()) {
      return {
        success: false,
        error: "SMS service not configured. Please contact administrator.",
      };
    }

    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });

    console.log(`SMS sent successfully: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

/**
 * Send MFA backup codes via SMS
 */
export async function sendBackupCodesSMS(
  phoneNumber: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!phoneNumber) {
    return {
      success: false,
      error: "Phone number is required",
    };
  }

  // Format backup codes message
  const message = `AlphaNAV Security: Your MFA backup codes:

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

Save these codes in a secure location. Each code can only be used once.`;

  const result = await sendSMS(phoneNumber, message);
  return result;
}

/**
 * Send single backup code via SMS (for emergency access)
 */
export async function sendSingleBackupCodeSMS(
  phoneNumber: string,
  backupCode: string
): Promise<{ success: boolean; error?: string }> {
  if (!phoneNumber) {
    return {
      success: false,
      error: "Phone number is required",
    };
  }

  const message = `AlphaNAV Security: Your MFA backup code is: ${backupCode}

This code can only be used once. Keep it secure.`;

  const result = await sendSMS(phoneNumber, message);
  return result;
}

/**
 * Send MFA verification code via SMS (for SMS-based 2FA)
 */
export async function sendVerificationCodeSMS(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!phoneNumber) {
    return {
      success: false,
      error: "Phone number is required",
    };
  }

  const message = `AlphaNAV Security: Your verification code is: ${code}

This code will expire in 5 minutes.`;

  const result = await sendSMS(phoneNumber, message);
  return result;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic validation for E.164 format (+1234567890)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}
