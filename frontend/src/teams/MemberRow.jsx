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
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {member.user?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{member.user}</span>
              {isSelf && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  You
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        {isChangingRole && isOwner ? (
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="input py-1.5"
          >
            <option value="owner">Owner</option>
            <option value="member">Member</option>
          </select>
        ) : (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            member.role === 'owner'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {member.role === 'owner' && (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
          </span>
        )}
      </td>

      {isOwner && (
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            {isChangingRole ? (
              <>
                <button
                  onClick={handleUpdateRole}
                  disabled={updateRoleMutation.isPending || newRole === member.role}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updateRoleMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsChangingRole(false);
                    setNewRole(member.role);
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsChangingRole(true)}
                  className="inline-flex items-center px-3 py-1.5 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Change Role
                </button>
                <button
                  onClick={handleRemove}
                  disabled={removeMutation.isPending || !canRemove}
                  title={!canRemove && member.role === 'owner' ? 'Cannot remove last owner' : ''}
                  className="inline-flex items-center px-3 py-1.5 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  {removeMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Removing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </td>
      )}
      
      {!isOwner && (
        <td className="px-6 py-4 text-right">
          <span className="text-sm text-gray-400 italic">Owner only</span>
        </td>
      )}
    </tr>
  );
};