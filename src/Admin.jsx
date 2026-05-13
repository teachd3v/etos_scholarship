// Admin.jsx — Admin panel: view & triage submitted applications
import React from 'react'
import { useFormConfig } from './lib/FormConfigContext.jsx'
import { DEFAULT_CONFIG } from './lib/defaultConfig.js'
import { ICheck, IX, ISave, IAlert, IChevronLeft, ITrash, IPlus } from './Icons.jsx'
import { GlassCard, Button } from './Primitives.jsx'

const IS_DEV_MODE = (import.meta.env.VITE_SUPABASE_URL || '').includes('placeholder')

const STATUS_LABELS = {
  pending: { label: 'Menunggu', pill: 'pill-amber' },
  approved: { label: 'Lolos Admin', pill: 'pill-ok' },
  needs_review: { label: 'Perlu Verifikasi', pill: 'pill-tosca' },
  rejected: { label: 'Ditolak', pill: 'pill-danger' },
}

const ALL_TABS = ['Semua', 'Menunggu', 'Lolos Admin', 'Perlu Verifikasi', 'Ditolak']
const TAB_FILTER = {
  'Semua': null,
  'Menunggu': 'pending',
  'Lolos Admin': 'approved',
  'Perlu Verifikasi': 'needs_review',
  'Ditolak': 'rejected',
}

function useSubmissions() {
  const [submissions, setSubmissions] = React.useState([])

  const fetchSubmissions = React.useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('etos_submissions') || '[]')
      const mapped = raw.filter(d => d.is_submitted).map(d => ({
        ...d,
        _idx: d._localId || d.registrationNumber || crypto.randomUUID(),
        fotoProfil:        d.photoFile?.url || null,
        kkFile:            d.kkFile?.url || null,
        admissionProofFile: d.admissionProofFile?.url || null,
        ijazahFile:        d.ijazahFile?.url || null,
        achievements:      d.achievements || [],
        organizations:     d.organizations || [],
        status:            d.status || 'pending',
      }))
      setSubmissions(mapped)
    } catch (e) { console.error('useSubmissions error:', e) }
  }, [])

  React.useEffect(() => {
    fetchSubmissions()
    // Tangkap perubahan dari tab lain
    window.addEventListener('storage', fetchSubmissions)
    return () => window.removeEventListener('storage', fetchSubmissions)
  }, [fetchSubmissions])

  const updateStatus = (idx, status) => {
    setSubmissions(prev => prev.map(s => s._idx === idx ? { ...s, status } : s))
    try {
      // Update etos_submissions (dibaca admin)
      const raw = JSON.parse(localStorage.getItem('etos_submissions') || '[]')
      const updated = raw.map(s => (s._localId || s.registrationNumber) === idx ? { ...s, status } : s)
      localStorage.setItem('etos_submissions', JSON.stringify(updated))

      // Sync ke etos_form (dibaca dashboard user) — hanya jika submission ini milik user aktif di browser yang sama
      const userForm = JSON.parse(localStorage.getItem('etos_form') || 'null')
      if (userForm && (userForm._localId === idx || userForm.registrationNumber === idx)) {
        localStorage.setItem('etos_form', JSON.stringify({ ...userForm, status }))
      }
    } catch {}
  }

  return { submissions, updateStatus, refresh: fetchSubmissions }
}

function StatusPill({ status }) {
  const info = STATUS_LABELS[status] || STATUS_LABELS.pending
  return <span className={`pill ${info.pill}`}>{info.label}</span>
}

function ActionConfirmModal({ action, onConfirm, onCancel, mobile }) {
  return (
    <div className="modal-backdrop" style={{ zIndex: 10001 }} onClick={onCancel}>
      <GlassCard
        onClick={e => e.stopPropagation()}
        style={{ width: 340, padding: 32, textAlign: 'center' }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: action === 'approved' ? 'var(--tosca-100)' : 'var(--danger-50)',
          color: action === 'approved' ? 'var(--tosca-700)' : 'var(--danger-500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
        }}>
          {action === 'approved' ? <ICheck size={28} /> : <IX size={28} />}
        </div>

        <h3 style={{ fontSize: 20, marginBottom: 8 }}>
          {action === 'approved' ? 'Loloskan Pendaftar?' : 'Tolak Pendaftar?'}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ink-600)', marginBottom: 28, lineHeight: 1.5 }}>
          {action === 'approved' 
            ? 'Pendaftar akan dinyatakan Lolos Administrasi dan statusnya akan diperbarui secara real-time.' 
            : 'Pendaftar akan dinyatakan Tidak Lolos dan statusnya akan diperbarui secara real-time.'}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="ghost" block onClick={onCancel}>Batal</Button>
          <Button variant={action === 'approved' ? 'primary' : 'danger'} block onClick={onConfirm}>
            Ya, Konfirmasi
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}

