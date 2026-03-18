"use client";

import { PropsWithChildren, useEffect } from "react";
import { Provider } from "react-redux";
import Cookies from "js-cookie";
import { ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/constants";
import { store } from "@/store";
import { hydrateAuth } from "@/store/slices/auth-slice";
import { UserRole } from "@/types/auth";

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    const token = Cookies.get(TOKEN_COOKIE);
    const role = (Cookies.get(ROLE_COOKIE) as UserRole | undefined) || null;

    if (token) {
      store.dispatch(hydrateAuth({ token, role }));
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
