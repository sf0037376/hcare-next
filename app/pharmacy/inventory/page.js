"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "../../../lib/api"
import useToast from "../../../components/toast"
import ProtectedRoute from "../../../components/ProtectedRoute"

export default function PharmacyInventory() {
  const { Toast, show } = useToast()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [expiredOnly, setExpiredOnly] = useState(false)
  
  const [newItem, setNewItem] = useState({
    medicine: "",
    category: "Medicine",
    stock: "",
    price: "",
    expiry_date: "",
    barcode: ""
  })

  useEffect(() => {
    loadInventory()
  }, [])

  const filteredInventory = inventory.filter(item => {
    if (searchQuery && !item.medicine.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (lowStockOnly && item.stock >= 50) return false
    if (expiredOnly && new Date(item.expiry_date) >= new Date()) return false
    return true
  })

  async function loadInventory() {
    setLoading(true)
    try {
      const data = await apiFetch("/pharmacy/inventory")
      setInventory(Array.isArray(data) ? data : [])
    } catch(err) {
      show("Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddItem(e) {
    e.preventDefault()
    try {
      await apiFetch("/pharmacy/inventory", {
        method: "POST",
        body: JSON.stringify(newItem)
      })
      show(`${newItem.medicine} added to inventory`)
      setNewItem({ medicine: "", category: "Medicine", stock: "", price: "", expiry_date: "", barcode: "" })
      loadInventory() // reload to see new item
    } catch(err) {
      show("Failed to add item: " + err.message)
    }
  }

  return (
    <ProtectedRoute roles={["admin", "super_admin", "pharmacist"]}>
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
                  <label className="form-label">Item / Medicine Name</label>
                  <input
                    className="form-input"
                    value={newItem.medicine}
                    onChange={e => setNewItem({...newItem, medicine: e.target.value})}
                    placeholder="e.g. Paracetamol"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Barcode (Optional)</label>
                  <input
                    className="form-input focus:ring-blue-500"
                    value={newItem.barcode}
                    onChange={e => setNewItem({...newItem, barcode: e.target.value})}
                    placeholder="Scan or type barcode"
                    title="Focus this field and use scanner"
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
                      value={newItem.stock}
                      onChange={e => setNewItem({...newItem, stock: e.target.value})}
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
                      value={newItem.price}
                      onChange={e => setNewItem({...newItem, price: e.target.value})}
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
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-50/50 dark:bg-zinc-800/50 gap-4">
                <h3 className="text-lg font-semibold">Stock Directory</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                  <input
                    className="form-input py-2 px-3 rounded-xl text-sm w-full sm:w-64 border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Search medicines by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap text-zinc-600 dark:text-zinc-300 select-none">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        checked={lowStockOnly}
                        onChange={(e) => setLowStockOnly(e.target.checked)}
                      />
                      Low Stock (&lt; 50)
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap text-zinc-600 dark:text-zinc-300 select-none">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                        checked={expiredOnly}
                        onChange={(e) => setExpiredOnly(e.target.checked)}
                      />
                      Expired
                    </label>
                  </div>
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
                    {filteredInventory.map(item => (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white flex flex-col items-start gap-1">
                          <span>{item.medicine}</span>
                          {item.barcode && <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-mono tracking-wider">BC: {item.barcode}</span>}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 text-sm">{item.category}</td>
                        <td className="px-6 py-4">
                          <span className={`font-mono font-bold ${item.stock < 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-900 dark:text-white font-medium">₹{parseFloat(item.price).toFixed(2)}</td>
                        <td className="px-6 py-4 text-zinc-500 text-sm font-mono truncate max-w-[100px]">
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </td>
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
                    {!loading && filteredInventory.length === 0 && (
                      <tr><td colSpan="6" className="px-6 py-10 text-center text-zinc-500">No matching medicines found in inventory.</td></tr>
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
