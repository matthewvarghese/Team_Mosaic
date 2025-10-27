import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateSkill } from "../validation/skills.js";
import { query } from "../db/helpers.js";

export const skillsRouter = Router();

skillsRouter.get("/me/skills", requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, level FROM skills WHERE user_email = $1 ORDER BY name',
      [req.user.email]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

skillsRouter.post("/me/skills", requireAuth, async (req, res) => {
  try {
    const v = validateSkill(req.body);
    if (!v.ok) return res.status(422).json({ errors: v.errors });

    const { name, level } = req.body;

    await query(
      'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [req.user.email]
    );

    const existing = await query(
      'SELECT id FROM skills WHERE user_email = $1 AND LOWER(name) = LOWER($2)',
      [req.user.email, name]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Skill already exists',
        errors: { name: 'You already have this skill' }
      });
    }

    const result = await query(
      'INSERT INTO skills (user_email, name, level) VALUES ($1, $2, $3) RETURNING id, name, level',
      [req.user.email, name, level]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

skillsRouter.put("/me/skills/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query(
      'SELECT id, name, level FROM skills WHERE id = $1 AND user_email = $2',
      [id, req.user.email]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const merged = { ...existing.rows[0], ...req.body };
    const v = validateSkill(merged);
    if (!v.ok) return res.status(422).json({ errors: v.errors });

    const { name, level } = merged;

    const duplicate = await query(
      'SELECT id FROM skills WHERE user_email = $1 AND LOWER(name) = LOWER($2) AND id != $3',
      [req.user.email, name, id]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Skill name already exists',
        errors: { name: 'You already have a skill with this name' }
      });
    }

    const result = await query(
      'UPDATE skills SET name = $1, level = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_email = $4 RETURNING id, name, level',
      [name, level, id, req.user.email]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

skillsRouter.delete("/me/skills/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await query(
      'DELETE FROM skills WHERE id = $1 AND user_email = $2',
      [id, req.user.email]
    );

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});