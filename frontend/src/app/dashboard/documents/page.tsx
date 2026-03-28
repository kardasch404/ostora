"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { Bewerbungsmappe, BewerbungDocument, CreateMappeDto, CreateDocumentDto, DocumentFileType } from "@/types/bewerbung";
import MappeForm from "@/components/dashboard/documents/MappeForm";
import DocumentForm from "@/components/dashboard/documents/DocumentForm";
import Modal from "@/components/dashboard/documents/Modal";

// ── Tech Icon Component ───────────────────────────────────────────────────────

const TechIcon = ({ id, size = 40 }: { id: string; size?: number }) => {
  const icons: Record<string, { svg: ReactElement; color: string; bgColor: string }> = {
    js: {
      svg: (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <rect width="24" height="24" fill="#000000" rx="4" />
          <path d="M6.5 20.5c0 1.5 1 2 2.5 2s2.5-.5 2.5-2v-7h-2v7c0 .5-.2.7-.5.7s-.5-.2-.5-.7v-1h-2v1zm7 0c0 1.5 1 2 2.5 2 1.8 0 2.5-.8 2.5-2.5v-2c0-1-.5-1.5-1.5-1.5h-1.5v-2h2v.5h2v-1c0-1.5-1-2-2.5-2s-2.5.5-2.5 2v2c0 1 .5 1.5 1.5 1.5h1.5v2h-2v-.5h-2v1z" fill="#F7DF1E" />
        </svg>
      ),
      color: "#F7DF1E",
      bgColor: "#000000",
    },
    ts: {
      svg: (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <rect width="24" height="24" fill="#3178C6" rx="4" />
          <path d="M12 7h-2v10h2V7zm3 0v2h3v8h2V9h3V7h-8z" fill="white" />
        </svg>
      ),
      color: "#3178C6",
      bgColor: "#FFFFFF",
    },
    react: {
      svg: (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <circle cx="12" cy="12" r="2" fill="#61DAFB" />
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#61DAFB" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(120 12 12)" />
        </svg>
      ),
      color: "#61DAFB",
      bgColor: "#20232A",
    },
    node: {
      svg: (
        <svg viewBox="0 0 24 24" fill="#339933" width={size} height={size}>
          <path d="M12 1.5c-.4 0-.8.1-1.1.3L3.3 6.3c-.7.4-1.1 1.1-1.1 1.9v7.6c0 .8.4 1.5 1.1 1.9l7.6 4.5c.7.4 1.5.4 2.2 0l7.6-4.5c.7-.4 1.1-1.1 1.1-1.9V8.2c0-.8-.4-1.5-1.1-1.9l-7.6-4.5c-.3-.2-.7-.3-1.1-.3z" />
        </svg>
      ),
      color: "#339933",
      bgColor: "#FFFFFF",
    },
    python: {
      svg: (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <path d="M12 2c-1.3 0-2.5.2-3.5.5C6.5 3 5.5 4 5.5 5.5v2h6v.5h-8c-1.5 0-2.8 1-3.2 2.8-.5 2-.5 3.2 0 5.4.3 1.6 1.2 2.8 2.7 2.8h1.8v-2.5c0-1.7 1.5-3.2 3.2-3.2h6c1.4 0 2.5-1.2 2.5-2.6v-5c0-1.4-1.2-2.5-2.5-2.7-1-.2-2.2-.5-3.5-.5zm-1.5 1.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" fill="#3776AB" />
          <path d="M20.5 6.5h-1.8v2.5c0 1.7-1.5 3.2-3.2 3.2h-6c-1.4 0-2.5 1.2-2.5 2.6v5c0 1.4 1.2 2.5 2.5 2.7 1.6.3 3.1.3 6 0 1.5-.2 2.5-1.1 2.5-2.7v-2h-6v-.5h8c1.5 0 2.1-.9 2.5-2.8.5-1.9.5-3.7 0-5.4-.3-1.5-1-2.6-2.5-2.6zm-6 13c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" fill="#FFD43B" />
        </svg>
      ),
      color: "#3776AB",
      bgColor: "#FFD43B",
    },
    java: {
      svg: (
        <svg viewBox="0 0 24 24" fill="#007396" width={size} height={size}>
          <path d="M9 16.5s-.5.3 0 .5c.7.2 1 .2 1.8.2.8 0 1.5-.1 2.2-.3 0 0 .3.2.7.3-2.5 1-5.7-.1-4.7-1.7zm-.4-1.8s-.6.4 0 .5c.8.2 1.4.2 2.5.1 1-.1 1.9-.3 1.9-.3s.3.3.7.4c-4 1.2-8.5.1-5.1-1.7z" />
          <path d="M13.5 11.5c.7.8-.2 1.5-.2 1.5s1.8-.9.9-2c-.8-1-1.4-1.5 1.9-3.2 0 0-5.2 1.3-2.6 3.7z" />
          <path d="M18.5 18s.4.3-.4.6c-1.5.5-6.3.7-7.6 0-.5-.2.4-.5.7-.6.3-.1.5-.1.5-.1-.6-.4-3.8.8-1.6 1.1 5.3.8 9.7-.4 8.4-1z" />
        </svg>
      ),
      color: "#007396",
      bgColor: "#FFFFFF",
    },
    docker: {
      svg: (
        <svg viewBox="0 0 24 24" fill="#2496ED" width={size} height={size}>
          <path d="M13.5 10.5h2v2h-2v-2zm-3 0h2v2h-2v-2zm-3 0h2v2h-2v-2zm6-3h2v2h-2v-2zm-3 0h2v2h-2v-2zm-3 0h2v2h-2v-2zm-3 0h2v2h-2v-2zm9 6h2v2h-2v-2zm-3 0h2v2h-2v-2zm11.5-1.5c-.5-.3-1.5-.4-2.3-.1-.1-.8-.7-1.5-1.7-2.1l-.3-.2-.2.3c-.4.6-.6 1.4-.5 2.1.1.5.3.9.6 1.3-.3.2-.7.3-1.1.4h-14c-.6 0-1 .4-1 1 0 1.5.2 3 .9 4.4.7 1.3 1.7 2.3 3.1 2.9 1.3.6 2.8.9 4.3.9 1.2 0 2.4-.2 3.5-.5 1.5-.5 2.8-1.3 3.9-2.4 1.5-1.5 2.5-3.5 2.8-5.5h.2c1.3 0 2.1-.5 2.6-1 .3-.3.5-.7.6-1.1l.1-.3-.3-.2z" />
        </svg>
      ),
      color: "#2496ED",
      bgColor: "#FFFFFF",
    },
    aws: {
      svg: (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <path d="M6.76 10.17c0 .4.03.73.09.98.06.25.15.52.29.79.05.09.07.18.07.26 0 .11-.07.22-.22.33l-.73.49c-.1.07-.21.1-.31.1-.12 0-.24-.06-.36-.17-.14-.15-.26-.31-.36-.49-.1-.18-.2-.38-.31-.61-.78.92-1.76 1.38-2.94 1.38-.84 0-1.51-.24-2-.72-.49-.48-.74-1.13-.74-1.93 0-.85.3-1.54.91-2.06.61-.52 1.42-.78 2.44-.78.34 0 .69.03 1.06.08.37.05.75.13 1.15.21v-.71c0-.74-.15-1.26-.46-1.55-.32-.29-.85-.44-1.61-.44-.35 0-.7.04-1.07.12-.37.08-.73.18-1.08.3-.16.06-.28.09-.35.11-.07.01-.13.02-.16.02-.14 0-.21-.1-.21-.31v-.49c0-.16.02-.28.07-.35.05-.07.14-.14.28-.21.35-.18.77-.33 1.26-.45.49-.13 1.02-.19 1.58-.19 1.21 0 2.09.27 2.65.82.55.55.83 1.38.83 2.5v3.3zm-4.08 1.53c.33 0 .67-.06 1.03-.18.36-.12.68-.33.95-.62.16-.18.28-.38.35-.61.07-.23.11-.5.11-.82v-.39c-.29-.06-.6-.11-.92-.15-.32-.04-.64-.06-.96-.06-.68 0-1.18.13-1.49.4-.31.27-.47.65-.47 1.15 0 .47.12.82.36 1.07.24.25.58.37 1.04.37zm8.1 1.09c-.18 0-.3-.03-.38-.1-.08-.07-.15-.21-.22-.42l-2.45-8.06c-.07-.23-.11-.38-.11-.45 0-.18.09-.27.27-.27h1.1c.19 0 .32.03.39.1.08.07.14.21.21.42l1.75 6.9 1.63-6.9c.06-.23.13-.37.2-.42.08-.07.22-.1.4-.1h.9c.19 0 .32.03.4.1.08.07.15.21.21.42l1.65 6.99 1.8-6.99c.07-.23.14-.37.21-.42.08-.07.21-.10.39-.10h1.04c.18 0 .28.09.28.27 0 .05-.01.11-.03.18-.02.07-.05.16-.09.27l-2.51 8.06c-.07.23-.14.37-.22.42-.08.07-.21.1-.38.1h-.97c-.19 0-.32-.03-.4-.1-.08-.07-.15-.21-.21-.43l-1.62-6.74-1.61 6.73c-.06.23-.13.37-.21.43-.08.07-.22.1-.4.1h-.97zm13.01.28c-.53 0-1.06-.06-1.58-.18-.52-.12-.93-.26-1.21-.41-.17-.09-.28-.19-.33-.29-.05-.1-.07-.21-.07-.32v-.51c0-.21.08-.31.23-.31.06 0 .12.01.18.03.06.02.15.06.27.11.37.16.77.29 1.2.37.43.09.86.13 1.29.13.68 0 1.21-.12 1.58-.35.37-.23.56-.57.56-1.01 0-.3-.1-.55-.29-.76-.19-.21-.55-.39-1.06-.56l-1.52-.48c-.77-.24-1.33-.6-1.69-1.06-.36-.46-.54-1-.54-1.6 0-.46.1-.87.3-1.23.2-.36.47-.67.81-.93.34-.26.73-.46 1.18-.59.45-.14.93-.2 1.44-.2.23 0 .47.01.7.04.24.03.46.07.68.11.21.05.41.1.61.16.2.06.36.12.49.18.15.08.26.16.33.25.07.09.1.2.10.35v.47c0 .21-.08.32-.23.32-.09 0-.23-.05-.42-.14-.64-.28-1.36-.42-2.17-.42-.62 0-1.11.1-1.45.31-.34.21-.51.52-.51.94 0 .3.1.56.31.77.21.21.59.41 1.14.59l1.49.47c.76.24 1.31.58 1.65 1.02.34.44.51.96.51 1.54 0 .47-.1.9-.29 1.29-.19.39-.47.73-.83 1.01-.36.28-.79.5-1.29.65-.51.15-1.07.23-1.68.23z" fill="#FF9900" />
          <path d="M21.69 17.72c-2.93 2.16-7.19 3.31-10.85 3.31-5.13 0-9.75-1.9-13.24-5.06-.27-.25-.03-.59.3-.4 3.76 2.19 8.41 3.5 13.21 3.5 3.24 0 6.8-.67 10.08-2.06.49-.21.91.32.5.71z" fill="#FF9900" />
          <path d="M23.14 15.95c-.37-.48-2.47-.23-3.41-.11-.29.03-.33-.22-.07-.4 1.67-1.18 4.41-.84 4.73-.44.32.4-.09 3.15-1.66 4.47-.24.2-.47.09-.36-.17.35-.88 1.14-2.87.77-3.35z" fill="#FF9900" />
        </svg>
      ),
      color: "#FF9900",
      bgColor: "#232F3E",
    },
    git: {
      svg: (
        <svg viewBox="0 0 24 24" fill="#F05032" width={size} height={size}>
          <path d="M23.5 11.6l-11-11c-.6-.6-1.5-.6-2.1 0l-2.3 2.3 2.9 2.9c.6-.2 1.4-.1 2 .5.6.6.7 1.4.5 2l2.8 2.8c.6-.2 1.4-.1 2 .5.8.8.8 2 0 2.8-.8.8-2 .8-2.8 0-.6-.6-.7-1.5-.4-2.2l-2.6-2.6v6.9c.2.1.4.2.5.4.8.8.8 2 0 2.8-.8.8-2 .8-2.8 0-.8-.8-.8-2 0-2.8.2-.2.4-.3.7-.4v-7c-.2-.1-.5-.2-.7-.4-.6-.6-.7-1.5-.4-2.2l-2.9-2.9-7.6 7.6c-.6.6-.6 1.5 0 2.1l11 11c.6.6 1.5.6 2.1 0l10.9-10.9c.6-.6.6-1.5 0-2.1z" />
        </svg>
      ),
      color: "#F05032",
      bgColor: "#FFFFFF",
    },
    postgres: {
      svg: (
        <svg viewBox="0 0 24 24" fill="#4169E1" width={size} height={size}>
          <path d="M17.1 2.5c-.2 0-.5 0-.7.1-1.3.3-2.1 1.3-2.5 2.5-.3-.1-.6-.1-.9-.1-1.9 0-3.5 1.1-4.3 2.7-.5-.2-1-.3-1.6-.3-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2.1 3.5-.1.3-.1.7-.1 1 0 3.3 2.7 6 6 6 .8 0 1.5-.2 2.2-.4.7.3 1.5.4 2.3.4 3.3 0 6-2.7 6-6 0-.3 0-.7-.1-1 1.2-.7 2.1-2 2.1-3.5 0-2.2-1.8-4-4-4-.6 0-1.1.1-1.6.3-.8-1.6-2.4-2.7-4.3-2.7-.3 0-.6 0-.9.1-.4-1.2-1.2-2.2-2.5-2.5-.2-.1-.5-.1-.7-.1zm0 1c.1 0 .3 0 .4.1.8.2 1.4.8 1.7 1.6-1.1.5-2 1.4-2.5 2.5-.5-.2-1-.3-1.6-.3-.6 0-1.1.1-1.6.3-.5-1.1-1.4-2-2.5-2.5.3-.8.9-1.4 1.7-1.6.1-.1.3-.1.4-.1.2 0 .4 0 .6.1 1 .3 1.7 1.1 1.9 2.1.2-.1.5-.1.7-.1.3 0 .5 0 .7.1.2-1 .9-1.8 1.9-2.1.2-.1.4-.1.6-.1z" />
        </svg>
      ),
      color: "#4169E1",
      bgColor: "#FFFFFF",
    },
  };
  return icons[id]?.svg || icons.js.svg;
};

