import { ActiveMasterCPData, CPMaterialItem, CPSubjectEntry, SchoolLevel } from '../types';

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
  const upper = `${level || ''} ${textHint || ''}`.toUpperCase();
  if (/\bSMK\b|\bMAK\b|KEJURUAN|PROGRAM\s*4\s*TAHUN|KELAS\s*13\b/.test(upper)) return 'SMK';
  if (/\bSMP\b|\bMTS\b|PAKET\s*B|\bFASE\s*D\b/.test(upper)) return 'SMP';
  if (/\bSD\b|\bMI\b|PAKET\s*A|\bFASE\s*[ABC]\b/.test(upper)) return 'SD';
  if (/\bSMA\b|\bMA\b|PAKET\s*C|\bFASE\s*[EF]\b/.test(upper)) return 'SMA';
  const exact = (level || '').trim().toUpperCase();
  if (exact === 'SD' || exact === 'SMP' || exact === 'SMA' || exact === 'SMK') {
    return exact as SchoolLevel;
  }
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
    /\(smk\)|\(mak\)|dasar[\s-]+dasar\s+(?:program\s+|bidang\s+)?(?:keahlian|teknik|layanan|agribisnis|akuntansi|manajemen|pemasaran|perhotelan|kuliner|busana|desain|kriya|seni\s+pertunjukan|pekerjaan\s+sosial|nautika|teknika|usaha)|konsentrasi\s+keahlian|projek\s+ipas|projek\s+kreatif\s+dan\s+kewirausahaan|\bpkk\b|\bpkl\b|praktik\s+kerja\s+lapangan|pilihan\s+kejuruan/i.test(
      s
    );
  const isSmaOnlyName =
    /\(sma\)|\(paket\s*c\)|\bfisika\b|\bkimia\b|\bbiologi\b|\bgeografi\b|\bekonomi\b|\bsosiologi\b|\bantropologi\b|tingkat\s+lanjut|\bbahasa\s+jerman\b|\bbahasa\s+perancis\b|\bbahasa\s+prancis\b|\bprakarya\s*(?:&|dan)\s*kewirausahaan\b|\bpkwu\b/i.test(
      s
    );
  const isSdOnlyIpas = s === 'ipas' || s === 'ilmu pengetahuan alam dan sosial';
  const isSmpOnlyIpaIps =
    s === 'ipa' ||
    s === 'ips' ||
    s === 'ilmu pengetahuan alam' ||
    s === 'ilmu pengetahuan sosial';
  const isSecondarySejarah = s === 'sejarah';
  const isSmpPrakarya = s === 'prakarya' || /^prakarya\s*:/i.test(s);

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
  { pattern: /\bpendidikan\s+agama\s+islam\b|\bpai\b/i, canonical: 'Pendidikan Agama Islam & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+kristen\b/i, canonical: 'Pendidikan Agama Kristen & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+katolik\b/i, canonical: 'Pendidikan Agama Katolik & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+hindu\b/i, canonical: 'Pendidikan Agama Hindu & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+buddha\b/i, canonical: 'Pendidikan Agama Buddha & Budi Pekerti' },
  { pattern: /\bpendidikan\s+agama\s+khonghucu\b/i, canonical: 'Pendidikan Agama Khonghucu & Budi Pekerti' },
  { pattern: /\bpendidikan\s+kepercayaan\b/i, canonical: 'Pendidikan Kepercayaan Terhadap Tuhan YME' },
  { pattern: /\bpendidikan\s+agama\b|\bpabp\b/i, canonical: 'Pendidikan Agama & Budi Pekerti' },
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
  { pattern: /\bkimia\b/i, canonical: 'Kimia', preferredGroup: 'SMA' },
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
  { pattern: /\bprojek\s+kreatif\s+dan\s+kewirausahaan\b|\bpkk\s*(?:smk|mak)?\b/i, canonical: 'Projek Kreatif dan Kewirausahaan (PKK SMK)', preferredGroup: 'SMK' },
  { pattern: /\bpraktik\s+kerja\s+lapangan\b|\bpkl\s*(?:smk|mak)?\b/i, canonical: 'Praktik Kerja Lapangan (PKL SMK)', preferredGroup: 'SMK' },
  { pattern: /\bprakarya\s*(?:&|dan)\s*kewirausahaan\b|\bpkwu\b/i, canonical: 'Prakarya & Kewirausahaan', preferredGroup: 'SMA' },
  { pattern: /\bprakarya\b(?:\s*[:\-–]\s*(?:budi\s*daya|kerajinan|pengolahan|rekayasa))?/i, canonical: 'Prakarya', preferredGroup: 'SMP' },
  { pattern: /\bpendidikan\s+digital\b/i, canonical: 'Pendidikan Digital', preferredGroup: 'SMA' },
  { pattern: /\bdasar[\s-]+dasar\s+teknik\s+jaringan\s+komputer/i, canonical: 'Dasar-Dasar Teknik Jaringan Komputer & Telekomunikasi (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+pengembangan\s+perangkat\s+lunak/i, canonical: 'Dasar-Dasar Pengembangan Perangkat Lunak & Gim (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+teknik\s+otomotif\b/i, canonical: 'Dasar-Dasar Teknik Otomotif (SMK)', preferredGroup: 'SMK' },
  { pattern: /\bdasar[\s-]+dasar\s+teknik\s+mesin\b/i, canonical: 'Dasar-Dasar Teknik Mesin (SMK)', preferredGroup: 'SMK' },
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

/**
 * Extracts explicit subject headings declared inside CP documents (e.g. "CAPAIAN PEMBELAJARAN MATA PELAJARAN FISIKA",
 * "Mata Pelajaran: Matematika Tingkat Lanjut", numbered BSKAP subject headers) plus known BSKAP patterns.
 */
export function extractSubjectsFromCPText(
  sourceText: string,
  targetLevel: SchoolLevel | string
): string[] {
  const detected: string[] = [];
  const pushUnique = (sub: string) => {
    const clean = (sub || '').trim().replace(/^[:\-–.\s]+|[:\-–.\s]+$/g, '');
    if (!clean || clean.length < 3 || clean.length > 70) return;
    if (!isSubjectAllowedForLevel(clean, targetLevel)) return;
    if (!detected.some((d) => d.toLowerCase() === clean.toLowerCase())) {
      detected.push(clean);
    }
  };

  // 1. Check KNOWN_SUBJECT_PATTERNS against full text/filename
  for (const entry of KNOWN_SUBJECT_PATTERNS) {
    if (entry.pattern.test(sourceText || '')) {
      pushUnique(entry.canonical);
    }
  }

  // 2. Scan explicit CP headings ("Capaian Pembelajaran Mata Pelajaran X", "Mata Pelajaran: X", "## X")
  const lines = (sourceText || '').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length > 100) continue;

    const cpHeadingMatch = line.match(
      /^(?:#{1,4}\s*|\d+[\.\)]\s*|[A-Z][\.\)]\s*)?(?:capaian\s+pembelajaran\s+(?:mata\s+pelajaran\s+)?|mata\s+pelajaran\s*[:\-–]\s*)([A-Za-z0-9\s,&()/.-]{3,65})$/i
    );
    if (cpHeadingMatch && cpHeadingMatch[1]) {
      let candidate = cpHeadingMatch[1]
        .replace(/\b(?:sma|smk|ma|mak|smp|mts|sd|mi|paket\s*[abc]|fase\s*[a-f]|kelas\s*\d+(?:\s*[-–]\s*\d+)?|kurikulum\s+merdeka)\b.*/i, '')
        .replace(/[()]/g, '')
        .trim();
      if (
        candidate.length >= 3 &&
        !/^(?:umum|rasional|tujuan|karakteristik|elemen|pendahuluan|capaian|pembelajaran|semester|bab|unit|kelas|fase|sekolah\s+dasar|sekolah\s+menengah(?:\s+(?:pertama|atas|kejuruan))?|madrasah(?:\s+(?:ibtidaiyah|tsanawiyah|aliyah(?:\s+kejuruan)?))?|keputusan|lampiran|nomor|peserta\s+didik|kurikulum|kemendikbud|kemendikdasmen|bskap)$/i.test(
          candidate
        )
      ) {
        // Normalize via known patterns if matched
        const knownMatch = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(candidate));
        pushUnique(knownMatch ? knownMatch.canonical : candidate);
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

  // Try to locate a header occurrence for this subject
  const headerRegex = new RegExp(
    `(?:capaian\\s+pembelajaran\\s+(?:mata\\s+pelajaran\\s+)?|mata\\s+pelajaran\\s*[:\\-]\\s*|\\n\\s*(?:\\d+\\.|[A-Z]\\.|#{1,4})\\s*)${subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'i'
  );
  const headerMatch = headerRegex.exec(rawText);
  const startIdx = headerMatch ? headerMatch.index : lower.indexOf(subLower);
  if (startIdx < 0) return rawText;

  // Find earliest header/occurrence of any OTHER subject after startIdx + subjectName.length
  let endIdx = rawText.length;
  const searchFrom = startIdx + Math.max(subjectName.length, 25);
  for (const other of allSubjects) {
    if (other.toLowerCase() === subLower) continue;
    const otherHeaderRegex = new RegExp(
      `(?:capaian\\s+pembelajaran\\s+(?:mata\\s+pelajaran\\s+)?|mata\\s+pelajaran\\s*[:\\-]\\s*|\\n\\s*(?:\\d+\\.|[A-Z]\\.|#{1,4})\\s*)${other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
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
    const key = `${entry.subject.trim().toLowerCase()}__${getSchoolLevelGroup(entry.level)}`;
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
  if (!trimmed || trimmed.length > 150) return null;
  const isHeadingLine =
    /^(?:#{1,4}\s*|\d+[\.\)]\s*|[A-Z][\.\)]\s*)?(?:jenjang|tingkat\s+sekolah|bagian|capaian\s+pembelajaran|sekolah|madrasah|program)/i.test(
      trimmed
    ) || /^(?:\d+[\.\)]\s*|[A-Z][\.\)]\s*|•\s*)?fase\s*[a-f]\b/i.test(trimmed);

  if (!isHeadingLine) return null;

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
    if (/\bfase\s*f\b/i.test(trimmed)) return ['SMA'];
    if (/\bfase\s*e\b/i.test(trimmed)) return ['SMA', 'SMK'];
    return null;
  }
  return targets;
}

function extractSubjectHeadingFromLine(trimmed: string): string | null {
  if (!trimmed || trimmed.length > 120) return null;
  const cpHeadingMatch = trimmed.match(
    /^(?:#{1,4}\s*|\d+[\.\)]\s*|[A-Z][\.\)]\s*|[IVXLCDM]+[\.\)]\s*)?(?:capaian\s+pembelajaran\s+(?:mata\s+pelajaran\s+)?|mata\s+pelajaran\s*[:\-–]\s*)([A-Za-z0-9\s,&()/.-]{3,80})$/i
  );
  if (cpHeadingMatch && cpHeadingMatch[1]) {
    const candidate = cpHeadingMatch[1]
      .replace(/\b(?:sma|smk|ma|mak|smp|mts|sd|mi|paket\s*[abc]|fase\s*[a-f]|kelas\s*\d+(?:\s*[-–]\s*\d+)?|kurikulum\s+merdeka)\b.*/i, '')
      .replace(/[()]/g, '')
      .trim();
    if (
      candidate.length >= 3 &&
      !/^(?:umum|rasional|tujuan|karakteristik|elemen|pendahuluan|capaian|pembelajaran|semester|bab|unit|kelas|fase|setiap\s+fase|sekolah\s+dasar|sekolah\s+menengah(?:\s+(?:pertama|atas|kejuruan))?|madrasah(?:\s+(?:ibtidaiyah|tsanawiyah|aliyah(?:\s+kejuruan)?))?|keputusan|lampiran|nomor|peserta\s+didik|kurikulum|kemendikbud|kemendikdasmen|bskap)$/i.test(
        candidate
      )
    ) {
      const known = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(candidate));
      return known ? known.canonical : candidate;
    }
  }

  // Also match standalone short section titles ("## Bahasa Indonesia", "1. Matematika", "I. Pendidikan Pancasila")
  const numberedHeading = trimmed.match(/^(?:#{1,4}\s*|\d+[\.\)]\s*|[A-Z][\.\)]\s*|[IVXLCDM]+[\.\)]\s*)(.{3,70})$/);
  const candidateBody = (numberedHeading ? numberedHeading[1] : trimmed).trim();
  if (
    candidateBody.length <= 70 &&
    candidateBody.split(/\s+/).length <= 8 &&
    !/^(?:elemen|rasional|tujuan|karakteristik|bab|unit|semester|fase|kelas)\b/i.test(candidateBody)
  ) {
    const cleanBody = candidateBody.replace(/[:\-–.]+$/, '').trim();
    const known = KNOWN_SUBJECT_PATTERNS.find((p) => p.pattern.test(cleanBody));
    if (known && (numberedHeading || cleanBody.toLowerCase() === known.canonical.toLowerCase())) {
      return known.canonical;
    }
  }
  return null;
}

/**
 * Splits a multi-level CP document into sections keyed by SchoolLevelGroup ('SD' | 'SMP' | 'SMA' | 'SMK').
 * Handles BOTH Level-First ("JENJANG SD ... JENJANG SMP ...") AND Subject-First / Phase-Inside BSKAP CP documents
 * ("CAPAIAN PEMBELAJARAN MATA PELAJARAN X" -> "Fase A (SD) ... Fase D (SMP) ... Fase E (SMA/MA & SMK/MAK) ...").
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
  let currentSubjectHeader = '';
  let lastInjectedHeader: Record<SchoolLevelGroup, string> = {
    SD: '',
    SMP: '',
    SMA: '',
    SMK: '',
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const detectedSub = extractSubjectHeadingFromLine(trimmed);
    if (detectedSub) {
      currentSubjectHeader = detectedSub;
      // Reset active phase targets when entering a brand new Subject block in subject-first docs,
      // UNLESS the subject heading line itself explicitly names a level (e.g. "... SMK/MAK")
      const lineTargets = detectHeadingTargetsFromLine(trimmed);
      currentTargets = lineTargets && lineTargets.length > 0 ? lineTargets : [];
      currentTargets.forEach((grp) => {
        if (isSubjectAllowedForLevel(currentSubjectHeader, grp)) {
          buffers[grp].push(line);
          lastInjectedHeader[grp] = currentSubjectHeader;
        }
      });
      continue;
    }

    const lineTargets = detectHeadingTargetsFromLine(trimmed);
    if (lineTargets && lineTargets.length > 0) {
      // Narrow if document is strictly single-level SMK or SMA
      currentTargets = lineTargets;
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
  const cleanText = (text || '').replace(/\r/g, ' ').trim();
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
  const cleanText = (rawText || '').trim();
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
  const cleanText = (rawText || '').trim();
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

    // Supplement ONLY if raw CP text lacked enough extracted materials
    if ((sem1.length === 0 || sem2.length === 0) && params.getFallbackPreset) {
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

    return {
      subject: subName,
      level: targetMeta.level,
      subLevelLabel: targetMeta.subLevelLabel,
      grade: targetMeta.grade,
      phase: targetMeta.phase,
      jpPerWeek: effJp,
      totalHoursPerYear: effHours,
      cpText: cpSummary || `Capaian Pembelajaran ${subName} ${targetMeta.level} (${targetMeta.phase} - Kelas ${targetMeta.grade}).`,
      elements,
      materialsSem1: sem1,
      materialsSem2: sem2,
    };
  };

  const levelSections = splitCPTextBySchoolLevel(params.rawText || '');
  let analyzedSubjects: CPSubjectEntry[] = [];

  if (levelSections.size >= 2) {
    levelSections.forEach((secText, grp) => {
      const secLevel = grp as SchoolLevel;
      const secMeta = detectLevelPhaseGradeFromText(secText, secLevel);
      const secSubjects = extractSubjectsFromCPText(secText, secLevel);
      secSubjects.forEach((sub) => {
        analyzedSubjects.push(buildEntryForSubject(sub, secMeta, secText, secSubjects));
      });
    });
  } else if (levelSections.size === 1) {
    const [[onlyGrp, onlyText]] = Array.from(levelSections.entries());
    const secLevel = (onlyGrp || meta.level) as SchoolLevel;
    const secMeta = detectLevelPhaseGradeFromText(onlyText, secLevel, meta.grade, meta.phase);
    const secSubjects = extractSubjectsFromCPText(`${params.fileName || ''}\n${onlyText}`, secLevel);
    const targetList = secSubjects.length > 0 ? secSubjects : detectedSubjects.length > 0 ? detectedSubjects : [primarySubject];
    targetList.forEach((sub) => {
      analyzedSubjects.push(buildEntryForSubject(sub, secMeta, onlyText, targetList));
    });
  } else {
    const subjectListToAnalyze = detectedSubjects.length > 0 ? detectedSubjects : [primarySubject];
    analyzedSubjects = subjectListToAnalyze.map((sub) => buildEntryForSubject(sub));
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
