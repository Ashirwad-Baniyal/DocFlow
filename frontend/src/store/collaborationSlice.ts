import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { UserPresence, CursorPosition, DocumentOperation } from '../types'

interface CollaborationState {
  activeUsers: UserPresence[]
  cursors: CursorPosition[]
  isConnected: boolean
  pendingOperations: DocumentOperation[]
}

const initialState: CollaborationState = {
  activeUsers: [],
  cursors: [],
  isConnected: false,
  pendingOperations: [],
}

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    setConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload
    },
    addPresence(state, action: PayloadAction<UserPresence>) {
      const exists = state.activeUsers.findIndex((u) => u.userId === action.payload.userId)
      if (exists >= 0) {
        state.activeUsers[exists] = action.payload
      } else {
        state.activeUsers.push(action.payload)
      }
    },
    removePresence(state, action: PayloadAction<string>) {
      state.activeUsers = state.activeUsers.filter((u) => u.userId !== action.payload)
    },
    clearPresence(state) {
      state.activeUsers = []
      state.cursors = []
    },
    updateCursor(state, action: PayloadAction<CursorPosition>) {
      const exists = state.cursors.findIndex((c) => c.userId === action.payload.userId)
      if (exists >= 0) {
        state.cursors[exists] = action.payload
      } else {
        state.cursors.push(action.payload)
      }
    },
    removeCursor(state, action: PayloadAction<string>) {
      state.cursors = state.cursors.filter((c) => c.userId !== action.payload)
    },
    addPendingOp(state, action: PayloadAction<DocumentOperation>) {
      state.pendingOperations.push(action.payload)
    },
    clearPendingOps(state) {
      state.pendingOperations = []
    },
  },
})

export const {
  setConnected,
  addPresence,
  removePresence,
  clearPresence,
  updateCursor,
  removeCursor,
  addPendingOp,
  clearPendingOps,
} = collaborationSlice.actions

export default collaborationSlice.reducer
