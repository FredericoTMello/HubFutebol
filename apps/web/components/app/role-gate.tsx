"use client";

import type { Group, Role } from "@/lib/types";

const adminRoles: Role[] = ["OWNER", "ADMIN"];

export function RoleGate({
  group,
  userId,
  requireAdmin = false,
  children
}: {
  group: Group | undefined;
  userId: number | undefined;
  requireAdmin?: boolean;
  children: React.ReactNode;
}) {
  if (!group || !userId) return children;
  const membership = group.memberships.find((m) => m.user_id === userId);
  if (!membership) {
    return <div className="rounded-xl bg-white p-4 text-sm text-danger">Voce nao faz parte deste grupo.</div>;
  }
  if (requireAdmin && !adminRoles.includes(membership.role)) {
    return <div className="rounded-xl bg-white p-4 text-sm text-danger">Area restrita a admin/owner.</div>;
  }
  return children;
}
