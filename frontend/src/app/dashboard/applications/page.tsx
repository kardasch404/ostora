"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import {
  APPLICATION_HISTORY_STORAGE_KEY,
  type AppliedJobRecord,
} from "@/lib/application-state";

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

function ApplicationForm() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const jobTitle = searchParams.get("title");
  const company = searchParams.get("company");
  const location = searchParams.get("location");
  
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [formData, setFormData] = useState({
    jobTitle: jobTitle || "",
    company: company || "",
    location: location || "",
    sendFrom: "zz2406143@gmail.com",
    recipientEmail: "",
    subject: "",
    message: "",
    attachments: {} as Record<string, boolean>,
  });

  useEffect(() => {
    loadBundles();
  }, []);

  useEffect(() => {
    if (jobTitle && company) {
      setFormData(prev => ({
        ...prev,
        jobTitle: jobTitle || "",
        company: company || "",
        location: location || "",
        subject: `Application for ${jobTitle} at ${company}`,
        message: `Dear Hiring Manager,

I am writing to express my interest in the ${jobTitle} position at ${company}.

I believe my skills and experience make me a strong candidate for this role.

Please find my documents attached.

Best regards`,
      }));
    }
  }, [jobTitle, company, location]);

  const loadBundles = async () => {
    try {
      const bundlesRes = await apiClient.get("/api/v1/users/bundles");
      const bundlesData = Array.isArray(bundlesRes.data)
        ? bundlesRes.data
        : Array.isArray(bundlesRes.data?.data)
          ? bundlesRes.data.data
          : [];

      const bundlesWithDocs = await Promise.all(
        bundlesData.map(async (bundle: any) => {
          try {
            const docsRes = await apiClient.get(`/api/v1/users/bundles/${bundle.id}/documents`);
            const docs = Array.isArray(docsRes.data)
              ? docsRes.data
              : Array.isArray(docsRes.data?.data)
                ? docsRes.data.data
                : [];
            return {
              id: bundle.id,
              name: bundle.name,
              documents: docs.map((doc: any) => ({
                id: doc.id,
                filename: doc.filename,
                fileSize: doc.fileSize,
                type: doc.type,
              })),
            };
          } catch {
            return { id: bundle.id, name: bundle.name, documents: [] };
          }
        })
      );

      setBundles(bundlesWithDocs);
    } catch (error) {
      console.error("Failed to load bundles");
    }
  };

  const handleSendApplication = async () => {
    // Validation
    if (!formData.sendFrom) {
      alert("Please select sender email");
      return;
    }
    if (!formData.recipientEmail) {
      alert("Please enter recipient email");
      return;
    }
    if (!formData.company) {
      alert("Please enter company name");
      return;
    }
    if (!formData.subject) {
      alert("Please enter email subject");
      return;
    }
    if (!formData.message) {
      alert("Please enter email message");
      return;
    }

    // Get selected document IDs and fetch their download URLs
    const selectedDocIds = Object.entries(formData.attachments)
      .filter(([_, checked]) => checked)
      .map(([docId]) => docId);

    try {
      // Get presigned download URLs for attachments
      const attachmentUrls: string[] = [];
      for (const docId of selectedDocIds) {
        // Find which bundle contains this document
        for (const bundle of bundles) {
          const doc = bundle.documents.find(d => d.id === docId);
          if (doc) {
            try {
              const urlRes = await apiClient.get(`/api/v1/users/bundles/${bundle.id}/documents/${docId}/download`);
              const downloadUrl = urlRes.data?.downloadUrl;
              if (downloadUrl) {
                attachmentUrls.push(downloadUrl);
              }
            } catch (err) {
              console.error(`Failed to get download URL for document ${docId}:`, err);
            }
            break;
          }
        }
      }

      // Prepare email data matching SendEmailDto structure
      const emailData = {
        from: formData.sendFrom,
        to: formData.recipientEmail,
        subject: formData.subject,
        body: formData.message.replace(/\n/g, '<br>'),
        plainText: formData.message,
        attachments: attachmentUrls,
      };

      // Send through user email proxy so sender config is resolved server-side.
      await apiClient.post(SEND_APPLICATION_ENDPOINT, emailData);

      // Save to application history
      const applicationRecord: AppliedJobRecord = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: jobId || "",
        jobTitle: formData.jobTitle,
        company: formData.company,
        senderEmail: formData.sendFrom,
        contactEmail: formData.recipientEmail,
        subject: formData.subject,
        message: formData.message,
        sentAt: new Date().toISOString(),
        status: "sent",
      };

      // Update localStorage
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY);
        let history: AppliedJobRecord[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            history = Array.isArray(parsed) ? parsed : [];
          } catch {
            history = [];
          }
        }
        history.unshift(applicationRecord);
        window.localStorage.setItem(APPLICATION_HISTORY_STORAGE_KEY, JSON.stringify(history));
      }

      // Success feedback
      alert(`✅ Application sent successfully to ${formData.company}!`);

      // Reset form
      setFormData({
        jobTitle: "",
        company: "",
        location: "",
        sendFrom: "zz2406143@gmail.com",
        recipientEmail: "",
        subject: "",
        message: "",
        attachments: {},
      });

      // Reload page to update history
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to send application:", error);
      
      // Save as failed in history
      const failedRecord: AppliedJobRecord = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: jobId || "",
        jobTitle: formData.jobTitle,
        company: formData.company,
        senderEmail: formData.sendFrom,
        contactEmail: formData.recipientEmail,
        subject: formData.subject,
        message: formData.message,
        sentAt: new Date().toISOString(),
        status: "failed",
      };

      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY);
        let history: AppliedJobRecord[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            history = Array.isArray(parsed) ? parsed : [];
          } catch {
            history = [];
          }
        }
        history.unshift(failedRecord);
        window.localStorage.setItem(APPLICATION_HISTORY_STORAGE_KEY, JSON.stringify(history));
      }

      const errorMessage = error?.response?.data?.message || error?.message || "Failed to send application";
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">New Application</h2>
        <p className="text-sm text-gray-600 mt-1">Fill in the details and send your application</p>
      </div>

      <div className="space-y-5">
        {/* Job Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Company *</label>
            <input
              type="text"
              placeholder="e.g. Google"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
            <input
              type="text"
              placeholder="e.g. Berlin, Germany"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Send From & Recipient */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Send From</label>
            <select
              value={formData.sendFrom}
              onChange={(e) => setFormData({ ...formData, sendFrom: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            >
              <option value="zz2406143@gmail.com">zz2406143@gmail.com (Default)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Email *</label>
            <input
              type="email"
              placeholder="hr@company.com"
              value={formData.recipientEmail}
              onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
          <input
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Application for [Position] at [Company]"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
          <textarea
            rows={8}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Write your application message here..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        {/* Attachments */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Attachments from Bewerbungsmappe</p>
          {bundles.length === 0 ? (
            <div className="border border-gray-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-2">No documents found</p>
              <Link href="/dashboard/documents" className="text-sm text-black font-semibold hover:underline">
                Go to Documents to upload files
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {bundles.map((bundle) => (
                <div key={bundle.id} className="border border-gray-300 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3">{bundle.name}</p>
                  {bundle.documents.length === 0 ? (
                    <p className="text-xs text-gray-400">No documents in this folder</p>
                  ) : (
                    <div className="space-y-2.5">
                      {bundle.documents.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        >
                          <input
                            className="w-4 h-4 accent-black"
                            type="checkbox"
                            checked={formData.attachments[doc.id] || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                attachments: { ...formData.attachments, [doc.id]: e.target.checked },
                              })
                            }
                          />
                          <span className="flex-1 font-medium truncate">{doc.filename}</span>
                          <span className="text-xs text-gray-400">{formatFileSize(doc.fileSize)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSendApplication}
            className="flex-1 inline-flex items-center justify-center rounded-full h-11 px-6 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Application
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ApplicationsPage() {
  const [history, setHistory] = useState<AppliedJobRecord[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const stats = useMemo(() => {
    const sent = history.filter((item) => item.status === "sent").length;
    const failed = history.filter((item) => item.status === "failed").length;
    const companies = new Set(history.map((item) => item.company).filter(Boolean)).size;
    return { sent, failed, total: history.length, companies };
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(APPLICATION_HISTORY_STORAGE_KEY);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <p className="text-caption text-gray-400">Applications Center</p>
        <h1 className="mt-2 text-display-md">Track Every Application</h1>
        <p className="mt-2 text-body text-gray-600">Monitor your application history and success metrics.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/fast-apply" className="btn-primary">
            Fast Apply
          </Link>
          <button type="button" onClick={clearHistory} className="btn-secondary text-red-600 border-red-600 hover:bg-red-50">
            Clear History
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <article className="card-flat">
          <p className="text-caption text-gray-400">Total</p>
          <p className="mt-2 text-display-md">{stats.total}</p>
        </article>
        <article className="card-flat">
          <p className="text-caption text-gray-400">Sent</p>
          <p className="mt-2 text-display-md">{stats.sent}</p>
        </article>
        <article className="card-flat">
          <p className="text-caption text-gray-400">Failed</p>
          <p className="mt-2 text-display-md text-gray-600">{stats.failed}</p>
        </article>
        <article className="card-flat">
          <p className="text-caption text-gray-400">Companies</p>
          <p className="mt-2 text-display-md">{stats.companies}</p>
        </article>
      </section>

      {/* Application Form - Always Visible */}
      <Suspense fallback={<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"><p className="text-gray-500">Loading form...</p></div>}>
        <ApplicationForm />
      </Suspense>

      <section className="card-flat">
        <h2 className="text-display-sm mb-4">Application History</h2>
        {history.length === 0 ? (
          <p className="text-body text-gray-500">No applications yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-button border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-body-sm font-semibold text-black">{item.jobTitle}</p>
                  <p className="text-xs text-gray-500">{item.company} | {item.contactEmail} | {new Date(item.sentAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "sent" ? "bg-black text-white" : "bg-gray-300 text-gray-700"}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
