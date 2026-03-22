"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { generateApplicationMessage } from "@/lib/contact-extractor";
import { apiClient } from "@/lib/api-client";

const APPLICATION_HISTORY_STORAGE_KEY = "ostora:applications:history";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  senderEmail: string;
  contactEmail: string;
  contactPhone: string;
  subject: string;
  message: string;
  attachments: string[];
  sentAt: string;
  status: "sent" | "pending" | "viewed" | "rejected";
}

interface UserEmailConfig {
  id: string;
  email: string;
  isActive: boolean;
}

interface BundleItem {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
}

interface BundleDocumentItem {
  id: string;
  filename: string;
  fileSize: number;
  type?: "CV" | "COVER_LETTER" | "PORTFOLIO" | "OTHER";
  createdAt?: string;
  s3Url?: string;
}

interface AttachmentOption {
  id: string;
  bundleId: string;
  name: string;
  size: string;
  uploadedAt: string;
  mappeName: string;
  typeLabel: string;
}

interface AttachmentGroup {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  logo: string;
  documents: AttachmentOption[];
}

const MAPPE_LOGOS = ["💼", "🎓", "🚀", "🏢", "⭐", "🔥", "💡", "🎯", "📁", "🌟"] as const;

const apiDocTypeToLabel = (type?: "CV" | "COVER_LETTER" | "PORTFOLIO" | "OTHER") => {
  if (type === "CV") return "CV";
  if (type === "COVER_LETTER") return "Cover Letter";
  if (type === "PORTFOLIO") return "Certificate";
  return "Other";
};

