"use client";

import { PropsWithChildren, useEffect } from "react";
import { Provider } from "react-redux";
import Cookies from "js-cookie";
import { ROLE_COOKIE, ROLE_STORAGE_KEY, TOKEN_COOKIE, TOKEN_STORAGE_KEY } from "@/lib/constants";
import { store } from "@/store";
import { hydrateAuth } from "@/store/slices/auth-slice";
import { UserRole } from "@/types/auth";

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    const cookieToken = Cookies.get(TOKEN_COOKIE);
    const cookieRole = Cookies.get(ROLE_COOKIE) as UserRole | undefined;

    const storageToken =
      typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) || undefined : undefined;
    const storageRole =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null)
        : null;

    const token = cookieToken || storageToken;
    const role = cookieRole || storageRole || null;

    if (token) {
      store.dispatch(hydrateAuth({ token, role }));
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
