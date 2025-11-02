import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { ProjectEditor } from './ProjectEditor';

export const ProjectsTab = ({ teamId, team }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['team-projects', teamId],
    queryFn: async () => {
      const response = await projectsAPI.list(teamId);
      return response.data;
    }
  });

  const currentUserMember = team.members?.find(m => m.user === user?.email);
  const isOwner = currentUserMember?.role === 'owner';

  const createMutation = useMutation({
    mutationFn: (data) => projectsAPI.create(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-projects', teamId]);
      setIsCreating(false);
    },
    onError: (err) => {
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ projectId, data }) => projectsAPI.update(teamId, projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-projects', teamId]);
      setEditingProject(null);
    },
    onError: (err) => {
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId) => projectsAPI.delete(teamId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-projects', teamId]);
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  });

  const handleCreate = (data, setErrors) => {
    createMutation.mutate(data, {
      onError: (err) => {
        if (err.response?.data?.errors) {
          setErrors(err.response.data.errors);
        }
      }
    });
  };

  const handleUpdate = (data, setErrors) => {
    updateMutation.mutate(
      { projectId: editingProject.id, data },
      {
        onError: (err) => {
          if (err.response?.data?.errors) {
            setErrors(err.response.data.errors);
          }
        }
      }
    );
  };

  const handleDelete = (project) => {
    if (window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(project.id);
    }
  };

  const getImportanceEmoji = (importance) => {
    switch(importance) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'nice-to-have': return '🟢';
      default: return '🟡';
    }
  };

  if (isLoading) return <div>Loading projects...</div>;

  return (
    <div>
      <h2>Team Projects</h2>

      {projects.length === 0 && !isCreating ? (
        <div>
          <p>No projects created yet.</p>
          {isOwner && (
            <button onClick={() => setIsCreating(true)}>Create First Project</button>
          )}
        </div>
      ) : (
        <>
          {!isCreating && !editingProject && (
            <div style={{ marginBottom: '20px' }}>
              {projects.map((project) => (
                <div key={project.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
                  <h3>{project.name}</h3>
                  {project.description && <p>{project.description}</p>}
                  
                  <h4>Requirements:</h4>
                  <ul>
                    {project.requirements.map((req, idx) => (
                      <li key={idx}>
                        <strong>{req.skill}</strong> - Level {req.level}
                        {req.importance && (
                          <span style={{ marginLeft: '10px', fontSize: '14px' }}>
                            {getImportanceEmoji(req.importance)} {req.importance}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {isOwner && (
                    <div>
                      <button onClick={() => setEditingProject(project)}>Edit</button>
                      <button 
                        onClick={() => handleDelete(project)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isOwner && (
                <button onClick={() => setIsCreating(true)}>Create New Project</button>
              )}
            </div>
          )}
        </>
      )}

      {!isOwner && projects.length > 0 && (
        <p><em>Only team owners can create or edit projects.</em></p>
      )}

      {isCreating && (
        <ProjectEditor
          onSave={handleCreate}
          onCancel={() => setIsCreating(false)}
          isSaving={createMutation.isPending}
        />
      )}

      {editingProject && (
        <ProjectEditor
          initialData={editingProject}
          onSave={handleUpdate}
          onCancel={() => setEditingProject(null)}
          isSaving={updateMutation.isPending}
        />
      )}
    </div>
  );
};