export function validateProject(body) {
    const errors = {};
    if (!body || typeof body !== "object") {
      return { ok: false, errors: { payload: "Invalid JSON body" } };
    }
  
    const { name, requirements } = body;
  
    if (!name || typeof name !== "string" || !name.trim()) {
      errors.name = "name is required";
    } else if (name.trim().length > 100) {
      errors.name = "name must be 100 characters or less";
    }
  

    if (!Array.isArray(requirements) || requirements.length === 0) {
      errors.requirements = "requirements must be a non-empty array";
    } else {
      for (const [i, r] of requirements.entries()) {
        if (!r || typeof r !== "object") {
          errors[`requirements[${i}]`] = "must be an object";
          continue;
        }
        if (!r.skill || typeof r.skill !== "string" || !r.skill.trim()) {
          errors[`requirements[${i}].skill`] = "skill is required";
        }
        if (!Number.isInteger(r.level) || r.level < 1 || r.level > 5) {
          errors[`requirements[${i}].level`] = "level must be 1–5 integer";
        }
      }
    }
  
    if (body.description !== undefined && typeof body.description !== "string") {
      errors.description = "description must be a string";
    }
  
    return { ok: Object.keys(errors).length === 0, errors };
  }
  
  export function validateProjectUpdate(body) {
    const errors = {};
    if (!body || typeof body !== "object") {
      return { ok: false, errors: { payload: "Invalid JSON body" } };
    }
  
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        errors.name = "name, if present, must be a non-empty string";
      } else if (body.name.trim().length > 100) {
        errors.name = "name must be 100 characters or less";
      }
    }
  
    if (body.description !== undefined && typeof body.description !== "string") {
      errors.description = "description, if present, must be a string";
    }
  
    if (body.requirements !== undefined) {
      if (!Array.isArray(body.requirements) || body.requirements.length === 0) {
        errors.requirements = "requirements, if present, must be a non-empty array";
      } else {
        for (const [i, r] of body.requirements.entries()) {
          if (!r || typeof r !== "object") {
            errors[`requirements[${i}]`] = "must be an object";
            continue;
          }
          if (!r.skill || typeof r.skill !== "string" || !r.skill.trim()) {
            errors[`requirements[${i}].skill`] = "skill is required";
          }
          if (!Number.isInteger(r.level) || r.level < 1 || r.level > 5) {
            errors[`requirements[${i}].level`] = "level must be 1–5 integer";
          }
        }
      }
    }
  
    return { ok: Object.keys(errors).length === 0, errors };
  }