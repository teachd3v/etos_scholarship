// FormState.jsx — schema, validasi, dan scoring form beasiswa.
// Semua fungsi menerima `cfg` (opsional) dari DEFAULT_CONFIG sebagai fallback
// agar komponen yang belum di-update tetap bekerja tanpa perubahan.
import { DEFAULT_CONFIG } from './lib/defaultConfig.js'

// Re-export agar komponen lain yang import dari sini tidak perlu diubah
export const TARGET_PROVINCES = DEFAULT_CONFIG.target_universities
export const ALL_PROVINCES    = TARGET_PROVINCES

export const BLANK_FORM = {
  graduationYear: '',
  ijazahFile: null,
  province: '',
  studyProgram: '',
  admissionProofFile: null,
  photoFile: null, fullName: '', nickname: '', nik: '', noKK: '', birthPlace: '', birthDate: '', gender: '',
  religion: '', email: '', phone: '', instagram: '', domisiliProvinsi: '', domisiliKota: '', domisiliKecamatan: '', address: '',
  fatherName: '', fatherCondition: '', fatherJob: '', fatherJobOther: '', fatherIncome: '',
  motherName: '', motherCondition: '', motherJob: '', motherJobOther: '', motherIncome: '',
  guardianName: '', guardianJob: '', guardianJobOther: '',
  familyStatus: '', kkFile: null,
  mainProvider: '', fatherIncomeAmount: '', motherIncomeAmount: '', guardianIncomeAmount: '',
  adultSiblingsWorking: 0, adultSiblingsNotWorking: 0,
  siblingsHighSchool: 0, siblingsElementary: 0, grandparentsCount: 0,
  houseStatus: '', electricPower: '',
  vehicleBike: 0, vehicleCar: 0, vehicleOther: 0,
  bpjsActiveCount: 0, bpjsInactiveCount: 0,
  kipStatus: '', housePhotoFile: null, kitchenPhotoFile: null,
  noAchievement: false,
  noOrganization: false,
  achievements: [],
  organizations: [],
  motivation: '', futurePlan: '', contribution: '',
  consent: false,
  lastSaved: null,
  registrationNumber: null,
  submittedAt: null,
}

export const BLANK_ACHIEVEMENT = { title: '', level: '', rank: '', year: '', issuer: '' }
export const BLANK_ORG         = { name: '', role: '', period: '', description: '' }

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const required = (v) => (v == null || String(v).trim() === '') ? 'Wajib diisi' : null

