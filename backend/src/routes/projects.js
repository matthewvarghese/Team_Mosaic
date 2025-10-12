import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { teams } from "../db/memory.js";
import {
  projects,
  getProjectsByTeam,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from "../db/memory.js";
import { validateProject, validateProjectUpdate } from "../validation/projects.js";

export const projectRouter = Router();

function findTeam(id) {
  return teams.get(id) || null;
}

function isOwner(team, email) {
  return !!team.members.find(m => m.user === email && m.role === "owner");
}

function hasMember(team, email) {
  return !!team.members.find(m => m.user === email);
}

projectRouter.post("/teams/:id/projects", requireAuth, (req, res) => {
  const team = findTeam(req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });

  if (!isOwner(team, req.user.email)) {
    return res.status(403).json({ error: "Owner role required" });
  }

  const v = validateProject(req.body);
  if (!v.ok) return res.status(422).json({ errors: v.errors });

  const project = createProject(req.params.id, req.body);
  return res.status(201).location(`/teams/${req.params.id}/projects/${project.id}`).json(project);
});

projectRouter.get("/teams/:id/projects", requireAuth, (req, res) => {
  const team = findTeam(req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });

  if (!hasMember(team, req.user.email)) {
    return res.status(403).json({ error: "Access denied. Not a team member." });
  }

  const teamProjects = getProjectsByTeam(req.params.id);
  return res.json(teamProjects);
});

projectRouter.get("/teams/:id/projects/:projectId", requireAuth, (req, res) => {
  const team = findTeam(req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });

  if (!hasMember(team, req.user.email)) {
    return res.status(403).json({ error: "Access denied. Not a team member." });
  }

  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });

  if (project.teamId !== req.params.id) {
    return res.status(404).json({ error: "Project not found" });
  }

  return res.json(project);
});

projectRouter.put("/teams/:id/projects/:projectId", requireAuth, (req, res) => {
  const team = findTeam(req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });

  if (!isOwner(team, req.user.email)) {
    return res.status(403).json({ error: "Owner role required" });
  }

  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });

  if (project.teamId !== req.params.id) {
    return res.status(404).json({ error: "Project not found" });
  }

  const v = validateProjectUpdate(req.body);
  if (!v.ok) return res.status(422).json({ errors: v.errors });

  const updated = updateProject(req.params.projectId, req.body);
  return res.json(updated);
});

projectRouter.delete("/teams/:id/projects/:projectId", requireAuth, (req, res) => {
  const team = findTeam(req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });

  if (!isOwner(team, req.user.email)) {
    return res.status(403).json({ error: "Owner role required" });
  }

  const project = getProjectById(req.params.projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });

  if (project.teamId !== req.params.id) {
    return res.status(404).json({ error: "Project not found" });
  }

  deleteProject(req.params.projectId);
  return res.status(204).end();
});