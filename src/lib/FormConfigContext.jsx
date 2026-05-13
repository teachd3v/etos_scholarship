// FormConfigContext.jsx — fetches form_config from Supabase + subscribe realtime.
// Saat admin ubah timeline / selection_stages, semua client otomatis refetch.
// Falls back to DEFAULT_CONFIG silently jika DB unavailable atau env Supabase belum di-set.
import React from 'react'
import { supabase } from './supabase.js'
import { DEFAULT_CONFIG } from './defaultConfig.js'

const FormConfigContext = React.createContext({
  config: DEFAULT_CONFIG,
  loading: true,
  refresh: () => {},
})

// essay_config: hanya min/max yang bisa di-override — label/title/placeholder selalu dari default code.
// Mencegah stale override menampilkan diksi lama.
function mergeEssayConfig(overrideEssays) {
  if (!Array.isArray(overrideEssays) || !Array.isArray(DEFAULT_CONFIG.essay_config)) {
    return DEFAULT_CONFIG.essay_config
  }
  return DEFAULT_CONFIG.essay_config.map(def => {
    const ov = overrideEssays.find(e => e.id === def.id)
    if (!ov) return def
    return { ...def, min: ov.min ?? def.min, max: ov.max ?? def.max }
  })
}

function hasSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  return Boolean(url) && !url.includes('placeholder')
}

// One-time cleanup: hapus key legacy `etos_config_overrides` dari localStorage.
// Sejak admin save sudah pindah ke Supabase, key ini tidak lagi authoritative.
function clearLegacyOverrides() {
  try { localStorage.removeItem('etos_config_overrides') } catch { /* ignore */ }
}

export function FormConfigProvider({ children }) {
  const [config, setConfig]   = React.useState(DEFAULT_CONFIG)
  const [loading, setLoading] = React.useState(true)

  const fetchConfig = React.useCallback(async () => {
    // Bersihkan localStorage legacy override (idempotent — aman dipanggil berkali-kali)
    clearLegacyOverrides()

    // Skip Supabase fetch kalau env belum di-set (mode demo offline)
    if (!hasSupabaseEnv()) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('form_config')
        .select('key, value')
        .eq('is_active', true)
      if (!error && data?.length > 0) {
        const merged = { ...DEFAULT_CONFIG }
        data.forEach(({ key, value }) => { merged[key] = value })
        if (merged.essay_config !== DEFAULT_CONFIG.essay_config) {
          merged.essay_config = mergeEssayConfig(merged.essay_config)
        }
        setConfig(merged)
      }
    } catch { /* DB unavailable — defaults remain */ }
    finally { setLoading(false) }
  }, [])

  // Initial fetch
  React.useEffect(() => { fetchConfig() }, [fetchConfig])

  // Realtime subscription — refetch saat admin ubah form_config (dari user manapun, tab manapun)
  React.useEffect(() => {
    if (!hasSupabaseEnv()) return

    const channel = supabase
      .channel('form_config_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'form_config' },
        () => { fetchConfig() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchConfig])

  return (
    <FormConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </FormConfigContext.Provider>
  )
}

export function useFormConfig() {
  return React.useContext(FormConfigContext)
}
