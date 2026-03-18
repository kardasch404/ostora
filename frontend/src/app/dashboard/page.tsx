"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/auth-slice";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authState = useAppSelector((state) => state.auth);
  const [profileName, setProfileName] = useState("Guest");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiClient.get("/api/v1/users/me");
        setProfileName(response.data?.data?.name || authState.user?.name || "User");
      } catch {
        setProfileName(authState.user?.name || "User");
      }
    };

    loadProfile();
  }, [authState.user?.name]);

  return (
    <main className="page-shell">
      <section className="glass-card p-6 md:p-8">
        <p className="mb-1 text-sm text-[var(--muted)]">CSR authenticated space</p>
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="mb-6">Welcome back, {profileName}.</p>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl bg-white p-4">
            <p className="text-sm text-[var(--muted)]">Applications</p>
            <p className="text-2xl font-bold">12</p>
          </article>
          <article className="rounded-xl bg-white p-4">
            <p className="text-sm text-[var(--muted)]">Interviews</p>
            <p className="text-2xl font-bold">4</p>
          </article>
          <article className="rounded-xl bg-white p-4">
            <p className="text-sm text-[var(--muted)]">Saved Jobs</p>
            <p className="text-2xl font-bold">36</p>
          </article>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/jobs/2" className="ring-focus rounded-lg border border-[var(--foreground)]/25 bg-white px-4 py-2">
            Open Dynamic Job Page
          </Link>
          <button
            type="button"
            className="ring-focus rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white"
            onClick={() => {
              Cookies.remove(TOKEN_COOKIE);
              Cookies.remove(ROLE_COOKIE);
              dispatch(logout());
              router.push("/login");
            }}
          >
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
