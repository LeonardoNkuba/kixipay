"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
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

  return {
    loans,
    isLoading,
    error,
    refresh,
  };
};
