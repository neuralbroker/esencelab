/**
 * Role model helpers (extracted from backend/src/index.ts — step 1 of the
 * monolith split documented in docs/ARCHITECTURE.md).
 *
 * Pure functions, no Express/DB/env dependencies: safe to unit-test and reuse
 * from routes, stores, and tests. Canonical roles are what the API speaks
 * (student/recruiter/admin); "employer" is the legacy storage spelling of
 * recruiter and is normalized at the boundary.
 */

export type CanonicalRole = "student" | "recruiter" | "admin";
export type SupportedRole = CanonicalRole | "employer";

export const toStorageRole = (inputRole: unknown): SupportedRole => {
  const normalized = String(inputRole || "")
    .trim()
    .toLowerCase();
  if (normalized === "recruiter") return "employer";
  if (normalized === "employer") return "employer";
  if (normalized === "admin") return "admin";
  return "student";
};

export const toCanonicalRole = (inputRole: unknown): CanonicalRole => {
  const normalized = String(inputRole || "")
    .trim()
    .toLowerCase();
  if (normalized === "recruiter" || normalized === "employer")
    return "recruiter";
  if (normalized === "admin") return "admin";
  return "student";
};

export const roleMatches = (
  inputRole: unknown,
  requiredRole: CanonicalRole,
) => {
  return toCanonicalRole(inputRole) === requiredRole;
};

export const roleFilterMatches = (inputRole: unknown, filterRole: string) => {
  const normalized = filterRole.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "employer" || normalized === "recruiter") {
    return roleMatches(inputRole, "recruiter");
  }
  if (normalized === "admin") return roleMatches(inputRole, "admin");
  if (normalized === "student") return roleMatches(inputRole, "student");
  return false;
};

export const sanitizeUser = (profile: any) => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  role: profile.role,
  canonicalRole: toCanonicalRole(profile.role),
  avatarUrl: profile.avatarUrl,
  isActive: profile.isActive,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});
