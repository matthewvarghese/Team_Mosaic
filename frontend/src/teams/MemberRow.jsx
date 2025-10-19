import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsAPI } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

export const MemberRow = ({ member, teamId, isOwner, isLastOwner }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [newRole, setNewRole] = useState(member.role);

  const updateRoleMutation = useMutation({
    mutationFn: (role) => teamsAPI.updateMember(teamId, member.user, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['team', teamId]);
      queryClient.invalidateQueries(['team-members', teamId]);
      setIsChangingRole(false);
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  });

  const removeMutation = useMutation({
    mutationFn: () => teamsAPI.removeMember(teamId, member.user),
    onSuccess: () => {
      queryClient.invalidateQueries(['team', teamId]);
      queryClient.invalidateQueries(['team-members', teamId]);
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  });

  const handleUpdateRole = () => {
    updateRoleMutation.mutate(newRole);
  };

  const handleRemove = () => {
    if (window.confirm(`Remove ${member.user} from the team?`)) {
      removeMutation.mutate();
    }
  };

  const isSelf = user?.email === member.user;
  const canRemove = isOwner && !(member.role === 'owner' && isLastOwner);

  return (
    <tr>
      <td>{member.user} {isSelf && <em>(You)</em>}</td>
      <td>
        {isChangingRole && isOwner ? (
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            <option value="owner">Owner</option>
            <option value="member">Member</option>
          </select>
        ) : (
          <strong>{member.role}</strong>
        )}
      </td>
      <td>
        {isOwner && (
          <>
            {isChangingRole ? (
              <>
                <button 
                  onClick={handleUpdateRole} 
                  disabled={updateRoleMutation.isPending || newRole === member.role}
                >
                  Save
                </button>
                <button onClick={() => { setIsChangingRole(false); setNewRole(member.role); }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsChangingRole(true)}>
                Change Role
              </button>
            )}
            <button 
              onClick={handleRemove} 
              disabled={removeMutation.isPending || !canRemove}
              title={!canRemove && member.role === 'owner' ? 'Cannot remove last owner' : ''}
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove'}
            </button>
          </>
        )}
        {!isOwner && <em>Owner only</em>}
      </td>
    </tr>
  );
};