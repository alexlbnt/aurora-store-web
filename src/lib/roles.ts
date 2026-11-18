// Quem é administrador: um lugar só para a regra (sem dependências, roda também no middleware).
type MaybeUser = { role?: string | null } | null | undefined;

export const isAdminUser = (user: MaybeUser): boolean => user?.role === "ADMIN";
