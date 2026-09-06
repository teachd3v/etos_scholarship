import React from 'react'
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

function TimerBlock({ value, label }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 14px',
      minWidth: 'clamp(64px, 14vw, 84px)',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.05), inset 0 1px 0 #ffffff',
    }}>
      <span style={{
        fontSize: 'clamp(26px, 5vw, 36px)',
        fontWeight: 800,
        color: '#0f172a',
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {String(value).padStart(2, '0')}
      </span>
      <span style={{
        marginTop: 6,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#64748b',
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
  const isAnnounced = (config?.isPublished === true) || (isOver && !loading)

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#e9edf3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(16px, 3.5vw, 48px)',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Floating Minimalist 3D Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'clamp(24px, 4vw, 36px)',
        maxWidth: 1080,
        width: '100%',
        boxShadow: '0 30px 80px -20px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.02)',
        padding: 'clamp(28px, 5vw, 64px)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}>
        
        {/* Top Header: Logo only */}
        <div style={{ marginBottom: 'clamp(20px, 4vw, 44px)' }}>
          <img 
            src="/logo-landingpage.png" 
            alt="Logo Etos ID" 
            style={{ 
              height: 'clamp(36px, 5vw, 48px)', 
              width: 'auto', 
              objectFit: 'contain' 
            }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>

        {/* 2-Column Hero Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center',
          gap: 'clamp(24px, 4vw, 60px)',
        }}>

          {/* Left Column: Heading & Countdown / CTA */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Minimalist Bold Heading */}
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: '0 0 28px 0',
            }}>
              Pengumuman Kelulusan<br />
              <span style={{ color: '#0d9488' }}>Beasiswa Etos ID 2026</span>
            </h1>

            {!isAnnounced ? (
              /* FASE 1: COUNTDOWN HITUNG MUNDUR (MINIMALIST SOFT-3D) */
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 12px)',
                  padding: '12px 14px',
                  background: '#f1f5f9',
                  borderRadius: '26px',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04), 0 10px 24px -6px rgba(15, 23, 42, 0.06)',
                  border: '1px solid #e2e8f0',
                }}>
                  <TimerBlock value={days} label="Hari" />
                  <TimerBlock value={hours} label="Jam" />
                  <TimerBlock value={minutes} label="Menit" />
                  <TimerBlock value={seconds} label="Detik" />
                </div>
              </div>
            ) : (
              /* FASE 2: TOMBOL UNDUH SK RESMI (MINIMALIST 3D PILL BUTTON) */
              <div>
                <p style={{
                  fontSize: 15,
                  color: '#475569',
                  lineHeight: 1.6,
                  margin: '0 0 24px 0',
                  fontWeight: 500,
                }}>
                  Surat Keputusan (SK) resmi penetapan penerima beasiswa telah resmi diterbitkan oleh Tim Seleksi Pusat.
                </p>

                {config?.skDocumentUrl ? (
                  <a
                    href={config.skDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    <button
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '16px 36px',
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                        color: '#ffffff',
                        fontSize: 16,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 16px 32px -8px rgba(13, 148, 136, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 20px 40px -8px rgba(13, 148, 136, 0.55)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(13, 148, 136, 0.45)'
                      }}
                    >
                      <span>Unduh Dokumen SK Resmi (PDF)</span>
                      <span style={{ fontSize: 18, fontWeight: 800 }}>→</span>
                    </button>
                  </a>
                ) : (
                  <div style={{
                    display: 'inline-block',
                    padding: '12px 20px',
                    borderRadius: 16,
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    Dokumen SK sedang dipersiapkan. Mohon tunggu beberapa saat.
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: 3D Render Visual */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <img 
              src="/graduation_3d.jpg" 
              alt="3D Graduation Cap & Diploma" 
              style={{
                width: '100%',
                maxWidth: 460,
                height: 'auto',
                objectFit: 'contain',
                mixBlendMode: 'multiply',
                filter: 'contrast(1.03)',
                transform: 'scale(1.05)',
              }}
              onError={(e) => {
                // Fallback jika gambar belum ter-load
                e.target.style.display = 'none'
              }}
            />
          </div>

        </div>

      </div>
    </div>
  )
}
