export function validateSkill(payload) {
    const errors = {};
    if (!payload || typeof payload !== "object") {
      return { ok: false, errors: { payload: "Invalid JSON body" } };
    }
    const { name, level } = payload;
    if (!name || typeof name !== "string" || !name.trim()) {
      errors.name = "name is required";
    }
    const validLevels = [1,2,3,4,5];
    if (level === undefined || typeof level !== "number" || !validLevels.includes(level)) {
      errors.level = "level must be an integer 1..5";
    }
    return { ok: Object.keys(errors).length === 0, errors };
  }
  
  export function validateSkillPatch(payload) {
    const errors = {};
    if (!payload || typeof payload !== "object") {
      return { ok: false, errors: { payload: "Invalid JSON body" } };
    }
    if (payload.name !== undefined && (typeof payload.name !== "string" || !payload.name.trim())) {
      errors.name = "name, if present, must be a non-empty string";
    }
    if (payload.level !== undefined) {
      const validLevels = [1,2,3,4,5];
      if (typeof payload.level !== "number" || !validLevels.includes(payload.level)) {
        errors.level = "level, if present, must be an integer 1..5";
      }
    }
    return { ok: Object.keys(errors).length === 0, errors };
  }
  