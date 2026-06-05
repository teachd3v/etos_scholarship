import { DEFAULT_CONFIG } from '../lib/defaultConfig.js'
import { dbToForm } from '../lib/applicant.js'

export const STATUS_LABELS = {
  submitted: { label: 'MENUNGGU', pill: 'pill-amber' },
  approved: { label: 'LOLOS ADMIN', pill: 'pill-ok' },
  needs_review: { label: 'PERLU VERIFIKASI', pill: 'pill-tosca' },
  rejected: { label: 'DITOLAK', pill: 'pill-danger' },
}

export const STATUS_TABS = ['SEMUA', 'DRAFT', 'MENUNGGU', 'LOLOS ADMIN', 'PERLU VERIFIKASI', 'DITOLAK']
export const CAMPUS_TABS = DEFAULT_CONFIG.target_universities || []

export const TAB_FILTER = {
  'SEMUA': null,
  'DRAFT': 'draft',
  'MENUNGGU': 'submitted',
  'LOLOS ADMIN': 'approved',
  'PERLU VERIFIKASI': 'needs_review',
  'DITOLAK': 'rejected',
}

export const PRIORITY_ORDER = {
  'PRIORITAS 1': 0,
  'PRIORITAS 2': 1,
  'PRIORITAS 3': 2,
  'MAMPU': 3,
  '': 4,
  null: 4
}

// Map doc_type → field name di submission object (legacy admin naming)
export const DOC_TYPE_TO_SUB_FIELD = {
  photo:           'photoFile',
  kk:              'kkFile',
  ktp:             'ktpFile',
  ijazah:          'ijazahFile',
  admission_proof: 'admissionProofFile',
  house_photo:     'housePhotoFile',
  kitchen_photo:   'kitchenPhotoFile',
  salary_slip:     'salarySlipFile',
  ig_proof:        'igProofFile',
  tiktok_proof:    'tiktokProofFile',
}

export const formatRp = (raw) => {
  if (raw === 0 || raw === '0') return 'Rp 0'
  const n = parseInt(String(raw || '').replace(/\D/g, ''), 10)
  return isNaN(n) ? '—' : 'Rp ' + n.toLocaleString('id-ID')
}

export function mapApplicantRowToSubmission(row, achievements = [], organizations = [], documents = []) {
  // dbToForm sudah handle mapping scalar fields snake_case → camelCase
  const form = dbToForm(row)
  const sub = {
    ...form,
    _idx:               row.id,
    id:                 row.id,
    user_id:            row.user_id,
    is_submitted:       row.is_submitted === true,
    status:             row.status || 'submitted',
    registrationNumber: row.registration_number || null,
    submittedAt:        form.submittedAt || null,
    photoFile:          null,
    kkFile:             null,
    ktpFile:            null,
    admissionProofFile: null,
    ijazahFile:         null,
    housePhotoFile:     null,
    kitchenPhotoFile:   null,
    salarySlipFile:     null,
    igProofFile:        null,
    tiktokProofFile:    null,
    fotoProfil:         null,   // legacy alias untuk display avatar
    achievements: (achievements || []).map(a => ({
      title: a.title || '', level: a.level || '', rank: a.rank || '',
      year: a.year ? String(a.year) : '', issuer: a.issuer || '',
    })),
    organizations: (organizations || []).map(o => ({
      name: o.name || '', role: o.role || '', period: o.period || '',
      description: o.description || '',
    })),
    // Map kolom skoring & Had Kifayah eksplisit
    hkPriority:         row.hk_priority,
    hkGap:              row.hk_gap,
    totalHadKifayah:    row.total_had_kifayah,
    totalIncome:        row.total_income,
    grandScore:         row.grand_score,
    skorPrestasi:       row.skor_prestasi,
    skorOrganisasi:     row.skor_organisasi,
    // Map rincian 7 dimensi
    dimIbadah:          row.dim_ibadah,
    dimPangan:          row.dim_pangan,
    dimPakaian:         row.dim_pakaian,
    dimTempatTinggal:   row.dim_tempat_tinggal,
    dimKesehatan:       row.dim_kesehatan,
    dimPendidikan:      row.dim_pendidikan,
    dimTransportasi:    row.dim_transportasi,
  }
  // Inject documents
  for (const doc of documents || []) {
    const field = DOC_TYPE_TO_SUB_FIELD[doc.doc_type]
    if (!field) continue
    sub[field] = {
      url:  doc._signedUrl,
      path: doc.storage_path,
      name: doc.file_name,
      size: doc.file_size,
      mime: doc.mime_type,
    }
    if (doc.doc_type === 'photo') sub.fotoProfil = doc._signedUrl
  }
  return sub
}
