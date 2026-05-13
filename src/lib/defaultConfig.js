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
    'Universitas Jambi',
    'Universitas Tadulako',
    'Universitas Andalas',
    'Universitas Pattimura',
    'Universitas Gadjah Mada',
  ],

  // ─── Step 2: Data Keluarga ───────────────────────────────────
  income_options: [
    'Tidak berpenghasilan',
    '< Rp 1.500.000',
    'Rp 1.500.000 – Rp 3.000.000',
    'Rp 3.000.000 – Rp 5.000.000',
    '> Rp 5.000.000',
  ],

  job_options: [
    'Tidak Bekerja',
    'Ojek Online', 'Kurir Barang', 'Sopir Angkot', 'Kernet',
    'Cleaning Service', 'ART & Pengasuh', 'Petugas Sampah',
    'Pedagang Kaki Lima', 'Juru Parkir', 'Buruh Harian Lepas',
    'Porter', 'Buruh Tani', 'Nelayan', 'Lainnya',
  ],

  family_status_options: [
    'Kedua orang tua masih hidup',
    'Yatim (ayah meninggal)',
    'Piatu (ibu meninggal)',
    'Yatim piatu',
    'Orang tua bercerai',
  ],

  // ─── Step 3: Kondisi Ekonomi ─────────────────────────────────
  house_options: [
    'Milik sendiri',
    'Sewa/kontrak',
    'Menumpang keluarga',
  ],

  kip_options: [
    'Ya, penerima PIP',
    'Terdaftar KIP-Kuliah',
    'Bukan penerima',
  ],

  bpjs_options: [
    'PBI (Gratis dari Pemerintah)',
    'Ya, terdaftar dan aktif',
    'Ya, terdaftar tapi nonaktif',
    'Tidak terdaftar',
  ],

  // ─── Step 4: Prestasi ────────────────────────────────────────
  achievement_config: {
    max_items: 10,
    levels: [
      'Internasional',
      'Nasional',
      'Provinsi',
      'Kabupaten/Kota',
      'Kecamatan',
      'Sekolah',
    ],
    ranks: [
      'Juara 1 / Medali Emas',
      'Juara 2 / Perak',
      'Juara 3 / Perunggu',
      'Finalis / Juara Favorit',
    ],
  },

  // ─── Step 5: Organisasi ──────────────────────────────────────
  organization_config: {
    max_items: 10,
    roles: [
      'Ketua / Wakil Ketua',
      'Pengurus Inti',
      'Anggota / Staff',
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
