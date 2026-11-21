import { SchoolLevel } from '../../types';
import { SubjectPreset } from './smaPresets';
import { resolvePhaseByLevelAndGrade } from '../curriculumLevels';

/**
 * Knowledge Base for Grade-by-Grade Distinct Topics across All Pedagogical Domains.
 * Ensures that Grade 1 to Grade 13 never share identical or recycled chapter titles.
 */
interface GradeTopicDefinition {
  sem1: Array<{
    title: string;
    element: string;
    competency: string;
    hours: number;
    assessment: string;
    deepLearning: string;
  }>;
  sem2: Array<{
    title: string;
    element: string;
    competency: string;
    hours: number;
    assessment: string;
    deepLearning: string;
  }>;
}

type SubjectDomain =
  | 'language_foreign'
  | 'language_regional'
  | 'vocational_engineering'
  | 'vocational_business'
  | 'vocational_creative'
  | 'vocational_hospitality'
  | 'science_advanced'
  | 'math_advanced'
  | 'social_humanities'
  | 'arts_music'
  | 'arts_dance'
  | 'arts_theatre'
  | 'sports_health'
  | 'religious_studies'
  | 'general_academic';

function detectDomain(subLower: string): SubjectDomain {
  if (
    subLower.includes('jerman') ||
    subLower.includes('deutsch') ||
    subLower.includes('jepang') ||
    subLower.includes('mandarin') ||
    subLower.includes('prancis') ||
    subLower.includes('perancis') ||
    subLower.includes('arab') ||
    subLower.includes('korea')
  ) {
    return 'language_foreign';
  }
  if (subLower.includes('jawa') || subLower.includes('sunda') || subLower.includes('bali') || subLower.includes('daerah')) {
    return 'language_regional';
  }
  if (
    subLower.includes('mesin') ||
    subLower.includes('otomotif') ||
    subLower.includes('listrik') ||
    subLower.includes('elektronika') ||
    subLower.includes('konstruksi') ||
    subLower.includes('alat berat') ||
    subLower.includes('sepeda motor') ||
    subLower.includes('kendaraan')
  ) {
    return 'vocational_engineering';
  }
  if (
    subLower.includes('akuntansi') ||
    subLower.includes('keuangan') ||
    subLower.includes('bisnis') ||
    subLower.includes('pemasaran') ||
    subLower.includes('manajemen perkantoran') ||
    subLower.includes('logistik')
  ) {
    return 'vocational_business';
  }
  if (
    subLower.includes('dkv') ||
    subLower.includes('desain komunikasi') ||
    subLower.includes('animasi') ||
    subLower.includes('broadcasting') ||
    subLower.includes('perfilman') ||
    subLower.includes('game')
  ) {
    return 'vocational_creative';
  }
  if (
    subLower.includes('tata boga') ||
    subLower.includes('kuliner') ||
    subLower.includes('perhotelan') ||
    subLower.includes('tata busana') ||
    subLower.includes('kecantikan') ||
    subLower.includes('pariwisata')
  ) {
    return 'vocational_hospitality';
  }
  if (subLower.includes('musik') || subLower.includes('gitar') || subLower.includes('vokal') || subLower.includes('angklung')) {
    return 'arts_music';
  }
  if (subLower.includes('tari')) {
    return 'arts_dance';
  }
  if (subLower.includes('teater') || subLower.includes('drama')) {
    return 'arts_theatre';
  }
  if (subLower.includes('olahraga') || subLower.includes('penjas') || subLower.includes('kebugaran') || subLower.includes('futsal')) {
    return 'sports_health';
  }
  if (subLower.includes('agama') || subLower.includes('islam') || subLower.includes('kristen') || subLower.includes('katolik') || subLower.includes('hindu') || subLower.includes('buddha')) {
    return 'religious_studies';
  }
  if (subLower.includes('antropologi') || subLower.includes('arkeologi') || subLower.includes('filsafat') || subLower.includes('hukum')) {
    return 'social_humanities';
  }
  if (subLower.includes('matematika') || subLower.includes('statistika') || subLower.includes('kalkulus') || subLower.includes('aljabar')) {
    return 'math_advanced';
  }
  if (subLower.includes('fisika') || subLower.includes('kimia') || subLower.includes('biologi') || subLower.includes('astronomi')) {
    return 'science_advanced';
  }
  return 'general_academic';
}

/**
 * Generates distinct, grade-appropriate chapters for any subject and any grade (1 to 13).
 */
export function generateDynamicGradePreset(
  subject: string,
  level: SchoolLevel,
  grade: number,
  customPhase?: string
): SubjectPreset {
  const numGrade = Number(grade) || (level === 'SD' ? 4 : level === 'SMP' ? 7 : 10);
  const phase = customPhase || resolvePhaseByLevelAndGrade(level, numGrade);
  const cleanSubject = subject.trim() || 'Mata Pelajaran';
  const subLower = cleanSubject.toLowerCase();
  const domain = detectDomain(subLower);

  const totalHours =
    level === 'SD'
      ? 144
      : level === 'SMK' && numGrade >= 11
      ? 288
      : level === 'SMA' && numGrade >= 11
      ? 180
      : 108;
  const jpPerWeek =
    level === 'SD'
      ? 4
      : level === 'SMK' && numGrade >= 11
      ? 8
      : level === 'SMA' && numGrade >= 11
      ? 5
      : 3;

  // Dedicated generator based on Grade Level
  const topics = getDistinctTopicsByGradeAndDomain(cleanSubject, numGrade, phase, domain);

  return {
    subject: cleanSubject,
    level,
    grade: numGrade,
    phase,
    totalHoursPerYear: totalHours,
    jpPerWeek,
    cpSummary: `Peserta didik mampu menguasai capaian pembelajaran esensial ${cleanSubject} untuk Tingkat Kelas ${numGrade} (${phase}) sesuai Keputusan Kepala BSKAP No. 046/H/KR/2025 dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful Learning).`,
    elements: [
      {
        name: `Pemahaman ${cleanSubject} (Kelas ${numGrade})`,
        description: `Penguasaan konsep inti, teori dasar, dan karakteristik analitis ${cleanSubject} untuk Kelas ${numGrade} (${phase}).`,
        competencies: ['Menganalisis prinsip inti', 'Mengevaluasi konsep esensial', 'Menghubungkan konsep kontekstual'],
        essentialMaterials: topics.sem1.map((t) => t.title),
      },
      {
        name: `Keterampilan Proses & Terapan ${cleanSubject}`,
        description: `Penerapan metode penyelidikan, rekayasa karya, dan pemecahan masalah nyata ${cleanSubject} untuk Kelas ${numGrade} (${phase}).`,
        competencies: ['Merancang eksperimen/karya nyata', 'Mengomunikasikan hasil investigasi', 'Mengembangkan inovasi solutif'],
        essentialMaterials: topics.sem2.map((t) => t.title),
      },
    ],
    materialsSem1: topics.sem1.map((t, idx) => ({
      semester: 1,
      orderNumber: idx + 1,
      tpCode: `TP.${numGrade}.1.${idx + 1}`,
      tpName: `Menganalisis, menerapkan, dan merefleksikan ${t.title.replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '')} secara bermakna pada pembelajaran ${cleanSubject}.`,
      essentialMaterial: t.title,
      elementName: t.element,
      allocatedHours: Math.round(totalHours / (topics.sem1.length + topics.sem2.length)),
      assessmentStrategy: t.assessment,
      deepLearningMethod: t.deepLearning,
    })),
    materialsSem2: topics.sem2.map((t, idx) => ({
      semester: 2,
      orderNumber: topics.sem1.length + idx + 1,
      tpCode: `TP.${numGrade}.2.${idx + 1}`,
      tpName: `Mengevaluasi, merancang, dan menyajikan karya inovatif terkait ${t.title.replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '')} berbasis 6 Karakter Utama (6C).`,
      essentialMaterial: t.title,
      elementName: t.element,
      allocatedHours: Math.round(totalHours / (topics.sem1.length + topics.sem2.length)),
      assessmentStrategy: t.assessment,
      deepLearningMethod: t.deepLearning,
    })),
  };
}

