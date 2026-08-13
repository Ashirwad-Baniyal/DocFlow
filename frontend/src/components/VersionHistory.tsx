// ============================================================
// src/components/VersionHistory.tsx — Version history sidebar
// ============================================================

import React, { useState } from 'react';
import {
  HiOutlineX,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlineCheck,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { versionsApi } from '../utils/api';
import type { DocumentVersion, DocumentVersionDetail } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface VersionHistoryProps {
  docId: string;
  onClose: () => void;
  onRestore?: () => void;
}

// ─── Preview modal ────────────────────────────────────────────
function VersionPreviewModal({
  version,
  onClose,
  onRestore,
}: {
  version: DocumentVersionDetail;
  onClose: () => void;
  onRestore: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative glass-modal w-full max-w-3xl max-h-[85vh] flex flex-col shadow-card-hover animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/50 shrink-0">
          <div>
            <h3 className="font-semibold text-surface-100">
              Version {version.versionNumber}
            </h3>
            <p className="text-xs text-surface-500">
              Saved by {version.createdBy.fullName} ·{' '}
              {format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRestore(version.id)}
              className="btn-primary py-2 px-4 text-sm"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              Restore this version
            </button>
            <button onClick={onClose} className="btn-icon">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-white scrollbar-thin">
          <div
            className="max-w-2xl mx-auto tiptap-content prose"
            dangerouslySetInnerHTML={{ __html: version.contentSnapshot }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Restore confirmation ─────────────────────────────────────
function RestoreConfirmDialog({
  versionNumber,
  onConfirm,
  onCancel,
}: {
  versionNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-modal p-6 w-full max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <HiOutlineRefresh className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-100">Restore version?</h3>
            <p className="text-xs text-surface-500">Version {versionNumber}</p>
          </div>
        </div>
        <p className="text-sm text-surface-400 mb-6">
          Restoring will replace the current content with version{' '}
          <span className="text-surface-200 font-medium">{versionNumber}</span>.
          A new version will be automatically saved first.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1">
            <HiOutlineCheck className="w-4 h-4" />
            Restore
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function VersionHistory({
  docId,
  onClose,
  onRestore,
}: VersionHistoryProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersionDetail | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<DocumentVersion | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['versions', docId, page],
    queryFn: () => versionsApi.getVersions(docId, page),
  });

  const getVersionDetail = useMutation({
    mutationFn: (versionId: string) => versionsApi.getVersion(docId, versionId),
    onSuccess: (detail) => setPreviewVersion(detail),
    onError: () => toast.error('Failed to load version preview.'),
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) => versionsApi.restoreVersion(docId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', docId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', docId] });
      toast.success('Version restored successfully!');
      setRestoreTarget(null);
      setPreviewVersion(null);
      onRestore?.();
    },
    onError: () => toast.error('Failed to restore version.'),
  });

  const versions: DocumentVersion[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <>
      <div className="sidebar-panel">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-700/50 shrink-0">
          <div className="flex items-center gap-2">
            <HiOutlineClock className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-surface-100">Version History</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 skeleton rounded-xl" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <HiOutlineClock className="w-10 h-10 text-surface-700 mb-3" />
              <p className="text-sm text-surface-500">No versions saved yet</p>
              <p className="text-xs text-surface-600 mt-1">
                Versions are saved automatically or manually via the toolbar.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {versions.map((v, idx) => {
                const isLatest = idx === 0 && page === 0;
                const initials = v.createdBy.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={v.id}
                    className={`rounded-xl border p-3.5 transition-all duration-200 ${
                      isLatest
                        ? 'bg-primary-500/10 border-primary-500/30'
                        : 'bg-surface-800/50 border-surface-700/30 hover:border-surface-600/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center mt-1">
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isLatest ? 'bg-primary-400' : 'bg-surface-600'
                            }`}
                          />
                          {idx < versions.length - 1 && (
                            <div className="w-px flex-1 bg-surface-700/50 mt-1 h-full min-h-[24px]" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-surface-100">
                              Version {v.versionNumber}
                            </span>
                            {isLatest && (
                              <span className="badge badge-primary text-[10px]">Current</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[8px] font-semibold">
                              {initials}
                            </div>
                            <span className="text-xs text-surface-400">
                              {v.createdBy.fullName}
                            </span>
                          </div>

                          <p className="text-[11px] text-surface-600">
                            {format(new Date(v.createdAt), 'MMM d, yyyy · HH:mm')}
                            {' · '}
                            <span className="text-surface-500">
                              {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => getVersionDetail.mutate(v.id)}
                          disabled={getVersionDetail.isPending}
                          className="btn-icon w-7 h-7 text-surface-400 hover:text-primary-300"
                          title="Preview"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                        {!isLatest && (
                          <button
                            onClick={() => setRestoreTarget(v)}
                            className="btn-icon w-7 h-7 text-surface-400 hover:text-emerald-300"
                            title="Restore"
                          >
                            <HiOutlineRefresh className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-700/50 shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-icon disabled:opacity-40"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-surface-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-icon disabled:opacity-40"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewVersion && (
        <VersionPreviewModal
          version={previewVersion}
          onClose={() => setPreviewVersion(null)}
          onRestore={(id) => {
            setPreviewVersion(null);
            setRestoreTarget(versions.find((v) => v.id === id) ?? null);
          }}
        />
      )}

      {/* Restore confirmation */}
      {restoreTarget && (
        <RestoreConfirmDialog
          versionNumber={restoreTarget.versionNumber}
          onConfirm={() => restoreMutation.mutate(restoreTarget.id)}
          onCancel={() => setRestoreTarget(null)}
        />
      )}
    </>
  );
}
