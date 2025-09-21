export function validateTeam(payload) {
    const errors = {};
    if (!payload || typeof payload !== "object") {
      return { ok: false, errors: { payload: "Invalid JSON body" } };
    }
    const { name, description } = payload;
    if (!name || typeof name !== "string" || !name.trim()) {
      errors.name = "name is required";
    }
    if (description && typeof description !== "string") {
      errors.description = "description must be a string";
    }
    return { ok: Object.keys(errors).length === 0, errors };
  }