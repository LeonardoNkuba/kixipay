import { apiFetch } from "@/services/api";
import { ReportsSummary } from "@/types/domain";

export const getReportsSummary = (token: string) => {
  return apiFetch<ReportsSummary>("/reports/summary", { method: "GET" }, token);
};
