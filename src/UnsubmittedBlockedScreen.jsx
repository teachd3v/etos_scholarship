import React from 'react'
import { AbstractShapes, Button } from './Primitives.jsx'
import { ILogo, ILock } from './Icons.jsx'

export function UnsubmittedBlockedScreen({ onLogout, mobile, theme }) {
  return (
    <div className="auth-split" style={{ minHeight: '100vh' }} data-theme={theme}>
      <div className="auth-hero scene-bg" style={{ flex: 1 }}>
        <AbstractShapes />
        <div className="hero-content" style={{ position: 'relative', zIndex: 2, padding: mobile ? '40px 20px' : '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <ILogo size={40} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Etos ID 2026</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Portal Pendaftaran
              </div>
            </div>
          </div>

          <span className="auth-kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}>
            <ILock size={14} /> Akses Ditolak
          </span>

          <h1 className="auth-tagline" style={{ marginTop: 14, marginBottom: 16, fontSize: mobile ? 30 : 42, lineHeight: 1.2 }}>
            Pendaftaran Anda<br />Tidak Selesai.
          </h1>

          <p className="auth-desc" style={{ maxWidth: 540, marginBottom: 36, color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, lineHeight: 1.6 }}>
            Mohon maaf, pendaftaran Anda gagal karena Anda tidak menyelesaikan proses pendaftaran sampai akhir sebelum masa pendaftaran ditutup.
            <br /><br />
            Sesuai ketentuan, hanya pendaftar yang berhasil melakukan <strong style={{ color: '#fff' }}>Submit Pendaftaran</strong> sebelum batas akhir yang dapat melanjutkan ke tahap verifikasi.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={onLogout}
              style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)', fontWeight: 700 }}
            >
              Logout / Keluar
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
