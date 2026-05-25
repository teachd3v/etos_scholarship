// storage.js — upload & retrieval dokumen pendaftar via Supabase Storage.
//
// Bucket: `applicant-docs` (private). Akses via signed URL (TTL default 24 jam).
// Path konvensi: `{user_id}/{doc_type}/{uuid}.{ext}` — RLS storage cocokkan
// folder root dengan auth.uid() (lihat 0004_storage.sql).
//
// State shape di React form: { url, name, size, path, mime }
//   - url:  signed URL (24h TTL), siap di-pasang di <img src> / <a href>
//   - path: storage path, dipakai untuk replace/delete dan persist ke documents tabel
//
import { supabase } from './supabase.js'

const BUCKET = 'applicant-docs'

// Per-doc-type limit & mime allow-list (mirror dengan validate_before_submit & RLS)
const FILE_LIMITS = {
  ijazah:          { maxBytes: 2_000_000, mimes: ['application/pdf', 'image/jpeg', 'image/png'] },
  admission_proof: { maxBytes: 2_000_000, mimes: ['application/pdf', 'image/jpeg', 'image/png'] },
  photo:           { maxBytes: 5_000_000, mimes: ['image/jpeg', 'image/png'] },
  ktp:             { maxBytes: 2_000_000, mimes: ['application/pdf', 'image/jpeg', 'image/png'] },
  kk:              { maxBytes: 2_000_000, mimes: ['application/pdf', 'image/jpeg', 'image/png'] },
  house_photo:     { maxBytes: 5_000_000, mimes: ['image/jpeg', 'image/png'] },
  kitchen_photo:   { maxBytes: 5_000_000, mimes: ['image/jpeg', 'image/png'] },
  salary_slip:     { maxBytes: 2_000_000, mimes: ['application/pdf', 'image/jpeg', 'image/png'] },
}

const MIME_TO_EXT = {
  'application/pdf': 'pdf',
  'image/jpeg':      'jpg',
  'image/png':       'png',
  'image/webp':      'webp',
}

/** Validasi client-side sebelum upload. Return error message atau null. */
export function validateFile(docType, file) {
  const limit = FILE_LIMITS[docType]
  if (!limit) return `Tipe dokumen tidak dikenal: ${docType}`
  if (file.size > limit.maxBytes) {
    const mb = (limit.maxBytes / 1_000_000).toFixed(0)
    return `Ukuran file melebihi ${mb} MB. Pilih file yang lebih kecil.`
  }
  if (!limit.mimes.includes(file.type)) {
    const formats = limit.mimes.map(m => m.split('/')[1].toUpperCase()).join(', ')
    return `Format file harus ${formats}.`
  }
  return null
}

function extFromFile(file) {
  // Pakai MIME mapping dulu, fallback ke ekstensi dari nama file
  if (MIME_TO_EXT[file.type]) return MIME_TO_EXT[file.type]
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  return ext.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
}

/**
 * Upload file ke bucket. Generate UUID path.
 * Optionally delete oldPath (best-effort, tidak blocking).
 * @returns { path, name, size, mime }
 */
export async function uploadToBucket({ file, docType, oldPath = null }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak ada session aktif. Silakan login ulang.')

  const valErr = validateFile(docType, file)
  if (valErr) throw new Error(valErr)

  const ext  = extFromFile(file)
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  const path = `${user.id}/${docType}/${uuid}.${ext}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    })
  if (upErr) {
    throw new Error(upErr.message || 'Upload gagal.')
  }

  // Delete file lama (best-effort — kalau gagal, file orphan, gak masalah utk MVP)
  if (oldPath && oldPath !== path) {
    supabase.storage.from(BUCKET).remove([oldPath]).catch(err => {
      console.warn('Failed to delete old file:', oldPath, err)
    })
  }

  return { path, name: file.name, size: file.size, mime: file.type }
}

/**
 * Upsert row di tabel `documents` (1 row per applicant per doc_type).
 * Dipanggil setelah applicant row sudah ada.
 */
export async function upsertDocumentRow({ applicantId, docType, path, name, size, mime }) {
  if (!applicantId) throw new Error('applicantId wajib untuk upsert document.')
  const { error } = await supabase
    .from('documents')
    .upsert({
      applicant_id:  applicantId,
      doc_type:      docType,
      storage_path:  path,
      file_name:     name,
      file_size:     size,
      mime_type:     mime,
      uploaded_at:   new Date().toISOString(),
    }, { onConflict: 'applicant_id,doc_type' })
  if (error) throw new Error(error.message || 'Gagal menyimpan metadata dokumen.')
}

/** Generate signed URL untuk akses file. Default TTL 24 jam. */
export async function getSignedUrl(path, ttlSeconds = 86_400) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, ttlSeconds)
  if (error) {
    console.error('getSignedUrl error:', path, error)
    return null
  }
  return data?.signedUrl || null
}

/** Generate signed URL untuk banyak path sekaligus. Return map { path → signedUrl }. */
export async function getSignedUrls(paths, ttlSeconds = 86_400) {
  const unique = Array.from(new Set((paths || []).filter(Boolean)))
  if (unique.length === 0) return {}
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unique, ttlSeconds)
  if (error) {
    console.error('getSignedUrls error:', error)
    return {}
  }
  const map = {}
  for (const item of data || []) {
    if (item.path) map[item.path] = item.signedUrl
  }
  return map
}

/**
 * Helper composite: upload + upsert row + return field shape buat React state.
 * Caller TIDAK perlu kerjain langkah-langkah terpisah.
 */
export async function uploadDocument({ file, docType, applicantId, oldPath = null }) {
  // 1. Upload ke bucket
  const meta = await uploadToBucket({ file, docType, oldPath })

  // 2. Upsert tabel documents kalau applicant row sudah ada.
  //    Saat onboarding (applicant belum ada), caller akan defer ini sampai
  //    applicant row ter-create (lihat App.jsx onboarding onPass).
  if (applicantId) {
    await upsertDocumentRow({ applicantId, docType, ...meta })
  }

  // 3. Generate signed URL untuk preview
  const url = await getSignedUrl(meta.path)

  return { url, name: meta.name, size: meta.size, path: meta.path, mime: meta.mime, docType }
}

/** Hapus file (storage + row tabel). */
export async function deleteDocument({ path, applicantId, docType }) {
  // Storage delete (best-effort)
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
  }
  // Documents table row
  if (applicantId && docType) {
    await supabase
      .from('documents')
      .delete()
      .eq('applicant_id', applicantId)
      .eq('doc_type', docType)
  }
}

/** Load semua dokumen milik 1 applicant + generate signed URLs. */
export async function loadApplicantDocuments(applicantId) {
  if (!applicantId) return {}
  const { data: rows = [], error } = await supabase
    .from('documents')
    .select('doc_type, storage_path, file_name, file_size, mime_type')
    .eq('applicant_id', applicantId)
  if (error) {
    console.error('loadApplicantDocuments error:', error)
    return {}
  }
  if (!rows.length) return {}

  // Bulk-fetch signed URLs sekali jalan biar efisien
  const urlMap = await getSignedUrls(rows.map(r => r.storage_path))

  const out = {}
  for (const r of rows) {
    out[r.doc_type] = {
      url:  urlMap[r.storage_path] || null,
      path: r.storage_path,
      name: r.file_name,
      size: r.file_size,
      mime: r.mime_type,
    }
  }
  return out
}
