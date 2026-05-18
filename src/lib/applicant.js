// applicant.js — load & autosave data applicant ke Supabase.
//
// Tanggung jawab:
//   1. Load row applicants milik user yang login (atau null kalau belum ada).
//   2. Convert camelCase ↔ snake_case antara React state dan kolom Postgres.
//   3. Debounced autosave (1.5s) ke Supabase saat user ngetik.
//   4. Sync achievements & organizations ke tabel terpisah (debounced).
//   5. Skip semua file fields — di-handle terpisah di Fase 4 (Storage).
//
// Catatan: trigger DB `enforce_registration_window` akan menolak INSERT kalau
// di luar window — surfaced lewat throw di insertOrUpdate.

import React from 'react'
import { supabase } from './supabase.js'
import { BLANK_FORM, calculateScores, calculateHadKifayah } from '../FormState.jsx'
import { loadApplicantDocuments } from './storage.js'

// Mapping doc_type (DB) → field name (React form)
const DOC_TYPE_TO_FIELD = {
  photo:           'photoFile',
  kk:              'kkFile',
  house_photo:     'housePhotoFile',
  kitchen_photo:   'kitchenPhotoFile',
  ijazah:          'ijazahFile',
  admission_proof: 'admissionProofFile',
}

// File fields yang TIDAK di-persist via tabel applicants (di-handle di Fase 4 via Storage).
const FILE_FIELDS = new Set([
  'ijazahFile', 'admissionProofFile', 'photoFile',
  'kkFile', 'housePhotoFile', 'kitchenPhotoFile',
])

// State-only fields (tidak dipersist atau dihitung server-side)
const STATE_ONLY_FIELDS = new Set([
  'lastSaved',          // di-derive dari updated_at
  'registrationNumber', // di-set oleh DB trigger
  'submittedAt',        // di-set oleh DB trigger
  '_localId',           // legacy
  'achievements',       // tabel terpisah
  'organizations',      // tabel terpisah
  // Legacy income dropdown fields — kolom DB pakai *_amount BIGINT
  'fatherIncome', 'motherIncome',
])

// Mapping eksplisit untuk semua scalar field yang di-persist.
// Format: camelCase (form) → snake_case (DB)
const FIELD_MAP = {
  graduationYear:           'graduation_year',
  province:                 'province',
  studyProgram:             'study_program',
  religion:                 'religion',
  fullName:                 'full_name',
  nickname:                 'nickname',
  nik:                      'nik',
  noKK:                     'no_kk',
  birthPlace:               'birth_place',
  birthDate:                'birth_date',
  gender:                   'gender',
  email:                    'email',
  phone:                    'phone',
  instagram:                'instagram',
  domisiliProvinsi:         'domisili_provinsi',
  domisiliKota:             'domisili_kota',
  domisiliKecamatan:        'domisili_kecamatan',
  address:                  'address',
  familyStatus:             'family_status',
  fatherName:               'father_name',
  fatherCondition:          'father_condition',
  fatherJob:                'father_job',
  fatherJobOther:           'father_job_other',
  motherName:               'mother_name',
  motherCondition:          'mother_condition',
  motherJob:                'mother_job',
  motherJobOther:           'mother_job_other',
  guardianName:             'guardian_name',
  guardianJob:              'guardian_job',
  guardianJobOther:         'guardian_job_other',
  mainProvider:             'main_provider',
  fatherIncomeAmount:       'father_income_amount',
  motherIncomeAmount:       'mother_income_amount',
  guardianIncomeAmount:     'guardian_income_amount',
  adultSiblingsWorking:     'adult_siblings_working',
  adultSiblingsNotWorking:  'adult_siblings_not_working',
  siblingsHighSchool:       'siblings_high_school',
  siblingsElementary:       'siblings_elementary',
  grandparentsCount:        'grandparents_count',
  houseStatus:              'house_status',
  electricPower:            'electric_power',
  vehicleBike:              'vehicle_bike',
  vehicleCar:               'vehicle_car',
  vehicleOther:             'vehicle_other',
  bpjsActiveCount:          'bpjs_active_count',
  bpjsInactiveCount:        'bpjs_inactive_count',
  kipStatus:                'kip_status',
  motivation:               'motivation',
  futurePlan:               'future_plan',
  contribution:             'contribution',
  consent:                  'consent',
  noAchievement:            'no_achievement',
  noOrganization:           'no_organization',
  skorPrestasi:             'skor_prestasi',
  skorOrganisasi:           'skor_organisasi',
  grandScore:               'grand_score',
  familyCountSelf:          'family_count_self',
  familyCountFather:        'family_count_father',
  familyCountMother:        'family_count_mother',
  totalIncome:              'total_income',
  totalHadKifayah:          'total_had_kifayah',
  hkGap:                    'hk_gap',
  hkPriority:               'hk_priority',
}

