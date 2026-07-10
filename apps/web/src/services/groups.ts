import { Group } from "@/types/domain";
import { apiFetch } from "@/services/api";

export type CreateGroupInput = {
  name: string;
  description?: string;
  monthlyContribution: number;
  maxMembers?: number;
  cycleType: "WEEKLY" | "MONTHLY";
  startDate: string;
  currency?: string;
};

export const getGroups = (token: string) => {
  return apiFetch<Group[]>("/groups", { method: "GET" }, token);
};

export const getGroupById = (token: string, groupId: string) => {
  return apiFetch<Group>(`/groups/${groupId}`, { method: "GET" }, token);
};

export const createGroup = (token: string, input: CreateGroupInput) => {
  return apiFetch<Group>(
    "/groups",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        currency: input.currency || "AOA",
      }),
    },
    token,
  );
};
