import { apiFetch } from "@/services/api";
import { Contribution } from "@/types/domain";

export type CreateContributionInput = {
  groupId: string;
  userId?: string;
  amount: number;
  referenceMonth: string;
  status?: "PENDING" | "PAID" | "LATE";
  paidAt?: string;
};

export const createContribution = (token: string, input: CreateContributionInput) => {
  return apiFetch<Contribution>(
    "/contributions",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
};
