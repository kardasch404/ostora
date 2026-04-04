export const APPLICATION_HISTORY_STORAGE_KEY = "ostora:applications:history";
export const MESSAGE_TEMPLATES_STORAGE_KEY = "ostora:messageTemplates:v1";
export const SAVED_JOBS_STORAGE_KEY = "ostora:savedJobs:v1";
export const FAST_APPLY_QUEUE_STORAGE_KEY = "ostora:fastApply:queue:v1";

export interface AppliedJobRecord {
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

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getApplicationHistory(): AppliedJobRecord[] {
  if (typeof window === "undefined") return [];
  return safeParseArray<AppliedJobRecord>(window.localStorage.getItem(APPLICATION_HISTORY_STORAGE_KEY));
}

export function setApplicationHistory(items: AppliedJobRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APPLICATION_HISTORY_STORAGE_KEY, JSON.stringify(items));
}

export function getAppliedJobIds(): Set<string> {
  const history = getApplicationHistory();
  return new Set(history.filter((item) => item.status === "sent").map((item) => String(item.jobId)));
}
