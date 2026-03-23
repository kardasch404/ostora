"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { apiClient } from "@/lib/api-client";
import { useAppSelector } from "@/store/hooks";
import { getApplicationHistory } from "@/lib/application-state";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

function groupLast7Days() {
  const labels: string[] = [];
  const keys: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    keys.push(key);
    labels.push(d.toLocaleDateString(undefined, { weekday: "short" }));
  }
  return { labels, keys };
}

export default function DashboardPage() {
  const authState = useAppSelector((state) => state.auth);
  const [userName, setUserName] = useState("User");
  const fallbackName = authState.user?.name || "User";

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await apiClient.get("/api/v1/users/me");
        const serverUser = response.data?.data || {};
        setUserName(serverUser.firstName || serverUser.name || fallbackName);
      } catch {
        setUserName(fallbackName);
      }
    };
    loadUser();
  }, [fallbackName]);

  const history = useMemo(() => getApplicationHistory(), []);

  const overview = useMemo(() => {
    const sent = history.filter((item) => item.status === "sent").length;
    const failed = history.filter((item) => item.status === "failed").length;
    const successRate = sent + failed === 0 ? 0 : Math.round((sent / (sent + failed)) * 100);

    const { labels, keys } = groupLast7Days();
    const sentPerDay = keys.map((key) => history.filter((item) => item.status === "sent" && item.sentAt.slice(0, 10) === key).length);
    const failedPerDay = keys.map((key) => history.filter((item) => item.status === "failed" && item.sentAt.slice(0, 10) === key).length);

    const companies = new Map<string, number>();
    history.forEach((item) => {
      if (!item.company) return;
      companies.set(item.company, (companies.get(item.company) || 0) + 1);
    });

    const topCompanies = [...companies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

    return {
      sent,
      failed,
      total: history.length,
      successRate,
      labels,
      sentPerDay,
      failedPerDay,
      topCompanies,
    };
  }, [history]);

  const trendData = {
    labels: overview.labels,
    datasets: [
      {
        label: "Sent",
        data: overview.sentPerDay,
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34, 211, 238, 0.2)",
        tension: 0.35,
        fill: true,
      },
      {
        label: "Failed",
        data: overview.failedPerDay,
        borderColor: "#fb7185",
        backgroundColor: "rgba(251, 113, 133, 0.12)",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const funnelData = {
    labels: ["Sent", "Failed"],
    datasets: [
      {
        data: [overview.sent, overview.failed],
        backgroundColor: ["#22d3ee", "#fb7185"],
        borderColor: ["#164e63", "#881337"],
        borderWidth: 1,
      },
    ],
  };

  const companyData = {
    labels: overview.topCompanies.map((item) => item[0]),
    datasets: [
      {
        label: "Applications",
        data: overview.topCompanies.map((item) => item[1]),
        backgroundColor: "rgba(168, 85, 247, 0.6)",
        borderColor: "#a855f7",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-[#070f19] via-[#07182d] to-[#1b1238] p-8 text-white shadow-2xl shadow-cyan-500/10">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Command Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back, {userName}</h1>
        <p className="mt-2 text-slate-300">Advanced analytics, chart intelligence, and duplicate-apply protection are now active.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/fast-apply" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#041422] hover:bg-cyan-400">
            Open Fast Apply
          </Link>
          <Link href="/dashboard/jobs" className="rounded-lg border border-fuchsia-300/40 px-4 py-2 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/10">
            Explore Jobs
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="rounded-xl border border-white/10 bg-[#090e1a] p-4">
          <p className="text-xs text-slate-400 uppercase">Total Applications</p>
          <p className="mt-1 text-3xl font-bold text-white">{overview.total}</p>
        </article>
        <article className="rounded-xl border border-cyan-300/20 bg-[#071923] p-4">
          <p className="text-xs text-cyan-200 uppercase">Sent</p>
          <p className="mt-1 text-3xl font-bold text-cyan-300">{overview.sent}</p>
        </article>
        <article className="rounded-xl border border-rose-300/20 bg-[#1a0b17] p-4">
          <p className="text-xs text-rose-200 uppercase">Failed</p>
          <p className="mt-1 text-3xl font-bold text-rose-300">{overview.failed}</p>
        </article>
        <article className="rounded-xl border border-fuchsia-300/20 bg-[#120b1c] p-4">
          <p className="text-xs text-fuchsia-200 uppercase">Success Rate</p>
          <p className="mt-1 text-3xl font-bold text-fuchsia-300">{overview.successRate}%</p>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <article className="xl:col-span-2 rounded-xl border border-white/10 bg-[#080d18] p-5">
          <h2 className="text-lg font-semibold text-white">7-Day Delivery Trend</h2>
          <p className="text-xs text-slate-400 mb-3">Live view of sent vs failed outreach.</p>
          <Line
            data={trendData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: "#cbd5e1" } } },
              scales: {
                x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.15)" } },
                y: { ticks: { color: "#94a3b8", precision: 0 }, grid: { color: "rgba(148,163,184,0.12)" } },
              },
            }}
            height={300}
          />
        </article>

        <article className="rounded-xl border border-white/10 bg-[#080d18] p-5">
          <h2 className="text-lg font-semibold text-white">Outcome Funnel</h2>
          <p className="text-xs text-slate-400 mb-3">Application delivery health.</p>
          <Doughnut
            data={funnelData}
            options={{
              plugins: { legend: { position: "bottom", labels: { color: "#cbd5e1" } } },
            }}
            height={300}
          />
        </article>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#080d18] p-5">
        <h2 className="text-lg font-semibold text-white">Top Target Companies</h2>
        <p className="text-xs text-slate-400 mb-3">Where your applications are concentrated.</p>
        {overview.topCompanies.length === 0 ? (
          <p className="text-sm text-slate-400">No company analytics yet. Send a few applications from Fast Apply.</p>
        ) : (
          <Bar
            data={companyData}
            options={{
              responsive: true,
              plugins: { legend: { labels: { color: "#cbd5e1" } } },
              scales: {
                x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
                y: { ticks: { color: "#94a3b8", precision: 0 }, grid: { color: "rgba(148,163,184,0.1)" } },
              },
            }}
            height={260}
          />
        )}
      </section>
    </div>
  );
}
