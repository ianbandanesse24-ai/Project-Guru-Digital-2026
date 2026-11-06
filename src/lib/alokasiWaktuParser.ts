import * as XLSX from 'xlsx';
import { UniversalFileParser, ParsedDocumentResult } from './universalFileParser';
import { KalenderMonthAnalysis, KalenderSemesterPlan, KalenderPendidikanData } from '../types';

export interface CustomAlokasiWaktuParseResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  fileCategory: string;
  detectedAcademicYear?: string;
  detectedJpPerWeek?: number;
  detectedSubject?: string;
  detectedGrade?: number;
  semester1: KalenderSemesterPlan;
  semester2: KalenderSemesterPlan;
  extractedNotes?: string;
  confidenceScore: number;
  message: string;
  summary: {
    sem1TotalWeeks: number;
    sem1NonEffectiveWeeks: number;
    sem1EffectiveWeeks: number;
    sem1EffJP: number;
    sem2TotalWeeks: number;
    sem2NonEffectiveWeeks: number;
    sem2EffectiveWeeks: number;
    sem2EffJP: number;
  };
}

const MONTH_NAMES_SEM1 = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTH_NAMES_SEM2 = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

const MONTH_REGEX_SEM1: { name: string; pattern: RegExp }[] = [
  { name: 'Juli', pattern: /jul[iy]?/i },
  { name: 'Agustus', pattern: /agust?|agu|agt/i },
  { name: 'September', pattern: /sept?|sep/i },
  { name: 'Oktober', pattern: /okt|oct/i },
  { name: 'November', pattern: /nov/i },
  { name: 'Desember', pattern: /des|dec/i },
];

const MONTH_REGEX_SEM2: { name: string; pattern: RegExp }[] = [
  { name: 'Januari', pattern: /jan/i },
  { name: 'Februari', pattern: /feb/i },
  { name: 'Maret', pattern: /mar/i },
  { name: 'April', pattern: /apr/i },
  { name: 'Mei', pattern: /mei|may/i },
  { name: 'Juni', pattern: /jun/i },
];

