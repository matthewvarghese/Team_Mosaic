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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            {allMembers.length} {allMembers.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        {isOwner && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      {allMembers.length > 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                {isOwner && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
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
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 mb-6">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-500 font-medium">No members yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first team member to get started</p>
        </div>
      )}

      {isAdding && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Add Team Member</h3>
            <p className="text-sm text-gray-600 mt-1">Invite a new member to join this team</p>
          </div>

          <form onSubmit={handleAddMember} className="p-6 space-y-6">
            <div>
              <label htmlFor="memberEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Member Email <span className="text-red-500">*</span>
              </label>
              <input
                id="memberEmail"
                type="email"
                value={newMember.user}
                onChange={(e) => setNewMember({ ...newMember, user: e.target.value })}
                placeholder="member@example.com"
                required
                className="input"
              />
              {errors.user && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.user}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="memberRole" className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="memberRole"
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                required
                className="input"
              >
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Owners can manage team members and settings
              </p>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={addMemberMutation.isPending}
                className="btn-primary flex-1"
              >
                {addMemberMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  'Add Member'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setErrors({});
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!isOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Member permissions</p>
            <p className="text-sm text-blue-700 mt-1">
              Only team owners can add or manage members. Contact a team owner to invite new members.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};