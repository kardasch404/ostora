"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { extractContactInfo, generateApplicationMessage } from "@/lib/contact-extractor";
import {
  APPLICATION_HISTORY_STORAGE_KEY,
  MESSAGE_TEMPLATES_STORAGE_KEY,
  SAVED_JOBS_STORAGE_KEY,
} from "@/lib/application-state";

const FAST_APPLY_MAX = 50;

type SendState = "queued" | "sending" | "sent" | "failed";

interface JobItem {
  id: number;
  job_title: string;
  company_name: string;
  location: string;
  country: string;
  content?: string;
  stelle_url?: string;
}

interface ApplicationHistoryItem {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  senderEmail: string;
  contactEmail: string;
  subject: string;
  message: string;
  sentAt: string;
  status: "sent" | "failed";
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface ProgressItem {
  jobId: string;
  title: string;
  company: string;
  recipient: string;
  state: SendState;
  error?: string;
}

interface UserEmailConfig {
  id: string;
  email: string;
  isActive: boolean;
}

interface BundleItem {
  id: string;
  name: string;
}

interface BundleDocumentItem {
  id: string;
  filename: string;
  fileSize: number;
  type?: "CV" | "COVER_LETTER" | "PORTFOLIO" | "OTHER";
}

interface AttachmentOption {
  id: string;
  bundleId: string;
  name: string;
  mappeName: string;
  size: string;
}

interface AttachmentGroup {
  id: string;
  name: string;
  documents: AttachmentOption[];
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, (_, key: string) => variables[key] || "");
}

