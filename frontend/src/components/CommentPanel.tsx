// ============================================================
// src/components/CommentPanel.tsx — Comments sidebar panel
// ============================================================

import React, { useState } from 'react';
import {
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineChatAlt2,
  HiOutlineReply,
  HiOutlineTrash,
  HiOutlineFilter,
} from 'react-icons/hi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '../utils/api';
import type { Comment } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useAppSelector } from '../store/store';
import toast from 'react-hot-toast';

interface CommentPanelProps {
  docId: string;
  onClose: () => void;
  selectionRange?: { startOffset: number; endOffset: number } | null;
}

type FilterType = 'all' | 'unresolved' | 'resolved';

// ─── Reply item ───────────────────────────────────────────────
function ReplyItem({ reply }: { reply: Comment['replies'][number] }) {
  const initials = reply.user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex gap-2.5 pl-3 border-l-2 border-surface-700 ml-2">
      <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[9px] font-semibold shrink-0 mt-0.5">
        {initials}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-surface-200">{reply.user.fullName}</span>
          <span className="text-[10px] text-surface-600">
            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-surface-300 leading-relaxed">{reply.content}</p>
      </div>
    </div>
  );
}

// ─── Comment item ─────────────────────────────────────────────
function CommentItem({
  comment,
  docId,
}: {
  comment: Comment;
  docId: string;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((s) => s.auth.user);

  const resolveMutation = useMutation({
    mutationFn: () => commentsApi.resolveComment(docId, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', docId] });
      toast.success('Comment resolved!');
    },
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) =>
      commentsApi.addReply(docId, comment.id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', docId] });
      setReplyText('');
    },
    onError: () => toast.error('Failed to add reply.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => commentsApi.deleteComment(docId, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', docId] });
      toast.success('Comment deleted.');
    },
    onError: () => toast.error('Failed to delete comment.'),
  });

  const initials = comment.user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`rounded-xl border p-3.5 space-y-2.5 transition-all duration-200 ${
        comment.resolved
          ? 'bg-surface-800/40 border-surface-700/30 opacity-60'
          : 'bg-surface-800/70 border-surface-700/50 hover:border-primary-500/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-surface-100 truncate">
              {comment.user.fullName}
            </span>
            {comment.resolved && (
              <span className="badge badge-success text-[10px]">Resolved</span>
            )}
          </div>
          <span className="text-[10px] text-surface-600">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!comment.resolved && (
            <button
              onClick={() => resolveMutation.mutate()}
              disabled={resolveMutation.isPending}
              className="btn-icon w-6 h-6 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              title="Resolve comment"
            >
              <HiOutlineCheck className="w-3.5 h-3.5" />
            </button>
          )}
          {currentUser?.id === comment.user.id && (
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="btn-icon w-6 h-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              title="Delete comment"
            >
              <HiOutlineTrash className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Selection reference */}
      <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg px-2.5 py-1.5 text-[10px] text-primary-400">
        Characters {comment.startOffset}–{comment.endOffset}
      </div>

      {/* Content */}
      <p className="text-sm text-surface-200 leading-relaxed">{comment.content}</p>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            {showReplies
              ? 'Hide replies'
              : `${comment.replies.length} repl${comment.replies.length > 1 ? 'ies' : 'y'}`}
          </button>
          {showReplies && (
            <div className="space-y-2">
              {comment.replies.map((reply) => (
                <ReplyItem key={reply.id} reply={reply} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply input */}
      {!comment.resolved && (
        <div className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) {
                e.preventDefault();
                replyMutation.mutate(replyText.trim());
              }
            }}
            className="flex-1 px-3 py-1.5 text-xs bg-surface-700 border border-surface-600 rounded-lg
                       text-surface-100 placeholder:text-surface-500
                       focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={() => {
              if (replyText.trim()) replyMutation.mutate(replyText.trim());
            }}
            disabled={!replyText.trim() || replyMutation.isPending}
            className="btn-icon w-7 h-7 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10"
          >
            <HiOutlineReply className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add Comment Form ─────────────────────────────────────────
function AddCommentForm({
  docId,
  selectionRange,
}: {
  docId: string;
  selectionRange: { startOffset: number; endOffset: number } | null | undefined;
}) {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (content: string) =>
      commentsApi.addComment(docId, {
        content,
        startOffset: selectionRange?.startOffset ?? 0,
        endOffset: selectionRange?.endOffset ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', docId] });
      setText('');
      toast.success('Comment added!');
    },
    onError: () => toast.error('Failed to add comment.'),
  });

  return (
    <div className="p-4 border-t border-surface-700/50 bg-surface-850">
      <p className="text-xs text-surface-500 mb-2">
        {selectionRange
          ? `Commenting on chars ${selectionRange.startOffset}–${selectionRange.endOffset}`
          : 'Select text in the editor to comment on it'}
      </p>
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1 px-3 py-2 text-sm bg-surface-700 border border-surface-600 rounded-xl
                     text-surface-100 placeholder:text-surface-500 resize-none
                     focus:outline-none focus:border-primary-500"
        />
        <button
          onClick={() => {
            if (text.trim()) addMutation.mutate(text.trim());
          }}
          disabled={!text.trim() || addMutation.isPending}
          className="btn-primary self-end px-3 py-2"
        >
          <HiOutlineChatAlt2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────
export default function CommentPanel({
  docId,
  onClose,
  selectionRange,
}: CommentPanelProps) {
  const [filter, setFilter] = useState<FilterType>('unresolved');

  const { data, isLoading } = useQuery({
    queryKey: ['comments', docId],
    queryFn: () => commentsApi.getComments(docId),
  });

  const allComments: Comment[] = data?.content ?? [];
  const filtered = allComments.filter((c) => {
    if (filter === 'resolved') return c.resolved;
    if (filter === 'unresolved') return !c.resolved;
    return true;
  });

  return (
    <div className="sidebar-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-700/50 shrink-0">
        <div className="flex items-center gap-2">
          <HiOutlineChatAlt2 className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold text-surface-100">Comments</h3>
          {allComments.filter((c) => !c.resolved).length > 0 && (
            <span className="badge badge-primary">
              {allComments.filter((c) => !c.resolved).length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="btn-icon">
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-surface-700/30 shrink-0">
        <HiOutlineFilter className="w-3.5 h-3.5 text-surface-500 mr-1" />
        {(['all', 'unresolved', 'resolved'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 capitalize ${
              filter === f
                ? 'bg-primary-500/20 text-primary-300'
                : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 skeleton rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <HiOutlineChatAlt2 className="w-10 h-10 text-surface-700 mb-3" />
            <p className="text-sm text-surface-500">
              {filter === 'unresolved'
                ? 'No open comments'
                : `No ${filter} comments`}
            </p>
          </div>
        ) : (
          filtered.map((comment) => (
            <CommentItem key={comment.id} comment={comment} docId={docId} />
          ))
        )}
      </div>

      {/* Add comment */}
      <AddCommentForm docId={docId} selectionRange={selectionRange} />
    </div>
  );
}
