// Admin.jsx — Admin panel: view & triage submitted applications
import React from 'react'
import { useFormConfig } from './lib/FormConfigContext.jsx'
import { DEFAULT_CONFIG } from './lib/defaultConfig.js'
import { saveConfigKey } from './lib/formConfig.js'
import { supabase } from './lib/supabase.js'
import { dbToForm } from './lib/applicant.js'
import { getSignedUrls } from './lib/storage.js'
import { fetchVerificationItems, fetchVerificationResults, saveVerificationResult } from './lib/verification.js'
import { ICheck, IX, ISave, IAlert, IChevronLeft, ITrash, IPlus } from './Icons.jsx'
import { GlassCard, Button } from './Primitives.jsx'


const STATUS_LABELS = {
  pending: { label: 'MENUNGGU', pill: 'pill-amber' },
  approved: { label: 'LOLOS ADMIN', pill: 'pill-ok' },
  needs_review: { label: 'PERLU VERIFIKASI', pill: 'pill-tosca' },
  rejected: { label: 'DITOLAK', pill: 'pill-danger' },
}

const ALL_TABS = ['SEMUA', 'MENUNGGU', 'LOLOS ADMIN', 'PERLU VERIFIKASI', 'DITOLAK']
const TAB_FILTER = {
  'SEMUA': null,
  'MENUNGGU': 'pending',
  'LOLOS ADMIN': 'approved',
  'PERLU VERIFIKASI': 'needs_review',
  'DITOLAK': 'rejected',
}

// Map doc_type → field name di submission object (legacy admin naming)
const DOC_TYPE_TO_SUB_FIELD = {
  photo:           'photoFile',
  kk:              'kkFile',
  ijazah:          'ijazahFile',
  admission_proof: 'admissionProofFile',
  house_photo:     'housePhotoFile',
  kitchen_photo:   'kitchenPhotoFile',
}

function mapApplicantRowToSubmission(row, achievements = [], organizations = [], documents = []) {
  // dbToForm sudah handle mapping scalar fields snake_case → camelCase
  const form = dbToForm(row)
  const sub = {
    ...form,
    _idx:               row.id,
    id:                 row.id,
    user_id:            row.user_id,
    is_submitted:       row.is_submitted === true,
    status:             row.status || 'pending',
    registrationNumber: row.registration_number || null,
    submittedAt:        form.submittedAt || null,
    photoFile:          null,
    kkFile:             null,
    admissionProofFile: null,
    ijazahFile:         null,
    housePhotoFile:     null,
    kitchenPhotoFile:   null,
    fotoProfil:         null,   // legacy alias untuk display avatar
    achievements: (achievements || []).map(a => ({
      title: a.title || '', level: a.level || '', rank: a.rank || '',
      year: a.year ? String(a.year) : '', issuer: a.issuer || '',
    })),
    organizations: (organizations || []).map(o => ({
      name: o.name || '', role: o.role || '', period: o.period || '',
      description: o.description || '',
    })),
    // Map kolom skoring & Had Kifayah eksplisit
    hkPriority:         row.hk_priority,
    hkGap:              row.hk_gap,
    totalHadKifayah:    row.total_had_kifayah,
    totalIncome:        row.total_income,
    grandScore:         row.grand_score,
    skorPrestasi:       row.skor_prestasi,
    skorOrganisasi:     row.skor_organisasi,
    // Map rincian 7 dimensi
    dimIbadah:          row.dim_ibadah,
    dimPangan:          row.dim_pangan,
    dimPakaian:         row.dim_pakaian,
    dimTempatTinggal:   row.dim_tempat_tinggal,
    dimKesehatan:       row.dim_kesehatan,
    dimPendidikan:      row.dim_pendidikan,
    dimTransportasi:    row.dim_transportasi,
  }
  // Inject documents
  for (const doc of documents || []) {
    const field = DOC_TYPE_TO_SUB_FIELD[doc.doc_type]
    if (!field) continue
    sub[field] = {
      url:  doc._signedUrl,
      path: doc.storage_path,
      name: doc.file_name,
      size: doc.file_size,
      mime: doc.mime_type,
    }
    if (doc.doc_type === 'photo') sub.fotoProfil = doc._signedUrl
  }
  return sub
}

