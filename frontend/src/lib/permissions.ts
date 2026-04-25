const normalizeRole = (role?: string) => (role || "").replace(/^ROLE_/, "").toUpperCase();

export const canCreateByRole = (role?: string) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole !== "" && normalizedRole !== "GUEST" && normalizedRole !== "USER";
};