const REVERSE_FIELD_MAP = Object.fromEntries(
  Object.entries(FIELD_MAP).map(([k, v]) => [v, k])
)

// Kolom integer/BigInt — value '' atau null harus jadi null (bukan 0)
const INT_FIELDS = new Set([
  'graduation_year',
  'father_income_amount', 'mother_income_amount', 'guardian_income_amount',
  'adult_siblings_working', 'adult_siblings_not_working',
  'siblings_high_school', 'siblings_elementary', 'grandparents_count',
  'vehicle_bike', 'vehicle_car', 'vehicle_other',
  'bpjs_active_count', 'bpjs_inactive_count',
  'total_income', 'total_had_kifayah', 'hk_gap',
])

function toNullableInt(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

/** Convert React form state → DB payload (omit file fields, state-only, dan id/user_id) */
export function formToDb(form) {
  const out = {}
  for (const [k, v] of Object.entries(form)) {
    if (FILE_FIELDS.has(k) || STATE_ONLY_FIELDS.has(k)) continue
    const col = FIELD_MAP[k]
    if (!col) continue

    // Cegah error "check constraint" di DB saat auto-save (NIK/KK harus 16 digit)
    if ((col === 'nik' || col === 'no_kk') && v) {
      const clean = String(v).replace(/\D/g, '')
      if (clean.length > 0 && clean.length !== 16) continue 
    }

    if (INT_FIELDS.has(col)) {
      out[col] = toNullableInt(v)
    } else if (typeof v === 'string' && v.trim() === '') {
      out[col] = null
    } else {
      out[col] = v
    }
  }

  // Hitung skoring otomatis sebelum simpan
  const scores = calculateScores(form)
  out.skor_prestasi   = scores.skor_prestasi
  out.skor_organisasi = scores.skor_organisasi
  out.grand_score     = scores.grand_score

  // Injeksi otomatis komposisi keluarga dasar
  out.family_count_self   = 1
  out.family_count_father = form.fatherCondition === 'Hidup' ? 1 : 0
  out.family_count_mother = form.motherCondition === 'Hidup' ? 1 : 0

  return out
}

/** Convert DB row → React form patch (skip file fields & null id) */
export function dbToForm(row) {
  if (!row) return {}
  const out = {}
  for (const [col, v] of Object.entries(row)) {
    const key = REVERSE_FIELD_MAP[col]
    if (!key) continue
    // Integer fields: keep number (0 valid); null → 0 untuk counter, '' untuk amount fields
    if (INT_FIELDS.has(col)) {
      out[key] = v == null ? (key.endsWith('Amount') ? '' : 0) : v
    } else if (col === 'birth_date' && v) {
      // Date column comes back as ISO 'YYYY-MM-DD' — keep as-is for <input type=date>
      out[key] = v
    } else {
      out[key] = v == null ? '' : v
    }
  }
  // Metadata yang ditampilkan di UI
  if (row.registration_number) out.registrationNumber = row.registration_number
  if (row.submitted_at) {
    try {
      out.submittedAt = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(new Date(row.submitted_at)).replace(/\./g, '') + ' WIB'
    } catch { out.submittedAt = null }
  }
  if (row.updated_at) {
    try {
      const d = new Date(row.updated_at)
      out.lastSaved = `Hari ini, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} WIB`
    } catch { /* ignore */ }
  }
  out.is_submitted = row.is_submitted === true
  out.status       = row.status || null
  return out
}

// ─── DB ops ──────────────────────────────────────────────────────

/** Load applicant row + achievements + organizations milik user yang login. */
export async function loadApplicant() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: row, error } = await supabase
    .from('applicants')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  if (!row) return null

  const [{ data: ach = [] }, { data: orgs = [] }, docs] = await Promise.all([
    supabase.from('achievements').select('*').eq('applicant_id', row.id),
    supabase.from('organizations').select('*').eq('applicant_id', row.id),
    loadApplicantDocuments(row.id),
  ])

  const form = dbToForm(row)
  form.achievements = (ach || []).map(a => ({
    title: a.title || '',
    level: a.level || '',
    rank:  a.rank  || '',
    year:  a.year  ? String(a.year) : '',
    issuer: a.issuer || '',
  }))
  form.organizations = (orgs || []).map(o => ({
    name:        o.name  || '',
    role:        o.role  || '',
    period:      o.period|| '',
    description: o.description || '',
  }))
  form.noAchievement  = false
  form.noOrganization = false

  // Documents: map doc_type → form field
  for (const [docType, field] of Object.entries(DOC_TYPE_TO_FIELD)) {
    if (docs[docType]) {
      form[field] = docs[docType]
    }
  }

  return { applicantId: row.id, form, raw: row }
}

