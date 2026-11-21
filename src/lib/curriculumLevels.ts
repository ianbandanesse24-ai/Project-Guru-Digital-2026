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

export type SchoolLevelGroup = 'SD' | 'SMP' | 'SMA';

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
];

export function getSchoolLevelGroup(level?: string): SchoolLevelGroup {
  const norm = (level || 'SMA').trim().toUpperCase();
  if (norm === 'SD' || norm === 'MI' || norm === 'PAKET A') return 'SD';
  if (norm === 'SMP' || norm === 'MTS' || norm === 'PAKET B') return 'SMP';
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
    'Koding dan Kecerdasan Artifisial',
    'PJOK',
    'Seni Budaya',
    'Seni Musik',
    'Seni Rupa',
    'Seni Tari',
    'Seni Teater',
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
    'Koding dan Kecerdasan Artifisial',
    'PJOK',
    'Seni Budaya',
    'Seni Musik',
    'Seni Rupa',
    'Seni Tari',
    'Seni Teater',
    'Prakarya',
    'Prakarya: Budi Daya',
    'Prakarya: Kerajinan',
    'Prakarya: Pengolahan',
    'Prakarya: Rekayasa',
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
    'Bahasa Arab',
    'Bahasa Jepang',
    'Bahasa Jerman',
    'Bahasa Korea',
    'Bahasa Mandarin',
    'Bahasa Prancis',
    'Informatika',
    'Koding dan Kecerdasan Artifisial',
    'PJOK',
    'Seni Rupa',
    'Seni Musik',
    'Seni Tari',
    'Seni Teater',
    'Prakarya: Budi Daya',
    'Prakarya: Kerajinan',
    'Prakarya: Pengolahan',
    'Prakarya: Rekayasa',
    'Prakarya & Kewirausahaan',
    'Prakarya & Kewirausahaan: Budi Daya',
    'Prakarya & Kewirausahaan: Kerajinan',
    'Prakarya & Kewirausahaan: Pengolahan',
    'Prakarya & Kewirausahaan: Rekayasa',
    'Pendidikan Digital',
  ],
  SMK: [
    'Pendidikan Agama & Budi Pekerti',
    'Pendidikan Pancasila',
    'Bahasa Indonesia',
    'Matematika',
    'Bahasa Inggris',
    'Informatika',
    'Koding dan Kecerdasan Artifisial',
    'Projek IPAS (SMK)',
    'Sejarah (SMK/MAK)',
    'PJOK',
    'Seni Budaya',
    'Dasar-Dasar Program Keahlian (SMK)',
    'Konsentrasi Keahlian (SMK)',
    'Kreativitas, Inovasi, dan Kewirausahaan (SMK)',
    'Projek Kreatif dan Kewirausahaan (PKK SMK)',
    'Praktik Kerja Lapangan (PKL SMK)',
    'Mata Pelajaran Pilihan Kejuruan (SMK)',
  ],
};

export function getDefaultSubjectsByLevel(level?: string): string[] {
  return SUBJECTS_BY_LEVEL_GROUP[getSchoolLevelGroup(level)];
}

