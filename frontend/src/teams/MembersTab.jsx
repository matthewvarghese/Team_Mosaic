import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsAPI } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { MemberRow } from './MemberRow';

export const MembersTab = ({ teamId, team }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({ user: '', role: 'member' });
  const [errors, setErrors] = useState({});

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      const response = await teamsAPI.getMembers(teamId);
      return response.data;
    }
  });

  const allMembers = members || team.members || [];
  const currentUserMember = allMembers.find(m => m.user === user?.email);
  const isOwner = currentUserMember?.role === 'owner';

  const ownerCount = allMembers.filter(m => m.role === 'owner').length || 0;
  const isLastOwner = ownerCount === 1;

  const addMemberMutation = useMutation({
    mutationFn: (data) => teamsAPI.addMember(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['team', teamId]);
      queryClient.invalidateQueries(['team-members', teamId]);
      setIsAdding(false);
      setNewMember({ user: '', role: 'member' });
      setErrors({});
    },
    onError: (err) => {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors({ user: err.response.data.error });
      }
    }
  });

  const handleAddMember = (e) => {
    e.preventDefault();
    addMemberMutation.mutate(newMember);
  };

  if (isLoading) return <div>Loading members...</div>;

  return (
    <div>
      <h2>Team Members</h2>

      <table border="1" style={{ width: '100%', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allMembers.map((member) => (
            <MemberRow 
              key={member.user} 
              member={member} 
              teamId={teamId}
              isOwner={isOwner}
              isLastOwner={isLastOwner}
            />
          ))}
        </tbody>
      </table>

      {isOwner ? (
        <>
          {!isAdding && (
            <button onClick={() => setIsAdding(true)}>Add Member</button>
          )}

          {isAdding && (
            <form onSubmit={handleAddMember} style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px' }}>
              <h3>Add Team Member</h3>
              <div>
                <label htmlFor="memberEmail">Member Email *</label>
                <input
                  id="memberEmail"
                  type="email"
                  value={newMember.user}
                  onChange={(e) => setNewMember({ ...newMember, user: e.target.value })}
                  placeholder="member@example.com"
                  required
                />
                {errors.user && <div style={{ color: 'red' }}>{errors.user}</div>}
              </div>

              <div>
                <label htmlFor="memberRole">Role *</label>
                <select
                  id="memberRole"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  required
                >
                  <option value="member">Member</option>
                  <option value="owner">Owner</option>
                </select>
                {errors.role && <div style={{ color: 'red' }}>{errors.role}</div>}
              </div>

              <button type="submit" disabled={addMemberMutation.isPending}>
                {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
              </button>
              <button type="button" onClick={() => { setIsAdding(false); setErrors({}); }}>
                Cancel
              </button>
            </form>
          )}
        </>
      ) : (
        <p><em>Only team owners can add or manage members.</em></p>
      )}
    </div>
  );
};