import React from 'react'
import { GlassCard, Button } from './Primitives.jsx'
import { ILogo, IFile, ICheckCircle, IAlert, ILock } from './Icons.jsx'
import { getAnnouncementConfig } from './lib/announcementConfig.js'

function useCountdown(targetIso) {
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const targetTime = targetIso ? new Date(targetIso).getTime() : 0
  const diff = Math.max(0, targetTime - now)

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, isOver: diff === 0 && targetTime > 0 }
}

function formatDateIndo(isoStr) {
  if (!isoStr) return '-'
  try {
    const date = new Date(isoStr)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }) + ' WIB'
  } catch {
    return isoStr
  }
}

function CountdownCell({ value, label }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 14px',
      minWidth: 74,
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.16)',
      borderRadius: 16,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    }}>
      <span style={{
        fontSize: 'clamp(28px, 6vw, 44px)',
        fontWeight: 800,
        color: '#ffffff',
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {String(value).padStart(2, '0')}
      </span>
      <span style={{
        marginTop: 8,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(255, 255, 255, 0.7)',
      }}>
        {label}
      </span>
    </div>
  )
}

export function AnnouncementCountdown() {
  const [config, setConfig] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    getAnnouncementConfig().then((cfg) => {
      if (active) {
        setConfig(cfg)
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [])

  const { days, hours, minutes, seconds, isOver } = useCountdown(config?.announcementDate)

  // Pengumuman dibuka jika countdown sudah habis ATAU jika admin mengaktifkan isPublished
  const isAnnounced = (config?.isPublished === true) || (isOver && !loading)

  return (
    <div className="auth-split" style={{ minHeight: '100vh', background: 'var(--ink-950, #0a0f1d)' }}>
      {/* Background Hero */}
      <div className="auth-hero scene-bg" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
        
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, rgba(15, 23, 42, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Content Container */}
        <div style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '48px 24px 80px',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>

          {/* Logo & Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <img 
              src="/logo-landingpage.png" 
              alt="Logo Etos ID" 
              style={{ height: 48, width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Etos ID 2026</div>
              <div style={{ fontSize: 11, color: 'var(--tosca-400, #2dd4bf)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Portal Pengumuman Kelulusan
              </div>
            </div>
          </div>

          {!isAnnounced ? (
            /* ══════════════════════════════════════════════════════════════
               FASE 1: COUNTDOWN HITUNG MUNDUR
               ══════════════════════════════════════════════════════════════ */
            <>
              {/* Kicker Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 999,
                background: 'rgba(20, 184, 166, 0.15)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                color: 'var(--tosca-300, #5eead4)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#2dd4bf',
                  boxShadow: '0 0 10px #2dd4bf',
                }} />
                Menuju Pengumuman Resmi
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: 'clamp(26px, 5vw, 44px)',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.25,
                marginBottom: 16,
                letterSpacing: '-0.02em',
                maxWidth: 720,
              }}>
                {config?.title || 'Pengumuman Kelulusan Seleksi Beasiswa Etos ID 2026'}
              </h1>

              {/* Subtitle */}
              <p style={{
                fontSize: 'clamp(14px, 2.5vw, 17px)',
                color: 'rgba(255, 255, 255, 0.75)',
                maxWidth: 620,
                lineHeight: 1.6,
                marginBottom: 40,
              }}>
                {config?.subtitle || 'Proses Penetapan Akhir Surat Keputusan (SK) Penerima Beasiswa Sedang Berlangsung.'}
              </p>

              {/* Countdown Timer Block */}
              <div style={{
                display: 'flex',
                gap: 'clamp(8px, 2vw, 16px)',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 48,
              }}>
                <CountdownCell value={days} label="Hari" />
                <CountdownCell value={hours} label="Jam" />
                <CountdownCell value={minutes} label="Menit" />
                <CountdownCell value={seconds} label="Detik" />
              </div>

              {/* Info Card */}
              <GlassCard style={{
                padding: '24px 28px',
                maxWidth: 640,
                width: '100%',
                textAlign: 'left',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 18,
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(45, 212, 191, 0.12)',
                    color: '#2dd4bf',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    <IAlert size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                      Informasi untuk Calon Penerima Beasiswa
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, margin: 0 }}>
                      {config?.message || 'Saat ini Tim Seleksi Pusat sedang menyelesaikan penetapan Surat Keputusan (SK) resmi. Halaman ini akan otomatis menampilkan tautan unduh dokumen SK resmi begitu waktu hitung mundur selesai.'}
                    </p>
                    <div style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}>
                      <span>Waktu Pengumuman:</span>
                      <strong style={{ color: '#2dd4bf' }}>{formatDateIndo(config?.announcementDate)}</strong>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               FASE 2: PENGUMUMAN DIBUKA / TAHAP SURAT KEPUTUSAN (TIPE 1)
               ══════════════════════════════════════════════════════════════ */
            <>
              {/* Kicker Badge Released */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 18px',
                borderRadius: 999,
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(74, 222, 128, 0.4)',
                color: '#4ade80',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 20,
                animation: 'pulse 2s infinite',
              }}>
                <ICheckCircle size={16} />
                Pengumuman Resmi Telah Ditetapkan
              </div>

              {/* Title Released */}
              <h1 style={{
                fontSize: 'clamp(28px, 5vw, 44px)',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.25,
                marginBottom: 16,
                letterSpacing: '-0.02em',
                maxWidth: 720,
              }}>
                Surat Keputusan Penerima Beasiswa Etos ID 2026
              </h1>

              {/* Subtitle Released */}
              <p style={{
                fontSize: 'clamp(14px, 2.5vw, 17px)',
                color: 'rgba(255, 255, 255, 0.85)',
                maxWidth: 640,
                lineHeight: 1.6,
                marginBottom: 36,
              }}>
                Selamat kepada seluruh peserta yang dinyatakan lolos seleksi Beasiswa Etos ID 2026. Silakan unduh dokumen Surat Keputusan (SK) resmi di bawah ini untuk melihat daftar nama penerima beasiswa dan instruksi tahapan selanjutnya.
              </p>

              {/* SK Download Card */}
              <GlassCard style={{
                padding: '32px 28px',
                maxWidth: 640,
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(45, 212, 191, 0.25)',
                borderRadius: 20,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                marginBottom: 32,
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: 'rgba(45, 212, 191, 0.15)',
                  color: '#2dd4bf',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                }}>
                  <IFile size={32} />
                </div>

                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                  {config?.skDocumentTitle || 'SK Kelulusan Penerima Beasiswa Etos ID 2026'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 24 }}>
                  Dokumen Resmi PDF · Keputusan Tim Seleksi Pusat
                </div>

                {config?.skDocumentUrl ? (
                  <a
                    href={config.skDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="primary" size="lg" block style={{ fontSize: 16, padding: '14px 28px', fontWeight: 700 }}>
                      <IFile size={20} style={{ marginRight: 10 }} />
                      Unduh Dokumen SK Resmi (PDF)
                    </Button>
                  </a>
                ) : (
                  <div style={{
                    padding: '14px',
                    borderRadius: 10,
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    color: '#fde047',
                    fontSize: 13,
                  }}>
                    Tautan dokumen SK sedang dalam proses sinkronisasi server. Mohon tunggu beberapa saat.
                  </div>
                )}

                <div style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.5)',
                  lineHeight: 1.6,
                }}>
                  Bagi calon penerima beasiswa yang namanya tercantum dalam SK, silakan membaca petunjuk verifikasi berkas fisik dan tahapan onboarding yang tertera pada lampiran dokumen.
                </div>
              </GlassCard>
            </>
          )}

          {/* Footer & Admin Link */}
          <div style={{
            marginTop: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            <div>©2026 GREAT Edunesia · Etos ID Scholarship Portal</div>
            <a 
              href="/admin" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.3)', 
                textDecoration: 'none', 
                fontSize: 11,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)' }}
            >
              <ILock size={12} />
              Akses Administrator
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
