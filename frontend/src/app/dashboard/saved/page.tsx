"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SAVED_JOBS_STORAGE_KEY = "ostora:savedJobs:v1";

interface JobItem {
  id: number;
  job_title: string;
  company_name: string;
  location: string;
  country: string;
  created_at?: string;
}

export default function SavedJobsPage() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<JobItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const persist = (jobs: JobItem[]) => {
    setSavedJobs(jobs);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(jobs));
    }
  };

  const removeSaved = (jobId: number) => {
    persist(savedJobs.filter((item) => item.id !== jobId));
  };

  const applyNow = (job: JobItem) => {
    const params = new URLSearchParams({
      jobTitle: job.job_title || "",
      company: job.company_name || "",
    });
    router.push(`/dashboard/fast-apply?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-[radial-gradient(circle_at_12%_12%,#2b2b2b_0%,#151515_50%,#090909_100%)] p-8 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <h1 className="text-3xl font-black tracking-tight mb-2">Saved Jobs</h1>
        <p className="text-zinc-300">Keep your shortlist and move jobs to Fast Applying when ready.</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[linear-gradient(165deg,#141414_0%,#0d0d0d_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.35)] p-6">
        <h2 className="text-lg font-black text-zinc-100 mb-4">Saved List ({savedJobs.length})</h2>

        {savedJobs.length === 0 && (
          <div className="text-sm text-zinc-500">No saved jobs yet. Save jobs from Find Jobs.</div>
        )}

        <div className="space-y-3">
          {savedJobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 flex items-center justify-between gap-3 hover:border-zinc-500 transition-colors">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-100 text-sm truncate">{job.job_title}</p>
                <p className="text-xs text-cyan-300 font-semibold truncate">{job.company_name}</p>
                <p className="text-xs text-zinc-500 mt-1 truncate">{job.location}{job.country ? `, ${job.country}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => applyNow(job)} className="px-3 py-2 text-xs rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">Apply</button>
                <button type="button" onClick={() => removeSaved(job.id)} className="px-3 py-2 text-xs rounded-lg border border-red-900 bg-red-950/40 text-red-300 font-semibold hover:bg-red-900/40 transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
