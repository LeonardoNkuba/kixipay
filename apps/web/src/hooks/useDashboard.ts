"use client";

import { useCallback, useEffect, useState } from "react";
import { getDashboardStats } from "@/services/dashboard";
import { useLanguage } from "@/hooks/useLanguage";
import { DashboardStats } from "@/types/domain";

const initialState: DashboardStats = {
  totalBalance: 0,
  totalMembers: 0,
  monthlyContributions: 0,
  activeLoans: 0,
  groupsCount: 0,
  chartData: [],
  loansByStatus: [],
};

export const useDashboard = (token: string | null) => {
  const [stats, setStats] = useState<DashboardStats>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const refresh = useCallback(async () => {
    if (!token) {
      setStats(initialState);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = await getDashboardStats(token);
      setStats(payload);
    } catch {
      setError(t("dashboard.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, isLoading, error, refresh };
};
