/**
 * AI Curriculum Generation Engine
 * Generates rich, comprehensive, official Kurikulum Merdeka & Deep Learning documents
 * (Mindful, Meaningful, Joyful Learning) with ABCD TP formulations, HOTS rubrics, and detailed tables.
 */

import { StorageService } from './storage';

export interface GenerateCurriculumParams {
  toolType?: string;
  docType?: string;
  subject?: string;
  level?: string;
  grade?: number | string;
  phase?: string;
  semester?: string;
  academicYear?: string;
  topic?: string;
  meetingCount?: number;
  hoursPerMeeting?: number;
  minutesPerJP?: number;
  totalJP?: number;
  modelOption?: string;
  modulOption?: string;
  manualTP?: string;
  useManualTP?: boolean;
  subTopics?: string[];
  selectedTPs?: any[];
  kktpScope?: 'bab' | 'semester' | 'year';
  customInstructions?: string;
  customPrompt?: string;
  cpText?: string;
  distributionData?: any;
  kalenderData?: any;
  schoolProfile?: any;
  teacherName?: string;
  teacherNip?: string;
  headmasterName?: string;
  headmasterNip?: string;
  schoolName?: string;
  city?: string;
  useCustomFormat?: boolean;
  customFormatNotes?: string;
  customFormatFile?: {
    name: string;
    size?: number;
    type?: string;
    mimeType?: string;
    base64?: string;
    extractedText?: string;
  } | null;
}

/**
 * Standar Baku Resmi Lembar Pengesahan Dokumen Kurikulum Merdeka & Deep Learning
 * Rapi, proporsional, simetris, posisi presisi sesuai tata naskah dinas pendidikan:
 * - Kiri: Mengetahui, Kepala Satuan Pendidikan, Nama Sekolah, Ruang TTD, Nama Jelas Bergaris Bawah, NIP
 * - Kanan: Kota, Tanggal Penetapan Resmi, Guru Mata Pelajaran, Ruang TTD, Nama Jelas Bergaris Bawah, NIP
 */
export function buildOfficialLembarPengesahan(options: {
  title: string;
  schoolName: string;
  city: string;
  headmasterName: string;
  headmasterNip: string;
  teacherName: string;
  teacherNip: string;
  dateStr?: string;
  academicYear?: string;
  subject?: string;
  grade?: string | number;
  phase?: string;
  customNote?: string;
}): string {
  const dateText = options.dateStr || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const yearText = options.academicYear || '2025/2026';
  const cleanTitle = options.title.toUpperCase().replace(/^LEMBAR PENGESAHAN\s*/, '');
  const note = options.customNote || `Dokumen **${cleanTitle}** mata pelajaran **${options.subject || 'Mata Pelajaran'}** (${options.phase || 'Fase'} / Kelas ${options.grade || '10'}) ini telah ditelaah, diverifikasi, dan disahkan oleh Kepala Satuan Pendidikan untuk diberlakukan secara resmi sebagai pedoman pelaksanaan Kegiatan Belajar Mengajar (KBM) pada Tahun Pelajaran **${yearText}**.`;

  return `
---

### LEMBAR PENGESAHAN ${cleanTitle}
${note}

Ditetapkan di : **${options.city}**  
Pada tanggal : **${dateText}**

<table class="signature-table" style="width: 100%; border: none !important; border-collapse: collapse; margin-top: 30px; font-size: 10pt; line-height: 1.5;">
  <tr style="border: none !important;">
    <td style="width: 50%; border: none !important; text-align: center; vertical-align: top; padding: 4px 16px;">
      Mengetahui,<br/>
      <strong>Kepala Satuan Pendidikan</strong><br/>
      <strong>${options.schoolName}</strong>
      <div style="height: 65px;"></div>
      <strong><u>${options.headmasterName}</u></strong><br/>
      <span>NIP. ${options.headmasterNip}</span>
    </td>
    <td style="width: 50%; border: none !important; text-align: center; vertical-align: top; padding: 4px 16px;">
      ${options.city}, ${dateText}<br/>
      <strong>Guru Mata Pelajaran</strong><br/>
      <strong>${options.subject || ''} Kelas ${options.grade || ''}</strong>
      <div style="height: 65px;"></div>
      <strong><u>${options.teacherName}</u></strong><br/>
      <span>NIP. ${options.teacherNip}</span>
    </td>
  </tr>
</table>
`;
}