function getDistinctTopicsByGradeAndDomain(
  subject: string,
  grade: number,
  phase: string,
  domain: SubjectDomain
): GradeTopicDefinition {
  // 1. FOREIGN LANGUAGES (Jerman, Jepang, Mandarin, Arab, Prancis, dll.)
  if (domain === 'language_foreign') {
    if (grade === 10) {
      return {
        sem1: [
          {
            title: `Bab 1: Pengenalan Diri, Salam (Begrüßung / Aisatsu / Tahiyyat), dan Alfabet ${subject}`,
            element: 'Menyimak dan Berbicara',
            competency: 'Menyapa dan memperkenalkan diri',
            hours: 18,
            assessment: 'Roleplay Dialog Perkenalan Diri Singkat & Tes Pengucapan Fonetik',
            deepLearning: 'Joyful: Latihan pelafalan alfabet dan sapaan khas secara interaktif berpasangan.',
          },
          {
            title: `Bab 2: Kehidupan Sekolah, Benda di Kelas, dan Angka 1–100 dalam ${subject}`,
            element: 'Membaca dan Menulis',
            competency: 'Mendeskripsikan ruang kelas dan menghitung',
            hours: 18,
            assessment: 'Menulis Daftar Inventaris Ruang Kelas & Kuis Angka',
            deepLearning: 'Meaningful: Menamai perlengkapan belajar di kelas dalam bahasa sasaran.',
          },
          {
            title: `Bab 3: Keluarga, Hubungan Kekerabatan, dan Deskripsi Fisik Sederhana dalam ${subject}`,
            element: 'Membaca dan Memirsa',
            competency: 'Mendeskripsikan anggota keluarga',
            hours: 18,
            assessment: 'Presentasi Bagan Pohon Keluarga & Portofolio Deskripsi Foto',
            deepLearning: 'Mindful: Menghargai kasih sayang keluarga dan memperkenalkannya dengan bangga.',
          },
        ],
        sem2: [
          {
            title: `Bab 4: Makanan, Minuman, dan Budaya Kuliner Khas Negara Penutur ${subject}`,
            element: 'Menyimak dan Berbicara',
            competency: 'Memesan makanan di restoran',
            hours: 18,
            assessment: 'Simulasi Pemesanan Menu Makanan di Restoran Tradisional & Kuis Kosakata',
            deepLearning: 'Joyful: Praktik simulasi memesan menu sarapan khas di kafe bahasa asing.',
          },
          {
            title: `Bab 5: Jam, Waktu, Jadwal Harian, dan Rutinitas Belajar dalam ${subject}`,
            element: 'Membaca dan Menulis',
            competency: 'Menyusun jadwal kegiatan harian',
            hours: 18,
            assessment: 'Penyusunan Jadwal Kegiatan Sehari-hari (Tagesablauf) & Tes Formatif',
            deepLearning: 'Meaningful: Mengorganisasikan waktu belajar dan istirahat menggunakan bahasa asing.',
          },
          {
            title: `Bab 6: Hobi, Kegiatan Waktu Luang, dan Kalender Musim dalam ${subject}`,
            element: 'Berbicara dan Mempresentasikan',
            competency: 'Menceritakan kegemaran dan musim',
            hours: 18,
            assessment: 'Asesmen Sumatif Akhir Tahun: Presentasi Vlog Singkat Kegemaran & Pameran Poster',
            deepLearning: 'Joyful: Menampilkan video pendek berbahasa asing tentang hobi bermain musik/olahraga.',
          },
        ],
      };
    } else if (grade === 11) {
        return {
          sem1: [
            {
              title: `Bab 1: Menjelajah Kota, Fasilitas Umum, dan Petunjuk Arah Jalan dalam ${subject}`,
              element: 'Menyimak dan Berbicara Lanjut',
              competency: 'Menanyakan dan menunjukkan arah jalan',
              hours: 25,
              assessment: 'Praktik Menjadi Pemandu Arah Turis Asing & Tes Listening',
              deepLearning: 'Joyful: Simulasi menunjukkan rute transportasi kota menggunakan peta interaktif.',
            },
            {
              title: `Bab 2: Rumah Tinggal, Penataan Ruangan, dan Desain Tempat Idaman dalam ${subject}`,
              element: 'Membaca dan Menulis Deskriptif',
              competency: 'Mendeskripsikan tempat tinggal',
              hours: 25,
              assessment: 'Desain Denah Rumah Idaman & Esai Deskriptif Tempat Tinggal',
              deepLearning: 'Meaningful: Merancang tata letak kamar belajar impian yang nyaman dan asri.',
            },
            {
              title: `Bab 3: Liburan, Pengalaman Berwisata, dan Bentuk Waktu Lampau (Perfekt/Past) dalam ${subject}`,
              element: 'Tata Bahasa & Narasi',
              competency: 'Menceritakan pengalaman lampau',
              hours: 25,
              assessment: 'Penulisan Kartu Pos / Catatan Harian Perjalanan Liburan & Kuis',
              deepLearning: 'Mindful: Mengenang pengalaman perjalanan berharga dan menuangkannya dalam kalimat lampau.',
            },
          ],
          sem2: [
            {
              title: `Bab 4: Kesehatan, Tubuh Manusia, dan Konsultasi Gejala Penyakit ke Dokter dalam ${subject}`,
              element: 'Berbicara Interaktif',
              competency: 'Menyampaikan keluhan kesehatan',
              hours: 25,
              assessment: 'Roleplay Dialog Pasien dan Dokter di Klinik & Tes Pemahaman Teks',
              deepLearning: 'Meaningful: Memahami ungkapan keluhan sakit dan empati saat menjenguk orang sakit.',
            },
            {
              title: `Bab 5: Busana, Belanja, Mode, dan Transaksi di Pusat Perbelanjaan dalam ${subject}`,
              element: 'Menyimak dan Berbicara',
              competency: 'Melakukan transaksi belanja',
              hours: 25,
              assessment: 'Simulasi Tawar-Menawar dan Pemilihan Warna/Ukuran Pakaian & Kuis',
              deepLearning: 'Joyful: Berbelanja pakaian di butik virtual dengan ukuran dan warna kesukaan.',
            },
            {
              title: `Bab 6: Dongeng Tradisional, Cerita Rakyat, dan Apresiasi Budaya Populer Negara ${subject}`,
              element: 'Apresiasi Sastra & Budaya',
              competency: 'Mengapresiasi dongeng dan musik',
              hours: 25,
              assessment: 'Asesmen Sumatif: Menceritakan Dongeng Klasik (Märchen) & Analisis Lirik Lagu Populer',
              deepLearning: 'Joyful: Menikmati keindahan dongeng klasik dan menyanyikan lagu hits bahasa sasaran.',
            },
          ],
        };
      } else {
        // Grade 12 Language
        return {
          sem1: [
            {
              title: `Bab 1: Menatap Masa Depan: Pilihan Profesi, Dunia Kerja, dan Karir Global dalam ${subject}`,
              element: 'Membaca dan Berbicara Profesional',
              competency: 'Mendiskusikan profil profesi masa depan',
              hours: 25,
              assessment: 'Penyusunan Curriculum Vitae (Lebenslauf) & Wawancara Kerja Bahasa Asing',
              deepLearning: 'Meaningful: Mempersiapkan CV formal berbahasa asing untuk beasiswa atau karir global.',
            },
            {
              title: `Bab 2: Rencana Studi di Perguruan Tinggi Luar Negeri dan Beasiswa Pendidikan dalam ${subject}`,
              element: 'Menulis Fungsional Lanjut',
              competency: 'Menulis surat motivasi beasiswa',
              hours: 25,
              assessment: 'Penulisan Motivation Letter Pendaftaran Kampus & Analisis Brosur Universitas',
              deepLearning: 'Mindful: Meneguhkan cita-cita kuliah di luar negeri dengan surat motivasi yang tulus.',
            },
            {
              title: `Bab 3: Isu Lingkungan Global, Daur Ulang, dan Gaya Hidup Berkelanjutan dalam ${subject}`,
              element: 'Membaca Kritis & Diskusi',
              competency: 'Mengemukakan argumen pro-kontra isu lingkungan',
              hours: 25,
              assessment: 'Debat Kelas Isu Pengurangan Sampah Plastik & Tes Formatif Argumen',
              deepLearning: 'Meaningful: Membahas praktik daur ulang sampah terstandar negara maju dalam bahasa asing.',
            },
          ],
          sem2: [
            {
              title: `Bab 4: Media Massa, Perkembangan Teknologi Digital, dan Jejaring Sosial dalam ${subject}`,
              element: 'Membaca dan Memirsa Kritis',
              competency: 'Menganalisis artikel berita digital',
              hours: 25,
              assessment: 'Analisis Komparatif Tajuk Berita Surat Kabar Asing & Kuis Kosakata Media',
              deepLearning: 'Mindful: Membaca kritis tajuk berita internasional dan memahami perspektif global.',
            },
            {
              title: `Bab 5: Diplomasi Kebudayaan: Memperkenalkan Kearifan Budaya Indonesia ke Pentas Internasional dalam ${subject}`,
              element: 'Mempresentasikan & Diplomasi',
              competency: 'Mempromosikan budaya nusantara',
              hours: 25,
              assessment: 'Presentasi Promosi Pariwisata dan Warisan Budaya Indonesia Berbahasa Asing',
              deepLearning: 'Joyful: Menjadi duta cilik bangsa yang bangga mempromosikan keindahan Bali dan Raja Ampat.',
            },
            {
              title: `Bab 6: Persiapan Uji Kemahiran Bahasa Internasional (A1/A2/B1 / JLPT / HSK) dan Komunikasi Tingkat Mahir dalam ${subject}`,
              element: 'Kompetensi Bahasa Tingkat Lanjut',
              competency: 'Menguasai format uji sertifikasi resmi',
              hours: 25,
              assessment: 'Asesmen Sumatif Akhir Jenjang: Simulasi Tryout Uji Standar Internasional Resmi (Bintang Sertifikasi)',
              deepLearning: 'Mindful: Mengerjakan simulasi ujian internasional dengan fokus dan percaya diri tinggi.',
            },
          ],
        };
      }
    }

  // 2. VOCATIONAL / APPLIED TECHNICAL (SMK & Pilihan SMA Kejuruan)
  if (
    domain === 'vocational_engineering' ||
    domain === 'vocational_business' ||
    domain === 'vocational_creative' ||
    domain === 'vocational_hospitality'
  ) {
    if (grade <= 10) {
      return {
        sem1: [
          {
            title: `Bab 1: Pengenalan Ekosistem Industri & Standar K3LH 5S/5R Bidang ${subject}`,
            element: 'K3LH & Budaya Kerja',
            competency: 'Menerapkan protokol keselamatan',
            hours: 25,
            assessment: 'Uji Praktik Prosedur K3 dan Inspeksi Ringkas-Rapi Bengkel',
            deepLearning: 'Mindful: Menanamkan budaya kerja industri yang disiplin, aman, dan mengutamakan nyawa.',
          },
          {
            title: `Bab 2: Perkakas Dasar, Instrumen Ukur Kalibrasi, dan Pengenalan Spesifikasi Bahan ${subject}`,
            element: 'Peralatan dan Bahan Kerja',
            competency: 'Menggunakan peralatan dasar dengan presisi',
            hours: 25,
            assessment: 'Tes Kinerja Pengukuran Benda Kerja & Kuis Simbol Bahan',
            deepLearning: 'Joyful: Praktik langsung menggunakan alat ukur presisi dan mengenali toleransi milimeter.',
          },
          {
            title: `Bab 3: Sketsa Desain Teknik, Gambar Kerja Ortogonal, dan Diagram Alir Bidang ${subject}`,
            element: 'Gambar Teknik & Perancangan',
            competency: 'Membaca dan membuat gambar kerja',
            hours: 25,
            assessment: 'Penggambaran Skema Benda Kerja Standar ISO & Lembar Evaluasi',
            deepLearning: 'Meaningful: Mengonversi ide rancangan menjadi gambar kerja teknis yang siap diproduksi.',
          },
        ],
        sem2: [
          {
            title: `Bab 4: Prinsip Keilmuan Terapan, Komponen Inti, dan Prosedur Kerja Standar Bidang ${subject}`,
            element: 'Keilmuan Terapan',
            competency: 'Menganalisis prinsip kerja sistem dasar',
            hours: 25,
            assessment: 'Praktikum Uji Fungsi Komponen & Tes Formatif Teori',
            deepLearning: 'Meaningful: Mengetahui alasan ilmiah di balik setiap tahapan prosedur kerja teknis.',
          },
          {
            title: `Bab 5: Perakitan Dasar, Pengujian Karakteristik, dan Pengendalian Mutu Sederhana Bidang ${subject}`,
            element: 'Keterampilan Proses Perakitan',
            competency: 'Melakukan perakitan dasar dan uji fungsi',
            hours: 25,
            assessment: 'Uji Fungsi Benda Kerja Hasil Perakitan Mandiri & Ceklis Mutu',
            deepLearning: 'Joyful: Menyaksikan produk pertama buatan sendiri berfungsi dengan lancar tanpa kendala.',
          },
          {
            title: `Bab 6: Etika Profesi, Komunikasi di Lingkungan Kerja, dan Profil Peluang Karir Bidang ${subject}`,
            element: 'Etika Profesi & Karir',
            competency: 'Menerapkan komunikasi profesional',
            hours: 25,
            assessment: 'Asesmen Sumatif Akhir Tahun: Simulasi Presentasi Hasil Job Sheet di Depan Penguji Bengkel',
            deepLearning: 'Mindful: Membangun mentalitas profesional yang pantang menyerah dan menghormati etika.',
          },
        ],
      };
    } else if (grade === 11) {
      return {
        sem1: [
          {
            title: `Bab 1: Spesialisasi Teknis Menengah & Standar Prosedur Operasional (SOP) Mesin/Sistem ${subject}`,
            element: 'Keahlian Teknis Menengah',
            competency: 'Mengoperasikan mesin spesialisasi sesuai SOP',
            hours: 35,
            assessment: 'Uji Kinerja Pengoperasian Mesin Sesuai Standar Industri & Lembar Kerja',
            deepLearning: 'Mindful: Disiplin penuh mengikuti setiap langkah SOP saat mengoperasikan mesin produksi.',
          },
          {
            title: `Bab 2: Pemeliharaan Terencana (Preventive Maintenance) dan Kalibrasi Berkala Sistem ${subject}`,
            element: 'Pemeliharaan dan Perawatan',
            competency: 'Melakukan perawatan rutin terencana',
            hours: 35,
            assessment: 'Praktik Servis Berkala dan Pengisian Logbook TPM Bengkel',
            deepLearning: 'Meaningful: Memahami siklus keausan komponen dan pentingnya pelumasan terjadwal.',
          },
          {
            title: `Bab 3: Teknik Pengujian Kualitas (Quality Assurance) dan Pengendalian Toleransi Teknis ${subject}`,
            element: 'Penjaminan Mutu Produk',
            competency: 'Melakukan uji mutu dan toleransi presisi',
            hours: 35,
            assessment: 'Inspeksi Mutu Batch Sampel Produk & Analisis Koreksi Cacat',
            deepLearning: 'Mindful: Ketelitian meneliti hasil akhir produk agar memenuhi standar kepuasan pelanggan.',
          },
        ],
        sem2: [
          {
            title: `Bab 4: Diagnostik Kerusakan Menengah (Fault Finding) dan Penanganan Malfungsi Sistem ${subject}`,
            element: 'Diagnostik dan Perbaikan',
            competency: 'Mendiagnosis dan memperbaiki kerusakan',
            hours: 35,
            assessment: 'Uji Troubleshooting Kerusakan yang Disimulasikan Penguji',
            deepLearning: 'Joyful: Berhasil mendeteksi akar masalah kerusakan dan mengembalikan performa alat ke kondisi prima.',
          },
          {
            title: `Bab 5: Penerapan Standardisasi Industri Terakreditasi dan Efisiensi Operasional Bidang ${subject}`,
            element: 'Standardisasi & Efisiensi',
            competency: 'Menerapkan standar industri nasional/global',
            hours: 35,
            assessment: 'Audit Kepatuhan Prosedur Kerja Bengkel Mengacu Regulasi Industri',
            deepLearning: 'Meaningful: Menata alur kerja agar tidak ada waktu terbuang dan material yang terbuang sia-sia.',
          },
          {
            title: `Bab 6: Penyusunan Portofolio Teknis dan Persiapan Pra-Praktik Kerja Lapangan (PKL) Bidang ${subject}`,
            element: 'Portofolio & Kesiapan Kerja',
            competency: 'Menyusun portofolio kompetensi kerja',
            hours: 35,
            assessment: 'Asesmen Sumatif Akhir Tahun: Sidang Portofolio Kejuruan dan Wawancara Kesiapan DUDI',
            deepLearning: 'Mindful: Menyiapkan mental dan etika unggul sebelum terjun langsung ke perusahaan mitra.',
          },
        ],
      };
    } else if (grade === 12) {
      return {
        sem1: [
          {
            title: `Bab 1: Pemecahan Masalah Kompleks (Advanced Troubleshooting) & Rekayasa Sistem Lanjut Bidang ${subject}`,
            element: 'Troubleshooting Lanjut',
            competency: 'Menyelesaikan malfungsi kompleks',
            hours: 35,
            assessment: 'Uji Penanganan Malfungsi Sistem Multi-Komponen dalam Waktu Nyata',
            deepLearning: 'Mindful: Menghadapi situasi darurat teknis dengan ketenangan pikiran dan analisis berbasis data.',
          },
          {
            title: `Bab 2: Projek Kreatif dan Kewirausahaan (PKK) Bagian 1: Riset Pasar, Desain Prototipe, dan HPP Bidang ${subject}`,
            element: 'Kewirausahaan dan Inovasi',
            competency: 'Merancang produk kreatif bernilai jual',
            hours: 35,
            assessment: 'Penyusunan Rencana Bisnis Prototipe Produk & Perhitungan Anggaran Biaya',
            deepLearning: 'Joyful: Merancang produk inovasi yang menjawab keluhan konsumen dengan harga terjangkau.',
          },
          {
            title: `Bab 3: Praktik Kerja Lapangan (PKL) di Dunia Usaha / Industri Mitra: Tahap Adaptasi & Pelaksanaan Bidang ${subject}`,
            element: 'Praktik Kerja Lapangan',
            competency: 'Melaksanakan pekerjaan nyata di industri',
            hours: 35,
            assessment: 'Evaluasi Kinerja Shift Kerja Industri oleh Pembimbing DUDI',
            deepLearning: 'Meaningful: Menjadi bagian dari roda industri sesungguhnya dan merasakan ritme kerja profesional.',
          },
        ],
        sem2: [
          {
            title: `Bab 4: Projek Kreatif dan Kewirausahaan (PKK) Bagian 2: Pengujian Prototipe, Pemasaran Digital, dan Pembukuan Bidang ${subject}`,
            element: 'Produksi dan Pemasaran',
            competency: 'Memasarkan produk dan membukukan laba',
            hours: 35,
            assessment: 'Gelar Bazar Produk & Laporan Neraca Laba Rugi Penjualan Riil',
            deepLearning: 'Joyful: Menikmati hasil penjualan produk karya sendiri yang laris manis dibeli konsumen.',
          },
          {
            title: `Bab 5: Praktik Kerja Lapangan (PKL): Penyusunan Portofolio Akhir Magang & Laporan Evaluasi DUDI Bidang ${subject}`,
            element: 'Evaluasi Praktik Industri',
            competency: 'Menyusun laporan komprehensif PKL',
            hours: 35,
            assessment: 'Sidang Ujian Laporan Praktik Kerja Lapangan di Depan Penguji Industri',
            deepLearning: 'Mindful: Mengambil hikmah berharga dari pengalaman bekerja bersama para profesional senior.',
          },
          {
            title: `Bab 6: Uji Kompetensi Keahlian (UKK) Bersertifikat Lembaga Sertifikasi Profesi (LSP/BNSP) Bidang ${subject}`,
            element: 'Sertifikasi Profesi & Kelulusan',
            competency: 'Meraih predikat kompeten penguji eksternal',
            hours: 35,
            assessment: 'Asesmen Sumatif Akhir Jenjang (SAJ): Penilaian Asesor Eksternal Industri Predikat Kompeten (K)',
            deepLearning: 'Joyful: Rasa bangga tak terkira saat menerima sertifikat kompetensi keahlian berstandar nasional.',
          },
        ],
      };
    } else {
      // Grade 13 (SMK 4 Tahun)
      return {
        sem1: [
          {
            title: `Bab 1: Pemagangan Industri Penuh (Full-Scale Industrial Internship) & Manajemen Siklus Kerja ${subject}`,
            element: 'Pemagangan Industri Penuh',
            competency: 'Mengelola siklus produksi industri',
            hours: 45,
            assessment: 'Evaluasi Kinerja Manajemen Kerja Industri Mitra Bulanan',
            deepLearning: 'Meaningful: Mengemban tanggung jawab memimpin shift operasional pada lini kerja pabrik.',
          },
          {
            title: `Bab 2: Manajemen Mutu Menyeluruh (Total Quality Management / Six Sigma) dan Audit Sistem ${subject}`,
            element: 'Manajemen Mutu Global',
            competency: 'Menganalisis efisiensi sistem produksi',
            hours: 45,
            assessment: 'Laporan Audit Mutu Kaizen dan Rekomendasi Efisiensi Lini Kerja',
            deepLearning: 'Mindful: Menemukan solusi efisiensi yang menekan limbah produksi dan menghemat energi.',
          },
          {
            title: `Bab 3: Sertifikasi Profesi Tingkat Ahli / Madya Standar Asosiasi Industri Global Bidang ${subject}`,
            element: 'Sertifikasi Profesi Lanjut',
            competency: 'Menguasai standar sertifikasi internasional',
            hours: 45,
            assessment: 'Uji Sertifikasi Profesi Tingkat Lanjut Dewan Asosiasi Industri',
            deepLearning: 'Meaningful: Meraih lisensi kerja tingkat madya yang diakui di kawasan regional dan dunia.',
          },
        ],
        sem2: [
          {
            title: `Bab 4: Riset Rekayasa Terapan & Inovasi Teknologi Capstone Project Bidang ${subject}`,
            element: 'Riset Terapan Industri',
            competency: 'Merancang inovasi teknologi industri',
            hours: 45,
            assessment: 'Uji Validasi Alat Inovasi Terapan Langsung di Lingkungan Industri Mitra',
            deepLearning: 'Joyful: Alat inovasi rancangan sendiri terpasang dan beroperasi nyata meningkatkan output pabrik.',
          },
          {
            title: `Bab 5: Studi Kelayakan Tekno-Ekonomi, Hak Paten, dan Standardisasi Operasional Inovasi ${subject}`,
            element: 'Kelayakan Tekno-Ekonomi',
            competency: 'Menyusun berkas pendaftaran paten',
            hours: 45,
            assessment: 'Dokumen Analisis ROI dan Draft Pendaftaran Hak Kekayaan Intelektual (HAKI)',
            deepLearning: 'Meaningful: Melindungi karya inovasi bangsa melalui pendaftaran hak cipta dan paten resmi.',
          },
          {
            title: `Bab 6: Sidang Terbuka Diseminasi Karya Riset Terapan di Hadapan Pimpinan Industri & Dewan Penguji ${subject}`,
            element: 'Diseminasi Karya & Kelulusan',
            competency: 'Mempertahankan inovasi industri',
            hours: 45,
            assessment: 'Asesmen Sumatif Akhir Program 4 Tahun: Sidang Terbuka Karya Capstone & Penyerahan Ijazah Teknisi Unggul',
            deepLearning: 'Joyful: Menerima penghargaan inovasi terbaik dari dewan direksi industri pada hari kelulusan.',
          },
        ],
      };
    }
  }

  // 3. GENERAL ACADEMIC & ALL OTHER SUBJECTS (Grade 1 to 13 distinct progression)
  if (grade <= 3) {
    return {
      sem1: [
        {
          title: `Bab 1: Pengenalan Karakteristik Dasar & Objek Konkret ${subject} (Kelas ${grade})`,
          element: 'Pengamatan & Pengenalan',
          competency: 'Mengenal objek konkret melalui panca indra',
          hours: 18,
          assessment: 'Tes Praktik Menunjukkan Objek Nyata & Gambar',
          deepLearning: `Joyful: Mengenal dasar ${subject} melalui benda nyata dan lagu ceria.`,
        },
        {
          title: `Bab 2: Keteraturan, Pola Sederhana, dan Pembiasaan Sikap Positif ${subject} (Kelas ${grade})`,
          element: 'Pembiasaan & Pola',
          competency: 'Menemukan keteraturan pola sederhana',
          hours: 18,
          assessment: 'Menyusun Kartu Pola Bergambar & Refleksi Sikap',
          deepLearning: `Mindful: Mengamati keteraturan alam dan belajar sabar mengikuti aturan.`,
        },
      ],
      sem2: [
        {
          title: `Bab 3: Eksplorasi Bersama Lingkungan Sekitar & Ragam Benda ${subject} (Kelas ${grade})`,
          element: 'Eksplorasi Lingkungan',
          competency: 'Mengamati ragam benda di lingkungan',
          hours: 18,
          assessment: 'Karya Tempel Mengelompokkan Benda Bersama Kelompok',
          deepLearning: `Joyful: Menjelajahi taman sekolah menemukan keajaiban materi ${subject}.`,
        },
        {
          title: `Bab 4: Pengalaman Berbagi, Merawat Fasilitas, dan Hasil Karya Ceria ${subject} (Kelas ${grade})`,
          element: 'Karya Nyata & Kasih Sayang',
          competency: 'Merawat lingkungan dan menampilkan karya',
          hours: 18,
          assessment: 'Asesmen Sumatif: Gelar Pameran Karya Sederhana Siswa Kelas ' + grade,
          deepLearning: `Joyful: Bangga memamerkan hasil karya sendiri kepada guru dan orang tua.`,
        },
      ],
    };
  } else if (grade <= 6) {
    return {
      sem1: [
        {
          title: `Bab 1: Konsep Fundamental & Penyelidikan Terarah ${subject} (Kelas ${grade})`,
          element: 'Pemahaman Konsep',
          competency: 'Menjelaskan konsep dasar dan keterhubungannya',
          hours: 24,
          assessment: 'Tes Formatif & Lembar Kerja Eksplorasi Terarah',
          deepLearning: `Meaningful: Menghubungkan konsep dasar ${subject} dengan kehidupan nyata anak.`,
        },
        {
          title: `Bab 2: Analisis Kausalitas & Pengumpulan Data Sederhana ${subject} (Kelas ${grade})`,
          element: 'Keterampilan Proses',
          competency: 'Menganalisis sebab-akibat fenomena',
          hours: 24,
          assessment: 'Penyusunan Bagan Alir Hubungan Sebab-Akibat & Kuis',
          deepLearning: `Mindful: Menyelidiki dengan teliti alasan di balik terjadinya suatu peristiwa.`,
        },
        {
          title: `Bab 3: Pemodelan Terapan & Pemecahan Masalah Lingkungan ${subject} (Kelas ${grade})`,
          element: 'Pemodelan Solutif',
          competency: 'Merancang model pemecahan masalah lokal',
          hours: 24,
          assessment: 'Proyek Kelompok Desain Miniatur Solusi Lingkungan',
          deepLearning: `Joyful: Bekerjasama merakit model visual kreatif pemecahan masalah sekolah.`,
        },
      ],
      sem2: [
        {
          title: `Bab 4: Eksplorasi Sistemik & Perbandingan Ciri Karakteristik ${subject} (Kelas ${grade})`,
          element: 'Penalaran Sistemik',
          competency: 'Membandingkan berbagai karakteristik sistem',
          hours: 24,
          assessment: 'Tabel Analisis Komparatif Karakteristik Objek',
          deepLearning: `Meaningful: Mengamati bagaimana bagian-bagian dalam sistem saling mendukung satu sama lain.`,
        },
        {
          title: `Bab 5: Pemanfaatan Teknologi Sederhana & Aksi Pelestarian ${subject} (Kelas ${grade})`,
          element: 'Teknologi & Aksi Nyata',
          competency: 'Memanfaatkan alat sederhana pelestari alam',
          hours: 24,
          assessment: 'Praktik Pembuatan Alat Sederhana Berbahan Daur Ulang',
          deepLearning: `Joyful: Mengubah barang bekas kardus/botol menjadi alat bantu pembelajaran yang bermanfaat.`,
        },
        {
          title: `Bab 6: Karya Kolaboratif, Refleksi Pembelajaran, dan Presentasi ${subject} (Kelas ${grade})`,
          element: 'Komunikasi & Asesmen Akhir',
          competency: 'Mempresentasikan hasil karya dan refleksi',
          hours: 24,
          assessment: 'Asesmen Sumatif Akhir Tahun: Presentasi Gelar Karya Siswa Kelas ' + grade,
          deepLearning: `Mindful: Merefleksikan seluruh pengetahuan yang diperoleh dengan rasa syukur dan percaya diri.`,
        },
      ],
    };
  } else if (grade <= 9) {
    return {
      sem1: [
        {
          title: `Bab 1: Kerangka Konseptual & Landasan Keilmuan Formal ${subject} (Kelas ${grade})`,
          element: 'Pemahaman Keilmuan',
          competency: 'Menganalisis kerangka konseptual disiplin ilmu',
          hours: 24,
          assessment: 'Tes Tertulis Formatif Analisis Konsep & Studi Pustaka',
          deepLearning: `Meaningful: Memahami posisi keilmuan ${subject} dalam menjawab tantangan sains modern.`,
        },
        {
          title: `Bab 2: Struktur Dinamis, Interaksi Komponen, dan Hukum Pembentuk ${subject} (Kelas ${grade})`,
          element: 'Analisis Struktur & Dinamika',
          competency: 'Mengidentifikasi interaksi dinamis antar-unsur',
          hours: 24,
          assessment: 'Diagram Analisis Hubungan Antarvariabel & Kuis Formatif',
          deepLearning: `Mindful: Menyadari keteraturan hukum alam dan keterkaitan komponen dalam sistem.`,
        },
        {
          title: `Bab 3: Investigasi Empiris, Pengolahan Data, dan Penarikan Simpulan ${subject} (Kelas ${grade})`,
          element: 'Metodologi Penyelidikan',
          competency: 'Melakukan penyelidikan terstruktur berbasis data',
          hours: 24,
          assessment: 'Laporan Praktikum / Riset Terpandu & Validasi Hipotesis',
          deepLearning: `Joyful: Menguji coba hipotesis secara langsung dan menemukan pola keteraturan data.`,
        },
      ],
      sem2: [
        {
          title: `Bab 4: Penerapan Kontekstual & Solusi Tantangan Komunitas ${subject} (Kelas ${grade})`,
          element: 'Penerapan Kontekstual',
          competency: 'Mengaplikasikan teori pada persoalan lokal',
          hours: 24,
          assessment: 'Studi Kasus Permasalahan Nyata di Daerah Siswa & Rekomendasi Solusi',
          deepLearning: `Meaningful: Menggunakan pemahaman ${subject} untuk membantu menyelesaikan masalah warga sekitar.`,
        },
        {
          title: `Bab 5: Analisis Dampak, Etika Penggunaan, dan Kelestarian Berkelanjutan ${subject} (Kelas ${grade})`,
          element: 'Etika & Keberlanjutan',
          competency: 'Mengevaluasi dampak dan tanggung jawab etis',
          hours: 24,
          assessment: 'Esai Kritis Dampak Perkembangan Teknologi & Diskusi Panel',
          deepLearning: `Mindful: Mempertimbangkan implikasi etika moral sebelum mengambil keputusan penerapan ilmu.`,
        },
        {
          title: `Bab 6: Sintesis Terpadu, Desain Proyek Karya, dan Diseminasi Informasi ${subject} (Kelas ${grade})`,
          element: 'Sintesis & Diseminasi',
          competency: 'Merancang proyek sintesis terpadu',
          hours: 24,
          assessment: 'Asesmen Sumatif Akhir Tahun: Expo Pameran Riset Terpadu Kelas ' + grade,
          deepLearning: `Joyful: Mempresentasikan hasil penyelidikan di hadapan adik kelas dan dewan guru dengan antusias.`,
        },
      ],
    };
  } else if (grade === 10) {
    return {
      sem1: [
        {
          title: `Bab 1: Fondasi Filosofis, Paradigma Epistemologi, dan Metodologi Dasar ${subject} (Kelas 10)`,
          element: 'Fondasi Keilmuan',
          competency: 'Menganalisis paradigma filosofis dan metodologi',
          hours: 25,
          assessment: 'Makalah Landasan Filosofis Keilmuan & Tes Formatif',
          deepLearning: `Mindful: Memahami akar ontologis dan epistemologis lahirnya ilmu ${subject}.`,
        },
        {
          title: `Bab 2: Pemodelan Teoretis, Asas-Asas Esensial, dan Formulasi Logika ${subject} (Kelas 10)`,
          element: 'Pemodelan Teoretis',
          competency: 'Merumuskan model konseptual analitis',
          hours: 25,
          assessment: 'Uji Pemodelan Sistem Konseptual & Diskusi Kelompok',
          deepLearning: `Meaningful: Mengaitkan postulat teoretis dengan fenomena disrupsi era kontemporer.`,
        },
        {
          title: `Bab 3: Riset Eksploratif Lapangan, Pengumpulan Bukti, dan Uji Validitas Data ${subject} (Kelas 10)`,
          element: 'Metodologi Penelitian Awal',
          competency: 'Merancang instrumen pengumpulan data valid',
          hours: 25,
          assessment: 'Laporan Riset Eksploratif Lapangan & Analisis Reliabilitas',
          deepLearning: `Joyful: Terjun langsung mengumpulkan data mentah di lapangan dan menganalisisnya secara kritis.`,
        },
      ],
      sem2: [
        {
          title: `Bab 4: Penerapan Konsep dalam Transformasi Hijau dan Keberlanjutan (SDGs) ${subject} (Kelas 10)`,
          element: 'Transformasi Berkelanjutan',
          competency: 'Menganalisis keterkaitan materi dengan target SDGs',
          hours: 25,
          assessment: 'Analisis Proyek Penyelarasan Agenda Pembangunan Berkelanjutan (SDGs)',
          deepLearning: `Meaningful: Mengarahkan pemahaman ilmu untuk mendukung 17 sasaran pembangunan berkelanjutan dunia.`,
        },
        {
          title: `Bab 5: Komunikasi Ilmiah, Penulisan Esai Berbasis Bukti, dan Retorika Argumen ${subject} (Kelas 10)`,
          element: 'Komunikasi Ilmiah',
          competency: 'Menulis esai argumentatif berbobot',
          hours: 25,
          assessment: 'Publikasi Esai Ilmiah Siswa pada Majalah Akademik Sekolah',
          deepLearning: `Mindful: Melatih ketajaman pena dan keanggunan gaya bahasa dalam membela argumen ilmiah.`,
        },
        {
          title: `Bab 6: Capstone Terpadu Fase E: Inovasi Solutif Lingkup Sekolah ${subject} (Kelas 10)`,
          element: 'Capstone Solusi Nyata',
          competency: 'Mengevaluasi prototipe inovasi solusi',
          hours: 25,
          assessment: 'Asesmen Sumatif Akhir Tahun: Gelar Wicara Presentasi Inovasi Sains Terbuka',
          deepLearning: `Joyful: Mendemonstrasikan karya nyata yang langsung dimanfaatkan oleh warga sekolah.`,
        },
      ],
    };
  } else if (grade === 11) {
    return {
      sem1: [
        {
          title: `Bab 1: Analisis Lanjutan Teori Komprehensif & Spesialisasi Mendalam ${subject} (Kelas 11)`,
          element: 'Spesialisasi Tingkat Tinggi',
          competency: 'Menganalisis sistem teoritis tingkat tinggi',
          hours: 30,
          assessment: 'Tes Formatif Analisis Kasus Spesialisasi & Uji Matematis/Teoretis',
          deepLearning: `Meaningful: Membedah jurnal ilmiah mutakhir untuk memahami perkembangan paling baru.`,
        },
        {
          title: `Bab 2: Pemodelan Kuantitatif, Simulasi Komputasi, dan Analisis Dinamika Sistem ${subject} (Kelas 11)`,
          element: 'Pemodelan Komputasi',
          competency: 'Mengembangkan model simulasi dinamis',
          hours: 30,
          assessment: 'Praktikum Komputasi Simulasi Sistem Perilaku Kompleks',
          deepLearning: `Joyful: Menjalankan model simulasi komputer dan melihat grafik reaksi sistem secara realtime.`,
        },
        {
          title: `Bab 3: Eksperimen Terstandarisasi, Verifikasi Hipotesis, dan Kontrol Galat ${subject} (Kelas 11)`,
          element: 'Riset Laboratorium / Terapan',
          competency: 'Melakukan uji pembuktian berstandar tinggi',
          hours: 30,
          assessment: 'Laporan Uji Eksperimental Lengkap dengan Analisis Ketidakpastian',
          deepLearning: `Mindful: Mengutamakan presisi dan kejujuran mutlak dalam mencatat deviasi data laboratorium.`,
        },
      ],
      sem2: [
        {
          title: `Bab 4: Keterkaitan Interdisipliner, Harmoni Ekosistem, dan Dampak Sosio-Teknis ${subject} (Kelas 11)`,
          element: 'Interdisipliner & Ekologi',
          competency: 'Menganalisis korelasi lintas-disiplin ilmu',
          hours: 30,
          assessment: 'Makalah Sintesis Interdisipliner Solusi Ketahanan Energi/Pangan',
          deepLearning: `Meaningful: Menghubungkan disiplin ini dengan ekonomi sirkular dan pelestarian bumi.`,
        },
        {
          title: `Bab 5: Manajemen Inovasi, Perancangan Prototipe Fungsional, dan Uji Performa ${subject} (Kelas 11)`,
          element: 'Rekayasa & Desain Prototipe',
          competency: 'Merancang purwarupa teknologi terapan',
          hours: 30,
          assessment: 'Pengujian Lapangan Prototipe Fungsional & Lembar Evaluasi Metrik',
          deepLearning: `Joyful: Menguji coba prototipe yang dibuat bersama tim di bengkel/laboratorium sekolah.`,
        },
        {
          title: `Bab 6: Capstone Riset Pertengahan Fase F & Publikasi Karya Ilmiah Remaja ${subject} (Kelas 11)`,
          element: 'Publikasi Ilmiah',
          competency: 'Menyusun naskah publikasi ilmiah',
          hours: 30,
          assessment: 'Asesmen Sumatif Akhir Tahun: Sidang Karya Tulis Ilmiah Remaja (KIR) di Depan Tim Reviewer',
          deepLearning: `Mindful: Merasakan kebanggaan intelektual saat naskah penelitian mandiri diapresiasi dewan juri.`,
        },
      ],
    };
  } else if (grade === 12) {
    return {
      sem1: [
        {
          title: `Bab 1: Dialektika Tingkat Tinggi, Analisis Multivariat, dan Evaluasi Kritis ${subject} (Kelas 12)`,
          element: 'Dialektika & Evaluasi Kritis',
          competency: 'Mengevaluasi paradigma secara kritis',
          hours: 30,
          assessment: 'Ujian Analitis Kasus Ekstrem & Debat Akademis Komparasi Paradigma',
          deepLearning: `Mindful: Mampu melihat kelemahan tersembunyi dari suatu teori dan mengajukan antitesis konstruktif.`,
        },
        {
          title: `Bab 2: Manajemen Proyek Strategis, Rekayasa Solusi Berkelanjutan, dan Analisis Risiko ${subject} (Kelas 12)`,
          element: 'Manajemen Proyek & Solusi',
          competency: 'Menyusun peta jalan mitigasi risiko strategis',
          hours: 30,
          assessment: 'Dokumen Rencana Proyek Solusi Komprehensif & Mitigasi Risiko',
          deepLearning: `Meaningful: Belajar memimpin proyek besar dengan manajemen waktu dan alokasi sumber daya yang presisi.`,
        },
        {
          title: `Bab 3: Integrasi Teknologi Mutakhir (AI, Big Data, IoT) dalam Pengembangan Keilmuan ${subject} (Kelas 12)`,
          element: 'Teknologi Mutakhir & Inovasi',
          competency: 'Mengintegrasikan instrumen digital canggih',
          hours: 30,
          assessment: 'Implementasi Algoritma Digital / Sensor Pintar dalam Pengolahan Data Bidang',
          deepLearning: `Joyful: Memanfaatkan kecerdasan buatan dan sensor pintar untuk melipatgandakan dampak positif keilmuan.`,
        },
      ],
      sem2: [
        {
          title: `Bab 4: Etika Kepemimpinan Global, Perlindungan HKI, dan Regulasi Internasional ${subject} (Kelas 12)`,
          element: 'Etika Kepemimpinan & Hukum',
          competency: 'Menganalisis kerangka hukum dan etika global',
          hours: 30,
          assessment: 'Studi Kasus Sengketa Hak Paten / Bioetika & Uji Wawasan Hukum',
          deepLearning: `Mindful: Menjunjung tinggi etika integritas, transparansi data, dan penghormatan hak cipta penemu.`,
        },
        {
          title: `Bab 5: Proyek Karya Monumental (Senior Capstone) Solusi Nyata Berdampak Masyarakat ${subject} (Kelas 12)`,
          element: 'Senior Capstone Project',
          competency: 'Mengembangkan karya monumental berdampak luas',
          hours: 30,
          assessment: 'Pengujian Hasil Implementasi Nyata di Masyarakat & Lembar Testimoni Pengguna',
          deepLearning: `Meaningful: Menyaksikan secara nyata bagaimana karya tugas akhir sekolah membawa manfaat langsung bagi warga desa.`,
        },
        {
          title: `Bab 6: Sidang Pertahanan Karya Akhir Jenjang & Manifesto Kepemimpinan Masa Depan ${subject} (Kelas 12)`,
          element: 'Sidang Akhir & Kesiapan Masa Depan',
          competency: 'Mempertahankan karya dan menyusun ikrar kontribusi',
          hours: 30,
          assessment: 'Asesmen Sumatif Akhir Jenjang (SAJ): Sidang Terbuka Pertahanan Capstone Project & Manifesto Kelulusan',
          deepLearning: `Joyful: Berdiri tegak di podium sidang kelulusan dengan keyakinan penuh siap membangun masa depan Indonesia.`,
        },
      ],
    };
  } else {
    // Grade 13
    return {
      sem1: [
        {
          title: `Bab 1: Riset Rekayasa Terapan & Inovasi Industri Tingkat Lanjut ${subject} (Kelas 13)`,
          element: 'Riset Terapan Lanjut',
          competency: 'Memimpin riset terapan berstandar industri',
          hours: 45,
          assessment: 'Laporan Validasi Inovasi Lapangan Bersama Mitra Korporasi',
          deepLearning: `Meaningful: Memimpin inovasi yang terbukti memecahkan kendala teknis industri mitra.`,
        },
        {
          title: `Bab 2: Manajemen Kualitas Global (Total Quality Management / Six Sigma) ${subject} (Kelas 13)`,
          element: 'Penjaminan Mutu Global',
          competency: 'Menerapkan penjaminan mutu internasional',
          hours: 45,
          assessment: 'Audit Sistem Mutu & Analisis Statistical Process Control (SPC)',
          deepLearning: `Mindful: Menjaga standar mutu tanpa cacat pada setiap tahapan perakitan dan operasional.`,
        },
        {
          title: `Bab 3: Sertifikasi Profesi Tingkat Ahli Standar Asosiasi Multinasional ${subject} (Kelas 13)`,
          element: 'Sertifikasi Ahli',
          competency: 'Meraih lisensi keahlian tingkat lanjut',
          hours: 45,
          assessment: 'Uji Kompetensi Khusus Dewan Sertifikasi Profesi Internasional',
          deepLearning: `Meaningful: Meraih lisensi resmi yang membuka pintu karir di perusahaan internasional.`,
        },
      ],
      sem2: [
        {
          title: `Bab 4: Implementasi Otomasi Sistem & Peningkatan Produktivitas ${subject} (Kelas 13)`,
          element: 'Otomasi Industri',
          competency: 'Merancang sistem otomasi terpadu',
          hours: 45,
          assessment: 'Uji Performa Sistem Otomasi di Pabrik / Industri Rekanan',
          deepLearning: `Joyful: Sistem otomatisasi rancangan sendiri bekerja mulus meningkatkan efisiensi berkali lipat.`,
        },
        {
          title: `Bab 5: Studi Tekno-Ekonomi, Pendaftaran Paten, dan Alih Teknologi ${subject} (Kelas 13)`,
          element: 'Komersialisasi & Hak Cipta',
          competency: 'Menyusun berkas pendaftaran hak paten inovasi',
          hours: 45,
          assessment: 'Dokumen Kelayakan Investasi & Pendaftaran Paten Resmi',
          deepLearning: `Meaningful: Melindungi inovasi teknologi karya anak bangsa melalui pendaftaran paten resmi.`,
        },
        {
          title: `Bab 6: Diseminasi Karya Capstone Monumental di Hadapan Dewan Direksi Industri ${subject} (Kelas 13)`,
          element: 'Sidang Terbuka Kelulusan 4 Tahun',
          competency: 'Mempertahankan karya di hadapan dewan pimpinan industri',
          hours: 45,
          assessment: 'Asesmen Sumatif Akhir Program 4 Tahun: Sidang Terbuka di Hadapan Pimpinan Industri & Penyerahan Gelar Ahli',
          deepLearning: `Joyful: Menerima penghargaan inovasi dan tawaran kontrak kerja bergengsi langsung dari pimpinan industri.`,
        },
      ],
    };
  }
}
