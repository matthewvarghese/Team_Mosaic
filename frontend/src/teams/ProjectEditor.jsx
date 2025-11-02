import { useState } from 'react';

export const ProjectEditor = ({ initialData, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState(
    initialData || { name: '', description: '', requirements: [] }
  );
  const [errors, setErrors] = useState({});

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, { skill: '', level: 3, importance: 'medium' }]
    });
  };

  const updateRequirement = (index, field, value) => {
    const updated = [...formData.requirements];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, requirements: updated });
  };

  const removeRequirement = (index) => {
    const updated = formData.requirements.filter((_, i) => i !== index);
    setFormData({ ...formData, requirements: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.requirements.length === 0) {
      newErrors.requirements = 'At least one requirement is needed';
    }

    formData.requirements.forEach((req, idx) => {
      if (!req.skill.trim()) {
        newErrors[`requirements[${idx}].skill`] = 'Skill name is required';
      }
      if (!req.level || req.level < 1 || req.level > 5) {
        newErrors[`requirements[${idx}].level`] = 'Level must be 1-5';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const sanitized = {
      ...formData,
      requirements: formData.requirements.map(r => ({
        skill: r.skill.trim(),
        level: parseInt(r.level),
        importance: r.importance || 'medium'
      }))
    };

    onSave(sanitized, setErrors);
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '20px' }}>
      <h3>{initialData ? 'Edit Project' : 'Create New Project'}</h3>

      <div>
        <label htmlFor="projectName">Project Name *</label>
        <input
          id="projectName"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        {errors.name && <div style={{ color: 'red' }}>{errors.name}</div>}
      </div>

      <div>
        <label htmlFor="projectDescription">Description</label>
        <textarea
          id="projectDescription"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows="3"
        />
        {errors.description && <div style={{ color: 'red' }}>{errors.description}</div>}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Requirements</h4>
        {errors.requirements && <div style={{ color: 'red' }}>{errors.requirements}</div>}
        
        {formData.requirements.length === 0 ? (
          <p><em>No requirements added yet</em></p>
        ) : (
          <table border="1" style={{ width: '100%', marginBottom: '10px' }}>
            <thead>
              <tr>
                <th>Skill</th>
                <th>Required Level</th>
                <th>Importance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.requirements.map((req, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      value={req.skill}
                      onChange={(e) => updateRequirement(idx, 'skill', e.target.value)}
                      placeholder="e.g., JavaScript"
                      required
                    />
                    {errors[`requirements[${idx}].skill`] && (
                      <div style={{ color: 'red', fontSize: '12px' }}>
                        {errors[`requirements[${idx}].skill`]}
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      value={req.level}
                      onChange={(e) => updateRequirement(idx, 'level', e.target.value)}
                      required
                    >
                      <option value="1">1 - Beginner</option>
                      <option value="2">2 - Novice</option>
                      <option value="3">3 - Intermediate</option>
                      <option value="4">4 - Advanced</option>
                      <option value="5">5 - Expert</option>
                    </select>
                    {errors[`requirements[${idx}].level`] && (
                      <div style={{ color: 'red', fontSize: '12px' }}>
                        {errors[`requirements[${idx}].level`]}
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      value={req.importance || 'medium'}
                      onChange={(e) => updateRequirement(idx, 'importance', e.target.value)}
                      required
                    >
                      <option value="critical">🔴 Critical</option>
                      <option value="high">🟠 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="nice-to-have">🟢 Nice-to-have</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" onClick={() => removeRequirement(idx)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button type="button" onClick={addRequirement}>
          Add Requirement
        </button>

        <div style={{ 
          marginTop: '15px', 
          padding: '12px', 
          background: '#f9fafb', 
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          <strong>Importance Levels:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li><strong>🔴 Critical:</strong> Project cannot proceed without this skill</li>
            <li><strong>🟠 High:</strong> Very important, significant delays if missing</li>
            <li><strong>🟡 Medium:</strong> Important but workarounds exist</li>
            <li><strong>🟢 Nice-to-have:</strong> Beneficial but not required</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Project'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};