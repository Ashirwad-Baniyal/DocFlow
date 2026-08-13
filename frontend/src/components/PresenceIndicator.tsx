// ============================================================
// src/components/PresenceIndicator.tsx — Active user avatars
// ============================================================

import React, { useState } from 'react';
import { useAppSelector } from '../store/store';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
}

function Tooltip({ label, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-surface-700 border border-surface-600 text-xs text-surface-100 whitespace-nowrap z-50 pointer-events-none animate-fade-in">
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-700" />
        </div>
      )}
    </div>
  );
}

const MAX_SHOWN = 4;

export default function PresenceIndicator() {
  const activeUsers = useAppSelector((s) => s.collaboration.activeUsers);
  const isConnected = useAppSelector((s) => s.collaboration.isConnected);

  const shown = activeUsers.slice(0, MAX_SHOWN);
  const extra = activeUsers.length - MAX_SHOWN;

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Connection status dot */}
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-surface-600'
        }`}
        title={isConnected ? 'Connected' : 'Disconnected'}
      />

      {/* Avatar stack */}
      <div className="flex items-center">
        {shown.map((user, i) => {
          const initials = user.userFullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <Tooltip key={user.userId} label={`${user.userFullName} — ${user.status.toLowerCase()}`}>
              <div
                className="relative w-7 h-7 rounded-full flex items-center justify-center
                           text-white text-[10px] font-semibold
                           ring-2 ring-surface-900
                           transition-transform duration-200 hover:scale-110 hover:z-10"
                style={{
                  background: user.userColor,
                  marginLeft: i === 0 ? 0 : '-8px',
                  zIndex: shown.length - i,
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.userFullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
                {/* Status pulse ring */}
                {user.status === 'ONLINE' && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ background: user.userColor }}
                  />
                )}
              </div>
            </Tooltip>
          );
        })}

        {extra > 0 && (
          <Tooltip label={`${extra} more user${extra > 1 ? 's' : ''}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center
                         bg-surface-700 ring-2 ring-surface-900
                         text-surface-300 text-[10px] font-semibold
                         hover:scale-110 transition-transform duration-200"
              style={{ marginLeft: '-8px' }}
            >
              +{extra}
            </div>
          </Tooltip>
        )}
      </div>

      <span className="text-xs text-surface-500 hidden sm:block">
        {activeUsers.length} online
      </span>
    </div>
  );
}
