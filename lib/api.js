import axios from "axios"

const API = process.env.NEXT_PUBLIC_API_URL

if (!API && typeof window !== "undefined") {
  // Fail fast in the browser if env is not configured
  // eslint-disable-next-line no-console
  console.error("NEXT_PUBLIC_API_URL is not defined")
}

// Axios instance with JWT + organisation header
const api = axios.create({
  baseURL: API,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor: attach JWT + org id
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      const orgId = localStorage.getItem("orgId")
      const userId = localStorage.getItem("userId")

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      if (orgId) {
        config.headers["X-Organisation-Id"] = Number(orgId)
      }
      if (userId) {
        config.headers["X-User-Id"] = Number(orgId)
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 globally (without forcing redirects)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response &&
      error.response.status === 401
    ) {
      localStorage.clear()
    }

    return Promise.reject(error)
  }
)

// Thin wrapper so the rest of the app uses a fetch-like signature.
export async function apiFetch(url, options = {}) {
  const {
    method = "GET",
    body,
    params,
    headers: extraHeaders,
    ...rest
  } = options

  const config = {
    url,
    method,
    params,
    data: body ? (typeof body === "string" ? JSON.parse(body) : body) : undefined,
    headers: extraHeaders,
    ...rest,
  }

  const response = await api.request(config)
  return response.data
}

