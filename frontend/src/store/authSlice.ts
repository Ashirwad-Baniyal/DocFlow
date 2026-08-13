import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { User, LoginRequest, RegisterRequest } from '../types'
import { authApi } from '../utils/api'
import {
  setToken,
  setRefreshToken,
  clearAllTokens,
  getToken,
  getRefreshToken,
  isTokenExpired,
  decodeToken,
} from '../utils/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Restore auth from localStorage on app init
const storedToken = getToken()
const storedRefresh = getRefreshToken()
const isValid = storedToken && !isTokenExpired(storedToken)

const initialState: AuthState = {
  user: null,
  accessToken: isValid ? storedToken : null,
  refreshToken: storedRefresh,
  isAuthenticated: !!isValid,
  loading: false,
  error: null,
}

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  'auth/loginThunk',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const data = await authApi.login(credentials)
      setToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      return data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Login failed')
    }
  }
)

export const registerThunk = createAsyncThunk(
  'auth/registerThunk',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.register(data)
      setToken(response.accessToken)
      setRefreshToken(response.refreshToken)
      return response
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message ?? 'Registration failed')
    }
  }
)

export const logoutThunk = createAsyncThunk('auth/logoutThunk', async (_, { getState }) => {
  try {
    const state = getState() as { auth: AuthState }
    await authApi.logout(state.auth.refreshToken ?? undefined)
  } catch {
    // Ignore logout API errors; clear tokens regardless
  } finally {
    clearAllTokens()
  }
})

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
    },
    clearCredentials(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      clearAllTokens()
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Register
    builder
      .addCase(registerThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Logout
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
    })
  },
})

export const { setCredentials, clearCredentials, setUser, setLoading, clearError } = authSlice.actions
export default authSlice.reducer