const statusBadge: Record<Application["status"], string> = {
  sent: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  viewed: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
};

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const jobTitle = searchParams.get("jobTitle") ?? "";
  const company = searchParams.get("company") ?? "";
  const contactName = searchParams.get("contactName") ?? "";
  const contactPosition = searchParams.get("contactPosition") ?? "";
  const contactEmail = searchParams.get("contactEmail") ?? "";
  const contactPhone = searchParams.get("contactPhone") ?? "";
  const stelleUrl = searchParams.get("stelleUrl") ?? "";

  const [applications, setApplications] = useState<Application[]>([]);
  const [attachmentGroups, setAttachmentGroups] = useState<AttachmentGroup[]>([]);
  const [openAttachmentGroup, setOpenAttachmentGroup] = useState<string | null>(null);
  const [userEmails, setUserEmails] = useState<UserEmailConfig[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [showForm, setShowForm] = useState(!!jobTitle);
  const [form, setForm] = useState({
    jobTitle,
    company,
    senderEmail: "",
    contactEmail,
    contactPhone,
    subject: jobTitle ? `Application for ${jobTitle} at ${company}` : "",
    message: jobTitle ? generateApplicationMessage(contactName, jobTitle, company) : "",
    attachments: [] as string[],
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return;
      }

      const valid = parsed.filter(
        (item: unknown): item is Application =>
          Boolean(item) &&
          typeof (item as Application).id === "string" &&
          typeof (item as Application).jobTitle === "string" &&
          typeof (item as Application).company === "string" &&
          typeof (item as Application).sentAt === "string" &&
          typeof (item as Application).status === "string",
      );

      setApplications(valid);
    } catch {
      setApplications([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(APPLICATION_HISTORY_STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  // Update form when URL params change
  useEffect(() => {
    if (jobTitle) {
      setForm({
        jobTitle,
        company,
        senderEmail: "",
        contactEmail,
        contactPhone,
        subject: `Application for ${jobTitle} at ${company}`,
        message: generateApplicationMessage(contactName, jobTitle, company),
        attachments: [],
      });
      setShowForm(true);
      setSent(false);
    }
  }, [jobTitle, company, contactName, contactEmail, contactPhone]);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const bundlesRes = await apiClient.get("/api/v1/users/bundles");
        const bundles: BundleItem[] = Array.isArray(bundlesRes.data)
          ? bundlesRes.data
          : Array.isArray(bundlesRes.data?.data)
            ? bundlesRes.data.data
            : [];

        const docsGroups = await Promise.all(
          bundles.map(async (bundle, index) => {
            const docsRes = await apiClient.get(`/api/v1/users/bundles/${bundle.id}/documents`);
            const docs: BundleDocumentItem[] = Array.isArray(docsRes.data)
              ? docsRes.data
              : Array.isArray(docsRes.data?.data)
                ? docsRes.data.data
                : [];

            return {
              bundleId: bundle.id,
              mappeName: bundle.name,
              description: bundle.description || "",
              createdAt: bundle.createdAt || "",
              logo: MAPPE_LOGOS[index % MAPPE_LOGOS.length],
              docs,
            };
          }),
        );

        const grouped: AttachmentGroup[] = docsGroups.map((group) => ({
          id: group.bundleId,
          name: group.mappeName,
          description: group.description,
          createdAt: group.createdAt ? new Date(group.createdAt).toISOString().split("T")[0] : "-",
          logo: group.logo,
          documents: group.docs
            .filter((doc) => !!doc?.id && !!doc?.filename)
            .map((doc) => ({
              id: doc.id,
              bundleId: group.bundleId,
              name: doc.filename,
              size: `${Math.max(1, Math.round((doc.fileSize || 0) / 1024))} KB`,
              uploadedAt: doc.createdAt ? new Date(doc.createdAt).toISOString().split("T")[0] : "-",
              mappeName: group.mappeName || "Untitled Mappe",
              typeLabel: apiDocTypeToLabel(doc.type),
            })),
        }));

        setAttachmentGroups(grouped);
        setOpenAttachmentGroup((prev) => prev || grouped[0]?.id || null);
      } catch {
        setAttachmentGroups([]);
      }
    };

    const loadSenderEmails = async () => {
      setEmailsLoading(true);
      try {
        const res = await apiClient.get("/api/v1/users/emails");
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        const mapped: UserEmailConfig[] = data.map(
          (item: { id: string; email: string; isActive?: boolean }) => ({
            id: item.id,
            email: item.email,
            isActive: Boolean(item.isActive),
          }),
        );

        setUserEmails(mapped);
        setForm((prev) => {
          if (prev.senderEmail) {
            return prev;
          }
          const preferred = mapped.find((e) => e.isActive)?.email || mapped[0]?.email || "";
          return { ...prev, senderEmail: preferred };
        });
      } catch {
        setUserEmails([]);
      } finally {
        setEmailsLoading(false);
      }
    };

    loadDocuments();
    loadSenderEmails();
  }, []);

  const toggleAttachment = (docId: string) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.includes(docId)
        ? prev.attachments.filter((id) => id !== docId)
        : [...prev.attachments, docId],
    }));
  };

  const handleSend = async () => {
    if (!form.senderEmail || !form.subject || !form.contactEmail) return;
    setSending(true);
    setSendError(null);

    try {
      const selectedDocuments = attachmentGroups
        .flatMap((group) => group.documents)
        .filter((doc) => form.attachments.includes(doc.id));

      const attachmentResults = await Promise.allSettled(
        selectedDocuments.map((doc) =>
          apiClient.get(`/api/v1/users/bundles/${doc.bundleId}/documents/${doc.id}/download`),
        ),
      );

      const attachments = attachmentResults
        .map((result) => {
          if (result.status !== "fulfilled") {
            return null;
          }
          return result.value?.data?.downloadUrl;
        })
        .filter((url: unknown): url is string => typeof url === "string" && url.length > 0);

      if (selectedDocuments.length > 0 && attachments.length === 0) {
        throw new Error(
          "Selected attachments could not be prepared. Check S3 credentials in user-service and try again.",
        );
      }

      await apiClient.post("/api/v1/users/emails/send", {
        from: form.senderEmail,
        to: form.contactEmail,
        subject: form.subject,
        body: form.message,
        plainText: form.message,
        attachments,
      });

      const newApp: Application = {
        id: Date.now().toString(),
        jobTitle: form.jobTitle.trim() || "General Application",
        company: form.company.trim() || "Unknown Company",
        senderEmail: form.senderEmail,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        subject: form.subject,
        message: form.message,
        attachments: form.attachments,
        sentAt: new Date().toISOString(),
        status: "sent",
      };

      setApplications((prev) => [newApp, ...prev]);
      setSent(true);
      setShowForm(false);
      router.replace("/dashboard/applications");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send application email. Please verify SMTP settings and try again.";
      setSendError(Array.isArray(message) ? message.join(", ") : String(message));
      setSent(false);
    } finally {
      setSending(false);
    }
  };

  const getAttachmentLabel = (attachmentId: string) => {
    const doc = attachmentGroups
      .flatMap((group) => group.documents)
      .find((item) => item.id === attachmentId);
    return doc?.name || attachmentId;
  };

  const formatSentAt = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-1">Applications</h1>
        <p className="text-purple-100">Track, send, and keep your application history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase font-semibold text-gray-500">Total Applications</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{applications.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase font-semibold text-gray-500">Sent</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{applications.filter((a) => a.status === "sent").length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs uppercase font-semibold text-gray-500">With Attachments</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{applications.filter((a) => a.attachments.length > 0).length}</p>
        </div>
      </div>

      {/* Application Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">New Application</h2>
              {form.jobTitle && (
                <p className="text-sm text-purple-600 font-medium mt-0.5">
                  {form.jobTitle} · {form.company}
                </p>
              )}
            </div>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Contact info extracted from job */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Job Title</label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="Backend Developer"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Tech Company"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Send From</label>
                <select
                  value={form.senderEmail}
                  onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  disabled={emailsLoading || userEmails.length === 0}
                >
                  {emailsLoading && <option value="">Loading emails...</option>}
                  {!emailsLoading && userEmails.length === 0 && (
                    <option value="">No configured sender emails</option>
                  )}
                  {!emailsLoading &&
                    userEmails.map((cfg) => (
                      <option key={cfg.id} value={cfg.email}>
                        {cfg.email}{cfg.isActive ? " (Default)" : ""}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contact Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="recruiter@company.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="+49 123 456 789"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {userEmails.length === 0 && !emailsLoading && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Configure at least one sender email in Settings before sending an application.
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Message</label>
              <textarea
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Attachments from Documents */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                Attachments — from your Documents
              </label>
              <div className="space-y-3">
                {attachmentGroups.length === 0 && (
                  <p className="text-xs text-gray-400 py-2">
                    No documents found in Bewerbungsunterlagen.
                  </p>
                )}
                {attachmentGroups.map((group) => {
                  const isOpen = openAttachmentGroup === group.id;

                  return (
                    <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-4 p-4">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                          {group.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{group.name}</h3>
                          {group.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{group.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {group.documents.length} document{group.documents.length !== 1 ? "s" : ""} · Created {group.createdAt}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenAttachmentGroup(isOpen ? null : group.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {isOpen && (
                        <div className="border-t border-gray-100 px-4 pb-3 pt-3 space-y-2">
                          {group.documents.length === 0 && (
                            <p className="text-xs text-gray-400 py-2 text-center">No documents in this mappe.</p>
                          )}

                          {group.documents.map((doc) => (
                            <label
                              key={doc.id}
                              className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-purple-200 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={form.attachments.includes(doc.id)}
                                onChange={() => toggleAttachment(doc.id)}
                                className="w-4 h-4 accent-purple-600"
                              />
                              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate">{doc.name}</p>
                                <p className="text-xs text-gray-400 truncate">{doc.typeLabel} · {doc.uploadedAt}</p>
                              </div>
                              <span className="text-xs text-gray-400">{doc.size}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {stelleUrl && (
                <a
                  href={stelleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                >
                  View Job Post
                </a>
              )}
              <button
                onClick={handleSend}
                disabled={sending || !form.subject || !form.contactEmail || !form.senderEmail}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sent && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Application sent successfully!
        </div>
      )}

      {sendError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-medium">
          {sendError}
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setSent(false); }}
          className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold text-sm"
        >
          + New Application
        </button>
      )}

      {/* Applications list */}
      {applications.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sent Applications</h2>
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-purple-200 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{app.jobTitle || "General Application"}</p>
                  <p className="text-xs text-purple-600 font-medium truncate">{app.company || "Unknown Company"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">From: {app.senderEmail}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{app.contactEmail} · {formatSentAt(app.sentAt)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{app.attachments.length} attachment{app.attachments.length === 1 ? "" : "s"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedApplication(app)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-semibold"
                  >
                    Details
                  </button>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[app.status]}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex">
          <div className="relative bg-white w-full max-w-[44%] h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div className="min-w-0 pr-4">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {selectedApplication.jobTitle || "General Application"}
                </h3>
                <p className="text-sm text-purple-600 font-semibold truncate">
                  {selectedApplication.company || "Unknown Company"}
                </p>
                <p className="text-xs text-gray-500 mt-1">Sent on {formatSentAt(selectedApplication.sentAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase font-semibold text-gray-500">From</p>
                  <p className="text-sm font-medium text-gray-800 mt-1 break-all">{selectedApplication.senderEmail}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase font-semibold text-gray-500">To</p>
                  <p className="text-sm font-medium text-gray-800 mt-1 break-all">{selectedApplication.contactEmail}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs uppercase font-semibold text-gray-500">Subject</p>
                <p className="text-sm text-gray-800 mt-1">{selectedApplication.subject}</p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs uppercase font-semibold text-gray-500">Message</p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">{selectedApplication.message}</p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Attachments</p>
                {selectedApplication.attachments.length === 0 ? (
                  <p className="text-sm text-gray-500">No attachments</p>
                ) : (
                  <div className="space-y-2">
                    {selectedApplication.attachments.map((attachmentId) => (
                      <div key={attachmentId} className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 truncate">
                        {getAttachmentLabel(attachmentId)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-black/40" onClick={() => setSelectedApplication(null)} />
        </div>
      )}

      {applications.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
          <svg className="w-14 h-14 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold">No applications yet</p>
          <p className="text-sm mt-1">Click Apply on any job to get started</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
            >
              New Application
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/jobs")}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense>
      <ApplicationsContent />
    </Suspense>
  );
}
