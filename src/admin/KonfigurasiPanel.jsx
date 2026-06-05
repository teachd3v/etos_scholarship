import React from 'react'
import { useFormConfig } from '../lib/FormConfigContext.jsx'
import { saveConfigKey } from '../lib/formConfig.js'
import { ISave, ITrash, IPlus } from '../Icons.jsx'
import { GlassCard, Button } from '../Primitives.jsx'

export function KonfigurasiPanel({ mobile }) {
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