/** Upsert applicants row (idempotent karena UNIQUE user_id). Return applicant id. */
export async function upsertApplicant(form) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak ada session aktif.')

  const payload = formToDb(form)
  payload.user_id = user.id

  // 1. Ambil data standar biaya berdasarkan provinsi domisili
  if (form.domisiliProvinsi) {
    const { data: std } = await supabase
      .from('master_had_kifayah')
      .select('*')
      .eq('provinsi', form.domisiliProvinsi)
      .maybeSingle()
    
    // 2. Jika standar ditemukan, jalankan mesin kalkulasi
    if (std) {
      const hk = calculateHadKifayah(form, std)
      payload.total_income      = hk.total_income
      payload.total_had_kifayah = hk.total_had_kifayah
      payload.hk_gap            = hk.hk_gap
      payload.hk_priority       = hk.hk_priority
    }
  }

  const { data, error } = await supabase
    .from('applicants')
    .upsert(payload, { onConflict: 'user_id' })
    .select('id')
    .single()
  if (error) {
    // Translate beberapa error umum
    if (/duplicate key value violates unique constraint .*_nik/.test(error.message)) {
      throw new Error('NIK sudah digunakan oleh pendaftar lain.')
    }
    if (/Pendaftaran belum dibuka|Pendaftaran sudah ditutup/.test(error.message)) {
      throw new Error(error.message)
    }
    throw new Error(error.message || 'Gagal menyimpan data pendaftar.')
  }
  return data.id
}

/** Replace achievements untuk applicant tertentu (delete-all + bulk insert). */
export async function syncAchievements(applicantId, achievements = [], noAchievement = false) {
  if (!applicantId) return
  // 1. Hapus semua
  await supabase.from('achievements').delete().eq('applicant_id', applicantId)

  // 2. Skip insert kalau user tandai "tidak ada"
  if (noAchievement || !Array.isArray(achievements) || achievements.length === 0) return

  // 3. Insert ulang — filter row yang masih kosong (judul wajib minimum)
  const rows = achievements
    .filter(a => a && a.title && a.title.trim() !== '')
    .map((a, idx) => ({
      applicant_id: applicantId,
      title:  a.title.trim(),
      level:  a.level || 'Sekolah',
      rank:   a.rank  || 'Finalis / Juara Favorit',
      year:   a.year ? Number(a.year) : 2024,
      issuer: a.issuer?.trim() || null,
    }))
  if (rows.length === 0) return

  const { error } = await supabase.from('achievements').insert(rows)
  if (error) throw error
}

/** Replace organizations — pattern sama dengan syncAchievements. */
export async function syncOrganizations(applicantId, organizations = [], noOrganization = false) {
  if (!applicantId) return
  await supabase.from('organizations').delete().eq('applicant_id', applicantId)
  if (noOrganization || !Array.isArray(organizations) || organizations.length === 0) return

  const rows = organizations
    .filter(o => o && o.name && o.name.trim() !== '')
    .map((o, idx) => ({
      applicant_id: applicantId,
      name:        o.name.trim(),
      role:        o.role  || 'Anggota / Staff',
      period:      o.period || '-',
      description: o.description?.trim() || null,
    }))
  if (rows.length === 0) return

  const { error } = await supabase.from('organizations').insert(rows)
  if (error) throw error
}

/** Mark applicant as submitted. DB trigger akan generate registration_number + queue email. */
export async function submitApplicant(applicantId) {
  if (!applicantId) throw new Error('Applicant belum tersimpan.')
  
  const { data, error } = await supabase
    .from('applicants')
    .update({ is_submitted: true })
    .eq('id', applicantId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Gagal submit pendaftaran.')
  }
  return data
}


// ─── React hook ──────────────────────────────────────────────────

/**
 * useApplicant({ session, enabled }) — auto-load + autosave form ke DB.
 *
 * Returns:
 *   { form, setForm, setField, applicantId, status, lastError, save, reload, submit }
 *
 *   status: 'idle' | 'loading' | 'saving' | 'saved' | 'error'
 */
