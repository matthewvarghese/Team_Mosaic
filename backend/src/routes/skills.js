import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getUserSkills,
  upsertUserSkill,
  updateUserSkill,
  deleteUserSkill
} from "../db/memory.js";
import { validateSkill, validateSkillPatch } from "../validation/skills.js";

export const skillsRouter = Router();

skillsRouter.get("/me/skills", requireAuth, (req, res) => {
  return res.json(getUserSkills(req.user.email));
});

skillsRouter.post("/me/skills", requireAuth, (req, res) => {
  const v = validateSkill(req.body);
  if (!v.ok) return res.status(422).json({ errors: v.errors });
  const s = upsertUserSkill(req.user.email, req.body);
  return res.status(201).location(`/me/skills/${s.id}`).json(s);
});

skillsRouter.put("/me/skills/:id", requireAuth, (req, res) => {
  const v = validateSkillPatch(req.body);
  if (!v.ok) return res.status(422).json({ errors: v.errors });

  const updated = updateUserSkill(req.user.email, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Skill not found" });
  return res.json(updated);
});

skillsRouter.delete("/me/skills/:id", requireAuth, (req, res) => {
  const ok = deleteUserSkill(req.user.email, req.params.id);
  if (!ok) return res.status(404).json({ error: "Skill not found" });
  return res.status(204).end();
});
