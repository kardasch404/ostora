"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { extractContactInfo } from "@/lib/contact-extractor";
import { APPLICATION_HISTORY_STORAGE_KEY, SAVED_JOBS_STORAGE_KEY } from "@/lib/application-state";

interface Job {
  id: number;
  job_title: string;
  company_name: string;
  location: string;
  country: string;
  category_name: string;
  website: string;
  stelle_url: string;
  created_at: string;
  content?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    country: ""
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();

    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Job[];
          if (Array.isArray(parsed)) {
            setSavedJobIds(parsed.map((item) => item.id));
          }
        } catch {
          setSavedJobIds([]);
        }
      }

      const historyRaw = window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY);
      if (historyRaw) {
        try {
          const parsed = JSON.parse(historyRaw) as Array<{ jobId?: string; status?: string }>;
          if (Array.isArray(parsed)) {
            setAppliedJobIds(new Set(parsed.filter((item) => item.status === "sent").map((item) => String(item.jobId || "")).filter(Boolean)));
          }
        } catch {
          setAppliedJobIds(new Set());
        }
      }
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [page, search, filters]);

  const loadCategories = async () => {
    try {
      const res = await apiClient.get("/api/v1/jobs/categories");
      setCategories(res.data?.data || []);
    } catch (error) {
      console.error("Failed to load categories");
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
        ...filters
      });
      const res = await apiClient.get(`/api/v1/jobs?${params}`);
      setJobs(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error) {
      console.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const cleanJobHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const remove = [
      "header", "script", "style", "nav",
      ".jp-c-header", ".jp-header-non-eu-v2", ".js-header-data",
      ".mobile-border", ".non-eu-apply-button-v2", ".apply-button-v2",
      ".jp-title__title", ".jp-title__address", "#js-jp-header",
      ".share-button", ".jp-c-header__overlay",
    ];
    remove.forEach((sel) => doc.querySelectorAll(sel).forEach((el) => el.remove()));
    // keep only jp-description and jp-facts sections
    const body = doc.body;
    const kept = body.querySelectorAll(".jp-description, .jp-facts, .jp-media");
    if (kept.length > 0) {
      const wrapper = document.createElement("div");
      kept.forEach((el) => wrapper.appendChild(el.cloneNode(true)));
      return wrapper.innerHTML;
    }
    return body.innerHTML;
  };

  const router = useRouter();

  const handleApply = (job: Job) => {
    if (appliedJobIds.has(String(job.id))) {
      return;
    }

    // Redirect to applications page with job info
    const params = new URLSearchParams({
      jobId: String(job.id),
      title: job.job_title || "",
      company: job.company_name || "",
      location: job.location || "",
    });
    router.push(`/dashboard/applications?${params}`);
  };

  const clearFilters = () => {
    setFilters({ category: "", location: "", country: "" });
    setSearch("");
    setPage(1);
  };

  const toggleSavedJob = (job: Job) => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY);
    let current: Job[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Job[];
        if (Array.isArray(parsed)) {
          current = parsed;
        }
      } catch {
        current = [];
      }
    }

    const exists = current.some((item) => item.id === job.id);
    const next = exists ? current.filter((item) => item.id !== job.id) : [job, ...current];
    window.localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(next));
    setSavedJobIds(next.map((item) => item.id));
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-display-md mb-2">Find Your Dream Job</h1>
        <p className="text-body text-gray-600">Browse thousands of job opportunities</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/saved")}
            className="btn-secondary"
          >
            Saved Jobs
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/fast-apply")}
            className="btn-primary"
          >
            Fast Apply
          </button>
        </div>
      </div>

      <div className="card-flat">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs, companies, keywords..."
                className="input"
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              placeholder="Location"
              className="input"
            />

            <input
              type="text"
              value={filters.country}
              onChange={(e) => handleFilterChange("country", e.target.value)}
              placeholder="Country"
              className="input"
            />
          </div>

          {(filters.category || filters.location || filters.country || search) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-body-sm text-black hover:underline font-semibold"
            >
              Clear all filters
            </button>
          )}
        </form>
      </div>

      <div className="card-flat">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-display-sm">
            {loading ? "Loading..." : `${jobs.length} Jobs Found`}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const alreadyApplied = appliedJobIds.has(String(job.id));

            return (
            <div key={job.id} className="card-flat hover:shadow-soft hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between gap-3">
              <div>
                <h3 className="text-body-sm font-bold text-gray-900 line-clamp-2 mb-1">
                  {job.job_title || "No Title"}
                </h3>
                <p className="text-black font-semibold text-xs mb-2">
                  {job.company_name || "Company"}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate max-w-[120px]">{job.location || "—"}</span>
                  </span>
                  {job.category_name && (
                    <span className="badge text-xs">
                      {job.category_name}
                    </span>
                  )}
                  <span className="text-gray-400">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApply(job)}
                  disabled={alreadyApplied}
                  className={`flex-1 py-2 rounded-button transition-colors font-semibold text-xs ${
                    alreadyApplied
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {alreadyApplied ? "Applied" : "Apply"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSavedJob(job)}
                  className={`py-2 px-3 rounded-button transition-colors font-semibold text-xs border ${
                    savedJobIds.includes(job.id)
                      ? "border-black bg-gray-100 text-black"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {savedJobIds.includes(job.id) ? "Saved" : "Save"}
                </button>
                <button
                  onClick={() => setSelectedJob(job)}
                  className="flex-1 py-2 border border-black text-black rounded-button hover:bg-gray-50 transition-colors font-semibold text-xs"
                >
                  Details
                </button>
              </div>
            </div>
          );
          })}

          {jobs.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-semibold">No jobs found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-button ${
                      page === pageNum
                        ? "bg-black text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="relative bg-white w-full max-w-[48%] h-full shadow-2xl flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">
                  {selectedJob.job_title}
                </h2>
                <p className="text-purple-600 font-semibold text-sm mb-1">
                  {selectedJob.company_name}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {selectedJob.location}{selectedJob.country ? `, ${selectedJob.country}` : ""}
                  </span>
                  {selectedJob.category_name && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                      {selectedJob.category_name}
                    </span>
                  )}
                  <span>{new Date(selectedJob.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedJob.content ? (
                <div
                  className="job-content text-sm text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: cleanJobHtml(selectedJob.content) }}
                />
              ) : (
                <p className="text-gray-400 text-sm">No description available.</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => handleApply(selectedJob)}
                disabled={appliedJobIds.has(String(selectedJob.id))}
                className={`w-full py-3 rounded-lg transition-colors font-bold text-sm ${
                  appliedJobIds.has(String(selectedJob.id))
                    ? "bg-red-500 text-white cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {appliedJobIds.has(String(selectedJob.id)) ? "Already Applied" : "Apply Now"}
              </button>
            </div>
          </div>

          {/* Backdrop - click to close */}
          <div className="flex-1 bg-black/40" onClick={() => setSelectedJob(null)} />
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        /* ── job content prose ── */
        .job-content { font-size: 0.875rem; color: #374151; line-height: 1.7; }
        .job-content p { margin-bottom: 0.75rem; }
        .job-content b, .job-content strong { font-weight: 700; }
        .job-content ul, .job-content ol { padding-left: 1.25rem; margin-bottom: 0.75rem; }
        .job-content li { margin-bottom: 0.3rem; list-style: disc; }
        .job-content a { color: #7c3aed; text-decoration: underline; }
        .job-content img { max-width: 100%; border-radius: 6px; margin: 0.75rem 0; }
        /* ── facts block ── */
        .job-content .jp-facts { background: #f9fafb; border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem; }
        .job-content .jp-facts h3 { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 0.75rem; }
        .job-content .facts-list__facts { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
        .job-content .fact__content { display: flex; align-items: center; gap: 0.5rem; }
        .job-content .fact__content .contents { display: flex; flex-direction: column; }
        .job-content .fact__content .label { font-size: 0.7rem; color: #9ca3af; }
        .job-content .fact__content .value { font-size: 0.8rem; font-weight: 600; color: #111827; }
        .job-content .fact__content .value a { color: #7c3aed; }
        /* ── qa sections ── */
        .job-content .jp-qa { margin-bottom: 1rem; }
        .job-content .jp-qa__question .label { display: block; font-size: 0.8rem; font-weight: 700; color: #111827; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .job-content .jp-qa__answer { color: #374151; }
        /* ── media ── */
        .job-content .jp-media { margin-top: 1rem; }
        .job-content .jp-media img { width: 100%; }
      `}</style>
    </div>
  );
}
