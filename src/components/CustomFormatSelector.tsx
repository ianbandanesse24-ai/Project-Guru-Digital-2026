import React, { useState, useRef, useEffect } from 'react';
import {
  FileUp,
  FileText,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Eye,
  Upload,
  Bookmark,
  BookmarkPlus,
  BookmarkCheck,
  Save,
  Copy,
  Check,
  Plus,
  Download,
  Sparkles,
  FolderHeart,
  FileEdit,
  X,
  Search,
  RotateCcw,
} from 'lucide-react';
import { UniversalFileParser, FileCategory } from '../lib/universalFileParser';

export interface CustomFormatFile {
  name: string;
  size: number;
  type: FileCategory | string;
  mimeType: string;
  base64?: string;
  extractedText?: string;
  tableMarkdown?: string;
  previewUrl?: string;
  sheetNames?: string[];
  summaryText?: string;
}

export interface CustomFormatConfig {
  useCustomFormat: boolean;
  formatFile: CustomFormatFile | null;
  customFormatNotes: string;
}

export interface SavedCustomTemplate {
  id: string;
  name: string;
  category: string; // 'modul_ajar' | 'rpm' | 'tp' | 'atp' | 'umum'
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

export const STORAGE_KEY_SAVED_TEMPLATES = 'agk_saved_custom_templates_v5';

export const INITIAL_BUILTIN_TEMPLATES: SavedCustomTemplate[] = [
  {
    id: 'template_standar_resmi_10_kolom_atp',
    name: 'Standar Baku Resmi ATP 10 Kolom (Kemendikbudristek & Deep Learning - Utama)',
    category: 'atp',
    description: 'Format Standar Baku Resmi Alur Tujuan Pembelajaran (ATP) 10 Kolom Lengkap terintegrasi Pendekatan Deep Learning (Mindful, Meaningful, & Joyful Learning): Identitas Perangkat, A. Capaian Pembelajaran Fase Lengkap, B. Elemen CP & 3 Pilar Deep Learning, C. Tabel ATP 10 Kolom (Tujuan Pembelajaran, Materi, Indikator TP, Profil Pelajar Pancasila & 6C, Kata Kunci, Kegiatan Pembelajaran 3 Pilar, Glosarium, Alokasi Waktu, Sumber Belajar, Penilaian Autentik), dan D. Lembar Pengesahan Resmi.',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: `STANDAR BAKU RESMI ALUR TUJUAN PEMBELAJARAN (ATP) 10 KOLOM LENGKAP:

1. IDENTITAS PERANGKAT:
   - Judul: ALUR TUJUAN PEMBELAJARAN (ATP) TAHUN PELAJARAN {Tahun Pelajaran}
   - Subjudul: PENDEKATAN DEEP LEARNING (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)
   - Tabel Identitas: Satuan Pendidikan, Mata Pelajaran, Kelas/Semester, Fase, Pendekatan Pembelajaran, Alokasi Waktu Total & Per Minggu

2. A. CAPAIAN PEMBELAJARAN:
   - Narasi Capaian Pembelajaran Fase Lengkap, terintegrasi responsif isu global dan filosofi Deep Learning.

3. B. ELEMEN CAPAIAN PEMBELAJARAN & 3 PILAR DEEP LEARNING:
   - Pemahaman Konseptual (Mindful Foundation)
   - Keterampilan Proses & Analisis (Meaningful Inquiry & Joyful Creation)

4. C. TABEL ALUR TUJUAN PEMBELAJARAN (10 KOLOM LENGKAP):
   | Tujuan Pembelajaran | Materi | Indikator Tujuan Pembelajaran | Profil Pelajar Pancasila & 6C | Kata Kunci | Kegiatan Pembelajaran (3 Pilar Deep Learning) | Glosarium | Alokasi Waktu | Sumber Belajar | Penilaian Autentik |
   - Kolom 1 (Tujuan Pembelajaran): Terurai per sub-TP (1.1, 1.2, 1.3, 1.4, 1.5, dst.)
   - Kolom 2 (Materi): Nama Bab / Lingkup Materi Pokok
   - Kolom 3 (Indikator Tujuan Pembelajaran): Poin-poin indikator terinci per materi
   - Kolom 4 (Profil Pelajar Pancasila & 6C): 6 Dimensi Karakter (Character, Critical Thinking, Creativity, Collaboration, Communication, Citizenship)
   - Kolom 5 (Kata Kunci): Daftar istilah kunci spesifik materi
   - Kolom 6 (Kegiatan Pembelajaran): Sintaks 3 Pilar (Mindful Discovery, Meaningful Inquiry, Joyful Creation & Celebration)
   - Kolom 7 (Glosarium): Glosarium kata ilmiah esensial
   - Kolom 8 (Alokasi Waktu): Total JP dan rincian pertemuan per materi
   - Kolom 9 (Sumber Belajar): Buku Guru & Siswa resmi, modul digital, media interaktif, lingkungan sekitar
   - Kolom 10 (Penilaian): Asesmen Diagnostik, Formatif Sikap 6C, Formatif Kinerja LKPD, dan Sumatif HOTS

5. D. PENGESAHAN DOKUMEN:
   - Kolom Tanda Tangan: Kepala Satuan Pendidikan dan Guru Mata Pelajaran lengkap dengan NIP.`,
  },
  {
    id: 'template_standar_baku_mutlak_rpm_deep_learning',
    name: 'Standar Baku Mutlak RPM Deep Learning (Kemendikbudristek & Deep Learning - Utama)',
    category: 'rpm',
    description: 'Format Standar Baku Mutlak Rencana Pelaksanaan Modul (RPM) Deep Learning: Identitas Modul, Kompetensi Dicapai, Skema 6 Fase Pedagogis, Sintaks Deep Learning, Skenario KBM 6 Kolom Lengkap, Asesmen & Rubrik KKTP, Media/Alat, Matriks Berdiferensiasi, Refleksi Guru, dan Pengesahan Dokumen.',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: `STANDAR BAKU MUTLAK RPM (RENCANA PELAKSANAAN MODUL) DEEP LEARNING:

A. IDENTITAS MODUL (Tabel 2 Kolom: Parameter | Keterangan):
   - Satuan Pendidikan
   - Penyusun / Guru Pengampu
   - NIP Guru
   - Tahun Ajaran
   - Jenjang / Fase / Kelas
   - Semester
   - Mata Pelajaran
   - Materi Pokok
   - Sub Materi Tiap Pertemuan (dengan penomoran kode [TP.X.Y])
   - Alokasi Waktu Total (dalam Menit dan JP, misal: 270 Menit (2 Pertemuan × 135 Menit / Pertemuan = 6 JP))
   - Model Pembelajaran: Deep Learning (6 Fase Sintaks: Mindful, Meaningful, Joyful Learning)
   - Pendekatan & Metode: Saintifik, Inkuiri Terbimbing, Kontekstual, Diskusi Kelompok, Eksplorasi Nyata, Think-Pair-Share
   - Target Peserta Didik: Peserta Didik Reguler/Tipikal, Peserta Didik dengan Kesulitan Belajar (Scaffolding), dan Peserta Didik Berprestasi Cepat (Pengayaan)

B. KOMPETENSI YANG DICAPAI:
   - Capaian Pembelajaran (CP) Elemen & Rasional (dengan penanda 📌)
   - Tujuan Pembelajaran (TP) Operasional (HOTS Berbasis Kaidah ABCD dengan Kode [TP.X.Y])
   - Pemahaman Bermakna (Meaningful Learning)
   - Pertanyaan Pemantik (Sparking Questions HOTS)

III. SKEMA SIKLUS 6 FASE PEDAGOGIS DEEP LEARNING (Diagram Alur Mindful, Meaningful, Joyful Learning)

C. SINTAKS (DESAIN PEMBELAJARAN DEEP LEARNING):
   Tabel 4 Kolom: FASE SINTAKS | NAMA TAHAPAN | PILAR PEDAGOGIS | TUJUAN DAN FOKUS AKTIVITAS KELAS (Fase 1 s.d. Fase 6)

D. LANGKAH-LANGKAH PEMBELAJARAN (TABEL SKENARIO KBM LENGKAP TIAP PERTEMUAN):
   Header Tiap Pertemuan:
   - Pertemuan Ke [X] ([Total Menit] Menit)
   - Materi / Sub Pokok Bahasan : [TP.X.Y] [Sub Materi]
   - Tujuan Pembelajaran (TP) : [TP.X.Y] [Rumusan TP]
   
   Tabel Skenario KBM 6 Kolom Lengkap:
   | TAHAP KEGIATAN | FASE SINTAKS DEEP LEARNING | ALOKASI WAKTU | KEGIATAN GURU (LENGKAP DARI AWAL MASUK KELAS) | KEGIATAN PESERTA DIDIK (AKTIF & RESPONSIF) | ASPEK 3 PILAR & 6C |
   
   1. A. KEGIATAN PENDAHULUAN (FASE 1: Orientasi, Apersepsi & Motivasi / Review Materi - 20 Menit):
      - Guru: Salam ramah & kerapian kelas, Doa bersama dipimpin ketua kelas (Religius), Presensi & Mindful Breathing (STOP 2 Menit), Apersepsi kontekstual stimulus fenomena nyata, Pertanyaan pemantik HOTS lisan, Penyampaian TP & skenario 6 fase KBM, Pembentukan kelompok heterogen (4-5 siswa).
      - Peserta Didik: Menjawab salam santun, Berdoa khusyuk, Mengikuti Mindful Breathing, Menyimak apersepsi, Merespons pertanyaan pemantik spontan, Mencatat TP di buku tulis, Bergabung ke kelompok secara tertib.
      - Aspek: Mindful Learning (Beriman & Bertakwa, Kesadaran Diri / Mindfulness, Komunikasi Awal).
      
   2. B. KEGIATAN INTI (Meaningful & Joyful Learning):
      - FASE 2: Eksplorasi Konsep & Penyelidikan Inkuiri (38 Menit):
        * Guru: Distribusi LKPD & kit media konkret, pembagian peran kerja tim (Ketua, Notulis, Alat, Presenter), fasilitasi eksperimen/eksplorasi objek nyata, bimbingan berjenjang (scaffolding & socratic questions).
        * Siswa: Menerima LKPD, berbagi peran secara adil (Gotong Royong), melakukan penyelidikan & mencatat data empiris jujur, berdiskusi aktif membedah data.
      - FASE 3: Penjelasan, Elaborasi & Penguatan Ilmiah (33 Menit):
        * Guru: Mempersilakan presentasi pleno/jigsaw kelompok, memoderatori tanya jawab kelas santun & demokratis, elaborasi konsep di papan tulis, penegasan notasi rumus ilmiah & pelurusan miskonsepsi.
        * Siswa: Presentasi perwakilan lugas (Communication), kelompok lain menyimak kritis & memberi apresiasi, mencatat penguatan guru & rumus di buku, menyempurnakan LKPD.
      - FASE 4: Aplikasi & Pemecahan Masalah Kontekstual (24 Menit):
        * Guru: Memberikan studi kasus nyata tantangan HOTS terapan / rekayasa industri, memandu aktivitas Think-Pair-Share kolaboratif, memberikan umpan balik formatif langsung (real-time).
        * Siswa: Menganalisis tantangan mandiri (Think), diskusi pasangan tim (Pair), berbagi solusi pleno (Share), mencatat metode analisis efisien.
        
   3. C. KEGIATAN PENUTUP (Joyful & Mindful Connection - 20 Menit):
      - FASE 5: Refleksi Mendalam & Metakognisi (Pola 3-2-1 / What So What Now What - 10 Menit):
        * Guru: Memandu pengisian Refleksi 3-2-1, memberikan apresiasi verbal & penghargaan positif atas kolaborasi kelas.
        * Siswa: Mengisi lembar refleksi berkesadaran metakognitif, 2 siswa sukarela membacakan di depan kelas, saling memberi tepuk tangan apresiasi antarteman.
      - FASE 6: Simpulan Bersama, Tindak Lanjut & Doa Penutup (10 Menit):
        * Guru: Merumuskan simpulan terpadu bersama siswa, memberikan tugas pengayaan kontekstual di lingkungan rumah, menyampaikan info materi pertemuan berikutnya, memandu doa penutup khusyuk bersyukur & salam penutup hangat.
        * Siswa: Menyampaikan kesimpulan antusias dengan kata-kata sendiri, mencatat tugas mandiri, menyimak rencana KBM berikutnya, berdoa penutup khidmat & membalas salam tertib.

E. ASESMEN PEMBELAJARAN:
   - Tabel Asesmen 4 Kolom (Jenis Asesmen: Diagnostik Awal, Formatif Proses LKPD & Diskusi, Sumatif Akhir HOTS | Bentuk & Instrumen | Waktu Pelaksanaan | Aspek & Indikator yang Dinilai)
   - Panduan Rubrik Ketercapaian Tujuan Pembelajaran (KKTP) 5 Kolom (Kriteria Capaian: Pemahaman Konsep, Keterampilan Penyelidikan & LKPD, Sikap & Kolaborasi 6C | Perlu Bimbingan 0-64% | Cukup 65-74% | Baik 75-87% | Sangat Baik 88-100%)

E. MEDIA, ALAT, DAN SUMBER BELAJAR:
   - Media Pembelajaran Interaktif (Video animasi kontekstual, Slide infografis visual, LKPD Deep Learning, Papan tulis/Mind Map)
   - Alat dan Bahan Praktik Konkret (Kit peraga/investigasi konkret, Benda kontekstual lingkungan, Sticky notes & spidol warna, LCD Proyektor & Laptop)
   - Sumber Belajar Resmi (Buku Teks Siswa Kemendikbudristek RI, Buku Panduan Guru Kemendikbudristek RI, Modul Digital Kurikulum Berbasis Deep Learning, Portal Simulasi Edukasi)

VIII. MATRIKS PEMBELAJARAN BERDIFERENSIASI:
   - Skema Matriks Alur Visual (Diferensiasi Konten, Diferensiasi Proses, Diferensiasi Produk)
   - Tabel Diferensiasi 4 Kolom (Kategori Peserta Didik: Reguler, Kesulitan Belajar / Scaffolding, Berpencapaian Cepat / Mahir | Diferensiasi Konten | Diferensiasi Proses | Diferensiasi Produk)

H. REFLEKSI GURU:
   - Tabel 2 Kolom (Aspek Refleksi: 1. Ketercapaian TP, 2. Efektivitas Sintaks Deep Learning, 3. Partisipasi & Antusiasme Siswa, 4. Kendala & Miskonsepsi, 5. Rencana Perbaikan | Catatan Evaluatif Guru)

X. PENGESAHAN DOKUMEN:
   - Kolom Tanda Tangan Resmi: Kepala Satuan Pendidikan dan Guru Mata Pelajaran lengkap dengan NIP.`,
  },
  {
    id: 'template_standar_resmi_kktp_interval_deep_learning',
    name: 'Standar Baku Resmi KKTP Matriks Interval Nilai (Kemendikbudristek & Deep Learning - Utama)',
    category: 'kktp',
    description: 'Format Standar Baku Resmi Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) berbasis Matriks Interval Nilai (0-40%, 41-65%, 66-85%, 86-100%) terintegrasi Pendidikan Deep Learning (Bermakna, Berkesan, Menyenangkan): Identitas Perangkat, Tabel Matriks KKTP 6 Kolom per TP, Keterangan Tindak Lanjut Asesmen, Pendekatan Rubrik Deskriptif 4 Level Mutu, Lembar Ceklis Hasil Siswa, Pedoman Remedial/Pengayaan Terpadu, dan Lembar Pengesahan Resmi.',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: `STANDAR BAKU RESMI KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) DEEP LEARNING:

1. IDENTITAS PERANGKAT:
   - Judul: KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) TAHUN AJARAN {Tahun Pelajaran}
   - Subjudul: PENDIDIKAN DEEP LEARNING (BERMAKNA, BERKESAN, MENYENANGKAN)
   - Tabel Identitas: Satuan Pendidikan, Mata Pelajaran, Fase/Kelas, Semester, Tahun Ajaran, Guru Pengampu & NIP

2. TABEL KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) 6 KOLOM LENGKAP:
   | Bab / Lingkup Materi | Tujuan Pembelajaran (TP) | 0 - 40% (Remedial di Seluruh Bagian) | 41 - 65% (Remedial di Bagian yang Diperlukan) | 66 - 85% (Sudah Mencapai Ketuntasan / Tidak Perlu Remedial) | 86 - 100% (Perlu Pengayaan / Tantangan Lebih) |
   - Menjabarkan seluruh Bab/Lingkup Materi dan kode/deskripsi Tujuan Pembelajaran (TP.1.1, TP.1.2, dst.)
   - Keterangan status ketuntasan pada tiap kolom interval

3. KETERANGAN INTERVAL KETERCAPAIAN & TINDAK LANJUT ASESMEN:
   - 0 - 40% : Belum mencapai ketuntasan, remedial di seluruh bagian
   - 41 - 65% : Belum mencapai ketuntasan, remedial di bagian yang diperlukan
   - 66 - 85% : Sudah mencapai ketuntasan, tidak perlu remedial
   - 86 - 100% : Sudah mencapai ketuntasan, perlu pengayaan atau tantangan lebih

4. PENDEKATAN RUBRIK DESKRIPTIF KETERCAPAIAN DEEP LEARNING (4 LEVEL MUTU):
   - Tabel Rubrik: Kode & Fokus TP | Indikator Asesmen (IKTP) | Baru Berkembang (0-40%) | Layak (41-65%) | Cakap (66-85%) [KKTP Standar] | Mahir (86-100%) [Pengayaan] | Standar Ketuntasan

5. MATRIKS REKAPITULASI CEKLIS HASIL ASESMEN PESERTA DIDIK & TINDAK LANJUT

6. PEDOMAN TINDAK LANJUT ASESMEN, REMEDIAL & PENGAYAAN TERPADU

7. LEMBAR PENGESAHAN DOKUMEN:
   - Kolom Tanda Tangan: Kepala Satuan Pendidikan dan Guru Mata Pelajaran lengkap dengan NIP.`,
  },
  {
    id: 'template_standar_resmi_prota_4_kolom',
    name: 'Standar Baku Resmi PROTA 4 Kolom (Kemendikbudristek & Deep Learning - Utama)',
    category: 'prota',
    description: 'Format Standar Baku Resmi Program Tahunan (PROTA) 4 Kolom Kurikulum Berbasis Deep Learning: Identitas Perangkat Lengkap (Satuan Pendidikan, Penyusun, NIP, Mata Pelajaran, Fase, Kelas/Semester, Model Deep Learning), Tabel PROTA 4 Kolom (Bab, Alur Tujuan Pembelajaran 3 Pilar, Ruang Lingkup Materi, Alokasi Waktu JP), Total Alokasi Waktu Tahunan, dan Lembar Pengesahan Resmi.',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: `STANDAR BAKU RESMI PROGRAM TAHUNAN (PROTA) 4 KOLOM DEEP LEARNING:

1. COVER & IDENTITAS PERANGKAT:
   - Judul: PROGRAM TAHUNAN (PROTA) KURIKULUM BERBASIS DEEP LEARNING
   - Subjudul: PENDEKATAN DEEP LEARNING (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)
   - Identitas: Mata Pelajaran, Satuan Pendidikan, Tahun Pelajaran, Fase, Kelas / Semester (Ganjil & Genap), Nama Penyusun, NIP

2. TABEL PROGRAM TAHUNAN (PROTA) 4 KOLOM:
   | Bab | Alur Tujuan Pembelajaran (3 Pilar Deep Learning) | Materi / Ruang Lingkup | Alokasi Waktu |
   - Kolom 1 (Bab): Nomor dan Nama Bab / Lingkup Materi Pokok
   - Kolom 2 (Alur Tujuan Pembelajaran): Rumusan operasional Tujuan Pembelajaran (TP) per sub-materi (Mindful, Meaningful, Joyful)
   - Kolom 3 (Materi): Topik esensial / Sub-materi pokok
   - Kolom 4 (Alokasi Waktu): Alokasi jam pelajaran (JP) per sub-materi

3. BARIS REKAPITULASI TOTAL ALOKASI WAKTU:
   | Total | | | {Total} JP |

4. LEMBAR PENGESAHAN DOKUMEN RESMI:
   - Tanda tangan Mengetahui Kepala Satuan Pendidikan (Nama & NIP)
   - Tanda tangan Guru Mata Pelajaran (Nama & NIP)`,
  },
  {
    id: 'template_tp_abcd_bloom',
    name: 'Standar Perumusan TP Komponen ABCD & 3 Pilar (Kemendikbudristek & Deep Learning - Utama)',
    category: 'tp',
    description: 'Format Perumusan Tujuan Pembelajaran berbasis 4 pilar kaidah ABCD (Audience, Behavior, Condition, Degree), pemetaan Taksonomi Bloom HOTS (C2 s.d C6), Dimensi Profil Pelajar Pancasila & 6C, dan 3 Pilar Deep Learning (Mindful, Meaningful, Joyful).',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: `STANDAR PERUMUSAN TUJUAN PEMBELAJARAN (TP) ABCD DEEP LEARNING:
1. IDENTITAS PERANGKAT (Satuan Pendidikan, Mata Pelajaran, Jenjang/Kelas/Fase, Semester, Tahun Pelajaran, Guru Pengampu)
2. SKEMA ANATOMI RUMUSAN TP (Audience, Behavior, Condition, Degree + 3 Pilar Deep Learning)
3. TABEL RUMUSAN TP TERSINKRONISASI (Kode TP, Rumusan TP ABCD, Pilar Deep Learning, KKO Bloom HOTS, Dimensi Profil Pancasila & 6C, Pemahaman Bermakna)
4. PERTANYAAN PEMANTIK (Mindful Sparking Questions)
5. DIAGRAM HIERARKI TAHAPAN PENGUASAAN KOMPETENSI DEEP LEARNING (Mindful Foundation, Meaningful Inquiry, Joyful Creation)
6. LEMBAR PENGESAHAN DOKUMEN`,
  },
  {
    id: 'template_standar_resmi_alokasi_waktu_deep_learning',
    name: 'Standar Analisis Alokasi Waktu RBE (Kemendikbudristek & Deep Learning - Utama)',
    category: 'analisis_alokasi_waktu',
    description: 'Format Standar Analisis Alokasi Waktu & Rincian Pekan Efektif (RBE) Kurikulum Berbasis Deep Learning: Identitas Dokumen, Skema Struktur Waktu Tahunan (Mindful, Meaningful, Joyful), Distribusi Pekan Kalender & Jam Efektif Semester 1 dan 2, Distribusi JP per Bab, dan Pengesahan Resmi.',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: `STANDAR ANALISIS ALOKASI WAKTU & RBE DEEP LEARNING:
1. IDENTITAS DOKUMEN (Satuan Pendidikan, Mata Pelajaran, Jenjang/Kelas/Fase, Semester Ganjil & Genap, Tahun Pelajaran, Guru Pengampu, NIP)
2. SKEMA STRUKTUR DISTRIBUSI ALOKASI WAKTU 1 TAHUN AJARAN (Mindful Foundation, Meaningful Inquiry, Joyful Creation)
3. ANALISIS RINCIAN PEKAN EFEKTIF SEMESTER 1 & 2 (Matriks Bulanan & Perhitungan JP)
4. REKAPITULASI ALOKASI WAKTU TAHUNAN
5. TABEL DISTRIBUSI ALOKASI WAKTU & SIKLUS DEEP LEARNING PER BAB
6. LEMBAR PENGESAHAN RESMI KEPALA SEKOLAH & GURU`,
  },
  {
    id: 'template_standar_resmi_analisis_cp_deep_learning',
    name: 'Standar Analisis & Distribusi CP (Kemendikbudristek & Deep Learning - Utama)',
    category: 'analisis_cp',
    description: 'Format Standar Analisis Capaian Pembelajaran (CP) & Distribusi Materi Per Semester: Identitas Lengkap, Rasional & CP Resmi Fase, Bagan Dekomposisi CP Menuju TP, Dekomposisi Elemen CP, Distribusi Materi Semester 1 & 2 terintegrasi 3 Pilar Deep Learning, dan Pengesahan.',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: `STANDAR ANALISIS CP DEEP LEARNING:
1. IDENTITAS PERANGKAT
2. RASIONAL & CAPAIAN PEMBELAJARAN (CP) RESMI FASE
3. BAGAN ALUR DEKOMPOSISI CP MENUJU TP
4. DEKOMPOSISI ELEMEN & ANALISIS KOMPETENSI ESENSIAL
5. TABEL DISTRIBUSI CP & MATERI SEMESTER 1 & 2 (DENGAN STRATEGI MODEL DEEP LEARNING)
6. REKAPITULASI MATRIKS DISTRIBUSI ALOKASI WAKTU CP 1 TAHUN & PENGESAHAN`,
  },
  {
    id: 'template_standar_resmi_lkpd_deep_learning',
    name: 'Standar LKPD Deep Learning & Kanvas Siswa (Kemendikbudristek & Deep Learning - Utama)',
    category: 'lkpd',
    description: 'Format Lembar Kerja Peserta Didik (LKPD) berbasis 4 Sintaks Deep Learning: Identitas Kelompok, Tujuan & Petunjuk Belajar, Sintaks 1 Mindful Discovery & Bagan Visual, Sintaks 2 Meaningful Inquiry & Data Empiris, Sintaks 3 Joyful Creation & Kanvas Sketsa Siswa, dan Sintaks 4 Mindful Reflection (Kartu 3-2-1).',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: `STANDAR LKPD DEEP LEARNING:
1. IDENTITAS KELOMPOK BELAJAR & KARAKTER 6C
2. TUJUAN PEMBELAJARAN & PETUNJUK KERJA BERKESADARAN
3. SINTAKS 1: MINDFUL DISCOVERY (Orientasi Fenomena Nyata, Bagan Konsep, Pertanyaan Pemantik)
4. SINTAKS 2: MEANINGFUL INQUIRY (Aktivitas Penyelidikan HOTS, Tabel Data Empiris, Scaffolding Berjenjang)
5. SINTAKS 3: JOYFUL CREATION (Kanvas Gambar & Sketsa Solusi Siswa, Pameran Karya Dinding Kelas Gallery Walk, Apresiasi Bintang & Wish)
6. SINTAKS 4: MINDFUL REFLECTION & ASESMEN AUTENTIK (Kartu Refleksi Diri Siswa 3-2-1, Rubrik Mutu Guru)`,
  },
  {
    id: 'template_standar_resmi_rubrik_deep_learning',
    name: 'Standar Rubrik Penilaian Terpadu 3 Pilar & 6C (Kemendikbudristek & Deep Learning - Utama)',
    category: 'rubrik_penilaian',
    description: 'Format Rubrik Penilaian Terpadu berbasis Deep Learning: Identitas Asesmen, Bagan Struktur 3 Pilar (Mindful, Meaningful, Joyful), Asesmen Diagnostik Awal, Formatif Sikap & Karakter 6C, Formatif Kinerja LKPD Berjenjang, Sumatif Lingkup Materi HOTS, Formula Nilai Akhir & Lembar Pengesahan.',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    notes: `STANDAR RUBRIK PENILAIAN TERPADU DEEP LEARNING:
1. IDENTITAS ASESMEN & BAGAN SISTEM PENILAIAN TERINTEGRASI (MINDFUL, MEANINGFUL, JOYFUL)
2. RUBRIK ASESMEN DIAGNOSTIK AWAL (Gaya Belajar & Kesiapan Kognitif Prasyarat)
3. RUBRIK ASESMEN FORMATIF SIKAP & KARAKTER DIMENSI 6C (Skala 1 - 4)
4. RUBRIK PENILAIAN KINERJA PROSES & LKPD BERJENJANG
5. RUBRIK ASESMEN SUMATIF LINGKUP MATERI (KISI-KISI PG & URAIAN HOTS SERTA RUBRIK KARYA)
6. FORMULA PENGOLAHAN NILAI AKHIR & INTERVENSI KKTP
7. LEMBAR PENGESAHAN INSTRUMEN ASESMEN RESMI`,
  },
];

export function getSavedTemplates(): SavedCustomTemplate[] {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return INITIAL_BUILTIN_TEMPLATES;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY_SAVED_TEMPLATES);
    let parsed: SavedCustomTemplate[] = [];
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) parsed = p;
    }
    // Filter out old built-in templates and purge any obsolete RPM templates so Deep Learning is the sole standard
    const userCustomTemplates = parsed.filter(
      (t) => !t.isBuiltIn && t.category !== 'rpm' && !INITIAL_BUILTIN_TEMPLATES.some((b) => b.id === t.id)
    );
    const merged = [...INITIAL_BUILTIN_TEMPLATES, ...userCustomTemplates];
    window.localStorage.setItem(STORAGE_KEY_SAVED_TEMPLATES, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('Error loading saved templates:', err);
    return INITIAL_BUILTIN_TEMPLATES;
  }
}

