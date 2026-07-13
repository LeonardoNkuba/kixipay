"use client";

import { useCallback, useEffect, useState } from "react";
import { getReportsSummary } from "@/services/reports";
import { useLanguage } from "@/hooks/useLanguage";
import { ReportsSummary } from "@/types/domain";

const initialState: ReportsSummary = {
  totals: {
    contributionsCollected: 0,
    contributionsPending: 0,
    loansOutstanding: 0,
    loansIssued: 0,
  },
  groups: [],
  trustLeaderboard: [],
};

export const useReports = (token: string | null) => {
  const [summary, setSummary] = useState<ReportsSummary>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const refresh = useCallback(async () => {
    if (!token) {
      setSummary(initialState);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = await getReportsSummary(token);
      setSummary(payload);
    } catch {
      setError(t("reportsPage.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, isLoading, error, refresh };
};
