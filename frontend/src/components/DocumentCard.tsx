// ============================================================
// src/components/DocumentCard.tsx — Document grid card
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineDotsVertical,
  HiOutlineShare,
  HiOutlineTrash,
  HiOutlineGlobe,
  HiOutlineLockClosed,
  HiOutlineUsers,
  HiOutlinePencil,
} from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import type { DocumentListItem } from '../types';
import { useDeleteDocument } from '../hooks/useDocuments';

// ─── Delete confirmation dialog ────────────────────────────────
function DeleteDialog({
  docTitle,
  onConfirm,
  onCancel,
}: {
  docTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-modal p-6 w-full max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <HiOutlineTrash className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-100">Delete document?</h3>
            <p className="text-xs text-surface-500">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-surface-400 mb-6">
          Are you sure you want to delete{' '}
          <span className="text-surface-200 font-medium">"{docTitle}"</span>? All
          collaborators will lose access.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5
                       bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl
                       transition-all duration-200 active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Three-dot menu ───────────────────────────────────────────
function DocMenu({
  doc,
  onShare,
  onDelete,
}: {
  doc: DocumentListItem;
  onShare: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-icon w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="More options"
      >
        <HiOutlineDotsVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-48 glass-modal shadow-card-hover z-20 animate-fade-in overflow-hidden">
          <button
            onClick={() => { setOpen(false); navigate(`/editor/${doc.id}`); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-700/50 hover:text-surface-100 transition-colors text-left"
          >
            <HiOutlinePencil className="w-4 h-4" />
            Open & Edit
          </button>
          <button
            onClick={() => { setOpen(false); onShare(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-700/50 hover:text-surface-100 transition-colors text-left"
          >
            <HiOutlineShare className="w-4 h-4" />
            Share
          </button>
          <div className="border-t border-surface-700/50" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
          >
            <HiOutlineTrash className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────
interface DocumentCardProps {
  doc: DocumentListItem;
  onShare: (doc: DocumentListItem) => void;
}

export default function DocumentCard({ doc, onShare }: DocumentCardProps) {
  const navigate = useNavigate();
  const { mutate: deleteDoc } = useDeleteDocument();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updatedAgo = formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true });

  return (
    <>
      <div
        onClick={() => navigate(`/editor/${doc.id}`)}
        className="group relative bg-surface-800 hover:bg-surface-750
                   border border-surface-700/50 hover:border-primary-500/40
                   rounded-2xl overflow-hidden cursor-pointer
                   transition-all duration-300
                   hover:shadow-glow-sm hover:-translate-y-1
                   active:translate-y-0"
        style={{ '--tw-bg-opacity': '1' } as React.CSSProperties}
      >
        {/* Preview area */}
        <div className="relative h-32 bg-gradient-to-br from-surface-700/50 to-surface-800/50 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #6366f1 19px, #6366f1 20px)',
            }} />
          </div>
          <HiOutlineDocumentText className="w-14 h-14 text-primary-400/60" />

          {/* Top-right badges */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {doc.isPublic ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <HiOutlineGlobe className="w-3 h-3" />
                Public
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-700 text-surface-400 border border-surface-600">
                <HiOutlineLockClosed className="w-3 h-3" />
                Private
              </span>
            )}
          </div>

          {/* Three-dot menu */}
          <div className="absolute top-2 left-2">
            <DocMenu
              doc={doc}
              onShare={() => onShare(doc)}
              onDelete={() => setShowDeleteDialog(true)}
            />
          </div>
        </div>

        {/* Content area */}
        <div className="p-4">
          <h3 className="font-semibold text-surface-100 text-sm leading-snug truncate mb-1 group-hover:text-primary-300 transition-colors">
            {doc.title || 'Untitled Document'}
          </h3>
          <p className="text-xs text-surface-500 truncate mb-3">
            by {doc.owner.fullName}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-surface-600">{updatedAgo}</span>
            {doc.collaboratorCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-surface-500">
                <HiOutlineUsers className="w-3.5 h-3.5" />
                {doc.collaboratorCount}
              </div>
            )}
          </div>
        </div>

        {/* Hover glow border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-primary-500/0 group-hover:border-primary-500/20 transition-all duration-300 pointer-events-none" />
      </div>

      {showDeleteDialog && (
        <DeleteDialog
          docTitle={doc.title}
          onConfirm={() => {
            deleteDoc(doc.id);
            setShowDeleteDialog(false);
          }}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  );
}
