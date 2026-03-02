"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/api"
import useToast from "../../components/toast"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function UsersPage() {
  const { Toast, show } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadUsers() {
    try {
      const data = await apiFetch("/users")
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      show("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function createUser(e) {
    e.preventDefault()
    const body = {
      username: e.target.username.value,
      password: e.target.password.value,
      role: e.target.role.value,
    }

    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(body),
      })
      show("User created")
      e.target.reset()
      loadUsers()
    } catch (e) {
      show("Failed to create user")
    }
  }

  return (
    <ProtectedRoute>
      <div className="page">
        {Toast}
        <h2 className="page-title">Users</h2>

        <form onSubmit={createUser} className="form">
          <input name="username" placeholder="Username" required />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <select name="role" defaultValue="nurse">
            <option value="admin">Admin</option>
            <option value="nurse">Nurse</option>
            <option value="doctor">Doctor</option>
          </select>
          <button type="submit">Create User</button>
        </form>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

