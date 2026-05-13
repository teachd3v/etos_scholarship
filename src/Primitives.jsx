// Primitives.jsx — shared UI primitives
import React from 'react'
import { IAlert, ICheck } from './Icons.jsx'

export function GlassCard({ children, style, className = '', ...rest }) {
  return <div className={`glass ${className}`} style={style} {...rest}>{children}</div>
}

export function AbstractShapes() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="gHero" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#0C5E59" />
          <stop offset="1" stopColor="#062E2B" />
        </linearGradient>
        <pattern id="gridDot" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill="rgba(255,255,255,0.09)"/>
        </pattern>
        <radialGradient id="gGlowTop" cx="75%" cy="10%" r="55%">
          <stop offset="0" stopColor="#14B8A6" stopOpacity="0.2" />
          <stop offset="1" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gGlowBot" cx="10%" cy="95%" r="50%">
          <stop offset="0" stopColor="#0F766E" stopOpacity="0.28" />
          <stop offset="1" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base + texture */}
      <rect width="800" height="1000" fill="url(#gHero)" />
      <rect width="800" height="1000" fill="url(#gridDot)" />
      <rect width="800" height="1000" fill="url(#gGlowTop)" />
      <rect width="800" height="1000" fill="url(#gGlowBot)" />

      {/* Subtle concentric rings — top right */}
      <circle cx="820" cy="-30" r="260" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <circle cx="820" cy="-30" r="180" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

      {/* Subtle arc — bottom left */}
      <circle cx="-40" cy="1060" r="380" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Amber accent dots — restrained */}
      <circle cx="672" cy="58" r="5.5" fill="#FBBF24" opacity="0.85" />
      <circle cx="694" cy="76" r="3"   fill="#FDE68A" opacity="0.55" />
    </svg>
  )
}

export function Button({ variant = 'primary', size, block, loading, disabled, children, onClick, type = 'button', style, title }) {
  const cls = ['btn', `btn-${variant}`]
  if (size === 'sm') cls.push('btn-sm')
  if (size === 'lg') cls.push('btn-lg')
  if (block) cls.push('btn-block')
  return (
    <button type={type} title={title} className={cls.join(' ')} onClick={onClick} disabled={disabled || loading} style={style}>
      {loading && <span className="spinner" />}
      {children}
    </button>
  )
}

export function Field({ label, hint, error, required, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label">
          {label}{required && <span style={{ color: 'var(--danger-500)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {error && <div className="field-error"><IAlert size={12} /> {error}</div>}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}

export function Input({ error, onChange, type, autoComplete, ...rest }) {
  // Field password (termasuk saat di-"show" jadi type='text') tidak boleh auto-uppercase
  const isPasswordField =
    type === 'password' ||
    autoComplete === 'current-password' ||
    autoComplete === 'new-password'
  const handleChange = (e) => {
    if ((!type || type === 'text') && !isPasswordField && e.target.value) {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value = e.target.value.toUpperCase();
      window.requestAnimationFrame(() => {
        if(e.target.setSelectionRange && document.activeElement === e.target) {
            e.target.setSelectionRange(start, end);
        }
      });
    }
    onChange && onChange(e);
  }
  return <input type={type} autoComplete={autoComplete} className={`input ${error ? 'has-error' : ''}`} onChange={handleChange} {...rest} />
}
export function Textarea({ error, ...rest }) { return <textarea className={`textarea ${error ? 'has-error' : ''}`} {...rest} /> }
export function Select({ error, children, ...rest }) { return <select className={`select ${error ? 'has-error' : ''}`} {...rest}>{children}</select> }

export function Checkbox({ checked, onChange, children, disabled }) {
  return (
    <label className="check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange && onChange(e.target.checked)} disabled={disabled} />
      <span className="box" />
      <span>{children}</span>
    </label>
  )
}

// ─────────────────────────────────────────────────────────────
// Stepper — three variants
// ─────────────────────────────────────────────────────────────
export const STEP_LABELS = [
  'Data Pribadi', 'Keluarga', 'Ekonomi',
  'Prestasi', 'Organisasi', 'Esai'
]

export function Stepper({ variant = 'default', current = 0, completed = [], onJump }) {
  if (variant === 'rail') return <StepperRail current={current} completed={completed} onJump={onJump} />
  if (variant === 'minimal') return <StepperMinimal current={current} completed={completed} onJump={onJump} />
  return <StepperNumbered current={current} completed={completed} onJump={onJump} />
}

function StepperNumbered({ current, completed, onJump }) {
  return (
    <div className="stepper stepper-numbered">
      {STEP_LABELS.map((label, i) => {
        const isDone = completed.includes(i)
        const isActive = i === current
        const cls = isActive ? 'is-active' : isDone ? 'is-done' : 'is-idle'
        return (
          <React.Fragment key={i}>
            <button className={`step ${cls}`} onClick={() => onJump && onJump(i)} type="button">
              <span className="step-marker">
                {isDone ? <ICheck size={14} stroke={3} /> : <span>{i + 1}</span>}
              </span>
              <span className="step-label">{label}</span>
            </button>
            {i < STEP_LABELS.length - 1 && <span className={`step-line ${isDone ? 'is-done' : ''}`} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function StepperMinimal({ current, completed, onJump }) {
  return (
    <div className="stepper stepper-minimal">
      <div className="minimal-head">
        <div className="minimal-eyebrow">Langkah {current + 1} dari {STEP_LABELS.length}</div>
        <div className="minimal-title">{STEP_LABELS[current]}</div>
      </div>
      <div className="minimal-bars">
        {STEP_LABELS.map((_, i) => {
          const isDone = completed.includes(i)
          const isActive = i === current
          return (
            <button key={i} type="button" onClick={() => onJump && onJump(i)}
              className={`mbar ${isActive ? 'is-active' : isDone ? 'is-done' : ''}`} title={STEP_LABELS[i]} />
          )
        })}
      </div>
    </div>
  )
}

function StepperRail({ current, completed, onJump }) {
  return (
    <div className="stepper stepper-rail">
      {STEP_LABELS.map((label, i) => {
        const isDone = completed.includes(i)
        const isActive = i === current
        const cls = isActive ? 'is-active' : isDone ? 'is-done' : 'is-idle'
        return (
          <button key={i} type="button" onClick={() => onJump && onJump(i)} className={`rail-item ${cls}`}>
            <span className="rail-dot">
              {isDone ? <ICheck size={12} stroke={3} /> : <span>{i + 1}</span>}
            </span>
            <span className="rail-body">
              <span className="rail-kicker">Step {i + 1}</span>
              <span className="rail-label">{label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
