import React from 'react'
import { IAlert } from '../Icons.jsx'
import { GlassCard, Button } from '../Primitives.jsx'
import { STATUS_LABELS, STATUS_TABS, CAMPUS_TABS, TAB_FILTER, PRIORITY_ORDER, getLolosQuota } from './adminUtils.js'
import { useSubmissions } from './useSubmissions.js'
import { StatusPill, PriorityPill, ActionConfirmModal, QuotaWarningModal } from './components.jsx'
import { AdminDetailPage } from './AdminDetailPage.jsx'

export function PendaftarPanel({ mobile, adminCampus }) {
  const { submissions, loading, updateStatus } = useSubmissions()
  const [activeTab, setActiveTab] = React.useState('SEMUA')
  const isCampusTab = CAMPUS_TABS.includes(activeTab) || !!adminCampus
  const [detailId, setDetailId] = React.useState(null)
  const [confirmAction, setConfirmAction] = React.useState(null)
  const [quotaWarning, setQuotaWarning] = React.useState(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusToast, setStatusToast] = React.useState(null)
  const itemsPerPage = 100

  // Export submissions to CSV/Excel format
  const handleExportExcel = () => {
    const isLolos = activeTab === 'LOLOS ADMIN';
    const targets = isLolos
      ? campusSubmissions.filter(s => s.status === 'approved' || s.status === 'Lolos Admin')
      : campusSubmissions.filter(s => s.status === 'waiting' || s.status === 'Waiting List');
    
    if (targets.length === 0) {
      alert(`Tidak ada data pendaftar yang ${isLolos ? 'Lolos Admin' : 'Waiting List'} untuk diexport.`);
      return;
    }

    const headers = [
      'No. Registrasi',
      'Nama Lengkap',
      'NIK',
      'No. KK',
      'Email',
      'No. WhatsApp',
      'Kampus Tujuan',
      'Program Studi',
      'Skor Ekonomi',
      'Skor Prestasi',
      'Skor Organisasi',
      'Total Skor',
      'Prioritas Had Kifayah',
      'Status'
    ];

    const rows = targets.map(s => [
      s.registrationNumber || '',
      s.fullName || '',
      `="${s.nik || ''}"`, // Force text format in Excel to prevent truncation of leading zeros
      `="${s.noKK || ''}"`,
      s.email || '',
      `="${s.phone || ''}"`,
      s.province || '',
      s.studyProgram || '',
      s.skorEkonomi ?? 0,
      s.skorPrestasi ?? 0,
      s.skorOrganisasi ?? 0,
      s.grandScore ?? 0,
      s.hkPriority || '—',
      isLolos ? 'LOLOS ADMIN' : 'WAITING LIST'
    ]);

    const csvContent = 'sep=,\n' + [headers.join(','), ...rows.map(r => r.map(val => {
      const stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    }).join(','))].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const labelFile = isLolos ? 'Lolos_Admin' : 'Waiting_List';
    const filename = `Pendaftar_${labelFile}_${adminCampus ? adminCampus.replace(/\s+/g, '_') : 'Nasional'}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter submissions by admin's campus if campus scope is set
  const campusSubmissions = React.useMemo(() => {
    if (!adminCampus) return submissions
    // For campus admins, filter out draft submissions (only show submitted)
    return submissions.filter(s => 
      (s.province || '').toUpperCase() === adminCampus.toUpperCase() && 
      s.is_submitted === true
    )
  }, [submissions, adminCampus])

  // Reset pagination saat ganti tab
  React.useEffect(() => { setCurrentPage(1) }, [activeTab])

  const isMatch = (s, tab) => {
    if (!tab) return false
    const cleanTab = tab.trim().toUpperCase()

    if (cleanTab === 'SEMUA') {
      if (adminCampus) {
        return s.is_submitted === true
      }
      return true
    }
    
    // Cek apakah tab adalah kampus (tampilkan semua yang berstatus submitted dari kampus tersebut)
    const isCampus = CAMPUS_TABS.some(c => c.trim().toUpperCase() === cleanTab)
    if (isCampus) {
      return (s.province || '').trim().toUpperCase() === cleanTab && 
             s.is_submitted === true
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
    let result = campusSubmissions.filter(s => isMatch(s, activeTab))
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
  }, [campusSubmissions, activeTab, searchQuery])

  // Sorting logic: For 'LOLOS ADMIN', sort purely by submission time (newest first).
  // For other tabs (including campus view), sort by Status (Lolos -> Waiting -> Ditolak -> Submit),
  // then internally by Priority -> Grand Score -> Skor Prestasi -> Skor Organisasi -> submittedAt DESC.
  const sorted = React.useMemo(() => [...filtered].sort((a, b) => {
    if (activeTab === 'LOLOS ADMIN') {
      const timeA = a.submittedAtRaw ? new Date(a.submittedAtRaw).getTime() : 0
      const timeB = b.submittedAtRaw ? new Date(b.submittedAtRaw).getTime() : 0
      return timeB - timeA
    }

    if (isCampusTab) {
      const getStatusWeight = (status) => {
        const s = (status || '').toLowerCase()
        if (s === 'approved' || s === 'lolos admin') return 1
        if (s === 'waiting' || s === 'waiting list') return 2
        if (s === 'rejected' || s === 'ditolak') return 3
        return 4 // submitted / pending
      }
      const wA = getStatusWeight(a.status)
      const wB = getStatusWeight(b.status)
      if (wA !== wB) return wA - wB
    }

    // 1. Sort by Priority (1-Mampu)
    const pA = PRIORITY_ORDER[a.hkPriority] ?? 4
    const pB = PRIORITY_ORDER[b.hkPriority] ?? 4
    if (pA !== pB) return pA - pB

    // 2. Sort by Grand Score (Highest first)
    const diffGrand = (b.grandScore || 0) - (a.grandScore || 0)
    if (diffGrand !== 0) return diffGrand

    // 3. Sort by Skor Prestasi (Highest first)
    const diffPrestasi = (b.skorPrestasi || 0) - (a.skorPrestasi || 0)
    if (diffPrestasi !== 0) return diffPrestasi

    // 4. Sort by Skor Organisasi (Highest first)
    const diffOrganisasi = (b.skorOrganisasi || 0) - (a.skorOrganisasi || 0)
    if (diffOrganisasi !== 0) return diffOrganisasi

    // 5. Stable fallback: newest submitted first
    const timeA = a.submittedAtRaw ? new Date(a.submittedAtRaw).getTime() : 0
    const timeB = b.submittedAtRaw ? new Date(b.submittedAtRaw).getTime() : 0
    return timeB - timeA
  }), [filtered, activeTab, isCampusTab])

  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(sorted.length / itemsPerPage)

  const counts = React.useMemo(() => [...STATUS_TABS, ...CAMPUS_TABS].reduce((acc, tab) => {
    acc[tab] = campusSubmissions.filter(s => isMatch(s, tab)).length
    return acc
  }, {}), [campusSubmissions])

  if (detailId !== null) {
    const sub = campusSubmissions.find(s => s._idx === detailId)
    if (sub) return (
      <>
        <AdminDetailPage
          submission={sub}
          onBack={() => { setDetailId(null); setStatusToast(null) }}
          setConfirmAction={setConfirmAction}
          mobile={mobile}
          statusToast={statusToast}
          adminCampus={adminCampus}
        />
        {confirmAction && (
          <ActionConfirmModal
            action={confirmAction.status}
            onCancel={() => setConfirmAction(null)}
            onConfirm={() => {
              const applicant = submissions.find(s => s._idx === confirmAction.id)
              if (applicant) {
                const campusName = (applicant.province || '').trim().toUpperCase()
                if (confirmAction.status === 'approved') {
                  const approvedCount = submissions.filter(s => 
                    s.is_submitted === true &&
                    (s.province || '').trim().toUpperCase() === campusName &&
                    (s.status === 'approved' || s.status === 'Lolos Admin')
                  ).length
                  const isAlreadyApproved = applicant.status === 'approved' || applicant.status === 'Lolos Admin'
                  const maxLolos = getLolosQuota(applicant.province)
                  if (!isAlreadyApproved && approvedCount >= maxLolos) {
                    setQuotaWarning({
                      title: 'Kuota Lolos Terpenuhi',
                      message: `Kuota "Lolos Admin" untuk ${applicant.province} sudah terpenuhi (Maksimal ${maxLolos} orang). Anda tidak dapat meloloskan pendaftar lagi untuk kampus ini.`
                    })
                    setConfirmAction(null)
                    return
                  }
                } else if (confirmAction.status === 'waiting') {
                  const waitingCount = submissions.filter(s => 
                    s.is_submitted === true &&
                    (s.province || '').trim().toUpperCase() === campusName &&
                    (s.status === 'waiting' || s.status === 'Waiting List')
                  ).length
                  const isAlreadyWaiting = applicant.status === 'waiting' || applicant.status === 'Waiting List'
                  if (!isAlreadyWaiting && waitingCount >= 15) {
                    setQuotaWarning({
                      title: 'Kuota Waiting List Terpenuhi',
                      message: `Kuota "Waiting List" untuk ${applicant.province} sudah terpenuhi (Maksimal 15 orang). Anda tidak dapat memasukkan pendaftar lagi ke waiting list untuk kampus ini.`
                    })
                    setConfirmAction(null)
                    return
                  }
                }
              }

              updateStatus(confirmAction.id, confirmAction.status)
              setStatusToast({ type: confirmAction.status })
              setConfirmAction(null)
              // Tetap di detail page — tidak setDetailId(null)
              setTimeout(() => setStatusToast(null), 4000)
            }}
            mobile={mobile}
          />
        )}
        {quotaWarning && (
          <QuotaWarningModal
            title={quotaWarning.title}
            message={quotaWarning.message}
            onClose={() => setQuotaWarning(null)}
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
          <p style={{ color: 'var(--ink-600)', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {adminCampus ? (
              <span className="pill-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                🏢 Kampus Mitra: {adminCampus}
              </span>
            ) : (
              'Tinjau dan triage pendaftaran masuk secara real-time dari database Supabase.'
            )}
          </p>
        </div>
      </GlassCard>

      <div className="dash-grid">
        {Object.entries({ 
          'Total': campusSubmissions.length, 
          'Submit': counts['SUBMIT'] || 0, 
          'Lolos': counts['LOLOS ADMIN'] || 0, 
          'Waiting': counts['WAITING LIST'] || 0, 
          'Ditolak': counts['DITOLAK'] || 0 
        }).map(([k, v]) => {
          const quota = k === 'Lolos' 
            ? (adminCampus ? getLolosQuota(adminCampus) : 102) 
            : (k === 'Waiting' ? (adminCampus ? 15 : 75) : null);
          const isOverLimit = quota !== null && v > quota;
          return (
            <div key={k} className="dash-info" style={isOverLimit ? { borderColor: 'var(--danger-400)', background: 'rgba(239,68,68,0.05)' } : {}}>
              <div className="dash-info-label">
                {k} {quota !== null && <span style={{ opacity: 0.7, fontSize: 11 }}>(Kuota: {quota})</span>}
              </div>
              <div className="dash-info-value" style={isOverLimit ? { color: 'var(--danger-600)' } : {}}>{v}</div>
              {isOverLimit && (
                <div style={{ fontSize: 10, color: 'var(--danger-500)', fontWeight: 600, marginTop: 4 }}>
                  Melebihi kuota {quota}!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Search bar & Export */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Cari berdasarkan nama, NIK, atau nomor registrasi…"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          style={{
            flex: 1, padding: '10px 16px', fontSize: 14, borderRadius: 10,
            border: '1px solid var(--ink-200)', background: 'var(--surface)',
            color: 'var(--ink-900)', outline: 'none',
          }}
        />
        {(activeTab === 'LOLOS ADMIN' || activeTab === 'WAITING LIST') && (
          <Button variant="primary" size="md" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            📥 Export Excel
          </Button>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Status Pendaftaran</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {STATUS_TABS.map((tab) => {
            const isLolosTab = tab === 'LOLOS ADMIN';
            const isWaitingTab = tab === 'WAITING LIST';
            let tabQuota = '';
            if (isLolosTab) {
              tabQuota = adminCampus ? `/${getLolosQuota(adminCampus)}` : '/102';
            } else if (isWaitingTab) {
              tabQuota = adminCampus ? '/15' : '/75';
            }
            return (
              <button key={tab}
                className={`proto-chip ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {tab} <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 4 }}>({counts[tab]}{tabQuota})</span>
              </button>
            );
          })}
        </div>

        {!adminCampus && (
          <>
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
          </>
        )}
      </div>

      {paginated.length === 0 ? (
        <GlassCard style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <h3 style={{ marginBottom: 8 }}>
            {campusSubmissions.length === 0 ? 'Belum ada pendaftaran masuk' : 'Tidak ada data di tab ini'}
          </h3>
          <p className="muted" style={{ fontSize: 14, maxWidth: 480, margin: '0 auto 20px' }}>
            {campusSubmissions.length === 0
              ? 'Pendaftaran akan muncul di sini secara otomatis setelah pelamar mengirimkan formulir.'
              : 'Coba pilih tab lain atau refresh data.'}
          </p>

          {campusSubmissions.length === 0 && (
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
            {paginated.map((s, idx) => {
              const serialNumber = (currentPage - 1) * itemsPerPage + idx + 1
              return (
                <GlassCard key={s._idx} style={{ padding: mobile ? '12px 14px' : '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: mobile ? 28 : 36,
                      height: mobile ? 28 : 36,
                      borderRadius: 8,
                      background: 'var(--ink-100)',
                      color: 'var(--ink-600)',
                      fontSize: mobile ? 11 : 13,
                      fontWeight: 700,
                      border: '1px solid var(--ink-200)',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono, monospace)'
                    }}>
                      {serialNumber}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'stretch' : 'center', gap: 12 }}>
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
                  </div>
                </GlassCard>
              )
            })}
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
