// FormSteps.jsx — Multi-step form (Step 1-6)
import React from 'react'
import { BLANK_ACHIEVEMENT, BLANK_ORG, TARGET_PROVINCES } from './FormState.jsx'
import { IFile, IAlert, IPlus, ITrash } from './Icons.jsx'
import { Button, Field, Input, Textarea, Select, Checkbox } from './Primitives.jsx'
import { useFormConfig } from './lib/FormConfigContext.jsx'
import { uploadDocument, deleteDocument, validateFile } from './lib/storage.js'

/**
 * useFileUpload — hook untuk wire upload ke Supabase Storage per file field.
 * Saat user pilih file: validate → upload → upsert documents row → setField state.
 * Saat user remove: delete dari storage + documents table.
 */
function useFileUpload({ docType, fieldKey, currentFile, applicantId, setField }) {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError]         = React.useState(null)

  const upload = React.useCallback(async (file) => {
    if (!file) return
    const valErr = validateFile(docType, file)
    if (valErr) { setError(valErr); return }
    if (!applicantId) {
      setError('Data pendaftar belum tersedia. Refresh halaman dulu.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const result = await uploadDocument({
        file, docType, applicantId,
        oldPath: currentFile?.path || null,
      })
      setField(fieldKey, result)
    } catch (err) {
      setError(err.message || 'Upload gagal, coba lagi.')
    } finally {
      setUploading(false)
    }
  }, [docType, fieldKey, currentFile?.path, applicantId, setField])

  const remove = React.useCallback(async () => {
    setError(null)
    if (currentFile?.path) {
      setUploading(true)
      try {
        await deleteDocument({ path: currentFile.path, applicantId, docType })
      } catch (err) {
        console.warn('Gagal hapus file:', err)
      } finally {
        setUploading(false)
      }
    }
    setField(fieldKey, null)
  }, [docType, fieldKey, currentFile?.path, applicantId, setField])

  return { upload, remove, uploading, error }
}

const GENDER_OPTS = ['Laki-laki', 'Perempuan']

function StepContainer({ title, subtitle, children }) {
  return (
    <>
      <div>
        <h2>{title}</h2>
        {subtitle && <div className="form-section-sub">{subtitle}</div>}
      </div>
      {children}
    </>
  )
}

