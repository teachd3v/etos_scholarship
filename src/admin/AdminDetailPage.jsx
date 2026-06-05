import React from 'react'
import { supabase } from '../lib/supabase.js'
import { getSignedUrls } from '../lib/storage.js'
import { fetchVerificationItems, fetchVerificationResults, saveVerificationResult } from '../lib/verification.js'
import { ICheck, IX, IAlert, IChevronLeft } from '../Icons.jsx'
import { GlassCard, Button } from '../Primitives.jsx'
import { STATUS_LABELS, DOC_TYPE_TO_SUB_FIELD, formatRp } from './adminUtils.js'
import { StatusPill, PriorityPill, SectionCard } from './components.jsx'
import { VerifyBlock } from './VerifyBlock.jsx'

export function AdminDetailPage({ submission: initialSubmission, onBack, setConfirmAction, mobile, statusToast }) {
  const [submission, setSubmission] = React.useState(initialSubmission);
  const [loadingDetail, setLoadingDetail] = React.useState(true);
  const [lightboxObj, setLightboxObj] = React.useState(null);
  const [verifItems, setVerifItems] = React.useState([]);
  const [verif, setVerif] = React.useState({ checks: {}, notes: {} })
  const saveTimer = React.useRef({})

  // Fetch items & results on mount
  React.useEffect(() => {
    let cancelled = false
    
    const loadDetail = async () => {
      setLoadingDetail(true)
      try {
        const [{ data: ach = [] }, { data: orgs = [] }, { data: docs = [] }] = await Promise.all([
          supabase.from('achievements').select('*').eq('applicant_id', initialSubmission.id),
          supabase.from('organizations').select('*').eq('applicant_id', initialSubmission.id),
          supabase.from('documents').select('*').eq('applicant_id', initialSubmission.id),
        ])
        
        if (cancelled) return

        const urlMap = await getSignedUrls((docs || []).map(d => d.storage_path))
        const docsWithUrls = (docs || []).map(d => ({ ...d, _signedUrl: urlMap[d.storage_path] || null }))

        const enriched = { ...initialSubmission }
        
        enriched.achievements = (ach || []).map(a => ({
          title: a.title || '', level: a.level || '', rank: a.rank || '',
          year: a.year ? String(a.year) : '', issuer: a.issuer || '',
        }))
        
        enriched.organizations = (orgs || []).map(o => ({
          name: o.name || '', role: o.role || '', period: o.period || '',
          description: o.description || '',
        }))
        
        for (const doc of docsWithUrls || []) {
          const field = DOC_TYPE_TO_SUB_FIELD[doc.doc_type]
          if (!field) continue
          enriched[field] = {
            url:  doc._signedUrl,
            path: doc.storage_path,
            name: doc.file_name,
            size: doc.file_size,
            mime: doc.mime_type,
          }
          if (doc.doc_type === 'photo') enriched.fotoProfil = doc._signedUrl
        }

        setSubmission(enriched)
      } catch (e) {
        console.error('loadDetail error:', e)
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    }
    loadDetail()

    const loadVerif = async () => {
      const items = await fetchVerificationItems()
      if (cancelled) return
      setVerifItems(items)
      
      const results = await fetchVerificationResults(initialSubmission._idx)
      if (cancelled) return
      
      const checks = {}
      const notes = {}
      results.forEach(r => {
        checks[r.item_id] = r.status === 'valid'
        notes[r.item_id] = r.notes || ''
      })
      setVerif(prev => ({ ...prev, checks: { ...prev.checks, ...checks }, notes: { ...prev.notes, ...notes } }))
    }
    loadVerif()
    return () => { cancelled = true }
  }, [initialSubmission.id])


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

  if (loadingDetail) {
    return (
      <div className="dash-wrap" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 36, height: 36, color: 'var(--tosca-600)' }}></div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.05em' }}>MEMUAT DATA DETAIL...</div>
      </div>
    )
  }

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

      {/* Toast notification setelah status berubah */}
      {statusToast && (
        <div style={{
          marginBottom: 12, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8, animation: 'slideDown 0.3s ease-out',
          background: statusToast.type === 'approved' ? 'var(--tosca-50)' : 'var(--danger-50)',
          border: `1px solid ${statusToast.type === 'approved' ? 'var(--tosca-200)' : 'var(--danger-200)'}`,
          color: statusToast.type === 'approved' ? 'var(--tosca-700)' : 'var(--danger-600)',
        }}>
          <ICheck size={16} />
          {statusToast.type === 'approved' ? 'Pendaftar berhasil diloloskan administrasi.' : 'Pendaftar berhasil ditolak.'}
        </div>
      )}

      {/* Draft warning banner */}
      {submission.is_submitted === false && (
        <div style={{
          marginBottom: 12, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
          color: 'var(--amber-700)',
        }}>
          <IAlert size={16} />
          Pendaftar ini masih berstatus DRAFT — formulir belum dikirim/submit.
        </div>
      )}

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

      {/* ── Skor Summary Card ── */}
      <GlassCard style={{ padding: mobile ? 14 : 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-400)', marginBottom: 12 }}>Ringkasan Skor</div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
          {[
            ['Grand Score', submission.grandScore || 0, 'var(--tosca-600)'],
            ['Prestasi', submission.skorPrestasi || 0, 'var(--tosca-500)'],
            ['Organisasi', submission.skorOrganisasi || 0, 'var(--amber-600)'],
            ['Had Kifayah', submission.hkPriority || '—', submission.hkPriority === 'PRIORITAS 1' ? 'var(--danger-500)' : 'var(--tosca-600)'],
          ].map(([label, value, color]) => (
            <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--ink-50)', borderRadius: 10, border: '1px solid var(--ink-100)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-400)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: typeof value === 'number' ? 22 : 13, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
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
          {kv('Bukti IG',        submission.igProofFile?.url ? (
            <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.igProofFile.url, title: 'Bukti Follow IG' })}>Lihat Bukti IG</Button>
          ) : <span className="muted">—</span>)}
          {kv('Tiktok',          submission.tiktok)}
          {kv('Bukti Tiktok',    submission.tiktokProofFile?.url ? (
            <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.tiktokProofFile.url, title: 'Bukti Follow Tiktok' })}>Lihat Bukti Tiktok</Button>
          ) : <span className="muted">—</span>)}
          {kv('Domisili', [submission.domisiliKecamatan, submission.domisiliKota, submission.domisiliProvinsi].filter(Boolean).join(', '))}
          {kv('Kampus tujuan',   submission.province)}
          {kv('Program studi',   submission.studyProgram)}
          <div className="kv" style={{ gridColumn: '1 / -1' }}>
            <div className="kv-label">Alamat lengkap</div>
            <div className="kv-value">{submission.address || <span className="muted">—</span>}</div>
          </div>
          <div className="kv" style={{ gridColumn: '1 / -1' }}>
            <div className="kv-label">Dokumen KTP</div>
            <div className="kv-value">
              {submission.ktpFile?.url
                ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.ktpFile.url, title: 'Foto KTP' })}>Lihat KTP</Button>
                : <span className="muted">Tidak diunggah</span>}
            </div>
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
          {submission.salarySlipFile?.url
            ? <Button variant="outline-tosca" size="sm" onClick={() => setLightboxObj({ url: submission.salarySlipFile.url, title: 'SLIP GAJI / KET. PENGHASILAN' })}>LIHAT SLIP GAJI</Button>
            : <span className="muted" style={{ fontSize: 13 }}>SLIP GAJI: TIDAK DIUNGGAH</span>}
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
      {(submission.achievements?.length > 0 || submission.skorPrestasi > 0) && (
        <SectionCard title={`Prestasi (${submission.achievements?.length || 0})`}>
          <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 700, color: 'var(--tosca-700)' }}>
            SKOR PRESTASI: {submission.skorPrestasi || 0} / 100
          </div>
          {submission.achievements?.length > 0 ? submission.achievements.map((a, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--ink-50)', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{(a.title || '').toUpperCase()}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                {[a.rank, a.level, a.year, a.issuer].filter(Boolean).map(s => String(s).toUpperCase()).join(' · ')}
              </div>
            </div>
          )) : (
            <div style={{ padding: '12px 14px', background: 'rgba(251,191,36,0.08)', borderRadius: 8, border: '1px solid rgba(251,191,36,0.2)', fontSize: 12, color: 'var(--amber-700)' }}>
              Skor prestasi tercatat ({submission.skorPrestasi}) namun data detail prestasi tidak dapat dimuat. Kemungkinan ada masalah RLS atau data belum tersinkronisasi.
            </div>
          )}
          {renderVerifyBlock('prestasi')}
        </SectionCard>
      )}

      {/* Organisasi */}
      {(submission.organizations?.length > 0 || submission.skorOrganisasi > 0) && (
        <SectionCard title={`Organisasi (${submission.organizations?.length || 0})`}>
          <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 700, color: 'var(--tosca-700)' }}>
            SKOR ORGANISASI: {submission.skorOrganisasi || 0} / 100
          </div>
          {submission.organizations?.length > 0 ? submission.organizations.map((o, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--ink-50)', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {(o.name || '').toUpperCase()} <span style={{ color: 'var(--ink-500)', fontWeight: 500 }}>· {(o.role || '').toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{(o.period || '').toUpperCase()}</div>
              {o.description && (
                <div style={{ fontSize: 12, color: 'var(--ink-600)', marginTop: 4 }}>{(o.description || '').toUpperCase()}</div>
              )}
            </div>
          )) : (
            <div style={{ padding: '12px 14px', background: 'rgba(251,191,36,0.08)', borderRadius: 8, border: '1px solid rgba(251,191,36,0.2)', fontSize: 12, color: 'var(--amber-700)' }}>
              Skor organisasi tercatat ({submission.skorOrganisasi}) namun data detail organisasi tidak dapat dimuat.
            </div>
          )}
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

      {/* Sticky Action Bar */}
      <div style={{ height: 72 }} /> {/* Spacer untuk sticky bar */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--glass-border)',
        padding: '12px 20px',
        display: 'flex', gap: 8, alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        borderRadius: '16px 16px 0 0',
      }}>
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
            {lightboxObj.url && lightboxObj.url.toLowerCase().split('?')[0].endsWith('.pdf') ? (
              <iframe
                src={lightboxObj.url}
                title="Document PDF"
                style={{ width: '100%', maxWidth: mobile ? '85vw' : 700, minHeight: mobile ? 300 : 450, border: 'none', borderRadius: 8, background: '#fff' }}
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
