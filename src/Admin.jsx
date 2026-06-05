// Admin.jsx — Admin panel wrapper
import React from 'react'
import { PendaftarPanel } from './admin/PendaftarPanel.jsx'
import { KonfigurasiPanel } from './admin/KonfigurasiPanel.jsx'

export function AdminPanel({ mobile }) {
  const [panelTab, setPanelTab] = React.useState('pendaftar')

  const PANEL_TABS = [
    { id: 'pendaftar',   label: 'Pendaftar' },
    { id: 'konfigurasi', label: 'Konfigurasi Form' },
  ]

  return (
    <div className="admin-panel-wrap">
      {/* Panel Tab Navigation */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 4, borderBottom: '2px solid var(--ink-100)' }}>
        {PANEL_TABS.map(tab => (
          <button key={tab.id} onClick={() => setPanelTab(tab.id)}
            style={{
              padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: panelTab === tab.id ? 700 : 500,
              color: panelTab === tab.id ? 'var(--tosca-700)' : 'var(--ink-500)',
              borderBottom: panelTab === tab.id ? '2px solid var(--tosca-600)' : '2px solid transparent',
              marginBottom: -2, transition: 'color .15s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {panelTab === 'pendaftar'   && <PendaftarPanel mobile={mobile} />}
      {panelTab === 'konfigurasi' && <KonfigurasiPanel mobile={mobile} />}
    </div>
  )
}
