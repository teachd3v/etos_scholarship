// Success.jsx — Post-submission success screen + confetti
import React from 'react'
import { ICheckCircle } from './Icons.jsx'
import { GlassCard, Button } from './Primitives.jsx'

function Confetti({ trigger }) {
  const canvasRef = React.useRef(null)
  React.useEffect(() => {
    if (!trigger) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const DPR = window.devicePixelRatio || 1
    const resize = () => { canvas.width = innerWidth * DPR; canvas.height = innerHeight * DPR; canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px' }
    resize()
    window.addEventListener('resize', resize)
    const colors = ['#0F766E', '#14B8A6', '#5EEAD4', '#FBBF24', '#FDE68A', '#FFFFFF']
    const N = 180
    const pieces = Array.from({ length: N }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 160,
      y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * -14 - 4,
      g: 0.3 + Math.random() * 0.15,
      size: 5 + Math.random() * 6,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 120 + Math.random() * 120,
      age: 0,
    }))
    let running = true
    const tick = () => {
      if (!running) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = 0
      for (const p of pieces) {
        if (p.age > p.life) continue
        alive++
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.age++
        const alpha = Math.max(0, 1 - p.age / p.life)
        ctx.save()
        ctx.translate(p.x * DPR, p.y * DPR)
        ctx.rotate(p.rot)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size * DPR, -p.size * 0.4 * DPR, p.size * 2 * DPR, p.size * 0.8 * DPR)
        ctx.restore()
      }
      if (alive > 0) requestAnimationFrame(tick)
    }
    tick()
    return () => { running = false; window.removeEventListener('resize', resize) }
  }, [trigger])
  return <canvas ref={canvasRef} className="confetti-canvas" />
}

export function ScoreRing({ label, value, color = 'var(--tosca-700)' }) {
  const R = 40, C = 2 * Math.PI * R
  const dash = (value / 100) * C
  return (
    <div className="score-card">
      <div className="score-label">{label}</div>
      <div className="score-ring">
        <svg viewBox="0 0 96 96" width="96" height="96">
          <circle cx="48" cy="48" r={R} fill="none" stroke="var(--ink-200)" strokeWidth="8" />
          <circle cx="48" cy="48" r={R} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${C}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray .9s cubic-bezier(.2,.8,.2,1)' }} />
        </svg>
        <div className="score-center">{value}</div>
      </div>
      <div className="score-value-inline">dari 100</div>
    </div>
  )
}

