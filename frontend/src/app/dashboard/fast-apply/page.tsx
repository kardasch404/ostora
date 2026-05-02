"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { APPLICATION_HISTORY_STORAGE_KEY, FAST_APPLY_QUEUE_STORAGE_KEY, type AppliedJobRecord } from "@/lib/application-state";

const SAVED_JOBS_STORAGE_KEY = "ostora:savedJobs:v1";
const FAST_APPLY_DRAFT_STORAGE_KEY = "ostora:fastApply:draft:v1";
const SEND_APPLICATION_ENDPOINT = "/api/v1/users/emails/send";

interface Bundle {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    filename: string;
    fileSize: number;
    type: string;
  }>;
}

interface SavedJobItem {
  id: number;
  job_title: string;
  company_name: string;
  location: string;
  country?: string;
  content?: string;
}

interface FastApplyDraft {
  selectedJobIds: string[];
  template: string;
  sendFrom: string;
  fallbackEmail: string;
  subject: string;
  message: string;
  attachments: Record<string, boolean>;
}

const defaultSubject = "Application for {position_title} at {company_name}";
const defaultMessage = `Dear {hr_name},

I am writing to apply for the position of {position_title} at {company_name}.

Please find my documents attached.

Best regards`;
const FAST_APPLY_MAX_PARALLEL_SENDS = 10;

const defaultDraft: FastApplyDraft = {
  selectedJobIds: [],
  template: "",
  sendFrom: "zz2406143@gmail.com",
  fallbackEmail: "",
  subject: defaultSubject,
  message: defaultMessage,
  attachments: {},
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch {
    return fallback;
  }
}

function FastApplyContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [allowReselectSentJobs, setAllowReselectSentJobs] = useState(false);
  const [applicationHistory, setApplicationHistory] = useState<AppliedJobRecord[]>([]);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const [sendStats, setSendStats] = useState({ sent: 0, failed: 0 });
  const [sendLogs, setSendLogs] = useState<Array<{ id: string; jobTitle: string; company: string; status: "sent" | "failed" }>>([]);
  const [sendSummary, setSendSummary] = useState("");

  const [draft, setDraft] = useState<FastApplyDraft>(defaultDraft);

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(false);

  const loadSelectableJobs = async () => {
    if (typeof window === "undefined") return [] as SavedJobItem[];

    const localJobs = safeParse<SavedJobItem[]>(window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY), []);
    if (Array.isArray(localJobs) && localJobs.length > 0) {
      return localJobs;
    }

    try {
      const res = await apiClient.get("/api/v1/jobs?page=1&limit=50");
      const apiJobs = Array.isArray(res.data?.data) ? res.data.data : [];
      const normalized: SavedJobItem[] = apiJobs
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
        .filter((job: SavedJobItem) => Number.isFinite(job.id) && job.id > 0 && job.job_title && job.company_name);

      if (normalized.length > 0) {
        window.localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(normalized));
      }

      return normalized;
    } catch {
      return [] as SavedJobItem[];
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialize = async () => {
      const queued = safeParse<SavedJobItem[]>(window.localStorage.getItem(FAST_APPLY_QUEUE_STORAGE_KEY), []);
      const hasQueue = Array.isArray(queued) && queued.length > 0;

      const jobs = hasQueue ? queued : await loadSelectableJobs();
      setSavedJobs(Array.isArray(jobs) ? jobs : []);

      const history = safeParse<AppliedJobRecord[]>(window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY), []);
      setApplicationHistory(Array.isArray(history) ? history : []);

      const persistedDraft = safeParse<FastApplyDraft>(window.localStorage.getItem(FAST_APPLY_DRAFT_STORAGE_KEY), defaultDraft);
      const safeDraft = {
        ...defaultDraft,
        ...persistedDraft,
        selectedJobIds: Array.isArray(persistedDraft.selectedJobIds) ? persistedDraft.selectedJobIds : [],
        attachments: persistedDraft.attachments && typeof persistedDraft.attachments === "object" ? persistedDraft.attachments : {},
      };

      if (hasQueue) {
        safeDraft.selectedJobIds = queued.map((item) => String(item.id));
      }

      const queryJobTitle = searchParams.get("jobTitle") || "";
      const queryCompany = searchParams.get("company") || "";

      if (queryJobTitle || queryCompany) {
        const match = (jobs || []).find((item) => {
          const titleOk = queryJobTitle ? item.job_title === queryJobTitle : true;
          const companyOk = queryCompany ? item.company_name === queryCompany : true;
          return titleOk && companyOk;
        });

        if (match) {
          const id = String(match.id);
          if (!safeDraft.selectedJobIds.includes(id)) {
            safeDraft.selectedJobIds = [id, ...safeDraft.selectedJobIds];
          }
        }
      }

      setDraft(safeDraft);
      setStep(safeDraft.selectedJobIds.length > 0 ? 2 : 1);
    };

    initialize();
  }, [searchParams]);

  useEffect(() => {
    loadBundles();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldRemove =
      draft.selectedJobIds.length === 0 &&
      !draft.template &&
      draft.sendFrom === defaultDraft.sendFrom &&
      !draft.fallbackEmail &&
      draft.subject === defaultSubject &&
      draft.message === defaultMessage &&
      Object.keys(draft.attachments).length === 0;

    if (shouldRemove) {
      window.localStorage.removeItem(FAST_APPLY_DRAFT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(FAST_APPLY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const loadBundles = async () => {
    setLoadingBundles(true);
    try {
      const bundlesRes = await apiClient.get("/api/v1/users/bundles");
      const bundlesData = Array.isArray(bundlesRes.data)
        ? bundlesRes.data
        : Array.isArray(bundlesRes.data?.data)
          ? bundlesRes.data.data
          : [];

      const bundlesWithDocs = await Promise.all(
        bundlesData.map(async (bundle: unknown) => {
          const bundleObj = (bundle && typeof bundle === "object" ? bundle : {}) as { id?: string; name?: string };
          const bundleId = bundleObj.id || "";
          const bundleName = bundleObj.name || "Untitled";
          try {
            const docsRes = await apiClient.get(`/api/v1/users/bundles/${bundleId}/documents`);
            const docs = Array.isArray(docsRes.data)
              ? docsRes.data
              : Array.isArray(docsRes.data?.data)
                ? docsRes.data.data
                : [];

            return {
              id: bundleId,
              name: bundleName,
              documents: docs.map((doc: unknown) => {
                const docObj = (doc && typeof doc === "object" ? doc : {}) as {
                  id?: string;
                  filename?: string;
                  fileSize?: number;
                  type?: string;
                };

                return {
                  id: docObj.id || "",
                  filename: docObj.filename || "unknown-file",
                  fileSize: Number(docObj.fileSize || 0),
                  type: docObj.type || "unknown",
                };
              }),
            };
          } catch {
            return { id: bundleId, name: bundleName, documents: [] };
          }
        })
      );

      setBundles(bundlesWithDocs);
    } catch {
      setBundles([]);
    } finally {
      setLoadingBundles(false);
    }
  };

  const sentJobIds = useMemo(
    () =>
      new Set(
        applicationHistory
          .filter((item) => item.status === "sent")
          .map((item) => String(item.jobId || ""))
          .filter(Boolean)
      ),
    [applicationHistory]
  );

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return savedJobs;
    return savedJobs.filter((job) => {
      return (
        job.job_title?.toLowerCase().includes(q) ||
        job.company_name?.toLowerCase().includes(q) ||
        job.location?.toLowerCase().includes(q)
      );
    });
  }, [savedJobs, query]);

  const selectedJobList = useMemo(
    () => savedJobs.filter((job) => draft.selectedJobIds.includes(String(job.id))),
    [savedJobs, draft.selectedJobIds]
  );

  const selectedCount = selectedJobList.length;
  const selectableFilteredJobIds = useMemo(
    () => filteredJobs.map((job) => String(job.id)).filter((id) => allowReselectSentJobs || !sentJobIds.has(id)),
    [filteredJobs, sentJobIds, allowReselectSentJobs]
  );

  const formatFileSize = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

  const bundlesWithDocuments = useMemo(
    () =>
      bundles
        .map((bundle) => ({
          ...bundle,
          documents: (Array.isArray(bundle.documents) ? bundle.documents : []).filter((doc) => doc.id && doc.filename),
        }))
        .filter((bundle) => bundle.documents.length > 0),
    [bundles]
  );

  const setDraftField = <K extends keyof FastApplyDraft>(key: K, value: FastApplyDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const refreshSavedJobs = () => {
    if (typeof window === "undefined") return;
    loadSelectableJobs().then((jobs) => {
      const safeJobs = Array.isArray(jobs) ? jobs : [];
      setSavedJobs(safeJobs);

      setDraft((prev) => {
        const existingIds = new Set(safeJobs.map((job) => String(job.id)));
        const safeSelected = prev.selectedJobIds.filter((id) => existingIds.has(id));
        return { ...prev, selectedJobIds: safeSelected };
      });
    });
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
        .filter((job: SavedJobItem) => Number.isFinite(job.id) && job.id > 0 && job.job_title && job.company_name);

      if (!normalized.length) {
        alert("No jobs available to import right now.");
        return;
      }

      const current = safeParse<SavedJobItem[]>(window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY), []);
      const mergedMap = new Map<number, SavedJobItem>();
      (Array.isArray(current) ? current : []).forEach((job) => mergedMap.set(job.id, job));
      normalized.forEach((job) => mergedMap.set(job.id, job));
      const merged = Array.from(mergedMap.values());

      window.localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(merged));
      setSavedJobs(merged);
      alert(`Imported ${normalized.length} jobs to your saved list.`);
    } catch {
      alert("Could not import jobs now. Please try again.");
    }
  };

  const handleSelectAllFiltered = () => {
    if (!selectableFilteredJobIds.length) return;
    setDraft((prev) => {
      const merged = new Set(prev.selectedJobIds);
      selectableFilteredJobIds.forEach((id) => {
        if (merged.size < 50) merged.add(id);
      });
      return { ...prev, selectedJobIds: Array.from(merged) };
    });
  };

  const handleClearSelection = () => {
    setDraft((prev) => ({ ...prev, selectedJobIds: [] }));
    setStep(1);
  };

  const toggleJobSelection = (jobId: string) => {
    if (!allowReselectSentJobs && sentJobIds.has(jobId)) return;

    setDraft((prev) => {
      const exists = prev.selectedJobIds.includes(jobId);
      if (exists) {
        return { ...prev, selectedJobIds: prev.selectedJobIds.filter((id) => id !== jobId) };
      }
      if (prev.selectedJobIds.length >= 50) {
        return prev;
      }
      return { ...prev, selectedJobIds: [...prev.selectedJobIds, jobId] };
    });
  };

  const resolveAttachmentUrls = async () => {
    const selectedDocIds = Object.entries(draft.attachments)
      .filter(([, checked]) => checked)
      .map(([docId]) => docId);

    if (!selectedDocIds.length) return [] as string[];

    const urls: string[] = [];
    for (const docId of selectedDocIds) {
      for (const bundle of bundles) {
        const found = bundle.documents.find((doc) => doc.id === docId);
        if (!found) continue;

        try {
          const urlRes = await apiClient.get(`/api/v1/users/bundles/${bundle.id}/documents/${docId}/download`);
          const downloadUrl = urlRes.data?.downloadUrl;
          if (downloadUrl) urls.push(downloadUrl);
        } catch {
          // Skip failed attachment URL only for this file.
        }

        break;
      }
    }

    return urls;
  };

  const applyTemplate = (raw: string, job: SavedJobItem) => {
    return raw
      .replaceAll("{hr_name}", "Hiring Team")
      .replaceAll("{company_name}", job.company_name || "Company")
      .replaceAll("{position_title}", job.job_title || "Position");
  };

  const handleSend = async () => {
    if (!selectedCount || sending) return;

    if (!draft.fallbackEmail.trim()) {
      setSendSummary("Please set a fallback recipient email before sending.");
      return;
    }

    setSendSummary("");
    setSending(true);
    setSendProgress({ current: 0, total: selectedCount });
    setSendStats({ sent: 0, failed: 0 });
    setSendLogs([]);

    const attachmentUrls = await resolveAttachmentUrls();
    const successes: AppliedJobRecord[] = [];
    const failures: AppliedJobRecord[] = [];
    let completedCount = 0;

    const runSingleSend = async (job: SavedJobItem): Promise<{ ok: boolean; record: AppliedJobRecord }> => {
      const recipient = draft.fallbackEmail.trim();
      const finalSubject = applyTemplate(draft.subject, job);
      const finalMessage = applyTemplate(draft.message, job);

      const baseRecord: Omit<AppliedJobRecord, "status"> = {
        id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        jobId: String(job.id),
        jobTitle: job.job_title,
        company: job.company_name,
        senderEmail: draft.sendFrom,
        contactEmail: recipient,
        subject: finalSubject,
        message: finalMessage,
        sentAt: new Date().toISOString(),
      };

      const emailData = {
        from: draft.sendFrom,
        to: recipient,
        subject: finalSubject,
        body: finalMessage.replace(/\n/g, "<br>"),
        plainText: finalMessage,
        attachments: attachmentUrls,
      };

      try {
        await apiClient.post(SEND_APPLICATION_ENDPOINT, emailData);
        setSendStats((prev) => ({ ...prev, sent: prev.sent + 1 }));
        setSendLogs((prev) => [{ id: baseRecord.id, jobTitle: job.job_title, company: job.company_name, status: "sent" as const }, ...prev].slice(0, 20));
        return { ok: true, record: { ...baseRecord, status: "sent" } };
      } catch {
        setSendStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
        setSendLogs((prev) => [{ id: baseRecord.id, jobTitle: job.job_title, company: job.company_name, status: "failed" as const }, ...prev].slice(0, 20));
        return { ok: false, record: { ...baseRecord, status: "failed" } };
      } finally {
        completedCount += 1;
        setSendProgress({ current: completedCount, total: selectedCount });
      }
    };

    for (let i = 0; i < selectedJobList.length; i += FAST_APPLY_MAX_PARALLEL_SENDS) {
      const batch = selectedJobList.slice(i, i + FAST_APPLY_MAX_PARALLEL_SENDS);
      const batchResults = await Promise.all(batch.map((job) => runSingleSend(job)));

      batchResults.forEach(({ ok, record }) => {
        if (ok) {
          successes.push(record);
        } else {
          failures.push(record);
        }
      });
    }

    const updatedHistory = [...successes, ...failures, ...applicationHistory];
    setApplicationHistory(updatedHistory);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(APPLICATION_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    }

    const successIds = new Set(successes.map((item) => String(item.jobId)));
    setDraft((prev) => {
      const remaining = prev.selectedJobIds.filter((id) => !successIds.has(id));
      return { ...prev, selectedJobIds: remaining };
    });

    if (successes.length === selectedCount) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(FAST_APPLY_DRAFT_STORAGE_KEY);
      }
      setDraft(defaultDraft);
      setStep(1);
    }

    setSending(false);
    const summary = `Sent: ${successes.length}, Failed: ${failures.length}`;
    setSendSummary(summary);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-8 shadow-xl text-white border border-zinc-800 bg-[radial-gradient(circle_at_10%_20%,#27272a_0%,#18181b_35%,#09090b_100%)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 font-semibold">Fast Apply</p>
            <h1 className="text-3xl font-bold mt-1">Batch Outreach, Zero Friction</h1>
            <p className="text-zinc-300 mt-2">Pick jobs, keep your draft automatically, send in one controlled flow.</p>
            <p className="text-zinc-500 text-xs mt-2">Sent jobs are locked and excluded to prevent duplicates.</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 min-w-[220px]">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Queue</p>
            <p className="font-semibold text-zinc-100">{selectedCount} selected / 50 max</p>
            {sending && (
              <p className="text-xs text-zinc-400 mt-1">
                Sending {sendProgress.current} of {sendProgress.total} (parallel x{FAST_APPLY_MAX_PARALLEL_SENDS})
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[linear-gradient(165deg,#151515_0%,#0d0d0d_60%,#060606_100%)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] text-zinc-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black tracking-tight text-zinc-100">Step {step} of 2</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-3 py-1.5 rounded-full font-semibold transition-colors border ${step === 1 ? "bg-white text-black border-white" : "bg-zinc-900 text-zinc-400 border-zinc-700"}`}>1. Select Jobs</span>
            <span className={`px-3 py-1.5 rounded-full font-semibold transition-colors border ${step === 2 ? "bg-white text-black border-white" : "bg-zinc-900 text-zinc-400 border-zinc-700"}`}>2. Message & Send</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/jobs")}
            className="inline-flex items-center justify-center rounded-full h-9 px-4 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:bg-zinc-800"
          >
            Find Jobs
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/saved")}
            className="inline-flex items-center justify-center rounded-full h-9 px-4 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:bg-zinc-800"
          >
            Saved Jobs
          </button>
          <button
            type="button"
            onClick={refreshSavedJobs}
            className="inline-flex items-center justify-center rounded-full h-9 px-4 border border-white text-white text-xs font-semibold hover:bg-zinc-800"
          >
            Refresh List
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
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem(FAST_APPLY_QUEUE_STORAGE_KEY);
              }
              refreshSavedJobs();
            }}
            className="inline-flex items-center justify-center rounded-full h-9 px-4 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:bg-zinc-800"
          >
            Clear Queue Source
          </button>
          <label className="inline-flex items-center gap-2 rounded-full h-9 px-4 border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 font-semibold">
            <input
              type="checkbox"
              className="w-4 h-4 accent-white"
              checked={allowReselectSentJobs}
              onChange={(e) => setAllowReselectSentJobs(e.target.checked)}
            />
            Allow re-select sent jobs
          </label>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search saved jobs..."
                className="flex-1 min-w-[240px] px-4 py-2.5 border border-zinc-700 bg-zinc-900 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-white focus:border-zinc-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedCount}
                className="inline-flex items-center justify-center rounded-full h-10 px-6 bg-white text-black text-sm font-semibold disabled:opacity-50 hover:bg-zinc-200 transition-colors"
              >
                Next ({selectedCount})
              </button>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                disabled={!selectableFilteredJobIds.length}
                className="inline-flex items-center justify-center rounded-full h-10 px-6 border border-zinc-700 bg-zinc-900 text-zinc-200 text-sm font-semibold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
              >
                Select Visible
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={!selectedCount}
                className="inline-flex items-center justify-center rounded-full h-10 px-6 border border-zinc-700 bg-zinc-900 text-zinc-200 text-sm font-semibold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
              >
                Clear
              </button>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="border border-zinc-700 bg-zinc-900/70 rounded-xl p-6 text-sm text-zinc-300 space-y-4">
                <p>
                  No saved jobs found. Save jobs first from <Link href="/dashboard/jobs" className="text-white font-semibold hover:underline">Find Jobs</Link>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/jobs")}
                    className="inline-flex items-center justify-center rounded-full h-9 px-4 bg-white text-black text-xs font-semibold hover:bg-zinc-200"
                  >
                    Open Find Jobs
                  </button>
                  <button
                    type="button"
                    onClick={refreshSavedJobs}
                    className="inline-flex items-center justify-center rounded-full h-9 px-4 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:bg-zinc-800"
                  >
                    I already saved, refresh
                  </button>
                  <button
                    type="button"
                    onClick={importRecentJobs}
                    className="inline-flex items-center justify-center rounded-full h-9 px-4 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:bg-zinc-800"
                  >
                    Import Recent Jobs
                  </button>
                </div>
                <ol className="text-xs text-zinc-400 list-decimal pl-5 space-y-1">
                  <li>Open Find Jobs</li>
                  <li>Click Save on one or more jobs</li>
                  <li>Come back here and click Refresh List</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredJobs.map((job) => {
                  const id = String(job.id);
                  const isSelected = draft.selectedJobIds.includes(id);
                  const isLocked = !allowReselectSentJobs && sentJobIds.has(id);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleJobSelection(id)}
                      disabled={isLocked}
                      className={`w-full text-left border rounded-xl p-4 transition-all ${
                        isLocked
                          ? "border-red-800 bg-red-950/40 opacity-70 cursor-not-allowed"
                          : isSelected
                            ? "border-white bg-zinc-800"
                            : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-zinc-100">{job.job_title}</p>
                          <p className="text-xs font-semibold text-zinc-300 mt-1">{job.company_name}</p>
                          <p className="text-xs text-zinc-500 mt-1">{job.location}{job.country ? `, ${job.country}` : ""}</p>
                        </div>
                        {isLocked ? (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-red-950 text-red-200 font-semibold border border-red-800">Already Sent</span>
                        ) : isSelected ? (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-white text-black font-semibold">Selected</span>
                        ) : (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-200 font-semibold border border-zinc-600">Select</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {selectedCount === 0 && (
              <div className="rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-300">
                No jobs selected yet. Go back to Step 1 and pick jobs first.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center rounded-full h-10 px-6 border border-zinc-700 bg-zinc-900 text-zinc-200 text-sm font-semibold hover:bg-zinc-800 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={selectedCount === 0 || sending}
                className="inline-flex items-center justify-center rounded-full h-10 px-6 bg-white text-black text-sm font-semibold disabled:opacity-50 hover:bg-zinc-200 transition-colors gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {sending ? `Sending ${sendProgress.current}/${sendProgress.total}` : `Send ${selectedCount} Applications`}
              </button>
              <button type="button" className="inline-flex items-center justify-center rounded-full h-10 px-6 border border-zinc-500 text-zinc-200 text-sm font-semibold hover:bg-zinc-800 transition-colors">
                Manage Templates
              </button>
            </div>

            {(sending || sendSummary || sendLogs.length > 0) && (
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 font-semibold">Live Sending Status</p>
                  <p className="text-xs text-zinc-300">
                    Sent {sendStats.sent} | Failed {sendStats.failed} | Progress {sendProgress.current}/{sendProgress.total || selectedCount}
                  </p>
                </div>

                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${sendProgress.total ? (sendProgress.current / sendProgress.total) * 100 : 0}%` }}
                  />
                </div>

                {sendSummary && <p className="text-sm font-semibold text-zinc-100">{sendSummary}</p>}

                {sendLogs.length > 0 && (
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                    {sendLogs.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-xs rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-zinc-200 font-semibold">{item.jobTitle}</p>
                          <p className="truncate text-zinc-500">{item.company}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full font-semibold ${item.status === "sent" ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/50 text-red-300"}`}>
                          {item.status === "sent" ? "Sent" : "Failed"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 font-semibold mb-2">Selected Jobs</p>
              <div className="flex flex-wrap gap-2">
                {selectedJobList.length === 0 ? (
                  <span className="text-sm text-zinc-500">No jobs selected.</span>
                ) : (
                  selectedJobList.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => toggleJobSelection(String(job.id))}
                      className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-200 hover:border-zinc-400"
                    >
                      {job.company_name} - {job.job_title.slice(0, 34)}{job.job_title.length > 34 ? "..." : ""}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Template</label>
                <select
                  value={draft.template}
                  onChange={(e) => setDraftField("template", e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-900 rounded-lg text-sm text-zinc-100 focus:ring-2 focus:ring-white focus:border-zinc-500 transition-all"
                >
                  <option value="">Custom Message</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Send From</label>
                <select
                  value={draft.sendFrom}
                  onChange={(e) => setDraftField("sendFrom", e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-900 rounded-lg text-sm text-zinc-100 focus:ring-2 focus:ring-white focus:border-zinc-500 transition-all"
                >
                  <option value="zz2406143@gmail.com">zz2406143@gmail.com (Default)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Fallback Recipient Email</label>
              <input
                placeholder="Used when job contact email is not found"
                value={draft.fallbackEmail}
                onChange={(e) => setDraftField("fallbackEmail", e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-900 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-white focus:border-zinc-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Subject Template</label>
              <input
                value={draft.subject}
                onChange={(e) => setDraftField("subject", e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-900 rounded-lg text-sm text-zinc-100 focus:ring-2 focus:ring-white focus:border-zinc-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Message Template</label>
              <textarea
                rows={7}
                value={draft.message}
                onChange={(e) => setDraftField("message", e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-900 rounded-lg text-sm text-zinc-100 resize-none focus:ring-2 focus:ring-white focus:border-zinc-500 transition-all"
              />
              <p className="text-xs text-zinc-500 mt-1.5">Available variables: {"{hr_name}"}, {"{company_name}"}, {"{position_title}"}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-300 mb-3">Attachments from Bewerbungsmappe</p>
              {loadingBundles ? (
                <div className="border border-zinc-700 bg-zinc-900/60 rounded-lg p-4 text-center">
                  <p className="text-sm text-zinc-400">Loading documents...</p>
                </div>
              ) : bundlesWithDocuments.length === 0 ? (
                <div className="border border-zinc-700 bg-zinc-900/60 rounded-lg p-4 text-center">
                  <p className="text-sm text-zinc-400 mb-2">No documents found</p>
                  <Link href="/dashboard/documents" className="text-sm text-white font-semibold hover:underline">
                    Go to Documents to upload files
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {bundlesWithDocuments.map((bundle) => (
                    <div key={bundle.id} className="border border-zinc-700 bg-zinc-900/60 rounded-lg p-4">
                      <p className="text-sm font-semibold text-zinc-200 mb-3">{bundle.name}</p>
                      <div className="space-y-2.5">
                        {bundle.documents.map((doc) => (
                          <label
                            key={doc.id}
                            className="flex items-center gap-3 text-sm text-zinc-200 cursor-pointer hover:bg-zinc-800 p-2 rounded-lg transition-colors"
                          >
                            <input
                              className="w-4 h-4 accent-white"
                              type="checkbox"
                              checked={draft.attachments[doc.id] || false}
                              onChange={(e) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  attachments: { ...prev.attachments, [doc.id]: e.target.checked },
                                }))
                              }
                            />
                            <span className="flex-1 truncate font-medium">{doc.filename}</span>
                            <span className="text-xs text-zinc-500">{formatFileSize(doc.fileSize)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[linear-gradient(180deg,#111111_0%,#090909_100%)] p-6 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
        <h3 className="text-lg font-black tracking-tight text-zinc-100 mb-4">Application History</h3>
        {applicationHistory.length === 0 ? (
          <p className="text-sm text-zinc-500">No sent applications yet.</p>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {applicationHistory.slice(0, 40).map((item) => (
              <div key={item.id} className="border border-zinc-700 bg-zinc-900 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-zinc-100">{item.jobTitle}</p>
                  <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${item.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{item.company} | {item.contactEmail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FastApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-500">Loading Fast Apply...</div>
        </div>
      }
    >
      <FastApplyContent />
    </Suspense>
  );
}
