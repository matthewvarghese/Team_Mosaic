export function validateGapRequest(body) {
    const errors = {};
    if (!body || typeof body !== "object") {
      return { ok: false, errors: { payload: "Invalid JSON body" } };
    }
    const { requirements } = body;
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
    return { ok: Object.keys(errors).length === 0, errors };
  }