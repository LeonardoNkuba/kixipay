"use client";

import { useMemo } from "react";
import { Membership } from "@/types/domain";

type DisplayMember = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TREASURER" | "MEMBER";
  joinedAt: string;
  isActive: boolean;
};

const mapMembership = (membership: Membership): DisplayMember => {
  return {
    id: membership.id,
    name: membership.user
      ? `${membership.user.firstName} ${membership.user.lastName}`
      : "Membro",
    email: membership.user?.email || "-",
    role: membership.role,
    joinedAt: membership.joinedAt,
    isActive: membership.isActive,
  };
};

export const useMembers = (memberships: Membership[] | undefined) => {
  const members = useMemo(() => {
    return (memberships || []).map(mapMembership);
  }, [memberships]);

  return { members };
};
