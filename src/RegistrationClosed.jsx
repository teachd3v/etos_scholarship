// RegistrationClosed.jsx — landing pasca-registrasi.
// Render saat NOW > registration_end. Register diblokir, Login tetap aktif
// agar user yang sudah terdaftar bisa lihat status seleksi mereka.
import React from 'react'
import { AbstractShapes, Button } from './Primitives.jsx'
import { ILogo, ILock } from './Icons.jsx'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return iso }
}

export function RegistrationClosed({ registrationEnd, onContinueLogin, mobile }) {
  return (
    <div className="auth-split" style={{ minHeight: '100vh' }}>
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

          <span className="auth-kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ILock size={14} /> Pendaftaran Telah Ditutup
          </span>

          <h1 className="auth-tagline" style={{ marginTop: 14, marginBottom: 16, fontSize: mobile ? 32 : 48 }}>
            Masa Pendaftaran<br />Telah Berakhir.
          </h1>

          <p className="auth-desc" style={{ maxWidth: 540, marginBottom: 36 }}>
            Periode pendaftaran Beasiswa Etos ID 2026 ditutup pada <strong style={{ color: '#fff' }}>{formatDate(registrationEnd)}</strong>. Pembuatan akun baru tidak lagi tersedia.
            <br /><br />
            Jika kamu sudah terdaftar sebelumnya, silakan login untuk melihat status seleksi kamu.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
            <Button variant="primary" size="lg" onClick={onContinueLogin}>
              Sudah Punya Akun? Login
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
