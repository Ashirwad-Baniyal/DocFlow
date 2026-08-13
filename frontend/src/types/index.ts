// ─────────────────────────────────────────────────────────────────────────────
// All shared TypeScript interfaces for the DocFlow enterprise application
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  roles: string[]
}

export interface Document {
  id: string
  title: string
  content: string
  isPublic: boolean
  owner: User
  createdAt: string
  updatedAt: string
  collaboratorCount: number
}

export interface DocumentListItem {
  id: string
  title: string
  isPublic: boolean
  owner: User
  createdAt: string
  updatedAt: string
}

export interface Collaborator {
  id: string
  user: User
  role: 'READ' | 'WRITE' | 'OWNER'
  invitedAt: string
}

export interface Reply {
  id: string
  content: string
  user: User
  createdAt: string
}

export interface Comment {
  id: string
  content: string
  startOffset: number
  endOffset: number
  resolved: boolean
  user: User
  replies: Reply[]
  createdAt: string
  updatedAt: string
}

export type NotificationType = 'SHARE' | 'COMMENT' | 'MENTION' | 'DOCUMENT_UPDATE'

export interface Notification {
  id: string
  title: string
  content: string
  isRead: boolean
  type: NotificationType
  createdAt: string
}

export interface DocumentVersion {
  id: string
  versionNumber: number
  createdBy?: User
  createdAt: string
}

export interface DocumentVersionDetail extends DocumentVersion {
  contentSnapshot: string
}

export type OperationType = 'INSERT' | 'DELETE' | 'REPLACE'

export interface DocumentOperation {
  operationId?: string
  type: OperationType
  position: number
  content?: string
  length?: number
  userId: string
  docId: string
  timestamp: number
}

export interface CursorPosition {
  userId: string
  userFullName: string
  userColor: string
  position: number
  docId: string
}

export interface UserPresence {
  userId: string
  userFullName: string
  userColor: string
  avatarUrl?: string
  docId: string
  status: 'JOINED' | 'LEFT'
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}

export interface CreateDocumentRequest {
  title: string
  isPublic: boolean
}

export interface UpdateDocumentRequest {
  title?: string
  content?: string
  isPublic?: boolean
}

export interface ShareDocumentRequest {
  userId: string
  role: 'READ' | 'WRITE' | 'OWNER'
}

export interface CreateCommentRequest {
  content: string
  startOffset: number
  endOffset: number
}

export interface CreateReplyRequest {
  content: string
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}
