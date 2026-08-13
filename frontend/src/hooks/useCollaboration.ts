import { useEffect, useRef, useCallback } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAppDispatch, useAppSelector } from '../store/store'
import {
  setConnected,
  addPresence,
  removePresence,
  updateCursor,
  addPendingOp,
} from '../store/collaborationSlice'
import { updateCurrentDocumentContent } from '../store/documentSlice'
import { applyOperationToContent, generateUserColor } from '../utils/crdt'
import type { DocumentOperation, CursorPosition, UserPresence } from '../types'
import { getToken } from '../utils/auth'

interface UseCollaborationReturn {
  sendOperation: (op: Omit<DocumentOperation, 'operationId' | 'timestamp' | 'userId' | 'docId'>) => void
  sendCursor: (position: number) => void
  sendPresence: (status: 'JOINED' | 'LEFT') => void
}

export const useCollaboration = (docId: string): UseCollaborationReturn => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { currentDocument } = useAppSelector((state) => state.document)
  const currentContentRef = useRef<string>('')

  // Keep ref up to date with Redux content
  useEffect(() => {
    currentContentRef.current = currentDocument?.content ?? ''
  }, [currentDocument?.content])

  const clientRef = useRef<Client | null>(null)
  const userColor = user ? generateUserColor(user.id) : '#818cf8'

  useEffect(() => {
    if (!docId || !user) return

    const token = getToken()
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 3000,
      onConnect: () => {
        dispatch(setConnected(true))

        // Subscribe to document operations
        client.subscribe(`/topic/doc/${docId}`, (message: IMessage) => {
          const op: DocumentOperation = JSON.parse(message.body)
          if (op.userId !== user.id) {
            // Apply remote operation to local content using the ref to avoid stale closures
            const currentContent = currentContentRef.current
            const updated = applyOperationToContent(currentContent, op)
            dispatch(updateCurrentDocumentContent(updated))
            dispatch(addPendingOp(op))
          }
        })

        // Subscribe to cursor positions
        client.subscribe(`/topic/doc/${docId}/cursor`, (message: IMessage) => {
          const cursor: CursorPosition = JSON.parse(message.body)
          if (cursor.userId !== user.id) {
            dispatch(updateCursor(cursor))
          }
        })

        // Subscribe to presence
        client.subscribe(`/topic/doc/${docId}/presence`, (message: IMessage) => {
          const presence: UserPresence = JSON.parse(message.body)
          if (presence.status === 'LEFT') {
            dispatch(removePresence(presence.userId))
          } else {
            dispatch(addPresence(presence))
          }
        })

        // Announce own presence
        client.publish({
          destination: `/app/doc/${docId}/presence`,
          body: JSON.stringify({
            userId: user.id,
            userFullName: user.fullName,
            userColor,
            avatarUrl: user.avatarUrl,
            docId,
            status: 'JOINED',
          } satisfies UserPresence),
        })
      },
      onDisconnect: () => {
        dispatch(setConnected(false))
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame)
        dispatch(setConnected(false))
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      // Announce departure before disconnect
      if (client.active && user) {
        client.publish({
          destination: `/app/doc/${docId}/presence`,
          body: JSON.stringify({
            userId: user.id,
            userFullName: user.fullName,
            userColor,
            docId,
            status: 'LEFT',
          } satisfies UserPresence),
        })
      }
      client.deactivate()
      dispatch(setConnected(false))
    }
  }, [docId, user?.id])

  const sendOperation = useCallback(
    (op: Omit<DocumentOperation, 'operationId' | 'timestamp' | 'userId' | 'docId'>) => {
      if (!clientRef.current?.active || !user) return
      const fullOp: DocumentOperation = {
        ...op,
        operationId: crypto.randomUUID(),
        timestamp: Date.now(),
        userId: user.id,
        docId,
      }
      clientRef.current.publish({
        destination: `/app/doc/${docId}/operation`,
        body: JSON.stringify(fullOp),
      })
    },
    [docId, user?.id]
  )

  const sendCursor = useCallback(
    (position: number) => {
      if (!clientRef.current?.active || !user) return
      const cursor: CursorPosition = {
        userId: user.id,
        userFullName: user.fullName,
        userColor,
        position,
        docId,
      }
      clientRef.current.publish({
        destination: `/app/doc/${docId}/cursor`,
        body: JSON.stringify(cursor),
      })
    },
    [docId, user?.id, userColor]
  )

  const sendPresence = useCallback(
    (status: 'JOINED' | 'LEFT') => {
      if (!clientRef.current?.active || !user) return
      clientRef.current.publish({
        destination: `/app/doc/${docId}/presence`,
        body: JSON.stringify({
          userId: user.id,
          userFullName: user.fullName,
          userColor,
          avatarUrl: user.avatarUrl,
          docId,
          status,
        } satisfies UserPresence),
      })
    },
    [docId, user?.id, userColor]
  )

  return { sendOperation, sendCursor, sendPresence }
}
