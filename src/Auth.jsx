// Auth.jsx — Login screen (Supabase email/password + Google OAuth)
import React from 'react'
import { ICheck, IStar, ILock, ILogo, IChevronLeft } from './Icons.jsx'
import { AbstractShapes, Button, Field, Input } from './Primitives.jsx'
import { signIn, signInWithGoogle, resendConfirmation, requestPasswordReset } from './lib/auth.js'

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.7-6.2 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.1 0-9.5-3.3-11.2-7.9l-6.5 5C9.6 39.7 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2c-.4.4 6.7-4.9 6.7-14.9 0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

export function AuthScreen({ onAuthenticated, onSwitchToRegister, onBack, mobile }) {
  const [email, setEmail]       = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError]       = React.useState('')
  const [info, setInfo]         = React.useState('')
  const [loading, setLoading]   = React.useState(false)
  const [oauthLoading, setOAuthLoading] = React.useState(false)
  const [showForgot, setShowForgot] = React.useState(false)
  const [resending, setResending]   = React.useState(false)

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError(''); setInfo('')
    if (!email)    { setError('Email wajib diisi.'); return }
    if (!password) { setError('Password wajib diisi.'); return }

    setLoading(true)
    try {
      await signIn({ email, password })
      // onAuthStateChange di App.jsx akan handle transition ke dashboard
      onAuthenticated && onAuthenticated()
    } catch (err) {
      setError(err.message || 'Login gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(''); setInfo('')
    setOAuthLoading(true)
    try {
      await signInWithGoogle()
      // Redirect terjadi otomatis — komponen unmount sebelum sampai sini
    } catch (err) {
      setError(err.message || 'Login Google gagal.')
      setOAuthLoading(false)
    }
  }

  const handleResend = async () => {
    setError(''); setInfo('')
    if (!email) { setError('Isi email dulu untuk kirim ulang konfirmasi.'); return }
    setResending(true)
    try {
      await resendConfirmation(email)
      setInfo('Email konfirmasi telah dikirim ulang. Cek inbox kamu.')
    } catch (err) {
      setError(err.message || 'Gagal kirim ulang.')
    } finally {
      setResending(false)
    }
  }

  const handleForgot = async () => {
    setError(''); setInfo('')
    if (!email) { setError('Isi email dulu untuk reset password.'); return }
    try {
      await requestPasswordReset(email)
      setInfo('Link reset password telah dikirim ke email kamu.')
      setShowForgot(false)
    } catch (err) {
      setError(err.message || 'Gagal mengirim link reset.')
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
          <div style={{ marginBottom: 24 }}>
            <button 
              onClick={onBack}
              style={{ 
                background: 'none', border: 'none', color: 'var(--ink-500)', 
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', 
                gap: 6, cursor: 'pointer', padding: '4px 0' 
              }}
            >
              <IChevronLeft size={16} /> Kembali
            </button>
          </div>
          
          <div className="auth-logo">
            <img src="/logo-sistem.png" alt="Logo Etos ID" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Etos ID</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Portal Pendaftaran
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: mobile ? 22 : 26, marginBottom: 8 }}>Masuk ke portal</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-600)', marginBottom: 24 }}>
            Login dengan email yang sudah terdaftar untuk lanjutkan pendaftaran beasiswa.
          </p>

          {/* Google OAuth */}
          <Button
            variant="outline-tosca"
            block
            size="lg"
            onClick={handleGoogle}
            loading={oauthLoading}
            style={{ height: 52, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            {!oauthLoading && <GoogleIcon size={20} />}
            Lanjutkan dengan Google
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px', color: 'var(--ink-400)', fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--ink-200)' }} />
            <span>atau</span>
            <div style={{ flex: 1, height: 1, background: 'var(--ink-200)' }} />
          </div>

          {/* Email + Password */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); setInfo('') }}
                placeholder="nama@email.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{ textTransform: 'lowercase' }}
              />
            </Field>

            <Field label="Password" error={error}>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); setInfo('') }}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-400)', padding: 4, display: 'flex', alignItems: 'center'
                  }}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
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

            {info && (
              <div style={{ padding: '10px 14px', background: 'rgba(20, 184, 166, 0.08)', borderRadius: 10, border: '1px solid rgba(20, 184, 166, 0.25)', fontSize: 12, color: 'var(--tosca-700)', lineHeight: 1.55 }}>
                {info}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: -4 }}>
              <button type="button" onClick={handleResend} disabled={resending} style={{ background: 'none', border: 'none', color: 'var(--tosca-700)', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                {resending ? 'Mengirim…' : 'Kirim ulang konfirmasi email'}
              </button>
              <button type="button" onClick={() => setShowForgot(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--tosca-700)', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                Lupa password?
              </button>
            </div>

            {showForgot && (
              <div style={{ padding: 14, background: 'var(--ink-50)', borderRadius: 10, border: '1px solid var(--ink-100)', fontSize: 12, lineHeight: 1.6 }}>
                Reset password akan dikirim ke <strong>{email || 'email kamu'}</strong>. Pastikan email di atas benar.
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <Button variant="primary" size="sm" onClick={handleForgot}>Kirim link reset</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowForgot(false)}>Batal</Button>
                </div>
              </div>
            )}

            <Button variant="primary" block size="lg" type="submit" loading={loading} style={{ height: 52, fontSize: 16, marginTop: 4 }}>
              Masuk
            </Button>
          </form>

          {onSwitchToRegister && (
            <p style={{ fontSize: 13, color: 'var(--ink-600)', marginTop: 20, textAlign: 'center' }}>
              Belum punya akun?{' '}
              <button type="button" onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: 'var(--tosca-700)', cursor: 'pointer', padding: 0, fontWeight: 700 }}>
                Daftar di sini
              </button>
            </p>
          )}

          <p style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 16, lineHeight: 1.55 }}>
            Dengan melanjutkan, Anda menyetujui <a className="link" href="#">Ketentuan Penggunaan</a> dan <a className="link" href="#">Kebijakan Privasi</a> GREAT Edunesia.
          </p>
        </div>
      </div>
    </div>
  )
}