// ─────────────────────────────────────────────────────────────
// Validation per step
// ─────────────────────────────────────────────────────────────
export function validateStep(step, form, cfg = DEFAULT_CONFIG) {
  const errs = {}
  const set  = (k, msg) => { if (msg) errs[k] = msg }

  if (step === 0) set('province', required(form.province))

  if (step === 1) {
    set('photoFile', required(form.photoFile))
    set('fullName',  required(form.fullName))
    set('nickname',  required(form.nickname))
    set('email',
      !form.email || !form.email.trim() ? 'Wajib diisi' :
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? 'Format email tidak valid' :
      null
    )
    set('nik',  form.nik  && form.nik.length  !== 16 ? 'NIK harus 16 digit'   : required(form.nik))
    set('noKK', form.noKK && form.noKK.length !== 16 ? 'No KK harus 16 digit' : required(form.noKK))
    set('birthPlace', required(form.birthPlace))
    set('birthDate',  required(form.birthDate))
    set('gender',     required(form.gender))
    set('phone', form.phone && !/^(\+62|0)\d{8,13}$/.test(form.phone) ? 'Format nomor tidak valid' : required(form.phone))
    set('instagram',
      !form.instagram || !form.instagram.trim() ? 'Wajib diisi' :
      !/^https?:\/\/.+/.test(form.instagram.trim()) ? 'Harus berupa URL yang valid (contoh: https://instagram.com/username)' :
      null
    )
    set('domisiliProvinsi',  required(form.domisiliProvinsi))
    set('domisiliKota',      required(form.domisiliKota))
    set('domisiliKecamatan', required(form.domisiliKecamatan))
    set('address', required(form.address))
  }

  if (step === 2) {
    set('familyStatus',    required(form.familyStatus))
    set('fatherName',      required(form.fatherName))
    set('fatherCondition', required(form.fatherCondition))
    if (form.fatherCondition !== 'Wafat') {
      set('fatherJob', required(form.fatherJob))
      if (form.fatherJob === 'Lainnya') set('fatherJobOther', required(form.fatherJobOther))
    }
    set('motherName',      required(form.motherName))
    set('motherCondition', required(form.motherCondition))
    if (form.motherCondition !== 'Wafat') {
      set('motherJob', required(form.motherJob))
      if (form.motherJob === 'Lainnya') set('motherJobOther', required(form.motherJobOther))
    }
    set('kkFile', required(form.kkFile))
  }

  if (step === 3) {
    set('mainProvider', required(form.mainProvider))
    if (['Ayah & Ibu', 'Ayah Saja'].includes(form.mainProvider))
      set('fatherIncomeAmount', required(form.fatherIncomeAmount))
    if (['Ayah & Ibu', 'Ibu Saja'].includes(form.mainProvider))
      set('motherIncomeAmount', required(form.motherIncomeAmount))
    if (form.mainProvider === 'Wali')
      set('guardianIncomeAmount', required(form.guardianIncomeAmount))
    set('houseStatus',    required(form.houseStatus))
    set('electricPower',  required(form.electricPower))
    set('kipStatus',      required(form.kipStatus))
    set('housePhotoFile', required(form.housePhotoFile))
  }

  if (step === 4 && !form.noAchievement) {
    form.achievements.forEach((a, i) => {
      if (!a.title) errs[`ach-${i}-title`] = 'Wajib'
      if (!a.level) errs[`ach-${i}-level`] = 'Wajib'
      if (!a.rank)  errs[`ach-${i}-rank`]  = 'Wajib'
      if (!a.year)  errs[`ach-${i}-year`]  = 'Wajib'
    })
  }

  if (step === 5 && !form.noOrganization) {
    form.organizations.forEach((o, i) => {
      if (!o.name)   errs[`org-${i}-name`]   = 'Wajib'
      if (!o.role)   errs[`org-${i}-role`]   = 'Wajib'
      if (!o.period) errs[`org-${i}-period`] = 'Wajib'
    })
  }

  if (step === 6) {
    const essays = cfg.essay_config || DEFAULT_CONFIG.essay_config
    essays.forEach(essay => {
      const text = form[essay.id]
      if (!text || text.trim() === '') {
        errs[essay.id] = 'Wajib diisi'
      } else if (text.length < essay.min) {
        errs[essay.id] = `Minimal ${essay.min} karakter`
      } else if (text.length > essay.max) {
        errs[essay.id] = `Maksimal ${essay.max} karakter`
      }
    })
  }

  return errs
}

export function completionPercent(form, cfg = DEFAULT_CONFIG) {
  const steps = [1, 2, 3, 4, 5, 6]
  let done = 0
  for (const s of steps) {
    if (Object.keys(validateStep(s, form, cfg)).length === 0) {
      if (s === 4 && !form.noAchievement && (!form.achievements || form.achievements.length === 0)) continue
      if (s === 5 && !form.noOrganization && (!form.organizations || form.organizations.length === 0)) continue
      done++
    }
  }
  return Math.round((done / steps.length) * 100)
}

export function completedSteps(form, cfg = DEFAULT_CONFIG) {
  const universities = cfg.target_universities || DEFAULT_CONFIG.target_universities
  const out = []
  if (form.province && universities.includes(form.province)) out.push(0)
  for (let s = 1; s <= 6; s++) {
    if (Object.keys(validateStep(s, form, cfg)).length === 0) {
      if (s === 4 && !form.noAchievement && (!form.achievements || form.achievements.length === 0)) continue
      if (s === 5 && !form.noOrganization && (!form.organizations || form.organizations.length === 0)) continue
      out.push(s)
    }
  }
  return out
}


