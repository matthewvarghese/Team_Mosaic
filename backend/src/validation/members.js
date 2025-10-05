const ALLOWED_ROLES = ["owner", "member"];

export function validateMemberAdd(payload) {
  const errors = {};
  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: { payload: "Invalid JSON body" } };
  }
  const { user, role } = payload;
  if (!user || typeof user !== "string" || !user.includes("@")) {
    errors.user = "user (email) is required";
  }
  if (!role || typeof role !== "string" || !ALLOWED_ROLES.includes(role)) {
    errors.role = `role must be one of ${ALLOWED_ROLES.join(", ")}`;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateMemberRole(payload) {
  const errors = {};
  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: { payload: "Invalid JSON body" } };
  }
  const { role } = payload;
  if (!role || typeof role !== "string" || !ALLOWED_ROLES.includes(role)) {
    errors.role = `role must be one of ${ALLOWED_ROLES.join(", ")}`;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
