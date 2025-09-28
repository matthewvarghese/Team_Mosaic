const MAX_NAME = 60;
const MAX_TITLE = 80;
const MAX_BIO = 500;

function isValidUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateProfile(payload) {
    const errors = {};
    if (!payload || typeof payload !== "object") {
      return { ok: false, errors: { payload: "Invalid JSON body" } };
    }
    const { name, title, bio, links } = payload;

    if (!name || typeof name !== "string" || !name.trim()) {
      errors.name = "name is required";
    }else if (name.trim().length > MAX_NAME) {
    errors.name = `name must be ≤ ${MAX_NAME} chars`;
  }

  if (title && (typeof title !== "string" || title.length > MAX_TITLE)) {
    errors.title = `title must be a string ≤ ${MAX_TITLE} chars`;
  }

  if (bio && (typeof bio !== "string" || bio.length > MAX_BIO)) {
    errors.bio = `bio must be a string ≤ ${MAX_BIO} chars`;
  }

  if (links !== undefined) {
    if (!Array.isArray(links)) {
      errors.links = "links must be an array of URLs";
    } else {
      const bad = links.find(l => typeof l !== 'string' || !isValidUrl(l));
      if (bad) errors.links = `invalid URL: ${bad}`;
    }
  }


    return { ok: Object.keys(errors).length === 0, errors };
  }