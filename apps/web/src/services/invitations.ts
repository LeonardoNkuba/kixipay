import { apiFetch } from "@/services/api";

export type InvitationPreview = {
  email: string;
  role: "ADMIN" | "TREASURER" | "MEMBER";
  groupId: string;
  groupName: string;
  expiresAt: string;
};

export type Invitation = {
  id: string;
  groupId: string;
  email: string;
  role: "ADMIN" | "TREASURER" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
};

export const createInvitation = (
  token: string,
  input: { groupId: string; email: string; role: "ADMIN" | "TREASURER" | "MEMBER" },
) => {
  return apiFetch<{ message: string }>(
    "/invitations",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
};

export const listInvitations = (token: string, groupId: string) => {
  return apiFetch<Invitation[]>(`/invitations?groupId=${groupId}`, { method: "GET" }, token);
};

export const getInvitationByToken = (inviteToken: string) => {
  return apiFetch<InvitationPreview>(`/invitations/${inviteToken}`, { method: "GET" });
};

export const acceptInvitation = (authToken: string, inviteToken: string) => {
  return apiFetch<{ groupId: string }>(
    `/invitations/${inviteToken}/accept`,
    { method: "POST" },
    authToken,
  );
};
