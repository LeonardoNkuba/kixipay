import { apiFetch } from "./api";

export const resetDemoData = (token: string) =>
  apiFetch<{ message: string }>("/admin/reset-demo", { method: "POST" }, token);
