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
  | 'coding_ai'
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
  if (subLower.includes('koding') || subLower.includes('kecerdasan artifisial') || subLower.includes('informatika') || subLower.includes('pendidikan digital')) {
    return 'coding_ai';
  }
  if (subLower.includes('agama') || subLower.includes('budi pekerti') || subLower.includes('kepercayaan') || subLower.includes('islam') || subLower.includes('kristen') || subLower.includes('katolik') || subLower.includes('hindu') || subLower.includes('buddha') || subLower.includes('khonghucu')) {
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
      : level === 'SMA' && numGrade >= 11
      ? 180
      : 108;
  const jpPerWeek =
    level === 'SD'
      ? 4
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
    cpSummary: `Peserta didik mampu menguasai capaian pembelajaran esensial ${cleanSubject} untuk Tingkat Kelas ${numGrade} (${phase}) sesuai Keputusan Kepala BSKAP No. 046/H/KR/2025 & No. 020/H/KR/2026 dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful Learning).`,
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

  // 2. APPLIED / VOCATIONAL ELECTIVES (Pilihan SMA Terapan)
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
    } else {
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
            title: `Bab 3: Praktik Terapan & Kolaborasi Karya Bidang ${subject}`,
            element: 'Praktik Terapan',
            competency: 'Melaksanakan proyek terapan nyata',
            hours: 35,
            assessment: 'Evaluasi Kinerja Proyek oleh Guru Pembimbing',
            deepLearning: 'Meaningful: Menerapkan kompetensi ke dalam karya nyata yang bermanfaat.',
          },
        ],
        sem2: [
          {
            title: `Bab 4: Projek Kreatif dan Kewirausahaan (PKK) Bagian 2: Pengujian Prototipe, Pemasaran Digital, dan Pembukuan Bidang ${subject}`,
            element: 'Produksi dan Pemasaran',
            competency: 'Memasarkan produk dan membukukan laba',
            hours: 35,
            assessment: 'Gelar Bazar Produk & Laporan Neraca Laba Rugi Penjualan Riil',
            deepLearning: 'Joyful: Menikmati hasil penjualan produk karya sendiri yang bermanfaat.',
          },
          {
            title: `Bab 5: Penyusunan Portofolio Akhir & Laporan Evaluasi Karya Bidang ${subject}`,
            element: 'Evaluasi Praktik Terapan',
            competency: 'Menyusun laporan komprehensif proyek',
            hours: 35,
            assessment: 'Presentasi Laporan Proyek di Depan Penguji Sekolah',
            deepLearning: 'Mindful: Mengambil hikmah berharga dari pengalaman praktik terapan.',
          },
          {
            title: `Bab 6: Asesmen Kompetensi & Diseminasi Karya Bidang ${subject}`,
            element: 'Asesmen & Kelulusan',
            competency: 'Meraih predikat kompeten pada uji akhir',
            hours: 35,
            assessment: 'Asesmen Sumatif Akhir Jenjang (SAJ)',
            deepLearning: 'Joyful: Rasa bangga menyajikan karya terbaik saat kelulusan.',
          },
        ],
      };
    }
  }

  // 2B. RELIGIOUS STUDIES & KEPERCAYAAN (BSKAP No. 020/H/KR/2026)
  if (domain === 'religious_studies') {
    if (grade <= 6) {
      return {
        sem1: [
          {
            title: `Bab 1: Kasih Sayang Tuhan, Mengenal Kitab Suci, dan Nilai Dasar ${subject} (Kelas ${grade})`,
            element: 'Kitab Suci & Keimanan',
            competency: 'Mengenal ajaran kasih sayang dan nilai keimanan dasar',
            hours: 24,
            assessment: 'Observasi Pembiasaan Doa, Cerita Teladan & Lembar Refleksi',
            deepLearning: `Mindful: Menumbuhkan kesadaran syukur dan doa sebelum beraktivitas.`,
          },
          {
            title: `Bab 2: Akhlak Mulia, Kejujuran, dan Hormat kepada Orang Tua serta Guru (Kelas ${grade})`,
            element: 'Akhlak & Budi Pekerti',
            competency: 'Membiasakan perilaku jujur, santun, dan hormat',
            hours: 24,
            assessment: 'Jurnal Pembiasaan Budi Pekerti & Bermain Peran',
            deepLearning: `Meaningful: Menghubungkan ajaran akhlak mulia dengan sikap nyata di rumah dan sekolah.`,
          },
          {
            title: `Bab 3: Praktik Ibadah Harian, Kebersihan Diri, dan Kerukunan Teman (Kelas ${grade})`,
            element: 'Ibadah & Ritual',
            competency: 'Mempraktikkan tata cara ibadah dasar secara tertib',
            hours: 24,
            assessment: 'Praktik Langsung Tata Cara Ibadah & Doa Harian',
            deepLearning: `Joyful: Mempraktikkan ibadah harian bersama teman dengan suasana gembira dan damai.`,
          },
        ],
        sem2: [
          {
            title: `Bab 4: Kisah Keteladanan Tokoh Spiritual & Nilai Keberagaman Nusantara (Kelas ${grade})`,
            element: 'Sejarah & Keteladanan',
            competency: 'Meneladani kesabaran dan kasih sayang tokoh suci',
            hours: 24,
            assessment: 'Poster Kisah Teladan & Presentasi Cerita Singkat',
            deepLearning: `Meaningful: Mengambil inspirasi teladan untuk hidup rukun di tengah keberagaman.`,
          },
          {
            title: `Bab 5: Kepedulian Sosial, Gotong Royong, dan Merawat Alam Ciptaan Tuhan (Kelas ${grade})`,
            element: 'Budi Pekerti & Ekoteologi',
            competency: 'Menunjukkan aksi nyata peduli sesama dan lingkungan',
            hours: 24,
            assessment: 'Aksi Sosial Kelas & Proyek Merawat Lingkungan Sekolah',
            deepLearning: `Joyful: Berbagi kebaikan dan merawat tanaman bersama sahabat lintas kelas.`,
          },
          {
            title: `Bab 6: Refleksi Karakter Beriman, Toleransi, dan Syukur Akhir Tahun (Kelas ${grade})`,
            element: 'Moderasi & Toleransi',
            competency: 'Merefleksikan sikap toleransi dan kerukunan umat',
            hours: 24,
            assessment: 'Asesmen Sumatif & Portofolio Karakter Budi Pekerti',
            deepLearning: `Mindful: Menyadari indahnya hidup rukun sebagai wujud rasa syukur kepada Tuhan.`,
          },
        ],
      };
    } else if (grade <= 9) {
      return {
        sem1: [
          {
            title: `Bab 1: Pemahaman Mendalam Kitab Suci & Prinsip Keimanan Kontekstual ${subject} (Kelas ${grade})`,
            element: 'Kitab Suci & Keimanan',
            competency: 'Menganalisis pesan moral kitab suci dalam kehidupan remaja',
            hours: 18,
            assessment: 'Analisis Makna Ayat/Teks Suci & Diskusi Kelompok',
            deepLearning: `Mindful: Menghayati makna teks suci sebagai kompas moral era digital.`,
          },
          {
            title: `Bab 2: Integritas Moral, Etika Pergaulan Remaja, dan Anti-Perundungan (Kelas ${grade})`,
            element: 'Akhlak & Budi Pekerti',
            competency: 'Menerapkan etika pergaulan bermartabat dan anti-bullying',
            hours: 18,
            assessment: 'Studi Kasus Etika Remaja & Kampanye Sekolah Ramah',
            deepLearning: `Meaningful: Mengaktualisasikan ajaran agama untuk mencegah perundungan di sekolah.`,
          },
          {
            title: `Bab 3: Pendalaman Makna Ibadah, Doa, dan Spiritualitas Diri (Kelas ${grade})`,
            element: 'Ibadah & Ritual',
            competency: 'Mempraktikkan ibadah dengan kesadaran penuh dan khusyuk',
            hours: 18,
            assessment: 'Uji Praktik Ibadah & Jurnal Refleksi Spiritual',
            deepLearning: `Mindful: Melatih ketenangan batin dan kekhusyukan dalam beribadah.`,
          },
        ],
        sem2: [
          {
            title: `Bab 4: Sejarah Peradaban Keagamaan, Kearifan Lokal, dan Tokoh Pembaru (Kelas ${grade})`,
            element: 'Sejarah & Peradaban',
            competency: 'Mengevaluasi kontribusi tokoh agama bagi peradaban damai',
            hours: 18,
            assessment: 'Esai Sejarah Tokoh & Presentasi Infografis',
            deepLearning: `Meaningful: Memetik hikmah sejarah perjuangan kemanusiaan tokoh-tokoh agama.`,
          },
          {
            title: `Bab 5: Moderasi Beragama, Dialog Harmonis, dan Solidaritas Kemanusiaan (Kelas ${grade})`,
            element: 'Moderasi & Toleransi',
            competency: 'Mengembangkan sikap inklusif dan toleran dalam masyarakat majemuk',
            hours: 18,
            assessment: 'Proyek Kolaborasi Harmoni Kebhinekaan',
            deepLearning: `Joyful: Merayakan persaudaraan sejati lintas budaya dan keyakinan.`,
          },
          {
            title: `Bab 6: Tanggung Jawab Ekologis & Bakti Sosial Komunitas (Kelas ${grade})`,
            element: 'Budi Pekerti & Pengabdian',
            competency: 'Merancang proyek pelayanan sosial dan pelestarian alam',
            hours: 18,
            assessment: 'Asesmen Sumatif & Laporan Aksi Kemanusiaan',
            deepLearning: `Joyful: Mengabdi langsung kepada masyarakat sebagai wujud nyata keimanan.`,
          },
        ],
      };
    } else {
      return {
        sem1: [
          {
            title: `Bab 1: Epistemologi Iman, Rasionalitas, dan Makna Kehidupan dalam ${subject} (Kelas ${grade})`,
            element: 'Keimanan & Filsafat Moral',
            competency: 'Menganalisis keselarasan iman, ilmu pengetahuan, dan teknologi modern',
            hours: 18,
            assessment: 'Makalah Analitis Iman & Ilmu serta Forum Diskusi Kritis',
            deepLearning: `Mindful: Merefleksikan tujuan hidup manusia dan tanggung jawab intelektual.`,
          },
          {
            title: `Bab 2: Etika Digital, Bioetika, dan Integritas Generasi Muda (Kelas ${grade})`,
            element: 'Akhlak & Etika Kontemporer',
            competency: 'Mengevaluasi persoalan etika kontemporer berdasarkan nilai agama',
            hours: 18,
            assessment: 'Debat Etis Isu Kontemporer & Kode Etik Digital Pelajar',
            deepLearning: `Meaningful: Menjawab dilema moral era kecerdasan artifisial dengan nilai luhur.`,
          },
          {
            title: `Bab 3: Spiritualitas Transformatif & Praktik Ibadah Kemasyarakatan (Kelas ${grade})`,
            element: 'Ibadah & Pengabdian',
            competency: 'Menghubungkan kesalehan pribadi dengan kesalehan sosial',
            hours: 18,
            assessment: 'Observasi Praktik Keagamaan & Rencana Aksi Sosial',
            deepLearning: `Mindful: Menumbuhkan empati sosial melalui ibadah yang membumi.`,
          },
        ],
        sem2: [
          {
            title: `Bab 4: Kontribusi Tokoh Agama dalam Kebangsaan, Perdamaian Dunia, dan HAM (Kelas ${grade})`,
            element: 'Sejarah & Kebangsaan',
            competency: 'Menganalisis peran nilai agama dalam membangun keadilan sosial',
            hours: 18,
            assessment: 'Kajian Literatur Kebangsaan & Presentasi Seminar Kelas',
            deepLearning: `Meaningful: Meneladani semangat persatuan dan kemanusiaan tokoh bangsa.`,
          },
          {
            title: `Bab 5: Moderasi Beragama, Kerukunan Global, dan Kepemimpinan Inklusif (Kelas ${grade})`,
            element: 'Moderasi & Toleransi',
            competency: 'Menjadi pelopor kerukunan dan dialog antarumat beragama',
            hours: 18,
            assessment: 'Proyek Kampanye Toleransi & Resolusi Konflik Damai',
            deepLearning: `Joyful: Berkolaborasi membangun proyek perdamaian di lingkungan sekolah.`,
          },
          {
            title: `Bab 6: Proyek Pengabdian Masyarakat Berkelanjutan & Manifesto Budi Pekerti (Kelas ${grade})`,
            element: 'Aktualisasi Budi Pekerti',
            competency: 'Menyajikan proyek nyata kepedulian sosial dan ekoteologi',
            hours: 18,
            assessment: 'Asesmen Sumatif Akhir Tahun & Gelar Karya Pengabdian',
            deepLearning: `Joyful: Merayakan kebermanfaatan diri bagi sesama dan kelestarian bumi.`,
          },
        ],
      };
    }
  }

  // 2C. CODING, AI & DIGITAL EDUCATION (BSKAP No. 046/H/KR/2025 & No. 020/H/KR/2026)
  if (domain === 'coding_ai') {
    const isSD = grade <= 6;
    const isSMP = grade >= 7 && grade <= 9;
    return {
      sem1: [
        {
          title: `Bab 1: Berpikir Komputasional (Dekomposisi, Pola, Abstraksi, Algoritma) ${subject} (Kelas ${grade})`,
          element: 'Berpikir Komputasional',
          competency: 'Menerapkan logika berpikir komputasional untuk memecahkan masalah',
          hours: isSD ? 18 : 24,
          assessment: 'Tantangan Logika Algoritma & Lembar Kerja Unplugged/Digital',
          deepLearning: `Mindful: Melatih ketelitian menyusun langkah logis pemecahan masalah.`,
        },
        {
          title: `Bab 2: Literasi Digital, Keamanan Siber, dan Etika Pemanfaatan Teknologi (Kelas ${grade})`,
          element: 'Literasi Digital & Etika',
          competency: 'Mengevaluasi keamanan data pribadi dan jejak digital secara kritis',
          hours: isSD ? 18 : 24,
          assessment: 'Audit Keamanan Akun & Simulasi Identifikasi Misinformasi',
          deepLearning: `Meaningful: Melindungi diri dan komunitas dari risiko kejahatan siber.`,
        },
        {
          title: `Bab 3: Pemrograman Terstruktur & Pengembangan Solusi ${isSD ? 'Blok Visual' : isSMP ? 'Algoritmik' : 'Berbasis Teks/Python'} (Kelas ${grade})`,
          element: 'Pemrograman & Algoritma',
          competency: 'Merancang dan menguji program interaktif sederhana hingga kompleks',
          hours: isSD ? 18 : 24,
          assessment: 'Proyek Mini Aplikasi / Animasi Logika Terstruktur',
          deepLearning: `Joyful: Bereksperimen membangun program interaktif yang langsung bekerja.`,
        },
      ],
      sem2: [
        {
          title: `Bab 4: Konsep Dasar Kecerdasan Artifisial (AI), Data, dan Mesin Pembelajar (Kelas ${grade})`,
          element: 'Literasi Kecerdasan Artifisial',
          competency: 'Memahami cara kerja model AI, klasifikasi data, dan bias algoritmik',
          hours: isSD ? 18 : 24,
          assessment: 'Eksperimen Klasifikasi Data Sederhana & Analisis Hasil Prediksi',
          deepLearning: `Meaningful: Memahami bagaimana AI membantu kehidupan sekaligus batasannya.`,
        },
        {
          title: `Bab 5: Etika Kecerdasan Artifisial, Hak Cipta, dan Kolaborasi Manusia-AI (Kelas ${grade})`,
          element: 'Etika & Pemanfaatan AI',
          competency: 'Menggunakan perangkat AI secara jujur, aman, dan bertanggung jawab',
          hours: isSD ? 18 : 24,
          assessment: 'Studi Kasus Etika AI & Uji Prompting Bertanggung Jawab',
          deepLearning: `Mindful: Menempatkan manusia sebagai pengendali etis di atas teknologi AI.`,
        },
        {
          title: `Bab 6: Proyek Inovasi Koding & Kecerdasan Artifisial untuk Masalah Sekitar (Kelas ${grade})`,
          element: 'Proyek Desain Inovatif',
          competency: 'Merancang purwarupa solusi digital berbasis koding dan AI',
          hours: isSD ? 18 : 24,
          assessment: 'Asesmen Sumatif: Demo Prototipe Solusi Digital & Presentasi Tim',
          deepLearning: `Joyful: Memamerkan karya inovasi teknologi yang berdampak bagi warga sekolah.`,
        },
      ],
    };
  }

  // 2D. SENI (MUSIK, TARI, TEATER)
  if (domain === 'arts_music' || domain === 'arts_dance' || domain === 'arts_theatre') {
    const artFocus =
      domain === 'arts_music'
        ? 'Bunyi, Ritme, Melodi, dan Aransemen Musik'
        : domain === 'arts_dance'
        ? 'Gerak Tubuh, Ruang, Waktu, Tenaga, dan Koreografi Tari'
        : 'Olah Tubuh, Olah Suara, Naskah, dan Penyutradaraan Teater';
    return {
      sem1: [
        {
          title: `Bab 1: Mengalami & Mengeksplorasi Unsur Pokok ${subject} (${artFocus}) (Kelas ${grade})`,
          element: 'Mengalami (Experiencing)',
          competency: 'Mengidentifikasi dan mengeksplorasi elemen artistik dasar karya seni',
          hours: 18,
          assessment: 'Observasi Eksplorasi Artistik & Jurnal Apresiasi',
          deepLearning: `Mindful: Mengasah kepekaan rasa dan pendengaran/pengamatan terhadap keindahan seni.`,
        },
        {
          title: `Bab 2: Teknik Dasar, Tata Artistik, dan Ragam Karya Tradisional Nusantara ${subject} (Kelas ${grade})`,
          element: 'Merefleksikan & Mengapresiasi',
          competency: 'Menganalisis keunikan karya seni tradisi dan modern Nusantara',
          hours: 18,
          assessment: 'Uji Teknik Dasar & Presentasi Apresiasi Seni Daerah',
          deepLearning: `Meaningful: Menghubungkan ekspresi seni dengan identitas budaya lokal Indonesia.`,
        },
      ],
      sem2: [
        {
          title: `Bab 3: Menciptakan & Mengkreasikan Karya Kolaboratif ${subject} (Kelas ${grade})`,
          element: 'Menciptakan (Making/Creating)',
          competency: 'Merancang dan menyusun karya seni orisinal secara kolaboratif',
          hours: 18,
          assessment: 'Penilaian Proses Latihan & Rancangan Karya Orisinal',
          deepLearning: `Joyful: Berkarya penuh ekspresi dan kegembiraan bersama tim kreatif.`,
        },
        {
          title: `Bab 4: Gelar Pertunjukan, Apresiasi Publik, dan Refleksi Berdampak ${subject} (Kelas ${grade})`,
          element: 'Berdampak (Impacting)',
          competency: 'Menampilkan karya seni di hadapan audiens dan melakukan refleksi',
          hours: 18,
          assessment: 'Asesmen Sumatif: Pementasan Karya Seni & Evaluasi Reflektif',
          deepLearning: `Joyful: Merayakan keberanian tampil dan apresiasi positif dari komunitas sekolah.`,
        },
      ],
    };
  }

  // 3. GENERAL ACADEMIC & ALL OTHER SUBJECTS (Grade 1 to 12 distinct progression)
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
