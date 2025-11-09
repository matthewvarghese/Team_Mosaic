import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsAPI } from '../lib/api';

export const SkillRow = ({ skill }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(skill.name);
  const [level, setLevel] = useState(skill.level);
  const [errors, setErrors] = useState({});

  const updateMutation = useMutation({
    mutationFn: (data) => skillsAPI.update(skill.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['skills']);
      setIsEditing(false);
      setErrors({});
    },
    onError: (err) => {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => skillsAPI.delete(skill.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['skills']);
    }
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMutation.mutate({ name, level: parseInt(level) });
  };

  const handleDelete = () => {
    if (window.confirm(`Delete skill "${skill.name}"?`)) {
      deleteMutation.mutate();
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      1: 'bg-gray-100 text-gray-700',
      2: 'bg-blue-100 text-blue-700',
      3: 'bg-purple-100 text-purple-700',
      4: 'bg-green-100 text-green-700',
      5: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
    };
    return colors[level] || colors[3];
  };

  const getLevelName = (level) => {
    const names = {
      1: 'Beginner',
      2: 'Novice',
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert'
    };
    return names[level] || '';
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-6 py-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input w-full"
            placeholder="Skill name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </p>
          )}
        </td>
        <td className="px-6 py-4">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            required
            className="input w-full"
          >
            <option value="1">1 - Beginner</option>
            <option value="2">2 - Novice</option>
            <option value="3">3 - Intermediate</option>
            <option value="4">4 - Advanced</option>
            <option value="5">5 - Expert</option>
          </select>
          {errors.level && (
            <p className="mt-1 text-sm text-red-600">{errors.level}</p>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
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
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span className="font-medium text-gray-900">{skill.name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(skill.level)}`}>
            {skill.level} - {getLevelName(skill.level)}
          </span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-2 h-6 rounded-full ${
                  i <= skill.level
                    ? 'bg-gradient-to-t from-blue-500 to-purple-500'
                    : 'bg-gray-200'
                }`}
              ></div>
            ))}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-1.5 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={handleDelete}
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
      </td>
    </tr>
  );
};