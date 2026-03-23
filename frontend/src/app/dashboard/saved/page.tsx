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
      <div className="bg-gradient-to-r from-[#1d4f91] to-[#2f72c7] rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Saved Jobs</h1>
        <p className="text-[#dce9ff]">Keep your shortlist and move jobs to Fast Applying when ready.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Saved List ({savedJobs.length})</h2>

        {savedJobs.length === 0 && (
          <div className="text-sm text-gray-500">No saved jobs yet. Save jobs from Find Jobs.</div>
        )}

        <div className="space-y-3">
          {savedJobs.map((job) => (
            <div key={job.id} className="border border-gray-100 rounded-lg p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{job.job_title}</p>
                <p className="text-xs text-[#1d4f91] font-medium">{job.company_name}</p>
                <p className="text-xs text-gray-500 mt-1">{job.location}{job.country ? `, ${job.country}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => applyNow(job)} className="px-3 py-2 text-xs rounded-lg bg-[#1d4f91] text-white font-semibold">Apply</button>
                <button type="button" onClick={() => removeSaved(job.id)} className="px-3 py-2 text-xs rounded-lg bg-red-50 text-red-700 font-semibold">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
