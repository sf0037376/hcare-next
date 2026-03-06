"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"

export default function PharmacyInventory() {
  const { Toast, show } = useToast()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Medicine",
    stock_quantity: "",
    unit_price: "",
    expiry_date: ""
  })

  useEffect(() => {
    loadInventory()
  }, [])

  async function loadInventory() {
    setLoading(true)
    try {
      // Mocking inventory for now as we might need a backend route update
      // In a real scenario, we'd have GET /pharmacy/inventory
      const data = [
        { id: 1, name: "Amoxicillin 250mg", category: "Antibiotic", stock_quantity: 450, unit_price: 12.50, expiry_date: "2026-12-31" },
        { id: 2, name: "Paracetamol Syrup", category: "Analgesic", stock_quantity: 80, unit_price: 45.00, expiry_date: "2025-06-15" }
      ]
      setInventory(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddItem(e) {
    e.preventDefault()
    // Mock addition
    const added = { ...newItem, id: Date.now() }
    setInventory([...inventory, added])
    show(`${newItem.name} added to inventory`)
    setNewItem({ name: "", category: "Medicine", stock_quantity: "", unit_price: "", expiry_date: "" })
  }

  return (
    <ProtectedRoute roles={["admin", "pharmacist"]}>
      <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
        {Toast}
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Pharmacy Inventory</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage medicine stock, pricing, and expiry tracking.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Add Item Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">+</span>
                Add Stock
              </h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="form-label">Item Name</label>
                  <input
                    className="form-input"
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    placeholder="e.g. Paracetamol"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                    placeholder="e.g. Antibiotic"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newItem.stock_quantity}
                      onChange={e => setNewItem({...newItem, stock_quantity: e.target.value})}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={newItem.unit_price}
                      onChange={e => setNewItem({...newItem, unit_price: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newItem.expiry_date}
                    onChange={e => setNewItem({...newItem, expiry_date: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" className="w-full btn-primary py-3 !bg-emerald-600 shadow-emerald-500/20">
                  Update Inventory
                </button>
              </form>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/50">
                <h3 className="text-lg font-semibold">Stock Directory</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium">Low Stock: 2</span>
                  <span className="px-3 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium">Expiring Soon: 1</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Medicine / Item</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4">Unit Price</th>
                      <th className="px-6 py-4">Expiry</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {inventory.map(item => (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">{item.name}</td>
                        <td className="px-6 py-4 text-zinc-500 text-sm">{item.category}</td>
                        <td className="px-6 py-4">
                          <span className={`font-mono font-bold ${item.stock_quantity < 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {item.stock_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-900 dark:text-white font-medium">₹{item.unit_price}</td>
                        <td className="px-6 py-4 text-zinc-500 text-sm font-mono truncate max-w-[100px]">{item.expiry_date}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <span className="text-lg">⚙️</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {loading && (
                      <tr><td colSpan="6" className="px-6 py-10 text-center text-zinc-500">Scanning inventory...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
