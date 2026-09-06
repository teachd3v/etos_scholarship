import React from 'react'
import { GlassCard, Button } from '../Primitives.jsx'
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
    title: 'Pengumuman Kelulusan Seleksi Beasiswa Etos ID 2026',
    subtitle: 'Proses Penetapan Akhir Surat Keputusan (SK) Penerima Beasiswa Sedang Berlangsung',
    message: 'Terima kasih atas partisipasi dan perjuangan seluruh calon peserta seleksi Beasiswa Etos ID 2026. Saat ini Tim Seleksi Pusat sedang merampungkan dan mengesahkan dokumen Surat Keputusan (SK) resmi penerima beasiswa.',
    skDocumentUrl: '',
    skDocumentTitle: 'SK_Kelulusan_Penerima_Beasiswa_Etos_ID_2026.pdf',
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
  // 1. TAMPILAN LOGIN ADMIN
  // ════════════════════════════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <div className="auth-split" style={{ minHeight: '100vh', background: 'var(--ink-950, #0a0f1d)' }}>
        <div className="auth-hero scene-bg" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <GlassCard style={{
            maxWidth: 420,
            width: '100%',
            padding: '36px 32px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 20,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(45, 212, 191, 0.12)',
                color: '#2dd4bf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <ILock size={26} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                Panel Administrator
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                Pengaturan Pengumuman & SK Kelulusan
              </p>
            </div>

            {authError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: 13,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <IAlert size={16} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }}>
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
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }}>
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
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={loggingIn}
                style={{ marginTop: 8 }}
              >
                Masuk ke Panel Admin
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <a href="/" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, textDecoration: 'none' }}>
                ← Kembali ke Halaman Publik
              </a>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // 2. TAMPILAN DASHBOARD PENGATURAN ADMIN
  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink-950, #0a0f1d)', color: '#fff' }}>
      {/* Header Bar */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.9)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src="/logo-landingpage.png" 
              alt="Logo Etos ID" 
              style={{ height: 32, width: 'auto' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Admin Etos ID 2026</div>
              <div style={{ fontSize: 11, color: '#2dd4bf', fontWeight: 600 }}>Pengaturan Pengumuman & SK</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              Lihat Portal Publik ↗
            </a>
            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                cursor: 'pointer',
              }}
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
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>
            Konfigurasi Jadwal & Surat Keputusan (SK)
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.65)', margin: 0 }}>
            Atur hitung mundur pengumuman, pesan resmi dari tim seleksi, dan tautan unduh dokumen PDF Surat Keputusan.
          </p>
        </div>

        {saveSuccess && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            color: '#4ade80',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <ICheckCircle size={18} />
            Pengaturan berhasil disimpan! Halaman publik langsung terbarui.
          </div>
        )}

        {saveError && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
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

            {/* KARTU 1: STATUS PUBLIKASI & SAKLAR MANUAL */}
            <GlassCard style={{
              padding: '24px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#2dd4bf' }}>
                1. Mode Tampilan Pengumuman
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {/* Opsi A: Countdown */}
                <div
                  onClick={() => setConfig(prev => ({ ...prev, isPublished: false }))}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    border: `2px solid ${!config.isPublished ? '#2dd4bf' : 'rgba(255, 255, 255, 0.1)'}`,
                    background: !config.isPublished ? 'rgba(45, 212, 191, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <input
                      type="radio"
                      name="publish_mode"
                      checked={!config.isPublished}
                      onChange={() => setConfig(prev => ({ ...prev, isPublished: false }))}
                    />
                    <strong style={{ fontSize: 14, color: '#fff' }}>Mode Hitung Mundur (Otomatis)</strong>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', margin: 0, paddingLeft: 22 }}>
                    Tampilan publik berupa countdown menuju tanggal target. Begitu waktu tiba, otomatis beralih ke rilis SK.
                  </p>
                </div>

                {/* Opsi B: Force Open */}
                <div
                  onClick={() => setConfig(prev => ({ ...prev, isPublished: true }))}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    border: `2px solid ${config.isPublished ? '#4ade80' : 'rgba(255, 255, 255, 0.1)'}`,
                    background: config.isPublished ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <input
                      type="radio"
                      name="publish_mode"
                      checked={config.isPublished}
                      onChange={() => setConfig(prev => ({ ...prev, isPublished: true }))}
                    />
                    <strong style={{ fontSize: 14, color: '#fff' }}>Buka Pengumuman Sekarang (Manual)</strong>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', margin: 0, paddingLeft: 22 }}>
                    Langsung tampilkan tombol unduh SK resmi saat ini juga, tanpa menunggu hitung mundur berakhir.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* KARTU 2: TARGET WAKTU HITUNG MUNDUR */}
            <GlassCard style={{
              padding: '24px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#2dd4bf' }}>
                2. Target Tanggal & Jam Pengumuman (WIB)
              </h3>

              <div style={{ maxWidth: 360 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 6 }}>
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
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </GlassCard>

            {/* KARTU 3: DOKUMEN SURAT KEPUTUSAN (SK) */}
            <GlassCard style={{
              padding: '24px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#2dd4bf' }}>
                3. Dokumen Surat Keputusan (SK) Resmi (Tipe 1)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }}>
                    Tautan / Link Unduh Dokumen PDF SK (Google Drive / Cloud Link / R2):
                  </label>
                  <input
                    type="url"
                    value={config.skDocumentUrl || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, skDocumentUrl: e.target.value }))}
                    placeholder="https://drive.google.com/... atau tautan berkas PDF"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', marginTop: 4, display: 'block' }}>
                    Pastikan izin tautan Google Drive / Cloud sudah disetel ke "Siapa saja yang memiliki link dapat melihat".
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }}>
                    Nama Dokumen yang Ditampilkan ke Publik:
                  </label>
                  <input
                    type="text"
                    value={config.skDocumentTitle || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, skDocumentTitle: e.target.value }))}
                    placeholder="Contoh: SK Penetapan Penerima Beasiswa Etos ID 2026.pdf"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </GlassCard>

            {/* KARTU 4: TEKS PENGANTAR PUBLIK */}
            <GlassCard style={{
              padding: '24px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#2dd4bf' }}>
                4. Teks & Pesan Resmi Tim Seleksi
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }}>
                    Judul Halaman Pengumuman:
                  </label>
                  <input
                    type="text"
                    value={config.title || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }}>
                    Pesan Khusus untuk Calon Penerima Beasiswa:
                  </label>
                  <textarea
                    rows={4}
                    value={config.message || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, message: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </GlassCard>

            {/* ACTION BAR */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 12 }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={saving}
                style={{ padding: '12px 32px', fontSize: 15, fontWeight: 700 }}
              >
                <ISave size={18} style={{ marginRight: 8 }} />
                Simpan Perubahan Pengumuman
              </Button>
            </div>

          </div>
        </form>
      </main>
    </div>
  )
}
