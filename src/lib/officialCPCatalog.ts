import { ActiveMasterCPData, AdminUploadedCPItem, CPSubjectEntry, SchoolLevel } from '../types';
import { getSchoolLevelDisplay, resolvePhaseByLevelAndGrade } from './curriculumLevels';
import { getSubjectPresetByGrade } from './subjectMaterialPresets';

export const OFFICIAL_CP_BASELINE_VERSION = 'bskap-046-2025-and-020-2026-v1';

export const CP_046_FILE_NAME = 'Keputusan_Kepala_BSKAP_No_046_Tahun_2025_SD_SMP_SMA.pdf';
export const CP_020_FILE_NAME = 'Keputusan_Kepala_BSKAP_No_020_Tahun_2026_Agama_DeepLearning.pdf';

interface OfficialSubjectBlueprint {
  subject: string;
  level: SchoolLevel;
  phases: Array<{ phase: string; grade: number }>;
  categoryTag: 'Umum/Wajib' | 'Pilihan/Tingkat Lanjut';
  jpPerWeek?: number;
  locationRef: string;
  specialNotes?: string;
}

const CP_046_BLUEPRINTS: OfficialSubjectBlueprint[] = [
  // =========================================================
  // JENJANG SD / MI / PAKET A (FASE A, B, C) — BSKAP 046/2025
  // =========================================================
  {
    subject: 'Pendidikan Pancasila',
    level: 'SD',
    phases: [
      { phase: 'Fase A', grade: 2 },
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 4,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Indonesia',
    level: 'SD',
    phases: [
      { phase: 'Fase A', grade: 2 },
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 6,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Matematika',
    level: 'SD',
    phases: [
      { phase: 'Fase A', grade: 2 },
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'IPAS',
    level: 'SD',
    phases: [
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
    specialNotes: 'Ilmu Pengetahuan Alam dan Sosial (IPAS) dimulai pada Fase B (Kelas III–IV) hingga Fase C (Kelas V–VI).',
  },
  {
    subject: 'Bahasa Inggris',
    level: 'SD',
    phases: [
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
    specialNotes: 'Pembelajaran Bahasa Inggris SD dilaksanakan pada Fase B dan Fase C.',
  },
  {
    subject: 'PJOK',
    level: 'SD',
    phases: [
      { phase: 'Fase A', grade: 2 },
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Musik',
    level: 'SD',
    phases: [
      { phase: 'Fase A', grade: 2 },
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Rupa',
    level: 'SD',
    phases: [
      { phase: 'Fase A', grade: 2 },
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Tari',
    level: 'SD',
    phases: [
      { phase: 'Fase A', grade: 2 },
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Teater',
    level: 'SD',
    phases: [
      { phase: 'Fase A', grade: 2 },
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Koding dan Kecerdasan Artifisial',
    level: 'SD',
    phases: [{ phase: 'Fase C', grade: 5 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SD/MI) · BSKAP 046/H/KR/2025',
    specialNotes: 'Mata pelajaran pilihan pada jenjang SD dimulai di Fase C (Kelas V–VI).',
  },
  {
    subject: 'Muatan Lokal / Bahasa Daerah',
    level: 'SD',
    phases: [
      { phase: 'Fase A', grade: 2 },
      { phase: 'Fase B', grade: 4 },
      { phase: 'Fase C', grade: 6 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SD/MI) · Muatan Lokal',
  },

  // =========================================================
  // JENJANG SMP / MTs / PAKET B (FASE D) — BSKAP 046/2025
  // =========================================================
  {
    subject: 'Pendidikan Pancasila',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Indonesia',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Matematika',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 4,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'IPA',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 4,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'IPS',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Inggris',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'PJOK',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Informatika',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Musik',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Rupa',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Tari',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Teater',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya: Budi Daya',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya: Kerajinan',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya: Pengolahan',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya: Rekayasa',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Koding dan Kecerdasan Artifisial',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 8 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · BSKAP 046/H/KR/2025',
    specialNotes: 'Mata pelajaran pilihan Fase D (Kelas VII–IX).',
  },
  {
    subject: 'Muatan Lokal / Bahasa Daerah',
    level: 'SMP',
    phases: [{ phase: 'Fase D', grade: 7 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMP/MTs) · Muatan Lokal',
  },

  // =========================================================
  // JENJANG SMA / MA / PAKET C — MAPEL UMUM / WAJIB (FASE E & F)
  // =========================================================
  {
    subject: 'Pendidikan Pancasila',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Indonesia',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 4,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Matematika',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 4,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Inggris',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'PJOK',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Sejarah',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Musik',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Rupa',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Tari',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Seni Teater',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Umum · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'IPA',
    level: 'SMA',
    phases: [{ phase: 'Fase E', grade: 10 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 6,
    locationRef: 'Lampiran II (SMA/MA) Fase E · BSKAP 046/H/KR/2025',
    specialNotes: 'IPA Terpadu (Fisika, Kimia, Biologi) untuk Fase E Kelas X SMA/MA.',
  },
  {
    subject: 'IPS',
    level: 'SMA',
    phases: [{ phase: 'Fase E', grade: 10 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 6,
    locationRef: 'Lampiran II (SMA/MA) Fase E · BSKAP 046/H/KR/2025',
    specialNotes: 'IPS Terpadu (Sosiologi, Ekonomi, Geografi, Sejarah) untuk Fase E Kelas X SMA/MA.',
  },
  {
    subject: 'Informatika',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SMA/MA) · BSKAP 046/H/KR/2025',
    specialNotes: 'Wajib di Fase E (Kelas X) dan berlanjut sebagai Mata Pelajaran Pilihan di Fase F (Kelas XI–XII).',
  },
  {
    subject: 'Prakarya: Budi Daya',
    level: 'SMA',
    phases: [{ phase: 'Fase E', grade: 10 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Fase E · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya: Kerajinan',
    level: 'SMA',
    phases: [{ phase: 'Fase E', grade: 10 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Fase E · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya: Pengolahan',
    level: 'SMA',
    phases: [{ phase: 'Fase E', grade: 10 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Fase E · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya: Rekayasa',
    level: 'SMA',
    phases: [{ phase: 'Fase E', grade: 10 }],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Fase E · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Muatan Lokal / Bahasa Daerah',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Umum/Wajib',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) · Muatan Lokal',
  },

  // =========================================================
  // JENJANG SMA / MA / PAKET C — MAPEL PILIHAN / TINGKAT LANJUT
  // =========================================================
  {
    subject: 'Matematika Tingkat Lanjut',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Indonesia Tingkat Lanjut',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Inggris Tingkat Lanjut',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Biologi',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Fisika',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Kimia',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Ekonomi',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Geografi',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Sosiologi',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Antropologi',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Sejarah Tingkat Lanjut',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Koding dan Kecerdasan Artifisial',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 3,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Arab',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Bahasa Asing Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Jepang',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Bahasa Asing Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Jerman',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Bahasa Asing Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Korea',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Bahasa Asing Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Mandarin',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Bahasa Asing Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Bahasa Prancis',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 5,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Bahasa Asing Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya & Kewirausahaan: Budi Daya',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya & Kewirausahaan: Kerajinan',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya & Kewirausahaan: Pengolahan',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
  {
    subject: 'Prakarya & Kewirausahaan: Rekayasa',
    level: 'SMA',
    phases: [{ phase: 'Fase F', grade: 11 }],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 2,
    locationRef: 'Lampiran II (SMA/MA) Mapel Pilihan Fase F · BSKAP 046/H/KR/2025',
  },
];

// =========================================================
// CP #2 — KEPUTUSAN KEPALA BSKAP NO. 020/H/KR/2026
// Pendidikan Agama & Budi Pekerti, Kepercayaan, & Pemutakhiran 2026
// =========================================================
const AGAMA_020_SUBJECTS = [
  'Pendidikan Agama Islam & Budi Pekerti',
  'Pendidikan Agama Kristen & Budi Pekerti',
  'Pendidikan Agama Katolik & Budi Pekerti',
  'Pendidikan Agama Hindu & Budi Pekerti',
  'Pendidikan Agama Buddha & Budi Pekerti',
  'Pendidikan Agama Khonghucu & Budi Pekerti',
  'Pendidikan Kepercayaan Terhadap Tuhan YME',
];

const CP_020_BLUEPRINTS: Array<OfficialSubjectBlueprint & { slot: 'primary' | 'agama' }> = [
  ...AGAMA_020_SUBJECTS.flatMap((agamaName) => [
    {
      subject: agamaName,
      level: 'SD' as SchoolLevel,
      phases: [
        { phase: 'Fase A', grade: 2 },
        { phase: 'Fase B', grade: 4 },
        { phase: 'Fase C', grade: 6 },
      ],
      categoryTag: 'Umum/Wajib' as const,
      jpPerWeek: 4,
      locationRef: 'Lampiran BSKAP 020/H/KR/2026 · SD (Fase A–C)',
      slot: 'agama' as const,
    },
    {
      subject: agamaName,
      level: 'SMP' as SchoolLevel,
      phases: [{ phase: 'Fase D', grade: 7 }],
      categoryTag: 'Umum/Wajib' as const,
      jpPerWeek: 3,
      locationRef: 'Lampiran BSKAP 020/H/KR/2026 · SMP (Fase D)',
      slot: 'agama' as const,
    },
    {
      subject: agamaName,
      level: 'SMA' as SchoolLevel,
      phases: [
        { phase: 'Fase E', grade: 10 },
        { phase: 'Fase F', grade: 11 },
      ],
      categoryTag: 'Umum/Wajib' as const,
      jpPerWeek: 3,
      locationRef: 'Lampiran BSKAP 020/H/KR/2026 · SMA (Fase E–F)',
      slot: 'agama' as const,
    },
  ]),
  {
    subject: 'Pendidikan Digital',
    level: 'SMA',
    phases: [
      { phase: 'Fase E', grade: 10 },
      { phase: 'Fase F', grade: 11 },
    ],
    categoryTag: 'Pilihan/Tingkat Lanjut',
    jpPerWeek: 3,
    locationRef: 'Lampiran BSKAP 020/H/KR/2026 · Pemutakhiran Deep Learning 2026',
    specialNotes: 'Pemutakhiran literasi digital dan pembelajaran mendalam (Deep Learning) BSKAP No. 020 Tahun 2026.',
    slot: 'primary',
  },
];

function buildEntryFromBlueprint(
  bp: OfficialSubjectBlueprint,
  slot: 'primary' | 'agama',
  docNumber: string,
  fileName: string
): CPSubjectEntry[] {
  return bp.phases.map((p, idx) => {
    const preset = getSubjectPresetByGrade(bp.subject, bp.level, p.grade, p.phase);
    const resolvedJp = bp.jpPerWeek || preset.jpPerWeek || (bp.level === 'SD' ? 4 : bp.level === 'SMA' && p.grade >= 11 ? 5 : 3);
    const totalHours = preset.totalHoursPerYear || resolvedJp * 36;
    const subLabel = getSchoolLevelDisplay(bp.level, p.grade).subLabel;
    const slug = bp.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const phSlug = p.phase.toLowerCase().replace(/\s+/g, '');

    return {
      id: `official-${docNumber.replace(/[^0-9]/g, '')}-${bp.level.toLowerCase()}-${phSlug}-${slug}-${idx + 1}`,
      slot,
      sourceFileName: fileName,
      docNumber,
      subject: bp.subject,
      level: bp.level,
      subLevelLabel: subLabel,
      grade: p.grade,
      phase: p.phase || resolvePhaseByLevelAndGrade(bp.level, p.grade),
      categoryTag: bp.categoryTag,
      locationRef: bp.locationRef,
      specialNotes: bp.specialNotes,
      jpPerWeek: resolvedJp,
      totalHoursPerYear: totalHours,
      cpText: preset.cpSummary,
      elements: preset.elements,
      materialsSem1: (preset.materialsSem1 || []).map((m, mIdx) => ({
        ...m,
        id: `off-${slug}-${bp.level.toLowerCase()}-${p.grade}-s1-${mIdx + 1}`,
      })),
      materialsSem2: (preset.materialsSem2 || []).map((m, mIdx) => ({
        ...m,
        id: `off-${slug}-${bp.level.toLowerCase()}-${p.grade}-s2-${mIdx + 1}`,
      })),
    };
  });
}

let cachedBundle: {
  cp046Doc: ActiveMasterCPData;
  cp020Doc: ActiveMasterCPData;
  combinedCatalogItems: ActiveMasterCPData[];
  adminUploadItems: AdminUploadedCPItem[];
} | null = null;

export function buildOfficialCP046And020Documents(): {
  cp046Doc: ActiveMasterCPData;
  cp020Doc: ActiveMasterCPData;
  combinedCatalogItems: ActiveMasterCPData[];
  adminUploadItems: AdminUploadedCPItem[];
} {
  if (cachedBundle) return cachedBundle;

  const nowIso = '2026-07-01T08:00:00.000Z';

  const cp046Entries: CPSubjectEntry[] = CP_046_BLUEPRINTS.flatMap((bp) =>
    buildEntryFromBlueprint(bp, 'primary', '046/H/KR/2025', CP_046_FILE_NAME)
  );

  const cp020Entries: CPSubjectEntry[] = CP_020_BLUEPRINTS.flatMap((bp) =>
    buildEntryFromBlueprint(bp, bp.slot, '020/H/KR/2026', CP_020_FILE_NAME)
  );

  const defaultAnchor =
    cp046Entries.find((e) => e.subject === 'Fisika' && e.level === 'SMA') ||
    cp046Entries[0];

  const agamaAnchor =
    cp020Entries.find((e) => e.subject === 'Pendidikan Agama Islam & Budi Pekerti' && e.level === 'SMA') ||
    cp020Entries[0];

  const cp046Doc: ActiveMasterCPData = {
    id: 'official-cp-bskap-046-2025',
    fileName: CP_046_FILE_NAME,
    docNumber: '046/H/KR/2025',
    uploadedByRole: 'admin',
    uploadedByName: 'Sistem Kurikulum BSKAP Resmi',
    fileType: 'application/pdf',
    fileSize: 4250000,
    uploadedAt: nowIso,
    level: defaultAnchor.level,
    subLevelLabel: defaultAnchor.subLevelLabel,
    grade: defaultAnchor.grade,
    phase: defaultAnchor.phase,
    subject: defaultAnchor.subject,
    academicYear: '2026/2027',
    totalHoursPerYear: defaultAnchor.totalHoursPerYear || 180,
    jpPerWeek: defaultAnchor.jpPerWeek || 5,
    cpText: defaultAnchor.cpText || '',
    elements: defaultAnchor.elements || [],
    materialsSem1: defaultAnchor.materialsSem1,
    materialsSem2: defaultAnchor.materialsSem2,
    analyzedSubjects: [...cp046Entries, ...cp020Entries],
    executiveSummary:
      'Sinkronisasi resmi Keputusan Kepala BSKAP No. 046/H/KR/2025 (Mata Pelajaran SD/MI, SMP/MTs, SMA/MA Umum/Wajib & Pilihan/Tingkat Lanjut) bersama BSKAP No. 020/H/KR/2026 (Pendidikan Agama & Budi Pekerti serta Pemutakhiran Deep Learning).',
    kktpSummary:
      'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial), 66-85% (Baik/Tuntas), 86-100% (Sangat Baik/Pengayaan).',
    slot: 'primary',
    isPermanent: true,
    syncStatus: 'synced',
    lastSyncedAt: nowIso,
    updatedAt: nowIso,
  };

  const cp020Doc: ActiveMasterCPData = {
    id: 'official-cp-bskap-020-2026',
    fileName: CP_020_FILE_NAME,
    docNumber: '020/H/KR/2026',
    uploadedByRole: 'admin',
    uploadedByName: 'Sistem Kurikulum BSKAP Resmi',
    fileType: 'application/pdf',
    fileSize: 2180000,
    uploadedAt: nowIso,
    level: agamaAnchor.level,
    subLevelLabel: agamaAnchor.subLevelLabel,
    grade: agamaAnchor.grade,
    phase: agamaAnchor.phase,
    subject: agamaAnchor.subject,
    academicYear: '2026/2027',
    totalHoursPerYear: agamaAnchor.totalHoursPerYear || 108,
    jpPerWeek: agamaAnchor.jpPerWeek || 3,
    cpText: agamaAnchor.cpText || '',
    elements: agamaAnchor.elements || [],
    materialsSem1: agamaAnchor.materialsSem1,
    materialsSem2: agamaAnchor.materialsSem2,
    analyzedSubjects: cp020Entries,
    executiveSummary:
      'Sinkronisasi resmi Keputusan Kepala BSKAP No. 020/H/KR/2026 (Pendidikan Agama Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu, Kepercayaan Terhadap Tuhan YME & Pemutakhiran Deep Learning 2026 untuk jenjang SD, SMP, dan SMA).',
    kktpSummary:
      'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial), 66-85% (Baik/Tuntas), 86-100% (Sangat Baik/Pengayaan).',
    slot: 'agama',
    isPermanent: true,
    syncStatus: 'synced',
    lastSyncedAt: nowIso,
    updatedAt: nowIso,
  };

  const toCatalogDoc = (entry: CPSubjectEntry): ActiveMasterCPData => ({
    id: entry.id || `cat-${entry.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${entry.level}-${entry.grade}`,
    fileName: entry.sourceFileName || CP_046_FILE_NAME,
    docNumber: entry.docNumber || '046/H/KR/2025',
    uploadedByRole: 'admin',
    uploadedByName: 'Sistem Kurikulum BSKAP Resmi',
    uploadedAt: nowIso,
    level: entry.level,
    subLevelLabel: entry.subLevelLabel,
    grade: entry.grade,
    phase: entry.phase,
    subject: entry.subject,
    categoryTag: entry.categoryTag,
    locationRef: entry.locationRef,
    specialNotes: entry.specialNotes,
    academicYear: '2026/2027',
    totalHoursPerYear: entry.totalHoursPerYear || 108,
    jpPerWeek: entry.jpPerWeek || 3,
    cpText: (entry.cpText || '').slice(0, 4000),
    elements: entry.elements || [],
    materialsSem1: entry.materialsSem1,
    materialsSem2: entry.materialsSem2,
    slot: entry.slot || 'primary',
    isPermanent: true,
    syncStatus: 'synced',
    lastSyncedAt: nowIso,
    updatedAt: nowIso,
  });

  const combinedCatalogItems: ActiveMasterCPData[] = [
    ...cp046Entries.map(toCatalogDoc),
    ...cp020Entries.map(toCatalogDoc),
  ];

  const adminUploadItems: AdminUploadedCPItem[] = [
    {
      id: 'official-cp-bskap-046-2025',
      no: 1,
      slot: 'primary',
      isPermanent: true,
      docNumber: '046/H/KR/2025',
      fileName: CP_046_FILE_NAME,
      subject: 'Seluruh Mapel Umum & Pilihan (SD, SMP, SMA)',
      level: 'SMA',
      grade: 10,
      phase: 'Fase A–F',
      uploadedAt: nowIso,
      uploadedBy: 'Sistem Kurikulum BSKAP Resmi',
      uploadedByRole: 'admin',
    },
    {
      id: 'official-cp-bskap-020-2026',
      no: 2,
      slot: 'agama',
      isPermanent: true,
      docNumber: '020/H/KR/2026',
      fileName: CP_020_FILE_NAME,
      subject: 'Pendidikan Agama & Budi Pekerti + Deep Learning 2026',
      level: 'SMA',
      grade: 10,
      phase: 'Fase A–F',
      uploadedAt: nowIso,
      uploadedBy: 'Sistem Kurikulum BSKAP Resmi',
      uploadedByRole: 'admin',
    },
  ];

  cachedBundle = {
    cp046Doc,
    cp020Doc,
    combinedCatalogItems,
    adminUploadItems,
  };
  return cachedBundle;
}
