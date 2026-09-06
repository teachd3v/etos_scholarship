// announcementConfig.js — Client untuk manajemen Pengumuman Kelulusan & Cloudflare D1
// Mendukung Cloudflare Worker API dengan automatic local fallback (anti-downtime).

export const DEFAULT_ANNOUNCEMENT_CONFIG = {
  announcementDate: '2026-09-15T10:00:00+07:00', // Default: 15 September 2026 10:00 WIB
  title: 'Pengumuman Kelulusan Seleksi Beasiswa Etos ID 2026',
  subtitle: 'Proses Penetapan Akhir Surat Keputusan (SK) Penerima Beasiswa Sedang Berlangsung',
  message: 'Terima kasih atas partisipasi dan perjuangan seluruh calon peserta seleksi Beasiswa Etos ID 2026. Saat ini Tim Seleksi Pusat sedang merampungkan dan mengesahkan dokumen Surat Keputusan (SK) resmi penerima beasiswa.',
  skDocumentUrl: 'https://drive.google.com', // Link PDF SK
  skDocumentTitle: 'SK_Kelulusan_Penerima_Beasiswa_Etos_ID_2026.pdf',
  isPublished: false, // true = paksa buka sekarang tanpa menunggu countdown
  updatedAt: new Date().toISOString(),
}

// URL Cloudflare Worker API (bisa diset via VITE_CF_API_URL di .env atau Vercel Environment Variables)
const CF_API_BASE = import.meta.env.VITE_CF_API_URL || ''

const LOCAL_STORAGE_KEY = 'etos_announcement_config'
const AUTH_STORAGE_KEY = 'etos_admin_token'

/**
 * Mengambil konfigurasi pengumuman dari Cloudflare D1 (dengan fallback lokal).
 */
export async function getAnnouncementConfig() {
  // 1. Coba fetch dari Cloudflare Worker jika URL tersedia
  if (CF_API_BASE) {
    try {
      const res = await fetch(`${CF_API_BASE}/api/announcement`, {
        headers: { 'Accept': 'application/json' },
      })
      if (res.ok) {
        const json = await res.json()
        if (json && json.data) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data))
          return json.data
        }
      }
    } catch (err) {
      console.warn('Gagal koneksi ke Cloudflare API, menggunakan cache lokal:', err)
    }
  }

  // 2. Fallback: baca dari localStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (cached) {
      return { ...DEFAULT_ANNOUNCEMENT_CONFIG, ...JSON.parse(cached) }
    }
  } catch {
    /* ignore */
  }

  // 3. Fallback default
  return DEFAULT_ANNOUNCEMENT_CONFIG
}

/**
 * Menyimpan konfigurasi pengumuman ke Cloudflare D1 & cache lokal.
 */
export async function saveAnnouncementConfig(newConfig, token = null) {
  const authToken = token || getAdminToken()
  const payload = { ...newConfig, updatedAt: new Date().toISOString() }

  // Simpan ke local cache terlebih dahulu agar instan
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))

  // Kirim ke Cloudflare Worker jika tersedia
  if (CF_API_BASE) {
    try {
      const res = await fetch(`${CF_API_BASE}/api/admin/announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP error ${res.status}`)
      }
      const data = await res.json()
      return data
    } catch (err) {
      console.warn('Gagal sync ke Cloudflare Worker, tersimpan di lokal:', err)
      return { success: true, localOnly: true, data: payload }
    }
  }

  return { success: true, localOnly: true, data: payload }
}

/**
 * Login admin (Username: Admin, Password: etospusat)
 */
export async function loginAdmin({ username, password }) {
  const cleanUser = (username || '').trim()
  const cleanPass = (password || '').trim()

  // 1. Coba login via Cloudflare Worker jika tersedia
  if (CF_API_BASE) {
    try {
      const res = await fetch(`${CF_API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.token) {
          localStorage.setItem(AUTH_STORAGE_KEY, json.token)
          return { success: true, token: json.token }
        }
      }
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Username atau password salah.')
    } catch (err) {
      // Jika server network error tapi kredensial cocok dengan master credentials, izinkan offline login
      if (cleanUser.toLowerCase() === 'admin' && cleanPass === 'etospusat') {
        const mockToken = 'mock_admin_token_' + Date.now()
        localStorage.setItem(AUTH_STORAGE_KEY, mockToken)
        return { success: true, token: mockToken }
      }
      throw err
    }
  }

  // 2. Offline / Direct credentials check
  if (cleanUser.toLowerCase() === 'admin' && cleanPass === 'etospusat') {
    const mockToken = 'offline_admin_token_' + Date.now()
    localStorage.setItem(AUTH_STORAGE_KEY, mockToken)
    return { success: true, token: mockToken }
  }

  throw new Error('Username atau password salah.')
}

export function getAdminToken() {
  return localStorage.getItem(AUTH_STORAGE_KEY)
}

export function logoutAdmin() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function isUserAdminLoggedIn() {
  return Boolean(getAdminToken())
}
