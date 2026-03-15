import { useState, useEffect } from 'react'
import { supabase, BOUNCERS, INVESTMENT } from '../lib/supabase'
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO, getYear, getMonth } from 'date-fns'
import { hr } from 'date-fns/locale'

const BOUNCER_COLORS = {
  minecraft: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },
  dinosaur: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700' },
  unicorn: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' },
}

const MONTH_NAMES = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'
]

export default function Revenue() {
  const [reservations, setReservations] = useState([])
  const [expenses, setExpenses] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('reservations').select('*'),
      supabase.from('expenses').select('*'),
    ]).then(([res, exp]) => {
      setReservations(res.data || [])
      setExpenses(exp.data || [])
      setLoading(false)
    })
  }, [])

  const calcPrice = (r) => (r.price || 100) * (1 - (r.discount || 0) / 100)

  // Revenue by model
  const byModel = {}
  BOUNCERS.forEach(b => { byModel[b] = { count: 0, revenue: 0 } })
  reservations.forEach(r => {
    if (!byModel[r.bouncer]) byModel[r.bouncer] = { count: 0, revenue: 0 }
    byModel[r.bouncer].count++
    byModel[r.bouncer].revenue += calcPrice(r)
  })

  // Monthly data for selected year
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthRes = reservations.filter(r => {
      const d = parseISO(r.date)
      return getYear(d) === selectedYear && getMonth(d) === i
    })
    const byBouncer = {}
    BOUNCERS.forEach(b => { byBouncer[b] = 0 })
    monthRes.forEach(r => {
      if (!byBouncer[r.bouncer]) byBouncer[r.bouncer] = 0
      byBouncer[r.bouncer] += calcPrice(r)
    })
    const total = monthRes.reduce((sum, r) => sum + calcPrice(r), 0)
    return { month: i, byBouncer, total, count: monthRes.length }
  })

  const yearTotal = monthlyData.reduce((sum, m) => sum + m.total, 0)
  const totalRevenue = reservations.reduce((sum, r) => sum + calcPrice(r), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const maxMonthly = Math.max(...monthlyData.map(m => m.total), 1)

  const years = [...new Set(reservations.map(r => getYear(parseISO(r.date))))]
  if (!years.includes(selectedYear)) years.push(selectedYear)
  years.sort()

  if (loading) {
    return <div className="space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}</div>
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="font-semibold text-brand-dark mb-3">Prihod po napuhancu</h3>
        <div className="space-y-3">
          {BOUNCERS.map(b => {
            const data = byModel[b]
            const pct = totalRevenue > 0 ? (data.revenue / totalRevenue * 100).toFixed(0) : 0
            const colors = BOUNCER_COLORS[b]
            return (
              <div key={b}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                    <span className="text-sm font-medium capitalize text-brand-dark">{b}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-brand-dark">{data.revenue.toLocaleString()}€</span>
                    <span className="text-xs text-gray-400 ml-2">{data.count} rez.</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${colors.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
          <span className="font-semibold text-brand-dark">Ukupno</span>
          <span className="font-bold text-brand-dark text-lg">{totalRevenue.toLocaleString()}€</span>
        </div>
      </div>

      {/* ROI Summary */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="font-semibold text-brand-dark mb-2">Povrat investicije</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-brand-teal-light rounded-xl p-3">
            <p className="text-xs text-gray-500">Uloženo</p>
            <p className="font-bold text-brand-dark">{INVESTMENT.toLocaleString()}€</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Prihod</p>
            <p className="font-bold text-green-600">{totalRevenue.toLocaleString()}€</p>
          </div>
          <div className={`rounded-xl p-3 ${totalRevenue - totalExpenses >= 0 ? 'bg-brand-orange-light' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-500">Neto</p>
            <p className={`font-bold ${totalRevenue - totalExpenses >= 0 ? 'text-brand-orange' : 'text-red-500'}`}>
              {(totalRevenue - totalExpenses).toLocaleString()}€
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-brand-dark">Po mjesecima</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedYear(y => y - 1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-medium text-brand-dark min-w-[48px] text-center">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Bar chart */}
        <div className="space-y-2">
          {monthlyData.map((m, i) => (
            <div key={i} className={`${m.total === 0 ? 'opacity-40' : ''}`}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-gray-500 w-16">{MONTH_NAMES[i].slice(0, 3)}</span>
                <span className="font-medium text-brand-dark">{m.total > 0 ? `${m.total.toLocaleString()}€` : '-'}</span>
              </div>
              <div className="flex h-4 bg-gray-50 rounded-full overflow-hidden">
                {BOUNCERS.map(b => {
                  const w = maxMonthly > 0 ? (m.byBouncer[b] / maxMonthly * 100) : 0
                  if (w === 0) return null
                  return (
                    <div
                      key={b}
                      className={`${BOUNCER_COLORS[b].bg} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${w}%` }}
                      title={`${b}: ${m.byBouncer[b]}€`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
          <span className="font-semibold text-brand-dark">Godina {selectedYear}</span>
          <span className="font-bold text-brand-dark">{yearTotal.toLocaleString()}€</span>
        </div>
      </div>
    </div>
  )
}
