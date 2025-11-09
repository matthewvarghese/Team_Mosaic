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

  const getImportanceColor = (importance) => {
    switch(importance) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'nice-to-have': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">
          {initialData ? 'Edit Project' : 'Create New Project'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Define your project requirements and skill needs
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            id="projectName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="input"
            placeholder="e.g., Mobile App Redesign"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            id="projectDescription"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
            className="input resize-none"
            placeholder="Brief description of the project"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Skill Requirements <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Define the skills needed for this project
              </p>
            </div>
            <button
              type="button"
              onClick={addRequirement}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Requirement
            </button>
          </div>

          {errors.requirements && (
            <p className="mb-3 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.requirements}
            </p>
          )}

          {formData.requirements.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-gray-500 text-sm font-medium">No requirements added yet</p>
              <p className="text-gray-400 text-xs mt-1">Click "Add Requirement" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.requirements.map((req, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Skill Name
                      </label>
                      <input
                        type="text"
                        value={req.skill}
                        onChange={(e) => updateRequirement(idx, 'skill', e.target.value)}
                        placeholder="e.g., JavaScript"
                        required
                        className="input py-2 text-sm"
                      />
                      {errors[`requirements[${idx}].skill`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`requirements[${idx}].skill`]}
                        </p>
                      )}
                    </div>

                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Level
                      </label>
                      <select
                        value={req.level}
                        onChange={(e) => updateRequirement(idx, 'level', e.target.value)}
                        required
                        className="input py-2 text-sm"
                      >
                        <option value="1">1 - Beginner</option>
                        <option value="2">2 - Novice</option>
                        <option value="3">3 - Intermediate</option>
                        <option value="4">4 - Advanced</option>
                        <option value="5">5 - Expert</option>
                      </select>
                      {errors[`requirements[${idx}].level`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`requirements[${idx}].level`]}
                        </p>
                      )}
                    </div>

                    <div className="col-span-6 md:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Importance
                      </label>
                      <select
                        value={req.importance || 'medium'}
                        onChange={(e) => updateRequirement(idx, 'importance', e.target.value)}
                        required
                        className="input py-2 text-sm"
                      >
                        <option value="critical">🔴 Critical</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="nice-to-have">🟢 Nice-to-have</option>
                      </select>
                    </div>

                    <div className="col-span-12 md:col-span-1 flex md:items-end md:justify-end">
                      <button
                        type="button"
                        onClick={() => removeRequirement(idx)}
                        className="w-full md:w-auto inline-flex items-center justify-center px-3 py-2 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove requirement"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">Importance Levels:</p>
            <ul className="space-y-1 text-xs text-blue-800">
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex-shrink-0">
                  Critical
                </span>
                <span>Project cannot proceed without this skill</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 flex-shrink-0">
                  High
                </span>
                <span>Very important, significant delays if missing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 flex-shrink-0">
                  Medium
                </span>
                <span>Important but workarounds exist</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200 flex-shrink-0">
                  Nice-to-have
                </span>
                <span>Beneficial but not required</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex-1"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Project'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};