import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Constants
export const INVESTMENT = 5050
export const DEFAULT_PRICE = 100
export const BOUNCERS = ['minecraft', 'dinosaur', 'unicorn']
export const EXPENSE_CATEGORIES = ['gorivo', 'marketing', 'amortizacija', 'garaža']
