// FormShell.jsx — wraps steps + stepper + sticky bottom save bar
import React from 'react'
import { validateStep, completedSteps } from './FormState.jsx'
import { IChevronLeft, ISave, IArrowRight, ICheck } from './Icons.jsx'
import { GlassCard, Button, Stepper } from './Primitives.jsx'
import { STEP_COMPONENTS } from './FormSteps.jsx'
import { useFormConfig } from './lib/FormConfigContext.jsx'

const STEP_NAMES = ['', 'Data Pribadi', 'Keluarga', 'Kondisi Ekonomi', 'Prestasi', 'Organisasi', 'Esai']

export function FormShell({ form, setField, applicantId, step, setStep, stepperVariant, onSave, onDashboard, onReview, mobile, currentPeriod }) {
  const { config } = useFormConfig()
  const [errors, setErrors] = React.useState({})
  const [saving, setSaving] = React.useState(false)
  const [showedErrors, setShowedErrors] = React.useState(false)
  const completed = completedSteps(form, config)

  React.useEffect(() => {
    if (!showedErrors) return
    setErrors(validateStep(step, form, config))
  }, [form, step, showedErrors, config])

  React.useEffect(() => {
    setErrors({})
    setShowedErrors(false)
  }, [step])

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const scrollEl = document.querySelector('.mobile-scroll')
    if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave()
      onDashboard()
    } catch (e) {
      if (e.message === 'AUTH_EXPIRED') {
        alert('Sesi login Anda habis. Silakan login kembali.')
      } else {
        alert('Gagal menyimpan: ' + e.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    const errs = validateStep(step, form, config)
    setErrors(errs)
    setShowedErrors(true)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await onSave()
      if (step === 6) onReview && onReview()
      else setStep(step + 1)
    } catch (e) {
      if (e.message === 'AUTH_EXPIRED') {
        alert('Sesi login Anda habis. Silakan login kembali.')
      } else {
        alert('Gagal menyimpan: ' + e.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => { if (step > 1) setStep(step - 1) }

  const StepComp = STEP_COMPONENTS[step]

  const saveLabel = mobile ? 'Simpan' : `Simpan ${STEP_NAMES[step]}`
  const nextLabel = step === 6 ? 'Tinjau' : (mobile ? 'Lanjut' : 'Lanjut')

  return (
    <div className="form-shell">
      <div className="form-header">
        {!mobile && (
          <Stepper variant={stepperVariant} current={step - 1} completed={completed.filter(s => s > 0).map(s => s - 1)}
            onJump={(i) => setStep(i + 1)} />
        )}
        {mobile && (
          <GlassCard style={{ padding: 16, borderRadius: 20 }}>
            <Stepper variant="minimal" current={step - 1} completed={completed.filter(s => s > 0).map(s => s - 1)} onJump={(i) => setStep(i + 1)} />
          </GlassCard>
        )}
      </div>

      <GlassCard className="form-body">
        {currentPeriod !== 'REGISTRATION' ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ marginBottom: 12 }}>Pendaftaran Ditutup</h2>
            <p style={{ color: 'var(--ink-600)', maxWidth: 400, margin: '0 auto 24px' }}>
              Masa pendaftaran telah berakhir pada 23 Mei 2026. Data Anda sedang dalam tahap {currentPeriod === 'VERIFICATION' ? 'verifikasi' : 'pengumuman'} dan tidak dapat diubah kembali.
            </p>
            <Button variant="outline-tosca" onClick={() => window.location.reload()}>Kembali ke Dashboard</Button>
          </div>
        ) : (
          StepComp && <StepComp form={form} setField={setField} errors={errors} mobile={mobile} applicantId={applicantId} />
        )}
      </GlassCard>

      {currentPeriod === 'REGISTRATION' && (
        <div className="sticky-bottom">
          <button className="btn btn-ghost" onClick={handleBack} disabled={step === 1 || saving}>
            <IChevronLeft size={16} /> {!mobile && 'Kembali'}
          </button>
          <div style={{ flex: 1 }} />
          {form.lastSaved && (
            <div className="save-status saved">
              <ICheck size={14} stroke={3} />
              {!mobile && <span>Tersimpan · {form.lastSaved}</span>}
            </div>
          )}
          <Button variant="outline-amber" loading={saving} onClick={handleSave}>
            <ISave size={16} /> {saveLabel}
          </Button>
          <Button variant="primary" loading={saving} onClick={handleNext}>
            {nextLabel} <IArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
