import { useState, useEffect } from 'react'
import { db, BOUNCERS, BOUNCER_DISPLAY, normalizeBouncer, getInvestment } from '../lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { parseISO, getYear, getMonth } from 'date-fns'

const BOUNCER_COLORS = {
  minecraft: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },
  dinosaur: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700' },
  unicorn: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' },
}

const MONTH_NAMES = [
  'Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip',
  'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'
]

export default function Revenue() {
  const [reservations, setReservations] = useState([])
  const [expenses, setExpenses] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    setReservations(db.reservations.getAll())
    setExpenses(db.expenses.getAll())
  }, [])

  const calcPrice = (r) => (r.price || 100) * (1 - (r.discount || 0) / 100)
  const investment = getInvestment()

  // Revenue by model - normalize bouncer names
  const byModel = {}
  BOUNCERS.forEach(b => { byModel[b] = { count: 0, revenue: 0 } })
  reservations.forEach(r => {
    const b = normalizeBouncer(r.bouncer)
    if (!byModel[b]) byModel[b] = { count: 0, revenue: 0 }
    byModel[b].count++
    byModel[b].revenue += calcPrice(r)
  })

  const totalRevenue = reservations.reduce((sum, r) => sum + calcPrice(r), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  // Monthly data - normalize bouncer names
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthRes = reservations.filter(r => {
      const d = parseISO(r.date)
      return getYear(d) === selectedYear && getMonth(d) === i
    })
    const byBouncer = {}
    BOUNCERS.forEach(b => { byBouncer[b] = 0 })
    monthRes.forEach(r => {
      const b = normalizeBouncer(r.bouncer)
      if (byBouncer[b] === undefined) byBouncer[b] = 0
      byBouncer[b] += calcPrice(r)
    })
    return { byBouncer, total: monthRes.reduce((sum, r) => sum + calcPrice(r), 0), count: monthRes.length }
  })

  const yearTotal = monthlyData.reduce((sum, m) => sum + m.total, 0)
  const maxMonthly = Math.max(...monthlyData.map(m => m.total), 1)

  return (
    <div className="space-y-4">
      {/* Revenue by model */}
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
                    <span className="text-sm font-medium text-brand-dark">{BOUNCER_DISPLAY[b]}</span>
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
            <p className="font-bold text-brand-dark">{investment.toLocaleString()}€</p>
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

      {/* Monthly - fixed bar: total width = month total / max month total */}
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-brand-dark">Po mjesecima</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedYear(y => y - 1)} className="p-1 active:bg-gray-100 rounded">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-medium text-brand-dark min-w-[48px] text-center">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="p-1 active:bg-gray-100 rounded">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {monthlyData.map((m, i) => {
            const totalWidth = maxMonthly > 0 ? (m.total / maxMonthly * 100) : 0
            return (
              <div key={i} className={`${m.total === 0 ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-gray-500 w-10">{MONTH_NAMES[i]}</span>
                  <span className="font-medium text-brand-dark">{m.total > 0 ? `${m.total.toLocaleString()}€` : '-'}</span>
                </div>
                <div className="h-4 bg-gray-50 rounded-full overflow-hidden">
                  <div className="flex h-full" style={{ width: `${totalWidth}%` }}>
                    {BOUNCERS.map(b => {
                      const segPct = m.total > 0 ? (m.byBouncer[b] / m.total * 100) : 0
                      if (segPct === 0) return null
                      return (
                        <div
                          key={b}
                          className={`${BOUNCER_COLORS[b].bg} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                          style={{ width: `${segPct}%` }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
          <span className="font-semibold text-brand-dark">Godina {selectedYear}</span>
          <span className="font-bold text-brand-dark">{yearTotal.toLocaleString()}€</span>
        </div>
      </div>
    </div>
  )
}
