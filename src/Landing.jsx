import React from 'react'
import { GlassCard, Button, Checkbox } from './Primitives.jsx'
import { IFile, ICheckCircle, ILogo } from './Icons.jsx'

export function Landing({ onProceedToRegister, onProceedToLogin, mobile }) {
  const [checks, setChecks] = React.useState({
    read: false,
    prepare: false,
    mechanism: false,
    consult: false,
  })

  const allChecked = Object.values(checks).every(Boolean)

  const toggle = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="landing-wrap" style={{ 
      maxWidth: 800, 
      margin: '0 auto', 
      padding: mobile ? '20px 16px' : '40px 20px',
      animation: 'fadeUp 0.5s ease' 
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <img src="/logo-landingpage.png" alt="Logo Etos ID" style={{ height: mobile ? 50 : 60, objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: mobile ? 24 : 32, marginBottom: 8 }}>Portal Pendaftaran Etos ID 2026</h1>
        <p style={{ color: 'var(--ink-600)', fontSize: 16 }}>
          Selamat datang! Silakan baca panduan pendaftaran sebelum memulai.
        </p>
      </div>

      <GlassCard style={{ padding: mobile ? 16 : 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: 10, background: 'var(--tosca-50)', 
            color: 'var(--tosca-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <IFile size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Panduan Pendaftaran</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Format PDF · Wajib dipelajari</div>
          </div>
        </div>

        {/* PDF Preview Area */}
        <div style={{ 
          width: '100%', 
          height: mobile ? 300 : 450, 
          background: 'var(--ink-100)', 
          borderRadius: 12, 
          overflow: 'hidden',
          border: '1px solid var(--ink-200)',
          position: 'relative',
          marginBottom: 20
        }}>
          <iframe 
            src="/panduan.pdf#toolbar=0&navpanes=0&scrollbar=0" 
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Preview Panduan Pendaftaran"
          />
          {/* Fallback overlay for mobile if iframe doesn't show PDF properly */}
          {mobile && (
             <div style={{ 
               position: 'absolute', bottom: 12, right: 12,
               background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600
             }}>
               Preview Halaman 1
             </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <a href="/panduan.pdf" download="Panduan_Pendaftaran_EtosID_2026.pdf" style={{ textDecoration: 'none' }}>
            <Button variant="outline-tosca" block={mobile}>
              <IFile size={18} style={{ marginRight: 8 }} />
              Unduh Buku Panduan Lengkap
            </Button>
          </a>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: mobile ? 20 : 32 }}>
        <h3 style={{ marginBottom: 20, fontSize: 18 }}>Pernyataan Pemahaman</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Checkbox 
            checked={checks.read} 
            onChange={() => toggle('read')}
          >
            Saya sudah membaca dokumen panduan pendaftaran dengan lengkap.
          </Checkbox>
          <Checkbox 
            checked={checks.prepare} 
            onChange={() => toggle('prepare')}
          >
            Saya sudah memahami syarat dan dokumen yang harus disiapkan sebelum mendaftar.
          </Checkbox>
          <Checkbox 
            checked={checks.mechanism} 
            onChange={() => toggle('mechanism')}
          >
            Saya sudah memahami mekanisme pendaftaran seutuhnya.
          </Checkbox>
          <Checkbox 
            checked={checks.consult} 
            onChange={() => toggle('consult')}
          >
            Saya sudah mengunduh dokumen panduan pendaftaran, jika mengalami kendala saya akan membaca kembali buku panduan tersebut.
          </Checkbox>
        </div>

        <div style={{ marginTop: 32 }}>
          <Button 
            variant="primary" 
            size="lg" 
            block 
            disabled={!allChecked}
            onClick={onProceedToRegister}
          >
            <ICheckCircle size={20} style={{ marginRight: 8 }} />
            Saya Siap Mendaftar Sekarang!
          </Button>
          
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 14, color: 'var(--ink-500)' }}>Sudah punya akun? </span>
            <button 
              onClick={onProceedToLogin}
              style={{ 
                background: 'none', border: 'none', color: 'var(--tosca-600)', 
                fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: 0,
                textDecoration: 'underline'
              }}
            >
              Masuk di sini
            </button>
          </div>
        </div>
      </GlassCard>

      <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--ink-400)', fontSize: 12 }}>
        &copy; 2026 Beasiswa Etos ID. Hak Cipta Dilindungi.
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
