// Dashboard.jsx — Status + progress + CTA
import React from 'react'
import { completionPercent, completedSteps } from './FormState.jsx'
import { ISave, IArrowRight, ICheck, ITrophy, IHeart, IAlert } from './Icons.jsx'
import { GlassCard, Button, STEP_LABELS } from './Primitives.jsx'

const MOTIVASI = [
  "Satu langkah hari ini,\nseribu peluang esok hari.",
  "Keterbatasan bukan penghalang—\nitu adalah bahan bakarmu.",
  "Dari pelosok negeri,\nmenjangkau puncak impian.",
  "Pendidikan terbaik dimulai\ndari keberanian yang nyata.",
  "Generasi tangguh lahir\ndari tekad yang tak pernah padam.",
  "Investasi terbaik adalah\nmengembangkan dirimu sendiri.",
]

function RotatingQuote() {
  const [idx, setIdx]   = React.useState(0)
  const [show, setShow] = React.useState(true)

  React.useEffect(() => {
    const iv = setInterval(() => {
      setShow(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % MOTIVASI.length)
        setShow(true)
      }, 420)
    }, 3200)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'linear-gradient(to top, rgba(4,28,26,0.94) 0%, rgba(4,28,26,0.28) 52%, transparent 100%)',
      padding: '0 22px 20px',
    }}>
      <div style={{
        transition: 'opacity 0.42s ease, transform 0.42s ease',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(10px)',
      }}>
        {/* Label */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5EEAD4', marginBottom: 8 }}>
          ✦ &nbsp;Inspirasi
        </div>
        {/* Quote text */}
        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.92)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
          {MOTIVASI[idx]}
        </div>
        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 5, marginTop: 14, alignItems: 'center' }}>
          {MOTIVASI.map((_, i) => (
            <div key={i} style={{
              height: 3, borderRadius: 2,
              width: i === idx ? 18 : 4,
              background: i === idx ? '#5EEAD4' : 'rgba(255,255,255,0.25)',
              transition: 'width 0.35s ease, background 0.35s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function Dashboard({ form, onContinue, onJumpStep, mobile, currentPeriod, cfg = {} }) {
  const pct = completionPercent(form)
  const completed = completedSteps(form)
  const nextStep = [1, 2, 3, 4, 5, 6].find((s) => !completed.includes(s)) || 1

  const isSubmitted = !!form.is_submitted

  // LOGIKA PERIOD
  const isRegistration = currentPeriod === 'REGISTRATION'
  const isVerification = currentPeriod === 'VERIFICATION'
  const isAnnouncement = currentPeriod === 'ANNOUNCEMENT'

  return (
    <div className="dash-wrap">
      {!isSubmitted && isRegistration && (
        <div style={{ 
          background: 'linear-gradient(90deg, #ef4444 0%, #f43f5e 100%)', 
          color: 'white', 
          padding: '12px 20px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '24px' }}>🚨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.02em' }}>PERHATIAN: H-2 PENUTUPAN!</div>
            <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 500 }}>
              Pendaftaran akan ditutup pada <strong>10 Juni 2026</strong>. Segera lengkapi data dan klik tombol <strong>Submit</strong> di halaman Review!
            </div>
          </div>
        </div>
      )}
      <GlassCard className="dash-hero-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {form.photoFile?.url && (
              <img src={form.photoFile.url} alt="Avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }} />
            )}
            <div>
              <div className="dash-welcome">Halo,</div>
              <h1>{form.nickname || (form.fullName ? form.fullName.split(' ')[0] : 'Calon Pendaftar')} 👋</h1>
            </div>
          </div>
          <p style={{ color: 'var(--ink-600)', marginTop: 8, maxWidth: 500, lineHeight: 1.5 }}>
            {(isAnnouncement || (isSubmitted && form.status && form.status !== 'submitted'))
              ? (form.status === 'approved'
                ? 'Selamat! Anda lolos seleksi Beasiswa Etos ID 2026.'
                : (form.status === 'rejected'
                  ? 'Terima kasih atas partisipasi Anda. Mohon maaf, Anda belum dapat melanjutkan ke tahap berikutnya.'
                  : 'Hasil seleksi akan segera diumumkan di halaman ini.'))
              : isVerification
                ? 'Pendaftaran telah ditutup. Data Anda saat ini sedang dalam proses verifikasi oleh panitia.'
                : isSubmitted
                  ? 'Data Anda telah tersimpan. Selama masa pendaftaran (s/d 31 Mei), Anda masih dapat mengubah data Anda jika diperlukan.'
                  : 'Lengkapi seluruh tahapan pendaftaran sebelum 31 Mei 2026 untuk mengikuti seleksi Beasiswa Etos ID 2026.'}
          </p>

          <div className="dash-meta" style={{ marginTop: 24 }}>
            {!isSubmitted ? (
              <span className="pill pill-amber pill-dot">Status: Belum Terkirim</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: '100%' }}>
                {(isAnnouncement || form.status === 'approved') && form.status === 'approved' && (
                  <GlassCard style={{
                    flex: '1 1 100%', padding: '20px 24px',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.15) 100%)',
                    border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16,
                    display: 'flex', alignItems: 'center', gap: 18
                  }}>
                    <div style={{ padding: 12, background: 'var(--tosca-600)', color: 'white', borderRadius: 14, boxShadow: '0 4px 12px rgba(15,118,110,0.3)' }}>
                      <ITrophy size={28} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tosca-800)', marginBottom: 2 }}>ANDA LOLOS!</div>
                      <div style={{ fontSize: 13, color: 'var(--tosca-700)' }}>Segera cek email untuk info lebih lanjut.</div>
                    </div>
                  </GlassCard>
                )}

                {(isAnnouncement || form.status === 'rejected') && form.status === 'rejected' && (
                  <GlassCard style={{
                    flex: '1 1 100%', padding: '20px 24px',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(225,29,72,0.08) 100%)',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16,
                    display: 'flex', alignItems: 'center', gap: 18
                  }}>
                    <div style={{ padding: 12, background: 'var(--danger-500)', color: 'white', borderRadius: 14 }}>
                      <IHeart size={28} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--danger-700)', marginBottom: 2 }}>Tetap Semangat!</div>
                      <div style={{ fontSize: 13, color: 'var(--danger-600)' }}>Pilihan ini bukan akhir tantangan. Teruslah berkarya di tempat lain.</div>
                    </div>
                  </GlassCard>
                )}

                {(isRegistration || isVerification || !form.status || form.status === 'submitted') && (!form.status || form.status === 'submitted') && (
                  <div style={{ padding: '12px 18px', background: isVerification ? 'rgba(13,148,136,0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${isVerification ? 'rgba(13,148,136,0.2)' : 'rgba(16, 185, 129, 0.2)'}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isVerification ? 'var(--tosca-500)' : 'var(--ok-500)', animation: isVerification ? 'none' : 'pulse 2s infinite' }}></div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isVerification ? 'var(--tosca-700)' : 'var(--ok-700)' }}>
                      {isVerification ? 'Status: Data Sedang Diverifikasi' : 'Status: Pendaftaran Telah Terkirim'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(form.status === 'approved' || form.status === 'rejected') ? (
              /* Status final — form terkunci, hanya bisa lihat */
              <Button variant="outline-tosca" size="lg" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                {form.status === 'approved' ? '🎉 Pendaftaran Selesai' : '🔒 Pendaftaran Ditutup'}
              </Button>
            ) : isRegistration ? (
              <>
                <Button variant="primary" size="lg" onClick={() => onContinue && onContinue(isSubmitted ? 1 : nextStep)}>
                  {isSubmitted ? 'Ubah Data Pendaftar' : (pct > 0 ? `Lanjut Isikan (Step ${nextStep})` : 'Mari Mulai Daftar')} <IArrowRight size={16} />
                </Button>
              </>
            ) : (
              <Button variant="outline-tosca" size="lg" onClick={() => onContinue && onContinue(1)}>
                Review Data Pendaftar <IArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
        {!mobile && (
          <div className="dash-art" style={{ position: 'relative' }}>
            <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
              <defs>
                <linearGradient id="dHeroBase" x1="0" y1="0" x2="0.5" y2="1">
                  <stop offset="0" stopColor="#0C5E59" />
                  <stop offset="1" stopColor="#062E2B" />
                </linearGradient>
                <pattern id="dDotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.7" fill="rgba(255,255,255,0.09)" />
                </pattern>
                <radialGradient id="dGlowT" cx="75%" cy="15%" r="55%">
                  <stop offset="0" stopColor="#14B8A6" stopOpacity="0.22" />
                  <stop offset="1" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="dGlowB" cx="10%" cy="90%" r="45%">
                  <stop offset="0" stopColor="#0F766E" stopOpacity="0.3" />
                  <stop offset="1" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Base gradient + texture */}
              <rect width="400" height="260" fill="url(#dHeroBase)" />
              <rect width="400" height="260" fill="url(#dDotGrid)" />
              <rect width="400" height="260" fill="url(#dGlowT)" />
              <rect width="400" height="260" fill="url(#dGlowB)" />
              {/* Subtle rings — top right */}
              <circle cx="430" cy="-15" r="170" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <circle cx="430" cy="-15" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              {/* Arc — bottom left */}
              <circle cx="-10" cy="280" r="190" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              {/* Amber accent dots */}
              <circle cx="352" cy="30"  r="5.5" fill="#FBBF24" opacity="0.85" />
              <circle cx="370" cy="44"  r="3"   fill="#FDE68A" opacity="0.55" />
            </svg>
            <RotatingQuote />
          </div>
        )}
      </GlassCard>

      <div className="dash-grid">
        <div className="dash-info">
          <div className="dash-info-label">Tahapan</div>
          <div className="dash-info-value">{isSubmitted ? 'Selesai' : `${completed.filter((s) => s > 0).length} / 6`}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Langkah peninjauan sistem.</div>
        </div>
        <div className="dash-info">
          <div className="dash-info-label">Status Verifikasi</div>
          <div className="dash-info-value" style={
            isSubmitted
              ? (form.status === 'approved' ? { color: 'var(--tosca-700)' } : (form.status === 'rejected' ? { color: 'var(--danger-600)' } : { color: 'var(--amber-600)' }))
              : {}
          }>
            {isSubmitted
              ? (form.status === 'approved' ? 'Lolos' : (form.status === 'rejected' ? 'Ditolak' : 'Menunggu'))
              : '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
            {isSubmitted
              ? (form.status === 'approved' ? 'Selamat! Administrasi diterima.' : (form.status === 'rejected' ? 'Tetap semangat mencoba lagi.' : 'Proses validasi oleh panitia.'))
              : 'Selesaikan pendaftaran.'}
          </div>
        </div>
        <div className="dash-info">
          <div className="dash-info-label">Kampus</div>
          <div className="dash-info-value" style={{ fontSize: 16 }}>{form.province || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Kampus terverifikasi.</div>
        </div>
      </div>

      <GlassCard className="dash-summary" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          Ringkasan Data Kamu
          <span className="pill pill-tosca" style={{ fontSize: 10 }}>Pratinjau</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)', gap: 20 }}>
          <div className="summary-item">
            <div className="summary-label">Identitas</div>
            <div className="summary-val">{form.fullName || '—'}</div>
            <div className="summary-sub">NIK: {form.nik || '—'}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Kampus</div>
            <div className="summary-val">{form.province || '—'}</div>
            <div className="summary-sub">{form.studyProgram || '—'}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Kondisi Orang Tua</div>
            <div className="summary-val" style={{ fontSize: 13, lineHeight: 1.4 }}>{form.familyStatus || '—'}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Prestasi & Organisasi</div>
            <div className="summary-val">{form.achievements?.length || 0} Prestasi</div>
            <div className="summary-sub">{form.organizations?.length || 0} Organisasi</div>
          </div>
        </div>
        {!isSubmitted && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--ink-50)', borderRadius: 12, fontSize: 12, color: 'var(--ink-600)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <IAlert size={16} />
            Data di atas diambil dari draf pengisianmu saat ini. Klik "Lanjut Isikan" untuk melengkapi.
          </div>
        )}
      </GlassCard>

      <GlassCard className="dash-timeline">
        <h3>
          {isSubmitted ? 'Jadwal Seleksi Selanjutnya' : 'Daftar tahapan'}
          {!isSubmitted && <span className="pill pill-tosca">Auto-save aktif</span>}
        </h3>
        <div>
          {isSubmitted ? (
            <>
              {(() => {
                const stages = cfg.selection_stages
                // null = belum diatur admin
                if (stages === null || stages === undefined) {
                  return (
                    <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>🗓️</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                        Jadwal seleksi belum dikonfigurasi
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-400)', maxWidth: 320, margin: '0 auto' }}>
                        Admin akan segera mengumumkan tahapan selanjutnya. Pantau terus halaman ini.
                      </div>
                    </div>
                  )
                }
                // [] = admin sengaja kosongkan (sama dengan null)
                if (stages.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>
                        Belum ada jadwal ditambahkan
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>
                        Nantikan pengumuman dari panitia.
                      </div>
                    </div>
                  )
                }
                // Array dengan isi — render tiap tahap
                return stages.map((s, i) => {
                  const isOngoing = s.status === 'ongoing'
                  const isDone    = s.status === 'done'
                  return (
                    <div key={i} className="tl-item" style={{ cursor: 'default' }}>
                      <div
                        className={`tl-dot ${isDone ? 'is-done' : ''} ${isOngoing ? 'is-active' : ''}`}
                        style={isOngoing ? { background: 'var(--tosca-600)', color: 'white', borderColor: 'var(--tosca-600)' } : undefined}
                      >
                        {isDone ? <ICheck size={14} stroke={3} /> : i + 1}
                      </div>
                      <div className="tl-body" style={{ flex: 1 }}>
                        <div className="tl-title" style={isOngoing ? { color: 'var(--tosca-800)' } : {}}>
                          {s.title}
                        </div>
                        <div className="tl-sub" style={isOngoing ? { color: 'var(--tosca-600)' } : {}}>
                          {isOngoing ? 'Sedang Berjalan' : isDone ? 'Selesai' : 'Akan Datang'}
                          {s.date ? ` · ${s.date}` : ''}
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </>
          ) : (
            STEP_LABELS.map((label, i) => {
              const stepNum = i + 1
              const isDoneRaw = completed.includes(stepNum)
              const isOptional = stepNum === 4 || stepNum === 5
              const hasData = stepNum === 4 ? form.achievements?.length > 0 : (stepNum === 5 ? form.organizations?.length > 0 : true)
              const isDone = isDoneRaw && (!isOptional || hasData)
              const isActive = stepNum === nextStep && !isDone
              const styleDone = isDone ? 'is-done' : ''

              let statusText = 'Belum diisi'
              if (isDone) statusText = 'Selesai diisi'
              else if (isOptional && !hasData && !isActive) statusText = 'Opsional (Boleh dilewati)'
              else if (isActive) statusText = 'Sedang dikerjakan'

              return (
                <div key={i} className="tl-item" onClick={() => onJumpStep && onJumpStep(stepNum)} style={{ cursor: 'pointer' }}>
                  <div className={`tl-dot ${styleDone} ${isActive ? 'is-active' : ''}`}>
                    {isDone ? <ICheck size={14} stroke={3} /> : stepNum}
                  </div>
                  <div className="tl-body" style={{ flex: 1 }}>
                    <div className="tl-title">Step {stepNum} · {label}</div>
                    <div className="tl-sub">{statusText}</div>
                  </div>
                  {isActive && <IArrowRight size={16} style={{ color: 'var(--tosca-700)', alignSelf: 'center' }} />}
                </div>
              )
            })
          )}
        </div>
      </GlassCard>
    </div>
  )
}