export function generateExpertCurriculumDocument(
  docTypeOrParams: string | GenerateCurriculumParams,
  maybeParams?: GenerateCurriculumParams
): string {
  const params: GenerateCurriculumParams =
    typeof docTypeOrParams === 'string'
      ? { ...(maybeParams || {}), docType: docTypeOrParams, toolType: docTypeOrParams }
      : docTypeOrParams;

  const rawType = params.toolType || params.docType || 'modul_ajar';
  const docType = rawType.toString().toLowerCase().replace(/^ai_/, '');

  if (docType === 'bundle' || docType === 'perangkat_lengkap') {
    return generateFullCurriculumBundle(params);
  }

  const subject = params.subject || 'Mata Pelajaran';
  const syncedContext = StorageService.getSyncedCurriculumContext(subject, params.grade, params.level);
  const schoolProfile = syncedContext.schoolProfile;

  const level = params.level || syncedContext.level || 'SMA';
  const grade = params.grade || syncedContext.grade || (level === 'SD' ? 4 : level === 'SMP' ? 7 : 10);
  const phase = params.phase || syncedContext.phase || (grade === 10 ? 'Fase E' : Number(grade) > 10 ? 'Fase F' : Number(grade) >= 7 ? 'Fase D' : Number(grade) >= 4 ? 'Fase B/C' : 'Fase A');
  const rawSemester = String(params.semester || 'Ganjil').trim();
  const isFullYear = rawSemester === '1 Tahun' || rawSemester.toLowerCase().includes('tahun') || rawSemester.toLowerCase().includes('all') || rawSemester.toLowerCase().includes('semua');
  const isSem2Only = !isFullYear && (rawSemester === 'Semester 2' || rawSemester.toLowerCase().includes('genap') || rawSemester === '2');
  const isSem1Only = !isFullYear && !isSem2Only;

  const resolvedSemesterLabel = isFullYear
    ? '1 Tahun Penuh (Semester 1 & 2)'
    : isSem2Only
    ? 'Semester 2 (Genap)'
    : 'Semester 1 (Ganjil)';

  const semester = resolvedSemesterLabel;
  
  const distributionData = params.distributionData || syncedContext.activeMaster;
  const sem1Materials = (distributionData?.materialsSem1 && distributionData.materialsSem1.length > 0) ? distributionData.materialsSem1 : syncedContext.sem1Materials;
  const sem2Materials = (distributionData?.materialsSem2 && distributionData.materialsSem2.length > 0) ? distributionData.materialsSem2 : syncedContext.sem2Materials;
  const activeMaterials = isFullYear
    ? (sem1Materials.length > 0 || sem2Materials.length > 0 ? [...sem1Materials, ...sem2Materials] : [])
    : isSem2Only
    ? sem2Materials
    : sem1Materials;
  const matchedMaterial = params.topic ? activeMaterials.find(m => 
    (m.essentialMaterial && (m.essentialMaterial.trim().toLowerCase() === params.topic.trim().toLowerCase() || params.topic.toLowerCase().includes(m.essentialMaterial.toLowerCase()) || m.essentialMaterial.toLowerCase().includes(params.topic.toLowerCase()))) ||
    (m.tpName && (m.tpName.toLowerCase().includes(params.topic.toLowerCase()) || params.topic.toLowerCase().includes(m.tpName.toLowerCase())))
  ) : null;
  const currentMaterial = matchedMaterial || distributionData?.currentSelectedMaterial || (activeMaterials.length > 0 ? activeMaterials[0] : null);

  const topic = params.topic || (currentMaterial?.essentialMaterial) || (currentMaterial?.tpName) || `Konsep Pokok dan Terapan ${subject}`;
  const modelOption = params.modelOption || params.modulOption || 'lengkap';
  const teacherName = params.teacherName || params.schoolProfile?.teacherName || params.distributionData?.teacherName || schoolProfile.teacherName || syncedContext.teacherName || 'Aspian La Ode Madimu, S.Pd. Gr';
  const teacherNip = params.teacherNip || params.schoolProfile?.teacherNip || (params.distributionData as any)?.teacherNip || schoolProfile.teacherNip || syncedContext.teacherNip || '19900822 201801 1 004';
  const headmasterName = params.headmasterName || params.schoolProfile?.headmasterName || schoolProfile.headmasterName || (schoolProfile as any).principalName || syncedContext.headmasterName || 'Drs. M. Taher, M.Pd.';
  const headmasterNip = params.headmasterNip || params.schoolProfile?.headmasterNip || schoolProfile.headmasterNip || (schoolProfile as any).principalNip || syncedContext.headmasterNip || '19700315 199602 1 002';
  const schoolName = params.schoolName || params.schoolProfile?.schoolName || params.distributionData?.schoolName || schoolProfile.schoolName || syncedContext.schoolName || 'SMA NEGERI 30 MALUKU TENGAH';
  const city = params.city || params.schoolProfile?.city || schoolProfile.city || syncedContext.city || 'Maluku Tengah';

  const useCustomFormat = params.useCustomFormat;
  const customFormatNotes = params.customFormatNotes;
  const customFormatFile = params.customFormatFile;
  const manualTP = params.manualTP?.trim();
  const resolvedAcademicYear = params.academicYear || params.kalenderData?.tahunAjaran || schoolProfile.academicYear || syncedContext.academicYear || "2025/2026";
  const yearMatch = resolvedAcademicYear.match(/(\d{4})\s*[\/-]\s*(\d{4})/);
  const startYear = yearMatch ? parseInt(yearMatch[1], 10) : 2025;
  const endYear = yearMatch ? parseInt(yearMatch[2], 10) : startYear + 1;

  // Meeting parameters
  const meetingCount = Number(params.meetingCount) > 0 ? Number(params.meetingCount) : 2;
  const defaultMinutesPerJp = level === 'SD' ? 35 : level === 'SMP' ? 40 : 45;
  const minutesPerJP = Number(params.minutesPerJP) > 0 ? Number(params.minutesPerJP) : defaultMinutesPerJp;
  const defaultJpPerMeeting = level === 'SD' ? 2 : level === 'SMP' ? 2 : 3;
  const hoursPerMeeting = Number(params.hoursPerMeeting) > 0 ? Number(params.hoursPerMeeting) : defaultJpPerMeeting;
  const totalJP = params.totalJP || (meetingCount * hoursPerMeeting);
  const meetingTotalMinutes = hoursPerMeeting * minutesPerJP;

  const tpCode = currentMaterial?.tpCode || `TP.${grade}.1`;
  const tpTitle = currentMaterial?.tpName || `Peserta didik mampu memahami, menganalisis, dan memecahkan permasalahan kontekstual terkait ${topic} secara kritis, mandiri, dan bergotong royong.`;
  const allocatedHours = currentMaterial?.allocatedHours || 6;
  const subTopics: string[] = (currentMaterial as any)?.subTopics || [];

  const generateCoreDoc = (): string => {
    switch (docType) {
    case 'analisis_cp': {
      const jpPerWk = params.distributionData?.jpPerWeek || (level === 'SD' ? 4 : level === 'SMP' ? 3 : 3);
      
      let sumSem1Jp = 0;
      let sumSem1Meetings = 0;
      let sem1RowIndex = 0;
      const sem1RowsArr: string[] = [];
      const sem1MatsToUse = sem1Materials.length > 0 ? sem1Materials : [
        { essentialMaterial: `Hakikat ${subject}, Konsep Dasar, dan Pengukurannya`, allocatedHours: 18, tpCount: 3, semester: 1 },
        { essentialMaterial: `Energi, Perubahan Sistem, dan Aplikasinya`, allocatedHours: 18, tpCount: 2, semester: 1 },
      ];

      sem1MatsToUse.forEach((mat, mIdx) => {
        const babNum = mIdx + 1;
        const babName = mat.essentialMaterial || mat.tpName || `Bab ${babNum}`;
        const hours = Number(mat.allocatedHours) || 18;
        const numTPs = Number(mat.tpCount) > 0 ? Number(mat.tpCount) : (mat.tpName ? 1 : (mIdx % 2 === 0 ? 3 : 2));
        const totalMeetings = mat.meetingCount || Math.max(1, Math.round(hours / jpPerWk));
        sumSem1Jp += hours;
        sumSem1Meetings += totalMeetings;

        const baseCode = mat.tpCode || `TP.${grade}.1.${babNum}`;
        const elem = mat.elementName || (mIdx % 2 === 0 ? 'Pemahaman Konseptual' : 'Keterampilan Proses');
        const assess = mat.assessmentStrategy || 'Asesmen Formatif (LKPD & Kuis)';
        const method = mat.deepLearningMethod || 'Inquiry & Mindful Exploration';

        for (let t = 1; t <= numTPs; t++) {
          sem1RowIndex++;
          const currentCode = baseCode.includes('.') && baseCode.split('.').length >= 3 ? `${baseCode.substring(0, baseCode.lastIndexOf('.'))}.${t}` : `${baseCode}.${t}`;
          
          const tpDesc = t === 1 && mat.tpName && !mat.tpName.includes('Peserta didik dapat') 
            ? mat.tpName 
            : (t === 1 
                ? `Peserta didik mampu mengidentifikasi karakteristik, konsep dasar, dan komponen utama terkait ${babName} secara kritis.` 
                : t === 2 
                  ? `Peserta didik mampu menganalisis hubungan sebab-akibat, pola keteraturan, dan variabel ilmiah pada ${babName}.` 
                  : t === 3 
                    ? `Peserta didik mampu merancang penyelidikan, mengolah data empiris, dan memecahkan permasalahan kontekstual ${babName}.` 
                    : `Peserta didik mampu merefleksikan, mengkreasikan solusi inovatif, dan mengomunikasikan hasil kajian ${babName}.`);

          if (t === 1) {
            sem1RowsArr.push(`| **${sem1RowIndex}** | **${currentCode}** | *${elem}* — ${tpDesc} | **Bab ${babNum}: ${babName}** | **${hours} JP** | **${totalMeetings} Pertemuan** | ${assess} • *${method}* |`);
          } else {
            sem1RowsArr.push(`| **${sem1RowIndex}** | **${currentCode}** | *${elem}* — ${tpDesc} | ^ | ^ | ^ | ${assess} • *${method}* |`);
          }
        }
      });

      const sem1Rows = sem1RowsArr.join('\n');
      const finalSem1JP = sem1MatsToUse.length > 0 ? sumSem1Jp : 54;
      const finalSem1Meetings = sem1MatsToUse.length > 0 ? sumSem1Meetings : 18;

      let sumSem2Jp = 0;
      let sumSem2Meetings = 0;
      let sem2RowIndex = 0;
      const sem2RowsArr: string[] = [];
      const sem2MatsToUse = sem2Materials.length > 0 ? sem2Materials : [
        { essentialMaterial: `Gejala Fenomena Lingkungan dan Pemanasan Global`, allocatedHours: 18, tpCount: 3, semester: 2 },
        { essentialMaterial: `Aksi Nyata Mitigasi Perubahan Iklim`, allocatedHours: 18, tpCount: 2, semester: 2 },
      ];

      sem2MatsToUse.forEach((mat, mIdx) => {
        const babNum = sem1MatsToUse.length + mIdx + 1;
        const babName = mat.essentialMaterial || mat.tpName || `Bab ${babNum}`;
        const hours = Number(mat.allocatedHours) || 18;
        const numTPs = Number(mat.tpCount) > 0 ? Number(mat.tpCount) : (mat.tpName ? 1 : (mIdx % 2 === 0 ? 3 : 2));
        const totalMeetings = mat.meetingCount || Math.max(1, Math.round(hours / jpPerWk));
        sumSem2Jp += hours;
        sumSem2Meetings += totalMeetings;

        const baseCode = mat.tpCode || `TP.${grade}.2.${mIdx + 1}`;
        const elem = mat.elementName || (mIdx % 2 === 0 ? 'Pemahaman Konseptual' : 'Aplikasi & Refleksi Kritis');
        const assess = mat.assessmentStrategy || 'Asesmen Formatif (Tes Tulis & Diskusi)';
        const method = mat.deepLearningMethod || 'Meaningful Inquiry & Joyful Project';

        for (let t = 1; t <= numTPs; t++) {
          sem2RowIndex++;
          const currentCode = baseCode.includes('.') && baseCode.split('.').length >= 3 ? `${baseCode.substring(0, baseCode.lastIndexOf('.'))}.${t}` : `${baseCode}.${t}`;
          
          const tpDesc = t === 1 && mat.tpName && !mat.tpName.includes('Peserta didik dapat') 
            ? mat.tpName 
            : (t === 1 
                ? `Peserta didik mampu mengidentifikasi karakteristik, konsep dasar, dan komponen utama terkait ${babName} secara kritis.` 
                : t === 2 
                  ? `Peserta didik mampu menganalisis hubungan sebab-akibat, pola keteraturan, dan variabel ilmiah pada ${babName}.` 
                  : t === 3 
                    ? `Peserta didik mampu merancang penyelidikan, mengolah data empiris, dan memecahkan permasalahan kontekstual ${babName}.` 
                    : `Peserta didik mampu merefleksikan, mengkreasikan solusi inovatif, dan mengomunikasikan hasil kajian ${babName}.`);

          if (t === 1) {
            sem2RowsArr.push(`| **${sem2RowIndex}** | **${currentCode}** | *${elem}* — ${tpDesc} | **Bab ${babNum}: ${babName}** | **${hours} JP** | **${totalMeetings} Pertemuan** | ${assess} • *${method}* |`);
          } else {
            sem2RowsArr.push(`| **${sem2RowIndex}** | **${currentCode}** | *${elem}* — ${tpDesc} | ^ | ^ | ^ | ${assess} • *${method}* |`);
          }
        }
      });

      const sem2Rows = sem2RowsArr.join('\n');
      const finalSem2JP = sem2MatsToUse.length > 0 ? sumSem2Jp : 54;
      const finalSem2Meetings = sem2MatsToUse.length > 0 ? sumSem2Meetings : 18;
      const totalYearJP = finalSem1JP + finalSem2JP;
      const totalTPCount = sem1RowIndex + sem2RowIndex;

      let sectionETables = '';
      if (isSem1Only) {
        sectionETables = `#### 1. Distribusi Capaian Pembelajaran & Materi Semester 1 (Ganjil)
| No | Kode TP | Elemen CP & Rumusan Tujuan Pembelajaran (TP) | Ruang Lingkup Materi Pokok | Alokasi Waktu | Jml Pertemuan | Strategi Asesmen & Model Deep Learning |
| :-: | :---: | :--- | :--- | :-: | :-: | :--- |
${sem1Rows}
| - | - | *Cadangan Alokasi Jam & Evaluasi Formatif/Sumatif Tengah & Akhir Semester* | Penguatan, ASTS & ASAS Ganjil | **6 JP** | 2 Pertemuan | Asesmen Sumatif & Umpan Balik |
| **TOTAL** | | **Total Alokasi Beban KBM Semester 1 (Ganjil)** | | **${finalSem1JP + 6} JP** | **${finalSem1Meetings + 2} Pertemuan** | **100% Selaras Kaldik & Kurikulum** |

#### 2. Rekapitulasi Alokasi Waktu Semester 1 (Ganjil)
| Komponen Distribusi Kurikulum | Semester 1 (Ganjil) | Keterangan & Rujukan |
| :--- | :---: | :--- |
| **Jumlah Tujuan Pembelajaran (TP)** | ${sem1Materials.length > 0 ? sem1Materials.length : 3} TP | Pemetaan Master CP & Modul Semester 1 |
| **Alokasi Jam Tatap Muka Efektif** | ${finalSem1JP} JP | KBM Berdiferensiasi & Deep Learning |
| **Alokasi Jam Cadangan & Sumatif** | 6 JP | ASTS, ASAS Ganjil & Penguatan |
| **Total Jam Pelajaran (JP)** | **${finalSem1JP + 6} JP** | Beban Standar Semester Ganjil |
| **Beban Tatap Muka per Minggu** | ${jpPerWk} JP / Minggu | Matriks Jadwal Mingguan Sekolah |
| **Estimasi Pekan Efektif KBM (RBE)** | ~18 Pekan | Sinkronisasi Kalender Pendidikan |`;
      } else if (isSem2Only) {
        sectionETables = `#### 1. Distribusi Capaian Pembelajaran & Materi Semester 2 (Genap)
| No | Kode TP | Elemen CP & Rumusan Tujuan Pembelajaran (TP) | Ruang Lingkup Materi Pokok | Alokasi Waktu | Jml Pertemuan | Strategi Asesmen & Model Deep Learning |
| :-: | :---: | :--- | :--- | :-: | :-: | :--- |
${sem2Rows}
| - | - | *Cadangan Alokasi Jam & Evaluasi Formatif/Sumatif Akhir Tahun Pelajaran* | Penguatan, ASAS Genap & Kenaikan | **6 JP** | 2 Pertemuan | Asesmen Sumatif & Pameran Hasil |
| **TOTAL** | | **Total Alokasi Beban KBM Semester 2 (Genap)** | | **${finalSem2JP + 6} JP** | **${finalSem2Meetings + 2} Pertemuan** | **100% Selaras Kaldik & Kurikulum** |

#### 2. Rekapitulasi Alokasi Waktu Semester 2 (Genap)
| Komponen Distribusi Kurikulum | Semester 2 (Genap) | Keterangan & Rujukan |
| :--- | :---: | :--- |
| **Jumlah Tujuan Pembelajaran (TP)** | ${sem2Materials.length > 0 ? sem2Materials.length : 3} TP | Pemetaan Master CP & Modul Semester 2 |
| **Alokasi Jam Tatap Muka Efektif** | ${finalSem2JP} JP | KBM Berdiferensiasi & Deep Learning |
| **Alokasi Jam Cadangan & Sumatif** | 6 JP | ASAS Genap & Pameran Hasil Belajar |
| **Total Jam Pelajaran (JP)** | **${finalSem2JP + 6} JP** | Beban Standar Semester Genap |
| **Beban Tatap Muka per Minggu** | ${jpPerWk} JP / Minggu | Matriks Jadwal Mingguan Sekolah |
| **Estimasi Pekan Efektif KBM (RBE)** | ~18 Pekan | Sinkronisasi Kalender Pendidikan |`;
      } else {
        sectionETables = `#### 1. Distribusi Capaian Pembelajaran & Materi Semester 1 (Ganjil)
| No | Kode TP | Elemen CP & Rumusan Tujuan Pembelajaran (TP) | Ruang Lingkup Materi Pokok | Alokasi Waktu | Jml Pertemuan | Strategi Asesmen & Model Deep Learning |
| :-: | :---: | :--- | :--- | :-: | :-: | :--- |
${sem1Rows}
| - | - | *Cadangan Alokasi Jam & Evaluasi Formatif/Sumatif Tengah & Akhir Semester* | Penguatan, ASTS & ASAS Ganjil | **6 JP** | 2 Pertemuan | Asesmen Sumatif & Umpan Balik |
| **TOTAL** | | **Total Alokasi Beban KBM Semester 1 (Ganjil)** | | **${finalSem1JP + 6} JP** | **${finalSem1Meetings + 2} Pertemuan** | **100% Selaras Kaldik & Kurikulum** |

#### 2. Distribusi Capaian Pembelajaran & Materi Semester 2 (Genap)
| No | Kode TP | Elemen CP & Rumusan Tujuan Pembelajaran (TP) | Ruang Lingkup Materi Pokok | Alokasi Waktu | Jml Pertemuan | Strategi Asesmen & Model Deep Learning |
| :-: | :---: | :--- | :--- | :-: | :-: | :--- |
${sem2Rows}
| - | - | *Cadangan Alokasi Jam & Evaluasi Formatif/Sumatif Akhir Tahun Pelajaran* | Penguatan, ASAS Genap & Kenaikan | **6 JP** | 2 Pertemuan | Asesmen Sumatif & Pameran Hasil |
| **TOTAL** | | **Total Alokasi Beban KBM Semester 2 (Genap)** | | **${finalSem2JP + 6} JP** | **${finalSem2Meetings + 2} Pertemuan** | **100% Selaras Kaldik & Kurikulum** |

#### 3. Rekapitulasi Matriks Distribusi Alokasi Waktu CP 1 Tahun Pelajaran
| Komponen Distribusi Kurikulum | Semester 1 (Ganjil) | Semester 2 (Genap) | Total 1 Tahun Pelajaran | Keterangan & Rujukan |
| :--- | :---: | :---: | :---: | :--- |
| **Jumlah Tujuan Pembelajaran (TP)** | ${sem1Materials.length > 0 ? sem1Materials.length : 3} TP | ${sem2Materials.length > 0 ? sem2Materials.length : 3} TP | **${totalTPCount} TP** | Pemetaan Master CP & Modul |
| **Alokasi Jam Tatap Muka Efektif** | ${finalSem1JP} JP | ${finalSem2JP} JP | **${finalSem1JP + finalSem2JP} JP** | KBM Berdiferensiasi & Deep Learning |
| **Alokasi Jam Cadangan & Sumatif** | 6 JP | 6 JP | **12 JP** | ASTS, ASAS, & Evaluasi Mutu |
| **Total Jam Pelajaran (JP)** | **${finalSem1JP + 6} JP** | **${finalSem2JP + 6} JP** | **${totalYearJP + 12} JP** | Beban Standar Kurikulum Merdeka |
| **Beban Tatap Muka per Minggu** | ${jpPerWk} JP / Minggu | ${jpPerWk} JP / Minggu | **${jpPerWk} JP / Minggu** | Matriks Jadwal Mingguan Sekolah |
| **Estimasi Pekan Efektif KBM (RBE)** | ~18 Pekan | ~18 Pekan | **~36 Pekan Efektif** | Sinkronisasi Kalender Pendidikan |`;
      }

      return `# ANALISIS CAPAIAN PEMBELAJARAN (CP) & DISTRIBUSI MATERI PER SEMESTER
## PENDEKATAN DEEP LEARNING (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)

---

### A. IDENTITAS PERANGKAT
| Komponen | Keterangan |
| :--- | :--- |
| **Satuan Pendidikan** | ${schoolName} |
| **Mata Pelajaran** | **${subject}** |
| **Fase / Kelas** | **${phase} / Kelas ${grade}** |
| **Jenjang** | **${level}** |
| **Semester** | **${resolvedSemesterLabel}** |
| **Alokasi Waktu Total** | **${isFullYear ? `${totalYearJP + 12} JP / Tahun (${jpPerWk} JP / Minggu)` : isSem2Only ? `${finalSem2JP + 6} JP / Semester 2 (${jpPerWk} JP / Minggu)` : `${finalSem1JP + 6} JP / Semester 1 (${jpPerWk} JP / Minggu)`}** |
| **Tahun Pelajaran** | ${resolvedAcademicYear} |
| **Penyusun / Guru** | ${teacherName} (NIP. ${teacherNip}) |
| **Kepala Sekolah** | ${headmasterName} (NIP. ${headmasterNip}) |

---

### B. RASIONAL & CAPAIAN PEMBELAJARAN (CP) RESMI
**Rumusan CP Resmi Fase ${phase}:**
> *"Peserta didik mampu memahami hakikat keilmuan, menganalisis struktur dan konsep esensial ${subject}, menggunakan nalar kritis untuk memecahkan persoalan nyata, serta mengkomunikasikan ide gagasan solutif secara kolaboratif, kreatif, mandiri, dan beretika."*

---

### C. BAGAN ALUR DEKOMPOSISI CP MENUJU TUJUAN PEMBELAJARAN (TP)
\`\`\`
+---------------------------------------------------------------------------------------------------+
|               BAGAN ALUR DEKOMPOSISI CAPAIAN PEMBELAJARAN (CP) MENUJU TUJUAN (TP)                 |
|                                                                                                   |
|  [ RUMUSAN CAPAIAN PEMBELAJARAN RESMI KEMENDIKBUD ]                                               |
|         │                                                                                         |
|         ▼ (Dekomposisi Elemen CP & Konten Esensial)                                               |
|  ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
|  │  1. PEMAHAMAN KONSEPTUAL  │      │  2. KETERAMPILAN PROSES   │      │ 3. APLIKASI & REFLEKSI    │
|  │  • Mengidentifikasi (C2)  │      │  • Menganalisis Data (C4) │      │ • Mengevaluasi Kritis(C5) │
|  │  • Mengklasifikasikan(C3) │      │  • Uji Empiris & Hipotesis│      │ • Merancang Solusi (C6)   │
|  └─────────────┬─────────────┘      └─────────────┬─────────────┘      └─────────────┬─────────────┘
|                │                                  │                                  │            |
|                └─────────────────┬────────────────┴──────────────────────────────────┘            |
|                                  ▼                                                                |
|         [ INTEGRASI 3 PILAR DEEP LEARNING: MINDFUL ➔ MEANINGFUL ➔ JOYFUL ]                        |
|                                  │                                                                |
|                                  ▼                                                                |
|         [ FORMULASI TUJUAN PEMBELAJARAN (TP) ABCD & PEMETAAN DISTRIBUSI ${isFullYear ? 'SEMESTER 1 & 2' : isSem2Only ? 'SEMESTER 2' : 'SEMESTER 1'} ]          |
+---------------------------------------------------------------------------------------------------+
\`\`\`

---

### D. DEKOMPOSISI ELEMEN DAN ANALISIS KOMPETENSI ESENSIAL
| No | Elemen CP | Kalimat Capaian Pembelajaran | Kompetensi Esensial (KKO HOTS Bloom) | Konten / Materi Pokok Esensial |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Pemahaman Konseptual** | Memahami, mengidentifikasi, dan mendeskripsikan prinsip fundamental ${subject}. | Mengidentifikasi (C2), Membedakan (C2), Menganalisis (C4) | ${topic} & Prinsip Dasar Keilmuan |
| 2 | **Keterampilan Proses & Analisis** | Menerapkan prosedur analitis, melakukan observasi/eksperimen, dan menafsirkan data. | Menghitung (C3), Menguji (C4), Mengevaluasi (C5) | Metode Investigasi, Pengolahan Data, & Pemecahan Masalah |
| 3 | **Aplikasi & Refleksi Kritis** | Menghubungkan konsep dengan fenomena lingkungan serta merefleksikan solusi kontekstual. | Mengkorelasikan (C4), Merefleksi (C5), Mengkreasikan Solusi (C6) | Studi Kasus Nyata, Proyek Kolaboratif Berdiferensiasi |

---

### E. HASIL DISTRIBUSI CAPAIAN PEMBELAJARAN (CP) ${isFullYear ? '1 TAHUN PELAJARAN' : isSem2Only ? 'SEMESTER 2' : 'SEMESTER 1'}

${sectionETables}

---

### F. SKEMA INTEGRASI TIGA PILAR DEEP LEARNING
\`\`\`
+---------------------------------------------------------------------------------------------------+
|                     SKEMA TIGA PILAR PEDAGOGIS DEEP LEARNING DALAM KBM                            |
|                                                                                                   |
|    ┌───────────────────────────┐      ┌───────────────────────────┐      ┌────────────────────────┐
|    │   1. MINDFUL LEARNING     │      │  2. MEANINGFUL LEARNING   │      │   3. JOYFUL LEARNING   │
|    ├───────────────────────────┤      ├───────────────────────────┤      ├────────────────────────┤
|    │ • Latihan Mindful Breath  │ ───► │ • Kontekstualisasi Kasus  │ ───► │ • Tantangan Gamifikasi │
|    │ • Refleksi Awal & Minat   │      │ • Big Ideas & Inquiry     │      │ • Pameran Gelar Karya  │
|    │ • Fokus & Sadar Penuh     │      │ • Keterhubungan Konsep    │      │ • Kolaborasi Tim Ceria │
|    └───────────────────────────┘      └───────────────────────────┘      └────────────────────────┘
+---------------------------------------------------------------------------------------------------+
\`\`\`

---

### G. PEMETAAN DIMENSI PROFIL PELAJAR PANCASILA & KARAKTER 6C
* **Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia:** Mensyukuri keteraturan alam semesta dan ilmu pengetahuan.
* **Bernalar Kritis:** Menganalisis informasi, memvalidasi bukti, dan menarik kesimpulan logis.
* **Kreatif:** Mengembangkan alternatif solusi inovatif terhadap tantangan masalah kontekstual.
* **Bergotong Royong:** Berkolaborasi efektif dalam kerja kelompok dan saling menghargai pendapat.
* **Karakter 6C Terpadu:** *Character* (Integritas), *Citizenship* (Kepedulian), *Collaboration* (Kerjasama), *Communication* (Artikulasi Gagasan), *Creativity* (Inovasi), *Critical Thinking* (Solusi Masalah).

---

### H. STRATEGI PEMBELAJARAN BERDIFERENSIASI
* **Diferensiasi Konten:** Menyediakan bahan ajar multimodal (teks narasi, infografis visual, video animasi, dan studi kasus riil).
* **Diferensiasi Proses:** Bimbingan berjenjang (*scaffolding*) bagi kelompok yang membutuhkan bimbingan intensif dan tantangan mandiri untuk kelompok mahir.
* **Diferensiasi Produk:** Kebebasan memilih bentuk unjuk kerja tugas (laporan tulisan, poster infografis, rekaman podcast audio, atau demonstrasi presentasi video).

${buildOfficialLembarPengesahan({
  title: 'ANALISIS CP & DISTRIBUSI MATERI',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Analisis Capaian Pembelajaran (CP) dan Pemetaan Distribusi Materi Pokok ${resolvedSemesterLabel} mata pelajaran **${subject}** (${phase} / Kelas ${grade}) ini telah ditelaah, diverifikasi, dan disahkan oleh Kepala Satuan Pendidikan untuk diberlakukan secara resmi dalam pelaksanaan KBM Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
    }

    case 'tp': {
      const semesterNumber = isSem2Only ? 2 : 1;
      const defaultSem1TPMats = [
        { essentialMaterial: `Hakikat ${subject}, Konsep Dasar, dan Pengukurannya`, allocatedHours: 18, tpCount: 3, semester: 1 },
        { essentialMaterial: `Energi, Perubahan Sistem, dan Aplikasinya`, allocatedHours: 18, tpCount: 2, semester: 1 },
      ];
      const defaultSem2TPMats = [
        { essentialMaterial: `Gejala Fenomena Lingkungan dan Pemanasan Global`, allocatedHours: 18, tpCount: 3, semester: 2 },
        { essentialMaterial: `Aksi Nyata Mitigasi Perubahan Iklim`, allocatedHours: 18, tpCount: 2, semester: 2 },
      ];
      const materialsForTP = isSem1Only
        ? (sem1Materials.length > 0 ? sem1Materials : defaultSem1TPMats)
        : isSem2Only
        ? (sem2Materials.length > 0 ? sem2Materials : defaultSem2TPMats)
        : (activeMaterials.length > 0 ? activeMaterials : [...sem1Materials, ...sem2Materials]);

      const tpRows = materialsForTP.length > 0
        ? materialsForTP.flatMap((mat, mIdx) => {
            const babNum = mIdx + 1;
            const babName = mat.essentialMaterial || mat.tpName || `Bab ${babNum}`;
            const semNum = mat.semester || semesterNumber;
            const baseCode = mat.tpCode || `TP.${grade}.${semNum}.${babNum}`;
            const numTPs = Number(mat.tpCount) > 0 ? Number(mat.tpCount) : (mat.tpName ? 1 : (mIdx % 2 === 0 ? 3 : 2));

            const rows: string[] = [];
            for (let t = 1; t <= numTPs; t++) {
              const currentCode = baseCode.includes('.') && baseCode.split('.').length >= 3 ? `${baseCode.substring(0, baseCode.lastIndexOf('.'))}.${t}` : `${baseCode}.${t}`;
              const pilarLabel = t === 1 
                ? '**1. Mindful Learning** *(Kesadaran Diri & Pemahaman Konsep)*' 
                : t === 2 
                ? '**2. Meaningful Learning** *(Inkuiri Kritis & Pemecahan Masalah)*' 
                : '**3. Joyful Learning** *(Kreasi Inovasi & Pameran Karya)*';
              const kkoLabel = t === 1 
                ? 'Mengidentifikasi (C2), Menganalisis (C4)' 
                : t === 2 
                ? 'Menerapkan (C3), Memecahkan (C4)' 
                : 'Mengevaluasi (C5), Mengkreasikan (C6)';
              const p3Label = t === 1 
                ? 'Bernalar Kritis, Mandiri' 
                : t === 2 
                ? 'Bergotong Royong, Bernalar Kritis' 
                : 'Kreatif, Komunikatif, Kebinekaan Global';
              
              const baseText = (t === 1 && mat.tpName && !mat.tpName.includes('Peserta didik dapat')) 
                ? mat.tpName 
                : (t === 1 
                    ? `mengidentifikasi dan menganalisis karakteristik fundamental serta fenomena esensial terkait ${babName}` 
                    : t === 2 
                    ? `menerapkan prosedur ilmiah dan merekayasa solusi permasalahan kontekstual berbasis ${babName}` 
                    : t === 3 
                    ? `mengevaluasi data empiris, mengkreasikan karya/solusi inovatif, serta mengomunikasikan gagasan terkait ${babName}` 
                    : `merefleksikan metakognisi dan mengomunikasikan hasil kajian ${babName}`);

              const cleanText = baseText.replace(/^(Peserta didik (dapat|mampu) )/i, '').trim();
              const abcdFormatted = `Peserta didik (**A**) mampu **${cleanText}** (**B**) melalui penyelidikan kontekstual berbasis data empiris (**C**) secara kritis, mandiri, dan berkesadaran penuh (**D**).`;

              if (t === 1) {
                rows.push(`| **${currentCode}** | **Bab ${babNum}: ${babName}** | ${abcdFormatted} | ${pilarLabel} | ${kkoLabel} | ${p3Label} | Pemahaman konsep esensial **${babName}** menumbuhkan rasa ingin tahu dan kesadaran terhadap keteraturan alam serta pemecahan masalah kontekstual. |`);
              } else {
                rows.push(`| **${currentCode}** | ^ | ${abcdFormatted} | ${pilarLabel} | ${kkoLabel} | ${p3Label} | Pemahaman konsep esensial **${babName}** menumbuhkan rasa ingin tahu dan kesadaran terhadap keteraturan alam serta pemecahan masalah kontekstual. |`);
              }
            }
            return rows;
          }).join('\n')
        : `| **${tpCode}** | **Bab 1: Konsep Dasar ${subject}** | Peserta didik (**A**) mampu **mengidentifikasi dan menganalisis** (**B**) karakteristik fundamental ${topic} melalui telaah fenomena kontekstual (**C**) secara kritis, berkesadaran penuh, dan mandiri (**D**). | **1. Mindful Learning** *(Kesadaran Konsep)* | Mengidentifikasi (C2), Menganalisis (C4) | Bernalar Kritis, Mandiri | Konsep dasar ${subject} merupakan fondasi memahami pola keteraturan dan fenomena di sekitar kita. |
| **TP.${grade}.2** | ^ | Peserta didik (**A**) mampu **menerapkan dan memecahkan** (**B**) permasalahan studi kasus nyata berbasis ${topic} melalui penyelidikan inkuiri kelompok terbimbing (**C**) dengan akurasi dan kolaborasi aktif (**D**). | **2. Meaningful Learning** *(Inkuiri Kritis & Relevansi)* | Menerapkan (C3), Memecahkan (C4) | Bergotong Royong, Bernalar Kritis | Kolaborasi inkuiri mempermudah penyelesaian masalah kompleks dan menghasilkan presisi solusi. |
| **TP.${grade}.3** | ^ | Peserta didik (**A**) mampu **mengevaluasi dan mengkreasikan** (**B**) solusi inovatif terkait ${topic} melalui proyek karya kreatif dan pameran hasil belajar (**C**) secara estetis, komunikatif, dan penuh kegembiraan (**D**). | **3. Joyful Learning** *(Kreasi Solutif & Gelar Karya)* | Mengevaluasi (C5), Mengkreasikan (C6) | Kreatif, Komunikatif, Kebinekaan | Pengetahuan yang mendalam terwujud saat siswa mampu menghasilkan karya inovatif yang dirayakan bersama. |`;

      const inquiryHooks = materialsForTP.length > 0
        ? materialsForTP.map((mat, idx) => {
            const bName = mat.essentialMaterial || mat.tpName || `Bab ${idx + 1}`;
            return `${idx + 1}. *Bagaimanakah penerapan prinsip **${bName}** dapat menyelesaikan permasalahan kontekstual di lingkungan sekitar secara berkesadaran dan bermakna?*`;
          }).join('\n')
        : `1. *Bagaimanakah keterkaitan antara konsep **${topic}** dengan fenomena nyata yang kita rasakan dalam kehidupan sehari-hari?*
2. *Mengapa pemahaman mendalam (deep understanding) terhadap prinsip ini sangat penting dalam pengambilan keputusan yang etis dan bijak?*
3. *Gagasan kreasi atau inovasi menyenangkan apa yang dapat kalian ciptakan bersama tim untuk memecahkan tantangan di topik ini?*`;

      return `# PERUMUSAN TUJUAN PEMBELAJARAN (TP)
## PENDEKATAN DEEP LEARNING (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)
### INTEGRASI FORMULASI ABCD, TAKSONOMI BLOOM HOTS, & KARAKTER 6C

---

### A. IDENTITAS PERANGKAT
* **Mata Pelajaran:** ${subject}
* **Fase / Kelas:** ${phase} / Kelas ${grade} (${level})
* **Semester:** ${resolvedSemesterLabel}
* **Tahun Pelajaran:** ${resolvedAcademicYear}
* **Cakupan Materi:** ${materialsForTP.length > 0 ? `Materi Pokok ${resolvedSemesterLabel} (${materialsForTP.length} Bab - Tersinkronisasi Otomatis dari Profil Guru & Distribusi CP)` : topic}
* **Guru Pengampu:** ${teacherName}
* **NIP Guru:** ${teacherNip}

---

### B. SKEMA ANATOMI RUMUSAN TUJUAN PEMBELAJARAN DEEP LEARNING (ABCD + 3 PILAR)
\`\`\`
+---------------------------------------------------------------------------------------------------+
|               SKEMA ANATOMI RUMUSAN TUJUAN PEMBELAJARAN (DEEP LEARNING MODEL)                     |
|                                                                                                   |
|  ┌──────────────────┐    ┌──────────────────────────┐    ┌─────────────────────────────────────┐  |
|  │  AUDIENCE (A)    │    │  BEHAVIOR (B)            │    │  CONDITION (C)                      │  |
|  │  Peserta Didik   │───►│  Kata Kerja Operasional  │───►│  Inkuiri Kontekstual, Eksplorasi    │  |
|  │  Kelas ${grade} (${phase}) │    │  HOTS (C2, C4, C5, C6)   │    │  LKPD Empiris, Proyek Kreatif       │  |
|  └──────────────────┘    └──────────────────────────┘    └──────────────────┬──────────────────┘  |
|                                                                             │                     |
|                                  ┌──────────────────────────────────────────┘                     |
|                                  ▼                                                                |
|                          ┌──────────────────────────┐                                             |
|                          │  DEGREE (D)              │                                             |
|                          │  Tingkat Ketepatan,      │                                             |
|                          │  Kritis, & Bertanggung Jwb│                                            |
|                          └──────────────────────────┘                                             |
|                                  │                                                                |
|                                  ▼                                                                |
|         [ TERINTEGRASI 3 PILAR: MINDFUL ➔ MEANINGFUL ➔ JOYFUL LEARNING ]                          |
+---------------------------------------------------------------------------------------------------+
\`\`\`

---

### C. TABEL RUMUSAN TUJUAN PEMBELAJARAN (TP) DEEP LEARNING
| Kode TP | Bab / Lingkup Materi Pokok | Rumusan Tujuan Pembelajaran (ABCD) | Pilar Deep Learning | Kata Kerja Operasional (KKO) | Dimensi Profil Pancasila & 6C | Pemahaman Bermakna (Deep Meaning) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${tpRows}

---

### D. PERTANYAAN PEMANTIK INKUIRI (MINDFUL SPARKING QUESTIONS)
${inquiryHooks}

---

### E. DIAGRAM HIERARKI TAHAPAN PENGUASAAN KOMPETENSI DEEP LEARNING
\`\`\`
+---------------------------------------------------------------------------------------------------+
|               DIAGRAM HIERARKI TAHAPAN PENGUASAAN KOMPETENSI DEEP LEARNING                        |
|                                                                                                   |
|  [ TAHAP 1: MINDFUL FOUNDATION ] ──► [ TAHAP 2: MEANINGFUL INQUIRY ] ──► [ TAHAP 3: JOYFUL CREATION ]  |
|  • Kesadaran Konseptual Esensial     • Penyelidikan Masalah Nyata        • Desain Inovasi Solutif |
|  • Refleksi & Apersepsi Bermakna     • Olah Data Empiris & Variabel      • Pameran Karya Kelas    |
|  • Fokus & Kehadiran Penuh KBM       • Analisis Kritis & Sintesis        • Umpan Balik Apresiatif |
+---------------------------------------------------------------------------------------------------+
\`\`\`

---

${buildOfficialLembarPengesahan({
  title: 'PERUMUSAN TUJUAN PEMBELAJARAN (TP)',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Perumusan Tujuan Pembelajaran (TP) ${resolvedSemesterLabel} mata pelajaran **${subject}** (${phase} / Kelas ${grade}) ini telah disusun sesuai panduan kurikulum mutakhir dan pendekatan Deep Learning (*Mindful, Meaningful, & Joyful Learning*), serta disahkan oleh Kepala Satuan Pendidikan untuk Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
    }

    case 'atp': {
      const jpPerWk = Number(params.distributionData?.jpPerWeek) || Number(schoolProfile.jpPerWeek) || (level === 'SD' ? 4 : level === 'SMP' ? 3 : 3);
      const isCustomKronologis = customFormatNotes && (customFormatNotes.toLowerCase().includes('kronologis') || customFormatNotes.toLowerCase().includes('bagan alur'));
      const isCustomDeepLearning = customFormatNotes && (customFormatNotes.toLowerCase().includes('3 pilar') || customFormatNotes.toLowerCase().includes('pedagogis'));

      // If user explicitly picked Kronologis format
      if (isCustomKronologis) {
        let kronologisTahapan = '';
        if (isSem1Only) {
          kronologisTahapan = `### A. TAHAP 1: PENGUASAAN KONSEP DASAR & IDENTIFIKASI FENOMENA (SEMESTER 1)
* **Fokus Kompetensi:** Mengidentifikasi karakteristik esensial, istilah ilmiah, dan struktur fundamental ${subject}.
* **Alur TP:** 
  1. Mengamati fenomena kontekstual di lingkungan sekitar dan merumuskan hipotesis awal.
  2. Menemukan keteraturan pola dan kaidah keilmuan melalui inkuiri terbimbing.
* **Alokasi Jam:** ${Math.round((activeMaterials.length > 0 ? activeMaterials.reduce((acc: number, m: any) => acc + (Number(m.allocatedHours) || 18), 0) : 54) * 0.4)} JP

### B. TAHAP 2: APLIKASI & INVESTIGASI MASALAH KONTEKSTUAL (SEMESTER 1)
* **Fokus Kompetensi:** Menerapkan konsep ke dalam pemecahan masalah praktis, eksperimen terukur, dan telaah kasus kritis.
* **Alur TP:**
  1. Merancang langkah penyelidikan mandiri dan membedakan variabel penelitian.
  2. Mengumpulkan data empiris, mengolah data dengan notasi ilmiah, dan menyimpulkan hasil investigasi.
* **Alokasi Jam:** ${Math.round((activeMaterials.length > 0 ? activeMaterials.reduce((acc: number, m: any) => acc + (Number(m.allocatedHours) || 18), 0) : 54) * 0.6)} JP`;
        } else if (isSem2Only) {
          kronologisTahapan = `### A. TAHAP 1: EKSPERIMEN & ANALISIS SISTEM LANJUTAN (SEMESTER 2)
* **Fokus Kompetensi:** Mengintegrasikan pemahaman konseptual tingkat lanjut, mengevaluasi sistem terpadu, dan kolaborasi tim.
* **Alur TP:**
  1. Menganalisis isu global dan keterkaitan sains-teknologi-masyarakat.
  2. Memvalidasi hipotesis melalui uji perbandingan dan pemodelan solutif.
* **Alokasi Jam:** ${Math.round((activeMaterials.length > 0 ? activeMaterials.reduce((acc: number, m: any) => acc + (Number(m.allocatedHours) || 18), 0) : 54) * 0.4)} JP

### B. TAHAP 2: KREASI INOVASI, GELAR KARYA & REFLEKSI KOMPREHENSIF (SEMESTER 2)
* **Fokus Kompetensi:** Merancang prototipe inovatif, memamerkan portofolio hasil karya, dan melakukan metakognisi.
* **Alur TP:**
  1. Menciptakan solusi produk/gagasan kreatif ramah lingkungan berkelanjutan.
  2. Mengomunikasikan hasil karya secara lisan dan tulisan di depan publik.
* **Alokasi Jam:** ${Math.round((activeMaterials.length > 0 ? activeMaterials.reduce((acc: number, m: any) => acc + (Number(m.allocatedHours) || 18), 0) : 54) * 0.6)} JP`;
        } else {
          kronologisTahapan = `### A. TAHAP 1: PENGUASAAN KONSEP DASAR & IDENTIFIKASI FENOMENA (SEMESTER GANJIL)
* **Fokus Kompetensi:** Mengidentifikasi karakteristik esensial, istilah ilmiah, dan struktur fundamental ${subject}.
* **Alur TP:** 
  1. Mengamati fenomena kontekstual di lingkungan sekitar dan merumuskan hipotesis awal.
  2. Menemukan keteraturan pola dan kaidah keilmuan melalui inkuiri terbimbing.
* **Alokasi Jam:** ${Math.round((sem1Materials.length > 0 ? sem1Materials.reduce((acc: number, m: any) => acc + (Number(m.allocatedHours) || 18), 0) : 54) * 0.4)} JP

### B. TAHAP 2: APLIKASI & INVESTIGASI MASALAH KONTEKSTUAL (SEMESTER GANJIL)
* **Fokus Kompetensi:** Menerapkan konsep ke dalam pemecahan masalah praktis, eksperimen terukur, dan telaah kasus kritis.
* **Alur TP:**
  1. Merancang langkah penyelidikan mandiri dan membedakan variabel penelitian.
  2. Mengumpulkan data empiris, mengolah data dengan notasi ilmiah, dan menyimpulkan hasil investigasi.
* **Alokasi Jam:** ${Math.round((sem1Materials.length > 0 ? sem1Materials.reduce((acc: number, m: any) => acc + (Number(m.allocatedHours) || 18), 0) : 54) * 0.6)} JP

### C. TAHAP 3: EKSPERIMEN & ANALISIS SISTEM LANJUTAN (SEMESTER GENAP)
* **Fokus Kompetensi:** Mengintegrasikan pemahaman konseptual tingkat lanjut, mengevaluasi sistem terpadu, dan kolaborasi tim.
* **Alur TP:**
  1. Menganalisis isu global dan keterkaitan sains-teknologi-masyarakat.
  2. Memvalidasi hipotesis melalui uji perbandingan dan pemodelan solutif.
* **Alokasi Jam:** ${Math.round((sem2Materials.length > 0 ? sem2Materials.reduce((acc: number, m: any) => acc + (Number(m.allocatedHours) || 18), 0) : 54) * 0.4)} JP

### D. TAHAP 4: KREASI INOVASI, GELAR KARYA & REFLEKSI KOMPREHENSIF (SEMESTER GENAP)
* **Fokus Kompetensi:** Merancang prototipe inovatif, memamerkan portofolio hasil karya, dan melakukan metakognisi.
* **Alur TP:**
  1. Menciptakan solusi produk/gagasan kreatif ramah lingkungan berkelanjutan.
  2. Mengomunikasikan hasil karya secara lisan dan tulisan di depan publik.
* **Alokasi Jam:** ${Math.round((sem2Materials.length > 0 ? sem2Materials.reduce((acc: number, m: any) => acc + (Number(m.allocatedHours) || 18), 0) : 54) * 0.6)} JP`;
        }

        return `# ALUR TUJUAN PEMBELAJARAN (ATP) - FORMAT KRONOLOGIS TAHAPAN
## KURIKULUM MERDEKA — TAHAPAN LOGIS DARI KONKRET KE ABSTRAK
### TAHUN PELAJARAN ${resolvedAcademicYear}

---

### IDENTITAS PERANGKAT
| Komponen | Keterangan | Komponen | Keterangan |
| :--- | :--- | :--- | :--- |
| **Mata Pelajaran** | **${subject}** | **Fase** | **${phase}** |
| **Kelas / Semester** | **${grade} / ${resolvedSemesterLabel}** | **Alokasi Waktu** | **${jpPerWk} JP / Minggu** |
| **Satuan Pendidikan** | ${schoolName} | **Guru Pengampu** | ${teacherName} (NIP. ${teacherNip}) |

---

${kronologisTahapan}

---

${buildOfficialLembarPengesahan({
  title: 'ALUR TUJUAN PEMBELAJARAN (ATP)',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Alur Tujuan Pembelajaran (ATP) ${resolvedSemesterLabel} mata pelajaran **${subject}** (${phase} / Kelas ${grade}) ini telah diperiksa, diverifikasi, dan disahkan sesuai Standar Baku Resmi Kemendikbudristek dan Pendekatan Deep Learning (*Mindful, Meaningful, & Joyful Learning*) untuk Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
      }

      // Default & Primary Standard: Format Standar Baku Resmi 10 Kolom Kemendikbudristek (Sesuai Dokumen Acuan PDF Resmi)
      let calcTotalSemJp = 0;
      const allMaterialsToUse = [...sem1Materials, ...sem2Materials];
      const defaultSem1AtpMats = [
        { essentialMaterial: `Hakikat ${subject}, Konsep Dasar, dan Pengukurannya`, allocatedHours: 18, tpCount: 3, semester: 1 },
        { essentialMaterial: `Energi, Perubahan Sistem, dan Aplikasinya`, allocatedHours: 18, tpCount: 2, semester: 1 },
      ];
      const defaultSem2AtpMats = [
        { essentialMaterial: `Gejala Fenomena Lingkungan dan Pemanasan Global`, allocatedHours: 18, tpCount: 3, semester: 2 },
        { essentialMaterial: `Aksi Nyata Mitigasi Perubahan Iklim`, allocatedHours: 18, tpCount: 2, semester: 2 },
      ];
      const materialsToUse = isSem1Only
        ? (sem1Materials.length > 0 ? sem1Materials : defaultSem1AtpMats)
        : isSem2Only
        ? (sem2Materials.length > 0 ? sem2Materials : defaultSem2AtpMats)
        : (allMaterialsToUse.length > 0 ? allMaterialsToUse : [...defaultSem1AtpMats, ...defaultSem2AtpMats]);

      // Build official 10-column table rows
      const tableRows: string[] = [];

      materialsToUse.forEach((mat, mIdx) => {
        const matIndex = mIdx + 1;
        const matTitle = mat.essentialMaterial || mat.tpName || `Lingkup Materi ${matIndex}`;
        const hours = Number(mat.allocatedHours) || 18;
        calcTotalSemJp += hours;
        const numTPs = Number(mat.tpCount) > 0 ? Number(mat.tpCount) : (mat.tpName ? 1 : 2);
        const semLabel = mat.semester === 2 ? 'Semester Genap' : 'Semester Ganjil';

        const subjectLow = subject.toLowerCase();
        let sampleKeywords = 'akurasi, angka penting, besaran, hipotesis, ketidakpastian pengukuran, metode ilmiah, notasi ilmiah, presisi, satuan, variabel.';
        let sampleGlossary = 'akurasi, angka penting, besaran, hipotesis, ketidakpastian pengukuran, metode ilmiah, notasi ilmiah, presisi, satuan, variabel.';

        if (matTitle.toLowerCase().includes('energi') || matTitle.toLowerCase().includes('usaha') || subjectLow.includes('fisika')) {
          sampleKeywords = 'energi potensial, energi kinetik, energi terbarukan, fosil, hukum kekekalan energi, efisiensi energi, transformasi energi.';
          sampleGlossary = 'energi potensial, energi kinetik, energi terbarukan, fosil, hukum kekekalan energi, efisiensi energi, transformasi energi.';
        } else if (matTitle.toLowerCase().includes('lingkungan') || matTitle.toLowerCase().includes('pemanasan') || matTitle.toLowerCase().includes('iklim')) {
          sampleKeywords = 'anomali, efek rumah kaca, el nino, gas rumah kaca, gletser, iklim, lapisan ozon, emisi karbon, mitigasi adaptasi.';
          sampleGlossary = 'anomali, efek rumah kaca, el nino, gas rumah kaca, gletser, iklim, lapisan ozon, emisi karbon, mitigasi adaptasi.';
        } else if (subjectLow.includes('matematika')) {
          sampleKeywords = 'eksponen, logaritma, fungsi, grafik, pemodelan matematis, variabel, relasi, domain, kodomain, sistem persamaan.';
          sampleGlossary = 'eksponen, logaritma, fungsi, grafik, pemodelan matematis, variabel, relasi, domain, kodomain, sistem persamaan.';
        } else if (subjectLow.includes('biologi') || subjectLow.includes('ipa')) {
          sampleKeywords = 'keanekaragaman hayati, ekosistem, sel, jaringan, interaksi biotik-abiotik, bioteknologi, konservasi, metabolisme.';
          sampleGlossary = 'keanekaragaman hayati, ekosistem, sel, jaringan, interaksi biotik-abiotik, bioteknologi, konservasi, metabolisme.';
        } else if (subjectLow.includes('kimia')) {
          sampleKeywords = 'struktur atom, ikatan kimia, reaksi redoks, stoikiometri, larutan, tabel periodik, hukum dasar kimia, termokimia.';
          sampleGlossary = 'struktur atom, ikatan kimia, reaksi redoks, stoikiometri, larutan, tabel periodik, hukum dasar kimia, termokimia.';
        } else if (subjectLow.includes('bahasa')) {
          sampleKeywords = 'struktur teks, fakta, opini, kaidah kebahasaan, gagasan pokok, kohesi, koherensi, diksi.';
          sampleGlossary = 'struktur teks, fakta, opini, kaidah kebahasaan, gagasan pokok, kohesi, koherensi, diksi.';
        }

        const baseCode = mat.tpCode || `TP.${grade}.${matIndex}`;
        const tpItems: string[] = [];
        for (let t = 1; t <= numTPs; t++) {
          const currentCode = baseCode.includes('.') && baseCode.split('.').length >= 3 ? `${baseCode.substring(0, baseCode.lastIndexOf('.'))}.${t}` : `${baseCode}.${t}`;
          const desc = t === 1 && mat.tpName && !mat.tpName.includes('Peserta didik dapat') 
            ? mat.tpName 
            : (t === 1 
                ? `Peserta didik mampu mengidentifikasi karakteristik, konsep dasar, dan komponen utama terkait ${matTitle} secara kritis.` 
                : t === 2 
                  ? `Peserta didik mampu menganalisis hubungan sebab-akibat, pola keteraturan, dan variabel ilmiah pada ${matTitle}.` 
                  : t === 3 
                    ? `Peserta didik mampu merancang penyelidikan, mengolah data empiris, dan memecahkan permasalahan kontekstual ${matTitle}.` 
                    : `Peserta didik mampu merefleksikan, mengkreasikan solusi inovatif, dan mengomunikasikan hasil kajian ${matTitle}.`);
          tpItems.push(`**${currentCode}**<br/>${desc}`);
        }

        const indicatorList = `• mengidentifikasi konsep dan komponen esensial ${matTitle}.<br/>• menganalisis data empiris dan variabel terkait.<br/>• menyajikan kesimpulan dan solusi kreatif.`;
        const profilPancasila = `• <strong>Dimensi 6C:</strong> Character, Critical Thinking, Creativity, Collaboration, Communication, Citizenship.<br/>• <strong>Profil Pancasila:</strong> Beriman, Bernalar Kritis, Bergotong Royong, Kreatif, Mandiri.`;
        const deepLearningActivities = `• <strong>Mindful:</strong> Observasi kesadaran penuh terhadap fenomena ${matTitle}.<br/>• <strong>Meaningful:</strong> Penyelidikan inkuiri berbasis data nyata.<br/>• <strong>Joyful:</strong> Kreasi karya inovatif & selebrasi belajar.`;
        const sumberBelajar = `• Buku Teks ${subject} ${level} Kelas ${grade} (Kemendikbudristek).<br/>• Modul Ajar & LKPD Kurikulum Merdeka.<br/>• Sumber Digital & Lingkungan Kontekstual.`;
        const penilaian = `• Asesmen Diagnostik & Formatif Sikap 6C.<br/>• Penilaian Kinerja Keterampilan Proses.<br/>• Asesmen Sumatif Lingkup Materi.`;
        const hoursPerTp = Math.round((hours / numTPs) * 10) / 10;

        tpItems.forEach((tpText, tIdx) => {
          const tpNum = tIdx + 1;
          const tpSpecificIndicators = tpNum === 1
            ? `• Mengidentifikasi karakteristik dasar dan komponen esensial ${matTitle}.<br/>• Menjelaskan konsep utama dan kaidah ilmiah secara akurat.`
            : tpNum === 2
            ? `• Menganalisis hubungan sebab-akibat dan interaksi variabel pada ${matTitle}.<br/>• Mengolah data empiris dan menyelesaikan studi kasus terapan.`
            : tpNum === 3
            ? `• Merancang penyelidikan ilmiah / prototipe solutif materi ${matTitle}.<br/>• Menyajikan kesimpulan, evaluasi kritis, dan laporan hasil kerja.`
            : `• Merefleksikan metakognisi belajar dan mengomunikasikan gagasan inovatif.`;

          const tpSpecificActivities = tpNum === 1
            ? `• <strong>Mindful Discovery:</strong> Orientasi berkesadaran penuh (latihan STOP) & eksplorasi fenomena nyata ${matTitle}.`
            : tpNum === 2
            ? `• <strong>Meaningful Inquiry:</strong> Penyelidikan inkuiri kelompok terstruktur berbasis LKPD & olah data ${matTitle}.`
            : tpNum === 3
            ? `• <strong>Joyful Creation:</strong> Perancangan karya/solusi inovatif, pameran karya (*gallery walk*), & apresiasi tim.`
            : `• <strong>Refleksi & Transfer:</strong> Refleksi metakognisi pola 3-2-1 & penugasan proyek kreatif terapan.`;

          const tpSpecificAssessment = tpNum === 1
            ? `• Asesmen Diagnostik Awal & Formatif Lisan (Pemahaman Konsep)`
            : tpNum === 2
            ? `• Asesmen Formatif Kinerja Diskusi LKPD & Analisis Kasus`
            : tpNum === 3
            ? `• Asesmen Formatif Unjuk Kerja & Sumatif Lingkup Materi ${matTitle}`
            : `• Asesmen Sumatif Produk / Portofolio & Rubrik Refleksi`;

          tableRows.push(
            `| ${tpText} | **Bab ${matIndex}: ${matTitle}**<br/>*(${semLabel})* | ${tpSpecificIndicators} | ${profilPancasila} | ${sampleKeywords} | ${tpSpecificActivities} | ${sampleGlossary} | **${hoursPerTp} JP** | ${sumberBelajar} | ${tpSpecificAssessment} |`
          );
        });
      });

      const totalEffectiveJP = calcTotalSemJp > 0 ? calcTotalSemJp : (activeMaterials.length * 18 || 54);

      return `# ALUR TUJUAN PEMBELAJARAN (ATP)
## PENDEKATAN DEEP LEARNING (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)
### KURIKULUM MERDEKA — TAHUN PELAJARAN ${resolvedAcademicYear}

---

| Identitas Perangkat | Keterangan Dokumen | Identitas Perangkat | Keterangan Dokumen |
| :--- | :--- | :--- | :--- |
| **Mata Pelajaran** | **${subject}** | **Fase / Jenjang** | **${phase} / ${level}** |
| **Kelas / Semester** | **${grade} / ${resolvedSemesterLabel}** | **Alokasi Waktu** | **${totalEffectiveJP} JP (${jpPerWk} JP / Minggu)** |
| **Satuan Pendidikan** | **${schoolName}** | **Pendekatan Pembelajaran** | **Deep Learning (Mindful, Meaningful, Joyful)** |
| **Penyusun / Guru** | **${teacherName} (NIP. ${teacherNip})** | **Tahun Pelajaran** | **${resolvedAcademicYear}** |

---

### A. CAPAIAN PEMBELAJARAN
Pada fase ini, peserta didik memiliki:
* Kemampuan untuk responsif terhadap isu-isu global dan berperan aktif dalam memberikan penyelesaian masalah kontekstual melalui pendekatan pembelajaran mendalam (*Deep Learning: Mindful, Meaningful, & Joyful Learning*). Kemampuan tersebut antara lain mengamati dengan berkesadaran penuh (*Mindful*), mempertanyakan dan memprediksi, merencanakan dan melakukan penyelidikan kritis berbasis data empiris (*Meaningful*), memproses dan menganalisis data, mengevaluasi dan metakognisi diri, serta mengomunikasikan hasil dalam bentuk karya inovatif yang solutif dan menggembirakan (*Joyful*). Seluruh proses diarahkan pada penguatan kompetensi esensial, literasi sains, dan nilai-nilai luhur Profil Pelajar Pancasila serta Dimensi Karakter 6C.

---

### B. ELEMEN CAPAIAN PEMBELAJARAN & INTEGRASI 3 PILAR DEEP LEARNING
| ELEMEN | CAPAIAN PEMBELAJARAN | INTEGRASI 3 PILAR DEEP LEARNING |
| :--- | :--- | :--- |
| **Pemahaman ${subject}** | Peserta didik mampu mendeskripsikan gejala alam dan fenomena dalam cakupan pemahaman konseptual, pengukuran terstandar, perubahan sistem lingkungan, dan pemanfaatannya dalam kehidupan sehari-hari. | **Mindful Foundation:** Membangun kesadaran diri, pemahaman konsep esensial secara utuh, dan stimulasi rasa ingin tahu mendalam. |
| **Keterampilan proses** | **1. Mengamati & Mempertanyakan:** Melakukan pengamatan fenomena dengan alat ukur teliti dan merumuskan hipotesis ilmiah.<br/>**2. Merencanakan & Menyelidiki:** Merancang eksperimen, menentukan variabel kontrol/bebas, dan mengumpulkan data empiris.<br/>**3. Menganalisis & Mengevaluasi:** Mengolah data dengan kaidah angka penting/rumus ilmiah, menarik kesimpulan, dan mengevaluasi keterbatasan.<br/>**4. Mencipta & Mengomunikasikan:** Merancang karya solusi inovatif dan mempresentasikan laporan hasil secara lisan maupun tertulis. | **Meaningful Inquiry & Joyful Creation:** Penyelidikan berbasis masalah kontekstual nyata, rekayasa produk inovatif, pameran hasil belajar, dan selebrasi keberhasilan. |

---

### C. TABEL ALUR TUJUAN PEMBELAJARAN (ATP) DEEP LEARNING (10 KOLOM LENGKAP)
| Tujuan Pembelajaran | Lingkup Materi Pokok | Indikator Tujuan Pembelajaran | Profil Pelajar Pancasila & 6C | Kata Kunci | Kegiatan Pembelajaran (3 Pilar Deep Learning) | Glosarium | Alokasi Waktu | Sumber Belajar | Penilaian Autentik |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: | :--- | :--- |
${tableRows.join('\n')}

---

${buildOfficialLembarPengesahan({
  title: 'ALUR TUJUAN PEMBELAJARAN (ATP)',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Alur Tujuan Pembelajaran (ATP) ${resolvedSemesterLabel} mata pelajaran **${subject}** (${phase} / Kelas ${grade}) ini telah diperiksa, diverifikasi, dan disahkan sesuai Standar Baku Resmi 10 Kolom Kemendikbudristek dan Pendekatan Deep Learning (*Mindful, Meaningful, & Joyful Learning*) untuk Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
    }

    case 'analisis_alokasi_waktu':
    case 'alokasi_waktu':
    case 'rbe': {
      const sem1EffWeeks = params.kalenderData?.semester1?.totalEffectiveWeeks || 19;
      const sem2EffWeeks = params.kalenderData?.semester2?.totalEffectiveWeeks || 18;
      const jpPerWk = params.kalenderData?.semester1?.jpPerWeek || (level === 'SD' ? 4 : 3);
      const sem1TotalJp = sem1EffWeeks * jpPerWk;
      const sem2TotalJp = sem2EffWeeks * jpPerWk;

      const customSchoolHeader = params.customFormatNotes
        ? `\n> 📋 **FORMAT DOKUMEN KHUSUS SEKOLAH DIAKTIFKAN**\n> Dokumen ini disusun dan distrukturkan menyesuaikan format baku resmi satuan pendidikan.\n\n`
        : '';

      return `# ANALISIS ALOKASI WAKTU & RINCIAN PEKAN EFEKTIF (RBE)
## PENDEKATAN DEEP LEARNING (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)
### KURIKULUM MERDEKA — TAHUN PELAJARAN ${resolvedAcademicYear}
${customSchoolHeader}
---

### A. IDENTITAS PERANGKAT
* **Satuan Pendidikan:** **${schoolName}**
* **Mata Pelajaran:** **${subject}**
* **Fase / Kelas:** **${phase} / Kelas ${grade} (${level})**
* **Tahun Pelajaran:** **${resolvedAcademicYear}**
* **Pendekatan & Model:** **Deep Learning (Mindful, Meaningful, & Joyful Learning)**
* **Alokasi Jam per Pekan:** **${jpPerWk} JP / Minggu**
* **Penyusun / Guru Pengampu:** ${teacherName} (NIP. ${teacherNip})
* **Kepala Satuan Pendidikan:** ${headmasterName} (NIP. ${headmasterNip})

---

### B. SKEMA STRUKTUR DISTRIBUSI ALOKASI WAKTU 1 TAHUN AJARAN (DEEP LEARNING MODEL)
\`\`\`
+---------------------------------------------------------------------------------------------------+
|          SKEMA STRUKTUR DISTRIBUSI ALOKASI WAKTU TAHUN PELAJARAN ${resolvedAcademicYear}                 |
|                   PENDEKATAN DEEP LEARNING (BERKESADARAN, BERMAKNA, & MENYENANGKAN)               |
|                                                                                                   |
|  [ TOTAL 52 PEKAN KALENDER PENDIDIKAN ]                                                           |
|  ├─────────────────────────────────────────────────┬───────────────────────────────────────────┤  |
|  ▼                                                 ▼                                           |  |
|  [ SEMESTER GANJIL: 26 PEKAN ]                     [ SEMESTER GENAP: 26 PEKAN ]                |  |
|  ├── Pekan Tidak Efektif : 7 Pekan                 ├── Pekan Tidak Efektif : 8 Pekan           |  |
|  └── Pekan Efektif KBM   : ${sem1EffWeeks} Pekan (${sem1TotalJp} JP)          └── Pekan Efektif KBM   : ${sem2EffWeeks} Pekan (${sem2TotalJp} JP)    |  |
|      ├── 1. Mindful Foundation    : ${Math.round((sem1TotalJp - 6) * 0.25)} JP (Eksplorasi)        ├── 1. Mindful Foundation    : ${Math.round((sem2TotalJp - 6) * 0.25)} JP (Eksplorasi)    |  |
|      ├── 2. Meaningful Inquiry    : ${Math.round((sem1TotalJp - 6) * 0.50)} JP (Investigasi)       ├── 2. Meaningful Inquiry    : ${Math.round((sem2TotalJp - 6) * 0.50)} JP (Investigasi)   |  |
|      ├── 3. Joyful Creation       : ${Math.round((sem1TotalJp - 6) * 0.25)} JP (Gelar Karya)       ├── 3. Joyful Creation       : ${Math.round((sem2TotalJp - 6) * 0.25)} JP (Gelar Karya)   |  |
|      └── Cadangan & Asesmen Sumatif: 6 JP (2 Pekan)        └── Cadangan & Asesmen Sumatif: 6 JP (2 Pekan)     |  |
+---------------------------------------------------------------------------------------------------+
\`\`\`

---

### C. ANALISIS RINCIAN PEKAN EFEKTIF SEMESTER 1 (GANJIL)
#### 1. Distribusi Jumlah Pekan Semester 1 (Juli s.d. Desember ${startYear})
| No | Nama Bulan | Jumlah Pekan Kalender | Pekan Tidak Efektif | Pekan Efektif KBM | Keterangan Pekan Tidak Efektif (Kalender Pendidikan) |
| :-: | :--- | :-: | :-: | :-: | :--- |
| 1 | **Juli ${startYear}** | 5 Pekan | 2 Pekan | 3 Pekan | Libur Akhir TP ${startYear - 1}/${startYear} (P1-P2) & MPLS / Matsama (P3) |
| 2 | **Agustus ${startYear}** | 4 Pekan | 0 Pekan | 4 Pekan | KBM Efektif Penuh (Peringatan HUT RI ke-80) |
| 3 | **September ${startYear}** | 5 Pekan | 1 Pekan | 4 Pekan | Asesmen Tengah Semester / ASTS Ganjil (Pekan 4) |
| 4 | **Oktober ${startYear}** | 4 Pekan | 0 Pekan | 4 Pekan | KBM Efektif & Pekan Projek Penguatan Karakter Profil Pelajar |
| 5 | **November ${startYear}** | 4 Pekan | 0 Pekan | 4 Pekan | KBM Efektif Penuh |
| 6 | **Desember ${startYear}** | 4 Pekan | 4 Pekan | 0 Pekan | ASAS (P1), Remedial & Nilai (P2), Rapor (P3), Libur Sem 1 (P4) |
| **TOTAL** | **Semester 1 (Ganjil)** | **26 Pekan** | **7 Pekan** | **${sem1EffWeeks} Pekan** | **Total Pekan Efektif KBM: ${sem1EffWeeks} Pekan** |

#### 2. Perhitungan Jam Pelajaran (JP) Efektif Semester 1
| Komponen Perhitungan | Formula & Rincian | Hasil Jam Pelajaran (JP) |
| :--- | :--- | :-: |
| **a. Jumlah Pekan Efektif KBM** | ${sem1EffWeeks} Pekan | ${sem1EffWeeks} Pekan |
| **b. Alokasi Waktu Mengajar** | ${jpPerWk} JP / Pekan | ${jpPerWk} JP / Minggu |
| **c. Jumlah Total Jam Efektif** | ${sem1EffWeeks} Pekan × ${jpPerWk} JP | **${sem1TotalJp} JP** |
| **d. Cadangan Jam Pelajaran** | Asesmen Sumatif Lingkup Materi & Remedial Terarah | 6 JP |
| **e. Jam Efektif Tatap Muka KBM** | Total Jam Efektif - Cadangan Jam | **${sem1TotalJp - 6} JP** |

---

### D. ANALISIS RINCIAN PEKAN EFEKTIF SEMESTER 2 (GENAP)
#### 1. Distribusi Jumlah Pekan Semester 2 (Januari s.d. Juni ${endYear})
| No | Nama Bulan | Jumlah Pekan Kalender | Pekan Tidak Efektif | Pekan Efektif KBM | Keterangan Pekan Tidak Efektif (Kalender Pendidikan) |
| :-: | :--- | :-: | :-: | :-: | :--- |
| 1 | **Januari ${endYear}** | 5 Pekan | 1 Pekan | 4 Pekan | Libur Tahun Baru & Awal Semester Genap (Pekan 1) |
| 2 | **Februari ${endYear}** | 4 Pekan | 0 Pekan | 4 Pekan | KBM Efektif Penuh |
| 3 | **Maret ${endYear}** | 4 Pekan | 1 Pekan | 3 Pekan | ASTS Genap & Libur Awal Ramadhan 1447 H (Pekan 3) |
| 4 | **April ${endYear}** | 5 Pekan | 2 Pekan | 3 Pekan | Libur Hari Raya Idul Fitri 1447 H & Cuti Bersama (P1-P2) |
| 5 | **Mei ${endYear}** | 4 Pekan | 1 Pekan | 3 Pekan | Asesmen Sumatif Akhir Jenjang / Penilaian Kinerja (Pekan 3) |
| 6 | **Juni ${endYear}** | 4 Pekan | 3 Pekan | 1 Pekan | ASAS Genap (P1), Pembagian Rapor (P2), Libur Akhir TP (P3-P4) |
| **TOTAL** | **Semester 2 (Genap)** | **26 Pekan** | **8 Pekan** | **${sem2EffWeeks} Pekan** | **Total Pekan Efektif KBM: ${sem2EffWeeks} Pekan** |

#### 2. Perhitungan Jam Pelajaran (JP) Efektif Semester 2
| Komponen Perhitungan | Formula & Rincian | Hasil Jam Pelajaran (JP) |
| :--- | :--- | :-: |
| **a. Jumlah Pekan Efektif KBM** | ${sem2EffWeeks} Pekan | ${sem2EffWeeks} Pekan |
| **b. Alokasi Waktu Mengajar** | ${jpPerWk} JP / Pekan | ${jpPerWk} JP / Minggu |
| **c. Jumlah Total Jam Efektif** | ${sem2EffWeeks} Pekan × ${jpPerWk} JP | **${sem2TotalJp} JP** |
| **d. Cadangan Jam Pelajaran** | Asesmen Sumatif Akhir, Pengayaan & Selebrasi Karya | 6 JP |
| **e. Jam Efektif Tatap Muka KBM** | Total Jam Efektif - Cadangan Jam | **${sem2TotalJp - 6} JP** |

---

### E. REKAPITULASI ALOKASI WAKTU 1 TAHUN PELAJARAN (SEMESTER 1 & 2)
| No | Semester | Jumlah Pekan Kalender | Pekan Tidak Efektif | Pekan Efektif | Total Jam Efektif (JP) | Cadangan Jam (JP) | Jam Tatap Muka KBM (JP) |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: | :-: |
| 1 | **Semester 1 (Ganjil)** | 26 Pekan | 7 Pekan | ${sem1EffWeeks} Pekan | ${sem1TotalJp} JP | 6 JP | ${sem1TotalJp - 6} JP |
| 2 | **Semester 2 (Genap)** | 26 Pekan | 8 Pekan | ${sem2EffWeeks} Pekan | ${sem2TotalJp} JP | 6 JP | ${sem2TotalJp - 6} JP |
| **TOTAL** | **1 Tahun Pelajaran** | **52 Pekan** | **15 Pekan** | **${sem1EffWeeks + sem2EffWeeks} Pekan** | **${sem1TotalJp + sem2TotalJp} JP** | **12 JP** | **${sem1TotalJp + sem2TotalJp - 12} JP** |

---

### F. TABEL DISTRIBUSI ALOKASI WAKTU (JP) & SIKLUS DEEP LEARNING PER BAB
*(Siklus Deep Learning per Bab: Eksplorasi Berkesadaran Mindful ➔ Inkuiri & Pemecahan Masalah Meaningful ➔ Kreasi Inovasi Joyful)*  
*Catatan Rumus Perhitungan: Alokasi JP per BAB = Total JP Semester ÷ Jumlah BAB (contoh: 50 JP ÷ 2 BAB = 25 JP). Jumlah Pertemuan per BAB = Alokasi JP BAB ÷ Beban JP/Minggu (contoh: 25 JP ÷ 5 JP/Minggu = 5 Kali Pertemuan).*

#### 1. Distribusi Alokasi Waktu Semester 1 (Ganjil)
| No | Kode TP | Bab / Lingkup Materi Pokok | Alokasi Waktu (JP) | Beban JP / Minggu | Jumlah Pertemuan | Rincian Tatap Muka RPM | Integrasi Siklus Deep Learning |
| :-: | :--- | :--- | :-: | :-: | :-: | :--- | :--- |
${sem1Materials.length > 0 ? sem1Materials.map((m, idx) => {
  const jp = Number(m.allocatedHours) || 25;
  const meetings = Math.max(1, Math.round(jp / jpPerWk));
  return `| ${idx + 1} | ${m.tpCode || `TP.${grade}.1.${idx + 1}`} | ${m.essentialMaterial || m.tpName || `Bab ${idx + 1}`} | **${jp} JP** | ${jpPerWk} JP / Minggu | **${meetings} Pertemuan** | ${meetings} Pertemuan × ${jpPerWk} JP | Mindful Discovery & Meaningful Inquiry |`;
}).join('\n') : `| 1 | TP.${grade}.1.1 | Bab 1: Eksplorasi Konseptual & Prinsip Awal ${subject} | **25 JP** | ${jpPerWk} JP / Minggu | **${Math.max(1, Math.round(25 / jpPerWk))} Pertemuan** | ${Math.max(1, Math.round(25 / jpPerWk))} Pertemuan × ${jpPerWk} JP | Mindful Discovery & Inkuiri |
| 2 | TP.${grade}.1.2 | Bab 2: Analisis Kritis & Penerapan Kasus Terpadu | **25 JP** | ${jpPerWk} JP / Minggu | **${Math.max(1, Math.round(25 / jpPerWk))} Pertemuan** | ${Math.max(1, Math.round(25 / jpPerWk))} Pertemuan × ${jpPerWk} JP | Meaningful Problem Solving & Joyful Lab |`}
| - | - | **Cadangan Jam Pelajaran & Asesmen Sumatif Semester 1** | **6 JP** | ${jpPerWk} JP / Minggu | **${Math.max(1, Math.round(6 / jpPerWk))} Pertemuan** | ASTS / ASAS / Remedial | Kalender Pendidikan & Evaluasi |
| **TOTAL** | | **Jumlah Jam Pelajaran Semester Ganjil** | **${sem1TotalJp} JP** | **${jpPerWk} JP / Minggu** | **${sem1EffWeeks} Pertemuan** | **${sem1TotalJp} JP KBM Efektif** | **100% Selaras Kaldik & RPM** |

#### 2. Distribusi Alokasi Waktu Semester 2 (Genap)
| No | Kode TP | Bab / Lingkup Materi Pokok | Alokasi Waktu (JP) | Beban JP / Minggu | Jumlah Pertemuan | Rincian Tatap Muka RPM | Integrasi Siklus Deep Learning |
| :-: | :--- | :--- | :-: | :-: | :-: | :--- | :--- |
${sem2Materials.length > 0 ? sem2Materials.map((m, idx) => {
  const startIdx = (sem1Materials.length > 0 ? sem1Materials.length : 2) + idx + 1;
  const jp = Number(m.allocatedHours) || 25;
  const meetings = Math.max(1, Math.round(jp / jpPerWk));
  return `| ${startIdx} | ${m.tpCode || `TP.${grade}.2.${idx + 1}`} | ${m.essentialMaterial || m.tpName || `Bab ${startIdx}`} | **${jp} JP** | ${jpPerWk} JP / Minggu | **${meetings} Pertemuan** | ${meetings} Pertemuan × ${jpPerWk} JP | Meaningful Inquiry & Joyful Project |`;
}).join('\n') : `| 3 | TP.${grade}.2.1 | Bab 3: Integrasi Lanjutan & Model Pemecahan Masalah | **25 JP** | ${jpPerWk} JP / Minggu | **${Math.max(1, Math.round(25 / jpPerWk))} Pertemuan** | ${Math.max(1, Math.round(25 / jpPerWk))} Pertemuan × ${jpPerWk} JP | Meaningful Eksplorasi Lanjutan |
| 4 | TP.${grade}.2.2 | Bab 4: Gelar Karya Inovasi & Refleksi Komprehensif | **25 JP** | ${jpPerWk} JP / Minggu | **${Math.max(1, Math.round(25 / jpPerWk))} Pertemuan** | ${Math.max(1, Math.round(25 / jpPerWk))} Pertemuan × ${jpPerWk} JP | Joyful Kolaborasi & Pameran Karya |`}
| - | - | **Cadangan Jam Pelajaran & Asesmen Sumatif Akhir Tahun** | **6 JP** | ${jpPerWk} JP / Minggu | **${Math.max(1, Math.round(6 / jpPerWk))} Pertemuan** | ASAS Genap & Kenaikan | Kalender Pendidikan & Evaluasi |
| **TOTAL** | | **Jumlah Jam Pelajaran Semester Genap** | **${sem2TotalJp} JP** | **${jpPerWk} JP / Minggu** | **${sem2EffWeeks} Pertemuan** | **${sem2TotalJp} JP KBM Efektif** | **100% Selaras Kaldik & RPM** |

---

${buildOfficialLembarPengesahan({
  title: 'ANALISIS ALOKASI WAKTU & RINCIAN PEKAN EFEKTIF (RBE)',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Analisis Alokasi Waktu dan Rincian Pekan Efektif (RBE) mata pelajaran **${subject}** (${phase} / Kelas ${grade}) ini telah diperiksa, disetujui, dan disahkan sebagai acuan resmi pelaksanaan Kegiatan Belajar Mengajar berbasis Kurikulum Merdeka dan Pendekatan Deep Learning (*Mindful, Meaningful, & Joyful Learning*) pada Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
    }

    case 'prota': {
      const resolvedGradeRoman = typeof grade === 'number' ? (
        grade === 1 ? 'I' : grade === 2 ? 'II' : grade === 3 ? 'III' : grade === 4 ? 'IV' : grade === 5 ? 'V' : grade === 6 ? 'VI' :
        grade === 7 ? 'VII' : grade === 8 ? 'VIII' : grade === 9 ? 'IX' :
        grade === 10 ? 'X' : grade === 11 ? 'XI' : grade === 12 ? 'XII' : `${grade}`
      ) : `${grade}`;
      const resolvedGradeWords = typeof grade === 'number' ? (
        grade === 1 ? 'Satu' : grade === 2 ? 'Dua' : grade === 3 ? 'Tiga' : grade === 4 ? 'Empat' : grade === 5 ? 'Lima' : grade === 6 ? 'Enam' :
        grade === 7 ? 'Tujuh' : grade === 8 ? 'Delapan' : grade === 9 ? 'Sembilan' :
        grade === 10 ? 'Sepuluh' : grade === 11 ? 'Sebelas' : grade === 12 ? 'Dua Belas' : `${grade}`
      ) : `${grade}`;
      const resolvedGradeDisplay = `${resolvedGradeRoman} (${resolvedGradeWords})`;

      // Resolve materials from distributionData or active/synced materials
      const sem1Mats = (distributionData?.materialsSem1 && distributionData.materialsSem1.length > 0)
        ? distributionData.materialsSem1
        : (sem1Materials.length > 0 ? sem1Materials : [
            { essentialMaterial: `Konsep Dasar & Karakteristik Pokok ${subject}`, tpName: `Peserta didik mampu memahami dan menganalisis konsep dasar ${subject}`, tpCode: `TP.${grade}.1`, allocatedHours: 18 },
            { essentialMaterial: `Prinsip Ilmiah & Fenomena Kontekstual ${subject}`, tpName: `Peserta didik mampu menerapkan prinsip ilmiah dalam memecahkan masalah kontekstual ${subject}`, tpCode: `TP.${grade}.2`, allocatedHours: 18 },
            { essentialMaterial: `Penyelidikan Terstruktur & Analisis Sistem ${subject}`, tpName: `Peserta didik mampu merancang dan melakukan penyelidikan terstruktur ${subject}`, tpCode: `TP.${grade}.3`, allocatedHours: 14 }
          ]);

      const sem2Mats = (distributionData?.materialsSem2 && distributionData.materialsSem2.length > 0)
        ? distributionData.materialsSem2
        : (sem2Materials.length > 0 ? sem2Materials : [
            { essentialMaterial: `Eksplorasi Lanjutan & Variabel Kompleks ${subject}`, tpName: `Peserta didik mampu menganalisis keterkaitan variabel kompleks ${subject}`, tpCode: `TP.${grade}.4`, allocatedHours: 18 },
            { essentialMaterial: `Aplikasi Rekayasa Terapan & Solusi Nyata ${subject}`, tpName: `Peserta didik mampu menciptakan model solusi rekayasa terapan ${subject}`, tpCode: `TP.${grade}.5`, allocatedHours: 18 },
            { essentialMaterial: `Gelar Karya Inovasi & Refleksi Terpadu ${subject}`, tpName: `Peserta didik mampu mengevaluasi dan mempresentasikan produk karya inovatif ${subject}`, tpCode: `TP.${grade}.6`, allocatedHours: 14 }
          ]);

      const allMats = [
        ...sem1Mats.map((m, idx) => ({ ...m, semester: 'Ganjil', semNumber: 1, globalIndex: idx + 1 })),
        ...sem2Mats.map((m, idx) => ({ ...m, semester: 'Genap', semNumber: 2, globalIndex: sem1Mats.length + idx + 1 }))
      ];

      // Build decomposed sub-TP rows for each Bab
      let grandTotalJP = 0;
      const protaRows: string[] = [];

      allMats.forEach((mat, bIdx) => {
        const babNum = mat.globalIndex;
        const babTitle = mat.essentialMaterial || mat.tpName || `Bab ${babNum}`;
        const totalBabJp = Number(mat.allocatedHours) || (level === 'SD' ? 16 : level === 'SMP' ? 18 : 20);
        grandTotalJP += totalBabJp;

        // Check if there are sub-materials / sub-topics specified
        const subItems = (mat.subTopics && mat.subTopics.length > 0)
          ? mat.subTopics
          : (mat.essentialMaterial && mat.essentialMaterial.includes(','))
            ? mat.essentialMaterial.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];

        if (subItems.length > 0) {
          const jpPerSub = Math.max(2, Math.floor(totalBabJp / subItems.length));
          let allocatedSoFar = 0;

          subItems.forEach((subTitle: string, sIdx: number) => {
            const isLast = sIdx === subItems.length - 1;
            const subJp = isLast ? (totalBabJp - allocatedSoFar) : jpPerSub;
            allocatedSoFar += subJp;

            const tpText = sIdx === 0
              ? `Peserta didik dapat menerapkan konsep dasar, menganalisis prinsip utama, dan mengidentifikasi formulasi esensial terkait **${subTitle}** secara matematis dan kontekstual dengan benar.`
              : sIdx === 1
              ? `Peserta didik dapat menganalisis hubungan antarvariabel, melakukan perhitungan ilmiah, dan menyelesaikan permasalahan kontekstual terkait **${subTitle}** dengan teliti.`
              : sIdx === 2
              ? `Peserta didik mampu mengidentifikasi aplikasi konsep **${subTitle}** dalam rekayasa teknologi dan kehidupan nyata dengan pemahaman mendalam.`
              : `Peserta didik dapat merancang proyek eksperimen/solusi terapan, mengevaluasi data, dan menyajikan hasil analisis terkait **${subTitle}** dengan cermat dan bertanggung jawab.`;

            const babCol = sIdx === 0 ? `**Bab ${babNum} : ${babTitle}**` : '';
            protaRows.push(`| ${babCol} | ${tpText} | ${subTitle} | ${subJp} JP |`);
          });
        } else {
          // Default 3 authentic sub-components per Bab aligned with 3 Pillars of Deep Learning
          const chunkJp = Math.max(2, Math.floor(totalBabJp / 3));
          const jp1 = chunkJp;
          const jp2 = chunkJp;
          const jp3 = Math.max(2, totalBabJp - (jp1 + jp2));

          const sub1Title = `${babTitle} — Fondasi Konsep & Karakteristik Pokok (Mindful)`;
          const sub2Title = `${babTitle} — Inkuiri Kritis, Formulasi & Analisis Masalah (Meaningful)`;
          const sub3Title = `${babTitle} — Rekayasa Terapan, Gelar Karya & Refleksi 3-2-1 (Joyful)`;

          const tp1 = `Peserta didik (**A**) mampu **mengidentifikasi dan menganalisis** (**B**) karakteristik dasar serta fenomena esensial terkait **${babTitle}** melalui pengamatan kontekstual (**C**) secara kritis, berkesadaran penuh, dan mandiri (**D**).`;
          const tp2 = `Peserta didik (**A**) mampu **menerapkan formulasi ilmiah, mengolah data empiris, dan memecahkan permasalahan** (**B**) kontekstual nyata terkait **${babTitle}** melalui inkuiri terbimbing (**C**) dengan akurat, teliti, dan kolaboratif (**D**).`;
          const tp3 = `Peserta didik (**A**) mampu **merancang karya/solusi inovatif, menyajikan laporan pameran karya (*gallery walk*), serta merefleksikan proses belajar** (**B**) materi **${babTitle}** (**C**) secara estetis, komunikatif, dan penuh antusiasme (**D**).`;

          protaRows.push(`| **Bab ${babNum} : ${babTitle}** | ${tp1} | ${sub1Title} | ${jp1} JP |`);
          protaRows.push(`| | ${tp2} | ${sub2Title} | ${jp2} JP |`);
          protaRows.push(`| | ${tp3} | ${sub3Title} | ${jp3} JP |`);
        }
      });

      return `# PROGRAM TAHUNAN (PROTA)
## KURIKULUM MERDEKA — PENDEKATAN DEEP LEARNING
### (MINDFUL, MEANINGFUL, & JOYFUL LEARNING) — TAHUN PELAJARAN ${resolvedAcademicYear}

---

### IDENTITAS PROGRAM
* **Nama Sekolah / Satuan Pendidikan:** **${schoolName}**
* **Nama Penyusun / Guru:** **${teacherName}**
* **NIP Guru:** ${teacherNip}
* **Mata Pelajaran:** **${subject}**
* **Fase, Kelas / Jenjang:** **${phase}, Kelas ${resolvedGradeDisplay} (${level})**
* **Semester:** I (Ganjil) & II (Genap) — 1 Tahun Pelajaran Penuh
* **Pendekatan & Model:** **Deep Learning (Mindful, Meaningful, & Joyful Learning)**
* **Tahun Pelajaran:** **${resolvedAcademicYear}**
* **Total Alokasi Waktu:** **${grandTotalJP} JP (Jam Pelajaran)**

---

### TABEL PROGRAM TAHUNAN (PROTA) 4 KOLOM
| Bab | Alur Tujuan Pembelajaran (3 Pilar Deep Learning) | Materi / Ruang Lingkup | Alokasi Waktu |
| :--- | :--- | :--- | :---: |
${protaRows.join('\n')}
| **Total** | | | **${grandTotalJP} JP** |

---

${buildOfficialLembarPengesahan({
  title: 'PROGRAM TAHUNAN (PROTA)',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Program Tahunan (PROTA) mata pelajaran **${subject}** (${phase} / Kelas ${grade}) ini telah diverifikasi dan disahkan sebagai pedoman alokasi waktu dan distribusi alur tujuan pembelajaran selama satu tahun pelajaran berbasis Kurikulum Merdeka dan Pendekatan Deep Learning (*Mindful, Meaningful, & Joyful Learning*) pada Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
    }

    case 'promes':
    case 'prosem': {
      const isGanjil = isSem1Only;
      const hoursPerWeek = Number(params.distributionData?.jpPerWeek || params.distributionData?.hoursPerWeek || syncedContext.jpPerWeek) || 2;
      const resolvedGradeText = typeof grade === 'number' ? (
        grade === 1 ? 'I' : grade === 2 ? 'II' : grade === 3 ? 'III' : grade === 4 ? 'IV' : grade === 5 ? 'V' : grade === 6 ? 'VI' :
        grade === 7 ? 'VII' : grade === 8 ? 'VIII' : grade === 9 ? 'IX' :
        grade === 10 ? 'X' : grade === 11 ? 'XI' : grade === 12 ? 'XII' : `${grade}`
      ) : `${grade}`;
      const resolvedGradeWords = typeof grade === 'number' ? (
        grade === 1 ? 'Satu' : grade === 2 ? 'Dua' : grade === 3 ? 'Tiga' : grade === 4 ? 'Empat' : grade === 5 ? 'Lima' : grade === 6 ? 'Enam' :
        grade === 7 ? 'Tujuh' : grade === 8 ? 'Delapan' : grade === 9 ? 'Sembilan' :
        grade === 10 ? 'Sepuluh' : grade === 11 ? 'Sebelas' : grade === 12 ? 'Duabelas' : `${grade}`
      ) : `${grade}`;

      // Resolve materials based on semester from parameters / distributionData / activeMaterials
      const semMats = isGanjil ? (
        (distributionData?.materialsSem1 && distributionData.materialsSem1.length > 0)
          ? distributionData.materialsSem1
          : (sem1Materials.length > 0 ? sem1Materials : [
              { essentialMaterial: `PERJUANGAN MEMPERTAHANKAN KEMERDEKAAN`, allocatedHours: 16, tpCount: 3, tpName: `1.1 menganalisis secara kritis dinamika kehidupan bangsa Indonesia pada masa Revolusi 1945— 1950 dari berbagai perspektif;\n1.2 merefleksikannya untuk kehidupan masa kini dan masa depan;\n1.3 melaporkannya dalam bentuk tulisan atau lainnya.` },
              { essentialMaterial: `DEMOKRASI LIBERAL HINGGA MASA DEMOKRASI TERPIMPIN (1950—1966)`, allocatedHours: 18, tpCount: 1, tpName: `2.1 Murid mampu mengevaluasi secara kritis dinamika kehidupan bangsa Indonesia pada periode 1950—1966 dari berbagai perspektif dan merefleksikannya untuk kehidupan masa kini dan masa depan, serta melaporkannya dalam bentuk tulisan atau lainnya.` }
            ])
      ) : (
        (distributionData?.materialsSem2 && distributionData.materialsSem2.length > 0)
          ? distributionData.materialsSem2
          : (sem2Materials.length > 0 ? sem2Materials : [
              { essentialMaterial: `INDONESIA MASA ORDE BARU (1966—1998)`, allocatedHours: 18, tpCount: 1, tpName: `3.1 Murid mampu mengevaluasi secara kritis dinamika kehidupan bangsa Indonesia di bawah pemerintahan Orde Baru dari berbagai perspektif dan merefleksikannya untuk kehidupan masa kini dan masa depan, serta melaporkannya dalam bentuk tulisan atau lainnya` },
              { essentialMaterial: `INDONESIA MASA REFORMASI`, allocatedHours: 16, tpCount: 1, tpName: `4.1 Murid mampu mengevaluasi secara kritis dinamika kehidupan bangsa Indonesia di masa Reformasi dari berbagai perspektif dan merefleksikannya untuk kehidupan masa kini dan masa depan, serta melaporkannya dalam bentuk tulisan atau lainnya` }
            ])
      );

      // Resolve Capaian Pembelajaran text and Elemen for header section
      const cpText = params.cpText || (distributionData as any)?.cpText || (syncedContext.activeMaster as any)?.cpText || schoolProfile.cpText || 
        `Pada akhir Fase ${phase}, Murid menguasai sejumlah kompetensi, yakni bisa berpikir historis, melakukan literasi sejarah, penelitian dan penulisan sejarah secara sederhana, menunjukkan sikap dan perilaku kesadaran Sejarah dan empati Sejarah, serta menghasilkan projek Sejarah dalam bentuk produk digital dan non digital.`;

      const cpPemahamanKonsep = `Pada akhir fase ${phase} Murid memahami penjelajahan dan penjajahan bangsa Barat, pergerakan kebangsaan Indonesia pendudukan Jepang dan Proklamasi, masa mempertahankan kemerdekaan, Orde Lama, Orde Baru dan Reformasi menggunakan konsep dasar ilmu sejarah untuk menganalisis keterkaitan masa lalu dengan masa kini dan masa depan serta menemukan berbagai hal yang menunjukkan perubahan dan keberlanjutan yang terjadi dalam kehidupan bangsa Indonesia.`;

      const cpKeterampilanProses = `Secara umum Murid menunjukkan kesadaran sejarah melalui proses inkuiri (mengamati fenomena Sejarah, menanya, mengumpulkan informasi, menganalisis informasi, menarik kesimpulan, serta mengkomunikasikannya secara lisan dan atau tertulis).<br/><br/>
Secara spesifik keterampilan proses belajar Sejarah mencakup keterampilan berpikir kronologis, pemahaman Sejarah, analisis dan interpretasi Sejarah, kemampuan riset dan literasi Sejarah dan analisis isu kesejarahan serta pengambilan keputusan, dan kebermaknaan peristiwa Sejarah.`;

      const masterElements = (distributionData as any)?.elements || (syncedContext.activeMaster as any)?.elements || [];
      let elementsRowsHtml = '';
      if (masterElements && masterElements.length > 0) {
        elementsRowsHtml = masterElements.map((el: any) => `
      <tr>
        <td style="border: 1px solid #333333; padding: 6px; font-weight: bold; vertical-align: top; width: 180px;">${el.name || 'Elemen'}</td>
        <td style="border: 1px solid #333333; padding: 6px; text-align: justify; vertical-align: top; line-height: 1.4;">${el.description || el.content || ''}</td>
      </tr>`).join('');
      } else {
        elementsRowsHtml = `
      <tr>
        <td style="border: 1px solid #333333; padding: 6px; font-weight: bold; vertical-align: top; width: 180px;">Pemahaman Konsep</td>
        <td style="border: 1px solid #333333; padding: 6px; text-align: justify; vertical-align: top; line-height: 1.4;">${cpPemahamanKonsep}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #333333; padding: 6px; font-weight: bold; vertical-align: top; width: 180px;">Keterampilan Proses</td>
        <td style="border: 1px solid #333333; padding: 6px; text-align: justify; vertical-align: top; line-height: 1.4;">${cpKeterampilanProses}</td>
      </tr>`;
      }

      // Months & Colors header matching Educational Calendar (Kalender Pendidikan):
      const monthsHeader = isGanjil ? [
        { name: 'Juli', bg: '#FFF2CC', color: '#000000', weeks: 5 },
        { name: 'Agustus', bg: '#E2EFDA', color: '#000000', weeks: 5 },
        { name: 'September', bg: '#D9E1F2', color: '#000000', weeks: 5 },
        { name: 'Oktober', bg: '#FCE4D6', color: '#000000', weeks: 5 },
        { name: 'November', bg: '#F2DCDB', color: '#000000', weeks: 5 },
        { name: 'Desember', bg: '#D9ECF2', color: '#000000', weeks: 5 },
      ] : [
        { name: 'Januari', bg: '#FFF2CC', color: '#000000', weeks: 5 },
        { name: 'Februari', bg: '#E2EFDA', color: '#000000', weeks: 5 },
        { name: 'Maret', bg: '#D9E1F2', color: '#000000', weeks: 5 },
        { name: 'April', bg: '#FCE4D6', color: '#000000', weeks: 5 },
        { name: 'Mei', bg: '#F2DCDB', color: '#000000', weeks: 5 },
        { name: 'Juni', bg: '#D9ECF2', color: '#000000', weeks: 5 },
      ];

      // Total 30 week slots per semester (6 months x 5 weeks)
      // Define non-effective calendar weeks with tags and calendar colors
      const weekSlots = isGanjil ? [
        // Juli (0..4)
        { index: 0, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
        { index: 1, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
        { index: 2, isEffective: false, tag: 'MPLS', bg: '#90caf9', color: '#000000' },
        { index: 3, isEffective: true },
        { index: 4, isEffective: true },
        // Agustus (5..9)
        { index: 5, isEffective: true }, { index: 6, isEffective: true }, { index: 7, isEffective: true }, { index: 8, isEffective: true }, { index: 9, isEffective: true },
        // September (10..14)
        { index: 10, isEffective: true }, { index: 11, isEffective: true },
        { index: 12, isEffective: false, tag: 'PTS', bg: '#fef08a', color: '#854d0e' },
        { index: 13, isEffective: true }, { index: 14, isEffective: true },
        // Oktober (15..19)
        { index: 15, isEffective: true }, { index: 16, isEffective: true }, { index: 17, isEffective: true }, { index: 18, isEffective: true }, { index: 19, isEffective: true },
        // November (20..24)
        { index: 20, isEffective: true }, { index: 21, isEffective: true }, { index: 22, isEffective: true }, { index: 23, isEffective: true }, { index: 24, isEffective: true },
        // Desember (25..29)
        { index: 25, isEffective: false, tag: 'PAS', bg: '#fed7aa', color: '#9a3412' },
        { index: 26, isEffective: false, tag: 'RAPOR', bg: '#e2e8f0', color: '#334155' },
        { index: 27, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
        { index: 28, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
        { index: 29, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
      ] : [
        // Januari (0..4)
        { index: 0, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
        { index: 1, isEffective: true }, { index: 2, isEffective: true }, { index: 3, isEffective: true }, { index: 4, isEffective: true },
        // Februari (5..9)
        { index: 5, isEffective: true }, { index: 6, isEffective: true }, { index: 7, isEffective: true }, { index: 8, isEffective: true }, { index: 9, isEffective: true },
        // Maret (10..14)
        { index: 10, isEffective: true }, { index: 11, isEffective: true },
        { index: 12, isEffective: false, tag: 'PTS', bg: '#fef08a', color: '#854d0e' },
        { index: 13, isEffective: true }, { index: 14, isEffective: true },
        // April (15..19)
        { index: 15, isEffective: false, tag: 'LHR', bg: '#fed7aa', color: '#9a3412' },
        { index: 16, isEffective: false, tag: 'LHR', bg: '#fed7aa', color: '#9a3412' },
        { index: 17, isEffective: true }, { index: 18, isEffective: true }, { index: 19, isEffective: true },
        // Mei (20..24)
        { index: 20, isEffective: true }, { index: 21, isEffective: true }, { index: 22, isEffective: true }, { index: 23, isEffective: true },
        { index: 24, isEffective: false, tag: 'PAT', bg: '#fed7aa', color: '#9a3412' },
        // Juni (25..29)
        { index: 25, isEffective: false, tag: 'RAPOR', bg: '#e2e8f0', color: '#334155' },
        { index: 26, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
        { index: 27, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
        { index: 28, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
        { index: 29, isEffective: false, tag: 'LS', bg: '#94a3b8', color: '#ffffff' },
      ];

      const effectiveWeekIndices = weekSlots.filter(w => w.isEffective).map(w => w.index);

      // Material allocations & weekly matrix mapping
      const materialAllocations = semMats.map((m, idx) => {
        const matName = m.essentialMaterial || m.tpName || `Bab ${idx + 1}`;
        const rawJP = Number(m.allocatedHours) || (idx === 0 ? 16 : 18);
        return {
          id: m.id || `mat-${idx + 1}`,
          tpCode: m.tpCode || `TP.${idx + 1}`,
          name: matName,
          jp: rawJP,
          tpCount: Number(m.tpCount) || 1,
          tpName: m.tpName || '',
        };
      });

      let currentEffPointer = 0;
      const matrix: (number | string)[][] = materialAllocations.map(() => Array(30).fill(''));

      materialAllocations.forEach((m, mIdx) => {
        let remainingForMat = m.jp;
        while (remainingForMat > 0 && currentEffPointer < effectiveWeekIndices.length) {
          const wIdx = effectiveWeekIndices[currentEffPointer];
          const allocInWeek = Math.min(hoursPerWeek, remainingForMat);
          matrix[mIdx][wIdx] = allocInWeek;
          remainingForMat -= allocInWeek;
          if (allocInWeek === hoursPerWeek || remainingForMat <= 0) {
            currentEffPointer++;
          }
        }
      });

      // Weekly totals calculation across 30 weeks
      const weeklyTotals: number[] = Array(30).fill(0);
      for (let w = 0; w < 30; w++) {
        let sum = 0;
        for (let m = 0; m < materialAllocations.length; m++) {
          const val = matrix[m][w];
          if (typeof val === 'number') sum += val;
        }
        weeklyTotals[w] = sum;
      }

      // HTML Month Headers with Calendar Colors
      const monthThsHtml = monthsHeader.map(m =>
        `<th colspan="${m.weeks}" style="border: 1px solid #333333; background-color: ${m.bg}; color: ${m.color}; padding: 6px 3px; font-weight: bold; font-size: 9.5pt; text-align: center;">${m.name}</th>`
      ).join('');

      // HTML Week Number Headers (1 2 3 4 5 under each month)
      const weekThsHtml = monthsHeader.flatMap(m =>
        Array.from({ length: m.weeks }, (_, i) => `<th style="border: 1px solid #333333; background-color: ${m.bg}; color: ${m.color}; padding: 3px 1px; font-size: 8.5pt; font-weight: bold; width: 22px; text-align: center;">${i + 1}</th>`)
      ).join('');

      // HTML Table Body Rows (Bab Banner Rows + TP Rows)
      let globalBabOffset = isGanjil ? 0 : 2;
      const tableRowsHtml = materialAllocations.map((m, mIdx) => {
        const babNum = globalBabOffset + mIdx + 1;
        const babTitle = m.name;

        // Build TP content string
        let tpContentFormatted = '';
        if (m.tpName && m.tpName.trim().length > 0) {
          const lines = m.tpName.split('\n').filter(Boolean);
          tpContentFormatted = lines.map(line => `<div style="margin-bottom: 4px; line-height: 1.4;">${line}</div>`).join('');
        } else {
          tpContentFormatted = `<div style="margin-bottom: 4px; line-height: 1.4;">${babNum}.1 Peserta didik mampu menganalisis secara kritis dan komprehensif materi ${babTitle} secara mendalam.</div>`;
        }

        // Week cells for this Bab
        const cellsHtml = weekSlots.map(slot => {
          const val = matrix[mIdx][slot.index];
          if (!slot.isEffective) {
            return `<td style="border: 1px solid #333333; background-color: ${slot.bg}; color: ${slot.color}; font-size: 7.5pt; font-weight: bold; text-align: center; padding: 2px 0;">${slot.tag}</td>`;
          }
          return `<td style="border: 1px solid #333333; text-align: center; font-weight: ${val ? 'bold' : 'normal'}; padding: 4px 1px; ${val ? 'background-color: #e0f2fe; color: #0284c7;' : ''}">${val || ''}</td>`;
        }).join('');

        return `<!-- BAB ${babNum} HEADER ROW -->
        <tr style="background-color: #f3f4f6; font-weight: bold;">
          <td colspan="33" style="border: 1px solid #333333; padding: 6px 10px; text-align: left; font-size: 9.5pt; text-transform: uppercase;">
            BAB ${babNum} : ${babTitle}
          </td>
        </tr>
        <!-- BAB ${babNum} TP ROW -->
        <tr style="background-color: #ffffff;">
          <td style="border: 1px solid #333333; padding: 6px; text-align: center; vertical-align: top; font-weight: bold; font-size: 9pt;">
            ${babNum}
          </td>
          <td style="border: 1px solid #333333; padding: 6px 8px; text-align: left; vertical-align: top; font-size: 9pt;">
            ${tpContentFormatted}
          </td>
          <td style="border: 1px solid #333333; padding: 6px 4px; font-weight: bold; text-align: center; vertical-align: middle; background-color: #f8fafc; font-size: 9pt;">
            ${m.jp} JP
          </td>
          ${cellsHtml}
        </tr>`;
      }).join('');

      // Weekly total cells
      const weeklyTotalCellsHtml = weekSlots.map(slot => {
        if (!slot.isEffective) {
          return `<td style="border: 1px solid #333333; background-color: ${slot.bg}; color: ${slot.color}; font-weight: bold; font-size: 7.5pt; text-align: center;">${slot.tag}</td>`;
        }
        const tot = weeklyTotals[slot.index];
        return `<td style="border: 1px solid #333333; font-weight: bold; padding: 4px 1px; text-align: center; font-size: 8.5pt;">${tot || ''}</td>`;
      }).join('');

      const totalSemesterJP = materialAllocations.reduce((s, m) => s + m.jp, 0);

      // Resolve waka kurikulum name from params or profile fallback
      const wakaName = (params as any).wakaName || (schoolProfile as any)?.wakaName || 'Alpiyan Prasetiya Marasabessy, S.Pd., Gr.';
      const wakaNip = (params as any).wakaNip || (schoolProfile as any)?.wakaNip || '199010062019031013';

      return `<div style="background-color: #b4d6e4; color: #000000; padding: 12px; text-align: center; border: 1.5px solid #000000; margin-bottom: 20px;">
  <div style="font-size: 14pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">PROGRAM SEMESTER ( PROSEM )</div>
  <div style="font-size: 11pt; font-weight: bold; margin-top: 2px;">FASE ${phase} KELAS ${resolvedGradeText}</div>
</div>

<table style="width: 100%; border: none; margin-bottom: 18px; font-size: 10pt; font-family: inherit; line-height: 1.5;">
  <tr>
    <td style="width: 160px; font-weight: bold; border: none; padding: 3px 0;">Satuan Pendidikan</td>
    <td style="border: none; padding: 3px 0;">: <strong>${schoolName}</strong></td>
  </tr>
  <tr>
    <td style="font-weight: bold; border: none; padding: 3px 0;">Mata Pelajaran</td>
    <td style="border: none; padding: 3px 0;">: <strong>${subject}</strong></td>
  </tr>
  <tr>
    <td style="font-weight: bold; border: none; padding: 3px 0;">Kelas / Semester</td>
    <td style="border: none; padding: 3px 0;">: <strong>${resolvedGradeText} (${resolvedGradeWords}) / ${isGanjil ? 'GANJIL' : 'GENAP'}</strong></td>
  </tr>
  <tr>
    <td style="font-weight: bold; border: none; padding: 3px 0;">Tahun Penyusunan</td>
    <td style="border: none; padding: 3px 0;">: <strong>${resolvedAcademicYear}</strong></td>
  </tr>
</table>

<div style="margin-bottom: 20px;">
  <div style="font-weight: bold; font-size: 10.5pt; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #333333; padding-bottom: 4px;">
    CAPAIAN PEMBELAJARAN ${subject.toUpperCase()} FASE ${phase}
  </div>
  <div style="font-size: 9.5pt; text-align: justify; line-height: 1.5; margin-bottom: 12px;">
    ${cpText}
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; border: 1px solid #333333;">
    <thead>
      <tr style="background-color: #f1f5f9; font-weight: bold; text-align: center;">
        <th style="border: 1px solid #333333; padding: 6px; width: 180px;">Elemen</th>
        <th style="border: 1px solid #333333; padding: 6px;">Capaian Pembelajaran</th>
      </tr>
    </thead>
    <tbody>
      ${elementsRowsHtml}
    </tbody>
  </table>
</div>

<div style="overflow-x: auto; margin: 16px 0;">
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; border: 1.5px solid #000000; text-align: center;">
    <thead>
      <tr style="background-color: #e2e8f0; color: #000000; font-weight: bold;">
        <th rowspan="2" style="border: 1px solid #333333; padding: 6px 4px; width: 35px; text-align: center; vertical-align: middle;">No</th>
        <th rowspan="2" style="border: 1px solid #333333; padding: 6px 8px; width: 280px; text-align: center; vertical-align: middle;">TUJUAN PEMBELAJARAN</th>
        <th rowspan="2" style="border: 1px solid #333333; padding: 6px 4px; width: 60px; text-align: center; vertical-align: middle;">Alokasi Waktu</th>
        ${monthThsHtml}
      </tr>
      <tr style="color: #000000; font-weight: bold; font-size: 8pt;">
        ${weekThsHtml}
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
      <!-- BARIS JUMLAH JAM PELAJARAN -->
      <tr style="background-color: #e2e8f0; font-weight: bold;">
        <td style="border: 1px solid #333333; padding: 6px 8px; text-align: left; font-weight: bold;" colspan="2">JUMLAH JAM PELAJARAN</td>
        <td style="border: 1px solid #333333; padding: 6px 4px; font-weight: bold; text-align: center; background-color: #cbd5e1;">${totalSemesterJP} JP</td>
        ${weeklyTotalCellsHtml}
      </tr>
    </tbody>
  </table>
</div>

${buildOfficialLembarPengesahan({
  title: 'LEMBAR PENGESAHAN PROGRAM SEMESTER (PROSEM)',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  subject,
  grade,
  phase,
  academicYear: resolvedAcademicYear,
  customNote: `Dokumen **Program Semester (PROSEM)** ${resolvedSemesterLabel} mata pelajaran **${subject}** (${phase} / Kelas ${grade}) Tahun Pelajaran **${resolvedAcademicYear}** ini telah diverifikasi dan disahkan oleh Kepala Satuan Pendidikan untuk diberlakukan secara resmi sebagai pedoman distribusi materi mingguan dan alokasi waktu Kegiatan Belajar Mengajar (KBM).`,
})}
`;
    }

    case 'modul_ajar':
    case 'rpm':
    case 'rpm_deep_learning_master': {
      // 1. Resolve authentic CP text extracted from uploaded file / activeMaster
      const actualCP = params.cpText || (distributionData as any)?.cpText || (syncedContext.activeMaster as any)?.cpText || `Peserta didik memahami keanekaragaman hayati dan fenomena esensial pada materi ${topic}, serta mampu menerapkan prinsip ilmiah, mengidentifikasi hubungan antarvariabel, dan memecahkan permasalahan kontekstual di kehidupan sehari-hari.`;

      // 2. Resolve authentic TP formulation from manualTP or uploaded file materials with explicit TP codes
      let tpFormattedList = '';
      const matchingMaterials = activeMaterials ? activeMaterials.filter(m => 
        m.essentialMaterial?.toLowerCase().includes(topic.toLowerCase()) || 
        topic.toLowerCase().includes(m.essentialMaterial?.toLowerCase() || '') ||
        m.tpName?.toLowerCase().includes(topic.toLowerCase())
      ) : [];
      const materialsToUse = matchingMaterials.length > 0 ? matchingMaterials : (activeMaterials?.slice(0, Math.max(1, meetingCount)) || []);

      if (manualTP && manualTP.trim().length > 0) {
        // Ensure manual TP has [TP.X.Y] code if not already formatted
        const lines = manualTP.trim().split('\n').filter(Boolean);
        tpFormattedList = lines.map((line, idx) => {
          const cleanText = line.replace(/^(\d+[\.\)\-:]|\-|\*|\•)\s*/, '').trim();
          if (cleanText.startsWith('[TP.') || cleanText.startsWith('TP.')) {
            return `${idx + 1}. ${cleanText}`;
          }
          const defaultCode = materialsToUse[idx]?.tpCode || `TP.${grade}.${idx + 1}`;
          return `${idx + 1}. [${defaultCode}] ${cleanText}`;
        }).join('\n');
      } else if (materialsToUse.length > 0) {
        const allTPs: { code: string; name: string }[] = [];
        materialsToUse.forEach((m, mIdx) => {
          const rawLines = (m.tpName || '').split('\n').map(l => l.trim()).filter(Boolean);
          if (rawLines.length > 1) {
            rawLines.forEach((line, subIdx) => {
              const cleanText = line.replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/, '').trim();
              const subCode = m.tpCode ? `${m.tpCode}.${subIdx + 1}` : `TP.${grade}.${mIdx + 1}.${subIdx + 1}`;
              allTPs.push({ code: subCode, name: cleanText });
            });
          } else {
            const cleanText = (m.tpName || '').replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/, '').trim();
            allTPs.push({ code: m.tpCode || `TP.${grade}.${mIdx + 1}`, name: cleanText || m.essentialMaterial });
          }
        });
        tpFormattedList = allTPs.map((t, idx) => `${idx + 1}. [${t.code}] ${t.name}`).join('\n');
      }

      if (!tpFormattedList) {
        tpFormattedList = `1. [TP.${grade}.1.1.1] Menganalisis konsep esensial, karakteristik utama, dan prinsip dasar materi ${topic}.
2. [TP.${grade}.1.1.2] Peserta didik mampu menerapkan prinsip, mengidentifikasi hubungan variabel, dan memecahkan permasalahan kontekstual terkait ${topic}.`;
      }

      // 3. Resolve sub-topics for meetings and link each meeting to its corresponding TP Code
      const extractedSubTopicsFromTP: string[] = [];
      const extractedTPCodes: string[] = [];

      if (manualTP && manualTP.trim().length > 0) {
        const manualLines = manualTP.trim().split('\n').map(l => l.trim()).filter(Boolean);
        manualLines.forEach((line, idx) => {
          const codeMatch = line.match(/\[(TP\.[^\]]+)\]/i);
          const cleanText = line.replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/, '').trim();
          if (cleanText) extractedSubTopicsFromTP.push(cleanText);
          extractedTPCodes.push(codeMatch ? codeMatch[1] : (materialsToUse[idx]?.tpCode || `TP.${grade}.${idx + 1}`));
        });
      } else if (matchingMaterials.length > 0) {
        matchingMaterials.forEach((m, mIdx) => {
          const rawLines = (m.tpName || '').split('\n').map(l => l.trim()).filter(Boolean);
          rawLines.forEach((line, subIdx) => {
            const cleanText = line.replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/, '').trim();
            if (cleanText) extractedSubTopicsFromTP.push(cleanText);
            const subCode = m.tpCode ? (rawLines.length > 1 ? `${m.tpCode}.${subIdx + 1}` : m.tpCode) : `TP.${grade}.${mIdx + 1}.${subIdx + 1}`;
            extractedTPCodes.push(subCode);
          });
        });
      }

      // Ensure resolvedSubTopics has exactly meetingCount elements with rich contextual titles
      const resolvedSubTopics: string[] = [];
      for (let i = 0; i < meetingCount; i++) {
        if (subTopics && subTopics[i]) {
          resolvedSubTopics.push(subTopics[i]);
        } else if (extractedSubTopicsFromTP[i]) {
          resolvedSubTopics.push(extractedSubTopicsFromTP[i]);
        } else if (meetingCount === 1) {
          resolvedSubTopics.push(`Konsep Dasar, Penyelidikan Inkuiri, dan Pemecahan Masalah ${topic}`);
        } else if (i === 0) {
          resolvedSubTopics.push(`Pengenalan Fenomena, Konsep Esensial, dan Eksplorasi Inkuiri Terbimbing ${topic}`);
        } else if (i === 1) {
          resolvedSubTopics.push(`Penyelidikan Terstruktur, Analisis Hubungan Antarvariabel, dan Penguatan Ilmiah ${topic}`);
        } else if (i === 2) {
          resolvedSubTopics.push(`Formulasi Ilmiah, Aplikasi Teknologi, dan Pemecahan Masalah Nyata HOTS ${topic}`);
        } else if (i === 3) {
          resolvedSubTopics.push(`Studi Kasus Rekayasa Terapan & Desain Solusi Kolaboratif ${topic}`);
        } else {
          resolvedSubTopics.push(`Sintesis Komprehensif, Proyek Kreatif & Evaluasi Terpadu ${topic} (Tahap ${i + 1})`);
        }
      }

      // Sub-materi formatted for Module Identity table
      const subMateriTableFormatted = resolvedSubTopics.map((st, i) => {
        const code = extractedTPCodes[i] || materialsToUse[i]?.tpCode || `TP.${grade}.1.1.${i + 1}`;
        const cleanSt = st.replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/, '').trim();
        return `[${code}] ${cleanSt}`;
      }).join('; ');

      // 4. Generate dynamic meeting tables following the authentic Deep Learning RPM format exactly
      let meetingsContent = '';
      for (let m = 1; m <= meetingCount; m++) {
        const rawSubMateriM = resolvedSubTopics[m - 1] || `${topic} - Pertemuan Ke-${m}`;
        const cleanSubMateriM = rawSubMateriM.replace(/^(\d+[\.\)\-:]|\[TP\.[^\]]+\]|TP\.[^\s:]+[:\s]*|\-|\*|\•)\s*/, '').trim();
        const targetTPCode = extractedTPCodes[m - 1] || materialsToUse[m - 1]?.tpCode || (m === 1 ? `TP.${grade}.1.1.1` : `TP.${grade}.1.1.${m}`);
        const isFirstMeeting = m === 1;

        // Dynamic time allocation breakdown matching exact hoursPerMeeting * minutesPerJP
        const totalMeetingMinutes = hoursPerMeeting * minutesPerJP;
        const tPendahuluan = Math.max(10, Math.round(totalMeetingMinutes * 0.15));
        const tInti = Math.max(20, Math.round(totalMeetingMinutes * 0.70));
        const tPenutup = totalMeetingMinutes - tPendahuluan - tInti;
        const tFase2 = Math.round(tInti * 0.40);
        const tFase3 = Math.round(tInti * 0.35);
        const tFase4 = tInti - tFase2 - tFase3;
        const tFase5 = Math.round(tPenutup * 0.50);
        const tFase6 = tPenutup - tFase5;

        if (m > 1) {
          meetingsContent += `\n---\n<div style="page-break-before: always; margin-top: 1.5rem; margin-bottom: 1.5rem;"></div>\n`;
        }

        if (isFirstMeeting) {
          meetingsContent += `
### Pertemuan Ke ${m} (${totalMeetingMinutes} Menit)
**Materi / Sub Pokok Bahasan :** [${targetTPCode}] ${cleanSubMateriM}  
**Tujuan Pembelajaran (TP) :** [${targetTPCode}] ${cleanSubMateriM}

| TAHAP KEGIATAN | FASE SINTAKS DEEP LEARNING | ALOKASI WAKTU | KEGIATAN GURU (LENGKAP DARI AWAL MASUK KELAS) | KEGIATAN PESERTA DIDIK (AKTIF & RESPONSIF) | ASPEK 3 PILAR & 6C |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **A. KEGIATAN PENDAHULUAN** | **FASE 1: Orientasi, Apersepsi & Motivasi** | **${tPendahuluan} Menit** | 1. **Salam & Kondisi Kelas:** Guru memasuki ruang kelas dengan ramah dan mengucapkan salam pembuka bersemangat, memeriksa kebersihan ruang belajar, kerapian pakaian, dan kesiapan meja kursi.<br/>2. **Doa Bersama:** Guru meminta ketua kelas memimpin doa bersama sesuai keyakinan masing-masing (Religius & Beriman).<br/>3. **Presensi & Kesadaran Penuh (*Mindful Breathing*):** Guru mengecek kehadiran peserta didik dan memandu latihan pernapasan berkesadaran (Teknik STOP: *Stop, Take a breath, Observe, Proceed*) selama 2 menit untuk menenangkan pikiran dan memusatkan fokus belajar.<br/>4. **Apersepsi Kontekstual:** Guru menayangkan gambar/video pendek fenomena nyata seputar "${topic}" dan mengaitkannya dengan pengalaman keseharian siswa.<br/>5. **Pertanyaan Pemantik HOTS:** Guru mengajukan pertanyaan pemantik lisan:<br/>• *"Pernahkah kalian mengamati bagaimana [${targetTPCode}] ${cleanSubMateriM} bekerja di sekitar kita?"*<br/>• *"Mengapa pengukuran dan pemahaman konsep ini sangat penting bagi teknologi modern?"*<br/>6. **Penyampaian Tujuan & Skenario KBM:** Guru menyampaikan tujuan pembelajaran, peta konsep, tahapan kegiatan 6 fase Deep Learning, serta sistem asesmen formatif yang akan digunakan.<br/>7. **Pembentukan Kelompok:** Guru membagi kelas ke dalam kelompok heterogen (4-5 siswa per kelompok). | 1. Peserta didik menjawab salam guru dengan santun, tertib, dan bersemangat.<br/>2. Peserta didik berdoa bersama dengan khusyuk dipimpin ketua kelas.<br/>3. Peserta didik mengikuti panduan *Mindful Breathing* untuk menata fokus dan kehadiran diri.<br/>4. Peserta didik menyimak tayangan video apersepsi dengan penuh perhatian (*Mindful*).<br/>5. Peserta didik merespons pertanyaan pemantik secara spontan dan berani mengemukakan gagasan awal.<br/>6. Peserta didik mencatat tujuan pembelajaran di buku tulis dan mendengarkan skenario KBM.<br/>7. Peserta didik segera bergabung dengan anggota kelompoknya masing-masing secara tertib. | **Mindful Learning**<br/>• Beriman & Bertakwa<br/>• Kesadaran Diri (*Mindfulness*)<br/>• Komunikasi Awal |
| **B. KEGIATAN INTI** | **FASE 2: Eksplorasi Konsep & Penyelidikan Inkuiri** | **${tFase2} Menit** | 1. **Distribusi LKPD & Media:** Guru membagikan LKPD ${m} dan kit praktikum / media peraga kontekstual materi ${topic} kepada setiap kelompok.<br/>2. **Pembagian Peran Kerja:** Guru menginstruksikan setiap anggota kelompok memilih peran: Ketua Tim, Notulis Data, Pengamat / Pengambil Alat, dan Juru Bicara (Presenter).<br/>3. **Fasilitasi Eksplorasi:** Guru memfasilitasi peserta didik melakukan pengamatan objek nyata, pengukuran langsung, atau eksplorasi data inkuiri terstruktur pada LKPD.<br/>4. **Bimbingan Berjenjang (*Scaffolding*):** Guru berkeliling memantau jalannya diskusi, memberikan bimbingan khusus bagi kelompok yang memerlukan bantuan, dan mengajukan pertanyaan Sokratik untuk memancing pemahaman mendalam. | 1. Setiap kelompok menerima LKPD ${m} dan menyiapkan instrumen praktikum/eksplorasi.<br/>2. Peserta didik membagi tugas peran di dalam kelompok secara adil dan bertanggung jawab (Gotong Royong).<br/>3. Peserta didik melakukan investigasi, mengamati fenomena, mencatat data hasil observasi pada tabel LKPD secara jujur dan objektif.<br/>4. Peserta didik berdiskusi aktif membedah data dan mengidentifikasi karakteristik konsep inti materi. | **Meaningful Learning**<br/>• Bernalar Kritis<br/>• Gotong Royong<br/>• Penyelidikan Ilmiah |
| | **FASE 3: Penjelasan, Elaborasi & Penguatan Ilmiah** | **${tFase3} Menit** | 1. **Presentasi Pleno:** Guru mengundi/mempersilakan 2-3 kelompok untuk mempresentasikan hasil temuan LKPD di depan kelas secara percaya diri.<br/>2. **Diskusi Terbimbing:** Guru memoderatori sesi tanggapan, sanggahan, dan tanya jawab antarkelompok secara demokratis dan santun.<br/>3. **Elaborasi & Klarifikasi Miskonsepsi:** Guru memberikan klarifikasi ilmiah, meluruskan miskonsepsi yang muncul saat presentasi, dan mengelaborasi konsep materi di papan tulis/slide presentasi.<br/>4. **Penguatan Kaidah & Notasi Ilmiah:** Guru menjelaskan hukum, prinsip, notasi matematis/ilmiah baku, dan hubungan antarvariabel terkait ${topic}. | 1. Perwakilan kelompok mempresentasikan laporan hasil kerja LKPD di depan kelas dengan bahasa yang lugas (*Communication*).<br/>2. Peserta didik dari kelompok lain menyimak dengan cermat, mengajukan pertanyaan kritis, atau memberikan apresiasi.<br/>3. Peserta didik menyimak penjelasan penguatan dari guru dan mencatat poin-poin penting serta notasi rumus di buku catatan.<br/>4. Peserta didik menyempurnakan jawaban LKPD kelompok berdasarkan konfirmasi ilmiah guru. | **Meaningful Learning**<br/>• Komunikasi Efektif<br/>• Elaborasi Konsep<br/>• Notasi Ilmiah Baku |
| | **FASE 4: Aplikasi & Pemecahan Masalah Kontekstual** | **${tFase4} Menit** | 1. **Pemberian Tantangan Kontekstual:** Guru menyajikan studi kasus nyata atau soal aplikasi berbasis HOTS (*Higher Order Thinking Skills*) mengenai penerapan ${topic} dalam kehidupan sehari-hari / dunia rekayasa industri.<br/>2. **Aktivitas Kolaboratif (*Think-Pair-Share*):** Guru meminta peserta didik memecahkan tantangan tersebut secara mandiri terlebih dahulu, kemudian memvalidasi ide bersama teman sebangku.<br/>3. **Umpan Balik Formatif:** Guru membahas solusi bersama kelas dan memberikan umpan balik formatif langsung (*real-time feedback*). | 1. Peserta didik menganalisis dan menyelesaikan soal tantangan kontekstual secara mandiri (*Think*).<br/>2. Peserta didik mendiskusikan strategi penyelesaian bersama rekan kelompok (*Pair*).<br/>3. Peserta didik membagikan solusi alternatif dan menarik kesimpulan pemecahan masalah (*Share*).<br/>4. Peserta didik mencatat tips dan metode penyelesaian masalah yang efisien. | **Meaningful & Joyful Learning**<br/>• Kreativitas (*Creativity*)<br/>• Problem Solving HOTS<br/>• Think-Pair-Share |
| **C. KEGIATAN PENUTUP** | **FASE 5: Refleksi Mendalam & Metakognisi (Pola 3-2-1)** | **${tFase5} Menit** | 1. **Pemanduan Refleksi:** Guru membagikan lembar / menginstruksikan siswa menuliskan Refleksi 3-2-1 di buku refleksi:<br/>• **3** Konsep baru yang berhasil saya pahami hari ini.<br/>• **2** Hal menarik yang paling saya sukai selama KBM.<br/>• **1** Pertanyaan/hal yang masih ingin saya pelajari lebih lanjut.<br/>2. **Apresiasi Karakter:** Guru memberikan apresiasi verbal dan penghargaan positif kepada seluruh kelompok atas kolaborasi, kerja keras, dan keaktifan mereka. | 1. Peserta didik mengisi lembar Refleksi 3-2-1 secara jujur, mandiri, dan berkesadaran metakognitif.<br/>2. Dua orang peserta didik membacakan refleksinya secara sukarela di depan kelas.<br/>3. Peserta didik saling memberikan tepuk tangan apresiasi antarteman atas pencapaian belajar hari ini. | **Joyful Learning**<br/>• Refleksi 3-2-1<br/>• Metakognisi Diri<br/>• Karakter Positif |
| | **FASE 6: Simpulan Bersama, Tindak Lanjut & Doa Penutup** | **${tFase6} Menit** | 1. **Perumusan Simpulan Bersama:** Guru bersama peserta didik merangkum intisari kesimpulan pembelajaran secara terpadu.<br/>2. **Tindak Lanjut & Tugas Mandiri:** Guru memberikan tugas pengayaan kontekstual: membuat ringkasan infografis / mencari 3 contoh nyata penerapan [${targetTPCode}] ${cleanSubMateriM} di lingkungan rumah.<br/>3. **Penyampaian Rencana Berikutnya:** Guru menginformasikan materi dan persiapan praktikum untuk ${m < meetingCount ? `Pertemuan Ke-${m + 1}` : 'agenda evaluasi / bab selanjutnya'}.<br/>4. **Doa Penutup & Salam:** Guru mengajak seluruh kelas berdoa bersama mensyukuri kelancaran belajar, mengucapkan pesan motivasi: *"Belajar bermakna adalah kunci memahami alam semesta"*, dan mengakhiri sesi dengan salam penutup. | 1. Peserta didik secara antusias menyampaikan kesimpulan materi dengan kata-kata sendiri.<br/>2. Peserta didik mencatat tugas mandiri dan batas waktu pengumpulannya.<br/>3. Peserta didik menyimak informasi rencana materi pertemuan berikutnya.<br/>4. Peserta didik berdoa bersama dengan khidmat dan menjawab salam penutup guru dengan tertib. | **Mindful & Transfer**<br/>• Simpulan Terpadu<br/>• Tindak Lanjut Kontekstual<br/>• Beriman & Berakhlak Mulia |
`;
        } else {
          meetingsContent += `
### Pertemuan Ke ${m} (${totalMeetingMinutes} Menit)
**Materi / Sub Pokok Bahasan :** [${targetTPCode}] ${cleanSubMateriM}  
**Tujuan Pembelajaran (TP) :** [${targetTPCode}] ${cleanSubMateriM}

| TAHAP KEGIATAN | FASE SINTAKS DEEP LEARNING | ALOKASI WAKTU | KEGIATAN GURU (LENGKAP DARI AWAL MASUK KELAS) | KEGIATAN PESERTA DIDIK (AKTIF & RESPONSIF) | ASPEK 3 PILAR & 6C |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **A. KEGIATAN PENDAHULUAN** | **FASE 1: Orientasi, Apersepsi & Review Materi** | **${tPendahuluan} Menit** | 1. **Salam & Pengondisian:** Guru memasuki kelas dengan ramah, mengucapkan salam, menyapa siswa, serta memastikan kebersihan dan kesiapan ruang kelas.<br/>2. **Doa Pembuka:** Meminta salah satu peserta didik memimpin doa pembuka KBM.<br/>3. **Review Tugas Mandiri (*Gallery Walk*):** Guru meminta siswa memajang hasil tugas mandiri / ringkasan materi pertemuan sebelumnya di dinding kelas atau meja kelompok untuk saling diamati (*Quick Gallery Walk*).<br/>4. **Apersepsi Lanjutan:** Guru memberikan pertanyaan apersepsi penghubung:<br/>• *"Bagaimana konsep pada pertemuan sebelumnya mendasari pembahasan kita hari ini tentang [${targetTPCode}] ${cleanSubMateriM}?"*<br/>5. **Penyampaian TP & Target Kinerja:** Guru menyampaikan tujuan pembelajaran pertemuan ke-${m} dan kriteria ketuntasan yang diharapkan. | 1. Peserta didik menjawab salam guru secara kompak dan merapikan tempat duduk.<br/>2. Peserta didik berdoa bersama dengan khusyuk.<br/>3. Peserta didik memajang tugas mandiri dan saling memberikan catatan positif menggunakan *sticky note*.<br/>4. Peserta didik merespons pertanyaan apersepsi dan mengaitkan konsep sebelumnya dengan materi baru.<br/>5. Peserta didik mencatat tujuan pembelajaran dan menyiapkan modul/buku referensi. | **Mindful Learning**<br/>• Kesadaran Belajar<br/>• Apersepsi Terhubung<br/>• Apresiasi Karya Teman |
| **B. KEGIATAN INTI** | **FASE 2: Eksplorasi Konsep Lanjutan & Investigasi** | **${tFase2} Menit** | 1. **Distribusi LKPD Lanjutan:** Guru membagikan LKPD ${m} (Studi Analisis & Penerapan Lanjutan) kepada masing-masing kelompok.<br/>2. **Pengorganisasian Penyelidikan:** Guru menugaskan kelompok menganalisis data empiris, pola hubungan variabel, atau studi kasus komparatif tingkat lanjut terkait [${targetTPCode}] ${cleanSubMateriM}.<br/>3. **Fasilitasi Uji Coba & Eksperimen:** Guru memandu kelompok menguji fenomena dengan metode perbandingan atau simulasi digital interaktif.<br/>4. **Scaffolding & Konsultasi:** Guru berkeliling memberikan umpan balik langsung, memastikan semua anggota terlibat aktif, dan mengajukan pertanyaan pemandu berpikir kritis. | 1. Setiap kelompok menerima LKPD ${m} dan mendiskusikan petunjuk kerja investigasi.<br/>2. Peserta didik berkolaborasi mengumpulkan data komparatif, menganalisis angka penting/variabel esensial.<br/>3. Peserta didik membandingkan hasil pengamatan antarkelompok untuk menemukan konsistensi ilmiah.<br/>4. Peserta didik merumuskan argumentasi ilmiah pada LKPD berdasarkan bukti data empiris. | **Meaningful Learning**<br/>• Investigasi Kritis<br/>• Kolaborasi Tim<br/>• Analisis Data Empiris |
| | **FASE 3: Penjelasan, Elaborasi & Diskusi Ahli** | **${tFase3} Menit** | 1. **Presentasi Model Expert Jigsaw:** Guru memandu presentasi perwakilan kelompok dengan format perbandingan solusi.<br/>2. **Klarifikasi Konsep Kompleks:** Guru menjelaskan formulasi matematis tingkat lanjut, penurunan rumus, atau kaidah analisis mendalam di papan tulis dengan diagram visual.<br/>3. **Pembahasan Miskonsepsi Lanjutan:** Guru menyoroti kekeliruan umum yang sering terjadi saat menerapkan aturan konsep ${topic}.<br/>4. **Penegasan Hubungan Interdisipliner:** Guru menghubungkan materi dengan bidang ilmu lain (teknologi rekayasa, kedokteran, lingkungan hidup, dll). | 1. Perwakilan kelompok memaparkan argumen ilmiah dan hasil perbandingan data secara sistematis (*Communication*).<br/>2. Kelompok lain memberikan masukan konstruktif dan membandingkan hasil temuan mereka.<br/>3. Peserta didik mencatat penjelasan guru, rumus analitis, dan penurunan persamaan baku di buku catatan.<br/>4. Peserta didik aktif bertanya mengenai keterkaitan materi dengan bidang teknologi terapan. | **Meaningful Learning**<br/>• Elaborasi Konsep Mendalam<br/>• Notasi Ilmiah Baku<br/>• Koneksi Interdisiplin |
| | **FASE 4: Aplikasi & Pemecahan Masalah Terapan** | **${tFase4} Menit** | 1. **Studi Kasus Rekayasa/Sains Nyata:** Guru menyajikan masalah kontekstual tingkat lanjut yang membutuhkan analisis terpadu dan perhitungan presisi.<br/>2. **Tantangan Tim (*Team Problem Solving*):** Guru menugaskan peserta didik merumuskan solusi alternatif pemecahan masalah dalam waktu terbatas.<br/>3. **Evaluasi Solusi:** Guru memfasilitasi penilaian antartim (*Peer Review*) terhadap keakuratan dan efisiensi solusi yang dihasilkan. | 1. Peserta didik membedah permasalahan studi kasus dalam kelompok kerja.<br/>2. Peserta didik menerapkan rumus dan konsep ilmiah untuk menghitung dan merancang solusi.<br/>3. Peserta didik mempresentasikan ringkasan solusi di hadapan kelas dan menerima masukan teman sejawat. | **Meaningful & Joyful**<br/>• Kreativitas Rekayasa<br/>• Peer Review<br/>• Solusi Masalah Nyata |
| **C. KEGIATAN PENUTUP** | **FASE 5: Refleksi Mendalam & Pojok Refleksi Diri** | **${tFase5} Menit** | 1. **Sesi Refleksi *What, So What, Now What?*:** Guru mengajak siswa menuliskan refleksi:<br/>• *What?* (Apa konsep kunci yang telah saya kuasai hari ini?)<br/>• *So What?* (Mengapa konsep ini penting dan bermakna bagi diri saya?)<br/>• *Now What?* (Bagaimana saya akan menerapkan pemahaman ini ke depan?)<br/>2. **Apresiasi & Umpan Balik Guru:** Guru memberikan apresiasi khusus atas peningkatan kemampuan berpikir kritis dan kerja sama seluruh siswa. | 1. Peserta didik merenungkan dan menuliskan jawaban refleksi berkesadaran pada buku catatan.<br/>2. Beberapa perwakilan peserta didik membacakan hasil refleksinya dengan bangga dan antusias.<br/>3. Peserta didik saling menghargai progres belajar masing-masing rekan sekelas. | **Joyful Learning**<br/>• Metakognisi Tingkat Tinggi<br/>• Kesadaran Belajar<br/>• Apresiasi Diri & Rekan |
| | **FASE 6: Simpulan Terpadu, Penugasan Proyek & Doa** | **${tFase6} Menit** | 1. **Simpulan Pembelajaran:** Guru bersama siswa menyusun *Mind Map* simpulan akhir di papan tulis.<br/>2. **Tugas Proyek Mini Kreatif:** Guru memberikan panduan tugas pembuatan karya poster infografis digital / laporan investigasi mini terkait aplikasi materi di kehidupan sehari-hari.<br/>3. **Informasi Asesmen Sumatif:** Guru mengingatkan jadwal tes asesmen sumatif lingkup materi pada pertemuan berikutnya.<br/>4. **Doa Penutup & Salam:** Guru mengajak seluruh kelas berdoa bersama dengan khusyuk dan menutup KBM dengan salam penuh kehangatan. | 1. Peserta didik aktif berkontribusi menyusun bagan kesimpulan akhir materi.<br/>2. Peserta didik mencatat petunjuk tugas proyek mini kontekstual.<br/>3. Peserta didik menyiapkan diri untuk agenda evaluasi sumatif pertemuan mendatang.<br/>4. Peserta didik berdoa bersama dengan khidmat dan membalas salam penutup guru dengan santun. | **Mindful & Joyful**<br/>• Mind Map Simpulan<br/>• Proyek Mini Kontekstual<br/>• Berakhlak Mulia |
`;
        }
      }

      const semesterLabel = String(semester) === '1' || String(semester).toLowerCase().includes('1') || String(semester).toLowerCase().includes('ganjil') ? 'Ganjil' : 'Genap';
      const currentYear = resolvedAcademicYear?.split('/')[0] || schoolProfile.academicYear?.split('/')[0] || '2026';
      const fullCity = city || schoolProfile.city || 'Maluku Tengah';
      const fullSchoolName = schoolName || schoolProfile.schoolName || 'SMA NEGERI 30 MALUKU TENGAH';
      const npsn = schoolProfile.npsn || '60103210';
      const schoolAddress = schoolProfile.address || `Jl. Pendidikan No. 30, ${fullCity}`;
      const schoolEmail = schoolProfile.email || `info@${fullSchoolName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'sekolah'}.sch.id`;

      return `# RENCANA PELAKSANAAN MODUL (RPM)
### Model Pembelajaran: DEEP LEARNING (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)
#### Mata Pelajaran: ${subject} | ${level} Kelas ${grade} (Fase ${phase}) - Semester ${semesterLabel}

---

## A. IDENTITAS MODUL

| Parameter | Keterangan |
| :--- | :--- |
| **Satuan Pendidikan** | ${fullSchoolName} |
| **Penyusun / Guru Pengampu** | ${teacherName} |
| **NIP Guru** | ${teacherNip || '_________________________'} |
| **Tahun Ajaran** | ${resolvedAcademicYear || schoolProfile.academicYear || '2026/2027'} |
| **Jenjang / Fase / Kelas** | ${level} / Fase ${phase} / Kelas ${grade} |
| **Semester** | ${semesterLabel} |
| **Mata Pelajaran** | ${subject} |
| **Materi Pokok** | ${topic} |
| **Sub Materi Tiap Pertemuan** | ${subMateriTableFormatted} |
| **Alokasi Waktu Total** | ${meetingCount * Number(hoursPerMeeting) * Number(minutesPerJP)} Menit (${meetingCount} Pertemuan × ${hoursPerMeeting * minutesPerJP} Menit / Pertemuan = ${meetingCount * hoursPerMeeting} JP) |
| **Model Pembelajaran** | **Deep Learning (6 Fase Sintaks: Mindful, Meaningful, Joyful Learning)** |
| **Pendekatan & Metode** | Saintifik, Inkuiri Terbimbing, Kontekstual, Diskusi Kelompok, Eksplorasi Nyata, Think-Pair-Share |
| **Target Peserta Didik** | Peserta Didik Reguler/Tipikal, Peserta Didik dengan Kesulitan Belajar (*Scaffolding*), dan Peserta Didik Berprestasi Cepat (*Pengayaan*) |

---

## B. KOMPETENSI YANG DICAPAI

**Capaian Pembelajaran (CP) Elemen & Rasional:**
📌 "${actualCP}"

**Tujuan Pembelajaran (TP) Operasional (HOTS Berbasis Kaidah ABCD):**
${tpFormattedList}

**Pemahaman Bermakna (*Meaningful Learning*):**
- Peserta didik menyadari bahwa penguasaan konsep **${topic}** sangat esensial dalam memahami hukum alam, perkembangan teknologi modern, dan pemecahan masalah nyata di kehidupan sehari-hari.
- Peserta didik mampu menganalisis hubungan sebab-akibat fenomena empiris secara objektif, teliti, dan sistematis.

**Pertanyaan Pemantik (*Sparking Questions*):**
1. *Bagaimana fenomena ${topic} dapat kita jumpai dan manfaatkan dalam aktivitas sehari-hari serta perkembangan teknologi terkini?*
2. *Mengapa pengukuran yang presisi dan pemahaman konsep ilmiah yang mendalam sangat dibutuhkan dalam menyelesaikan masalah di sekitar kita?*
3. *Apa konsekuensi yang terjadi jika suatu rancangan rekayasa mengabaikan prinsip-prinsip dasar materi ini?*

---

## C. SINTAKS & SKEMA 6 FASE DEEP LEARNING

\`\`\`
+-------------------------------------------------------------------------------------------------
| SKEMA ALUR SIKLUS 6 FASE DEEP LEARNING (MINDFUL, MEANINGFUL, JOYFUL)
|
| [ MINDFUL LEARNING ]
| ┌───────────────────────────────┐          ┌───────────────────────────────┐
| │ FASE 1: Orientasi & Motivasi  │   ───►   │ FASE 2: Eksplorasi Konsep     │
| │ • Mindful Breathing (STOP)    │          │ • Inkuiri Konkret / Eksperimen│
| │ • Pertanyaan Pemantik HOTS    │          │ • Identifikasi Masalah & LKPD │
| └───────────────────────────────┘          └───────────────┬───────────────┘
|                                                             │
| [ MEANINGFUL LEARNING ]                                    ▼
| ┌───────────────────────────────┐          ┌───────────────────────────────┐
| │ FASE 4: Aplikasi & Penerapan  │   ◄───   │ FASE 3: Penjelasan & Elaborasi│
| │ • Pemecahan Soal Kontekstual  │          │ • Penguatan Konsep Ilmiah     │
| │ • Think-Pair-Share Kolaboratif│          │ • Diskusi Kaidah & Notasi Baku│
| └───────────────┬───────────────┘          └───────────────────────────────┘
|                  │
| [ JOYFUL LEARNING ]
|                  ▼
| ┌───────────────────────────────┐          ┌───────────────────────────────┐
| │ FASE 5: Refleksi Mendalam     │   ───►   │ FASE 6: Transfer & Koneksi    │
| │ • Lembar Refleksi Pola 3-2-1  │          │ • Proyek Mini Kreatif Siswa   │
| │ • Apresiasi Diri & Teman (6C) │          │ • Simpulan & Doa Penutup      │
| └───────────────────────────────┘          └───────────────────────────────┘
+-------------------------------------------------------------------------------------------------
\`\`\`

## C. SINTAKS (DESAIN PEMBELAJARAN DEEP LEARNING)

Pembelajaran Deep Learning mengintegrasikan 3 Pilar Utama (*Mindful Learning, Meaningful Learning, dan Joyful Learning*) melalui 6 tahapan sintaks KBM sebagai berikut:

| FASE SINTAKS | NAMA TAHAPAN | PILAR PEDAGOGIS | TUJUAN DAN FOKUS AKTIVITAS KELAS |
| :---: | :--- | :---: | :--- |
| **Fase 1** | **Orientasi, Apersepsi & Motivasi** | *Mindful Learning* | Membangkitkan rasa ingin tahu, menghadirkan kesadaran penuh (*Mindful Breathing*), dan mengaitkan materi dengan kehidupan nyata. |
| **Fase 2** | **Eksplorasi Konsep & Inkuiri** | *Meaningful Learning* | Peserta didik aktif menemukan konsep melalui pengamatan nyata, eksperimen terbimbing, dan diskusi kelompok berbasis LKPD. |
| **Fase 3** | **Penjelasan, Elaborasi & Diskusi** | *Meaningful Learning* | Guru mengelaborasi konsep, meluruskan miskonsepsi, menegaskan notasi ilmiah baku, dan memfasilitasi presentasi siswa. |
| **Fase 4** | **Aplikasi & Pemecahan Masalah** | *Meaningful Learning* | Peserta didik menerapkan konsep dalam konteks nyata baru melalui metode *Think-Pair-Share* dan pemecahan kasus HOTS. |
| **Fase 5** | **Refleksi Mendalam & Metakognisi** | *Joyful Learning* | Peserta didik merefleksikan proses belajar (format 3-2-1), mengapresiasi pencapaian diri, serta memperkuat karakter 6C. |
| **Fase 6** | **Simpulan Bersama, Transfer & Penutup** | *Joyful & Mindful* | Merumuskan kesimpulan terpadu, memberikan tindak lanjut proyek kreatif, pengumuman materi berikutnya, dan doa penutup. |

---

## D. LANGKAH-LANGKAH PEMBELAJARAN
${meetingsContent}

---

## E. ASESMEN PEMBELAJARAN

| Jenis Asesmen | Bentuk & Instrumen | Waktu Pelaksanaan | Aspek & Indikator yang Dinilai |
| :--- | :--- | :--- | :--- |
| **1. Asesmen Diagnostik (Awal)** | Pertanyaan pemantik lisan / kuis apersepsi 5 butir soal | Awal Pertemuan 1 (Pendahuluan) | Pengetahuan prasyarat, kesiapan belajar, dan identifikasi miskonsepsi awal peserta didik. |
| **2. Asesmen Formatif (Proses)** | • Lembar Kerja Peserta Didik (LKPD)<br/>• Lembar Observasi Kinerja Diskusi & Presentasi<br/>• Lembar Refleksi Diri 3-2-1 | Selama KBM berlangsung (Kegiatan Inti & Penutup) | Proses bernalar kritis, gotong royong, keaktifan berkomunikasi, dan pemahaman konsep secara berkelanjutan. |
| **3. Asesmen Sumatif (Akhir)** | • Tes Tertulis Pilihan Ganda & Uraian HOTS<br/>• Penilaian Produk Proyek Mini Infografis | Akhir Pembelajaran / Setelah ${meetingCount} Pertemuan | Penguasaan konsep mendalam, kemampuan analisis pemecahan masalah, dan kreativitas produk hasil belajar. |

### Panduan Rubrik Ketercapaian Tujuan Pembelajaran (KKTP):
| Kriteria Capaian | Perlu Bimbingan (0 - 64%) | Cukup (65 - 74%) | Baik (75 - 87%) | Sangat Baik (88 - 100%) |
| :--- | :--- | :--- | :--- | :--- |
| **Pemahaman Konsep ${topic}** | Belum mampu menjelaskan prinsip dasar materi dengan tepat. | Mampu menjelaskan konsep dasar namun masih membutuhkan bantuan contoh. | Mampu menjelaskan dan menghubungkan konsep dasar secara mandiri dan benar. | Mampu menganalisis konsep secara komprehensif dan mengaitkannya ke studi kasus kompleks. |
| **Keterampilan Penyelidikan & LKPD** | Data pengamatan belum lengkap dan belum terstruktur. | Data pengamatan lengkap namun analisis simpulan belum runtut. | Data pengamatan lengkap, akurat, dan analisis simpulan tepat. | Analisis data sangat mendalam, memuat evaluasi kritis dan solusi inovatif. |
| **Sikap & Kolaborasi 6C** | Pasif dalam kelompok dan memerlukan dorongan guru. | Cukup aktif dalam diskusi kelompok tetapi belum konsisten. | Aktif berkolaborasi, menghargai pendapat rekan, dan komunikatif. | Menunjukkan kepemimpinan kolaboratif yang inspiratif dan berempati tinggi. |

---

## F. MEDIA, ALAT, DAN SUMBER BELAJAR

- **Media Pembelajaran Interaktif:**
  - Video animasi fenomena nyata materi "${topic}" (YouTube Edukasi / Multimedia Interaktif).
  - Slide presentasi PowerPoint / Canva berbasis infografis visual.
  - LKPD 1 dan LKPD 2 Deep Learning terstruktur (Format cetak & digital).
  - Papan tulis interaktif / *Mind Map* dinding refleksi siswa.

- **Alat dan Bahan Praktik Konkret:**
  - Alat peraga / kit investigasi konkret materi ${topic}.
  - Benda-benda kontekstual di lingkungan kelas dan sekolah.
  - Sticky note berwarna, spidol warna, kertas karton / kertas plano.
  - Komputer / Laptop, LCD Proyektor, dan sambungan internet.

- **Sumber Belajar Resmi:**
  - Buku Teks Utama: *${subject} untuk ${level} Kelas ${grade}*, Pusat Perbukuan Kemendikbudristek RI.
  - Buku Panduan Guru *${subject}*, Kemendikbudristek RI.
  - Modul & Bahan Ajar Digital Pendamping Kurikulum Merdeka.
  - Portal Sains & Simulasi Edukasi: *PhET Interactive Simulations*, *Khan Academy*, dan ensiklopedia ilmiah.

---

## G. MATRIKS PEMBELAJARAN BERDIFERENSIASI

\`\`\`
+-------------------------------------------------------------------------------------------------
| SKEMA MATRIKS PEMBELAJARAN BERDIFERENSIASI (PROSES, KONTEN, PRODUK)
|
| ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
| │ 1. DIFERENSIASI KONTEN    │      │ 2. DIFERENSIASI PROSES    │      │ 3. DIFERENSIASI PRODUK    │
| ├───────────────────────────┤      ├───────────────────────────┤      ├───────────────────────────┤
| │ • Video Fenomena Konkret  │ ───► │ • Pendampingan Scaffolding│ ───► │ • Infografis / Poster     │
| │ • Modul Teks Bergambar    │      │ • Diskusi Sebaya Heterogen│      │ • Presentasi Lisan Tim    │
| │ • Kit Eksplorasi Nyata    │      │ • Bimbingan Intensif Guru │      │ • Laporan Tertulis Analis │
| └───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
+-------------------------------------------------------------------------------------------------
\`\`\`

| Kategori Peserta Didik | Diferensiasi Konten | Diferensiasi Proses | Diferensiasi Produk |
| :--- | :--- | :--- | :--- |
| **Peserta Didik Reguler** | Modul teks standar, LKPD inkuiri, dan tayangan video fenomena. | Diskusi kelompok campuran dengan bimbingan reguler guru. | Laporan LKPD dan presentasi hasil temuan kelompok. |
| **Peserta Didik dengan Kesulitan Belajar** | Materi disajikan dengan visual lebih kaya, panduan ringkas bertahap, dan benda konkret. | Mendapatkan bimbingan intensif dari guru (*scaffolding*) dan pendampingan tutor sebaya. | Boleh memilih format laporan yang lebih visual (bagan/poin inti terstruktur). |
| **Peserta Didik Berpencapaian Cepat (Mahir)** | Diberikan artikel ilmiah pengayaan dan studi kasus tantangan tingkat HOTS tinggi. | Menjadi tutor sebaya bagi rekan kelompoknya dan melakukan eksplorasi mandiri lanjutan. | Membuat karya inovasi mini berupa poster digital analitis / usulan solusi rekayasa. |

---

## H. REFLEKSI GURU

| Aspek Refleksi | Catatan Evaluatif Guru |
| :--- | :--- |
| **1. Ketercapaian Tujuan Pembelajaran** | ................................................................................................................................ |
| **2. Efektivitas Sintaks Deep Learning** | ................................................................................................................................ |
| **3. Partisipasi & Antusiasme Siswa** | ................................................................................................................................ |
| **4. Kendala & Miskonsepsi yang Muncul** | ................................................................................................................................ |
| **5. Rencana Perbaikan untuk Pertemuan Berikutnya** | ................................................................................................................................ |

${buildOfficialLembarPengesahan({
  title: 'MODUL AJAR / RENCANA PELAKSANAAN MODUL (RPM)',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Modul Ajar / Rencana Pelaksanaan Modul (RPM) Deep Learning (*Mindful, Meaningful, & Joyful Learning*) mata pelajaran **${subject}** (${phase} / Kelas ${grade}) materi **${topic}** ini telah diverifikasi dan disahkan oleh Kepala Satuan Pendidikan untuk diberlakukan secara resmi pada Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
    }

    case 'lkpd': {
      const resolvedMeetingCount = meetingCount && Number(meetingCount) > 0 ? Number(meetingCount) : 2;
      const resolvedHours = hoursPerMeeting && Number(hoursPerMeeting) > 0 ? Number(hoursPerMeeting) : 3;
      const resolvedMinutes = minutesPerJP && Number(minutesPerJP) > 0 ? Number(minutesPerJP) : 45;
      const durationPerMeeting = resolvedHours * resolvedMinutes;

      const meetingBlocks = [];

      for (let m = 1; m <= resolvedMeetingCount; m++) {
        const isFirst = m === 1;
        const isLast = m === resolvedMeetingCount;
        const meetingTheme = isFirst 
          ? `Eksplorasi Konsep & Penyelidikan Masalah Nyata`
          : isLast 
            ? `Kreasi Rekayasa Solusi, Pameran Karya & Asesmen Autentik`
            : `Pengolahan Data Empiris & Analisis Komparasi Berjenjang`;

        meetingBlocks.push(`
# LEMBAR KERJA PESERTA DIDIK (LKPD) DEEP LEARNING - PERTEMUAN ${m} DARI ${resolvedMeetingCount}
## TEMA PERTEMUAN ${m}: ${meetingTheme.toUpperCase()}
### MATA PELAJARAN: ${subject.toUpperCase()} - KELAS ${grade} (${phase}) - SEMESTER ${semester}

---

### I. IDENTITAS KELOMPOK BELAJAR
| Komponen Identitas | Keterangan / Isian Peserta Didik |
| :--- | :--- |
| **Nama Kelompok** | ......................................................................................... |
| **Anggota Kelompok** | 1. ..................................................... 3. .....................................................<br/>2. ..................................................... 4. ..................................................... |
| **Kelas / Semester** | **Kelas ${grade} / Semester ${semester}** |
| **Mata Pelajaran & Topik** | **${subject}** - *${topic}* |
| **Alokasi Waktu KBM** | **${resolvedHours} JP (${durationPerMeeting} Menit)** |
| **Profil Karakter 6C** | *Character, Critical Thinking, Creativity, Collaboration, Communication, Citizenship* |

---

### II. TUJUAN PEMBELAJARAN & PETUNJUK KERJA
* **Tujuan Pembelajaran Pertemuan ${m}:**
  * ${isFirst ? `Peserta didik mampu mengidentifikasi fenomena esensial ${topic}, memetakan variabel kausalitas, dan merumuskan hipotesis ilmiah secara kritis.` : `Peserta didik mampu merancang sketsa visual solusi inovatif ${topic}, memvalidasi data empiris, dan mempresentasikannya melalui forum kelas.`}
* **Petunjuk Belajar Mindful & Safety:**
  1. Mulailah dengan doa bersama kelompok dan latihan pernapasan sadar (*Mindfulness 1 Menit*).
  2. Cermati stimulus fenomena nyata dan **Bagan Ilustrasi Konsep** yang disajikan secara teliti.
  3. Lakukan pembagian tugas kelompok secara adil, inklusif, dan saling mendukung.
  4. Tuangkan ide dan visualisasi pemecahan masalah pada **Kanvas Sketsa Siswa**.

---

### III. SINTAKS 1: MINDFUL DISCOVERY (ORIENTASI BERKESADARAN & BAGAN VISUAL KONSEP)
> **📌 Stimulus Kontekstual & Studi Kasus Pertemuan ${m}:**  
> Dalam kehidupan sehari-hari, prinsip **${topic}** pada bidang studi **${subject}** menjadi kunci utama dalam memecahkan masalah kontekstual (efisiensi sistem, kelestarian lingkungan, ketepatan analisis, atau dinamika sosial-teknologi). Ketika terjadi ketidakseimbangan sistem, diperlukan analisis kritis dan rekayasa ide yang solutif.

#### 📊 Bagan Ilustrasi Konsep & Skema Alur Ilmiah Pertemuan ${m}
\`\`\`
+-----------------------------------------------------------------------------------+
|               DIAGRAM ALUR KONSEP & PENYELIDIKAN ILMIAH (${topic.toUpperCase()})               |
|                                                                                   |
|  [ FENOMENA NYATA ] ---> [ VARIABEL BEBAS (X) ] ---> [ PROSES TRANSFORMASI ]     |
|          |                                                  |                     |
|          v                                                  v                     |
|  [ HIPOTESIS IDE ] <--- [ OLAH DATA EMPIRIS ] <--- [ VARIABEL TERIKAT (Y) ]       |
+-----------------------------------------------------------------------------------+
\`\`\`

* **Pertanyaan Pemantik Berkesadaran (Mindful Curiosity Trigger):**
  1. *Mengapa fenomena ${topic} ini sangat krusial dalam konteks ilmu ${subject}?*
  2. *Bagaimana jika salah satu variabel pada diagram di atas tidak berfungsi optimal?*

---

### IV. SINTAKS 2: MEANINGFUL INQUIRY (PENYELIDIKAN KRITIS & PENGOLAHAN DATA EMPIRIS)

#### 1. Lembar Aktivitas Penyelidikan Mandiri & Kolaboratif [HOTS]
* Lakukan observasi/studi literatur bersama tim dan jawab pertanyaan kunci berikut:
  * **Analisis Variabel Inti:** ....................................................................................................
  * **Prinsip / Formula Utama:** $$\\text{Efektivitas } (${topic}) = f(\\text{Variabel } X, \\text{ Intervensi Solutif})$$

#### 2. Tabel Pengumpulan & Pengolahan Data Empiris
| No | Parameter / Objek yang Diselidiki | Hasil Pengamatan Empiris | Analisis Hubungan Sebab - Akibat |
| :-: | :--- | :--- | :--- |
| 1 | Kondisi Baseline / Standar Normal **${topic}** | .................................................... | .................................................... |
| 2 | Kondisi Uji Variabel / Faktor Pengganggu | .................................................... | .................................................... |
| 3 | Solusi Optimalisasi & Rekomendasi Terapan | .................................................... | .................................................... |

#### 3. Bantuan Scaffolding Berjenjang (Diferensiasi Proses)
* **Kelompok Berkembang:** Gunakan panduan rumus dasar dan konsultasikan tabel dengan guru pendamping.
* **Kelompok Mahir:** Lakukan analisis komparasi multi-variabel dan estimasi dampak jangka panjang.

---

### V. SINTAKS 3: JOYFUL CREATION (KANVAS SKETSA SOLUSI SISWA & PAMERAN KARYA)

#### 🎨 Kanvas Gambar & Sketsa Visual Inovasi Siswa
Gambarkan rancangan diagram ide, bagan sistem prototipe, poster mini, atau ilustrasi kreatif pemecahan masalah kelompok kalian pada kotak kanvas berikut:

\`\`\`
+-----------------------------------------------------------------------------------+
|                        KANVAS SKETSA & DIAGRAM DESAIN SISWA                       |
|                                                                                   |
|                                                                                   |
|        (Gambarkan rancangan sketsa, bagan sistem, atau visualisasi solusi)        |
|                                                                                   |
|                                                                                   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
\`\`\`
* **Deskripsi Keunggulan & Nilai Kebaruan Karya Kelompok:**  
  ................................................................................................................................

#### 🌟 Pameran Karya Dinding Kelas (Joyful Gallery Walk) & Umpan Balik
*Kunjungi stand kelompok lain, amati presentasi visual mereka, dan berikan catatan apresiasi:*
* ⭐ **Bintang 1 (Kekuatan Konsep & Diagram Visual):** .............................................................
* ⭐ **Bintang 2 (Kreativitas & Orisinalitas Solusi):** ............................................................
* 💡 **Wish (Saran Penyempurnaan Konstruktif):** ..................................................................

---

### VI. SINTAKS 4: MINDFUL REFLECTION & ASESMEN AUTENTIK

#### 1. Lembar Refleksi Diri Siswa (Kartu 3-2-1)
* **3 Hal bermakna yang saya pelajari hari ini:** .................................................................
* **2 Hal yang paling membuat saya bersemangat dalam KBM:** ................................................
* **1 Pertanyaan/ide yang ingin saya eksplorasi lebih jauh:** ...............................................

#### 2. Rubrik Penilaian Autentik Kinerja LKPD Guru
| Aspek Penilaian Mutu | Kriteria Mahir (86-100) | Kriteria Cakap (71-85) | Kriteria Berkembang (0-70) |
| :--- | :--- | :--- | :--- |
| **Nalar Kritis & Analisis Data** | Analisis sebab-akibat sangat mendalam dengan data empiris valid. | Menjelaskan keterkaitan konsep dengan cukup baik. | Memerlukan bimbingan pendampingan guru (*scaffolding*). |
| **Kreativitas Produk Visual** | Sketsa diagram sangat orisinal, estetis, dan solutif. | Sketsa diagram cukup jelas dan memadai. | Sketsa belum tuntas atau kurang terstruktur. |
| **Kolaborasi & Karakter 6C** | Menunjukkan kepemimpinan positif dan gotong royong aktif. | Bekerjasama dengan baik dalam tim. | Perlu dorongan untuk berpartisipasi aktif. |
`);
      }

      const lkpdPengesahan = buildOfficialLembarPengesahan({
        title: 'LEMBAR KERJA PESERTA DIDIK (LKPD)',
        schoolName,
        city,
        headmasterName,
        headmasterNip,
        teacherName,
        teacherNip,
        academicYear: resolvedAcademicYear,
        subject,
        grade,
        phase,
        customNote: `Dokumen Lembar Kerja Peserta Didik (LKPD) Kreatif Berdiferensiasi ${resolvedSemesterLabel} mata pelajaran **${subject}** (${phase} / Kelas ${grade}) materi **${topic}** ini telah diperiksa, disetujui, dan disahkan sebagai instrumen KBM Deep Learning untuk Tahun Pelajaran **${resolvedAcademicYear}**.`
      });

      return meetingBlocks.join('\n\n<div class="page-break" style="page-break-before:always; break-before:page; margin-top:24px; margin-bottom:18px;"></div>\n\n') + '\n\n' + lkpdPengesahan;
    }

    case 'bundle':
    case 'bundel_lengkap':
    case 'perangkat_ajar_lengkap':
      return generateFullCurriculumBundle(params);

    case 'kktp': {
      const isYear = params.kktpScope === 'year' ||
        (params.topic && (
          params.topic.toLowerCase().includes('1 tahun') ||
          params.topic.toLowerCase().includes('tahunan')
        ));

      const isWholeSemester = !isYear && (
        params.kktpScope === 'semester' ||
        params.kktpScope === undefined ||
        (params.topic && (
          params.topic.toLowerCase().startsWith('seluruh materi pokok semester') ||
          params.topic.toLowerCase().startsWith('kriteria ketercapaian tujuan pembelajaran (kktp) semester') ||
          params.topic.toLowerCase().includes('semester')
        ))
      );

      // Helper function to build detailed TP & KKTP data for a specific Bab / Lingkup Materi
      const buildBabTPDetails = (mat: any, mIdx: number, semPrefix?: string) => {
        const bName = mat?.essentialMaterial || mat?.tpName || topic || `Bab ${mIdx + 1}`;
        const bCode = mat?.tpCode || (semPrefix ? `TP.${grade}.${semPrefix}.${mIdx + 1}` : `TP.${grade}.${mIdx + 1}`);
        const bHours = mat?.allocatedHours || 20;

        // Check if user has explicitly selected TPs for this bab
        if (params.selectedTPs && params.selectedTPs.length > 0) {
          const matchedSelected = params.selectedTPs.filter((t: any) =>
            (t.babTitle && (t.babTitle.toLowerCase() === bName.toLowerCase() || bName.toLowerCase().includes(t.babTitle.toLowerCase()))) ||
            (!isWholeSemester && !isYear)
          );
          if (matchedSelected.length > 0) {
            return {
              babName: bName,
              baseCode: bCode,
              hours: bHours,
              tps: matchedSelected.map((st: any, idx: number) => ({
                code: st.code || `${bCode}.${idx + 1}`,
                title: st.text || `Tujuan Pembelajaran ${idx + 1} materi ${bName}`,
                bloom: idx === 0 ? 'Mengidentifikasi & Menganalisis (C2, C4)' : idx === 1 ? 'Menerapkan & Memecahkan (C3, C4)' : 'Mengevaluasi & Mengkreasikan (C5, C6)',
                p3: idx === 0 ? 'Bernalar Kritis, Mandiri' : idx === 1 ? 'Bergotong Royong, Bernalar Kritis' : 'Kreatif, Komunikatif',
                iktp: [
                  `Menjelaskan konsep esensial dan kaidah pokok terkait ${bName}.`,
                  `Menerapkan konsep secara analitis untuk memecahkan persoalan kontekstual.`
                ],
                rubrik: {
                  bb: `Belum mampu mencapai indikator dasar ${bName} tanpa bimbingan intensif guru (0% - 40%).`,
                  layak: `Mampu menguasai sebagian konsep dasar, namun masih membutuhkan penguatan pada penyelesaian kasus terapan (41% - 65%).`,
                  cakap: `Mampu memahami, menganalisis, dan menyelesaikan tugas terkait ${bName} secara mandiri, tepat, dan terstruktur (66% - 85%).`,
                  mahir: `Mampu menguasai materi secara komprehensif, mengkreasikan gagasan solusi inovatif, dan menjadi tutor sebaya (86% - 100%).`
                },
                interval: {
                  i1: 'Belum mencapai ketuntasan, remedial di seluruh bagian',
                  i2: 'Belum mencapai ketuntasan, remedial di bagian yang diperlukan',
                  i3: '✓ Sudah mencapai ketuntasan, tidak perlu remedial',
                  i4: '★ Sudah mencapai ketuntasan, perlu pengayaan atau tantangan lebih'
                },
                passingScore: 75
              }))
            };
          }
        }

        // Standard authentic 3 TPs per Bab (Bloom C2/C4, C3/C4, C5/C6)
        const defaultTPs = [
          {
            code: `${bCode}.1`,
            title: `Peserta didik (**A**) mampu **mengidentifikasi, memahami, dan menganalisis** (**B**) karakteristik fundamental serta prinsip-prinsip kunci terkait **${bName}** melalui telaah fenomena kontekstual (**C**) secara kritis dan mandiri (**D**).`,
            bloom: `Mengidentifikasi (C2), Menganalisis (C4)`,
            p3: `Bernalar Kritis, Mandiri`,
            iktp: [
              `IKTP 1.1: Menjelaskan pengertian, definisi operasional, dan prinsip dasar materi ${bName} dengan bahasa baku dan akurat.`,
              `IKTP 1.2: Mengidentifikasi karakteristik, sifat, dan pola relasi logis konsep ${bName} dalam berbagai fenomena kontekstual.`
            ],
            rubrik: {
              bb: `Belum mampu mengidentifikasi dan menjelaskan konsep dasar ${bName} (0% - 40%). Perlu bimbingan penuh dari guru.`,
              layak: `Mampu menyebutkan konsep dasar ${bName}, namun belum runtut dalam menganalisis fenomena (41% - 65%). Perlu remedial parsial.`,
              cakap: `Mampu menjelaskan dan menganalisis seluruh konsep esensial ${bName} secara tepat dan mandiri (66% - 85%). Tuntas standar KKTP.`,
              mahir: `Mampu menguraikan konsep ${bName} secara mendalam dan menghubungkannya dengan isu kontekstual (86% - 100%). Pengayaan mandiri.`
            },
            interval: {
              i1: 'Belum mencapai ketuntasan, remedial di seluruh bagian',
              i2: 'Belum mencapai ketuntasan, remedial di bagian yang diperlukan',
              i3: '✓ Sudah mencapai ketuntasan, tidak perlu remedial',
              i4: '★ Sudah mencapai ketuntasan, perlu pengayaan atau tantangan lebih'
            },
            passingScore: 75
          },
          {
            code: `${bCode}.2`,
            title: `Peserta didik (**A**) mampu **menerapkan prosedur ilmiah dan memecahkan permasalahan** (**B**) terapan/studi kasus kontekstual berbasis **${bName}** melalui penyelidikan inkuiri dan kolaborasi kelompok terbimbing (**C**) secara akurat dan bertanggung jawab (**D**).`,
            bloom: `Menerapkan (C3), Memecahkan / Investigasi (C4)`,
            p3: `Bergotong Royong, Bernalar Kritis`,
            iktp: [
              `IKTP 2.1: Menerapkan konsep atau prosedur baku yang tepat untuk memecahkan persoalan ${bName}.`,
              `IKTP 2.2: Merumuskan strategi penyelesaian masalah kontekstual terapan berbasis penyelidikan data nyata.`
            ],
            rubrik: {
              bb: `Belum mampu menerapkan prosedur dasar untuk memecahkan persoalan ${bName} (0% - 40%). Bimbingan penuh langkah demi langkah.`,
              layak: `Mampu menerapkan prosedur dasar ${bName}, namun langkah penyelesaian belum sistematis (41% - 65%). Remedial latihan soal terarah.`,
              cakap: `Mampu memilih metode yang tepat dan menyelesaikan studi kasus terapan ${bName} dengan presisi (66% - 85%). Tuntas standar KKTP.`,
              mahir: `Mampu merekayasa strategi alternatif yang efektif dan kreatif dalam memecahkan masalah kompleks ${bName} (86% - 100%). Pengayaan mandiri.`
            },
            interval: {
              i1: 'Belum mencapai ketuntasan, remedial di seluruh bagian',
              i2: 'Belum mencapai ketuntasan, remedial di bagian yang diperlukan',
              i3: '✓ Sudah mencapai ketuntasan, tidak perlu remedial',
              i4: '★ Sudah mencapai ketuntasan, perlu pengayaan atau tantangan lebih'
            },
            passingScore: 75
          },
          {
            code: `${bCode}.3`,
            title: `Peserta didik (**A**) mampu **mengevaluasi data hasil penyelidikan, mengkreasikan karya/solusi inovatif**, serta mengomunikasikan gagasan (**B**) terkait **${bName}** melalui presentasi atau proyek terpadu (**C**) secara komunikatif, estetis, dan bertanggung jawab (**D**).`,
            bloom: `Mengevaluasi (C5), Mengkreasikan (C6)`,
            p3: `Kreatif, Komunikatif, Berkebinekaan Global`,
            iktp: [
              `IKTP 3.1: Mengevaluasi kesahihan data/informasi hasil penyelidikan dan menarik simpulan logis terkait ${bName}.`,
              `IKTP 3.2: Menyajikan laporan, infografis, atau produk karya inovatif terkait penerapan ${bName} secara estetis dan komunikatif.`
            ],
            rubrik: {
              bb: `Belum mampu menarik simpulan logis dan belum mampu menyajikan hasil karya (0% - 40%). Bimbingan intensif penyusunan karya.`,
              layak: `Mampu menarik simpulan umum, namun artikulasi penyajian karya masih terbatas (41% - 65%). Remedial teknik penyajian dan komunikasi.`,
              cakap: `Mampu mengevaluasi data secara objektif dan menyajikan laporan/presentasi secara komunikatif (66% - 85%). Tuntas standar KKTP.`,
              mahir: `Mampu menghasilkan karya/produk inovatif yang orisinal dan mempresentasikannya dengan sangat inspiratif (86% - 100%). Pengayaan mandiri.`
            },
            interval: {
              i1: 'Belum mencapai ketuntasan, remedial di seluruh bagian',
              i2: 'Belum mencapai ketuntasan, remedial di bagian yang diperlukan',
              i3: '✓ Sudah mencapai ketuntasan, tidak perlu remedial',
              i4: '★ Sudah mencapai ketuntasan, perlu pengayaan atau tantangan lebih'
            },
            passingScore: 75
          }
        ];

        return {
          babName: bName,
          baseCode: bCode,
          hours: bHours,
          tps: defaultTPs
        };
      };

      // =========================================================================
      // MODE 1: PENILAIAN SETIAP TP DALAM BAB / LINGKUP MATERI TERTENTU
      // =========================================================================
      if (!isWholeSemester && !isYear) {
        const targetMat = matchedMaterial || (activeMaterials.length > 0 ? activeMaterials[0] : null);
        const babIndex = targetMat ? activeMaterials.indexOf(targetMat) : 0;
        const babDetail = buildBabTPDetails(targetMat, babIndex >= 0 ? babIndex : 0);
        const babName = babDetail.babName;
        const baseCode = babDetail.baseCode;

        // Generate official 6-column matrix rows
        const matrixRows = babDetail.tps.map((tp, idx) => 
          `| ${idx === 0 ? `**${babName}**<br>*(Kode: ${baseCode})*` : `*(Lanjutan ${baseCode})*`} | **${tp.code}**<br>${tp.title} | ${tp.interval.i1} | ${tp.interval.i2} | **${tp.interval.i3}** | ${tp.interval.i4} |`
        ).join('\n');

        // Generate Rubric rows for each TP
        const tpRubrikRows = babDetail.tps.map((tp) => 
          `| **${tp.code}**<br>*${tp.bloom}* | ${tp.iktp.join('<br>')} | ${tp.rubrik.bb} | ${tp.rubrik.layak} | **${tp.rubrik.cakap}** | ${tp.rubrik.mahir} | **66% – 85% (Cakap)** |`
        ).join('\n');

        // Sample assessment checklist for classroom grading
        const sampleClassChecklist = [
          `| 1 | Ahmad Rizky Pratama | 85 (Cakap) | 78 (Cakap) | 88 (Mahir) | **83.7%** | **TUNTAS** | Melanjutkan ke TP Bab berikutnya |`,
          `| 2 | Siti Nur Aisyah | 92 (Mahir) | 90 (Mahir) | 95 (Mahir) | **92.3%** | **TUNTAS** | Pengayaan mandiri & Tutor sebaya |`,
          `| 3 | Budi Santoso | 60 (Layak) | 75 (Cakap) | 65 (Layak) | **66.7%** | **BELUM TUNTAS** | Remedial indikator ${baseCode}.1 & ${baseCode}.3 |`,
          `| 4 | Dewa Made Putra | 78 (Cakap) | 82 (Cakap) | 80 (Cakap) | **80.0%** | **TUNTAS** | Melanjutkan ke TP Bab berikutnya |`,
          `| 5 | Farhan Maulana | 40 (Baru Berkembang) | 55 (Layak) | 50 (Layak) | **48.3%** | **BELUM TUNTAS** | Bimbingan intensif konsep ${baseCode}.1 & latihan terstruktur |`
        ].join('\n');

        return `# KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
## TAHUN AJARAN ${resolvedAcademicYear}
### PENDIDIKAN DEEP LEARNING (BERMAKNA, BERKESAN, MENYENANGKAN)

---

### A. IDENTITAS PERANGKAT KKTP
* **Satuan Pendidikan:** ${schoolName}
* **Mata Pelajaran:** **${subject}**
* **Fase / Kelas:** **${phase} / Kelas ${grade} (${level})**
* **Semester / Tahun Ajaran:** **Semester ${semester} / Tahun Ajaran ${resolvedAcademicYear}**
* **Bab / Lingkup Materi Pokok:** **${babName}** (Kode: ${baseCode})
* **Alokasi Waktu:** ${babDetail.hours} Jam Pelajaran (JP)
* **Penyusun / Guru Pengampu:** ${teacherName}
* **NIP Guru:** ${teacherNip}

---

### B. TABEL KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
| Bab / Lingkup Materi | Tujuan Pembelajaran (TP) | 0 - 40%<br>*(Remedial di Seluruh Bagian)* | 41 - 65%<br>*(Remedial di Bagian yang Diperlukan)* | 66 - 85%<br>*(Sudah Mencapai Ketuntasan / Tidak Perlu Remedial)* | 86 - 100%<br>*(Perlu Pengayaan / Tantangan Lebih)* |
| :--- | :--- | :--- | :--- | :--- | :--- |
${matrixRows}

---

### C. KETERANGAN INTERVAL KETERCAPAIAN & TINDAK LANJUT ASESMEN
* **0 - 40%** : Belum mencapai ketuntasan, remedial di seluruh bagian
* **41 - 65%** : Belum mencapai ketuntasan, remedial di bagian yang diperlukan
* **66 - 85%** : Sudah mencapai ketuntasan, tidak perlu remedial
* **86 - 100%** : Sudah mencapai ketuntasan, perlu pengayaan atau tantangan lebih

---

### D. PENDEKATAN RUBRIK DESKRIPTIF KETERCAPAIAN DEEP LEARNING (4 LEVEL MUTU)
| Kode & Fokus TP | Indikator Asesmen Ketercapaian (IKTP) | Baru Berkembang (0% – 40%)<br>*Perlu Bimbingan Khusus* | Layak (41% – 65%)<br>*Remedial Parsial* | Cakap (66% – 85%)<br>*Tuntas Standar (KKTP)* | Mahir (86% – 100%)<br>*Sangat Baik / Pengayaan* | Standar Ketuntasan |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
${tpRubrikRows}

---

### E. MATRIKS REKAPITULASI CEKLIS HASIL ASESMEN PESERTA DIDIK
| No | Nama Peserta Didik | Nilai Capaian ${baseCode}.1 (Konsep) | Nilai Capaian ${baseCode}.2 (Aplikasi) | Nilai Capaian ${baseCode}.3 (Kreasi) | Rerata Capaian Bab (%) | Ketercapaian Bab | Rencana Tindak Lanjut |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
${sampleClassChecklist}
| ... | *[Daftar Seluruh Peserta Didik Kelas]* | ... | ... | ... | ... | ... | ... |

---

### F. PEDOMAN TINDAK LANJUT ASESMEN, REMEDIAL & PENGAYAAN TERPADU
1. **Prinsip Intervensi Remedial Terarah:**
   * Remedial dilaksanakan **hanya pada indikator Tujuan Pembelajaran (TP) yang belum tuntas**, bukan mengulang seluruh materi bab.
   * Peserta didik dengan capaian **0 - 40%** diberikan pembelajaran ulang secara intensif dengan pendampingan langsung guru (*scaffolding*).
   * Peserta didik dengan capaian **41 - 65%** diberikan latihan terbimbing pada indikator spesifik yang belum dikuasai.
2. **Program Pengayaan Peserta Didik Mahir:**
   * Peserta didik dengan capaian **86 - 100%** diberikan materi pendalaman, proyek analitis kontekstual, atau diperbantukan sebagai **Tutor Sebaya** untuk memfasilitasi rekannya.

---

${buildOfficialLembarPengesahan({
  title: 'KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) mata pelajaran **${subject}** (${phase} / Kelas ${grade}) materi **${currentMaterial?.essentialMaterial || topic}** ini telah diverifikasi, disetujui, dan disahkan untuk dipergunakan sebagai acuan evaluasi mutu pembelajaran pada Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
      }

      // =========================================================================
      // MODE 3: PENILAIAN SETIAP TP 1 TAHUN PELAJARAN PENUH (SEMESTER 1 & 2)
      // =========================================================================
      if (isYear) {
        const sem1Mats = (distributionData?.materialsSem1 && distributionData.materialsSem1.length > 0)
          ? distributionData.materialsSem1
          : (syncedContext.sem1Materials && syncedContext.sem1Materials.length > 0 ? syncedContext.sem1Materials : [
              { essentialMaterial: `${subject} - Konsep Esensial Semester 1`, tpName: `${subject} - Konsep Esensial Semester 1`, tpCode: `TP.${grade}.1.1`, allocatedHours: 24 },
              { essentialMaterial: `${subject} - Aplikasi & Investigasi Semester 1`, tpName: `${subject} - Aplikasi & Investigasi Semester 1`, tpCode: `TP.${grade}.1.2`, allocatedHours: 24 }
            ]);

        const sem2Mats = (distributionData?.materialsSem2 && distributionData.materialsSem2.length > 0)
          ? distributionData.materialsSem2
          : (syncedContext.sem2Materials && syncedContext.sem2Materials.length > 0 ? syncedContext.sem2Materials : [
              { essentialMaterial: `${subject} - Pendalaman Konsep Semester 2`, tpName: `${subject} - Pendalaman Konsep Semester 2`, tpCode: `TP.${grade}.2.1`, allocatedHours: 24 },
              { essentialMaterial: `${subject} - Proyek Terapan Semester 2`, tpName: `${subject} - Proyek Terapan Semester 2`, tpCode: `TP.${grade}.2.2`, allocatedHours: 24 }
            ]);

        const totalYearHours = [...sem1Mats, ...sem2Mats].reduce((acc, m) => acc + (Number(m.allocatedHours) || 20), 0);

        // Build Sem 1 Matrix rows
        const sem1MatrixRows = sem1Mats.flatMap((mat, bIdx) => {
          const babData = buildBabTPDetails(mat, bIdx, '1');
          return babData.tps.map((tp, tpIdx) => 
            `| ${tpIdx === 0 ? `**Bab 1.${bIdx + 1}: ${babData.babName}**` : `*(Lanjutan Bab 1.${bIdx + 1})*`} | **${tp.code}**<br>${tp.title} | ${tp.interval.i1} | ${tp.interval.i2} | **${tp.interval.i3}** | ${tp.interval.i4} |`
          );
        }).join('\n');

        // Build Sem 2 Matrix rows
        const sem2MatrixRows = sem2Mats.flatMap((mat, bIdx) => {
          const babData = buildBabTPDetails(mat, bIdx, '2');
          return babData.tps.map((tp, tpIdx) => 
            `| ${tpIdx === 0 ? `**Bab 2.${bIdx + 1}: ${babData.babName}**` : `*(Lanjutan Bab 2.${bIdx + 1})*`} | **${tp.code}**<br>${tp.title} | ${tp.interval.i1} | ${tp.interval.i2} | **${tp.interval.i3}** | ${tp.interval.i4} |`
          );
        }).join('\n');

        return `# KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
## TAHUN AJARAN ${resolvedAcademicYear}
### PENDIDIKAN DEEP LEARNING (BERMAKNA, BERKESAN, MENYENANGKAN)
#### CAKUPAN 1 TAHUN PELAJARAN PENUH (SEMESTER 1 GANJIL & SEMESTER 2 GENAP)

---

### A. IDENTITAS PERANGKAT KKTP TAHUNAN
* **Satuan Pendidikan:** ${schoolName}
* **Mata Pelajaran:** **${subject}**
* **Fase / Kelas:** **${phase} / Kelas ${grade} (${level})**
* **Tahun Ajaran:** **${resolvedAcademicYear}**
* **Cakupan Pembelajaran:** 1 Tahun Pelajaran Penuh (${sem1Mats.length} Bab Semester 1 & ${sem2Mats.length} Bab Semester 2)
* **Total Alokasi Waktu:** ${totalYearHours} Jam Pelajaran (JP) / Tahun
* **Penyusun / Guru Pengampu:** ${teacherName}
* **NIP Guru:** ${teacherNip}

---

### B. TABEL KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) SEMESTER 1 (GANJIL)
| Bab / Lingkup Materi | Tujuan Pembelajaran (TP) | 0 - 40%<br>*(Remedial di Seluruh Bagian)* | 41 - 65%<br>*(Remedial di Bagian yang Diperlukan)* | 66 - 85%<br>*(Sudah Mencapai Ketuntasan / Tidak Perlu Remedial)* | 86 - 100%<br>*(Perlu Pengayaan / Tantangan Lebih)* |
| :--- | :--- | :--- | :--- | :--- | :--- |
${sem1MatrixRows}

---

### C. TABEL KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) SEMESTER 2 (GENAP)
| Bab / Lingkup Materi | Tujuan Pembelajaran (TP) | 0 - 40%<br>*(Remedial di Seluruh Bagian)* | 41 - 65%<br>*(Remedial di Bagian yang Diperlukan)* | 66 - 85%<br>*(Sudah Mencapai Ketuntasan / Tidak Perlu Remedial)* | 86 - 100%<br>*(Perlu Pengayaan / Tantangan Lebih)* |
| :--- | :--- | :--- | :--- | :--- | :--- |
${sem2MatrixRows}

---

### D. KETERANGAN INTERVAL KETERCAPAIAN & TINDAK LANJUT ASESMEN
* **0 - 40%** : Belum mencapai ketuntasan, remedial di seluruh bagian
* **41 - 65%** : Belum mencapai ketuntasan, remedial di bagian yang diperlukan
* **66 - 85%** : Sudah mencapai ketuntasan, tidak perlu remedial
* **86 - 100%** : Sudah mencapai ketuntasan, perlu pengayaan atau tantangan lebih

---

### E. PEDOMAN TINDAK LANJUT ASESMEN, REMEDIAL & PENGAYAAN TAHUNAN
1. **Remedial Berkelanjutan:**
   * Dilakukan langsung setelah penilaian formatif/sumatif tiap TP selesai, tidak menunggu akhir semester atau akhir tahun.
   * Hanya mencakup indikator TP yang belum mencapai batas minimal (Cakap / 66% - 85%).
2. **Pengayaan Berkelanjutan:**
   * Diberikan kepada peserta didik kategori Mahir (86% - 100%) berupa penugasan proyek analitis dan pemberdayaan sebagai tutor sebaya.

---

${buildOfficialLembarPengesahan({
  title: 'KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) TAHUNAN',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) 1 Tahun Pelajaran Penuh (Semester 1 & 2) mata pelajaran **${subject}** (${phase} / Kelas ${grade}) ini telah diverifikasi, disetujui, dan disahkan untuk dipergunakan sebagai acuan evaluasi mutu pembelajaran pada Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
      }

      // =========================================================================
      // MODE 2: PENILAIAN SETIAP TP PADA SETIAP SEMESTER (STANDAR UTAMA DEFAULT)
      // =========================================================================
      const semesterLabel = String(semester) === '2' || String(semester).toLowerCase().includes('genap') ? 'Genap' : 'Ganjil';
      const semesterNumber = semesterLabel === 'Ganjil' ? 1 : 2;
      const matsToProcess = activeMaterials.length > 0 ? activeMaterials : [
        { essentialMaterial: `${subject} - Konsep Pokok Bab 1`, tpName: `${subject} - Konsep Pokok Bab 1`, tpCode: `TP.${grade}.${semesterNumber}.1`, allocatedHours: 18 },
        { essentialMaterial: `${subject} - Penerapan & Investigasi Bab 2`, tpName: `${subject} - Penerapan & Investigasi Bab 2`, tpCode: `TP.${grade}.${semesterNumber}.2`, allocatedHours: 18 },
        { essentialMaterial: `${subject} - Studi Terapan & Kreasi Bab 3`, tpName: `${subject} - Studi Terapan & Kreasi Bab 3`, tpCode: `TP.${grade}.${semesterNumber}.3`, allocatedHours: 18 },
      ];

      // Build semester matrix rows
      const semesterMatrixRows = matsToProcess.flatMap((mat, bIdx) => {
        const babData = buildBabTPDetails(mat, bIdx, String(semesterNumber));
        return babData.tps.map((tp, tpIdx) => 
          `| ${tpIdx === 0 ? `**Bab ${bIdx + 1}: ${babData.babName}**<br>*(Kode: ${babData.baseCode})*` : `*(Lanjutan Bab ${bIdx + 1})*`} | **${tp.code}**<br>${tp.title} | ${tp.interval.i1} | ${tp.interval.i2} | **${tp.interval.i3}** | ${tp.interval.i4} |`
        );
      }).join('\n');

      // Build rubrik rows for each bab
      const semesterRubrikRows = matsToProcess.flatMap((mat, bIdx) => {
        const babData = buildBabTPDetails(mat, bIdx, String(semesterNumber));
        return babData.tps.map((tp) => 
          `| **${tp.code}**<br>*${babData.babName}* | ${tp.iktp.join('<br>')} | ${tp.rubrik.bb} | ${tp.rubrik.layak} | **${tp.rubrik.cakap}** | ${tp.rubrik.mahir} | **66% – 85% (Cakap)** |`
        );
      }).join('\n');

      // Sample assessment checklist for classroom grading in this semester
      const sampleSemesterChecklist = [
        `| 1 | Ahmad Rizky Pratama | 85 (Cakap) | 78 (Cakap) | 88 (Mahir) | **83.7%** | **TUNTAS** | Melanjutkan ke Materi Semester Berikutnya |`,
        `| 2 | Siti Nur Aisyah | 92 (Mahir) | 90 (Mahir) | 95 (Mahir) | **92.3%** | **TUNTAS** | Pengayaan Mandiri & Tutor Sebaya |`,
        `| 3 | Budi Santoso | 60 (Layak) | 75 (Cakap) | 65 (Layak) | **66.7%** | **BELUM TUNTAS** | Remedial Terarah pada TP yang Belum Tuntas |`,
        `| 4 | Dewa Made Putra | 78 (Cakap) | 82 (Cakap) | 80 (Cakap) | **80.0%** | **TUNTAS** | Pemantapan Keterampilan Proses |`,
        `| 5 | Farhan Maulana | 40 (Berkembang) | 55 (Layak) | 50 (Layak) | **48.3%** | **BELUM TUNTAS** | Pendampingan Intensif & Scaffolding |`
      ].join('\n');

      return `# KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
## TAHUN AJARAN ${resolvedAcademicYear}
### PENDIDIKAN DEEP LEARNING (BERMAKNA, BERKESAN, MENYENANGKAN)

---

### A. IDENTITAS PERANGKAT KKTP
* **Satuan Pendidikan:** ${schoolName}
* **Mata Pelajaran:** **${subject}**
* **Fase / Kelas:** **${phase} / Kelas ${grade} (${level})**
* **Semester / Tahun Ajaran:** **Semester ${semesterLabel} (Semester ${semesterNumber}) / Tahun Ajaran ${resolvedAcademicYear}**
* **Cakupan Pembelajaran:** Seluruh Materi Pokok Semester ${semesterLabel} (${matsToProcess.length} Bab Terintegrasi Profil Guru)
* **Penyusun / Guru Pengampu:** ${teacherName}
* **NIP Guru:** ${teacherNip}

---

### B. TABEL KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
| Bab / Lingkup Materi | Tujuan Pembelajaran (TP) | 0 - 40%<br>*(Remedial di Seluruh Bagian)* | 41 - 65%<br>*(Remedial di Bagian yang Diperlukan)* | 66 - 85%<br>*(Sudah Mencapai Ketuntasan / Tidak Perlu Remedial)* | 86 - 100%<br>*(Perlu Pengayaan / Tantangan Lebih)* |
| :--- | :--- | :--- | :--- | :--- | :--- |
${semesterMatrixRows}

---

### C. KETERANGAN INTERVAL KETERCAPAIAN & TINDAK LANJUT ASESMEN
* **0 - 40%** : Belum mencapai ketuntasan, remedial di seluruh bagian
* **41 - 65%** : Belum mencapai ketuntasan, remedial di bagian yang diperlukan
* **66 - 85%** : Sudah mencapai ketuntasan, tidak perlu remedial
* **86 - 100%** : Sudah mencapai ketuntasan, perlu pengayaan atau tantangan lebih

---

### D. PENDEKATAN RUBRIK DESKRIPTIF KETERCAPAIAN DEEP LEARNING (4 LEVEL MUTU)
| Kode & Fokus TP | Indikator Asesmen Ketercapaian (IKTP) | Baru Berkembang (0% – 40%)<br>*Perlu Bimbingan Khusus* | Layak (41% – 65%)<br>*Remedial Parsial* | Cakap (66% – 85%)<br>*Tuntas Standar (KKTP)* | Mahir (86% – 100%)<br>*Sangat Baik / Pengayaan* | Standar Ketuntasan |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
${semesterRubrikRows}

---

### E. MATRIKS REKAPITULASI CEKLIS HASIL ASESMEN PESERTA DIDIK SEMESTER ${semesterLabel.toUpperCase()}
| No | Nama Peserta Didik | Rerata Capaian Bab 1 (%) | Rerata Capaian Bab 2 (%) | Rerata Capaian Bab 3 (%) | Rerata Akhir Semester (%) | Predikat Ketercapaian | Rencana Tindak Lanjut |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
${sampleSemesterChecklist}
| ... | *[Daftar Seluruh Peserta Didik Kelas]* | ... | ... | ... | ... | ... | ... |

---

### F. PEDOMAN TINDAK LANJUT ASESMEN, REMEDIAL & PENGAYAAN TERPADU
1. **Kriteria Ketuntasan Minimal Peserta Didik:**
   * Peserta didik dinyatakan **TUNTAS** pada suatu Tujuan Pembelajaran (TP) apabila memperoleh capaian minimal predikat **Cakap (Skor Interval 66% – 85%)** pada rubrik deskripsi atau asesmen sumatif bab bersangkutan.
2. **Prinsip Remedial Terfokus:**
   * Remedial dilakukan secara terarah **hanya pada TP yang belum tuntas**, bukan mengulang seluruh materi bab.
   * Kegiatan remedial dapat berupa bimbingan perorangan, penyederhanaan instruksi LKPD, atau pemanfaatan tutor sebaya.
3. **Pengayaan Siswa Berpencapaian Cepat (Mahir 86% - 100%):**
   * Diberikan tantangan analisis berbasis proyek nyata atau pendalaman materi kontekstual.

---

${buildOfficialLembarPengesahan({
  title: `KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) SEMESTER ${semesterLabel.toUpperCase()}`,
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) Semester ${semesterLabel} mata pelajaran **${subject}** (${phase} / Kelas ${grade}) ini telah diverifikasi, disetujui, dan disahkan untuk dipergunakan sebagai acuan evaluasi pembelajaran Deep Learning pada Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;
    }

    case 'rubrik_penilaian':
    case 'asesmen':
      return `# RUBRIK PENILAIAN TERPADU BERBASIS DEEP LEARNING & KARAKTER 6C
## SINKRON DENGAN RENCANA PELAKSANAAN MODUL (RPM) & KURIKULUM MERDEKA
### PENDEKATAN DEEP LEARNING (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)

---

### A. IDENTITAS ASESMEN & BAGAN SISTEM PENILAIAN TERINTEGRASI
* **Satuan Pendidikan:** **${schoolName}**
* **Mata Pelajaran:** **${subject}** | **Fase / Kelas:** **${phase} / Kelas ${grade} (${level})**
* **Lingkup Materi Pokok:** **${topic}**
* **Tujuan Pembelajaran (TP):** ${tpTitle}
* **Pendekatan & Model:** **Deep Learning (Mindful, Meaningful, & Joyful Learning)**
* **Guru Pengampu:** ${teacherName} (NIP. ${teacherNip})
* **Kepala Satuan Pendidikan:** ${headmasterName} (NIP. ${headmasterNip})

\`\`\`
+---------------------------------------------------------------------------------------------------+
|               BAGAN STRUKTUR ASESMEN HOLISTIK & AUTENTIK DEEP LEARNING                            |
|                                                                                                   |
|  ┌─────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐  |
|  │ 1. MINDFUL ASSESSMENT   │ ──► │ 2. MEANINGFUL ASSESSMENT  │ ──► │ 3. JOYFUL ASSESSMENT      │  |
|  ├─────────────────────────┤     ├───────────────────────────┤     ├───────────────────────────┤  |
|  │ • Diagnostik Emosi & Minat│    │ • Sikap 6C Berkelanjutan  │     │ • Gelar Karya & Pameran   │  |
|  │ • Kesiapan Kognitif Awal│     │ • Kinerja & Penyelidikan  │     │ • Umpan Balik Antarteman  │  |
|  │ • Latihan Fokus STOP    │     │ • Tes Tertulis HOTS (PG)  │     │ • Refleksi Metakognisi    │  |
|  │ • Pemetaan Scaffolding  │     │ • Soal Kasus Terapan      │     │ • Selebrasi Capaian Siswa │  |
|  └─────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘  |
+---------------------------------------------------------------------------------------------------+
\`\`\`

| No | Jenis Asesmen | Teknik Penilaian | Bentuk Instrumen | Dimensi 6C & Pilar Deep Learning | Waktu Pelaksanaan |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | **Diagnostik** | Kuesioner Emosi & Tes Lisan | Angket Gaya Belajar & Soal Prasyarat | Mindful: Kesiapan Belajar & Prasyarat | Awal Sesi / Pertemuan 1 |
| 2 | **Formatif Sikap** | Observasi Berkelanjutan | Lembar Observasi Karakter 6C | Meaningful: Karakter, Gotong Royong, Nalar Kritis | Selama Proses KBM |
| 3 | **Formatif Kinerja** | Penilaian Autentik LKPD | Rubrik Analisis Kasus & Kanvas Solusi | Meaningful: Keterampilan Proses & Logika | Saat Kegiatan Inti |
| 4 | **Formatif Teman** | Penilaian Antarteman | Lembar *Two Stars and a Wish* | Joyful: Komunikasi & Empati Apresiatif | Sesi *Gallery Walk* |
| 5 | **Sumatif Materi** | Tes Tertulis & Proyek | Soal PG-HOTS, Uraian & Rubrik Karya | Joyful & Transfer: C4–C6 Penalaran & Rekayasa | Akhir Lingkup Materi |

---

### B. RUBRIK ASESMEN DIAGNOSTIK AWAL (KESIAPAN BELAJAR)

#### 1. Diagnostik Non-Kognitif (Gaya Belajar & Kondisi Emosional)
| Indikator Diagnostik | Kategori Visual | Kategori Auditori | Kategori Kinestetik | Tindak Lanjut Diferensiasi |
| :--- | :--- | :--- | :--- | :--- |
| **Modalitas Dominan** | Memahami lewat infografis, video, dan bagan alur. | Memahami lewat penjelasan lisan, diskusi, dan podcast. | Memahami lewat praktik langsung, manipulasi objek konkret. | Guru menyediakan variasi media bahan ajar multimodal. |

#### 2. Diagnostik Kognitif Prasyarat Materi ${topic}
| Kesiapan Siswa | Skor Prasyarat | Deskripsi Karakteristik | Intervensi Pembelajaran |
| :--- | :---: | :--- | :--- |
| **Mahir (Siap)** | 85 - 100 | Menguasai seluruh konsep prasyarat dengan matang. | Diberi peran *leader* diskusi dan materi pengayaan. |
| **Cakap (Cukup)** | 65 - 84 | Menguasai sebagian besar prasyarat, sedikit ragu. | Diberikan apersepsi kontekstual dan lembar panduan. |
| **Berkembang (Butuh Bantuan)** | < 65 | Belum menguasai konsep dasar prasyarat. | Diberikan bimbingan terarah (*scaffolding*) intensif. |

---

### C. RUBRIK ASESMEN FORMATIF SIKAP & KARAKTER DIMENSI 6C
*Skala Penilaian: 4 = Sangat Baik / Membudaya, 3 = Baik / Mulai Berkembang, 2 = Cukup / Terlihat, 1 = Perlu Bimbingan*

| Dimensi 6C Kemendikdasmen | Indikator Perilaku Teramati | Kriteria Skor 4 (Mahir) | Kriteria Skor 3 (Cakap) | Kriteria Skor 2 (Layak) | Kriteria Skor 1 (Berkembang) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Character & Akhlak Mulia** | Kejujuran data dan menghargai rekan belajar | Selalu jujur, santun, dan konsisten menghargai pendapat rekan | Jujur dalam pengamatan dan bertutur kata santun | Kadang kurang terbuka dalam data hasil percobaan | Mengabaikan etika dan kurang menghargai rekan |
| **2. Critical Thinking (Nalar Kritis)** | Mampu menganalisis sebab-akibat fenomena ${topic} | Menganalisis secara mendalam, berbasis data valid, dan solutif | Menganalisis dengan baik dan logis | Analisis masih dangkal dan terbatas | Belum mampu mengemukakan analisis sebab-akibat |
| **3. Creativity (Kreativitas)** | Menghasilkan ide/sketsa solusi inovatif | Gagasan sangat orisinal, bernilai guna tinggi, dan estetis | Gagasan inovatif dan dapat diterapkan | Gagasan meniru contoh yang sudah ada | Belum memunculkan ide solusi mandiri |
| **4. Collaboration (Gotong Royong)** | Aktif bekerjasama dalam tim LKPD | Berbagi peran adil, saling memotivasi, dan proaktif membantu | Bekerjasama dengan baik sesuai pembagian tugas | Kurang aktif, hanya menunggu instruksi ketua | Tidak mau bekerjasama dalam kelompok |
| **5. Communication (Komunikasi)** | Menyampaikan gagasan pada sesi *Gallery Walk* | Artikulasi jelas, runtut, persuasif, dan percaya diri | Menyampaikan materi dengan jelas dan terstruktur | Penjelasan kurang runtut dan terbata-bata | Menolak mempresentasikan hasil kerja |
| **6. Citizenship (Kewarganegaraan)** | Kepedulian terhadap lingkungan & isu sosial | Mengaitkan solusi dengan dampak sosial-lingkungan nyata | Memperhatikan aspek kebermanfaatan bagi sekitar | Kurang peka terhadap dampak solusi | Mengabaikan nilai kebermanfaatan sosial |

---

### D. RUBRIK PENILAIAN KINERJA PROSES & LKPD BERJENJANG
| Aspek Penilaian Kinerja | Kriteria Mahir (Skor 4) | Kriteria Cakap (Skor 3) | Kriteria Layak (Skor 2) | Kriteria Berkembang (Skor 1) |
| :--- | :--- | :--- | :--- | :--- |
| **Penyelidikan & Pengolahan Data** | Data pengamatan lengkap, sistematis, dan dianalisis secara presisi. | Data lengkap dan diolah dengan rumus/konsep yang benar. | Data cukup lengkap namun analisis masih sederhana. | Data tidak lengkap dan perhitungan belum tepat. |
| **Kualitas Sketsa / Bagan Solusi** | Bagan konsep/sketsa sangat rapi, informatif, dan memiliki kebaruan ide. | Bagan jelas dan menunjukkan alur logika yang tepat. | Bagan sederhana dan minim keterangan pendukung. | Belum berhasil menyusun bagan solusi. |
| **Umpan Balik Antarteman** | Memberikan masukan konstruktif *Two Stars and a Wish* yang bernas. | Memberikan apresiasi dan masukan yang relevan. | Memberikan komentar singkat tanpa saran perbaikan. | Tidak memberikan umpan balik kepada rekan. |

---

### E. RUBRIK ASESMEN SUMATIF LINGKUP MATERI (KISI-KISI & PENSKORAN)

#### 1. Pedoman Penskoran Soal Pilihan Ganda HOTS (5 Butir)
* Setiap butir soal bernilai **2 poin** jika benar, **0 poin** jika salah. Total skor maksimal = **10 poin**.

#### 2. Rubrik Penskoran Soal Uraian HOTS (3 Butir Kasus Kompleks)
| No Soal | Indikator Kognitif | Deskripsi Kriteria Penskoran Maksimal (Skor 4) | Skor Maks |
| :-: | :--- | :--- | :-: |
| **1** | Analisis Pemecahan Masalah (C4) | Menguraikan akar masalah ${topic} secara runtut, menghubungkan minimal 3 konsep terkait, dan memberi contoh riil. | **4** |
| **2** | Evaluasi Komparatif (C5) | Membandingkan 2 sudut pandang/metode secara objektif berdasarkan efisiensi, akurasi, dan dampak lingkungan. | **4** |
| **3** | Rekayasa Solusi Inovatif (C6) | Merumuskan desain inovasi kontekstual yang aplikatif, terukur, dan memiliki tahapan implementasi logis. | **4** |
| **TOTAL** | **Skor Maksimal Uraian** | | **12** |

#### 3. Rubrik Penilaian Produk / Portofolio Proyek
| Kriteria Produk | Sangat Baik (90 - 100) | Baik (80 - 89) | Cukup (70 - 79) | Kurang (< 70) |
| :--- | :--- | :--- | :--- | :--- |
| **Orisinalitas & Inovasi** | Karya murni ide baru dan solutif terhadap isu nyata. | Karya menunjukkan modifikasi kreatif yang baik. | Karya meniru pola umum yang sudah ada. | Karya kurang menunjukkan kreativitas. |
| **Kesesuaian Konsep ${subject}** | Penerapan teori ilmiah 100% tepat dan terverifikasi. | Sebagian besar teori diterapkan dengan benar. | Terdapat sedikit miskonsepsi minor. | Miskonsepsi mendasar pada konten materi. |
| **Estetika & Kerapian** | Tampilan visual sangat memukau, rapi, dan mudah dipahami. | Tampilan menarik dan terstruktur rapi. | Tampilan cukup rapi namun kurang menarik. | Tampilan tidak rapi dan sulit dibaca. |

---

### F. FORMULA PENGOLAHAN NILAI AKHIR & INTERVENSI KKTP

$$\text{Nilai Akhir Asesmen (NA)} = \left(\frac{\text{Skor PG (Maks 10)} + \text{Skor Uraian (Maks 12)} + \text{Skor Kinerja LKPD (Maks 12)}}{34}\right) \times 100$$

| Rentang Nilai Akhir | Predikat Ketuntasan | Rekomendasi Tindak Lanjut Guru |
| :---: | :---: | :--- |
| **90 – 100** | **Mahir (A)** | Diberikan penugasan pengayaan berupa telaah studi kasus lanjutan / mini riset. |
| **80 – 89** | **Cakap (B)** | Dinyatakan tuntas, siap melanjutkan ke Alur Tujuan Pembelajaran (ATP) berikutnya. |
| **70 – 79** | **Layak (C)** | Tuntas bersyarat, diberikan penguatan mandiri pada indikator yang nilainya rendah. |
| **< 70** | **Baru Berkembang (D)** | Wajib mengikuti program remedial pembelajaran ulang (*re-teaching*) dengan tutor sebaya. |

---

${buildOfficialLembarPengesahan({
  title: 'INSTRUMEN ASESMEN & RUBRIK PENILAIAN',
  schoolName,
  city,
  headmasterName,
  headmasterNip,
  teacherName,
  teacherNip,
  academicYear: resolvedAcademicYear,
  subject,
  grade,
  phase,
  customNote: `Dokumen Rubrik Penilaian Terpadu berbasis Kurikulum Merdeka dan Pendekatan Deep Learning (*Mindful, Meaningful, & Joyful Learning*) mata pelajaran **${subject}** (${phase} / Kelas ${grade}) materi **${topic}** ini telah diperiksa, diverifikasi, dan disahkan oleh Kepala Satuan Pendidikan untuk digunakan dalam evaluasi pembelajaran Tahun Pelajaran **${resolvedAcademicYear}**.`
})}
`;

    default:
      return `# PERANGKAT AJAR KURIKULUM MERDEKA
## MATA PELAJARAN: ${subject.toUpperCase()} (${level} KELAS ${grade})
* **Fase:** ${phase} | **Semester:** ${semester}
* **Topik:** ${topic}
* **Guru Pengampu:** ${teacherName}

---

Dokumen administrasi perangkat ajar berhasil disusun dengan prinsip pembelajaran mendalam (*Deep Learning: Mindful, Meaningful, & Joyful*) dan telah tersinkronisasi penuh dengan master Capaian Pembelajaran.
`;
    }
  };

  let finalDoc = generateCoreDoc();

  // If custom school format / template is enabled, weave template notes and compliance
  if (useCustomFormat && (customFormatNotes || customFormatFile)) {
    const templateName = customFormatFile?.name || 'Template Baku Sekolah / MGMP';
    finalDoc += `\n\n---
\n### 📑 KELENGKAPAN FORMAT & TEMPLATE SEKOLAH RESMI
* **Status Penyesuaian:** ✅ Disesuaikan dengan Standar Template Sekolah (*${templateName}*)
${customFormatFile ? `* **Berkas Acuan Sekolah:** ${customFormatFile.name} (${customFormatFile.type ? customFormatFile.type.toUpperCase() : 'Dokumen'})\n` : ''}${customFormatNotes ? `* **Struktur Khusus Satuan Pendidikan:**\n${customFormatNotes}\n` : ''}* **Keterangan Penjaminan Mutu:** Dokumen ini telah diselaraskan dengan tata kelola administrasi Kurikulum Operasional Satuan Pendidikan (KOSP) dan standar format sekolah yang berlaku.
`;
  }

  return finalDoc;
}

/**
 * Generates a complete, ready-to-print Master Curriculum Portfolio (1 Unified Perangkat Ajar Lengkap)
 * Synchronized across Teacher Profile, CP, TP, ATP, Time Allocation, PROTA, PROSEM, KKTP, Modul Ajar, LKPD, and Rubrik.
 */
export function generateFullCurriculumBundle(params: GenerateCurriculumParams): string {
  const schoolProfile = StorageService.getSchoolProfile();
  const subject = params.subject || 'Fisika';
  const level = params.level || 'SMA';
  const grade = params.grade || 10;
  const phase = params.phase || (grade === 10 ? 'Fase E' : Number(grade) > 10 ? 'Fase F' : Number(grade) >= 7 ? 'Fase D' : 'Fase A/B/C');
  const resolvedAcademicYear = params.academicYear || schoolProfile.academicYear || '2025/2026';
  const teacherName = params.teacherName || params.schoolProfile?.teacherName || params.distributionData?.teacherName || schoolProfile.teacherName || 'Guru Mata Pelajaran';
  const teacherNip = params.teacherNip || params.schoolProfile?.teacherNip || schoolProfile.teacherNip || '19850715 201101 1 003';
  const headmasterName = params.headmasterName || params.schoolProfile?.headmasterName || schoolProfile.headmasterName || 'Kepala Satuan Pendidikan';
  const headmasterNip = params.headmasterNip || params.schoolProfile?.headmasterNip || schoolProfile.headmasterNip || '-';
  const schoolName = params.schoolName || params.schoolProfile?.schoolName || schoolProfile.schoolName || 'SMA / SMK / MA / SMP / SD Terpadu';
  const city = params.city || params.schoolProfile?.city || schoolProfile.city || 'Kota Satuan Pendidikan';

  // 1. Cover Page
  const coverSection = `
# DOKUMEN PERANGKAT AJAR LENGKAP
## KURIKULUM MERDEKA & PENDEKATAN DEEP LEARNING
### (MINDFUL, MEANINGFUL, & JOYFUL LEARNING)

<div style="text-align: center; margin: 30px 0;">
  <div style="font-size: 16pt; font-weight: bold; color: #1e3a8a; text-transform: uppercase;">
    MATA PELAJARAN: ${subject.toUpperCase()}
  </div>
  <div style="font-size: 13pt; font-weight: bold; color: #334155; margin-top: 6px;">
    JENJANG ${level} • ${phase} • KELAS ${grade}
  </div>
  <div style="font-size: 12pt; color: #475569; margin-top: 4px;">
    TAHUN PELAJARAN ${resolvedAcademicYear}
  </div>
</div>

---

### PROFIL GURU PENGAMPU & SATUAN PENDIDIKAN
| Data Administrasi | Keterangan Dokumen Resmi |
| :--- | :--- |
| **Satuan Pendidikan** | **${schoolName}** |
| **Nama Guru Pengampu** | **${teacherName}** |
| **NIP Guru Pengampu** | ${teacherNip} |
| **Mata Pelajaran** | **${subject}** |
| **Fase / Kelas / Jenjang** | **${phase} / Kelas ${grade} (${level})** |
| **Kepala Satuan Pendidikan** | **${headmasterName}** |
| **NIP Kepala Sekolah** | ${headmasterNip} |
| **Kota / Kabupaten** | ${city} |
| **Status Dokumen** | **✅ TERVERIFIKASI & TERSINKRONISASI LENGKAP** |

<div style="page-break-before: always; break-before: page; margin-top: 40px;"></div>
`;

  // 2. Lembar Pengesahan Terpadu
  const pengesahanSection = `
# LEMBAR PENGESAHAN PERANGKAT AJAR
## DOKUMEN ADMINISTRASI PEMBELAJARAN TAHUN PELAJARAN ${resolvedAcademicYear}

Setelah memeriksa dan menelaah secara saksama seluruh instrumen dan dokumen administrasi pembelajaran mata pelajaran **${subject}** untuk **${phase} / Kelas ${grade}**, yang disusun oleh:

* **Nama Guru Mata Pelajaran** : **${teacherName}**
* **NIP** : ${teacherNip}
* **Satuan Pendidikan** : **${schoolName}**

Menyatakan bahwa Perangkat Ajar Kurikulum Merdeka ini telah memenuhi standar kompetensi Capaian Pembelajaran No. 020 Tahun 2026 dan prinsip pembelajaran mendalam (*Deep Learning: Mindful, Meaningful, & Joyful*), serta disahkan untuk diberlakukan sebagai pedoman pelaksanaan Kegiatan Belajar Mengajar (KBM) pada Tahun Pelajaran **${resolvedAcademicYear}**.

---

Ditetapkan dan disahkan di : **${city}**  
Pada tanggal : **${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}**

<table class="signature-table" style="width: 100%; border: none !important; border-collapse: collapse; margin-top: 36px; font-size: 10.5pt; text-align: center; line-height: 1.5;">
  <tr style="border: none !important;">
    <td style="width: 50%; border: none !important; vertical-align: top; text-align: center; padding: 4px 16px;">
      Mengetahui,<br/>
      <strong>Kepala Satuan Pendidikan</strong><br/>
      <strong>${schoolName}</strong>
      <div style="height: 65px;"></div>
      <strong><u>${headmasterName}</u></strong><br/>
      <span>NIP. ${headmasterNip}</span>
    </td>
    <td style="width: 50%; border: none !important; vertical-align: top; text-align: center; padding: 4px 16px;">
      ${city}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
      <strong>Guru Mata Pelajaran</strong><br/>
      <strong>${subject} Kelas ${grade}</strong>
      <div style="height: 65px;"></div>
      <strong><u>${teacherName}</u></strong><br/>
      <span>NIP. ${teacherNip}</span>
    </td>
  </tr>
</table>

<div style="page-break-before: always; break-before: page; margin-top: 40px;"></div>
`;

  // 3. Daftar Isi
  const daftarIsiSection = `
# DAFTAR ISI PERANGKAT AJAR TERPADU
## MATA PELAJARAN: ${subject.toUpperCase()} (${level} KELAS ${grade})

1. **LEMBAR PENGESAHAN RESMI**
2. **BAGIAN I : ANALISIS ALOKASI WAKTU & RINCIAN PEKAN EFEKTIF (RBE)**
3. **BAGIAN II : ANALISIS CAPAIAN PEMBELAJARAN (CP) TERBARU & PEMETAAN ELEMEN**
4. **BAGIAN III : RUMUSAN TUJUAN PEMBELAJARAN (TP) BERBASIS KKO & ABCD**
5. **BAGIAN IV : ALUR TUJUAN PEMBELAJARAN (ATP) & PEMETAAN JAM PELAJARAN**
6. **BAGIAN V : PROGRAM TAHUNAN (PROTA) SEMESTER GANJIL & GENAP**
7. **BAGIAN VI : PROGRAM SEMESTER (PROSEM) & MATRIKS PEKANAN BERWARNA**
8. **BAGIAN VII : KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)**
9. **BAGIAN VIII : MODUL AJAR (DEEP LEARNING: MINDFUL, MEANINGFUL, & JOYFUL)**
10. **BAGIAN IX : LEMBAR KERJA PESERTA DIDIK (LKPD KREATIF BERDIFERENSIASI)**
11. **BAGIAN X : RUBRIK & INSTRUMEN PENILAIAN TERPADU (SIKAP 6C, KINERJA, & SUMATIF HOTS)**

<div style="page-break-before: always; break-before: page; margin-top: 40px;"></div>
`;

  // 4. Generate all individual parts
  const docAlokasiWaktu = generateExpertCurriculumDocument({ ...params, docType: 'analisis_alokasi_waktu', toolType: 'analisis_alokasi_waktu' });
  const docAnalisisCP = generateExpertCurriculumDocument({ ...params, docType: 'analisis_cp', toolType: 'analisis_cp' });
  const docTP = generateExpertCurriculumDocument({ ...params, docType: 'tp', toolType: 'tp' });
  const docATP = generateExpertCurriculumDocument({ ...params, docType: 'atp', toolType: 'atp' });
  const docPROTA = generateExpertCurriculumDocument({ ...params, docType: 'prota', toolType: 'prota' });
  const docPROSEM = generateExpertCurriculumDocument({ ...params, docType: 'prosem', toolType: 'prosem' });
  const docKKTP = generateExpertCurriculumDocument({ ...params, docType: 'kktp', toolType: 'kktp' });
  const docModulAjar = generateExpertCurriculumDocument({ ...params, docType: 'modul_ajar', toolType: 'modul_ajar' });
  const docLKPD = generateExpertCurriculumDocument({ ...params, docType: 'lkpd', toolType: 'lkpd' });
  const docRubrik = generateExpertCurriculumDocument({ ...params, docType: 'rubrik_penilaian', toolType: 'rubrik_penilaian' });

  const pageBreak = '\n\n<div style="page-break-before: always; break-before: page; margin-top: 40px;"></div>\n\n';

  return [
    coverSection.trim(),
    pengesahanSection.trim(),
    daftarIsiSection.trim(),
    '# BAGIAN I : ANALISIS ALOKASI WAKTU (RBE)\n' + docAlokasiWaktu.trim(),
    '# BAGIAN II : ANALISIS CAPAIAN PEMBELAJARAN (CP) TERBARU\n' + docAnalisisCP.trim(),
    '# BAGIAN III : RUMUSAN TUJUAN PEMBELAJARAN (TP)\n' + docTP.trim(),
    '# BAGIAN IV : ALUR TUJUAN PEMBELAJARAN (ATP)\n' + docATP.trim(),
    '# BAGIAN V : PROGRAM TAHUNAN (PROTA)\n' + docPROTA.trim(),
    '# BAGIAN VI : PROGRAM SEMESTER (PROSEM) GANJIL & GENAP\n' + docPROSEM.trim(),
    '# BAGIAN VII : KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)\n' + docKKTP.trim(),
    '# BAGIAN VIII : MODUL AJAR DEEP LEARNING\n' + docModulAjar.trim(),
    '# BAGIAN IX : LEMBAR KERJA PESERTA DIDIK (LKPD KREATIF)\n' + docLKPD.trim(),
    '# BAGIAN X : RUBRIK PENILAIAN TERPADU\n' + docRubrik.trim(),
  ].join(pageBreak);
}


