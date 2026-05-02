"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

const SAVED_JOBS_STORAGE_KEY = "ostora:savedJobs:v1";

interface SavedJobItem {
  id: number;
  job_title: string;
  company_name: string;
  location: string;
  country?: string;
  content?: string;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function SavedJobsPage() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = safeParse<SavedJobItem[]>(
      window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY),
      [],
    );
    setSavedJobs(Array.isArray(stored) ? stored : []);
    setLoading(false);
  }, []);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return savedJobs;
    return savedJobs.filter(
      (job) =>
        job.job_title?.toLowerCase().includes(q) ||
        job.company_name?.toLowerCase().includes(q) ||
        job.location?.toLowerCase().includes(q),
    );
  }, [savedJobs, query]);

  const removeJob = (jobId: number) => {
    const updated = savedJobs.filter((j) => j.id !== jobId);
    setSavedJobs(updated);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        SAVED_JOBS_STORAGE_KEY,
        JSON.stringify(updated),
      );
    }
  };

  const clearAll = () => {
    setSavedJobs([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SAVED_JOBS_STORAGE_KEY);
    }
  };

  const importRecentJobs = async () => {
    try {
      const res = await apiClient.get("/api/v1/jobs?page=1&limit=50");
      const rawJobs = Array.isArray(res.data?.data) ? res.data.data : [];
      const normalized: SavedJobItem[] = rawJobs
        .map((job: unknown) => {
          const item = (job && typeof job === "object" ? job : {}) as Partial<SavedJobItem>;
          return {
            id: Number(item.id || 0),
            job_title: String(item.job_title || ""),
            company_name: String(item.company_name || ""),
            location: String(item.location || ""),
            country: item.country ? String(item.country) : "",
            content: item.content ? String(item.content) : "",
          };
        })
        .filter(
          (job: SavedJobItem) =>
            Number.isFinite(job.id) &&
            job.id > 0 &&
            job.job_title &&
            job.company_name,
        );

      if (!normalized.length) return;

      const mergedMap = new Map<number, SavedJobItem>();
      savedJobs.forEach((job) => mergedMap.set(job.id, job));
      normalized.forEach((job) => mergedMap.set(job.id, job));
      const merged = Array.from(mergedMap.values());

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          SAVED_JOBS_STORAGE_KEY,
          JSON.stringify(merged),
        );
      }
      setSavedJobs(merged);
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-8 shadow-xl text-white border border-zinc-800 bg-[radial-gradient(circle_at_10%_20%,#27272a_0%,#18181b_35%,#09090b_100%)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 font-semibold">
              Saved Jobs
            </p>
            <h1 className="text-3xl font-bold mt-1">Your Job Collection</h1>
            <p className="text-zinc-300 mt-2">
              Manage saved jobs and send them to Fast Apply when ready.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 min-w-[180px]">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
              Total Saved
            </p>
            <p className="font-semibold text-zinc-100">{savedJobs.length} jobs</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-zinc-800 bg-[linear-gradient(165deg,#151515_0%,#0d0d0d_60%,#060606_100%)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] text-zinc-100">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button
            type="button"
            onClick={() => router.push("/dashboard/jobs")}
            className="inline-flex items-center justify-center rounded-full h-9 px-4 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:bg-zinc-800"
          >
            Find More Jobs
          </button>
          <button
            type="button"
            onClick={importRecentJobs}
            className="inline-flex items-center justify-center rounded-full h-9 px-4 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:bg-zinc-800"
          >
            Import Recent Jobs
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/fast-apply")}
            className="inline-flex items-center justify-center rounded-full h-9 px-4 bg-white text-black text-xs font-semibold hover:bg-zinc-200"
          >
            Open Fast Apply
          </button>
          {savedJobs.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center justify-center rounded-full h-9 px-4 border border-red-800 bg-red-950/40 text-red-300 text-xs font-semibold hover:bg-red-900/60"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Search */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search saved jobs..."
          className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-900 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-white focus:border-zinc-400 transition-all mb-4"
        />

        {/* Job list */}
        {loading ? (
          <div className="border border-zinc-700 bg-zinc-900/70 rounded-xl p-6 text-sm text-zinc-400 text-center">
            Loading saved jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="border border-zinc-700 bg-zinc-900/70 rounded-xl p-6 text-sm text-zinc-300 space-y-4">
            <p>
              No saved jobs found. Save jobs from{" "}
              <Link
                href="/dashboard/jobs"
                className="text-white font-semibold hover:underline"
              >
                Find Jobs
              </Link>
              .
            </p>
            <ol className="text-xs text-zinc-400 list-decimal pl-5 space-y-1">
              <li>Open Find Jobs</li>
              <li>Click Save on one or more jobs</li>
              <li>Come back here to view them</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="w-full border border-zinc-700 bg-zinc-900 rounded-xl p-4 hover:border-zinc-500 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-100">
                      {job.job_title}
                    </p>
                    <p className="text-xs font-semibold text-zinc-300 mt-1">
                      {job.company_name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {job.location}
                      {job.country ? `, ${job.country}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/fast-apply?jobTitle=${encodeURIComponent(job.job_title)}&company=${encodeURIComponent(job.company_name)}`,
                        )
                      }
                      className="text-[11px] px-3 py-1.5 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => removeJob(job.id)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-zinc-600 text-zinc-400 font-semibold hover:border-red-600 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
