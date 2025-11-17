import { Router } from "express";
import { signJwt } from "../auth/jwt.js";
import { getGoogleAuthUrl, getGoogleUserFromCode } from "../auth/google.js";
import { query } from "../db/helpers.js"; 
import { requireAuth } from "../middleware/requireAuth.js";
import { auditMiddleware, AUDIT_ACTIONS, RESOURCE_TYPES } from '../middleware/auditLogger.js';

export const authRouter = Router();

authRouter.post("/auth/login", auditMiddleware(AUDIT_ACTIONS.LOGIN, RESOURCE_TYPES.USER), async (req, res) => {
  try {
    const { providerCode, email } = req.body;

    if (!providerCode) {
      return res.status(400).json({ error: "providerCode is required" });
    }

    if (providerCode !== "dummy") {
      return res.status(400).json({ error: "Use /auth/google for Google OAuth" });
    }

    if (!email) {
      return res.status(400).json({ error: "email is required for dummy auth" });
    }

    await query(
      'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    );

    const token = signJwt({ sub: email, scope: ["user"] });

    return res.status(200).json({
      token,
      provider: "dummy"
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/auth/google", (req, res) => {
  try {
    const authUrl = getGoogleAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: "Failed to initiate Google authentication" });
  }
});

authRouter.get("/auth/google/callback", async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=access_denied`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_code`);
    }

    const googleUser = await getGoogleUserFromCode(code);

    await query(
      'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [googleUser.email]
    );

    const token = signJwt({ sub: googleUser.email, scope: ["user"] });

    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (error) {
    console.error('Google callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

authRouter.get("/auth/me", requireAuth, (req, res) => {
  return res.json({
    me: {
      sub: req.user.email,
      scope: req.user.scope || ["user"]
    }
  });
});

authRouter.get("/auth/providers", (req, res) => {
  const providers = [
    { code: "dummy", name: "Demo Login" },
    { code: "google", name: "Google", authUrl: "/auth/google" }
  ];
  return res.json(providers);
});

authRouter.post("/auth/logout", auditMiddleware(AUDIT_ACTIONS.LOGOUT, RESOURCE_TYPES.USER),(req, res) => {
  return res.status(204).end();
});