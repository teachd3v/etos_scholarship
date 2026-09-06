import React from 'react'
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
      padding: '20px 14px',
      minWidth: 'clamp(74px, 18vw, 115px)',
      background: 'rgba(30, 41, 59, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: 18,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
    }}>
      <span style={{
        fontSize: 'clamp(32px, 6.5vw, 52px)',
        fontWeight: 800,
        color: '#38bdf8',
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        textShadow: '0 0 24px rgba(56, 189, 248, 0.45)',
      }}>
        {String(value).padStart(2, '0')}
      </span>
      <span style={{
        marginTop: 10,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#94a3b8',
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
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(145deg, #090d16 0%, #0f172a 50%, #032b30 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflowX: 'hidden',
      padding: '40px 16px 80px',
      boxSizing: 'border-box',
    }}>
      
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90vw',
        maxWidth: '800px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(20, 184, 166, 0.28) 0%, rgba(15, 23, 42, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Main Content Container */}
      <div style={{
        maxWidth: 840,
        width: '100%',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>

        {/* Logo Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.96)',
          padding: '10px 24px',
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
          marginBottom: 36,
        }}>
          <img 
            src="/logo-landingpage.png" 
            alt="Logo Etos ID" 
            style={{ height: 'clamp(32px, 5vw, 42px)', width: 'auto', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <div style={{ textAlign: 'left', borderLeft: '2px solid #e2e8f0', paddingLeft: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Etos ID 2026</div>
            <div style={{ fontSize: 10, color: '#0d9488', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
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
              padding: '8px 20px',
              borderRadius: 999,
              background: 'rgba(20, 184, 166, 0.16)',
              border: '1px solid rgba(45, 212, 191, 0.4)',
              color: '#2dd4bf',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
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
              fontSize: 'clamp(26px, 5.5vw, 44px)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.25,
              marginBottom: 16,
              letterSpacing: '-0.02em',
              maxWidth: 720,
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.4)',
            }}>
              {config?.title || 'Pengumuman Kelulusan Seleksi Beasiswa Etos ID 2026'}
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(14px, 2.8vw, 17px)',
              color: '#94a3b8',
              maxWidth: 640,
              lineHeight: 1.6,
              marginBottom: 40,
            }}>
              {config?.subtitle || 'Proses Penetapan Akhir Surat Keputusan (SK) Penerima Beasiswa Sedang Berlangsung.'}
            </p>

            {/* Countdown Timer Block */}
            <div style={{
              display: 'flex',
              gap: 'clamp(10px, 2.5vw, 20px)',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: 48,
              width: '100%',
            }}>
              <CountdownCell value={days} label="Hari" />
              <CountdownCell value={hours} label="Jam" />
              <CountdownCell value={minutes} label="Menit" />
              <CountdownCell value={seconds} label="Detik" />
            </div>

            {/* Info Card */}
            <div style={{
              padding: '26px 28px',
              maxWidth: 660,
              width: '100%',
              textAlign: 'left',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 20,
              backdropFilter: 'blur(16px)',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.3)',
              marginBottom: 24,
              boxSizing: 'border-box',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(45, 212, 191, 0.15)',
                  color: '#2dd4bf',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <IAlert size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
                    Informasi untuk Calon Penerima Beasiswa
                  </div>
                  <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.65, margin: 0 }}>
                    {config?.message || 'Saat ini Tim Seleksi Pusat sedang merampungkan penetapan Surat Keputusan (SK) resmi penerima beasiswa. Halaman ini akan otomatis beralih menampilkan tautan unduh dokumen SK resmi begitu hitung mundur selesai.'}
                  </p>
                  <div style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: 12,
                    color: '#94a3b8',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}>
                    <span>Jadwal Pengumuman Resmi:</span>
                    <strong style={{ color: '#2dd4bf' }}>{formatDateIndo(config?.announcementDate)}</strong>
                  </div>
                </div>
              </div>
            </div>
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
              padding: '8px 22px',
              borderRadius: 999,
              background: 'rgba(34, 197, 94, 0.18)',
              border: '1px solid rgba(74, 222, 128, 0.5)',
              color: '#4ade80',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}>
              <ICheckCircle size={18} />
              Pengumuman Resmi Telah Ditetapkan
            </div>

            {/* Title Released */}
            <h1 style={{
              fontSize: 'clamp(28px, 5.5vw, 44px)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.25,
              marginBottom: 16,
              letterSpacing: '-0.02em',
              maxWidth: 720,
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.4)',
            }}>
              Surat Keputusan Penerima Beasiswa Etos ID 2026
            </h1>

            {/* Subtitle Released */}
            <p style={{
              fontSize: 'clamp(14px, 2.8vw, 17px)',
              color: '#cbd5e1',
              maxWidth: 660,
              lineHeight: 1.6,
              marginBottom: 36,
            }}>
              Selamat kepada seluruh peserta yang dinyatakan lolos seleksi Beasiswa Etos ID 2026. Silakan unduh dokumen Surat Keputusan (SK) resmi di bawah ini untuk melihat daftar nama penerima beasiswa dan instruksi tahapan selanjutnya.
            </p>

            {/* SK Download Card */}
            <div style={{
              padding: '36px 28px',
              maxWidth: 640,
              width: '100%',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(45, 212, 191, 0.35)',
              borderRadius: 24,
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
              marginBottom: 32,
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                background: 'rgba(45, 212, 191, 0.15)',
                color: '#2dd4bf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <IFile size={36} />
              </div>

              <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>
                {config?.skDocumentTitle || 'SK Penetapan Penerima Beasiswa Etos ID 2026.pdf'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 26 }}>
                Dokumen Resmi PDF · Keputusan Tim Seleksi Pusat
              </div>

              {config?.skDocumentUrl ? (
                <a
                  href={config.skDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '16px 28px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: '0 8px 20px rgba(13, 148, 136, 0.35)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <IFile size={22} />
                  Unduh Dokumen SK Resmi (PDF)
                </a>
              ) : (
                <div style={{
                  padding: '14px',
                  borderRadius: 12,
                  background: 'rgba(234, 179, 8, 0.12)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  color: '#fde047',
                  fontSize: 13,
                }}>
                  Tautan dokumen SK sedang dalam proses sinkronisasi server. Mohon tunggu beberapa saat.
                </div>
              )}

              <div style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: 12,
                color: '#94a3b8',
                lineHeight: 1.6,
              }}>
                Bagi calon penerima beasiswa yang namanya tercantum dalam SK, silakan membaca petunjuk verifikasi berkas fisik dan tahapan onboarding yang tertera pada lampiran dokumen.
              </div>
            </div>
          </>
        )}

        {/* Footer & Admin Link */}
        <div style={{
          marginTop: 48,
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
              color: 'rgba(255, 255, 255, 0.45)', 
              textDecoration: 'none', 
              fontSize: 11,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.04)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.color = '#2dd4bf'
              e.currentTarget.style.borderColor = 'rgba(45, 212, 191, 0.4)'
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
            }}
          >
            <ILock size={12} />
            Akses Administrator
          </a>
        </div>

      </div>
    </div>
  )
}
