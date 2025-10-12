import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { teams, teamNames, nextId, skillsByUser, getProjectById} from "../db/memory.js";
import { validateTeam } from "../validation/teams.js";
import { validateMemberAdd, validateMemberRole } from "../validation/members.js";
import { validateGapRequest } from "../validation/analysis.js";

export const teamRouter = Router();

function findTeam(id) {
  return teams.get(id) || null;
}
function isOwner(team, email) {
  return !!team.members.find(m => m.user === email && m.role === "owner");
}
function hasMember(team, email) {
  return !!team.members.find(m => m.user === email);
}


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

teamRouter.get("/teams/:id/members", requireAuth, (req, res) => {
  const t = findTeam(req.params.id);
  if (!t) return res.status(404).json({ error: "Team not found" });
  if (!hasMember(t, req.user.email)) return res.status(403).json({ error: "Forbidden" });
  return res.json(t.members);
});

teamRouter.post("/teams/:id/members", requireAuth, (req, res) => {
  const t = findTeam(req.params.id);
  if (!t) return res.status(404).json({ error: "Team not found" });
  if (!isOwner(t, req.user.email)) return res.status(403).json({ error: "Owner role required" });

  const v = validateMemberAdd(req.body);
  if (!v.ok) return res.status(422).json({ errors: v.errors });

  const key = req.body.user.toLowerCase().trim();
  if (t.members.find(m => m.user.toLowerCase().trim() === key)) {
    return res.status(409).json({ error: "User already a member" });
  }
  t.members.push({ user: req.body.user.trim(), role: req.body.role });
  return res.status(201).json(t.members);
});

teamRouter.put("/teams/:id/members/:user", requireAuth, (req, res) => {
  const t = findTeam(req.params.id);
  if (!t) return res.status(404).json({ error: "Team not found" });
  if (!isOwner(t, req.user.email)) return res.status(403).json({ error: "Owner role required" });

  const v = validateMemberRole(req.body);
  if (!v.ok) return res.status(422).json({ errors: v.errors });

  const uname = decodeURIComponent(req.params.user).toLowerCase();
  const m = t.members.find(x => x.user.toLowerCase() === uname);
  if (!m) return res.status(404).json({ error: "Member not found" });

  if (m.role === "owner" && req.body.role !== "owner") {
    const owners = t.members.filter(x => x.role === "owner");
    if (owners.length <= 1) {
      return res.status(409).json({ error: "Cannot remove last owner" });
    }
  }

  m.role = req.body.role;
  return res.json(m);
});

teamRouter.delete("/teams/:id/members/:user", requireAuth, (req, res) => {
  const t = findTeam(req.params.id);
  if (!t) return res.status(404).json({ error: "Team not found" });
  if (!isOwner(t, req.user.email)) return res.status(403).json({ error: "Owner role required" });

  const uname = decodeURIComponent(req.params.user).toLowerCase();
  const idx = t.members.findIndex(x => x.user.toLowerCase() === uname);
  if (idx === -1) return res.status(404).json({ error: "Member not found" });

  if (t.members[idx].role === "owner") {
    const owners = t.members.filter(x => x.role === "owner");
    if (owners.length <= 1) {
      return res.status(409).json({ error: "Cannot remove last owner" });
    }
  }

  t.members.splice(idx, 1);
  return res.status(204).end();
});

teamRouter.post("/teams/:id/gap-analysis", requireAuth, (req, res) => {
  const t = findTeam(req.params.id);
  if (!t) return res.status(404).json({ error: "Team not found" });

  if (!hasMember(t, req.user.email)) {
    return res.status(403).json({ error: "Access denied. Not a team member." });
  }

  let requirements;

  if (req.body.projectId) {
    const project = getProjectById(req.body.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (project.teamId !== req.params.id) {
      return res.status(404).json({ error: "Project not found" });
    }
    requirements = project.requirements;
  } else {
    const v = validateGapRequest(req.body);
    if (!v.ok) return res.status(422).json({ errors: v.errors });
    requirements = req.body.requirements;
  }

  const results = {};
  for (const { skill, level: required } of requirements) {
    let sum = 0;
    let count = 0;

    for (const m of t.members) {
      const list = skillsByUser.get(m.user) || [];
      const match = list.find(s => s.name.toLowerCase().trim() === skill.toLowerCase().trim());
      if (match) {
        sum += match.level;
        count += 1;
      }
    }

    const average = count === 0 ? 0 : sum / count;
    const gap = Math.max(0, required - average);

    results[skill] = {
      required,
      average: Number(average.toFixed(2)),
      gap: Number(gap.toFixed(2)),
    };
  }

  return res.json(results);
});