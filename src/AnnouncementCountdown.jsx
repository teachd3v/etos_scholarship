import React from 'react'
import { getAnnouncementConfig } from './lib/announcementConfig.js'
import { RecipientsExplorer } from './components/RecipientsExplorer.jsx'
import { IFile } from './Icons.jsx'

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
    <div className="timer-block">
      <span className="timer-number">
        {String(value).padStart(2, '0')}
      </span>
      <span className="timer-label">
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

  const isPreview = typeof window !== 'undefined' && window.location.search.includes('preview=true')
  const { days, hours, minutes, seconds, isOver } = useCountdown(config?.announcementDate)
  const isAnnounced = (config?.isPublished === true) || (isOver && !loading) || isPreview

  const skDownloadUrl = config?.skDocumentUrl || '/SK_Pengumuman_Akhir_Seleksi_Etos_ID_2026.pdf'

  return (
    <div className={`portal-viewport ${isAnnounced ? 'is-announced-mode' : 'is-countdown-mode'}`}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        /* ─── COUNTDOWN MODE (FIXED 1-SCREEN) ─── */
        .is-countdown-mode {
          height: 100vh;
          height: 100dvh;
          width: 100vw;
          background: #e9edf3;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          overflow: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .is-countdown-mode .portal-card {
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.03);
          width: 100%;
          max-width: 1040px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* ─── ANNOUNCED MODE (FULL SCROLLABLE EXPLORER) ─── */
        .is-announced-mode {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          background: #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: clamp(20px, 3.5vw, 40px) 16px 80px;
          overflow-y: auto;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .is-announced-mode .portal-card {
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 20px 50px -15px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.03);
          width: 100%;
          max-width: 1100px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .is-announced-mode .explorer-wrapper {
          width: 100%;
          max-width: 1100px;
          box-sizing: border-box;
        }

        /* Timer Blocks */
        .timer-container {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #f1f5f9;
          border-radius: 22px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 20px -6px rgba(15, 23, 42, 0.06);
          border: 1px solid #e2e8f0;
        }
        .timer-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 10px;
          min-width: 68px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 6px 16px -4px rgba(15, 23, 42, 0.05), inset 0 1px 0 #ffffff;
        }
        .timer-number {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .timer-label {
          margin-top: 5px;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #64748b;
        }

        /* Desktop Styles */
        @media (min-width: 769px) {
          .portal-card {
            padding: 36px 48px;
            justify-content: center;
          }
          .is-countdown-mode .portal-card {
            max-height: calc(100vh - 36px);
          }
          .portal-header {
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .portal-header img {
            height: 40px;
            width: auto;
            object-fit: contain;
          }
          .portal-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            align-items: center;
            gap: 36px;
          }
          .portal-text-col {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
          .portal-title {
            font-size: clamp(28px, 3.2vw, 42px);
            font-weight: 800;
            color: #0f172a;
            line-height: 1.15;
            letter-spacing: -0.03em;
            margin: 0 0 18px 0;
          }
          .portal-visual-col {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .portal-image {
            max-height: clamp(200px, 32vh, 300px);
            width: auto;
            max-width: 100%;
            object-fit: contain;
            filter: drop-shadow(0 15px 25px rgba(15, 23, 42, 0.07));
          }
          .portal-note {
            font-size: 12.5px;
            color: #64748b;
            line-height: 1.55;
            margin: 18px 0 0 0;
            max-width: 480px;
          }
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .is-countdown-mode {
            padding: 12px;
          }
          .is-countdown-mode .portal-card {
            padding: 18px 16px;
            height: 100%;
            max-height: calc(100dvh - 24px);
            border-radius: 22px;
            justify-content: space-evenly;
            align-items: center;
            text-align: center;
          }
          .is-announced-mode .portal-card {
            padding: 24px 18px;
            border-radius: 22px;
            text-align: center;
            align-items: center;
          }
          .portal-header {
            margin-bottom: 8px;
            width: 100%;
            display: flex;
            justify-content: center;
          }
          .portal-header img {
            height: 28px;
            width: auto;
            object-fit: contain;
          }
          .portal-grid {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            gap: 12px;
          }
          .is-countdown-mode .portal-visual-col {
            order: 1;
            display: flex;
            justify-content: center;
            margin: 2px 0 6px 0;
          }
          .is-announced-mode .portal-visual-col {
            order: 1;
            display: flex;
            justify-content: center;
            margin-bottom: 8px;
          }
          .portal-image {
            max-height: clamp(80px, 15vh, 130px);
            width: auto;
            max-width: 80%;
            object-fit: contain;
            filter: drop-shadow(0 10px 18px rgba(15, 23, 42, 0.06));
          }
          .portal-text-col {
            order: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: 100%;
          }
          .portal-title {
            font-size: clamp(18px, 4.8vw, 22px);
            font-weight: 800;
            color: #0f172a;
            line-height: 1.22;
            letter-spacing: -0.02em;
            margin: 0 0 10px 0;
          }
          .timer-container {
            gap: 6px;
            padding: 7px 9px;
            border-radius: 16px;
          }
          .timer-block {
            min-width: 50px;
            padding: 7px 5px;
            border-radius: 12px;
          }
          .timer-number {
            font-size: 19px;
          }
          .timer-label {
            font-size: 8px;
            margin-top: 3px;
          }
          .portal-note {
            font-size: 11px;
            color: #64748b;
            line-height: 1.4;
            margin: 10px 0 0 0;
            max-width: 320px;
          }
        }
      `}</style>

      {/* Floating Minimalist 3D Hero Card */}
      <div className="portal-card">
        
        {/* Top Header: Logo */}
        <div className="portal-header">
          <img 
            src="/logo-landingpage.png" 
            alt="Logo Etos ID" 
            onError={(e) => { e.target.style.display = 'none' }}
          />

          {isPreview && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 12px',
              borderRadius: 999,
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Mode Preview Pengumuman
            </span>
          )}
        </div>

        {/* Hero Content Grid */}
        <div className="portal-grid">

          {/* Text Column */}
          <div className="portal-text-col">
            
            {/* Minimalist Bold Heading */}
            <h1 className="portal-title">
              Pengumuman Akhir<br />
              <span style={{ color: '#0d9488' }}>Beasiswa Etos ID 2026</span>
            </h1>

            {!isAnnounced ? (
              /* FASE 1: COUNTDOWN HITUNG MUNDUR */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'inherit' }}>
                <div className="timer-container">
                  <TimerBlock value={days} label="Hari" />
                  <TimerBlock value={hours} label="Jam" />
                  <TimerBlock value={minutes} label="Menit" />
                  <TimerBlock value={seconds} label="Detik" />
                </div>
                
                {/* Keterangan Teks Tambahan */}
                <p className="portal-note">
                  Terima kasih atas partisipasi dan perjuangan seluruh calon pendaftar seleksi Beasiswa Etos ID 2026. Saat ini Tim Seleksi Pusat sedang merampungkan dan mengesahkan dokumen Surat Keputusan (SK) resmi penerima beasiswa.
                </p>
              </div>
            ) : (
              /* FASE 2: STATUS PENGUMUMAN DIBUKA & TOMBOL UNDUH SK */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'inherit' }}>
                <p style={{
                  fontSize: 'clamp(13px, 1.2vw, 15px)',
                  color: '#475569',
                  lineHeight: 1.6,
                  margin: '0 0 20px 0',
                  fontWeight: 500,
                  maxWidth: 540,
                }}>
                  Selamat kepada <strong>32 Calon Penerima Beasiswa Etos ID Angkatan 2026</strong> yang telah dinyatakan lolos seluruh tahapan seleksi nasional sesuai Surat Keputusan Resmi No. 062/YPUU/SK/IX/2026.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                  <a
                    href={skDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    <button
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '14px 28px',
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                        color: '#ffffff',
                        fontSize: 'clamp(13.5px, 1.1vw, 15px)',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 14px 28px -6px rgba(13, 148, 136, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 18px 36px -6px rgba(13, 148, 136, 0.55)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 14px 28px -6px rgba(13, 148, 136, 0.45)'
                      }}
                    >
                      <IFile size={16} />
                      <span>Unduh Dokumen SK Resmi (PDF)</span>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>↓</span>
                    </button>
                  </a>
                </div>
              </div>
            )}

          </div>

          {/* 3D Visual */}
          <div className="portal-visual-col">
            <img 
              src="/graduation_3d.png" 
              alt="3D Graduation Cap & Diploma" 
              className="portal-image"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>

        </div>

      </div>

      {/* FASE 2 EXTENSION: INTERACTIVE RECIPIENTS EXPLORER */}
      {isAnnounced && (
        <div className="explorer-wrapper">
          <RecipientsExplorer />
        </div>
      )}

    </div>
  )
}
