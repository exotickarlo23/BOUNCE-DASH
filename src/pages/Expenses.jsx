import { useState, useEffect, useCallback } from 'react'
import { db, EXPENSE_CATEGORIES } from '../lib/supabase'
import { Plus, Trash2, X, Fuel, Megaphone, Wrench, Warehouse } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const CATEGORY_CONFIG = {
  gorivo: { icon: Fuel, color: 'bg-blue-100 text-blue-600' },
  marketing: { icon: Megaphone, color: 'bg-purple-100 text-purple-600' },
  amortizacija: { icon: Wrench, color: 'bg-orange-100 text-orange-600' },
  'garaža': { icon: Warehouse, color: 'bg-green-100 text-green-600' },
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    category: 'gorivo', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd')
  })
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    const all = db.expenses.getAll()
    all.sort((a, b) => b.date.localeCompare(a.date))
    setExpenses(all)
  }, [])

  useEffect(() => { load() }, [load])

  function handleSave() {
    if (!form.amount || !form.category) return
    db.expenses.add({
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description,
      date: form.date,
    })
    setForm({ category: 'gorivo', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') })
    setShowAdd(false)
    load()
  }

  function handleDelete(id) {
    if (!confirm('Obrisati trošak?')) return
    db.expenses.delete(id)
    load()
  }

  // Category totals
  const categoryTotals = {}
  EXPENSE_CATEGORIES.forEach(c => { categoryTotals[c] = 0 })
  expenses.forEach(e => {
    if (!categoryTotals[e.category]) categoryTotals[e.category] = 0
    categoryTotals[e.category] += e.amount || 0
  })
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter)

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-brand-orange text-white rounded-xl font-medium shadow-sm active:scale-95 transition"
      >
        <Plus className="w-4 h-4" />
        Dodaj trošak
      </button>

      {/* Category summary */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="font-semibold text-brand-dark mb-3">Troškovi po kategoriji</h3>
        <div className="grid grid-cols-2 gap-2">
          {EXPENSE_CATEGORIES.map(cat => {
            const config = CATEGORY_CONFIG[cat]
            const Icon = config.icon
            const pct = totalExpenses > 0 ? (categoryTotals[cat] / totalExpenses * 100).toFixed(0) : 0
            return (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? 'all' : cat)}
                className={`p-3 rounded-xl text-left transition ${
                  filter === cat ? 'ring-2 ring-brand-teal bg-brand-teal-light' : 'bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-400 capitalize">{cat}</p>
                <p className="font-bold text-brand-dark">{categoryTotals[cat].toLocaleString()}€</p>
                <p className="text-xs text-gray-400">{pct}%</p>
              </button>
            )
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
          <span className="font-semibold text-brand-dark">Ukupno</span>
          <span className="font-bold text-red-500">{totalExpenses.toLocaleString()}€</span>
        </div>
      </div>

      {/* Expense list */}
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-brand-dark">
            {filter === 'all' ? 'Svi troškovi' : `Troškovi: ${filter}`}
          </h3>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-xs text-brand-teal">Prikaži sve</button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Nema troškova.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map((e) => {
              const config = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG.gorivo
              const Icon = config.icon
              return (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-10 h-10 ${config.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-dark truncate">
                      {e.description || e.category}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(parseISO(e.date), 'd.M.yyyy')} · <span className="capitalize">{e.category}</span>
                    </p>
                  </div>
                  <span className="font-bold text-sm text-red-500 flex-shrink-0">-{e.amount}€</span>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="p-1 text-gray-300 active:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-dark text-lg">Novi trošak</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 active:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Kategorija</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPENSE_CATEGORIES.map(cat => {
                    const config = CATEGORY_CONFIG[cat]
                    const Icon = config.icon
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat })}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm capitalize transition ${
                          form.category === cat
                            ? 'border-brand-teal bg-brand-teal-light text-brand-teal font-medium'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Iznos (€) *</label>
                <input
                  type="number" placeholder="0" value={form.amount} inputMode="decimal"
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Opis</label>
                <input
                  type="text" placeholder="npr. Gorivo za dostavu" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Datum</label>
                <input
                  type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={!form.amount}
                className="w-full py-3 bg-brand-orange text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition"
              >
                Spremi trošak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
