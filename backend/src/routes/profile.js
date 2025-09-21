import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { profilesByUser } from "../db/memory.js";
import { validateProfile } from "../validation/profile.js";
export const profileRouter = Router();


profileRouter.get("/me/profile", requireAuth, (req, res) => {
  const p = profilesByUser.get(req.user.email);
  if (!p) return res.status(404).json({ error: "Profile not found" });
  return res.json(p);
});

// create 
profileRouter.post("/me/profile", requireAuth, (req, res) => {
  const v = validateProfile(req.body);
  if (!v.ok) return res.status(422).json({ errors: v.errors });
  const profile = { ...req.body, owner: req.user.email };
  profilesByUser.set(req.user.email, profile);
  res.status(201).location(`/me/profile`).json(profile);
});

// update
profileRouter.put("/me/profile", requireAuth, (req, res) => {
  const existing = profilesByUser.get(req.user.email);
  if (!existing) return res.status(404).json({ error: "Profile not found" });

  const merged = { ...existing, ...req.body };
  const v = validateProfile(merged);
  if (!v.ok) return res.status(422).json({ errors: v.errors });

  profilesByUser.set(req.user.email, merged);
  res.json(merged);
});