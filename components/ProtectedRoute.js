'use client'

// Frontend routes rely on backend JWT checks + the global
// axios interceptor in `lib/api` to enforce auth. This wrapper
// exists to keep a consistent API and is a no-op to avoid
// client-side redirect loops.
export default function ProtectedRoute({ children }) {
  return children
}