export function inferPrimaryLevelFromSubject(subject?: string): SchoolLevel | null {
  const s = (subject || '').trim().toLowerCase();
  if (!s) return null;

  if (
    /\(smk\)|\(mak\)|^dasar[\s-]+dasar\b|^konsentrasi\s+keahlian\b|projek\s+ipas|projek\s+kreatif\s+dan\s+kewirausahaan|kreativitas,\s*inovasi,\s*(?:dan|&)\s*kewirausahaan|\bpkk\b|\bpkl\b|praktik\s+kerja\s+lapangan|pilihan\s+(?:kejuruan|smk)|kimia\s+(?:analisis|industri|tekstil)|\bsejarah\s*\(?smk|\b(?:produksi\s+film|produksi\s+dan\s+siaran|teknik\s+(?:otomotif|komputer|jaringan|mesin|ketenagalistrikan|elektronika|pengelasan|kendaraan\s+ringan|sepeda\s+motor|audio\s+video|konstruksi|geomatika|energi)|desain\s+komunikasi\s+visual|rekayasa\s+perangkat\s+lunak|pengembangan\s+perangkat\s+lunak|akuntansi\s+(?:dan|&)\s+keuangan|manajemen\s+perkantoran|bisnis\s+(?:digital|ritel)|perhotelan|kuliner|tata\s+(?:busana|boga|kecantikan)|asisten\s+keperawatan|layanan\s+kesehatan|agribisnis|nautika|teknika\s+kapal)\b/i.test(
      s
    )
  ) {
    return 'SMK';
  }
  if (
    s === 'ipas' ||
    s === 'ilmu pengetahuan alam dan sosial' ||
    s === 'ilmu pengetahuan alam dan sosial (ipas)'
  ) {
    return 'SD';
  }
  if (
    s === 'ipa' ||
    s === 'ips' ||
    s === 'ilmu pengetahuan alam' ||
    s === 'ilmu pengetahuan sosial' ||
    s === 'ilmu pengetahuan alam (ipa)' ||
    s === 'ilmu pengetahuan sosial (ips)'
  ) {
    return 'SMP';
  }
  if (
    /\(sma\)|\(paket\s*c\)|\bfisika\b|\bkimia\b(?!\s+(?:analisis|industri|tekstil)|.*dasar)|\bbiologi\b|\bgeografi\b|\bekonomi\b|\bsosiologi\b|\bantropologi\b|tingkat\s+lanjut|\bbahasa\s+(?:arab|jepang|jerman|korea|mandarin|prancis|perancis)\b|\bprakarya\s*(?:&|dan)\s*kewirausahaan\b|\bpkwu\b/i.test(
      s
    )
  ) {
    return 'SMA';
  }
  if (/^sejarah$/i.test(s)) return 'SMA';
  if (/^prakarya(?:\s*[:\-–]\s*(?:budi\s*daya|kerajinan|pengolahan|rekayasa))?$/i.test(s)) {
    return 'SMP';
  }
  return null;
}

export function inferDefaultPhaseAndGradeForSubject(
  subject: string,
  level: SchoolLevel
): { phase: string; grade: number } | null {
  const s = (subject || '').trim().toLowerCase();
  const grp = getSchoolLevelGroup(level);
  if (!s) return null;

  if (grp === 'SD') {
    if (/\bipas\b|ilmu\s+pengetahuan\s+alam\s+dan\s+sosial|\bbahasa\s+inggris\b/i.test(s)) {
      return { phase: 'Fase B', grade: 4 };
    }
    if (/\bkoding\b|kecerdasan\s+artifisial/i.test(s)) {
      return { phase: 'Fase C', grade: 5 };
    }
    return { phase: 'Fase B', grade: 4 };
  }
  if (grp === 'SMP') {
    return { phase: 'Fase D', grade: 7 };
  }
  if (grp === 'SMK') {
    if (
      /konsentrasi\s+keahlian|kreativitas,\s*inovasi|projek\s+kreatif|\bpkk\b|praktik\s+kerja|\bpkl\b|pilihan\s+(?:kejuruan|smk)|kimia\s+(?:analisis|industri|tekstil)|produksi\s+dan\s+siaran|produksi\s+film/i.test(
        s
      )
    ) {
      return { phase: 'Fase F', grade: 11 };
    }
    return { phase: 'Fase E', grade: 10 };
  }
  // SMA
  if (
    /\bfisika\b|\bkimia\b|\bbiologi\b|\bgeografi\b|\bekonomi\b|\bsosiologi\b|\bantropologi\b|tingkat\s+lanjut|\bprakarya\s*(?:&|dan)\s*kewirausahaan\b|\bpkwu\b|\bbahasa\s+(?:arab|jepang|jerman|korea|mandarin|prancis|perancis)\b/i.test(
      s
    )
  ) {
    return { phase: 'Fase F', grade: 11 };
  }
  return { phase: 'Fase E', grade: 10 };
}

export function isSubjectAllowedForLevel(subject: string, targetLevel: SchoolLevel | string): boolean {
  const grp = getSchoolLevelGroup(targetLevel);
  const s = (subject || '').trim().toLowerCase();
  if (!s) return false;

  const isSmkChemistryConcentration = /\bkimia\s+(?:analisis|industri|tekstil)\b/i.test(s);
  const isSmkOnlyName =
    isSmkChemistryConcentration ||
    /\(smk\)|\(mak\)|^dasar[\s-]+dasar\b|konsentrasi\s+keahlian|projek\s+ipas|projek\s+kreatif\s+dan\s+kewirausahaan|kreativitas,\s*inovasi,\s*(?:dan|&)\s*kewirausahaan|\bpkk\b|\bpkl\b|praktik\s+kerja\s+lapangan|pilihan\s+(?:kejuruan|smk)/i.test(
      s
    );
  const isSmaOnlyName =
    !isSmkOnlyName &&
    /\(sma\)|\(paket\s*c\)|\bfisika\b|\bkimia\b(?!.*dasar)|\bbiologi\b|\bgeografi\b|\bekonomi\b|\bsosiologi\b|\bantropologi\b|tingkat\s+lanjut|\bbahasa\s+(?:jerman|perancis|prancis|arab|jepang|korea|mandarin)\b|\bprakarya\s*(?:&|dan)\s*kewirausahaan\b|\bpkwu\b/i.test(
      s
    );
  const isSdOnlyIpas =
    s === 'ipas' ||
    s === 'ilmu pengetahuan alam dan sosial' ||
    s === 'ilmu pengetahuan alam dan sosial (ipas)';
  // In BSKAP 046, IPA and IPS cover Fase D (SMP) and integrated Fase E (SMA Kelas X)
  const isSmpOrSmaIpaIps =
    s === 'ipa' ||
    s === 'ips' ||
    s === 'ilmu pengetahuan alam' ||
    s === 'ilmu pengetahuan sosial' ||
    s === 'ilmu pengetahuan alam (ipa)' ||
    s === 'ilmu pengetahuan sosial (ips)';
  const isSecondarySejarah = /^sejarah(?:\s+tingkat\s+lanjut|\s*\(?smk(?:\/mak)?\)?)?$/i.test(s);
  // In Kepka BSKAP 046, Prakarya (Budi Daya/Kerajinan/Pengolahan/Rekayasa) spans SMP (Fase D) AND SMA (Fase E)
  const isPrakaryaAspect = /^prakarya(?:\s*[:\-–]\s*(?:budi\s*daya|kerajinan|pengolahan|rekayasa))?$/i.test(s);

  if (grp === 'SMA') {
    if (isSmkOnlyName || isSdOnlyIpas) return false;
    return true;
  }
  if (grp === 'SMK') {
    if (isSmaOnlyName || isSdOnlyIpas || isSmpOrSmaIpaIps || isPrakaryaAspect) return false;
    return true;
  }
  if (grp === 'SD') {
    if (isSmkOnlyName || isSmaOnlyName || isSmpOrSmaIpaIps || isSecondarySejarah || isPrakaryaAspect) return false;
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
  { pattern: /\bbahasa\s+arab\b/i, canonical: 'Bahasa Arab', preferredGroup: 'SMA' },
  { pattern: /\bbahasa\s+jepang\b|\bnihongo\b/i, canonical: 'Bahasa Jepang', preferredGroup: 'SMA' },
  { pattern: /\bbahasa\s+korea\b|\bhangeul\b/i, canonical: 'Bahasa Korea', preferredGroup: 'SMA' },
  { pattern: /\bbahasa\s+mandarin\b/i, canonical: 'Bahasa Mandarin', preferredGroup: 'SMA' },
  { pattern: /\bbahasa\s+(?:perancis|prancis)\b/i, canonical: 'Bahasa Prancis', preferredGroup: 'SMA' },
  { pattern: /\bbahasa\s+daerah\b|\bmuatan\s+lokal\b/i, canonical: 'Muatan Lokal / Bahasa Daerah' },
  { pattern: /\bmatematika\s+tingkat\s+lanjut\b/i, canonical: 'Matematika Tingkat Lanjut', preferredGroup: 'SMA' },
  { pattern: /\bmatematika\b/i, canonical: 'Matematika' },
  { pattern: /\bprojek\s+(?:ilmu\s+pengetahuan\s+alam\s+dan\s+sosial|ipas)\b|\bipas\s*\(?smk\)?/i, canonical: 'Projek IPAS (SMK)', preferredGroup: 'SMK' },
  { pattern: /(?<!projek\s)(?:\bipas\b|ilmu\s+pengetahuan\s+alam\s+dan\s+sosial)/i, canonical: 'IPAS', preferredGroup: 'SD' },
  { pattern: /\b(?:ilmu\s+pengetahuan\s+alam(?!\s+dan\s+sosial)|(?<!projek\s)ipa(?=\s*(?:\(|$|\n|:|-|dan\s+ips|fase|kelas|smp|mts)))\b/i, canonical: 'IPA', preferredGroup: 'SMP' },
  { pattern: /\b(?:ilmu\s+pengetahuan\s+sosial|ips(?=\s*(?:\(|$|\n|:|-|fase|kelas|smp|mts)))\b/i, canonical: 'IPS', preferredGroup: 'SMP' },
  { pattern: /\bfisika\b/i, canonical: 'Fisika', preferredGroup: 'SMA' },
  { pattern: /\bkimia\s+analisis\b/i, canonical: 'Kimia Analisis (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bkimia\s+industri\b/i, canonical: 'Kimia Industri (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bkimia\s+tekstil\b/i, canonical: 'Kimia Tekstil (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bkimia\b(?!\s+(?:analisis|industri|tekstil))/i, canonical: 'Kimia', preferredGroup: 'SMA' },
  { pattern: /\bbiologi\b/i, canonical: 'Biologi', preferredGroup: 'SMA' },
  { pattern: /\bkoding\s+dan\s+kecerdasan\s+artifisial\b|\bkecerdasan\s+artifisial\b/i, canonical: 'Koding dan Kecerdasan Artifisial' },
  { pattern: /\binformatika\b/i, canonical: 'Informatika' },
  { pattern: /\bsejarah\s+smk(?:\/mak)?\b/i, canonical: 'Sejarah (SMK/MAK)', preferredGroup: 'SMK' },
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
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\s*[:\-–]?\s*budi\s*daya\b/i, canonical: 'Prakarya & Kewirausahaan: Budi Daya', preferredGroup: 'SMA' },
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\s*[:\-–]?\s*kerajinan\b/i, canonical: 'Prakarya & Kewirausahaan: Kerajinan', preferredGroup: 'SMA' },
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\s*[:\-–]?\s*pengolahan\b/i, canonical: 'Prakarya & Kewirausahaan: Pengolahan', preferredGroup: 'SMA' },
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\s*[:\-–]?\s*rekayasa\b/i, canonical: 'Prakarya & Kewirausahaan: Rekayasa', preferredGroup: 'SMA' },
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\b|\bpkwu\b/i, canonical: 'Prakarya & Kewirausahaan', preferredGroup: 'SMA' },
  // 4 aspek Prakarya (SMP Fase D & SMA Fase E - BSKAP 046)
  { pattern: /\bprakarya\s*[:\-–]?\s*budi\s*daya\b/i, canonical: 'Prakarya: Budi Daya', preferredGroup: 'SMP' },
  { pattern: /\bprakarya\s*[:\-–]?\s*kerajinan\b/i, canonical: 'Prakarya: Kerajinan', preferredGroup: 'SMP' },
  { pattern: /\bprakarya\s*[:\-–]?\s*pengolahan\b/i, canonical: 'Prakarya: Pengolahan', preferredGroup: 'SMP' },
  { pattern: /\bprakarya\s*[:\-–]?\s*rekayasa\b/i, canonical: 'Prakarya: Rekayasa', preferredGroup: 'SMP' },
  { pattern: /\bprakarya\b/i, canonical: 'Prakarya', preferredGroup: 'SMP' },
  // Pendidikan Kesetaraan (Paket A / B / C - BSKAP 046): avoid false-matching "keterampilan proses"
  { pattern: /\bmata\s+pelajaran\s+pemberdayaan\b|^pemberdayaan$/i, canonical: 'Pemberdayaan' },
  { pattern: /\bmata\s+pelajaran\s+keterampilan\b|^(?:[ivxlcdm]+\.\s*)?(?:capaian\s+pembelajaran\s+)?keterampilan$/i, canonical: 'Keterampilan' },
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
  { pattern: /\bmata\s+pelajaran\s+pilihan\s+(?:kejuruan|smk(?:\/mak)?)\b/i, canonical: 'Mata Pelajaran Pilihan Kejuruan (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+(?:program\s+)?keahlian\b/i, canonical: 'Dasar-Dasar Program Keahlian (SMK)', preferredGroup: 'SMK' },
];

function stripLevelAnnotations(text: string): string {
  const raw = (text || '').trim();
  // Preserve explicit SMK Sejarah indicator before removing SMK/MAK level annotations
  const hasSmkSejarah = /\bsejarah\s*\(?smk(?:\/mak)?\)?/i.test(raw);
  const cleaned = raw
    .replace(/\((?:[^)]*(?:sd|mi|smp|mts|sma|ma|smk|mak|paket\s*[abc]|fase\s*[a-f]|kelas\s*\d+|program\s*\d+\s*tahun)[^)]*)\)/gi, ' ')
    .replace(/\b(?:untuk\s+)?(?:jenjang|tingkat)?\s*(?:sma|smk|ma|mak|smp|mts|sd|mi|paket\s*[abc]|fase\s*[a-f]|kelas\s*\d+(?:\s*[-–]\s*\d+)?|kurikulum\s+merdeka)\b.*/i, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (hasSmkSejarah && /^sejarah$/i.test(cleaned)) {
    return 'Sejarah SMK/MAK';
  }
  return cleaned;
}

const NON_SUBJECT_HEADING_REGEX =
  /^(?:umum|pada|untuk|tentang|rasional|tujuan|karakteristik|elemen|aspek|pendahuluan|capaian|pembelajaran|capaian\s+pembelajaran|mata\s+pelajaran|untuk\s+mata\s+pelajaran|semester|bab|unit|kelas|fase|setiap\s+fase|penutup|daftar\s+isi|kata\s+pengantar|pendidikan\s+anak\s+usia\s+dini|paud|sekolah\s+dasar|sekolah\s+menengah(?:\s+(?:pertama|atas|kejuruan))?|madrasah(?:\s+(?:ibtidaiyah|tsanawiyah|aliyah(?:\s+kejuruan)?))?|keputusan|lampiran|nomor|peserta\s+didik|kurikulum|kemendikbud|kemendikdasmen|bskap|kesetaraan|pendidikan\s+khusus|program\s+kebutuhan\s+khusus)$|\b(?:bskap|kemendikdasmen|kemendikbud|keputusan\s+kepala|pedoman\s+kurikulum|anak\s+usia\s+dini|beban\s+belajar|jam\s+pelajaran|\bjp\b|\d+\s*\/\s*[a-z]+\s*\/\s*kr)\b|^cp\b[,\s]/i;

const CP_PREFIX_REGEX =
  /^(?:#{1,4}\s*|(?:[IVXLCDM]{1,7}(?:\.\d+)*|\d+(?:\.\d+)*|[A-Z])(?:[\.\)]\s*|\s+))?/;

const STANDALONE_CP_HEADER_REGEX =
  /^(?:#{1,4}\s*|(?:[IVXLCDM]{1,7}(?:\.\d+)*|\d+(?:\.\d+)*|[A-Z])(?:[\.\)]\s*|\s+))?capaian\s+pembelajaran(?:\s+mata\s+pelajaran)?\s*[:\-–]?$/i;

function isPossibleHeadingContinuationLine(nextTrimmed: string): boolean {
  if (!nextTrimmed || nextTrimmed.length > 90) return false;
  if (/^(?:---|\d+\s*\/\s*[a-z]+|lampiran\b|[abcd]\.\s*(?:rasional|tujuan|karakteristik|capaian)|rasional\b|tujuan\b|karakteristik\b|elemen\b|aspek\b|fase\s+[a-f]\b|kelas\s+\d+|pada\s+akhir\b)/i.test(nextTrimmed)) {
    return false;
  }
  if (/(?:^|\b)capaian\s+pembelajaran\b/i.test(nextTrimmed)) return false;
  // Continuation in BSKAP PDFs is either ALL CAPS / title word(s) or parenthetical acronym e.g. "(IPAS)" / "PEKERTI" / "DAN SOSIAL" / "KESEHATAN" / "BUDI DAYA"
  if (/^\([A-Z]{2,12}\)$/.test(nextTrimmed)) return true;
  if (nextTrimmed.split(/\s+/).length <= 6 && /^[A-Z0-9\s,&:/().-]+$/.test(nextTrimmed)) return true;
  if (/^(?:dan|&|atau)\s+/i.test(nextTrimmed) && nextTrimmed.split(/\s+/).length <= 5) return true;
  return false;
}

function tryJoinWrappedCPHeading(lines: string[], index: number): {
  headingLine: string;
  consumedLines: number;
} {
  const first = (lines[index] || '').replace(/\s+/g, ' ').trim();
  const isCPLikeLine =
    STANDALONE_CP_HEADER_REGEX.test(first) ||
    /^(?:#{1,4}\s*|(?:[IVXLCDM]{1,7}(?:\.\d+)*|\d+(?:\.\d+)*|[A-Z])(?:[\.\)]\s*|\s+))?capaian\s+pembelajaran\b/i.test(
      first
    );
  if (!isCPLikeLine || first.length > 135) {
    return { headingLine: first, consumedLines: 0 };
  }

  let combined = first;
  let consumed = 0;
  for (let offset = 1; offset <= 2 && index + offset < lines.length; offset++) {
    const nextTrimmed = (lines[index + offset] || '').replace(/\s+/g, ' ').trim();
    if (!isPossibleHeadingContinuationLine(nextTrimmed)) break;
    combined = `${combined} ${nextTrimmed}`.replace(/\s+/g, ' ').trim();
    consumed = offset;
    if (/\([A-Z]{2,10}\)$/.test(nextTrimmed)) break;
  }
  return { headingLine: combined, consumedLines: consumed };
}

function formatCustomSubjectTitle(rawCandidate: string, inSmkConcentrationSection: boolean = false): string {
  const clean = (rawCandidate || '').replace(/\s+/g, ' ').replace(/[:\-–.]+$/, '').trim();
  if (!clean) return '';
  const titled = /^[A-Z0-9\s,&:/().-]+$/.test(clean)
    ? clean
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\b(Dan|Atau|Untuk|Pada|Di|Ke|Dari|Yang)\b/g, (m) => m.toLowerCase())
        .replace(/^\w/, (c) => c.toUpperCase())
        .replace(/\bIpas\b/g, 'IPAS')
        .replace(/\bIpa\b/g, 'IPA')
        .replace(/\bIps\b/g, 'IPS')
        .replace(/\bPjok\b/g, 'PJOK')
        .replace(/\bSmk\/mak\b/gi, 'SMK/MAK')
        .replace(/\bSmk\b/g, 'SMK')
        .replace(/\bMak\b/g, 'MAK')
        .replace(/\bPkl\b/g, 'PKL')
        .replace(/\bPkk\b/g, 'PKK')
        .replace(/\bDkv\b/g, 'DKV')
        .replace(/\bTkj\b/g, 'TKJ')
        .replace(/\bRpl\b/g, 'RPL')
        .replace(/\bPplg\b/g, 'PPLG')
        .replace(/\bTjkt\b/g, 'TJKT')
        .replace(/\bCad\b/g, 'CAD')
        .replace(/\bCnc\b/g, 'CNC')
        .replace(/\bK3lh\b/g, 'K3LH')
    : clean;

  if (inSmkConcentrationSection && !/\(smk\)|\(mak\)/i.test(titled)) {
    return `${titled} (SMK)`;
  }
  return titled;
}

/**
 * Extracts explicit subject headings declared inside CP text WITHOUT filtering by a preset level.
 * Ideal for discovering the true subject (e.g. "CAPAIAN PEMBELAJARAN BIOLOGI" -> ["Biologi"])
 * before reconciling school level / phase / grade.
 */
export function extractAllHeadedSubjectsFromText(sourceText: string): string[] {
  const found: string[] = [];
  const push = (sub: string) => {
    const clean = (sub || '').trim().replace(/^[:\-–.\s]+|[:\-–.\s]+$/g, '');
    if (!clean || clean.length < 3 || clean.length > 120) return;
    if (!found.some((f) => f.toLowerCase() === clean.toLowerCase())) {
      found.push(clean);
    }
  };

  const lines = (sourceText || '').split(/\r?\n/);
  const headSample = (sourceText || '').slice(0, 6000);
  const startsAsLampiranII =
    /LAMPIRAN\s+II\b|CAPAIAN\s+PEMBELAJARAN\s+UNTUK\s+SD\/MI/i.test(headSample);
  let inSmkLampiran = startsAsLampiranII
    ? false
    : /LAMPIRAN\s+III\b|CAPAIAN\s+PEMBELAJARAN\s+PADA\s+SMK\/MAK/i.test(headSample) ||
      /\b(?:program\s+keahlian|konsentrasi\s+keahlian|dasar[\s-]+dasar\s+teknik)\b/i.test(headSample);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].replace(/\s+/g, ' ').trim();
    if (!trimmed) continue;
    if (/^LAMPIRAN\s+III\b|^CAPAIAN\s+PEMBELAJARAN\s+PADA\s+SMK\/MAK/i.test(trimmed)) {
      inSmkLampiran = true;
    } else if (/^LAMPIRAN\s+(?:I|II|IV|V)\b|^CAPAIAN\s+PEMBELAJARAN\s+UNTUK\s+SD\/MI/i.test(trimmed)) {
      inSmkLampiran = false;
    }

    const { headingLine, consumedLines } = tryJoinWrappedCPHeading(lines, i);
    const isSmkKonsentrasiHeading =
      /^V\.\d+\.?\s+CAPAIAN\s+PEMBELAJARAN\s+DASAR[\s-]+DASAR\b/i.test(headingLine) ||
      (inSmkLampiran && /^V(?:I)?\.\d+\.?\s+CAPAIAN\s+PEMBELAJARAN\b/i.test(headingLine));

    const isCpExplicitLine = /^(?:#{1,4}\s*|(?:[IVXLCDM]{1,7}(?:\.\d+)*|\d+(?:\.\d+)*|[A-Z])(?:[\.\)]\s*|\s+))?(?:Capaian\s+Pembelajaran|CAPAIAN\s+PEMBELAJARAN|Mata\s+Pelajaran\s*[:\-–]|MATA\s+PELAJARAN\s*[:\-–])/.test(
      trimmed
    );

    if (isCpExplicitLine) {
      const nextAfterHeading = (lines[i + consumedLines + 1] || '').replace(/\s+/g, ' ').trim();
      const sub = extractSubjectHeadingFromLine(headingLine, isSmkKonsentrasiHeading, true, nextAfterHeading);
      if (sub) {
        push(sub);
        i += consumedLines;
      }
    }
  }
  return found;
}

/**
 * Extracts explicit subject headings declared inside CP documents (including 2-line BSKAP headings,
 * "CAPAIAN PEMBELAJARAN BIOLOGI", "II CAPAIAN PEMBELAJARAN PENDIDIKAN PANCASILA", "VI.126. CAPAIAN PEMBELAJARAN PRODUKSI FILM",
 * numbered headers, and SMK Dasar-Dasar/Konsentrasi headers).
 * Prioritizes explicit "CAPAIAN PEMBELAJARAN <SUBJECT>" headings when present so body prose words
 * (e.g. "keterampilan proses", "reaksi kimia", "pertumbuhan ekonomi", intro TOC bullets) never pollute subject lists.
 */
