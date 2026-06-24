import React from 'react'
import { STATUS_LABELS } from './adminUtils.js'
import { GlassCard, Button } from '../Primitives.jsx'
import { ICheck, IX, IAlert } from '../Icons.jsx'

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
  const isApproved = action === 'approved'
  const isWaiting = action === 'waiting'
  const isSubmitted = action === 'submitted'

  let bg = 'var(--danger-50)'
  let color = 'var(--danger-500)'
  let icon = <IX size={28} />
  let title = 'Tolak Pendaftar?'
  let desc = 'Pendaftar akan dinyatakan Tidak Lolos dan statusnya akan diperbarui secara real-time.'
  let btnVariant = 'danger'

  if (isApproved) {
    bg = 'var(--tosca-100)'
    color = 'var(--tosca-700)'
    icon = <ICheck size={28} />
    title = 'Loloskan Pendaftar?'
    desc = 'Pendaftar akan dinyatakan Lolos Administrasi dan statusnya akan diperbarui secara real-time.'
    btnVariant = 'primary'
  } else if (isWaiting) {
    bg = 'rgba(251, 191, 36, 0.18)'
    color = 'var(--amber-600)'
    icon = <IAlert size={28} />
    title = 'Masukkan Waiting List?'
    desc = 'Pendaftar akan dimasukkan ke dalam daftar tunggu (Waiting List) dan statusnya akan diperbarui.'
    btnVariant = 'primary'
  } else if (isSubmitted) {
    bg = 'rgba(59, 130, 246, 0.15)'
    color = '#1D4ED8'
    icon = <IAlert size={28} />
    title = 'Batalkan Status / Reset?'
    desc = 'Status pendaftar akan dikembalikan ke awal (SUBMIT / Belum Diproses).'
    btnVariant = 'primary'
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 10001 }} onClick={onCancel}>
      <GlassCard
        onClick={e => e.stopPropagation()}
        style={{ width: 340, padding: 32, textAlign: 'center' }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: bg,
          color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
        }}>
          {icon}
        </div>

        <h3 style={{ fontSize: 20, marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ink-600)', marginBottom: 28, lineHeight: 1.5 }}>
          {desc}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="ghost" block onClick={onCancel}>Batal</Button>
          <Button variant={btnVariant} block onClick={onConfirm}>
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
