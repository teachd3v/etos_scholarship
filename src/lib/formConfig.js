// formConfig.js — helper untuk admin baca/tulis tabel form_config di Supabase.
// Audit log otomatis dicatat oleh trigger audit_form_config (lihat 0003_triggers_functions.sql).
import { supabase } from './supabase.js'

/**
 * Upsert satu key di form_config (admin-only via RLS).
 * Mengirim value sebagai JSONB.
 *
 * @param {string} key   — contoh: 'timeline', 'selection_stages'
 * @param {*}      value — apa pun yang JSON-serializable (object/array/null)
 */
export async function saveConfigKey(key, value) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('form_config')
    .upsert(
      {
        key,
        value,             // PostgREST otomatis serialize ke JSONB
        is_active: true,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      },
      { onConflict: 'key' }
    )
  if (error) {
    // Translate beberapa error umum ke bahasa Indonesia
    if (error.code === '42501' || /permission denied|policy/i.test(error.message)) {
      throw new Error('Akses ditolak: hanya admin yang dapat mengubah konfigurasi.')
    }
    throw new Error(error.message || 'Gagal menyimpan konfigurasi.')
  }
}

/** Reload satu / semua config aktif (jarang dipakai langsung — pakai useFormConfig().refresh) */
export async function fetchActiveConfig() {
  const { data, error } = await supabase
    .from('form_config')
    .select('key, value')
    .eq('is_active', true)
  if (error) throw error
  return data
}