async function runConcurrent<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  const queue = [...items];
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      await worker(item);
    }
  });

  await Promise.all(runners);
}

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [userEmails, setUserEmails] = useState<UserEmailConfig[]>([]);
  const [senderEmail, setSenderEmail] = useState("");
  const [fallbackRecipientEmail, setFallbackRecipientEmail] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("Application for {position_title} at {company_name}");
  const [messageTemplate, setMessageTemplate] = useState(
    "Dear {hr_name},\n\nI am writing to apply for the position of {position_title} at {company_name}.\n\nPlease find my documents attached.\n\nBest regards",
  );

  const [attachmentGroups, setAttachmentGroups] = useState<AttachmentGroup[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);

  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [sending, setSending] = useState(false);
  const [batchSummary, setBatchSummary] = useState("");
  const [error, setError] = useState("");

  const [history, setHistory] = useState<ApplicationHistoryItem[]>([]);

  const prefillJobTitle = searchParams.get("jobTitle") || "";
  const prefillCompany = searchParams.get("company") || "";
  const prefillContactName = searchParams.get("contactName") || "";
  const prefillContactEmail = searchParams.get("contactEmail") || "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawHistory = window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY);
    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch {
        setHistory([]);
      }
    }

    const rawTemplates = window.localStorage.getItem(MESSAGE_TEMPLATES_STORAGE_KEY);
    if (rawTemplates) {
      try {
        const parsed = JSON.parse(rawTemplates);
        if (Array.isArray(parsed)) {
          setTemplates(parsed);
          if (parsed[0]?.id) {
            setSelectedTemplateId(parsed[0].id);
          }
        }
      } catch {
        setTemplates([]);
      }
    }

    if (prefillJobTitle && prefillCompany) {
      setStep(2);
      const personalized = generateApplicationMessage(prefillContactName, prefillJobTitle, prefillCompany);
      setMessageTemplate(personalized);
      setSubjectTemplate(`Application for ${prefillJobTitle} at ${prefillCompany}`);
      setFallbackRecipientEmail(prefillContactEmail || "");
    }
  }, [prefillCompany, prefillContactEmail, prefillContactName, prefillJobTitle]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(APPLICATION_HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const params = new URLSearchParams({ page: "1", limit: "100", search });
        const res = await apiClient.get(`/api/v1/jobs?${params.toString()}`);
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setJobs(data);
      } catch {
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, [search]);

  useEffect(() => {
    const loadSenderEmails = async () => {
      try {
        const res = await apiClient.get("/api/v1/users/emails");
        const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
        const mapped: UserEmailConfig[] = data.map((item: { id: string; email: string; isActive?: boolean }) => ({
          id: item.id,
          email: item.email,
          isActive: Boolean(item.isActive),
        }));
        setUserEmails(mapped);
        setSenderEmail(mapped.find((item) => item.isActive)?.email || mapped[0]?.email || "");
      } catch {
        setUserEmails([]);
      }
    };

    const loadAttachments = async () => {
      try {
        const bundlesRes = await apiClient.get("/api/v1/users/bundles");
        const bundles: BundleItem[] = Array.isArray(bundlesRes.data)
          ? bundlesRes.data
          : Array.isArray(bundlesRes.data?.data)
            ? bundlesRes.data.data
            : [];

        const groups: AttachmentGroup[] = [];

        for (const bundle of bundles) {
          const docsRes = await apiClient.get(`/api/v1/users/bundles/${bundle.id}/documents`);
          const docs: BundleDocumentItem[] = Array.isArray(docsRes.data)
            ? docsRes.data
            : Array.isArray(docsRes.data?.data)
              ? docsRes.data.data
              : [];

          groups.push({
            id: bundle.id,
            name: bundle.name,
            documents: docs.map((doc) => ({
              id: doc.id,
              bundleId: bundle.id,
              name: doc.filename,
              mappeName: bundle.name,
              size: `${Math.max(1, Math.round((doc.fileSize || 0) / 1024))} KB`,
            })),
          });
        }

        setAttachmentGroups(groups);
      } catch {
        setAttachmentGroups([]);
      }
    };

    loadSenderEmails();
    loadAttachments();
  }, []);

  useEffect(() => {
    if (!selectedTemplateId) return;
    const template = templates.find((item) => item.id === selectedTemplateId);
    if (!template) return;
    setSubjectTemplate(template.subject);
    setMessageTemplate(template.body);
  }, [selectedTemplateId, templates]);

  const selectedJobs = useMemo(
    () => jobs.filter((job) => selectedJobIds.includes(String(job.id))),
    [jobs, selectedJobIds],
  );

  const appliedJobIds = useMemo(
    () => new Set(history.filter((item) => item.status === "sent").map((item) => String(item.jobId)).filter(Boolean)),
    [history],
  );

  const completedCount = progressItems.filter((item) => item.state === "sent" || item.state === "failed").length;

  const progressPercent = progressItems.length === 0 ? 0 : Math.round((completedCount / progressItems.length) * 100);

  const toggleSelectedJob = (jobId: string) => {
    if (appliedJobIds.has(jobId)) {
      return;
    }

    setSelectedJobIds((prev) => {
      if (prev.includes(jobId)) {
        return prev.filter((id) => id !== jobId);
      }
      if (prev.length >= FAST_APPLY_MAX) {
        return prev;
      }
      return [...prev, jobId];
    });
  };

  const addSavedJobs = () => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY);
    if (!raw) return;

    try {
      const saved: JobItem[] = JSON.parse(raw);
      const merged = [...jobs];
      for (const item of saved) {
        if (!merged.some((existing) => existing.id === item.id)) {
          merged.push(item);
        }
      }
      setJobs(merged);
      setSelectedJobIds((prev) => {
        const existing = new Set(prev);
        for (const item of saved) {
          if (existing.size >= FAST_APPLY_MAX) break;
          if (appliedJobIds.has(String(item.id))) continue;
          existing.add(String(item.id));
        }
        return Array.from(existing);
      });
    } catch {
      // Ignore invalid local storage.
    }
  };

  const toggleAttachment = (id: string) => {
    setSelectedAttachmentIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const resolveAttachmentUrls = async (): Promise<string[]> => {
    const selectedDocuments = attachmentGroups
      .flatMap((group) => group.documents)
      .filter((doc) => selectedAttachmentIds.includes(doc.id));

    if (selectedDocuments.length === 0) {
      return [];
    }

    const settled = await Promise.allSettled(
      selectedDocuments.map((doc) => apiClient.get(`/api/v1/users/bundles/${doc.bundleId}/documents/${doc.id}/download`)),
    );

    return settled
      .map((item) => {
        if (item.status !== "fulfilled") return null;
        return item.value?.data?.downloadUrl || null;
      })
      .filter((value): value is string => typeof value === "string" && value.length > 0);
  };

  const generateFromAssistant = () => {
    const candidate = selectedJobs[0];
    const title = candidate?.job_title || "Software Engineer";
    const company = candidate?.company_name || "the company";

    setSubjectTemplate(`Application for {position_title} at {company_name}`);
    setMessageTemplate(
      `Dear {hr_name},\n\nI hope you are doing well. I am excited to apply for {position_title} at {company_name}. My background matches the role requirements and I would love to contribute quickly.\n\nI have attached my documents for review.\n\nThank you for your time and consideration.\n\nBest regards`,
    );

    setBatchSummary(`AI Ostora Assistant prepared a message for roles like ${title} at ${company}.`);
  };

  const startFastApplying = async () => {
    const jobsToSend = selectedJobs.filter((job) => !appliedJobIds.has(String(job.id)));

    if (jobsToSend.length === 0) {
      setError("Select at least one job for Fast Applying.");
      return;
    }
    if (!senderEmail) {
      setError("Choose a sender email before sending applications.");
      return;
    }

    setSending(true);
    setError("");
    setBatchSummary("");

    const attachmentUrls = await resolveAttachmentUrls();

    const initialProgress: ProgressItem[] = jobsToSend.map((job) => ({
      jobId: String(job.id),
      title: job.job_title,
      company: job.company_name,
      recipient: "",
      state: "queued",
    }));
    setProgressItems(initialProgress);

    await runConcurrent(
      jobsToSend,
      async (job) => {
        const contact = extractContactInfo(job.content || "");
        const recipient = contact.email || fallbackRecipientEmail;

        if (!recipient) {
          setProgressItems((prev) =>
            prev.map((item) =>
              item.jobId === String(job.id)
                ? { ...item, recipient: "(missing)", state: "failed", error: "No recipient email found" }
                : item,
            ),
          );
          return;
        }

        setProgressItems((prev) =>
          prev.map((item) =>
            item.jobId === String(job.id)
              ? { ...item, recipient, state: "sending", error: undefined }
              : item,
          ),
        );

        const variables = {
          hr_name: contact.name || "Hiring Team",
          company_name: job.company_name || "Company",
          position_title: job.job_title || "Role",
        };

        const subject = renderTemplate(subjectTemplate, variables);
        const message = renderTemplate(messageTemplate, variables);

        try {
          await apiClient.post("/api/v1/users/emails/send", {
            from: senderEmail,
            to: recipient,
            subject,
            body: message,
            plainText: message,
            attachments: attachmentUrls,
          });

          setProgressItems((prev) =>
            prev.map((item) => (item.jobId === String(job.id) ? { ...item, state: "sent" } : item)),
          );

          setHistory((prev) => [
            {
              id: `${Date.now()}-${job.id}`,
              jobId: String(job.id),
              jobTitle: job.job_title,
              company: job.company_name,
              senderEmail,
              contactEmail: recipient,
              subject,
              message,
              sentAt: new Date().toISOString(),
              status: "sent",
            },
            ...prev,
          ]);
        } catch (sendError: unknown) {
          const messageText =
            typeof sendError === "object" && sendError && "message" in sendError
              ? String((sendError as { message?: string }).message || "Send failed")
              : "Send failed";

          setProgressItems((prev) =>
            prev.map((item) =>
              item.jobId === String(job.id)
                ? { ...item, state: "failed", error: messageText }
                : item,
            ),
          );

          setHistory((prev) => [
            {
              id: `${Date.now()}-failed-${job.id}`,
              jobId: String(job.id),
              jobTitle: job.job_title,
              company: job.company_name,
              senderEmail,
              contactEmail: recipient,
              subject,
              message,
              sentAt: new Date().toISOString(),
              status: "failed",
            },
            ...prev,
          ]);
        }
      },
      4,
    );

    setSending(false);
    setBatchSummary("Fast Applying completed. Check per-job statuses below.");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0a5160] to-[#0c7a8a] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#b8f2ff] font-semibold">Fast Applying</p>
            <h1 className="text-3xl font-bold mt-1">Apply to many jobs with one flow</h1>
            <p className="text-[#d8f8ff] mt-2">Select up to {FAST_APPLY_MAX} jobs, personalize using tokens, and send with live progress.</p>
            <p className="text-[#ffdddd] text-xs mt-2">Already applied jobs are locked in red and cannot be sent again.</p>
          </div>
          <button
            type="button"
            onClick={generateFromAssistant}
            className="rounded-xl bg-white/15 border border-white/25 px-4 py-3 hover:bg-white/20 transition-colors"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-[#d4f7ff]">New</p>
            <p className="font-semibold">AI Ostora Assistant</p>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Step {step} of 2</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full ${step === 1 ? "bg-[#0f6673] text-white" : "bg-gray-100 text-gray-500"}`}>1. Select Jobs</span>
            <span className={`px-2 py-1 rounded-full ${step === 2 ? "bg-[#0f6673] text-white" : "bg-gray-100 text-gray-500"}`}>2. Message & Send</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title or company"
                className="flex-1 min-w-[240px] px-3 py-2 border border-gray-200 rounded-lg"
              />
              <button
                type="button"
                onClick={addSavedJobs}
                className="px-3 py-2 rounded-lg border border-[#0f6673]/20 text-[#0f6673] font-semibold text-sm"
              >
                Add Saved Jobs
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg bg-[#0f6673] text-white font-semibold disabled:opacity-50"
                disabled={selectedJobIds.length === 0}
              >
                Next ({selectedJobIds.length})
              </button>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {selectedJobIds.length}/{FAST_APPLY_MAX} jobs selected
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {jobsLoading && <p className="text-sm text-gray-500">Loading jobs...</p>}
              {!jobsLoading && jobs.map((job) => {
                const checked = selectedJobIds.includes(String(job.id));
                const isApplied = appliedJobIds.has(String(job.id));
                return (
                  <label
                    key={job.id}
                    className={`border rounded-xl p-3 cursor-pointer transition-all ${isApplied ? "border-red-300 bg-red-50" : checked ? "border-[#0f6673] bg-[#eef9fb]" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isApplied}
                        onChange={() => toggleSelectedJob(String(job.id))}
                        className={`mt-1 ${isApplied ? "accent-red-500" : "accent-[#0f6673]"}`}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-2">{job.job_title || "Untitled role"}</p>
                        <p className={`text-xs font-medium mt-0.5 ${isApplied ? "text-red-600" : "text-[#0f6673]"}`}>{job.company_name || "Unknown company"}</p>
                        <p className="text-xs text-gray-500 mt-1">{job.location || "-"}{job.country ? `, ${job.country}` : ""}</p>
                        {isApplied && <p className="text-[11px] mt-1 font-semibold text-red-600">Already applied. Duplicate apply is blocked.</p>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={startFastApplying}
                disabled={sending || selectedJobIds.length === 0}
                className="px-4 py-2 rounded-lg bg-[#0f6673] text-white text-sm font-semibold disabled:opacity-50"
              >
                {sending ? "Sending..." : `Send ${selectedJobIds.length} Applications`}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/messages")}
                className="px-3 py-2 rounded-lg border border-[#0f6673]/20 text-[#0f6673] text-sm font-semibold"
              >
                Manage Templates
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">Custom Message</option>
                  {templates.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Send From</label>
                <select
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  {userEmails.length === 0 && <option value="">No sender emails configured</option>}
                  {userEmails.map((item) => (
                    <option key={item.id} value={item.email}>{item.email}{item.isActive ? " (Default)" : ""}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Fallback recipient email</label>
              <input
                value={fallbackRecipientEmail}
                onChange={(e) => setFallbackRecipientEmail(e.target.value)}
                placeholder="Used when job contact email is not found"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Subject Template</label>
              <input
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Message Template</label>
              <textarea
                rows={7}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Available variables: {"{hr_name}"}, {"{company_name}"}, {"{position_title}"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Attachments</p>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {attachmentGroups.length === 0 && <p className="text-sm text-gray-500">No documents available.</p>}
                {attachmentGroups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-800 mb-2">{group.name}</p>
                    <div className="space-y-2">
                      {group.documents.map((doc) => (
                        <label key={doc.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedAttachmentIds.includes(doc.id)}
                            onChange={() => toggleAttachment(doc.id)}
                            className="accent-[#0f6673]"
                          />
                          <span className="truncate">{doc.name}</span>
                          <span className="text-xs text-gray-400">{doc.size}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {(sending || progressItems.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Live Sending Progress</h3>
            <p className="text-sm text-gray-600">{completedCount}/{progressItems.length}</p>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-[#0f6673] to-[#2a8ca0]" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {progressItems.map((item) => (
              <div key={item.jobId} className="rounded-lg border border-gray-200 p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.company} {item.recipient ? `• ${item.recipient}` : ""}</p>
                  {item.error && <p className="text-xs text-red-600 mt-1">{item.error}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  item.state === "sent"
                    ? "bg-green-100 text-green-700"
                    : item.state === "failed"
                      ? "bg-red-100 text-red-700"
                      : item.state === "sending"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                }`}>
                  {item.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {batchSummary && (
        <div className="bg-[#eaf9fd] border border-[#b7e8f4] rounded-xl p-4 text-[#14566a] text-sm font-medium">
          {batchSummary}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Application History</h3>
        {history.length === 0 && <p className="text-sm text-gray-500">No sent applications yet.</p>}
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.jobTitle}</p>
                <p className="text-xs text-gray-500">{item.company} • {item.contactEmail} • {new Date(item.sentAt).toLocaleString()}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FastApplyPage() {
  return (
    <Suspense>
      <ApplicationsContent />
    </Suspense>
  );
}