function Step1DataPribadi({ form, setField, errors, mobile, applicantId }) {
  const photoInputRef = React.useRef(null)
  const photoUpload = useFileUpload({
    docType: 'photo', fieldKey: 'photoFile',
    currentFile: form.photoFile, applicantId, setField,
  })

  const [provinces, setProvinces] = React.useState([])
  const [regencies, setRegencies] = React.useState([])
  const [districts, setDistricts] = React.useState([])
  const [provinceId, setProvinceId] = React.useState('')
  const [regencyId, setRegencyId] = React.useState('')

  React.useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(r => r.json()).then(setProvinces).catch(() => {})
  }, [])

  React.useEffect(() => {
    if (!provinces.length || !form.domisiliProvinsi) return
    const p = provinces.find(p => p.name === form.domisiliProvinsi)
    if (p && p.id !== provinceId) setProvinceId(p.id)
  }, [provinces, form.domisiliProvinsi])

  React.useEffect(() => {
    if (!provinceId) { setRegencies([]); return }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
      .then(r => r.json()).then(setRegencies).catch(() => {})
  }, [provinceId])

  React.useEffect(() => {
    if (!regencies.length || !form.domisiliKota) return
    const r = regencies.find(r => r.name === form.domisiliKota)
    if (r && r.id !== regencyId) setRegencyId(r.id)
  }, [regencies, form.domisiliKota])

  React.useEffect(() => {
    if (!regencyId) { setDistricts([]); return }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`)
      .then(r => r.json()).then(setDistricts).catch(() => {})
  }, [regencyId])

  return (
    <StepContainer title="Data pribadi & Akademik" subtitle="Isi identitas diri dan data akademik Anda dengan benar.">
      
      {/* ── Data Akademik (Onboarding Edit) ── */}
      <div style={{ marginBottom: 32, padding: '20px', background: 'var(--tosca-50)', borderRadius: 16, border: '1px solid var(--tosca-100)' }}>
        <SectionHeader title="Data Akademik (Skrining Awal)" />
        
        <div className="form-grid-2">
          <Field label="Tahun lulus SMA / sederajat" required error={errors.graduationYear}>
            <Select value={form.graduationYear || ''} error={errors.graduationYear} onChange={(e) => setField('graduationYear', e.target.value)}>
              <option value="">Pilih tahun lulus…</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </Select>
          </Field>
          
          <ProofUpload 
            label="Bukti ijazah SMA / sederajat" 
            required 
            error={errors.ijazahFile} 
            docType="ijazah" 
            fieldKey="ijazahFile" 
            currentFile={form.ijazahFile} 
            applicantId={applicantId} 
            setField={setField} 
          />
        </div>

        <div className="form-grid-2" style={{ marginTop: 12 }}>
          <Field label="Kampus tujuan" required error={errors.province}>
            <Select value={form.province || ''} error={errors.province} onChange={(e) => setField('province', e.target.value)}>
              <option value="">PILIH KAMPUS…</option>
              {TARGET_PROVINCES.map((k) => <option key={k} value={k}>{k.toUpperCase()}</option>)}
            </Select>
          </Field>

          <Field label="Program studi" required error={errors.studyProgram}>
            <Input value={form.studyProgram || ''} error={errors.studyProgram} 
              onChange={(e) => setField('studyProgram', e.target.value)} placeholder="Contoh: Teknik Informatika" />
          </Field>
        </div>

        <div style={{ marginTop: 12 }}>
          <ProofUpload 
            label="Bukti Lulus SNBP/SNBT/Mandiri" 
            required 
            error={errors.admissionProofFile} 
            docType="admission_proof" 
            fieldKey="admissionProofFile" 
            currentFile={form.admissionProofFile} 
            applicantId={applicantId} 
            setField={setField} 
          />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input type="file" ref={photoInputRef} accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={(e) => photoUpload.upload(e.target.files[0])} />
        <Field label="Pas Foto Profil (Wajib)" required error={errors.photoFile || photoUpload.error} hint="JPG/PNG. Tampilkan wajah jelas. Rasio 3:4 atau 4:6 (Maks 5MB)">
          <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'flex-start' : 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: 'var(--ink-100)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--ink-200)' }}>
              {form.photoFile && form.photoFile.url ? <img src={form.photoFile.url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="outline-tosca" size="sm" loading={photoUpload.uploading} onClick={() => photoInputRef.current.click()}>
                {photoUpload.uploading ? 'Mengupload…' : (form.photoFile ? 'Ganti Foto' : 'Pilih Foto')}
              </Button>
              {form.photoFile && !photoUpload.uploading && (
                <Button variant="ghost" size="sm" onClick={photoUpload.remove}>Hapus</Button>
              )}
              {form.photoFile && <div style={{ width: '100%', fontSize: 12, color: 'var(--ink-500)' }}>{form.photoFile.name}</div>}
            </div>
          </div>
        </Field>
      </div>

      <Field label="Nama lengkap" required error={errors.fullName}>
        <Input value={form.fullName} error={errors.fullName} onChange={(e) => setField('fullName', e.target.value)} placeholder="Sesuai KTP/KK" />
      </Field>
      <Field label="Nama panggilan" required error={errors.nickname}>
        <Input value={form.nickname || ''} error={errors.nickname} onChange={(e) => setField('nickname', e.target.value)} placeholder="Nama yang biasa dipakai sehari-hari" />
      </Field>
      <div className="form-grid-2">
        <Field label="Nomor Induk Kependudukan (NIK)" required error={errors.nik}>
          <Input inputMode="numeric" maxLength={16} value={form.nik} error={errors.nik}
            onChange={(e) => setField('nik', e.target.value.replace(/\D/g, ''))} placeholder="16 digit" />
        </Field>
        <Field label="No. Kartu Keluarga (KK)" required error={errors.noKK}>
          <Input inputMode="numeric" maxLength={16} value={form.noKK} error={errors.noKK}
            onChange={(e) => setField('noKK', e.target.value.replace(/\D/g, ''))} placeholder="16 digit" />
        </Field>
      </div>
      <div className="form-grid-2">
        <Field label="Tempat lahir" required error={errors.birthPlace}>
          <Input value={form.birthPlace} error={errors.birthPlace} onChange={(e) => setField('birthPlace', e.target.value)} placeholder="Kota/Kabupaten" />
        </Field>
        <Field label="Tanggal lahir" required error={errors.birthDate}>
          <Input type="date" value={form.birthDate} error={errors.birthDate} onChange={(e) => setField('birthDate', e.target.value)} />
        </Field>
      </div>
      <Field label="Jenis kelamin" required error={errors.gender}>
        <Select value={form.gender} error={errors.gender} onChange={(e) => setField('gender', e.target.value)}>
          <option value="">PILIH…</option>
          {GENDER_OPTS.map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
        </Select>
      </Field>
      <Field label="Email" required error={errors.email}>
        <Input type="email" value={form.email || ''} error={errors.email} onChange={(e) => setField('email', e.target.value)} placeholder="contoh@email.com" />
      </Field>
      <Field label="Nomor handphone (WhatsApp aktif)" required error={errors.phone}>
        <Input type="tel" value={form.phone} error={errors.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="08xx-xxxx-xxxx" />
      </Field>
      <Field label="Link Instagram" required error={errors.instagram} hint="Contoh: https://instagram.com/namaanda">
        <Input type="url" value={form.instagram || ''} error={errors.instagram}
          onChange={(e) => setField('instagram', e.target.value)} placeholder="https://instagram.com/namaanda" />
      </Field>

      <ProofUpload 
        label="Unggah bukti follow IG (Screenshot)" 
        required 
        error={errors.igProofFile} 
        docType="ig_proof" 
        fieldKey="igProofFile" 
        currentFile={form.igProofFile} 
        applicantId={applicantId} 
        setField={setField} 
      />

      <Field label="Link Tiktok" error={errors.tiktok} hint="Contoh: https://tiktok.com/@namaanda">
        <Input type="url" value={form.tiktok || ''} error={errors.tiktok}
          onChange={(e) => setField('tiktok', e.target.value)} placeholder="https://tiktok.com/@namaanda" />
      </Field>

      {form.tiktok && form.tiktok.trim() !== '' && (
        <ProofUpload 
          label="Unggah bukti follow Tiktok (Screenshot)" 
          required 
          error={errors.tiktokProofFile} 
          docType="tiktok_proof" 
          fieldKey="tiktokProofFile" 
          currentFile={form.tiktokProofFile} 
          applicantId={applicantId} 
          setField={setField} 
        />
      )}

      <Field label="Domisili Provinsi" required error={errors.domisiliProvinsi}>
        <Select value={form.domisiliProvinsi || ''} error={errors.domisiliProvinsi} onChange={(e) => {
          const p = provinces.find(p => p.name === e.target.value)
          setProvinceId(p?.id || '')
          setRegencyId('')
          setField('domisiliProvinsi', e.target.value)
          setField('domisiliKota', '')
          setField('domisiliKecamatan', '')
        }}>
          <option value="">{provinces.length ? 'PILIH PROVINSI…' : 'MEMUAT…'}</option>
          {provinces.map(p => <option key={p.id} value={p.name}>{p.name.toUpperCase()}</option>)}
        </Select>
      </Field>
      <Field label="Domisili Kabupaten/Kota" required error={errors.domisiliKota}>
        <Select value={form.domisiliKota || ''} error={errors.domisiliKota}
          disabled={!form.domisiliProvinsi}
          onChange={(e) => {
            const r = regencies.find(r => r.name === e.target.value)
            setRegencyId(r?.id || '')
            setField('domisiliKota', e.target.value)
            setField('domisiliKecamatan', '')
          }}>
          <option value="">{!form.domisiliProvinsi ? 'PILIH PROVINSI DULU…' : regencies.length ? 'PILIH KABUPATEN/KOTA…' : 'MEMUAT…'}</option>
          {regencies.map(r => <option key={r.id} value={r.name}>{r.name.toUpperCase()}</option>)}
        </Select>
      </Field>
      <Field label="Domisili Kecamatan" required error={errors.domisiliKecamatan}>
        <Select value={form.domisiliKecamatan || ''} error={errors.domisiliKecamatan}
          disabled={!form.domisiliKota}
          onChange={(e) => setField('domisiliKecamatan', e.target.value)}>
          <option value="">{!form.domisiliKota ? 'PILIH KABUPATEN/KOTA DULU…' : districts.length ? 'PILIH KECAMATAN…' : 'MEMUAT…'}</option>
          {districts.map(d => <option key={d.id} value={d.name}>{d.name.toUpperCase()}</option>)}
        </Select>
      </Field>
      <Field label="Alamat domisili lengkap" required error={errors.address}>
        <Textarea value={form.address} error={errors.address} onChange={(e) => setField('address', e.target.value)}
          placeholder="Contoh: Jl. Melati No. 12 RT 03/RW 02, Desa Sukamaju, Kec. Ciawi, Kab. Bogor, Jawa Barat" />
      </Field>

      {/* ── Unggah KTP ── */}
      <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px dashed var(--ink-200)' }}>
        <KtpUpload form={form} setField={setField} errors={errors} applicantId={applicantId} />
      </div>
    </StepContainer>
  )
}

function ProofUpload({ label, required, error, docType, fieldKey, currentFile, applicantId, setField }) {
  const inputRef = React.useRef(null)
  const { upload, remove, uploading, error: uploadError } = useFileUpload({
    docType, fieldKey,
    currentFile, applicantId, setField,
  })

  return (
    <Field label={label} required={required} error={error || uploadError} hint="Gambar (JPG/PNG) · maks 2 MB">
      <input type="file" ref={inputRef} accept="image/jpeg,image/png"
        style={{ display: 'none' }} onChange={(e) => upload(e.target.files[0])} />
      
      {!currentFile ? (
        <div className="upload-well" onClick={() => !uploading && inputRef.current.click()}
          style={{ cursor: uploading ? 'wait' : 'pointer', borderColor: (error || uploadError) ? 'var(--danger-500)' : undefined }}>
          <div className="uw-icon"><IFile size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="uw-title">Pilih Screenshot</div>
            <div className="uw-sub">Unggah bukti follow (JPG/PNG)</div>
          </div>
          <Button variant="outline-tosca" size="sm" loading={uploading}
            onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}>
            {uploading ? 'Mengupload…' : 'Pilih file'}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--ink-200)', background: 'white' }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={currentFile.url} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentFile.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>{(currentFile.size / 1024).toFixed(0)} KB · Tersimpan</div>
          </div>
          <Button variant="ghost" size="sm" loading={uploading} style={{ color: 'var(--danger-500)', padding: '2px 8px' }}
            onClick={remove}>Hapus</Button>
        </div>
      )}
    </Field>
  )
}

function KtpUpload({ form, setField, errors, applicantId }) {
  const inputRef = React.useRef(null)
  const { upload, remove, uploading, error } = useFileUpload({
    docType: 'ktp', fieldKey: 'ktpFile',
    currentFile: form.ktpFile, applicantId, setField,
  })

  const isImage = (file) => file && (
    /\.(jpg|jpeg|png|webp)$/i.test(file.name || '') ||
    (file.mime && file.mime.startsWith('image/'))
  )

  return (
    <Field label="Foto KTP (Wajib)" required error={errors.ktpFile || error}>
      <input type="file" ref={inputRef} accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }} onChange={(e) => upload(e.target.files[0])} />
      {!form.ktpFile ? (
        <div className="upload-well" onClick={() => !uploading && inputRef.current.click()}
          style={{ cursor: uploading ? 'wait' : 'pointer', borderColor: errors.ktpFile ? 'var(--danger-500)' : undefined }}>
          <div className="uw-icon"><IFile size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="uw-title">Unggah Foto KTP</div>
            <div className="uw-sub">PDF/JPG/PNG · maks 2 MB</div>
          </div>
          <Button variant="outline-tosca" size="sm" loading={uploading}
            onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}>
            {uploading ? 'Mengupload…' : 'Pilih file'}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {isImage(form.ktpFile) ? (
            <img src={form.ktpFile.url} alt="KTP preview"
              style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ink-200)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 120, height: 80, borderRadius: 8, background: 'var(--ink-50)', border: '1px solid var(--ink-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IFile size={28} style={{ color: 'var(--tosca-600)' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.ktpFile.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{(form.ktpFile.size / 1024).toFixed(0)} KB · Tersimpan</div>
            <Button variant="ghost" size="sm" loading={uploading} style={{ marginTop: 8, color: 'var(--danger-500)', padding: '2px 0' }}
              onClick={remove}>Hapus</Button>
          </div>
        </div>
      )}
    </Field>
  )
}

function SalarySlipUpload({ form, setField, errors, applicantId }) {
  const inputRef = React.useRef(null)
  const { upload, remove, uploading, error } = useFileUpload({
    docType: 'salary_slip', fieldKey: 'salarySlipFile',
    currentFile: form.salarySlipFile, applicantId, setField,
  })

  const isImage = (file) => file && (
    /\.(jpg|jpeg|png|webp)$/i.test(file.name || '') ||
    (file.mime && file.mime.startsWith('image/'))
  )

  return (
    <Field label="Slip Gaji / Surat Keterangan Penghasilan (Wajib)" required error={errors.salarySlipFile || error}>
      <input type="file" ref={inputRef} accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }} onChange={(e) => upload(e.target.files[0])} />
      {!form.salarySlipFile ? (
        <div className="upload-well" onClick={() => !uploading && inputRef.current.click()}
          style={{ cursor: uploading ? 'wait' : 'pointer', borderColor: errors.salarySlipFile ? 'var(--danger-500)' : undefined }}>
          <div className="uw-icon"><IFile size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="uw-title">Unggah Slip Gaji / Ket. Penghasilan</div>
            <div className="uw-sub">PDF/JPG/PNG · maks 2 MB</div>
          </div>
          <Button variant="outline-tosca" size="sm" loading={uploading}
            onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}>
            {uploading ? 'Mengupload…' : 'Pilih file'}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {isImage(form.salarySlipFile) ? (
            <img src={form.salarySlipFile.url} alt="Slip Gaji preview"
              style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ink-200)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 120, height: 80, borderRadius: 8, background: 'var(--ink-50)', border: '1px solid var(--ink-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IFile size={28} style={{ color: 'var(--tosca-600)' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.salarySlipFile.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{(form.salarySlipFile.size / 1024).toFixed(0)} KB · Tersimpan</div>
            <Button variant="ghost" size="sm" loading={uploading} style={{ marginTop: 8, color: 'var(--danger-500)', padding: '2px 0' }}
              onClick={remove}>Hapus</Button>
          </div>
        </div>
      )}
    </Field>
  )
}

const MARITAL_OPTS   = ['Menikah', 'Bercerai']
const CONDITION_OPTS = ['Hidup', 'Wafat']

function SectionHeader({ title }) {
  return (
    <h3 style={{ fontSize: 13, color: 'var(--tosca-700)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      {title}
      <div style={{ flex: 1, height: 1, background: 'var(--ink-100)' }} />
    </h3>
  )
}

function Step2Keluarga({ form, setField, errors, mobile, applicantId }) {
  const { config } = useFormConfig()
  const jobOpts = config.job_options || []

  const kkInputRef = React.useRef(null)
  const kkUpload = useFileUpload({
    docType: 'kk', fieldKey: 'kkFile',
    currentFile: form.kkFile, applicantId, setField,
  })

  const isImage = (file) => file && (
    /\.(jpg|jpeg|png|webp)$/i.test(file.name || '') ||
    (file.mime && file.mime.startsWith('image/'))
  )

  return (
    <StepContainer title="Data keluarga" subtitle="Informasi orang tua/wali, digunakan untuk verifikasi kondisi sosial-ekonomi keluarga.">

      {/* Status pernikahan */}
      <Field label="Status Pernikahan Orangtua" required error={errors.familyStatus}>
        <Select value={form.familyStatus} error={errors.familyStatus} onChange={(e) => setField('familyStatus', e.target.value)}>
          <option value="">PILIH…</option>
          {MARITAL_OPTS.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
        </Select>
      </Field>

      {/* ── Informasi Ayah ── */}
      <div style={{ marginTop: 24 }}>
        <SectionHeader title="Informasi Ayah" />
        <div className="form-grid-2">
          <Field label="Nama ayah" required error={errors.fatherName}>
            <Input value={form.fatherName} error={errors.fatherName}
              onChange={(e) => setField('fatherName', e.target.value)} placeholder="Nama lengkap ayah" />
          </Field>
          <Field label="Kondisi" required error={errors.fatherCondition}>
            <Select value={form.fatherCondition} error={errors.fatherCondition} onChange={(e) => {
              const v = e.target.value
              setField('fatherCondition', v)
              if (v === 'Wafat') { setField('fatherJob', 'Tidak Bekerja'); setField('fatherJobOther', '') }
              else               { setField('fatherJob', '') }
            }}>
              <option value="">PILIH…</option>
              {CONDITION_OPTS.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
            </Select>
          </Field>
        </div>
        {form.fatherCondition === 'Wafat' ? (
          <div style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--ink-50)', border: '1px solid var(--ink-200)', fontSize: 13, color: 'var(--ink-500)' }}>
            PEKERJAAN OTOMATIS: <strong>TIDAK BEKERJA</strong>
          </div>
        ) : (
          <>
            <Field label="Pekerjaan" required={!!form.fatherCondition} error={errors.fatherJob}>
              <Select value={form.fatherJob} error={errors.fatherJob} onChange={(e) => {
                const v = e.target.value
                setField('fatherJob', v)
                if (v !== 'Lainnya') setField('fatherJobOther', '')
              }}>
                <option value="">PILIH…</option>
                {jobOpts.map((j) => <option key={j} value={j}>{j.toUpperCase()}</option>)}
              </Select>
            </Field>
            {form.fatherJob === 'Lainnya' && (
              <div style={{ marginTop: 14, animation: 'fadeUp .2s ease' }}>
                <Field label="Tuliskan pekerjaan lainnya" required error={errors.fatherJobOther}>
                  <Input value={form.fatherJobOther || ''} error={errors.fatherJobOther}
                    onChange={(e) => setField('fatherJobOther', e.target.value)} placeholder="Contoh: Tukang Las" />
                </Field>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Informasi Ibu ── */}
      <div style={{ marginTop: 28 }}>
        <SectionHeader title="Informasi Ibu" />
        <div className="form-grid-2">
          <Field label="Nama ibu" required error={errors.motherName}>
            <Input value={form.motherName} error={errors.motherName}
              onChange={(e) => setField('motherName', e.target.value)} placeholder="Nama lengkap ibu" />
          </Field>
          <Field label="Kondisi" required error={errors.motherCondition}>
            <Select value={form.motherCondition} error={errors.motherCondition} onChange={(e) => {
              const v = e.target.value
              setField('motherCondition', v)
              if (v === 'Wafat') { setField('motherJob', 'Tidak Bekerja'); setField('motherJobOther', '') }
              else               { setField('motherJob', '') }
            }}>
              <option value="">PILIH…</option>
              {CONDITION_OPTS.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
            </Select>
          </Field>
        </div>
        {form.motherCondition === 'Wafat' ? (
          <div style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--ink-50)', border: '1px solid var(--ink-200)', fontSize: 13, color: 'var(--ink-500)' }}>
            PEKERJAAN OTOMATIS: <strong>TIDAK BEKERJA</strong>
          </div>
        ) : (
          <>
            <Field label="Pekerjaan" required={!!form.motherCondition} error={errors.motherJob}>
              <Select value={form.motherJob} error={errors.motherJob} onChange={(e) => {
                const v = e.target.value
                setField('motherJob', v)
                if (v !== 'Lainnya') setField('motherJobOther', '')
              }}>
                <option value="">PILIH…</option>
                {jobOpts.map((j) => <option key={j} value={j}>{j.toUpperCase()}</option>)}
              </Select>
            </Field>
            {form.motherJob === 'Lainnya' && (
              <div style={{ marginTop: 14, animation: 'fadeUp .2s ease' }}>
                <Field label="Tuliskan pekerjaan lainnya" required error={errors.motherJobOther}>
                  <Input value={form.motherJobOther || ''} error={errors.motherJobOther}
                    onChange={(e) => setField('motherJobOther', e.target.value)} placeholder="Contoh: Penjahit" />
                </Field>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Informasi Wali (Opsional) ── */}
      <div style={{ marginTop: 28 }}>
        <SectionHeader title="Informasi Wali (Opsional)" />
        <div className="form-grid-2">
          <Field label="Nama wali">
            <Input value={form.guardianName || ''} onChange={(e) => setField('guardianName', e.target.value)} placeholder="Nama lengkap wali" />
          </Field>
          <Field label="Pekerjaan wali">
            <Select value={form.guardianJob || ''} onChange={(e) => {
              const v = e.target.value
              setField('guardianJob', v)
              if (v !== 'Lainnya') setField('guardianJobOther', '')
            }}>
              <option value="">PILIH…</option>
              {jobOpts.map((j) => <option key={j} value={j}>{j.toUpperCase()}</option>)}
            </Select>
          </Field>
        </div>
        {form.guardianJob === 'Lainnya' && (
          <div style={{ marginTop: 14, animation: 'fadeUp .2s ease' }}>
            <Field label="Tuliskan pekerjaan wali">
              <Input value={form.guardianJobOther || ''} onChange={(e) => setField('guardianJobOther', e.target.value)} placeholder="Contoh: Petani" />
            </Field>
          </div>
        )}
      </div>

      {/* ── Kartu Keluarga ── */}
      <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px dashed var(--ink-200)' }}>
        <Field label="Kartu Keluarga (KK)" required error={errors.kkFile || kkUpload.error}>
          <input type="file" ref={kkInputRef} accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }} onChange={(e) => kkUpload.upload(e.target.files[0])} />
          {!form.kkFile ? (
            <div className="upload-well" onClick={() => !kkUpload.uploading && kkInputRef.current.click()}
              style={{ cursor: kkUpload.uploading ? 'wait' : 'pointer', borderColor: errors.kkFile ? 'var(--danger-500)' : undefined }}>
              <div className="uw-icon"><IFile size={20} /></div>
              <div style={{ flex: 1 }}>
                <div className="uw-title">Unggah Kartu Keluarga</div>
                <div className="uw-sub">PDF/JPG/PNG · maks 2 MB</div>
              </div>
              <Button variant="outline-tosca" size="sm" loading={kkUpload.uploading}
                onClick={(e) => { e.stopPropagation(); kkInputRef.current.click() }}>
                {kkUpload.uploading ? 'Mengupload…' : 'Pilih file'}
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {isImage(form.kkFile) ? (
                <img src={form.kkFile.url} alt="KK preview"
                  style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ink-200)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 120, height: 80, borderRadius: 8, background: 'var(--ink-50)', border: '1px solid var(--ink-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IFile size={28} style={{ color: 'var(--tosca-600)' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.kkFile.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{(form.kkFile.size / 1024).toFixed(0)} KB · Tersimpan</div>
                <Button variant="ghost" size="sm" loading={kkUpload.uploading} style={{ marginTop: 8, color: 'var(--danger-500)', padding: '2px 0' }}
                  onClick={kkUpload.remove}>Hapus</Button>
              </div>
            </div>
          )}
        </Field>
      </div>

    </StepContainer>
  )
}


function NumberStepper({ value, onChange, min = 0, max = 10 }) {
  const n = parseInt(value) || 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" onClick={() => onChange(Math.max(min, n - 1))} disabled={n <= min}
        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--ink-200)', background: n <= min ? 'var(--ink-50)' : 'white', cursor: n <= min ? 'not-allowed' : 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: n <= min ? 'var(--ink-300)' : 'var(--ink-700)', flexShrink: 0 }}>
        −
      </button>
      <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{n}</span>
      <button type="button" onClick={() => onChange(Math.min(max, n + 1))} disabled={n >= max}
        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--ink-200)', background: n >= max ? 'var(--ink-50)' : 'white', cursor: n >= max ? 'not-allowed' : 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: n >= max ? 'var(--ink-300)' : 'var(--ink-700)', flexShrink: 0 }}>
        +
      </button>
    </div>
  )
}

function StepperRow({ label, value, onChange, min = 0, max = 10, auto, autoValue }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--ink-100)' }}>
      <div>
        <span style={{ fontSize: 14, color: 'var(--ink-800)' }}>{label}</span>
        {auto && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--tosca-600)', fontWeight: 600 }}>otomatis</span>}
      </div>
      {auto
        ? <span style={{ fontWeight: 700, fontSize: 16, minWidth: 34, textAlign: 'center', color: 'var(--ink-700)' }}>{autoValue}</span>
        : <NumberStepper value={value} onChange={onChange} min={min} max={max} />
      }
    </div>
  )
}

function RpInput({ value, onChange, error, placeholder = 'Rp 0' }) {
  const raw = String(value || '').replace(/\D/g, '')
  const display = raw ? 'Rp ' + parseInt(raw, 10).toLocaleString('id-ID') : ''
  return (
    <input className={`input${error ? ' input-error' : ''}`} type="text" inputMode="numeric"
      value={display} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} />
  )
}

const PROVIDER_OPTS    = ['Ayah & Ibu', 'Ayah Saja', 'Ibu Saja', 'Wali']
const HOUSE_STATUS_OPTS = ['Milik sendiri', 'Sewa/Kontrak', 'Menumpang Keluarga Lain']
const ELECTRIC_OPTS    = ['450 watt', '900 watt', '>900 watt']

function Step3Ekonomi({ form, setField, errors, mobile, applicantId }) {
  const photoRef   = React.useRef(null)
  const kitchenRef = React.useRef(null)

  const showFatherIncome  = ['Ayah & Ibu', 'Ayah Saja'].includes(form.mainProvider)
  const showMotherIncome  = ['Ayah & Ibu', 'Ibu Saja'].includes(form.mainProvider)
  const showWaliIncome    = form.mainProvider === 'Wali'

  const housePhotoUpload = useFileUpload({
    docType: 'house_photo', fieldKey: 'housePhotoFile',
    currentFile: form.housePhotoFile, applicantId, setField,
  })
  const kitchenPhotoUpload = useFileUpload({
    docType: 'kitchen_photo', fieldKey: 'kitchenPhotoFile',
    currentFile: form.kitchenPhotoFile, applicantId, setField,
  })

  return (
    <StepContainer title="Kondisi ekonomi" subtitle="Data ekonomi keluarga untuk verifikasi kelayakan beasiswa. Isi dengan jujur dan sesuai kondisi nyata.">

      {/* ── Penanggung kehidupan ── */}
      <Field label="Siapa yang menanggung kehidupanmu sehari-hari?" required error={errors.mainProvider}>
        <Select value={form.mainProvider} error={errors.mainProvider} onChange={(e) => setField('mainProvider', e.target.value)}>
          <option value="">PILIH…</option>
          {PROVIDER_OPTS.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
        </Select>
      </Field>

      {/* ── Pendapatan — selalu tampil semua 3, required hanya yg relevan ── */}
      {form.mainProvider && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp .2s ease' }}>
          <Field label="Pendapatan ayah per bulan" required={showFatherIncome} error={errors.fatherIncomeAmount}>
            <RpInput value={form.fatherIncomeAmount} error={errors.fatherIncomeAmount}
              onChange={(v) => setField('fatherIncomeAmount', v)} />
          </Field>
          <Field label="Pendapatan ibu per bulan" required={showMotherIncome} error={errors.motherIncomeAmount}>
            <RpInput value={form.motherIncomeAmount} error={errors.motherIncomeAmount}
              onChange={(v) => setField('motherIncomeAmount', v)} />
          </Field>
          <Field label="Pendapatan wali per bulan" required={showWaliIncome} error={errors.guardianIncomeAmount}>
            <RpInput value={form.guardianIncomeAmount} error={errors.guardianIncomeAmount}
              onChange={(v) => setField('guardianIncomeAmount', v)} />
          </Field>
        </div>
      )}

      {/* ── Komposisi keluarga ── */}
      <div style={{ marginTop: 24 }}>
        <SectionHeader title="Komposisi Keluarga" />
        <div style={{ borderTop: '1px solid var(--ink-100)' }}>
          <StepperRow label="Saya sendiri" auto autoValue={1} />
          <StepperRow label="Kepala keluarga" auto autoValue={form.fatherCondition === 'Hidup' ? 1 : 0} />
          <StepperRow label="Ibu rumah tangga" auto autoValue={form.motherCondition === 'Hidup' ? 1 : 0} />
          <StepperRow label="Saudara dewasa bekerja"           value={form.adultSiblingsWorking}    onChange={(v) => setField('adultSiblingsWorking', v)} />
          <StepperRow label="Saudara dewasa tidak bekerja"     value={form.adultSiblingsNotWorking}  onChange={(v) => setField('adultSiblingsNotWorking', v)} />
          <StepperRow label="Saudara jenjang SMA / SMP"        value={form.siblingsHighSchool}       onChange={(v) => setField('siblingsHighSchool', v)} />
          <StepperRow label="Saudara jenjang SD / Bayi"        value={form.siblingsElementary}       onChange={(v) => setField('siblingsElementary', v)} />
          <StepperRow label="Kakek / Nenek"                    value={form.grandparentsCount}        onChange={(v) => setField('grandparentsCount', v)} max={4} />
        </div>
      </div>

      {/* ── Tempat tinggal ── */}
      <div style={{ marginTop: 24 }}>
        <SectionHeader title="Tempat Tinggal" />
        <div className="form-grid-2">
          <Field label="Status rumah saat ini" required error={errors.houseStatus}>
            <Select value={form.houseStatus} error={errors.houseStatus} onChange={(e) => setField('houseStatus', e.target.value)}>
              <option value="">PILIH…</option>
              {HOUSE_STATUS_OPTS.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
            </Select>
          </Field>
          <Field label="Daya listrik rumah" required error={errors.electricPower}>
            <Select value={form.electricPower} error={errors.electricPower} onChange={(e) => setField('electricPower', e.target.value)}>
              <option value="">PILIH…</option>
              {ELECTRIC_OPTS.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
            </Select>
          </Field>
        </div>
      </div>

      {/* ── Unggah Slip Gaji ── */}
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px dashed var(--ink-200)' }}>
        <SalarySlipUpload form={form} setField={setField} errors={errors} applicantId={applicantId} />
      </div>

      {/* ── Foto rumah ── */}
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px dashed var(--ink-200)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 20 }}>
          {/* Foto depan rumah */}
          <Field label="Foto Tampak Depan Rumah" required error={errors.housePhotoFile || housePhotoUpload.error}
            hint="Format JPG/PNG · maks 5 MB">
            <input type="file" ref={photoRef} accept=".jpg,.jpeg,.png"
              style={{ display: 'none' }} onChange={(e) => housePhotoUpload.upload(e.target.files[0])} />
            {!form.housePhotoFile ? (
              <div className="upload-well" onClick={() => !housePhotoUpload.uploading && photoRef.current.click()}
                style={{ cursor: housePhotoUpload.uploading ? 'wait' : 'pointer', borderColor: errors.housePhotoFile ? 'var(--danger-500)' : undefined }}>
                <div className="uw-icon"><IFile size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div className="uw-title">Unggah foto tampak depan</div>
                  <div className="uw-sub">JPG / PNG · maks 5 MB</div>
                </div>
                <Button variant="outline-tosca" size="sm" loading={housePhotoUpload.uploading}
                  onClick={(e) => { e.stopPropagation(); photoRef.current.click() }}>
                  {housePhotoUpload.uploading ? 'Mengupload…' : 'Pilih'}
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <img src={form.housePhotoFile.url} alt="Foto depan rumah"
                  style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ink-200)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.housePhotoFile.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{(form.housePhotoFile.size / 1024).toFixed(0)} KB · Tersimpan</div>
                  <Button variant="ghost" size="sm" loading={housePhotoUpload.uploading} style={{ marginTop: 8, color: 'var(--danger-500)', padding: '2px 0' }}
                    onClick={housePhotoUpload.remove}>Hapus</Button>
                </div>
              </div>
            )}
          </Field>

          {/* Foto dapur */}
          <Field label="Foto Ruangan Dapur" error={kitchenPhotoUpload.error}
            hint="Format JPG/PNG · maks 5 MB">
            <input type="file" ref={kitchenRef} accept=".jpg,.jpeg,.png"
              style={{ display: 'none' }} onChange={(e) => kitchenPhotoUpload.upload(e.target.files[0])} />
            {!form.kitchenPhotoFile ? (
              <div className="upload-well" onClick={() => !kitchenPhotoUpload.uploading && kitchenRef.current.click()}
                style={{ cursor: kitchenPhotoUpload.uploading ? 'wait' : 'pointer' }}>
                <div className="uw-icon"><IFile size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div className="uw-title">Unggah foto dapur</div>
                  <div className="uw-sub">JPG / PNG · maks 5 MB</div>
                </div>
                <Button variant="outline-tosca" size="sm" loading={kitchenPhotoUpload.uploading}
                  onClick={(e) => { e.stopPropagation(); kitchenRef.current.click() }}>
                  {kitchenPhotoUpload.uploading ? 'Mengupload…' : 'Pilih'}
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <img src={form.kitchenPhotoFile.url} alt="Foto dapur"
                  style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ink-200)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.kitchenPhotoFile.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{(form.kitchenPhotoFile.size / 1024).toFixed(0)} KB · Tersimpan</div>
                  <Button variant="ghost" size="sm" loading={kitchenPhotoUpload.uploading} style={{ marginTop: 8, color: 'var(--danger-500)', padding: '2px 0' }}
                    onClick={kitchenPhotoUpload.remove}>Hapus</Button>
                </div>
              </div>
            )}
          </Field>
        </div>
      </div>

    </StepContainer>
  )
}

function Step4Prestasi({ form, setField, errors, mobile }) {
  const { config } = useFormConfig()
  const achCfg    = config.achievement_config || {}
  const toStr     = (arr) => (arr || []).map(o => typeof o === 'string' ? o : o.label)
  const levelOpts = toStr(achCfg.levels)
  const rankOpts  = toStr(achCfg.ranks)

  const addItem = () => {
    if (form.noAchievement) setField('noAchievement', false)
    setField('achievements', [...form.achievements, { ...BLANK_ACHIEVEMENT }])
  }
  const update = (idx, key, val) => {
    const next = form.achievements.map((a, i) => i === idx ? { ...a, [key]: val } : a)
    setField('achievements', next)
  }
  const remove = (idx) => setField('achievements', form.achievements.filter((_, i) => i !== idx))

  return (
    <StepContainer title="Prestasi" subtitle="Cantumkan prestasi akademik maupun non-akademik dalam 3 tahun terakhir. Jika banyak, prioritaskan yang paling relevan.">
      <Checkbox
        checked={form.noAchievement}
        onChange={(checked) => {
          setField('noAchievement', checked)
          if (checked) setField('achievements', [])
        }}
      >
        Saya tidak memiliki prestasi apapun
      </Checkbox>
      {errors._list && (
        <div className="alert alert-amber"><span className="alert-icon"><IAlert size={18} /></span><div>{errors._list}</div></div>
      )}
      {!form.noAchievement && form.achievements.map((a, i) => (
        <div key={i} className="dynamic-item">
          <div className="di-head">
            <div className="di-title">Prestasi #{i + 1}</div>
            <button title="Hapus" onClick={() => remove(i)}><ITrash size={16} /></button>
          </div>
          <Field label="Judul prestasi" required error={errors[`ach-${i}-title`]}>
            <Input value={a.title} error={errors[`ach-${i}-title`]}
              onChange={(e) => update(i, 'title', e.target.value)}
              placeholder="Contoh: Juara 2 Olimpiade Sains Kabupaten — Biologi" />
          </Field>
          <div className="form-grid-3">
            <Field label="Tingkat" required error={errors[`ach-${i}-level`]}>
              <Select value={a.level} error={errors[`ach-${i}-level`]} onChange={(e) => update(i, 'level', e.target.value)}>
                <option value="">PILIH…</option>
                {levelOpts.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </Select>
            </Field>
            <Field label="Peringkat/Medali" required error={errors[`ach-${i}-rank`]}>
              <Select value={a.rank} error={errors[`ach-${i}-rank`]} onChange={(e) => update(i, 'rank', e.target.value)}>
                <option value="">PILIH…</option>
                {rankOpts.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
              </Select>
            </Field>
            <Field label="Tahun" required error={errors[`ach-${i}-year`]}>
              <Input type="number" min="2015" max="2026" value={a.year} error={errors[`ach-${i}-year`]}
                onChange={(e) => update(i, 'year', e.target.value)} placeholder="2025" />
            </Field>
            <Field label="Penyelenggara">
              <Input value={a.issuer} onChange={(e) => update(i, 'issuer', e.target.value)} placeholder="Contoh: Dinas Pendidikan" />
            </Field>
          </div>
        </div>
      ))}
      {!form.noAchievement && (
        <button className="add-item-btn" onClick={addItem} type="button">
          <span className="plus-dot"><IPlus size={14} stroke={2.8} /></span>
          Tambah Prestasi
        </button>
      )}
    </StepContainer>
  )
}

function Step5Organisasi({ form, setField, errors, mobile }) {
  const { config } = useFormConfig()
  const orgCfg  = config.organization_config || {}
  const roleOpts = (orgCfg.roles || []).map(o => typeof o === 'string' ? o : o.label)

  const addItem = () => {
    if (form.noOrganization) setField('noOrganization', false)
    setField('organizations', [...form.organizations, { ...BLANK_ORG }])
  }
  const update = (idx, key, val) => {
    const next = form.organizations.map((o, i) => i === idx ? { ...o, [key]: val } : o)
    setField('organizations', next)
  }
  const remove = (idx) => setField('organizations', form.organizations.filter((_, i) => i !== idx))

  return (
    <StepContainer title="Pengalaman organisasi" subtitle="Kegiatan kepemimpinan, kepanitiaan, atau komunitas yang pernah Anda ikuti — akademik maupun non-akademik.">
      <Checkbox
        checked={form.noOrganization}
        onChange={(checked) => {
          setField('noOrganization', checked)
          if (checked) setField('organizations', [])
        }}
      >
        Saya tidak memiliki pengalaman organisasi apapun
      </Checkbox>
      {errors._list && (
        <div className="alert alert-amber"><span className="alert-icon"><IAlert size={18} /></span><div>{errors._list}</div></div>
      )}
      {!form.noOrganization && form.organizations.map((o, i) => (
        <div key={i} className="dynamic-item">
          <div className="di-head">
            <div className="di-title">Organisasi #{i + 1}</div>
            <button title="Hapus" onClick={() => remove(i)}><ITrash size={16} /></button>
          </div>
          <div className="form-grid-2">
            <Field label="Nama organisasi" required error={errors[`org-${i}-name`]}>
              <Input value={o.name} error={errors[`org-${i}-name`]}
                onChange={(e) => update(i, 'name', e.target.value)} placeholder="Contoh: OSIS SMAN 1 Kendari" />
            </Field>
            <Field label="Peran/jabatan" required error={errors[`org-${i}-role`]}>
              <Select value={o.role} error={errors[`org-${i}-role`]} onChange={(e) => update(i, 'role', e.target.value)}>
                <option value="">PILIH…</option>
                {roleOpts.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Periode keaktifan" required error={errors[`org-${i}-period`]}>
            <Input value={o.period} error={errors[`org-${i}-period`]}
              onChange={(e) => update(i, 'period', e.target.value)} placeholder="Contoh: Jul 2023 – Jun 2024" />
          </Field>
          <Field label="Deskripsi kontribusi" hint="Maks 280 karakter. Ceritakan dampak nyata dari peran Anda.">
            <Textarea value={o.description} maxLength={280}
              onChange={(e) => update(i, 'description', e.target.value)}
              placeholder="Contoh: Merancang program literasi untuk 120 siswa kelas X…" />
          </Field>
        </div>
      ))}
      {!form.noOrganization && (
        <button className="add-item-btn" onClick={addItem} type="button">
          <span className="plus-dot"><IPlus size={14} stroke={2.8} /></span>
          Tambah Organisasi
        </button>
      )}
    </StepContainer>
  )
}

const CountedTextarea = ({ value, error, placeholder, min = 50, max = 400, onChange }) => (
  <>
    <Textarea value={value} error={error} maxLength={max}
      onChange={onChange} placeholder={placeholder}
      style={{ minHeight: 140 }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-500)', marginTop: 4 }}>
      <span>Minimal {min} karakter</span>
      <span className={`mono ${(value || '').length > max ? 'text-danger' : ''}`}>{(value || '').length} / {max}</span>
    </div>
  </>
)

function Step6Esai({ form, setField, errors, mobile }) {
  const { config } = useFormConfig()
  const essays = config.essay_config || []

  return (
    <StepContainer title="Esai" subtitle="Tulis jawaban jujur dan ringkas berdasarkan pandangan pribadi Anda.">
      {essays.map(essay => (
        <Field key={essay.id} label={essay.label} required error={errors[essay.id]}>
          <CountedTextarea
            value={form[essay.id] || ''}
            error={errors[essay.id]}
            onChange={(e) => setField(essay.id, e.target.value)}
            placeholder={essay.placeholder}
            min={essay.min}
            max={essay.max}
          />
        </Field>
      ))}
    </StepContainer>
  )
}

export const STEP_COMPONENTS = [null, Step1DataPribadi, Step2Keluarga, Step3Ekonomi, Step4Prestasi, Step5Organisasi, Step6Esai]
