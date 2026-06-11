import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { User } from "../../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (input: { username: string; password: string; remember?: boolean }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => localStorage.getItem("ledger_token") || sessionStorage.getItem("ledger_token"));

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: async () => (await api.get<{ user: User }>("/auth/me")).data.user,
    enabled: Boolean(token),
    retry: false
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (token) meQuery.refetch();
    }, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [token, meQuery]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      token,
      isLoading: Boolean(token) && meQuery.isLoading,
      login: async (input) => {
        const response = await api.post<{ token: string; user: User }>("/auth/login", input);
        const storage = input.remember ? localStorage : sessionStorage;
        storage.setItem("ledger_token", response.data.token);
        setToken(response.data.token);
        queryClient.setQueryData(["me", response.data.token], response.data.user);
      },
      logout: () => {
        localStorage.removeItem("ledger_token");
        sessionStorage.removeItem("ledger_token");
        setToken(null);
        queryClient.clear();
      },
      refresh: async () => {
        await meQuery.refetch();
      }
    }),
    [meQuery, queryClient, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
