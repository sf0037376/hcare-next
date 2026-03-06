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
      <div className="animate-in fade-in duration-500">
        {Toast}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Staff & Users</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage system access for doctors, nurses, and admins.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm top-24 sticky">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="text-blue-500">👨‍⚕️</span> New Account
              </h3>
              
              <form onSubmit={createUser} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Username</label>
                  <input
                    className="block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    name="username"
                    placeholder="Enter username"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Password</label>
                  <input
                    className="block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Role</label>
                  <select
                    className="block w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium capitalize"
                    name="role"
                    defaultValue="nurse"
                  >
                    <option value="admin">Administrator</option>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="submit"
                    className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Create User Account
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Users List */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Active Users</h3>
              </div>
              
              {loading ? (
                <div className="p-8 pb-12 flex flex-col items-center justify-center text-zinc-500">
                  <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p>Loading user directory...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">User Info</th>
                        <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">Role</th>
                        <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm uppercase">
                              {u.username.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold">{u.username}</div>
                              <div className="text-xs text-zinc-500 font-normal">ID: #{u.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              u.role === 'doctor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                             <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              {u.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="3" className="px-6 py-12 text-center text-sm text-zinc-500">
                            No users found. System may be uninitialized.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

