"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiClientError } from "@/services/api";
import { createGroup, CreateGroupInput, getGroups } from "@/services/groups";
import { useLanguage } from "@/hooks/useLanguage";
import { Group } from "@/types/domain";

export const useGroups = (token: string | null) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const { t } = useLanguage();

  const refresh = useCallback(async () => {
    if (!token) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await getGroups(token);
      setGroups(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t("groupsList.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  const addGroup = useCallback(
    async (payload: CreateGroupInput) => {
      if (!token) {
        throw new Error(t("common.sessionExpired"));
      }

      const created = await createGroup(token, payload);
      setGroups((prev) => [created, ...prev]);
      return created;
    },
    [token, t],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    groups,
    isLoading,
    error,
    refresh,
    addGroup,
  };
};