export function saveTemplatesToStorage(templates: SavedCustomTemplate[]): void {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY_SAVED_TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Error saving templates:', err);
  }
}

export function exportTemplatesAsJSON(templates: SavedCustomTemplate[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(templates, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `Templat_RPM_Guru_AGK_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

interface CustomFormatSelectorProps {
  value: CustomFormatConfig;
  onChange: (config: CustomFormatConfig) => void;
  docTypeName?: string;
  docTypeId?: string;
  compact?: boolean;
}

export const DOCUMENT_PRESETS: Record<string, { id: string; label: string; notes: string }[]> = {
  analisis_alokasi_waktu: [
    {
      id: 'alokasi_waktu_standar_deep_learning',
      label: 'Format Standar Analisis Alokasi Waktu RBE (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS DOKUMEN (Satuan Pendidikan, Mata Pelajaran, Jenjang/Kelas/Fase, Semester Ganjil & Genap, Tahun Pelajaran, Guru Pengampu, NIP)
2. MODEL & PENDEKATAN: Deep Learning (Mindful, Meaningful, & Joyful Learning)
3. SKEMA STRUKTUR DISTRIBUSI ALOKASI WAKTU 1 TAHUN AJARAN (Mindful Foundation 25%, Meaningful Inquiry 50%, Joyful Creation 25%)
4. PERHITUNGAN PEKAN EFEKTIF SEMESTER (Tabel Matriks Bulanan: No, Nama Bulan, Jumlah Pekan Kalender, Pekan Tidak Efektif, Pekan Efektif KBM, Keterangan)
5. DISTRIBUSI ALOKASI JAM PELAJARAN (JP Efektif, Cadangan Asesmen Sumatif, Tatap Muka KBM)
6. TABEL DISTRIBUSI ALOKASI WAKTU (JP) & SIKLUS DEEP LEARNING PER BAB
7. LEMBAR PENGESAHAN RESMI (Kepala Satuan Pendidikan & Guru Pengampu)`,
    },
    {
      id: 'alokasi_waktu_dinas_provinsi',
      label: 'Format Rincian Minggu Efektif (RME) Standar Dinas Pendidikan',
      notes: `A. PERHITUNGAN RINCIAN MINGGU EFEKTIF (RME) BERDASARKAN KALENDER PENDIDIKAN RESMI
B. RINCIAN MINGGU TIDAK EFEKTIF (MPLS, Libur Awal/Akhir Puasa, Libur Hari Raya, Penilaian Sumatif, Libur Semester)
C. REKAPITULASI JUMLAH JAM PELAJARAN SEMESTER GANJIL & GENAP
D. MATRIKS DISTRIBUSI ALOKASI WAKTU PER ELEMEN & TUJUAN PEMBELAJARAN (TP)
E. PENGESAHAN KEPALA SEKOLAH, GURU PENGAMPU & MENGETAHUI PENGAWAS PEMBINA`,
    },
  ],
  alokasi_waktu: [
    {
      id: 'alokasi_waktu_standar_deep_learning',
      label: 'Format Standar Analisis Alokasi Waktu RBE (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS DOKUMEN (Satuan Pendidikan, Mata Pelajaran, Jenjang/Kelas/Fase, Semester Ganjil & Genap, Tahun Pelajaran, Guru Pengampu, NIP)
2. MODEL & PENDEKATAN: Deep Learning (Mindful, Meaningful, & Joyful Learning)
3. SKEMA STRUKTUR DISTRIBUSI ALOKASI WAKTU 1 TAHUN AJARAN (Mindful, Meaningful, Joyful)
4. PERHITUNGAN PEKAN EFEKTIF SEMESTER GANJIL & GENAP
5. TABEL DISTRIBUSI ALOKASI WAKTU & SIKLUS DEEP LEARNING PER BAB
6. LEMBAR PENGESAHAN RESMI KEPALA SEKOLAH & GURU`,
    },
  ],
  analisis_cp: [
    {
      id: 'analisis_cp_standar_deep_learning',
      label: 'Format Standar Analisis & Distribusi CP (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS PERANGKAT LENGKAP (Satuan Pendidikan, Mapel, Fase/Kelas, Semester, Tahun Pelajaran)
2. RASIONAL & CAPAIAN PEMBELAJARAN (CP) RESMI FASE
3. BAGAN ALUR DEKOMPOSISI CP MENUJU TP
4. DEKOMPOSISI ELEMEN & ANALISIS KOMPETENSI ESENSIAL HOTS
5. INTEGRASI 3 PILAR DEEP LEARNING (Mindful Foundation, Meaningful Inquiry, Joyful Creation)
6. HASIL DISTRIBUSI CAPAIAN PEMBELAJARAN & MATERI PER SEMESTER (GANJIL & GENAP)
7. REKAPITULASI MATRIKS DISTRIBUSI ALOKASI WAKTU CP 1 TAHUN & LEMBAR PENGESAHAN`,
    },
    {
      id: 'analisis_cp_deep_learning_matriks',
      label: 'Format Matriks 6 Kolom Analisis CP (Deep Learning & Profil Pancasila)',
      notes: `1. KOP RESMI SATUAN PENDIDIKAN & IDENTITAS GURU
2. CAPAIAN PEMBELAJARAN (CP) RESMI FASE & KELAS
3. TABEL MATRIKS ANALISIS CP LENGKAP:
   | No | Elemen CP | Kalimat Capaian Pembelajaran | Materi Pokok Esensial | Rumusan Tujuan Pembelajaran (TP) | Dimensi Profil Pancasila & 3 Pilar Deep Learning | Alokasi JP |
4. DISTRIBUSI ALOKASI WAKTU SEMESTER 1 (GANJIL) & SEMESTER 2 (GENAP)
5. PENGESAHAN DOKUMEN: Kepala Satuan Pendidikan dan Guru Pengampu (Lengkap dengan NIP)`,
    },
    {
      id: 'analisis_cp_mgmp',
      label: 'Format Analisis CP Standar MGMP / MKKS',
      notes: `A. RASIONAL & CAPAIAN PEMBELAJARAN FASE
B. PEMETAAN ELEMEN CAPAIAN & KOMPETENSI KUNCI
C. ANALISIS MATERI POKOK ESENSIAL & ALOKASI WAKTU
D. INDIKATOR CAPAIAN PEMBELAJARAN
E. RENCANA PENILAIAN & ASESMEN AUTENTIK`,
    },
  ],
  tp: [
    {
      id: 'tp_standar_deep_learning_abcd',
      label: 'Format Perumusan TP ABCD & 3 Pilar (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS SATUAN PENDIDIKAN & MATA PELAJARAN
2. SKEMA ANATOMI RUMUSAN TP (Audience, Behavior, Condition, Degree + 3 Pilar Deep Learning)
3. TABEL RUMUSAN TUJUAN PEMBELAJARAN (TP) DEEP LEARNING:
   - Kode TP
   - Rumusan TP (Komponen: Audience, Behavior, Condition, Degree)
   - Pilar Deep Learning (Mindful, Meaningful, Joyful)
   - Kata Kerja Operasional (KKO Bloom HOTS C2-C6)
   - Dimensi Karakter 6C & Profil Pelajar Pancasila
   - Pemahaman Bermakna (Deep Meaning)
4. PERTANYAAN PEMANTIK INKUIRI (Mindful Sparking Questions)
5. DIAGRAM HIERARKI TAHAPAN PENGUASAAN KOMPETENSI DEEP LEARNING
6. LEMBAR PENGESAHAN DOKUMEN RESMI`,
    },
    {
      id: 'tp_elemen',
      label: 'Format TP Matriks Elemen & Kompetensi',
      notes: `A. TUJUAN PEMBELAJARAN ELEMEN PEMAHAMAN KONSEPTUAL
B. TUJUAN PEMBELAJARAN ELEMEN KETERAMPILAN PROSES
C. TUJUAN PEMBELAJARAN SIKAP & PROFIL PANCASILA
D. INDIKATOR KETERCAPAIAN TUJUAN PEMBELAJARAN (IKTP)`,
    },
  ],
  atp: [
    {
      id: 'atp_standar_resmi_10_kolom_deep_learning',
      label: 'Format Standar Baku Resmi ATP 10 Kolom (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS PERANGKAT (Mata Pelajaran, Kelas/Semester, Fase, Alokasi Waktu Total & Per Minggu, Pendekatan Deep Learning)
2. A. CAPAIAN PEMBELAJARAN (Narasi Capaian Pembelajaran Fase Lengkap & Isu Global Berkelanjutan)
3. B. ELEMEN CAPAIAN PEMBELAJARAN & 3 PILAR DEEP LEARNING (Pemahaman Mapel & Keterampilan Proses Inkuiri)
4. C. TABEL ALUR TUJUAN PEMBELAJARAN (10 KOLOM LENGKAP):
   - Tujuan Pembelajaran (Sub-TP 1.1, 1.2, 1.3, dst.)
   - Materi Pokok
   - Indikator Tujuan Pembelajaran
   - Profil Pelajar Pancasila & Dimensi 6C
   - Kata Kunci
   - Kegiatan Pembelajaran (Mindful Discovery, Meaningful Inquiry, Joyful Creation & Celebration)
   - Glosarium
   - Alokasi Waktu (JP & Pertemuan)
   - Sumber Belajar
   - Penilaian Autentik (Diagnostik, Formatif 6C, Kinerja LKPD, Sumatif HOTS)
5. D. PENGESAHAN DOKUMEN (Kepala Satuan Pendidikan & Guru Pengampu lengkap NIP)`,
    },
    {
      id: 'atp_matriks_deep_learning',
      label: 'Format Matriks Alur Deep Learning & 3 Pilar Pedagogis',
      notes: `1. IDENTITAS ATP & RASIONAL CP FASE
2. ELEMEN CAPAIAN PEMBELAJARAN & DEKOMPOSISI MATERI
3. TABEL ALUR TUJUAN PEMBELAJARAN (Tahapan Logis, Kode TP, Materi Pokok, 3 Pilar Deep Learning, Alokasi JP, Asesmen Formatif, Media & Sumber Belajar)
4. ROADMAP SIKLUS BELAJAR BERKELANJUTAN & PENGESAHAN`,
    },
    {
      id: 'atp_kronologis_tahapan',
      label: 'Format Alur Urutan Kronologis Konkret ke Abstrak',
      notes: `A. TAHAP 1: PENGUASAAN KONSEP DASAR & IDENTIFIKASI FENOMENA (SEMESTER GANJIL)
B. TAHAP 2: APLIKASI & INVESTIGASI MASALAH KONTEKSTUAL (SEMESTER GANJIL)
C. TAHAP 3: EKSPERIMEN & ANALISIS SISTEM LANJUTAN (SEMESTER GENAP)
D. TAHAP 4: KREASI INOVASI, GELAR KARYA & REFLEKSI KOMPREHENSIF (SEMESTER GENAP)
E. TABEL REKAPITULASI ALUR KOMPETENSI 1 TAHUN & PENGESAHAN`,
    },
  ],
  prota: [
    {
      id: 'prota_standar_resmi_4_kolom_deep_learning',
      label: 'Format Standar Baku Resmi PROTA 4 Kolom (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. COVER & IDENTITAS PERANGKAT:
   - Judul: PROGRAM TAHUNAN (PROTA) KURIKULUM MERDEKA
   - Subjudul: PENDEKATAN DEEP LEARNING (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)
   - Identitas: Mata Pelajaran, Satuan Pendidikan, Tahun Pelajaran, Fase, Kelas / Semester (Ganjil & Genap), Nama Penyusun, NIP
2. TABEL PROGRAM TAHUNAN (PROTA) 4 KOLOM:
   - Kolom 1 (Bab): Nomor dan Nama Bab / Lingkup Materi Pokok
   - Kolom 2 (Alur Tujuan Pembelajaran): Rumusan operasional Tujuan Pembelajaran (TP) per sub-materi (Mindful, Meaningful, Joyful)
   - Kolom 3 (Materi): Topik esensial / Sub-materi pokok
   - Kolom 4 (Alokasi Waktu): Alokasi jam pelajaran (JP) per sub-materi
3. BARIS REKAPITULASI TOTAL ALOKASI WAKTU:
   | Total | | | {Total} JP |
4. LEMBAR PENGESAHAN DOKUMEN RESMI (Kepala Sekolah & Guru Pengampu lengkap NIP)`,
    },
    {
      id: 'prota_standar',
      label: 'Format PROTA Tabel Distribusi JP Sekolah',
      notes: `1. KOP RESMI SEKOLAH & IDENTITAS PROGRAM TAHUNAN
2. PERHITUNGAN ALOKASI WAKTU EFEKTIF PER TAHUN
3. TABEL DISTRIBUSI ALOKASI PROTA:
   - Semester (Ganjil & Genap)
   - Nomor Bab / Lingkup Materi
   - Alur Tujuan Pembelajaran (ATP / TP)
   - Alokasi Jam Pelajaran (JP)
   - Keterangan Waktu Asesmen & Cadangan
4. REKAPITULASI TOTAL JP & PENGESAHAN KEPALA SEKOLAH`,
    },
  ],
  prosem: [
    {
      id: 'prosem_matriks_deep_learning',
      label: 'Format Standar Baku Matriks PROSEM (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS PROGRAM SEMESTER (Semester Ganjil / Genap, Mapel, Kelas/Fase, Alokasi Total JP & JP/Pekan, Model Deep Learning, Guru Pengampu)
2. TABEL MATRIKS PROSEM SINKRON KALPEN & TAHAPAN DEEP LEARNING:
   - Kolom: Konten/Materi | JML JP | Bulan & Rincian Pekan 1 s.d. 5 Berwarna | Keterangan
3. LEGENDA KODE KEGIATAN & AGENDA WARNA SIKLUS DEEP LEARNING:
   - Mindful Discovery (Biru Muda), Eksplorasi Awal (Biru Tua), Meaningful Inquiry & Praktikum (Oranye), Joyful Creation & Gelar Karya (Hijau), Libur Semester (LS)
4. LEMBAR PENGESAHAN DOKUMEN RESMI (Kepala Satuan Pendidikan & Guru Pengampu)`,
    },
  ],
  lkpd: [
    {
      id: 'lkpd_standar_resmi_deep_learning',
      label: 'Format Standar LKPD Deep Learning & Kanvas Siswa (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS KELOMPOK BELAJAR & PROFIL KARAKTER 6C
2. TUJUAN PEMBELAJARAN & PETUNJUK KERJA BERKESADARAN
3. SINTAKS 1: MINDFUL DISCOVERY (Orientasi Fenomena Nyata, Bagan Visual Konsep, Pertanyaan Pemantik HOTS)
4. SINTAKS 2: MEANINGFUL INQUIRY (Aktivitas Penyelidikan Mandiri & Kelompok, Tabel Pengolahan Data Empiris, Scaffolding Berjenjang)
5. SINTAKS 3: JOYFUL CREATION (Kanvas Sketsa Visual Inovasi Siswa, Pameran Karya Dinding Kelas Gallery Walk, Umpan Balik Bintang & Wish)
6. SINTAKS 4: MINDFUL REFLECTION & ASESMEN AUTENTIK (Kartu Refleksi Diri 3-2-1, Rubrik Penilaian Mutu Kinerja)`,
    },
    {
      id: 'lkpd_bertingkat',
      label: 'Format LKPD Bertingkat (Tiered Assignment)',
      notes: `A. TINGKAT DASAR (Scaffolding Konsep Dasar)
B. TINGKAT MENENGAH (Penerapan Kasus Terapan)
C. TINGKAT MAHIR / PENGAYAAN (Inovasi Rekayasa)`,
    },
  ],
  kktp: [
    {
      id: 'kktp_standar_resmi_interval_deep_learning',
      label: 'Format Standar Baku Resmi KKTP Matriks Interval Nilai (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS PERANGKAT KKTP (Satuan Pendidikan, Mata Pelajaran, Fase/Kelas, Semester, Tahun Ajaran, Guru Pengampu, NIP)
2. TABEL KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) 6 KOLOM LENGKAP:
   - Kolom 1: Bab / Lingkup Materi
   - Kolom 2: Tujuan Pembelajaran (TP) terurai per kode (TP.1.1, TP.1.2, dst.)
   - Kolom 3: Interval 0 - 40% (Remedial di Seluruh Bagian)
   - Kolom 4: Interval 41 - 65% (Remedial di Bagian yang Diperlukan)
   - Kolom 5: Interval 66 - 85% (Sudah Mencapai Ketuntasan / Tanpa Remedial)
   - Kolom 6: Interval 86 - 100% (Perlu Pengayaan / Tantangan Lebih)
3. KETERANGAN SKALA INTERVAL KETERCAPAIAN & TINDAK LANJUT ASESMEN
4. PENDEKATAN RUBRIK DESKRIPTIF KETERCAPAIAN DEEP LEARNING (Baru Berkembang, Layak, Cakap [KKTP], Mahir)
5. MATRIKS REKAPITULASI CEKLIS HASIL ASESMEN PESERTA DIDIK
6. PEDOMAN TINDAK LANJUT ASESMEN, REMEDIAL & PENGAYAAN TERPADU
7. LEMBAR PENGESAHAN RESMI (Kepala Sekolah & Guru Mata Pelajaran)`,
    },
    {
      id: 'kktp_semester',
      label: 'Format KKTP Setiap Semester (Standar Baku Resmi BSKAP - Rekomendasi)',
      notes: `1. IDENTITAS PERANGKAT KKTP SEMESTER (Satuan Pendidikan, Mapel, Fase/Kelas, Semester Ganjil/Genap, Tahun Pelajaran, Guru Pengampu, NIP)
2. DIAGRAM PIRAMIDA TANGGA INTERVAL KETUNTASAN & KERANGKA INTERVENSI (Level 1 s.d. Level 4)
3. PENILAIAN SETIAP TP DIURAIKAN PER BAB / LINGKUP MATERI SEMESTER INI (Bab 1, Bab 2, dst.):
   - Tabel Rubrik Deskriptif 4 Kategori Mutu Penilaian Setiap TP (Baru Berkembang, Layak, Cakap [KKTP 75%], Mahir)
   - Tabel Skala Interval Nilai Ketuntasan Setiap TP (0-40%, 41-65%, 66-85%, 86-100%)
4. MATRIKS REKAPITULASI INTERVAL NILAI KETUNTASAN SETIAP TP SELURUH SEMESTER
5. LEMBAR FORMAT REKAPITULASI CEKLIS ASESMEN SISWA SEMESTER
6. PEDOMAN TINDAK LANJUT ASESMEN, REMEDIAL TERARAH PER TP & PENGAYAAN
7. LEMBAR PENGESAHAN DOKUMEN (Kepala Satuan Pendidikan & Guru Pengampu)`,
    },
    {
      id: 'kktp_1_tahun',
      label: 'Format KKTP 1 Tahun Pelajaran Penuh (Semester 1 & 2 Sekaligus)',
      notes: `1. IDENTITAS PERANGKAT KKTP 1 TAHUN PELAJARAN (Satuan Pendidikan, Mapel, Fase/Kelas, Tahun Pelajaran, Total Alokasi JP Tahunan)
2. DIAGRAM PIRAMIDA TANGGA INTERVAL KETUNTASAN KURIKULUM MERDEKA
3. BAGAN I: PENILAIAN SETIAP TP PADA SELURUH BAB SEMESTER 1 (GANJIL) LENGKAP DENGAN RUBRIK & INTERVAL
4. BAGAN II: PENILAIAN SETIAP TP PADA SELURUH BAB SEMESTER 2 (GENAP) LENGKAP DENGAN RUBRIK & INTERVAL
5. MATRIKS REKAPITULASI TAHUNAN INTERVAL NILAI KETUNTASAN TP (SEMESTER 1 & 2)
6. PANDUAN PELAKSANAAN REMEDIAL & PENGAYAAN TAHUNAN
7. LEMBAR PENGESAHAN DOKUMEN KKTP TAHUNAN`,
    },
    {
      id: 'kktp_per_tp_bab',
      label: 'Format KKTP Penilaian Setiap TP per Bab / Lingkup Materi',
      notes: `1. IDENTITAS KKTP LINGKUP MATERI (Mapel, Satuan Pendidikan, Fase/Kelas, Semester, Bab/Lingkup Materi, Alokasi JP)
2. PEMETAAN RUMUSAN TP OPERASIONAL (Komponen ABCD & Taksonomi Bloom HOTS) & IKTP DALAM BAB
3. PENDEKATAN 1: RUBRIK DESKRIPTIF 4 LEVEL KETERCAPAIAN SETIAP TP (Baru Berkembang, Layak, Cakap [KKTP 75%], Mahir)
4. PENDEKATAN 2: SKALA MATRIKS INTERVAL NILAI KETUNTASAN SETIAP TP (0-40%, 41-65%, 66-85%, 86-100%)
5. PENDEKATAN 3: LEMBAR INSTRUMEN CEKLIS ASESMEN SETIAP TP PER PESERTA DIDIK
6. PANDUAN DIFERENSIASI, REMEDIAL & PENGAYAAN TERARAH SPESIFIK SETIAP TP
7. PENGESAHAN DOKUMEN KKTP (Guru Pengampu & Kepala Sekolah)`,
    },
    {
      id: 'kktp_rubrik',
      label: 'Format KKTP Rubrik Deskripsi 4 Kategori Ketercapaian TP',
      notes: `1. IDENTITAS KKTP (Mapel, Kelas, Fase, Semester, TP Pokok)
2. TABEL RUBRIK KRITERIA KETUNTASAN PER INDIKATOR TP:
   - Aspek / Indikator Penilaian
   - Kategori 1: Perlu Bimbingan (0 - 59%)
   - Kategori 2: Cukup / Layak (60 - 74%)
   - Kategori 3: Baik / Cakap (75 - 89%) [Standar Minimal]
   - Kategori 4: Sangat Baik / Mahir (90 - 100%)
3. TINDAK LANJUT HASIL KKTP SPESIFIK TP`,
    },
  ],
  modul_ajar: [
    {
      id: 'rpm_standar_baku_mutlak_deep_learning',
      label: 'Format Standar Baku Mutlak RPM Deep Learning (Format Resmi Terpadu)',
      notes: `A. IDENTITAS MODUL (Tabel 2 Kolom: Satuan Pendidikan, Penyusun / Guru Pengampu, NIP Guru, Tahun Ajaran, Jenjang / Fase / Kelas, Semester, Mata Pelajaran, Materi Pokok, Sub Materi Tiap Pertemuan [TP.X.Y], Alokasi Waktu Total dalam Menit & JP, Model Pembelajaran Deep Learning 6 Fase Sintaks, Pendekatan & Metode, Target Peserta Didik)

B. KOMPETENSI YANG DICAPAI:
   - Capaian Pembelajaran (CP) Elemen & Rasional (📌)
   - Tujuan Pembelajaran (TP) Operasional (HOTS Berbasis Kaidah ABCD dengan Kode [TP.X.Y])
   - Pemahaman Bermakna (Meaningful Learning)
   - Pertanyaan Pemantik (Sparking Questions HOTS)

III. SKEMA SIKLUS 6 FASE PEDAGOGIS DEEP LEARNING (Diagram Alur Mindful, Meaningful, Joyful Learning)

C. SINTAKS (DESAIN PEMBELAJARAN DEEP LEARNING):
   Tabel 4 Kolom: FASE SINTAKS | NAMA TAHAPAN | PILAR PEDAGOGIS | TUJUAN DAN FOKUS AKTIVITAS KELAS (Fase 1 s.d. Fase 6)

D. LANGKAH-LANGKAH PEMBELAJARAN (TABEL SKENARIO KBM LENGKAP TIAP PERTEMUAN):
   - Header: Pertemuan Ke [X] ([Total Menit] Menit), Materi / Sub Pokok Bahasan [TP.X.Y], Tujuan Pembelajaran (TP) [TP.X.Y]
   - Tabel Skenario 6 Kolom: TAHAP KEGIATAN | FASE SINTAKS DEEP LEARNING | ALOKASI WAKTU | KEGIATAN GURU (DARI SALAM AWAL MASUK KELAS) | KEGIATAN PESERTA DIDIK (AKTIF & RESPONSIF) | ASPEK 3 PILAR & 6C
   - Tahap A: KEGIATAN PENDAHULUAN (FASE 1: Orientasi, Apersepsi & Motivasi / Review Materi - Salam, Doa Bersama, Presensi & Mindful Breathing Teknik STOP 2 Menit, Apersepsi Kontekstual Fenomena Nyata, Pertanyaan Pemantik HOTS, Skenario KBM 6 Fase, Pembentukan Kelompok Heterogen)
   - Tahap B: KEGIATAN INTI:
     * FASE 2: Eksplorasi Konsep & Penyelidikan Inkuiri (Distribusi LKPD & Media Peraga, Pembagian Peran Kerja Tim, Fasilitasi Eksplorasi Objek Nyata, Bimbingan Berjenjang Scaffolding)
     * FASE 3: Penjelasan, Elaborasi & Penguatan Ilmiah (Presentasi Pleno / Jigsaw Kelompok, Moderasi Diskusi Kelas Santun, Elaborasi Konsep di Papan Tulis, Notasi Ilmiah Baku & Pelurusan Miskonsepsi)
     * FASE 4: Aplikasi & Pemecahan Masalah Kontekstual (Studi Kasus Tantangan Terapan HOTS, Kolaborasi Think-Pair-Share, Umpan Balik Formatif Langsung)
   - Tahap C: KEGIATAN PENUTUP:
     * FASE 5: Refleksi Mendalam & Metakognisi (Pola 3-2-1 / What So What Now What, Apresiasi Karakter)
     * FASE 6: Simpulan Bersama, Tindak Lanjut & Doa Penutup (Simpulan Terpadu, Tugas Pengayaan / Proyek Mini Kreatif, Rencana KBM Berikutnya, Doa Khusyuk Bersyukur, & Salam Hangat)

E. ASESMEN PEMBELAJARAN:
   - Tabel Asesmen 4 Kolom: Jenis Asesmen (Diagnostik Awal, Formatif Proses LKPD & Diskusi, Sumatif Akhir HOTS) | Bentuk & Instrumen | Waktu Pelaksanaan | Aspek & Indikator
   - Panduan Rubrik Ketercapaian Tujuan Pembelajaran (KKTP) 5 Kolom: Kriteria Capaian | Perlu Bimbingan (0 - 64%) | Cukup (65 - 74%) | Baik (75 - 87%) | Sangat Baik (88 - 100%)

E. MEDIA, ALAT, DAN SUMBER BELAJAR:
   - Media Pembelajaran Interaktif
   - Alat dan Bahan Praktik Konkret
   - Sumber Belajar Resmi

VIII. MATRIKS PEMBELAJARAN BERDIFERENSIASI:
   - Skema Matriks Alur (Konten, Proses, Produk)
   - Tabel Diferensiasi 4 Kolom: Kategori Peserta Didik (Reguler, Kesulitan Belajar / Scaffolding, Berpencapaian Cepat / Mahir) | Diferensiasi Konten | Diferensiasi Proses | Diferensiasi Produk

H. REFLEKSI GURU:
   - Tabel 2 Kolom: Aspek Refleksi (1. Ketercapaian TP, 2. Efektivitas Sintaks, 3. Partisipasi Siswa, 4. Kendala & Miskonsepsi, 5. Rencana Perbaikan) | Catatan Evaluatif Guru

X. PENGESAHAN DOKUMEN:
   - Kolom Tanda Tangan Resmi: Kepala Satuan Pendidikan dan Guru Mata Pelajaran lengkap dengan NIP`,
    },
  ],
  rpm: [
    {
      id: 'rpm_standar_baku_mutlak_deep_learning',
      label: 'Format Standar Baku Mutlak RPM Deep Learning (Format Resmi Terpadu)',
      notes: `A. IDENTITAS MODUL (Tabel 2 Kolom: Satuan Pendidikan, Penyusun / Guru Pengampu, NIP Guru, Tahun Ajaran, Jenjang / Fase / Kelas, Semester, Mata Pelajaran, Materi Pokok, Sub Materi Tiap Pertemuan [TP.X.Y], Alokasi Waktu Total dalam Menit & JP, Model Pembelajaran Deep Learning 6 Fase Sintaks, Pendekatan & Metode, Target Peserta Didik)

B. KOMPETENSI YANG DICAPAI:
   - Capaian Pembelajaran (CP) Elemen & Rasional (📌)
   - Tujuan Pembelajaran (TP) Operasional (HOTS Berbasis Kaidah ABCD dengan Kode [TP.X.Y])
   - Pemahaman Bermakna (Meaningful Learning)
   - Pertanyaan Pemantik (Sparking Questions HOTS)

III. SKEMA SIKLUS 6 FASE PEDAGOGIS DEEP LEARNING (Diagram Alur Mindful, Meaningful, Joyful Learning)

C. SINTAKS (DESAIN PEMBELAJARAN DEEP LEARNING):
   Tabel 4 Kolom: FASE SINTAKS | NAMA TAHAPAN | PILAR PEDAGOGIS | TUJUAN DAN FOKUS AKTIVITAS KELAS (Fase 1 s.d. Fase 6)

D. LANGKAH-LANGKAH PEMBELAJARAN (TABEL SKENARIO KBM LENGKAP TIAP PERTEMUAN):
   - Header: Pertemuan Ke [X] ([Total Menit] Menit), Materi / Sub Pokok Bahasan [TP.X.Y], Tujuan Pembelajaran (TP) [TP.X.Y]
   - Tabel Skenario 6 Kolom: TAHAP KEGIATAN | FASE SINTAKS DEEP LEARNING | ALOKASI WAKTU | KEGIATAN GURU (DARI SALAM AWAL MASUK KELAS) | KEGIATAN PESERTA DIDIK (AKTIF & RESPONSIF) | ASPEK 3 PILAR & 6C
   - Tahap A: KEGIATAN PENDAHULUAN (FASE 1: Orientasi, Apersepsi & Motivasi / Review Materi - Salam, Doa Bersama, Presensi & Mindful Breathing Teknik STOP 2 Menit, Apersepsi Kontekstual Fenomena Nyata, Pertanyaan Pemantik HOTS, Skenario KBM 6 Fase, Pembentukan Kelompok Heterogen)
   - Tahap B: KEGIATAN INTI:
     * FASE 2: Eksplorasi Konsep & Penyelidikan Inkuiri (Distribusi LKPD & Media Peraga, Pembagian Peran Kerja Tim, Fasilitasi Eksplorasi Objek Nyata, Bimbingan Berjenjang Scaffolding)
     * FASE 3: Penjelasan, Elaborasi & Penguatan Ilmiah (Presentasi Pleno / Jigsaw Kelompok, Moderasi Diskusi Kelas Santun, Elaborasi Konsep di Papan Tulis, Notasi Ilmiah Baku & Pelurusan Miskonsepsi)
     * FASE 4: Aplikasi & Pemecahan Masalah Kontekstual (Studi Kasus Tantangan Terapan HOTS, Kolaborasi Think-Pair-Share, Umpan Balik Formatif Langsung)
   - Tahap C: KEGIATAN PENUTUP:
     * FASE 5: Refleksi Mendalam & Metakognisi (Pola 3-2-1 / What So What Now What, Apresiasi Karakter)
     * FASE 6: Simpulan Bersama, Tindak Lanjut & Doa Penutup (Simpulan Terpadu, Tugas Pengayaan / Proyek Mini Kreatif, Rencana KBM Berikutnya, Doa Khusyuk Bersyukur, & Salam Hangat)

E. ASESMEN PEMBELAJARAN:
   - Tabel Asesmen 4 Kolom: Jenis Asesmen (Diagnostik Awal, Formatif Proses LKPD & Diskusi, Sumatif Akhir HOTS) | Bentuk & Instrumen | Waktu Pelaksanaan | Aspek & Indikator
   - Panduan Rubrik Ketercapaian Tujuan Pembelajaran (KKTP) 5 Kolom: Kriteria Capaian | Perlu Bimbingan (0 - 64%) | Cukup (65 - 74%) | Baik (75 - 87%) | Sangat Baik (88 - 100%)

E. MEDIA, ALAT, DAN SUMBER BELAJAR:
   - Media Pembelajaran Interaktif
   - Alat dan Bahan Praktik Konkret
   - Sumber Belajar Resmi

VIII. MATRIKS PEMBELAJARAN BERDIFERENSIASI:
   - Skema Matriks Alur (Konten, Proses, Produk)
   - Tabel Diferensiasi 4 Kolom: Kategori Peserta Didik (Reguler, Kesulitan Belajar / Scaffolding, Berpencapaian Cepat / Mahir) | Diferensiasi Konten | Diferensiasi Proses | Diferensiasi Produk

H. REFLEKSI GURU:
   - Tabel 2 Kolom: Aspek Refleksi (1. Ketercapaian TP, 2. Efektivitas Sintaks, 3. Partisipasi Siswa, 4. Kendala & Miskonsepsi, 5. Rencana Perbaikan) | Catatan Evaluatif Guru

X. PENGESAHAN DOKUMEN:
   - Kolom Tanda Tangan Resmi: Kepala Satuan Pendidikan dan Guru Mata Pelajaran lengkap dengan NIP`,
    },
  ],
  rubrik_penilaian: [
    {
      id: 'rubrik_standar_deep_learning_6c',
      label: 'Format Standar Rubrik Penilaian 3 Pilar & 6C (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS ASESMEN & BAGAN SISTEM PENILAIAN TERINTEGRASI (MINDFUL, MEANINGFUL, JOYFUL)
2. RUBRIK ASESMEN DIAGNOSTIK AWAL (Gaya Belajar & Kesiapan Kognitif Prasyarat)
3. RUBRIK ASESMEN FORMATIF SIKAP & KARAKTER DIMENSI 6C (Skala 1 - 4)
4. RUBRIK PENILAIAN KINERJA PROSES & LKPD BERJENJANG
5. RUBRIK ASESMEN SUMATIF LINGKUP MATERI (KISI-KISI PG & URAIAN HOTS SERTA RUBRIK KARYA)
6. FORMULA PENGOLAHAN NILAI AKHIR & INTERVENSI KKTP
7. LEMBAR PENGESAHAN INSTRUMEN ASESMEN RESMI`,
    },
    {
      id: 'rubrik_deskriptif_skala',
      label: 'Format Rubrik Deskriptif Skala Kontinum',
      notes: `A. RUBRIK SIKAP PROFIL PELAJAR PANCASILA
B. RUBRIK DISKUSI & KERJASAMA KELOMPOK
C. RUBRIK PRESENTASI & KOMUNIKASI
D. RUBRIK PRODUK / HASIL KARYA`,
    },
  ],
  asesmen: [
    {
      id: 'asesmen_standar_deep_learning_3_pilar',
      label: 'Format Asesmen Komprehensif Deep Learning 3 Pilar & 6C (Kemendikbudristek & Deep Learning - Utama)',
      notes: `1. IDENTITAS ASESMEN & BAGAN SISTEM PENILAIAN TERINTEGRASI (MINDFUL, MEANINGFUL, JOYFUL)
2. BAGIAN 1: ASESMEN DIAGNOSTIK (Kesiapan Kognitif & Non-Kognitif)
3. BAGIAN 2: ASESMEN FORMATIF (Observasi Karakter 6C & Kinerja LKPD)
4. BAGIAN 3: ASESMEN SUMATIF (Kisi-Kisi HOTS, Soal PG & Uraian, Kunci Jawaban & Rubrik)
5. BAGIAN 4: REFLEKSI GURU & SISWA SERTA LEMBAR PENGESAHAN RESMI`,
    },
    {
      id: 'asesmen_3_jenis',
      label: 'Format Asesmen Komprehensif (Diagnostik, Formatif, Sumatif)',
      notes: `BAGIAN 1: ASESMEN DIAGNOSTIK
BAGIAN 2: ASESMEN FORMATIF
BAGIAN 3: ASESMEN SUMATIF (Kisi-Kisi, Soal HOTS, Kunci Jawaban & Rubrik)
BAGIAN 4: REFLEKSI GURU & SISWA`,
    },
  ],
};

export const TEMPLATE_PRESETS = [
  {
    id: 'perangkat_umum',
    label: 'Format Perangkat Pembelajaran Standar',
    notes: `1. IDENTITAS PERANGKAT
2. CAPAIAN & TUJUAN PEMBELAJARAN
3. LANGKAH-LANGKAH KEGIATAN PEMBELAJARAN
4. ASESMEN & REFLEKSI PEMBELAJARAN`,
  },
];

export const CustomFormatSelector: React.FC<CustomFormatSelectorProps> = ({
  value,
  onChange,
  docTypeName = 'Perangkat Ajar',
  docTypeId,
  compact = false,
}) => {
  const isRPM = docTypeId === 'modul_ajar' || docTypeId === 'rpm';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Template Manager States
  const [savedTemplates, setSavedTemplates] = useState<SavedCustomTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'presets' | 'saved'>('presets');
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCategory, setTemplateCategory] = useState<string>(isRPM ? 'rpm' : (docTypeId || 'tp'));
  const [searchSaved, setSearchSaved] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getSavedTemplates();
    setSavedTemplates(loaded);
  }, []);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3000);
  };

  const activePresets = docTypeId && DOCUMENT_PRESETS[docTypeId]
    ? DOCUMENT_PRESETS[docTypeId]
    : (isRPM && DOCUMENT_PRESETS['rpm'] ? DOCUMENT_PRESETS['rpm'] : TEMPLATE_PRESETS);

  const handleToggle = () => {
    const nextState = !value.useCustomFormat;
    const defaultNotes = activePresets.length > 0 ? activePresets[0].notes : TEMPLATE_PRESETS[0].notes;
    onChange({
      ...value,
      useCustomFormat: nextState,
      customFormatNotes:
        nextState && !value.customFormatNotes
          ? defaultNotes
          : value.customFormatNotes,
    });
  };

  const processFile = async (file: File) => {
    setIsReadingFile(true);
    try {
      const parsed = await UniversalFileParser.parseFile(file);
      const newFile: CustomFormatFile = {
        name: parsed.fileName,
        size: parsed.fileSize,
        type: parsed.category,
        mimeType: parsed.mimeType,
        base64: parsed.base64,
        extractedText: parsed.extractedText,
        tableMarkdown: parsed.tableMarkdown,
        sheetNames: parsed.sheetNames,
        summaryText: parsed.summaryText,
        previewUrl: parsed.previewUrl,
      };

      onChange({
        ...value,
        useCustomFormat: true,
        formatFile: newFile,
        customFormatNotes:
          value.customFormatNotes ||
          parsed.summaryText ||
          `Format Acuan Dokumen: Mengikuti struktur bab, tata letak, dan komponen yang ada pada file lampiran "${parsed.fileName}".`,
      });
      showNotification(`File format "${parsed.fileName}" berhasil diunggah dan dibaca!`);
    } catch (err) {
      console.error('Failed to read format file:', err);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    onChange({
      ...value,
      formatFile: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyPreset = (presetNotes: string, presetLabel?: string) => {
    onChange({
      ...value,
      useCustomFormat: true,
      customFormatNotes: presetNotes,
    });
    showNotification(`Sistematika "${presetLabel || 'Pilihan'}" berhasil diterapkan!`);
  };

  const handleResetToStandardFormat = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange({
      useCustomFormat: false,
      formatFile: null,
      customFormatNotes: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showNotification(
      isRPM
        ? 'Format RPM berhasil di-reset ke format baku standar Kemendikbud & Deep Learning!'
        : `Format acuan ${docTypeName || 'dokumen'} telah di-reset ke format standar sistem.`
    );
  };

  const handleRestoreDefaultTemplates = () => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_TEMPLATES, JSON.stringify(INITIAL_BUILTIN_TEMPLATES));
      setSavedTemplates(INITIAL_BUILTIN_TEMPLATES);
      showNotification('Koleksi templat bawaan RPM & Perangkat Ajar berhasil dipulihkan!');
    } catch (e) {
      console.error('Failed to restore default templates:', e);
    }
  };

  // Custom Template Operations
  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const notesToSave = value.customFormatNotes.trim() || (activePresets[0] ? activePresets[0].notes : '');
    const newTpl: SavedCustomTemplate = {
      id: `custom_tpl_${Date.now()}`,
      name: templateName.trim(),
      description: templateDesc.trim() || 'Templat khusus guru untuk penyusunan modul',
      category: templateCategory,
      notes: notesToSave,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      isBuiltIn: false,
    };

    const updated = [newTpl, ...savedTemplates];
    setSavedTemplates(updated);
    saveTemplatesToStorage(updated);
    setIsCreating(false);
    setTemplateName('');
    setTemplateDesc('');
    setActiveTab('saved');
    showNotification(`Templat "${newTpl.name}" berhasil disimpan ke koleksi guru!`);
  };

  const handleApplySavedTemplate = (tpl: SavedCustomTemplate) => {
    onChange({
      ...value,
      useCustomFormat: true,
      customFormatNotes: tpl.notes,
    });
    showNotification(`Templat "${tpl.name}" berhasil diterapkan ke form aktif!`);
  };

  const handleDeleteSavedTemplate = (id: string, name: string) => {
    if (!confirm(`Hapus templat "${name}" dari daftar simpanan?`)) return;
    const updated = savedTemplates.filter((t) => t.id !== id);
    setSavedTemplates(updated);
    saveTemplatesToStorage(updated);
    showNotification(`Templat "${name}" telah dihapus.`);
  };

  const handleCopyNotes = (notes: string, name: string) => {
    navigator.clipboard.writeText(notes);
    showNotification(`Struktur templat "${name}" berhasil disalin ke clipboard!`);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((item) => item.name && item.notes);
          if (valid.length === 0) {
            alert('File JSON tidak memuat templat valid.');
            return;
          }
          // Merge by id
          const existingIds = new Set(savedTemplates.map((t) => t.id));
          const toAdd = valid.filter((v) => !existingIds.has(v.id));
          const updated = [...toAdd, ...savedTemplates];
          setSavedTemplates(updated);
          saveTemplatesToStorage(updated);
          setActiveTab('saved');
          showNotification(`${toAdd.length} templat baru berhasil diimpor!`);
        } else {
          alert('Format data JSON tidak cocok.');
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('Gagal membaca file JSON templat.');
      }
    };
    reader.readAsText(file);
    if (jsonImportRef.current) jsonImportRef.current.value = '';
  };

  const filteredSavedTemplates = savedTemplates.filter((t) => {
    if (!searchSaved.trim()) return true;
    const q = searchSaved.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      t.notes.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={`rounded-xl border transition ${
        value.useCustomFormat
          ? 'bg-blue-50/40 border-blue-200'
          : 'bg-slate-50 border-slate-200 text-slate-600'
      } p-3.5 space-y-3.5`}
    >
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between shadow-md transition animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            className="text-white/80 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}



      {/* Checkbox Header */}
      <div className="flex items-start justify-between gap-3">
        <label
          htmlFor="checkbox-custom-format"
          onClick={handleToggle}
          className="flex items-start space-x-2.5 cursor-pointer select-none group flex-1"
        >
          <div className="mt-0.5 shrink-0">
            {value.useCustomFormat ? (
              <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
              <span>{isRPM ? 'Gunakan Format Sekolah Sendiri sebagai Acuan RPM' : `Gunakan Format / Templat ${docTypeName} Khusus`}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                {isRPM ? 'Word / PDF / Scan / Format Resmi Sekolah' : 'Word / PDF / Teks / Koleksi Guru'}
              </span>
              {savedTemplates.length > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <BookmarkCheck className="w-3 h-3" />
                  {savedTemplates.length} Tersimpan
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {isRPM
                ? 'Unggah dokumen format resmi sekolah Anda (.docx, .pdf, scan foto) atau tuliskan sistematika sekolah agar sistem menyusun RPM sesuai acuan sekolah Anda.'
                : `Pilih templat ${docTypeName} acuan sekolah, gunakan templat tersimpan milik guru, atau unggah file format (.docx/.pdf).`}
            </p>
          </div>
        </label>

        {(value.useCustomFormat || value.formatFile || (value.customFormatNotes && value.customFormatNotes.trim().length > 0)) && (
          <button
            type="button"
            onClick={handleResetToStandardFormat}
            className="shrink-0 px-2 py-1 rounded-md bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 text-[11px] font-semibold transition flex items-center gap-1 shadow-xs"
            title={isRPM ? 'Reset ke Format Standar Baku RPM' : 'Kembalikan ke format standar sistem'}
          >
            <RotateCcw className="w-3 h-3 text-rose-600" />
            <span>{isRPM ? 'Reset Format RPM' : 'Reset Standar'}</span>
          </button>
        )}
      </div>

      {/* Expanded Controls when Checked */}
      {value.useCustomFormat && (
        <div className="space-y-3.5 pt-2 border-t border-slate-200">
          {/* File Upload Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center space-x-1.5">
                <FileUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload File Dokumen Format (Word / PDF / Gambar):</span>
              </label>
              {value.formatFile && (
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  File terlampir sebagai acuan
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              id="input-format-file"
              accept=".pdf,.docx,.doc,.dotx,.xlsx,.xls,.csv,.tsv,.ods,.pptx,.ppt,.txt,.md,.rtf,.html,.xml,.json,.jpg,.jpeg,.png,.webp,.bmp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!value.formatFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3.5 rounded-lg border border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                  {isReadingFile ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    Klik untuk memilih file format resmi sekolah atau Tarik (Drag & Drop) ke sini
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Word (.docx / .doc), PDF (.pdf), Excel (.xlsx), atau Foto/Scan dokumen format
                  </div>
                </div>
              </div>
            ) : (
              /* Attached File Card */
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1.5">
                      <span className="truncate">{value.formatFile.name}</span>
                      <span className="text-[10px] text-slate-500">
                        ({(value.formatFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shrink-0">
                        Acuan Aktif
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {(value.formatFile.previewUrl || value.formatFile.extractedText || value.formatFile.tableMarkdown) && (
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      title="Lihat Pratinjau Dokumen Format"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 rounded text-rose-600 hover:bg-rose-50"
                    title="Hapus File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TEMPLATE MANAGER TABS & SAVING CONTROLS */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Tab Selector */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                {activePresets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition flex items-center space-x-1.5 ${
                      activeTab === 'presets'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Sistematika Bawaan</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition flex items-center space-x-1.5 ${
                    activeTab === 'saved'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className="w-3 h-3 text-emerald-600" />
                  <span>{isRPM ? 'Format Sekolah Tersimpan' : 'Templat Saya'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                    {savedTemplates.length}
                  </span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setIsCreating((prev) => !prev)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 transition shadow-xs"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{isRPM ? 'Simpan Format Sekolah Ini' : 'Simpan Format Ini sebagai Templat Baru'}</span>
                </button>
              </div>
            </div>

            {/* INLINE CREATE TEMPLATE FORM */}
            {isCreating && (
              <form
                onSubmit={handleSaveCurrentAsTemplate}
                className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 space-y-2.5 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                    <Save className="w-3.5 h-3.5 text-blue-700" />
                    <span>{isRPM ? 'Simpan Format Resmi Sekolah ke Koleksi Guru' : 'Simpan Format Saat Ini ke Koleksi Templat Guru'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      {isRPM ? 'Nama Format Sekolah:' : 'Nama Templat RPM / Modul:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder={isRPM ? 'Contoh: Format RPM SMAN 1 (KOSP)' : 'Contoh: RPM Fisika Fase E SMAN 30'}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Kategori / Lingkup:
                    </label>
                    <select
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="rpm">RPM (Rencana Pelaksanaan Modul)</option>
                      <option value="modul_ajar">Modul Ajar</option>
                      <option value="tp">Tujuan Pembelajaran (TP)</option>
                      <option value="atp">Alur Tujuan Pembelajaran (ATP)</option>
                      <option value="lkpd">Lembar Kerja Peserta Didik (LKPD)</option>
                      <option value="asesmen">Asesmen Pembelajaran</option>
                      <option value="umum">Format Umum / Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    Keterangan Singkat (Opsional):
                  </label>
                  <input
                    type="text"
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    placeholder={isRPM ? 'Contoh: Format KOSP resmi sekolah dengan tabel KBM 4 kolom' : 'Contoh: Sesuai acuan MGMP 2 pertemuan @ 2 JP dengan tabel 6 kolom'}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-xs flex items-center space-x-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Simpan Format</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 1: PRESETS BAWAAN */}
            {activeTab === 'presets' && activePresets.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-700">
                  Pilihan Sistematika Standar untuk {docTypeName}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activePresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.notes, preset.label)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition text-left flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: TEMPLAT TERSIMPAN SAYA */}
            {activeTab === 'saved' && (
              <div className="space-y-2.5">
                {/* Search and Backup/Restore bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={searchSaved}
                      onChange={(e) => setSearchSaved(e.target.value)}
                      placeholder="Cari templat tersimpan..."
                      className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <input
                      ref={jsonImportRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleRestoreDefaultTemplates}
                      className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 flex items-center space-x-1"
                      title="Pulihkan templat bawaan resmi ke pengaturan awal pabrik"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Pulihkan Bawaan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => jsonImportRef.current?.click()}
                      className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 flex items-center space-x-1"
                      title="Impor templat dari file JSON"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Impor JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportTemplatesAsJSON(savedTemplates)}
                      className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 flex items-center space-x-1"
                      title="Ekspor dan cadangkan koleksi templat guru ke file JSON"
                    >
                      <Download className="w-3 h-3" />
                      <span>Ekspor Cadangan</span>
                    </button>
                  </div>
                </div>

                {/* Templates List */}
                {filteredSavedTemplates.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-1">
                    <FolderHeart className="w-6 h-6 mx-auto text-slate-400" />
                    <div className="font-semibold">Belum ada templat yang cocok</div>
                    <p className="text-[10px] text-slate-400">
                      Klik tombol "+ Simpan Format Ini sebagai Templat Baru" di atas untuk menyimpan format dokumen favorit Anda.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {filteredSavedTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 transition flex flex-col justify-between space-y-2 shadow-xs group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition">
                              {tpl.name}
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                tpl.isBuiltIn
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {tpl.isBuiltIn ? 'Resmi' : 'Kustom Guru'}
                            </span>
                          </div>
                          {tpl.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                              {tpl.description}
                            </p>
                          )}
                          <div className="text-[9px] text-slate-400 mt-1 font-mono">
                            Disimpan: {tpl.createdAt}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => handleApplySavedTemplate(tpl)}
                            className="px-2 py-0.8 rounded text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1 transition shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Gunakan Templat Ini</span>
                          </button>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleCopyNotes(tpl.notes, tpl.name)}
                              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                              title="Salin isi format ke clipboard"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {!tpl.isBuiltIn && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSavedTemplate(tpl.id, tpl.name)}
                                className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                title="Hapus templat ini"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Format Structure Textarea Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700">
                {isRPM ? 'Catatan Khusus Sistematika / Komponen Format Sekolah (Opsional):' : 'Isi / Struktur Format Acuan yang Aktif Digunakan:'}
              </label>
              {value.customFormatNotes && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(value.customFormatNotes);
                    showNotification('Isi format aktif berhasil disalin!');
                  }}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Salin Teks Format</span>
                </button>
              )}
            </div>
            <textarea
              rows={compact ? 4 : 6}
              value={value.customFormatNotes}
              onChange={(e) =>
                onChange({
                  ...value,
                  customFormatNotes: e.target.value,
                })
              }
              placeholder={
                isRPM
                  ? 'Tuliskan urutan bab, nama tabel, atau sistematika format dari sekolah Anda. Sistem akan menggunakannya sebagai acuan utama penyusunan RPM...'
                  : 'Tuliskan urutan bab, judul komponen, tabel, atau petunjuk format sekolah...'
              }
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs font-mono leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Document & Image Preview Modal */}
      {showPreviewModal && value.formatFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full p-4 space-y-3 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Berkas Acuan: {value.formatFile.name}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
              >
                ✕ Tutup
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
              {value.formatFile.previewUrl && value.formatFile.type === 'image' ? (
                <div className="flex justify-center">
                  <img
                    src={value.formatFile.previewUrl}
                    alt="Pratinjau Dokumen Format"
                    className="max-h-[60vh] object-contain rounded border border-slate-200"
                  />
                </div>
              ) : value.formatFile.tableMarkdown || value.formatFile.extractedText ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200 flex items-center justify-between">
                    <span>Intisari Teks Ekstraksi Dokumen ({String(value.formatFile.type).toUpperCase()})</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(value.formatFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed max-h-[55vh] overflow-auto">
                    {value.formatFile.tableMarkdown || value.formatFile.extractedText}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Berkas format &quot;{value.formatFile.name}&quot; terlampir dan siap dijadikan acuan penyusunan oleh sistem.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
