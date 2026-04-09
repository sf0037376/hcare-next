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
      <div className="animate-in fade-in slide-in-from-bottom-5 duration-1000 max-w-7xl mx-auto pb-40 px-6 transition-all">
        {Toast}
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 px-4">
          <div>
            <h2 className="text-6xl font-black tracking-tighter uppercase premium-text-gradient italic leading-none mb-4">Clinical_Supply_Registry</h2>
            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono">Precision_Asset_Oversight & Institutional_Expiry_Tracking.</p>
          </div>
          <div className="flex items-center gap-4 px-8 py-4 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] shadow-2xl shadow-emerald-500/[0.05]">
             <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono">{inventory.length}_SKU_Nodes_Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Tactical Logistics Ingestion Module */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="glass-card rounded-[4rem] p-12 md:p-14 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-white/5 sticky top-32 overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-emerald-500/10 transition-colors duration-1000"></div>
              <div className="mb-12 relative z-10">
                <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none mb-4">Logistical_Ingestion</h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] leading-relaxed italic">Synchronize_Institutional_Asset_Arrival.</p>
              </div>

              <form onSubmit={handleAddItem} className="space-y-12 relative z-10">
                <div className="space-y-8">
                    <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Clinical_Asset_Identifier</label>
                    <input
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-lg font-black tracking-tight italic focus:ring-4 ring-emerald-500/20 transition-all placeholder:text-zinc-500"
                        value={newItem.medicine}
                        onChange={e => setNewItem({...newItem, medicine: e.target.value})}
                        placeholder="E.G. PARACETAMOL_500MG"
                        required
                    />
                    </div>
                    <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Global_Node_Barcode (Scanned)</label>
                    <div className="relative group/input">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30 group-focus-within/input:opacity-100 transition-opacity text-2xl">📟</span>
                        <input
                            className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] pl-20 pr-8 py-6 text-sm font-black font-mono tracking-widest focus:ring-4 ring-emerald-500/20 transition-all"
                            value={newItem.barcode}
                            onChange={e => setNewItem({...newItem, barcode: e.target.value})}
                            placeholder="AWAITING_INPUT_SIGNAL..."
                        />
                    </div>
                    </div>
                    <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Supply_Vector_Classification</label>
                    <div className="relative">
                        <select 
                            className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-[11px] font-black uppercase tracking-[0.3em] focus:ring-4 ring-emerald-500/20 transition-all appearance-none cursor-pointer" 
                            value={newItem.category} 
                            onChange={e => setNewItem({...newItem, category: e.target.value})}
                        >
                            <option value="Medicine">Pharma_&_Medicinals</option>
                            <option value="Surgical">Surgical_Intervention_Units</option>
                            <option value="Injection">Injection_&_IV_Nodes</option>
                            <option value="General">General_Logistical_Assets</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
                    </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Bulk_Qty</label>
                        <input
                        type="number"
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-xl font-black font-mono tracking-tighter focus:ring-4 ring-emerald-500/20 transition-all text-center"
                        value={newItem.stock}
                        onChange={e => setNewItem({...newItem, stock: e.target.value})}
                        placeholder="00"
                        required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Unit_Val (₹)</label>
                        <input
                        type="number"
                        step="0.01"
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-xl font-black font-mono tracking-tighter focus:ring-4 ring-emerald-500/20 transition-all text-center"
                        value={newItem.price}
                        onChange={e => setNewItem({...newItem, price: e.target.value})}
                        placeholder="0.00"
                        required
                        />
                    </div>
                    </div>
                    <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 block mb-4 ml-2 italic">Institutional_Expiry_Threshold</label>
                    <input
                        type="date"
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[2rem] p-6 text-[11px] font-black uppercase tracking-[0.4em] focus:ring-4 ring-emerald-500/20 transition-all cursor-pointer"
                        value={newItem.expiry_date}
                        onChange={e => setNewItem({...newItem, expiry_date: e.target.value})}
                        required
                    />
                    </div>
                </div>
                
                <div className="pt-6">
                    <button type="submit" className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all outline-none duration-500 font-mono">Commit_Logistics_Asset →</button>
                </div>
              </form>
              <div className="absolute -bottom-20 -left-20 text-[25rem] opacity-[0.03] grayscale -rotate-12 select-none pointer-events-none group-hover:rotate-0 transition-transform duration-1000">📦</div>
            </div>
          </div>

          {/* Institutional Asset Registry */}
          <div className="lg:col-span-8 order-1 lg:order-2 space-y-12">
            <div className="glass-card rounded-[4rem] p-10 mb-12 flex flex-col md:flex-row gap-8 items-center shadow-2xl shadow-zinc-950/[0.03] border-white/5 relative overflow-hidden group">
                <div className="relative flex-1 group/search w-full">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within/search:text-emerald-500 transition-colors text-2xl group-hover/search:scale-125 duration-500">🔍</span>
                    <input 
                        type="text" 
                        placeholder="SEARCH_STOCK_DIRECTORY: MEDICINE_NAME || BARCODE_ID" 
                        className="w-full bg-zinc-100/50 dark:bg-zinc-800/30 border-none rounded-[2.5rem] pl-20 pr-10 py-8 text-[11px] font-black text-zinc-900 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-500 tracking-[0.2em] focus:ring-4 ring-emerald-500/10 italic"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 p-3 bg-zinc-100/50 dark:bg-zinc-800/30 rounded-[2.5rem] border border-white/5 shadow-2xl">
                    <button 
                        onClick={() => setLowStockOnly(!lowStockOnly)}
                        className={`px-8 py-4 rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${lowStockOnly ? 'bg-red-600 text-white shadow-2xl shadow-red-600/20' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-mono'}`}
                    >
                        Low_Stock_Protocol
                    </button>
                    <button 
                        onClick={() => setExpiredOnly(!expiredOnly)}
                        className={`px-8 py-4 rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${expiredOnly ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 shadow-2xl' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-mono'}`}
                    >
                        Expired_Assets
                    </button>
                </div>
            </div>

            <div className="glass-card rounded-[5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border-white/5">
                <table className="clinical-table">
                    <thead>
                        <tr>
                            <th className="pl-12 py-10 font-mono text-[10px] uppercase tracking-[0.5em] text-zinc-500">Node_Asset_Identity</th>
                            <th className="hidden md:table-cell py-10 font-mono text-[10px] uppercase tracking-[0.5em] text-zinc-500">Logistical_Vector</th>
                            <th className="py-10 font-mono text-[10px] uppercase tracking-[0.5em] text-zinc-500">Asset_Status</th>
                            <th className="py-10 font-mono text-[10px] uppercase tracking-[0.5em] text-zinc-500">Pricing_Z</th>
                            <th className="pr-12 text-right py-10 font-mono text-[10px] uppercase tracking-[0.5em] text-zinc-500 italic">Verify</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30">
                        {filteredInventory.map(item => {
                            const isExpired = new Date(item.expiry_date) < new Date();
                            const isLow = item.stock < 50;
                            
                            return (
                                <tr key={item.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all duration-700">
                                    <td className="pl-12 py-10">
                                        <div className="flex items-center gap-8">
                                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-2xl transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 ${isExpired ? 'bg-red-600/10 text-red-600 border border-red-600/20' : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 group-hover:bg-zinc-950 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-950 border border-white/5'}`}>
                                                {item.category === 'Injection' ? '💉' : '💊'}
                                            </div>
                                            <div className="font-mono">
                                                <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter italic group-hover:text-blue-600 transition-colors duration-500 uppercase">{item.medicine}</h4>
                                                <div className="flex items-center gap-4 mt-3 cursor-default">
                                                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em] italic">CAT_{item.category.toUpperCase()}</span>
                                                    {item.barcode && <span className="text-[10px] font-mono text-zinc-400 p-1 border-b border-zinc-200 dark:border-zinc-800 group-hover:border-blue-500 transition-colors">{item.barcode}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell py-10">
                                        <div className="flex flex-col gap-2 font-mono">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] leading-none opacity-50">EXPIRY_Z:</span>
                                            <span className={`text-[13px] font-black tracking-tighter italic ${isExpired ? 'text-red-600 animate-pulse' : 'text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-all'}`}>
                                                {new Date(item.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-10">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${isLow ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}></div>
                                                <span className={`text-lg font-black font-mono tracking-tighter italic ${isLow ? 'text-red-600' : 'text-zinc-900 dark:text-white'}`}>
                                                    {item.stock}_UNITS
                                                </span>
                                            </div>
                                            <span className={`inline-flex px-6 py-2 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.3em] border self-start italic transition-all duration-700 ${isLow ? 'bg-red-600/10 text-red-600 border-red-600/20 shadow-xl shadow-red-600/5' : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 border-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'}`}>
                                                {isLow ? 'REFILL_PROTOCOL_ACTIVE' : 'AVAILABILITY_STABLE'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-10">
                                        <div className="space-y-3 font-mono">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] block opacity-40 italic">UNIT_VAL_Z</span>
                                            <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none italic group-hover:scale-105 transition-transform origin-left block">
                                                ₹{parseFloat(item.price).toFixed(2)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="pr-12 py-10 text-right">
                                        <button className="w-16 h-16 flex items-center justify-center rounded-[2rem] bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/5 transition-all shadow-2xl active:scale-90 group/btn border border-white/5">
                                            <span className="text-3xl group-hover/btn:rotate-[360deg] transition-transform duration-1000 ease-in-out">⚙️</span>
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {loading && (
                    <div className="py-40 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/40 relative overflow-hidden">
                        <div className="w-16 h-16 border-8 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-10 shadow-2xl shadow-emerald-500/20"></div>
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 animate-pulse italic">Scanning_Institutional_Logistics_Nodes...</p>
                    </div>
                )}
                {!loading && filteredInventory.length === 0 && (
                    <div className="py-60 flex flex-col items-center justify-center opacity-40 group hover:opacity-100 transition-all duration-1000">
                        <span className="text-[12rem] mb-12 grayscale group-hover:grayscale-0 group-hover:rotate-12 transition-all duration-1000">📦</span>
                        <h3 className="text-3xl font-black uppercase tracking-[0.4em] text-zinc-500 italic">Inventory_Directory_Inactive</h3>
                        <p className="text-[11px] font-black text-zinc-400 mt-6 uppercase tracking-[0.3em] italic">Adjust_Vector_Filters_to_Discover_Supply_Nodes.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>

  )
}