// ── helpers ───────────────────────────────────────────────────────────────────

const FILE_TYPE_BADGE: Record<DocumentFileType, string> = {
  cv: "bg-black text-white",
  cover_letter: "bg-gray-800 text-white",
  certificate: "bg-gray-600 text-white",
  other: "bg-gray-400 text-white",
};

const FILE_TYPE_LABEL: Record<DocumentFileType, string> = {
  cv: "CV",
  cover_letter: "Cover Letter",
  certificate: "Certificate",
  other: "Other",
};

const DEFAULT_LOGOS = [
  { id: "js", name: "JavaScript", color: "#F7DF1E", bgColor: "#000000" },
  { id: "ts", name: "TypeScript", color: "#3178C6", bgColor: "#FFFFFF" },
  { id: "react", name: "React", color: "#61DAFB", bgColor: "#20232A" },
  { id: "node", name: "Node.js", color: "#339933", bgColor: "#FFFFFF" },
  { id: "python", name: "Python", color: "#3776AB", bgColor: "#FFD43B" },
  { id: "java", name: "Java", color: "#007396", bgColor: "#FFFFFF" },
  { id: "docker", name: "Docker", color: "#2496ED", bgColor: "#FFFFFF" },
  { id: "aws", name: "AWS", color: "#FF9900", bgColor: "#232F3E" },
  { id: "git", name: "Git", color: "#F05032", bgColor: "#FFFFFF" },
  { id: "postgres", name: "PostgreSQL", color: "#4169E1", bgColor: "#FFFFFF" },
] as const;

