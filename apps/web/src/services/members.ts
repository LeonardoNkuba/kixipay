import { apiFetch } from "@/services/api";
import { Membership } from "@/types/domain";

export const updateMemberRole = (
  token: string,
  groupId: string,
  membershipId: string,
  role: "ADMIN" | "TREASURER" | "MEMBER",
) => {
  return apiFetch<Membership>(
    `/groups/${groupId}/members/${membershipId}`,
    { method: "PATCH", body: JSON.stringify({ role }) },
    token,
  );
};

export const removeMember = (token: string, groupId: string, membershipId: string) => {
  return apiFetch<void>(
    `/groups/${groupId}/members/${membershipId}`,
    { method: "DELETE" },
    token,
  );
};
