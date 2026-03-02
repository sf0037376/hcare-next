import { jwtDecode } from "jwt-decode"

export function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function setToken(token) {
  if (typeof window === "undefined") return
  localStorage.setItem("token", token)
}

export function clearAuthAndRedirect() {
  if (typeof window === "undefined") return
  localStorage.clear()
  window.location.href = "/login"
}

export function getUser() {
  const token = getToken()
  if (!token) return null

  try {
    return jwtDecode(token)
  } catch {
    clearAuthAndRedirect()
    return null
  }
}

