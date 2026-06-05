import React from 'react'
import { ICheck } from '../Icons.jsx'

export function VerifyBlock({ items, checks, notes, onToggle, onNote }) {
  const allDone = items.length > 0 && items.every(({ id }) => !!checks[id])
  return (
    <div style={{
      marginTop: 14, padding: '12px 14px',
      background: allDone ? 'rgba(12, 94, 89, 0.07)' : 'rgba(12, 94, 89, 0.04)',
      borderRadius: 10,
      border: `1px solid ${allDone ? 'rgba(12, 94, 89, 0.25)' : 'rgba(12, 94, 89, 0.12)'}`,
      transition: 'background .2s, border-color .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tosca-700)' }}>
          Ceklis Verifikasi
        </span>
        {allDone && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--tosca-600)', fontWeight: 600 }}>
            <ICheck size={12} /> Selesai
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(({ id, label }) => {
          const done = !!checks[id]
          const note = notes?.[id] || ''
          return (
            <div key={id} style={{
              borderRadius: 8,
              background: done ? 'rgba(12, 94, 89, 0.1)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${done ? 'rgba(12, 94, 89, 0.2)' : 'var(--ink-100)'}`,
              transition: 'background .15s, border-color .15s',
              overflow: 'hidden',
            }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                padding: '7px 10px',
              }}>
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onToggle(id)}
                  style={{ width: 16, height: 16, accentColor: 'var(--tosca-600)', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{
                  fontSize: 13, flex: 1,
                  color: done ? 'var(--tosca-800)' : 'var(--ink-700)',
                  fontWeight: done ? 600 : 400,
                  textDecoration: done ? 'line-through' : 'none',
                  textDecorationColor: 'var(--tosca-500)',
                  transition: 'color .15s, text-decoration .15s',
                }}>
                  {label}
                </span>
                {done && <ICheck size={14} style={{ color: 'var(--tosca-600)', flexShrink: 0 }} />}
              </label>
              {done && (
                <div style={{ padding: '0 10px 8px 36px' }}>
                  <input
                    type="text"
                    placeholder="Tambah catatan… (opsional)"
                    value={note}
                    onChange={e => onNote(id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: '100%', fontSize: 12, padding: '5px 10px',
                      borderRadius: 6, border: '1px solid rgba(12, 94, 89, 0.25)',
                      background: 'rgba(255,255,255,0.7)',
                      color: 'var(--ink-700)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
