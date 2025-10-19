import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsAPI } from '../lib/api';
import { Link } from 'react-router-dom';

export const TeamsListPage = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await teamsAPI.list();
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => teamsAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['teams']);
      setIsCreating(false);
      setNewTeam({ name: '', description: '' });
      setErrors({});
      window.location.href = `/teams/${response.data.id}`;
    },
    onError: (err) => {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors({ name: err.response.data.error });
      }
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(newTeam);
  };

  if (isLoading) return <div>Loading teams...</div>;

  const teams = teamsData?.teams || [];

  return (
    <div>
      <nav>
        <Link to="/">← Back to Dashboard</Link>
      </nav>

      <h1>My Teams</h1>

      {teams.length === 0 && !isCreating ? (
        <div>
          <p>You're not part of any teams yet.</p>
          <button onClick={() => setIsCreating(true)}>Create Your First Team</button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            {teams.map((team) => (
              <div key={team.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px' }}>
                <h3>
                  <Link to={`/teams/${team.id}`}>{team.name}</Link>
                </h3>
                {team.description && <p>{team.description}</p>}
                <p>
                  <small>
                    Members: {team.members?.length || 0} | 
                    Your Role: {team.members?.find(m => m.user)?.role || 'member'}
                  </small>
                </p>
              </div>
            ))}
          </div>

          {!isCreating && (
            <button onClick={() => setIsCreating(true)}>Create New Team</button>
          )}
        </>
      )}

      {isCreating && (
        <form onSubmit={handleCreate} style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px' }}>
          <h3>Create New Team</h3>
          <div>
            <label htmlFor="teamName">Team Name *</label>
            <input
              id="teamName"
              type="text"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              required
            />
            {errors.name && <div style={{ color: 'red' }}>{errors.name}</div>}
          </div>

          <div>
            <label htmlFor="teamDescription">Description (optional)</label>
            <textarea
              id="teamDescription"
              value={newTeam.description}
              onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              rows="3"
            />
            {errors.description && <div style={{ color: 'red' }}>{errors.description}</div>}
          </div>

          <button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Team'}
          </button>
          <button type="button" onClick={() => { setIsCreating(false); setErrors({}); }}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};