export function extractSubjectsFromCPText(
  sourceText: string,
  targetLevel: SchoolLevel | string
): string[] {
  const detected: string[] = [];
  const pushUnique = (sub: string) => {
    const clean = (sub || '').trim().replace(/^[:\-–.\s]+|[:\-–.\s]+$/g, '');
    if (!clean || clean.length < 3 || clean.length > 100) return;
    if (!isSubjectAllowedForLevel(clean, targetLevel)) return;
    if (!detected.some((d) => d.toLowerCase() === clean.toLowerCase())) {
      detected.push(clean);
    }
  };

  // Pass 1: Authoritative explicit "CAPAIAN PEMBELAJARAN <SUBJECT>" headings
  const explicitHeaded = extractAllHeadedSubjectsFromText(sourceText);
  explicitHeaded.forEach(pushUnique);

  const lines = (sourceText || '').split(/\r?\n/);
  const targetGrp = getSchoolLevelGroup(targetLevel);
  let skipIntroTocList = false;

  // Pass 2: Standalone/table/strict numbered headings ONLY if no explicit "CAPAIAN PEMBELAJARAN ..." heading exists
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].replace(/\s+/g, ' ').trim();
    if (!trimmed) continue;

    if (/^(?:capaian\s+pembelajaran\s+untuk\s+mata\s+pelajaran|daftar\s+mata\s+pelajaran)\s*:?\s*$/i.test(trimmed)) {
      skipIntroTocList = true;
      continue;
    }
    if (skipIntroTocList) {
      if (/^(?:[IVXLCDM]+\.\s+)?CAPAIAN\s+PEMBELAJARAN\b|^[A-D]\.\s+(?:Rasional|Tujuan)/i.test(trimmed)) {
        skipIntroTocList = false;
      } else if (/^(?:[a-z][\.\)]\s+|\d+[\.\)]\s+)/i.test(trimmed)) {
        continue;
      } else {
        skipIntroTocList = false;
      }
    }

    const { headingLine, consumedLines } = tryJoinWrappedCPHeading(lines, i);
    const isSmkKonsentrasi =
      targetGrp === 'SMK' &&
      /^V(?:I)?\.\d+\.?\s+CAPAIAN\s+PEMBELAJARAN\b/i.test(headingLine);

    if (explicitHeaded.length === 0) {
      const headingSub = extractSubjectHeadingFromLine(headingLine, isSmkKonsentrasi, false);
      if (headingSub) {
        pushUnique(headingSub);
        i += consumedLines;
        continue;
      }

      // Inspect Markdown / Excel table rows (e.g. "| 1 | Bahasa Indonesia | ... |")
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
  }

  // Fallback ONLY if no explicit headings or table rows were detected (e.g. short pasted snippet)
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
 * Slices the raw CP text section relevant to a specific subject in CP documents
 * (trims unrelated preceding pages even for single-subject slices when an explicit CP header is present)
 */
function sliceCPTextForSubject(rawText: string, subjectName: string, allSubjects: string[]): string {
  if (!rawText) return rawText;
  const lower = rawText.toLowerCase();
  const baseSubjectName = subjectName
    .replace(/\s*\(SMK(?:\/MAK)?\)\s*$/i, '')
    .trim();
  const escapedSub = baseSubjectName
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\&/g, '(?:&|dan)');

  const cpPrefix = `(?:(?:[IVXLCDM]{1,7}(?:\\.\\d+)*|\\d+(?:\\.\\d+)*|[A-Z])(?:[\\.\\)]\\s*|\\s+))?(?:capaian\\s+pembelajaran\\s+(?:mata\\s+pelajaran\\s+)?\\n?\\s*|mata\\s+pelajaran\\s*[:\\-]\\s*)`;
  const headerRegex = new RegExp(`${cpPrefix}${escapedSub}`, 'i');
  const headerMatch = headerRegex.exec(rawText);

  if (allSubjects.length <= 1 && !headerMatch) {
    return rawText;
  }

  let startIdx = headerMatch
    ? headerMatch.index
    : lower.indexOf(baseSubjectName.toLowerCase());
  if (startIdx < 0) return rawText;

  // Preserve immediately preceding [Halaman N] / Lampiran marker lines (within 220 chars before subject header)
  const prefixWindowStart = Math.max(0, startIdx - 220);
  const prefixText = rawText.slice(prefixWindowStart, startIdx);
  const markerMatch = prefixText.match(/(?:^|\n)(?:---\s*\[Halaman\s+\d+\]\s*---|LAMPIRAN\s+(?:I{1,3}V?|IV|V|\d+)[^\n]*)/i);
  if (markerMatch && markerMatch.index !== undefined) {
    startIdx = prefixWindowStart + markerMatch.index;
  }

  let endIdx = rawText.length;
  const searchFrom = (headerMatch ? headerMatch.index : startIdx) + Math.max(baseSubjectName.length, 25);
  for (const other of allSubjects) {
    if (other.toLowerCase() === subjectName.toLowerCase()) continue;
    const escapedOther = other
      .replace(/\s*\(SMK(?:\/MAK)?\)\s*$/i, '')
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\&/g, '(?:&|dan)');
    const otherHeaderRegex = new RegExp(`${cpPrefix}${escapedOther}`, 'i');
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
    /^(?:#{1,4}\s*|(?:[IVXLCDM]{1,7}(?:\.\d+)*|\d+(?:\.\d+)*|[A-Z])(?:[\.\)]\s*|\s+)|•\s*)?(?:jenjang|tingkat\s+sekolah|bagian|capaian\s+pembelajaran|sekolah|madrasah|program|untuk\s+(?:sd|smp|sma|smk)|pada\s+(?:akhir\s+fase|smk\/mak)|fase\s*[a-f]\b|(?:sd|smp|sma|smk)\s*\/\s*(?:mi|mts|ma|mak)|paket\s*[abc]\b)/i.test(
      trimmed
    ) ||
    /\((?:umumnya\s+untuk[^)]*(?:sd|mi|smp|mts|sma|ma|smk|mak)|sd|mi|smp|mts|sma|ma|smk|mak)[^)]*\)/i.test(trimmed);

  const isLongProse =
    trimmed.length > 140 &&
    !/^(?:#{1,4}\s*|\d+(?:\.\d+)*[\.\)]\s*|[A-Z][\.\)]\s*)?(?:pada\s+akhir\s+)?fase\s*[a-f]\b/i.test(trimmed);
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
    // In BSKAP 046, Fase E & Fase F cover SMA/MA and/or SMK/MAK unless filtered by isSubjectAllowedForLevel
    if (/\bfase\s*(?:e|f)\b/i.test(trimmed)) return ['SMA', 'SMK'];
    return null;
  }
  return targets;
}

function extractSubjectHeadingFromLine(
  trimmed: string,
  inSmkConcentrationSection: boolean = false,
  requireExplicitHeader: boolean = false,
  nextLineText: string = ''
): string | null {
  const normLine = (trimmed || '').replace(/\s+/g, ' ').trim();
  if (!normLine || normLine.length > 210) return null;

  const hasSectionCodePrefix = /^(?:#{1,4}\s*|(?:[IVXLCDM]{1,7}(?:\.\d+)*|\d+(?:\.\d+)*)(?:[\.\)]\s*|\s+))/.test(
    normLine
  );

  // Reject wrapped prose sentences like "Capaian Pembelajaran mata pelajaran Teknik Pemesinan\nmemuat kompetensi..."
  if (
    !hasSectionCodePrefix &&
    !/CAPAIAN\s+PEMBELAJARAN/.test(normLine) &&
    nextLineText &&
    /^[a-z]/.test(nextLineText.trim())
  ) {
    return null;
  }

  // Ignore non-subject structural lines, BSKAP decree titles, and lowercase prose sentences starting with "capaian pembelajaran..."
  if (
    /^(?:[IVXLCDM]+\.?\s*)?capaian\s+pembelajaran\s+(?:pada\s+(?:pendidikan|jenjang|smk\/mak|paud)|untuk\s+(?:sd|mi|smp|mts|sma|ma|smk|mak|mata\s+pelajaran|pengembangan\b))/i.test(
      normLine
    ) ||
    /^(?:[A-Z]\.\s*)?capaian\s+pembelajaran\s*$/i.test(normLine) ||
    /^capaian\s+pembelajaran\s+(?:merupakan|adalah|yang|pada\s+akhir|setiap|untuk\s+mata\s+pelajaran)/i.test(normLine)
  ) {
    return null;
  }

  // Reject unnumbered lowercase prose clauses ("capaian pembelajaran mata pelajaran konsentrasi keahlian...")
  if (!hasSectionCodePrefix && /^capaian\s+pembelajaran\b/.test(normLine)) {
    return null;
  }

  const cpHeadingMatch = normLine.match(
    /^(?:#{1,4}\s*|(?:[IVXLCDM]{1,7}(?:\.\d+)*|\d+(?:\.\d+)*|[A-Z])(?:[\.\)]\s*|\s+))?(?:capaian\s+pembelajaran\s+(?:mata\s+pelajaran\s+)?|mata\s+pelajaran\s*[:\-–]\s*)(.+)$/i
  );
  if (cpHeadingMatch && cpHeadingMatch[1]) {
    let rawCandidate = cpHeadingMatch[1].trim();
    // Clean occasional doubled "CAPAIAN PEMBELAJARAN ..." PDF extraction artifact (e.g., PJOK p.280)
    rawCandidate = rawCandidate.replace(/\bCAPAIAN\s+PEMBELAJARAN\b.*$/i, '').trim();
    const candidate = stripLevelAnnotations(rawCandidate);
    // Reject accidental prose clauses after "Capaian Pembelajaran"
    if (
      !rawCandidate ||
      !candidate ||
      /^[a-z]/.test(rawCandidate) ||
      /[.;?]/.test(rawCandidate) ||
      /\b(?:namun|tetapi|sehingga|karena|adalah|merupakan|mampu|dapat|harus|yaitu|yakni|sebagai\s+berikut|yang|mengacu|dijalani|menyelenggarakan|diselenggarakan|dimiliki|diberikan|tertuang|merujuk|berlaku|memiliki|sesuai)\b/i.test(
        rawCandidate
      ) ||
      /\s+(?:pada|di|untuk|ke|dari|dan)$/i.test(rawCandidate) ||
      /\s+(?:pada|di|untuk|ke|dari|dan)$/i.test(candidate)
    ) {
      return null;
    }
    if (candidate.length >= 3 && !NON_SUBJECT_HEADING_REGEX.test(candidate)) {
      if (inSmkConcentrationSection) {
        const smkKnown = KNOWN_SUBJECT_PATTERNS.find(
          (p) => p.preferredGroup === 'SMK' && p.pattern.test(candidate)
        );
        if (smkKnown) return smkKnown.canonical;
        return formatCustomSubjectTitle(candidate, true);
      }
      const known = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(candidate));
      if (known) return known.canonical;
      return formatCustomSubjectTitle(candidate, false);
    }
  }

  if (requireExplicitHeader) return null;

  // Standalone uppercase / known exact subject title (exclude numbered prose bullets!)
  const numberedHeading = normLine.match(/^(?:#{1,4}\s*|(?:[IVXLCDM]{1,7}(?:\.\d+)*|\d+(?:\.\d+)*)[\.\)]\s*)(.{3,95})$/);
  const rawBody = (numberedHeading ? numberedHeading[1] : normLine).trim();
  const cleanBody = stripLevelAnnotations(rawBody).replace(/[:\-–.]+$/, '').trim();
  if (
    cleanBody.length >= 3 &&
    cleanBody.length <= 85 &&
    cleanBody.split(/\s+/).length <= 8 &&
    !NON_SUBJECT_HEADING_REGEX.test(cleanBody) &&
    !/^(?:elemen|aspek|rasional|tujuan|karakteristik|bab|unit|semester|fase|kelas|keterampilan\s+proses|pemahaman\s+)/i.test(
      cleanBody
    )
  ) {
    if (/^(?:dasar[\s-]+dasar|konsentrasi\s+keahlian)\s+[a-z0-9]/i.test(cleanBody)) {
      const knownSmk = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(cleanBody));
      return knownSmk ? knownSmk.canonical : formatCustomSubjectTitle(cleanBody, true);
    }

    const known = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(cleanBody));
    if (
      known &&
      (cleanBody.toLowerCase() === known.canonical.toLowerCase() || /^[A-Z0-9\s,&:/-]+$/.test(cleanBody))
    ) {
      if (inSmkConcentrationSection && known.preferredGroup !== 'SMK') {
        return formatCustomSubjectTitle(cleanBody, true);
      }
      return known.canonical;
    }

    if (numberedHeading && /^[A-Z0-9\s,&:/-]+$/.test(cleanBody) && cleanBody.length >= 4) {
      return formatCustomSubjectTitle(cleanBody, inSmkConcentrationSection);
    }
  }
  return null;
}

