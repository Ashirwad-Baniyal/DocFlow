// JWT token utilities — localStorage-based token management

const ACCESS_TOKEN_KEY = 'docflow_access_token'
const REFRESH_TOKEN_KEY = 'docflow_refresh_token'

export const getToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const clearToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const clearRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const clearAllTokens = (): void => {
  clearToken()
  clearRefreshToken()
}

interface JwtPayload {
  sub: string
  iat: number
  exp: number
  [key: string]: unknown
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as JwtPayload
  } catch {
    return null
  }
}

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token)
  if (!payload) return true
  // exp is in seconds; Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now()
}