export function useApplicant({ session, enabled = true }) {
  const [form, setForm]           = React.useState({ ...BLANK_FORM })
  const [applicantId, setId]      = React.useState(null)
  const [status, setStatus]       = React.useState('idle')
  const [lastError, setLastError] = React.useState(null)
  const [isLoaded, setIsLoaded]   = React.useState(false)
  const saveTimer = React.useRef(null)
  const arrayTimer = React.useRef(null)
  const isLoadedRef = React.useRef(false)

  // ── Initial load saat session siap ──
  React.useEffect(() => {
    if (!enabled || !session?.user) return
    let cancelled = false
    setStatus('loading')
    loadApplicant()
      .then(res => {
        if (cancelled) return
        if (res) {
          setId(res.applicantId)
          setForm(f => ({ ...BLANK_FORM, ...f, ...res.form }))
        } else {
          // New applicant — auto-fill email from session
          setForm(f => ({ ...f, email: session.user.email }))
        }
        setStatus('idle')
        isLoadedRef.current = true
        setIsLoaded(true)
      })
      .catch(err => {
        if (cancelled) return
        console.error('loadApplicant error:', err)
        setLastError(err.message || 'Gagal memuat data pendaftar.')
        setStatus('error')
        isLoadedRef.current = true
        setIsLoaded(true)
      })
    return () => { cancelled = true }
  }, [enabled, session?.user?.id])

  // ── Helper untuk update field secara lokal ──
  const setField = React.useCallback((key, value) => {
    setForm(f => ({ ...f, [key]: value }))
  }, [])

  // ── Manual save (untuk submit / handover) ──
  const save = React.useCallback(async (overrideForm = null) => {
    if (!session?.user) return null
    const targetForm = overrideForm || form
    setStatus('saving')
    try {
      const id = await upsertApplicant(targetForm)
      setId(id)
      setStatus('saved')
      // ✓ checkmark berkedip 2 detik, lalu balik ke idle
      setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), 2000)
      setLastError(null)
      return id
    } catch (err) {
      console.error('upsertApplicant error:', err)
      setLastError(err.message || 'Gagal menyimpan.')
      setStatus('error')
      return null
    }
  }, [form, session?.user?.id, applicantId])

  // ── Reload (untuk fresh data dari DB, misal setelah submit) ──
  const reload = React.useCallback(async () => {
    setStatus('loading')
    try {
      const res = await loadApplicant()
      if (res) {
        setId(res.applicantId)
        setForm(f => ({ ...BLANK_FORM, ...f, ...res.form }))
      }
      setStatus('idle')
    } catch (err) {
      setLastError(err.message)
      setStatus('error')
    }
  }, [])

  // ── Submit final ──
  const submit = React.useCallback(async () => {
    if (!applicantId) {
      // Save dulu kalau belum pernah upsert
      const id = await save()
      if (!id) throw new Error('Gagal menyimpan data sebelum submit.')
    }
    const id = applicantId || (await save())
    if (!id) throw new Error('Gagal menyimpan data sebelum submit.')

    // Sync achievements & organizations sebelum submit (untuk validasi DB tahu count)
    await syncAchievements(id, form.achievements, form.noAchievement)
    await syncOrganizations(id, form.organizations, form.noOrganization)

    const result = await submitApplicant(id)
    // Update local state dengan hasil dari DB
    setForm(f => ({
      ...f,
      is_submitted:       true,
      status:             result.status,
      registrationNumber: result.registration_number,
      submittedAt: (() => {
        try {
          return new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short',
            year: 'numeric', hour: '2-digit', minute: '2-digit',
          }).format(new Date(result.submitted_at)).replace(/\./g, '') + ' WIB'
        } catch { return null }
      })(),
    }))
    return result
  }, [applicantId, form.achievements, form.organizations, form.noAchievement, form.noOrganization, save])

  // ── Autosave scalar fields (debounced 1.5s) ──
  React.useEffect(() => {
    if (!enabled || !session?.user || !isLoadedRef.current) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      save().catch(() => { /* error already in state */ })
    }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Trigger autosave kalau ANY scalar field berubah.
    // Sengaja tidak include form.achievements / form.organizations di sini —
    // arrays di-handle oleh effect terpisah di bawah.
    ...Object.keys(FIELD_MAP).map(k => form[k]),
    enabled, session?.user?.id,
  ])

  // ── Sync achievements & organizations (debounced 1.5s, terpisah) ──
  React.useEffect(() => {
    if (!enabled || !applicantId || !isLoadedRef.current) return

    if (arrayTimer.current) clearTimeout(arrayTimer.current)
    arrayTimer.current = setTimeout(async () => {
      try {
        await Promise.all([
          syncAchievements(applicantId, form.achievements, form.noAchievement),
          syncOrganizations(applicantId, form.organizations, form.noOrganization),
        ])
      } catch (err) {
        console.error('sync arrays error:', err)
        setLastError(err.message)
      }
    }, 1500)
    return () => { if (arrayTimer.current) clearTimeout(arrayTimer.current) }
  }, [
    applicantId,
    enabled,
    form.achievements,
    form.organizations,
    form.noAchievement,
    form.noOrganization,
  ])

  return { form, setForm, setField, applicantId, isLoaded, status, lastError, save, reload, submit }
}