const formatRp = (raw) => {
  const n = parseInt(String(raw || '').replace(/\D/g, ''), 10)
  return isNaN(n) ? '—' : 'Rp ' + n.toLocaleString('id-ID')
}

function SectionCard({ title, children, padding = 20 }) {
  return (
    <GlassCard style={{ padding, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>{title}</div>
      {children}
    </GlassCard>
  );
}

function AdminDetailPage({ submission, onBack, setConfirmAction, mobile }) {
  const [lightboxObj, setLightboxObj] = React.useState(null);
  const [verif, setVerif] = React.useState({ checks: {}, notes: {} })

  // Load saved verification state for this submission
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`etos_verification_${submission._idx}`) || 'null')
      setVerif(saved?.checks ? { checks: saved.checks, notes: saved.notes || {} } : { checks: {}, notes: {} })
    } catch { setVerif({ checks: {}, notes: {} }) }
  }, [submission._idx])

  const saveVerif = React.useCallback((next) => {
    try {
      localStorage.setItem(`etos_verification_${submission._idx}`, JSON.stringify({ ...next, savedAt: new Date().toISOString() }))
    } catch {}
  }, [submission._idx])

  const toggleCheck = React.useCallback((id) => {
    setVerif(prev => {
      const next = { ...prev, checks: { ...prev.checks, [id]: !prev.checks[id] } }
      saveVerif(next)
      return next
    })
  }, [saveVerif])

  const setNote = React.useCallback((id, value) => {
    setVerif(prev => {
      const next = { ...prev, notes: { ...prev.notes, [id]: value } }
      saveVerif(next)
      return next
    })
  }, [saveVerif])

  const kv = React.useCallback((label, value) => (
    <div className="kv">
      <div className="kv-label">{label}</div>
      <div className="kv-value">{value || <span className="muted">—</span>}</div>
    </div>
  ), []);

  // Close lightbox on Escape key
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setLightboxObj(null);
    };
    if (lightboxObj) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [lightboxObj]);

  return (
    <div className="dash-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          aria-label="Kembali ke Daftar Pendaftar"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          type="button"
        >
          <IChevronLeft size={16} /> Kembali ke Daftar
        </button>
      </div>

      <GlassCard style={{ padding: mobile ? 16 : 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {submission.fotoProfil ? (
            <img
              src={submission.fotoProfil}
              alt={`Foto Profil ${submission.fullName}`}
              onClick={() => setLightboxObj({ url: submission.fotoProfil, title: 'Pas Foto Profil' })}
              style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ink-200)', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                background: 'var(--ink-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: 'var(--ink-400)',
                textAlign: 'center',
                border: '1px solid var(--ink-200)',
                flexShrink: 0,
              }}
            >
              Tanpa<br />Foto
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Detail Pendaftar
            </div>
            <h2 style={{ fontSize: 22, marginBottom: 6 }}>{submission.fullName}</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 13, color: 'var(--ink-600)' }}>
                {submission.registrationNumber || 'ETOS-26-DEMO'}
              </span>
              <StatusPill status={submission.status || 'pending'} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Verifikasi Awal ── */}
      <SectionCard title="Verifikasi Awal">
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
          marginBottom: 14, padding: '8px 12px',
          background: 'rgba(12, 94, 89, 0.06)',
          borderRadius: 10,
          border: '1px solid rgba(12, 94, 89, 0.12)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--tosca-700)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Skrining eligibilitas onboarding
          </span>
          <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>
            — data ini diisi saat pertama kali pendaftar masuk ke sistem
          </span>
        </div>
        <div className="kv-grid">
          {kv('Tahun lulus SMA / MA', submission.graduationYear)}
          {kv('Agama (konfirmasi Islam)', submission.religion || 'Islam')}
          {kv('Kampus tujuan', submission.province)}
          {kv('Program studi', submission.studyProgram)}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {submission.ijazahFile
            ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.ijazahFile, title: 'Scan Ijazah SMA / MA' })}>Lihat Ijazah SMA</Button>
            : <span className="muted" style={{ fontSize: 13 }}>Ijazah SMA: tidak diunggah</span>}
          {submission.admissionProofFile
            ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.admissionProofFile, title: 'Bukti SNBP / SNBT' })}>Lihat Bukti SNBP/SNBT</Button>
            : <span className="muted" style={{ fontSize: 13 }}>Bukti SNBP/SNBT: tidak diunggah</span>}
        </div>
        <VerifyBlock
          checks={verif.checks}
          notes={verif.notes}
          onToggle={toggleCheck}
          onNote={setNote}
          items={[
            { id: 'ijazah_valid', label: 'Bukti Ijazah valid' },
            { id: 'snbt_valid',   label: 'Bukti SNBP/SNBT valid' },
          ]}
        />
      </SectionCard>

      {/* ── Data Pribadi ── */}
      <SectionCard title="Data Pribadi">
        <div className="kv-grid">
          {kv('Nama lengkap',    submission.fullName)}
          {kv('Nama panggilan',  submission.nickname)}
          {kv('NIK',             submission.nik)}
          {kv('No. Kartu Keluarga', submission.noKK)}
          {kv('Tempat, tgl lahir', submission.birthPlace && submission.birthDate ? `${submission.birthPlace}, ${submission.birthDate}` : '')}
          {kv('Jenis kelamin',   submission.gender)}
          {kv('Agama',           submission.religion)}
          {kv('Email',           submission.email)}
          {kv('Telepon (WA)',    submission.phone)}
          {kv('Instagram',       submission.instagram)}
          {kv('Domisili', [submission.domisiliKecamatan, submission.domisiliKota, submission.domisiliProvinsi].filter(Boolean).join(', '))}
          {kv('Kampus tujuan',   submission.province)}
          {kv('Program studi',   submission.studyProgram)}
          <div className="kv" style={{ gridColumn: '1 / -1' }}>
            <div className="kv-label">Alamat lengkap</div>
            <div className="kv-value">{submission.address || <span className="muted">—</span>}</div>
          </div>
        </div>
        <VerifyBlock
          checks={verif.checks}
          notes={verif.notes}
          onToggle={toggleCheck}
          onNote={setNote}
          items={[
            { id: 'foto_valid', label: 'Foto Profil valid' },
            { id: 'ig_valid',   label: 'Instagram valid' },
          ]}
        />
      </SectionCard>

      {/* ── Keluarga ── */}
      <SectionCard title="Keluarga">
        <div className="kv-grid">
          {kv('Status pernikahan orang tua', submission.familyStatus)}
          {kv('Nama ayah',      submission.fatherName)}
          {kv('Kondisi ayah',   submission.fatherCondition)}
          {kv('Pekerjaan ayah', submission.fatherCondition === 'Wafat' ? 'Tidak Bekerja (Wafat)' : (submission.fatherJob === 'Lainnya' ? `Lainnya — ${submission.fatherJobOther}` : submission.fatherJob))}
          {kv('Nama ibu',       submission.motherName)}
          {kv('Kondisi ibu',    submission.motherCondition)}
          {kv('Pekerjaan ibu',  submission.motherCondition === 'Wafat' ? 'Tidak Bekerja (Wafat)' : (submission.motherJob === 'Lainnya' ? `Lainnya — ${submission.motherJobOther}` : submission.motherJob))}
          {submission.guardianName && kv('Nama wali',     submission.guardianName)}
          {submission.guardianName && kv('Pekerjaan wali', submission.guardianJob === 'Lainnya' ? `Lainnya — ${submission.guardianJobOther}` : submission.guardianJob)}
          <div className="kv" style={{ gridColumn: '1 / -1' }}>
            <div className="kv-label">Kartu Keluarga</div>
            <div className="kv-value">
              {submission.kkFile
                ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.kkFile, title: 'Kartu Keluarga' })}>Lihat Dokumen KK</Button>
                : <span className="muted">Tidak diunggah</span>}
            </div>
          </div>
        </div>
        <VerifyBlock
          checks={verif.checks}
          notes={verif.notes}
          onToggle={toggleCheck}
          onNote={setNote}
          items={[
            { id: 'kk_valid', label: 'Kartu Keluarga valid' },
          ]}
        />
      </SectionCard>

      {/* ── Kondisi Ekonomi ── */}
      <SectionCard title="Kondisi Ekonomi">
        <div className="kv-grid">
          {kv('Penanggung kehidupan',  submission.mainProvider)}
          {kv('Pendapatan ayah/bulan', formatRp(submission.fatherIncomeAmount))}
          {kv('Pendapatan ibu/bulan',  formatRp(submission.motherIncomeAmount))}
          {kv('Pendapatan wali/bulan', formatRp(submission.guardianIncomeAmount))}
          {kv('Status rumah',   submission.houseStatus)}
          {kv('Daya listrik',   submission.electricPower)}
          {kv('Motor / roda 2',   String(submission.vehicleBike  ?? 0))}
          {kv('Mobil / roda 3–4', String(submission.vehicleCar   ?? 0))}
          {kv('Kendaraan lainnya', String(submission.vehicleOther ?? 0))}
          {kv('BPJS aktif',     String(submission.bpjsActiveCount   ?? 0))}
          {kv('BPJS non-aktif', String(submission.bpjsInactiveCount ?? 0))}
          {kv('KIP / Beasiswa', submission.kipStatus)}
        </div>

        {/* Komposisi tanggungan */}
        <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--ink-50)', borderRadius: 10, border: '1px solid var(--ink-100)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-500)', marginBottom: 10 }}>
            Komposisi Tanggungan Keluarga
          </div>
          <div className="kv-grid">
            {kv('Saya sendiri (pemohon)',     '1')}
            {kv('Kepala keluarga (ayah)',     submission.fatherCondition === 'Hidup' ? '1' : '0')}
            {kv('Ibu rumah tangga',           submission.motherCondition === 'Hidup' ? '1' : '0')}
            {kv('Saudara dewasa bekerja',     String(submission.adultSiblingsWorking    ?? 0))}
            {kv('Saudara dewasa tdk bekerja', String(submission.adultSiblingsNotWorking ?? 0))}
            {kv('Saudara SMA/SMP',            String(submission.siblingsHighSchool      ?? 0))}
            {kv('Saudara SD/Bayi',            String(submission.siblingsElementary      ?? 0))}
            {kv('Kakek / Nenek',              String(submission.grandparentsCount        ?? 0))}
          </div>
        </div>

        {/* Foto rumah & dapur */}
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {submission.housePhotoFile?.url
            ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.housePhotoFile.url, title: 'Foto Tampak Depan Rumah' })}>Lihat Foto Rumah</Button>
            : <span className="muted" style={{ fontSize: 13 }}>Foto rumah: tidak diunggah</span>}
          {submission.kitchenPhotoFile?.url
            ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.kitchenPhotoFile.url, title: 'Foto Ruangan Dapur' })}>Lihat Foto Dapur</Button>
            : <span className="muted" style={{ fontSize: 13 }}>Foto dapur: tidak diunggah</span>}
        </div>
        <VerifyBlock
          checks={verif.checks}
          notes={verif.notes}
          onToggle={toggleCheck}
          onNote={setNote}
          items={[
            { id: 'foto_rumah_valid',  label: 'Foto Rumah valid' },
            { id: 'foto_dapur_valid',  label: 'Foto Dapur valid' },
          ]}
        />
      </SectionCard>

      {/* Prestasi */}
      {submission.achievements && submission.achievements.length > 0 && (
        <SectionCard title={`Prestasi (${submission.achievements.length})`}>
          {submission.achievements.map((a, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--ink-50)', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                {[a.rank, a.level, a.year, a.issuer].filter(Boolean).join(' · ')}
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* Organisasi */}
      {submission.organizations && submission.organizations.length > 0 && (
        <SectionCard title={`Organisasi (${submission.organizations.length})`}>
          {submission.organizations.map((o, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--ink-50)', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {o.name} <span style={{ color: 'var(--ink-500)', fontWeight: 500 }}>· {o.role}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{o.period}</div>
              {o.description && (
                <div style={{ fontSize: 12, color: 'var(--ink-600)', marginTop: 4 }}>{o.description}</div>
              )}
            </div>
          ))}
        </SectionCard>
      )}

      {/* Esai */}
      <SectionCard title="Esai">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['Alasan', submission.motivation], ['Rencana studi & karir', submission.futurePlan], ['Kontribusi daerah', submission.contribution]].map(([k, v], i) => (
            <div key={i}>
              <div className="kv-label" style={{ marginBottom: 6 }}>{k}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-800)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {v || <span className="muted">—</span>}
              </div>
            </div>
          ))}
        </div>
        <VerifyBlock
          checks={verif.checks}
          notes={verif.notes}
          onToggle={toggleCheck}
          onNote={setNote}
          items={[
            { id: 'esai_orisinal', label: 'Esai terlihat orisinil' },
            { id: 'esai_relevan',  label: 'Esai terlihat relevan' },
          ]}
        />
      </SectionCard>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        <Button variant="primary" size="sm" onClick={() => setConfirmAction({ id: submission._idx, status: 'approved' })}>
          <ICheck size={14} /> Loloskan Administrasi
        </Button>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="sm" style={{ color: 'var(--danger-500)' }} onClick={() => setConfirmAction({ id: submission._idx, status: 'rejected' })}>
          Tolak
        </Button>
      </div>

      {/* Lightbox */}
      {lightboxObj && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxObj(null)}
          style={{ zIndex: 9999 }}
        >
          <div
            style={{
              background: 'var(--glass-bg)',
              padding: 16,
              borderRadius: 16,
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-xl)',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 600 }}>{lightboxObj.title}</div>
              <button
                type="button"
                aria-label="Tutup preview"
                onClick={() => setLightboxObj(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <IX size={20} />
              </button>
            </div>
            {lightboxObj.url.endsWith('pdf') ? (
              <iframe
                src={lightboxObj.url}
                title="Document PDF"
                style={{ minWidth: 600, minHeight: 400, border: 'none', borderRadius: 8, background: '#fff' }}
              />
            ) : (
              <img src={lightboxObj.url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline Verification Checklist ───────────────────────────────────
function VerifyBlock({ items, checks, notes, onToggle, onNote }) {
  const allDone = items.every(({ id }) => !!checks[id])
  return (
    <div style={{
      marginTop: 14, padding: '12px 14px',
      background: allDone ? 'rgba(12, 94, 89, 0.07)' : 'rgba(12, 94, 89, 0.04)',
      borderRadius: 10,
      border: `1px solid ${allDone ? 'rgba(12, 94, 89, 0.25)' : 'rgba(12, 94, 89, 0.12)'}`,
      transition: 'background .2s, border-color .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tosca-700)' }}>
          Ceklis Verifikasi
        </span>
        {allDone && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--tosca-600)', fontWeight: 600 }}>
            <ICheck size={12} /> Selesai
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(({ id, label }) => {
          const done = !!checks[id]
          const note = notes?.[id] || ''
          return (
            <div key={id} style={{
              borderRadius: 8,
              background: done ? 'rgba(12, 94, 89, 0.1)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${done ? 'rgba(12, 94, 89, 0.2)' : 'var(--ink-100)'}`,
              transition: 'background .15s, border-color .15s',
              overflow: 'hidden',
            }}>
              {/* Row: checkbox + label */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                padding: '7px 10px',
              }}>
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onToggle(id)}
                  style={{ width: 16, height: 16, accentColor: 'var(--tosca-600)', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{
                  fontSize: 13, flex: 1,
                  color: done ? 'var(--tosca-800)' : 'var(--ink-700)',
                  fontWeight: done ? 600 : 400,
                  textDecoration: done ? 'line-through' : 'none',
                  textDecorationColor: 'var(--tosca-500)',
                  transition: 'color .15s, text-decoration .15s',
                }}>
                  {label}
                </span>
                {done && <ICheck size={14} style={{ color: 'var(--tosca-600)', flexShrink: 0 }} />}
              </label>
              {/* Note input — slides in when checked */}
              {done && (
                <div style={{ padding: '0 10px 8px 36px' }}>
                  <input
                    type="text"
                    placeholder="Tambah catatan… (opsional)"
                    value={note}
                    onChange={e => onNote(id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: '100%', fontSize: 12, padding: '5px 10px',
                      borderRadius: 6, border: '1px solid rgba(12, 94, 89, 0.25)',
                      background: 'rgba(255,255,255,0.7)',
                      color: 'var(--ink-700)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Konfigurasi Form Panel ──────────────────────────────────────────
function KonfigurasiPanel({ mobile }) {
  const { config, refresh } = useFormConfig()
  const [section, setSection] = React.useState('timeline')
  const [draft, setDraft] = React.useState(() => JSON.parse(JSON.stringify(config)))
  const [saving, setSaving] = React.useState(false)
  const [saveMsg, setSaveMsg] = React.useState('')

  React.useEffect(() => { setDraft(JSON.parse(JSON.stringify(config))) }, [config])

  const saveKey = (key, value) => {
    try {
      const existing = JSON.parse(localStorage.getItem('etos_config_overrides') || '{}')
      existing[key] = value
      localStorage.setItem('etos_config_overrides', JSON.stringify(existing))
      refresh() // update context in-memory
      setSaveMsg('Tersimpan! Berlaku setelah refresh.')
    } catch (e) { setSaveMsg('Gagal: ' + e.message) }
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const setDraftField = (path, value) => {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return next
    })
  }

  const CONFIG_SECTIONS = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'jadwal',   label: 'Jadwal Seleksi' },
  ]

  const renderTimeline = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        ['registration_start', 'Mulai Pendaftaran'],
        ['registration_end',   'Tutup Pendaftaran'],
      ].map(([key, label]) => (
        <div key={key}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</div>
          <input type="datetime-local"
            value={(draft.timeline?.[key] || '').slice(0, 16)}
            onChange={e => setDraftField(`timeline.${key}`, e.target.value + ':00')}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ink-200)', fontSize: 14, width: '100%', maxWidth: 280 }} />
        </div>
      ))}
      <Button variant="primary" size="sm" loading={saving} onClick={() => saveKey('timeline', draft.timeline)} style={{ alignSelf: 'flex-start' }}>
        <ISave size={14} /> Simpan Timeline
      </Button>
    </div>
  )

  const renderJadwal = () => {
    const stages = draft.selection_stages || []

    const addStage = () =>
      setDraft(prev => ({ ...prev, selection_stages: [...(prev.selection_stages || []), { title: '', date: '', status: 'upcoming' }] }))

    const removeStage = (i) =>
      setDraft(prev => ({ ...prev, selection_stages: (prev.selection_stages || []).filter((_, idx) => idx !== i) }))

    const updateStage = (i, field, value) =>
      setDraft(prev => ({
        ...prev,
        selection_stages: (prev.selection_stages || []).map((s, idx) => idx === i ? { ...s, [field]: value } : s),
      }))

    const STATUS_OPTS = [
      { value: 'upcoming', label: 'Akan Datang' },
      { value: 'ongoing',  label: 'Sedang Berjalan' },
      { value: 'done',     label: 'Selesai' },
    ]

    const inputStyle = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ink-200)', fontSize: 13, width: '100%', background: 'var(--surface)', color: 'var(--ink-900)' }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0, lineHeight: 1.6 }}>
          Jadwal ini tampil di dashboard user setelah pendaftaran terkirim.
          Jika dikosongkan, dashboard akan menampilkan pesan <em>"Jadwal belum dikonfigurasi"</em>.
        </p>

        {stages.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', background: 'var(--ink-50)', borderRadius: 12, border: '2px dashed var(--ink-200)', color: 'var(--ink-400)', fontSize: 13 }}>
            Belum ada tahap. Klik tombol di bawah untuk mulai menambahkan.
          </div>
        )}

        {stages.map((stage, i) => (
          <div key={i} style={{ padding: 16, background: 'var(--ink-50)', borderRadius: 12, border: '1px solid var(--ink-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-500)' }}>
                Tahap {i + 1}
              </div>
              <button onClick={() => removeStage(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-500)', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}
                title="Hapus tahap ini">
                <ITrash size={15} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 5, color: 'var(--ink-600)' }}>Nama Tahap</div>
                <input value={stage.title} onChange={e => updateStage(i, 'title', e.target.value)}
                  placeholder="cth: Seleksi Administrasi" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 5, color: 'var(--ink-600)' }}>Tanggal / Periode</div>
                <input value={stage.date} onChange={e => updateStage(i, 'date', e.target.value)}
                  placeholder="cth: 1–31 Juli 2026" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 5, color: 'var(--ink-600)' }}>Status</div>
                <select value={stage.status} onChange={e => updateStage(i, 'status', e.target.value)} style={inputStyle}>
                  {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}

        <button onClick={addStage}
          style={{ padding: '9px 16px', borderRadius: 10, border: '1px dashed var(--tosca-400)', background: 'var(--tosca-50)', color: 'var(--tosca-700)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start' }}>
          <IPlus size={14} /> Tambah Tahap
        </button>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderTop: '1px solid var(--ink-100)', paddingTop: 14 }}>
          <Button variant="primary" size="sm" loading={saving}
            onClick={() => saveKey('selection_stages', draft.selection_stages || [])}
            style={{ alignSelf: 'flex-start' }}>
            <ISave size={14} /> Simpan Jadwal
          </Button>
          {(draft.selection_stages !== null && draft.selection_stages !== undefined) && (
            <button onClick={() => { setDraft(prev => ({ ...prev, selection_stages: null })); saveKey('selection_stages', null) }}
              style={{ fontSize: 12, color: 'var(--danger-500)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
              Reset ke "Belum dikonfigurasi"
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {saveMsg && (
        <div style={{ marginBottom: 12, padding: '8px 14px', background: 'var(--tosca-50)', border: '1px solid var(--tosca-200)', borderRadius: 8, fontSize: 13, color: 'var(--tosca-700)' }}>
          {saveMsg}
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div style={{ width: mobile ? '100%' : 200, flexShrink: 0 }}>
          <GlassCard style={{ padding: 12 }}>
            {CONFIG_SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: 4,
                  borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: section === s.id ? 700 : 500,
                  background: section === s.id ? 'var(--tosca-50)' : 'transparent',
                  color: section === s.id ? 'var(--tosca-700)' : 'var(--ink-600)',
                  borderLeft: section === s.id ? '3px solid var(--tosca-600)' : '3px solid transparent',
                }}>
                {s.label}
              </button>
            ))}
          </GlassCard>
        </div>
        {/* Content */}
        <GlassCard style={{ flex: 1, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
            {CONFIG_SECTIONS.find(s => s.id === section)?.label}
          </div>
          {section === 'timeline' && renderTimeline()}
          {section === 'jadwal'   && renderJadwal()}
        </GlassCard>
      </div>
    </div>
  )
}

// ─── Pendaftar Panel (extracted from old AdminPanel) ─────────────────
function PendaftarPanel({ mobile }) {
  const { submissions, updateStatus } = useSubmissions()
  const [activeTab, setActiveTab] = React.useState('Semua')
  const [detailId, setDetailId] = React.useState(null)
  const [confirmAction, setConfirmAction] = React.useState(null)

  const filterStatus = TAB_FILTER[activeTab]
  const filtered = filterStatus
    ? submissions.filter((s) => (s.status || 'pending') === filterStatus)
    : submissions

  const counts = ALL_TABS.reduce((acc, tab) => {
    const f = TAB_FILTER[tab]
    acc[tab] = f ? submissions.filter((s) => (s.status || 'pending') === f).length : submissions.length
    return acc
  }, {})

  if (detailId !== null) {
    const sub = submissions.find(s => s._idx === detailId)
    if (sub) return (
      <>
        <AdminDetailPage
          submission={sub}
          onBack={() => setDetailId(null)}
          setConfirmAction={setConfirmAction}
          mobile={mobile}
        />
        {confirmAction && (
          <ActionConfirmModal
            action={confirmAction.status}
            onCancel={() => setConfirmAction(null)}
            onConfirm={() => {
              updateStatus(confirmAction.id, confirmAction.status)
              setConfirmAction(null)
              setDetailId(null)
            }}
            mobile={mobile}
          />
        )}
      </>
    )
  }

  return (
    <div className="dash-wrap">
      <GlassCard className="dash-hero-card" style={{ padding: mobile ? '22px 20px' : '28px 32px' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Panel Admin</div>
          <h1>Manajemen Pendaftaran</h1>
          <p style={{ color: 'var(--ink-600)', marginTop: 6 }}>
            Tinjau dan triage pendaftaran masuk secara real-time dari database Supabase.
          </p>
        </div>
      </GlassCard>

      <div className="dash-grid">
        {Object.entries({ 'Total': submissions.length, 'Menunggu': counts['Menunggu'], 'Lolos': counts['Lolos Admin'], 'Ditolak': counts['Ditolak'] }).map(([k, v]) => (
          <div key={k} className="dash-info">
            <div className="dash-info-label">{k}</div>
            <div className="dash-info-value">{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
        {ALL_TABS.map((tab) => (
          <button key={tab}
            className={`proto-chip ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {tab} <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 4 }}>({counts[tab]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <h3 style={{ marginBottom: 8 }}>
            {submissions.length === 0 ? 'Belum ada pendaftaran masuk' : 'Tidak ada data di tab ini'}
          </h3>
          <p className="muted" style={{ fontSize: 14, maxWidth: 480, margin: '0 auto 20px' }}>
            {submissions.length === 0
              ? 'Pendaftaran akan muncul di sini secara otomatis setelah pelamar mengirimkan formulir.'
              : 'Coba pilih tab lain atau refresh data.'}
          </p>

          {submissions.length === 0 && (
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: 16, maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ color: 'var(--amber-600)', marginTop: 2 }}><IAlert size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--amber-700)', marginBottom: 4 }}>Bantuan: Data tidak muncul?</div>
                  <p style={{ fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.5 }}>
                    Jika Anda yakin sudah ada data di Supabase tapi di sini tetap kosong, kemungkinan besar karena **Row Level Security (RLS)** di Supabase belum dikonfigurasi untuk mengizinkan akses Admin.
                  </p>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-600)' }}>
                    Pastikan Anda sudah menambahkan policy <code>SELECT USING (true)</code> untuk tabel <code>applicants</code> di SQL Editor Supabase.
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((s) => (
            <GlassCard key={s._idx} style={{ padding: mobile ? '12px 14px' : '14px 20px' }}>
              <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'stretch' : 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.fullName || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                    <span className="mono">{s.registrationNumber || 'ETOS-26-DEMO'}</span>
                    {' · '}{s.province || '—'}
                    {s.submittedAt && !mobile && <> · {s.submittedAt}</>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTop: mobile ? '1px solid var(--ink-100)' : 'none', paddingTop: mobile ? 10 : 0 }}>
                  <StatusPill status={s.status || 'pending'} />
                  <Button variant="outline-tosca" size="sm" onClick={() => setDetailId(s._idx)}>
                    Detail
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {confirmAction && (
        <ActionConfirmModal
          action={confirmAction.status}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            updateStatus(confirmAction.id, confirmAction.status)
            setConfirmAction(null)
            setDetailId(null)
          }}
          mobile={mobile}
        />
      )}
    </div>
  )
}

// ─── AdminPanel: top-level wrapper with tab navigation ───────────────
export function AdminPanel({ mobile }) {
  const [panelTab, setPanelTab] = React.useState('pendaftar')

  const PANEL_TABS = [
    { id: 'pendaftar',   label: 'Pendaftar' },
    { id: 'konfigurasi', label: 'Konfigurasi Form' },
  ]

  return (
    <div className="admin-panel-wrap">
      {/* Panel Tab Navigation */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 4, borderBottom: '2px solid var(--ink-100)' }}>
        {PANEL_TABS.map(tab => (
          <button key={tab.id} onClick={() => setPanelTab(tab.id)}
            style={{
              padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: panelTab === tab.id ? 700 : 500,
              color: panelTab === tab.id ? 'var(--tosca-700)' : 'var(--ink-500)',
              borderBottom: panelTab === tab.id ? '2px solid var(--tosca-600)' : '2px solid transparent',
              marginBottom: -2, transition: 'color .15s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {panelTab === 'pendaftar'   && <PendaftarPanel mobile={mobile} />}
      {panelTab === 'konfigurasi' && <KonfigurasiPanel mobile={mobile} />}
    </div>
  )
}
