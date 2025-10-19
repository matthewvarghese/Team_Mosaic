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

  if (isEditing) {
    return (
      <tr>
        <td>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {errors.name && <div style={{ color: 'red' }}>{errors.name}</div>}
        </td>
        <td>
          <select value={level} onChange={(e) => setLevel(e.target.value)} required>
            <option value="1">1 - Beginner</option>
            <option value="2">2 - Novice</option>
            <option value="3">3 - Intermediate</option>
            <option value="4">4 - Advanced</option>
            <option value="5">5 - Expert</option>
          </select>
          {errors.level && <div style={{ color: 'red' }}>{errors.level}</div>}
        </td>
        <td>
          <button onClick={handleUpdate} disabled={updateMutation.isPending}>
            Save
          </button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{skill.name}</td>
      <td>{skill.level} - {getLevelName(skill.level)}</td>
      <td>
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={handleDelete} disabled={deleteMutation.isPending}>
          Delete
        </button>
      </td>
    </tr>
  );
};

function getLevelName(level) {
  const names = {
    1: 'Beginner',
    2: 'Novice',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert'
  };
  return names[level] || '';
}