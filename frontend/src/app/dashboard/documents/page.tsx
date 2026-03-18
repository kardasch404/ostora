"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createMappe, updateMappe, deleteMappe,
  addDocument, updateDocument, deleteDocument,
} from "@/store/slices/bewerbung-slice";
import { Bewerbungsmappe, BewerbungDocument, CreateMappeDto, CreateDocumentDto, DocumentFileType } from "@/types/bewerbung";
import MappeForm from "@/components/dashboard/documents/MappeForm";
import DocumentForm from "@/components/dashboard/documents/DocumentForm";
import Modal from "@/components/dashboard/documents/Modal";

// ── helpers ───────────────────────────────────────────────────────────────────

const FILE_TYPE_BADGE: Record<DocumentFileType, string> = {
  cv: "bg-purple-100 text-purple-700",
  cover_letter: "bg-blue-100 text-blue-700",
  certificate: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

const FILE_TYPE_LABEL: Record<DocumentFileType, string> = {
  cv: "CV",
  cover_letter: "Cover Letter",
  certificate: "Certificate",
  other: "Other",
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
  const dispatch = useAppDispatch();
  const mappen = useAppSelector((s) => s.bewerbung.mappen);
  const [openMappe, setOpenMappe] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  // ── Mappe handlers ──────────────────────────────────────────────────────────
  const handleCreateMappe = (dto: CreateMappeDto) => {
    dispatch(createMappe(dto));
    setModal(null);
  };

  const handleUpdateMappe = (id: string, dto: CreateMappeDto) => {
    dispatch(updateMappe({ id, dto }));
    setModal(null);
  };

  const handleDeleteMappe = (id: string) => {
    dispatch(deleteMappe(id));
    if (openMappe === id) setOpenMappe(null);
    setModal(null);
  };

  // ── Document handlers ───────────────────────────────────────────────────────
  const handleAddDoc = (dto: CreateDocumentDto) => {
    dispatch(addDocument(dto));
    setModal(null);
  };

  const handleUpdateDoc = (mappeId: string, docId: string, dto: CreateDocumentDto) => {
    dispatch(updateDocument({ mappeId, docId, dto }));
    setModal(null);
  };

  const handleDeleteDoc = (mappeId: string, docId: string) => {
    dispatch(deleteDocument({ mappeId, docId }));
    setModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-1">Bewerbungsunterlagen</h1>
        <p className="text-purple-100">Organise your application folders and documents</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{mappen.length} folder{mappen.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setModal({ type: "create_mappe" })}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Mappe
        </button>
      </div>

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
                {/* Logo */}
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {mappe.logo}
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
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-semibold transition-colors"
                  >
                    + Doc
                  </button>
                  <button
                    onClick={() => setModal({ type: "edit_mappe", mappe })}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setModal({ type: "delete_mappe", mappe })}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setOpenMappe(isOpen ? null : mappe.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors group">
                      <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
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
                          onClick={() => setModal({ type: "edit_doc", mappe, doc })}
                          className="p-1 text-gray-400 hover:text-purple-600 rounded transition-colors"
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
    </div>
  );
}
