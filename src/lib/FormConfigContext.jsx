// FormConfigContext.jsx — fetches form_config from Supabase and provides it app-wide.
// Falls back to DEFAULT_CONFIG silently if DB is unavailable.
import React from 'react'
import { supabase } from './supabase.js'
import { DEFAULT_CONFIG } from './defaultConfig.js'

const FormConfigContext = React.createContext({
  config: DEFAULT_CONFIG,
  loading: true,
  refresh: () => {},
})

export function FormConfigProvider({ children }) {
  const [config, setConfig] = React.useState(DEFAULT_CONFIG)
  const [loading, setLoading] = React.useState(true)

  // essay_config: only min/max can be overridden — label/title/placeholder always from default code.
  // This prevents stale localStorage overrides from showing outdated diksi.
  const mergeEssayConfig = (overrideEssays) => {
    if (!Array.isArray(overrideEssays) || !Array.isArray(DEFAULT_CONFIG.essay_config)) return DEFAULT_CONFIG.essay_config
    return DEFAULT_CONFIG.essay_config.map(def => {
      const ov = overrideEssays.find(e => e.id === def.id)
      if (!ov) return def
      return { ...def, min: ov.min ?? def.min, max: ov.max ?? def.max }
    })
  }

  const fetchConfig = React.useCallback(async () => {
    // 1. Cek localStorage overrides dulu (dari panel Konfigurasi Admin)
    try {
      const overrides = JSON.parse(localStorage.getItem('etos_config_overrides') || '{}')
      if (Object.keys(overrides).length > 0) {
        const merged = { ...DEFAULT_CONFIG, ...overrides }
        if (overrides.essay_config) merged.essay_config = mergeEssayConfig(overrides.essay_config)
        setConfig(merged)
        setLoading(false)
        return
      }
    } catch {}

    // 2. Cek Supabase (skip jika URL placeholder)
    const url = import.meta.env.VITE_SUPABASE_URL || ''
    if (!url || url.includes('placeholder')) {
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
    } catch {
      // DB unavailable — defaults remain active
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchConfig() }, [fetchConfig])

  return (
    <FormConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </FormConfigContext.Provider>
  )
}

export function useFormConfig() {
  return React.useContext(FormConfigContext)
}