type ApiDocumentType = "CV" | "COVER_LETTER" | "PORTFOLIO" | "OTHER";

interface ApiBundle {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
}

interface ApiDocument {
  id: string;
  bundleId: string;
  type: ApiDocumentType;
  filename: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

const toUiType = (type: ApiDocumentType): DocumentFileType => {
  if (type === "CV") return "cv";
  if (type === "COVER_LETTER") return "cover_letter";
  if (type === "PORTFOLIO") return "certificate";
  return "other";
};

const toApiType = (type: DocumentFileType): ApiDocumentType => {
  if (type === "cv") return "CV";
  if (type === "cover_letter") return "COVER_LETTER";
  if (type === "certificate") return "PORTFOLIO";
  return "OTHER";
};

const bytesToLabel = (bytes: number): string => {
  if (!bytes || Number.isNaN(bytes)) return "0 KB";
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const labelToBytes = (label: string): number => {
  const numeric = Number.parseFloat((label || "").replace(/[^\d.]/g, ""));
  if (Number.isNaN(numeric) || numeric <= 0) return 1024;
  return Math.round(numeric * 1024);
};

// ── types for modal state ─────────────────────────────────────────────────────

type ModalState =
  | { type: "create_mappe" }
  | { type: "edit_mappe"; mappe: Bewerbungsmappe }
  | { type: "delete_mappe"; mappe: Bewerbungsmappe }
  | { type: "add_doc"; mappeId: string }
  | { type: "edit_doc"; mappe: Bewerbungsmappe; doc: BewerbungDocument }
  | { type: "delete_doc"; mappe: Bewerbungsmappe; doc: BewerbungDocument }
  | null;

// ── component ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [mappen, setMappen] = useState<Bewerbungsmappe[]>([]);
  const [bundleLogos, setBundleLogos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");
  const [openMappe, setOpenMappe] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const resolveLogo = useCallback(
    (bundleId: string, index: number) => bundleLogos[bundleId] || DEFAULT_LOGOS[index % DEFAULT_LOGOS.length].id,
    [bundleLogos],
  );

  const loadMappen = useCallback(async () => {
    setLoading(true);
    try {
      const bundlesRes = await apiClient.get("/api/v1/users/bundles");
      const bundles: ApiBundle[] = Array.isArray(bundlesRes.data)
        ? bundlesRes.data
        : Array.isArray(bundlesRes.data?.data)
          ? bundlesRes.data.data
          : Array.isArray(bundlesRes.data?.value)
            ? bundlesRes.data.value
          : [];

      const docsSettled = await Promise.allSettled(
        bundles.map(async (b) => {
          const docsRes = await apiClient.get(`/api/v1/users/bundles/${b.id}/documents`);
          const docs: ApiDocument[] = Array.isArray(docsRes.data)
            ? docsRes.data
            : Array.isArray(docsRes.data?.data)
              ? docsRes.data.data
              : Array.isArray(docsRes.data?.value)
                ? docsRes.data.value
                : [];
          return { bundleId: b.id, docs };
        }),
      );

      const docsByBundle = new Map(
        docsSettled
          .filter((r): r is PromiseFulfilledResult<{ bundleId: string; docs: ApiDocument[] }> => r.status === "fulfilled")
          .map((r) => [r.value.bundleId, r.value.docs]),
      );

      const mapped = bundles.map((b, index) => {
        const docs = (docsByBundle.get(b.id) || []).map((doc) => ({
          id: doc.id,
          mappeId: b.id,
          name: doc.filename,
          fileType: toUiType(doc.type),
          size: bytesToLabel(doc.fileSize),
          mimeType: doc.mimeType,
          uploadedAt: new Date(doc.createdAt).toISOString().split("T")[0],
        } as BewerbungDocument));

        return {
          id: b.id,
          name: b.name,
          description: b.description || "",
          logo: resolveLogo(b.id, index),
          createdAt: new Date(b.createdAt).toISOString().split("T")[0],
          documents: docs,
        } as Bewerbungsmappe;
      });

      setMappen(mapped);
      setLoadError("");
    } catch (error: unknown) {
      let message = "Failed to load Bewerbungsunterlagen from database.";

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const apiMessage = error.response?.data?.message;

        if (status === 401) {
          message = "Session expired or unauthorized. Please log in again.";
        } else if (status === 403) {
          message = "You do not have permission to view these documents.";
        } else if (status) {
          message = Array.isArray(apiMessage)
            ? apiMessage.join(", ")
            : apiMessage || `Failed to load Bewerbungsunterlagen (HTTP ${status}).`;
        } else {
          message = "Could not reach server. Please check your connection and try again.";
        }
      }

      setLoadError(String(message));
      setMappen([]);
    } finally {
      setLoading(false);
    }
  }, [resolveLogo]);

  useEffect(() => {
    loadMappen();
  }, [loadMappen]);

  // ── Mappe handlers ──────────────────────────────────────────────────────────
  const handleCreateMappe = async (dto: CreateMappeDto) => {
    try {
      const res = await apiClient.post("/api/v1/users/bundles", {
        name: dto.name,
        description: dto.description,
      });
      const createdId = res.data?.id as string | undefined;
      if (createdId) {
        setBundleLogos((prev) => ({ ...prev, [createdId]: dto.logo }));
      }
      setModal(null);
      await loadMappen();
    } catch {
      alert("Failed to create Bewerbungsmappe");
    }
  };

  const handleUpdateMappe = async (id: string, dto: CreateMappeDto) => {
    try {
      await apiClient.patch(`/api/v1/users/bundles/${id}`, {
        name: dto.name,
        description: dto.description,
      });
      setBundleLogos((prev) => ({ ...prev, [id]: dto.logo }));
      setModal(null);
      await loadMappen();
    } catch {
      alert("Failed to update Bewerbungsmappe");
    }
  };

  const handleDeleteMappe = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/users/bundles/${id}`);
      if (openMappe === id) setOpenMappe(null);
      setBundleLogos((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setModal(null);
      await loadMappen();
    } catch {
      alert("Failed to delete Bewerbungsmappe");
    }
  };

  // ── Document handlers ───────────────────────────────────────────────────────
  const handleAddDoc = async (dto: CreateDocumentDto) => {
    try {
      if (!dto.file) {
        alert("Please select a file before adding document.");
        return;
      }

      const createRes = await apiClient.post(`/api/v1/users/bundles/${dto.mappeId}/documents`, {
        type: toApiType(dto.fileType),
        filename: dto.name,
        mimeType: dto.mimeType || "application/pdf",
        fileSize: labelToBytes(dto.size),
      });

      const payload = createRes.data?.data || createRes.data;
      const uploadUrl: string | undefined = payload?.uploadUrl;
      const createdDocId: string | undefined = payload?.document?.id;

      if (!uploadUrl) {
        throw new Error("Upload URL was not returned by API.");
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": dto.mimeType || "application/octet-stream",
        },
        body: dto.file,
      });

      if (!uploadRes.ok) {
        const errorBody = await uploadRes.text();
        if (createdDocId) {
          try {
            await apiClient.delete(`/api/v1/users/bundles/${dto.mappeId}/documents/${createdDocId}`);
          } catch {
            // Best-effort rollback only.
          }
        }
        throw new Error(`S3 upload failed with status ${uploadRes.status}. ${errorBody.slice(0, 500)}`);
      }

      setModal(null);
      await loadMappen();
    } catch (error: any) {
      const message =
        error?.message ||
        "Failed to add document. The file could not be uploaded to storage.";
      alert(message);
    }
  };

  const handleUpdateDoc = async (mappeId: string, docId: string, dto: CreateDocumentDto) => {
    try {
      await apiClient.patch(`/api/v1/users/bundles/${mappeId}/documents/${docId}`, {
        type: toApiType(dto.fileType),
        filename: dto.name,
        mimeType: dto.mimeType || "application/pdf",
        fileSize: labelToBytes(dto.size),
      });
      setModal(null);
      await loadMappen();
    } catch {
      alert("Failed to update document");
    }
  };

  const handleDeleteDoc = async (mappeId: string, docId: string) => {
    try {
      await apiClient.delete(`/api/v1/users/bundles/${mappeId}/documents/${docId}`);
      setModal(null);
      await loadMappen();
    } catch {
      alert("Failed to delete document");
    }
  };

  const handlePreviewDoc = async (mappeId: string, docId: string, docName: string) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewTitle(docName);

    try {
      const res = await apiClient.get(`/api/v1/users/bundles/${mappeId}/documents/${docId}/download`);
      const url = res.data?.downloadUrl;
      if (!url || typeof url !== "string") {
        throw new Error("No download URL returned");
      }
      setPreviewUrl(url);
    } catch {
      setPreviewUrl("");
      setPreviewError("Could not open document preview. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const mappeCountLabel = useMemo(
    () => `${mappen.length} folder${mappen.length !== 1 ? "s" : ""}`,
    [mappen.length],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <p className="text-caption text-gray-400">Documents</p>
        <h1 className="mt-2 text-display-md">Bewerbungsunterlagen</h1>
        <p className="mt-2 text-body text-gray-600">Organise your application folders and documents</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{mappeCountLabel}</p>
        <button
          onClick={() => setModal({ type: "create_mappe" })}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors h-10 px-6 bg-black text-white hover:bg-gray-800 gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Mappe
        </button>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">
          Loading Bewerbungsunterlagen...
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Mappen list */}
      {mappen.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📁</div>
          <p className="font-semibold">No folders yet</p>
          <p className="text-sm mt-1">Create your first Bewerbungsmappe to get started</p>
        </div>
      )}

      <div className="space-y-4">
        {mappen.map((mappe) => {
          const isOpen = openMappe === mappe.id;
          return (
            <div key={mappe.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Mappe header row */}
              <div className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 bg-gray-100 rounded-button flex items-center justify-center flex-shrink-0">
                  <TechIcon id={mappe.logo} size={32} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-gray-900 truncate">{mappe.name}</h2>
                  {mappe.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{mappe.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {mappe.documents.length} document{mappe.documents.length !== 1 ? "s" : ""} · Created {mappe.createdAt}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setModal({ type: "add_doc", mappeId: mappe.id })}
                    className="px-3 py-1.5 bg-black text-white rounded-button hover:bg-gray-800 text-xs font-semibold transition-colors"
                  >
                    + Doc
                  </button>
                  <button
                    onClick={() => setModal({ type: "edit_mappe", mappe })}
                    className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-button transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setModal({ type: "delete_mappe", mappe })}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-button transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setOpenMappe(isOpen ? null : mappe.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-button transition-colors"
                  >
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Documents list (collapsible) */}
              {isOpen && (
                <div className="border-t border-gray-100 px-5 pb-4 pt-3 space-y-2">
                  {mappe.documents.length === 0 && (
                    <p className="text-xs text-gray-400 py-3 text-center">No documents yet — click "+ Doc" to add one</p>
                  )}
                  {mappe.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-button hover:bg-gray-100 transition-colors group">
                      <div className="w-8 h-8 bg-white border border-gray-200 rounded-button flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.size} · {doc.uploadedAt}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${FILE_TYPE_BADGE[doc.fileType]}`}>
                        {FILE_TYPE_LABEL[doc.fileType]}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePreviewDoc(mappe.id, doc.id, doc.name)}
                          className="p-1 text-gray-400 hover:text-black rounded transition-colors"
                          title="Preview"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setModal({ type: "edit_doc", mappe, doc })}
                          className="p-1 text-gray-400 hover:text-black rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setModal({ type: "delete_doc", mappe, doc })}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modals ── */}

      {modal?.type === "create_mappe" && (
        <Modal title="New Bewerbungsmappe" onClose={() => setModal(null)}>
          <MappeForm onSave={handleCreateMappe} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === "edit_mappe" && (
        <Modal title="Edit Mappe" onClose={() => setModal(null)}>
          <MappeForm
            initial={modal.mappe}
            onSave={(dto) => handleUpdateMappe(modal.mappe.id, dto)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "delete_mappe" && (
        <Modal title="Delete Mappe" onClose={() => setModal(null)}>
          <p className="text-sm text-gray-600 mb-5">
            Delete <span className="font-bold">{modal.mappe.name}</span> and all its {modal.mappe.documents.length} document(s)? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-semibold">
              Cancel
            </button>
            <button onClick={() => handleDeleteMappe(modal.mappe.id)} className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-bold">
              Delete
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === "add_doc" && (
        <Modal title="Add Document" onClose={() => setModal(null)}>
          <DocumentForm mappeId={modal.mappeId} onSave={handleAddDoc} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === "edit_doc" && (
        <Modal title="Edit Document" onClose={() => setModal(null)}>
          <DocumentForm
            mappeId={modal.mappe.id}
            initial={modal.doc}
            onSave={(dto) => handleUpdateDoc(modal.mappe.id, modal.doc.id, dto)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "delete_doc" && (
        <Modal title="Delete Document" onClose={() => setModal(null)}>
          <p className="text-sm text-gray-600 mb-5">
            Delete <span className="font-bold">{modal.doc.name}</span>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-semibold">
              Cancel
            </button>
            <button onClick={() => handleDeleteDoc(modal.mappe.id, modal.doc.id)} className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-bold">
              Delete
            </button>
          </div>
        </Modal>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="relative bg-white w-full max-w-[42%] h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-gray-500">Document Preview</p>
                <h3 className="text-sm font-bold text-gray-900 truncate">{previewTitle || "PDF"}</h3>
              </div>
              <button
                onClick={() => {
                  setPreviewOpen(false);
                  setPreviewUrl("");
                  setPreviewError("");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-hidden">
              {previewLoading && (
                <div className="h-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
                  Loading preview...
                </div>
              )}

              {!previewLoading && previewError && (
                <div className="h-full rounded-lg border border-red-200 bg-red-50 flex items-center justify-center text-sm text-red-700 px-4 text-center">
                  {previewError}
                </div>
              )}

              {!previewLoading && !previewError && previewUrl && (
                <iframe
                  src={previewUrl}
                  title={previewTitle || "Document preview"}
                  className="w-full h-full rounded-lg border border-gray-200"
                />
              )}
            </div>
          </div>

          <div className="flex-1 bg-black/40" onClick={() => setPreviewOpen(false)} />
        </div>
      )}
    </div>
  );
}
