import React from 'react'
import { STATUS_LABELS } from './adminUtils.js'
import { GlassCard, Button } from '../Primitives.jsx'
import { ICheck, IX } from '../Icons.jsx'

export function StatusPill({ status }) {
  const info = STATUS_LABELS[status] || STATUS_LABELS.submitted
  return <span className={`pill ${info.pill}`}>{info.label}</span>
}

export function PriorityPill({ priority }) {
  if (!priority) return null
  let cls = 'pill-ink'
  if (priority === 'PRIORITAS 1') cls = 'pill-danger'
  if (priority === 'PRIORITAS 2') cls = 'pill-amber'
  if (priority === 'PRIORITAS 3') cls = 'pill-tosca'
  return <span className={`pill ${cls}`} style={{ fontSize: 10 }}>{priority}</span>
}

export function ActionConfirmModal({ action, onConfirm, onCancel, mobile }) {
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

export function SectionCard({ title, children, padding = 20 }) {
  return (
    <GlassCard style={{ padding, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>{title}</div>
      {children}
    </GlassCard>
  );
}
