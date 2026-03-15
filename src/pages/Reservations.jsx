import { useState, useEffect, useCallback } from 'react'
import { db, BOUNCERS, DEFAULT_PRICE, BOUNCER_DISPLAY, normalizeBouncer } from '../lib/supabase'
import { parseReservationText } from '../lib/parseReservation'
import { Plus, ClipboardPaste, ChevronLeft, ChevronRight, X, Trash2, Phone, MapPin, Pencil } from 'lucide-react'
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

const emptyForm = {
  name: '', email: '', phone: '', bouncer: 'minecraft', date: '', discount: 0, price: DEFAULT_PRICE, address: ''
}

export default function Reservations() {
  const [reservations, setReservations] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showAdd, setShowAdd] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({ ...emptyForm })
  const [pasteText, setPasteText] = useState('')

  const load = useCallback(() => {
    setReservations(db.reservations.getAll().sort((a, b) => a.date.localeCompare(b.date)))
  }, [])

  useEffect(() => { load() }, [load])

  function handleSave() {
    if (!form.name || !form.date || !form.bouncer) return
    const data = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      bouncer: normalizeBouncer(form.bouncer),
      date: form.date,
      discount: parseFloat(form.discount) || 0,
      price: parseFloat(form.price) || DEFAULT_PRICE,
      address: form.address,
    }
    if (editingId) {
      db.reservations.update(editingId, data)
    } else {
      db.reservations.add(data)
    }
    setForm({ ...emptyForm })
    setShowAdd(false)
    setEditingId(null)
    load()
  }

  function handleEdit(r) {
    setForm({
      name: r.name || '',
      email: r.email || '',
      phone: r.phone || '',
      bouncer: r.bouncer || 'minecraft',
      date: r.date || '',
      discount: r.discount || 0,
      price: r.price || DEFAULT_PRICE,
      address: r.address || '',
    })
    setEditingId(r.id)
    setShowAdd(true)
  }

  function handleDelete(id) {
    if (!confirm('Obrisati rezervaciju?')) return
    db.reservations.delete(id)
    load()
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
      address: parsed.address || '',
    })
    setPasteText('')
    setShowPaste(false)
    setEditingId(null)
    setShowAdd(true)
  }

  function closeModal() {
    setShowAdd(false)
    setEditingId(null)
    setForm({ ...emptyForm })
  }

  // Calendar
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
          onClick={() => { setPasteText(''); setShowPaste(true) }}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl text-brand-dark font-medium shadow-sm active:scale-95 transition"
        >
          <ClipboardPaste className="w-4 h-4 text-brand-teal" />
          Zalijepi
        </button>
        <button
          onClick={() => { setForm({ ...emptyForm, date: format(new Date(), 'yyyy-MM-dd') }); setEditingId(null); setShowAdd(true) }}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-orange text-white rounded-xl font-medium shadow-sm active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          Nova ručno
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 active:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="font-semibold text-brand-dark capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: hr })}
          </h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 active:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayRes = getReservationsForDay(day)
            const inMonth = isSameMonth(day, currentMonth)
            const todayFlag = isToday(day)
            const selected = selectedDay && isSameDay(day, selectedDay)

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(selected ? null : day)}
                className={`relative p-1 rounded-lg text-sm min-h-[44px] flex flex-col items-center justify-start transition
                  ${!inMonth ? 'text-gray-300' : 'text-brand-dark'}
                  ${todayFlag ? 'ring-2 ring-brand-teal' : ''}
                  ${selected ? 'bg-brand-teal-light' : 'active:bg-gray-50'}
                `}
              >
                <span className={`text-xs ${todayFlag ? 'font-bold text-brand-teal' : ''}`}>
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

        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
          {BOUNCERS.map(b => (
            <span key={b} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                b === 'minecraft' ? 'bg-green-500' : b === 'dinosaur' ? 'bg-orange-500' : 'bg-purple-500'
              }`} />
              {BOUNCER_DISPLAY[b]}
            </span>
          ))}
        </div>
      </div>

      {/* Selected day */}
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
                <ReservationCard key={r.id} reservation={r} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All reservations */}
      <div className="bg-white rounded-2xl p-4">
        <h3 className="font-semibold text-brand-dark mb-3">
          Sve rezervacije ({reservations.length})
        </h3>
        {reservations.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Nema još rezervacija.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} onDelete={handleDelete} onEdit={handleEdit} />
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
            placeholder={`Zalijepi tekst potvrde ovdje, npr:\n\nIme i prezime: Marko Špoljar\nEmail: marko@gmail.com\nTelefon: 091 339 0426\nNapuhanac: minecraft\nDatum: 2026-04-18\nAdresa: Ilica 25, Zagreb`}
            className="w-full h-40 p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-teal"
            autoFocus
          />
          <button
            onClick={handlePaste}
            disabled={!pasteText.trim()}
            className="w-full mt-3 py-3 bg-brand-teal text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition"
          >
            Parsiraj i popuni
          </button>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <Modal onClose={closeModal} title={editingId ? 'Uredi rezervaciju' : 'Nova rezervacija'}>
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
            <input
              type="text" placeholder="Adresa dostave" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
            <select
              value={form.bouncer}
              onChange={(e) => setForm({ ...form, bouncer: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
            >
              {BOUNCERS.map((b) => (
                <option key={b} value={b}>{BOUNCER_DISPLAY[b]}</option>
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
              disabled={!form.name || !form.date}
              className="w-full py-3 bg-brand-orange text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition"
            >
              {editingId ? 'Spremi promjene' : 'Spremi rezervaciju'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ReservationCard({ reservation: r, onDelete, onEdit }) {
  const bouncer = normalizeBouncer(r.bouncer)
  const colorClass = BOUNCER_COLORS[bouncer] || 'bg-gray-100 text-gray-700 border-gray-300'
  const finalPrice = (r.price || 100) * (1 - (r.discount || 0) / 100)

  return (
    <div className="p-3 rounded-xl bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0" onClick={() => onEdit(r)} role="button">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-brand-dark truncate">{r.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${colorClass}`}>
              {BOUNCER_DISPLAY[bouncer] || r.bouncer}
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
          {r.address && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />{r.address}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => onEdit(r)} className="p-2 text-gray-300 active:text-brand-teal transition">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(r.id)} className="p-2 text-gray-300 active:text-red-500 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
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
          <button onClick={onClose} className="p-1 active:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
