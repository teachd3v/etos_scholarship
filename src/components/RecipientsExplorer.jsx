import React from 'react'
import recipientsData from '../data/recipientsData.json'
import { ISearch, IX, ICheck, ICopy, IUser, IMap, ITrophy } from '../Icons.jsx'

const CAMPUSES = [
  'Semua Kampus',
  'Universitas Andalas',
  'Universitas Jambi',
  'Universitas Gadjah Mada',
  'Universitas Tadulako',
  'Universitas Pattimura',
]

export function RecipientsExplorer() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCampus, setSelectedCampus] = React.useState('Semua Kampus')
  const [copiedEmail, setCopiedEmail] = React.useState(null)

  // Copy email handler
  const handleCopy = (email) => {
    if (!email || email === '-') return
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  // Filter logic
  const filteredRecipients = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return recipientsData.filter((r) => {
      const matchCampus =
        selectedCampus === 'Semua Kampus' || r.campus === selectedCampus

      const matchQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.studyProgram.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.registrationNumber.toLowerCase().includes(q) ||
        r.campus.toLowerCase().includes(q)

      return matchCampus && matchQuery
    })
  }, [searchQuery, selectedCampus])

  // Count per campus
  const countPerCampus = React.useMemo(() => {
    const counts = { 'Semua Kampus': recipientsData.length }
    for (const r of recipientsData) {
      counts[r.campus] = (counts[r.campus] || 0) + 1
    }
    return counts
  }, [])

  return (
    <div className="recipients-explorer">
      <style>{`
        .recipients-explorer {
          width: 100%;
          margin-top: 32px;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Controls Section */
        .controls-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
          margin-bottom: 24px;
        }

        .search-box-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          margin-bottom: 18px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          color: #94a3b8;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 14px 44px 14px 48px;
          border-radius: 999px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          font-size: 14.5px;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          border-color: #0d9488;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.12);
        }

        .clear-btn {
          position: absolute;
          right: 14px;
          background: #e2e8f0;
          border: none;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .clear-btn:hover {
          background: #cbd5e1;
        }

        /* Campus Pills */
        .campus-pills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .campus-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .campus-pill:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .campus-pill.active {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          color: #ffffff;
          border-color: #0d9488;
          box-shadow: 0 6px 14px -3px rgba(13, 148, 136, 0.35);
        }

        .pill-count {
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.07);
          font-weight: 700;
        }

        .campus-pill.active .pill-count {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        /* Results Stats Bar */
        .results-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 0 4px;
        }

        .results-count {
          font-size: 13.5px;
          color: #64748b;
          font-weight: 500;
        }

        .results-count strong {
          color: #0f172a;
        }

        .reset-filter-btn {
          background: none;
          border: none;
          color: #0d9488;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
        }

        .reset-filter-btn:hover {
          text-decoration: underline;
        }

        /* Desktop Table View */
        .table-card {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }

        .recipients-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .recipients-table th {
          background: #f8fafc;
          padding: 16px 20px;
          font-size: 11.5px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom: 1px solid #e2e8f0;
        }

        .recipients-table td {
          padding: 14px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13.5px;
          color: #1e293b;
          vertical-align: middle;
        }

        .recipients-table tbody tr {
          transition: background 0.15s ease;
        }

        .recipients-table tbody tr:hover {
          background: #f8fafc;
        }

        .recipients-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* Avatar styling */
        .avatar-wrapper {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          overflow: hidden;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gender-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }

        .gender-badge.perempuan {
          background: #fdf2f8;
          color: #be185d;
          border: 1px solid #fbcfe8;
        }

        .gender-badge.laki-laki {
          background: #f0f9ff;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }

        .campus-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: #0d9488;
          background: #f0fdfa;
          border: 1px solid #ccfbf1;
          padding: 3px 8px;
          border-radius: 6px;
          margin-bottom: 3px;
        }

        .prodi-text {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.3;
        }

        .email-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12.5px;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .email-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .email-btn.copied {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }

        /* Mobile Cards View */
        .mobile-cards-list {
          display: none;
          flex-direction: column;
          gap: 12px;
        }

        .recipient-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recipient-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .recipient-card-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
        }

        /* Empty State */
        .empty-state {
          padding: 48px 24px;
          text-align: center;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
        }

        .empty-state-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #f1f5f9;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          margin-bottom: 14px;
        }

        @media (max-width: 768px) {
          .table-card {
            display: none;
          }
          .mobile-cards-list {
            display: flex;
          }
          .controls-card {
            padding: 16px;
            border-radius: 20px;
          }
          .campus-pills-container {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 6px;
            -webkit-overflow-scrolling: touch;
          }
          .campus-pill {
            white-space: nowrap;
            flex-shrink: 0;
            padding: 7px 14px;
            font-size: 12.5px;
          }
        }
      `}</style>

      {/* Search & Filter Header Card */}
      <div className="controls-card">
        {/* Search Box */}
        <div className="search-box-wrapper">
          <span className="search-icon">
            <ISearch size={18} />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Ketik nama peserta, program studi, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-btn"
              onClick={() => setSearchQuery('')}
              title="Hapus pencarian"
            >
              <IX size={12} />
            </button>
          )}
        </div>

        {/* Campus Filter Pills */}
        <div className="campus-pills-container">
          {CAMPUSES.map((campus) => {
            const count = countPerCampus[campus] || 0
            const isActive = selectedCampus === campus
            return (
              <button
                key={campus}
                className={`campus-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCampus(campus)}
              >
                <span>{campus}</span>
                <span className="pill-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Bar */}
      <div className="results-bar">
        <div className="results-count">
          Menampilkan <strong>{filteredRecipients.length}</strong> dari{' '}
          <strong>{recipientsData.length}</strong> Penerima Beasiswa Etos ID 2026
        </div>
        {(searchQuery || selectedCampus !== 'Semua Kampus') && (
          <button
            className="reset-filter-btn"
            onClick={() => {
              setSearchQuery('')
              setSelectedCampus('Semua Kampus')
            }}
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Data Presentation */}
      {filteredRecipients.length === 0 ? (
        /* Empty State */
        <div className="empty-state">
          <div className="empty-state-icon">
            <ISearch size={28} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            Data Tidak Ditemukan
          </h3>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 16px 0' }}>
            Tidak ada calon penerima yang cocok dengan kata kunci "<strong>{searchQuery}</strong>"
            {selectedCampus !== 'Semua Kampus' ? ` di ${selectedCampus}` : ''}.
          </p>
          <button
            className="campus-pill active"
            onClick={() => {
              setSearchQuery('')
              setSelectedCampus('Semua Kampus')
            }}
          >
            Tampilkan Semua Data (32)
          </button>
        </div>
      ) : (
        <>
          {/* 1. Desktop Table */}
          <div className="table-card">
            <table className="recipients-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>No</th>
                  <th style={{ width: 70 }}>Foto</th>
                  <th>Nama Penerima Beasiswa</th>
                  <th style={{ width: 130 }}>Gender</th>
                  <th>Kampus & Program Studi</th>
                  <th>Kontak Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipients.map((r, idx) => {
                  const isCopied = copiedEmail === r.email
                  return (
                    <tr key={r.registrationNumber}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#94a3b8' }}>
                        {idx + 1}
                      </td>

                      {/* Avatar */}
                      <td>
                        <div className="avatar-wrapper">
                          <img
                            src={r.avatar}
                            alt={r.name}
                            className="avatar-img"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.parentNode.innerHTML = `<span style="font-size: 14px; font-weight: 700; color: #0d9488;">${r.name.charAt(0)}</span>`
                            }}
                          />
                        </div>
                      </td>

                      {/* Nama & No Registrasi */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14.5 }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                          {r.registrationNumber}
                        </div>
                      </td>

                      {/* Gender */}
                      <td>
                        <span
                          className={`gender-badge ${
                            r.gender.toLowerCase() === 'laki-laki' ? 'laki-laki' : 'perempuan'
                          }`}
                        >
                          {r.gender}
                        </span>
                      </td>

                      {/* Kampus & Prodi */}
                      <td>
                        <div>
                          <span className="campus-badge">
                            {r.campus} ({r.city})
                          </span>
                        </div>
                        <div className="prodi-text">{r.studyProgram}</div>
                      </td>

                      {/* Email */}
                      <td>
                        {r.email && r.email !== '-' ? (
                          <button
                            className={`email-btn ${isCopied ? 'copied' : ''}`}
                            onClick={() => handleCopy(r.email)}
                            title="Klik untuk salin email"
                          >
                            {isCopied ? <ICheck size={13} /> : <ICopy size={13} />}
                            <span>{r.email}</span>
                            {isCopied && (
                              <span style={{ fontSize: 10, fontWeight: 700 }}>Tersalin</span>
                            )}
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 2. Mobile Cards List */}
          <div className="mobile-cards-list">
            {filteredRecipients.map((r, idx) => {
              const isCopied = copiedEmail === r.email
              return (
                <div key={r.registrationNumber} className="recipient-card">
                  <div className="recipient-card-header">
                    <div className="avatar-wrapper" style={{ width: 52, height: 52 }}>
                      <img
                        src={r.avatar}
                        alt={r.name}
                        className="avatar-img"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentNode.innerHTML = `<span style="font-size: 16px; font-weight: 700; color: #0d9488;">${r.name.charAt(0)}</span>`
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.name}
                        </h4>
                        <span
                          className={`gender-badge ${
                            r.gender.toLowerCase() === 'laki-laki' ? 'laki-laki' : 'perempuan'
                          }`}
                          style={{ fontSize: 11, padding: '2px 8px' }}
                        >
                          {r.gender}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                        No. {idx + 1} • {r.registrationNumber}
                      </div>
                    </div>
                  </div>

                  <div className="recipient-card-body">
                    <div>
                      <span className="campus-badge" style={{ fontSize: 11 }}>
                        {r.campus} ({r.city})
                      </span>
                      <div className="prodi-text" style={{ fontSize: 13, marginTop: 2 }}>
                        {r.studyProgram}
                      </div>
                    </div>

                    {r.email && r.email !== '-' && (
                      <div style={{ marginTop: 4 }}>
                        <button
                          className={`email-btn ${isCopied ? 'copied' : ''}`}
                          onClick={() => handleCopy(r.email)}
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          {isCopied ? <ICheck size={13} /> : <ICopy size={13} />}
                          <span style={{ fontSize: 12 }}>{r.email}</span>
                          {isCopied && <span style={{ fontSize: 10, fontWeight: 700 }}>Tersalin</span>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
