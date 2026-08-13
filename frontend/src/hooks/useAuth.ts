import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../store/store'
import { loginThunk, registerThunk, logoutThunk } from '../store/authSlice'
import type { LoginRequest, RegisterRequest } from '../types'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth)

  const login = useCallback(
    (credentials: LoginRequest) => dispatch(loginThunk(credentials)),
    [dispatch]
  )

  const register = useCallback(
    (data: RegisterRequest) => dispatch(registerThunk(data)),
    [dispatch]
  )

  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch])

  return { user, isAuthenticated, loading, error, login, register, logout }
}