export class AlokasiWaktuParser {
  /**
   * Main parsing method for uploaded custom time allocation file.
   */
  static async parseCustomAnalysisFile(
    file: File,
    currentKaldik: KalenderPendidikanData,
    fallbackJpPerWeek: number = 3
  ): Promise<CustomAlokasiWaktuParseResult> {
    const parsedDoc = await UniversalFileParser.parseFile(file);
    const category = parsedDoc.category;
    let detectedJp = fallbackJpPerWeek;
    let detectedYear = currentKaldik.tahunAjaran || '2025/2026';
    let detectedSubject: string | undefined = undefined;
    let detectedGrade: number | undefined = undefined;

    // Clone current semester plans as baseline
    const sem1Months: KalenderMonthAnalysis[] = currentKaldik.semester1.months.map((m) => ({ ...m }));
    const sem2Months: KalenderMonthAnalysis[] = currentKaldik.semester2.months.map((m) => ({ ...m }));

    let confidence = 50;

    // Search for JP per week in extracted text / table
    const jpMatch = parsedDoc.extractedText.match(/(\d+)\s*(?:jp|jam\s*pelajaran|jam\s*tatap\s*muka)/i);
    if (jpMatch && jpMatch[1]) {
      const val = parseInt(jpMatch[1], 10);
      if (val >= 1 && val <= 10) {
        detectedJp = val;
      }
    }

    // Search for Academic Year e.g. 2025/2026 or 2024-2025
    const yearMatch = parsedDoc.extractedText.match(/(20\d{2})\s*[\/–-]\s*(20\d{2})/);
    if (yearMatch) {
      detectedYear = `${yearMatch[1]}/${yearMatch[2]}`;
    }

    // Search for Grade / Kelas e.g. Kelas 10, X, Kelas 7
    const gradeMatch = parsedDoc.extractedText.match(/kelas\s*([0-9]{1,2}|[IVXLCDM]+)/i);
    if (gradeMatch && gradeMatch[1]) {
      const gStr = gradeMatch[1].toUpperCase();
      if (gStr === 'X' || gStr === '10') detectedGrade = 10;
      else if (gStr === 'XI' || gStr === '11') detectedGrade = 11;
      else if (gStr === 'XII' || gStr === '12') detectedGrade = 12;
      else if (gStr === 'VII' || gStr === '7') detectedGrade = 7;
      else if (gStr === 'VIII' || gStr === '8') detectedGrade = 8;
      else if (gStr === 'IX' || gStr === '9') detectedGrade = 9;
      else {
        const num = parseInt(gStr, 10);
        if (num >= 1 && num <= 12) detectedGrade = num;
      }
    }

    // 1. If Excel file, extract structured data from worksheet rows
    if (category === 'excel') {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        let foundMonths = 0;

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

          rawRows.forEach((row) => {
            if (!Array.isArray(row) || row.length === 0) return;
            const rowStr = row.map((c) => String(c || '').trim()).join(' ');

            // Check Semester 1 months
            MONTH_REGEX_SEM1.forEach((mItem, mIdx) => {
              if (mItem.pattern.test(rowStr)) {
                const numbers = row
                  .map((c) => parseInt(String(c).trim(), 10))
                  .filter((n) => !isNaN(n) && n >= 0 && n <= 10);

                if (numbers.length >= 2) {
                  // Usually: totalWeeks, nonEffectiveWeeks, effectiveWeeks
                  const tw = numbers[0];
                  let newNonEff = sem1Months[mIdx].nonEffectiveWeeks;
                  let newEff = sem1Months[mIdx].effectiveWeeks;

                  if (numbers.length >= 3) {
                    newNonEff = numbers[1];
                    newEff = numbers[2];
                  } else if (numbers.length === 2) {
                    if (numbers[0] >= numbers[1]) {
                      newNonEff = numbers[0] - numbers[1];
                      newEff = numbers[1];
                    }
                  }

                  sem1Months[mIdx].totalWeeks = tw || 4;
                  sem1Months[mIdx].nonEffectiveWeeks = Math.max(0, newNonEff);
                  sem1Months[mIdx].effectiveWeeks = Math.max(0, tw - sem1Months[mIdx].nonEffectiveWeeks);

                  // Extract text note from string cells
                  const textCells = row.filter((c) => typeof c === 'string' && c.trim().length > 3 && !mItem.pattern.test(c));
                  if (textCells.length > 0) {
                    sem1Months[mIdx].description = textCells.join('; ');
                  }
                  foundMonths++;
                }
              }
            });

            // Check Semester 2 months
            MONTH_REGEX_SEM2.forEach((mItem, mIdx) => {
              if (mItem.pattern.test(rowStr)) {
                const numbers = row
                  .map((c) => parseInt(String(c).trim(), 10))
                  .filter((n) => !isNaN(n) && n >= 0 && n <= 10);

                if (numbers.length >= 2) {
                  const tw = numbers[0];
                  let newNonEff = sem2Months[mIdx].nonEffectiveWeeks;
                  let newEff = sem2Months[mIdx].effectiveWeeks;

                  if (numbers.length >= 3) {
                    newNonEff = numbers[1];
                    newEff = numbers[2];
                  } else if (numbers.length === 2) {
                    if (numbers[0] >= numbers[1]) {
                      newNonEff = numbers[0] - numbers[1];
                      newEff = numbers[1];
                    }
                  }

                  sem2Months[mIdx].totalWeeks = tw || 4;
                  sem2Months[mIdx].nonEffectiveWeeks = Math.max(0, newNonEff);
                  sem2Months[mIdx].effectiveWeeks = Math.max(0, tw - sem2Months[mIdx].nonEffectiveWeeks);

                  const textCells = row.filter((c) => typeof c === 'string' && c.trim().length > 3 && !mItem.pattern.test(c));
                  if (textCells.length > 0) {
                    sem2Months[mIdx].description = textCells.join('; ');
                  }
                  foundMonths++;
                }
              }
            });
          });
        });

