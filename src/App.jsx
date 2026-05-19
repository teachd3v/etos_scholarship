import React from 'react'
import { BLANK_FORM } from './FormState.jsx'
import '../styles.css'
import { ILogo, IMoon, ISun, ILogout } from './Icons.jsx'
import { GlassCard, Button } from './Primitives.jsx'
import { AuthScreen } from './Auth.jsx'
import { RegisterScreen } from './Register.jsx'
import { TimelineGate, getCurrentPhase } from './TimelineGate.jsx'
import { OnboardingModal } from './Onboarding.jsx'
import { Dashboard } from './Dashboard.jsx'
import { FormShell } from './FormShell.jsx'
import { Review } from './Review.jsx'
import { Success } from './Success.jsx'
import { AdminPanel } from './Admin.jsx'
import { useFormConfig } from './lib/FormConfigContext.jsx'
import { DEFAULT_CONFIG } from './lib/defaultConfig.js'
import { getSession, getProfile, onAuthStateChange, signOut } from './lib/auth.js'
import { useApplicant } from './lib/applicant.js'
import { upsertDocumentRow } from './lib/storage.js'
import { IAlert, ICheckCircle } from './Icons.jsx'

/* ─── Offline / Connection Banner ────────────────────────── */
function ConnectionBanner({ status, lastError }) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const h1 = () => setIsOnline(true)
    const h2 = () => setIsOnline(false)
    window.addEventListener('online',  h1)
    window.addEventListener('offline', h2)
    return () => {
      window.removeEventListener('online',  h1)
      window.removeEventListener('offline', h2)
    }
  }, [])

  if (isOnline && status !== 'error') return null

  const isCritical = !isOnline || status === 'error'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10002,
      background: isOnline ? 'var(--danger-500)' : 'var(--ink-800)',
      color: '#fff', padding: '10px 16px', fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      animation: 'slideDown 0.3s ease-out',
    }}>
      <IAlert size={16} />
      <span>
        {!isOnline 
          ? 'Koneksi terputus. Perubahan Anda mungkin tidak tersimpan.' 
          : `Gagal sinkronisasi: ${lastError || 'Masalah koneksi database.'}`}
      </span>
      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  )
}

// `timeline` defaults to DEFAULT_CONFIG.timeline when called without args (backward compat).
export function getPeriod(timeline = DEFAULT_CONFIG.timeline) {
  const now = new Date()
  if (now <= new Date(timeline.registration_end)) return 'REGISTRATION'
  if (now <= new Date(timeline.verification_end))  return 'VERIFICATION'
  return 'ANNOUNCEMENT'
}

