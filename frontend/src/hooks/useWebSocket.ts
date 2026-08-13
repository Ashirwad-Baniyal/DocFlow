// ============================================================
// src/hooks/useWebSocket.ts — STOMP WebSocket hook
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  setConnected,
  addPresence,
  removePresence,
  updateCursor,
  clearPresence,
} from '../store/collaborationSlice';
import { getToken } from '../utils/auth';
import type { CursorPosition, DocumentOperation, UserPresence } from '../types';
import toast from 'react-hot-toast';

interface UseWebSocketOptions {
  docId: string;
  onRemoteOperation?: (op: DocumentOperation) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendOperation: (op: DocumentOperation) => void;
  sendCursor: (cursor: CursorPosition) => void;
  sendPresence: (presence: UserPresence) => void;
  disconnect: () => void;
}

export function useWebSocket({
  docId,
  onRemoteOperation,
}: UseWebSocketOptions): UseWebSocketReturn {
  const dispatch = useAppDispatch();
  const isConnected = useAppSelector((s) => s.collaboration.isConnected);
  const currentUser = useAppSelector((s) => s.auth.user);

  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => {
      try { sub.unsubscribe(); } catch { /* ignore */ }
    });
    subscriptionsRef.current = [];
  }, []);

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;

    const token = getToken();

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
        docId,
      },
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: 5000,

      onConnect: () => {
        dispatch(setConnected(true));

        // ── Subscribe: document operations ──
        const opSub = client.subscribe(
          `/topic/doc/${docId}`,
          (message: IMessage) => {
            try {
              const op = JSON.parse(message.body) as DocumentOperation;
              if (op.userId !== currentUser?.id && onRemoteOperation) {
                onRemoteOperation(op);
              }
            } catch { /* ignore malformed */ }
          },
        );

        // ── Subscribe: cursor positions ──
        const cursorSub = client.subscribe(
          `/topic/doc/${docId}/cursor`,
          (message: IMessage) => {
            try {
              const cursor = JSON.parse(message.body) as CursorPosition;
              if (cursor.userId !== currentUser?.id) {
                dispatch(updateCursor(cursor));
              }
            } catch { /* ignore */ }
          },
        );

        // ── Subscribe: presence ──
        const presenceSub = client.subscribe(
          `/topic/doc/${docId}/presence`,
          (message: IMessage) => {
            try {
              const presence = JSON.parse(message.body) as UserPresence;
              if (presence.status === 'OFFLINE') {
                dispatch(removePresence(presence.userId));
              } else {
                dispatch(addPresence(presence));
              }
            } catch { /* ignore */ }
          },
        );

        // ── Subscribe: personal notifications ──
        const notifSub = client.subscribe(
          '/user/queue/notifications',
          (message: IMessage) => {
            try {
              const notif = JSON.parse(message.body) as { title: string; content: string };
              toast(notif.content, { icon: '🔔' });
            } catch { /* ignore */ }
          },
        );

        subscriptionsRef.current = [opSub, cursorSub, presenceSub, notifSub];

        // Announce presence
        if (currentUser) {
          const presence: UserPresence = {
            userId: currentUser.id,
            userFullName: currentUser.fullName,
            userColor: '#6366f1',
            avatarUrl: currentUser.avatarUrl,
            docId,
            status: 'ONLINE',
          };
          client.publish({
            destination: `/app/doc/${docId}/presence`,
            body: JSON.stringify(presence),
          });
        }
      },

      onDisconnect: () => {
        dispatch(setConnected(false));
        cleanup();
      },

      onStompError: (frame) => {
        toast.error(frame.headers['message'] ?? 'Connection error');
        dispatch(setConnected(false));
      },

      onWebSocketError: () => {
        dispatch(setConnected(false));
        toast.error('WebSocket error. Reconnecting...');
      },
    });

    client.activate();
    clientRef.current = client;
  }, [docId, dispatch, currentUser, cleanup, onRemoteOperation]);

  const disconnect = useCallback(() => {
    // Send offline presence before disconnecting
    if (clientRef.current?.connected && currentUser) {
      const presence: UserPresence = {
        userId: currentUser.id,
        userFullName: currentUser.fullName,
        userColor: '#6366f1',
        avatarUrl: currentUser.avatarUrl,
        docId,
        status: 'OFFLINE',
      };
      try {
        clientRef.current.publish({
          destination: `/app/doc/${docId}/presence`,
          body: JSON.stringify(presence),
        });
      } catch { /* ignore */ }
    }

    cleanup();
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    dispatch(clearPresence());
  }, [cleanup, currentUser, docId, dispatch]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const sendOperation = useCallback((op: DocumentOperation) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/doc/${docId}/operation`,
      body: JSON.stringify(op),
    });
  }, [docId]);

  const sendCursor = useCallback((cursor: CursorPosition) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/doc/${docId}/cursor`,
      body: JSON.stringify(cursor),
    });
  }, [docId]);

  const sendPresence = useCallback((presence: UserPresence) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/doc/${docId}/presence`,
      body: JSON.stringify(presence),
    });
  }, [docId]);

  return { isConnected, sendOperation, sendCursor, sendPresence, disconnect };
}
