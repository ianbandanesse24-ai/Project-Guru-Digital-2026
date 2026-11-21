import {
  ActiveMasterCPData,
  AIDocument,
  CPCoverageReport,
  CPDistributionPlan,
  CPDocumentInsights,
  CPGapAnalysisReport,
  CPGapFinding,
  CPMaterialItem,
  CPSubjectEntry,
  SchoolLevel,
  SchoolProfile,
} from '../types';

export type SchoolLevelGroup = 'SD' | 'SMP' | 'SMA' | 'SMK';

export interface SchoolLevelOption {
  group: SchoolLevelGroup;
  level: SchoolLevel;
  shortLabel: string;
  fullLabel: string;
  subText: string;
  phasesSummary: string;
  defaultGrade: number;
  defaultPhase: string;
  defaultJpPerWeek: number;
  defaultMinutesPerJp: string;
}

export const SCHOOL_LEVEL_OPTIONS: SchoolLevelOption[] = [
  {
    group: 'SD',
    level: 'SD',
    shortLabel: 'SD / MI / Paket A',
    fullLabel: 'Jenjang Sekolah Dasar (SD / MI / Paket A)',
    subText: 'Fase A (Kls 1–2) • Fase B (Kls 3–4) • Fase C (Kls 5–6)',
    phasesSummary: 'Fase A: Kelas 1–2 SD • Fase B: Kelas 3–4 SD • Fase C: Kelas 5–6 SD',
    defaultGrade: 4,
    defaultPhase: 'Fase B',
    defaultJpPerWeek: 4,
    defaultMinutesPerJp: '35 Menit',
  },
  {
    group: 'SMP',
    level: 'SMP',
    shortLabel: 'SMP / MTs / Paket B',
    fullLabel: 'Jenjang Sekolah Menengah Pertama (SMP / MTs / Paket B)',
    subText: 'Fase D (Kelas 7 – 9 SMP)',
    phasesSummary: 'Fase D: Kelas 7–9 SMP / MTs / Paket B',
    defaultGrade: 7,
    defaultPhase: 'Fase D',
    defaultJpPerWeek: 3,
    defaultMinutesPerJp: '40 Menit',
  },
  {
    group: 'SMA',
    level: 'SMA',
    shortLabel: 'SMA / MA / Paket C',
    fullLabel: 'Jenjang Sekolah Menengah Atas (SMA / MA / Paket C)',
    subText: 'Fase E (Kls 10) • Fase F (Kls 11–12 SMA/MA/Paket C)',
    phasesSummary: 'Fase E: Kelas 10 • Fase F: Kelas 11–12 SMA / MA / Paket C',
    defaultGrade: 10,
    defaultPhase: 'Fase E',
    defaultJpPerWeek: 3,
    defaultMinutesPerJp: '45 Menit',
  },
  {
    group: 'SMK',
    level: 'SMK',
    shortLabel: 'SMK / MAK',
    fullLabel: 'Jenjang Sekolah Menengah Kejuruan (SMK / MAK)',
    subText: 'Fase E (Kls 10) • Fase F (Kls 11–12 Program 3 Thn / Kls 11–13 Program 4 Thn)',
    phasesSummary: 'Fase E: Kelas 10 • Fase F: Kelas 11–12 (3 Thn) & Kelas 11–13 (4 Thn)',
    defaultGrade: 10,
    defaultPhase: 'Fase E',
    defaultJpPerWeek: 4,
    defaultMinutesPerJp: '45 Menit',
  },
];

export const TIERED_SCHOOL_LEVEL_CARDS: Array<{
  group: SchoolLevelGroup;
  primaryLevel: SchoolLevel;
  title: string;
  aliases: string;
  phaseDetails: string[];
}> = [
  {
    group: 'SD',
    primaryLevel: 'SD',
    title: 'Sekolah Dasar',
    aliases: 'SD / MI / Paket A',
    phaseDetails: [
      'Fase A: Kelas 1 – 2 SD',
      'Fase B: Kelas 3 – 4 SD',
      'Fase C: Kelas 5 – 6 SD',
    ],
  },
  {
    group: 'SMP',
    primaryLevel: 'SMP',
    title: 'Sekolah Menengah Pertama',
    aliases: 'SMP / MTs / Paket B',
    phaseDetails: ['Fase D: Kelas 7 – 9 SMP / MTs'],
  },
  {
    group: 'SMA',
    primaryLevel: 'SMA',
    title: 'Sekolah Menengah Atas',
    aliases: 'SMA / MA / Paket C',
    phaseDetails: [
      'Fase E: Kelas 10 SMA/MA/Paket C',
      'Fase F: Kelas 11 – 12 SMA/MA/Paket C',
    ],
  },
  {
    group: 'SMK',
    primaryLevel: 'SMK',
    title: 'Sekolah Menengah Kejuruan',
    aliases: 'SMK / MAK',
    phaseDetails: [
      'Fase E: Kelas 10 SMK/MAK',
      'Fase F: Kls 11–12 (3 Thn) & Kls 11–13 (4 Thn)',
    ],
  },
];

export function getSchoolLevelGroup(level?: string): SchoolLevelGroup {
  const norm = (level || 'SMA').trim().toUpperCase();
  if (norm === 'SD' || norm === 'MI' || norm === 'PAKET A') return 'SD';
  if (norm === 'SMP' || norm === 'MTS' || norm === 'PAKET B') return 'SMP';
  if (norm === 'SMK' || norm === 'MAK') return 'SMK';
  return 'SMA';
}

export function isSameSchoolLevelGroup(a?: string, b?: string): boolean {
  return getSchoolLevelGroup(a) === getSchoolLevelGroup(b);
}

export function normalizeSchoolLevel(level?: string, textHint?: string): SchoolLevel {
  const exact = (level || '').trim().toUpperCase();
  const hintUpper = (textHint || '').toUpperCase();
  const combined = `${exact} ${hintUpper}`;

  // Strong phase/grade cues in Indonesian BSKAP 046 take precedence over generic defaults
  if (/\bSMK\b|\bMAK\b|KEJURUAN|PROGRAM\s*4\s*TAHUN|\bKELAS\s*(?:13|XIII)\b/.test(combined)) return 'SMK';
  if (/\bFASE\s*D\b/.test(combined)) return 'SMP';
  if (/\bFASE\s*[ABC]\b/.test(combined)) return 'SD';

  if (exact === 'SD' || exact === 'SMP' || exact === 'SMA' || exact === 'SMK') {
    return exact as SchoolLevel;
  }
  if (/\bSMP\b|\bMTS\b|PAKET\s*B/.test(combined)) return 'SMP';
  if (/\bSD\b|\bMI\b|PAKET\s*A/.test(combined)) return 'SD';
  if (/\bSMA\b|\bMA\b|PAKET\s*C|\bFASE\s*[EF]\b/.test(combined)) return 'SMA';
  return 'SMA';
}

export function resolvePhaseByLevelAndGrade(level?: string, grade?: number | string): string {
  const g = Number(grade) || 0;
  const grp = getSchoolLevelGroup(level);

  if (grp === 'SD' || (g >= 1 && g <= 6)) {
    if (g <= 2) return 'Fase A';
    if (g <= 4) return 'Fase B';
    return 'Fase C';
  }
  if (grp === 'SMP' || (g >= 7 && g <= 9)) {
    return 'Fase D';
  }
  if (g === 10) return 'Fase E';
  if (g >= 11 && g <= 13) return 'Fase F';
  return 'Fase E';
}

export function getGradeOptionsByLevel(
  level: SchoolLevel | string
): Array<{ grade: number; phase: string; label: string }> {
  const norm = (level || 'SMA').toUpperCase();
  if (norm === 'SD') {
    return [
      { grade: 1, phase: 'Fase A', label: 'Kelas 1 (Fase A - SD/MI/Paket A)' },
      { grade: 2, phase: 'Fase A', label: 'Kelas 2 (Fase A - SD/MI/Paket A)' },
      { grade: 3, phase: 'Fase B', label: 'Kelas 3 (Fase B - SD/MI/Paket A)' },
      { grade: 4, phase: 'Fase B', label: 'Kelas 4 (Fase B - SD/MI/Paket A)' },
      { grade: 5, phase: 'Fase C', label: 'Kelas 5 (Fase C - SD/MI/Paket A)' },
      { grade: 6, phase: 'Fase C', label: 'Kelas 6 (Fase C - SD/MI/Paket A)' },
    ];
  }
  if (norm === 'SMP') {
    return [
      { grade: 7, phase: 'Fase D', label: 'Kelas 7 (Fase D - SMP/MTs/Paket B)' },
      { grade: 8, phase: 'Fase D', label: 'Kelas 8 (Fase D - SMP/MTs/Paket B)' },
      { grade: 9, phase: 'Fase D', label: 'Kelas 9 (Fase D - SMP/MTs/Paket B)' },
    ];
  }
  if (norm === 'SMK') {
    return [
      { grade: 10, phase: 'Fase E', label: 'Kelas 10 (Fase E - SMK/MAK)' },
      { grade: 11, phase: 'Fase F', label: 'Kelas 11 (Fase F - SMK/MAK Program 3 & 4 Tahun)' },
      { grade: 12, phase: 'Fase F', label: 'Kelas 12 (Fase F - SMK/MAK Program 3 & 4 Tahun)' },
      { grade: 13, phase: 'Fase F', label: 'Kelas 13 (Fase F - SMK/MAK Program 4 Tahun)' },
    ];
  }
  return [
    { grade: 10, phase: 'Fase E', label: 'Kelas 10 (Fase E - SMA/MA/Paket C)' },
    { grade: 11, phase: 'Fase F', label: 'Kelas 11 (Fase F - SMA/MA/Paket C)' },
    { grade: 12, phase: 'Fase F', label: 'Kelas 12 (Fase F - SMA/MA/Paket C)' },
  ];
}

export function getSchoolLevelDisplay(level?: string, grade?: number | string) {
  const norm = (level || 'SMA').toUpperCase();
  const numGrade = Number(grade) || 0;
  if (norm === 'SD') {
    return {
      group: 'SD' as SchoolLevelGroup,
      shortLabel: 'SD / MI / Paket A',
      fullLabel: 'Jenjang Sekolah Dasar (SD / MI / Paket A)',
      subLabel: resolvePhaseByLevelAndGrade('SD', numGrade || 4),
    };
  }
  if (norm === 'SMP') {
    return {
      group: 'SMP' as SchoolLevelGroup,
      shortLabel: 'SMP / MTs / Paket B',
      fullLabel: 'Jenjang Sekolah Menengah Pertama (SMP / MTs / Paket B)',
      subLabel: 'Fase D (Kelas 7–9)',
    };
  }
  if (norm === 'SMK') {
    return {
      group: 'SMK' as SchoolLevelGroup,
      shortLabel: 'SMK / MAK',
      fullLabel: 'Jenjang Sekolah Menengah Kejuruan (SMK / MAK)',
      subLabel:
        numGrade === 13
          ? 'Fase F (Kelas 11–13 SMK/MAK Program 4 Tahun)'
          : numGrade >= 11
          ? 'Fase F (Kelas 11–12 SMK/MAK Program 3/4 Tahun)'
          : 'Fase E (Kelas 10 SMK/MAK)',
    };
  }
  return {
    group: 'SMA' as SchoolLevelGroup,
    shortLabel: 'SMA / MA / Paket C',
    fullLabel: 'Jenjang Sekolah Menengah Atas (SMA / MA / Paket C)',
    subLabel:
      numGrade >= 11
        ? 'Fase F (Kelas 11–12 SMA/MA/Paket C)'
        : 'Fase E (Kelas 10 SMA/MA/Paket C)',
  };
}

export const SUBJECTS_BY_LEVEL_GROUP: Record<SchoolLevelGroup, string[]> = {
  SD: [
    'Pendidikan Agama & Budi Pekerti',
    'Pendidikan Pancasila',
    'Bahasa Indonesia',
    'Matematika',
    'IPAS',
    'Bahasa Inggris',
    'PJOK',
    'Seni Budaya',
    'Muatan Lokal',
  ],
  SMP: [
    'Pendidikan Agama & Budi Pekerti',
    'Pendidikan Pancasila',
    'Bahasa Indonesia',
    'Matematika',
    'IPA',
    'IPS',
    'Bahasa Inggris',
    'Informatika',
    'PJOK',
    'Seni Budaya',
    'Prakarya',
  ],
  SMA: [
    'Pendidikan Agama & Budi Pekerti',
    'Pendidikan Pancasila',
    'Bahasa Indonesia',
    'Bahasa Indonesia Tingkat Lanjut',
    'Matematika',
    'Matematika Tingkat Lanjut',
    'Fisika',
    'Kimia',
    'Biologi',
    'Sejarah',
    'Sejarah Tingkat Lanjut',
    'Geografi',
    'Ekonomi',
    'Sosiologi',
    'Antropologi',
    'Bahasa Inggris',
    'Bahasa Inggris Tingkat Lanjut',
    'Bahasa Jerman',
    'Bahasa Arab',
    'Bahasa Jepang',
    'Bahasa Korea',
    'Bahasa Mandarin',
    'Bahasa Perancis',
    'Informatika',
    'Koding dan Kecerdasan Artifisial',
    'PJOK',
    'Seni Rupa',
    'Seni Musik',
    'Seni Tari',
    'Seni Teater',
    'Prakarya & Kewirausahaan',
    'Pendidikan Digital',
  ],
  SMK: [
    'Pendidikan Agama & Budi Pekerti',
    'Pendidikan Pancasila',
    'Bahasa Indonesia',
    'Matematika',
    'Bahasa Inggris',
    'Informatika',
    'Projek IPAS (SMK)',
    'Sejarah',
    'PJOK',
    'Seni Budaya',
    'Dasar-Dasar Program Keahlian (SMK)',
    'Konsentrasi Keahlian (SMK)',
    'Projek Kreatif dan Kewirausahaan (PKK SMK)',
    'Praktik Kerja Lapangan (PKL SMK)',
    'Mata Pelajaran Pilihan Kejuruan (SMK)',
  ],
};

export function getDefaultSubjectsByLevel(level?: string): string[] {
  return SUBJECTS_BY_LEVEL_GROUP[getSchoolLevelGroup(level)];
}

export function isSubjectAllowedForLevel(subject: string, targetLevel: SchoolLevel | string): boolean {
  const grp = getSchoolLevelGroup(targetLevel);
  const s = (subject || '').trim().toLowerCase();
  if (!s) return false;

  const isSmkOnlyName =
    /\(smk\)|\(mak\)|dasar[\s-]+dasar\s+(?:program\s+|bidang\s+)?(?:keahlian|teknik|layanan|agribisnis|akuntansi|manajemen|pemasaran|perhotelan|kuliner|busana|desain|kriya|seni|pekerjaan|nautika|teknika|usaha|kefarmasian|konser|broadcasting|animasi|kimia|pengembangan|perawatan)|konsentrasi\s+keahlian|projek\s+ipas|projek\s+kreatif\s+dan\s+kewirausahaan|kreativitas,\s*inovasi,\s*dan\s*kewirausahaan|\bpkk\b|\bpkl\b|praktik\s+kerja\s+lapangan|pilihan\s+kejuruan/i.test(
      s
    );
  const isSmaOnlyName =
    /\(sma\)|\(paket\s*c\)|\bfisika\b|\bkimia\b(?!.*dasar)|\bbiologi\b|\bgeografi\b|\bekonomi\b|\bsosiologi\b|\bantropologi\b|tingkat\s+lanjut|\bbahasa\s+jerman\b|\bbahasa\s+perancis\b|\bbahasa\s+prancis\b|\bprakarya\s*(?:&|dan)\s*kewirausahaan\b|\bpkwu\b/i.test(
      s
    );
  const isSdOnlyIpas = s === 'ipas' || s === 'ilmu pengetahuan alam dan sosial';
  const isSmpOnlyIpaIps =
    s === 'ipa' ||
    s === 'ips' ||
    s === 'ilmu pengetahuan alam' ||
    s === 'ilmu pengetahuan sosial';
  const isSecondarySejarah = /^sejarah(?:\s+tingkat\s+lanjut)?$/i.test(s);
  const isSmpPrakarya = /^prakarya(?:\s*[:\-–]\s*(?:budi\s*daya|kerajinan|pengolahan|rekayasa))?$/i.test(s);

  if (grp === 'SMA') {
    if (isSmkOnlyName || isSdOnlyIpas || isSmpOnlyIpaIps || isSmpPrakarya) return false;
    return true;
  }
  if (grp === 'SMK') {
    if (isSmaOnlyName || isSdOnlyIpas || isSmpOnlyIpaIps || isSmpPrakarya) return false;
    return true;
  }
  if (grp === 'SD') {
    if (isSmkOnlyName || isSmaOnlyName || isSmpOnlyIpaIps || isSecondarySejarah || isSmpPrakarya) return false;
    return true;
  }
  if (grp === 'SMP') {
    if (isSmkOnlyName || isSmaOnlyName || isSdOnlyIpas || isSecondarySejarah) return false;
    return true;
  }
  return true;
}

