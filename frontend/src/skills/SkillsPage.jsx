import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsAPI } from '../lib/api';
import { Link } from 'react-router-dom';
import { SkillRow } from './SkillRow';

export const SkillsPage = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 3 });
  const [errors, setErrors] = useState({});

  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await skillsAPI.list();
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => skillsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['skills']);
      setIsAdding(false);
      setNewSkill({ name: '', level: 3 });
      setErrors({});
    },
    onError: (err) => {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  });

  const handleAdd = (e) => {
    e.preventDefault();
    createMutation.mutate({ 
      name: newSkill.name, 
      level: parseInt(newSkill.level) 
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <nav>
        <Link to="/">← Back to Dashboard</Link>
      </nav>

      <h1>My Skills</h1>

      {skills.length === 0 && !isAdding ? (
        <div>
          <p>You haven't added any skills yet.</p>
          <button onClick={() => setIsAdding(true)}>Add Your First Skill</button>
        </div>
      ) : (
        <>
          <table border="1" style={{ width: '100%', marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Proficiency Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <SkillRow key={skill.id} skill={skill} />
              ))}
            </tbody>
          </table>

          {!isAdding && (
            <button onClick={() => setIsAdding(true)}>Add New Skill</button>
          )}
        </>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px' }}>
          <h3>Add New Skill</h3>
          <div>
            <label htmlFor="skillName">Skill Name *</label>
            <input
              id="skillName"
              type="text"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              required
            />
            {errors.name && <div style={{ color: 'red' }}>{errors.name}</div>}
          </div>

          <div>
            <label htmlFor="skillLevel">Proficiency Level *</label>
            <select
              id="skillLevel"
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
              required
            >
              <option value="1">1 - Beginner</option>
              <option value="2">2 - Novice</option>
              <option value="3">3 - Intermediate</option>
              <option value="4">4 - Advanced</option>
              <option value="5">5 - Expert</option>
            </select>
            {errors.level && <div style={{ color: 'red' }}>{errors.level}</div>}
          </div>

          <button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Adding...' : 'Add Skill'}
          </button>
          <button type="button" onClick={() => { setIsAdding(false); setErrors({}); }}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};