import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Bewerbungsmappe,
  BewerbungDocument,
  CreateMappeDto,
  UpdateMappeDto,
  CreateDocumentDto,
  UpdateDocumentDto,
} from "@/types/bewerbung";

interface BewerbungState {
  mappen: Bewerbungsmappe[];
}

const SEED: Bewerbungsmappe[] = [
  {
    id: "1",
    name: "Software Engineer Applications",
    description: "Applications for frontend and fullstack roles",
    logo: "💼",
    createdAt: "2024-01-10",
    documents: [
      { id: "d1", mappeId: "1", name: "CV_2024.pdf", fileType: "cv", size: "245 KB", mimeType: "application/pdf", uploadedAt: "2024-01-15" },
      { id: "d2", mappeId: "1", name: "Cover_Letter.pdf", fileType: "cover_letter", size: "98 KB", mimeType: "application/pdf", uploadedAt: "2024-02-10" },
    ],
  },
  {
    id: "2",
    name: "Internship 2024",
    description: "Internship applications for summer 2024",
    logo: "🎓",
    createdAt: "2024-03-01",
    documents: [
      { id: "d3", mappeId: "2", name: "Bachelor_Certificate.pdf", fileType: "certificate", size: "512 KB", mimeType: "application/pdf", uploadedAt: "2023-06-20" },
    ],
  },
];

const initialState: BewerbungState = { mappen: SEED };

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().split("T")[0];

const bewerbungSlice = createSlice({
  name: "bewerbung",
  initialState,
  reducers: {
    // ── Mappe CRUD ────────────────────────────────────────────────────────────
    createMappe(state, action: PayloadAction<CreateMappeDto>) {
      state.mappen.unshift({
        id: uid(),
        ...action.payload,
        createdAt: today(),
        documents: [],
      });
    },
    updateMappe(state, action: PayloadAction<{ id: string; dto: UpdateMappeDto }>) {
      const m = state.mappen.find((m) => m.id === action.payload.id);
      if (m) Object.assign(m, action.payload.dto);
    },
    deleteMappe(state, action: PayloadAction<string>) {
      state.mappen = state.mappen.filter((m) => m.id !== action.payload);
    },

    // ── Document CRUD ─────────────────────────────────────────────────────────
    addDocument(state, action: PayloadAction<CreateDocumentDto>) {
      const m = state.mappen.find((m) => m.id === action.payload.mappeId);
      if (!m) return;
      m.documents.unshift({
        id: uid(),
        ...action.payload,
        uploadedAt: today(),
      });
    },
    updateDocument(state, action: PayloadAction<{ mappeId: string; docId: string; dto: UpdateDocumentDto }>) {
      const m = state.mappen.find((m) => m.id === action.payload.mappeId);
      const d = m?.documents.find((d) => d.id === action.payload.docId);
      if (d) Object.assign(d, action.payload.dto);
    },
    deleteDocument(state, action: PayloadAction<{ mappeId: string; docId: string }>) {
      const m = state.mappen.find((m) => m.id === action.payload.mappeId);
      if (m) m.documents = m.documents.filter((d) => d.id !== action.payload.docId);
    },
  },
});

export const {
  createMappe, updateMappe, deleteMappe,
  addDocument, updateDocument, deleteDocument,
} = bewerbungSlice.actions;

export const bewerbungReducer = bewerbungSlice.reducer;