export const KNOWN_SUBJECT_PATTERNS: Array<{ pattern: RegExp; canonical: string; preferredGroup?: SchoolLevelGroup }> = [
  { pattern: /\bpendidikan\s+agama\s+islam(?:\s+(?:dan|&)\s+budi\s+pekerti)?\b|\bpai\b/i, canonical: 'Pendidikan Agama Islam & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+kristen(?:\s+(?:dan|&)\s+budi\s+pekerti)?\b/i, canonical: 'Pendidikan Agama Kristen & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+katolik(?:\s+(?:dan|&)\s+budi\s+pekerti)?\b/i, canonical: 'Pendidikan Agama Katolik & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+hindu(?:\s+(?:dan|&)\s+budi\s+pekerti)?\b/i, canonical: 'Pendidikan Agama Hindu & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+buddha(?:\s+(?:dan|&)\s+budi\s+pekerti)?\b/i, canonical: 'Pendidikan Agama Buddha & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+khonghucu(?:\s+(?:dan|&)\s+budi\s+pekerti)?\b/i, canonical: 'Pendidikan Agama Khonghucu & Budi Pekerti' },
  { pattern: /\bpendidikan\s+kepercayaan\b/i, canonical: 'Pendidikan Kepercayaan Terhadap Tuhan YME' },
  { pattern: /\bpendidikan\s+agama(?!\s+(?:islam|kristen|katolik|hindu|buddha|budha|khonghucu|konghucu))(?:\s+(?:dan|&)\s+budi\s+pekerti)?\b|\bpabp\b/i, canonical: 'Pendidikan Agama & Budi Pekerti' },
  { pattern: /\bpendidikan\s+pancasila\b|\bppkn\b/i, canonical: 'Pendidikan Pancasila' },
  { pattern: /\bbahasa\s+indonesia\s+tingkat\s+lanjut\b/i, canonical: 'Bahasa Indonesia Tingkat Lanjut', preferredGroup: 'SMA' },
  { pattern: /\bbahasa\s+indonesia\b/i, canonical: 'Bahasa Indonesia' },
  { pattern: /\bbahasa\s+inggris\s+tingkat\s+lanjut\b/i, canonical: 'Bahasa Inggris Tingkat Lanjut', preferredGroup: 'SMA' },
  { pattern: /\bbahasa\s+inggris\b/i, canonical: 'Bahasa Inggris' },
  { pattern: /\bbahasa\s+jerman\b|\bdeutsch\b/i, canonical: 'Bahasa Jerman', preferredGroup: 'SMA' },
  { pattern: /\bbahasa\s+arab\b/i, canonical: 'Bahasa Arab' },
  { pattern: /\bbahasa\s+jepang\b|\bnihongo\b/i, canonical: 'Bahasa Jepang' },
  { pattern: /\bbahasa\s+korea\b|\bhangeul\b/i, canonical: 'Bahasa Korea' },
  { pattern: /\bbahasa\s+mandarin\b/i, canonical: 'Bahasa Mandarin' },
  { pattern: /\bbahasa\s+perancis\b|\bbahasa\s+prancis\b/i, canonical: 'Bahasa Perancis', preferredGroup: 'SMA' },
  { pattern: /\bbahasa\s+daerah\b|\bmuatan\s+lokal\b/i, canonical: 'Muatan Lokal / Bahasa Daerah' },
  { pattern: /\bmatematika\s+tingkat\s+lanjut\b/i, canonical: 'Matematika Tingkat Lanjut', preferredGroup: 'SMA' },
  { pattern: /\bmatematika\b/i, canonical: 'Matematika' },
  { pattern: /\bprojek\s+(?:ilmu\s+pengetahuan\s+alam\s+dan\s+sosial|ipas)\b|\bipas\s*\(?smk\)?/i, canonical: 'Projek IPAS (SMK)', preferredGroup: 'SMK' },
  { pattern: /(?<!projek\s)(?:\bipas\b|ilmu\s+pengetahuan\s+alam\s+dan\s+sosial)/i, canonical: 'IPAS', preferredGroup: 'SD' },
  { pattern: /\b(?:ilmu\s+pengetahuan\s+alam(?!\s+dan\s+sosial)|(?<!projek\s)ipa(?=\s*(?:\(|$|\n|:|-|dan\s+ips|fase|kelas|smp|mts)))\b/i, canonical: 'IPA', preferredGroup: 'SMP' },
  { pattern: /\b(?:ilmu\s+pengetahuan\s+sosial|ips(?=\s*(?:\(|$|\n|:|-|fase|kelas|smp|mts)))\b/i, canonical: 'IPS', preferredGroup: 'SMP' },
  { pattern: /\bfisika\b/i, canonical: 'Fisika', preferredGroup: 'SMA' },
  { pattern: /\bkimia\b(?!\s+analisis|\s+industri|\s+tekstil)/i, canonical: 'Kimia', preferredGroup: 'SMA' },
  { pattern: /\bbiologi\b/i, canonical: 'Biologi', preferredGroup: 'SMA' },
  { pattern: /\bkoding\s+dan\s+kecerdasan\s+artifisial\b|\bkecerdasan\s+artifisial\b/i, canonical: 'Koding dan Kecerdasan Artifisial' },
  { pattern: /\binformatika\b/i, canonical: 'Informatika' },
  { pattern: /\bsejarah\s+tingkat\s+lanjut\b/i, canonical: 'Sejarah Tingkat Lanjut', preferredGroup: 'SMA' },
  { pattern: /\bsejarah\b/i, canonical: 'Sejarah', preferredGroup: 'SMA' },
  { pattern: /\bgeografi\b/i, canonical: 'Geografi', preferredGroup: 'SMA' },
  { pattern: /\bekonomi\b/i, canonical: 'Ekonomi', preferredGroup: 'SMA' },
  { pattern: /\bsosiologi\b/i, canonical: 'Sosiologi', preferredGroup: 'SMA' },
  { pattern: /\bantropologi\b/i, canonical: 'Antropologi', preferredGroup: 'SMA' },
  { pattern: /\bpjok\b|\bpenjas\b|pendidikan\s+jasmani/i, canonical: 'PJOK' },
  { pattern: /\bseni\s+musik\b/i, canonical: 'Seni Musik' },
  { pattern: /\bseni\s+tari\b/i, canonical: 'Seni Tari' },
  { pattern: /\bseni\s+teater\b/i, canonical: 'Seni Teater' },
  { pattern: /\bseni\s+rupa\b/i, canonical: 'Seni Rupa' },
  { pattern: /\bseni\s+(?:dan\s+)?budaya\b/i, canonical: 'Seni Budaya' },
  // 4 aspek Prakarya & Kewirausahaan (SMA / MA / Paket C - BSKAP 046)
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\s*[:\-–]\s*budi\s*daya\b/i, canonical: 'Prakarya & Kewirausahaan: Budi Daya', preferredGroup: 'SMA' },
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\s*[:\-–]\s*kerajinan\b/i, canonical: 'Prakarya & Kewirausahaan: Kerajinan', preferredGroup: 'SMA' },
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\s*[:\-–]\s*pengolahan\b/i, canonical: 'Prakarya & Kewirausahaan: Pengolahan', preferredGroup: 'SMA' },
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\s*[:\-–]\s*rekayasa\b/i, canonical: 'Prakarya & Kewirausahaan: Rekayasa', preferredGroup: 'SMA' },
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\b|\bpkwu\b/i, canonical: 'Prakarya & Kewirausahaan', preferredGroup: 'SMA' },
  // 4 aspek Prakarya (SMP / MTs / Paket B - BSKAP 046)
  { pattern: /\bprakarya\s*[:\-–]\s*budi\s*daya\b/i, canonical: 'Prakarya: Budi Daya', preferredGroup: 'SMP' },
  { pattern: /\bprakarya\s*[:\-–]\s*kerajinan\b/i, canonical: 'Prakarya: Kerajinan', preferredGroup: 'SMP' },
  { pattern: /\bprakarya\s*[:\-–]\s*pengolahan\b/i, canonical: 'Prakarya: Pengolahan', preferredGroup: 'SMP' },
  { pattern: /\bprakarya\s*[:\-–]\s*rekayasa\b/i, canonical: 'Prakarya: Rekayasa', preferredGroup: 'SMP' },
  { pattern: /\bprakarya\b/i, canonical: 'Prakarya', preferredGroup: 'SMP' },
  // Pendidikan Kesetaraan (Paket A / B / C - BSKAP 046)
  { pattern: /\bpemberdayaan\b/i, canonical: 'Pemberdayaan' },
  { pattern: /\bketerampilan\b/i, canonical: 'Keterampilan' },
  // SMK BSKAP 046 umum & kejuruan
  { pattern: /\bkreativitas,\s*inovasi,\s*(?:dan|&)\s*kewirausahaan\b/i, canonical: 'Kreativitas, Inovasi, dan Kewirausahaan (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bprojek\s+kreatif\s+dan\s+kewirausahaan\b|\bpkk\s*(?:smk|mak)?\b/i, canonical: 'Projek Kreatif dan Kewirausahaan (PKK SMK)', preferredGroup: 'SMK' },
  { pattern: /\bpraktik\s+kerja\s+lapangan\b|\bpkl\s*(?:smk|mak)?\b/i, canonical: 'Praktik Kerja Lapangan (PKL SMK)', preferredGroup: 'SMK' },
  { pattern: /\bpendidikan\s+digital\b/i, canonical: 'Pendidikan Digital', preferredGroup: 'SMA' },
  { pattern: /\bdasar[\s-]+dasar\s+teknik\s+jaringan\s+komputer/i, canonical: 'Dasar-Dasar Teknik Jaringan Komputer & Telekomunikasi (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+pengembangan\s+perangkat\s+lunak/i, canonical: 'Dasar-Dasar Pengembangan Perangkat Lunak & Gim (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+teknik\s+otomotif\b/i, canonical: 'Dasar-Dasar Teknik Otomotif (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+teknik\s+mesin\b/i, canonical: 'Dasar-Dasar Teknik Mesin (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+teknik\s+ketenagalistrikan\b/i, canonical: 'Dasar-Dasar Teknik Ketenagalistrikan (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+teknik\s+elektronika\b/i, canonical: 'Dasar-Dasar Teknik Elektronika (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+desain\s+komunikasi\s+visual\b|\bdkv\b/i, canonical: 'Dasar-Dasar Desain Komunikasi Visual (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+akuntansi\b/i, canonical: 'Dasar-Dasar Akuntansi & Keuangan Lembaga (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+manajemen\s+perkantoran\b/i, canonical: 'Dasar-Dasar Manajemen Perkantoran & Layanan Bisnis (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+pemasaran\b/i, canonical: 'Dasar-Dasar Pemasaran (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+perhotelan\b/i, canonical: 'Dasar-Dasar Perhotelan (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+kuliner\b/i, canonical: 'Dasar-Dasar Kuliner (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+busana\b/i, canonical: 'Dasar-Dasar Busana (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+layanan\s+kesehatan\b/i, canonical: 'Dasar-Dasar Layanan Kesehatan (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+agribisnis\b/i, canonical: 'Dasar-Dasar Agribisnis (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bkonsentrasi\s+keahlian\b/i, canonical: 'Konsentrasi Keahlian (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bmata\s+pelajaran\s+pilihan\s+kejuruan\b/i, canonical: 'Mata Pelajaran Pilihan Kejuruan (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+(?:program\s+)?keahlian\b/i, canonical: 'Dasar-Dasar Program Keahlian (SMK)', preferredGroup: 'SMK' },
];

function stripLevelAnnotations(text: string): string {
  return (text || '')
    .replace(/\((?:[^)]*(?:sd|mi|smp|mts|sma|ma|smk|mak|paket\s*[abc]|fase\s*[a-f]|kelas\s*\d+|program\s*\d+\s*tahun)[^)]*)\)/gi, ' ')
    .replace(/\b(?:untuk\s+)?(?:jenjang|tingkat)?\s*(?:sma|smk|ma|mak|smp|mts|sd|mi|paket\s*[abc]|fase\s*[a-f]|kelas\s*\d+(?:\s*[-–]\s*\d+)?|kurikulum\s+merdeka)\b.*/i, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const NON_SUBJECT_HEADING_REGEX =
  /^(?:umum|rasional|tujuan|karakteristik|elemen|pendahuluan|capaian|pembelajaran|capaian\s+pembelajaran|mata\s+pelajaran|semester|bab|unit|kelas|fase|setiap\s+fase|penutup|daftar\s+isi|kata\s+pengantar|sekolah\s+dasar|sekolah\s+menengah(?:\s+(?:pertama|atas|kejuruan))?|madrasah(?:\s+(?:ibtidaiyah|tsanawiyah|aliyah(?:\s+kejuruan)?))?|keputusan|lampiran|nomor|peserta\s+didik|kurikulum|kemendikbud|kemendikdasmen|bskap|tentang|kesetaraan|pendidikan\s+khusus|program\s+kebutuhan\s+khusus)$|\b(?:bskap|kemendikdasmen|kemendikbud|keputusan\s+kepala|pedoman\s+kurikulum|\d+\s*\/\s*[a-z]+\s*\/\s*kr)\b/i;

/**
 * Extracts explicit subject headings declared inside CP documents (including 2-line BSKAP headings,
 * "CAPAIAN PEMBELAJARAN MATA PELAJARAN X", "Mata Pelajaran: X", numbered headers, and SMK Dasar-Dasar/Konsentrasi headers).
 * Falls back to full-text pattern scanning ONLY if no explicit subject headings exist.
 */
export function extractSubjectsFromCPText(
  sourceText: string,
  targetLevel: SchoolLevel | string
): string[] {
  const detected: string[] = [];
  const pushUnique = (sub: string) => {
    const clean = (sub || '').trim().replace(/^[:\-–.\s]+|[:\-–.\s]+$/g, '');
    if (!clean || clean.length < 3 || clean.length > 90) return;
    if (!isSubjectAllowedForLevel(clean, targetLevel)) return;
    if (!detected.some((d) => d.toLowerCase() === clean.toLowerCase())) {
      detected.push(clean);
    }
  };

  const lines = (sourceText || '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    let headingSub = extractSubjectHeadingFromLine(trimmed);

    // Handle 2-line BSKAP 046 heading: "CAPAIAN PEMBELAJARAN [MATA PELAJARAN]" followed by Subject Title on next line
    if (
      !headingSub &&
      /^(?:#{1,4}\s*|\d+(?:\.\d+)*[\.\)]\s*|[A-Z][\.\)]\s*|[IVXLCDM]+[\.\)]\s*)?capaian\s+pembelajaran(?:\s+mata\s+pelajaran)?\s*[:\-–]?$/i.test(
        trimmed
      ) &&
      i + 1 < lines.length
    ) {
      const nextTrimmed = lines[i + 1].trim();
      if (nextTrimmed && nextTrimmed.length <= 100) {
        headingSub = extractSubjectHeadingFromLine(`${trimmed} ${nextTrimmed}`);
      }
    }

    if (headingSub) {
      pushUnique(headingSub);
      continue;
    }

    // Also inspect Markdown / Excel table rows (e.g. "| 1 | Bahasa Indonesia | ... |")
    const tableCells = trimmed.startsWith('|')
      ? trimmed.split('|').map((c) => c.trim()).filter(Boolean)
      : [];
    if (tableCells.length >= 2 && !/^[-:\s|]+$/.test(trimmed)) {
      for (const cell of tableCells.slice(0, 3)) {
        if (cell.length < 3 || cell.length > 85 || /^\d+$/.test(cell)) continue;
        const cleanCell = stripLevelAnnotations(cell);
        if (NON_SUBJECT_HEADING_REGEX.test(cleanCell)) continue;
        const knownCell = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(cleanCell));
        if (knownCell) {
          pushUnique(knownCell.canonical);
        } else if (/^(?:dasar[\s-]+dasar|konsentrasi\s+keahlian)\s+/i.test(cleanCell)) {
          pushUnique(cleanCell);
        }
      }
    }
  }

  // Fallback ONLY if no explicit subject headings or table rows were detected (e.g. short pasted snippet)
  if (detected.length === 0) {
    for (const entry of KNOWN_SUBJECT_PATTERNS) {
      if (entry.pattern.test(sourceText || '')) {
        pushUnique(entry.canonical);
      }
    }
  }

  return detected;
}

/**
 * Slices the raw CP text section relevant to a specific subject in multi-subject CP documents
 */
function sliceCPTextForSubject(rawText: string, subjectName: string, allSubjects: string[]): string {
  if (!rawText || allSubjects.length <= 1) return rawText;
  const lower = rawText.toLowerCase();
  const subLower = subjectName.toLowerCase();
  const escapedSub = subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Try to locate a header occurrence for this subject
  const headerRegex = new RegExp(
    `(?:capaian\\s+pembelajaran\\s+(?:mata\\s+pelajaran\\s+)?\\n?\\s*|mata\\s+pelajaran\\s*[:\\-]\\s*|\\n\\s*(?:\\d+(?:\\.\\d+)*\\.|[A-Z]\\.|#{1,4})\\s*)${escapedSub}`,
    'i'
  );
  const headerMatch = headerRegex.exec(rawText);
  let startIdx = headerMatch ? headerMatch.index : lower.indexOf(subLower);
  if (startIdx < 0) return rawText;

  // Preserve immediately preceding [Halaman N] / Lampiran marker lines (within 220 chars before subject header)
  const prefixWindowStart = Math.max(0, startIdx - 220);
  const prefixText = rawText.slice(prefixWindowStart, startIdx);
  const markerMatch = prefixText.match(/(?:^|\n)(?:---\s*\[Halaman\s+\d+\]\s*---|LAMPIRAN\s+(?:I{1,3}V?|IV|V|\d+)[^\n]*)/i);
  if (markerMatch && markerMatch.index !== undefined) {
    startIdx = prefixWindowStart + markerMatch.index;
  }

  // Find earliest header/occurrence of any OTHER subject after header + subjectName.length
  let endIdx = rawText.length;
  const searchFrom = (headerMatch ? headerMatch.index : startIdx) + Math.max(subjectName.length, 25);
  for (const other of allSubjects) {
    if (other.toLowerCase() === subLower) continue;
    const escapedOther = other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const otherHeaderRegex = new RegExp(
      `(?:capaian\\s+pembelajaran\\s+(?:mata\\s+pelajaran\\s+)?\\n?\\s*|mata\\s+pelajaran\\s*[:\\-]\\s*|\\n\\s*(?:\\d+(?:\\.\\d+)*\\.|[A-Z]\\.|#{1,4})\\s*)${escapedOther}`,
      'i'
    );
    const sliceAfter = rawText.slice(searchFrom);
    const nextMatch = otherHeaderRegex.exec(sliceAfter);
    if (nextMatch) {
      const candidateEnd = searchFrom + nextMatch.index;
      if (candidateEnd > startIdx + 40 && candidateEnd < endIdx) {
        endIdx = candidateEnd;
      }
    }
  }

  const sliced = rawText.slice(startIdx, endIdx).trim();
  return sliced.length >= 60 ? sliced : rawText;
}

/**
 * Merges multiple analyzedSubjects lists (e.g. AI-extracted + heuristic-detected or multi-file folder CP),
 * keeping richer entries (with materialsSem1/2) cleanly deduplicated.
 */
export function mergeAnalyzedSubjects(
  primaryList: CPSubjectEntry[] = [],
  extraList: CPSubjectEntry[] = []
): CPSubjectEntry[] {
  const merged = new Map<string, CPSubjectEntry>();

  const upsert = (entry: CPSubjectEntry) => {
    if (!entry?.subject?.trim()) return;
    const grp = getSchoolLevelGroup(entry.level);
    const grd = Number(entry.grade) || 0;
    const phs = (entry.phase || resolvePhaseByLevelAndGrade(grp, grd || 10)).trim().toLowerCase();
    const key = `${entry.subject.trim().toLowerCase()}__${grp}__${phs}__${grd}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, entry);
      return;
    }
    const existingMatCount = (existing.materialsSem1?.length || 0) + (existing.materialsSem2?.length || 0);
    const incomingMatCount = (entry.materialsSem1?.length || 0) + (entry.materialsSem2?.length || 0);
    merged.set(key, {
      ...existing,
      ...entry,
      locationRef: existing.locationRef || entry.locationRef,
      categoryTag: existing.categoryTag || entry.categoryTag,
      specialNotes: existing.specialNotes || entry.specialNotes,
      materialsSem1: existingMatCount >= incomingMatCount && existing.materialsSem1?.length ? existing.materialsSem1 : entry.materialsSem1,
      materialsSem2: existingMatCount >= incomingMatCount && existing.materialsSem2?.length ? existing.materialsSem2 : entry.materialsSem2,
      elements: existing.elements?.length ? existing.elements : entry.elements,
      cpText: (existing.cpText?.length || 0) >= (entry.cpText?.length || 0) ? existing.cpText : entry.cpText,
    });
  };

  primaryList.forEach(upsert);
  extraList.forEach(upsert);
  return Array.from(merged.values());
}

function detectHeadingTargetsFromLine(trimmed: string): SchoolLevelGroup[] | null {
  if (!trimmed || trimmed.length > 320) return null;
  const startsWithFaseOrHeading =
    /^(?:#{1,4}\s*|\d+(?:\.\d+)*[\.\)]\s*|[A-Z][\.\)]\s*|[IVXLCDM]+[\.\)]\s*|•\s*)?(?:jenjang|tingkat\s+sekolah|bagian|capaian\s+pembelajaran|sekolah|madrasah|program|untuk\s+(?:sd|smp|sma|smk)|pada\s+akhir\s+fase|fase\s*[a-f]\b|(?:sd|smp|sma|smk)\s*\/\s*(?:mi|mts|ma|mak)|paket\s*[abc]\b)/i.test(
      trimmed
    ) ||
    /\((?:sd|mi|smp|mts|sma|ma|smk|mak)[^)]*\)/i.test(trimmed);

  const isLongProse = trimmed.length > 140 && !/^(?:#{1,4}\s*|\d+[\.\)]\s*|[A-Z][\.\)]\s*)?(?:pada\s+akhir\s+)?fase\s*[a-f]\b/i.test(trimmed);
  if (!startsWithFaseOrHeading || isLongProse) return null;

  const hasSMK = /\b(?:smk|mak)\b|sekolah\s+menengah\s+kejuruan|program\s*(?:3|4)\s*tahun|\bkelas\s*(?:13|xiii)\b/i.test(trimmed);
  const hasSMA = /\b(?:sma|ma)\b|paket\s*c\b|sekolah\s+menengah\s+atas/i.test(trimmed);
  const hasSMP = /\b(?:smp|mts)\b|paket\s*b\b|sekolah\s+menengah\s+pertama|\bfase\s*d\b/i.test(trimmed);
  const hasSD = /\b(?:sd|mi)\b|paket\s*a\b|sekolah\s+dasar|\bfase\s*[abc]\b/i.test(trimmed);

  const targets: SchoolLevelGroup[] = [];
  if (hasSD) targets.push('SD');
  if (hasSMP) targets.push('SMP');
  if (hasSMA) targets.push('SMA');
  if (hasSMK) targets.push('SMK');

  if (targets.length === 0) {
    // In BSKAP 046, general subject Fase E & Fase F cover both SMA/MA/Paket C and SMK/MAK unless filtered by isSubjectAllowedForLevel
    if (/\bfase\s*(?:e|f)\b/i.test(trimmed)) return ['SMA', 'SMK'];
    return null;
  }
  return targets;
}

function extractSubjectHeadingFromLine(trimmed: string): string | null {
  if (!trimmed || trimmed.length > 140) return null;
  const cpHeadingMatch = trimmed.match(
    /^(?:#{1,4}\s*|\d+(?:\.\d+)*[\.\)]\s*|[A-Z][\.\)]\s*|[IVXLCDM]+[\.\)]\s*)?(?:capaian\s+pembelajaran\s+(?:mata\s+pelajaran\s+)?|mata\s+pelajaran\s*[:\-–]\s*)([A-Za-z0-9\s,&:/().-]+)$/i
  );
  if (cpHeadingMatch && cpHeadingMatch[1]) {
    const candidate = stripLevelAnnotations(cpHeadingMatch[1]);
    if (candidate.length >= 3 && !NON_SUBJECT_HEADING_REGEX.test(candidate)) {
      const known = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(candidate));
      return known ? known.canonical : candidate;
    }
  }

  // Match numbered/lettered/markdown headings or standalone known/SMK BSKAP titles
  const numberedHeading = trimmed.match(/^(?:#{1,4}\s*|\d+(?:\.\d+)*[\.\)]\s*|[A-Z][\.\)]\s*|[IVXLCDM]+[\.\)]\s*)(.{3,95})$/);
  const rawBody = (numberedHeading ? numberedHeading[1] : trimmed).trim();
  const cleanBody = stripLevelAnnotations(rawBody).replace(/[:\-–.]+$/, '').trim();
  if (
    cleanBody.length >= 3 &&
    cleanBody.length <= 85 &&
    cleanBody.split(/\s+/).length <= 10 &&
    !NON_SUBJECT_HEADING_REGEX.test(cleanBody) &&
    !/^(?:elemen|rasional|tujuan|karakteristik|bab|unit|semester|fase|kelas)\b/i.test(cleanBody)
  ) {
    // Explicit dynamic SMK Program/Konsentrasi headings in BSKAP 046
    if (/^(?:dasar[\s-]+dasar|konsentrasi\s+keahlian)\s+[a-z0-9]/i.test(cleanBody)) {
      const knownSmk = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(cleanBody));
      return knownSmk ? knownSmk.canonical : cleanBody;
    }

    const known = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(cleanBody));
    if (
      known &&
      (numberedHeading ||
        cleanBody.toLowerCase() === known.canonical.toLowerCase() ||
        cleanBody.split(/\s+/).length <= 6)
    ) {
      return known.canonical;
    }

    if (numberedHeading && /^[A-Z0-9\s,&:/-]+$/.test(cleanBody) && cleanBody.length >= 4) {
      return cleanBody
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\bDan\b/g, 'dan')
        .replace(/\bIpas\b/g, 'IPAS')
        .replace(/\bIpa\b/g, 'IPA')
        .replace(/\bIps\b/g, 'IPS')
        .replace(/\bPjok\b/g, 'PJOK')
        .replace(/\bSmk\b/g, 'SMK')
        .replace(/\bPkl\b/g, 'PKL')
        .replace(/\bPkk\b/g, 'PKK');
    }
  }
  return null;
}

/**
 * Splits a multi-level CP document into sections keyed by SchoolLevelGroup ('SD' | 'SMP' | 'SMA' | 'SMK').
 * Handles BOTH Level-First ("JENJANG SD ... JENJANG SMP ...") AND Subject-First / Phase-Inside BSKAP CP documents
 * ("CAPAIAN PEMBELAJARAN MATA PELAJARAN X" -> "Fase A (SD) ... Fase D (SMP) ... Fase E (SMA/MA & SMK/MAK) ..."),
 * including 2-line BSKAP headings.
 */
export function splitCPTextBySchoolLevel(rawText: string): Map<SchoolLevelGroup, string> {
  const result = new Map<SchoolLevelGroup, string>();
  const text = (rawText || '').trim();
  if (!text) return result;

  const lines = text.split(/\r?\n/);
  const buffers: Record<SchoolLevelGroup, string[]> = {
    SD: [],
    SMP: [],
    SMA: [],
    SMK: [],
  };

  let currentTargets: SchoolLevelGroup[] = [];
  let activeSectionTargets: SchoolLevelGroup[] = [];
  let currentSubjectHeader = '';
  let pendingContextLines: string[] = [];
  const lastInjectedHeader: Record<SchoolLevelGroup, string> = {
    SD: '',
    SMP: '',
    SMA: '',
    SMK: '',
  };

  const flushPendingContextTo = (targets: SchoolLevelGroup[]) => {
    if (pendingContextLines.length === 0) return;
    targets.forEach((grp) => {
      pendingContextLines.forEach((pl) => buffers[grp].push(pl));
    });
    pendingContextLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^---\s*\[Halaman\s+\d+\]\s*---$/i.test(trimmed)) {
      pendingContextLines = [trimmed];
      continue;
    }
    if (/^LAMPIRAN\s+(?:I{1,3}V?|IV|V|\d+)\b/i.test(trimmed) && trimmed.length <= 80) {
      pendingContextLines.push(trimmed);
      continue;
    }

    let effectiveHeadingLine = trimmed;
    let detectedSub = extractSubjectHeadingFromLine(trimmed);
    let consumedNextLine = false;

    // Look ahead if line is standalone "CAPAIAN PEMBELAJARAN [MATA PELAJARAN]" and next line has the subject title
    if (
      !detectedSub &&
      /^(?:#{1,4}\s*|\d+(?:\.\d+)*[\.\)]\s*|[A-Z][\.\)]\s*|[IVXLCDM]+[\.\)]\s*)?capaian\s+pembelajaran(?:\s+mata\s+pelajaran)?\s*[:\-–]?$/i.test(
        trimmed
      ) &&
      i + 1 < lines.length
    ) {
      const nextTrimmed = lines[i + 1].trim();
      if (nextTrimmed && nextTrimmed.length <= 110) {
        const combined = `${trimmed} ${nextTrimmed}`;
        const combinedSub = extractSubjectHeadingFromLine(combined);
        if (combinedSub) {
          detectedSub = combinedSub;
          effectiveHeadingLine = combined;
          consumedNextLine = true;
        }
      }
    }

    if (detectedSub) {
      currentSubjectHeader = detectedSub;
      let lineTargets = detectHeadingTargetsFromLine(effectiveHeadingLine);
      // Also check next line after heading for explicit level tag e.g. "(SD/MI/Program Paket A)" or "(SMK/MAK)"
      const lookaheadIdx = consumedNextLine ? i + 2 : i + 1;
      if ((!lineTargets || lineTargets.length === 0) && lookaheadIdx < lines.length) {
        const nextLineTargets = detectHeadingTargetsFromLine(lines[lookaheadIdx].trim());
        if (nextLineTargets && nextLineTargets.length > 0 && !extractSubjectHeadingFromLine(lines[lookaheadIdx].trim())) {
          lineTargets = nextLineTargets;
        }
      }

      if (lineTargets && lineTargets.length > 0) {
        currentTargets = lineTargets;
      } else if (activeSectionTargets.length > 0) {
        const matchingActive = activeSectionTargets.filter((g) =>
          isSubjectAllowedForLevel(currentSubjectHeader, g)
        );
        currentTargets = matchingActive.length > 0 ? matchingActive : activeSectionTargets;
      } else {
        // Infer allowed groups for strictly single-level subjects (e.g. IPAS->SD, IPA/IPS/Prakarya->SMP, Fisika->SMA, Dasar-Dasar->SMK)
        const allowedForSub = (['SD', 'SMP', 'SMA', 'SMK'] as SchoolLevelGroup[]).filter((g) =>
          isSubjectAllowedForLevel(currentSubjectHeader, g)
        );
        currentTargets = allowedForSub.length === 1 ? allowedForSub : [];
      }

      const allowedTargets = currentTargets.filter((grp) =>
        isSubjectAllowedForLevel(currentSubjectHeader, grp)
      );
      flushPendingContextTo(allowedTargets.length > 0 ? allowedTargets : currentTargets);

      currentTargets.forEach((grp) => {
        if (isSubjectAllowedForLevel(currentSubjectHeader, grp)) {
          buffers[grp].push(`CAPAIAN PEMBELAJARAN MATA PELAJARAN ${currentSubjectHeader}`);
          lastInjectedHeader[grp] = currentSubjectHeader;
        }
      });

      if (consumedNextLine) i++;
      continue;
    }

    const lineTargets = detectHeadingTargetsFromLine(trimmed);
    if (lineTargets && lineTargets.length > 0) {
      const isPureFaseSubheading = /^\s*(?:[A-Z0-9]+[\.\)]\s*)?(?:pada\s+akhir\s+)?fase\s*[a-f]\b/i.test(trimmed) &&
        !/\b(?:jenjang|tingkat\s+sekolah|bagian|capaian\s+pembelajaran\s+(?:jenjang|tingkat|untuk|sd|smp|sma|smk))\b/i.test(trimmed);
      if (!isPureFaseSubheading) {
        currentSubjectHeader = '';
        activeSectionTargets = lineTargets;
      }
      currentTargets = lineTargets;
      flushPendingContextTo(currentTargets);
      currentTargets.forEach((grp) => {
        if (currentSubjectHeader) {
          if (!isSubjectAllowedForLevel(currentSubjectHeader, grp)) return;
          if (lastInjectedHeader[grp] !== currentSubjectHeader) {
            buffers[grp].push(`CAPAIAN PEMBELAJARAN MATA PELAJARAN ${currentSubjectHeader}`);
            lastInjectedHeader[grp] = currentSubjectHeader;
          }
        }
        buffers[grp].push(line);
      });
      continue;
    }

    if (currentTargets.length > 0) {
      flushPendingContextTo(currentTargets);
      currentTargets.forEach((grp) => {
        if (currentSubjectHeader && !isSubjectAllowedForLevel(currentSubjectHeader, grp)) {
          return;
        }
        buffers[grp].push(line);
      });
    }
  }

  (['SD', 'SMP', 'SMA', 'SMK'] as SchoolLevelGroup[]).forEach((grp) => {
    const joined = buffers[grp].join('\n').trim();
    if (joined.length >= 40) {
      result.set(grp, joined);
    }
  });

  return result;
}

function parseIndonesianGradeToken(token: string): number {
  const clean = (token || '').trim().toUpperCase();
  const romanMap: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
    XI: 11,
    XII: 12,
    XIII: 13,
  };
  if (romanMap[clean]) return romanMap[clean];
  const parsed = parseInt(clean, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function detectLevelPhaseGradeFromText(
  text: string,
  levelHint?: SchoolLevel,
  gradeHint?: number | string,
  phaseHint?: string
): {
  level: SchoolLevel;
  subLevelLabel: string;
  grade: number;
  phase: string;
} {
  const source = text || '';
  const lower = source.toLowerCase();

  let level: SchoolLevel = levelHint || 'SMA';
  let phase: string = phaseHint || '';
  let grade: number = Number(gradeHint) || 0;

  // Detect SMK/MAK program 4 tahun / Kelas 13 first
  const hasGrade13 = /\bkelas\s*(?:13|xiii)\b|program\s*4\s*tahun/i.test(lower);
  const hasSMK = /\bsmk\b|\bmak\b|kejuruan|program\s*(?:3|4)\s*tahun/i.test(lower);
  const hasSMA = /\bsma\b|\bma\b|paket\s*c/i.test(lower);
  const hasSMP = /\bsmp\b|\bmts\b|paket\s*b/i.test(lower);
  const hasSD = /\bsd\b|\bmi\b|paket\s*a|sekolah\s+dasar/i.test(lower);

  if (hasSMK && !hasSMA) {
    level = 'SMK';
  } else if (hasSMA && !hasSMK) {
    level = 'SMA';
  } else if (hasSMK || hasGrade13) {
    level = levelHint === 'SMA' && hasSMA ? 'SMA' : 'SMK';
  } else if (hasSMP) {
    level = 'SMP';
  } else if (hasSD) {
    level = 'SD';
  }

  // Detect Phase explicitly
  const phaseMatch = source.match(/\bfase\s*([A-F])\b/i);
  if (phaseMatch && phaseMatch[1]) {
    const pLetter = phaseMatch[1].toUpperCase();
    phase = `Fase ${pLetter}`;
    if (!hasSMK && !hasSMA && !hasSMP && !hasSD) {
      if (pLetter === 'A' || pLetter === 'B' || pLetter === 'C') level = 'SD';
      else if (pLetter === 'D') level = 'SMP';
      else level = hasGrade13 ? 'SMK' : levelHint === 'SMK' ? 'SMK' : 'SMA';
    }
  }

  // Detect Grade explicitly (1 - 13 or Roman I - XIII)
  const gradeMatch = source.match(/\bkelas\s*(1[0-3]|[1-9]|XIII|XII|XI|IX|VIII|VII|VI|IV|V|III|II|I)\b/i);
  if (gradeMatch && gradeMatch[1]) {
    const parsedG = parseIndonesianGradeToken(gradeMatch[1]);
    if (parsedG >= 1 && parsedG <= 13) {
      grade = parsedG;
      if (parsedG <= 6 && !hasSMP && !hasSMA && !hasSMK) level = 'SD';
      else if (parsedG >= 7 && parsedG <= 9 && !hasSD && !hasSMA && !hasSMK) level = 'SMP';
      else if (parsedG === 13) level = 'SMK';
      else if (parsedG >= 10 && !hasSD && !hasSMP) level = hasSMK && !hasSMA ? 'SMK' : levelHint === 'SMK' && hasSMK ? 'SMK' : 'SMA';
    }
  }

  // Reconcile missing grade or phase
  if (!grade || grade < 1 || grade > 13) {
    if (phase === 'Fase A') grade = 1;
    else if (phase === 'Fase B') grade = 4;
    else if (phase === 'Fase C') grade = 5;
    else if (phase === 'Fase D') grade = 7;
    else if (phase === 'Fase E') grade = 10;
    else if (phase === 'Fase F') grade = hasGrade13 ? 13 : 11;
    else if (level === 'SD') grade = 4;
    else if (level === 'SMP') grade = 7;
    else grade = 10;
  }

  // Enforce BSKAP phase/grade -> school level consistency unless caller pinned a levelHint cleanly
  if (phase === 'Fase A' || phase === 'Fase B' || phase === 'Fase C' || (grade >= 1 && grade <= 6)) {
    level = 'SD';
  } else if (phase === 'Fase D' || (grade >= 7 && grade <= 9)) {
    level = 'SMP';
  } else if (grade === 13) {
    level = 'SMK';
  } else if (levelHint === 'SD' || levelHint === 'SMP') {
    level = levelHint;
    if (level === 'SD' && grade > 6) grade = 4;
    if (level === 'SMP' && (grade < 7 || grade > 9)) grade = 7;
  }

  phase = phase || resolvePhaseByLevelAndGrade(level, grade);
  // Ensure phase matches grade consistently
  const resolvedPhase = resolvePhaseByLevelAndGrade(level, grade);
  if (!phaseMatch) {
    phase = resolvedPhase;
  }

  const display = getSchoolLevelDisplay(level, grade);
  return {
    level,
    subLevelLabel: display.subLabel,
    grade,
    phase,
  };
}

const CP_FILLER_TOPIC_REGEX =
  /^(peserta\s+didik|pada\s+akhir\s+fase|akhir\s+fase|capaian\s+pembelajaran|tujuan\s+pembelajaran|profil\s+pelajar|pelajar\s+pancasila|dimensi|kurikulum|kemendikbud|kemendikdasmen|bskap|semester\s*(?:1|2|i|ii|ganjil|genap)|alokasi\s+waktu|jenjang|kelas\s*\d+|fase\s*[a-f]|dengan\s+benar|secara\s+tepat|secara\s+mandiri|dalam\s+kehidupan\s+sehari[-\s]?hari|sehari[-\s]?hari|sesuai\s+kaidah|berbagai|beragam|beberapa|pembelajaran|asesmen|kompetensi|pemahaman\s+konsep|keterampilan\s+proses|fenomena|temuan\s+ilmiah|hasil\s+praktikum)$/i;

const KNOWN_ELEMENT_NAMES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bpemahaman\s+(?:fisika|kimia|biologi|sains|ipa|ips|ipas|ekonomi|geografi|sejarah|sosiologi|konsep)\b/i, label: 'Pemahaman Konsep' },
  { pattern: /\bketerampilan\s+proses\b/i, label: 'Keterampilan Proses' },
  { pattern: /\bmenyimak\b/i, label: 'Menyimak' },
  { pattern: /\bmembaca\s+dan\s+memirsa\b/i, label: 'Membaca dan Memirsa' },
  { pattern: /\bberbicara\s+dan\s+mempresentasikan\b/i, label: 'Berbicara dan Mempresentasikan' },
  { pattern: /\bmenulis\b/i, label: 'Menulis' },
  { pattern: /\bbilangan\b/i, label: 'Bilangan' },
  { pattern: /\baljabar\b/i, label: 'Aljabar' },
  { pattern: /\bpengukuran\b/i, label: 'Pengukuran' },
  { pattern: /\bgeometri\b/i, label: 'Geometri' },
  { pattern: /\banalisis\s+data\s+dan\s+peluang\b/i, label: 'Analisis Data dan Peluang' },
  { pattern: /\bkalkulus\b/i, label: 'Kalkulus' },
  { pattern: /\bpancasila\b/i, label: 'Pancasila' },
  { pattern: /\buud\b|undang[-\s]+undang\s+dasar/i, label: 'Undang-Undang Dasar Negara RI Tahun 1945' },
  { pattern: /\bbhinneka\s+tunggal\s+ika\b/i, label: 'Bhinneka Tunggal Ika' },
  { pattern: /\bnkri\b|negara\s+kesatuan\s+republik\s+indonesia/i, label: 'Negara Kesatuan Republik Indonesia' },
  { pattern: /\bberpikir\s+komputasional\b/i, label: 'Berpikir Komputasional' },
  { pattern: /\bliterasi\s+digital\b|teknologi\s+informasi\s+dan\s+komunikasi/i, label: 'Literasi & Teknologi Digital' },
  { pattern: /\bsistem\s+komputer\b/i, label: 'Sistem Komputer' },
  { pattern: /\bjaringan\s+komputer\b/i, label: 'Jaringan Komputer dan Internet' },
  { pattern: /\banalisis\s+data\b/i, label: 'Analisis Data' },
  { pattern: /\balgoritma\s+dan\s+pemrograman\b/i, label: 'Algoritma dan Pemrograman' },
  { pattern: /\bdampak\s+sosial\s+informatika\b/i, label: 'Dampak Sosial Informatika' },
  { pattern: /\bpraktik\s+lintas\s+bidang\b/i, label: 'Praktik Lintas Bidang' },
  { pattern: /\bal[-\s]?qur['’`]?an\s+dan\s+hadis\b/i, label: "Al-Qur'an dan Hadis" },
  { pattern: /\bakidah\b/i, label: 'Akidah' },
  { pattern: /\bakhlak\b/i, label: 'Akhlak' },
  { pattern: /\bfikih\b/i, label: 'Fikih' },
  { pattern: /\bsejarah\s+peradaban\s+islam\b/i, label: 'Sejarah Peradaban Islam' },
  { pattern: /\bmengalami\b/i, label: 'Mengalami' },
  { pattern: /\bmenciptakan\b/i, label: 'Menciptakan' },
  { pattern: /\bmerefleksikan\b/i, label: 'Merefleksikan' },
  { pattern: /\bberpikir\s+dan\s+bekerja\s+artistik\b/i, label: 'Berpikir dan Bekerja Artistik' },
];

function cleanCandidateTopicPhrase(raw: string): string {
  let cleaned = (raw || '').replace(/^[•\-*\d.)\s]+/, '').replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '');

  // If phrase contains an inline scope introducer ("... meliputi X"), keep only the part after it
  const embeddedCue = cleaned.match(/\b(?:meliputi|mencakup|antara\s+lain|berupa|yakni|yaitu)\s+(.+)$/i);
  if (embeddedCue && embeddedCue[1]) {
    cleaned = embeddedCue[1];
  }

  cleaned = cleaned
    .replace(/^(?:konsep|materi|topik|lingkup\s+materi|ruang\s+lingkup|tentang|mengenai|berupa|yakni|yaitu|meliputi|mencakup|antara\s+lain|seperti|serta|dan|atau|di\s+antaranya|terkait\s+dengan|mengenal|memahami|menganalisis|menerapkan|mengidentifikasi|mengevaluasi|merancang|menjelaskan|mendeskripsikan|menggunakan|memanfaatkan|melakukan|mengamati|menyelidiki|fenomena(?:\s+alam)?)\s+/i, '')
    .replace(/\s+(?:dalam\s+kehidupan\s+sehari[-\s]?hari|sehari[-\s]?hari|sesuai\s+kaidah(?:\s+kerja\s+ilmiah)?|secara\s+(?:tepat|benar|mandiri|kritis|kreatif|kolaboratif|bermakna|sistematis)|untuk\s+memecahkan\s+masalah(?:\s+kontekstual)?|serta\s+penerapannya(?:\s+dalam\s+kehidupan)?|di\s+lingkungan\s+sekitar|pada\s+konteks\s+nyata|dengan\s+benar|secara\s+utuh).*$/i, '')
    .replace(/[.;:,"'()\[\]]+$/g, '')
    .replace(/^[.;:,"'()\[\]]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function splitEnumerationSegment(segment: string): string[] {
  if (!segment) return [];
  const normalized = segment
    .replace(/\s+serta\s+/gi, '; ')
    .replace(/,\s*(?:dan|atau)\s+/gi, '; ')
    .replace(/\s+dan\s+(?=[A-Za-z])/gi, '; ')
    .replace(/[,;•|]+/g, '; ');

  const parts = normalized
    .split(';')
    .map((p) => cleanCandidateTopicPhrase(p))
    .filter((p) => {
      if (p.length < 4 || p.length > 95) return false;
      const wordCount = p.split(/\s+/).length;
      if (wordCount > 9) return false;
      if (CP_FILLER_TOPIC_REGEX.test(p)) return false;
      if (/^(seperti|antara lain|yang|untuk|dalam|pada|dengan|dari|atau|serta|sesuai|tentang)$/i.test(p)) return false;
      return true;
    });

  return parts;
}

function extractTopicsFromCPProse(text: string): string[] {
  const cleanText = (text || '')
    .replace(/---\s*\[Halaman\s+\d+\]\s*---/gi, ' ')
    .replace(/\bLAMPIRAN\s+(?:I{1,3}V?|IV|V|\d+)\b[^\n]*/gi, ' ')
    .replace(/\r/g, ' ')
    .trim();
  if (!cleanText) return [];

  const collected: string[] = [];
  const seenLower = new Set<string>();
  const addTopic = (candidate: string) => {
    const clean = cleanCandidateTopicPhrase(candidate);
    if (!clean || clean.length < 4 || clean.length > 100) return;
    if (clean.split(/\s+/).length > 9) return;
    if (CP_FILLER_TOPIC_REGEX.test(clean)) return;
    const key = clean.toLowerCase();
    if (!seenLower.has(key)) {
      seenLower.add(key);
      collected.push(clean);
    }
  };

  // 1. Primary: Explicit scope cues ("meliputi ...", "mencakup ...", "lingkup materi: ...", "berkaitan dengan ...")
  const scopeCueRegex =
    /(?:meliputi|mencakup|tentang|mengenai|berupa|yakni|yaitu|terdiri\s+(?:atas|dari)|antara\s+lain|berkaitan\s+dengan|dalam\s+cakupan|ruang\s+lingkup(?:\s+materi)?|lingkup\s+materi|materi\s+(?:ajar|pokok|esensial)|pokok\s+bahasan)\s*[:\-–]?\s*([^.\n]{8,500})/gi;
  let cueMatch: RegExpExecArray | null;
  while ((cueMatch = scopeCueRegex.exec(cleanText)) !== null) {
    const seg = cueMatch[1] || '';
    const items = splitEnumerationSegment(seg);
    items.forEach(addTopic);
  }

  // 2. Secondary: Verb + enumerated object ONLY if explicit scope cues yielded fewer than 4 topics
  if (collected.length < 4) {
    const verbCueRegex =
      /(?:memahami|menganalisis|mengidentifikasi|menerapkan|menguasai|mengoperasikan|mengevaluasi|merancang|menjelaskan|mendeskripsikan|mengembangkan|mengolah|menyusun|menyajikan|memecahkan)\s+(?:konsep|prinsip|materi|topik|struktur|sistem|fenomena|teks|metode|prosedur|proses)?\s*([^.\n]{8,380})/gi;
    let verbMatch: RegExpExecArray | null;
    while ((verbMatch = verbCueRegex.exec(cleanText)) !== null) {
      const seg = verbMatch[1] || '';
      if (seg.includes(',') || seg.includes(';') || /\sdan\s|\sserta\s/i.test(seg)) {
        const items = splitEnumerationSegment(seg);
        items.forEach(addTopic);
      } else if (seg.length >= 6 && seg.length <= 75) {
        addTopic(seg);
      }
    }
  }

  return collected;
}

function extractCompetenciesFromCPText(text: string): string[] {
  const matches = (text || '').match(
    /\b(?:mengamati|mengidentifikasi|menjelaskan|memahami|menganalisis|menerapkan|menyelidiki|merancang|mengevaluasi|mengembangkan|menciptakan|mengomunikasikan|menyajikan|mengolah|memecahkan)\s+[^.,;\n]{5,65}/gi
  );
  if (!matches || matches.length === 0) {
    return ['Menganalisis konsep esensial', 'Mengevaluasi fenomena kontekstual', 'Mengomunikasikan solusi'];
  }
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    const clean = m.replace(/\s+/g, ' ').trim();
    const norm = clean.charAt(0).toUpperCase() + clean.slice(1);
    const key = norm.toLowerCase();
    if (!seen.has(key) && norm.length >= 10) {
      seen.add(key);
      unique.push(norm);
    }
    if (unique.length >= 4) break;
  }
  return unique.length > 0
    ? unique
    : ['Menganalisis konsep esensial', 'Mengevaluasi fenomena kontekstual'];
}

export function extractElementsFromRawCPText(
  rawText: string,
  subject: string,
  subLevelLabel: string
): Array<{
  name: string;
  description: string;
  competencies?: string[];
  essentialMaterials?: string[];
}> {
  const cleanText = (rawText || '')
    .replace(/---\s*\[Halaman\s+\d+\]\s*---/gi, '')
    .replace(/^\s*LAMPIRAN\s+(?:I{1,3}V?|IV|V|\d+)\b.*$/gim, '')
    .trim();
  if (!cleanText) return [];

  const sections: Array<{ name: string; body: string }> = [];
  const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let currentName = '';
  let currentBody: string[] = [];

  const flushSection = () => {
    if (currentName && currentBody.length > 0) {
      sections.push({ name: currentName, body: currentBody.join(' ').trim() });
    }
    currentName = '';
    currentBody = [];
  };

  for (const line of lines) {
    // Markdown / table row: | Nama Elemen | Deskripsi CP ... |
    const tableMatch = line.match(/^\|\s*([^|]{3,70}?)\s*\|\s*([^|]{20,})\s*\|?$/);
    if (tableMatch && !/^[-:\s|]+$/.test(line) && !/^(?:elemen|no|aspek|komponen)/i.test(tableMatch[1])) {
      flushSection();
      sections.push({
        name: tableMatch[1].replace(/^\d+\.\s*/, '').trim(),
        body: tableMatch[2].trim(),
      });
      continue;
    }

    const explicitElemen = line.match(/^(?:elemen\s*[:\-–]?\s*|bagian\s+\w+\s*[:\-–]\s*)(.{3,80})$/i);
    if (explicitElemen && explicitElemen[1]) {
      flushSection();
      currentName = explicitElemen[1].replace(/[:\-–]+$/, '').trim();
      continue;
    }

    // Inline "Elemen Pemahaman Sains: Peserta didik mampu..."
    const inlineElemen = line.match(/^(?:elemen\s+)?([A-Z][A-Za-z\s&/-]{3,45})\s*:\s*(.{25,})$/);
    if (inlineElemen && !/^(semester|kelas|fase|jenjang|mata\s+pelajaran|alokasi|tahun|catatan)/i.test(inlineElemen[1])) {
      flushSection();
      sections.push({ name: inlineElemen[1].trim(), body: inlineElemen[2].trim() });
      continue;
    }

    // Known element header line
    if (line.length <= 75) {
      const known = KNOWN_ELEMENT_NAMES.find((k) => k.pattern.test(line));
      if (known && line.split(/\s+/).length <= 8) {
        flushSection();
        currentName = line.replace(/^\d+[.)]\s*/, '').replace(/[:\-–]+$/, '').trim();
        continue;
      }
    }

    if (currentName) {
      currentBody.push(line);
    }
  }
  flushSection();

  if (sections.length === 0) {
    // Detect by known element keywords in full prose
    const foundNames: string[] = [];
    for (const k of KNOWN_ELEMENT_NAMES) {
      if (k.pattern.test(cleanText) && !foundNames.includes(k.label)) {
        foundNames.push(k.label);
      }
      if (foundNames.length >= 4) break;
    }

    const allTopics = extractTopicsFromCPProse(cleanText);
    const allComps = extractCompetenciesFromCPText(cleanText);

    if (foundNames.length > 0) {
      return foundNames.map((elName, idx) => ({
        name: elName,
        description:
          cleanText.length > 350
            ? cleanText.substring(0, 320).trim() + '...'
            : cleanText,
        competencies: allComps,
        essentialMaterials:
          allTopics.length > 0
            ? allTopics.filter((_, tIdx) => tIdx % foundNames.length === idx).slice(0, 5)
            : [`Materi Pokok ${elName} (${subject})`],
      }));
    }

    return [
      {
        name: `Pemahaman & Lingkup Materi ${subject}`,
        description:
          cleanText.length > 350
            ? cleanText.substring(0, 320).trim() + '...'
            : cleanText,
        competencies: allComps,
        essentialMaterials:
          allTopics.length > 0
            ? allTopics.slice(0, 6)
            : [`Materi Esensial ${subject} (${subLevelLabel})`],
      },
    ];
  }

  return sections.slice(0, 8).map((sec) => {
    const secTopics = extractTopicsFromCPProse(sec.body);
    return {
      name: sec.name,
      description: sec.body.length > 420 ? sec.body.substring(0, 417).trim() + '...' : sec.body,
      competencies: extractCompetenciesFromCPText(sec.body),
      essentialMaterials:
        secTopics.length > 0
          ? secTopics.slice(0, 6)
          : [cleanCandidateTopicPhrase(sec.body.split(/[.,;]/)[0] || sec.name)],
    };
  });
}

/**
 * Extracts Bab / Lingkup Materi / Materi Ajar for Semester 1 and Semester 2
 * directly from structured OR narrative Indonesian CP text.
 */
export function extractMaterialsFromRawCPText(
  rawText: string,
  subject: string,
  grade: number,
  totalHours: number = 108,
  jpPerWeek: number = 3
): {
  materialsSem1: CPMaterialItem[];
  materialsSem2: CPMaterialItem[];
} {
  const cleanText = (rawText || '')
    .replace(/---\s*\[Halaman\s+\d+\]\s*---/gi, '')
    .replace(/^\s*LAMPIRAN\s+(?:I{1,3}V?|IV|V|\d+)\b.*$/gim, '')
    .trim();
  if (!cleanText) {
    return { materialsSem1: [], materialsSem2: [] };
  }

  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const sem1Topics: string[] = [];
  const sem2Topics: string[] = [];
  const neutralTopics: string[] = [];
  const seenNorm = new Set<string>();

  const pushUnique = (target: string[], rawTopic: string) => {
    const cleaned = cleanCandidateTopicPhrase(rawTopic);
    if (!cleaned || cleaned.length < 4 || cleaned.length > 105) return;
    if (cleaned.split(/\s+/).length > 10) return;
    if (CP_FILLER_TOPIC_REGEX.test(cleaned)) return;
    const key = cleaned.toLowerCase();
    for (const existing of seenNorm) {
      if (existing === key || existing.includes(key) || (key.length > 8 && key.includes(existing))) {
        return;
      }
    }
    seenNorm.add(key);
    target.push(cleaned);
  };

  let currentSem: 0 | 1 | 2 = 0;

  // PASS 1: Explicit Bab/Unit/Lingkup Materi/List/Table lines & Semester headings
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/semester\s*(1|i|ganjil)/i.test(lower) && line.length < 60) {
      currentSem = 1;
      continue;
    }
    if (/semester\s*(2|ii|genap)/i.test(lower) && line.length < 60) {
      currentSem = 2;
      continue;
    }

    // Markdown table row containing Bab/Lingkup Materi
    const tblMatch = line.match(/^\|\s*(?:\d+\s*\|\s*)?(?:TP\.[^|]+\|\s*)?([^|]{5,100})\s*\|/i);
    if (tblMatch && !/^[-:\s|]+$/.test(line) && !/^(no|bab|materi|elemen|tp|kode|semester)/i.test(tblMatch[1].trim())) {
      const target = currentSem === 1 ? sem1Topics : currentSem === 2 ? sem2Topics : neutralTopics;
      pushUnique(target, tblMatch[1]);
      continue;
    }

    const babMatch = line.match(
      /^(?:bab\s*\d+|unit\s*\d+|modul\s*\d+|topik\s*\d+|lingkup\s+materi\s*\d*|pokok\s+bahasan\s*\d*|materi\s*(?:ajar|pokok|esensial)?\s*\d*|\d+[.)]|[-•*])\s*[:\-–.]?\s*(.+)$/i
    );
    if (babMatch && babMatch[1]) {
      const candidate = babMatch[1].replace(/\s+/g, ' ').trim();
      if (
        candidate.length >= 4 &&
        candidate.length <= 140 &&
        !/^(semester|fase|kelas|alokasi|jenjang|mata\s+pelajaran)/i.test(candidate)
      ) {
        if (currentSem === 1) pushUnique(sem1Topics, candidate);
        else if (currentSem === 2) pushUnique(sem2Topics, candidate);
        else pushUnique(neutralTopics, candidate);
      }
    }
  }

  // PASS 2: Narrative Indonesian CP clause extraction only if explicit Semester 1 & 2 Bab list is incomplete
  if (sem1Topics.length === 0 || sem2Topics.length === 0) {
    const proseTopics = extractTopicsFromCPProse(cleanText);
    for (const pt of proseTopics) {
      pushUnique(neutralTopics, pt);
    }
  }

  if (sem1Topics.length === 0 && sem2Topics.length === 0 && neutralTopics.length >= 2) {
    const mid = Math.ceil(neutralTopics.length / 2);
    sem1Topics.push(...neutralTopics.slice(0, mid));
    sem2Topics.push(...neutralTopics.slice(mid));
  } else if (neutralTopics.length > 0 && (sem1Topics.length === 0 || sem2Topics.length === 0)) {
    for (const nt of neutralTopics) {
      if (sem1Topics.length <= sem2Topics.length && sem1Topics.length < 4) {
        sem1Topics.push(nt);
      } else if (sem2Topics.length < 4) {
        sem2Topics.push(nt);
      }
    }
  }

  const finalSem1 = sem1Topics.slice(0, 5);
  const finalSem2 = sem2Topics.slice(0, 5);

  const totalItems = finalSem1.length + finalSem2.length;
  if (totalItems === 0) {
    return { materialsSem1: [], materialsSem2: [] };
  }

  const detectedElements = extractElementsFromRawCPText(cleanText, subject, `Kelas ${grade}`);
  const baseHours = Math.floor(totalHours / totalItems);
  const remainderHours = totalHours - baseHours * totalItems;

  const buildItem = (topic: string, sem: 1 | 2, idx: number, globalOrder: number): CPMaterialItem => {
    const cleanTitle = topic.replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '').trim();
    const label = /^Bab\s*\d+/i.test(topic) ? topic : `Bab ${globalOrder}: ${cleanTitle}`;
    const itemHours = baseHours + (globalOrder - 1 < remainderHours ? 1 : 0);
    const matchedElement =
      detectedElements.find((el) =>
        el.essentialMaterials?.some((em) => em.toLowerCase().includes(cleanTitle.toLowerCase().slice(0, 12)))
      )?.name ||
      detectedElements[(globalOrder - 1) % Math.max(1, detectedElements.length)]?.name ||
      (sem === 1 ? 'Pemahaman Konsep' : 'Keterampilan Proses');

    return {
      id: `cp-parsed-sem${sem}-${idx + 1}`,
      semester: sem,
      orderNumber: globalOrder,
      tpCode: `TP.${grade}.${sem}.${idx + 1}`,
      tpName:
        sem === 1
          ? `Memahami, menganalisis, dan menerapkan konsep ${cleanTitle} pada mata pelajaran ${subject} secara mindful, meaningful, dan joyful.`
          : `Mengevaluasi, mengaitkan, dan merancang proyek terapan terkait ${cleanTitle} pada mata pelajaran ${subject} berbasis Deep Learning & 6C.`,
      essentialMaterial: label,
      elementName: matchedElement,
      allocatedHours: itemHours,
      meetingCount: Math.max(1, Math.round(itemHours / (jpPerWeek || 1))),
      tpCount: 2,
      assessmentStrategy: sem === 1 ? 'Tes Formatif & Kinerja 6C' : 'Penilaian Proyek Sumatif & Portofolio',
      deepLearningMethod:
        sem === 1
          ? `Mindful: Kesadaran konsep ${cleanTitle}, Meaningful: Konteks nyata sehari-hari, Joyful: Eksplorasi kolaboratif.`
          : `Mindful: Refleksi pemecahan masalah ${cleanTitle}, Meaningful: Proyek berbasis isu nyata, Joyful: Presentasi karya kreatif.`,
    };
  };

  return {
    materialsSem1: finalSem1.map((t, i) => buildItem(t, 1, i, i + 1)),
    materialsSem2: finalSem2.map((t, i) => buildItem(t, 2, i, finalSem1.length + i + 1)),
  };
}

/**
 * Full client-side / server-fallback CP document analyzer (detects school levels SD/SMP/SMA/SMK, Phase A-F, Grade 1-13,
 * multiple subjects if present, exact CP Elements, and Semester 1 & 2 Bab/Lingkup materi ajar grounded in raw CP text)
 */
export function analyzeCPTextHeuristic(params: {
  fileName?: string;
  rawText?: string;
  subjectHint?: string;
  levelHint?: SchoolLevel;
  gradeHint?: number | string;
  phaseHint?: string;
  totalHoursHint?: number;
  jpPerWeekHint?: number;
  strictDocumentOnly?: boolean;
  getFallbackPreset?: (subject: string, level: SchoolLevel, grade: number, phase?: string) => {
    cpSummary?: string;
    elements?: any[];
    materialsSem1: Omit<CPMaterialItem, 'id'>[];
    materialsSem2: Omit<CPMaterialItem, 'id'>[];
    totalHoursPerYear?: number;
    jpPerWeek?: number;
  };
}): {
  identifiedMetadata: {
    title: string;
    subject: string;
    level: SchoolLevel;
    subLevelLabel: string;
    phase: string;
    grade: number;
    totalHoursPerYear: number;
    jpPerWeek: number;
  };
  extractedCpText: string;
  elements: ActiveMasterCPData['elements'];
  materialsSem1: CPMaterialItem[];
  materialsSem2: CPMaterialItem[];
  analyzedSubjects: CPSubjectEntry[];
  executiveSummary: string;
  kktpSummary: string;
} {
  const combinedSource = `${params.fileName || ''}\n${params.rawText || ''}`;
  const meta = detectLevelPhaseGradeFromText(
    combinedSource,
    params.levelHint,
    params.gradeHint,
    params.phaseHint
  );

  // Detect all subjects mentioned in raw text / filename (respecting SMA vs SMK separation)
  const detectedSubjects = extractSubjectsFromCPText(combinedSource, meta.level);
  if (detectedSubjects.length === 0) {
    for (const entry of KNOWN_SUBJECT_PATTERNS) {
      if (entry.pattern.test(combinedSource)) {
        if (!detectedSubjects.includes(entry.canonical)) {
          detectedSubjects.push(entry.canonical);
        }
      }
    }
  }

  const primarySubject =
    (params.subjectHint && params.subjectHint.trim() && params.subjectHint !== 'Mata Pelajaran Teridentifikasi'
      ? detectedSubjects.find((s) => s.toLowerCase() === params.subjectHint!.trim().toLowerCase()) ||
        (detectedSubjects.length === 1 ? detectedSubjects[0] : params.subjectHint.trim())
      : detectedSubjects[0]) || (meta.level === 'SMK' ? 'Dasar-Dasar Program Keahlian (SMK)' : 'Pendidikan Pancasila');

  const totalHours = Number(params.totalHoursHint) || (meta.level === 'SD' ? 144 : 108);
  const jpPerWeek = Number(params.jpPerWeekHint) || (meta.level === 'SD' ? 4 : 3);

  const buildEntryForSubject = (
    subName: string,
    targetMeta: { level: SchoolLevel; subLevelLabel: string; grade: number; phase: string } = meta,
    sourceTextOverride?: string,
    siblingSubjects?: string[]
  ): CPSubjectEntry => {
    const allSubs = siblingSubjects || detectedSubjects;
    const rawSource = sourceTextOverride !== undefined ? sourceTextOverride : params.rawText || '';
    const subjectRawText = sliceCPTextForSubject(rawSource, subName, allSubs);
    const effHours = Number(params.totalHoursHint) || (targetMeta.level === 'SD' ? 144 : 108);
    const effJp = Number(params.jpPerWeekHint) || (targetMeta.level === 'SD' ? 4 : 3);

    const parsedFromText = extractMaterialsFromRawCPText(
      subjectRawText,
      subName,
      targetMeta.grade,
      effHours,
      effJp
    );

    const parsedElements = extractElementsFromRawCPText(
      subjectRawText,
      subName,
      targetMeta.subLevelLabel
    );

    let sem1 = parsedFromText.materialsSem1;
    let sem2 = parsedFromText.materialsSem2;
    let cpSummary = subjectRawText.trim();
    let elements: ActiveMasterCPData['elements'] = parsedElements;

    // Anti-hallucination guard: only supplement with external preset when NOT in strictDocumentOnly mode (i.e. rawText is missing/stub)
    const allowPresetFallback = !params.strictDocumentOnly && (params.rawText || '').trim().length < 120;
    if (allowPresetFallback && (sem1.length === 0 || sem2.length === 0) && params.getFallbackPreset) {
      const preset = params.getFallbackPreset(subName, targetMeta.level, targetMeta.grade, targetMeta.phase);
      if (sem1.length === 0) {
        sem1 = (preset.materialsSem1 || []).map((m, idx) => ({
          ...m,
          id: `sem1-${subName.toLowerCase().replace(/\s+/g, '-')}-${idx + 1}`,
        }));
      }
      if (sem2.length === 0) {
        sem2 = (preset.materialsSem2 || []).map((m, idx) => ({
          ...m,
          id: `sem2-${subName.toLowerCase().replace(/\s+/g, '-')}-${idx + 1}`,
        }));
      }
      if (!cpSummary && preset.cpSummary) cpSummary = preset.cpSummary;
      if ((!elements || elements.length === 0) && preset.elements && preset.elements.length > 0) {
        elements = preset.elements;
      }
    }

    if (!elements || elements.length === 0) {
      elements = [
        {
          name: 'Pemahaman Konsep',
          description: `Menguasai konsep esensial dan prinsip inti ${subName} (${targetMeta.subLevelLabel}).`,
          competencies: ['Menganalisis konsep esensial', 'Mengevaluasi fenomena kontekstual'],
          essentialMaterials: [
            ...sem1.map((m) => m.essentialMaterial),
            ...sem2.map((m) => m.essentialMaterial),
          ].slice(0, 6),
        },
      ];
    }

    if (!params.strictDocumentOnly) {
      if (sem1.length === 0) {
        sem1 = [
          {
            id: `sem1-${subName}-1`,
            semester: 1,
            orderNumber: 1,
            tpCode: `TP.${targetMeta.grade}.1.1`,
            tpName: `Memahami dan menganalisis konsep dasar serta prinsip inti ${subName} sesuai Capaian Pembelajaran ${targetMeta.phase}.`,
            essentialMaterial: `Bab 1: Dasar & Konsep Esensial ${subName}`,
            elementName: elements[0]?.name || 'Pemahaman Konsep',
            allocatedHours: Math.round(effHours / 4),
            meetingCount: Math.max(1, Math.round(effHours / 4 / effJp)),
            tpCount: 2,
            assessmentStrategy: 'Tes Formatif & Kinerja 6C',
            deepLearningMethod: 'Mindful & Meaningful Learning',
          },
          {
            id: `sem1-${subName}-2`,
            semester: 1,
            orderNumber: 2,
            tpCode: `TP.${targetMeta.grade}.1.2`,
            tpName: `Menerapkan pemahaman ${subName} untuk memecahkan persoalan kontekstual kehidupan sehari-hari.`,
            essentialMaterial: `Bab 2: Penerapan Kontekstual ${subName}`,
            elementName: elements[0]?.name || 'Keterampilan Proses',
            allocatedHours: Math.round(effHours / 4),
            meetingCount: Math.max(1, Math.round(effHours / 4 / effJp)),
            tpCount: 2,
            assessmentStrategy: 'Penilaian Unjuk Kerja & STS',
            deepLearningMethod: 'Meaningful & Joyful Learning',
          },
        ];
      }

      if (sem2.length === 0) {
        sem2 = [
          {
            id: `sem2-${subName}-1`,
            semester: 2,
            orderNumber: sem1.length + 1,
            tpCode: `TP.${targetMeta.grade}.2.1`,
            tpName: `Mengevaluasi kajian lanjutan dan studi kasus pada ruang lingkup ${subName} (${targetMeta.phase}).`,
            essentialMaterial: `Bab ${sem1.length + 1}: Analisis Lanjut & Studi Kasus ${subName}`,
            elementName: elements[1]?.name || elements[0]?.name || 'Pemahaman Konsep',
            allocatedHours: Math.round(effHours / 4),
            meetingCount: Math.max(1, Math.round(effHours / 4 / effJp)),
            tpCount: 2,
            assessmentStrategy: 'Tes Formatif & Diskusi Analitis',
            deepLearningMethod: 'Mindful & Meaningful Learning',
          },
          {
            id: `sem2-${subName}-2`,
            semester: 2,
            orderNumber: sem1.length + 2,
            tpCode: `TP.${targetMeta.grade}.2.2`,
            tpName: `Merancang dan menyajikan proyek inovasi terapan ${subName} berbasis Deep Learning & 6C.`,
            essentialMaterial: `Bab ${sem1.length + 2}: Inovasi & Proyek Terapan ${subName}`,
            elementName: elements[1]?.name || elements[0]?.name || 'Keterampilan Proses',
            allocatedHours: Math.round(effHours / 4),
            meetingCount: Math.max(1, Math.round(effHours / 4 / effJp)),
            tpCount: 2,
            assessmentStrategy: 'Asesmen Sumatif Proyek & Portofolio',
            deepLearningMethod: 'Meaningful & Joyful Learning',
          },
        ];
      }
    }

    const pageMatches = Array.from(subjectRawText.matchAll(/\[\s*Halaman\s+(\d+)\s*\]/gi)).map((m) => Number(m[1]));
    const lampiranMatch = subjectRawText.match(/\b(Lampiran\s+(?:I{1,3}V?|IV|V|\d+))\b/i);
    const pageLabel =
      pageMatches.length >= 2
        ? `Hal. ${Math.min(...pageMatches)}–${Math.max(...pageMatches)}`
        : pageMatches.length === 1
          ? `Hal. ${pageMatches[0]}`
          : '';
    const computedLocationRef = [lampiranMatch ? lampiranMatch[1] : '', pageLabel].filter(Boolean).join(' · ') || undefined;

    const grpForTag = getSchoolLevelGroup(targetMeta.level);
    const subLowerForTag = subName.toLowerCase();
    let computedCategoryTag: CPSubjectEntry['categoryTag'] = 'Umum/Wajib';
    if (
      grpForTag === 'SMK' &&
      /\b(?:dasar[\s-]+dasar|konsentrasi\s+keahlian|projek\s+kreatif|pkk|praktik\s+kerja|pkl|kejuruan)\b/i.test(subLowerForTag)
    ) {
      computedCategoryTag = 'Kejuruan/Konsentrasi';
    } else if (
      (grpForTag === 'SMA' && targetMeta.phase === 'Fase F' && !/pendidikan\s+agama|pancasila|bahasa\s+indonesia|matematika(?!\s+tingkat\s+lanjut)|bahasa\s+inggris(?!\s+tingkat\s+lanjut)|pjok|sejarah|seni/i.test(subLowerForTag)) ||
      /\btingkat\s+lanjut\b|\bpilihan\b/i.test(subLowerForTag)
    ) {
      computedCategoryTag = 'Pilihan/Tingkat Lanjut';
    }

    const entryNotes: string[] = [];
    if (grpForTag === 'SD' && /ipas/i.test(subLowerForTag)) {
      entryNotes.push('Integrasi IPA & IPS (dimulai Fase B/C).');
    } else if (grpForTag === 'SD' && /bahasa\s+inggris/i.test(subLowerForTag)) {
      entryNotes.push('Dimulai pada Fase B (Kelas III–IV) ke Fase C.');
    } else if (grpForTag === 'SMK' && /\bprogram\s*4\s*tahun\b|\bkelas\s*(?:13|xiii)\b/i.test(subjectRawText)) {
      entryNotes.push('Mencakup SMK Program 3 Tahun / 4 Tahun (Kelas XIII).');
    }

    return {
      subject: subName,
      level: targetMeta.level,
      subLevelLabel: targetMeta.subLevelLabel,
      grade: targetMeta.grade,
      phase: targetMeta.phase,
      categoryTag: computedCategoryTag,
      locationRef: computedLocationRef,
      specialNotes: entryNotes.length > 0 ? entryNotes.join(' ') : undefined,
      jpPerWeek: effJp,
      totalHoursPerYear: effHours,
      cpText: cpSummary || `Capaian Pembelajaran ${subName} ${targetMeta.level} (${targetMeta.phase} - Kelas ${targetMeta.grade}).`,
      elements,
      materialsSem1: sem1,
      materialsSem2: sem2,
    };
  };

  const buildEntriesAcrossPhases = (
    subName: string,
    defaultMeta: { level: SchoolLevel; subLevelLabel: string; grade: number; phase: string },
    sourceText: string,
    siblingSubjects?: string[]
  ): CPSubjectEntry[] => {
    const allSubs = siblingSubjects || detectedSubjects;
    const subjectSlice = sliceCPTextForSubject(sourceText, subName, allSubs);
    if (!subjectSlice || subjectSlice.trim().length < 40) {
      return [buildEntryForSubject(subName, defaultMeta, sourceText, allSubs)];
    }

    const lines = subjectSlice.split(/\r?\n/);
    const phaseBuffers = new Map<string, { grade: number; phase: string; lines: string[] }>();
    let activeKey = '';
    const grp = getSchoolLevelGroup(defaultMeta.level);

    const resolvePhaseLineTarget = (line: string): { grade: number; phase: string } | null => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length > 420) return null;
      const gradeMatch = trimmed.match(/^(?:[A-Z0-9]+[\.\)]\s*|#{1,4}\s*)?kelas\s*(1[0-3]|[1-9]|xiii|xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/i);
      const faseMatch = trimmed.match(/^(?:[A-Z0-9]+[\.\)]\s*|#{1,4}\s*)?(?:pada\s+akhir\s+)?fase\s*([A-F])\b/i);
      if (!gradeMatch && !faseMatch) return null;

      let g = gradeMatch ? parseIndonesianGradeToken(gradeMatch[1]) : 0;
      const f = faseMatch ? `Fase ${faseMatch[1].toUpperCase()}` : '';
      if (!g && f) {
        if (f === 'Fase A') g = 1;
        else if (f === 'Fase B') g = 4;
        else if (f === 'Fase C') g = 5;
        else if (f === 'Fase D') g = 7;
        else if (f === 'Fase E') g = 10;
        else if (f === 'Fase F') g = 11;
      }
      if (!g) return null;
      if (grp === 'SD' && (g < 1 || g > 6)) return null;
      if (grp === 'SMP' && (g < 7 || g > 9)) return null;
      if (grp === 'SMA' && (g < 10 || g > 12)) return null;
      if (grp === 'SMK' && (g < 10 || g > 13)) return null;

      return { grade: g, phase: f || resolvePhaseByLevelAndGrade(defaultMeta.level, g) };
    };

    lines.forEach((line) => {
      const target = resolvePhaseLineTarget(line);
      if (target) {
        activeKey = `${target.phase}__${target.grade}`;
        if (!phaseBuffers.has(activeKey)) {
          phaseBuffers.set(activeKey, { grade: target.grade, phase: target.phase, lines: [] });
        }
        phaseBuffers.get(activeKey)!.lines.push(line);
      } else if (activeKey && phaseBuffers.has(activeKey)) {
        phaseBuffers.get(activeKey)!.lines.push(line);
      }
    });

    if (phaseBuffers.size >= 2) {
      const out: CPSubjectEntry[] = [];
      phaseBuffers.forEach((blk) => {
        const slicedBlockText = blk.lines.join('\n').trim();
        if (slicedBlockText.length >= 25) {
          const blkMeta = {
            level: defaultMeta.level,
            subLevelLabel: getSchoolLevelDisplay(defaultMeta.level, blk.grade).subLabel,
            grade: blk.grade,
            phase: blk.phase,
          };
          out.push(buildEntryForSubject(subName, blkMeta, slicedBlockText, [subName]));
        }
      });
      if (out.length > 0) return out;
    }

    return [buildEntryForSubject(subName, defaultMeta, sourceText, allSubs)];
  };

  const levelSections = splitCPTextBySchoolLevel(params.rawText || '');
  let analyzedSubjects: CPSubjectEntry[] = [];

  if (levelSections.size >= 2) {
    levelSections.forEach((secText, grp) => {
      const secLevel = grp as SchoolLevel;
      const detectedSecMeta = detectLevelPhaseGradeFromText(secText, secLevel);
      const secGrade =
        secLevel === 'SD' && (detectedSecMeta.grade < 1 || detectedSecMeta.grade > 6)
          ? 4
          : secLevel === 'SMP' && (detectedSecMeta.grade < 7 || detectedSecMeta.grade > 9)
            ? 7
            : secLevel === 'SMA' && (detectedSecMeta.grade < 10 || detectedSecMeta.grade > 12)
              ? 10
              : secLevel === 'SMK' && (detectedSecMeta.grade < 10 || detectedSecMeta.grade > 13)
                ? 10
                : detectedSecMeta.grade;
      const secMeta = {
        level: secLevel,
        subLevelLabel: getSchoolLevelDisplay(secLevel, secGrade).subLabel,
        grade: secGrade,
        phase: resolvePhaseByLevelAndGrade(secLevel, secGrade),
      };
      const secSubjects = extractSubjectsFromCPText(secText, secLevel);
      secSubjects.forEach((sub) => {
        analyzedSubjects.push(...buildEntriesAcrossPhases(sub, secMeta, secText, secSubjects));
      });
    });
  } else if (levelSections.size === 1) {
    const [[onlyGrp, onlyText]] = Array.from(levelSections.entries());
    const secLevel = (onlyGrp || meta.level) as SchoolLevel;
    const detectedSecMeta = detectLevelPhaseGradeFromText(onlyText, secLevel, meta.grade, meta.phase);
    const secMeta = {
      ...detectedSecMeta,
      level: secLevel,
      subLevelLabel: getSchoolLevelDisplay(secLevel, detectedSecMeta.grade).subLabel,
    };
    const secSubjects = extractSubjectsFromCPText(`${params.fileName || ''}\n${onlyText}`, secLevel);
    const targetList = secSubjects.length > 0 ? secSubjects : detectedSubjects.length > 0 ? detectedSubjects : [primarySubject];
    targetList.forEach((sub) => {
      analyzedSubjects.push(...buildEntriesAcrossPhases(sub, secMeta, onlyText, targetList));
    });
  } else {
    const subjectListToAnalyze = detectedSubjects.length > 0 ? detectedSubjects : [primarySubject];
    subjectListToAnalyze.forEach((sub) => {
      analyzedSubjects.push(...buildEntriesAcrossPhases(sub, meta, params.rawText || '', subjectListToAnalyze));
    });
  }

  if (analyzedSubjects.length === 0) {
    analyzedSubjects = [buildEntryForSubject(primarySubject)];
  }

  const primaryEntry =
    analyzedSubjects.find((a) => a.subject.toLowerCase() === primarySubject.toLowerCase()) ||
    analyzedSubjects[0];

  return {
    identifiedMetadata: {
      title: params.fileName || `Capaian Pembelajaran ${primaryEntry.subject}`,
      subject: primaryEntry.subject,
      level: meta.level,
      subLevelLabel: meta.subLevelLabel,
      phase: meta.phase,
      grade: meta.grade,
      totalHoursPerYear: primaryEntry.totalHoursPerYear || totalHours,
      jpPerWeek: primaryEntry.jpPerWeek || jpPerWeek,
    },
    extractedCpText: primaryEntry.cpText || '',
    elements: primaryEntry.elements || [],
    materialsSem1: primaryEntry.materialsSem1,
    materialsSem2: primaryEntry.materialsSem2,
    analyzedSubjects,
    executiveSummary: params.rawText?.trim()
      ? `Analisis CP Master untuk ${primaryEntry.subject} pada ${meta.subLevelLabel} (${meta.phase} • Kelas ${meta.grade}). Teridentifikasi ${primaryEntry.elements?.length || 1} Elemen CP dan ${primaryEntry.materialsSem1.length + primaryEntry.materialsSem2.length} Bab/lingkup materi ajar spesifik Semester 1 & 2 sesuai dokumen CP.`
      : `Capaian Pembelajaran resmi mata pelajaran ${primaryEntry.subject} ${meta.subLevelLabel} (${meta.phase} - Kelas ${meta.grade}).`,
    kktpSummary:
      'Interval Ketuntasan: 0-40% (Perlu Bimbingan Khusus), 41-65% (Cukup/Remedial), 66-85% (Baik/Tuntas), 86-100% (Sangat Baik/Pengayaan).',
  };
}

export interface LevelRecapSummary {
  group: SchoolLevelGroup;
  label: string;
  uniqueSubjectCount: number;
  phaseEntryCount: number;
  phasesCovered: string[];
  specialNotes: string[];
  entries: Array<{
    subject: string;
    phase: string;
    grade: number | string;
    elementsCount: number;
    topicsCount: number;
    sampleTopics: string[];
  }>;
}

/**
 * Tahap 1: Rekapitulasi Jumlah Mata Pelajaran & Ruang Lingkup per Jenjang (SD, SMP, SMA, SMK)
 * Dihitung murni dari entri yang teridentifikasi di dalam dokumen CP.
 */
export function buildLevelRecapFromSubjects(
  analyzedSubjects: CPSubjectEntry[] = [],
  rawText: string = ''
): LevelRecapSummary[] {
  const lowerText = rawText.toLowerCase();
  const labels: Record<SchoolLevelGroup, string> = {
    SD: 'SD / MI / Paket A',
    SMP: 'SMP / MTs / Paket B',
    SMA: 'SMA / MA / Paket C',
    SMK: 'SMK / MAK',
  };

  return (['SD', 'SMP', 'SMA', 'SMK'] as SchoolLevelGroup[]).map((grp) => {
    const groupEntries = analyzedSubjects.filter((s) => isSameSchoolLevelGroup(s.level, grp));
    const uniqueSubjectSet = new Set(groupEntries.map((s) => s.subject.trim().toLowerCase()));
    const phasesCovered = Array.from(
      new Set(
        groupEntries.map((s) => {
          const ph = s.phase || resolvePhaseByLevelAndGrade(s.level, s.grade);
          return `${ph} (Kls ${s.grade})`;
        })
      )
    );

    const specialNotes: string[] = [];
    if (grp === 'SD') {
      if (groupEntries.some((e) => /ipas/i.test(e.subject)) || /\bipas\b/.test(lowerText)) {
        specialNotes.push('IPAS terintegrasi umumnya dimulai pada Fase B/C (Kelas III–VI).');
      }
      if (/\bbahasa\s+inggris\b/.test(lowerText) && /\bfase\s*b\b/.test(lowerText)) {
        specialNotes.push('Bahasa Inggris teridentifikasi mulai Fase B (Kelas III–IV) dan berlanjut ke Fase C.');
      }
    } else if (grp === 'SMP') {
      if (groupEntries.length > 0) {
        specialNotes.push('Seluruh mata pelajaran SMP/MTs berada pada Fase D (Kelas VII–IX).');
      }
    } else if (grp === 'SMA') {
      if (/\btingkat\s+lanjut\b|\bpilihan\b|\bfase\s*f\b/i.test(lowerText) && groupEntries.length > 0) {
        specialNotes.push('Mencakup Fase E (Kelas X) dan Fase F (Kelas XI–XII, termasuk mapel pilihan/tingkat lanjut jika tercantum).');
      }
    } else if (grp === 'SMK') {
      if (/\bprogram\s*4\s*tahun\b|\bkelas\s*(?:13|xiii)\b/i.test(lowerText)) {
        specialNotes.push('Terdeteksi rujukan SMK Program 4 Tahun (hingga Kelas XIII Fase F).');
      }
      if (groupEntries.some((e) => /dasar[\s-]+dasar|konsentrasi|pkk|pkl/i.test(e.subject))) {
        specialNotes.push('Mencakup kelompok kejuruan (Dasar-Dasar Program Keahlian / Konsentrasi / PKK / PKL).');
      }
    }

    return {
      group: grp,
      label: labels[grp],
      uniqueSubjectCount: uniqueSubjectSet.size,
      phaseEntryCount: groupEntries.length,
      phasesCovered,
      specialNotes,
      entries: groupEntries.map((s) => ({
        subject: s.subject,
        phase: s.phase || resolvePhaseByLevelAndGrade(s.level, s.grade),
        grade: s.grade,
        elementsCount: s.elements?.length || 0,
        topicsCount: (s.materialsSem1?.length || 0) + (s.materialsSem2?.length || 0),
        sampleTopics: [...(s.materialsSem1 || []), ...(s.materialsSem2 || [])]
          .slice(0, 3)
          .map((m) => m.essentialMaterial),
      })),
    };
  });
}

export interface PhaseDirectorySubjectRow {
  number: number;
  subject: string;
  grade: number | string;
  phase: string;
  categoryTag: string;
  locationRef: string;
  specialNotes?: string;
  elements: Array<{ name: string; focus: string }>;
  scopeByElement: Array<{ elementName: string; details: string }>;
  scopes: string[];
}

export interface PhaseDirectoryGroup {
  phaseTitle: string;
  subjects: PhaseDirectorySubjectRow[];
}

export interface PhaseDirectoryLevel {
  number: 1 | 2 | 3 | 4;
  group: SchoolLevelGroup;
  title: string;
  lampiranRef?: string;
  generalSubjectCount: number;
  electiveOrVocationalCount: number;
  totalUniqueSubjectCount: number;
  specialNotes: string[];
  phases: PhaseDirectoryGroup[];
}

/**
 * Menghasilkan struktur 2 Bagian Baku:
 * - Bagian 1: Ringkasan Jumlah Mata Pelajaran per Jenjang & Fase (Umum/Wajib vs Pilihan/Tingkat Lanjut/Kejuruan + Lampiran)
 * - Bagian 2: Katalog Lengkap Mata Pelajaran & Ruang Lingkup Materi per Elemen beserta rujukan halaman/bagian.
 */
export function buildPhaseDirectoryByLevel(
  analyzedSubjects: CPSubjectEntry[] = [],
  rawText: string = ''
): PhaseDirectoryLevel[] {
  const lower = rawText.toLowerCase();

  const inferCategoryTag = (entry: CPSubjectEntry): 'Umum/Wajib' | 'Pilihan/Tingkat Lanjut' | 'Kejuruan/Konsentrasi' => {
    if (entry.categoryTag) return entry.categoryTag;
    const grp = getSchoolLevelGroup(entry.level);
    const subL = entry.subject.toLowerCase();
    if (grp === 'SMK' && /\b(?:dasar[\s-]+dasar|konsentrasi|projek\s+kreatif|pkk|praktik\s+kerja|pkl|kejuruan)\b/i.test(subL)) {
      return 'Kejuruan/Konsentrasi';
    }
    if (
      (grp === 'SMA' &&
        (entry.phase || '').toUpperCase().includes('F') &&
        !/pendidikan\s+agama|pancasila|bahasa\s+indonesia|matematika(?!\s+tingkat\s+lanjut)|bahasa\s+inggris(?!\s+tingkat\s+lanjut)|pjok|sejarah|seni/i.test(subL)) ||
      /\btingkat\s+lanjut\b|\bpilihan\b/i.test(subL)
    ) {
      return 'Pilihan/Tingkat Lanjut';
    }
    return 'Umum/Wajib';
  };

  const extractRowsFor = (grp: SchoolLevelGroup, phaseCodes: string[]): PhaseDirectorySubjectRow[] => {
    const filtered = analyzedSubjects.filter((entry) => {
      if (!isSameSchoolLevelGroup(entry.level, grp)) return false;
      const ph = (entry.phase || resolvePhaseByLevelAndGrade(entry.level, entry.grade)).toUpperCase();
      return phaseCodes.some((code) => ph.includes(code.toUpperCase()));
    });

    return filtered.map((entry, idx) => {
      const allMats = [...(entry.materialsSem1 || []), ...(entry.materialsSem2 || [])];
      const scopeByElement: Array<{ elementName: string; details: string }> = [];

      if (entry.elements && entry.elements.length > 0) {
        entry.elements.forEach((el) => {
          const matchedMats = allMats
            .filter((m) => (m.elementName || '').toLowerCase() === el.name.toLowerCase())
            .map((m) => m.essentialMaterial.replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '').trim())
            .filter(Boolean);
          const mergedTopics = Array.from(
            new Set([...(el.essentialMaterials || []), ...matchedMats].map((s) => s.trim()).filter(Boolean))
          );
          const detailParts = [
            el.description ? el.description.trim() : '',
            mergedTopics.length > 0 ? `Topik/Objek Kajian: ${mergedTopics.join(', ')}` : '',
            el.competencies && el.competencies.length > 0 ? `Kompetensi: ${el.competencies.join('; ')}` : '',
          ].filter(Boolean);

          scopeByElement.push({
            elementName: el.name,
            details: detailParts.join(' · ') || 'Sesuai deskripsi capaian pada dokumen CP.',
          });
        });
      }

      if (scopeByElement.length === 0 && allMats.length > 0) {
        const grouped = new Map<string, string[]>();
        allMats.forEach((m) => {
          const elKey = m.elementName || 'Lingkup Materi Pokok';
          if (!grouped.has(elKey)) grouped.set(elKey, []);
          grouped.get(elKey)!.push(m.essentialMaterial.replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '').trim());
        });
        grouped.forEach((topics, elKey) => {
          scopeByElement.push({ elementName: elKey, details: topics.filter(Boolean).join(', ') });
        });
      }

      return {
        number: idx + 1,
        subject: entry.subject,
        grade: entry.grade,
        phase: entry.phase || resolvePhaseByLevelAndGrade(entry.level, entry.grade),
        categoryTag: inferCategoryTag(entry),
        locationRef: entry.locationRef || `${entry.subLevelLabel || grp} · ${entry.phase || ''}`.trim(),
        specialNotes: entry.specialNotes,
        elements: (entry.elements || []).map((el) => ({
          name: el.name,
          focus: el.description || '',
        })),
        scopeByElement,
        scopes: allMats
          .map((m) => m.essentialMaterial.replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '').trim())
          .filter(Boolean),
      };
    });
  };

  const countSplit = (grp: SchoolLevelGroup) => {
    const uniqueBySub = new Map<string, 'Umum/Wajib' | 'Pilihan/Tingkat Lanjut' | 'Kejuruan/Konsentrasi'>();
    const locRefs = new Set<string>();
    analyzedSubjects
      .filter((s) => isSameSchoolLevelGroup(s.level, grp))
      .forEach((s) => {
        const key = s.subject.trim().toLowerCase();
        const tag = inferCategoryTag(s);
        if (!uniqueBySub.has(key) || tag !== 'Umum/Wajib') {
          uniqueBySub.set(key, tag);
        }
        if (s.locationRef) locRefs.add(s.locationRef);
      });
    let generalSubjectCount = 0;
    let electiveOrVocationalCount = 0;
    uniqueBySub.forEach((tag) => {
      if (tag === 'Umum/Wajib') generalSubjectCount += 1;
      else electiveOrVocationalCount += 1;
    });
    return {
      generalSubjectCount,
      electiveOrVocationalCount,
      totalUniqueSubjectCount: uniqueBySub.size,
      lampiranRef: locRefs.size > 0 ? Array.from(locRefs).slice(0, 3).join('; ') : undefined,
    };
  };

  const sdNotes: string[] = [];
  if (/\bipas\b/.test(lower) && analyzedSubjects.some((s) => isSameSchoolLevelGroup(s.level, 'SD'))) {
    sdNotes.push('IPAS terpadu mulai Fase B / C (Kelas III–VI).');
  }
  if (/\bbahasa\s+inggris\b/.test(lower) && /\bfase\s*b\b/.test(lower)) {
    sdNotes.push('Bahasa Inggris dimulai pada Fase B (Kelas III–IV) ke Fase C.');
  }

  const smpNotes: string[] = [];
  if (analyzedSubjects.some((s) => isSameSchoolLevelGroup(s.level, 'SMP'))) {
    smpNotes.push('Seluruh mata pelajaran SMP/MTs/Paket B berada pada Fase D (Kelas VII–IX).');
  }

  const smaNotes: string[] = [];
  if (/\bpilihan\b|\btingkat\s+lanjut\b/.test(lower) && analyzedSubjects.some((s) => isSameSchoolLevelGroup(s.level, 'SMA'))) {
    smaNotes.push('Fase F memuat kelompok mata pelajaran umum dan pilihan / tingkat lanjut sesuai teks dokumen.');
  }

  const smkNotes: string[] = [];
  if (/\bprogram\s*4\s*tahun\b|\bkelas\s*(?:13|xiii)\b/.test(lower)) {
    smkNotes.push('Tercantum Program 4 Tahun (hingga Kelas XIII Fase F).');
  }
  if (analyzedSubjects.some((s) => isSameSchoolLevelGroup(s.level, 'SMK') && /dasar[\s-]+dasar|konsentrasi|pkk|pkl/i.test(s.subject))) {
    smkNotes.push('Mencakup kelompok mata pelajaran umum serta kelompok kejuruan / konsentrasi keahlian.');
  }

  const sdSplit = countSplit('SD');
  const smpSplit = countSplit('SMP');
  const smaSplit = countSplit('SMA');
  const smkSplit = countSplit('SMK');

  return [
    {
      number: 1,
      group: 'SD',
      title: 'SD / MI / Paket A',
      ...sdSplit,
      specialNotes: sdNotes,
      phases: [
        { phaseTitle: 'Fase A (Kelas I–II)', subjects: extractRowsFor('SD', ['Fase A']) },
        { phaseTitle: 'Fase B (Kelas III–IV)', subjects: extractRowsFor('SD', ['Fase B']) },
        { phaseTitle: 'Fase C (Kelas V–VI)', subjects: extractRowsFor('SD', ['Fase C']) },
      ],
    },
    {
      number: 2,
      group: 'SMP',
      title: 'SMP / MTs / Paket B',
      ...smpSplit,
      specialNotes: smpNotes,
      phases: [{ phaseTitle: 'Fase D (Kelas VII–IX)', subjects: extractRowsFor('SMP', ['Fase D']) }],
    },
    {
      number: 3,
      group: 'SMA',
      title: 'SMA / MA / Paket C',
      ...smaSplit,
      specialNotes: smaNotes,
      phases: [
        { phaseTitle: 'Fase E (Kelas X)', subjects: extractRowsFor('SMA', ['Fase E']) },
        { phaseTitle: 'Fase F (Kelas XI–XII)', subjects: extractRowsFor('SMA', ['Fase F']) },
      ],
    },
    {
      number: 4,
      group: 'SMK',
      title: 'SMK / MAK',
      ...smkSplit,
      specialNotes: smkNotes,
      phases: [
        { phaseTitle: 'Fase E (Kelas X)', subjects: extractRowsFor('SMK', ['Fase E']) },
        { phaseTitle: 'Fase F (Kelas XI–XII / Program 4 Tahun Kelas XIII)', subjects: extractRowsFor('SMK', ['Fase F']) },
      ],
    },
  ];
}

