import { useState, useEffect } from 'react'
import { supabase, BOUNCERS, DEFAULT_PRICE } from '../lib/supabase'
import { parseReservationText } from '../lib/parseReservation'
import { Plus, ClipboardPaste, ChevronLeft, ChevronRight, X, Trash2, Phone, Mail } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay, isToday,
  parseISO
} from 'date-fns'
import { hr } from 'date-fns/locale'

const DAY_NAMES = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']
const BOUNCER_COLORS = {
  minecraft: 'bg-green-100 text-green-700 border-green-300',
  dinosaur: 'bg-orange-100 text-orange-700 border-orange-300',
  unicorn: 'bg-purple-100 text-purple-700 border-purple-300',
}

export default function Reservations() {
  const [reservations, setReservations] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showAdd, setShowAdd] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', phone: '', bouncer: 'minecraft', date: '', discount: 0, price: DEFAULT_PRICE
  })
  const [pasteText, setPasteText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchReservations() }, [])

  async function fetchReservations() {
    const { data } = await supabase.from('reservations').select('*').order('date', { ascending: true })
    setReservations(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.name || !form.date || !form.bouncer) return
    setSaving(true)
    const { error } = await supabase.from('reservations').insert([{
      name: form.name,
      email: form.email,
      phone: form.phone,
      bouncer: form.bouncer,
      date: form.date,
      discount: parseFloat(form.discount) || 0,
      price: parseFloat(form.price) || DEFAULT_PRICE,
    }])
    if (!error) {
      setForm({ name: '', email: '', phone: '', bouncer: 'minecraft', date: '', discount: 0, price: DEFAULT_PRICE })
      setShowAdd(false)
      setShowPaste(false)
      fetchReservations()
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Obrisati rezervaciju?')) return
    await supabase.from('reservations').delete().eq('id', id)
    fetchReservations()
  }

  function handlePaste() {
    const parsed = parseReservationText(pasteText)
    setForm({
      name: parsed.name || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      bouncer: parsed.bouncer || 'minecraft',
      date: parsed.date || '',
      discount: 0,
      price: DEFAULT_PRICE,
    })
    setShowPaste(false)
    setShowAdd(true)
  }

  // Calendar logic
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getReservationsForDay = (day) =>
    reservations.filter((r) => isSameDay(parseISO(r.date), day))

  const dayReservations = selectedDay ? getReservationsForDay(selectedDay) : []

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPaste(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl text-brand-dark font-medium shadow-sm hover:shadow transition"
        >
          <ClipboardPaste className="w-4 h-4 text-brand-teal" />
          Zalijepi rezervaciju
        </button>
        <button
          onClick={() => { setShowAdd(true); setForm(f => ({ ...f, date: format(new Date(), 'yyyy-MM-dd') })) }}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-orange text-white rounded-xl font-medium shadow-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Nova ručno
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="font-semibold text-brand-dark capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: hr })}
          </h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayRes = getReservationsForDay(day)
            const inMonth = isSameMonth(day, currentMonth)
            const today = isToday(day)
            const selected = selectedDay && isSameDay(day, selectedDay)

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(selected ? null : day)}
                className={`relative p-1 rounded-lg text-sm min-h-[44px] flex flex-col items-center justify-start transition
                  ${!inMonth ? 'text-gray-300' : 'text-brand-dark'}
                  ${today ? 'ring-2 ring-brand-teal' : ''}
                  ${selected ? 'bg-brand-teal-light' : 'hover:bg-gray-50'}
                `}
              >
                <span className={`text-xs ${today ? 'font-bold text-brand-teal' : ''}`}>
                  {format(day, 'd')}
                </span>
                {dayRes.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dayRes.map((r) => (
                      <span
                        key={r.id}
                        className={`w-2 h-2 rounded-full ${
                          r.bouncer === 'minecraft' ? 'bg-green-500' :
                          r.bouncer === 'dinosaur' ? 'bg-orange-500' : 'bg-purple-500'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Minecraft</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Dinosaur</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Unicorn</span>
        </div>
      </div>

      {/* Selected day reservations */}
      {selectedDay && (
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-semibold text-brand-dark mb-3">
            {format(selectedDay, 'd. MMMM yyyy', { locale: hr })}
          </h3>
          {dayReservations.length === 0 ? (
            <p className="text-gray-400 text-sm">Nema rezervacija za ovaj dan.</p>
          ) : (
            <div className="space-y-2">
              {dayReservations.map((r) => (
                <ReservationCard key={r.id} reservation={r} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All reservations list */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="font-semibold text-brand-dark mb-3">
          Sve rezervacije ({reservations.length})
        </h3>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
          </div>
        ) : reservations.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Nema još rezervacija.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Paste Modal */}
      {showPaste && (
        <Modal onClose={() => setShowPaste(false)} title="Zalijepi potvrdu rezervacije">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Zalijepi tekst potvrde ovdje, npr:\n\nIme i prezime: Marko Špoljar\nEmail: marko@gmail.com\nTelefon: 091 339 0426\nNapuhanac: minecraft\nDatum: 2026-04-18`}
            className="w-full h-40 p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
          <button
            onClick={handlePaste}
            disabled={!pasteText.trim()}
            className="w-full mt-3 py-3 bg-brand-teal text-white font-semibold rounded-xl disabled:opacity-50 transition"
          >
            Parsiraj i popuni
          </button>
        </Modal>
      )}

      {/* Add Modal */}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="Nova rezervacija">
          <div className="space-y-3">
            <input
              type="text" placeholder="Ime i prezime *" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
            <input
              type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
            <input
              type="tel" placeholder="Telefon" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
            <select
              value={form.bouncer}
              onChange={(e) => setForm({ ...form, bouncer: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
            >
              {BOUNCERS.map((b) => (
                <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
              ))}
            </select>
            <input
              type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Cijena (€)</label>
                <input
                  type="number" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Popust (%)</label>
                <input
                  type="number" value={form.discount} min="0" max="100"
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>
            {form.discount > 0 && (
              <p className="text-xs text-brand-teal text-center">
                Konačna cijena: {(form.price * (1 - form.discount / 100)).toFixed(0)}€
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.date}
              className="w-full py-3 bg-brand-orange text-white font-semibold rounded-xl disabled:opacity-50 transition"
            >
              {saving ? 'Spremanje...' : 'Spremi rezervaciju'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ReservationCard({ reservation: r, onDelete }) {
  const colorClass = BOUNCER_COLORS[r.bouncer] || 'bg-gray-100 text-gray-700 border-gray-300'
  const finalPrice = (r.price || 100) * (1 - (r.discount || 0) / 100)

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-brand-dark truncate">{r.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${colorClass}`}>
            {r.bouncer}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{format(parseISO(r.date), 'd.M.yyyy')}</span>
          <span className="font-medium text-brand-dark">{finalPrice}€</span>
          {r.discount > 0 && <span className="text-brand-teal">-{r.discount}%</span>}
        </div>
        {r.phone && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <Phone className="w-3 h-3" />{r.phone}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(r.id)}
        className="p-2 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-brand-dark text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
