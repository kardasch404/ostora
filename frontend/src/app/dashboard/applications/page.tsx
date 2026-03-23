"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  APPLICATION_HISTORY_STORAGE_KEY,
  type AppliedJobRecord,
} from "@/lib/application-state";

export default function ApplicationsPage() {
  const [history, setHistory] = useState<AppliedJobRecord[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const stats = useMemo(() => {
    const sent = history.filter((item) => item.status === "sent").length;
    const failed = history.filter((item) => item.status === "failed").length;
    const companies = new Set(history.map((item) => item.company).filter(Boolean)).size;
    return { sent, failed, total: history.length, companies };
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(APPLICATION_HISTORY_STORAGE_KEY);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-[#07131f] via-[#0b1d2e] to-[#1a1132] p-8 text-white shadow-2xl shadow-cyan-500/10">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Applications Center</p>
        <h1 className="mt-2 text-3xl font-bold">Track Every Application</h1>
        <p className="mt-2 text-sm text-slate-300">Fast Apply moved to its own flow for better control, protection, and speed.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/fast-apply" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#041422] hover:bg-cyan-400">
            Open Fast Apply
          </Link>
          <button type="button" onClick={clearHistory} className="rounded-lg border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10">
            Clear History
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <article className="rounded-xl border border-white/10 bg-[#090e1a] p-4">
          <p className="text-xs text-slate-400 uppercase">Total</p>
          <p className="mt-1 text-3xl font-bold text-white">{stats.total}</p>
        </article>
        <article className="rounded-xl border border-emerald-300/20 bg-[#07150f] p-4">
          <p className="text-xs text-emerald-200 uppercase">Sent</p>
          <p className="mt-1 text-3xl font-bold text-emerald-300">{stats.sent}</p>
        </article>
        <article className="rounded-xl border border-red-300/20 bg-[#190c12] p-4">
          <p className="text-xs text-red-200 uppercase">Failed</p>
          <p className="mt-1 text-3xl font-bold text-red-300">{stats.failed}</p>
        </article>
        <article className="rounded-xl border border-fuchsia-300/20 bg-[#120c1a] p-4">
          <p className="text-xs text-fuchsia-200 uppercase">Companies</p>
          <p className="mt-1 text-3xl font-bold text-fuchsia-300">{stats.companies}</p>
        </article>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#070a14] p-5">
        <h2 className="text-lg font-bold text-white">History</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No applications yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {history.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-white">{item.jobTitle}</p>
                  <p className="text-xs text-slate-400">{item.company} | {item.contactEmail} | {new Date(item.sentAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === "sent" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
