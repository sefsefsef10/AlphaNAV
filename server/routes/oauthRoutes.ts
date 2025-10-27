import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { apiClients, accessTokens } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  generateClientCredentials,
  hashSecret,
  verifySecret,
  generateAccessToken,
  verifyAccessToken,
} from "../oauth/oauthServer";

const router = Router();

// OAuth2 Token Endpoint (Client Credentials Flow)
router.post("/token", async (req: Request, res: Response) => {
  try {
    const { grant_type, client_id, client_secret, scope } = req.body;

    if (grant_type !== "client_credentials") {
      return res.status(400).json({
        error: "unsupported_grant_type",
        error_description: "Only client_credentials grant type is supported",
      });
    }

    if (!client_id || !client_secret) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "client_id and client_secret are required",
      });
    }

    // Find client
    const [client] = await db
      .select()
      .from(apiClients)
      .where(eq(apiClients.clientId, client_id))
      .limit(1);

    if (!client) {
      return res.status(401).json({
        error: "invalid_client",
        error_description: "Invalid client credentials",
      });
    }

    // Verify client secret
    if (!verifySecret(client_secret, client.clientSecret)) {
      return res.status(401).json({
        error: "invalid_client",
        error_description: "Invalid client credentials",
      });
    }

    // Check client status
    if (client.status !== "active") {
      return res.status(403).json({
        error: "unauthorized_client",
        error_description: "Client is not active",
      });
    }

    // Parse requested scopes
    const requestedScopes = scope ? scope.split(" ") : [];
    const allowedScopes = (client.allowedScopes as string[]) || [];

    // Validate scopes
    const invalidScopes = requestedScopes.filter(
      (s: string) => !allowedScopes.includes(s)
    );

    if (invalidScopes.length > 0) {
      return res.status(400).json({
        error: "invalid_scope",
        error_description: `Invalid scopes: ${invalidScopes.join(", ")}`,
      });
    }

    // Generate access token
    const grantedScopes = requestedScopes.length > 0 ? requestedScopes : allowedScopes;
    const accessToken = await generateAccessToken(client_id, grantedScopes);

    return res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 86400, // 24 hours
      scope: grantedScopes.join(" "),
    });
  } catch (error: any) {
    console.error("Token generation error:", error);
    return res.status(500).json({
      error: "server_error",
      error_description: "Internal server error",
    });
  }
});

// Token introspection endpoint
router.post("/introspect", async (req: Request, res: Response) => {
  try {
    const { token, client_id, client_secret } = req.body;

    if (!token || !client_id || !client_secret) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "token, client_id, and client_secret are required",
      });
    }

    // Verify calling client
    const [client] = await db
      .select()
      .from(apiClients)
      .where(eq(apiClients.clientId, client_id))
      .limit(1);

    if (!client || !verifySecret(client_secret, client.clientSecret)) {
      return res.status(401).json({
        error: "invalid_client",
        error_description: "Invalid client credentials",
      });
    }

    // Verify token
    const verification = await verifyAccessToken(token);

    if (!verification.valid) {
      return res.json({ active: false });
    }

    return res.json({
      active: true,
      client_id: verification.clientId,
      scope: verification.scopes?.join(" "),
      exp: Math.floor(Date.now() / 1000) + 86400, // Token expiry
    });
  } catch (error: any) {
    console.error("Token introspection error:", error);
    return res.status(500).json({
      error: "server_error",
      error_description: "Internal server error",
    });
  }
});

// Revoke token
router.post("/revoke", async (req: Request, res: Response) => {
  try {
    const { token, client_id, client_secret } = req.body;

    if (!token || !client_id || !client_secret) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "token, client_id, and client_secret are required",
      });
    }

    // Verify calling client
    const [client] = await db
      .select()
      .from(apiClients)
      .where(eq(apiClients.clientId, client_id))
      .limit(1);

    if (!client || !verifySecret(client_secret, client.clientSecret)) {
      return res.status(401).json({
        error: "invalid_client",
        error_description: "Invalid client credentials",
      });
    }

    // Revoke token
    await db
      .update(accessTokens)
      .set({ revoked: true })
      .where(eq(accessTokens.token, token));

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Token revocation error:", error);
    return res.status(500).json({
      error: "server_error",
      error_description: "Internal server error",
    });
  }
});

export default router;
