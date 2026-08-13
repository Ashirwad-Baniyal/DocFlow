// ============================================================
// src/components/ShareModal.tsx — Document sharing modal
// ============================================================

import React, { useState } from 'react';
import {
  HiOutlineX,
  HiOutlineLink,
  HiOutlineGlobe,
  HiOutlineLockClosed,
  HiOutlineTrash,
  HiOutlineUserAdd,
  HiOutlineMail,
} from 'react-icons/hi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../utils/api';
import { documentKeys } from '../hooks/useDocuments';
import type { ShareDocumentRequest } from '../types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface ShareModalProps {
  docId: string;
  docTitle: string;
  onClose: () => void;
}

export default function ShareModal({ docId, docTitle, onClose }: ShareModalProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [isPublic, setIsPublic] = useState(false);

  // Fetch collaborators
  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: documentKeys.collaborators(docId),
    queryFn: () => documentsApi.getCollaborators(docId),
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: (req: ShareDocumentRequest) => documentsApi.shareDocument(docId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.collaborators(docId) });
      setEmail('');
      toast.success(`Invited ${email} as ${role.toLowerCase()}`);
    },
    onError: () => {
      toast.error('Failed to invite collaborator. Check the email address.');
    },
  });

  // Remove collaborator mutation
  const removeMutation = useMutation({
    mutationFn: (collaboratorId: string) =>
      documentsApi.removeCollaborator(docId, collaboratorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.collaborators(docId) });
      toast.success('Collaborator removed.');
    },
    onError: () => {
      toast.error('Failed to remove collaborator.');
    },
  });

  // Toggle visibility mutation
  const visibilityMutation = useMutation({
    mutationFn: (pub: boolean) => documentsApi.updateVisibility(docId, pub),
    onSuccess: (doc) => {
      setIsPublic(doc.isPublic);
      toast.success(doc.isPublic ? 'Document is now public.' : 'Document is now private.');
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(docId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: () => {
      toast.error('Failed to update visibility.');
    },
  });

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    shareMutation.mutate({ email: email.trim(), role });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/editor/${docId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!');
    });
  };

  const roleBadgeColor = (r: string) => {
    if (r === 'OWNER') return 'badge-primary';
    if (r === 'EDITOR') return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative glass-modal w-full max-w-lg shadow-card-hover animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/50">
          <div>
            <h2 className="font-semibold text-surface-100">Share Document</h2>
            <p className="text-xs text-surface-500 truncate max-w-[300px]">{docTitle}</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add collaborator */}
          <div>
            <label className="text-sm font-medium text-surface-300 mb-2 block">
              Invite people
            </label>
            <form onSubmit={handleShare} className="flex gap-2">
              <div className="relative flex-1">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="input-field pl-10 py-2.5 text-sm"
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'EDITOR' | 'VIEWER')}
                className="input-field !w-auto py-2.5 text-sm cursor-pointer"
              >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={!email.trim() || shareMutation.isPending}
                className="btn-primary py-2.5 px-4 shrink-0"
              >
                {shareMutation.isPending ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <HiOutlineUserAdd className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>

          {/* Collaborators list */}
          <div>
            <p className="text-sm font-medium text-surface-300 mb-3">
              People with access
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 skeleton rounded-xl" />
                  ))}
                </div>
              ) : collaborators.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">
                  No collaborators yet
                </p>
              ) : (
                collaborators.map((c) => {
                  const initials = c.user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-700/30 border border-surface-700/30"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-100 truncate">
                          {c.user.fullName}
                        </p>
                        <p className="text-xs text-surface-500 truncate">{c.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={roleBadgeColor(c.role) + ' badge'}>
                          {c.role.charAt(0) + c.role.slice(1).toLowerCase()}
                        </span>
                        {c.role !== 'OWNER' && (
                          <button
                            onClick={() => removeMutation.mutate(c.id)}
                            disabled={removeMutation.isPending}
                            className="btn-icon w-7 h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Remove collaborator"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-700/30 border border-surface-700/30">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <HiOutlineGlobe className="w-5 h-5 text-emerald-400" />
              ) : (
                <HiOutlineLockClosed className="w-5 h-5 text-surface-400" />
              )}
              <div>
                <p className="text-sm font-medium text-surface-100">
                  {isPublic ? 'Public access' : 'Private'}
                </p>
                <p className="text-xs text-surface-500">
                  {isPublic
                    ? 'Anyone with the link can view'
                    : 'Only invited collaborators'}
                </p>
              </div>
            </div>
            <button
              onClick={() => visibilityMutation.mutate(!isPublic)}
              disabled={visibilityMutation.isPending}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                isPublic ? 'bg-emerald-500' : 'bg-surface-600'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                  isPublic ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       border border-surface-700 text-surface-300 hover:text-surface-100
                       hover:bg-surface-700/50 transition-all duration-200 text-sm font-medium"
          >
            <HiOutlineLink className="w-4 h-4" />
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
