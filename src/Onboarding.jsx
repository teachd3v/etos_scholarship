// Onboarding.jsx — Campus pre-screening modal
import React from 'react'
import { TARGET_PROVINCES } from './FormState.jsx'
import { ISparkle, IArrowRight, IFile, IX } from './Icons.jsx'
import { GlassCard, Button, Field, Select, Checkbox } from './Primitives.jsx'

// ─── Reusable file upload field ──────────────────────────────────────
function FileUploadField({ label, hint, file, error, onFile, onRemove, inputRef }) {
  return (
    <Field label={label} required hint={hint}>
      {!file ? (
        <Button variant="outline-tosca" block onClick={() => inputRef.current?.click()} style={{ justifyContent: 'center' }}>
          <IFile size={16} /> Pilih File
        </Button>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10,
          background: 'var(--tosca-50)', border: '1px solid var(--tosca-200)',
        }}>
          <IFile size={16} style={{ color: 'var(--tosca-700)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>{(file.size / 1024).toFixed(0)} KB</div>
          </div>
          <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', padding: 4, display: 'flex' }}>
            <IX size={14} />
          </button>
        </div>
      )}
      {error && <div className="field-error" style={{ marginTop: 6 }}>{error}</div>}
    </Field>
  )
}

function makeFileHandler(setFile, setError, inputRef) {
  const handle = (f) => {
    if (!f) return
    if (f.size > 2_000_000) { setError('Ukuran file melebihi 2 MB. Pilih file yang lebih kecil.'); return }
    setError(null)
    setFile({ file: f, name: f.name, size: f.size, url: URL.createObjectURL(f) })
  }
  const remove = () => {
    setFile(null); setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }
  return { handle, remove }
}

// ─── Modal ────────────────────────────────────────────────────────────
export function OnboardingModal({ onPass, onDismiss, mobile }) {
  const [graduationYear, setGraduationYear] = React.useState('')
  const [ijazahFile, setIjazahFile]         = React.useState(null)
  const [ijazahError, setIjazahError]       = React.useState(null)
  const ijazahRef = React.useRef(null)

  const [campus, setCampus]           = React.useState('')
  const [isS1, setIsS1]               = React.useState(false)
  const [studyProgram, setStudyProgram] = React.useState('')
  const [proofFile, setProofFile]     = React.useState(null)
  const [proofError, setProofError]   = React.useState(null)
  const proofRef = React.useRef(null)

  const [isMuslim, setIsMuslim] = React.useState(false)

  const ijazah = makeFileHandler(setIjazahFile, setIjazahError, ijazahRef)
  const proof  = makeFileHandler(setProofFile,  setProofError,  proofRef)

  const canContinue = graduationYear && ijazahFile && campus && isS1 && studyProgram.trim() && proofFile && isMuslim

  const handleContinue = () => {
    if (!canContinue) return
    onPass({ campus, studyProgram: studyProgram.trim(), proofFile, graduationYear, ijazahFile })
  }

  return (
    <div className="modal-backdrop">
      <GlassCard className="modal-card" style={{ position: 'relative', padding: '24px 28px' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(15, 118, 110, 0.12), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--tosca-50)', color: 'var(--tosca-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ISparkle size={20} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Verifikasi Dulu</h2>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* A — Tahun Lulus SMA */}
          <Field label="Tahun lulus SMA / sederajat" required>
            <Select value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)}>
              <option value="">Pilih tahun lulus…</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </Select>
          </Field>

          {/* B — Bukti Ijazah SMA */}
          <input type="file" ref={ijazahRef} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
            onChange={(e) => ijazah.handle(e.target.files[0])} />
          <FileUploadField
            label="Bukti ijazah SMA / sederajat"
            hint="Scan atau foto ijazah — PDF, JPG, PNG — maks. 2 MB"
            file={ijazahFile}
            error={ijazahError}
            onFile={ijazah.handle}
            onRemove={ijazah.remove}
            inputRef={ijazahRef}
          />

          {/* C — Pilih Kampus */}
          <Field label="Kampus tujuan" required>
            <Select value={campus} onChange={(e) => setCampus(e.target.value)}>
              <option value="">Pilih kampus…</option>
              {TARGET_PROVINCES.map((k) => <option key={k} value={k}>{k}</option>)}
            </Select>
          </Field>

          {/* D — Konfirmasi S1 */}
          <Checkbox
            checked={isS1}
            onChange={(checked) => {
              setIsS1(checked)
              if (!checked) { setStudyProgram(''); proof.remove() }
            }}
          >
            Saya mendaftar sebagai Calon Mahasiswa Baru 2026, jenjang S1 di Kampus Mitra diatas
          </Checkbox>

          {/* E & F — conditional reveal */}
          {isS1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp .2s ease' }}>

              {/* E — Program Studi */}
              <Field label="Program Studi" required>
                <input className="input" value={studyProgram} onChange={(e) => setStudyProgram(e.target.value)}
                  placeholder="Contoh: Teknik Informatika" />
              </Field>

              {/* F — Bukti SNBP/SNBT */}
              <input type="file" ref={proofRef} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                onChange={(e) => proof.handle(e.target.files[0])} />
              <FileUploadField
                label="Bukti diterima melalui SNBP atau SNBT"
                hint="Format: PDF, JPG, PNG — maks. 2 MB"
                file={proofFile}
                error={proofError}
                onFile={proof.handle}
                onRemove={proof.remove}
                inputRef={proofRef}
              />

            </div>
          )}

          {/* G — Konfirmasi agama Islam */}
          <Checkbox checked={isMuslim} onChange={setIsMuslim}>
            Saya beragama Islam
          </Checkbox>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button variant="primary" block size="lg" disabled={!canContinue} onClick={handleContinue}>
            Lanjut <IArrowRight size={16} />
          </Button>
          <Button variant="ghost" block onClick={onDismiss}>Kembali ke login</Button>
        </div>
      </GlassCard>
    </div>
  )
}
