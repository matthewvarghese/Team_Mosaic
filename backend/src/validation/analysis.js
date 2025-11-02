export function validateGapRequest(body) {
    const errors = {};
    if (!body.requirements || !Array.isArray(body.requirements)) {
      errors.requirements = 'Requirements array is required';
      return { ok: false, errors };
    }
    
    if (body.requirements.length === 0) {
      errors.requirements = 'At least one requirement is needed';
      return { ok: false, errors };
    }
    
    body.requirements.forEach((req, idx) => {
      if (!req.skill || typeof req.skill !== 'string' || !req.skill.trim()) {
        errors[`requirements[${idx}].skill`] = 'Skill name is required';
      }
      
      if (!req.level || typeof req.level !== 'number' || req.level < 1 || req.level > 5) {
        errors[`requirements[${idx}].level`] = 'Level must be between 1 and 5';
      }
      
      if (req.importance) {
        const validImportance = ['critical', 'high', 'medium', 'nice-to-have'];
        if (!validImportance.includes(req.importance)) {
          errors[`requirements[${idx}].importance`] = 'Importance must be one of: critical, high, medium, nice-to-have';
        }
      }
    });
    
    return Object.keys(errors).length > 0 
      ? { ok: false, errors } 
      : { ok: true };
  }