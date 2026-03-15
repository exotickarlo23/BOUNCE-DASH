// Constants
export const INVESTMENT = 5050
export const DEFAULT_PRICE = 100
export const BOUNCERS = ['minecraft', 'dinosaur', 'unicorn']
export const EXPENSE_CATEGORIES = ['gorivo', 'marketing', 'amortizacija', 'garaža']

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
