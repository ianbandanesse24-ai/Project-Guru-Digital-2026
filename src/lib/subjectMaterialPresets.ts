import { CPMaterialItem, ActiveMasterCPData, CPDistributionPlan, CPReference, SchoolLevel } from '../types';
import { StorageService } from './storage';
import { resolvePhaseByLevelAndGrade } from './curriculumLevels';
import { type SubjectPreset, SMA_PRESETS } from './presets/smaPresets';
import { SMA_SOCIAL_PRESETS } from './presets/smaSocialPresets';
import { SMA_ARTS_SPORTS_PRESETS } from './presets/smaArtsSportsPresets';
import { SMP_PRESETS } from './presets/smpPresets';
import { SMP_LANG_MATH_PRESETS } from './presets/smpLanguageMathPresets';
import { SMP_OTHER_PRESETS } from './presets/smpOtherPresets';
import { SD_PRESETS } from './presets/sdPresets';
import { SD_LANG_MATH_PRESETS } from './presets/sdLanguageMathPresets';
import { SD_LANG_CIVICS_PRESETS } from './presets/sdLanguageCivicsPresets';
import { SMK_PRESETS } from './presets/smkPresets';
import { generateDynamicGradePreset } from './presets/dynamicGradeEngine';

export type { SubjectPreset };
export { generateDynamicGradePreset };

/**
 * Master catalog of grade-differentiated subject presets according to
 * Keputusan Kepala BSKAP No. 046/H/KR/2025.
 * Every level (SD, SMP, SMA, SMK) and every grade has completely distinct,
 * authentic learning materials and chapter allocations with zero recycling.
 */
export const SUBJECT_MATERIAL_PRESETS: SubjectPreset[] = [
  ...SMA_PRESETS,
  ...SMA_SOCIAL_PRESETS,
  ...SMA_ARTS_SPORTS_PRESETS,
  ...SMP_PRESETS,
  ...SMP_LANG_MATH_PRESETS,
  ...SMP_OTHER_PRESETS,
  ...SD_PRESETS,
  ...SD_LANG_MATH_PRESETS,
  ...SD_LANG_CIVICS_PRESETS,
  ...SMK_PRESETS,
];

/**
 * Intelligent helper to find or generate the best matching CP Preset for any subject, level, and grade.
 * GUARANTEE: Never recycles or duplicates topics from a different grade!
 */
export function getSubjectPresetByGrade(
  subject: string,
  level: string = 'SMA',
  grade: number = 10,
  phase?: string
): SubjectPreset {
  const normSub = (subject || '').trim().toLowerCase();
  const normLvl = (level || 'SMA').trim().toUpperCase() as SchoolLevel;
  const numGrade = Number(grade) || (normLvl === 'SD' ? 4 : normLvl === 'SMP' ? 7 : 10);
  const resolvedPhase = phase || resolvePhaseByLevelAndGrade(normLvl, numGrade);

  // 1. Exact match: subject, level, and EXACT grade
  const exact = SUBJECT_MATERIAL_PRESETS.find(
    (p) =>
      p.subject.toLowerCase() === normSub &&
      p.level === normLvl &&
      Number(p.grade) === numGrade
  );
  if (exact) return exact;

  // 2. Fuzzy match: subject name contains/is contained + SAME level + SAME exact grade
  const sameLevelGrade = SUBJECT_MATERIAL_PRESETS.find(
    (p) =>
      p.level === normLvl &&
      Number(p.grade) === numGrade &&
      (normSub.includes(p.subject.toLowerCase()) || p.subject.toLowerCase().includes(normSub))
  );
  if (sameLevelGrade) return sameLevelGrade;

  // 3. Fallback to Dynamic Grade Engine tailored to THIS SPECIFIC GRADE & PHASE.
  // CRITICAL: NEVER recycle another grade's materials; generate distinct, grade-calibrated chapters.
  return generateDynamicGradePreset(subject || 'Mata Pelajaran', normLvl, numGrade, resolvedPhase);
}

/**
 * Synchronizes all preset subjects to Master CP storage and CP Reference catalog.
 */
