import React from 'react'
import { IAlert } from '../Icons.jsx'
import { GlassCard, Button } from '../Primitives.jsx'
import { STATUS_LABELS, STATUS_TABS, CAMPUS_TABS, TAB_FILTER, PRIORITY_ORDER } from './adminUtils.js'
import { useSubmissions } from './useSubmissions.js'
import { StatusPill, PriorityPill, ActionConfirmModal } from './components.jsx'
import { AdminDetailPage } from './AdminDetailPage.jsx'

export function PendaftarPanel({ mobile }) {
  const { submissions, loading, updateStatus } = useSubmissions()
  const [activeTab, setActiveTab] = React.useState('SEMUA')
  const [detailId, setDetailId] = React.useState(null)
  const [confirmAction, setConfirmAction] = React.useState(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusToast, setStatusToast] = React.useState(null)
  const itemsPerPage = 100

  // Reset pagination saat ganti tab
  React.useEffect(() => { setCurrentPage(1) }, [activeTab])

  const isMatch = (s, tab) => {
    if (tab === 'SEMUA') return true
    
    // Cek apakah tab adalah kampus
    if (CAMPUS_TABS.includes(tab)) {
      return (s.province || '').toUpperCase() === tab.toUpperCase() && s.is_submitted === true
    }

    const targetKey = TAB_FILTER[tab]
    if (targetKey === undefined) return false

    const sStatus = (s.status || 'submitted').toLowerCase()
    const tKey = targetKey.toLowerCase()

    // Khusus untuk DRAFT: cek kolom is_submitted
    if (tKey === 'draft') return s.is_submitted === false

    // Untuk tab lain: pendaftar HARUS sudah submitted
    if (s.is_submitted === false) return false

    // Match by key (pending) OR by label (menunggu)
    return sStatus === tKey || (STATUS_LABELS[tKey]?.label || '').toLowerCase() === sStatus
  }

  const filtered = React.useMemo(() => {
    let result = submissions.filter(s => isMatch(s, activeTab))
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase()
      result = result.filter(s =>
        (s.fullName || '').toUpperCase().includes(q) ||
        (s.nik || '').includes(q) ||
        (s.registrationNumber || '').toUpperCase().includes(q)
      )
    }
    return result
  }, [submissions, activeTab, searchQuery])

  // Sorting logic
  const isCampusTab = CAMPUS_TABS.includes(activeTab)
  const sorted = React.useMemo(() => [...filtered].sort((a, b) => {
    if (isCampusTab) {
      // Sort by Priority (1-Mampu)
      const pA = PRIORITY_ORDER[a.hkPriority] ?? 4
      const pB = PRIORITY_ORDER[b.hkPriority] ?? 4
      if (pA !== pB) return pA - pB
      // Then by Score (Highest first)
      return (b.grandScore || 0) - (a.grandScore || 0)
    }
    // Default: Newest first (already handled by useSubmissions fetch order)
    return 0
  }), [filtered, isCampusTab])

  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(sorted.length / itemsPerPage)

  const counts = React.useMemo(() => [...STATUS_TABS, ...CAMPUS_TABS].reduce((acc, tab) => {
    acc[tab] = submissions.filter(s => isMatch(s, tab)).length
    return acc
  }, {}), [submissions])

  if (detailId !== null) {
    const sub = submissions.find(s => s._idx === detailId)
    if (sub) return (
      <>
        <AdminDetailPage
          submission={sub}
          onBack={() => { setDetailId(null); setStatusToast(null) }}
          setConfirmAction={setConfirmAction}
          mobile={mobile}
          statusToast={statusToast}
        />
        {confirmAction && (
          <ActionConfirmModal
            action={confirmAction.status}
            onCancel={() => setConfirmAction(null)}
            onConfirm={() => {
              updateStatus(confirmAction.id, confirmAction.status)
              setStatusToast({ type: confirmAction.status })
              setConfirmAction(null)
              // Tetap di detail page — tidak setDetailId(null)
              setTimeout(() => setStatusToast(null), 4000)
            }}
            mobile={mobile}
          />
        )}
      </>
    )
  }

  // Loading state
  if (loading && submissions.length === 0) {
    return (
      <div className="dash-wrap" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 36, height: 36, color: 'var(--tosca-600)' }}></div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-500)', letterSpacing: '0.05em' }}>MEMUAT DATA PENDAFTAR...</div>
      </div>
    )
  }

  return (
    <div className="dash-wrap">
      <GlassCard className="dash-hero-card" style={{ padding: mobile ? '22px 20px' : '28px 32px' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Panel Admin</div>
          <h1>Manajemen Pendaftaran</h1>
          <p style={{ color: 'var(--ink-600)', marginTop: 6 }}>
            Tinjau dan triage pendaftaran masuk secara real-time dari database Supabase.
          </p>
        </div>
      </GlassCard>

      <div className="dash-grid">
        {Object.entries({ 
          'Total': submissions.length, 
          'Draft': counts['DRAFT'] || 0,
          'Menunggu': counts['MENUNGGU'] || 0, 
          'Lolos': counts['LOLOS ADMIN'] || 0, 
          'Ditolak': counts['DITOLAK'] || 0 
        }).map(([k, v]) => (
          <div key={k} className="dash-info">
            <div className="dash-info-label">{k}</div>
            <div className="dash-info-value">{v}</div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Cari berdasarkan nama, NIK, atau nomor registrasi…"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          style={{
            width: '100%', padding: '10px 16px', fontSize: 14, borderRadius: 10,
            border: '1px solid var(--ink-200)', background: 'var(--surface)',
            color: 'var(--ink-900)', outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Status Pendaftaran</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {STATUS_TABS.map((tab) => (
            <button key={tab}
              className={`proto-chip ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab} <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 4 }}>({counts[tab]})</span>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Per Kampus Tujuan</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CAMPUS_TABS.map((tab) => (
            <button key={tab}
              className={`proto-chip ${activeTab === tab ? 'active' : ''}`}
              style={{ borderColor: activeTab === tab ? 'var(--tosca-500)' : 'var(--ink-200)' }}
              onClick={() => setActiveTab(tab)}>
              {tab} <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 4 }}>({counts[tab]})</span>
            </button>
          ))}
        </div>
      </div>

      {paginated.length === 0 ? (
        <GlassCard style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <h3 style={{ marginBottom: 8 }}>
            {submissions.length === 0 ? 'Belum ada pendaftaran masuk' : 'Tidak ada data di tab ini'}
          </h3>
          <p className="muted" style={{ fontSize: 14, maxWidth: 480, margin: '0 auto 20px' }}>
            {submissions.length === 0
              ? 'Pendaftaran akan muncul di sini secara otomatis setelah pelamar mengirimkan formulir.'
              : 'Coba pilih tab lain atau refresh data.'}
          </p>

          {submissions.length === 0 && (
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: 16, maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ color: 'var(--amber-600)', marginTop: 2 }}><IAlert size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--amber-700)', marginBottom: 4 }}>Bantuan: Data tidak muncul?</div>
                  <p style={{ fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.5 }}>
                    Jika Anda yakin sudah ada data di Supabase tapi di sini tetap kosong, kemungkinan besar karena **Row Level Security (RLS)** di Supabase belum dikonfigurasi untuk mengizinkan akses Admin.
                  </p>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-600)' }}>
                    Pastikan Anda sudah menambahkan policy <code>SELECT USING (true)</code> untuk tabel <code>applicants</code> di SQL Editor Supabase.
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {paginated.map((s) => (
              <GlassCard key={s._idx} style={{ padding: mobile ? '12px 14px' : '14px 20px' }}>
                <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'stretch' : 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.fullName || '—'}</div>
                      <PriorityPill priority={s.hkPriority} />
                      {(s.skorPrestasi > 0 || isCampusTab) && (
                        <span className="pill pill-ink" style={{ fontSize: 9, background: 'var(--tosca-600)', color: '#fff' }}>
                          P: {s.skorPrestasi || 0}
                        </span>
                      )}
                      {(s.skorOrganisasi > 0 || isCampusTab) && (
                        <span className="pill pill-ink" style={{ fontSize: 9, background: 'var(--amber-600)', color: '#fff' }}>
                          O: {s.skorOrganisasi || 0}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                      <span className="mono">{s.registrationNumber || 'ETOS-26-DEMO'}</span>
                      {' · '}{s.province || '—'}
                      {s.submittedAt && !mobile && <> · {s.submittedAt}</>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTop: mobile ? '1px solid var(--ink-100)' : 'none', paddingTop: mobile ? 10 : 0 }}>
                    <StatusPill status={s.status || 'submitted'} />
                    <Button variant="outline-tosca" size="sm" onClick={() => setDetailId(s._idx)}>
                      Detail
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <div style={{ fontSize: 13, color: 'var(--ink-600)' }}>
                Halaman <strong>{currentPage}</strong> dari {totalPages}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Berikutnya
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