function useSubmissions() {
  const [submissions, setSubmissions] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  const fetchSubmissions = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('is_submitted', true)
        .order('submitted_at', { ascending: false })
      if (error) throw error
      if (!rows || rows.length === 0) { setSubmissions([]); return }

      const ids = rows.map(r => r.id)
      const [{ data: ach = [] }, { data: orgs = [] }, { data: docs = [] }] = await Promise.all([
        supabase.from('achievements').select('*').in('applicant_id', ids).order('sort_order'),
        supabase.from('organizations').select('*').in('applicant_id', ids).order('sort_order'),
        supabase.from('documents').select('*').in('applicant_id', ids),
      ])

      // Bulk-fetch signed URLs untuk semua dokumen sekali jalan
      const urlMap = await getSignedUrls((docs || []).map(d => d.storage_path))
      const docsWithUrls = (docs || []).map(d => ({ ...d, _signedUrl: urlMap[d.storage_path] || null }))

      const mapped = rows.map(r => {
        const a = (ach || []).filter(x => x.applicant_id === r.id)
        const o = (orgs || []).filter(x => x.applicant_id === r.id)
        const d = docsWithUrls.filter(x => x.applicant_id === r.id)
        return mapApplicantRowToSubmission(r, a, o, d)
      })
      setSubmissions(mapped)
    } catch (e) {
      console.error('useSubmissions error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSubmissions()
    // Realtime: refetch saat ada submission baru / status update
    const channel = supabase
      .channel('admin_applicants_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applicants' }, () => fetchSubmissions())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchSubmissions])

  // updateStatus(applicantId, status): UPDATE applicants → trigger DB akan audit log + queue email
  const updateStatus = async (applicantId, status) => {
    // Optimistic UI
    setSubmissions(prev => prev.map(s => s._idx === applicantId ? { ...s, status } : s))
    const { error } = await supabase
      .from('applicants')
      .update({ status })
      .eq('id', applicantId)
    if (error) {
      console.error('updateStatus error:', error)
      // Rollback dengan refetch
      fetchSubmissions()
      alert('Gagal update status: ' + error.message)
    }
  }

  return { submissions, loading, updateStatus, refresh: fetchSubmissions }
}

function StatusPill({ status }) {
  const info = STATUS_LABELS[status] || STATUS_LABELS.pending
  return <span className={`pill ${info.pill}`}>{info.label}</span>
}

