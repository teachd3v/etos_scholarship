// TimelineGate.jsx — wrapper yang memilih halaman publik berdasarkan periode.
//
// Logika:
//   NOW < registration_start  → <ComingSoon> (countdown), tidak ada akses login/register
//   start <= NOW <= end       → render children (Auth/Register/Dashboard normal)
//   NOW > registration_end    → <RegistrationClosed> kecuali user sudah login
//                               (user existing tetap bisa lihat dashboard status)
//
// Admin gate (route /admin) bypass TimelineGate karena dipasang sebelum gate
// di App.jsx — agar admin tetap bisa akses panel kapan saja untuk ubah konfigurasi.
import React from 'react'
import { useFormConfig } from './lib/FormConfigContext.jsx'
import { ComingSoon } from './ComingSoon.jsx'
import { RegistrationClosed } from './RegistrationClosed.jsx'

export function getCurrentPhase(timeline, now = new Date()) {
  if (!timeline) return 'REGISTRATION'  // fail-open kalau config belum load
  const start = timeline.registration_start ? new Date(timeline.registration_start) : null
  const end   = timeline.registration_end   ? new Date(timeline.registration_end)   : null
  if (start && now < start) return 'PRE_REGISTRATION'
  if (end   && now > end)   return 'POST_REGISTRATION'
  return 'REGISTRATION'
}

export function TimelineGate({ session, mobile, children }) {
  const { config, loading } = useFormConfig()
  const [phase, setPhase] = React.useState(() => getCurrentPhase(config.timeline))
  const [proceedToLogin, setProceedToLogin] = React.useState(false)

  // Re-evaluate phase tiap 30 detik supaya transisi REGISTRATION→POST_REGISTRATION
  // ter-detect tanpa reload (untuk user yang lagi buka tab).
  React.useEffect(() => {
    const id = setInterval(() => setPhase(getCurrentPhase(config.timeline)), 30_000)
    setPhase(getCurrentPhase(config.timeline))
    return () => clearInterval(id)
  }, [config.timeline])

  // Loading config → tampilkan loading inline (children sendiri yang handle skeleton)
  if (loading) return children

  // Pre-registration: tampilkan ComingSoon kecuali (a) user sudah login (bypass),
  // (b) user klik tombol "Sudah Punya Akun? Login" → render Auth screen.
  // Admin route sendiri di-bypass di App.jsx sebelum gate ini di-mount.
  if (phase === 'PRE_REGISTRATION' && !session && !proceedToLogin) {
    return (
      <ComingSoon
        registrationStart={config.timeline.registration_start}
        onContinueLogin={() => setProceedToLogin(true)}
        mobile={mobile}
      />
    )
  }

  // Post-registration: user yang sudah login boleh lanjut (lihat status seleksi).
  // Anon visitor → blokir create akun baru, kasih CTA "Sudah Punya Akun? Login".
  if (phase === 'POST_REGISTRATION' && !session && !proceedToLogin) {
    return (
      <RegistrationClosed
        registrationEnd={config.timeline.registration_end}
        onContinueLogin={() => setProceedToLogin(true)}
        mobile={mobile}
      />
    )
  }

  return children
}
