"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { applicationHistoryApi, ApplicationHistoryRecord, ApplicationHistoryStats } from "@/services/application-history.service";
import {
  APPLICATION_HISTORY_STORAGE_KEY,
  type AppliedJobRecord,
} from "@/lib/application-state";

interface LibraryAttachment {
  id: string;
  filename: string;
  fileSize: number;
  type: string;
  uploadedAt: string;
  bundleName: string;
  bundleId?: string;
  sourceUrl?: string;
  mimeType?: string;
}

function nonEmptyString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function validIsoOrFallback(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function normalizeStatus(value: unknown): "sent" | "failed" {
  return value === "failed" ? "failed" : "sent";
}

function normalizeHistoryAttachment(
  attachment: unknown,
  fallbackDateIso: string,
  fallbackBundleName: string,
  index: number,
): LibraryAttachment | null {
  if (typeof attachment === "string") {
    const clean = attachment.trim();
    if (!clean) {
      return null;
    }
    const fromUrl = clean.split("?")[0].split("/").pop() || "";
    const filename = nonEmptyString(fromUrl, `Attachment ${index + 1}`);
    return {
      id: `url_${index}_${filename}`,
      filename,
      fileSize: 0,
      type: "DOC",
      uploadedAt: fallbackDateIso.slice(0, 10),
      bundleName: fallbackBundleName,
      sourceUrl: clean,
      mimeType: "application/octet-stream",
    };
  }

  if (!attachment || typeof attachment !== "object") {
    return null;
  }

  const value = attachment as Record<string, unknown>;
  const rawSize = Number(value.fileSize ?? value.size ?? 0);
  const safeSize = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 0;

  return {
    id: nonEmptyString(value.id, `attachment_${index}`),
    filename: nonEmptyString(value.filename ?? value.name ?? value.originalName, `Attachment ${index + 1}`),
    fileSize: safeSize,
    type: nonEmptyString(value.type ?? value.fileType ?? value.mimeType, "DOC"),
    uploadedAt: validIsoOrFallback(value.uploadedAt ?? value.createdAt ?? fallbackDateIso, fallbackDateIso).slice(0, 10),
    bundleName: nonEmptyString(value.bundleName, fallbackBundleName),
    bundleId: nonEmptyString(value.bundleId, ""),
    sourceUrl: nonEmptyString(value.sourceUrl ?? value.url ?? value.downloadUrl ?? value.fileUrl, ""),
    mimeType: nonEmptyString(value.mimeType, ""),
  };
}

function normalizeLibraryAttachment(doc: unknown, bundleName: string, bundleId: string, index: number): LibraryAttachment | null {
  if (!doc || typeof doc !== "object") {
    return null;
  }

  const value = doc as Record<string, unknown>;
  const rawSize = Number(value.fileSize ?? value.size ?? 0);
  const safeSize = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 0;
  const uploadedAt = validIsoOrFallback(value.createdAt ?? value.uploadedAt, new Date().toISOString());

  return {
    id: nonEmptyString(value.id, `doc_${index}`),
    filename: nonEmptyString(value.filename ?? value.name ?? value.originalName, "Untitled document"),
    fileSize: safeSize,
    type: nonEmptyString(value.type ?? value.fileType ?? value.mimeType, "DOC"),
    uploadedAt: uploadedAt.slice(0, 10),
    bundleName: nonEmptyString(bundleName, "Documents"),
    bundleId,
    sourceUrl: nonEmptyString(value.downloadUrl ?? value.fileUrl ?? value.url, ""),
    mimeType: nonEmptyString(value.mimeType, ""),
  };
}

function normalizeHistoryRecord(item: unknown, index: number): AppliedJobRecord | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const value = item as Record<string, unknown>;
  const sentAt = validIsoOrFallback(
    value.sentAt ?? value.sent_at ?? value.createdAt ?? value.created_at,
    new Date().toISOString(),
  );

  const attachmentsRaw = Array.isArray(value.attachments) ? value.attachments : [];
  const normalizedAttachments = attachmentsRaw
    .map((attachment, attachmentIndex) =>
      normalizeHistoryAttachment(attachment, sentAt, "Application", attachmentIndex),
    )
    .filter((attachment: LibraryAttachment | null): attachment is LibraryAttachment => Boolean(attachment))
    .map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      fileSize: attachment.fileSize,
      type: attachment.type,
      bundleName: attachment.bundleName,
    }));

  return {
    id: nonEmptyString(value.id ?? value._id, `app_${index}_${Date.now()}`),
    jobId: nonEmptyString(value.jobId ?? value.job_id, ""),
    jobTitle: nonEmptyString(value.jobTitle ?? value.title ?? value.position ?? value.subject, "Untitled application"),
    company: nonEmptyString(value.company ?? value.companyName ?? value.company_name, "Unknown company"),
    senderEmail: nonEmptyString(value.senderEmail ?? value.from ?? value.fromEmail, "Unknown sender"),
    contactEmail: nonEmptyString(value.contactEmail ?? value.to ?? value.recipientEmail, "Unknown recipient"),
    subject: nonEmptyString(value.subject ?? value.emailSubject, "(No subject)"),
    message: nonEmptyString(value.message ?? value.body ?? value.plainText, "No message saved."),
    sentAt,
    status: normalizeStatus(value.status),
    templateName: nonEmptyString(value.templateName ?? value.template ?? value.template_name, "Manual Application Template"),
    sourceUrl: nonEmptyString(value.sourceUrl ?? value.url ?? value.source, ""),
    attachments: normalizedAttachments,
  };
}

