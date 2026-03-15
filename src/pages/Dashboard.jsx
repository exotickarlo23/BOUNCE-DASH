import { useState, useEffect, useCallback } from 'react'
import { db, getInvestment, setInvestment as saveInvestment, normalizeBouncer, BOUNCER_DISPLAY } from '../lib/supabase'
import { TrendingUp, CalendarDays, Euro, Target, ArrowUpRight, ArrowDownRight, Receipt, Pencil, Check, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns'
import { hr } from 'date-fns/locale'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [investment, setInvestmentState] = useState(getInvestment())
  const [editingInvestment, setEditingInvestment] = useState(false)
  const [investmentInput, setInvestmentInput] = useState('')

  const calcPrice = (r) => (r.price || 100) * (1 - (r.discount || 0) / 100)

  const loadStats = useCallback(() => {
    const reservations = db.reservations.getAll()
    const expenses = db.expenses.getAll()
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const today = format(now, 'yyyy-MM-dd')

    const monthRes = reservations.filter(r => {
      const d = parseISO(r.date)
      return isWithinInterval(d, { start: monthStart, end: monthEnd })
    })

    const totalRevenue = reservations.reduce((sum, r) => sum + calcPrice(r), 0)
    const monthRevenue = monthRes.reduce((sum, r) => sum + calcPrice(r), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

    const upcoming = reservations
      .filter(r => r.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)

    setStats({
      totalRevenue,
      totalExpenses,
      monthRevenue,
      monthReservations: monthRes.length,
      totalReservations: reservations.length,
      upcomingReservations: upcoming,
    })
  }, [])

  useEffect(() => {
    loadStats()
    const handleFocus = () => {
      loadStats()
      setInvestmentState(getInvestment())
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadStats])

  function handleSaveInvestment() {
    const val = parseFloat(investmentInput)
    if (val > 0) {
      saveInvestment(val)
      setInvestmentState(val)
    }
    setEditingInvestment(false)
  }

  if (!stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-gray-200 rounded-2xl h-36" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-2xl h-28" />)}
        </div>
      </div>
    )
  }

  const roi = stats.totalRevenue - stats.totalExpenses
  const roiPercent = investment > 0 ? ((roi / investment) * 100).toFixed(1) : 0

  return (
    <div className="space-y-4">
      {/* ROI Card */}
      <div className="bg-gradient-to-br from-brand-teal to-teal-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          {editingInvestment ? (
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-80">Uloženo:</span>
              <input
                type="number"
                value={investmentInput}
                onChange={(e) => setInvestmentInput(e.target.value)}
                className="w-24 px-2 py-1 rounded-lg text-sm text-brand-dark bg-white"
                autoFocus
                inputMode="decimal"
              />
              <span className="text-sm">€</span>
              <button onClick={handleSaveInvestment} className="p-1 bg-white/20 rounded-lg">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingInvestment(false)} className="p-1 bg-white/20 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setInvestmentInput(String(investment)); setEditingInvestment(true) }}
              className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100 transition"
            >
              ROI (uloženo: {investment.toLocaleString()}€)
              <Pencil className="w-3 h-3" />
            </button>
          )}
          <Target className="w-5 h-5 opacity-80" />
        </div>
        <div className="text-3xl font-bold">{roiPercent}%</div>
        <div className="flex items-center gap-1 mt-1 text-sm opacity-90">
          {roi >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>Neto: {roi.toLocaleString()}€</span>
        </div>
        <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(Math.max(parseFloat(roiPercent), 0), 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Euro className="w-5 h-5 text-brand-orange" />}
          label="Ukupni prihod"
          value={`${stats.totalRevenue.toLocaleString()}€`}
          bg="bg-brand-orange-light"
        />
        <StatCard
          icon={<Receipt className="w-5 h-5 text-red-500" />}
          label="Ukupni troškovi"
          value={`${stats.totalExpenses.toLocaleString()}€`}
          bg="bg-red-50"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-brand-teal" />}
          label="Ovaj mjesec"
          value={`${stats.monthRevenue.toLocaleString()}€`}
          sub={`${stats.monthReservations} rez.`}
          bg="bg-brand-teal-light"
        />
        <StatCard
          icon={<CalendarDays className="w-5 h-5 text-blue-500" />}
          label="Ukupno rezervacija"
          value={stats.totalReservations}
          bg="bg-blue-50"
        />
      </div>

      {/* Upcoming */}
      {stats.upcomingReservations.length > 0 && (
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-semibold text-brand-dark mb-3">Nadolazeće rezervacije</h3>
          <div className="space-y-2">
            {stats.upcomingReservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm text-brand-dark">{r.name}</p>
                  <p className="text-xs text-gray-400">{BOUNCER_DISPLAY[normalizeBouncer(r.bouncer)] || r.bouncer}</p>
                </div>
                <span className="text-sm font-medium text-brand-teal">
                  {format(parseISO(r.date), 'd. MMM', { locale: hr })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, sub, bg }) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold text-brand-dark">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}
