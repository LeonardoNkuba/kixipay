"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { addLoanPayment, approveLoan, createLoan, CreateLoanInput } from "@/services/loans";
import { useLanguage } from "@/hooks/useLanguage";
import { Loan } from "@/types/domain";

export const useLoans = (token: string | null, groupId?: string) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const refresh = useCallback(async () => {
    if (!token || !groupId) {
      setLoans([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await apiFetch<Loan[]>(`/loans/group/${groupId}`, { method: "GET" }, token);
      setLoans(data);
    } catch {
      setError(t("loansPage.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [groupId, token, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestLoan = useCallback(
    async (input: CreateLoanInput) => {
      if (!token) {
        throw new Error(t("common.sessionExpired"));
      }

      const loan = await createLoan(token, input);
      await refresh();
      return loan;
    },
    [token, refresh, t],
  );

  const decideLoan = useCallback(
    async (loanId: string, approved: boolean) => {
      if (!token) {
        throw new Error(t("common.sessionExpired"));
      }

      const loan = await approveLoan(token, loanId, approved);
      await refresh();
      return loan;
    },
    [token, refresh, t],
  );

  const payLoan = useCallback(
    async (loanId: string, amount: number) => {
      if (!token) {
        throw new Error(t("common.sessionExpired"));
      }

      const payment = await addLoanPayment(token, loanId, { amount });
      await refresh();
      return payment;
    },
    [token, refresh, t],
  );

  return {
    loans,
    isLoading,
    error,
    refresh,
    requestLoan,
    decideLoan,
    payLoan,
  };
};
