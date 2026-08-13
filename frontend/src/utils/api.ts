import axios from 'axios'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Document,
  DocumentListItem,
  PagedResponse,
  Collaborator,
  ShareDocumentRequest,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  Comment,
  Reply,
  CreateCommentRequest,
  CreateReplyRequest,
  Notification,
  DocumentVersion,
  DocumentVersionDetail,
} from '../types'
import { getToken, getRefreshToken, setToken, setRefreshToken, clearAllTokens } from './auth'

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ─── Request Interceptor — Attach Bearer Token ────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor — Auto Token Refresh ───────────────────────────────

let isRefreshing = false
let failedQueue: Array<{ resolve: (value: string) => void; reject: (reason?: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearAllTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post<AuthResponse>('/api/v1/auth/refresh', {
          refreshToken,
        })
        const { accessToken, refreshToken: newRefresh } = response.data
        setToken(accessToken)
        setRefreshToken(newRefresh)
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAllTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  login: (req: LoginRequest) => api.post<AuthResponse>('/auth/login', req).then((r) => r.data),
  register: (req: RegisterRequest) => api.post<AuthResponse>('/auth/register', req).then((r) => r.data),
  refreshToken: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),
  logout: (refreshToken?: string) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get<string>('/auth/me').then((r) => r.data),
}

// ─── Documents API ────────────────────────────────────────────────────────────

export const documentsApi = {
  getDocuments: (page = 0, size = 20) =>
    api.get<PagedResponse<DocumentListItem>>('/documents', { params: { page, size } }).then((r) => r.data),
  getDocument: (id: string) =>
    api.get<Document>(`/documents/${id}`).then((r) => r.data),
  createDocument: (req: CreateDocumentRequest) =>
    api.post<Document>('/documents', req).then((r) => r.data),
  updateDocument: (id: string, req: UpdateDocumentRequest) =>
    api.put<Document>(`/documents/${id}`, req).then((r) => r.data),
  deleteDocument: (id: string) => api.delete(`/documents/${id}`),
  searchDocuments: (q: string, page = 0, size = 20) =>
    api.get<PagedResponse<DocumentListItem>>('/documents/search', { params: { q, page, size } }).then((r) => r.data),
  shareDocument: (id: string, req: ShareDocumentRequest) =>
    api.post<Collaborator>(`/documents/${id}/share`, req).then((r) => r.data),
  getCollaborators: (id: string) =>
    api.get<Collaborator[]>(`/documents/${id}/collaborators`).then((r) => r.data),
  removeCollaborator: (docId: string, userId: string) =>
    api.delete(`/documents/${docId}/collaborators/${userId}`),
  saveSnapshot: (id: string) =>
    api.post<DocumentVersion>(`/documents/${id}/versions/snapshot`).then((r) => r.data),
}

// ─── Comments API ─────────────────────────────────────────────────────────────

export const commentsApi = {
  getComments: (docId: string, page = 0) =>
    api.get<PagedResponse<Comment>>(`/documents/${docId}/comments`, { params: { page } }).then((r) => r.data),
  addComment: (docId: string, req: CreateCommentRequest) =>
    api.post<Comment>(`/documents/${docId}/comments`, req).then((r) => r.data),
  resolveComment: (docId: string, commentId: string) =>
    api.put<Comment>(`/documents/${docId}/comments/${commentId}/resolve`).then((r) => r.data),
  deleteComment: (docId: string, commentId: string) =>
    api.delete(`/documents/${docId}/comments/${commentId}`),
  addReply: (docId: string, commentId: string, req: CreateReplyRequest) =>
    api.post<Reply>(`/documents/${docId}/comments/${commentId}/replies`, req).then((r) => r.data),
}

// ─── Notifications API ────────────────────────────────────────────────────────

export const notificationsApi = {
  getNotifications: (page = 0) =>
    api.get<PagedResponse<Notification>>('/notifications', { params: { page } }).then((r) => r.data),
  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
}

// ─── Version History API ──────────────────────────────────────────────────────

export const versionsApi = {
  getVersions: (docId: string, page = 0) =>
    api
      .get<PagedResponse<DocumentVersion>>(`/documents/${docId}/versions`, { params: { page } })
      .then((r) => r.data),
  getVersion: (docId: string, versionId: string) =>
    api.get<DocumentVersionDetail>(`/documents/${docId}/versions/${versionId}`).then((r) => r.data),
  restoreVersion: (docId: string, versionId: string) =>
    api.post<Document>(`/documents/${docId}/versions/${versionId}/restore`).then((r) => r.data),
}

export default api