/* ─── Admin Access Denied Screen ────────────────────────── */
function AdminUnauthorized({ theme, onBack }) {
  return (
    <div className="app-shell" data-theme={theme}>
      <div className="admin-login-wrap">
        <div className="admin-login-card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="admin-login-title" style={{ fontSize: 24 }}>Akses Terbatas</h1>
          <p className="admin-login-subtitle" style={{ marginBottom: 32 }}>
            Akun Anda tidak terdaftar sebagai administrator. Silakan login menggunakan akun yang berwenang.
          </p>
          <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={onBack}>
            Kembali ke Portal Utama
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─── Admin App Wrapper ─────────────────────────────────── */
function AdminApp() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('etos_theme') || 'light')
  const [authStatus, setAuthStatus] = React.useState('loading') // 'loading' | 'authorized' | 'unauthorized'
  const [mobile, setMobile] = React.useState(window.innerWidth < 768)

  React.useEffect(() => {
    let cancelled = false

    const checkAdmin = async () => {
      try {
        const session = await getSession()
        if (cancelled) return
        if (!session) { setAuthStatus('unauthorized'); return }
        const profile = await getProfile()
        if (cancelled) return
        setAuthStatus(profile?.role === 'admin' ? 'authorized' : 'unauthorized')
      } catch {
        if (!cancelled) setAuthStatus('unauthorized')
      }
    }
    checkAdmin()

    // Re-check kalau auth state berubah (logout dari tab lain, dll)
    const unsubscribe = onAuthStateChange(({ event }) => {
      if (event === 'SIGNED_OUT') setAuthStatus('unauthorized')
      else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') checkAdmin()
    })
    return () => { cancelled = true; unsubscribe() }
  }, [])

  React.useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  React.useEffect(() => {
    localStorage.setItem('etos_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleLogout = async () => {
    try { await signOut() } catch { /* ignore */ }
    window.location.href = '/'
  }

  if (authStatus === 'loading') {
    return (
      <div className="app-shell" data-theme={theme}>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div className="spinner" style={{ width: 40, height: 40, color: 'var(--tosca-600)' }}></div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.1em' }}>VERIFIKASI ADMIN...</div>
        </div>
      </div>
    )
  }

  if (authStatus === 'unauthorized') {
    return <AdminUnauthorized theme={theme} onBack={() => { window.location.href = '/' }} />
  }

  return (
    <div className="app-shell app-shell--admin" data-theme={theme}>
      <ConnectionBanner />
      <header className="main-header">
        <div className="header-container">
          <div className="brand" style={{ cursor: 'default' }}>
            <ILogo size={28} />
            <div>
              <div className="brand-name">Etos ID 2026</div>
              <div className="brand-tag">Panel Administrasi</div>
            </div>
          </div>
          <div className="header-actions">
            <Button variant="outline-tosca" size="sm" onClick={() => window.location.href = '/'}>
              Ke Portal
            </Button>
            <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <IMoon size={18} /> : <ISun size={18} />}
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <ILogout size={18} />
              <span>Logout Admin</span>
            </button>
          </div>
        </div>
      </header>
      <main className="content-area">
        <AdminPanel mobile={mobile} />
      </main>
    </div>
  )
}


export default function App() {
  // Route to admin if on /admin path — admin bypass TimelineGate karena admin
  // butuh akses panel kapan saja (untuk ubah timeline, dll).
  const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname === '/admin/'
  if (isAdminRoute) return <AdminApp />

  const { config, loading: configLoading } = useFormConfig()
  const [session, setSession] = React.useState(null)
  const [sessionLoading, setSessionLoading] = React.useState(true)
  const [screen, setScreen] = React.useState('loading')  // 'loading'|'auth'|'register'|'onboarding'|'dashboard'|'form'|'review'|'success'
  const [step, setStep] = React.useState(() => Number(localStorage.getItem('etos_step')) || 1)
  const [theme, setTheme] = React.useState(() => localStorage.getItem('etos_theme') || 'light')
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)
  const [mobile, setMobile] = React.useState(window.innerWidth < 768)
  const currentPeriod = getPeriod(config.timeline)
  const currentPhase  = getCurrentPhase(config.timeline)
  const isRegistrationClosed = currentPhase === 'POST_REGISTRATION'

  React.useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ─── Data layer: useApplicant() handle load + autosave ke Supabase ───
  const {
    form,
    setForm,
    setField,
    applicantId,
    isLoaded: applicantLoaded,
    status: saveStatus,
    lastError: saveError,
    save: saveApplicant,
    submit: submitApplicant,
  } = useApplicant({ session, enabled: !!session })

  React.useEffect(() => { localStorage.setItem('etos_step', String(step)) }, [step])
  React.useEffect(() => {
    localStorage.setItem('etos_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // ─── Supabase session bootstrap + listener ────────────────
  React.useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const s = await getSession()
        if (cancelled) return
        setSession(s)
        setSessionLoading(false)

        // Auto-redirect jika admin login di halaman utama
        if (s) {
          const profile = await getProfile()
          if (cancelled) return
          if (profile?.role === 'admin' || s.user?.email === 'teach.d3v@gmail.com') {
            window.location.href = '/admin'
          }
        }
      } catch {
        if (!cancelled) {
          setSession(null)
          setSessionLoading(false)
        }
      }
    }
    bootstrap()

    const unsubscribe = onAuthStateChange(async ({ event, session: newSession }) => {
      setSession(newSession)
      if (event === 'SIGNED_OUT') {
        setScreen('auth')
      } else if (event === 'SIGNED_IN' && newSession) {
        // Handle redirect saat baru saja login (misal via Google)
        const profile = await getProfile()
        if (profile?.role === 'admin' || newSession.user?.email === 'teach.d3v@gmail.com') {
          window.location.href = '/admin'
        }
      }
    })

    return () => { cancelled = true; unsubscribe() }
  }, [])

  // ─── Decide initial screen setelah session, config, & applicant data siap ──
  React.useEffect(() => {
    if (sessionLoading || configLoading) return
    // Jika sudah login tapi data applicant belum ter-load, tunggu dulu
    if (session && !applicantLoaded) return

    setScreen(prev => {
      if (prev !== 'loading') return prev
      if (!session) return 'auth'
      const hasDraft = form.province || form.is_submitted
      return hasDraft ? 'dashboard' : 'onboarding'
    })
  }, [sessionLoading, configLoading, session, applicantLoaded, form.province, form.is_submitted])

  // Saat session berubah dari null → ada (user baru login), trigger transisi
  React.useEffect(() => {
    if (sessionLoading || configLoading) return
    if (!session || !applicantLoaded) return
    if (screen === 'auth' || screen === 'register') {
      const hasDraft = form.province || form.is_submitted
      setScreen(hasDraft ? 'dashboard' : 'onboarding')
    }
  }, [session, applicantLoaded, sessionLoading, configLoading, screen, form.province, form.is_submitted])

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    try {
      // Cleanup legacy keys + session storage
      const keysToRemove = [
        'etos_form',                  // legacy form storage (Fase 3)
        'etos_form_backup',
        'etos_submissions',           // legacy admin storage (Fase 3)
        'etos_confetti_shown_full',
        'etos_confetti_shown_minimal',
      ]
      keysToRemove.forEach(k => localStorage.removeItem(k))
      sessionStorage.clear()
      await signOut()
      window.location.href = '/'
    } catch (e) {
      console.error('Logout error:', e)
      window.location.href = '/'
    }
  }


  // saveProgressToDb — shim untuk FormShell.onSave: trigger save scalar fields
  // ke Supabase (bypass debounce). File fields sudah ke-upload langsung di
  // Onboarding/FormSteps (lihat lib/storage.js), shim ini hanya untuk text data.
  const saveProgressToDb = async (customForm = null) => {
    try { await saveApplicant(customForm) } catch { /* error di-surface lewat saveError */ }
    const now = new Date()
    return {
      timeStr: `Hari ini, ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} WIB`,
    }
  }

  let content
  const stillLoading = screen === 'loading' || sessionLoading || configLoading || (session && !applicantLoaded)
  if (stillLoading) {
    content = (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40, borderThickness: 3, color: 'var(--tosca-600)' }}></div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.05em' }}>MEMUAT SISTEM...</div>
      </div>
    )
  } else if (screen === 'auth') {
    content = (
      <AuthScreen
        onAuthenticated={() => { /* state transition handled by session listener */ }}
        onSwitchToRegister={() => setScreen('register')}
        mobile={mobile}
      />
    )
  } else if (screen === 'register') {
    // Jika registrasi sudah ditutup, redirect ke login (defensive — TimelineGate juga handle)
    if (isRegistrationClosed) {
      content = (
        <AuthScreen
          onAuthenticated={() => {}}
          onSwitchToRegister={() => {}}
          mobile={mobile}
        />
      )
    } else {
      content = <RegisterScreen onSwitchToLogin={() => setScreen('auth')} mobile={mobile} />
    }
  } else if (screen === 'onboarding' || screen === 'dashboard') {
    const isFormLocked = form.status === 'approved' || form.status === 'rejected'
    content = <Dashboard form={form} mobile={mobile} currentPeriod={currentPeriod} cfg={config}
      onContinue={(s) => { if (!isFormLocked) { setStep(s); setScreen('form') } }}
      onJumpStep={(s) => { if (!isFormLocked) { setStep(s); setScreen('form') } }} />
  } else if (screen === 'form') {
    content = <FormShell form={form} setField={setField} applicantId={applicantId}
      step={step} setStep={setStep}
      stepperVariant="default"
      onSave={saveProgressToDb}
      onDashboard={() => setScreen('dashboard')}
      onReview={() => setScreen('review')}
      mobile={mobile}
      currentPeriod={currentPeriod} />
  } else if (screen === 'review') {
    const handleSubmit = async (consentValue) => {
      try {
        // 1. Save dulu state terakhir biar applicant row up-to-date
        await saveApplicant({ ...form, consent: consentValue })
        // 2. UPDATE is_submitted=true → trigger DB generate reg number + queue email
        await submitApplicant()
        // 3. Transition ke success (form sudah berisi reg number dari DB)
        setScreen('success')
      } catch (err) {
        // Surface error ke user
        alert('Gagal submit pendaftaran:\n\n' + (err.message || 'Tidak diketahui'))
      }
    }
    content = <Review form={form}
      onEdit={(s) => { setStep(s); setScreen('form') }}
      onSubmit={handleSubmit}
      onBack={() => setScreen('dashboard')}
      mobile={mobile} />
  } else if (screen === 'success') {
    content = <Success form={form} variant="full"
      onBack={() => setScreen('dashboard')}
      mobile={mobile}
      currentPeriod={currentPeriod} />
  }

  // Header hanya tampil kalau user sudah login DAN bukan di halaman auth/register
  const showHeader = session && screen !== 'auth' && screen !== 'register' && screen !== 'loading'

  const innerApp = (
    <div className="app-shell" data-theme={theme}>
      <ConnectionBanner status={saveStatus} lastError={saveError} />
      {showHeader && (
        <header className="main-header">
          <div className="header-container">
            <div className="brand" onClick={() => setScreen('dashboard')} style={{ cursor: 'pointer' }}>
              <ILogo size={28} />
              <div>
                <div className="brand-name">Etos ID 2026</div>
                <div className="brand-tag">Seleksi Beasiswa</div>
              </div>
            </div>

            <div className="header-actions">

              <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                {theme === 'light' ? <IMoon size={18} /> : <ISun size={18} />}
              </button>

              <button className="logout-btn" onClick={() => setShowLogoutConfirm(true)}>
                <ILogout size={18} />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="content-area">
        {content}
      </main>

      {showLogoutConfirm && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <GlassCard className="modal-card" style={{ maxWidth: 360, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--ink-100)', color: 'var(--ink-800)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, margin: '0 auto 16px'
            }}>
              <ILogout size={24} />
            </div>
            <h2 style={{ fontSize: 20 }}>Keluar dari Sesi?</h2>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-600)' }}>
              Anda akan keluar dari akun pendaftaran saat ini.
            </p>
            <div className="confirm-actions" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}>Batal</Button>
              <Button variant="danger" onClick={handleLogout}>
                Ya, Logout
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {screen === 'onboarding' && (
        <OnboardingModal
          mobile={mobile}
          onPass={async ({ campus, studyProgram, proofFile, graduationYear, ijazahFile }) => {
            // 1. Update state lokal (UI instan, semua field) ──────────────
            setField('province', campus)
            setField('studyProgram', studyProgram)
            setField('admissionProofFile', proofFile)
            setField('graduationYear', graduationYear)
            setField('ijazahFile', ijazahFile)
            setField('religion', 'Islam')
            setScreen('dashboard')

            // 2. Kirim ke Supabase: INSERT applicant + UPSERT 2 documents row
            try {
              const partialForm = {
                ...form,
                province:           campus,
                studyProgram:       studyProgram,
                graduationYear,
                religion:           'Islam',
                admissionProofFile: proofFile,
                ijazahFile,
              }
              const id = await saveApplicant(partialForm)
              if (id) {
                // Upsert documents rows untuk 2 file yang sudah di-upload ke bucket
                await Promise.all([
                  ijazahFile?.path && upsertDocumentRow({
                    applicantId: id, docType: 'ijazah',
                    path: ijazahFile.path, name: ijazahFile.name,
                    size: ijazahFile.size, mime: ijazahFile.mime,
                  }),
                  proofFile?.path && upsertDocumentRow({
                    applicantId: id, docType: 'admission_proof',
                    path: proofFile.path, name: proofFile.name,
                    size: proofFile.size, mime: proofFile.mime,
                  }),
                ].filter(Boolean))
              }
              const now = new Date()
              setField('lastSaved', `Hari ini, ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} WIB`)
            } catch (e) {
              console.error('Gagal sinkronisasi awal onboarding:', e)
            }
          }}
          onDismiss={() => setScreen('auth')} />
      )}
    </div>
  )

  // Wrap dengan TimelineGate — render ComingSoon / RegistrationClosed kalau di luar window.
  // Setelah login (atau saat user click "Login" di RegistrationClosed), gate auto-bypass.
  return (
    <TimelineGate session={session} mobile={mobile}>
      {innerApp}
    </TimelineGate>
  )
}
