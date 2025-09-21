export function validateProfile(payload) {
    const errors = {};
    if (!payload || typeof payload !== "object") {
      return { ok: false, errors: { payload: "Invalid JSON body" } };
    }
    const { name, title, bio, links } = payload;
    if (!name || typeof name !== "string" || !name.trim()) {
      errors.name = "name is required";
    }
    if (links && !Array.isArray(links)) {
      errors.links = "links must be an array of URLs";
    }
    return { ok: Object.keys(errors).length === 0, errors };
  }