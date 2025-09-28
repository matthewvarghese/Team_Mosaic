import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { teams, teamNames, nextId } from "../db/memory.js";
import { validateTeam } from "../validation/teams.js";

export const teamRouter = Router();

teamRouter.post("/teams", requireAuth, (req, res) => {
  const v = validateTeam(req.body);
  if (!v.ok) return res.status(422).json({ errors: v.errors });

  const nameKey = req.body.name.toLowerCase().trim();
  if (teamNames.has(nameKey)) {
    return res.status(409).json({ error: "Team name already exists" });
  }

  const id = nextId();
  const team = {
    id,
    name: req.body.name.trim(),
    description: req.body.description || "",
    members: [{ user: req.user.email, role: "owner" }],
  };
  teams.set(id, team);
  teamNames.set(nameKey, id);
  return res.status(201).location(`/teams/${id}`).json(team);
});

teamRouter.get("/teams/:id", requireAuth, (req, res) => {
  const t = teams.get(req.params.id);
  if (!t) return res.status(404).json({ error: "Team not found" });
  return res.json(t);
});

teamRouter.get("/teams", requireAuth, (req, res) => {
  const mine = [];
  for (const t of teams.values()) {
    if (Array.isArray(t.members) && t.members.some(m => m.user === req.user.email)) {
      mine.push(t);
    }
  }
  mine.sort((a, b) => Number(b.id) - Number(a.id));
  res.json({ teams: mine });
});