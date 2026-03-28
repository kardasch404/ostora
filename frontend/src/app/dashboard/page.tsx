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
        borderColor: "#000000",
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        tension: 0.35,
        fill: true,
      },
      {
        label: "Failed",
        data: overview.failedPerDay,
        borderColor: "#737373",
        backgroundColor: "rgba(115, 115, 115, 0.1)",
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
        backgroundColor: ["#000000", "#737373"],
        borderColor: ["#FFFFFF", "#FFFFFF"],
        borderWidth: 2,
      },
    ],
  };

  const companyData = {
    labels: overview.topCompanies.map((item) => item[0]),
    datasets: [
      {
        label: "Applications",
        data: overview.topCompanies.map((item) => item[1]),
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "#000000",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <p className="text-caption text-gray-400">Dashboard Overview</p>
        <h1 className="mt-2 text-display-md">Welcome back, {userName}</h1>
        <p className="mt-2 text-body text-gray-600">Track your job applications, analytics, and success metrics in one place.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/fast-apply" className="btn-primary">
            Fast Apply
          </Link>
          <Link href="/dashboard/jobs" className="btn-secondary">
            Browse Jobs
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="card-flat">
          <p className="text-caption text-gray-400">Total Applications</p>
          <p className="mt-2 text-display-md">{overview.total}</p>
        </article>
        <article className="card-flat">
          <p className="text-caption text-gray-400">Sent</p>
          <p className="mt-2 text-display-md">{overview.sent}</p>
        </article>
        <article className="card-flat">
          <p className="text-caption text-gray-400">Failed</p>
          <p className="mt-2 text-display-md text-gray-600">{overview.failed}</p>
        </article>
        <article className="card-flat">
          <p className="text-caption text-gray-400">Success Rate</p>
          <p className="mt-2 text-display-md">{overview.successRate}%</p>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <article className="xl:col-span-2 card-flat">
          <h2 className="text-display-sm">7-Day Delivery Trend</h2>
          <p className="text-body-sm text-gray-500 mb-4">Live view of sent vs failed outreach.</p>
          <div style={{ height: '300px', width: '100%', maxHeight: '300px', overflow: 'hidden', position: 'relative' }}>
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { labels: { color: "#525252" } }
                },
                scales: {
                  x: { 
                    ticks: { color: "#737373" }, 
                    grid: { color: "rgba(229, 229, 229, 0.5)" } 
                  },
                  y: { 
                    beginAtZero: true,
                    ticks: { color: "#737373", precision: 0 }, 
                    grid: { color: "rgba(229, 229, 229, 0.5)" } 
                  },
                },
              }}
            />
          </div>
        </article>

        <article className="card-flat">
          <h2 className="text-display-sm">Outcome Funnel</h2>
          <p className="text-body-sm text-gray-500 mb-4">Application delivery health.</p>
          <div style={{ height: '300px', width: '100%', maxHeight: '300px', overflow: 'hidden', position: 'relative' }}>
            <Doughnut
              data={funnelData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { 
                    position: "bottom", 
                    labels: { color: "#525252" } 
                  } 
                },
              }}
            />
          </div>
        </article>
      </section>

      <section className="card-flat">
        <h2 className="text-display-sm">Top Target Companies</h2>
        <p className="text-body-sm text-gray-500 mb-4">Where your applications are concentrated.</p>
        {overview.topCompanies.length === 0 ? (
          <p className="text-body text-gray-500">No company analytics yet. Send a few applications from Fast Apply.</p>
        ) : (
          <div style={{ height: '260px', width: '100%', maxHeight: '260px', overflow: 'hidden', position: 'relative' }}>
            <Bar
              data={companyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { labels: { color: "#525252" } } 
                },
                scales: {
                  x: { 
                    ticks: { color: "#737373" }, 
                    grid: { color: "rgba(229, 229, 229, 0.5)" } 
                  },
                  y: { 
                    beginAtZero: true,
                    ticks: { color: "#737373", precision: 0 }, 
                    grid: { color: "rgba(229, 229, 229, 0.5)" } 
                  },
                },
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