/**
 * Tahap 2: Pemetaan Kesesuaian & Gap Analysis antara CP Terunggah dengan
 * Profil Guru/Parameter Kurikulum, Distribusi CP, dan Perangkat Ajar tersimpan.
 */
export function evaluatePerangkatAjarGap(params: {
  analyzedSubjects: CPSubjectEntry[];
  schoolProfile?: Partial<SchoolProfile> | null;
  distributionPlans?: CPDistributionPlan[];
  generatedDocuments?: AIDocument[];
}): CPGapAnalysisReport {
  const { analyzedSubjects, schoolProfile, distributionPlans = [], generatedDocuments = [] } = params;
  const findings: CPGapFinding[] = [];

  const findBestMatch = (sub?: string, lvl?: string, grd?: number | string, phs?: string): CPSubjectEntry | undefined => {
    const cleanSub = (sub || '').trim().toLowerCase();
    const numGrd = Number(grd) || 0;
    return (
      analyzedSubjects.find(
        (e) =>
          e.subject.trim().toLowerCase() === cleanSub &&
          (!lvl || isSameSchoolLevelGroup(e.level, lvl)) &&
          (!numGrd || Number(e.grade) === numGrd)
      ) ||
      analyzedSubjects.find(
        (e) =>
          e.subject.trim().toLowerCase() === cleanSub &&
          (!lvl || isSameSchoolLevelGroup(e.level, lvl)) &&
          (!phs || (e.phase || '').toLowerCase() === phs.toLowerCase())
      ) ||
      analyzedSubjects.find((e) => e.subject.trim().toLowerCase() === cleanSub)
    );
  };

  // 1. Evaluasi Profil Guru & Parameter Kurikulum aktif
  if (schoolProfile && (schoolProfile.subject || schoolProfile.level)) {
    const pSub = schoolProfile.subject || '';
    const pLvl = schoolProfile.level || 'SMA';
    const pGrd = Number(schoolProfile.grade) || 10;
    const pPhs = schoolProfile.phase || resolvePhaseByLevelAndGrade(pLvl, pGrd);
    const match = findBestMatch(pSub, pLvl, pGrd, pPhs);

    const mismatches: string[] = [];
    const missingElements: string[] = [];
    const recommendations: string[] = [];

    if (!match) {
      mismatches.push(
        `Mata pelajaran "${pSub || 'Belum diatur'}" pada ${pLvl} (${pPhs} Kelas ${pGrd}) belum ditemukan padanannya di dokumen CP yang dianalisis.`
      );
      recommendations.push('Pilih mata pelajaran & kelas/fase yang tersedia dari hasil analisis CP lalu klik Sinkronkan Otomatis.');
    } else {
      if (!isSameSchoolLevelGroup(match.level, pLvl)) {
        mismatches.push(`Jenjang pada Profil Guru (${pLvl}) berbeda dengan entri CP (${match.level}).`);
        recommendations.push(`Sesuaikan jenjang pada Profil Guru & Parameter Kurikulum menjadi ${match.level}.`);
      }
      if ((match.phase || '').toLowerCase() !== pPhs.toLowerCase()) {
        mismatches.push(`Fase pada Profil Guru (${pPhs}) tidak selaras dengan Fase CP (${match.phase}).`);
        recommendations.push(`Perbarui Fase menjadi ${match.phase} (Kelas ${match.grade}).`);
      }
      const profileCpLower = (schoolProfile.cpText || '').toLowerCase();
      (match.elements || []).forEach((el) => {
        if (el.name && profileCpLower && !profileCpLower.includes(el.name.toLowerCase().slice(0, 10))) {
          missingElements.push(el.name);
        }
      });
      if (!profileCpLower) {
        mismatches.push('Rumusan teks CP pada Parameter Kurikulum masih kosong / belum tersinkron dari dokumen CP terbaru.');
        recommendations.push('Jalankan Sinkronkan Otomatis agar teks CP, Elemen CP, dan Bab Semester 1–2 terisi otomatis.');
      } else if (missingElements.length > 0) {
        recommendations.push(`Lengkapi elemen CP yang belum tercantum di Parameter Kurikulum: ${missingElements.join(', ')}.`);
      }
    }

    findings.push({
      id: 'gap-profile-parameter',
      targetName: `Profil Guru & Parameter Kurikulum (${pSub || '-'} • ${pLvl} ${pPhs} Kls ${pGrd})`,
      targetType: 'profile_parameter',
      status: mismatches.length === 0 && missingElements.length === 0 ? 'selaras' : match ? 'perlu_penyesuaian' : 'tidak_sesuai',
      matchedSubject: match?.subject,
      matchedLevel: match?.level,
      matchedPhase: match?.phase,
      matchedGrade: match?.grade,
      mismatches,
      missingElements,
      recommendations:
        recommendations.length > 0
          ? recommendations
          : ['Parameter Kurikulum & Profil Guru sudah selaras dengan fase dan ruang lingkup CP terbaru.'],
    });
  }

  // 2. Evaluasi Rencana Distribusi CP (jika ada)
  distributionPlans.slice(0, 6).forEach((plan, idx) => {
    const match = findBestMatch(plan.subject, plan.level, plan.grade, plan.phase);
    const mismatches: string[] = [];
    const missingElements: string[] = [];
    const recommendations: string[] = [];

    if (!match) {
      mismatches.push(`Distribusi CP "${plan.subject} Kls ${plan.grade}" belum memiliki rujukan yang cocok pada dokumen CP saat ini.`);
      recommendations.push('Sinkronkan ulang distribusi CP dengan mata pelajaran dan fase dari dokumen CP terbaru.');
    } else {
      const expectedTopics = [...(match.materialsSem1 || []), ...(match.materialsSem2 || [])].map((m) =>
        m.essentialMaterial.replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '').toLowerCase()
      );
      const currentTopics = [...(plan.materialsSem1 || []), ...(plan.materialsSem2 || [])].map((m) =>
        m.essentialMaterial.replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '').toLowerCase()
      );
      const overlap = currentTopics.filter((ct) =>
        expectedTopics.some((et) => et.includes(ct.slice(0, 12)) || ct.includes(et.slice(0, 12)))
      );
      if (expectedTopics.length > 0 && overlap.length === 0) {
        mismatches.push(
          `Daftar materi Semester 1–2 pada distribusi lama belum memuat ruang lingkup materi CP ${match.phase} (Kelas ${match.grade}).`
        );
        recommendations.push('Mutakhirkan distribusi Bab Semester 1 & 2 dari hasil analisis CP terbaru melalui tombol Sinkronkan Otomatis.');
      }
      if ((plan.phase || '').toLowerCase() !== (match.phase || '').toLowerCase()) {
        mismatches.push(`Fase distribusi (${plan.phase}) berbeda dengan fase CP (${match.phase}).`);
      }
    }

    findings.push({
      id: `gap-dist-${plan.id || idx}`,
      targetName: `Distribusi CP: ${plan.subject} (${plan.level} • ${plan.phase} Kls ${plan.grade})`,
      targetType: 'distribution_plan',
      status: mismatches.length === 0 ? 'selaras' : match ? 'perlu_penyesuaian' : 'tidak_sesuai',
      matchedSubject: match?.subject,
      matchedLevel: match?.level,
      matchedPhase: match?.phase,
      matchedGrade: match?.grade,
      mismatches,
      missingElements,
      recommendations:
        recommendations.length > 0
          ? recommendations
          : ['Distribusi materi & alokasi JP selaras dengan ruang lingkup CP terbaru.'],
    });
  });

  // 3. Evaluasi Perangkat Ajar tersimpan (Modul Ajar, ATP, PROTA, PROSEM, KKTP, LKPD)
  generatedDocuments.slice(0, 8).forEach((doc, idx) => {
    const match = findBestMatch(doc.subject, doc.level, doc.grade, doc.phase);
    const mismatches: string[] = [];
    const missingElements: string[] = [];
    const recommendations: string[] = [];
    const contentLower = (doc.content || '').toLowerCase();

    if (!match) {
      mismatches.push(
        `Perangkat ajar "${doc.title}" (${doc.subject} • ${doc.level} Kls ${doc.grade}) belum terpetakan ke entri CP yang dianalisis.`
      );
      recommendations.push('Pastikan dokumen CP untuk jenjang/mapel perangkat ajar ini sudah masuk dan teranalisis.');
    } else {
      const docExpectedPhase = resolvePhaseByLevelAndGrade(doc.level, doc.grade);
      if (doc.phase && doc.phase.toLowerCase() !== (match.phase || docExpectedPhase).toLowerCase()) {
        mismatches.push(`Label fase perangkat (${doc.phase}) tidak konsisten dengan CP (${match.phase}).`);
        recommendations.push(`Revisi identitas fase pada perangkat menjadi ${match.phase}.`);
      }
      (match.elements || []).forEach((el) => {
        if (el.name && contentLower && !contentLower.includes(el.name.toLowerCase().slice(0, 10))) {
          missingElements.push(el.name);
        }
      });
      if (missingElements.length > 0) {
        recommendations.push(`Tambahkan keterkaitan elemen CP berikut ke TP/ATP/Asesmen perangkat: ${missingElements.join(', ')}.`);
      }
      if (!/046\/h\/kr\/2025/i.test(doc.content || '') && /bskap/i.test(doc.content || '')) {
        mismatches.push('Rujukan regulasi pada perangkat masih menyebut SK CP versi lama dan perlu diperbarui ke BSKAP No. 046/H/KR/2025.');
        recommendations.push('Regenerasi atau perbarui rujukan dasar hukum TP/ATP ke Kepka BSKAP No. 046/H/KR/2025.');
      }
    }

    findings.push({
      id: `gap-doc-${doc.id || idx}`,
      targetName: `${doc.title || 'Perangkat Ajar'} (${doc.subject} Kls ${doc.grade})`,
      targetType: 'perangkat_ajar',
      status: mismatches.length === 0 && missingElements.length === 0 ? 'selaras' : match ? 'perlu_penyesuaian' : 'tidak_sesuai',
      matchedSubject: match?.subject,
      matchedLevel: match?.level,
      matchedPhase: match?.phase,
      matchedGrade: match?.grade,
      mismatches,
      missingElements,
      recommendations:
        recommendations.length > 0
          ? recommendations
          : ['Perangkat ajar sudah sesuai dengan elemen, fase, dan ruang lingkup CP terbaru.'],
    });
  });

  const alignedCount = findings.filter((f) => f.status === 'selaras').length;
  return {
    evaluatedAt: new Date().toISOString(),
    totalEvaluatedArtifacts: findings.length,
    alignedCount,
    gapCount: findings.length - alignedCount,
    findings,
  };
}

