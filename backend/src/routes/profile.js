import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { query } from "../db/helpers.js";
import { validateProfile } from "../validation/profile.js";
import { auditMiddleware, AUDIT_ACTIONS, RESOURCE_TYPES } from '../middleware/auditLogger.js';

export const profileRouter = Router();


profileRouter.get("/me/profile", requireAuth,auditMiddleware(AUDIT_ACTIONS.PROFILE_VIEW, RESOURCE_TYPES.PROFILE), async (req, res) => {
  try {
    const result = await query(
      'SELECT email, name, title, bio, location, website FROM profiles WHERE email = $1',
      [req.user.email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// create 
profileRouter.post("/me/profile", requireAuth,auditMiddleware(AUDIT_ACTIONS.PROFILE_CREATE, RESOURCE_TYPES.PROFILE), async (req, res) => {
  try{
    const { owner, ...rest } = req.body || {};
    const v = validateProfile(rest);
    if (!v.ok) return res.status(422).json({ errors: v.errors });

    const existing = await query(
      'SELECT 1 FROM profiles WHERE email = $1',
      [req.user.email]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Profile already exists' });
    }

    await query(
      'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [req.user.email]
    );

    const { name, title, bio, location, website } = rest;
    const result = await query(
      `INSERT INTO profiles (email, name, title, bio, location, website)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING email, name, title, bio, location, website`,
      [req.user.email, name, title || null, bio || null, location || null, website || null]
    );

    const profile = result.rows[0];
    res.status(201).location(`/me/profile`).json(profile);
}   catch (error) {
    console.error('Error creating profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
}
});

// update
profileRouter.put("/me/profile", requireAuth,  auditMiddleware(AUDIT_ACTIONS.PROFILE_UPDATE, RESOURCE_TYPES.PROFILE),async (req, res) => {
  try {
    const existingResult = await query(
      'SELECT email, name, title, bio, location, website FROM profiles WHERE email = $1',
      [req.user.email]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const existing = existingResult.rows[0];
    const { owner, ...rest } = req.body || {};
    const merged = { ...existing, ...rest };
    
    const v = validateProfile(merged);
    if (!v.ok) return res.status(422).json({ errors: v.errors });

    const { name, title, bio, location, website } = merged;
    const result = await query(
      `UPDATE profiles
       SET name = $2, title = $3, bio = $4, location = $5, website = $6, updated_at = CURRENT_TIMESTAMP
       WHERE email = $1
       RETURNING email, name, title, bio, location, website`,
      [req.user.email, name, title || null, bio || null, location || null, website || null]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

profileRouter.delete("/me/profile", requireAuth,auditMiddleware(AUDIT_ACTIONS.PROFILE_DELETE, RESOURCE_TYPES.PROFILE), async (req, res) => {
  try{
    await query('DELETE FROM profiles WHERE email = $1', [req.user.email]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});