// Review.jsx — Review page + final submit confirmation
import React from 'react'
import { IEdit, IAlert, IChevronLeft, ISend, ICheck, IFile } from './Icons.jsx'
import { GlassCard, Button, Checkbox } from './Primitives.jsx'

const formatRp = (raw) => {
  if (raw === 0 || raw === '0') return 'Rp 0'
  const n = parseInt(String(raw || '').replace(/\D/g, ''), 10)
  return isNaN(n) ? '—' : 'Rp ' + n.toLocaleString('id-ID')
}

const FileThumb = ({ file }) => {
  if (!file) return <span className="muted">Tidak diunggah</span>
  const isImg = /\.(jpg|jpeg|png)$/i.test(file.name)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isImg
        ? <img src={file.url} alt="" style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ink-200)', flexShrink: 0 }} />
        : <div style={{ width: 40, height: 28, borderRadius: 4, background: 'var(--tosca-100)', color: 'var(--tosca-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IFile size={14} /></div>
      }
      <span className="mono" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
    </div>
  )
}

export function Review({ form, onEdit, onSubmit, onBack, mobile }) {
  const [consent, setConsent] = React.useState(!!form.consent)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState(null)

  const section = (num, title, rows, stepIdx) => (
    <GlassCard className="review-group">
      <div className="review-head">
        <h3><span className="review-num">{num}</span>{title}</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit && onEdit(stepIdx)}>
          <IEdit size={14} /> Edit
        </button>
      </div>
      <div className="kv-grid">
        {rows.map(([k, v], i) => (
          <div className="kv" key={i}>
            <div className="kv-label">{k}</div>
            <div className="kv-value">{v ?? <span className="muted">—</span>}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  )

  const handleFinal = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (onSubmit) await onSubmit(consent)
    } catch (e) {
      setSubmitError(e?.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-shell">
      <div>
        <div className="eyebrow">Tahap Final</div>
        <h1 style={{ marginTop: 6 }}>Tinjau seluruh data Anda</h1>
        <p style={{ marginTop: 8, maxWidth: 640 }}>
          Periksa kembali setiap bagian dengan teliti. {form.submittedAt ? 'Anda sedang dalam mode Ubah Data.' : 'Setelah pendaftaran dikirim, data masih dapat diubah selama masa pendaftaran.'}
          Gunakan tombol <strong>Edit</strong> di pojok tiap bagian untuk memperbaiki.
        </p>
      </div>

      {/* ── Step 1: Data Pribadi ── */}
          {section(1, 'Data Pribadi', [
            ['Pas foto profil', form.photoFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={form.photoFile.url} alt="Foto" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />
                <span className="mono" style={{ fontSize: 11 }}>{form.photoFile.name}</span>
              </div>
            ) : <span className="muted">Tidak diunggah</span>],
            ['Nama lengkap',       form.fullName],
            ['Nama panggilan',     form.nickname],
            ['NIK',                form.nik],
            ['No. Kartu Keluarga', form.noKK],
            ['Tempat, tanggal lahir', form.birthPlace && form.birthDate ? `${form.birthPlace}, ${form.birthDate}` : (form.birthPlace || form.birthDate || '')],
            ['Jenis kelamin',      form.gender],
            ['Email',              form.email],
            ['Nomor handphone',    form.phone],
            ['Link Instagram',     form.instagram],
            ['Bukti Follow IG',    <FileThumb file={form.igProofFile} />],
            ['Link Tiktok',        form.tiktok || '-'],
            ['Bukti Follow Tiktok', form.tiktokProofFile ? <FileThumb file={form.tiktokProofFile} /> : '-'],
            ['Domisili',           [form.domisiliKecamatan, form.domisiliKota, form.domisiliProvinsi].filter(Boolean).join(', ')],
            ['Alamat lengkap',     form.address],
            ['Foto KTP',           <FileThumb file={form.ktpFile} />],
            ['Kampus tujuan',      form.province],
            ['Program studi',      form.studyProgram],
          ], 1)}

          {/* ── Step 2: Keluarga ── */}
          {section(2, 'Keluarga', [
            ['Status pernikahan orangtua', (form.familyStatus || '').toUpperCase()],
            ['Nama ayah',          (form.fatherName || '').toUpperCase()],
            ['Kondisi ayah',       (form.fatherCondition || '').toUpperCase()],
            ['Pekerjaan ayah',     form.fatherCondition === 'Wafat' ? 'TIDAK BEKERJA (WAFAT)' : (form.fatherJob || '').toUpperCase()],
            ['Nama ibu',           (form.motherName || '').toUpperCase()],
            ['Kondisi ibu',        (form.motherCondition || '').toUpperCase()],
            ['Pekerjaan ibu',      form.motherCondition === 'Wafat' ? 'TIDAK BEKERJA (WAFAT)' : (form.motherJob || '').toUpperCase()],
            ...(form.guardianName ? [
              ['Nama wali',        (form.guardianName || '').toUpperCase()],
              ['Pekerjaan wali',   (form.guardianJob || '').toUpperCase()],
            ] : []),
            ['Kartu Keluarga',     <FileThumb file={form.kkFile} />],
          ], 2)}

          {/* ── Step 3: Kondisi Ekonomi ── */}
          {section(3, 'Kondisi Ekonomi', [
            ['Penanggung kehidupan', (form.mainProvider || '').toUpperCase()],
            ...(['Ayah & Ibu', 'Ayah Saja', 'Wali'].includes(form.mainProvider) && form.fatherCondition !== 'Wafat' ? [['Pendapatan ayah/bulan', formatRp(form.fatherIncomeAmount)]] : []),
            ...(['Ayah & Ibu', 'Ibu Saja', 'Wali'].includes(form.mainProvider)  && form.motherCondition !== 'Wafat' ? [['Pendapatan ibu/bulan',  formatRp(form.motherIncomeAmount)]]  : []),
            ...(form.mainProvider === 'Wali'                             ? [['Pendapatan wali/bulan', formatRp(form.guardianIncomeAmount)]] : []),
            ['Saya sendiri (pemohon)', '1'],
            ['Kepala keluarga (ayah)', form.fatherCondition === 'Hidup' ? '1' : '0'],
            ['Ibu rumah tangga',       form.motherCondition === 'Hidup' ? '1' : '0'],
            ['Saudara dewasa bekerja',     String(form.adultSiblingsWorking    ?? 0)],
            ['Saudara dewasa tdk bekerja', String(form.adultSiblingsNotWorking ?? 0)],
            ['Saudara SMA/SMP',            String(form.siblingsHighSchool      ?? 0)],
            ['Saudara SD/Bayi',            String(form.siblingsElementary      ?? 0)],
            ['Kakek / Nenek',              String(form.grandparentsCount        ?? 0)],
            ['Status rumah',       (form.houseStatus || '').toUpperCase()],
            ['Daya listrik',       (form.electricPower || '').toUpperCase()],
            ['Slip Gaji / Ket. Penghasilan', <FileThumb file={form.salarySlipFile} />],
            ['Foto tampak depan rumah', <FileThumb file={form.housePhotoFile} />],
            ['Foto ruangan dapur', <FileThumb file={form.kitchenPhotoFile} />],
          ], 3)}

          {/* ── Step 4: Prestasi ── */}
          <GlassCard className="review-group">
            <div className="review-head">
              <h3><span className="review-num">4</span>Prestasi <span className="pill pill-tosca">{form.achievements.length} ITEM</span></h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit && onEdit(4)}><IEdit size={14} /> EDIT</button>
            </div>
            {form.achievements.length === 0
              ? <p className="muted" style={{ fontSize: 14 }}>TIDAK ADA PRESTASI TERCATAT.</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {form.achievements.map((a, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--ink-50)', borderRadius: 12, border: '1px solid var(--ink-200)' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{(a.title || '').toUpperCase() || <span className="muted">(TANPA JUDUL)</span>}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{[a.level, a.rank, a.year, a.issuer].filter(Boolean).map(s => String(s).toUpperCase()).join(' · ')}</div>
                    </div>
                  ))}
                </div>
            }
          </GlassCard>

          {/* ── Step 5: Organisasi ── */}
          <GlassCard className="review-group">
            <div className="review-head">
              <h3><span className="review-num">5</span>Organisasi <span className="pill pill-tosca">{form.organizations.length} ITEM</span></h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit && onEdit(5)}><IEdit size={14} /> EDIT</button>
            </div>
            {form.organizations.length === 0
              ? <p className="muted" style={{ fontSize: 14 }}>TIDAK ADA ORGANISASI TERCATAT.</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {form.organizations.map((o, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--ink-50)', borderRadius: 12, border: '1px solid var(--ink-200)' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{(o.name || '').toUpperCase()} <span style={{ color: 'var(--ink-500)', fontWeight: 500 }}>· {(o.role || '').toUpperCase()}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{(o.period || '').toUpperCase()}</div>
                      {o.description && <div style={{ fontSize: 13, color: 'var(--ink-700)', marginTop: 6 }}>{(o.description || '').toUpperCase()}</div>}
                    </div>
                  ))}
                </div>
            }
          </GlassCard>

          {/* ── Step 6: Esai ── */}
          <GlassCard className="review-group">
            <div className="review-head">
              <h3><span className="review-num">6</span>Esai</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit && onEdit(6)}><IEdit size={14} /> EDIT</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                ['ALASAN MENDAFTAR',         form.motivation],
                ['RENCANA STUDI & KARIR',    form.futurePlan],
                ['KONTRIBUSI UNTUK DAERAH',  form.contribution],
              ].map(([k, v], i) => (
                <div key={i}>
                  <div className="kv-label" style={{ marginBottom: 6 }}>{k}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-800)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {(v || '').toUpperCase() || <span className="muted">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* ── Persetujuan & Kirim ── */}
          <GlassCard style={{ padding: 24 }}>
            <Checkbox checked={consent} onChange={setConsent}>
              Saya menyatakan bahwa seluruh data yang saya isi adalah benar. Saya memahami bahwa pemberian data palsu
              dapat mengakibatkan diskualifikasi dari proses seleksi Beasiswa Etos ID 2026.
            </Checkbox>
            <div style={{ marginTop: 18, display: 'flex', gap: 14, justifyContent: 'space-between', flexDirection: mobile ? 'column-reverse' : 'row' }}>
              <Button variant="ghost" block={mobile} onClick={onBack}><IChevronLeft size={16} /> Kembali ke dasbor</Button>
              <Button variant="primary" block={mobile} size="lg" disabled={!consent} onClick={() => setShowConfirm(true)}>
                <ISend size={16} /> {form.submittedAt ? 'Perbarui Pendaftaran' : 'Kirim Pendaftaran'}
              </Button>
            </div>
          </GlassCard>

          {showConfirm && (
            <div className="modal-backdrop">
              <GlassCard className="modal-card">
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--amber-400)', color: '#1a1202',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <IAlert size={24} />
                </div>
                <h2 style={{ fontSize: 22 }}>Yakin ingin {form.submittedAt ? 'memperbarui' : 'mengirim'} pendaftaran?</h2>
                <p style={{ marginTop: 8 }}>
                  {form.submittedAt ? 'Data pendaftaran Anda akan diperbarui.' : 'Setelah dikirim, data Anda masih bisa diubah selama masa pendaftaran. Pastikan Anda sudah meninjau seluruh bagian.'}
                </p>
                {submitError && (
                  <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--danger-50, #fef2f2)', border: '1px solid var(--danger-200, #fecaca)', color: 'var(--danger-700, #b91c1c)', fontSize: 13 }}>
                    {submitError}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: mobile ? 'column-reverse' : 'row', gap: 12, marginTop: 24 }}>
                  <Button variant="ghost" block={mobile} onClick={() => setShowConfirm(false)}>Periksa lagi</Button>
                  <Button variant="primary" block={mobile} loading={submitting} onClick={handleFinal}>
                    <ICheck size={16} /> Ya, {form.submittedAt ? 'perbarui' : 'kirim'} sekarang
                  </Button>
                </div>
              </GlassCard>
            </div>
          )}
    </div>
  )
}
