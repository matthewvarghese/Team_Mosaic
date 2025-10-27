import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { query, transaction } from "../db/helpers.js";
import { validateProject } from "../validation/projects.js";

export const projectsRouter = Router();

async function isTeamMember(teamId, email) {
  const result = await query(
    'SELECT 1 FROM team_members WHERE team_id = $1 AND user_email = $2',
    [teamId, email]
  );
  return result.rows.length > 0;
}

async function isTeamOwner(teamId, email) {
  const result = await query(
    'SELECT role FROM team_members WHERE team_id = $1 AND user_email = $2',
    [teamId, email]
  );
  return result.rows.length > 0 && result.rows[0].role === 'owner';
}

projectsRouter.get("/teams/:teamId/projects", requireAuth, async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!(await isTeamMember(teamId, req.user.email))) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const result = await query(
      `SELECT p.id, p.name, p.description, p.created_at,
              COALESCE(
                json_agg(
                  json_build_object('skill', pr.skill, 'level', pr.level)
                  ORDER BY pr.skill
                ) FILTER (WHERE pr.id IS NOT NULL),
                '[]'
              ) as requirements
       FROM projects p
       LEFT JOIN project_requirements pr ON p.id = pr.project_id
       WHERE p.team_id = $1
       GROUP BY p.id, p.name, p.description, p.created_at
       ORDER BY p.created_at DESC`,
      [teamId]
    );

    const projects = result.rows.map(p => ({
      ...p,
      id: p.id.toString()
    }));

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

projectsRouter.get("/teams/:teamId/projects/:id", requireAuth, async (req, res) => {
  try {
    const { teamId, id } = req.params;

    if (!(await isTeamMember(teamId, req.user.email))) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const result = await query(
      `SELECT p.id, p.name, p.description, p.created_at,
              COALESCE(
                json_agg(
                  json_build_object('skill', pr.skill, 'level', pr.level)
                  ORDER BY pr.skill
                ) FILTER (WHERE pr.id IS NOT NULL),
                '[]'
              ) as requirements
       FROM projects p
       LEFT JOIN project_requirements pr ON p.id = pr.project_id
       WHERE p.id = $1 AND p.team_id = $2
       GROUP BY p.id, p.name, p.description, p.created_at`,
      [id, teamId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = {
      ...result.rows[0],
      id: result.rows[0].id.toString()
    };

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

projectsRouter.post("/teams/:teamId/projects", requireAuth, async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!(await isTeamOwner(teamId, req.user.email))) {
      return res.status(403).json({ error: 'Owner role required' });
    }

    const v = validateProject(req.body);
    if (!v.ok) return res.status(422).json({ errors: v.errors });

    const { name, description, requirements } = req.body;

    const result = await transaction(async (client) => {
      const projectResult = await client.query(
        'INSERT INTO projects (team_id, name, description) VALUES ($1, $2, $3) RETURNING id, name, description, created_at',
        [teamId, name, description || '']
      );

      const project = projectResult.rows[0];

      if (requirements && requirements.length > 0) {
        for (const req of requirements) {
          await client.query(
            'INSERT INTO project_requirements (project_id, skill, level) VALUES ($1, $2, $3)',
            [project.id, req.skill, req.level]
          );
        }
      }

      return {
        ...project,
        id: project.id.toString(),
        requirements: requirements || []
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

projectsRouter.put("/teams/:teamId/projects/:id", requireAuth, async (req, res) => {
  try {
    const { teamId, id } = req.params;

    if (!(await isTeamOwner(teamId, req.user.email))) {
      return res.status(403).json({ error: 'Owner role required' });
    }

    const v = validateProject(req.body);
    if (!v.ok) return res.status(422).json({ errors: v.errors });

    const { name, description, requirements } = req.body;

    const result = await transaction(async (client) => {
      const projectResult = await client.query(
        'UPDATE projects SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND team_id = $4 RETURNING id, name, description, created_at',
        [name, description || '', id, teamId]
      );

      if (projectResult.rows.length === 0) {
        throw new Error('Project not found');
      }

      const project = projectResult.rows[0];

      await client.query(
        'DELETE FROM project_requirements WHERE project_id = $1',
        [id]
      );

      if (requirements && requirements.length > 0) {
        for (const req of requirements) {
          await client.query(
            'INSERT INTO project_requirements (project_id, skill, level) VALUES ($1, $2, $3)',
            [id, req.skill, req.level]
          );
        }
      }

      return {
        ...project,
        id: project.id.toString(),
        requirements: requirements || []
      };
    });

    res.json(result);
  } catch (error) {
    if (error.message === 'Project not found') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

projectsRouter.delete("/teams/:teamId/projects/:id", requireAuth, async (req, res) => {
  try {
    const { teamId, id } = req.params;

    if (!(await isTeamOwner(teamId, req.user.email))) {
      return res.status(403).json({ error: 'Owner role required' });
    }

    await query(
      'DELETE FROM projects WHERE id = $1 AND team_id = $2',
      [id, teamId]
    );

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});