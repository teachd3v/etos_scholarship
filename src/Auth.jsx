// Auth.jsx — Dev login with hardcoded credentials
import React from 'react'
import { ICheck, IStar, ILock, ILogo } from './Icons.jsx'
import { AbstractShapes, Button, Field, Input } from './Primitives.jsx'

const DEV_CREDENTIALS = {
  admin: { password: 'etos123', role: 'admin' },
  user:  { password: 'user123', role: 'user'  },
}

export function AuthScreen({ onAuthenticated, mobile }) {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError]       = React.useState('')
  const [loading, setLoading]   = React.useState(false)

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError('')
    if (!username) { setError('Mohon isi username.'); return }
    if (!password) { setError('Mohon isi password.'); return }

    setLoading(true)
    // Simulate network delay so the button loading state is visible
    await new Promise(r => setTimeout(r, 400))

    const cred = DEV_CREDENTIALS[username.trim().toLowerCase()]
    if (!cred || cred.password !== password) {
      setError('Username atau password salah.')
      setLoading(false)
      return
    }

    localStorage.setItem('etos_dev_auth', JSON.stringify({ role: cred.role }))

    if (cred.role === 'admin') {
      window.location.href = '/admin'
    } else {
      onAuthenticated()
    }
  }

  return (
    <div className="auth-split">
      {!mobile && (
        <div className="auth-hero scene-bg">
          <AbstractShapes />
          <div className="hero-content" style={{ position: 'relative', zIndex: 2 }}>
            <span className="auth-kicker">Seleksi Beasiswa Etos ID 2026</span>
            <h1 className="auth-tagline">Selamat Datang,<br />Calon #Resillient<br />Generations.</h1>
            <p className="auth-desc">
              Program beasiswa yang berfokus pada pembinaan, pendampingan, dan pemberdayaan untuk meningkatkan learning outcome penerima manfaat melalui penguatan masukan, proses, evaluasi, dan pengembangan berkelanjutan serta pembentukan ekosistem pembelajaran yang inovatif
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 36 }}>
              {[
                { icon: <ICheck size={20} stroke={2.5} />, label: 'Pendaftaran mudah' },
                { icon: <IStar size={20} />,               label: 'Transparan & terukur' },
                { icon: <ILock size={20} />,               label: 'Data kamu pasti aman' },
              ].map(({ icon, label }, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 10, padding: '18px 12px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 16,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}>
                  <span style={{ color: '#5EEAD4', display: 'flex', alignItems: 'center' }}>{icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, letterSpacing: '0.01em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 2, fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.02em' }}>
            ©2026 GREAT Edunesia · Etos ID Scholarship
          </div>
        </div>
      )}

      <div className="auth-form-panel">
        <div className="auth-form">
          <div className="auth-logo">
            <ILogo size={36} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Etos ID</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Portal Pendaftaran
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: mobile ? 22 : 26, marginBottom: 8 }}>Masuk ke portal</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-600)', marginBottom: 24 }}>
            Gunakan kredensial yang diberikan oleh panitia seleksi Etos ID.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Username" error={error && !username ? error : ''}>
              <Input
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="Masukkan username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{ paddingRight: 44, textTransform: 'lowercase' }}
                autoFocus
              />
            </Field>

            <Field label="Password" error={error}>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ paddingRight: 44, textTransform: 'lowercase' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-400)', padding: 4, display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            <Button variant="primary" block size="lg" type="submit" loading={loading} style={{ height: 52, fontSize: 16, marginTop: 4 }}>
              Masuk
            </Button>
          </form>

          <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--ink-50)', borderRadius: 10, border: '1px solid var(--ink-100)', fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--ink-700)' }}>Kredensial dev:</strong><br />
            Pendaftar: <code>user</code> / <code>user123</code><br />
            Admin: <code>admin</code> / <code>etos123</code>
          </div>

          <p style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 16, lineHeight: 1.55 }}>
            Dengan melanjutkan, Anda menyetujui <a className="link" href="#">Ketentuan Penggunaan</a> dan <a className="link" href="#">Kebijakan Privasi</a> GREAT Edunesia.
          </p>
        </div>
      </div>
    </div>
  )
}
