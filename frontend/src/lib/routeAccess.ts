import { UserRole } from "@/types";

export const sanitizeNextPath = (value: string | null | undefined) => {
  const normalized = String(value || "").trim();
  if (!normalized.startsWith("/")) return null;
  if (normalized.startsWith("//")) return null;
  return normalized;
};

export const withNextPath = (
  path: string,
  nextPath: string | null | undefined,
) => {
  const safeNextPath = sanitizeNextPath(nextPath);
  if (!safeNextPath) return path;
  return `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(safeNextPath)}`;
};

export const getLoginHref = (nextPath?: string | null) =>
  withNextPath("/login", nextPath);

export const getDefaultWorkspacePath = (_role?: UserRole | null) =>
  "/dashboard";
