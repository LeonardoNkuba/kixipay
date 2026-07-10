"use client";

import { useMemo, useState } from "react";
import { Membership } from "@/types/domain";

type DraftMember = {
  name: string;
  email: string;
  role: "ADMIN" | "TREASURER" | "MEMBER";
};

type LocalMember = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TREASURER" | "MEMBER";
  joinedAt: string;
  isActive: boolean;
  source: "api" | "local";
};

const mapMembership = (membership: Membership): LocalMember => {
  return {
    id: membership.id,
    name: membership.user
      ? `${membership.user.firstName} ${membership.user.lastName}`
      : "Membro",
    email: membership.user?.email || "-",
    role: membership.role,
    joinedAt: membership.joinedAt,
    isActive: membership.isActive,
    source: "api",
  };
};

export const useMembers = (memberships: Membership[] | undefined) => {
  const [localMembers, setLocalMembers] = useState<LocalMember[]>([]);

  const apiMembers = useMemo(() => {
    return (memberships || []).map(mapMembership);
  }, [memberships]);

  const members = useMemo(() => {
    return [...apiMembers, ...localMembers];
  }, [apiMembers, localMembers]);

  const addMember = (payload: DraftMember) => {
    const localMember: LocalMember = {
      id: `local-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      joinedAt: new Date().toISOString(),
      isActive: true,
      source: "local",
    };

    setLocalMembers((prev) => [localMember, ...prev]);
  };

  return {
    members,
    addMember,
  };
};
