import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { query, transaction } from "../db/helpers.js";
import { validateTeam } from "../validation/teams.js";
import { validateMemberAdd, validateMemberRole } from "../validation/members.js";
import { validateGapRequest } from "../validation/analysis.js";

export const teamRouter = Router();

async function findTeam(id) {
  const result = await query(
    `SELECT t.id, t.name, t.description, t.created_at,
            (
              SELECT json_agg(
                json_build_object('user', tm2.user_email, 'role', tm2.role)
                ORDER BY tm2.role DESC, tm2.user_email
              )
              FROM team_members tm2
              WHERE tm2.team_id = t.id
            ) as members
     FROM teams t
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}
function isOwner(team, email) {
  return !!team.members.find(m => m.user === email && m.role === "owner");
}
function hasMember(team, email) {
  return !!team.members.find(m => m.user === email);
}


teamRouter.post("/teams", requireAuth, async (req, res) => {
  try {
    const v = validateTeam(req.body);
    if (!v.ok) return res.status(422).json({ errors: v.errors });

    const { name, description } = req.body;
    const nameKey = name.toLowerCase().trim();

    const existing = await query(
      'SELECT id FROM teams WHERE LOWER(name) = $1',
      [nameKey]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Team name already exists" });
    }

    const result = await transaction(async (client) => {
      await client.query(
        'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
        [req.user.email]
      );

      const teamResult = await client.query(
        'INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at',
        [name.trim(), description || '']
      );

      const team = teamResult.rows[0];

      await client.query(
        'INSERT INTO team_members (team_id, user_email, role) VALUES ($1, $2, $3)',
        [team.id, req.user.email, 'owner']
      );

      return {
        id: team.id.toString(),
        name: team.name,
        description: team.description,
        members: [{ user: req.user.email, role: 'owner' }]
      };
    });

    return res.status(201).location(`/teams/${result.id}`).json(result);
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

teamRouter.get("/teams/:id", requireAuth, async (req, res) => {
  try {
    const team = await findTeam(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    
    team.id = team.id.toString();
    return res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

teamRouter.get("/teams", requireAuth,async (req, res) => {
  try {
    const teamIdsResult = await query(
      `SELECT DISTINCT team_id FROM team_members WHERE user_email = $1`,
      [req.user.email]
    );

    if (teamIdsResult.rows.length === 0) {
      return res.json({ teams: [] });
    }

    const teamIds = teamIdsResult.rows.map(r => r.team_id);

    const result = await query(
      `SELECT t.id, t.name, t.description, t.created_at,
              (
                SELECT json_agg(
                  json_build_object('user', tm2.user_email, 'role', tm2.role)
                  ORDER BY tm2.role DESC, tm2.user_email
                )
                FROM team_members tm2
                WHERE tm2.team_id = t.id
              ) as members
       FROM teams t
       WHERE t.id = ANY($1)
       ORDER BY t.id DESC`,
      [teamIds]
    );

    const teams = result.rows.map(t => ({
      ...t,
      id: t.id.toString()
    }));

    res.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

teamRouter.get("/teams/:id/members", requireAuth,async (req, res) => {
  try {
    const team = await findTeam(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (!hasMember(team, req.user.email)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.json(team.members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

teamRouter.post("/teams/:id/members", requireAuth, async (req, res) => {
  try {
    const team = await findTeam(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (!isOwner(team, req.user.email)) {
      return res.status(403).json({ error: "Owner role required" });
    }

    const v = validateMemberAdd(req.body);
    if (!v.ok) return res.status(422).json({ errors: v.errors });

    const memberEmail = req.body.user.trim();
    const key = memberEmail.toLowerCase();

    if (team.members.find(m => m.user.toLowerCase() === key)) {
      return res.status(409).json({ error: "User already a member" });
    }

    await query(
      'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [memberEmail]
    );

    await query(
      'INSERT INTO team_members (team_id, user_email, role) VALUES ($1, $2, $3)',
      [req.params.id, memberEmail, req.body.role]
    );

    const updatedTeam = await findTeam(req.params.id);
    return res.status(201).json(updatedTeam.members);
  } catch (error) {
    console.error('Error adding member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

teamRouter.put("/teams/:id/members/:user", requireAuth,async  (req, res) => {
  try {
  const t = await findTeam(req.params.id);
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

  await query(
    'UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_email = $3',
    [req.body.role, req.params.id, m.user]
  );

  return res.json({ user: m.user, role: req.body.role });
} catch (error) {
  console.error('Error updating member:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
});

teamRouter.delete("/teams/:id/members/:user", requireAuth, async (req, res) => {
  try {
    const team = await findTeam(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (!isOwner(team, req.user.email)) {
      return res.status(403).json({ error: "Owner role required" });
    }

    const uname = decodeURIComponent(req.params.user).toLowerCase();
    const member = team.members.find(x => x.user.toLowerCase() === uname);
    if (!member) return res.status(404).json({ error: "Member not found" });

    if (member.role === "owner") {
      const owners = team.members.filter(x => x.role === "owner");
      if (owners.length <= 1) {
        return res.status(409).json({ error: "Cannot remove last owner" });
      }
    }

    await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_email = $2',
      [req.params.id, member.user]
    );

    return res.status(204).end();
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

teamRouter.post("/teams/:id/gap-analysis", requireAuth, async (req, res) => {
  try {
    const team = await findTeam(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    if (!hasMember(team, req.user.email)) {
      return res.status(403).json({ error: "Access denied. Not a team member." });
    }

    let requirements;

    if (req.body.projectId) {
      const projectResult = await query(
        'SELECT id, team_id, name FROM projects WHERE id = $1',
        [req.body.projectId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const project = projectResult.rows[0];
      if (project.team_id.toString() !== req.params.id) {
        return res.status(404).json({ error: "Project not found" });
      }

      const reqResult = await query(
        'SELECT skill, level FROM project_requirements WHERE project_id = $1',
        [req.body.projectId]
      );
      requirements = reqResult.rows;
    } else {
      const v = validateGapRequest(req.body);
      if (!v.ok) return res.status(422).json({ errors: v.errors });
      requirements = req.body.requirements;
    }

    const results = {};
    
    for (const { skill, level: required } of requirements) {
      let sum = 0;
      let count = 0;

      for (const m of team.members) {
        const skillResult = await query(
          'SELECT name, level FROM skills WHERE user_email = $1 AND LOWER(name) = LOWER($2)',
          [m.user, skill]
        );

        if (skillResult.rows.length > 0) {
          sum += skillResult.rows[0].level;
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
  } catch (error) {
    console.error('Error running gap analysis:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});