function PriorityPill({ priority }) {
  if (!priority) return null
  let cls = 'pill-ink'
  if (priority === 'PRIORITAS 1') cls = 'pill-danger'
  if (priority === 'PRIORITAS 2') cls = 'pill-amber'
  if (priority === 'PRIORITAS 3') cls = 'pill-tosca'
  return <span className={`pill ${cls}`} style={{ fontSize: 10 }}>{priority}</span>
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
  const [verifItems, setVerifItems] = React.useState([]);
  const [verif, setVerif] = React.useState({ checks: {}, notes: {} })
  const saveTimer = React.useRef({})

  // Fetch items & results on mount
  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      const items = await fetchVerificationItems()
      if (cancelled) return
      setVerifItems(items)
      
      const results = await fetchVerificationResults(submission._idx)
      if (cancelled) return
      
      const checks = {}
      const notes = {}
      results.forEach(r => {
        checks[r.item_id] = r.status === 'valid'
        notes[r.item_id] = r.notes || ''
      })
      setVerif(prev => ({ ...prev, checks: { ...prev.checks, ...checks }, notes: { ...prev.notes, ...notes } }))
    }
    load()
    return () => { cancelled = true }
  }, [submission._idx])

  const triggerSave = React.useCallback((itemId, status, notes) => {
    if (saveTimer.current[itemId]) clearTimeout(saveTimer.current[itemId])
    saveTimer.current[itemId] = setTimeout(async () => {
      try {
        await saveVerificationResult({
          applicantId: submission._idx,
          itemId,
          status: status ? 'valid' : 'invalid',
          notes: notes || null
        })
      } catch (e) {
        console.error('Failed to save verif result:', e)
      }
    }, 800)
  }, [submission._idx])

  const toggleCheck = React.useCallback((id) => {
    setVerif(prev => {
      const isChecked = !prev.checks[id]
      const next = { ...prev, checks: { ...prev.checks, [id]: isChecked } }
      triggerSave(id, isChecked, next.notes[id])
      return next
    })
  }, [triggerSave])

  const setNote = React.useCallback((id, value) => {
    setVerif(prev => {
      const next = { ...prev, notes: { ...prev.notes, [id]: value } }
      triggerSave(id, prev.checks[id], value)
      return next
    })
  }, [triggerSave])

  const renderVerifyBlock = (step) => {
    const items = verifItems.filter(it => it.step === step)
    if (items.length === 0) return null
    return (
      <VerifyBlock
        checks={verif.checks}
        notes={verif.notes}
        onToggle={toggleCheck}
        onNote={setNote}
        items={items}
      />
    )
  }

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
          {submission.ijazahFile?.url
            ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.ijazahFile.url, title: 'SCAN IJAZAH SMA / MA' })}>LIHAT IJAZAH SMA</Button>
            : <span className="muted" style={{ fontSize: 13 }}>IJAZAH SMA: TIDAK DIUNGGAH</span>}
          {submission.admissionProofFile?.url
            ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.admissionProofFile.url, title: 'BUKTI SNBP / SNBT' })}>LIHAT BUKTI SNBP/SNBT</Button>
            : <span className="muted" style={{ fontSize: 13 }}>BUKTI SNBP/SNBT: TIDAK DIUNGGAH</span>}
        </div>
        {renderVerifyBlock('dokumen')}
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
        {renderVerifyBlock('data_pribadi')}
      </SectionCard>

      {/* ── Keluarga ── */}
      <SectionCard title="Keluarga">
        <div className="kv-grid">
          {kv('Status pernikahan orang tua', submission.familyStatus)}
          {kv('Nama ayah',      submission.fatherName)}
          {kv('Kondisi ayah',   submission.fatherCondition)}
          {kv('Pekerjaan ayah', submission.fatherCondition === 'Wafat' ? 'TIDAK BEKERJA (WAFAT)' : (submission.fatherJob === 'Lainnya' ? `LAINNYA — ${submission.fatherJobOther}` : (submission.fatherJob || '').toUpperCase()))}
          {kv('Nama ibu',       submission.motherName)}
          {kv('Kondisi ibu',    submission.motherCondition)}
          {kv('Pekerjaan ibu',  submission.motherCondition === 'Wafat' ? 'TIDAK BEKERJA (WAFAT)' : (submission.motherJob === 'Lainnya' ? `LAINNYA — ${submission.motherJobOther}` : (submission.motherJob || '').toUpperCase()))}
          {submission.guardianName && kv('Nama wali',     submission.guardianName)}
          {submission.guardianName && kv('Pekerjaan wali', submission.guardianJob === 'Lainnya' ? `LAINNYA — ${submission.guardianJobOther}` : (submission.guardianJob || '').toUpperCase())}
          <div className="kv" style={{ gridColumn: '1 / -1' }}>
            <div className="kv-label">Kartu Keluarga</div>
            <div className="kv-value">
              {submission.kkFile?.url
                ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.kkFile.url, title: 'Kartu Keluarga' })}>Lihat Dokumen KK</Button>
                : <span className="muted">Tidak diunggah</span>}
            </div>
          </div>
        </div>
        {renderVerifyBlock('data_keluarga')}
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
            ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.housePhotoFile.url, title: 'FOTO TAMPAK DEPAN RUMAH' })}>LIHAT FOTO RUMAH</Button>
            : <span className="muted" style={{ fontSize: 13 }}>FOTO RUMAH: TIDAK DIUNGGAH</span>}
          {submission.kitchenPhotoFile?.url
            ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.kitchenPhotoFile.url, title: 'FOTO RUANGAN DAPUR' })}>LIHAT FOTO DAPUR</Button>
            : <span className="muted" style={{ fontSize: 13 }}>FOTO DAPUR: TIDAK DIUNGGAH</span>}
        </div>
        {renderVerifyBlock('kondisi_ekonomi')}
      </SectionCard>

      {/* ── Analisis Had Kifayah ── */}
      <SectionCard title="Analisis Ekonomi & Had Kifayah">
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--tosca-50) 0%, #fff 100%)', borderRadius: 14, border: '1px solid var(--tosca-200)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tosca-700)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>Status Kelayakan</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PriorityPill priority={submission.hkPriority} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-700)' }}>
                  GAP: {formatRp(submission.hkGap)}
                </div>
              </div>
              
              {/* Rincian 7 Dimensi */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>Rincian 7 Dimensi (Standar BAZNAS)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['Ibadah',      submission.dimIbadah],
                    ['Pangan',      submission.dimPangan],
                    ['Pakaian',     submission.dimPakaian],
                    ['Tempat Tinggal', submission.dimTempatTinggal],
                    ['Kesehatan',   submission.dimKesehatan],
                    ['Pendidikan',  submission.dimPendidikan],
                    ['Transportasi', submission.dimTransportasi],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingBottom: 4, borderBottom: '1px solid var(--tosca-100)' }}>
                      <span style={{ color: 'var(--ink-600)' }}>{label}</span>
                      <span style={{ fontWeight: 500, color: 'var(--ink-800)' }}>{formatRp(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', background: 'rgba(255,255,255,0.5)', padding: 16, borderRadius: 12, border: '1px solid var(--tosca-100)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-500)' }}>Total Kebutuhan (HK)</span>
                <span style={{ fontWeight: 600 }}>{formatRp(submission.totalHadKifayah)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-500)' }}>Total Pendapatan</span>
                <span style={{ fontWeight: 600 }}>{formatRp(submission.totalIncome)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--tosca-200)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--tosca-700)', fontWeight: 800 }}>
                <span>Selisih (Defisit)</span>
                <span>{formatRp(submission.hkGap)}</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 8, fontStyle: 'italic', lineHeight: 1.4 }}>
                *Kalkulasi otomatis berdasarkan standar biaya hidup Provinsi {submission.domisiliProvinsi || submission.province}.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Prestasi */}
      {submission.achievements && submission.achievements.length > 0 && (
        <SectionCard title={`Prestasi (${submission.achievements.length})`}>
          <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 700, color: 'var(--tosca-700)' }}>
            SKOR PRESTASI: {submission.skorPrestasi || 0} / 100
          </div>
          {submission.achievements.map((a, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--ink-50)', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{(a.title || '').toUpperCase()}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                {[a.rank, a.level, a.year, a.issuer].filter(Boolean).map(s => String(s).toUpperCase()).join(' · ')}
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* Organisasi */}
      {submission.organizations && submission.organizations.length > 0 && (
        <SectionCard title={`Organisasi (${submission.organizations.length})`}>
          <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 700, color: 'var(--tosca-700)' }}>
            SKOR ORGANISASI: {submission.skorOrganisasi || 0} / 100
          </div>
          {submission.organizations.map((o, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--ink-50)', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {(o.name || '').toUpperCase()} <span style={{ color: 'var(--ink-500)', fontWeight: 500 }}>· {(o.role || '').toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{(o.period || '').toUpperCase()}</div>
              {o.description && (
                <div style={{ fontSize: 12, color: 'var(--ink-600)', marginTop: 4 }}>{(o.description || '').toUpperCase()}</div>
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
        {renderVerifyBlock('esai')}
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

  const saveKey = async (key, value) => {
    setSaving(true)
    setSaveMsg('')
    try {
      await saveConfigKey(key, value)
      // Tidak perlu manual refresh — realtime subscription di FormConfigContext akan auto-refetch.
      // Tapi panggil refresh() sebagai backup biar instan kelihatan di tab admin sendiri.
      refresh()
      setSaveMsg('Tersimpan ke Supabase. Berlaku untuk semua user.')
    } catch (e) {
      setSaveMsg('Gagal: ' + (e.message || 'Tidak diketahui'))
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 4000)
    }
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
      { value: 'upcoming', label: 'AKAN DATANG' },
      { value: 'ongoing',  label: 'SEDANG BERJALAN' },
      { value: 'done',     label: 'SELESAI' },
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
        {Object.entries({ 'Total': submissions.length, 'Menunggu': counts['MENUNGGU'] || 0, 'Lolos': counts['LOLOS ADMIN'] || 0, 'Ditolak': counts['DITOLAK'] || 0 }).map(([k, v]) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.fullName || '—'}</div>
                    <PriorityPill priority={s.hkPriority} />
                    {s.skorPrestasi > 0 && (
                      <span className="pill pill-ink" style={{ fontSize: 9, background: 'var(--tosca-600)', color: '#fff' }}>
                        P: {s.skorPrestasi}
                      </span>
                    )}
                    {s.skorOrganisasi > 0 && (
                      <span className="pill pill-ink" style={{ fontSize: 9, background: 'var(--amber-600)', color: '#fff' }}>
                        O: {s.skorOrganisasi}
                      </span>
                    )}
                  </div>
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
