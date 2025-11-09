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

  const getImportanceColor = (importance) => {
    switch(importance) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'nice-to-have': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImportanceLabel = (importance) => {
    return importance?.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Medium';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Team Projects</h2>
          <p className="text-sm text-gray-600 mt-1">
            {projects?.length || 0} {projects?.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        {isOwner && !isCreating && !editingProject && projects?.length > 0 && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Project
          </button>
        )}
      </div>

      {projects?.length === 0 && !isCreating ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Yet</h3>
          <p className="text-gray-600 mb-6">Create your first project to define skill requirements</p>
          {isOwner && (
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <>
          {!isCreating && !editingProject && projects?.length > 0 && (
            <div className="space-y-4 mb-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
                        {project.description ? (
                          <p className="text-gray-600 text-sm">{project.description}</p>
                        ) : (
                          <p className="text-gray-400 text-sm italic">No description</p>
                        )}
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => setEditingProject(project)}
                            className="inline-flex items-center px-3 py-1.5 text-gray-700 text-sm font-medium rounded-lg hover:bg-white transition-colors border border-gray-300"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(project)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {deleteMutation.isPending ? (
                              <>
                                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Skill Requirements
                    </h4>
                    {project.requirements && project.requirements.length > 0 ? (
                      <div className="space-y-2">
                        {project.requirements.map((req, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{req.skill}</p>
                                <p className="text-sm text-gray-600">Level {req.level}</p>
                              </div>
                            </div>
                            {req.importance && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getImportanceColor(req.importance)}`}>
                                {getImportanceLabel(req.importance)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm italic">No requirements defined</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!isOwner && projects?.length > 0 && !isCreating && !editingProject && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Project permissions</p>
            <p className="text-sm text-blue-700 mt-1">
              Only team owners can create or edit projects. Contact a team owner to make changes.
            </p>
          </div>
        </div>
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