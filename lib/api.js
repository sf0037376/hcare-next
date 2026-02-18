const API = process.env.NEXT_PUBLIC_API_URL

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token")
    const orgId = localStorage.getItem("orgId") || 1

    const res = await fetch(API + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Organisation-Id": orgId,
        ...(options.headers || {}),
      },
    })
  
    if (res.status === 401) {
      localStorage.clear()
      window.location.href = "/"
      return
    }
  
    return res.json()
  }