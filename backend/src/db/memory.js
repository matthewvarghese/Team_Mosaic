export const profilesByUser = new Map();
export const teams = new Map();
export const teamNames = new Map();
export const skillsByUser = new Map();
export const projects = new Map();

let seq = 1;
export function nextId() {
  return String(seq++);
}

export function getUserSkills(email) {
  if (!skillsByUser.has(email)) skillsByUser.set(email, []);
  return skillsByUser.get(email);
}

export function upsertUserSkill(email, skill) {
  const list = getUserSkills(email);
  const key = skill.name.toLowerCase().trim();
  const existing = list.find(s => s.name.toLowerCase().trim() === key);
  if (existing) {
    existing.name = skill.name.trim();
    existing.level = skill.level;
    return existing;
  }
  const id = nextId();
  const created = { id, name: skill.name.trim(), level: skill.level };
  list.push(created);
  return created;
}

export function updateUserSkill(email, id, patch) {
  const list = getUserSkills(email);
  const s = list.find(x => x.id === id);
  if (!s) return null;
  if (patch.name !== undefined) s.name = patch.name.trim();
  if (patch.level !== undefined) s.level = patch.level;
  return s;
}

export function deleteUserSkill(email, id) {
  const list = getUserSkills(email);
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}

export function getProjectsByTeam(teamId) {
  const teamProjects = [];
  for (const [id, project] of projects.entries()) {
    if (project.teamId === teamId) {
      teamProjects.push(project);
    }
  }
  return teamProjects;
}

export function getProjectById(projectId) {
  return projects.get(projectId) || null;
}

export function createProject(teamId, data) {
  const id = nextId();
  const project = {
    id,
    teamId,
    name: data.name.trim(),
    description: data.description || "",
    requirements: data.requirements, 
    createdAt: new Date().toISOString()
  };
  projects.set(id, project);
  return project;
}

export function updateProject(projectId, data) {
  const project = projects.get(projectId);
  if (!project) return null;
  
  if (data.name !== undefined) project.name = data.name.trim();
  if (data.description !== undefined) project.description = data.description;
  if (data.requirements !== undefined) project.requirements = data.requirements;
  
  return project;
}

export function deleteProject(projectId) {
  return projects.delete(projectId);
}