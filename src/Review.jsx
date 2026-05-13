// Review.jsx — Review page + final submit confirmation
import React from 'react'
import { IEdit, IAlert, IChevronLeft, ISend, ICheck, IFile } from './Icons.jsx'
import { GlassCard, Button, Checkbox } from './Primitives.jsx'

const formatRp = (raw) => {
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
      if (onSubmit) await onSubmit()
    } catch (e) {
      setSubmitError(e?.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-shell">
      {form.submittedAt ? (
        <GlassCard style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📑✅</div>
          <h1 style={{ marginBottom: 12 }}>Pendaftaran Selesai</h1>
          <p style={{ color: 'var(--ink-600)', maxWidth: 480, margin: '0 auto 32px', fontSize: 16 }}>
            Terima kasih! Pendaftaran Anda telah kami terima pada <strong>{form.submittedAt}</strong>.
            Data Anda saat ini sedang dalam tahap verifikasi oleh panitia seleksi.
          </p>
          <Button variant="outline-tosca" onClick={onBack}>Kembali ke Dashboard</Button>
        </GlassCard>
      ) : (
        <>
          <div>
            <div className="eyebrow">Tahap Final</div>
            <h1 style={{ marginTop: 6 }}>Tinjau seluruh data Anda</h1>
            <p style={{ marginTop: 8, maxWidth: 640 }}>
              Periksa kembali setiap bagian dengan teliti. Setelah pendaftaran dikirim, data tidak dapat diubah.
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
            ['Domisili',           [form.domisiliKecamatan, form.domisiliKota, form.domisiliProvinsi].filter(Boolean).join(', ')],
            ['Alamat lengkap',     form.address],
            ['Kampus tujuan',      form.province],
            ['Program studi',      form.studyProgram],
          ], 1)}

          {/* ── Step 2: Keluarga ── */}
          {section(2, 'Keluarga', [
            ['Status pernikahan orangtua', form.familyStatus],
            ['Nama ayah',          form.fatherName],
            ['Kondisi ayah',       form.fatherCondition],
            ['Pekerjaan ayah',     form.fatherCondition === 'Wafat' ? 'Tidak Bekerja (Wafat)' : form.fatherJob],
            ['Nama ibu',           form.motherName],
            ['Kondisi ibu',        form.motherCondition],
            ['Pekerjaan ibu',      form.motherCondition === 'Wafat' ? 'Tidak Bekerja (Wafat)' : form.motherJob],
            ...(form.guardianName ? [
              ['Nama wali',        form.guardianName],
              ['Pekerjaan wali',   form.guardianJob],
            ] : []),
            ['Kartu Keluarga',     <FileThumb file={form.kkFile} />],
          ], 2)}

          {/* ── Step 3: Kondisi Ekonomi ── */}
          {section(3, 'Kondisi Ekonomi', [
            ['Penanggung kehidupan', form.mainProvider],
            ...(['Ayah & Ibu', 'Ayah Saja'].includes(form.mainProvider) ? [['Pendapatan ayah/bulan', formatRp(form.fatherIncomeAmount)]] : []),
            ...(['Ayah & Ibu', 'Ibu Saja'].includes(form.mainProvider)  ? [['Pendapatan ibu/bulan',  formatRp(form.motherIncomeAmount)]]  : []),
            ...(form.mainProvider === 'Wali'                             ? [['Pendapatan wali/bulan', formatRp(form.guardianIncomeAmount)]] : []),
            ['Saya sendiri (pemohon)', '1'],
            ['Kepala keluarga (ayah)', form.fatherCondition === 'Hidup' ? '1' : '0'],
            ['Ibu rumah tangga',       form.motherCondition === 'Hidup' ? '1' : '0'],
            ['Saudara dewasa bekerja',     String(form.adultSiblingsWorking    ?? 0)],
            ['Saudara dewasa tdk bekerja', String(form.adultSiblingsNotWorking ?? 0)],
            ['Saudara SMA/SMP',            String(form.siblingsHighSchool      ?? 0)],
            ['Saudara SD/Bayi',            String(form.siblingsElementary      ?? 0)],
            ['Kakek / Nenek',              String(form.grandparentsCount        ?? 0)],
            ['Status rumah',       form.houseStatus],
            ['Daya listrik',       form.electricPower],
            ['Motor / roda 2',     String(form.vehicleBike  ?? 0)],
            ['Mobil / roda 3–4',   String(form.vehicleCar   ?? 0)],
            ['Kendaraan lainnya',  String(form.vehicleOther ?? 0)],
            ['BPJS aktif',         String(form.bpjsActiveCount   ?? 0)],
            ['BPJS non-aktif',     String(form.bpjsInactiveCount ?? 0)],
            ['Penerima KIP/beasiswa', form.kipStatus],
            ['Foto tampak depan rumah', <FileThumb file={form.housePhotoFile} />],
            ['Foto ruangan dapur', <FileThumb file={form.kitchenPhotoFile} />],
          ], 3)}

          {/* ── Step 4: Prestasi ── */}
          <GlassCard className="review-group">
            <div className="review-head">
              <h3><span className="review-num">4</span>Prestasi <span className="pill pill-tosca">{form.achievements.length} item</span></h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit && onEdit(4)}><IEdit size={14} /> Edit</button>
            </div>
            {form.achievements.length === 0
              ? <p className="muted" style={{ fontSize: 14 }}>Tidak ada prestasi tercatat.</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {form.achievements.map((a, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--ink-50)', borderRadius: 12, border: '1px solid var(--ink-200)' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title || <span className="muted">(tanpa judul)</span>}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{[a.level, a.rank, a.year, a.issuer].filter(Boolean).join(' · ')}</div>
                    </div>
                  ))}
                </div>
            }
          </GlassCard>

          {/* ── Step 5: Organisasi ── */}
          <GlassCard className="review-group">
            <div className="review-head">
              <h3><span className="review-num">5</span>Organisasi <span className="pill pill-tosca">{form.organizations.length} item</span></h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit && onEdit(5)}><IEdit size={14} /> Edit</button>
            </div>
            {form.organizations.length === 0
              ? <p className="muted" style={{ fontSize: 14 }}>Tidak ada organisasi tercatat.</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {form.organizations.map((o, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--ink-50)', borderRadius: 12, border: '1px solid var(--ink-200)' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{o.name} <span style={{ color: 'var(--ink-500)', fontWeight: 500 }}>· {o.role}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{o.period}</div>
                      {o.description && <div style={{ fontSize: 13, color: 'var(--ink-700)', marginTop: 6 }}>{o.description}</div>}
                    </div>
                  ))}
                </div>
            }
          </GlassCard>

          {/* ── Step 6: Esai ── */}
          <GlassCard className="review-group">
            <div className="review-head">
              <h3><span className="review-num">6</span>Esai</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit && onEdit(6)}><IEdit size={14} /> Edit</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                ['Alasan mendaftar',         form.motivation],
                ['Rencana studi & karir',    form.futurePlan],
                ['Kontribusi untuk daerah',  form.contribution],
              ].map(([k, v], i) => (
                <div key={i}>
                  <div className="kv-label" style={{ marginBottom: 6 }}>{k}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-800)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {v || <span className="muted">—</span>}
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
                <ISend size={16} /> Kirim Pendaftaran
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
                <h2 style={{ fontSize: 22 }}>Yakin ingin mengirim pendaftaran?</h2>
                <p style={{ marginTop: 8 }}>
                  Setelah dikirim, data Anda akan dikunci dan tidak dapat diubah kembali. Pastikan Anda sudah meninjau seluruh bagian.
                </p>
                {submitError && (
                  <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--danger-50, #fef2f2)', border: '1px solid var(--danger-200, #fecaca)', color: 'var(--danger-700, #b91c1c)', fontSize: 13 }}>
                    {submitError}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: mobile ? 'column-reverse' : 'row', gap: 12, marginTop: 24 }}>
                  <Button variant="ghost" block={mobile} onClick={() => setShowConfirm(false)}>Periksa lagi</Button>
                  <Button variant="primary" block={mobile} loading={submitting} onClick={handleFinal}>
                    <ICheck size={16} /> Ya, kirim sekarang
                  </Button>
                </div>
              </GlassCard>
            </div>
          )}
        </>
      )}
    </div>
  )
}
