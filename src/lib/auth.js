// auth.js — helper untuk Supabase Auth (email/password + Google OAuth)
// Tujuan: API yang konsisten + error message bahasa Indonesia + handle profile lookup.
import { supabase } from './supabase.js'

const TRANSLATIONS = {
  'Invalid login credentials':                'Email atau password salah.',
  'Email not confirmed':                       'Email belum terverifikasi. Cek inbox kamu.',
  'User already registered':                   'Email ini sudah terdaftar. Silakan login.',
  'Password should be at least 6 characters':  'Password minimal 6 karakter.',
  'Unable to validate email address: invalid format': 'Format email tidak valid.',
  'Signup requires a valid password':          'Password wajib diisi.',
  'For security purposes, you can only request this after': 'Terlalu banyak percobaan. Coba lagi sebentar.',
  'Pendaftaran akun baru sudah ditutup':       'Pendaftaran akun baru sudah ditutup. Silakan login dengan akun yang sudah terdaftar.',
}

function translateError(err) {
  if (!err) return ''
  const msg = err.message || String(err)
  for (const key of Object.keys(TRANSLATIONS)) {
    if (msg.includes(key)) return TRANSLATIONS[key]
  }
  return msg
}

/**
 * Validasi format email secara dasar.
 * Berguna untuk mencegah typo sebelum dikirim ke Supabase.
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email.trim().toLowerCase())
}

/**
 * Register akun baru dengan email + password.
 * Setelah signUp, Supabase otomatis kirim email konfirmasi.
 * User belum bisa login sampai email di-confirm.
 */
export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: fullName?.trim() || null },
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw new Error(translateError(error))
  return data
}

/** Login dengan email + password */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw new Error(translateError(error))
  return data
}

/** Login via Google OAuth (redirect flow) */
export async function signInWithGoogle(redirectTo = null) {
  const target = redirectTo || window.location.href
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: target,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error) throw new Error(translateError(error))
  return data
}

/** Logout dari Supabase + clear local session */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(translateError(error))
}

/** Get current session (null kalau belum login) */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Ambil profile lengkap user dari tabel profiles.
 * Return null kalau user belum login atau profile belum ter-create.
 */
export async function getProfile() {
  const session = await getSession()
  if (!session) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, email_verified')
    .eq('id', session.user.id)
    .single()
  if (error) {
    // PGRST116 = no rows; itu artinya trigger handle_new_user belum jalan (race condition)
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

/**
 * Subscribe ke perubahan auth state.
 * Callback dipanggil dengan { event, session } setiap kali login/logout/refresh.
 * Return unsubscribe function.
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback({ event, session })
  })
  return () => subscription.unsubscribe()
}

/** Trigger resend email konfirmasi */
export async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  })
  if (error) throw new Error(translateError(error))
}

/** Trigger forgot password email */
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: window.location.origin + '?reset=1' }
  )
  if (error) throw new Error(translateError(error))
}
