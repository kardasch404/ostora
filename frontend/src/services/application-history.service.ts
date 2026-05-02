import { apiClient } from "@/lib/api-client";

export interface ApplicationHistoryRecord {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  senderEmail: string;
  contactEmail: string;
  subject: string;
  message: string;
  status: "sent" | "failed";
  sentAt: string;
  templateName?: string;
  sourceUrl?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    fileSize: number;
    type: string;
    bundleName?: string;
  }>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationHistoryStats {
  total: number;
  sent: number;
  failed: number;
  emailAccounts: number;
  companies: number;
}

export const applicationHistoryApi = {
  async getAll(): Promise<ApplicationHistoryRecord[]> {
    const response = await apiClient.get("/api/v1/jobs/application-history");
    return response.data;
  },

  async getStats(): Promise<ApplicationHistoryStats> {
    const response = await apiClient.get("/api/v1/jobs/application-history/stats");
    return response.data;
  },

  async create(data: Omit<ApplicationHistoryRecord, "id" | "userId" | "createdAt" | "updatedAt">): Promise<ApplicationHistoryRecord> {
    const response = await apiClient.post("/api/v1/jobs/application-history", data);
    return response.data;
  },

  async deleteAll(): Promise<{ count: number }> {
    const response = await apiClient.delete("/api/v1/jobs/application-history");
    return response.data;
  },

  async syncFromLocalStorage(records: any[]): Promise<void> {
    for (const record of records) {
      try {
        await this.create({
          jobId: record.jobId || "",
          jobTitle: record.jobTitle || "Untitled",
          company: record.company || "Unknown",
          senderEmail: record.senderEmail || "",
          contactEmail: record.contactEmail || "",
          subject: record.subject || "",
          message: record.message || "",
          status: record.status || "sent",
          sentAt: record.sentAt || new Date().toISOString(),
          templateName: record.templateName,
          sourceUrl: record.sourceUrl,
          attachments: record.attachments,
          errorMessage: record.errorMessage,
        });
      } catch (error) {
        console.error("Failed to sync record:", error);
      }
    }
  },
};