/**
 * Mengekstrak Bagian 1 (Diktum, Dasar Hukum, Pencabutan, Pembagian Lampiran I–V beserta rentang halaman,
 * Paradigma Pembelajaran Mendalam / 8 Dimensi Profil Lulusan, dan Kesinambungan Fase) serta Bagian 3
 * (Metodologi Penghitungan Jumlah Mapel & Catatan Ambiguitas/Keterbatasan PDF) murni dari teks dokumen yang terbaca.
 */
export function extractCPDocumentInsights(
  rawText: string = '',
  analyzedSubjects: CPSubjectEntry[] = [],
  coverageReport?: CPCoverageReport
): CPDocumentInsights {
  const source = (rawText || '').trim();
  const lines = source.split(/\r?\n/);

  let currentPage = 0;
  const pageBlocks: Array<{ page: number; lines: string[] }> = [];
  for (const line of lines) {
    const pageTag = line.trim().match(/^---\s*\[Halaman\s+(\d+)\]\s*---$/i);
    if (pageTag) {
      currentPage = Number(pageTag[1]);
      pageBlocks.push({ page: currentPage, lines: [] });
      continue;
    }
    if (pageBlocks.length === 0) {
      pageBlocks.push({ page: currentPage, lines: [] });
    }
    pageBlocks[pageBlocks.length - 1].lines.push(line.trim());
  }

  const findWithPage = (regex: RegExp, limit: number = 6): string[] => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const blk of pageBlocks) {
      for (const ln of blk.lines) {
        if (!ln || ln.length < 15) continue;
        if (regex.test(ln)) {
          const clean = ln.replace(/\s+/g, ' ').slice(0, 260);
          const key = clean.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            out.push(blk.page > 0 ? `[Hal. ${blk.page}] ${clean}` : clean);
            if (out.length >= limit) return out;
          }
        }
      }
    }
    return out;
  };

  // 1. Diktum & Penetapan
  const diktumLines = findWithPage(/\b(?:MENETAPKAN|KESATU|KEDUA|KETIGA|KEEMPAT|KELIMA|KEENAM|KETUJUH|046\/H\/KR\/2025)\b/i, 5);
  const diktumSummary =
    diktumLines.length > 0
      ? diktumLines.join(' | ')
      : source
        ? 'Ketentuan diktum penetapan eksplisit tidak ditemukan pada potongan teks yang terbaca.'
        : undefined;

  // 2. Dasar Hukum
  const legalBasis = findWithPage(/\b(?:Undang-Undang\s+Nomor|Peraturan\s+Pemerintah\s+Nomor|Permendikbudristek|Permendikdasmen|Peraturan\s+Presiden)\b/i, 6);

  // 3. Pencabutan Aturan Sebelumnya
  const revokedRegulations = findWithPage(/\b(?:dicabut|mencabut|tidak\s+berlaku|032\/H\/KR\/2024|033\/H\/KR\/2022|008\/H\/KR\/2022)\b/i, 4);

  // 4. Pembagian Lampiran I–V + rentang halaman
  const lampiranDetected: Array<{ lampiran: string; title: string; startPage: number; endPage?: number }> = [];
  for (const blk of pageBlocks) {
    for (let idx = 0; idx < blk.lines.length; idx++) {
      const ln = blk.lines[idx];
      const match = ln.match(/^\s*(LAMPIRAN\s+(I{1,3}V?|IV|V))\b(?:\s*[:\-–]?\s*(.*))?$/i);
      if (match) {
        const lampName = match[1].toUpperCase().replace(/\s+/g, ' ');
        if (!lampiranDetected.some((l) => l.lampiran === lampName)) {
          const nextTitle = match[3]?.trim() || blk.lines[idx + 1]?.trim() || 'Lampiran Dokumen CP';
          lampiranDetected.push({
            lampiran: lampName,
            title: nextTitle.slice(0, 140),
            startPage: blk.page,
          });
        }
      }
    }
  }
  const maxPage = Math.max(0, ...pageBlocks.map((b) => b.page), coverageReport?.totalPdfPages || 0);
  const lampiranMap = lampiranDetected.map((item, idx) => {
    const next = lampiranDetected[idx + 1];
    const endPage = next && next.startPage > item.startPage ? next.startPage - 1 : maxPage > item.startPage ? maxPage : undefined;
    const pageRange =
      item.startPage > 0
        ? endPage && endPage > item.startPage
          ? `Hal. ${item.startPage}–${endPage}`
          : `Hal. ${item.startPage}`
        : undefined;
    return {
      lampiran: item.lampiran,
      title: item.title,
      pageRange,
    };
  });

  // 5. Paradigma Pembelajaran Mendalam & 8 Dimensi Profil Lulusan
  const dlMatches = findWithPage(
    /\b(?:pembelajaran\s+mendalam|deep\s+learning|8\s+dimensi|delapan\s+dimensi|profil\s+lulusan|berkesadaran|bermakna|menggembirakan)\b/i,
    4
  );
  const deepLearningAndDimensions =
    dlMatches.length > 0
      ? dlMatches.join(' | ')
      : source
        ? 'Rujukan eksplisit paradigma pembelajaran mendalam / 8 Dimensi Profil Lulusan tidak ditemukan pada bagian teks yang terbaca.'
        : undefined;

  // 6. Kesinambungan Fase (Fondasi & Fase A–F)
  const phaseMatches = findWithPage(/\b(?:fase\s+fondasi|kesinambungan\s+fase|fase\s+[a-f]\b|paud|program\s+4\s+tahun)\b/i, 4);
  const phaseContinuityNotes =
    phaseMatches.length > 0
      ? phaseMatches.join(' | ')
      : source
        ? 'Kesinambungan fase (Fondasi, A–F) mengikuti kemunculan tajuk fase per jenjang dalam dokumen.'
        : undefined;

  // 7. Metodologi Penghitungan & Catatan Ambiguitas
  const religionEntries = analyzedSubjects.filter((s) => /pendidikan\s+agama|kepercayaan/i.test(s.subject));
  const distinctReligionNames = Array.from(new Set(religionEntries.map((s) => s.subject.trim())));
  const advancedEntries = analyzedSubjects.filter((s) => s.categoryTag === 'Pilihan/Tingkat Lanjut' || /tingkat\s+lanjut/i.test(s.subject));
  const distinctAdvancedNames = Array.from(new Set(advancedEntries.map((s) => s.subject.trim())));
  const hasIPAS = analyzedSubjects.some((s) => /\bipas\b/i.test(s.subject));
  const hasIPAorIPS = analyzedSubjects.some((s) => /\b(ipa|ips|ilmu\s+pengetahuan\s+alam|ilmu\s+pengetahuan\s+sosial)\b/i.test(s.subject));
  const hasInformatikaSD = analyzedSubjects.some((s) => isSameSchoolLevelGroup(s.level, 'SD') && /informatika/i.test(s.subject));
  const smkVocationalEntries = analyzedSubjects.filter(
    (s) => isSameSchoolLevelGroup(s.level, 'SMK') && s.categoryTag === 'Kejuruan/Konsentrasi'
  );
  const distinctSmkVocational = Array.from(new Set(smkVocationalEntries.map((s) => s.subject.trim())));

  const ambiguitiesOrLimitations: string[] = [];
  if (!source) {
    ambiguitiesOrLimitations.push('Belum ada teks PDF yang terbaca untuk diaudit.');
  } else {
    if (coverageReport && !coverageReport.isFullyAnalyzedByAI && coverageReport.unreadOrTruncatedNotice) {
      ambiguitiesOrLimitations.push(coverageReport.unreadOrTruncatedNotice);
    }
    if (lampiranMap.length === 0) {
      ambiguitiesOrLimitations.push('Penanda pembagian Lampiran I–V tidak eksplisit pada teks yang terbaca.');
    } else if (lampiranMap.length < 5) {
      ambiguitiesOrLimitations.push(
        `Hanya ${lampiranMap.length} tajuk Lampiran yang teridentifikasi eksplisit (${lampiranMap.map((l) => l.lampiran).join(', ')}).`
      );
    }
  }

  return {
    diktumSummary,
    legalBasis,
    revokedRegulations,
    lampiranMap,
    deepLearningAndDimensions,
    phaseContinuityNotes,
    countingMethodology: {
      religionRule:
        distinctReligionNames.length > 0
          ? `Teridentifikasi ${distinctReligionNames.length} rumusan CP Pendidikan Agama/Kepercayaan (${distinctReligionNames.join(', ')}). Pada struktur kurikulum murid dihitung 1 slot Pendidikan Agama sesuai keyakinan, namun di katalog dokumen dihitung sesuai jumlah rumusan CP.`
          : 'Tidak ditemukan rumusan CP Pendidikan Agama terpisah pada teks yang terbaca.',
      advancedPhaseFRule:
        distinctAdvancedNames.length > 0
          ? `Teridentifikasi ${distinctAdvancedNames.length} mata pelajaran Pilihan / Tingkat Lanjut Fase F (${distinctAdvancedNames.slice(0, 8).join(', ')}${distinctAdvancedNames.length > 8 ? ', ...' : ''}) yang dipisahkan dari kelompok Umum/Wajib.`
          : 'Belum terdeteksi mata pelajaran Pilihan / Tingkat Lanjut Fase F pada teks yang terbaca.',
      scienceSocialSplitRule:
        hasIPAS || hasIPAorIPS
          ? `Status Sains/Sosial: ${hasIPAS ? 'IPAS terpadu terdeteksi (SD Fase B/C)' : 'IPAS SD belum terdeteksi'}; ${hasIPAorIPS ? 'IPA/IPS atau mapel spesifik terdeteksi pada jenjang lanjut.' : 'IPA/IPS spesifik belum terdeteksi.'}`
          : 'Belum ada entri IPAS/IPA/IPS yang terekstrak dari teks.',
      informatikaSDRule: hasInformatikaSD
        ? 'Informatika terdeteksi muncul pada jenjang SD dalam teks yang terbaca.'
        : 'Informatika tidak terdeteksi sebagai rumusan CP mapel tersendiri pada jenjang SD (muncul pada SMP/SMA/SMK bila tercantum).',
      smkLampiranIIIRule:
        distinctSmkVocational.length > 0
          ? `Kelompok Kejuruan / Konsentrasi SMK/MAK (Lampiran III) dipisahkan dari kelompok umum dengan ${distinctSmkVocational.length} entri terdeteksi.`
          : 'Belum ada entri kejuruan/konsentrasi khusus SMK (Lampiran III) yang terbaca dalam potongan teks.',
      ambiguitiesOrLimitations,
    },
  };
}