export function syncAllPresetSubjectsToMasterCP(
  teacherName?: string,
  schoolName?: string,
  academicYear?: string
): { totalSynced: number; subjects: string[] } {
  const profile = StorageService.getSchoolProfile();
  const activeTeacher = teacherName || profile.teacherName || 'Aspian La Ode Madimu, S.Pd. Gr';
  const activeSchool = schoolName || profile.schoolName || 'SMA NEGERI 30 MALUKU TENGAH';
  const activeYear = academicYear || profile.academicYear || '2025/2026';

  const existingPlans = StorageService.getCPDistributions() || [];
  const updatedPlans = [...existingPlans];
  const syncedSubjectsList: string[] = [];

  SUBJECT_MATERIAL_PRESETS.forEach((preset) => {
    const sem1 = preset.materialsSem1.map((m, idx) => ({
      ...m,
      id: `m-sem1-${preset.subject.toLowerCase().replace(/\s+/g, '-')}-${preset.grade}-${idx + 1}`,
    }));
    const sem2 = preset.materialsSem2.map((m, idx) => ({
      ...m,
      id: `m-sem2-${preset.subject.toLowerCase().replace(/\s+/g, '-')}-${preset.grade}-${idx + 1}`,
    }));

    const totSem1 = sem1.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);
    const totSem2 = sem2.reduce((acc, m) => acc + (Number(m.allocatedHours) || 0), 0);

    const planId = `master-plan-${preset.subject.toLowerCase().replace(/\s+/g, '-')}-${preset.level.toLowerCase()}-${preset.grade}`;

    const distPlan: CPDistributionPlan = {
      id: planId,
      teacherName: activeTeacher,
      teacherNip: profile.teacherNip || '198507122010011005',
      subject: preset.subject,
      schoolName: activeSchool,
      level: preset.level,
      grade: preset.grade,
      phase: preset.phase,
      academicYear: activeYear,
      semesterOption: 'all',
      totalHoursPerYear: preset.totalHoursPerYear || (totSem1 + totSem2),
      totalTPCount: sem1.length + sem2.length,
      jpPerWeek: preset.jpPerWeek || (preset.level === 'SD' ? 4 : 3),
      cpText: preset.cpSummary,
      elements: preset.elements?.map((e) => ({ name: e.name, description: e.description })) || [
        { name: 'Pemahaman Konsep', description: `Capaian konsep ${preset.subject}` },
        { name: 'Keterampilan Proses', description: `Aplikasi dan keterampilan ${preset.subject}` },
      ],
      materialsSem1: sem1,
      materialsSem2: sem2,
      totalHoursSem1: totSem1,
      totalHoursSem2: totSem2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = updatedPlans.findIndex(
      (p) =>
        p.subject.toLowerCase() === preset.subject.toLowerCase() &&
        Number(p.grade) === Number(preset.grade) &&
        p.level === preset.level
    );
    if (existingIdx >= 0) {
      updatedPlans[existingIdx] = distPlan;
    } else {
      updatedPlans.push(distPlan);
    }

    // Also register in CP Reference
    const cpRef: CPReference = {
      id: `ref-${planId}`,
      title: `[Master Dokumen] ${preset.subject} (${preset.level} - ${preset.phase} Kelas ${preset.grade})`,
      level: preset.level,
      phase: preset.phase,
      grade: preset.grade,
      subject: preset.subject,
      curriculumVersion: 'Kurikulum Berbasis Deep Learning 2026/2027',
      uploadedAt: new Date().toISOString().substring(0, 16),
      uploadedBy: activeTeacher,
      fileName: `Dokumen_CP_${preset.subject}_${preset.level}_Kelas_${preset.grade}_Kemendikdasmen.pdf`,
      cpText: preset.cpSummary,
      elements:
        preset.elements && preset.elements.length > 0
          ? preset.elements.map((el) => ({
              name: el.name,
              description: el.description,
              competencies: el.competencies || ['Menganalisis prinsip inti', 'Mengevaluasi konsep esensial'],
              essentialMaterials: el.essentialMaterials || [`Materi Pokok ${preset.subject}`],
            }))
          : [
              {
                name: 'Pemahaman Konsep',
                description: `Penguasaan konsep dan materi esensial ${preset.subject}`,
                competencies: ['Menganalisis prinsip inti', 'Mengevaluasi konsep esensial'],
                essentialMaterials: [`Materi Pokok ${preset.subject}`],
              },
              {
                name: 'Keterampilan Proses',
                description: `Penerapan metode ilmiah dan penyelesaian masalah ${preset.subject}`,
                competencies: ['Merancang eksperimen/karya', 'Mengomunikasikan hasil'],
                essentialMaterials: [`Proyek Inovasi ${preset.subject}`],
              },
            ],
      rawText: preset.cpSummary,
      aiAnalysisSummary: `Analisis mendalam Capaian Pembelajaran ${preset.subject} (${preset.level} - ${preset.phase}) terintegrasi Deep Learning.`,
    };
    StorageService.saveCPReference(cpRef);

    syncedSubjectsList.push(`${preset.subject} (${preset.level} Kelas ${preset.grade})`);
  });

  StorageService.saveCPDistributions(updatedPlans);

  // Set the first preset (or current subject) as Active Master CP
  const activeMaster = StorageService.getActiveMasterCP();
  const currentSub = activeMaster?.subject || profile.subject || 'Fisika';
  const matchingPreset =
    SUBJECT_MATERIAL_PRESETS.find((p) => p.subject.toLowerCase() === currentSub.toLowerCase()) ||
    SUBJECT_MATERIAL_PRESETS[0];

  const sem1Items = matchingPreset.materialsSem1.map((m, idx) => ({
    ...m,
    id: `m-sem1-${matchingPreset.subject.toLowerCase().replace(/\s+/g, '-')}-${matchingPreset.grade}-${idx + 1}`,
  }));
  const sem2Items = matchingPreset.materialsSem2.map((m, idx) => ({
    ...m,
    id: `m-sem2-${matchingPreset.subject.toLowerCase().replace(/\s+/g, '-')}-${matchingPreset.grade}-${idx + 1}`,
  }));

  const activeMasterData: ActiveMasterCPData = {
    id: `master-${matchingPreset.subject.toLowerCase().replace(/\s+/g, '-')}-${matchingPreset.grade}`,
    fileName: `Dokumen_CP_${matchingPreset.subject}_BSKAP_Kemendikdasmen.pdf`,
    fileType: 'application/pdf',
    fileSize: 1024 * 450,
    uploadedAt: new Date().toISOString(),
    level: matchingPreset.level,
    grade: matchingPreset.grade,
    phase: matchingPreset.phase,
    subject: matchingPreset.subject,
    teacherName: activeTeacher,
    teacherNip: profile.teacherNip,
    schoolName: activeSchool,
    academicYear: activeYear,
    totalHoursPerYear: matchingPreset.totalHoursPerYear,
    jpPerWeek: matchingPreset.jpPerWeek || 3,
    cpText: matchingPreset.cpSummary,
    elements: matchingPreset.elements || [
      {
        name: 'Pemahaman Konsep',
        description: `Penguasaan materi esensial ${matchingPreset.subject}`,
        competencies: ['Menganalisis prinsip inti', 'Mengevaluasi konsep esensial'],
        essentialMaterials: [`Materi Pokok ${matchingPreset.subject}`],
      },
      {
        name: 'Keterampilan Proses',
        description: `Penerapan metode ilmiah dan pemecahan masalah ${matchingPreset.subject}`,
        competencies: ['Merancang eksperimen/karya', 'Mengomunikasikan hasil'],
        essentialMaterials: [`Proyek Inovasi ${matchingPreset.subject}`],
      },
    ],
    materialsSem1: sem1Items,
    materialsSem2: sem2Items,
    executiveSummary: `Analisis resmi komprehensif Capaian Pembelajaran (CP) untuk mata pelajaran ${matchingPreset.subject} Jenjang ${matchingPreset.level} (${matchingPreset.phase} - Kelas ${matchingPreset.grade}). Diperkaya dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful Learning) dan integrasi 6 Karakter Utama.`,
    kktpSummary:
      'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial Bagian Tertentu), 66-85% (Baik/Tuntas Capaian), 86-100% (Sangat Baik/Pengayaan Mandiri).',
    syncStatus: 'synced',
    lastSyncedAt: new Date().toISOString(),
  };

  StorageService.setActiveMasterCP(activeMasterData);

  // Trigger storage events
  window.dispatchEvent(new Event('master-cp-updated'));
  window.dispatchEvent(new Event('storage'));

  return {
    totalSynced: SUBJECT_MATERIAL_PRESETS.length,
    subjects: syncedSubjectsList,
  };
}