// ─────────────────────────────────────────────────────────────
// Seed data — fully complete for demo use
// ─────────────────────────────────────────────────────────────
export const SEED_FORM = {
  ...BLANK_FORM,
  province: 'Universitas Gadjah Mada',
  photoFile: { name: 'pas_foto_anindya.jpg', size: 1048576, url: 'blob:simulated' },
  fullName: 'Anindya Rahmatullah',
  nickname: 'Anin',
  nik: '7401234567890123',
  noKK: '7401234567890199',
  birthPlace: 'Kendari',
  birthDate: '2005-08-14',
  gender: 'Perempuan',
  religion: 'Islam',
  phone: '081234567890',
  instagram: 'https://instagram.com/anindya.r',
  domisiliProvinsi: 'SULAWESI TENGGARA',
  domisiliKota: 'KOTA KENDARI',
  domisiliKecamatan: 'WUA-WUA',
  email: 'anindya.r@example.id',
  address: 'Jl. Melati No. 12 RT 03/RW 02, Kel. Wua-Wua, Kec. Wua-Wua',
  familyStatus: 'Menikah',
  fatherName: 'Rahmat Hidayat',
  fatherCondition: 'Hidup',
  fatherJob: 'Buruh Tani',
  fatherIncome: '< Rp 1.500.000',
  motherName: 'Hasnawati',
  motherCondition: 'Hidup',
  motherJob: 'Tidak Bekerja',
  motherIncome: 'Tidak berpenghasilan',
  guardianName: '',
  guardianJob: '',
  guardianJobOther: '',
  mainProvider: 'Ayah & Ibu',
  fatherIncomeAmount: '1500000',
  motherIncomeAmount: '0',
  guardianIncomeAmount: '',
  adultSiblingsWorking: 0, adultSiblingsNotWorking: 1,
  siblingsHighSchool: 1, siblingsElementary: 0, grandparentsCount: 2,
  houseStatus: 'Menumpang Keluarga Lain',
  electricPower: '900 watt',
  vehicleBike: 1, vehicleCar: 0, vehicleOther: 0,
  bpjsActiveCount: 4, bpjsInactiveCount: 0,
  kipStatus: 'Ya',
  housePhotoFile: null,
  kkFile: null,
  achievements: [
    { title: 'Olimpiade Sains Kabupaten - Matematika', level: 'Kabupaten/Kota', rank: 'Juara 1 / Medali Emas', year: '2024', issuer: 'Dinas Pendidikan Kota Kendari' },
    { title: 'Lomba Karya Ilmiah Remaja Provinsi', level: 'Provinsi', rank: 'Finalis / Juara Favorit', year: '2025', issuer: 'BRIN Sulawesi Tenggara' },
  ],
  organizations: [
    { name: 'OSIS SMAN 1 Kendari', role: 'Ketua / Wakil Ketua', period: 'Jul 2023 – Jun 2024', description: 'Merancang program bimbingan belajar gratis untuk 80 siswa kurang mampu dan memimpin tim 12 orang.' },
    { name: 'Komunitas Muda Bergerak Sultra', role: 'Pengurus Inti', period: 'Jan 2024 – Sekarang', description: 'Mengkoordinasi relawan dalam kegiatan literasi di 5 kelurahan pinggiran Kota Kendari.' },
  ],
  motivation:    'Saya mendaftar Beasiswa Etos ID karena ingin membuktikan bahwa keterbatasan ekonomi bukan penghalang untuk meraih pendidikan tinggi berkualitas. Keluarga saya sangat bergantung pada hasil kerja sehari-hari, dan beasiswa ini adalah kesempatan nyata untuk mengubah keadaan tersebut serta membuka jalan bagi adik-adik saya.',
  futurePlan:    'Saya berencana mengambil program studi Teknik Informatika di Universitas Halu Oleo, berfokus pada pengembangan solusi berbasis kecerdasan buatan. Dalam 5 tahun ke depan, saya ingin bekerja di industri teknologi dan mengembangkan aplikasi digital yang menjawab kebutuhan nyata masyarakat Sulawesi Tenggara.',
  contribution:  'Saya akan kembali ke Kendari untuk mendirikan komunitas coding gratis bagi pemuda di daerah pinggiran kota. Dengan keahlian teknologi yang saya pelajari, saya ingin membantu masyarakat lokal mengakses peluang ekonomi digital yang selama ini hanya tersedia di kota-kota besar.',
  lastSaved: 'Hari ini, 14:20 WIB',
}
