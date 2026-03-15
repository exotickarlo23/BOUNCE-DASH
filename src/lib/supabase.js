// Constants
export const DEFAULT_PRICE = 100
export const BOUNCERS = ['minecraft', 'dinosaur', 'unicorn']
export const EXPENSE_CATEGORIES = ['gorivo', 'marketing', 'amortizacija', 'garaža']

export const BOUNCER_DISPLAY = {
  minecraft: 'Minecraft',
  dinosaur: 'Dinosaur',
  unicorn: 'Jednorog',
}

// Map Croatian/alternate names to internal keys
const BOUNCER_ALIASES = {
  minecraft: 'minecraft',
  dinosaur: 'dinosaur',
  dinosaurus: 'dinosaur',
  dino: 'dinosaur',
  unicorn: 'unicorn',
  jednorog: 'unicorn',
}

export function normalizeBouncer(name) {
  if (!name) return 'minecraft'
  const key = name.trim().toLowerCase()
  return BOUNCER_ALIASES[key] || key
}

// Investment - editable, stored in localStorage
export function getInvestment() {
  const stored = localStorage.getItem('hophop_investment')
  return stored ? parseFloat(stored) : 5050
}

export function setInvestment(amount) {
  localStorage.setItem('hophop_investment', String(amount))
}

// LocalStorage-based database
function getStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

function setStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const db = {
  reservations: {
    getAll() {
      return getStore('hophop_reservations')
    },
    add(reservation) {
      const all = this.getAll()
      const item = { ...reservation, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      all.push(item)
      setStore('hophop_reservations', all)
      return item
    },
    update(id, updates) {
      const all = this.getAll().map(r => r.id === id ? { ...r, ...updates } : r)
      setStore('hophop_reservations', all)
    },
    delete(id) {
      const all = this.getAll().filter(r => r.id !== id)
      setStore('hophop_reservations', all)
    },
  },
  expenses: {
    getAll() {
      return getStore('hophop_expenses')
    },
    add(expense) {
      const all = this.getAll()
      const item = { ...expense, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      all.push(item)
      setStore('hophop_expenses', all)
      return item
    },
    delete(id) {
      const all = this.getAll().filter(e => e.id !== id)
      setStore('hophop_expenses', all)
    },
  },
}
