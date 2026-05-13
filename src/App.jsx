import React from 'react'
import { BLANK_FORM } from './FormState.jsx'
import '../styles.css'
import { ILogo, IMoon, ISun, ILogout } from './Icons.jsx'
import { GlassCard, Button } from './Primitives.jsx'
import { AuthScreen } from './Auth.jsx'
import { OnboardingModal } from './Onboarding.jsx'
import { Dashboard } from './Dashboard.jsx'
import { FormShell } from './FormShell.jsx'
import { Review } from './Review.jsx'
import { Success } from './Success.jsx'
import { AdminPanel } from './Admin.jsx'
import { useFormConfig } from './lib/FormConfigContext.jsx'
import { DEFAULT_CONFIG } from './lib/defaultConfig.js'

const genUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

// Resolves a file input to a blob URL for the current session.
// Returns existing URL unchanged when user hasn't re-selected the file.
function resolveFile(fileObj) {
  if (!fileObj) return null
  if (fileObj.file) return { url: URL.createObjectURL(fileObj.file), name: fileObj.name, size: fileObj.size }
  return fileObj
}

// `timeline` defaults to DEFAULT_CONFIG.timeline when called without args (backward compat).
export function getPeriod(timeline = DEFAULT_CONFIG.timeline) {
  const now = new Date()
  if (now <= new Date(timeline.registration_end)) return 'REGISTRATION'
  if (now <= new Date(timeline.verification_end))  return 'VERIFICATION'
  return 'ANNOUNCEMENT'
}