export function Success({ form, variant = 'full', onBack, mobile }) {
  const [animated, setAnimated] = React.useState(false)
  const [playConfetti, setPlayConfetti] = React.useState(false)

  const key = 'etos_confetti_shown_' + variant
  React.useEffect(() => {
    const seen = sessionStorage.getItem(key)
    if (!seen) { setPlayConfetti(true); sessionStorage.setItem(key, '1') }
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [variant])

  if (variant === 'minimal') {
    return (
      <div className="success-wrap">
        {playConfetti && <Confetti trigger />}
        <GlassCard className="success-hero" style={{ textAlign: 'left', padding: mobile ? '28px 20px' : 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div className="success-badge" style={{ margin: 0, width: 72, height: 72 }}>
              <ICheckCircle size={40} stroke={2} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              {form.status === 'approved' ? (
                <span className="pill pill-ok pill-dot" style={{ marginBottom: 10 }}>Lolos Administrasi</span>
              ) : form.status === 'rejected' ? (
                <span className="pill pill-danger pill-dot" style={{ marginBottom: 10 }}>Pendaftaran Ditolak</span>
              ) : (
                <span className="pill pill-amber pill-dot" style={{ marginBottom: 10 }}>Menunggu Verifikasi</span>
              )}
              <h1 style={{ marginTop: 4 }}>
                {form.status === 'approved' ? 'Selamat! Anda Lolos.' : form.status === 'rejected' ? 'Mohon Maaf.' : 'Pendaftaran terkirim.'}
              </h1>
              <p style={{ marginTop: 8 }}>
                {form.status === 'approved' 
                  ? <>Selamat <strong>{form.fullName?.split(' ')[0]}</strong>, Anda dinyatakan lolos seleksi administrasi. Silakan pantau email untuk tahap selanjutnya.</>
                  : form.status === 'rejected'
                  ? <>Terima kasih <strong>{form.fullName?.split(' ')[0]}</strong>. Mohon maaf, pendaftaran Anda belum dapat kami proses lebih lanjut kali ini.</>
                  : <>Terima kasih, <strong>{form.fullName?.split(' ')[0] || 'Pendaftar'}</strong>. Tim verifikator akan meninjau data Anda dalam 7–14 hari kerja.</>
                }
              </p>
            </div>
          </div>
          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            <div className="dash-info" style={{ padding: 16 }}>
              <div className="dash-info-label">Nomor Pendaftaran</div>
              <div className="dash-info-value mono" style={{ fontSize: 16 }}>{form.registrationNumber || 'ETOS-26-DEMO'}</div>
            </div>
            <div className="dash-info" style={{ padding: 16 }}>
              <div className="dash-info-label">Dikirim pada</div>
              <div className="dash-info-value" style={{ fontSize: 16 }}>{form.submittedAt || '—'}</div>
            </div>
            <div className="dash-info" style={{ padding: 16 }}>
              <div className="dash-info-label">Status</div>
              <div className="dash-info-value" style={{ 
                fontSize: 16, 
                color: form.status === 'approved' ? 'var(--tosca-700)' : (form.status === 'rejected' ? 'var(--danger-600)' : 'var(--amber-600)') 
              }}>
                {form.status === 'approved' ? 'Lolos' : (form.status === 'rejected' ? 'Ditolak' : 'Menunggu')}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: 24, marginTop: 16 }}>
          <h3 style={{ marginBottom: 14 }}>Langkah selanjutnya</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Verifikasi administrasi', 'Tim kami akan memeriksa kelengkapan dokumen. Notifikasi dikirim via email.'],
              ['Tes potensi akademik', 'Jika lolos admin, Anda akan mendapat jadwal tes online.'],
              ['Wawancara', 'Tahap akhir — dilakukan online bersama panel reviewer.'],
            ].map(([t, s], i) => (
              <div key={i} className="tl-item">
                <div className="tl-dot">{i + 1}</div>
                <div className="tl-body"><div className="tl-title">{t}</div><div className="tl-sub">{s}</div></div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <Button variant="ghost" onClick={onBack}>Kembali ke dasbor</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="success-wrap">
      {playConfetti && <Confetti trigger />}
      <GlassCard className="success-hero" style={{ padding: mobile ? '32px 20px' : '48px 32px' }}>
        <div className="success-badge" style={mobile ? { width: 64, height: 64, marginBottom: 16 } : {}}><ICheckCircle size={mobile ? 40 : 50} stroke={2} /></div>
        <span className="pill pill-ok pill-dot" style={{ marginBottom: 12 }}>Pendaftaran Tersimpan</span>
        <h1 style={mobile ? { fontSize: 24 } : {}}>Selamat, pendaftaran Anda terkirim!</h1>
        <p style={{ margin: '10px auto 0', maxWidth: 540, fontSize: mobile ? 14 : 16 }}>
          Terima kasih, <strong>{form.fullName || 'Pendaftar'}</strong>. Data Anda telah diterima dan akan ditinjau
          oleh tim verifikator Beasiswa Etos ID 2026.
        </p>
        <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          background: 'var(--ink-50)', borderRadius: 999, fontSize: 13 }}>
          <span style={{ color: 'var(--ink-600)' }}>{form.submittedAt || '—'}</span>
        </div>
      </GlassCard>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Button variant="outline-tosca" size="lg" onClick={onBack}>Kembali ke dasbor</Button>
      </div>
    </div>
  )
}
