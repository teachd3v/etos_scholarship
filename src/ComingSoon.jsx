// ComingSoon.jsx — landing pre-registrasi dengan countdown ke registration_start.
// Render saat NOW < registration_start. Tombol Login/Daftar disabled.
import React from 'react'
import { AbstractShapes, Button } from './Primitives.jsx'
import { ILogo, ILock } from './Icons.jsx'

function useCountdown(target) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, new Date(target).getTime() - now)
  const days    = Math.floor(diff / 86_400_000)
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return { days, hours, minutes, seconds, isOver: diff === 0 }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) + ' WIB'
  } catch { return iso }
}

function Cell({ value, label }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 12px', minWidth: 80,
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 14,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div style={{
        fontSize: 38, fontWeight: 800, color: '#fff',
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1,
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{
        marginTop: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
      }}>
        {label}
      </div>
    </div>
  )
}

export function ComingSoon({ registrationStart, onContinueLogin, mobile }) {
  const { days, hours, minutes, seconds, isOver } = useCountdown(registrationStart)

  // Auto-reload ketika hitung mundur selesai agar TimelineGate switch ke halaman normal
  React.useEffect(() => {
    if (isOver) window.location.reload()
  }, [isOver])

  return (
    <div className="auth-split" style={{ minHeight: '100vh' }}>
      <div className="auth-hero scene-bg" style={{ flex: 1 }}>
        <AbstractShapes />
        <div className="hero-content" style={{ position: 'relative', zIndex: 2, padding: mobile ? '40px 20px' : '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <img src="/logo-sistem.png" alt="Logo Etos ID" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Etos ID 2026</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Portal Pendaftaran
              </div>
            </div>
          </div>

          <span className="auth-kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ILock size={14} /> Coming Soon
          </span>

          <h1 className="auth-tagline" style={{ marginTop: 14, marginBottom: 16, fontSize: mobile ? 32 : 48 }}>
            Pendaftaran<br />Belum Dibuka.
          </h1>

          <p className="auth-desc" style={{ maxWidth: 540, marginBottom: 36 }}>
            Beasiswa Etos ID 2026 akan dibuka pada <strong style={{ color: '#fff' }}>{formatDate(registrationStart)}</strong>. Pantau halaman ini, hitung mundur akan otomatis mengarahkan kamu ke portal pendaftaran saat dibuka.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: mobile ? 8 : 12,
            maxWidth: 540,
            marginBottom: 36,
          }}>
            <Cell value={days}    label="Hari" />
            <Cell value={hours}   label="Jam" />
            <Cell value={minutes} label="Menit" />
            <Cell value={seconds} label="Detik" />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" disabled title="Pendaftaran belum dibuka">
              Daftar Sekarang
            </Button>
          </div>

          <div style={{ position: 'absolute', bottom: 24, fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.02em' }}>
            ©2026 GREAT Edunesia · Etos ID Scholarship
          </div>
        </div>
      </div>
    </div>
  )
}
