"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/services/api";
import { AuthUser } from "@/types/domain";

type LoginPayload = {
  token: string;
  user: AuthUser;
};

type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
};

const TOKEN_KEY = "kixipay_token";
const USER_KEY = "kixipay_user";

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);

    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser) as AuthUser);
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }

    apiFetch<AuthUser>("/auth/me", { method: "GET" }, storedToken)
      .then((me) => {
        if (me) {
          setUser(me);
          localStorage.setItem(USER_KEY, JSON.stringify(me));
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const payload = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }).then(async (response) => {
      const body = (await response.json().catch(() => ({}))) as {
        token?: string;
        user?: AuthUser;
        message?: string;
      };

      if (!response.ok || !body.token || !body.user) {
        throw new Error(body.message || "Nao foi possivel iniciar sessao.");
      }

      return body as LoginPayload;
    });

    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
    return payload;
  };

  const register = async (input: RegisterInput) => {
    const payload = await fetch(`${getApiBaseUrl()}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }).then(async (response) => {
      const body = (await response.json().catch(() => ({}))) as {
        token?: string;
        user?: AuthUser;
        message?: string;
      };

      if (!response.ok || !body.token || !body.user) {
        throw new Error(body.message || "Nao foi possivel criar a conta.");
      }

      return body as LoginPayload;
    });

    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
    return payload;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [isLoading, token, user],
  );
};