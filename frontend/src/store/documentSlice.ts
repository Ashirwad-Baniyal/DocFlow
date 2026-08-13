import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Document, DocumentListItem, CreateDocumentRequest, UpdateDocumentRequest } from '../types'
import { documentsApi } from '../utils/api'

interface DocumentState {
  documents: DocumentListItem[]
  currentDocument: Document | null
  loading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  totalElements: number
}

const initialState: DocumentState = {
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  totalElements: 0,
}

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchDocuments = createAsyncThunk(
  'document/fetchDocuments',
  async (page: number = 0, { rejectWithValue }) => {
    try {
      return await documentsApi.getDocuments(page)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch documents')
    }
  }
)

export const fetchDocument = createAsyncThunk(
  'document/fetchDocument',
  async (id: string, { rejectWithValue }) => {
    try {
      return await documentsApi.getDocument(id)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch document')
    }
  }
)

export const createDocument = createAsyncThunk(
  'document/createDocument',
  async (req: CreateDocumentRequest, { rejectWithValue }) => {
    try {
      return await documentsApi.createDocument(req)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to create document')
    }
  }
)

export const updateDocument = createAsyncThunk(
  'document/updateDocument',
  async ({ id, req }: { id: string; req: UpdateDocumentRequest }, { rejectWithValue }) => {
    try {
      return await documentsApi.updateDocument(id, req)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update document')
    }
  }
)

export const deleteDocument = createAsyncThunk(
  'document/deleteDocument',
  async (id: string, { rejectWithValue }) => {
    try {
      await documentsApi.deleteDocument(id)
      return id
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Failed to delete document')
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setCurrentDocument(state, action: PayloadAction<Document>) {
      state.currentDocument = action.payload
    },
    clearCurrentDocument(state) {
      state.currentDocument = null
    },
    updateCurrentDocumentContent(state, action: PayloadAction<string>) {
      if (state.currentDocument) {
        state.currentDocument.content = action.payload
      }
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false
        state.documents = action.payload.content
        state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.page
        state.totalElements = action.payload.totalElements
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string
      })

      .addCase(fetchDocument.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchDocument.fulfilled, (state, action) => {
        state.loading = false; state.currentDocument = action.payload
      })
      .addCase(fetchDocument.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string
      })

      .addCase(createDocument.fulfilled, (state, action) => {
        // Add to list as DocumentListItem
        const doc = action.payload
        state.documents.unshift({
          id: doc.id, title: doc.title, isPublic: doc.isPublic,
          owner: doc.owner, createdAt: doc.createdAt, updatedAt: doc.updatedAt
        })
      })

      .addCase(updateDocument.fulfilled, (state, action) => {
        state.currentDocument = action.payload
        const idx = state.documents.findIndex((d) => d.id === action.payload.id)
        if (idx !== -1) {
          state.documents[idx] = {
            id: action.payload.id, title: action.payload.title,
            isPublic: action.payload.isPublic, owner: action.payload.owner,
            createdAt: action.payload.createdAt, updatedAt: action.payload.updatedAt
          }
        }
      })

      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d.id !== action.payload)
        if (state.currentDocument?.id === action.payload) {
          state.currentDocument = null
        }
      })
  },
})

export const { setCurrentDocument, clearCurrentDocument, updateCurrentDocumentContent, clearError } =
  documentSlice.actions
export default documentSlice.reducer
