import React from 'react'
import { ISave, ILogout, ICheckCircle, IFile, IAlert, ILock } from '../Icons.jsx'
import {
  getAnnouncementConfig,
  saveAnnouncementConfig,
  loginAdmin,
  logoutAdmin,
  isUserAdminLoggedIn,
} from '../lib/announcementConfig.js'

export function AnnouncementAdmin() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(isUserAdminLoggedIn())
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [authError, setAuthError] = React.useState('')
  const [loggingIn, setLoggingIn] = React.useState(false)

  // Config state
  const [config, setConfig] = React.useState({
    announcementDate: '2026-09-15T10:00:00+07:00',
    skDocumentUrl: '',
    isPublished: false,
  })
  const [loadingConfig, setLoadingConfig] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)
  const [saveError, setSaveError] = React.useState('')

  React.useEffect(() => {
    if (isLoggedIn) {
      getAnnouncementConfig().then((cfg) => {
        if (cfg) setConfig(cfg)
        setLoadingConfig(false)
      })
    }
  }, [isLoggedIn])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    setLoggingIn(true)
    try {
      await loginAdmin({ username, password })
      setIsLoggedIn(true)
    } catch (err) {
      setAuthError(err.message || 'Login gagal. Periksa username dan password.')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = () => {
    logoutAdmin()
    setIsLoggedIn(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    try {
      await saveAnnouncementConfig(config)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      setSaveError(err.message || 'Gagal menyimpan konfigurasi.')
    } finally {
      setSaving(false)
    }
  }

  // Helper formatting for datetime-local (YYYY-MM-DDTHH:mm)
  const formatForInput = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      const pad = (n) => String(n).padStart(2, '0')
      const YYYY = d.getFullYear()
      const MM = pad(d.getMonth() + 1)
      const DD = pad(d.getDate())
      const hh = pad(d.getHours())
      const mm = pad(d.getMinutes())
      return `${YYYY}-${MM}-${DD}T${hh}:${mm}`
    } catch {
      return ''
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 1. TAMPILAN LOGIN ADMIN (MINIMALIST LIGHT 3D)
  // ════════════════════════════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: '#e9edf3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{
          maxWidth: 420,
          width: '100%',
          background: '#ffffff',
          borderRadius: 32,
          padding: '40px 32px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.1), 0 0 1px 1px rgba(0, 0, 0, 0.03)',
          boxSizing: 'border-box',
        }}>
          {/* Logo & Heading */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img
              src="/logo-landingpage.png"
              alt="Logo Etos ID"
              style={{ height: 42, width: 'auto', marginBottom: 20, objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Panel Administrator
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>
              Pengaturan Pengumuman & SK Kelulusan
            </p>
          </div>

          {authError && (
            <div style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#b91c1c',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <IAlert size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0d9488' }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0d9488' }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '14px 24px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                cursor: loggingIn ? 'not-allowed' : 'pointer',
                opacity: loggingIn ? 0.7 : 1,
                boxShadow: '0 12px 24px -6px rgba(13, 148, 136, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                marginTop: 6,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loggingIn) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 16px 30px -6px rgba(13, 148, 136, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(13, 148, 136, 0.4)'
              }}
            >
              <span>{loggingIn ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a href="/" style={{ color: '#64748b', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
              ← Kembali ke Halaman Publik
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // 2. TAMPILAN DASHBOARD ADMIN (MINIMALIST LIGHT 3D)
  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: '#e9edf3',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Sticky Header Bar */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src="/logo-landingpage.png"
              alt="Logo Etos ID"
              style={{ height: 32, width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Admin Etos ID</div>
              <div style={{ fontSize: 11, color: '#0d9488', fontWeight: 700 }}>Pengaturan Pengumuman & SK</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            >
              Lihat Portal Publik ↗
            </a>
            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                color: '#dc2626',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2' }}
            >
              <ILogout size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Settings Form */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '36px 20px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Konfigurasi Jadwal & Dokumen SK
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Kelola mode rilis publik (hitung mundur / buka langsung), target tanggal & jam pengumuman, dan tautan unduh dokumen Surat Keputusan (SK) resmi.
          </p>
        </div>

        {saveSuccess && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 16,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)',
          }}>
            <ICheckCircle size={18} />
            Pengaturan berhasil disimpan! Halaman publik langsung terbarui seketika.
          </div>
        )}

        {saveError && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 16,
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#991b1b',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <IAlert size={18} />
            {saveError}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* KARTU 1: MODE TAMPILAN PENGUMUMAN */}
            <div style={{
              padding: '28px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 24,
              boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.04)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>
                1. Mode Tampilan Pengumuman
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Opsi A: Countdown */}
                <div
                  onClick={() => setConfig(prev => ({ ...prev, isPublished: false }))}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 18,
                    border: `2px solid ${!config.isPublished ? '#0d9488' : '#e2e8f0'}`,
                    background: !config.isPublished ? '#f0fdfa' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: !config.isPublished ? '0 8px 20px -4px rgba(13, 148, 136, 0.12)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <input
                      type="radio"
                      name="publish_mode"
                      checked={!config.isPublished}
                      onChange={() => setConfig(prev => ({ ...prev, isPublished: false }))}
                      style={{ accentColor: '#0d9488', cursor: 'pointer' }}
                    />
                    <strong style={{ fontSize: 14, color: '#0f172a' }}>Mode Hitung Mundur (Otomatis)</strong>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, paddingLeft: 24, lineHeight: 1.5 }}>
                    Tampilan publik berupa countdown menuju tanggal target. Begitu waktu tiba, otomatis beralih menampilkan tombol unduh SK.
                  </p>
                </div>

                {/* Opsi B: Force Open */}
                <div
                  onClick={() => setConfig(prev => ({ ...prev, isPublished: true }))}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 18,
                    border: `2px solid ${config.isPublished ? '#16a34a' : '#e2e8f0'}`,
                    background: config.isPublished ? '#f0fdf4' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: config.isPublished ? '0 8px 20px -4px rgba(22, 163, 74, 0.12)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <input
                      type="radio"
                      name="publish_mode"
                      checked={config.isPublished}
                      onChange={() => setConfig(prev => ({ ...prev, isPublished: true }))}
                      style={{ accentColor: '#16a34a', cursor: 'pointer' }}
                    />
                    <strong style={{ fontSize: 14, color: '#0f172a' }}>Buka Pengumuman Sekarang (Manual)</strong>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, paddingLeft: 24, lineHeight: 1.5 }}>
                    Langsung tampilkan tombol unduh SK resmi saat ini juga ke publik, tanpa menunggu hitung mundur berakhir.
                  </p>
                </div>
              </div>
            </div>

            {/* KARTU 2: TARGET WAKTU HITUNG MUNDUR */}
            <div style={{
              padding: '28px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 24,
              boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.04)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>
                2. Target Tanggal & Jam Pengumuman (WIB)
              </h3>

              <div style={{ maxWidth: 360 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Pilih Tanggal & Waktu Rilis Resmi:
                </label>
                <input
                  type="datetime-local"
                  value={formatForInput(config.announcementDate)}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val) {
                      setConfig(prev => ({ ...prev, announcementDate: new Date(val).toISOString() }))
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: 14,
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* KARTU 3: DOKUMEN SURAT KEPUTUSAN (SK) */}
            <div style={{
              padding: '28px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 24,
              boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.04)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>
                3. Dokumen Surat Keputusan (SK) Resmi
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Tautan / Link Unduh Dokumen PDF SK (Google Drive / Cloud Link):
                  </label>
                  <input
                    type="url"
                    value={config.skDocumentUrl || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, skDocumentUrl: e.target.value }))}
                    placeholder="https://drive.google.com/... atau tautan berkas PDF"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#64748b', marginTop: 6, display: 'block' }}>
                    Pastikan tautan Google Drive disetel ke "Siapa saja yang memiliki link dapat melihat".
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION BAR */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 8 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 36px',
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 700,
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: '0 14px 28px -6px rgba(13, 148, 136, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 18px 36px -6px rgba(13, 148, 136, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 14px 28px -6px rgba(13, 148, 136, 0.4)'
                }}
              >
                <ISave size={18} />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan Pengumuman'}</span>
              </button>
            </div>

          </div>
        </form>
      </main>
    </div>
  )
}
