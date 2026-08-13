// ============================================================
// src/components/CursorOverlay.tsx — Remote cursor indicators
// ============================================================

import React from 'react';
import { useAppSelector } from '../store/store';

interface CursorOverlayProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Renders name labels for remote users' cursors.
 * In a real Yjs/TipTap Collaboration setup, cursors are rendered
 * directly by the CollaborationCursor extension inside the editor.
 * This overlay renders presence "chips" at the top of the editor as fallback.
 */
export default function CursorOverlay({ editorRef: _editorRef }: CursorOverlayProps) {
  const cursors = useAppSelector((s) => s.collaboration.cursors);
  const currentUserId = useAppSelector((s) => s.auth.user?.id);

  const remoteCursors = cursors.filter((c) => c.userId !== currentUserId);

  if (remoteCursors.length === 0) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 pointer-events-none">
      {remoteCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-lg animate-fade-in"
          style={{ backgroundColor: cursor.userColor }}
        >
          {/* Cursor icon */}
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.343-8.854-5.435 4.855z" />
          </svg>
          <span>{cursor.userFullName.split(' ')[0]}</span>
          <span className="opacity-70 text-[10px]">@{cursor.position}</span>
        </div>
      ))}
    </div>
  );
}
