"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"

export default function UserManagement() {
  const { Toast, show } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // New User Form State
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "staff"
  })

  // Password Reset State
  const [resetData, setResetData] = useState({ userId: null, newPassword: "" })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await apiFetch("/users")
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      show("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(newUser)
      })
      show("User created successfully")
      setNewUser({ username: "", email: "", password: "", role: "staff" })
      loadUsers()
    } catch (err) {
      show("Failed to create user")
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    try {
      // Assuming a password reset endpoint exists or we use update
      await apiFetch(`/users/${resetData.userId}`, {
        method: "PUT",
        body: JSON.stringify({ password: resetData.newPassword })
      })
      show("Password updated successfully")
      setResetData({ userId: null, newPassword: "" })
    } catch (err) {
      show("Failed to reset password")
    }
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">User & Staff Management</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage hospital staff logins, roles, and security.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Create New Staff</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="form-label">Username</label>
                  <input
                    className="form-input"
                    value={newUser.username}
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                    placeholder="john_doe"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    placeholder="john@hospital.com"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Temporary Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="staff">Staff</option>
                    <option value="attender">Attender</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="w-full btn-primary py-3 mt-2">
                  Add Staff Member
                </button>
              </form>
            </div>
          </div>

          {/* User List & Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Active Staff Directory</h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {users.length} Total
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg">
                              {user.role === 'doctor' ? '👨‍⚕️' : '👤'}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-white">{user.username}</p>
                              <p className="text-xs text-zinc-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'admin' ? 'bg-red-100 text-red-600' :
                            user.role === 'doctor' ? 'bg-blue-100 text-blue-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => setResetData({ userId: user.id, newPassword: "" })}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                    {loading && (
                      <tr><td colSpan="3" className="px-6 py-10 text-center text-zinc-500">Loading directory...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Password Reset Section (Conditional) */}
            {resetData.userId && (
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-3xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-400">Reset Password for User #{resetData.userId}</h4>
                  <button onClick={() => setResetData({ userId: null, newPassword: "" })} className="text-zinc-400 hover:text-zinc-600">&times;</button>
                </div>
                <form onSubmit={handleResetPassword} className="flex gap-4">
                  <input
                    type="password"
                    className="form-input flex-1"
                    placeholder="Enter new password"
                    value={resetData.newPassword}
                    onChange={e => setResetData({...resetData, newPassword: e.target.value})}
                    required
                  />
                  <button type="submit" className="btn-primary !bg-orange-600 shadow-orange-500/20 px-6">
                    Confirm Reset
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
