"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { addLoanPayment, approveLoan, createLoan, CreateLoanInput } from "@/services/loans";
import { Loan } from "@/types/domain";

export const useLoans = (token: string | null, groupId?: string) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError("Erro ao carregar emprestimos.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestLoan = useCallback(
    async (input: CreateLoanInput) => {
      if (!token) {
        throw new Error("Sessao expirada.");
      }

      const loan = await createLoan(token, input);
      await refresh();
      return loan;
    },
    [token, refresh],
  );

  const decideLoan = useCallback(
    async (loanId: string, approved: boolean) => {
      if (!token) {
        throw new Error("Sessao expirada.");
      }

      const loan = await approveLoan(token, loanId, approved);
      await refresh();
      return loan;
    },
    [token, refresh],
  );

  const payLoan = useCallback(
    async (loanId: string, amount: number) => {
      if (!token) {
        throw new Error("Sessao expirada.");
      }

      const payment = await addLoanPayment(token, loanId, { amount });
      await refresh();
      return payment;
    },
    [token, refresh],
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