function parseHistoryFromStorage(): AppliedJobRecord[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => normalizeHistoryRecord(item, index))
      .filter((item): item is AppliedJobRecord => Boolean(item));
  } catch {
    return [];
  }
}

function formatAttachmentSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Unknown size";
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function ApplicationHistorysPage() {
  const [history, setHistory] = useState<AppliedJobRecord[]>([]);
  const [stats, setStats] = useState<ApplicationHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historyKeyword, setHistoryKeyword] = useState("");
  const [historySenderFilter, setHistorySenderFilter] = useState("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | "sent" | "failed">("all");
  const [historyTemplateFilter, setHistoryTemplateFilter] = useState("all");
  const [historyDateRangeFilter, setHistoryDateRangeFilter] = useState<"all" | "today" | "7d" | "30d">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [libraryAttachments, setLibraryAttachments] = useState<LibraryAttachment[]>([]);
  const [busyAttachmentId, setBusyAttachmentId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const historySenderAccounts = useMemo(() => Array.from(new Set(history.map((item) => item.senderEmail))), [history]);

  const historyTemplates = useMemo(
    () => Array.from(new Set(history.map((item) => item.templateName?.trim() || "Manual Application Template"))),
    [history],
  );

  const filteredHistory = useMemo(() => {
    const query = historyKeyword.trim().toLowerCase();
    const now = Date.now();

    return history.filter((item) => {
      if (historySenderFilter !== "all" && item.senderEmail !== historySenderFilter) {
        return false;
      }

      if (historyStatusFilter !== "all" && item.status !== historyStatusFilter) {
        return false;
      }

      const templateName = item.templateName?.trim() || "Manual Application Template";
      if (historyTemplateFilter !== "all" && templateName !== historyTemplateFilter) {
        return false;
      }

      if (historyDateRangeFilter !== "all") {
        const sentAtTime = new Date(item.sentAt).getTime();
        if (Number.isNaN(sentAtTime)) {
          return false;
        }

        if (historyDateRangeFilter === "today") {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          if (sentAtTime < startOfDay.getTime()) {
            return false;
          }
        }

        if (historyDateRangeFilter === "7d" && now - sentAtTime > 7 * 24 * 60 * 60 * 1000) {
          return false;
        }

        if (historyDateRangeFilter === "30d" && now - sentAtTime > 30 * 24 * 60 * 60 * 1000) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      const searchText = [
        item.jobTitle,
        item.company,
        item.contactEmail,
        item.senderEmail,
        item.subject,
        item.message,
        item.status,
        templateName,
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [
    history,
    historyKeyword,
    historySenderFilter,
    historyStatusFilter,
    historyTemplateFilter,
    historyDateRangeFilter,
  ]);

  const activeHistoryItem = useMemo(
    () => filteredHistory.find((item) => item.id === activeHistoryId) || null,
    [activeHistoryId, filteredHistory],
  );

  useEffect(() => {
    loadHistoryFromBackend();
  }, []);

  const loadHistoryFromBackend = async () => {
    setLoading(true);
    try {
      // Load from backend
      const [backendHistory, backendStats] = await Promise.all([
        applicationHistoryApi.getAll(),
        applicationHistoryApi.getStats(),
      ]);

      // Convert backend format to frontend format
      const converted = backendHistory.map((item) => ({
        id: item.id,
        jobId: item.jobId,
        jobTitle: item.jobTitle,
        company: item.company,
        senderEmail: item.senderEmail,
        contactEmail: item.contactEmail,
        subject: item.subject,
        message: item.message,
        sentAt: item.sentAt,
        status: item.status as "sent" | "failed",
        templateName: item.templateName,
        sourceUrl: item.sourceUrl,
        attachments: item.attachments,
      }));

      setHistory(converted);
      setStats(backendStats);

      // Sync localStorage to backend if there are local records
      const localRecords = parseHistoryFromStorage();
      if (localRecords.length > 0 && !syncing) {
        setSyncing(true);
        await applicationHistoryApi.syncFromLocalStorage(localRecords);
        // Clear localStorage after sync
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(APPLICATION_HISTORY_STORAGE_KEY);
        }
        // Reload from backend
        const refreshed = await applicationHistoryApi.getAll();
        const refreshedConverted = refreshed.map((item) => ({
          id: item.id,
          jobId: item.jobId,
          jobTitle: item.jobTitle,
          company: item.company,
          senderEmail: item.senderEmail,
          contactEmail: item.contactEmail,
          subject: item.subject,
          message: item.message,
          sentAt: item.sentAt,
          status: item.status as "sent" | "failed",
          templateName: item.templateName,
          sourceUrl: item.sourceUrl,
          attachments: item.attachments,
        }));
        setHistory(refreshedConverted);
        setSyncing(false);
      }
    } catch (error: any) {
      console.error("Failed to load history from backend:", error);
      // If 401, user will be redirected to login by interceptor
      if (error.response?.status !== 401) {
        // Fallback to localStorage for other errors
        setHistory(parseHistoryFromStorage());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadLibraryAttachments = async () => {
      try {
        const bundlesRes = await apiClient.get("/api/v1/users/bundles");
        const bundlesData = Array.isArray(bundlesRes.data)
          ? bundlesRes.data
          : Array.isArray(bundlesRes.data?.data)
            ? bundlesRes.data.data
            : [];

        const grouped = await Promise.all(
          bundlesData.map(async (bundle: unknown) => {
            const bundleValue =
              bundle && typeof bundle === "object" ? (bundle as Record<string, unknown>) : ({} as Record<string, unknown>);
            try {
              const docsRes = await apiClient.get(`/api/v1/users/bundles/${nonEmptyString(bundleValue.id, "")}/documents`);
              const docs = Array.isArray(docsRes.data)
                ? docsRes.data
                : Array.isArray(docsRes.data?.data)
                  ? docsRes.data.data
                  : [];

              return docs
                .map((doc: unknown, index: number) =>
                  normalizeLibraryAttachment(
                    doc,
                    nonEmptyString(bundleValue.name, "Documents"),
                    nonEmptyString(bundleValue.id, ""),
                    index,
                  ),
                )
                .filter((attachment: LibraryAttachment | null): attachment is LibraryAttachment => Boolean(attachment));
            } catch {
              return [] as LibraryAttachment[];
            }
          }),
        );

        if (mounted) {
          setLibraryAttachments(grouped.flat());
        }
      } catch {
        if (mounted) {
          setLibraryAttachments([]);
        }
      }
    };

    void loadLibraryAttachments();
    return () => {
      mounted = false;
    };
  }, []);

  const formatHistoryDate = (dateValue: string) => {
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
  };

  const resetHistoryFilters = () => {
    setHistoryKeyword("");
    setHistorySenderFilter("all");
    setHistoryStatusFilter("all");
    setHistoryTemplateFilter("all");
    setHistoryDateRangeFilter("all");
  };

  const clearHistory = async () => {
    try {
      await applicationHistoryApi.deleteAll();
      setHistory([]);
      setActiveHistoryId(null);
      resetHistoryFilters();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(APPLICATION_HISTORY_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const detailAttachments = useMemo(() => {
    if (!activeHistoryItem) return [] as LibraryAttachment[];

    const snapshots = (activeHistoryItem.attachments || [])
      .map((attachment, index) =>
        normalizeHistoryAttachment(attachment, activeHistoryItem.sentAt, "Application", index),
      )
      .filter((attachment: LibraryAttachment | null): attachment is LibraryAttachment => Boolean(attachment));

    if (snapshots.length) {
      return snapshots;
    }

    return libraryAttachments;
  }, [activeHistoryItem, libraryAttachments]);

  const usingLibraryFallback = useMemo(() => {
    if (!activeHistoryItem || detailAttachments.length === 0) {
      return false;
    }

    const snapshots = (activeHistoryItem.attachments || [])
      .map((attachment, index) =>
        normalizeHistoryAttachment(attachment, activeHistoryItem.sentAt, "Application", index),
      )
      .filter((attachment: LibraryAttachment | null): attachment is LibraryAttachment => Boolean(attachment));

    return snapshots.length === 0;
  }, [activeHistoryItem, detailAttachments]);

  const attachmentTypeLabel = (value: string) => {
    const normalized = String(value || "DOC").toLowerCase();
    if (normalized === "cv") return "CV";
    if (normalized === "cover_letter") return "COVER";
    if (normalized === "certificate") return "CERT";
    if (normalized === "portfolio") return "PORT";
    return normalized.toUpperCase();
  };

  const libraryBundleByDocument = useMemo(() => {
    const map = new Map<string, string>();
    libraryAttachments.forEach((attachment) => {
      if (attachment.bundleId) {
        map.set(attachment.id, attachment.bundleId);
      }
    });
    return map;
  }, [libraryAttachments]);

  const resolveBundleDocument = (attachment: LibraryAttachment) => {
    const bundleId = attachment.bundleId || libraryBundleByDocument.get(attachment.id);
    if (!bundleId) {
      return null;
    }
    return {
      bundleId,
      documentId: attachment.id,
    };
  };

  const handlePreviewAttachment = async (attachment: LibraryAttachment) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewUrl("");
    setPreviewTitle(attachment.filename || "Document Preview");
    setBusyAttachmentId(attachment.id);

    try {
      let url = nonEmptyString(attachment.sourceUrl, "");

      if (!url) {
        const resolved = resolveBundleDocument(attachment);
        if (!resolved) {
          throw new Error("Preview is unavailable for this legacy snapshot attachment.");
        }

        const res = await apiClient.get(
          `/api/v1/users/bundles/${resolved.bundleId}/documents/${resolved.documentId}/download`,
        );
        url = nonEmptyString(res.data?.downloadUrl, "");
      }

      if (!url) {
        throw new Error("No preview URL returned");
      }

      setPreviewUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not open attachment preview. Please try again.";
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
      setBusyAttachmentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5f7fa_60%,#eef1f5_100%)] p-6 shadow-sm">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-black/5 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption text-gray-500">Applications Center</p>
            <h1 className="mt-2 text-display-md">Application Historys</h1>
            <p className="mt-2 text-body text-gray-600">Professional timeline of every job application, email, template, and attachment.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/applications" className="btn-secondary">
              Back to Applications
            </Link>
            <button type="button" onClick={clearHistory} className="btn-secondary text-red-600 border-red-600 hover:bg-red-50">
              Clear History
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-button border border-gray-200 bg-white/90 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Total</p>
            <p className="mt-1 text-xl font-black text-black">{loading ? "..." : (stats?.total || history.length)}</p>
          </div>
          <div className="rounded-button border border-gray-200 bg-white/90 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Sent</p>
            <p className="mt-1 text-xl font-black text-black">{loading ? "..." : (stats?.sent || history.filter((item) => item.status === "sent").length)}</p>
          </div>
          <div className="rounded-button border border-gray-200 bg-white/90 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Failed</p>
            <p className="mt-1 text-xl font-black text-gray-700">{loading ? "..." : (stats?.failed || history.filter((item) => item.status === "failed").length)}</p>
          </div>
          <div className="rounded-button border border-gray-200 bg-white/90 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Email Accounts</p>
            <p className="mt-1 text-xl font-black text-black">{loading ? "..." : (stats?.emailAccounts || historySenderAccounts.length)}</p>
          </div>
        </div>
      </section>

      <section className="card-flat space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            {filteredHistory.length} of {history.length} applications
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-button border border-gray-200 bg-gray-50 p-4 xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Search Applications</label>
            <input
              value={historyKeyword}
              onChange={(event) => setHistoryKeyword(event.target.value)}
              placeholder="Search by job, company, email, subject, or template"
              className="w-full rounded-button border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div className="rounded-button border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Email Accounts</p>
                <p className="text-xs text-gray-500">Manage Gmail accounts for sending applications</p>
              </div>
              <Link href="/dashboard/settings" className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-black hover:bg-gray-100">
                Manage
              </Link>
            </div>
            <select
              value={historySenderFilter}
              onChange={(event) => setHistorySenderFilter(event.target.value)}
              className="w-full rounded-button border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
            >
              <option value="all">All sender accounts</option>
              {historySenderAccounts.map((emailAccount) => (
                <option key={emailAccount} value={emailAccount}>
                  {emailAccount}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((value) => !value)}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-gray-100"
          >
            {showAdvancedFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
          </button>
          <button
            type="button"
            onClick={resetHistoryFilters}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
          >
            Reset Filters
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 gap-3 rounded-button border border-gray-200 bg-white p-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Status</label>
              <select
                value={historyStatusFilter}
                onChange={(event) => setHistoryStatusFilter(event.target.value as "all" | "sent" | "failed")}
                className="w-full rounded-button border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Template</label>
              <select
                value={historyTemplateFilter}
                onChange={(event) => setHistoryTemplateFilter(event.target.value)}
                className="w-full rounded-button border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                <option value="all">All templates</option>
                {historyTemplates.map((template) => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Date Range</label>
              <select
                value={historyDateRangeFilter}
                onChange={(event) => setHistoryDateRangeFilter(event.target.value as "all" | "today" | "7d" | "30d")}
                className="w-full rounded-button border border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="rounded-button border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No applications match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="space-y-2 xl:col-span-2 max-h-[36rem] overflow-y-auto pr-1">
              {filteredHistory.map((item) => {
                const selected = activeHistoryId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveHistoryId(item.id)}
                    className={`w-full rounded-button border px-4 py-3 text-left transition-all ${
                      selected
                        ? "border-black bg-black text-white shadow-soft"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${selected ? "text-white" : "text-black"}`}>{item.jobTitle}</p>
                    <p className={`mt-1 text-xs ${selected ? "text-gray-100" : "text-gray-500"}`}>
                      {item.company} | {item.contactEmail}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          item.status === "sent"
                            ? selected
                              ? "bg-white text-black"
                              : "bg-black text-white"
                            : selected
                              ? "bg-white text-gray-700"
                              : "bg-gray-300 text-gray-700"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className={`text-[11px] font-semibold ${selected ? "text-gray-100" : "text-gray-500"}`}>
                        {formatHistoryDate(item.sentAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-button border border-gray-200 bg-white p-5 xl:col-span-3">
              {!activeHistoryItem ? (
                <p className="text-sm text-gray-500">Select an application to see details.</p>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-400">Application Details</p>
                      <h3 className="text-lg font-bold text-black">{activeHistoryItem.jobTitle}</h3>
                      <p className="text-sm text-gray-500">{activeHistoryItem.company}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        activeHistoryItem.status === "sent" ? "bg-black text-white" : "bg-gray-300 text-gray-700"
                      }`}
                    >
                      {activeHistoryItem.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-button border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-400">Job Details</p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">Title: {activeHistoryItem.jobTitle}</p>
                      <p className="mt-1 text-sm text-gray-600">Company: {activeHistoryItem.company}</p>
                      <p className="mt-1 text-sm text-gray-600">Job ID: {activeHistoryItem.jobId || "Not saved"}</p>
                      <p className="mt-1 text-sm text-gray-600">Sent At: {formatHistoryDate(activeHistoryItem.sentAt)}</p>
                    </div>

                    <div className="rounded-button border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-gray-400">Emails</p>
                      <p className="mt-2 text-sm text-gray-700"><span className="font-semibold text-gray-900">From:</span> {activeHistoryItem.senderEmail}</p>
                      <p className="mt-1 text-sm text-gray-700"><span className="font-semibold text-gray-900">To:</span> {activeHistoryItem.contactEmail}</p>
                      <p className="mt-1 text-sm text-gray-700"><span className="font-semibold text-gray-900">Template:</span> {activeHistoryItem.templateName || "Manual Application Template"}</p>
                    </div>
                  </div>

                  <div className="rounded-button border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-gray-400">Template Email</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{activeHistoryItem.subject}</p>
                    <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{activeHistoryItem.message}</p>
                    {activeHistoryItem.sourceUrl && (
                      <a
                        href={activeHistoryItem.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-xs font-semibold text-black underline decoration-gray-300 hover:decoration-black"
                      >
                        Open Source URL
                      </a>
                    )}
                  </div>

                  <div className="rounded-button border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-gray-400">Attachments</p>
                    {detailAttachments.length ? (
                      <>
                        {usingLibraryFallback && (
                          <p className="mt-2 text-xs text-gray-500">
                            This record has no saved attachment snapshot. Showing your current document library instead.
                          </p>
                        )}
                        <div className="border-t border-gray-100 px-5 pb-4 pt-3 space-y-2">
                          {detailAttachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-button hover:bg-gray-100 transition-colors group">
                              <div className="w-8 h-8 bg-white border border-gray-200 rounded-button flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{attachment.filename}</p>
                                <p className="text-xs text-gray-400">
                                  {formatAttachmentSize(attachment.fileSize)} · {attachment.uploadedAt}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-black text-white">
                                {attachmentTypeLabel(attachment.type)}
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  className="p-1 text-gray-400 hover:text-black rounded transition-colors"
                                  title="Preview"
                                  onClick={() => void handlePreviewAttachment(attachment)}
                                  disabled={busyAttachmentId === attachment.id}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 rounded-button border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                        <p>No attachments available yet.</p>
                        <p className="mt-1 text-xs text-gray-500">Open Applications, select files from Documents, and resend.</p>
                        <Link href="/dashboard/applications" className="mt-2 inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-100">
                          Open Applications
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="relative bg-white w-full max-w-[42%] h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-gray-500">Document Preview</p>
                <h3 className="text-sm font-bold text-gray-900 truncate">{previewTitle || "Attachment"}</h3>
              </div>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                title="Close"
                onClick={() => {
                  setPreviewOpen(false);
                  setPreviewUrl("");
                  setPreviewError("");
                  setPreviewLoading(false);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-hidden">
              {previewLoading && (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading preview...</div>
              )}

              {!previewLoading && previewError && (
                <div className="h-full flex items-center justify-center text-sm text-red-600 text-center px-4">
                  {previewError}
                </div>
              )}

              {!previewLoading && !previewError && previewUrl && (
                <iframe
                  src={previewUrl}
                  title={previewTitle || "Attachment preview"}
                  className="w-full h-full rounded-lg border border-gray-200"
                />
              )}
            </div>
          </div>

          <div
            className="flex-1 bg-black/40"
            onClick={() => {
              setPreviewOpen(false);
              setPreviewUrl("");
              setPreviewError("");
              setPreviewLoading(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
