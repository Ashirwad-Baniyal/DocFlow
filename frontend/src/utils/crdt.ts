import { v4 as uuidv4 } from 'uuid'
import type { DocumentOperation } from '../types'

// ─── Operation Factory Helpers ────────────────────────────────────────────────

export const generateOperationId = (): string => uuidv4()

export const createInsertOp = (
  position: number,
  content: string,
  userId: string,
  docId: string
): DocumentOperation => ({
  operationId: generateOperationId(),
  type: 'INSERT',
  position,
  content,
  length: content.length,
  userId,
  docId,
  timestamp: Date.now(),
})

export const createDeleteOp = (
  position: number,
  length: number,
  userId: string,
  docId: string
): DocumentOperation => ({
  operationId: generateOperationId(),
  type: 'DELETE',
  position,
  length,
  userId,
  docId,
  timestamp: Date.now(),
})

// ─── Content Application ──────────────────────────────────────────────────────

export const applyOperationToContent = (
  content: string,
  op: DocumentOperation
): string => {
  switch (op.type) {
    case 'INSERT': {
      const pos = Math.min(op.position, content.length)
      return content.slice(0, pos) + (op.content ?? '') + content.slice(pos)
    }
    case 'DELETE': {
      const start = Math.min(op.position, content.length)
      const end = Math.min(start + (op.length ?? 0), content.length)
      return content.slice(0, start) + content.slice(end)
    }
    case 'REPLACE':
      return op.content ?? content
    default:
      return content
  }
}

// ─── User Color ───────────────────────────────────────────────────────────────

const COLLABORATION_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635',
  '#34d399', '#22d3ee', '#818cf8', '#e879f9',
  '#f472b6', '#60a5fa',
]

export const generateUserColor = (userId: string): string => {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COLLABORATION_COLORS.length
  return COLLABORATION_COLORS[index]
}
