// ── DTOs ──────────────────────────────────────────────────────────────────────

export type DocumentFileType = "cv" | "cover_letter" | "certificate" | "other";

export interface BewerbungDocument {
  id: string;
  mappeId: string;
  name: string;
  fileType: DocumentFileType;
  size: string;       // e.g. "245 KB"
  mimeType: string;
  uploadedAt: string; // ISO date string
}

export interface Bewerbungsmappe {
  id: string;
  name: string;
  description: string;
  logo: string;       // emoji or URL
  createdAt: string;
  documents: BewerbungDocument[];
}

// ── Create / Update DTOs ──────────────────────────────────────────────────────

export interface CreateMappeDto {
  name: string;
  description: string;
  logo: string;
}

export interface UpdateMappeDto extends Partial<CreateMappeDto> {}

export interface CreateDocumentDto {
  mappeId: string;
  name: string;
  fileType: DocumentFileType;
  size: string;
  mimeType: string;
  file?: File;
}

export interface UpdateDocumentDto extends Partial<Omit<CreateDocumentDto, "mappeId" | "file">> {}
