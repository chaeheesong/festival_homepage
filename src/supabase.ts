import { createClient } from '@supabase/supabase-js'

const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Keeps only the origin, so a pasted ".../rest/v1/" endpoint still works */
function projectUrl(raw: string | undefined) {
  if (!raw) return undefined
  try {
    return new URL(raw.trim()).origin
  } catch {
    return undefined
  }
}

const url = projectUrl(import.meta.env.VITE_SUPABASE_URL)

/** null until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set (see .env.example) */
export const supabase = url && anonKey ? createClient(url, anonKey) : null

if (!supabase) console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set; applications cannot be submitted.')
