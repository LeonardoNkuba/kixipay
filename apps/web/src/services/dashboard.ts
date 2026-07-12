import { apiFetch } from "@/services/api";
import { DashboardStats } from "@/types/domain";

export const getDashboardStats = (token: string) => {
  return apiFetch<DashboardStats>("/dashboard", { method: "GET" }, token);
};