/**
 * Splits a multi-level CP document into sections keyed by SchoolLevelGroup ('SD' | 'SMP' | 'SMA' | 'SMK').
 * Handles BOTH Level-First ("LAMPIRAN II ... JENJANG SD/SMP/SMA ... LAMPIRAN III ... SMK/MAK")
 * AND Subject-First / Phase-Inside BSKAP CP documents
 * ("CAPAIAN PEMBELAJARAN BIOLOGI" -> "Fase F (SMA)", or "CAPAIAN PEMBELAJARAN MATEMATIKA" -> "Fase A..F"),
 * including 2-line wrapped BSKAP headings, while isolating PAUD (Lampiran I) and Pendidikan Khusus (Lampiran V).
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
  let pendingSubjectPrePhaseLines: string[] = [];
  let skipNonRegularSection = false;
  let currentLampiranMode: 'NONE' | 'I_PAUD' | 'II_GENERAL' | 'III_SMK' | 'IV_KESETARAAN' | 'V_PK' = 'NONE';
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
    const trimmed = line.replace(/\s+/g, ' ').trim();

    if (/^---\s*\[Halaman\s+\d+\]\s*---$/i.test(trimmed)) {
      pendingContextLines = [trimmed];
      continue;
    }

    // Track BSKAP Lampiran I-V boundaries explicitly & strip decree cover titles
    if (/^(?:SALINAN|KEPUTUSAN\s+KEPALA|BADAN\s+STANDAR,|NOMOR\s+\d+\s*\/\s*[A-Z]+\s*\/|TENTANG)$/i.test(trimmed)) {
      continue;
    }
    if (/^LAMPIRAN\s+I\b/i.test(trimmed) && trimmed.length <= 80 && !/^LAMPIRAN\s+(?:II|III|IV|V)\b/i.test(trimmed)) {
      currentLampiranMode = 'I_PAUD';
      skipNonRegularSection = true;
      currentTargets = [];
      activeSectionTargets = [];
      continue;
    }
    if (/^LAMPIRAN\s+II\b/i.test(trimmed) && trimmed.length <= 80) {
      currentLampiranMode = 'II_GENERAL';
      skipNonRegularSection = false;
      activeSectionTargets = ['SD', 'SMP', 'SMA'];
      pendingContextLines.push(trimmed);
      continue;
    }
    if (/^LAMPIRAN\s+III\b/i.test(trimmed) && trimmed.length <= 80) {
      currentLampiranMode = 'III_SMK';
      skipNonRegularSection = false;
      activeSectionTargets = ['SMK'];
      currentTargets = ['SMK'];
      currentSubjectHeader = '';
      pendingSubjectPrePhaseLines = [];
      pendingContextLines.push(trimmed);
      continue;
    }
    if (/^LAMPIRAN\s+IV\b/i.test(trimmed) && trimmed.length <= 80) {
      currentLampiranMode = 'IV_KESETARAAN';
      skipNonRegularSection = false;
      pendingContextLines.push(trimmed);
      continue;
    }
    if (/^LAMPIRAN\s+V\b/i.test(trimmed) && trimmed.length <= 80) {
      currentLampiranMode = 'V_PK';
      skipNonRegularSection = true;
      currentTargets = [];
      activeSectionTargets = [];
      continue;
    }
    // Skip BSKAP decree cover/header block ("CAPAIAN PEMBELAJARAN PADA PENDIDIKAN / ANAK USIA DINI...") vs actual PAUD/PK sections
    if (
      /^(?:CAPAIAN\s+PEMBELAJARAN\s+PADA\s+PENDIDIKAN\s*$|ANAK\s+USIA\s+DINI,\s+JENJANG\s+PENDIDIKAN\s+DASAR|DAN\s+JENJANG\s+PENDIDIKAN\s+MENENGAH$)/i.test(
        trimmed
      )
    ) {
      continue;
    }
    if (
      /^(?:PAUD\s*\(?FASE\s+FONDASI|CAPAIAN\s+PEMBELAJARAN\s+PADA\s+PENDIDIKAN\s+KHUSUS|SDLB\/SMPLB\/SMALB)/i.test(
        trimmed
      ) ||
      (/CAPAIAN\s+PEMBELAJARAN\s+PADA\s+PENDIDIKAN\s+ANAK\s+USIA\s+DINI/i.test(trimmed) && currentLampiranMode === 'I_PAUD')
    ) {
      skipNonRegularSection = true;
      currentTargets = [];
      continue;
    }
    if (/^CAPAIAN\s+PEMBELAJARAN\s+UNTUK\s+SD\/MI,\s*SMP\/MTS,\s*DAN\s+SMA\/MA/i.test(trimmed)) {
      currentLampiranMode = 'II_GENERAL';
      skipNonRegularSection = false;
      activeSectionTargets = ['SD', 'SMP', 'SMA'];
      continue;
    }
    if (/^CAPAIAN\s+PEMBELAJARAN\s+PADA\s+SMK\/MAK/i.test(trimmed)) {
      currentLampiranMode = 'III_SMK';
      skipNonRegularSection = false;
      activeSectionTargets = ['SMK'];
      currentTargets = ['SMK'];
      currentSubjectHeader = '';
      pendingSubjectPrePhaseLines = [];
      continue;
    }
    if (currentLampiranMode === 'NONE' && /^I\.1\.?\s+CAPAIAN\s+PEMBELAJARAN\b/i.test(trimmed)) {
      currentLampiranMode = 'II_GENERAL';
      skipNonRegularSection = false;
      activeSectionTargets = ['SD', 'SMP', 'SMA'];
    }

    if (skipNonRegularSection) {
      continue;
    }

    const { headingLine, consumedLines } = tryJoinWrappedCPHeading(lines, i);
    const isExplicitSmkVOrVI =
      /^V\.\d+\.?\s+CAPAIAN\s+PEMBELAJARAN\s+DASAR[\s-]+DASAR\b/i.test(headingLine) ||
      ((currentLampiranMode === 'III_SMK' || currentLampiranMode === 'NONE') &&
        /^VI\.\d+\.?\s+CAPAIAN\s+PEMBELAJARAN\b/i.test(headingLine));

    if (isExplicitSmkVOrVI) {
      currentLampiranMode = 'III_SMK';
      activeSectionTargets = ['SMK'];
    }

    const isSmkKonsentrasiHeading =
      isExplicitSmkVOrVI ||
      (currentLampiranMode === 'III_SMK' &&
        /^V(?:I)?\.\d+\.?\s+CAPAIAN\s+PEMBELAJARAN\b/i.test(headingLine));

    const nextAfterHeading = (lines[i + consumedLines + 1] || '').replace(/\s+/g, ' ').trim();
    const detectedSub = extractSubjectHeadingFromLine(headingLine, isSmkKonsentrasiHeading, true, nextAfterHeading);

    if (detectedSub) {
      currentSubjectHeader = detectedSub;
      pendingSubjectPrePhaseLines = [];

      let lineTargets = detectHeadingTargetsFromLine(headingLine);

      const lookaheadIdx = i + consumedLines + 1;
      if ((!lineTargets || lineTargets.length === 0) && lookaheadIdx < lines.length) {
        const nextTrimmed = lines[lookaheadIdx].replace(/\s+/g, ' ').trim();
        const nextLineTargets = detectHeadingTargetsFromLine(nextTrimmed);
        if (nextLineTargets && nextLineTargets.length > 0 && !extractSubjectHeadingFromLine(nextTrimmed, false, true)) {
          lineTargets = nextLineTargets;
        }
      }

      if (currentLampiranMode === 'III_SMK') {
        currentTargets = ['SMK'];
      } else if (lineTargets && lineTargets.length > 0) {
        currentTargets = currentLampiranMode === 'II_GENERAL' ? lineTargets.filter((g) => g !== 'SMK') : lineTargets;
      } else if (inferPrimaryLevelFromSubject(currentSubjectHeader) === 'SMK') {
        currentTargets = ['SMK'];
      } else if (activeSectionTargets.length > 0) {
        const matchingActive = activeSectionTargets.filter((g) =>
          isSubjectAllowedForLevel(currentSubjectHeader, g)
        );
        currentTargets = matchingActive.length > 0 ? matchingActive : activeSectionTargets;
      } else {
        const inferred = inferPrimaryLevelFromSubject(currentSubjectHeader);
        const allowedForSub = (['SD', 'SMP', 'SMA', 'SMK'] as SchoolLevelGroup[]).filter((g) =>
          isSubjectAllowedForLevel(currentSubjectHeader, g)
        );
        currentTargets =
          allowedForSub.length === 1
            ? allowedForSub
            : inferred
              ? [getSchoolLevelGroup(inferred)]
              : [];
      }

      const allowedTargets = currentTargets.filter((grp) =>
        isSubjectAllowedForLevel(currentSubjectHeader, grp)
      );
      if (allowedTargets.length > 0) {
        flushPendingContextTo(allowedTargets);
        allowedTargets.forEach((grp) => {
          const lampTag =
            currentLampiranMode === 'III_SMK'
              ? 'LAMPIRAN III'
              : currentLampiranMode === 'II_GENERAL'
                ? 'LAMPIRAN II'
                : '';
          if (lampTag && buffers[grp].length === 0) {
            buffers[grp].push(lampTag);
          }
          buffers[grp].push(`CAPAIAN PEMBELAJARAN MATA PELAJARAN ${currentSubjectHeader}`);
          lastInjectedHeader[grp] = currentSubjectHeader;
        });
      }

      i += consumedLines;
      continue;
    }

    const lineTargetsRaw = detectHeadingTargetsFromLine(trimmed);
    const isStructuralPhaseOrLevelHeading =
      /^(?:#{1,4}\s*|\d+(?:\.\d+)*[\.\)]\s*|[IVXLCDM]+[\.\)]\s*|[A-Z][\.\)]\s*)?(?:pada\s+akhir\s+)?fase\s*[a-f]\b/i.test(
        trimmed
      ) ||
      /^(?:LAMPIRAN|CAPAIAN\s+PEMBELAJARAN\s+(?:UNTUK|PADA)|[IVXLCDM]+\.\s+(?:SD|SMP|SMA|SMK))/i.test(trimmed);

    // Keep Lampiran II/III context clean: do not let a pure "Pada akhir Fase E..." bleed out of active Lampiran II (SMA) into SMK
    const lineTargets =
      lineTargetsRaw && isStructuralPhaseOrLevelHeading
        ? currentLampiranMode === 'II_GENERAL'
          ? lineTargetsRaw.filter((g) => g !== 'SMK')
          : currentLampiranMode === 'III_SMK'
            ? (['SMK'] as SchoolLevelGroup[])
            : lineTargetsRaw
        : null;

    if (lineTargets && lineTargets.length > 0) {
      const isPureFaseSubheading =
        /^\s*(?:[A-Z0-9]+[\.\)]\s*)?(?:pada\s+akhir\s+)?fase\s*[a-f]\b/i.test(trimmed) ||
        /\bumumnya\s+untuk\s+kelas\b/i.test(trimmed);
      if (
        !isPureFaseSubheading &&
        /^(?:LAMPIRAN|CAPAIAN\s+PEMBELAJARAN\s+(?:UNTUK|PADA)|[IVXLCDM]+\.\s+(?:SD|SMP|SMA|SMK))/i.test(trimmed)
      ) {
        currentSubjectHeader = '';
        pendingSubjectPrePhaseLines = [];
        activeSectionTargets = lineTargets;
      }
      const allowedLineTargets = currentSubjectHeader
        ? lineTargets.filter((grp) => isSubjectAllowedForLevel(currentSubjectHeader, grp))
        : lineTargets;
      if (allowedLineTargets.length > 0) {
        currentTargets = allowedLineTargets;
        flushPendingContextTo(currentTargets);
        currentTargets.forEach((grp) => {
          if (currentSubjectHeader) {
            if (lastInjectedHeader[grp] !== currentSubjectHeader) {
              buffers[grp].push(`CAPAIAN PEMBELAJARAN MATA PELAJARAN ${currentSubjectHeader}`);
              lastInjectedHeader[grp] = currentSubjectHeader;
              if (pendingSubjectPrePhaseLines.length > 0) {
                buffers[grp].push(...pendingSubjectPrePhaseLines);
              }
            }
          }
          buffers[grp].push(line);
        });
      }
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
    } else if (currentSubjectHeader) {
      // Preserve Rasional / Karakteristik / Elemen Deskripsi lines before first Fase subheading
      pendingSubjectPrePhaseLines.push(line);
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
  phaseHint?: string,
  subjectHint?: string
): {
  level: SchoolLevel;
  subLevelLabel: string;
  grade: number;
  phase: string;
} {
  const source = text || '';
  const lower = source.toLowerCase();
  const subjectInferredLevel = inferPrimaryLevelFromSubject(subjectHint);

  let level: SchoolLevel = subjectInferredLevel || levelHint || 'SMA';
  let phase: string = phaseHint || '';
  let grade: number = Number(gradeHint) || 0;

  // Detect SMK/MAK program 4 tahun / Kelas 13 / SKKNI / Teaching Factory / Lampiran III section numbering
  const hasGrade13 = /\bkelas\s*(?:13|xiii)\b|program\s*4\s*tahun/i.test(lower);
  const hasSMK =
    /\bsmk\b|\bmak\b|kejuruan|program\s*(?:3|4)\s*tahun|\bskkni\b|\bkkni\b|teaching\s+factory|kevokasian|dunia\s+kerja|dunia\s+industri|konsentrasi\s+keahlian|program\s+keahlian|^V(?:I)?\.\d+\.?\s+CAPAIAN\s+PEMBELAJARAN/im.test(
      source
    );
  const hasSMA = /\bsma\b|\bma\b|paket\s*c/i.test(lower);
  const hasSMP = /\bsmp\b|\bmts\b|paket\s*b/i.test(lower);
  const hasSD = /\bsd\b|\bmi\b|paket\s*a|sekolah\s+dasar/i.test(lower);

  const hasExplicitTextLevel = hasSMK || hasSMA || hasSMP || hasSD || hasGrade13;

  if (hasSMK && !hasSMA) {
    level = 'SMK';
  } else if (hasSMA && !hasSMK) {
    level = 'SMA';
  } else if (hasSMK && hasSMA) {
    level = subjectInferredLevel === 'SMK' || subjectInferredLevel === 'SMA'
      ? subjectInferredLevel
      : levelHint === 'SMA'
        ? 'SMA'
        : 'SMK';
  } else if (hasGrade13) {
    level = 'SMK';
  } else if (hasSMP) {
    level = 'SMP';
  } else if (hasSD) {
    level = 'SD';
  }

  // Detect Phase explicitly (ignore incidental forward references like "melanjutkan pembelajaran pada Fase F")
  const explicitPhaseMatch =
    source.match(/(?:^|\n|\.)\s*(?:[A-Z0-9]+[\.\)]\s*)?(?:pada\s+akhir\s+)?fase\s*([A-F])\b/i) ||
    source.match(/\bfase\s*([A-F])\s*\(\s*umumnya\b/i) ||
    source.match(/\bpada\s+fase\s*([A-F])\s*,\s*(?:materi|pembelajaran|peserta|murid)\b/i);
  const phaseMatch =
    explicitPhaseMatch ||
    (/\bdasar[\s-]+dasar\b/i.test(subjectHint || '') ? null : source.match(/\bfase\s*([A-F])\b/i));
  if (phaseMatch && phaseMatch[1]) {
    const pLetter = phaseMatch[1].toUpperCase();
    phase = `Fase ${pLetter}`;
    if (!hasExplicitTextLevel) {
      if (pLetter === 'A' || pLetter === 'B' || pLetter === 'C') level = 'SD';
      else if (pLetter === 'D') level = 'SMP';
      else level = subjectInferredLevel || (hasGrade13 ? 'SMK' : levelHint === 'SMK' ? 'SMK' : 'SMA');
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
      else if (parsedG >= 10 && !hasSD && !hasSMP) {
        level = subjectInferredLevel === 'SMK' || subjectInferredLevel === 'SMA'
          ? subjectInferredLevel
          : hasSMK && !hasSMA
            ? 'SMK'
            : levelHint === 'SMK' && hasSMK
              ? 'SMK'
              : 'SMA';
      }
    }
  }

  // If text has NO explicit level/phase/grade indicators and a specific subject dictates phase/grade (e.g., Biologi -> SMA Fase F Kelas 11)
  if (!hasExplicitTextLevel && !phaseMatch && !gradeMatch && subjectHint) {
    if (subjectInferredLevel) {
      level = subjectInferredLevel;
    }
    const subDef = inferDefaultPhaseAndGradeForSubject(subjectHint, level);
    if (subDef) {
      phase = subDef.phase;
      grade = subDef.grade;
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

  // Enforce BSKAP phase/grade -> school level consistency
  if (phase === 'Fase A' || phase === 'Fase B' || phase === 'Fase C' || (grade >= 1 && grade <= 6 && !phaseMatch)) {
    if (!hasSMA && !hasSMK && !hasSMP) {
      level = 'SD';
    }
  } else if (phase === 'Fase D' || (grade >= 7 && grade <= 9 && !phaseMatch)) {
    if (!hasSMA && !hasSMK && !hasSD) {
      level = 'SMP';
    }
  } else if (grade === 13) {
    level = 'SMK';
  }

  // Ensure grade stays valid within finalized level
  if (level === 'SD' && (grade < 1 || grade > 6)) {
    grade = phase === 'Fase A' ? 1 : phase === 'Fase C' ? 5 : 4;
  } else if (level === 'SMP' && (grade < 7 || grade > 9)) {
    grade = 7;
  } else if ((level === 'SMA' || level === 'SMK') && (grade < 10 || grade > 13)) {
    const subDef = subjectHint ? inferDefaultPhaseAndGradeForSubject(subjectHint, level) : null;
    grade = subDef ? subDef.grade : phase === 'Fase F' ? 11 : 10;
  }

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
  /^(?:peserta\s+didik|murid|pada\s+akhir\s+fase|akhir\s+fase|capaian\s+(?:pembelajaran|kompetensi)|tujuan\s+pembelajaran|profil\s+pelajar|pelajar\s+pancasila|profil\s+lulusan|delapan\s+dimensi|keimanan|ketakwaan\s+terhadap|kewargaan|penalaran\s+kritis|dimensi|kurikulum|kemendikbud|kemendikdasmen|bskap|skkni\s+no|kkni|teaching\s+factory|project-based\s+learning|problem-based\s+learning|ini\s+membantu|menumbuhkembangkan|memiliki\s+rasa|memecahkan\s+suatu\s+masalah|rasa\s+ingin\s+tahu|berperan\s+aktif|mengerti\s+siapa\s+dirinya|semester\s*(?:1|2|i|ii|ganjil|genap)|alokasi\s+waktu|jenjang|kelas\s*\d+|fase\s*[a-f]|dengan\s+benar|secara\s+tepat|secara\s+mandiri|dalam\s+kehidupan\s+sehari[-\s]?hari|sehari[-\s]?hari|sesuai\s+kaidah|berbagai|beragam|beberapa|pembelajaran|asesmen|kompetensi|pemahaman\s+(?:konsep|biologi|fisika|kimia|sains|ipa|ips|ipas|sejarah|ekonomi|geografi|sosiologi)|keterampilan\s+proses|fenomena|temuan\s+ilmiah|hasil\s+praktikum|mengamati|mempertanyakan|memprediksi|mempertanyakan\s+dan\s+memprediksi|merencanakan|merencanakan\s+dan\s+melakukan\s+penyelidikan|memproses\s+dan\s+menganalisis\s+data|mengevaluasi|merefleksi|mengevaluasi\s+dan\s+refleksi|mengomunikasikan\s+hasil|penyelidikan|komponen\s+tambahan\s+mencakup|tidak\s+terbatas\s+pada|perubahan|bentuk|dasar|fungsi|materi|konsep|elemen|deskripsi|fakta|prinsip|hukum|teori|model|sains|sosial|analitis|kreatif|bermakna|definisi\s+dan\s+konsep|peran|tugas|tanggung\s+jawab)$/i;

const KNOWN_ELEMENT_NAMES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^pemahaman\s+(?:fisika|kimia|biologi|sains|ipa|ips|ipas|ekonomi|geografi|sejarah|sosiologi|antropologi|konsep)\b/i, label: 'Pemahaman Konsep' },
  { pattern: /^keterampilan\s+proses\b/i, label: 'Keterampilan Proses' },
  { pattern: /^menjelaskan\s+fenomena\s+secara\s+ilmiah\b/i, label: 'Menjelaskan Fenomena secara Ilmiah' },
  { pattern: /^menyusun\s+penyelidikan\s+ilmiah\b/i, label: 'Menyusun Penyelidikan Ilmiah' },
  { pattern: /^merefleksikan\s+data\s+dan\s+bukti/i, label: 'Merefleksikan Data dan Bukti-bukti secara Ilmiah' },
  { pattern: /^makhluk\s+hidup\s+dan\s+lingkungannya\b/i, label: 'Makhluk Hidup dan Lingkungannya' },
  { pattern: /^zat\s+dan\s+perubahannya\b/i, label: 'Zat dan Perubahannya' },
  { pattern: /^energi\s+dan\s+perubahannya\b/i, label: 'Energi dan Perubahannya' },
  { pattern: /^keruangan\s+dan\s+konektivitas\b/i, label: 'Keruangan dan Konektivitas Antarruang dan Antarwaktu' },
  { pattern: /^interaksi,\s*komunikasi,\s*sosialisasi\b/i, label: 'Interaksi, Komunikasi, Sosialisasi, Institusi & Dinamika Sosial' },
  { pattern: /^perilaku\s+ekonomi\s+dan\s+kesejahteraan\b/i, label: 'Perilaku Ekonomi dan Kesejahteraan' },
  { pattern: /^menyimak\b/i, label: 'Menyimak' },
  { pattern: /^membaca\s+dan\s+memirsa\b/i, label: 'Membaca dan Memirsa' },
  { pattern: /^berbicara\s+dan\s+mempresentasikan\b/i, label: 'Berbicara dan Mempresentasikan' },
  { pattern: /^menulis\b/i, label: 'Menulis' },
  { pattern: /^bilangan\b/i, label: 'Bilangan' },
  { pattern: /^aljabar\b/i, label: 'Aljabar' },
  { pattern: /^pengukuran\b/i, label: 'Pengukuran' },
  { pattern: /^geometri\b/i, label: 'Geometri' },
  { pattern: /^analisis\s+data\s+dan\s+peluang\b/i, label: 'Analisis Data dan Peluang' },
  { pattern: /^kalkulus\b/i, label: 'Kalkulus' },
  { pattern: /^pancasila\b/i, label: 'Pancasila' },
  { pattern: /^(?:uud|undang[-\s]+undang\s+dasar)\b/i, label: 'Undang-Undang Dasar Negara RI Tahun 1945' },
  { pattern: /^bhinneka\s+tunggal\s+ika\b/i, label: 'Bhinneka Tunggal Ika' },
  { pattern: /^(?:nkri|negara\s+kesatuan\s+republik\s+indonesia)\b/i, label: 'Negara Kesatuan Republik Indonesia' },
  { pattern: /^berpikir\s+komputasional\b/i, label: 'Berpikir Komputasional' },
  { pattern: /^(?:literasi\s+digital|teknologi\s+informasi\s+dan\s+komunikasi)\b/i, label: 'Literasi Digital' },
  { pattern: /^pemanfaatan\s+dan\s+pengembangan\s+kecerdasan\s+artifisial\b/i, label: 'Pemanfaatan & Pengembangan Kecerdasan Artifisial' },
  { pattern: /^literasi\s+dan\s+etika\s+kecerdasan\s+artifisial\b/i, label: 'Literasi & Etika Kecerdasan Artifisial' },
  { pattern: /^sistem\s+komputer\b/i, label: 'Sistem Komputer' },
  { pattern: /^jaringan\s+komputer\b/i, label: 'Jaringan Komputer dan Internet' },
  { pattern: /^analisis\s+data\b/i, label: 'Analisis Data' },
  { pattern: /^algoritma\s+dan\s+pemrograman\b/i, label: 'Algoritma dan Pemrograman' },
  { pattern: /^dampak\s+sosial\s+informatika\b/i, label: 'Dampak Sosial Informatika' },
  { pattern: /^praktik\s+lintas\s+bidang\b/i, label: 'Praktik Lintas Bidang' },
  { pattern: /^al[-\s]?qur['’`]?an\s+dan\s+hadis\b/i, label: "Al-Qur'an dan Hadis" },
  { pattern: /^akidah\b/i, label: 'Akidah' },
  { pattern: /^akhlak\b/i, label: 'Akhlak' },
  { pattern: /^fikih\b/i, label: 'Fikih' },
  { pattern: /^sejarah\s+peradaban\s+islam\b/i, label: 'Sejarah Peradaban Islam' },
  { pattern: /^mengalami\b/i, label: 'Mengalami' },
  { pattern: /^menciptakan\b/i, label: 'Menciptakan' },
  { pattern: /^merefleksikan\b/i, label: 'Merefleksikan' },
  { pattern: /^berpikir\s+dan\s+bekerja\s+artistik\b/i, label: 'Berpikir dan Bekerja Artistik' },
];

function stripDanglingBrackets(text: string): string {
  let out = (text || '').trim();
  const openParens = (out.match(/\(/g) || []).length;
  const closeParens = (out.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    out = out.replace(/\([^)]*$/, '').trim();
  } else if (closeParens > openParens) {
    out = out.replace(/^[^(]*\)/, '').trim();
  }
  return out;
}

function cleanCandidateTopicPhrase(raw: string): string {
  let cleaned = (raw || '')
    .replace(/^[•●\-*\d.)\s]+/, '')
    .replace(/^Bab\s*\d+\s*[:\-–.]?\s*/i, '')
    .replace(/\s+/g, ' ');

  const embeddedCue = cleaned.match(/\b(?:meliputi|mencakup|antara\s+lain|berupa|yakni|yaitu)\s+(.+)$/i);
  if (embeddedCue && embeddedCue[1]) {
    cleaned = embeddedCue[1];
  }

  cleaned = cleaned
    .replace(/^(?:kemampuan\s+)?(?:peserta\s+didik|murid)\s+(?:mampu\s+|dapat\s+|memiliki\s+kemampuan\s+)?/i, '')
    .replace(/^(?:fakta,\s*konsep,\s*prinsip,\s*hukum,\s*teori,\s*(?:dan|atau)\s*model(?:\s+(?:pada|terhadap)\s+materi)?|fakta,\s*konsep,\s*(?:dan\s+)?prinsip(?:\s+pada\s+materi)?|model\s+(?:pada|terhadap)\s+materi)\s*/i, '')
    .replace(/^(?:konsep|materi|topik|lingkup\s+materi|ruang\s+lingkup|tentang|mengenai|berupa|yakni|yaitu|meliputi|mencakup|antara\s+lain|seperti|serta|dan|atau|di\s+antaranya|terkait\s+dengan|termasuk\s+potensi|hingga|mengenal|memahami|menganalisis|menerapkan|mengidentifikasi|mengevaluasi|merancang|menjelaskan|mendeskripsikan|menggunakan|memanfaatkan|melakukan|mengamati|menyelidiki|mengaitkan|menyimpulkan|membedakan|mengenali|mengklasifikasikan|mengeksplorasi|mengoperasikan|mengembangkan|hubungan\s+antara|prinsip[-\s]+prinsip|mekanisme|proses(?:\s+terjadi)?|keterkaitan\s+antar(?:a)?|fenomena(?:\s+alam)?)\s+/i, '')
    .replace(/^(?:konsep|prinsip|materi|fakta|teori|model)\s+(?:pada\s+materi\s+)?/i, '')
    .replace(/\s+(?:dengan\s+demikian.*|yang\s+terjadi\s+di\s+dalamnya|untuk\s+merespons\s+stimulus[^,;.]*|dalam\s+kehidupan\s+sehari[-\s]?hari|sehari[-\s]?hari|sesuai\s+kaidah(?:\s+kerja\s+ilmiah)?|secara\s+(?:tepat|benar|mandiri|kritis|kreatif|kolaboratif|bermakna|sistematis|ilmiah|bijak)|untuk\s+memecahkan\s+masalah(?:\s+kontekstual)?|serta\s+penerapannya(?:\s+dalam\s+kehidupan)?|di\s+lingkungan\s+(?:sekitar|tempat\s+tinggal(?:\s+dan\s+sekolah)?)|pada\s+konteks\s+nyata|dengan\s+benar|secara\s+utuh|dengan\s+menggunakan\s+peta.*|sesuai\s+standar\s+yang.*|pada\s+berbagai\s+komponen.*|dari\s+masalah\s+yang.*)$/i, '')
    .replace(/\s+(?:yang|pada|di|dalam|dengan|untuk|seperti|dan|atau|serta|mencakup|meliputi|sehingga|agar)$/i, '');

  cleaned = stripDanglingBrackets(cleaned)
    .replace(/[.;:,"'()\[\]]+$/g, '')
    .replace(/^[.;:,"'()\[\]]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  if (/^(?:pada\s+tingkatan|ini\s+|yang\s+|dan\s+|dengan\s+|untuk\s+)/i.test(cleaned)) return '';
  if (/\b(?:pada\s+tingkatan\s+sekolah|profil\s+lulusan|profil\s+pelajar|capaian\s+kompetensi|beban\s+belajar|tahun\s+20\d{2}|skkni\s+no|mendorong\s+murid\s+untuk)\b/i.test(cleaned)) {
    return '';
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function splitEnumerationSegment(segment: string): string[] {
  if (!segment) return [];
  // Strip epistemic boilerplate ("fakta, konsep, prinsip, hukum, teori, dan model pada materi ...") BEFORE splitting by comma
  const withoutBoilerplate = segment.replace(
    /\b(?:fakta,\s*konsep,\s*prinsip,\s*hukum,\s*teori,\s*(?:dan|atau)\s*model(?:\s+(?:pada|terhadap)\s+materi)?|fakta,\s*konsep,\s*(?:dan\s+)?prinsip(?:\s+(?:pada|terhadap)\s+materi)?|sains\s+dan\s+sosial)\s*/gi,
    ' '
  );
  // Expand parenthetical lists cleanly (e.g. "metabolisme sel (enzim, katabolisme, anabolisme)" -> "metabolisme sel; enzim; katabolisme; anabolisme")
  const expanded = withoutBoilerplate.replace(/\(([^()]{3,80})\)/g, (_m, inner) => {
    return `, ${inner}`;
  });
  const normalized = expanded
    .replace(/\s+serta\s+/gi, '; ')
    .replace(/,\s*(?:dan|atau)\s+/gi, '; ')
    .replace(/\s+dan\s+(?=[A-Za-z])/gi, '; ')
    .replace(/[,;•●|]+/g, '; ');

  const parts = normalized
    .split(';')
    .map((p) => cleanCandidateTopicPhrase(p))
    .filter((p) => {
      if (p.length < 4 || p.length > 90) return false;
      const wordCount = p.split(/\s+/).length;
      if (wordCount > 9) return false;
      if (CP_FILLER_TOPIC_REGEX.test(p)) return false;
      if (/^(seperti|antara lain|yang|untuk|dalam|pada|dengan|dari|atau|serta|sesuai|tentang|sehingga|agar|melalui)$/i.test(p)) {
        return false;
      }
      return true;
    });

  return parts;
}

/**
 * Joins single PDF line wraps within prose paragraphs while keeping structural breaks clean,
 * so multi-line Indonesian sentences ("...meliputi struktur sel,\nbioproses dalam sel...") remain intact.
 */
function normalizeProseParagraphs(text: string): string {
  const lines = (text || '')
    .replace(/---\s*\[Halaman\s+\d+\]\s*---/gi, '\n')
    .replace(/\bLAMPIRAN\s+(?:I{1,3}V?|IV|V|\d+)\b[^\n]*/gi, '\n')
    .split(/\r?\n/);

  const merged: string[] = [];
  for (const raw of lines) {
    const t = raw.replace(/\s+/g, ' ').trim();
    if (!t) {
      merged.push('');
      continue;
    }
    if (
      /^(?:SALINAN|KEPUTUSAN\s+KEPALA|BADAN\s+STANDAR,|NOMOR\s+\d+\/|TENTANG|CAPAIAN\s+PEMBELAJARAN\s+PADA\s+PENDIDIKAN\s*$|ANAK\s+USIA\s+DINI,|DAN\s+JENJANG\s+PENDIDIKAN\s+MENENGAH$)/i.test(
        t
      )
    ) {
      continue;
    }
    const isStructuralStart =
      /^(?:[A-Z]\.\s|\d+(?:\.\d+)*\.\s|•|●|-|\*|\||#|Fase\s+[A-F]\b|Elemen\s+Deskripsi\b|Aspek\s+Deskripsi\b|Pada\s+akhir\s+Fase\b|CAPAIAN\s+PEMBELAJARAN)/i.test(
        t
      );
    if (merged.length > 0 && merged[merged.length - 1] !== '' && !isStructuralStart) {
      const prev = merged[merged.length - 1];
      if (!/[.:;?!]$/.test(prev) || /[,;]$/.test(prev)) {
        merged[merged.length - 1] = `${prev} ${t}`.replace(/\s+/g, ' ');
        continue;
      }
    }
    merged.push(t);
  }
  return merged.join('\n').trim();
}

/**
 * Focuses on C. Karakteristik + Elemen Deskripsi + D. Capaian Pembelajaran for Lingkup Materi,
 * stripping out A. Rasional & B. Tujuan attitudinal lists ("1. memiliki rasa kagum...").
 */
function isolateMaterialScopeSections(normalizedText: string): string {
  const withoutTujuan = normalizedText.replace(
    /(?:^|\n)B\.\s+Tujuan\b[\s\S]*?(?=(?:\n|^)[CD]\.\s+(?:Karakteristik|Capaian\s+Pembelajaran)\b|$)/gi,
    '\n'
  );
  const cOrDMatch = withoutTujuan.match(/(?:^|\n)[CD]\.\s+(?:Karakteristik|Capaian\s+Pembelajaran)\b[\s\S]*/i);
  if (cOrDMatch && cOrDMatch[0].trim().length >= 80) {
    return cOrDMatch[0].trim();
  }
  return withoutTujuan.trim();
}

function extractTopicsFromCPProse(text: string): string[] {
  const cleanText = normalizeProseParagraphs(text);
  if (!cleanText) return [];
  const focusedText = isolateMaterialScopeSections(cleanText);
  // Strip sentences explicitly describing "profil lulusan" dimensions so they don't pollute Bab/Materi
  const scopeText = focusedText.replace(/[^.\n]*(?:profil\s+(?:lulusan|pelajar\s+pancasila)|delapan\s+dimensi)[^.\n]*\.?/gi, ' ');

  const collected: string[] = [];
  const seenLower = new Set<string>();
  const addTopic = (candidate: string) => {
    const clean = cleanCandidateTopicPhrase(candidate);
    if (!clean || clean.length < 4 || clean.length > 90) return;
    if (clean.split(/\s+/).length > 9) return;
    if (CP_FILLER_TOPIC_REGEX.test(clean)) return;
    const key = clean.toLowerCase();
    for (const existing of seenLower) {
      if (existing === key) return;
      if (existing.includes(key) && key.length < existing.length) return;
    }
    seenLower.add(key);
    collected.push(clean);
  };

  // 1. Primary: Explicit scope cues ("meliputi ...", "mencakup ...", "materi X meliputi ...", "pada materi ...")
  const scopeCueRegex =
    /(?:meliputi|mencakup|pada\s+materi|tentang|mengenai|berupa|yakni|yaitu|terdiri\s+(?:atas|dari)|antara\s+lain|berkaitan\s+dengan|dalam\s+cakupan|ruang\s+lingkup(?:\s+materi)?|lingkup\s+materi|materi\s+(?:ajar|pokok|esensial)|pokok\s+bahasan)\s*[:\-–]?\s*([^.\n]{8,650})/gi;
  let cueMatch: RegExpExecArray | null;
  while ((cueMatch = scopeCueRegex.exec(scopeText)) !== null) {
    const seg = cueMatch[1] || '';
    const items = splitEnumerationSegment(seg);
    items.forEach(addTopic);
  }

  // 2. Semicolon-delimited BSKAP CP clauses inside D. Capaian Pembelajaran / Elemen Deskripsi
  if (scopeText.includes(';')) {
    const semiSegments = scopeText.split(';');
    if (semiSegments.length >= 2) {
      for (const seg of semiSegments) {
        if (/\b(?:mengaitkan|menerapkan|menganalisis|menjelaskan|menyimpulkan|membedakan|mengenali|mengklasifikasikan|memahami|mengevaluasi|merancang|menghitung|menyelesaikan|mengidentifikasi|mendeskripsikan)\b/i.test(seg)) {
          const strippedSeg = seg
            .replace(/^.*?\b(?:memiliki\s+kemampuan\s+sebagai\s+berikut\.?|pemahaman\s+\w+|keterampilan\s+proses)\s*/i, '')
            .replace(/^\d+(?:\.\d+)*\.?\s*/i, '')
            .trim();
          const cleaned = cleanCandidateTopicPhrase(strippedSeg);
          if (cleaned.length >= 5 && cleaned.length <= 90 && cleaned.split(/\s+/).length <= 9) {
            addTopic(cleaned);
          }
        }
      }
    }
  }

  // 3. Secondary: Verb + enumerated object if explicit scope cues yielded fewer than 4 topics
  if (collected.length < 4) {
    const verbCueRegex =
      /(?:memahami|menganalisis|mengidentifikasi|menerapkan|menguasai|mengoperasikan|mengevaluasi|merancang|menjelaskan|mendeskripsikan|mengembangkan|mengolah|menyusun|menyajikan|memecahkan|mengaitkan|menyimpulkan|membedakan|mengklasifikasikan)\s+(?:konsep|prinsip|materi|topik|struktur|sistem|fenomena|teks|metode|prosedur|proses)?\s*([^.\n]{8,420})/gi;
    let verbMatch: RegExpExecArray | null;
    while ((verbMatch = verbCueRegex.exec(scopeText)) !== null) {
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
  const normalized = normalizeProseParagraphs(text);
  const matches = normalized.match(
    /\b(?:mengamati|mengidentifikasi|menjelaskan|memahami|menganalisis|menerapkan|menyelidiki|merancang|mengevaluasi|mengembangkan|menciptakan|mengomunikasikan|menyajikan|mengolah|memecahkan|mengaitkan|menyimpulkan|membedakan|mengklasifikasikan)\s+[^.,;\n]{5,75}/gi
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

  // Prefer extracting element sections from C. Karakteristik / D. Capaian Pembelajaran (skip A. Rasional / B. Tujuan prose)
  const focusedSource = isolateMaterialScopeSections(cleanText);
  const sections: Array<{ name: string; body: string }> = [];
  const lines = focusedSource
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  let currentName = '';
  let currentBody: string[] = [];
  let inTujuanBlock = false;

  const flushSection = () => {
    if (currentName && currentBody.length > 0) {
      const joinedBody = currentBody.join(' ').replace(/\s+/g, ' ').trim();
      const dupIdx = sections.findIndex((s) => s.name.toLowerCase() === currentName.toLowerCase());
      if (dupIdx >= 0) {
        if (joinedBody.length > sections[dupIdx].body.length) {
          sections[dupIdx].body = joinedBody;
        }
      } else {
        sections.push({ name: currentName, body: joinedBody });
      }
    }
    currentName = '';
    currentBody = [];
  };

  for (const line of lines) {
    if (/^B\.\s+Tujuan\b/i.test(line)) {
      inTujuanBlock = true;
      continue;
    }
    if (/^[CD]\.\s+(?:Karakteristik|Capaian\s+Pembelajaran)\b/i.test(line)) {
      inTujuanBlock = false;
      continue;
    }
    if (inTujuanBlock) continue;
    if (/^(?:elemen\s+deskripsi|aspek\s+deskripsi)$/i.test(line)) {
      continue;
    }

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

    // Explicit header: "Elemen: Pemahaman Biologi" / "Elemen Berpikir Komputasional" (ignore prose "elemen ini mengacu...")
    const explicitElemen = line.match(/^(?:elemen\s*[:\-–]\s*|bagian\s+\w+\s*[:\-–]\s*)([A-Z].{2,69})$/i);
    if (explicitElemen && explicitElemen[1] && !/^(?:dan\s+deskripsi|ini\s+|tersebut|yang\s+)/i.test(explicitElemen[1]) && /^[A-Z]/.test(explicitElemen[1])) {
      flushSection();
      currentName = explicitElemen[1].replace(/[:\-–]+$/, '').trim();
      continue;
    }

    // Inline "Elemen Pemahaman Biologi: Peserta didik mampu..."
    const inlineElemen = line.match(/^(?:elemen\s+)?([A-Z][A-Za-z\s&/-]{3,45})\s*:\s*(.{20,})$/);
    if (inlineElemen && !/^(semester|kelas|fase|jenjang|mata\s+pelajaran|alokasi|tahun|catatan)/i.test(inlineElemen[1])) {
      flushSection();
      sections.push({ name: inlineElemen[1].trim(), body: inlineElemen[2].trim() });
      continue;
    }

    // BSKAP 2-col table row: "<Element Title> <Capitalized description...>"
    const twoColKnown = line.match(
      /^(Pemahaman\s+(?:Biologi|Fisika|Kimia|Sains|IPA|IPS|IPAS|Ekonomi|Geografi|Sejarah|Sosiologi|Antropologi)|Keterampilan\s+Proses|Menjelaskan\s+Fenomena\s+secara\s+Ilmiah|Menyusun\s+Penyelidikan\s+Ilmiah|Merefleksikan\s+Data\s+dan\s+Bukti-bukti\s+secara\s+Ilmiah|Makhluk\s+Hidup\s+dan\s+Lingkungannya|Zat\s+dan\s+Perubahannya|Energi\s+dan\s+Perubahannya|Keruangan\s+dan\s+Konektivitas(?:\s+Antarruang\s+dan\s+Antarwaktu)?|Perilaku\s+Ekonomi\s+dan\s+Kesejahteraan|Bilangan|Aljabar|Pengukuran|Geometri|Analisis\s+Data(?:\s+dan\s+Peluang)?|Kalkulus|Menyimak|Membaca\s+dan\s+Memirsa|Berbicara\s+dan\s+Mempresentasikan|Menulis|Pancasila|Bhinneka\s+Tunggal\s+Ika|Berpikir\s+Komputasional|Literasi\s+Digital|Pemanfaatan\s+dan\s+Pengembangan\s+Kecerdasan\s+Artifisial|Literasi\s+dan\s+Etika\s+Kecerdasan\s+Artifisial|Algoritma\s+dan\s+Pemrograman|Sistem\s+Komputer|Jaringan\s+Komputer\s+dan\s+Internet)\s+([A-Z].{15,})$/
    );
    if (twoColKnown) {
      flushSection();
      currentName = twoColKnown[1].trim();
      currentBody.push(twoColKnown[2].trim());
      continue;
    }

    // BSKAP numbered element inside "D. Capaian Pembelajaran" (e.g. "1. Pemahaman Biologi", "3.1. Berpikir Komputasional", "5. Tata suara televisi")
    const numberedElMatch = line.match(/^\d+(?:\.\d+)*\.\s+([A-Z][A-Za-z0-9\s,'’&/-]{3,65})$/);
    if (numberedElMatch && numberedElMatch[1] && !/^Fase\s+[A-F]\b/i.test(numberedElMatch[1])) {
      const elCandidate = numberedElMatch[1].trim();
      if (
        KNOWN_ELEMENT_NAMES.some((k) => k.pattern.test(elCandidate)) ||
        /^(?:pemahaman|keterampilan|menyimak|membaca|berbicara|menulis|menjelaskan|menyusun|merefleksikan|berpikir|literasi|algoritma|analisis|tata\s+|editing|penyiaran|manajemen|keselamatan|perawatan|gambar\s+teknik|kelistrikan|komponen)/i.test(
          elCandidate
        )
      ) {
        flushSection();
        currentName = elCandidate;
        continue;
      }
    }

    // Anchored uppercase-initial standalone known element header line (<= 7 words, no sentence punctuation)
    if (line.length <= 65 && line.split(/\s+/).length <= 7 && !/[.,;]$/.test(line) && /^[A-Z]/.test(line)) {
      const known = KNOWN_ELEMENT_NAMES.find((k) => k.pattern.test(line));
      if (known) {
        flushSection();
        currentName = known.label;
        continue;
      }
    }

    if (currentName) {
      currentBody.push(line);
    }
  }
  flushSection();

  if (sections.length === 0) {
    const foundNames: string[] = [];
    for (const k of KNOWN_ELEMENT_NAMES) {
      const labelRegex = new RegExp(`\\b${k.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (labelRegex.test(focusedSource) && !foundNames.includes(k.label)) {
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
          : [cleanCandidateTopicPhrase(sec.body.split(/[.,;]/)[0] || sec.name) || sec.name],
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
    // Skip BSKAP structural element headings like "1. Pemahaman Biologi", "2. Keterampilan Proses"
    if (/^(?:pemahaman\s+(?:biologi|fisika|kimia|sains|ipa|ips|ipas|sejarah|ekonomi|geografi|sosiologi)|keterampilan\s+proses|elemen|deskripsi)$/i.test(cleaned)) {
      return;
    }
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
  let insideTujuanSection = false;

  // PASS 1: Explicit Bab/Unit/Lingkup Materi/List/Table lines & Semester headings (skipping B. Tujuan bullets)
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    const lower = line.toLowerCase();

    if (/^B\.\s+Tujuan\b/i.test(line)) {
      insideTujuanSection = true;
      continue;
    }
    if (/^[ACD]\.\s+(?:Rasional|Karakteristik|Capaian\s+Pembelajaran)\b/i.test(line)) {
      insideTujuanSection = false;
      continue;
    }
    if (insideTujuanSection) {
      continue;
    }

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
      /^(?:bab\s*\d+|unit\s*\d+|modul\s*\d+|topik\s*\d+|lingkup\s+materi\s*\d*|pokok\s+bahasan\s*\d*|materi\s*(?:ajar|pokok|esensial)?\s*\d*|\d+[.)]|[-•●*])\s*[:\-–.]?\s*(.+)$/i
    );
    if (babMatch && babMatch[1]) {
      const candidate = babMatch[1].replace(/\s+/g, ' ').trim();
      const isInquiryBullet =
        /^(?:mengamati|mempertanyakan\s+dan\s+memprediksi|merencanakan\s+dan\s+melakukan\s+penyelidikan|memproses,\s*menganalisis|memproses\s+dan\s+menganalisis|mengevaluasi\s+dan\s+refleksi|mengomunikasikan\s+hasil)$/i.test(
          candidate
        );
      if (
        !isInquiryBullet &&
        candidate.length >= 4 &&
        candidate.length <= 120 &&
        candidate.split(/\s+/).length <= 10 &&
        !/^(semester|fase|kelas|alokasi|jenjang|mata\s+pelajaran|memiliki\s+rasa|memiliki\s+kemampuan|memahami\s+esensi|menumbuhkembangkan|mengerti\s+siapa|berperan\s+aktif|penanaman\s+etika|kontekstualisasi\s+pembelajaran|penanaman\s+konsep|praktik\s+mendalam)/i.test(
          candidate
        )
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
  } else if (sem1Topics.length > 0 && sem2Topics.length === 0 && sem1Topics.length >= 2) {
    const mid = Math.ceil(sem1Topics.length / 2);
    const moved = sem1Topics.splice(mid);
    sem2Topics.push(...moved);
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

  // Step 1: Discover explicit CP headings FIRST ("CAPAIAN PEMBELAJARAN BIOLOGI", etc.) without stale level filtering
  const rawHeadedSubjects = extractAllHeadedSubjectsFromText(combinedSource);
  const rawPatternSubjects: string[] = [];
  for (const entry of KNOWN_SUBJECT_PATTERNS) {
    if (entry.pattern.test(combinedSource)) {
      if (!rawPatternSubjects.includes(entry.canonical)) {
        rawPatternSubjects.push(entry.canonical);
      }
    }
  }

  const candidatePrimaryForLevel =
    rawHeadedSubjects[0] ||
    (params.subjectHint &&
    params.subjectHint.trim() &&
    params.subjectHint !== 'Mata Pelajaran Teridentifikasi' &&
    rawPatternSubjects.some((s) => s.toLowerCase() === params.subjectHint!.trim().toLowerCase())
      ? rawPatternSubjects.find((s) => s.toLowerCase() === params.subjectHint!.trim().toLowerCase())
      : rawPatternSubjects[0]) ||
    params.subjectHint;

  const meta = detectLevelPhaseGradeFromText(
    combinedSource,
    params.levelHint,
    params.gradeHint,
    params.phaseHint,
    candidatePrimaryForLevel
  );

  // Detect all subjects mentioned in raw text / filename (respecting SMA vs SMK vs SMP vs SD separation)
  const detectedSubjects = extractSubjectsFromCPText(combinedSource, meta.level);
  if (detectedSubjects.length === 0) {
    for (const s of rawHeadedSubjects) {
      if (isSubjectAllowedForLevel(s, meta.level) && !detectedSubjects.includes(s)) {
        detectedSubjects.push(s);
      }
    }
    for (const s of rawPatternSubjects) {
      if (isSubjectAllowedForLevel(s, meta.level) && !detectedSubjects.includes(s)) {
        detectedSubjects.push(s);
      }
    }
  }

  // Trust explicit CP document headings over stale UI hints!
  const allowedHeaded = rawHeadedSubjects.filter((s) => isSubjectAllowedForLevel(s, meta.level));
  const cleanHint = (params.subjectHint || '').trim();
  let primarySubject = '';
  if (allowedHeaded.length === 1) {
    primarySubject = allowedHeaded[0];
  } else if (allowedHeaded.length > 1) {
    primarySubject =
      (cleanHint && allowedHeaded.find((s) => s.toLowerCase() === cleanHint.toLowerCase())) ||
      allowedHeaded[0];
  } else if (detectedSubjects.length === 1) {
    primarySubject = detectedSubjects[0];
  } else if (detectedSubjects.length > 1) {
    primarySubject =
      (cleanHint && detectedSubjects.find((s) => s.toLowerCase() === cleanHint.toLowerCase())) ||
      detectedSubjects[0];
  } else {
    primarySubject =
      (cleanHint && cleanHint !== 'Mata Pelajaran Teridentifikasi' ? cleanHint : '') ||
      (meta.level === 'SMK' ? 'Dasar-Dasar Program Keahlian (SMK)' : 'Pendidikan Pancasila');
  }

  const totalHours = Number(params.totalHoursHint) || (meta.level === 'SD' ? 144 : 108);
  const jpPerWeek = Number(params.jpPerWeekHint) || (meta.level === 'SD' ? 4 : 3);

  // O(N) linear single-pass subject slicer so multi-hundred-subject PDFs (e.g. 1,168p BSKAP 046) parse in milliseconds
  const buildSubjectSectionMap = (rawSource: string, forceSmkContext: boolean): Map<string, string> => {
    const map = new Map<string, string>();
    if (!rawSource) return map;
    const lines = rawSource.split(/\r?\n/);
    let currentSub = '';
    let buf: string[] = [];
    let lastPageMarker = '';
    let activeLampiranMarker = '';

    const flush = () => {
      if (currentSub && buf.length > 0) {
        const key = currentSub.trim().toLowerCase();
        const snippet = buf.join('\n').trim();
        const prev = map.get(key);
        if (prev) {
          map.set(key, `${prev}\n${snippet}`);
        } else {
          map.set(key, snippet);
        }
      }
      buf = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.replace(/\s+/g, ' ').trim();
      if (/^---\s*\[Halaman\s+\d+\]\s*---$/i.test(trimmed)) {
        lastPageMarker = trimmed;
      } else if (/^LAMPIRAN\s+(?:I{1,3}V?|IV|V|\d+)\b/i.test(trimmed)) {
        activeLampiranMarker = trimmed;
      }
      const { headingLine, consumedLines } = tryJoinWrappedCPHeading(lines, i);
      const isCpExplicit = /^(?:#{1,4}\s*|(?:[IVXLCDM]{1,7}(?:\.\d+)*|\d+(?:\.\d+)*|[A-Z])(?:[\.\)]\s*|\s+))?(?:Capaian\s+Pembelajaran|CAPAIAN\s+PEMBELAJARAN|Mata\s+Pelajaran\s*[:\-–]|MATA\s+PELAJARAN\s*[:\-–])/.test(
        trimmed
      );
      if (isCpExplicit) {
        const isSmkHeading =
          forceSmkContext &&
          /^V(?:I)?\.\d+\.?\s+CAPAIAN\s+PEMBELAJARAN\b/i.test(headingLine);
        const nextAfterHeading = (lines[i + consumedLines + 1] || '').replace(/\s+/g, ' ').trim();
        const det = extractSubjectHeadingFromLine(headingLine, isSmkHeading, true, nextAfterHeading);
        if (det) {
          flush();
          currentSub = det;
          if (activeLampiranMarker) buf.push(activeLampiranMarker);
          if (lastPageMarker) buf.push(lastPageMarker);
          buf.push(headingLine);
          i += consumedLines;
          continue;
        }
      }
      if (currentSub) {
        buf.push(line);
      }
    }
    flush();
    return map;
  };

  const buildEntryForSubject = (
    subName: string,
    targetMeta: { level: SchoolLevel; subLevelLabel: string; grade: number; phase: string } = meta,
    sourceTextOverride?: string,
    siblingSubjects?: string[],
    preSlicedText?: string
  ): CPSubjectEntry => {
    const allSubs = siblingSubjects || detectedSubjects;
    const rawSource = sourceTextOverride !== undefined ? sourceTextOverride : params.rawText || '';
    const subjectRawText =
      preSlicedText !== undefined
        ? preSlicedText
        : sliceCPTextForSubject(rawSource, subName, allSubs);
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

    // Only supplement with preset fallback when NOT in strictDocumentOnly mode AND rawText lacks concrete topics
    const allowPresetFallback = !params.strictDocumentOnly && (params.rawText || '').trim().length < 200;
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
      /\bpilihan\s+(?:kejuruan|smk)|mata\s+pelajaran\s+pilihan\b|\bkoding\s+dan\s+kecerdasan\s+artifisial\b/i.test(subLowerForTag)
    ) {
      computedCategoryTag = 'Pilihan/Tingkat Lanjut';
    } else if (
      grpForTag === 'SMK' &&
      /\b(?:dasar[\s-]+dasar|konsentrasi\s+keahlian|kreativitas,\s*inovasi|projek\s+kreatif|pkk|praktik\s+kerja|pkl|kejuruan|produksi\s+dan\s+siaran|produksi\s+film|kimia\s+(?:analisis|industri|tekstil)|\(smk\))\b/i.test(subLowerForTag) &&
      !/projek\s+ipas|sejarah/i.test(subLowerForTag)
    ) {
      computedCategoryTag = 'Kejuruan/Konsentrasi';
    } else if (
      (grpForTag === 'SMA' && targetMeta.phase === 'Fase F' && !/pendidikan\s+agama|pancasila|bahasa\s+indonesia(?!\s+tingkat\s+lanjut)|matematika(?!\s+tingkat\s+lanjut)|bahasa\s+inggris(?!\s+tingkat\s+lanjut)|pjok|sejarah(?!\s+tingkat\s+lanjut)|seni/i.test(subLowerForTag)) ||
      /\btingkat\s+lanjut\b/i.test(subLowerForTag)
    ) {
      computedCategoryTag = 'Pilihan/Tingkat Lanjut';
    }

    const entryNotes: string[] = [];
    if (grpForTag === 'SD' && /ipas/i.test(subLowerForTag)) {
      entryNotes.push('Integrasi IPA & IPS (dimulai Fase B/C).');
    } else if (grpForTag === 'SD' && /bahasa\s+inggris/i.test(subLowerForTag)) {
      entryNotes.push('Dimulai pada Fase B (Kelas III–IV) ke Fase C.');
    } else if (/koding|kecerdasan\s+artifisial/i.test(subLowerForTag)) {
      entryNotes.push(
        grpForTag === 'SMK'
          ? 'Mata pelajaran pilihan/vokasional Koding & KA SMK/MAK (Fase E & F).'
          : 'Mata pelajaran pilihan Koding & Kecerdasan Artifisial dimulai Fase C (Kelas V–VI SD/MI).'
      );
    } else if (grpForTag === 'SMK' && /\bprogram\s*4\s*tahun\b|\bkelas\s*(?:13|xiii)\b|\bpkl\b|praktik\s+kerja/i.test(`${subjectRawText.slice(0, 1200)} ${subLowerForTag}`)) {
      entryNotes.push('Mencakup SMK Program 3 Tahun / 4 Tahun (hingga Kelas XIII).');
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
    siblingSubjects?: string[],
    sectionMap?: Map<string, string>
  ): CPSubjectEntry[] => {
    const allSubs = siblingSubjects || detectedSubjects;
    const preSliced = sectionMap?.get(subName.trim().toLowerCase());
    const subjectSlice = preSliced !== undefined ? preSliced : sliceCPTextForSubject(sourceText, subName, allSubs);
    if (!subjectSlice || subjectSlice.trim().length < 40) {
      return [buildEntryForSubject(subName, defaultMeta, sourceText, allSubs, subjectSlice || sourceText)];
    }

    const lines = subjectSlice.split(/\r?\n/);
    const prePhaseLines: string[] = [];
    const phaseBuffers = new Map<string, { grade: number; phase: string; lines: string[] }>();
    let activeKey = '';
    let activeIsExplicitNumberedPhase = false;
    const grp = getSchoolLevelGroup(defaultMeta.level);

    const resolvePhaseLineTarget = (line: string): { grade: number; phase: string; isNumberedPhaseHeading: boolean } | null => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length > 420) return null;
      const isNumberedPhaseHeading = /^(?:#{1,4}\s*|\d+(?:\.\d+)*[\.\)]\s*)?(?:pada\s+akhir\s+)?fase\s*[A-F]\s*(?:\(|$)/i.test(
        trimmed
      ) && !/^pada\s+akhir\s+fase\b/i.test(trimmed);
      const isPadaAkhirLine = /^pada\s+akhir\s+fase\s*[A-F]\b/i.test(trimmed);

      const gradeMatch = trimmed.match(/^(?:[A-Z0-9]+[\.\)]\s*|#{1,4}\s*)?kelas\s*(1[0-3]|[1-9]|xiii|xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/i);
      const faseMatch = trimmed.match(/^(?:[A-Z0-9]+[\.\)]\s*|#{1,4}\s*)?(?:pada\s+akhir\s+)?fase\s*([A-F])\b/i);
      if (!gradeMatch && !faseMatch) return null;

      let g = gradeMatch ? parseIndonesianGradeToken(gradeMatch[1]) : 0;
      const f = faseMatch ? `Fase ${faseMatch[1].toUpperCase()}` : '';

      // Guard against known BSKAP PDF typo (e.g. "3. Fase F" followed immediately by "Pada akhir Fase E...")
      if (isPadaAkhirLine && activeKey && activeIsExplicitNumberedPhase && f) {
        const activePhase = phaseBuffers.get(activeKey)?.phase || '';
        if (activePhase && f < activePhase) {
          return null;
        }
      }

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

      return { grade: g, phase: f || resolvePhaseByLevelAndGrade(defaultMeta.level, g), isNumberedPhaseHeading };
    };

    lines.forEach((line) => {
      const target = resolvePhaseLineTarget(line);
      if (target) {
        activeKey = `${target.phase}__${target.grade}`;
        activeIsExplicitNumberedPhase = target.isNumberedPhaseHeading;
        if (!phaseBuffers.has(activeKey)) {
          phaseBuffers.set(activeKey, { grade: target.grade, phase: target.phase, lines: [] });
        }
        phaseBuffers.get(activeKey)!.lines.push(line);
      } else if (activeKey && phaseBuffers.has(activeKey)) {
        phaseBuffers.get(activeKey)!.lines.push(line);
      } else {
        prePhaseLines.push(line);
      }
    });

    if (phaseBuffers.size >= 1) {
      const out: CPSubjectEntry[] = [];
      const sharedContext = prePhaseLines.join('\n').trim();
      phaseBuffers.forEach((blk) => {
        const blkBody = blk.lines.join('\n').trim();
        const combinedBlock = sharedContext && phaseBuffers.size === 1
          ? `${sharedContext}\n${blkBody}`
          : blkBody;
        if (combinedBlock.length >= 25) {
          const blkMeta = {
            level: defaultMeta.level,
            subLevelLabel: getSchoolLevelDisplay(defaultMeta.level, blk.grade).subLabel,
            grade: blk.grade,
            phase: blk.phase,
          };
          out.push(buildEntryForSubject(subName, blkMeta, combinedBlock, [subName], combinedBlock));
        }
      });
      if (out.length > 0) return out;
    }

    const fallbackSubMeta = inferDefaultPhaseAndGradeForSubject(subName, defaultMeta.level);
    const resolvedFallbackMeta = fallbackSubMeta
      ? {
          level: defaultMeta.level,
          subLevelLabel: getSchoolLevelDisplay(defaultMeta.level, fallbackSubMeta.grade).subLabel,
          grade: fallbackSubMeta.grade,
          phase: fallbackSubMeta.phase,
        }
      : defaultMeta;
    return [buildEntryForSubject(subName, resolvedFallbackMeta, subjectSlice, allSubs, subjectSlice)];
  };

  const levelSections = splitCPTextBySchoolLevel(params.rawText || '');
  let analyzedSubjects: CPSubjectEntry[] = [];

  if (levelSections.size >= 2) {
    levelSections.forEach((secText, grp) => {
      const secLevel = grp as SchoolLevel;
      const secSectionMap = buildSubjectSectionMap(secText, grp === 'SMK');
      const detectedSecMeta = detectLevelPhaseGradeFromText(secText.slice(0, 6000), secLevel);
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
        analyzedSubjects.push(...buildEntriesAcrossPhases(sub, secMeta, secText, secSubjects, secSectionMap));
      });
    });
  } else if (levelSections.size === 1) {
    const [[onlyGrp, onlyText]] = Array.from(levelSections.entries());
    const secLevel = (onlyGrp || meta.level) as SchoolLevel;
    const secSectionMap = buildSubjectSectionMap(onlyText, onlyGrp === 'SMK');
    const secSubjects = extractSubjectsFromCPText(`${params.fileName || ''}\n${onlyText}`, secLevel);
    const detectedSecMeta = detectLevelPhaseGradeFromText(onlyText.slice(0, 6000), secLevel, meta.grade, meta.phase, secSubjects[0] || primarySubject);
    const secMeta = {
      ...detectedSecMeta,
      level: secLevel,
      subLevelLabel: getSchoolLevelDisplay(secLevel, detectedSecMeta.grade).subLabel,
    };
    const targetList = secSubjects.length > 0 ? secSubjects : detectedSubjects.length > 0 ? detectedSubjects : [primarySubject];
    targetList.forEach((sub) => {
      analyzedSubjects.push(...buildEntriesAcrossPhases(sub, secMeta, onlyText, targetList, secSectionMap));
    });
  } else {
    const singleSectionMap = buildSubjectSectionMap(params.rawText || '', meta.level === 'SMK');
    const subjectListToAnalyze = detectedSubjects.length > 0 ? detectedSubjects : [primarySubject];
    subjectListToAnalyze.forEach((sub) => {
      analyzedSubjects.push(...buildEntriesAcrossPhases(sub, meta, params.rawText || '', subjectListToAnalyze, singleSectionMap));
    });
  }

  // Propagate SMK Irisan Fase (Lampiran III Bagian I. UMUM -> mengacu pada Lampiran II SMA Fase E & Fase F)
  const smkSectionText = levelSections.get('SMK') || '';
  const hasSmkGeneralReference =
    smkSectionText.length > 0 &&
    /I\.\s*UMUM[\s\S]{0,1200}mengacu\s+pada\s+lampiran\s+II/i.test(smkSectionText);
  if (hasSmkGeneralReference) {
    const irisanCanonicalSubjects = [
      'Pendidikan Agama Islam & Budi Pekerti',
      'Pendidikan Agama Kristen & Budi Pekerti',
      'Pendidikan Agama Katolik & Budi Pekerti',
      'Pendidikan Agama Hindu & Budi Pekerti',
      'Pendidikan Agama Buddha & Budi Pekerti',
      'Pendidikan Agama Khonghucu & Budi Pekerti',
      'Pendidikan Pancasila',
      'Bahasa Indonesia',
      'Matematika',
      'PJOK',
      'Seni Musik',
      'Seni Rupa',
      'Seni Teater',
      'Seni Tari',
      'Bahasa Inggris',
      'Informatika',
    ];
    const umBlockMatch = smkSectionText.match(/I\.\s*UMUM[\s\S]{0,1500}mengacu\s+pada\s+lampiran\s+II/i);
    const umBlockLower = (umBlockMatch?.[0] || '').toLowerCase();

    const smaEntriesBySub = new Map<string, CPSubjectEntry[]>();
    analyzedSubjects.forEach((e) => {
      if (isSameSchoolLevelGroup(e.level, 'SMA')) {
        const key = e.subject.trim().toLowerCase();
        if (!smaEntriesBySub.has(key)) smaEntriesBySub.set(key, []);
        smaEntriesBySub.get(key)!.push(e);
      }
    });

    const existingSmkKeys = new Set(
      analyzedSubjects
        .filter((e) => isSameSchoolLevelGroup(e.level, 'SMK'))
        .map((e) => `${e.subject.trim().toLowerCase()}__${(e.phase || '').toLowerCase()}__${Number(e.grade) || 0}`)
    );

    const irisanClones: CPSubjectEntry[] = [];
    irisanCanonicalSubjects.forEach((canon) => {
      const smaList = smaEntriesBySub.get(canon.toLowerCase()) || [];
      // Verify mention in I. UMUM block (fallback allow if pattern matches)
      const mentioned =
        umBlockLower.includes(canon.toLowerCase().replace(/\s*&.*$/, '')) ||
        (canon === 'PJOK' && umBlockLower.includes('jasmani')) ||
        smaList.length > 0;
      if (!mentioned) return;

      const phaseEFEntries = smaList.filter((e) => {
        const ph = (e.phase || '').toUpperCase();
        return ph.includes('FASE E') || ph.includes('FASE F');
      });
      phaseEFEntries.forEach((src) => {
        const k = `${canon.toLowerCase()}__${(src.phase || '').toLowerCase()}__${Number(src.grade) || 0}`;
        if (existingSmkKeys.has(k)) return;
        existingSmkKeys.add(k);
        irisanClones.push({
          ...src,
          id: src.id ? `${src.id}-smk-irisan` : `smk-irisan-${canon.toLowerCase().replace(/\s+/g, '-')}-${src.grade}`,
          level: 'SMK',
          subLevelLabel: getSchoolLevelDisplay('SMK', src.grade).subLabel,
          categoryTag: 'Umum/Wajib',
          locationRef: src.locationRef
            ? `Lampiran III (I. Umum) · Acuan ${src.locationRef}`
            : 'Lampiran III (I. Umum) · Acuan Lampiran II',
          specialNotes: `Irisan Fase ${src.phase} SMK/MAK: mengacu pada Lampiran II Kepka BSKAP No. 046/H/KR/2025.`,
        });
      });
    });

    if (irisanClones.length > 0) {
      analyzedSubjects = [...analyzedSubjects, ...irisanClones];
    }
  }

  if (analyzedSubjects.length === 0) {
    analyzedSubjects = [buildEntryForSubject(primarySubject)];
  }

  const primaryEntry =
    analyzedSubjects.find((a) => a.subject.toLowerCase() === primarySubject.toLowerCase()) ||
    analyzedSubjects[0];

  const finalMetaLevel = primaryEntry.level || meta.level;
  const finalMetaGrade = Number(primaryEntry.grade) || meta.grade;
  const finalMetaPhase = primaryEntry.phase || meta.phase;
  const finalMetaSubLabel = primaryEntry.subLevelLabel || meta.subLevelLabel;

  return {
    identifiedMetadata: {
      title: params.fileName || `Capaian Pembelajaran ${primaryEntry.subject}`,
      subject: primaryEntry.subject,
      level: finalMetaLevel,
      subLevelLabel: finalMetaSubLabel,
      phase: finalMetaPhase,
      grade: finalMetaGrade,
      totalHoursPerYear: primaryEntry.totalHoursPerYear || totalHours,
      jpPerWeek: primaryEntry.jpPerWeek || jpPerWeek,
    },
    extractedCpText: primaryEntry.cpText || '',
    elements: primaryEntry.elements || [],
    materialsSem1: primaryEntry.materialsSem1,
    materialsSem2: primaryEntry.materialsSem2,
    analyzedSubjects,
    executiveSummary: params.rawText?.trim()
      ? `Analisis CP Master untuk ${primaryEntry.subject} pada ${finalMetaSubLabel} (${finalMetaPhase} • Kelas ${finalMetaGrade}). Teridentifikasi ${primaryEntry.elements?.length || 1} Elemen CP dan ${primaryEntry.materialsSem1.length + primaryEntry.materialsSem2.length} Bab/lingkup materi ajar spesifik Semester 1 & 2 sesuai dokumen CP.`
      : `Capaian Pembelajaran resmi mata pelajaran ${primaryEntry.subject} ${finalMetaSubLabel} (${finalMetaPhase} - Kelas ${finalMetaGrade}).`,
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
    if (
      grp === 'SMK' &&
      /\b(?:dasar[\s-]+dasar|konsentrasi|kreativitas,\s*inovasi|projek\s+kreatif|pkk|praktik\s+kerja|pkl|kejuruan|produksi\s+dan\s+siaran|produksi\s+film|kimia\s+(?:analisis|industri|tekstil)|\(smk\))\b/i.test(
        subL
      ) &&
      !/projek\s+ipas|sejarah/i.test(subL)
    ) {
      return 'Kejuruan/Konsentrasi';
    }
    if (
      (grp === 'SMA' &&
        (entry.phase || '').toUpperCase().includes('F') &&
        !/pendidikan\s+agama|pancasila|bahasa\s+indonesia(?!\s+tingkat\s+lanjut)|matematika(?!\s+tingkat\s+lanjut)|bahasa\s+inggris(?!\s+tingkat\s+lanjut)|pjok|sejarah(?!\s+tingkat\s+lanjut)|seni/i.test(
          subL
        )) ||
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