/* ─── Admin Login Gate ──────────────────────────────────── */
/* ─── Admin Access Denied Screen ────────────────────────── */
function AdminUnauthorized({ theme }) {
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
            Email Anda tidak terdaftar sebagai administrator. Silakan login menggunakan akun yang berwenang.
          </p>
          <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={() => window.location.href = '/'}>
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
  const [authStatus, setAuthStatus] = React.useState('loading') // 'loading', 'authorized', 'unauthorized'
  const [mobile, setMobile] = React.useState(window.innerWidth < 768)

  React.useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem('etos_dev_auth') || 'null')
      setAuthStatus(auth?.role === 'admin' ? 'authorized' : 'unauthorized')
    } catch {
      setAuthStatus('unauthorized')
    }
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

  const handleLogout = () => {
    localStorage.removeItem('etos_dev_auth')
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
    return <AdminUnauthorized theme={theme} />
  }

  return (
    <div className="app-shell app-shell--admin" data-theme={theme}>
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
  // Route to admin if on /admin path
  const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname === '/admin/'
  if (isAdminRoute) return <AdminApp />

  const { config, loading: configLoading } = useFormConfig()
  const [screen, setScreen] = React.useState('loading')
  const [step, setStep] = React.useState(() => Number(localStorage.getItem('etos_step')) || 1)
  const [theme, setTheme] = React.useState(() => localStorage.getItem('etos_theme') || 'light')
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)
  const [showClosedModal, setShowClosedModal] = React.useState(false)
  const [mobile, setMobile] = React.useState(window.innerWidth < 768)
  const currentPeriod = getPeriod(config.timeline)

  React.useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [form, setForm] = React.useState(() => {
    const saved = localStorage.getItem('etos_form')
    try {
      if (saved) {
        const parsed = JSON.parse(saved)
        // Blob URLs tidak valid setelah reload — bersihkan semua file fields
        const stripBlob = (f) => f?.url?.startsWith('blob:') ? null : f
        parsed.photoFile          = stripBlob(parsed.photoFile)
        parsed.kkFile             = stripBlob(parsed.kkFile)
        parsed.admissionProofFile = stripBlob(parsed.admissionProofFile)
        parsed.ijazahFile         = stripBlob(parsed.ijazahFile)
        parsed.housePhotoFile     = stripBlob(parsed.housePhotoFile)
        parsed.kitchenPhotoFile   = stripBlob(parsed.kitchenPhotoFile)
        return parsed
      }
    } catch { }
    return { ...BLANK_FORM }
  })

  const setField = React.useCallback((k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
  }, [])

  React.useEffect(() => { localStorage.setItem('etos_step', String(step)) }, [step])
  React.useEffect(() => {
    localStorage.setItem('etos_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  React.useEffect(() => {
    try { localStorage.setItem('etos_form', JSON.stringify(form)) } catch { }
  }, [form])

  React.useEffect(() => {
    let auth = null
    try { auth = JSON.parse(localStorage.getItem('etos_dev_auth') || 'null') } catch { }

    if (!auth || auth.role !== 'user') {
      setScreen('auth')
      return
    }

    // Dev user: restore from saved form — skip onboarding if province already set
    const hasDraft = form.province || form.is_submitted
    if (hasDraft) setScreen('dashboard')
    else setScreen('onboarding')
  }, []) // Stable effect, runs once on mount


  const handleLogout = async () => {
    // 1. Tutup modal konfirmasi dulu biar user merasa ada "reaksi" instan
    setShowLogoutConfirm(false)
    
    try {
      // Hapus sesi auth saja — form & submissions tetap tersimpan
      const keysToRemove = [
        'etos_dev_auth',
        'etos_form_backup',
        'etos_confetti_shown_full',
        'etos_confetti_shown_minimal',
      ]
      keysToRemove.forEach(k => localStorage.removeItem(k))
      sessionStorage.clear()

      // 5. Paksa refresh ke halaman auth agar state bersih total
      window.location.href = '/' 
    } catch (e) {
      console.error('Logout error:', e)
      // Jika error, paksa reload saja sebagai fallback terakhir
      window.location.href = '/'
    }
  }


  // Pure localStorage save — resolves file inputs to blob URLs for current session
  const saveProgressToDb = (customForm = null) => {
    const activeForm = customForm || form

    const photoResolved      = resolveFile(activeForm.photoFile)
    const kkResolved         = resolveFile(activeForm.kkFile)
    const admissionResolved  = resolveFile(activeForm.admissionProofFile)

    if (!customForm) {
      if (photoResolved !== activeForm.photoFile)     setField('photoFile',         photoResolved)
      if (kkResolved !== activeForm.kkFile)           setField('kkFile',            kkResolved)
      if (admissionResolved !== activeForm.admissionProofFile) setField('admissionProofFile', admissionResolved)
    }

    const now = new Date()
    const timeStr = `Hari ini, ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} WIB`
    if (!customForm) setField('lastSaved', timeStr)

    return Promise.resolve({
      fotoProfilUrl:    photoResolved?.url || null,
      kkFileUrl:        kkResolved?.url || null,
      admissionProofUrl: admissionResolved?.url || null,
      timeStr,
    })
  }

  let content
  if (screen === 'loading' || configLoading) {
    content = (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40, borderThickness: 3, color: 'var(--tosca-600)' }}></div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.05em' }}>MEMUAT SISTEM...</div>
      </div>
    )
  } else if (screen === 'auth') {
    content = <AuthScreen onAuthenticated={() => setScreen((form.province || form.is_submitted) ? 'dashboard' : 'onboarding')} mobile={mobile} />
  } else if (screen === 'onboarding' || screen === 'dashboard') {
    const isFormLocked = form.status === 'approved' || form.status === 'rejected'
    content = <Dashboard form={form} mobile={mobile} currentPeriod={currentPeriod} cfg={config}
      onContinue={(s) => { if (!isFormLocked) { setStep(s); setScreen('form') } }}
      onJumpStep={(s) => { if (!isFormLocked) { setStep(s); setScreen('form') } }} />
  } else if (screen === 'form') {
    content = <FormShell form={form} setField={setField}
      step={step} setStep={setStep}
      stepperVariant="default"
      onSave={saveProgressToDb}
      onDashboard={() => setScreen('dashboard')}
      onReview={() => setScreen('review')}
      mobile={mobile}
      currentPeriod={currentPeriod} />
  } else if (screen === 'review') {
    const handleSubmit = async () => {
      const num = 'ETOS-26-' + genUUID().replace(/-/g, '').substring(0, 8).toUpperCase()
      const formatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(new Date()).replace(/\./g, '') + ' WIB'

      const localId = form._localId || genUUID()

      const submittedEntry = {
        ...form,
        _localId:           localId,
        registrationNumber: num,
        submittedAt:        formatted,
        is_submitted:       true,
        status:             'pending',
      }

      // Best-effort localStorage save — failure must not block the success screen
      try {
        const existing = JSON.parse(localStorage.getItem('etos_submissions') || '[]')
        const idx = existing.findIndex(s => s._localId === localId)
        if (idx >= 0) existing[idx] = submittedEntry
        else existing.push(submittedEntry)
        localStorage.setItem('etos_submissions', JSON.stringify(existing))
      } catch { /* quota / serialisation error — ignore */ }

      // Always transition to success after saving state
      setForm(f => ({ ...f, _localId: localId, registrationNumber: num, submittedAt: formatted, is_submitted: true }))
      setScreen('success')
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

  return (
    <div className="app-shell" data-theme={theme}>
      {screen !== 'auth' && (
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

      {showClosedModal && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <GlassCard className="modal-card" style={{ maxWidth: 400, textAlign: 'center', padding: '40px 32px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, margin: '0 auto 24px'
            }}>
              <div style={{ fontSize: 40 }}>🔒</div>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>Pendaftaran Ditutup</h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-600)', marginBottom: 32 }}>
              Mohon maaf, masa pendaftaran Beasiswa Etos ID 2026 telah berakhir. Anda tidak dapat membuat akun atau pendaftaran baru saat ini.
            </p>
            <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={() => setShowClosedModal(false)}>
              Mengerti
            </Button>
          </GlassCard>
        </div>
      )}

      {screen === 'onboarding' && (
        <OnboardingModal
          mobile={mobile}
          onPass={async ({ campus, studyProgram, proofFile, graduationYear, ijazahFile }) => {
            // 1. Update state lokal (UI instan)
            setField('province', campus)
            setField('studyProgram', studyProgram)
            setField('admissionProofFile', proofFile)
            setField('graduationYear', graduationYear)
            setField('ijazahFile', ijazahFile)
            setField('religion', 'Islam')
            setScreen('dashboard')

            // 2. Kirim parsial ke Supabase di background
            try {
              const partialForm = {
                ...form,
                province: campus,
                studyProgram: studyProgram,
                admissionProofFile: proofFile,
                religion: 'Islam'
              }
              const results = await saveProgressToDb(partialForm)
              // Update state dengan URL permanen setelah upload selesai
              if (results?.admissionProofUrl) {
                setField('admissionProofFile', { 
                  url: results.admissionProofUrl, 
                  name: proofFile.name, 
                  size: proofFile.size 
                })
              }
              if (results?.timeStr) setField('lastSaved', results.timeStr)
            } catch (e) {
              console.error('Gagal sinkronisasi awal onboarding:', e)
            }
          }}
          onDismiss={() => setScreen('auth')} />
      )}
    </div>
  )
}
