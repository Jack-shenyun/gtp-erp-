import { getLoginUrl, LOCAL_AUTH_USER_KEY } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const isLocalAuthMode =
    !import.meta.env.VITE_OAUTH_PORTAL_URL || !import.meta.env.VITE_APP_ID;

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOCAL_AUTH_USER_KEY);
      }
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const localAuthUser =
      typeof window !== "undefined" && isLocalAuthMode
        ? (() => {
            try {
              const raw = localStorage.getItem(LOCAL_AUTH_USER_KEY);
              return raw ? JSON.parse(raw) : null;
            } catch {
              return null;
            }
          })()
        : null;
    const resolvedUser = meQuery.data ?? localAuthUser ?? null;
    localStorage.setItem("manus-runtime-user-info", JSON.stringify(resolvedUser));
    return {
      user: resolvedUser,
      loading: (isLocalAuthMode ? false : meQuery.isLoading) || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(resolvedUser),
    };
  }, [
    isLocalAuthMode,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