        if (foundMonths >= 6) {
          confidence = 95;
        } else if (foundMonths >= 3) {
          confidence = 80;
        }
      } catch (err) {
        console.warn('AlokasiWaktuParser Excel extraction warning:', err);
      }
    } else {
      // 2. Parse text or markdown table from Word/PDF/Text
      const lines = parsedDoc.extractedText.split('\n');
      let foundCount = 0;

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        MONTH_REGEX_SEM1.forEach((mItem, mIdx) => {
          if (mItem.pattern.test(trimmed)) {
            const numbers = (trimmed.match(/\b\d+\b/g) || []).map((n) => parseInt(n, 10)).filter((n) => n <= 10);
            if (numbers.length >= 2) {
              const tw = numbers[0];
              const nonEff = numbers.length >= 3 ? numbers[1] : Math.max(0, tw - numbers[1]);
              sem1Months[mIdx].totalWeeks = tw || 4;
              sem1Months[mIdx].nonEffectiveWeeks = nonEff;
              sem1Months[mIdx].effectiveWeeks = Math.max(0, tw - nonEff);
              foundCount++;
            }
          }
        });

        MONTH_REGEX_SEM2.forEach((mItem, mIdx) => {
          if (mItem.pattern.test(trimmed)) {
            const numbers = (trimmed.match(/\b\d+\b/g) || []).map((n) => parseInt(n, 10)).filter((n) => n <= 10);
            if (numbers.length >= 2) {
              const tw = numbers[0];
              const nonEff = numbers.length >= 3 ? numbers[1] : Math.max(0, tw - numbers[1]);
              sem2Months[mIdx].totalWeeks = tw || 4;
              sem2Months[mIdx].nonEffectiveWeeks = nonEff;
              sem2Months[mIdx].effectiveWeeks = Math.max(0, tw - nonEff);
              foundCount++;
            }
          }
        });
      });

      if (foundCount >= 4) {
        confidence = 85;
      } else {
        confidence = 65;
      }
    }

    // Compute Semester 1 Totals
    const s1TotalWeeks = sem1Months.reduce((sum, m) => sum + m.totalWeeks, 0);
    const s1NonEffWeeks = sem1Months.reduce((sum, m) => sum + m.nonEffectiveWeeks, 0);
    const s1EffWeeks = sem1Months.reduce((sum, m) => sum + m.effectiveWeeks, 0);

    // Compute Semester 2 Totals
    const s2TotalWeeks = sem2Months.reduce((sum, m) => sum + m.totalWeeks, 0);
    const s2NonEffWeeks = sem2Months.reduce((sum, m) => sum + m.nonEffectiveWeeks, 0);
    const s2EffWeeks = sem2Months.reduce((sum, m) => sum + m.effectiveWeeks, 0);

    const sem1Plan: KalenderSemesterPlan = {
      semester: 'Ganjil',
      semesterName: 'Ganjil',
      academicYear: detectedYear,
      months: sem1Months,
      totalWeeks: s1TotalWeeks,
      nonEffectiveWeeks: s1NonEffWeeks,
      totalEffectiveWeeks: s1EffWeeks,
      jpPerWeek: detectedJp,
      totalEffectiveHours: s1EffWeeks * detectedJp,
      netTeachingHours: Math.max(0, s1EffWeeks * detectedJp - 6),
      reservedHours: 6,
    };

    const sem2Plan: KalenderSemesterPlan = {
      semester: 'Genap',
      semesterName: 'Genap',
      academicYear: detectedYear,
      months: sem2Months,
      totalWeeks: s2TotalWeeks,
      nonEffectiveWeeks: s2NonEffWeeks,
      totalEffectiveWeeks: s2EffWeeks,
      jpPerWeek: detectedJp,
      totalEffectiveHours: s2EffWeeks * detectedJp,
      netTeachingHours: Math.max(0, s2EffWeeks * detectedJp - 6),
      reservedHours: 6,
    };

    return {
      success: true,
      fileName: file.name,
      fileSize: file.size,
      fileCategory: category,
      detectedAcademicYear: detectedYear,
      detectedJpPerWeek: detectedJp,
      detectedSubject,
      detectedGrade,
      semester1: sem1Plan,
      semester2: sem2Plan,
      extractedNotes: parsedDoc.summaryText,
      confidenceScore: confidence,
      message: `Berkas "${file.name}" berhasil diekstraksi dan dipetakan ke RBE Semester Ganjil & Genap (${confidence}% kecocokan struktur).`,
      summary: {
        sem1TotalWeeks: s1TotalWeeks,
        sem1NonEffectiveWeeks: s1NonEffWeeks,
        sem1EffectiveWeeks: s1EffWeeks,
        sem1EffJP: s1EffWeeks * detectedJp,
        sem2TotalWeeks: s2TotalWeeks,
        sem2NonEffectiveWeeks: s2NonEffWeeks,
        sem2EffectiveWeeks: s2EffWeeks,
        sem2EffJP: s2EffWeeks * detectedJp,
      },
    };
  }

  /**
   * Generates and downloads a clean Excel template formatted for teacher's custom time allocation.
   */
  static downloadAlokasiWaktuExcelTemplate(academicYear: string = '2025/2026', subject: string = 'Fisika'): void {
    const wb = XLSX.utils.book_new();

    // Data for Semester 1 (Ganjil)
    const sem1Data = [
      ['FORMAT ANALISIS ALOKASI WAKTU & RINCIAN PEKAN EFEKTIF (RBE)'],
      [`Tahun Ajaran: ${academicYear} | Mata Pelajaran: ${subject}`],
      ['Semester 1 (Ganjil)'],
      [],
      ['No', 'Bulan', 'Jumlah Pekan', 'Pekan Tidak Efektif', 'Pekan Efektif KBM', 'Keterangan Agenda Sekolah / Kegiatan'],
      [1, 'Juli', 5, 2, 3, 'MPLS (1 Mgg), Libur Awal Semester'],
      [2, 'Agustus', 4, 0, 4, 'KBM Efektif, Peringatan HUT RI'],
      [3, 'September', 4, 1, 3, 'Asesmen Sumatif Tengah Semester (ASTS)'],
      [4, 'Oktober', 5, 0, 5, 'KBM Efektif & P5 Terpadu'],
      [5, 'November', 4, 0, 4, 'KBM Efektif'],
      [6, 'Desember', 4, 2, 2, 'Asesmen Akhir Semester (ASAS), Pembagian Rapor & Libur'],
      ['TOTAL', 'Semester 1', 26, 5, 21, 'Total Jam Pelajaran = 21 Pekan × JP/Minggu'],
    ];

    // Data for Semester 2 (Genap)
    const sem2Data = [
      ['FORMAT ANALISIS ALOKASI WAKTU & RINCIAN PEKAN EFEKTIF (RBE)'],
      [`Tahun Ajaran: ${academicYear} | Mata Pelajaran: ${subject}`],
      ['Semester 2 (Genap)'],
      [],
      ['No', 'Bulan', 'Jumlah Pekan', 'Pekan Tidak Efektif', 'Pekan Efektif KBM', 'Keterangan Agenda Sekolah / Kegiatan'],
      [1, 'Januari', 5, 1, 4, 'Libur Awal Semester Genap, KBM Efektif'],
      [2, 'Februari', 4, 0, 4, 'KBM Efektif'],
      [3, 'Maret', 4, 1, 3, 'Asesmen Tengah Semester, Libur Awal Puasa'],
      [4, 'April', 4, 1, 3, 'Libur Hari Raya Idul Fitri'],
      [5, 'Mei', 5, 1, 4, 'Asesmen Sumatif Akhir Tahun (ASAT)'],
      [6, 'Juni', 4, 3, 1, 'Pengolahan Nilai, Rapor & Libur Kenaikan Kelas'],
      ['TOTAL', 'Semester 2', 26, 7, 19, 'Total Jam Pelajaran = 19 Pekan × JP/Minggu'],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(sem1Data);
    const ws2 = XLSX.utils.aoa_to_sheet(sem2Data);

    // Auto column widths
    const colWidths = [{ wch: 6 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 45 }];
    ws1['!cols'] = colWidths;
    ws2['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws1, 'Semester 1 (Ganjil)');
    XLSX.utils.book_append_sheet(wb, ws2, 'Semester 2 (Genap)');

    XLSX.writeFile(wb, `Template_Analisis_Alokasi_Waktu_${academicYear.replace('/', '-')}.xlsx`);
  }
}
