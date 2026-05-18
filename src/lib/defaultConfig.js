// defaultConfig.js — single source of truth for all form configuration defaults.
// This file has zero dependencies (no React, no Supabase) so it can be imported anywhere.
// When form_config rows exist in the DB, they override these values at runtime.

export const DEFAULT_CONFIG = {
  // ─── System ─────────────────────────────────────────────────
  timeline: {
    registration_start: '2026-05-01T00:00:00',
    registration_end:   '2026-05-23T00:00:00',
    verification_end:   '2026-05-30T00:00:00',
    announcement_date:  '2026-06-05T00:00:00',
  },

  target_universities: [
    'UNIVERSITAS JAMBI',
    'UNIVERSITAS TADULAKO',
    'UNIVERSITAS ANDALAS',
    'UNIVERSITAS PATTIMURA',
    'UNIVERSITAS GADJAH MADA',
  ],

  // ─── Step 2: Data Keluarga ───────────────────────────────────
  income_options: [
    'TIDAK BERPENGHASILAN',
    '< RP 1.500.000',
    'RP 1.500.000 – RP 3.000.000',
    'RP 3.000.000 – RP 5.000.000',
    '> RP 5.000.000',
  ],

  job_options: [
    'TIDAK BEKERJA',
    'OJEK ONLINE', 'KURIR BARANG', 'SOPIR ANGKOT', 'KERNET',
    'CLEANING SERVICE', 'ART & PENGASUH', 'PETUGAS SAMPAH',
    'PEDAGANG KAKI LIMA', 'JURU PARKIR', 'BURUH HARIAN LEPAS',
    'PORTER', 'BURUH TANI', 'NELAYAN', 'LAINNYA',
  ],

  family_status_options: [
    'KEDUA ORANG TUA MASIH HIDUP',
    'YATIM (AYAH MENINGGAL)',
    'PIATU (IBU MENINGGAL)',
    'YATIM PIATU',
    'ORANG TUA BERCERAI',
  ],

  // ─── Step 3: Kondisi Ekonomi ─────────────────────────────────
  house_options: [
    'MILIK SENDIRI',
    'SEWA/KONTRAK',
    'MENUMPANG KELUARGA',
  ],

  kip_options: [
    'YA, PENERIMA PIP',
    'TERDAFTAR KIP-KULIAH',
    'BUKAN PENERIMA',
  ],

  bpjs_options: [
    'PBI (GRATIS DARI PEMERINTAH)',
    'YA, TERDAFTAR DAN AKTIF',
    'YA, TERDAFTAR TAPI NONAKTIF',
    'TIDAK TERDAFTAR',
  ],

  // ─── Step 4: Prestasi ────────────────────────────────────────
  achievement_config: {
    max_items: 10,
    levels: [
      'INTERNASIONAL',
      'NASIONAL',
      'PROVINSI',
      'KABUPATEN/KOTA',
      'KECAMATAN',
      'SEKOLAH',
    ],
    ranks: [
      'JUARA 1 / MEDALI EMAS',
      'JUARA 2 / PERAK',
      'JUARA 3 / PERUNGGU',
      'FINALIS / JUARA FAVORIT',
    ],
  },

  // ─── Step 5: Organisasi ──────────────────────────────────────
  organization_config: {
    max_items: 10,
    roles: [
      'KETUA / WAKIL KETUA',
      'PENGURUS INTI',
      'ANGGOTA / STAFF',
    ],
  },

  // ─── Step 6: Esai ────────────────────────────────────────────
  // ─── Jadwal Seleksi (diatur Admin) ─────────────────────────
  // null  = admin belum mengatur (user lihat empty state)
  // []    = admin sengaja kosongkan
  // array = list tahapan aktif
  // status per item: 'upcoming' | 'ongoing' | 'done'
  selection_stages: null,

  // ─── Step 6: Esai ────────────────────────────────────────────
  essay_config: [
    {
      id:          'motivation',
      title:       'Alasan Mendaftar',
      label:       'Apa alasan Anda mendaftar Beasiswa Etos ID?',
      placeholder: 'Ceritakan latar belakang dan alasan Anda…',
      min:         50,
      max:         400,
    },
    {
      id:          'futurePlan',
      title:       'Rencana Studi & Karir',
      label:       'Rencana studi & karir 5 tahun ke depan',
      placeholder: 'Program studi yang dituju, kampus tujuan, serta rencana setelah lulus…',
      min:         50,
      max:         400,
    },
    {
      id:          'contribution',
      title:       'Kontribusi Daerah',
      label:       'Kontribusi apa yang akan Anda berikan untuk daerah asal?',
      placeholder: 'Fokus pada masalah konkret di daerah Anda dan peran yang bisa Anda ambil…',
      min:         50,
      max:         400,
    },
  ],
}
