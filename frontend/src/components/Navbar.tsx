// ============================================================
// src/components/Navbar.tsx — Top navigation bar
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineSearch,
  HiOutlineBell,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineChevronDown,
  HiOutlineX,
} from 'react-icons/hi';
import { RiFlowChart } from 'react-icons/ri';
import { useAuth } from '../hooks/useAuth';
import { notificationsApi } from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '../types';

// ─── Notification badge ────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30_000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 0],
    queryFn: () => notificationsApi.getNotifications(0),
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = unreadData?.count ?? 0;
  const notifications: Notification[] = notifData?.content ?? [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-icon relative"
        aria-label="Notifications"
      >
        <HiOutlineBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 glass-modal shadow-card-hover z-50 animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/50">
            <h3 className="font-semibold text-surface-100 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="btn-icon w-7 h-7"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-surface-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-surface-700/30 hover:bg-surface-700/30 transition-colors cursor-pointer ${
                    !n.isRead ? 'bg-primary-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                    )}
                    <div className={!n.isRead ? '' : 'ml-5'}>
                      <p className="text-sm font-medium text-surface-100 leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-surface-400 mt-0.5 leading-snug">
                        {n.content}
                      </p>
                      <p className="text-[11px] text-surface-600 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User Avatar Dropdown ─────────────────────────────────────
function UserDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-800 transition-colors"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/50"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold ring-2 ring-primary-500/50">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-surface-200 max-w-[120px] truncate hidden sm:block">
          {user.fullName}
        </span>
        <HiOutlineChevronDown
          className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 glass-modal shadow-card-hover z-50 animate-slide-up overflow-hidden">
          {/* Profile info */}
          <div className="px-4 py-3 border-b border-surface-700/50">
            <p className="text-sm font-semibold text-surface-100 truncate">{user.fullName}</p>
            <p className="text-xs text-surface-500 truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-700/50 hover:text-surface-100 transition-colors text-left">
              <HiOutlineUser className="w-4 h-4" />
              Profile Settings
            </button>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
            >
              <HiOutlineLogout className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────
interface NavbarProps {
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export default function Navbar({ onSearch, showSearch = true }: NavbarProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch?.(searchValue.trim());
    }
  };

  return (
    <header className="sticky top-0 z-40 h-14 bg-surface-900/80 backdrop-blur-xl border-b border-surface-700/50 flex items-center px-4 gap-4">
      {/* Logo */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 shrink-0 group"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
          <RiFlowChart className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gradient hidden sm:block">DocFlow</span>
      </button>

      {/* Search bar */}
      {showSearch && (
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 bg-surface-800/80 border border-surface-700/60 rounded-xl
                         text-sm text-surface-100 placeholder:text-surface-500
                         focus:outline-none focus:border-primary-500/60 focus:bg-surface-800
                         transition-all duration-200"
            />
          </div>
        </form>
      )}

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <UserDropdown />
      </div>
    </header>
  );
}
