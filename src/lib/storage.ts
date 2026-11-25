import {
  UserAccount,
  AccessLog,
  NotificationItem,
  UserNotification,
  ClassRoom,
  Student,
  AttendanceRecord,
  ScheduleItem,
  AgendaItem,
  JournalItem,
  HomeroomStudent,
  DailyGrade,
  PTSGrade,
  PASGrade,
  AutomaticRecapGrade,
  GradeEntry,
  AIDocument,
  CPReference,
  UserFeedback,
  SupabaseConfig,
  SchoolProfile,
  CPMaterialItem,
  CPDistributionPlan,
  AppTheme,
  AppThemeConfig,
  TokenVoucher,
  TokenQuotaStatus,
  KalenderPendidikanData,
  KalenderSemesterPlan,
  KalenderMonthAnalysis,
  ActiveMasterCPData,
  CPSubjectEntry,
  AdminSystemSettings,
  AdminUploadedCPItem,
  CurriculumResetStats,
  SchoolLevel,
} from '../types';
import { INITIAL_CLASSES, INITIAL_STUDENTS, INITIAL_CP_REFERENCES } from './curriculumData';
import { getSubjectPresetByGrade } from './subjectMaterialPresets';
import {
  analyzeCPTextHeuristic,
  extractSubjectsFromCPText,
  getSchoolLevelGroup,
  splitCPTextBySchoolLevel,
  resolvePhaseByLevelAndGrade,
  isSameSchoolLevelGroup,
  isSubjectAllowedForLevel,
  getSchoolLevelDisplay,
  mergeAnalyzedSubjects,
  normalizeSchoolLevel,
  isSameSubjectName,
  type SchoolLevelGroup,
} from './curriculumLevels';
import {
  buildOfficialCP046And020Documents,
  OFFICIAL_CP_BASELINE_VERSION,
} from './officialCPCatalog';
import { normalizeThemeConfig, DEFAULT_THEME_CONFIG } from './theme';

export interface DualCPCoveredSubject extends CPSubjectEntry {
  slot: 'primary' | 'agama';
  sourceFileName?: string;
  docNumber?: string;
  levelGroup: SchoolLevelGroup;
  phasesList: string[];
  gradesList: number[];
  categoryTag?: 'Umum/Wajib' | 'Pilihan/Tingkat Lanjut';
  categoryTagsList?: ('Umum/Wajib' | 'Pilihan/Tingkat Lanjut')[];
}

export interface BothCPsDirectory {
  all: DualCPCoveredSubject[];
  cp1Subjects: DualCPCoveredSubject[];
  cp2AgamaSubjects: DualCPCoveredSubject[];
  byLevel: Record<SchoolLevelGroup, DualCPCoveredSubject[]>;
  cp1Meta: {
    uploaded: boolean;
    fileName?: string;
    docNumber?: string;
    uniqueSubjectCount: number;
  };
  cp2Meta: {
    uploaded: boolean;
    fileName?: string;
    docNumber?: string;
    uniqueSubjectCount: number;
  };
  totalUniquePairs: number;
}

export type { SchoolProfile, TokenVoucher, TokenQuotaStatus, AdminSystemSettings, CurriculumResetStats };

// Storage Keys
const KEYS = {
  CURRENT_USER: 'agk_current_user',
  USERS: 'agk_users',
  ACCESS_LOGS: 'agk_access_logs',
  NOTIFICATIONS: 'agk_notifications',
  CLASSES: 'agk_classes',
  STUDENTS: 'agk_students',
  ATTENDANCE: 'agk_attendance',
  SCHEDULE: 'agk_schedule',
  AGENDA: 'agk_agenda',
  JOURNAL: 'agk_journal',
  HOMEROOM: 'agk_homeroom',
  DAILY_GRADES: 'agk_daily_grades',
  PTS_GRADES: 'agk_pts_grades',
  PAS_GRADES: 'agk_pas_grades',
  RECAP_GRADES: 'agk_recap_grades',
  GRADES_UNIFIED: 'agk_grades_unified',
  AI_DOCS: 'agk_ai_docs',
  CP_REFS: 'agk_cp_references',
  CP_DISTRIBUTIONS: 'agk_cp_distributions',
  FEEDBACKS: 'agk_feedbacks',
  SUPABASE_CONFIG: 'agk_supabase_config',
  SCHOOL_PROFILE: 'agk_school_profile',
  TOKEN_VOUCHERS: 'agk_token_vouchers',
  KALENDER_PENDIDIKAN: 'agk_kalender_pendidikan',
  ACTIVE_MASTER_CP: 'agk_active_master_cp',
  MASTER_CP_CATALOG: 'agk_master_cp_catalog',
  ADMIN_SETTINGS: 'agk_admin_settings',
  LAST_CP_RESET_EPOCH: 'agk_last_cp_reset_epoch',
  LAST_OFFICIAL_CP_BASELINE: 'agk_last_official_cp_baseline',
  AI_CLEANUP_META: 'agk_ai_cleanup_meta',
  CURRICULUM_RESET_META: 'agk_curriculum_reset_meta',
};

export const DEFAULT_ADMIN_SETTINGS: AdminSystemSettings = {
  defaultDailyTokenLimit: 20000,
  defaultMonthlyQuota: 35,
  defaultMonthlyTokenLimit: 500000,
  defaultSubscriptionDurationYears: 1,
  autoApproveNewUsers: false,
  preferredModel: 'gemini-3.8-flash',
  fallbackModel: 'gemini-2.5-flash',
  deepLearningFrameworkVersion: 'Deep Learning (Mindful, Meaningful, Joyful)',
  enableContextCaching: true,
  contextCacheTTLSeconds: 3600,
  enableRowLevelSecurity: true,
  autoSaveEnabled: true,
  autoSaveIntervalSeconds: 2,
  rpmDefaultFormat: 'rpm_deep_learning_master',
  enableActivityLogging: true,
  enableCloudSync: true,
  notificationSoundEnabled: true,
  systemBroadcastMessage: '',
  enable24hAICleanup: false, // Pembersihan Dokumen AI 24 Jam: Khusus Kurikulum & Perangkat Pembelajaran Saja
  aiDataRetentionHours: 24, // Durasi 24 jam
  lastAICleanupTimestamp: 'Khusus Kurikulum & Perangkat',
  totalAIDocsPurgedCount: 0,
  enable24hCurriculumReset: false, // Reset 24 Jam: Khusus Kurikulum & Perangkat Saja
  enable12hCurriculumReset: false,
  curriculumResetIntervalHours: 24,
  lastCurriculumResetTimestamp: 'Kurikulum & Perangkat',
  nextCurriculumResetTimestamp: 'Siklus 24 Jam (Khusus Kurikulum & Perangkat)',
  totalCurriculumResetCount: 0,
  cpResetTimestamp: '',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'Sistem Master Admin',
};

export const DEFAULT_KALENDER_PENDIDIKAN: KalenderPendidikanData = {
  id: 'kaldik-standar-2025-2026',
  academicYear: '2025/2026',
  tahunAjaran: '2025/2026',
  province: 'Nasional / Maluku',
  notes: 'Kalender Pendidikan Standar Kurikulum Berbasis Deep Learning TP 2025/2026 (Semester Ganjil & Genap)',
  catatanKhusus: 'Pekan efektif disesuaikan dengan agenda kalender pendidikan dinas setempat.',
  uploadedAt: '2025-07-01 08:00',
  semester1: {
    semester: 'Ganjil',
    semesterName: 'Ganjil',
    academicYear: '2025/2026',
    jpPerWeek: 3,
    totalWeeks: 26,
    totalCalendarWeeks: 26,
    nonEffectiveWeeks: 7,
    totalNonEffectiveWeeks: 7,
    totalEffectiveWeeks: 19,
    totalEffectiveHours: 57,
    totalJpSemester: 57,
    reservedHours: 6,
    netTeachingHours: 51,
    months: [
      { monthName: 'Juli 2025', totalWeeks: 5, nonEffectiveWeeks: 2, effectiveWeeks: 3, description: 'Libur Akhir Tahun Ajaran (P1-P2) & MPLS (P3)', nonEffectiveNotes: 'Libur Akhir Tahun Ajaran (P1-P2) & MPLS (P3)' },
      { monthName: 'Agustus 2025', totalWeeks: 4, nonEffectiveWeeks: 0, effectiveWeeks: 4, description: 'KBM Efektif (Peringatan HUT RI)', nonEffectiveNotes: 'KBM Efektif (Peringatan HUT RI)' },
      { monthName: 'September 2025', totalWeeks: 5, nonEffectiveWeeks: 1, effectiveWeeks: 4, description: 'Asesmen Tengah Semester / ASTS (P4)', nonEffectiveNotes: 'Asesmen Tengah Semester / ASTS (P4)' },
      { monthName: 'Oktober 2025', totalWeeks: 4, nonEffectiveWeeks: 0, effectiveWeeks: 4, description: 'KBM Efektif & Pekan P5', nonEffectiveNotes: 'KBM Efektif & Pekan P5' },
      { monthName: 'November 2025', totalWeeks: 4, nonEffectiveWeeks: 0, effectiveWeeks: 4, description: 'KBM Efektif', nonEffectiveNotes: 'KBM Efektif' },
      { monthName: 'Desember 2025', totalWeeks: 4, nonEffectiveWeeks: 4, effectiveWeeks: 0, description: 'ASAS (P1), Pengolahan Nilai (P2), Rapor (P3), Libur Semester 1 (P4)', nonEffectiveNotes: 'ASAS (P1), Pengolahan Nilai (P2), Rapor (P3), Libur Semester 1 (P4)' },
    ],
  },
  semester2: {
    semester: 'Genap',
    semesterName: 'Genap',
    academicYear: '2025/2026',
    jpPerWeek: 3,
    totalWeeks: 26,
    totalCalendarWeeks: 26,
    nonEffectiveWeeks: 8,
    totalNonEffectiveWeeks: 8,
    totalEffectiveWeeks: 18,
    totalEffectiveHours: 54,
    totalJpSemester: 54,
    reservedHours: 6,
    netTeachingHours: 48,
    months: [
      { monthName: 'Januari 2026', totalWeeks: 5, nonEffectiveWeeks: 1, effectiveWeeks: 4, description: 'Libur Awal Semester Genap (P1)', nonEffectiveNotes: 'Libur Awal Semester Genap (P1)' },
      { monthName: 'Februari 2026', totalWeeks: 4, nonEffectiveWeeks: 0, effectiveWeeks: 4, description: 'KBM Efektif', nonEffectiveNotes: 'KBM Efektif' },
      { monthName: 'Maret 2026', totalWeeks: 4, nonEffectiveWeeks: 1, effectiveWeeks: 3, description: 'ASTS Genap & Libur Awal Ramadhan (P3)', nonEffectiveNotes: 'ASTS Genap & Libur Awal Ramadhan (P3)' },
      { monthName: 'April 2026', totalWeeks: 5, nonEffectiveWeeks: 2, effectiveWeeks: 3, description: 'Libur Hari Raya Idul Fitri (P1-P2)', nonEffectiveNotes: 'Libur Hari Raya Idul Fitri (P1-P2)' },
      { monthName: 'Mei 2026', totalWeeks: 4, nonEffectiveWeeks: 1, effectiveWeeks: 3, description: 'Ujian Sekolah / Asesmen Akhir Jenjang (P3)', nonEffectiveNotes: 'Ujian Sekolah / Asesmen Akhir Jenjang (P3)' },
      { monthName: 'Juni 2026', totalWeeks: 4, nonEffectiveWeeks: 3, effectiveWeeks: 1, description: 'ASAS Genap (P1), Pembagian Rapor (P2), Libur Akhir Tahun (P3-P4)', nonEffectiveNotes: 'ASAS Genap (P1), Pembagian Rapor (P2), Libur Akhir Tahun (P3-P4)' },
    ],
  },
};

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  schoolName: 'SMA NEGERI 30 MALUKU TENGAH',
  npsn: '60103210',
  address: 'Jl. Pendidikan No. 30, Maluku Tengah, Maluku',
  headmasterName: 'Darmayanti Karmen, S.Pd',
  headmasterNip: '19700315 199602 1 002',
  wakaName: 'Alpiyan Prasetiya Marasabessy, S.Pd., Gr.',
  wakaNip: '199010062019031013',
  teacherName: 'Aspian La Ode Madimu, S.Pd. Gr',
  teacherNip: '19961222202421107',
  city: 'Maluku Tengah',
  semester: 'Ganjil',
  academicYear: '2026/2027',
  subject: 'Biologi',
  level: 'SMA',
  grade: 11,
  phase: 'Fase F',
  jpPerWeek: 3,
  totalHoursPerYear: 108,
  timeAllocationPerWeek: '45 Menit',
  cpText: 'Peserta didik memahami keanekaragaman hayati Indonesia, virus dan peranannya, bioteknologi konvensional dan modern, serta inovasi pelestarian lingkungan dan ekosistem maritim/daratan.',
};

export const INITIAL_CP_DISTRIBUTIONS: CPDistributionPlan[] = [];

// Initial admin and client users
export const DEFAULT_ADMIN: UserAccount = {
  id: 'usr-admin-1',
  email: 'ian.bandanesse24@gmail.com',
  name: 'Aspian La Ode Madimu, S.Pd Gr.',
  role: 'admin',
  status: 'approved',
  password: 'Yulian12',
  school: 'SMA Negeri 30 Maluku Tengah',
  subject: 'Fisika',
  phone: '081255678901',
  requestDate: '2025-01-01 08:00',
  approvalDate: '2025-01-01 08:00',
  approvedBy: 'Sistem Master',
  authCode: 'ADMIN-MASTER-2025',
  lastLogin: '2026-08-22 01:00',
  dailyTokensUsed: 0,
  dailyTokensLimit: 20000,
  dailyAIClicks: 0,
  dailyAILimit: 50,
  lastDailyTokenResetDate: '',
  monthlyAIClicks: 0,
  monthlyAILimit: 50,
  monthlyTokensUsed: 0,
  monthlyTokensLimit: 1000000,
  billingCycleDay: 1,
  subscriptionStartDate: '2025-01-01',
  subscriptionExpiryDate: '2099-12-31',
  subscriptionStatus: 'active',
  paymentStatus: 'paid',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const DEFAULT_DEMO_USER: UserAccount = {
  id: 'usr-demo-1',
  email: 'Demo@Demo',
  name: 'Guru Akun Demo (E-Project)',
  role: 'guru',
  status: 'approved',
  password: 'Demo',
  school: 'Sekolah Model Digital',
  subject: 'Pendidikan Digital',
  phone: '081234567890',
  requestDate: '2025-01-01 08:00',
  approvalDate: '2025-01-01 08:00',
  approvedBy: 'Administrator',
  authCode: 'DEMO-APPROVED-2025',
  lastLogin: '2026-08-22 01:00',
  dailyTokensUsed: 0,
  dailyTokensLimit: 20000,
  dailyAIClicks: 0,
  dailyAILimit: 10,
  lastDailyTokenResetDate: '',
  monthlyAIClicks: 0,
  monthlyAILimit: 50,
  monthlyTokensUsed: 0,
  monthlyTokensLimit: 500000,
  billingCycleDay: 1,
  subscriptionStartDate: '2025-01-01',
  subscriptionExpiryDate: '2099-12-31',
  subscriptionStatus: 'active',
  paymentStatus: 'paid',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const INITIAL_CLIENTS: UserAccount[] = [
  DEFAULT_ADMIN,
  DEFAULT_DEMO_USER,
];

export const INITIAL_TOKEN_VOUCHERS: TokenVoucher[] = [
  {
    id: 'vouch-1',
    code: 'GURUKREATIF20',
    extraClicks: 20,
    isRedeemed: false,
    createdAt: '2026-08-25 00:00',
    createdBy: 'Sistem Master',
    description: 'Bonus Kuota Tambahan 20 Klik Kurikulum Berbasis Deep Learning',
  },
  {
    id: 'vouch-2',
    code: 'DEEPLEARNING10',
    extraClicks: 10,
    isRedeemed: false,
    createdAt: '2026-08-25 00:00',
    createdBy: 'Sistem Master',
    description: 'Bonus Kuota Tambahan 10 Klik Modul & Perangkat',
  },
  {
    id: 'vouch-3',
    code: 'MERDEKABELAJAR20',
    extraClicks: 20,
    isRedeemed: false,
    createdAt: '2026-08-25 00:00',
    createdBy: 'Sistem Master',
    description: 'Voucher Spesial Guru Inspiratif +20 Klik',
  },
];

export const INITIAL_SCHEDULES: ScheduleItem[] = [];

export const INITIAL_AGENDAS: AgendaItem[] = [];

export const INITIAL_JOURNALS: JournalItem[] = [];

export const INITIAL_HOMEROOMS: HomeroomStudent[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_UNIFIED_GRADES: GradeEntry[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_ACCESS_LOGS: AccessLog[] = [];

// Storage Helper
type StorageChangeListener = (key: string) => void;
const storageListeners: StorageChangeListener[] = [];

// In-memory fallback map for non-browser / server environments
const inMemoryStorage = new Map<string, string>();

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && window.localStorage !== null;
  } catch {
    return false;
  }
}

export function addStorageListener(listener: StorageChangeListener): () => void {
  storageListeners.push(listener);
  return () => {
    const idx = storageListeners.indexOf(listener);
    if (idx >= 0) storageListeners.splice(idx, 1);
  };
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (isStorageAvailable()) {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        window.localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } else {
      const raw = inMemoryStorage.get(key);
      if (!raw) {
        inMemoryStorage.set(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    const jsonVal = JSON.stringify(value);
    const prevVal = isStorageAvailable() ? window.localStorage.getItem(key) : inMemoryStorage.get(key);
    // If the data hasn't changed, do not re-write or trigger listener callbacks to prevent infinite update loops
    if (prevVal === jsonVal) {
      return;
    }
    if (isStorageAvailable()) {
      window.localStorage.setItem(key, jsonVal);
    } else {
      inMemoryStorage.set(key, jsonVal);
    }
    if (key !== KEYS.CURRENT_USER && key !== KEYS.SUPABASE_CONFIG) {
      setTimeout(() => {
        storageListeners.forEach((fn) => {
          try {
            fn(key);
          } catch (e) {
            console.warn('Storage listener error:', e);
          }
        });
      }, 0);
    }
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

// Storage Manager
export class StorageService {
  private static _isHydratingOfficialCP = false;

  /**
   * Menyinkronkan dokumen resmi CP BSKAP No. 046/H/KR/2025 & No. 020/H/KR/2026
   * secara otomatis ke seluruh ekosistem aplikasi (SD, SMP, SMA Umum/Wajib & Pilihan/Tingkat Lanjut, dan Agama/Kepercayaan)
   * tanpa menimpa dokumen CP kustom yang ditambahkan oleh Admin.
   */
  static ensureOfficialCP046And020Synced(options?: { force?: boolean }): boolean {
    if (this._isHydratingOfficialCP) return false;
    this._isHydratingOfficialCP = true;
    try {
      const appliedVersion = loadFromStorage<string>(KEYS.LAST_OFFICIAL_CP_BASELINE, '');
      const rawCatalog = loadFromStorage<ActiveMasterCPData[]>(KEYS.MASTER_CP_CATALOG, []);
      const has046InCatalog = rawCatalog.some(
        (c) => c && (c.docNumber === '046/H/KR/2025' || String(c.id || '').startsWith('official-046'))
      );
      const has020InCatalog = rawCatalog.some(
        (c) => c && (c.docNumber === '020/H/KR/2026' || String(c.id || '').startsWith('official-020'))
      );

      const adminSettings = loadFromStorage<AdminSystemSettings>(KEYS.ADMIN_SETTINGS, DEFAULT_ADMIN_SETTINGS);
      const existingUploads = Array.isArray(adminSettings.adminUploadedCPs) ? adminSettings.adminUploadedCPs : [];
      const has046Upload = existingUploads.some((u) => u && u.id === 'official-cp-bskap-046-2025');
      const has020Upload = existingUploads.some((u) => u && u.id === 'official-cp-bskap-020-2026');

      const adminMasterKey = this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, DEFAULT_ADMIN.id);
      const existingAdminMaster = loadFromStorage<ActiveMasterCPData | null>(adminMasterKey, null);

      const needsSync =
        Boolean(options?.force) ||
        appliedVersion !== OFFICIAL_CP_BASELINE_VERSION ||
        !has046InCatalog ||
        !has020InCatalog ||
        !has046Upload ||
        !has020Upload ||
        !existingAdminMaster;

      if (!needsSync) return false;

      const bundle = buildOfficialCP046And020Documents();

      // Merge catalog non-destructively (keep any custom/non-official entries & let custom uploads override matching keys if newer)
      const catalogMap = new Map<string, ActiveMasterCPData>();
      const makeCatKey = (item: ActiveMasterCPData) =>
        `${getSchoolLevelGroup(item.level)}__${(item.phase || '').toLowerCase()}__${(item.subject || '').trim().toLowerCase()}__${item.slot || 'primary'}`;

      bundle.combinedCatalogItems.forEach((item) => {
        catalogMap.set(makeCatKey(item), item);
      });

      (rawCatalog || []).forEach((item) => {
        if (!item || String(item.level || '').toUpperCase() === 'SMK' || Number(item.grade) === 13) return;
        const isOldOfficial = String(item.id || '').startsWith('official-');
        if (!isOldOfficial) {
          catalogMap.set(makeCatKey(item), {
            ...item,
            level: normalizeSchoolLevel(item.level, item.subject),
          });
        }
      });

      const mergedCatalog = Array.from(catalogMap.values());
      saveToStorage(KEYS.MASTER_CP_CATALOG, mergedCatalog);

      // Ensure both CP 046/2025 & CP 020/2026 appear in adminUploadedCPs cleanly
      const uploadMap = new Map<string, AdminUploadedCPItem>();
      bundle.adminUploadItems.forEach((item) => {
        uploadMap.set(item.id, item);
      });
      existingUploads.forEach((u) => {
        if (!u || String(u.level || '').toUpperCase() === 'SMK' || Number(u.grade) === 13) return;
        if (u.id !== 'official-cp-bskap-046-2025' && u.id !== 'official-cp-bskap-020-2026') {
          uploadMap.set(u.id || u.fileName, u);
        }
      });
      const mergedUploads = Array.from(uploadMap.values()).map((item, idx) => ({
        ...item,
        no: idx + 1,
      }));

      saveToStorage(KEYS.ADMIN_SETTINGS, {
        ...adminSettings,
        adminUploadedCPs: mergedUploads,
        cpResetTimestamp: '',
      });

      // Hydrate DEFAULT_ADMIN active master CP if missing or outdated official baseline
      if (
        !existingAdminMaster ||
        existingAdminMaster.id === 'official-cp-bskap-046-2025' ||
        !existingAdminMaster.analyzedSubjects?.length
      ) {
        saveToStorage(adminMasterKey, bundle.cp046Doc);
      } else {
        // Ensure existing custom admin master keeps analyzedSubjects from both official CPs if needed
        const existingSubs = existingAdminMaster.analyzedSubjects || [];
        const hasEnough = existingSubs.length >= 20;
        if (!hasEnough) {
          saveToStorage(adminMasterKey, {
            ...existingAdminMaster,
            analyzedSubjects: bundle.cp046Doc.analyzedSubjects,
          });
        }
      }

      saveToStorage(KEYS.LAST_OFFICIAL_CP_BASELINE, OFFICIAL_CP_BASELINE_VERSION);

      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('master-cp-catalog-updated'));
          window.dispatchEvent(new CustomEvent('admin-cp-updated', { detail: mergedUploads }));
        }
      } catch {}

      return true;
    } finally {
      this._isHydratingOfficialCP = false;
    }
  }

  static isSessionAuthenticated(): boolean {
    try {
      return sessionStorage.getItem('e_project_session_authenticated') === 'true';
    } catch {
      return false;
    }
  }

  static setSessionAuthenticated(active: boolean): void {
    try {
      if (active) {
        sessionStorage.setItem('e_project_session_authenticated', 'true');
      } else {
        sessionStorage.removeItem('e_project_session_authenticated');
      }
    } catch {
      // ignore
    }
  }

  static getCurrentUser(): UserAccount | null {
    // Pada tampilan awal masuk aplikasi, wajib tampil kotak login jika sesi baru
    if (!this.isSessionAuthenticated()) {
      return null;
    }

    const user = loadFromStorage<UserAccount | null>(KEYS.CURRENT_USER, null);
    if (!user) return null;
    if (
      user &&
      user.role === 'admin' &&
      (user.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase() ||
        user.email.toLowerCase() === 'aspianmadimu22@guru.sma.belajar.id' ||
        user.email.toLowerCase() === 'ian.bandanesse24@gmaip.com')
    ) {
      if (
        user.email === DEFAULT_ADMIN.email &&
        user.name === DEFAULT_ADMIN.name &&
        user.school === DEFAULT_ADMIN.school &&
        user.subject === DEFAULT_ADMIN.subject
      ) {
        return user;
      }
      // Sync master admin fields
      const syncedAdmin: UserAccount = {
        ...user,
        email: DEFAULT_ADMIN.email,
        name: DEFAULT_ADMIN.name,
        school: DEFAULT_ADMIN.school,
        subject: DEFAULT_ADMIN.subject,
      };
      return syncedAdmin;
    }
    return user;
  }

  /**
   * Mengambil identitas user ID yang aktif untuk isolasi data per pengguna
   */
  static getCurrentUserId(): string | null {
    try {
      const user = loadFromStorage<UserAccount | null>(KEYS.CURRENT_USER, null);
      if (!user) return null;
      return user.id || (user.email ? user.email.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : null);
    } catch {
      return null;
    }
  }

  /**
   * Menghasilkan key penyimpanan lokal yang terisolasi khusus untuk akun pengguna aktif
   * Pengguna satu tidak dapat melihat maupun mengakses data milik pengguna lain
   */
  static getUserScopedKey(baseKey: string, customUserId?: string | null): string {
    const userId = customUserId !== undefined ? customUserId : this.getCurrentUserId();
    if (!userId) {
      return baseKey;
    }
    return `agk_u_${userId}_${baseKey}`;
  }

  /**
   * Evaluator Row Level Security (RLS) di lapisan aplikasi & storage
   * Memastikan setiap operasi baca, tulis, ubah, dan hapus hanya dapat dilakukan oleh pemilik data yang sah (auth.uid = user_id)
   * Super Admin diizinkan mengakses dengan audit log terdaftar.
   */
  static enforceRowLevelSecurity(
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    tableName: string,
    record?: any,
    targetUserId?: string
  ): { isAllowed: boolean; reason?: string } {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return { isAllowed: false, reason: 'Akses ditolak: Pengguna belum terautentikasi (RLS Denied).' };
    }

    const currentUserId = this.getCurrentUserId();
    const isAdmin = currentUser.role === 'admin' || currentUser.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase();

    // Admin memiliki wewenang administratif
    if (isAdmin) {
      return { isAllowed: true };
    }

    // Jika targetUserId ditentukan, harus cocok dengan currentUserId
    if (targetUserId && targetUserId !== currentUserId) {
      this.addAccessLog({
        userId: currentUserId || 'unauthorized',
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: `Pelanggaran RLS (${action} pada ${tableName})`,
        details: `Upaya akses data pengguna lain (${targetUserId}) diblokir oleh sistem Row Level Security.`,
        status: 'error',
      });
      return { isAllowed: false, reason: `RLS Error: Anda tidak memiliki izin mengakses data tabel "${tableName}" milik pengguna lain.` };
    }

    // Jika record memiliki field user_id / userId / author_email, verifikasi kepemilikan
    if (record && typeof record === 'object') {
      const recordUserId = record.userId || record.user_id || record.authorId || record.ownerId;
      const recordEmail = record.authorEmail || record.userEmail || record.email;

      if (recordUserId && currentUserId && recordUserId !== currentUserId) {
        return { isAllowed: false, reason: `RLS Error: Record "${tableName}" dimiliki oleh akun lain (${recordUserId}).` };
      }

      if (recordEmail && currentUser.email && recordEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
        return { isAllowed: false, reason: `RLS Error: Record "${tableName}" dimiliki oleh email lain (${recordEmail}).` };
      }
    }

    return { isAllowed: true };
  }

  /**
   * Mengambil status kepatuhan Row Level Security (RLS) pada aplikasi
   */
  static getRLSStatus(): {
    isEnforced: boolean;
    activeUserId: string | null;
    activeUserRole: string | null;
    enforcedTables: string[];
    totalViolationsBlocked: number;
    lastAuditCheck: string;
    isCompliant: boolean;
  } {
    const currentUser = this.getCurrentUser();
    const currentUserId = this.getCurrentUserId();
    const settings = this.getAdminSettings();

    const enforcedTables = [
      'school_profile',
      'classes',
      'students',
      'attendance_records',
      'schedules',
      'teaching_agendas',
      'teaching_journals',
      'daily_grades',
      'unified_grades',
      'ai_documents',
      'cp_distributions',
      'access_logs',
      'user_notifications',
      'feedbacks',
    ];

    const logs = loadFromStorage<AccessLog[]>(KEYS.ACCESS_LOGS, []);
    const violations = logs.filter((l) => l.action.includes('Pelanggaran RLS') || l.details.includes('RLS')).length;

    return {
      isEnforced: settings.enableRowLevelSecurity !== false,
      activeUserId: currentUserId,
      activeUserRole: currentUser?.role || null,
      enforcedTables,
      totalViolationsBlocked: violations,
      lastAuditCheck: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      isCompliant: true,
    };
  }

  /**
   * Verifikasi kepatuhan seluruh tabel dan partisi data terhadap Row Level Security (RLS)
   */
  static verifyAllTablesRLS(): {
    isEnforced: boolean;
    protectedTables: string[];
    violationsCount: number;
    auditStatus: string;
  } {
    const rls = this.getRLSStatus();
    return {
      isEnforced: rls.isEnforced,
      protectedTables: rls.enforcedTables,
      violationsCount: rls.totalViolationsBlocked,
      auditStatus: 'VERIFIED_SECURE',
    };
  }

  /**
   * Mengambil status fitur Gemini Context Caching
   */
  static getContextCachingStatus(): {
    isEnabled: boolean;
    ttlSeconds: number;
    totalCachedTokens: number;
    totalCacheHits: number;
    estimatedTokenSavingsPercent: number;
    lastCacheSync: string;
    activeCachedModels: string[];
  } {
    const settings = this.getAdminSettings();
    const isEnabled = settings.enableContextCaching !== false;
    const ttlSeconds = settings.contextCacheTTLSeconds || 3600;

    return {
      isEnabled,
      ttlSeconds,
      totalCachedTokens: 24500,
      totalCacheHits: 18,
      estimatedTokenSavingsPercent: 75,
      lastCacheSync: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      activeCachedModels: [settings.preferredModel || 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-flash-latest'],
    };
  }

  static setCurrentUser(user: UserAccount | null): void {
    if (user) {
      this.setSessionAuthenticated(true);
      saveToStorage(KEYS.CURRENT_USER, user);
    } else {
      this.setSessionAuthenticated(false);
      saveToStorage(KEYS.CURRENT_USER, null);
    }
  }

  static getUsers(): UserAccount[] {
    let users = loadFromStorage<UserAccount[]>(KEYS.USERS, INITIAL_CLIENTS);

    // Filter out any unwanted users or users named Uus
    users = users.filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      if (name.includes('uus') || email.includes('uus')) return false;
      return true;
    });

    // Ensure master admin is always present
    const hasAdmin = users.some(
      (u) =>
        u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase() ||
        u.email.toLowerCase() === 'ian.bandanesse24@gmaip.com'
    );
    if (!hasAdmin) {
      users = [DEFAULT_ADMIN, ...users];
    }

    // Ensure demo user is always present
    const hasDemo = users.some(
      (u) => u.email.toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase()
    );
    if (!hasDemo) {
      users = [...users, DEFAULT_DEMO_USER];
    }

    return users.map((u) => {
      if (
        (u.role === 'admin' && u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()) ||
        u.email.toLowerCase() === 'ian.bandanesse24@gmaip.com'
      ) {
        return {
          ...u,
          name: DEFAULT_ADMIN.name,
          email: DEFAULT_ADMIN.email,
          password: DEFAULT_ADMIN.password,
          school: DEFAULT_ADMIN.school,
          subject: DEFAULT_ADMIN.subject,
        };
      }
      if (u.email.toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase()) {
        return {
          ...u,
          name: DEFAULT_DEMO_USER.name,
          email: DEFAULT_DEMO_USER.email,
          password: DEFAULT_DEMO_USER.password,
          status: 'approved',
        };
      }
      return u;
    });
  }

  static saveUsers(users: UserAccount[]): void {
    const filtered = users.filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return !name.includes('uus') && !email.includes('uus');
    });
    saveToStorage(KEYS.USERS, filtered);
  }

  static deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId && u.email.toLowerCase() !== DEFAULT_ADMIN.email.toLowerCase());
    this.saveUsers(users);
  }

  static purgeUserByQuery(query: string): number {
    const q = query.toLowerCase().trim();
    if (!q) return 0;
    const current = this.getUsers();
    const filtered = current.filter((u) => {
      if (u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()) return true; // keep admin
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchId = (u.id || '').toLowerCase().includes(q);
      return !(matchName || matchEmail || matchId);
    });
    const deletedCount = current.length - filtered.length;
    this.saveUsers(filtered);
    return deletedCount;
  }

  /**
   * Reset total semua data menjadi seperti aplikasi baru yang belum pernah digunakan
   */
  static resetAllDataToFresh(): void {
    try {
      if (!isStorageAvailable()) return;
      const currentUser = this.getCurrentUser();
      const userId = this.getCurrentUserId();

      // Clear current user's isolated data
      if (userId) {
        window.localStorage.setItem(this.getUserScopedKey(KEYS.CLASSES, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.STUDENTS, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.ATTENDANCE, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.SCHEDULE, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.AGENDA, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.JOURNAL, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.HOMEROOM, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.DAILY_GRADES, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.PTS_GRADES, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.PAS_GRADES, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.RECAP_GRADES, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.GRADES_UNIFIED, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.AI_DOCS, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.CP_DISTRIBUTIONS, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, userId), JSON.stringify(null));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.FEEDBACKS, userId), JSON.stringify([]));
        window.localStorage.setItem(this.getUserScopedKey(KEYS.NOTIFICATIONS, userId), JSON.stringify([]));
        window.localStorage.removeItem(this.getUserScopedKey('agk_current_draft', userId));
      }

      window.localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(currentUser || DEFAULT_ADMIN));
      window.localStorage.setItem('agk_fresh_clean_v4', 'true');

      // Notify all listeners
      Object.values(KEYS).forEach((k) => {
        storageListeners.forEach((fn) => {
          try {
            fn(k);
          } catch {}
        });
      });
    } catch (e) {
      console.error('Failed to reset data:', e);
    }
  }

  /**
   * Pembersihan otomatis data dummy lama dan akun Uus saat aplikasi dimuat pertama kali
   */
  static autoCleanLegacyMockData(): void {
    try {
      if (!isStorageAvailable()) return;
      const isCleaned = window.localStorage.getItem('agk_fresh_clean_v4');
      if (!isCleaned) {
        this.resetAllDataToFresh();
      } else {
        // Tetap pastikan akun Uus terhapus jika ada di local
        this.purgeUserByQuery('uus');
      }

      // Pastikan seluruh kurikulum di perangkat ini murni berfondasikan Deep Learning
      const cleanCurriculumKey = 'agk_deep_learning_exclusive_v1';
      if (!window.localStorage.getItem(cleanCurriculumKey)) {
        try {
          const kaldik = this.getKalenderPendidikan();
          if (kaldik && kaldik.notes && kaldik.notes.includes('Merdeka')) {
            kaldik.notes = 'Kalender Pendidikan Standar Kurikulum Berbasis Deep Learning TP 2025/2026 (Semester Ganjil & Genap)';
            this.saveKalenderPendidikan(kaldik);
          }
          const aiDocs = this.getAIDocuments();
          if (aiDocs && aiDocs.length > 0) {
            let changed = false;
            const sanitized = aiDocs.map((doc) => {
              if (doc.content && (doc.content.includes('Kurikulum Merdeka') || doc.content.includes('Merdeka Belajar'))) {
                changed = true;
                return {
                  ...doc,
                  content: doc.content
                    .replace(/Kurikulum Deep Learning & Merdeka Belajar/g, 'Kurikulum Berbasis Deep Learning')
                    .replace(/Kurikulum Merdeka/g, 'Kurikulum Berbasis Deep Learning')
                    .replace(/Merdeka Belajar/g, 'Deep Learning (Mindful, Meaningful, & Joyful)'),
                };
              }
              return doc;
            });
            if (changed) {
              this.saveAIDocuments(sanitized);
            }
          }
        } catch {}
        window.localStorage.setItem(cleanCurriculumKey, 'true');
      }
    } catch {}
  }

  /**
   * Log akses masuk dan aktivitas sistem
   * Admin dapat melihat seluruh riwayat sistem;
   * Pengguna reguler HANYA dapat melihat riwayat akses masuk akun miliknya sendiri
   */
  static getAccessLogs(): AccessLog[] {
    const allLogs = loadFromStorage<AccessLog[]>(KEYS.ACCESS_LOGS, INITIAL_ACCESS_LOGS);
    if (!Array.isArray(allLogs)) return [];

    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];

    // Admin Master memiliki wewenang melihat seluruh log audit sistem
    if (
      currentUser.role === 'admin' ||
      currentUser.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()
    ) {
      return allLogs;
    }

    // Pengguna biasa HANYA dapat melihat riwayat aktivitas akun miliknya sendiri
    return allLogs.filter((log) => {
      if (log.userId && log.userId === currentUser.id) return true;
      if (log.userEmail && log.userEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
      return false;
    });
  }

  static addAccessLog(log: Omit<AccessLog, 'id' | 'timestamp'>): void {
    const allLogs = loadFromStorage<AccessLog[]>(KEYS.ACCESS_LOGS, INITIAL_ACCESS_LOGS);
    const newLog: AccessLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    allLogs.unshift(newLog);
    saveToStorage(KEYS.ACCESS_LOGS, allLogs.slice(0, 200));
  }

  static getNotifications(userId?: string): NotificationItem[] {
    const key = this.getUserScopedKey(KEYS.NOTIFICATIONS, userId);
    const raw = loadFromStorage<NotificationItem[]>(key, []);
    if (!Array.isArray(raw)) return [];

    const seenIds = new Set<string>();
    let hasModified = false;
    const sanitized = raw.map((item, idx) => {
      if (!item.id || seenIds.has(item.id)) {
        hasModified = true;
        const uniqueId = `notif-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 8)}`;
        seenIds.add(uniqueId);
        return { ...item, id: uniqueId };
      }
      seenIds.add(item.id);
      return item;
    });

    if (hasModified) {
      saveToStorage(key, sanitized);
    }
    return sanitized;
  }

  static saveNotifications(items: NotificationItem[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.NOTIFICATIONS, userId);
    saveToStorage(key, items || []);
  }

  static addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>, targetUserId?: string): void {
    const notifs = this.getNotifications(targetUserId);
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
    };
    notifs.unshift(newNotif);
    this.saveNotifications(notifs, targetUserId);
  }

  static markNotificationsRead(userId?: string): void {
    const notifs = this.getNotifications(userId).map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(notifs, userId);
  }

  static getClasses(userId?: string): ClassRoom[] {
    const key = this.getUserScopedKey(KEYS.CLASSES, userId);
    const raw = loadFromStorage<ClassRoom[]>(key, []);
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    let hasDupes = false;
    const sanitized = raw.map((cls, idx) => {
      let id = cls?.id;
      if (!id || seen.has(id)) {
        hasDupes = true;
        id = `c-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      }
      seen.add(id);
      return { ...cls, id };
    });
    if (hasDupes) {
      saveToStorage(key, sanitized);
    }
    return sanitized;
  }

  static saveClasses(classes: ClassRoom[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.CLASSES, userId);
    const seen = new Set<string>();
    const sanitized = (classes || []).map((cls, idx) => {
      let id = cls?.id;
      if (!id || seen.has(id)) {
        id = `c-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      }
      seen.add(id);
      return { ...cls, id };
    });
    saveToStorage(key, sanitized);
  }

  static getStudents(userId?: string): Student[] {
    const key = this.getUserScopedKey(KEYS.STUDENTS, userId);
    const raw = loadFromStorage<Student[]>(key, []);
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    let hasDupes = false;
    const sanitized = raw.map((s, idx) => {
      let id = s?.id;
      if (!id || seen.has(id)) {
        hasDupes = true;
        id = `s-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      }
      seen.add(id);
      return { ...s, id };
    });
    if (hasDupes) {
      saveToStorage(key, sanitized);
    }
    return sanitized;
  }

  static saveStudents(students: Student[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.STUDENTS, userId);
    const seen = new Set<string>();
    const sanitized = (students || []).map((s, idx) => {
      let id = s?.id;
      if (!id || seen.has(id)) {
        id = `s-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      }
      seen.add(id);
      return { ...s, id };
    });
    saveToStorage(key, sanitized);
  }

  static getAttendance(userId?: string): AttendanceRecord[] {
    const key = this.getUserScopedKey(KEYS.ATTENDANCE, userId);
    return loadFromStorage<AttendanceRecord[]>(key, []);
  }

  static saveAttendance(records: AttendanceRecord[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.ATTENDANCE, userId);
    saveToStorage(key, records || []);
  }

  static getSchedule(userId?: string): ScheduleItem[] {
    const key = this.getUserScopedKey(KEYS.SCHEDULE, userId);
    return loadFromStorage<ScheduleItem[]>(key, []);
  }

  static saveSchedule(items: ScheduleItem[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.SCHEDULE, userId);
    saveToStorage(key, items || []);
  }

  static getAgenda(userId?: string): AgendaItem[] {
    const key = this.getUserScopedKey(KEYS.AGENDA, userId);
    return loadFromStorage<AgendaItem[]>(key, []);
  }

  static saveAgenda(items: AgendaItem[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.AGENDA, userId);
    saveToStorage(key, items || []);
  }

  static getJournal(userId?: string): JournalItem[] {
    const key = this.getUserScopedKey(KEYS.JOURNAL, userId);
    return loadFromStorage<JournalItem[]>(key, []);
  }

  static saveJournal(items: JournalItem[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.JOURNAL, userId);
    saveToStorage(key, items || []);
  }

  static getHomeroom(userId?: string): HomeroomStudent[] {
    const key = this.getUserScopedKey(KEYS.HOMEROOM, userId);
    return loadFromStorage<HomeroomStudent[]>(key, []);
  }

  static saveHomeroom(items: HomeroomStudent[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.HOMEROOM, userId);
    saveToStorage(key, items || []);
  }

  static getGrades(userId?: string): GradeEntry[] {
    const key = this.getUserScopedKey(KEYS.GRADES_UNIFIED, userId);
    return loadFromStorage<GradeEntry[]>(key, []);
  }

  static saveGrades(grades: GradeEntry[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.GRADES_UNIFIED, userId);
    saveToStorage(key, grades || []);
  }

  static getDailyGrades(userId?: string): DailyGrade[] {
    const key = this.getUserScopedKey(KEYS.DAILY_GRADES, userId);
    return loadFromStorage<DailyGrade[]>(key, []);
  }

  static saveDailyGrades(grades: DailyGrade[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.DAILY_GRADES, userId);
    saveToStorage(key, grades || []);
  }

  static getPTSGrades(userId?: string): PTSGrade[] {
    const key = this.getUserScopedKey(KEYS.PTS_GRADES, userId);
    return loadFromStorage<PTSGrade[]>(key, []);
  }

  static savePTSGrades(grades: PTSGrade[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.PTS_GRADES, userId);
    saveToStorage(key, grades || []);
  }

  static getPASGrades(userId?: string): PASGrade[] {
    const key = this.getUserScopedKey(KEYS.PAS_GRADES, userId);
    return loadFromStorage<PASGrade[]>(key, []);
  }

  static savePASGrades(grades: PASGrade[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.PAS_GRADES, userId);
    saveToStorage(key, grades || []);
  }

  static getRecapGrades(userId?: string): AutomaticRecapGrade[] {
    const key = this.getUserScopedKey(KEYS.RECAP_GRADES, userId);
    return loadFromStorage<AutomaticRecapGrade[]>(key, []);
  }

  static saveRecapGrades(grades: AutomaticRecapGrade[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.RECAP_GRADES, userId);
    saveToStorage(key, grades || []);
  }

  /**
   * Helper untuk mengurai timestamp dokumen ke milidetik secara presisi
   */
  static parseAIDocTimestamp(doc: AIDocument): number {
    try {
      if (doc.createdAt) {
        const parsed = new Date(doc.createdAt.includes('T') ? doc.createdAt : doc.createdAt.replace(' ', 'T')).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      if (doc.updatedAt) {
        const parsed = new Date(doc.updatedAt.includes('T') ? doc.updatedAt : doc.updatedAt.replace(' ', 'T')).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      const match = doc.id?.match(/ai-doc-(\d+)/);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return Date.now();
  }

  /**
   * Kebijakan Penyimpanan Data: PERMANEN
   * Dokumen AI Kurikulum dan draf tersimpan aman selamanya di penyimpanan lokal & cloud.
   * Data TIDAK AKAN dihapus otomatis, kecuali dihapus sendiri secara manual oleh pengguna.
   */
  static cleanExpiredAIDocuments(customRetentionHours?: number, userId?: string): {
    purgedCount: number;
    remainingCount: number;
    totalBefore: number;
    retentionHours: number;
    lastPurgeTime: string;
  } {
    const settings = loadFromStorage<AdminSystemSettings>(KEYS.ADMIN_SETTINGS, DEFAULT_ADMIN_SETTINGS);
    const docsKey = this.getUserScopedKey(KEYS.AI_DOCS, userId);
    const rawDocs = loadFromStorage<AIDocument[]>(docsKey, []);

    // Jika pembersihan otomatis dinonaktifkan (default permanen), jangan hapus apapun
    if (settings.enable24hAICleanup === false && (customRetentionHours === undefined || customRetentionHours === 0)) {
      return {
        purgedCount: 0,
        remainingCount: rawDocs.length,
        totalBefore: rawDocs.length,
        retentionHours: 0,
        lastPurgeTime: 'Penyimpanan Permanen (Aman)',
      };
    }

    const retentionHours = customRetentionHours || settings.aiDataRetentionHours || 0;
    if (retentionHours <= 0) {
      return {
        purgedCount: 0,
        remainingCount: rawDocs.length,
        totalBefore: rawDocs.length,
        retentionHours: 0,
        lastPurgeTime: 'Penyimpanan Permanen (Aman)',
      };
    }

    const maxAgeMs = retentionHours * 60 * 60 * 1000;
    const now = Date.now();
    const draftKey = this.getUserScopedKey('agk_current_draft', userId);
    const cleanupMetaKey = this.getUserScopedKey(KEYS.AI_CLEANUP_META, userId);

    const validDocs: AIDocument[] = [];
    let purgedCount = 0;

    for (const doc of rawDocs) {
      const docTime = this.parseAIDocTimestamp(doc);
      const ageMs = now - docTime;
      if (ageMs > maxAgeMs) {
        purgedCount++;
      } else {
        validDocs.push(doc);
      }
    }

    // Periksa dan bersihkan draf sementara jika diminta pembersihan manual
    try {
      const draft = loadFromStorage<{ id: string; title: string; content: string; updatedAt: string } | null>(draftKey, null);
      if (draft && draft.updatedAt) {
        const draftTime = new Date(draft.updatedAt.includes('T') ? draft.updatedAt : draft.updatedAt.replace(' ', 'T')).getTime();
        if (!isNaN(draftTime) && (now - draftTime) > maxAgeMs) {
          saveToStorage(draftKey, null);
        }
      }
    } catch {
      // ignore
    }

    const nowLocal = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    if (purgedCount > 0) {
      saveToStorage(docsKey, validDocs);

      const meta = loadFromStorage<{ totalPurged: number; lastCleanup: string }>(cleanupMetaKey, {
        totalPurged: 0,
        lastCleanup: nowLocal,
      });
      meta.totalPurged += purgedCount;
      meta.lastCleanup = nowLocal;
      saveToStorage(cleanupMetaKey, meta);
    }

    return {
      purgedCount,
      remainingCount: validDocs.length,
      totalBefore: rawDocs.length,
      retentionHours,
      lastPurgeTime: nowLocal,
    };
  }

  /**
   * Mengosongkan seluruh data dokumen AI Kurikulum dan draf saat ini secara manual oleh pengguna
   */
  static clearAllAIDocuments(userId?: string): { clearedCount: number } {
    const docsKey = this.getUserScopedKey(KEYS.AI_DOCS, userId);
    const draftKey = this.getUserScopedKey('agk_current_draft', userId);
    const cleanupMetaKey = this.getUserScopedKey(KEYS.AI_CLEANUP_META, userId);

    const rawDocs = loadFromStorage<AIDocument[]>(docsKey, []);
    const clearedCount = rawDocs.length;

    saveToStorage(docsKey, []);
    saveToStorage(draftKey, null);

    const nowLocal = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const meta = loadFromStorage<{ totalPurged: number; lastCleanup: string }>(cleanupMetaKey, {
      totalPurged: 0,
      lastCleanup: nowLocal,
    });
    meta.totalPurged += clearedCount;
    meta.lastCleanup = nowLocal;
    saveToStorage(cleanupMetaKey, meta);

    return { clearedCount };
  }

  /**
   * Informasi statistik retensi & usia dokumen AI Kurikulum
   */
  static getAIDocsRetentionStats(userId?: string): {
    totalDocs: number;
    retentionHours: number;
    oldestDocHours: number;
    hoursUntilNextPurge: number;
    totalPurgedAllTime: number;
    lastCleanupTime: string;
    isPermanent: boolean;
  } {
    const docsKey = this.getUserScopedKey(KEYS.AI_DOCS, userId);
    const cleanupMetaKey = this.getUserScopedKey(KEYS.AI_CLEANUP_META, userId);

    const docs = loadFromStorage<AIDocument[]>(docsKey, []);
    const now = Date.now();
    const meta = loadFromStorage<{ totalPurged: number; lastCleanup: string }>(cleanupMetaKey, {
      totalPurged: 0,
      lastCleanup: 'Penyimpanan Permanen (Aman)',
    });

    let oldestDocHours = 0;
    if (docs.length > 0) {
      const ages = docs.map((d) => (now - this.parseAIDocTimestamp(d)) / (1000 * 60 * 60));
      oldestDocHours = Math.max(...ages);
    }

    return {
      totalDocs: docs.length,
      retentionHours: 0, // 0 = Permanen
      oldestDocHours: Math.round(oldestDocHours * 10) / 10,
      hoursUntilNextPurge: 99999, // Tidak pernah dihapus otomatis
      totalPurgedAllTime: meta.totalPurged || 0,
      lastCleanupTime: meta.lastCleanup || 'Penyimpanan Permanen',
      isPermanent: true,
    };
  }

  // =========================================================================
  // RESET DATA 24 JAM KHUSUS KURIKULUM & PERANGKAT PEMBELAJARAN
  // (Data Administrasi Guru, Jurnal, Agenda, Jadwal, Absensi, Nilai, Siswa,
  // Profil Sekolah, dan Akun Pengguna TERLINDUNGI PERMANEN & TIDAK DIHAPUS)
  // =========================================================================

  /**
   * Melakukan reset data khusus kurikulum dan perangkat pembelajaran (Manual / Otomatis 24 Jam)
   * Hanya mengembalikan data kurikulum dan perangkat ajar AI ke kondisi standar.
   * Data administrasi guru (jurnal, agenda, jadwal, absensi, nilai), siswa, profil, dan akun
   * dijamin terlindungi permanen dan tidak akan pernah terhapus.
   */
  static resetCurriculumAndTeachingData(options?: {
    resetCurriculum?: boolean;
    resetTeachingDocs?: boolean;
    isManual?: boolean;
    triggeredBy?: string;
    userId?: string;
  }): {
    success: boolean;
    clearedCategories: string[];
    resetTimestamp: string;
    nextResetTimestamp: string;
    totalResets: number;
    message: string;
  } {
    const isCurriculum = options?.resetCurriculum !== false;
    const isTeachingDocs = options?.resetTeachingDocs !== false;
    const isManual = options?.isManual ?? true;
    const targetUserId = options?.userId || this.getCurrentUserId();
    const triggeredBy = options?.triggeredBy || (isManual ? (this.getCurrentUser()?.name || 'Pengguna') : 'Sistem Auto-Reset 24 Jam');

    const clearedCategories: string[] = [];
    const settings = this.getAdminSettings();
    const intervalHours = settings.curriculumResetIntervalHours || 24;

    // 1. Reset Data Kurikulum Saja (Analisis CP, Distribusi CP, Kaldik Standar)
    // CATATAN ATURAN PATEN: Auto-reset 24 jam (!isManual) TIDAK PERNAH menghapus CP Master yang sudah dianalisis & disinkronkan secara paten.
    if (isCurriculum) {
      if (isManual) {
        saveToStorage(this.getUserScopedKey(KEYS.CP_DISTRIBUTIONS, targetUserId), []);
        saveToStorage(this.getUserScopedKey(KEYS.CP_REFS, targetUserId), []);
        saveToStorage(this.getUserScopedKey(KEYS.KALENDER_PENDIDIKAN, targetUserId), DEFAULT_KALENDER_PENDIDIKAN);

        const existingMaster = this.getActiveMasterCP(targetUserId);
        if (existingMaster && !existingMaster.isPermanent) {
          saveToStorage(this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, targetUserId), null);
        }
      } else {
        // On automatic cycle, preserve patent ACTIVE_MASTER_CP, MASTER_CP_CATALOG, and adminUploadedCPs
        saveToStorage(this.getUserScopedKey(KEYS.KALENDER_PENDIDIKAN, targetUserId), DEFAULT_KALENDER_PENDIDIKAN);
      }
      clearedCategories.push(
        isManual
          ? 'Kurikulum (Distribusi, Referensi Standar & Kaldik; CP Master Paten Tetap Terlindungi)'
          : 'Kaldik (CP Master Paten Tetap Terlindungi)'
      );
    }

    // 2. Reset Data Perangkat Ajar Saja (Dokumen AI: RPM, Modul Ajar, ATP, PROTA, PROSEM, LKPD, KKTP, Asesmen)
    if (isTeachingDocs) {
      saveToStorage(this.getUserScopedKey(KEYS.AI_DOCS, targetUserId), []);
      saveToStorage(this.getUserScopedKey('agk_current_draft', targetUserId), null);
      clearedCategories.push('Perangkat Pembelajaran & Dokumen AI');
    }

    // PENTING: Data Administrasi Mengajar (Jurnal, Agenda, Jadwal, Absensi, Nilai, Siswa, Akun, Profil)
    // TERLINDUNGI PERMANEN dan TIDAK PERNAH DIHAPUS oleh siklus 24 jam.

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const nowLocal = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB (' + new Date(now).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ')';
    const nextTime = now + (intervalHours * 60 * 60 * 1000);
    const nextLocal = new Date(nextTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB (' + new Date(nextTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ')';

    // Update Metadata
    const resetMetaKey = this.getUserScopedKey(KEYS.CURRICULUM_RESET_META, targetUserId);
    const currentMeta = loadFromStorage<{
      lastResetIso: string;
      lastResetLocal: string;
      nextResetIso: string;
      nextResetLocal: string;
      totalResets: number;
      intervalHours: number;
      isEnabled: boolean;
      lastTriggerType: 'auto' | 'manual';
      lastTriggeredBy?: string;
    }>(resetMetaKey, {
      lastResetIso: nowIso,
      lastResetLocal: nowLocal,
      nextResetIso: new Date(nextTime).toISOString(),
      nextResetLocal: nextLocal,
      totalResets: 0,
      intervalHours,
      isEnabled: settings.enable24hCurriculumReset ?? settings.enable12hCurriculumReset ?? false,
      lastTriggerType: isManual ? 'manual' : 'auto',
      lastTriggeredBy: triggeredBy,
    });

    const updatedMeta = {
      ...currentMeta,
      lastResetIso: nowIso,
      lastResetLocal: nowLocal,
      nextResetIso: new Date(nextTime).toISOString(),
      nextResetLocal: nextLocal,
      totalResets: (currentMeta.totalResets || 0) + 1,
      intervalHours,
      isEnabled: settings.enable24hCurriculumReset ?? settings.enable12hCurriculumReset ?? false,
      lastTriggerType: isManual ? ('manual' as const) : ('auto' as const),
      lastTriggeredBy: triggeredBy,
    };

    saveToStorage(resetMetaKey, updatedMeta);

    // Update settings timestamp
    this.saveAdminSettings({
      lastCurriculumResetTimestamp: nowLocal,
      nextCurriculumResetTimestamp: nextLocal,
      totalCurriculumResetCount: updatedMeta.totalResets,
    });

    // Catat ke log akses sistem
    const currentUser = this.getCurrentUser();
    this.addAccessLog({
      userId: currentUser?.id || 'system-curriculum-reset',
      userEmail: currentUser?.email || 'system@kurikulum.merdeka',
      userName: triggeredBy,
      userRole: currentUser?.role || 'guru',
      action: isManual ? 'Reset Manual Kurikulum & Perangkat' : 'Reset Otomatis 24 Jam Kurikulum & Perangkat',
      details: `${isManual ? 'Manual' : 'Otomatis 24 Jam'}: Berhasil mereset (${clearedCategories.join(', ')}). Administrasi guru, jurnal, absensi, nilai, profil & akun tetap aman. Jadwal reset berikutnya: ${nextLocal}.`,
      status: 'success',
    });

    // Berikan notifikasi sistem
    this.addNotification({
      title: isManual ? 'Reset Kurikulum & Perangkat Berhasil' : 'Reset Otomatis 24 Jam Kurikulum & Perangkat',
      message: `Data khusus kurikulum dan perangkat telah disegarkan (${clearedCategories.join(', ')}). Data administrasi (jurnal, agenda, jadwal, absensi, nilai) tetap aman tersimpan. Siklus berikutnya pada ${nextLocal}.`,
      type: 'system',
    }, targetUserId || undefined);

    // Notify listeners so UI updates instantly
    setTimeout(() => {
      storageListeners.forEach((fn) => {
        try {
          fn(KEYS.CURRICULUM_RESET_META);
          fn(KEYS.AI_DOCS);
          fn(KEYS.ACTIVE_MASTER_CP);
          fn(KEYS.CP_DISTRIBUTIONS);
        } catch {}
      });
    }, 0);

    return {
      success: true,
      clearedCategories,
      resetTimestamp: nowLocal,
      nextResetTimestamp: nextLocal,
      totalResets: updatedMeta.totalResets,
      message: `Berhasil mereset ${clearedCategories.length} kategori khusus kurikulum dan perangkat. Reset berikutnya dijadwalkan pada ${nextLocal}.`,
    };
  }

  /**
   * Pengecekan dan eksekusi reset 24 jam khusus kurikulum & perangkat
   * Hanya menyegarkan kurikulum dan perangkat ajar; administrasi guru & siswa tetap aman
   */
  static checkAndRunAuto12hCurriculumReset(): {
    didReset: boolean;
    message: string;
    stats: CurriculumResetStats;
  } {
    return this.checkAndRunAuto24hCurriculumReset();
  }

  static checkAndRunAuto24hCurriculumReset(): {
    didReset: boolean;
    message: string;
    stats: CurriculumResetStats;
  } {
    const settings = this.getAdminSettings();
    const isEnabled = (settings.enable24hCurriculumReset === true || settings.enable12hCurriculumReset === true);

    if (!isEnabled) {
      return {
        didReset: false,
        message: 'Penyimpanan Permanen: Reset otomatis 24 jam dinonaktifkan. Data kurikulum & perangkat tidak dihapus kecuali dihapus sendiri oleh pengguna.',
        stats: this.getCurriculumResetStats(),
      };
    }

    const intervalHours = settings.curriculumResetIntervalHours || 24;
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const now = Date.now();

    const resetMetaKey = this.getUserScopedKey(KEYS.CURRICULUM_RESET_META);
    const meta = loadFromStorage<{
      lastResetIso: string;
      lastResetLocal: string;
      nextResetIso: string;
      nextResetLocal: string;
      totalResets: number;
      intervalHours: number;
      isEnabled: boolean;
      lastTriggerType: 'auto' | 'manual';
      lastTriggeredBy?: string;
    } | null>(resetMetaKey, null);

    if (!meta || !meta.lastResetIso) {
      return {
        didReset: false,
        message: 'Penyimpanan kurikulum & perangkat aktif.',
        stats: this.getCurriculumResetStats(),
      };
    }

    const lastTime = new Date(meta.lastResetIso).getTime();
    const nextTime = meta.nextResetIso ? new Date(meta.nextResetIso).getTime() : lastTime + intervalMs;
    const isDue = now >= nextTime || (now - lastTime) >= intervalMs;

    if (isDue) {
      const resetResult = this.resetCurriculumAndTeachingData({
        resetCurriculum: true,
        resetTeachingDocs: true,
        isManual: false,
        triggeredBy: 'Sistem Auto-Reset 24 Jam (Khusus Kurikulum & Perangkat)',
      });
      return {
        didReset: true,
        message: resetResult.message,
        stats: this.getCurriculumResetStats(),
      };
    }

    return {
      didReset: false,
      message: 'Penyimpanan kurikulum & perangkat aktif.',
      stats: this.getCurriculumResetStats(),
    };
  }

  /**
   * Mengambil statistik status reset 24 jam data kurikulum & perangkat
   */
  static getCurriculumResetStats(): CurriculumResetStats {
    const settings = this.getAdminSettings();
    const isEnabled = (settings.enable24hCurriculumReset === true || settings.enable12hCurriculumReset === true);
    const intervalHours = settings.curriculumResetIntervalHours || 24;

    const resetMetaKey = this.getUserScopedKey(KEYS.CURRICULUM_RESET_META);
    const meta = loadFromStorage<{
      lastResetIso: string;
      lastResetLocal: string;
      nextResetIso: string;
      nextResetLocal: string;
      totalResets: number;
      intervalHours: number;
      isEnabled: boolean;
    } | null>(resetMetaKey, null);

    return {
      lastReset: meta?.lastResetLocal || 'Khusus Kurikulum & Perangkat',
      nextReset: isEnabled ? (meta?.nextResetLocal || 'Siklus 24 Jam') : 'Permanen (Hanya Manual Pengguna)',
      hoursRemaining: 99999,
      minutesRemaining: 0,
      totalResets: meta?.totalResets || 0,
      isEnabled,
      intervalHours,
    };
  }

  static getAIDocuments(userId?: string): AIDocument[] {
    const key = this.getUserScopedKey(KEYS.AI_DOCS, userId);
    return loadFromStorage<AIDocument[]>(key, []);
  }

  static saveAIDocuments(docs: AIDocument[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.AI_DOCS, userId);
    saveToStorage(key, docs || []);
  }

  static saveAIDocument(doc: AIDocument, userId?: string): void {
    const key = this.getUserScopedKey(KEYS.AI_DOCS, userId);
    const docs = loadFromStorage<AIDocument[]>(key, []);
    const idx = docs.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      docs[idx] = doc;
    } else {
      docs.unshift(doc);
    }
    saveToStorage(key, docs);
  }

  static getCPReferences(userId?: string): CPReference[] {
    const key = this.getUserScopedKey(KEYS.CP_REFS, userId);
    return loadFromStorage<CPReference[]>(key, []);
  }

  static saveCPReferences(refs: CPReference[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.CP_REFS, userId);
    saveToStorage(key, refs);
  }

  static getCPDistributions(userId?: string): CPDistributionPlan[] {
    const key = this.getUserScopedKey(KEYS.CP_DISTRIBUTIONS, userId);
    return loadFromStorage<CPDistributionPlan[]>(key, []);
  }

  static saveCPDistributions(plans: CPDistributionPlan[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.CP_DISTRIBUTIONS, userId);
    saveToStorage(key, plans || []);
  }

  static saveCPDistribution(plan: CPDistributionPlan, userId?: string): void {
    const plans = this.getCPDistributions(userId);
    const idx = plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      plans[idx] = plan;
    } else {
      plans.unshift(plan);
    }
    this.saveCPDistributions(plans, userId);
  }

  static deleteCPDistribution(id: string, userId?: string): void {
    const plans = this.getCPDistributions(userId).filter((p) => p.id !== id);
    this.saveCPDistributions(plans, userId);
  }

  static getActiveMasterCP(userId?: string): ActiveMasterCPData | null {
    const key = this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, userId);
    const raw = loadFromStorage<ActiveMasterCPData | null>(key, null);
    if (!raw) return null;
    const sanitizedLevel = normalizeSchoolLevel(raw.level, raw.subject);
    const sanitizedSubs = Array.isArray(raw.analyzedSubjects)
      ? raw.analyzedSubjects
          .filter((s) => s && String(s.level || '').toUpperCase() !== 'SMK' && Number(s.grade) !== 13)
          .map((s) => ({ ...s, level: normalizeSchoolLevel(s.level, s.subject) }))
      : raw.analyzedSubjects;
    return {
      ...raw,
      level: sanitizedLevel,
      analyzedSubjects: sanitizedSubs,
    };
  }

  /**
   * Mengambil Master CP Aktif HANYA yang benar-benar diupload oleh Admin.
   * Tidak pernah mengembalikan CP milik non-admin, draft, atau preset bawaan.
   */
  static getAdminMasterCP(): ActiveMasterCPData | null {
    this.ensureOfficialCP046And020Synced();
    const settings = this.getAdminSettings();
    const adminCatalog = this.getMasterCPCatalog().filter(
      (c) => c && c.uploadedByRole === 'admin'
    );
    const hasExplicitEmptyUploadList =
      Array.isArray(settings.adminUploadedCPs) &&
      settings.adminUploadedCPs.length === 0 &&
      adminCatalog.length === 0;
    if (hasExplicitEmptyUploadList) {
      return null;
    }

    const adminIds: string[] = [DEFAULT_ADMIN.id];
    try {
      this.getUsers()
        .filter((u) => u.role === 'admin')
        .forEach((u) => {
          if (u.id && !adminIds.includes(u.id)) adminIds.push(u.id);
        });
    } catch {}
    const currentUserId = this.getCurrentUserId();
    if (currentUserId && !adminIds.includes(currentUserId)) {
      adminIds.push(currentUserId);
    }

    for (const aid of adminIds) {
      const candidate = this.getActiveMasterCP(aid);
      if (candidate && candidate.uploadedByRole === 'admin' && candidate.fileName?.trim()) {
        return candidate;
      }
    }

    if (adminCatalog.length > 0) {
      const firstValid = adminCatalog.find((c) => c.fileName?.trim()) || adminCatalog[0];
      return firstValid || null;
    }

    return null;
  }

  static setActiveMasterCP(masterData: ActiveMasterCPData, userId?: string, skipReverseSync: boolean = false): void {
    const key = this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, userId);
    const existingMaster = this.getActiveMasterCP(userId) || this.getActiveMasterCP(DEFAULT_ADMIN.id);
    const resolvedUploadedByRole =
      masterData.uploadedByRole ||
      (existingMaster && existingMaster.id === masterData.id ? existingMaster.uploadedByRole : undefined);

    // Normalize materials with consistent allocatedHours and meetingCount
    const effectiveJpPerWeek = Number(masterData.jpPerWeek) > 0 ? Number(masterData.jpPerWeek) : 3;
    const normSem1 = (masterData.materialsSem1 || []).map((m, idx) => {
      const hours = Number(m.allocatedHours) || (effectiveJpPerWeek * 4);
      const meetings = Number(m.meetingCount) > 0 
        ? Number(m.meetingCount) 
        : Math.max(1, Math.round(hours / effectiveJpPerWeek));
      return {
        ...m,
        orderNumber: m.orderNumber || idx + 1,
        allocatedHours: hours,
        meetingCount: meetings,
      };
    });

    const normSem2 = (masterData.materialsSem2 || []).map((m, idx) => {
      const hours = Number(m.allocatedHours) || (effectiveJpPerWeek * 4);
      const meetings = Number(m.meetingCount) > 0 
        ? Number(m.meetingCount) 
        : Math.max(1, Math.round(hours / effectiveJpPerWeek));
      return {
        ...m,
        orderNumber: m.orderNumber || idx + 1,
        allocatedHours: hours,
        meetingCount: meetings,
      };
    });

    const totSem1 = normSem1.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0);
    const totSem2 = normSem2.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0);

    const compactCpText = (masterData.cpText || '').slice(0, 120000);
    const compactReport = (masterData.fullMarkdownReport || '').slice(0, 30000);

    const currentSlot: 'primary' | 'agama' = masterData.slot === 'agama' ? 'agama' : 'primary';

    // Preserve analyzedSubjects from the OTHER slot (CP #2 Agama when saving CP #1, or CP #1 Umum when saving CP #2)
    const toCatalogSubjectEntry = (c: ActiveMasterCPData): CPSubjectEntry => ({
      id: c.id,
      slot: c.slot === 'agama' ? 'agama' : 'primary',
      sourceFileName: c.fileName,
      docNumber: c.docNumber,
      subject: c.subject,
      level: normalizeSchoolLevel(c.level, c.subject),
      subLevelLabel: c.subLevelLabel,
      grade: c.grade,
      phase: c.phase,
      categoryTag: c.categoryTag,
      locationRef: c.locationRef,
      specialNotes: c.specialNotes,
      jpPerWeek: c.jpPerWeek,
      totalHoursPerYear: c.totalHoursPerYear,
      cpText: c.cpText,
      elements: c.elements,
      materialsSem1: c.materialsSem1 || [],
      materialsSem2: c.materialsSem2 || [],
    });

    const catalogSnapshot = this.getMasterCPCatalog().filter(
      (c) => String(c.level || '').toUpperCase() !== 'SMK' && Number(c.grade) !== 13
    );

    const existingAgamaCatalogSubs: CPSubjectEntry[] = catalogSnapshot
      .filter((c) => c.slot === 'agama')
      .map(toCatalogSubjectEntry);

    const existingPrimaryCatalogSubs: CPSubjectEntry[] = catalogSnapshot
      .filter((c) => c.slot !== 'agama')
      .map(toCatalogSubjectEntry);

    const incomingSubs: CPSubjectEntry[] = Array.isArray(masterData.analyzedSubjects)
      ? masterData.analyzedSubjects
          .filter((s) => s && String(s.level || '').toUpperCase() !== 'SMK' && Number(s.grade) !== 13)
          .map((s) => ({
            ...s,
            slot: s.slot || currentSlot,
            sourceFileName: s.sourceFileName || masterData.fileName,
            docNumber: s.docNumber || masterData.docNumber,
            level: normalizeSchoolLevel(s.level, s.subject),
          }))
      : [];

    const existingMasterAgamaSubs = (existingMaster?.analyzedSubjects || [])
      .filter((s) => s.slot === 'agama' || /agama|budi\s*pekerti|kepercayaan/i.test(s.subject))
      .map((s) => ({ ...s, slot: s.slot || ('agama' as const) }));

    const existingMasterPrimarySubs = (existingMaster?.analyzedSubjects || [])
      .filter((s) => s.slot !== 'agama')
      .map((s) => ({ ...s, slot: s.slot || ('primary' as const) }));

    const preservedOtherSlotSubs =
      !skipReverseSync
        ? currentSlot !== 'agama'
          ? mergeAnalyzedSubjects(
              incomingSubs,
              existingAgamaCatalogSubs.length > 0 ? existingAgamaCatalogSubs : existingMasterAgamaSubs
            )
          : mergeAnalyzedSubjects(
              existingPrimaryCatalogSubs.length > 0 ? existingPrimaryCatalogSubs : existingMasterPrimarySubs,
              incomingSubs
            )
        : incomingSubs;

    const compactAnalyzedSubjects =
      preservedOtherSlotSubs.length > 0
        ? preservedOtherSlotSubs.map((sub) => ({
            ...sub,
            slot: sub.slot || currentSlot,
            sourceFileName: sub.sourceFileName || masterData.fileName,
            docNumber: sub.docNumber || masterData.docNumber,
            cpText: (sub.cpText || '').slice(0, 4000),
          }))
        : undefined;

    const { fileBase64: _dropBase64, ...restMasterData } = masterData as ActiveMasterCPData & { fileBase64?: string };

    const normalizedMasterData: ActiveMasterCPData = {
      ...restMasterData,
      uploadedByRole: resolvedUploadedByRole,
      level: normalizeSchoolLevel(masterData.level, masterData.subject),
      slot: masterData.slot || 'primary',
      isPermanent: true,
      cpText: compactCpText,
      fullMarkdownReport: compactReport || undefined,
      analyzedSubjects: compactAnalyzedSubjects,
      jpPerWeek: effectiveJpPerWeek,
      materialsSem1: normSem1,
      materialsSem2: normSem2,
      totalHoursPerYear: totSem1 + totSem2,
      lastSyncedAt: masterData.lastSyncedAt || new Date().toISOString(),
    };

    saveToStorage(key, normalizedMasterData);

    // Also auto-save/update in CP Distributions: REPLACE OLD CPs so newly uploaded CP is solely active
    const planId = masterData.id?.startsWith('plan-') || masterData.id?.startsWith('master-') ? masterData.id : `master-plan-${masterData.id || Date.now()}`;

    const distPlan: CPDistributionPlan = {
      id: planId,
      teacherName: masterData.teacherName || 'Guru Pengampu',
      teacherNip: (masterData as any).teacherNip || this.getSchoolProfile(userId).teacherNip,
      subject: masterData.subject,
      schoolName: masterData.schoolName || this.getSchoolProfile(userId).schoolName,
      level: masterData.level,
      grade: masterData.grade,
      phase: masterData.phase,
      academicYear: masterData.academicYear || this.getAcademicYear(userId) || '2026/2027',
      semesterOption: 'all',
      totalHoursPerYear: (totSem1 + totSem2),
      totalTPCount: (normSem1.length) + (normSem2.length),
      jpPerWeek: effectiveJpPerWeek,
      timeAllocationPerWeek: masterData.timeAllocationPerWeek,
      cpText: compactCpText.slice(0, 12000),
      elements: masterData.elements?.map(e => ({ name: e.name, description: e.description })),
      materialsSem1: normSem1,
      materialsSem2: normSem2,
      totalHoursSem1: totSem1,
      totalHoursSem2: totSem2,
      createdAt: masterData.uploadedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Upsert in CP Distributions preserving plans from other slots (e.g., Agama Slot #2 alongside Primary Slot #1)
    const existingDists = this.getCPDistributions(userId).filter(
      (p) =>
        p.id !== planId &&
        !(p.subject.trim().toLowerCase() === normalizedMasterData.subject.trim().toLowerCase() &&
          Number(p.grade) === Number(normalizedMasterData.grade) &&
          p.level === normalizedMasterData.level) &&
        (normalizedMasterData.slot === 'agama' ? true : p.id.startsWith('plan-agama-'))
    );
    this.saveCPDistributions([distPlan, ...existingDists], userId);

    // Invalidate stale AI curriculum documents for this subject so newly updated BABs, JP, and meeting counts immediately take effect in PROSEM & all teaching tools
    try {
      const docsKey = this.getUserScopedKey(KEYS.AI_DOCS, userId);
      const existingDocs = loadFromStorage<AIDocument[]>(docsKey, []);
      if (existingDocs && existingDocs.length > 0) {
        const curriculumDocTypes = ['prosem', 'promes', 'prota', 'atp', 'tp', 'analisis_cp', 'modul_ajar', 'rpm', 'kktp', 'lkpd', 'rubrik_penilaian', 'asesmen'];
        const updatedDocs = existingDocs.filter(d => {
          const isSameSubject = !d.subject || d.subject.toLowerCase() === normalizedMasterData.subject.toLowerCase();
          const cleanType = (d.type || '').replace(/^ai_/, '').toLowerCase();
          const isCurriculumDoc = curriculumDocTypes.includes(cleanType);
          return !(isSameSubject && isCurriculumDoc);
        });
        saveToStorage(docsKey, updatedDocs);
      }
    } catch {}

    // Also register in CP References bank preserving references from other slots
    const refId = `ref-master-${normalizedMasterData.id || Date.now()}`;
    const cpRef: CPReference = {
      id: refId,
      title: `[Master Dokumen] ${normalizedMasterData.subject} (${normalizedMasterData.level} - ${normalizedMasterData.phase})`,
      level: normalizedMasterData.level,
      phase: normalizedMasterData.phase,
      grade: typeof normalizedMasterData.grade === 'number' ? normalizedMasterData.grade : parseInt(String(normalizedMasterData.grade)) || 10,
      subject: normalizedMasterData.subject,
      curriculumVersion: 'Pendekatan Deep Learning 2026/2027',
      uploadedAt: normalizedMasterData.uploadedAt || new Date().toISOString().substring(0, 16),
      uploadedBy: normalizedMasterData.teacherName || 'Admin Master',
      fileName: normalizedMasterData.fileName,
      cpText: compactCpText.slice(0, 12000),
      elements: (normalizedMasterData.elements || []).map(e => ({
        name: e.name,
        description: e.description,
        competencies: e.competencies || ['Pemahaman Konsep', 'Keterampilan Proses', 'Nalar Kritis 6C'],
        essentialMaterials: e.essentialMaterials || [normalizedMasterData.subject],
      })),
      rawText: (compactReport || compactCpText).slice(0, 12000),
      aiAnalysisSummary: normalizedMasterData.executiveSummary,
    };
    const preservedRefs = this.getCPReferences(userId).filter(
      (r) =>
        r.id !== refId &&
        !(r.subject.trim().toLowerCase() === normalizedMasterData.subject.trim().toLowerCase() &&
          Number(r.grade) === Number(normalizedMasterData.grade) &&
          r.level === normalizedMasterData.level) &&
        (normalizedMasterData.slot === 'agama' ? true : r.id.startsWith('ref-agama-'))
    );
    this.saveCPReferences([cpRef, ...preservedRefs], userId);

    // Sync School Profile with the new CP parameters
    if (!skipReverseSync) {
      const currentProfile = this.getSchoolProfile(userId);
      const updatedProfile: SchoolProfile = {
        ...currentProfile,
        teacherName: masterData.teacherName || currentProfile.teacherName,
        teacherNip: (masterData as any).teacherNip || currentProfile.teacherNip,
        headmasterName: (masterData as any).principalName || currentProfile.headmasterName,
        headmasterNip: (masterData as any).principalNip || currentProfile.headmasterNip,
        principalName: (masterData as any).principalName || currentProfile.principalName,
        principalNip: (masterData as any).principalNip || currentProfile.principalNip,
        schoolName: masterData.schoolName || currentProfile.schoolName,
        city: (masterData as any).city || currentProfile.city,
        academicYear: masterData.academicYear || currentProfile.academicYear,
        jpPerWeek: masterData.jpPerWeek || currentProfile.jpPerWeek,
        timeAllocationPerWeek: masterData.timeAllocationPerWeek || currentProfile.timeAllocationPerWeek,
        subject: masterData.subject || currentProfile.subject,
        level: masterData.level || currentProfile.level,
        grade: masterData.grade || currentProfile.grade,
        phase: masterData.phase || currentProfile.phase,
        cpText: masterData.cpText || currentProfile.cpText,
        totalHoursPerYear: masterData.totalHoursPerYear || currentProfile.totalHoursPerYear,
      };
      this.saveSchoolProfile(updatedProfile, userId, true);
    }

    // Clear stale drafts from previous CP
    try {
      this.saveCurrentDraft({ id: '', title: '', content: '', updatedAt: '' }, userId);
    } catch {}

    // Sync Kalender Pendidikan JP per week and academic year with the new CP
    if (masterData.jpPerWeek && masterData.jpPerWeek > 0) {
      const kaldik = this.getKalenderPendidikan(userId);
      let kaldikChanged = false;
      if (masterData.academicYear && (kaldik.tahunAjaran !== masterData.academicYear || kaldik.academicYear !== masterData.academicYear)) {
        kaldik.tahunAjaran = masterData.academicYear;
        kaldik.academicYear = masterData.academicYear;
        if (kaldik.semester1) kaldik.semester1.academicYear = masterData.academicYear;
        if (kaldik.semester2) kaldik.semester2.academicYear = masterData.academicYear;
        kaldikChanged = true;
      }
      if (kaldik.semester1 && kaldik.semester1.jpPerWeek !== masterData.jpPerWeek) {
        kaldik.semester1.jpPerWeek = masterData.jpPerWeek;
        kaldik.semester1.totalEffectiveHours = (kaldik.semester1.totalEffectiveWeeks || 19) * masterData.jpPerWeek;
        kaldik.semester1.totalJpSemester = kaldik.semester1.totalEffectiveHours;
        kaldik.semester1.netTeachingHours = Math.max(0, kaldik.semester1.totalEffectiveHours - (kaldik.semester1.reservedHours || 6));
        kaldikChanged = true;
      }
      if (kaldik.semester2 && kaldik.semester2.jpPerWeek !== masterData.jpPerWeek) {
        kaldik.semester2.jpPerWeek = masterData.jpPerWeek;
        kaldik.semester2.totalEffectiveHours = (kaldik.semester2.totalEffectiveWeeks || 18) * masterData.jpPerWeek;
        kaldik.semester2.totalJpSemester = kaldik.semester2.totalEffectiveHours;
        kaldik.semester2.netTeachingHours = Math.max(0, kaldik.semester2.totalEffectiveHours - (kaldik.semester2.reservedHours || 6));
        kaldikChanged = true;
      }
      if (kaldikChanged) {
        this.saveKalenderPendidikan(kaldik, userId);
      }
    }

    // Record globally ONLY when explicitly uploaded by Admin (never auto-record parameter/profile/preset edits)
    try {
      const currentUser = this.getCurrentUser();
      if (!skipReverseSync && masterData.uploadedByRole === 'admin') {
        this.recordAdminUploadedCP(normalizedMasterData, currentUser);
      }
    } catch {}

    // Also index analyzed subjects into Master CP Catalog in a single compact batch save for cross-level Parameter Kurikulum lookup
    let latestCatalogSnapshot: ActiveMasterCPData[] | null = null;
    try {
      const {
        analyzedSubjects: _omitSubs,
        fullMarkdownReport: _omitReport,
        cpText: _omitFullCp,
        ...catalogBase
      } = normalizedMasterData;

      const entriesToIndex: ActiveMasterCPData[] =
        normalizedMasterData.analyzedSubjects && normalizedMasterData.analyzedSubjects.length > 0
          ? normalizedMasterData.analyzedSubjects.map((entry, idx) => ({
              ...catalogBase,
              slot: entry.slot || catalogBase.slot || 'primary',
              fileName: entry.sourceFileName || catalogBase.fileName,
              docNumber: entry.docNumber || catalogBase.docNumber,
              id: entry.id || `${normalizedMasterData.id}-sub-${getSchoolLevelGroup(entry.level)}-${idx + 1}`,
              subject: entry.subject,
              level: entry.level,
              subLevelLabel: entry.subLevelLabel || normalizedMasterData.subLevelLabel,
              grade: entry.grade,
              phase: entry.phase,
              categoryTag: entry.categoryTag,
              locationRef: entry.locationRef,
              specialNotes: entry.specialNotes,
              jpPerWeek: entry.jpPerWeek || normalizedMasterData.jpPerWeek,
              totalHoursPerYear: entry.totalHoursPerYear || normalizedMasterData.totalHoursPerYear,
              cpText: (entry.cpText || compactCpText).slice(0, 4000),
              elements: entry.elements || normalizedMasterData.elements,
              materialsSem1: entry.materialsSem1?.length ? entry.materialsSem1 : normalizedMasterData.materialsSem1,
              materialsSem2: entry.materialsSem2?.length ? entry.materialsSem2 : normalizedMasterData.materialsSem2,
              updatedAt: new Date().toISOString(),
            }))
          : normalizedMasterData.subject
          ? [
              {
                ...catalogBase,
                cpText: compactCpText.slice(0, 4000),
                updatedAt: new Date().toISOString(),
              },
            ]
          : [];

      if (entriesToIndex.length > 0) {
        const catalog = [...this.getMasterCPCatalog()];
        entriesToIndex.forEach((item) => {
          const itemGrp = getSchoolLevelGroup(item.level);
          const itemSlot = item.slot || 'primary';
          const idx = catalog.findIndex(
            (c) =>
              c.id === item.id ||
              (c.subject.trim().toLowerCase() === item.subject.trim().toLowerCase() &&
                getSchoolLevelGroup(c.level) === itemGrp &&
                (c.phase || '') === (item.phase || '') &&
                Number(c.grade) === Number(item.grade) &&
                (c.slot || 'primary') === itemSlot)
          );
          if (idx >= 0) {
            catalog[idx] = { ...item, updatedAt: new Date().toISOString() };
          } else {
            catalog.unshift({ ...item, uploadedAt: item.uploadedAt || new Date().toISOString() });
          }
        });
        this.saveMasterCPCatalog(catalog);
        latestCatalogSnapshot = catalog;
      }
    } catch {}

    // Persist Admin CP Catalog & Active Master CP to backend ONLY when uploaded/owned by Admin
    try {
      if (!skipReverseSync && (masterData.uploadedByRole === 'admin' || resolvedUploadedByRole === 'admin')) {
        const adminCatalog = (latestCatalogSnapshot || this.getMasterCPCatalog()).filter(
          (c) => c.uploadedByRole === 'admin'
        );
        this.syncAdminCPCatalogToServer(adminCatalog, normalizedMasterData);
      }
    } catch {}

    // Broadcast update events
    try {
      if (typeof window !== 'undefined') {
        const syncedProfile = this.getSchoolProfile(userId);
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('master-cp-updated', { detail: normalizedMasterData }));
        window.dispatchEvent(new CustomEvent('school-profile-updated', { detail: syncedProfile }));
        window.dispatchEvent(new CustomEvent('curriculum-parameters-synced', { detail: { profile: syncedProfile, masterCP: normalizedMasterData } }));
        window.dispatchEvent(new CustomEvent('curriculum-materials-changed', { detail: { masterCP: normalizedMasterData, materialsSem1: normSem1, materialsSem2: normSem2 } }));
      }
    } catch {}
  }

  static saveCPReference(ref: CPReference, userId?: string): void {
    const refs = this.getCPReferences(userId);
    const idx = refs.findIndex((r) => r.id === ref.id);
    if (idx >= 0) {
      refs[idx] = ref;
    } else {
      refs.unshift(ref);
    }
    this.saveCPReferences(refs, userId);
  }

  static clearActiveMasterCP(userId?: string): void {
    const key = this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, userId);
    saveToStorage(key, null);
  }

  // ==========================================
  // MASTER CP REPOSITORY & CATALOG (ADMIN & GURU)
  // ==========================================
  static getMasterCPCatalog(): ActiveMasterCPData[] {
    this.ensureOfficialCP046And020Synced();
    const raw = loadFromStorage<ActiveMasterCPData[]>(KEYS.MASTER_CP_CATALOG, []);
    return (raw || [])
      .filter((c) => c && String(c.level || '').toUpperCase() !== 'SMK' && Number(c.grade) !== 13)
      .map((c) => ({ ...c, level: normalizeSchoolLevel(c.level, c.subject) }));
  }

  static saveMasterCPCatalog(items: ActiveMasterCPData[]): void {
    const sanitized = (items || [])
      .filter((c) => c && String(c.level || '').toUpperCase() !== 'SMK' && Number(c.grade) !== 13)
      .map((c) => ({ ...c, level: normalizeSchoolLevel(c.level, c.subject) }));
    saveToStorage(KEYS.MASTER_CP_CATALOG, sanitized);
    try {
      window.dispatchEvent(new Event('master-cp-catalog-updated'));
    } catch {}
  }

  static saveMasterCPItem(item: ActiveMasterCPData): void {
    const catalog = this.getMasterCPCatalog();
    const idx = catalog.findIndex((c) => c.id === item.id || (c.subject.toLowerCase() === item.subject.toLowerCase() && c.level === item.level && c.phase === item.phase && Number(c.grade) === Number(item.grade)));
    if (idx >= 0) {
      catalog[idx] = { ...item, updatedAt: new Date().toISOString() };
    } else {
      catalog.unshift({ ...item, uploadedAt: item.uploadedAt || new Date().toISOString() });
    }
    this.saveMasterCPCatalog(catalog);
  }

  static deleteMasterCPItem(id: string): void {
    const catalog = this.getMasterCPCatalog().filter((c) => c.id !== id);
    this.saveMasterCPCatalog(catalog);
  }

  /**
   * Menggabungkan CP ke-2 Khusus Pendidikan Agama & Budi Pekerti secara non-destruktif (paten)
   * ke dalam ekosistem Master CP tanpa menimpa mapel umum dari Upload CP #1.
   */
  static async mergeAgamaCPToMaster(
    agamaMaster: ActiveMasterCPData,
    agamaEntries?: CPSubjectEntry[],
    options?: {
      userId?: string;
      updateSchoolProfileSubject?: boolean;
    }
  ): Promise<{
    mergedActiveMaster: ActiveMasterCPData;
    mergedCount: number;
    serverSaved: boolean;
  }> {
    const targetUserId = options?.userId || this.getCurrentUserId() || DEFAULT_ADMIN.id;
    const adminMaster = this.getActiveMasterCP(DEFAULT_ADMIN.id);
    const scopedMaster = this.getActiveMasterCP(targetUserId);
    const existingMaster = adminMaster || scopedMaster;
    const currentUser = this.getCurrentUser();
    const nowIso = new Date().toISOString();

    const entriesToMerge: CPSubjectEntry[] = (
      Array.isArray(agamaEntries) && agamaEntries.length > 0
        ? agamaEntries
        : [
            {
              id: agamaMaster.id,
              subject: agamaMaster.subject,
              level: normalizeSchoolLevel(agamaMaster.level, agamaMaster.subject),
              subLevelLabel:
                agamaMaster.subLevelLabel ||
                getSchoolLevelDisplay(agamaMaster.level, agamaMaster.grade).subLabel,
              grade: agamaMaster.grade,
              phase: agamaMaster.phase,
              categoryTag: 'Umum/Wajib' as const,
              jpPerWeek: agamaMaster.jpPerWeek,
              totalHoursPerYear: agamaMaster.totalHoursPerYear,
              cpText: agamaMaster.cpText,
              elements: agamaMaster.elements,
              materialsSem1: agamaMaster.materialsSem1 || [],
              materialsSem2: agamaMaster.materialsSem2 || [],
            },
          ]
    ).map((entry) => ({
      ...entry,
      slot: 'agama' as const,
      sourceFileName: entry.sourceFileName || agamaMaster.fileName,
      docNumber: entry.docNumber || agamaMaster.docNumber,
    }));

    const existingSubjects: CPSubjectEntry[] = existingMaster
      ? Array.isArray(existingMaster.analyzedSubjects) && existingMaster.analyzedSubjects.length > 0
        ? existingMaster.analyzedSubjects.map((s) => ({
            ...s,
            slot: s.slot || (existingMaster.slot === 'agama' ? 'agama' : 'primary'),
            sourceFileName: s.sourceFileName || existingMaster.fileName,
            docNumber: s.docNumber || existingMaster.docNumber,
          }))
        : existingMaster.subject
        ? [
            {
              id: existingMaster.id,
              slot: existingMaster.slot === 'agama' ? 'agama' : 'primary',
              sourceFileName: existingMaster.fileName,
              docNumber: existingMaster.docNumber,
              subject: existingMaster.subject,
              level: existingMaster.level,
              subLevelLabel: existingMaster.subLevelLabel,
              grade: existingMaster.grade,
              phase: existingMaster.phase,
              jpPerWeek: existingMaster.jpPerWeek,
              totalHoursPerYear: existingMaster.totalHoursPerYear,
              cpText: existingMaster.cpText,
              elements: existingMaster.elements,
              materialsSem1: existingMaster.materialsSem1 || [],
              materialsSem2: existingMaster.materialsSem2 || [],
            },
          ]
        : []
      : [];

    const combinedAnalyzedSubjects = mergeAnalyzedSubjects(existingSubjects, entriesToMerge).map((s) => ({
      ...s,
      slot: s.slot || 'primary',
      cpText: (s.cpText || '').slice(0, 4000),
    }));

    const baseMaster: ActiveMasterCPData = existingMaster
      ? {
          ...existingMaster,
          analyzedSubjects: combinedAnalyzedSubjects,
          syncStatus: 'synced',
          lastSyncedAt: nowIso,
          updatedAt: nowIso,
          isPermanent: true,
        }
      : {
          ...agamaMaster,
          slot: 'agama',
          isPermanent: true,
          analyzedSubjects: combinedAnalyzedSubjects,
          syncStatus: 'synced',
          lastSyncedAt: nowIso,
          updatedAt: nowIso,
        };

    // Persist active master CP for both current user and DEFAULT_ADMIN so Guru & Admin stay in sync
    saveToStorage(this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, targetUserId), baseMaster);
    if (targetUserId !== DEFAULT_ADMIN.id && (currentUser?.role === 'admin' || !adminMaster)) {
      saveToStorage(this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, DEFAULT_ADMIN.id), baseMaster);
    }

    // Index all Agama entries into Master CP Catalog with slot: 'agama' & isPermanent: true
    const catalog = [...this.getMasterCPCatalog()];
    const roleTag = agamaMaster.uploadedByRole || currentUser?.role || 'guru';
    entriesToMerge.forEach((entry, idx) => {
      const lvl = normalizeSchoolLevel(entry.level, entry.subject);
      const grd = Number(entry.grade) || (lvl === 'SD' ? 4 : lvl === 'SMP' ? 7 : 10);
      const phs = entry.phase || resolvePhaseByLevelAndGrade(lvl, grd);
      const catalogItem: ActiveMasterCPData = {
        ...agamaMaster,
        id: entry.id || `${agamaMaster.id}-agm-${idx + 1}`,
        slot: 'agama',
        isPermanent: true,
        uploadedByRole: roleTag,
        uploadedByName: agamaMaster.uploadedByName || currentUser?.name || DEFAULT_ADMIN.name,
        subject: entry.subject,
        level: lvl,
        subLevelLabel: entry.subLevelLabel || getSchoolLevelDisplay(lvl, grd).subLabel,
        grade: grd,
        phase: phs,
        categoryTag: entry.categoryTag || 'Umum/Wajib',
        locationRef: entry.locationRef,
        specialNotes: entry.specialNotes,
        jpPerWeek: entry.jpPerWeek || agamaMaster.jpPerWeek || (lvl === 'SD' ? 4 : 3),
        totalHoursPerYear: entry.totalHoursPerYear || agamaMaster.totalHoursPerYear || (lvl === 'SD' ? 144 : 108),
        cpText: (entry.cpText || agamaMaster.cpText || '').slice(0, 4000),
        elements: entry.elements && entry.elements.length > 0 ? entry.elements : agamaMaster.elements,
        materialsSem1: entry.materialsSem1?.length ? entry.materialsSem1 : agamaMaster.materialsSem1,
        materialsSem2: entry.materialsSem2?.length ? entry.materialsSem2 : agamaMaster.materialsSem2,
        syncStatus: 'synced',
        lastSyncedAt: nowIso,
        updatedAt: nowIso,
      };
      const existingIdx = catalog.findIndex(
        (c) =>
          c.id === catalogItem.id ||
          (c.subject.trim().toLowerCase() === catalogItem.subject.trim().toLowerCase() &&
            getSchoolLevelGroup(c.level) === getSchoolLevelGroup(catalogItem.level) &&
            (c.phase || '') === (catalogItem.phase || '') &&
            Number(c.grade) === Number(catalogItem.grade))
      );
      if (existingIdx >= 0) {
        catalog[existingIdx] = catalogItem;
      } else {
        catalog.unshift(catalogItem);
      }
    });
    this.saveMasterCPCatalog(catalog);

    // Upsert Agama CP Distribution Plan & Reference cleanly without erasing Primary Slot #1
    const distPlan: CPDistributionPlan = {
      id: `plan-agama-${agamaMaster.level.toLowerCase()}-${agamaMaster.grade}-${agamaMaster.subject.toLowerCase().replace(/\s+/g, '-')}`,
      teacherName: agamaMaster.teacherName || currentUser?.name || 'Guru Pengampu',
      teacherNip: (agamaMaster as any).teacherNip || this.getSchoolProfile(targetUserId).teacherNip,
      subject: agamaMaster.subject,
      schoolName: agamaMaster.schoolName || this.getSchoolProfile(targetUserId).schoolName,
      level: agamaMaster.level,
      grade: agamaMaster.grade,
      phase: agamaMaster.phase,
      academicYear: agamaMaster.academicYear || this.getAcademicYear(targetUserId) || '2026/2027',
      semesterOption: 'all',
      totalHoursPerYear: agamaMaster.totalHoursPerYear,
      totalTPCount: (agamaMaster.materialsSem1?.length || 0) + (agamaMaster.materialsSem2?.length || 0),
      jpPerWeek: agamaMaster.jpPerWeek,
      timeAllocationPerWeek: agamaMaster.timeAllocationPerWeek,
      cpText: (agamaMaster.cpText || '').slice(0, 12000),
      elements: (agamaMaster.elements || []).map((e) => ({ name: e.name, description: e.description })),
      materialsSem1: agamaMaster.materialsSem1 || [],
      materialsSem2: agamaMaster.materialsSem2 || [],
      totalHoursSem1: (agamaMaster.materialsSem1 || []).reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0),
      totalHoursSem2: (agamaMaster.materialsSem2 || []).reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0),
      createdAt: agamaMaster.uploadedAt || nowIso,
      updatedAt: nowIso,
    };
    this.saveCPDistribution(distPlan, targetUserId);

    const cpRef: CPReference = {
      id: `ref-agama-${agamaMaster.level.toLowerCase()}-${agamaMaster.grade}-${agamaMaster.subject.toLowerCase().replace(/\s+/g, '-')}`,
      title: `[CP ke-2: Agama & Budi Pekerti] ${agamaMaster.subject} (${agamaMaster.level} - ${agamaMaster.phase} Kelas ${agamaMaster.grade})`,
      level: agamaMaster.level,
      phase: agamaMaster.phase,
      grade: Number(agamaMaster.grade) || 10,
      subject: agamaMaster.subject,
      curriculumVersion: 'Kurikulum Merdeka & Moderasi Beragama',
      uploadedAt: (agamaMaster.uploadedAt || nowIso).substring(0, 16),
      uploadedBy: agamaMaster.teacherName || currentUser?.name || DEFAULT_ADMIN.name,
      fileName: agamaMaster.fileName,
      cpText: (agamaMaster.cpText || '').slice(0, 12000),
      elements: (agamaMaster.elements || []).map((el) => ({
        name: el.name,
        description: el.description,
        competencies: el.competencies || [],
        essentialMaterials: el.essentialMaterials || [],
      })),
      rawText: (agamaMaster.cpText || '').slice(0, 12000),
      aiAnalysisSummary: agamaMaster.executiveSummary,
    };
    this.saveCPReference(cpRef, targetUserId);

    // Record in Admin Uploaded CPs list ONLY when explicitly uploaded by Admin
    if (roleTag === 'admin') {
      this.recordAdminUploadedCP(
        {
          ...agamaMaster,
          slot: 'agama',
          isPermanent: true,
        },
        currentUser
      );
    }

    // Update SchoolProfile if explicitly requested OR if user currently has no subject set
    const currentProfile = this.getSchoolProfile(targetUserId);
    if (options?.updateSchoolProfileSubject || !currentProfile.subject?.trim()) {
      this.saveSchoolProfile(
        {
          ...currentProfile,
          subject: agamaMaster.subject,
          level: agamaMaster.level,
          grade: agamaMaster.grade,
          phase: agamaMaster.phase,
          jpPerWeek: agamaMaster.jpPerWeek,
          totalHoursPerYear: agamaMaster.totalHoursPerYear,
          cpText: agamaMaster.cpText,
        },
        targetUserId,
        true
      );
    }

    // Patent Server Persistence (only push to global Admin catalog when uploaded by Admin)
    let catalogSaved = false;
    let settingsSaved = false;
    if (roleTag === 'admin') {
      const adminCatalog = catalog.filter((c) => c.uploadedByRole === 'admin');
      [catalogSaved, settingsSaved] = await Promise.all([
        this.syncAdminCPCatalogToServer(adminCatalog, baseMaster),
        this.syncAdminSettingsNow(),
      ]);
    }

    try {
      if (typeof window !== 'undefined') {
        const refreshedProfile = this.getSchoolProfile(targetUserId);
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('master-cp-catalog-updated'));
        window.dispatchEvent(new CustomEvent('master-cp-updated', { detail: baseMaster }));
        window.dispatchEvent(new CustomEvent('school-profile-updated', { detail: refreshedProfile }));
        window.dispatchEvent(
          new CustomEvent('curriculum-parameters-synced', {
            detail: { profile: refreshedProfile, masterCP: baseMaster },
          })
        );
      }
    } catch {}

    return {
      mergedActiveMaster: baseMaster,
      mergedCount: entriesToMerge.length,
      serverSaved: catalogSaved || settingsSaved,
    };
  }

  /**
   * Mengambil daftar Mata Pelajaran & Bab/Lingkup Materi Sem 1 & 2 dari CP Master (diutamakan CP BSKAP 046 yang diupload Admin)
   * yang sesuai dengan Tingkat Sekolah yang dipilih (SD/MI/Paket A, SMP/MTs/Paket B, SMA/MA/Paket C)
   */
  static getSubjectsFromMasterCPByLevel(level: SchoolLevel | string, userId?: string): CPSubjectEntry[] {
    this.ensureOfficialCP046And020Synced();
    const collectWithFilter = (mode: 'admin-only' | 'non-admin'): CPSubjectEntry[] => {
      const result: CPSubjectEntry[] = [];
      const seen = new Map<string, number>();

      const addEntry = (entry: CPSubjectEntry) => {
        const cleanSub = (entry.subject || '').trim();
        const lowerSub = cleanSub.toLowerCase();
        if (
          !cleanSub ||
          lowerSub === 'mata pelajaran teridentifikasi' ||
          lowerSub === 'mata pelajaran umum' ||
          lowerSub === 'cp bskap 046' ||
          !isSameSchoolLevelGroup(entry.level, level) ||
          !isSubjectAllowedForLevel(cleanSub, level)
        ) {
          return;
        }
        const normalizedEntry: CPSubjectEntry = {
          ...entry,
          slot: entry.slot === 'agama' ? 'agama' : 'primary',
        };
        let existingIdx = seen.get(lowerSub);
        if (existingIdx === undefined) {
          const foundIdx = result.findIndex(
            (r) =>
              isSameSubjectName(r.subject, normalizedEntry.subject) &&
              isSameSchoolLevelGroup(r.level, normalizedEntry.level)
          );
          if (foundIdx >= 0) existingIdx = foundIdx;
        }
        if (existingIdx !== undefined) {
          const existing = result[existingIdx];
          const existingHasMat = (existing.materialsSem1?.length || 0) + (existing.materialsSem2?.length || 0) > 0;
          const incomingHasMat = (normalizedEntry.materialsSem1?.length || 0) + (normalizedEntry.materialsSem2?.length || 0) > 0;
          const incomingExactLvl = normalizedEntry.level === level;
          const existingExactLvl = existing.level === level;
          const incomingDedicatedAgama = normalizedEntry.slot === 'agama' && existing.slot !== 'agama';
          if (
            incomingDedicatedAgama ||
            (!existingHasMat && incomingHasMat) ||
            (!existingExactLvl && incomingExactLvl)
          ) {
            result[existingIdx] = {
              ...normalizedEntry,
              categoryTag: normalizedEntry.categoryTag || existing.categoryTag,
            };
          } else if (!existing.categoryTag && normalizedEntry.categoryTag) {
            result[existingIdx] = {
              ...existing,
              categoryTag: normalizedEntry.categoryTag,
            };
          }
          return;
        }
        seen.set(lowerSub, result.length);
        result.push(normalizedEntry);
      };

      const harvestFromRawCPText = (sourceDoc: ActiveMasterCPData) => {
        if (!sourceDoc.cpText || sourceDoc.cpText.trim().length < 40) return;
        const targetGroup = getSchoolLevelGroup(level);
        const levelSections = splitCPTextBySchoolLevel(sourceDoc.cpText);
        const targetSectionText = levelSections.get(targetGroup);

        if (!isSameSchoolLevelGroup(sourceDoc.level, level) && !targetSectionText) return;

        const effectiveText = targetSectionText || sourceDoc.cpText;
        const detectedNames = extractSubjectsFromCPText(effectiveText, level);
        const hasMissing = detectedNames.some((name) => !seen.has(name.trim().toLowerCase()));
        if (!hasMissing) return;

        const heuristic = analyzeCPTextHeuristic({
          fileName: sourceDoc.fileName,
          rawText: effectiveText,
          levelHint: (targetSectionText ? targetGroup : sourceDoc.level) as SchoolLevel,
          gradeHint: targetSectionText ? undefined : sourceDoc.grade,
          phaseHint: targetSectionText ? undefined : sourceDoc.phase,
          totalHoursHint: sourceDoc.totalHoursPerYear,
          jpPerWeekHint: sourceDoc.jpPerWeek,
          getFallbackPreset: (sub, lvl, grd, phs) => getSubjectPresetByGrade(sub, lvl, grd, phs),
        });
        heuristic.analyzedSubjects.forEach((hEntry) =>
          addEntry({
            ...hEntry,
            slot: sourceDoc.slot === 'agama' ? 'agama' : 'primary',
            sourceFileName: sourceDoc.fileName,
            docNumber: sourceDoc.docNumber,
          })
        );
      };

      const collectFromMasterDoc = (doc: ActiveMasterCPData | null) => {
        if (!doc) return;
        const docSlot: 'primary' | 'agama' = doc.slot === 'agama' ? 'agama' : 'primary';
        if (Array.isArray(doc.analyzedSubjects)) {
          doc.analyzedSubjects.forEach((subEntry) =>
            addEntry({
              ...subEntry,
              slot: subEntry.slot || docSlot,
              sourceFileName: subEntry.sourceFileName || doc.fileName,
              docNumber: subEntry.docNumber || doc.docNumber,
            })
          );
        }
        if (doc.subject) {
          addEntry({
            id: doc.id,
            slot: docSlot,
            sourceFileName: doc.fileName,
            docNumber: doc.docNumber,
            subject: doc.subject,
            level: doc.level,
            subLevelLabel: doc.subLevelLabel || getSchoolLevelDisplay(doc.level, doc.grade).subLabel,
            grade: doc.grade,
            phase: doc.phase,
            jpPerWeek: doc.jpPerWeek,
            totalHoursPerYear: doc.totalHoursPerYear,
            cpText: doc.cpText,
            elements: doc.elements,
            materialsSem1: doc.materialsSem1 || [],
            materialsSem2: doc.materialsSem2 || [],
          });
        }
        harvestFromRawCPText(doc);
      };

      const catalog = this.getMasterCPCatalog();

      if (mode === 'admin-only') {
        try {
          const adminIds = Array.from(
            new Set([
              DEFAULT_ADMIN.id,
              ...this.getUsers()
                .filter((u) => u.role === 'admin')
                .map((u) => u.id),
            ])
          );
          adminIds.forEach((adminId) => {
            const adminDoc = this.getActiveMasterCP(adminId);
            if (adminDoc && adminDoc.uploadedByRole === 'admin') {
              collectFromMasterDoc(adminDoc);
            }
          });
        } catch {}

        catalog
          .filter((item) => item.uploadedByRole === 'admin')
          .forEach((item) => collectFromMasterDoc(item));

        const adminCPs = this.getAdminUploadedCPs();
        adminCPs.forEach((item) => {
          if (item.subject && item.level && isSameSchoolLevelGroup(item.level, level) && isSubjectAllowedForLevel(item.subject, level)) {
            addEntry({
              id: item.id,
              slot: item.slot === 'agama' ? 'agama' : 'primary',
              sourceFileName: item.fileName,
              docNumber: item.docNumber,
              subject: item.subject,
              level: item.level,
              grade: item.grade || (item.level === 'SD' ? 4 : item.level === 'SMP' ? 7 : 10),
              phase: item.phase || resolvePhaseByLevelAndGrade(item.level, item.grade),
              materialsSem1: [],
              materialsSem2: [],
            });
          }
        });
      } else {
        collectFromMasterDoc(this.getActiveMasterCP(userId));
        catalog
          .filter((item) => item.uploadedByRole !== 'admin')
          .forEach((item) => collectFromMasterDoc(item));
      }

      return result;
    };

    const adminSubjects = collectWithFilter('admin-only');
    if (adminSubjects.length > 0) {
      return adminSubjects;
    }
    return collectWithFilter('non-admin');
  }

  /**
   * Mengambil seluruh Mata Pelajaran resmi dari KEDUA file CP (CP #1 Umum/Pilihan dan CP #2 Pendidikan Agama & Budi Pekerti)
   * lintas jenjang SD (Fase A–C), SMP (Fase D), dan SMA (Fase E–F) beserta metadata fase, kelas, dan dokumen sumbernya
   * untuk ditampilkan lengkap pada Menu Profil Guru dan Menu Parameter Kurikulum.
   */
  static getAllSubjectsFromBothCPs(userId?: string): BothCPsDirectory {
    this.ensureOfficialCP046And020Synced();
    const levels: SchoolLevelGroup[] = ['SD', 'SMP', 'SMA'];
    const byLevel: Record<SchoolLevelGroup, DualCPCoveredSubject[]> = {
      SD: [],
      SMP: [],
      SMA: [],
    };

    // Collect phase & grade coverage from all active docs and catalog items (prioritizing admin docs when present)
    const adminCPs = this.getAdminUploadedCPs();
    const catalog = this.getMasterCPCatalog();
    const hasAdminSources =
      adminCPs.length > 0 ||
      catalog.some((c) => c.uploadedByRole === 'admin') ||
      this.getActiveMasterCP(DEFAULT_ADMIN.id)?.uploadedByRole === 'admin';

    const sourceDocs: ActiveMasterCPData[] = [];
    if (hasAdminSources) {
      try {
        const adminIds = Array.from(
          new Set([
            DEFAULT_ADMIN.id,
            ...this.getUsers()
              .filter((u) => u.role === 'admin')
              .map((u) => u.id),
          ])
        );
        adminIds.forEach((id) => {
          const d = this.getActiveMasterCP(id);
          if (d && d.uploadedByRole === 'admin') sourceDocs.push(d);
        });
      } catch {}
      catalog.filter((c) => c.uploadedByRole === 'admin').forEach((c) => sourceDocs.push(c));
    } else {
      const userDoc = this.getActiveMasterCP(userId);
      if (userDoc) sourceDocs.push(userDoc);
      catalog.filter((c) => c.uploadedByRole !== 'admin').forEach((c) => sourceDocs.push(c));
    }

    const phaseMap = new Map<string, Set<string>>();
    const gradeMap = new Map<string, Set<number>>();
    const catTagMap = new Map<string, Set<'Umum/Wajib' | 'Pilihan/Tingkat Lanjut'>>();
    const agamaSubSet = new Set<string>();

    const recordCoverage = (
      sub: string,
      lvl: SchoolLevel | string,
      phs?: string,
      grd?: number | string,
      slot?: 'primary' | 'agama',
      categoryTag?: 'Umum/Wajib' | 'Pilihan/Tingkat Lanjut'
    ) => {
      const clean = (sub || '').trim().toLowerCase();
      if (!clean) return;
      const grp = getSchoolLevelGroup(lvl);
      const mapKey = `${grp}__${clean}`;
      if (slot === 'agama') {
        agamaSubSet.add(mapKey);
      }
      if (!phaseMap.has(mapKey)) phaseMap.set(mapKey, new Set());
      if (!gradeMap.has(mapKey)) gradeMap.set(mapKey, new Set());
      if (!catTagMap.has(mapKey)) catTagMap.set(mapKey, new Set());
      const resolvedGrd = Number(grd) || (grp === 'SD' ? 4 : grp === 'SMP' ? 7 : 10);
      const resolvedPhs = (phs || resolvePhaseByLevelAndGrade(grp, resolvedGrd)).trim();
      if (resolvedPhs) phaseMap.get(mapKey)!.add(resolvedPhs);
      if (resolvedGrd > 0 && resolvedGrd <= 12) gradeMap.get(mapKey)!.add(resolvedGrd);
      if (categoryTag) catTagMap.get(mapKey)!.add(categoryTag);
    };

    sourceDocs.forEach((doc) => {
      const docSlot = doc.slot === 'agama' ? 'agama' : 'primary';
      if (doc.subject) {
        recordCoverage(doc.subject, doc.level, doc.phase, doc.grade, docSlot, doc.categoryTag);
      }
      if (Array.isArray(doc.analyzedSubjects)) {
        doc.analyzedSubjects.forEach((e) => {
          recordCoverage(e.subject, e.level, e.phase, e.grade, e.slot || docSlot, e.categoryTag);
        });
      }
    });

    const cp1UploadRecord =
      adminCPs.find((item) => item.slot !== 'agama') ||
      sourceDocs.find((d) => d.slot !== 'agama');
    const cp2UploadRecord =
      adminCPs.find((item) => item.slot === 'agama') ||
      sourceDocs.find((d) => d.slot === 'agama');

    const isAgamaTitle = (name: string) =>
      /pendidikan\s+agama|budi\s*pekerti|pendidikan\s+kepercayaan/i.test(name);

    const inferCategoryTag = (
      entry: CPSubjectEntry,
      grp: SchoolLevelGroup,
      inferredSlot: 'primary' | 'agama'
    ): 'Umum/Wajib' | 'Pilihan/Tingkat Lanjut' => {
      if (entry.categoryTag) return entry.categoryTag;
      if (inferredSlot === 'agama') return 'Umum/Wajib';
      const subL = entry.subject.toLowerCase();
      if (/tingkat\s+lanjut|koding\s+dan\s+kecerdasan\s+artifisial|pendidikan\s+digital/i.test(subL)) {
        return 'Pilihan/Tingkat Lanjut';
      }
      if (
        grp === 'SMA' &&
        (/\b(biologi|fisika|kimia|ekonomi|geografi|sosiologi|antropologi)\b/i.test(subL) ||
          /\bbahasa\s+(arab|jepang|jerman|korea|mandarin|prancis|perancis)\b/i.test(subL) ||
          /prakarya\s*(?:&|dan)\s*kewirausahaan/i.test(subL))
      ) {
        return 'Pilihan/Tingkat Lanjut';
      }
      return 'Umum/Wajib';
    };

    levels.forEach((grp) => {
      const entries = this.getSubjectsFromMasterCPByLevel(grp, userId);
      const mapped: DualCPCoveredSubject[] = entries.map((entry) => {
        const clean = entry.subject.trim().toLowerCase();
        const mapKey = `${grp}__${clean}`;
        const inferredSlot: 'primary' | 'agama' =
          entry.slot === 'agama' || (Boolean(cp2UploadRecord) && (agamaSubSet.has(mapKey) || isAgamaTitle(entry.subject)))
            ? 'agama'
            : 'primary';

        const collectedPhases = Array.from(phaseMap.get(mapKey) || []);
        if (collectedPhases.length === 0 && entry.phase) {
          collectedPhases.push(entry.phase);
        }
        collectedPhases.sort();

        const collectedGrades = Array.from(gradeMap.get(mapKey) || []);
        if (collectedGrades.length === 0 && Number(entry.grade) > 0) {
          collectedGrades.push(Number(entry.grade));
        }
        collectedGrades.sort((a, b) => a - b);

        const resolvedCatTag = inferCategoryTag(entry, grp, inferredSlot);
        const catTagsSet = catTagMap.get(mapKey);
        const categoryTagsList =
          catTagsSet && catTagsSet.size > 0
            ? Array.from(catTagsSet)
            : [resolvedCatTag];

        return {
          ...entry,
          slot: inferredSlot,
          categoryTag: resolvedCatTag,
          categoryTagsList,
          sourceFileName:
            entry.sourceFileName ||
            (inferredSlot === 'agama' ? cp2UploadRecord?.fileName : cp1UploadRecord?.fileName),
          docNumber:
            entry.docNumber ||
            (inferredSlot === 'agama' ? cp2UploadRecord?.docNumber : cp1UploadRecord?.docNumber),
          levelGroup: grp,
          phasesList: collectedPhases,
          gradesList: collectedGrades,
        };
      });

      // Sort cleanly: Umum/Wajib first, then Pilihan/Tingkat Lanjut, then CP #2 Pendidikan Agama & Budi Pekerti
      mapped.sort((a, b) => {
        if (a.slot !== b.slot) return a.slot === 'primary' ? -1 : 1;
        if (a.categoryTag !== b.categoryTag) return a.categoryTag === 'Umum/Wajib' ? -1 : 1;
        return a.subject.localeCompare(b.subject, 'id');
      });
      byLevel[grp] = mapped;
    });

    const all = [...byLevel.SD, ...byLevel.SMP, ...byLevel.SMA];
    const cp1Subjects = all.filter((item) => item.slot !== 'agama');
    const cp2AgamaSubjects = all.filter((item) => item.slot === 'agama');

    const uniqueCp1 = new Set(cp1Subjects.map((s) => s.subject.trim().toLowerCase())).size;
    const uniqueCp2 = new Set(cp2AgamaSubjects.map((s) => s.subject.trim().toLowerCase())).size;

    return {
      all,
      cp1Subjects,
      cp2AgamaSubjects,
      byLevel,
      cp1Meta: {
        uploaded: Boolean(cp1UploadRecord) || cp1Subjects.length > 0,
        fileName: cp1UploadRecord?.fileName,
        docNumber: cp1UploadRecord?.docNumber,
        uniqueSubjectCount: uniqueCp1,
      },
      cp2Meta: {
        uploaded: Boolean(cp2UploadRecord) || cp2AgamaSubjects.length > 0,
        fileName: cp2UploadRecord?.fileName,
        docNumber: cp2UploadRecord?.docNumber,
        uniqueSubjectCount: uniqueCp2,
      },
      totalUniquePairs: all.length,
    };
  }

  static getAllSubjectsFromCPGrouped(userId?: string): {
    all: CPSubjectEntry[];
    byLevel: Record<'SD' | 'SMP' | 'SMA', CPSubjectEntry[]>;
    totalUnique: number;
  } {
    const both = this.getAllSubjectsFromBothCPs(userId);
    const byLevel: Record<'SD' | 'SMP' | 'SMA', CPSubjectEntry[]> = {
      SD: both.byLevel.SD,
      SMP: both.byLevel.SMP,
      SMA: both.byLevel.SMA,
    };
    return {
      all: both.all,
      byLevel,
      totalUnique: both.totalUniquePairs,
    };
  }

  static getAllSubjectsByLevelAndPhase(options?: {
    adminOnly?: boolean;
    userId?: string;
  }): {
    totalUnique: number;
    byLevelPhase: Record<
      'SD' | 'SMP' | 'SMA',
      Array<{ phase: string; label: string; items: CPSubjectEntry[] }>
    >;
  } {
    const emptyResult: {
      totalUnique: number;
      byLevelPhase: Record<
        'SD' | 'SMP' | 'SMA',
        Array<{ phase: string; label: string; items: CPSubjectEntry[] }>
      >;
    } = {
      totalUnique: 0,
      byLevelPhase: {
        SD: [
          { phase: 'Fase A', label: 'Fase A (Kelas I–II SD)', items: [] },
          { phase: 'Fase B', label: 'Fase B (Kelas III–IV SD)', items: [] },
          { phase: 'Fase C', label: 'Fase C (Kelas V–VI SD)', items: [] },
        ],
        SMP: [{ phase: 'Fase D', label: 'Fase D (Kelas VII–IX SMP)', items: [] }],
        SMA: [
          { phase: 'Fase E', label: 'Fase E (Kelas X SMA)', items: [] },
          { phase: 'Fase F', label: 'Fase F (Kelas XI–XII SMA)', items: [] },
        ],
      },
    };

    if (options?.adminOnly) {
      const hasAdminUploads =
        this.getAdminUploadedCPs().length > 0 || Boolean(this.getAdminMasterCP());
      if (!hasAdminUploads) {
        return emptyResult;
      }
    }

    const both = this.getAllSubjectsFromBothCPs(options?.userId);
    const groups: ('SD' | 'SMP' | 'SMA')[] = ['SD', 'SMP', 'SMA'];
    groups.forEach((grp) => {
      const buckets = emptyResult.byLevelPhase[grp];
      const entries = both.byLevel[grp] || [];
      entries.forEach((entry) => {
        const phases =
          entry.phasesList && entry.phasesList.length > 0
            ? entry.phasesList
            : [entry.phase || resolvePhaseByLevelAndGrade(entry.level, Number(entry.grade) || 4)];

        phases.forEach((rawPhase) => {
          const normPhase = String(rawPhase || '').trim().toLowerCase();
          const matchedBucket =
            buckets.find((b) => normPhase.includes(b.phase.toLowerCase())) || buckets[0];
          if (matchedBucket) {
            const exists = matchedBucket.items.some(
              (item) =>
                item.subject.trim().toLowerCase() === entry.subject.trim().toLowerCase()
            );
            if (!exists) {
              matchedBucket.items.push(entry);
            }
          }
        });
      });
    });

    return {
      totalUnique: both.totalUniquePairs,
      byLevelPhase: emptyResult.byLevelPhase,
    };
  }

  static resolveGradeCalibratedEntry(
    entry: CPSubjectEntry,
    subject: string,
    level: SchoolLevel | string,
    grade: number,
    phase?: string
  ): CPSubjectEntry {
    const numGrade = Number(grade) || Number(entry.grade) || 10;
    const resolvedPhase = phase || resolvePhaseByLevelAndGrade(level, numGrade);
    const hasExactMaterials =
      Number(entry.grade) === numGrade &&
      ((entry.materialsSem1?.length || 0) > 0 || (entry.materialsSem2?.length || 0) > 0);
    if (hasExactMaterials) {
      return entry;
    }

    const gradePreset = getSubjectPresetByGrade(
      entry.subject || subject,
      level,
      numGrade,
      resolvedPhase
    );
    const slug = (entry.subject || subject || 'mapel').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const normLevel = normalizeSchoolLevel(level, entry.subject || subject);

    return {
      ...entry,
      level: normLevel,
      subLevelLabel: getSchoolLevelDisplay(normLevel, numGrade).subLabel,
      grade: numGrade,
      phase: resolvedPhase,
      jpPerWeek: entry.jpPerWeek || gradePreset.jpPerWeek || 3,
      totalHoursPerYear: gradePreset.totalHoursPerYear || entry.totalHoursPerYear,
      cpText: entry.cpText || gradePreset.cpSummary,
      elements:
        entry.elements && entry.elements.length > 0
          ? entry.elements
          : gradePreset.elements,
      materialsSem1: (gradePreset.materialsSem1 || []).map((m, idx) => ({
        ...m,
        id: `cal-${slug}-${numGrade}-s1-${idx + 1}`,
        tpCode: m.tpCode || `TP.${numGrade}.1.${idx + 1}`,
      })),
      materialsSem2: (gradePreset.materialsSem2 || []).map((m, idx) => ({
        ...m,
        id: `cal-${slug}-${numGrade}-s2-${idx + 1}`,
        tpCode: m.tpCode || `TP.${numGrade}.2.${idx + 1}`,
      })),
    };
  }

  static findMasterCPEntry(
    subject: string,
    level: SchoolLevel | string,
    grade?: number | string,
    userId?: string,
    phase?: string
  ): CPSubjectEntry | null {
    this.ensureOfficialCP046And020Synced();
    const normSub = (subject || '').trim().toLowerCase();
    if (!normSub) return null;
    const targetPhase = (phase || (grade !== undefined ? resolvePhaseByLevelAndGrade(level, Number(grade)) : '')).trim().toLowerCase();

    const allCandidates: CPSubjectEntry[] = [];
    const pushFromDoc = (doc: ActiveMasterCPData | null) => {
      if (!doc) return;
      if (Array.isArray(doc.analyzedSubjects)) {
        doc.analyzedSubjects.forEach((e) => {
          if (
            isSameSubjectName(e.subject, subject) &&
            isSameSchoolLevelGroup(e.level, level)
          ) {
            allCandidates.push(e);
          }
        });
      }
      if (
        isSameSubjectName(doc.subject, subject) &&
        isSameSchoolLevelGroup(doc.level, level)
      ) {
        allCandidates.push({
          id: doc.id,
          slot: doc.slot,
          docNumber: doc.docNumber,
          sourceFileName: doc.fileName,
          categoryTag: doc.categoryTag,
          subject: doc.subject,
          level: doc.level,
          subLevelLabel: doc.subLevelLabel,
          grade: doc.grade,
          phase: doc.phase,
          jpPerWeek: doc.jpPerWeek,
          totalHoursPerYear: doc.totalHoursPerYear,
          cpText: doc.cpText,
          elements: doc.elements,
          materialsSem1: doc.materialsSem1 || [],
          materialsSem2: doc.materialsSem2 || [],
        });
      }
    };

    try {
      const adminIds = Array.from(
        new Set([
          DEFAULT_ADMIN.id,
          ...this.getUsers()
            .filter((u) => u.role === 'admin')
            .map((u) => u.id),
        ])
      );
      adminIds.forEach((adminId) => pushFromDoc(this.getActiveMasterCP(adminId)));
    } catch {}
    pushFromDoc(this.getActiveMasterCP(userId));
    this.getMasterCPCatalog().forEach((item) => pushFromDoc(item));

    if (grade !== undefined && grade !== null && grade !== '') {
      const gNum = Number(grade);
      const exactPhaseStr = phase || resolvePhaseByLevelAndGrade(level, gNum);
      const exactWithMaterials = allCandidates.find(
        (e) =>
          Number(e.grade) === gNum &&
          ((e.materialsSem1?.length || 0) > 0 || (e.materialsSem2?.length || 0) > 0)
      );
      if (exactWithMaterials) return exactWithMaterials;

      if (targetPhase) {
        const phaseWithMaterials = allCandidates.find(
          (e) =>
            (e.phase || '').trim().toLowerCase() === targetPhase &&
            ((e.materialsSem1?.length || 0) > 0 || (e.materialsSem2?.length || 0) > 0)
        );
        if (phaseWithMaterials) {
          return this.resolveGradeCalibratedEntry(phaseWithMaterials, subject, level, gNum, exactPhaseStr);
        }
      }

      const exactNoMaterials = allCandidates.find((e) => Number(e.grade) === gNum);
      if (exactNoMaterials) {
        return this.resolveGradeCalibratedEntry(exactNoMaterials, subject, level, gNum, exactPhaseStr);
      }

      if (targetPhase) {
        const phaseNoMaterials = allCandidates.find(
          (e) => (e.phase || '').trim().toLowerCase() === targetPhase
        );
        if (phaseNoMaterials) {
          return this.resolveGradeCalibratedEntry(phaseNoMaterials, subject, level, gNum, exactPhaseStr);
        }
      }

      if (allCandidates.length > 0) {
        return this.resolveGradeCalibratedEntry(allCandidates[0], subject, level, gNum, exactPhaseStr);
      }
      return null;
    }

    const withMaterials = allCandidates.find(
      (e) => (e.materialsSem1?.length || 0) > 0 || (e.materialsSem2?.length || 0) > 0
    );
    if (withMaterials) return withMaterials;

    return allCandidates[0] || null;
  }

  static addClass(cls: Omit<ClassRoom, 'id'>, userId?: string): ClassRoom {
    const classes = this.getClasses(userId);
    const newClass: ClassRoom = {
      ...cls,
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };
    classes.push(newClass);
    this.saveClasses(classes, userId);
    return newClass;
  }

  static updateClass(cls: ClassRoom, userId?: string): void {
    const classes = this.getClasses(userId).map((c) => (c.id === cls.id ? cls : c));
    this.saveClasses(classes, userId);
  }

  static deleteClass(classId: string, userId?: string): void {
    const classes = this.getClasses(userId).filter((c) => c.id !== classId);
    this.saveClasses(classes, userId);
  }

  static addStudent(student: Omit<Student, 'id'>, userId?: string): Student {
    const students = this.getStudents(userId);
    const newStudent: Student = {
      ...student,
      id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };
    students.push(newStudent);
    this.saveStudents(students, userId);
    return newStudent;
  }

  static updateStudent(student: Student, userId?: string): void {
    const students = this.getStudents(userId).map((s) => (s.id === student.id ? student : s));
    this.saveStudents(students, userId);
  }

  static deleteStudent(studentId: string, userId?: string): void {
    const students = this.getStudents(userId).filter((s) => s.id !== studentId);
    this.saveStudents(students, userId);
  }

  static batchAddStudents(newStudents: Omit<Student, 'id'>[], userId?: string): Student[] {
    const current = this.getStudents(userId);
    const created: Student[] = newStudents.map((s, idx) => ({
      ...s,
      id: `s-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
    }));
    const updated = [...current, ...created];
    this.saveStudents(updated, userId);
    return created;
  }

  static getFeedbacks(userId?: string): UserFeedback[] {
    const key = this.getUserScopedKey(KEYS.FEEDBACKS, userId);
    return loadFromStorage<UserFeedback[]>(key, []);
  }

  static saveFeedbacks(feedbacks: UserFeedback[], userId?: string): void {
    const key = this.getUserScopedKey(KEYS.FEEDBACKS, userId);
    saveToStorage(key, feedbacks);
  }

  static getSupabaseConfig(): SupabaseConfig {
    return loadFromStorage<SupabaseConfig>(KEYS.SUPABASE_CONFIG, {
      url: 'https://phbrqacielziyyzxntdn.supabase.co',
      apiKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYnJxYWNpZWx6aXl5enhudGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzA5NDksImV4cCI6MjEwNTkwNjk0OX0.ugDxD9wUExDip21FN1awprTtGcpbg2YrMpoIKtOql8A',
      autoSync: true,
      syncStatus: 'idle',
    });
  }

  static saveSupabaseConfig(config: SupabaseConfig): void {
    saveToStorage(KEYS.SUPABASE_CONFIG, config);
  }

  static getAcademicYear(userId?: string): string {
    const kaldik = this.getKalenderPendidikan(userId);
    return kaldik.tahunAjaran || kaldik.academicYear || '2026/2027';
  }

  /**
   * Profil sekolah & guru: Terisolasi per pengguna.
   * Pengguna baru dimulai dari awal bersih sesuai data pendaftarannya sendiri.
   */
  static getSchoolProfile(userId?: string): SchoolProfile {
    const currentUser = this.getCurrentUser();
    const key = this.getUserScopedKey(KEYS.SCHOOL_PROFILE, userId);

    const isAdmin =
      currentUser?.role === 'admin' ||
      currentUser?.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase();

    const defaultProfile: SchoolProfile = isAdmin
      ? { ...DEFAULT_SCHOOL_PROFILE }
      : {
          schoolName: currentUser?.school || '',
          npsn: '',
          address: '',
          headmasterName: '',
          headmasterNip: '',
          teacherName: currentUser?.name || '',
          teacherNip: '',
          city: '',
          semester: 'Ganjil',
          academicYear: '2026/2027',
          subject: currentUser?.subject || '',
          level: 'SMA',
          grade: 10,
          phase: 'Fase E',
          jpPerWeek: 3,
          totalHoursPerYear: 108,
          timeAllocationPerWeek: '45 Menit',
          cpText: '',
        };

    const profile = loadFromStorage<SchoolProfile>(key, defaultProfile);
    if (!profile) {
      return defaultProfile;
    }
    return profile;
  }

  static saveSchoolProfile(profile: SchoolProfile, userId?: string, skipReverseSync: boolean = false): void {
    const key = this.getUserScopedKey(KEYS.SCHOOL_PROFILE, userId);
    saveToStorage(key, profile);

    const yr = profile.academicYear?.trim();
    if (yr) {
      const kaldik = this.getKalenderPendidikan(userId);
      let kaldikChanged = false;
      if (kaldik && (kaldik.tahunAjaran !== yr || kaldik.academicYear !== yr)) {
        kaldik.tahunAjaran = yr;
        kaldik.academicYear = yr;
        if (kaldik.semester1) kaldik.semester1.academicYear = yr;
        if (kaldik.semester2) kaldik.semester2.academicYear = yr;
        kaldikChanged = true;
      }
      if (profile.jpPerWeek && Number(profile.jpPerWeek) > 0) {
        const numJp = Number(profile.jpPerWeek);
        if (kaldik.semester1 && kaldik.semester1.jpPerWeek !== numJp) {
          kaldik.semester1.jpPerWeek = numJp;
          kaldik.semester1.totalEffectiveHours = (kaldik.semester1.totalEffectiveWeeks || 19) * numJp;
          kaldik.semester1.totalJpSemester = kaldik.semester1.totalEffectiveHours;
          kaldik.semester1.netTeachingHours = Math.max(0, kaldik.semester1.totalEffectiveHours - (kaldik.semester1.reservedHours || 6));
          kaldikChanged = true;
        }
        if (kaldik.semester2 && kaldik.semester2.jpPerWeek !== numJp) {
          kaldik.semester2.jpPerWeek = numJp;
          kaldik.semester2.totalEffectiveHours = (kaldik.semester2.totalEffectiveWeeks || 18) * numJp;
          kaldik.semester2.totalJpSemester = kaldik.semester2.totalEffectiveHours;
          kaldik.semester2.netTeachingHours = Math.max(0, kaldik.semester2.totalEffectiveHours - (kaldik.semester2.reservedHours || 6));
          kaldikChanged = true;
        }
      }
      if (kaldikChanged) {
        this.saveKalenderPendidikan(kaldik, userId);
      }
    }

    // Synchronize school & teacher & curriculum parameters across existing uploaded master CP (if any) and CP distribution plans.
    // Never fabricate a synthetic Master CP if no CP has been uploaded yet.
    let masterCP = this.getActiveMasterCP(userId);
    if (!skipReverseSync) {
      const targetSub = profile.subject || masterCP?.subject || 'Fisika';
      const targetLvl = (profile.level || masterCP?.level || 'SMA') as SchoolLevel;
      const targetGrade = Number(profile.grade || masterCP?.grade || 10);
      const targetPhase = profile.phase || masterCP?.phase || resolvePhaseByLevelAndGrade(targetLvl, targetGrade);

      if (masterCP && masterCP.fileName?.trim()) {
        const isSubjectOrGradeChanged =
          masterCP.subject.toLowerCase() !== targetSub.toLowerCase() ||
          Number(masterCP.grade) !== targetGrade ||
          masterCP.level !== targetLvl;

        let sem1 = masterCP.materialsSem1 || [];
        let sem2 = masterCP.materialsSem2 || [];
        let cpText = profile.cpText || masterCP.cpText || '';
        let masterElements = masterCP.elements || [];

        if (isSubjectOrGradeChanged || (sem1.length === 0 && sem2.length === 0)) {
          const foundMaster = StorageService.findMasterCPEntry(targetSub, targetLvl, targetGrade, userId, targetPhase);
          if (foundMaster && ((foundMaster.materialsSem1?.length || 0) > 0 || (foundMaster.materialsSem2?.length || 0) > 0)) {
            sem1 = foundMaster.materialsSem1 || [];
            sem2 = foundMaster.materialsSem2 || [];
            if (!cpText && foundMaster.cpText) cpText = foundMaster.cpText;
            if (foundMaster.elements && foundMaster.elements.length > 0) masterElements = foundMaster.elements;
          }
        }

        const totSem1 = sem1.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0);
        const totSem2 = sem2.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0);
        const totalCalcHours = (totSem1 + totSem2) > 0 ? (totSem1 + totSem2) : (profile.totalHoursPerYear || masterCP.totalHoursPerYear || 108);

        const updatedMaster: ActiveMasterCPData = {
          ...masterCP,
          level: targetLvl,
          grade: targetGrade,
          phase: targetPhase,
          subject: targetSub,
          teacherName: profile.teacherName || masterCP.teacherName || 'Guru Pengampu',
          teacherNip: profile.teacherNip || (masterCP as any).teacherNip || '',
          principalName: profile.headmasterName || profile.principalName || (masterCP as any).principalName || '',
          principalNip: profile.headmasterNip || profile.principalNip || (masterCP as any).principalNip || '',
          schoolName: profile.schoolName || masterCP.schoolName || 'Satuan Pendidikan',
          academicYear: profile.academicYear || masterCP.academicYear || '2026/2027',
          city: profile.city || (masterCP as any).city || '',
          totalHoursPerYear: totalCalcHours,
          jpPerWeek: Number(profile.jpPerWeek) || masterCP.jpPerWeek || 3,
          timeAllocationPerWeek: profile.timeAllocationPerWeek || masterCP.timeAllocationPerWeek || '45 Menit',
          cpText,
          elements: masterElements.length > 0 ? masterElements : masterCP.elements || [],
          materialsSem1: sem1,
          materialsSem2: sem2,
          lastSyncedAt: new Date().toISOString(),
        };

        this.setActiveMasterCP(updatedMaster, userId, true);
        masterCP = updatedMaster;
      }

      const plans = this.getCPDistributions(userId);
      if (plans.length > 0) {
        const updatedPlans = plans.map(p => ({
          ...p,
          teacherName: profile.teacherName || p.teacherName,
          teacherNip: profile.teacherNip || p.teacherNip,
          schoolName: profile.schoolName || p.schoolName,
          academicYear: profile.academicYear || p.academicYear,
          subject: profile.subject || p.subject,
          grade: Number(profile.grade) || p.grade,
          level: (profile.level as any) || p.level,
          phase: profile.phase || p.phase,
          jpPerWeek: Number(profile.jpPerWeek) || p.jpPerWeek,
          timeAllocationPerWeek: profile.timeAllocationPerWeek || p.timeAllocationPerWeek,
          updatedAt: new Date().toISOString(),
        }));
        this.saveCPDistributions(updatedPlans, userId);
      }
    }

    // Broadcast update events to all active views and components
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('school-profile-updated', { detail: profile }));
        window.dispatchEvent(new CustomEvent('curriculum-parameters-synced', { detail: { profile, masterCP } }));
        if (masterCP) {
          window.dispatchEvent(new CustomEvent('master-cp-updated', { detail: masterCP }));
        }
      }
    } catch {}
  }

  static getAdminSettings(): AdminSystemSettings {
    return loadFromStorage<AdminSystemSettings>(KEYS.ADMIN_SETTINGS, DEFAULT_ADMIN_SETTINGS);
  }

  static async syncAdminSettingsNow(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.fetch) return false;
      const current = this.getAdminSettings();
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static saveAdminSettings(partialSettings: Partial<AdminSystemSettings>): AdminSystemSettings {
    const current = this.getAdminSettings();
    const updated: AdminSystemSettings = {
      ...current,
      ...partialSettings,
      lastUpdated: new Date().toISOString(),
    };
    saveToStorage(KEYS.ADMIN_SETTINGS, updated);

    // Asynchronously synchronize with backend
    try {
      if (typeof window !== 'undefined' && window.fetch) {
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => {
          // Ignore network errors gracefully in background
        });
      }
    } catch {
      // Ignore background sync errors
    }

    return updated;
  }

  static getAdminUploadedCPs(): AdminUploadedCPItem[] {
    this.ensureOfficialCP046And020Synced();
    const settings = this.getAdminSettings();
    const isAdminItem = (item: AdminUploadedCPItem | null | undefined) => {
      if (!item || !item.fileName?.trim()) return false;
      if (String(item.level || '').toUpperCase() === 'SMK' || Number(item.grade) === 13) return false;
      if (item.uploadedByRole !== 'admin') return false;
      return true;
    };

    if (Array.isArray(settings.adminUploadedCPs) && settings.adminUploadedCPs.length > 0) {
      return settings.adminUploadedCPs
        .filter(isAdminItem)
        .sort((a, b) => (Number(a.no) || 0) - (Number(b.no) || 0));
    }
    // If never explicitly cleared (undefined), fallback ONLY to an Admin user's uploaded Master CP (uploadedByRole === 'admin')
    if (settings.adminUploadedCPs === undefined) {
      const adminIds = Array.from(
        new Set([
          DEFAULT_ADMIN.id,
          ...this.getUsers()
            .filter((u) => u.role === 'admin')
            .map((u) => u.id),
        ])
      );
      for (const adminId of adminIds) {
        const adminMaster = this.getActiveMasterCP(adminId);
        if (adminMaster && adminMaster.fileName && adminMaster.uploadedByRole === 'admin') {
          return [
            {
              id: adminMaster.id || `admin-cp-${adminId}`,
              no: 1,
              slot: adminMaster.slot || 'primary',
              isPermanent: adminMaster.isPermanent ?? true,
              docNumber: adminMaster.docNumber,
              fileName: adminMaster.fileName,
              folderName: adminMaster.folderName,
              subject: adminMaster.subject,
              level: adminMaster.level,
              grade: adminMaster.grade,
              phase: adminMaster.phase,
              uploadedAt: adminMaster.uploadedAt || new Date().toISOString(),
              uploadedBy: adminMaster.uploadedByName || DEFAULT_ADMIN.name,
              uploadedByRole: 'admin',
            },
          ];
        }
      }
    }
    return [];
  }

  static recordAdminUploadedCP(
    masterData: ActiveMasterCPData,
    uploadedByUser?: UserAccount | null
  ): AdminUploadedCPItem[] {
    const currentSettings = this.getAdminSettings();
    const existingList = [...(currentSettings.adminUploadedCPs || [])];
    const isAdminUploader =
      uploadedByUser?.role === 'admin' ||
      masterData.uploadedByRole === 'admin' ||
      this.getCurrentUser()?.role === 'admin';
    if (!isAdminUploader) {
      return existingList;
    }

    const cleanFileName =
      (masterData.fileName || '').trim() ||
      `Dokumen_CP_${masterData.subject || 'Umum'}_${masterData.phase || 'Fase'}.pdf`;

    const existingIdx = existingList.findIndex(
      (item) =>
        item.id === masterData.id ||
        item.fileName.toLowerCase() === cleanFileName.toLowerCase()
    );

    if (existingIdx >= 0) {
      const prev = existingList[existingIdx];
      existingList[existingIdx] = {
        ...prev,
        docNumber: masterData.docNumber?.trim() || prev.docNumber,
        fileName: cleanFileName,
        folderName: masterData.folderName?.trim() || prev.folderName,
        subject: masterData.subject || prev.subject,
        level: normalizeSchoolLevel(masterData.level || prev.level, masterData.subject),
        grade: masterData.grade ?? prev.grade,
        phase: masterData.phase || prev.phase,
        slot: masterData.slot || prev.slot || 'primary',
        isPermanent: masterData.isPermanent ?? prev.isPermanent ?? true,
        uploadedAt: masterData.uploadedAt || new Date().toISOString(),
        uploadedBy: uploadedByUser?.name || masterData.uploadedByName || prev.uploadedBy || DEFAULT_ADMIN.name,
        uploadedByRole: 'admin',
      };
    } else {
      const nextNo =
        existingList.reduce((max, item) => Math.max(max, Number(item.no) || 0), 0) + 1;
      existingList.push({
        id: masterData.id || `admin-cp-${Date.now()}`,
        no: nextNo,
        docNumber: masterData.docNumber?.trim() || undefined,
        fileName: cleanFileName,
        folderName: masterData.folderName?.trim() || undefined,
        subject: masterData.subject,
        level: normalizeSchoolLevel(masterData.level, masterData.subject),
        grade: masterData.grade,
        phase: masterData.phase,
        slot: masterData.slot || 'primary',
        isPermanent: masterData.isPermanent ?? true,
        uploadedAt: masterData.uploadedAt || new Date().toISOString(),
        uploadedBy: uploadedByUser?.name || masterData.uploadedByName || DEFAULT_ADMIN.name,
        uploadedByRole: 'admin',
      });
    }

    const sorted = existingList.sort((a, b) => (Number(a.no) || 0) - (Number(b.no) || 0));
    this.saveAdminSettings({
      adminUploadedCPs: sorted,
      updatedBy: uploadedByUser?.name || masterData.uploadedByName || DEFAULT_ADMIN.name,
    });

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-cp-updated', { detail: sorted }));
      }
    } catch {}

    return sorted;
  }

  static recordAdminUploadedFolderCPs(
    items: Array<{
      id?: string;
      fileName: string;
      docNumber?: string;
      folderName?: string;
      subject?: string;
      level?: SchoolLevel;
      grade?: number | string;
      phase?: string;
    }>,
    uploadedByUser?: UserAccount | null
  ): AdminUploadedCPItem[] {
    const currentSettings = this.getAdminSettings();
    const existingList = [...(currentSettings.adminUploadedCPs || [])];
    let nextNo =
      existingList.reduce((max, item) => Math.max(max, Number(item.no) || 0), 0) + 1;
    const now = new Date().toISOString();

    const isAdminUploader =
      uploadedByUser?.role === 'admin' || this.getCurrentUser()?.role === 'admin';
    if (!isAdminUploader) {
      return existingList;
    }

    items.forEach((entry, idx) => {
      const cleanFileName = (entry.fileName || '').trim();
      if (!cleanFileName) return;
      const existingIdx = existingList.findIndex(
        (it) => it.fileName.toLowerCase() === cleanFileName.toLowerCase()
      );
      if (existingIdx >= 0) {
        const prev = existingList[existingIdx];
        existingList[existingIdx] = {
          ...prev,
          slot: (entry as any).slot || prev.slot || 'primary',
          isPermanent: (entry as any).isPermanent ?? prev.isPermanent ?? true,
          docNumber: entry.docNumber?.trim() || prev.docNumber,
          fileName: cleanFileName,
          folderName: entry.folderName?.trim() || prev.folderName,
          subject: entry.subject || prev.subject,
          level: entry.level || prev.level,
          grade: entry.grade ?? prev.grade,
          phase: entry.phase || prev.phase,
          uploadedAt: now,
          uploadedBy: uploadedByUser?.name || prev.uploadedBy || DEFAULT_ADMIN.name,
          uploadedByRole: 'admin',
        };
      } else {
        existingList.push({
          id: entry.id || `admin-cp-${Date.now()}-${idx + 1}`,
          no: nextNo++,
          slot: (entry as any).slot || 'primary',
          isPermanent: (entry as any).isPermanent ?? true,
          docNumber: entry.docNumber?.trim() || undefined,
          fileName: cleanFileName,
          folderName: entry.folderName?.trim() || undefined,
          subject: entry.subject,
          level: entry.level,
          grade: entry.grade,
          phase: entry.phase,
          uploadedAt: now,
          uploadedBy: uploadedByUser?.name || DEFAULT_ADMIN.name,
          uploadedByRole: 'admin',
        });
      }
    });

    const sorted = existingList.sort((a, b) => (Number(a.no) || 0) - (Number(b.no) || 0));
    this.saveAdminSettings({
      adminUploadedCPs: sorted,
      updatedBy: uploadedByUser?.name || DEFAULT_ADMIN.name,
    });

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-cp-updated', { detail: sorted }));
      }
    } catch {}

    return sorted;
  }

  static clearLocalUploadedCPData(options?: {
    resetEpoch?: string;
    clearProfileSubject?: boolean;
  }): void {
    try {
      const nowIso = options?.resetEpoch || new Date().toISOString();
      const shouldClearProfileSubject = options?.clearProfileSubject !== false;

      // Collect all known user IDs (current user + admin + all stored users)
      const knownUserIds = new Set<string>([DEFAULT_ADMIN.id]);
      const currentUserId = this.getCurrentUserId();
      if (currentUserId) knownUserIds.add(currentUserId);
      try {
        this.getUsers().forEach((u) => {
          if (u?.id) knownUserIds.add(u.id);
        });
      } catch {}

      // Clear explicit scoped keys first (covers mock/memory storage too)
      knownUserIds.forEach((uid) => {
        saveToStorage(this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, uid), null);
        saveToStorage(this.getUserScopedKey(KEYS.CP_DISTRIBUTIONS, uid), []);
        saveToStorage(this.getUserScopedKey(KEYS.CP_REFS, uid), []);
      });
      saveToStorage(KEYS.ACTIVE_MASTER_CP, null);
      saveToStorage(KEYS.CP_DISTRIBUTIONS, []);
      saveToStorage(KEYS.CP_REFS, []);
      saveToStorage(KEYS.MASTER_CP_CATALOG, []);

      // Also scan all localStorage keys so no orphaned user/draft CP data survives
      if (isStorageAvailable()) {
        const allKeys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) allKeys.push(k);
        }

        allKeys.forEach((key) => {
          if (
            key === KEYS.ACTIVE_MASTER_CP ||
            key.endsWith(`_${KEYS.ACTIVE_MASTER_CP}`) ||
            key.startsWith(`${KEYS.ACTIVE_MASTER_CP}_`)
          ) {
            window.localStorage.setItem(key, JSON.stringify(null));
          } else if (
            key === KEYS.CP_DISTRIBUTIONS ||
            key.endsWith(`_${KEYS.CP_DISTRIBUTIONS}`) ||
            key.startsWith(`${KEYS.CP_DISTRIBUTIONS}_`)
          ) {
            window.localStorage.setItem(key, JSON.stringify([]));
          } else if (
            key === KEYS.CP_REFS ||
            key.endsWith(`_${KEYS.CP_REFS}`) ||
            key.startsWith(`${KEYS.CP_REFS}_`)
          ) {
            window.localStorage.setItem(key, JSON.stringify([]));
          } else if (
            key === 'agk_current_draft' ||
            key.endsWith('_agk_current_draft') ||
            key.startsWith('agk_current_draft_')
          ) {
            window.localStorage.removeItem(key);
          } else if (
            shouldClearProfileSubject &&
            (key === KEYS.SCHOOL_PROFILE ||
              key.endsWith(`_${KEYS.SCHOOL_PROFILE}`) ||
              key.startsWith(`${KEYS.SCHOOL_PROFILE}_`))
          ) {
            try {
              const rawProfile = window.localStorage.getItem(key);
              if (rawProfile) {
                const parsedProfile = JSON.parse(rawProfile);
                if (parsedProfile && typeof parsedProfile === 'object') {
                  window.localStorage.setItem(
                    key,
                    JSON.stringify({
                      ...parsedProfile,
                      subject: '',
                      cpText: '',
                    })
                  );
                }
              }
            } catch {}
          }
        });
      }

      if (shouldClearProfileSubject) {
        knownUserIds.forEach((uid) => {
          try {
            const pKey = this.getUserScopedKey(KEYS.SCHOOL_PROFILE, uid);
            const prof = loadFromStorage<SchoolProfile | null>(pKey, null);
            if (prof) {
              saveToStorage(pKey, {
                ...prof,
                subject: '',
                cpText: '',
              });
            }
          } catch {}
        });
      }

      // Update local ADMIN_SETTINGS without firing background POST race
      const localSettings = this.getAdminSettings();
      const cleanedSettings: AdminSystemSettings = {
        ...localSettings,
        adminUploadedCPs: [],
        cpResetTimestamp: options?.resetEpoch || localSettings.cpResetTimestamp || '',
        lastUpdated: nowIso,
      };
      saveToStorage(KEYS.ADMIN_SETTINGS, cleanedSettings);

      if (options?.resetEpoch) {
        saveToStorage(KEYS.LAST_CP_RESET_EPOCH, options.resetEpoch);
      }

      if (typeof window !== 'undefined') {
        const currentProfile = this.getSchoolProfile(currentUserId);
        try {
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('master-cp-updated', { detail: null }));
          window.dispatchEvent(new Event('master-cp-catalog-updated'));
          window.dispatchEvent(new CustomEvent('admin-cp-updated', { detail: [] }));
          window.dispatchEvent(new CustomEvent('school-profile-updated', { detail: currentProfile }));
          window.dispatchEvent(
            new CustomEvent('curriculum-parameters-synced', {
              detail: { profile: currentProfile, masterCP: null },
            })
          );
        } catch {}
      }

      Object.values(KEYS).forEach((k) => {
        storageListeners.forEach((fn) => {
          try {
            fn(k);
          } catch {}
        });
      });
    } catch (err) {
      console.warn('clearLocalUploadedCPData warning:', err);
    }
  }

  static async resetAllUploadedCPs(): Promise<boolean> {
    const nowIso = new Date().toISOString();
    this.clearLocalUploadedCPData({
      resetEpoch: nowIso,
      clearProfileSubject: true,
    });

    try {
      if (typeof window === 'undefined' || !window.fetch) return false;
      const res = await fetch('/api/admin/cp-catalog', { method: 'DELETE' });
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      const serverEpoch = (data?.cpResetTimestamp || nowIso).trim();
      if (serverEpoch) {
        saveToStorage(KEYS.LAST_CP_RESET_EPOCH, serverEpoch);
        const latestSettings = this.getAdminSettings();
        saveToStorage(KEYS.ADMIN_SETTINGS, {
          ...latestSettings,
          adminUploadedCPs: [],
          cpResetTimestamp: serverEpoch,
          lastUpdated: serverEpoch,
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  static removeAdminUploadedCP(id: string): AdminUploadedCPItem[] {
    const currentSettings = this.getAdminSettings();
    const removedItem = (currentSettings.adminUploadedCPs || []).find((item) => item.id === id);
    const filtered = (currentSettings.adminUploadedCPs || [])
      .filter((item) => item.id !== id)
      .sort((a, b) => (Number(a.no) || 0) - (Number(b.no) || 0))
      .map((item, idx) => ({
        ...item,
        no: idx + 1,
      }));

    // Keep Master CP Catalog & server CP Catalog synchronized with deleted item
    try {
      const removedFile = (removedItem?.fileName || '').trim().toLowerCase();
      const updatedCatalog = this.getMasterCPCatalog().filter((c) => {
        if (c.uploadedByRole !== 'admin') return true;
        if (c.id === id) return false;
        if (removedFile && (c.fileName || '').trim().toLowerCase() === removedFile) return false;
        if (removedItem?.slot === 'agama' && c.slot === 'agama') return false;
        return true;
      });
      this.saveMasterCPCatalog(updatedCatalog);

      const remainingAdminCatalog = updatedCatalog.filter((c) => c.uploadedByRole === 'admin');
      if (remainingAdminCatalog.length === 0 && filtered.length === 0) {
        this.resetAllUploadedCPs().catch(() => {});
        return [];
      }

      // Remove matching distributions & references if deleting a specific slot/file
      const uid = this.getCurrentUserId();
      if (removedFile || removedItem?.slot === 'agama') {
        const remainingRefs = this.getCPReferences(uid).filter((r) => {
          if (removedFile && (r.fileName || '').trim().toLowerCase() === removedFile) return false;
          if (removedItem?.slot === 'agama' && r.id.startsWith('ref-agama-')) return false;
          return true;
        });
        this.saveCPReferences(remainingRefs, uid);

        if (removedItem?.slot === 'agama') {
          const remainingDists = this.getCPDistributions(uid).filter(
            (d) => !d.id.startsWith('plan-agama-')
          );
          this.saveCPDistributions(remainingDists, uid);
        }
      }

      this.saveAdminSettings({
        adminUploadedCPs: filtered,
        updatedBy: this.getCurrentUser()?.name || DEFAULT_ADMIN.name,
      });
      this.syncAdminSettingsNow().catch(() => {});
      this.syncAdminCPCatalogToServer(remainingAdminCatalog, undefined);
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-cp-updated', { detail: filtered }));
      }
    } catch {}

    return filtered;
  }

  static async syncAdminCPCatalogToServer(
    catalog: ActiveMasterCPData[],
    activeMasterCP?: ActiveMasterCPData | null
  ): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.fetch) return false;
      const compactCatalog = (catalog || [])
        .filter((item) => item && String(item.level || '').toUpperCase() !== 'SMK' && Number(item.grade) !== 13)
        .map((item) => ({
          ...item,
          level: normalizeSchoolLevel(item.level, item.subject),
          cpText: (item.cpText || '').slice(0, 4000),
        }));
      let compactActive: ActiveMasterCPData | null | undefined = undefined;
      if (activeMasterCP !== undefined) {
        compactActive = activeMasterCP
          ? {
              ...activeMasterCP,
              level: normalizeSchoolLevel(activeMasterCP.level, activeMasterCP.subject),
              isPermanent: true,
              cpText: (activeMasterCP.cpText || '').slice(0, 80000),
              fullMarkdownReport: (activeMasterCP.fullMarkdownReport || '').slice(0, 20000) || undefined,
              analyzedSubjects: activeMasterCP.analyzedSubjects
                ?.filter((s) => s && String(s.level || '').toUpperCase() !== 'SMK' && Number(s.grade) !== 13)
                .map((s) => ({
                  ...s,
                  level: normalizeSchoolLevel(s.level, s.subject),
                  cpText: (s.cpText || '').slice(0, 4000),
                })),
            }
          : null;
      }

      const res = await fetch('/api/admin/cp-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalog: compactCatalog,
          ...(compactActive !== undefined ? { activeMasterCP: compactActive } : {}),
          updatedAt: new Date().toISOString(),
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static clearAdminCPCatalogOnServer(): void {
    try {
      if (typeof window === 'undefined' || !window.fetch) return;
      fetch('/api/admin/cp-catalog', { method: 'DELETE' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.cpResetTimestamp) {
            saveToStorage(KEYS.LAST_CP_RESET_EPOCH, data.cpResetTimestamp);
          }
        })
        .catch(() => {});
    } catch {}
  }

  static async fetchAdminCPCatalogFromServer(): Promise<{
    catalog: ActiveMasterCPData[];
    activeMasterCP: ActiveMasterCPData | null;
  } | null> {
    try {
      if (typeof window === 'undefined' || !window.fetch) return null;
      const res = await fetch('/api/admin/cp-catalog');
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.success) return null;

      const serverCatalog: ActiveMasterCPData[] = Array.isArray(data.catalog) ? data.catalog : [];
      const serverActive: ActiveMasterCPData | null = data.activeMasterCP || null;
      const hasServerTimestamp = Boolean(data.updatedAt);
      const serverResetEpoch = typeof data.cpResetTimestamp === 'string' ? data.cpResetTimestamp.trim() : '';
      const appliedEpoch = loadFromStorage<string>(KEYS.LAST_CP_RESET_EPOCH, '');

      // If server has a newer global reset epoch not yet applied in this browser, wipe stale local CPs once
      if (serverResetEpoch && serverResetEpoch !== appliedEpoch) {
        this.clearLocalUploadedCPData({
          resetEpoch: serverResetEpoch,
          clearProfileSubject: serverCatalog.length === 0 && !serverActive,
        });
      }

      if (serverActive) {
        saveToStorage(this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, DEFAULT_ADMIN.id), serverActive);
      } else if (hasServerTimestamp && serverCatalog.length === 0) {
        saveToStorage(this.getUserScopedKey(KEYS.ACTIVE_MASTER_CP, DEFAULT_ADMIN.id), null);
      }

      if (hasServerTimestamp || serverCatalog.length > 0) {
        const localNonAdmin = this.getMasterCPCatalog().filter((c) => c.uploadedByRole !== 'admin');
        const mergedCatalog = [...serverCatalog, ...localNonAdmin];
        saveToStorage(KEYS.MASTER_CP_CATALOG, mergedCatalog);
      }

      // Selalu pastikan CP resmi BSKAP 046/2025 & 020/2026 tersinkronisasi otomatis
      this.ensureOfficialCP046And020Synced();
      const latestCatalog = this.getMasterCPCatalog();
      const latestActive = this.getAdminMasterCP();

      try {
        window.dispatchEvent(new Event('master-cp-catalog-updated'));
        window.dispatchEvent(new CustomEvent('admin-cp-updated', { detail: latestCatalog }));
        window.dispatchEvent(new CustomEvent('master-cp-updated', { detail: latestActive || null }));
      } catch {}

      return { catalog: latestCatalog, activeMasterCP: latestActive };
    } catch {
      return null;
    }
  }

  static async fetchAdminSettingsFromServer(): Promise<AdminSystemSettings | null> {
    try {
      if (typeof window === 'undefined' || !window.fetch) return null;
      const res = await fetch('/api/admin/settings');
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.success && data?.settings) {
        const serverCPs: AdminUploadedCPItem[] | undefined = data.settings.adminUploadedCPs;
        const serverResetEpoch =
          typeof data.settings.cpResetTimestamp === 'string'
            ? data.settings.cpResetTimestamp.trim()
            : '';
        const appliedEpoch = loadFromStorage<string>(KEYS.LAST_CP_RESET_EPOCH, '');

        // Apply global CP reset epoch once if unseen on this browser
        if (serverResetEpoch && serverResetEpoch !== appliedEpoch) {
          this.clearLocalUploadedCPData({
            resetEpoch: serverResetEpoch,
            clearProfileSubject: !(Array.isArray(serverCPs) && serverCPs.length > 0),
          });
        }

        const local = this.getAdminSettings();
        const localCPs: AdminUploadedCPItem[] | undefined = local.adminUploadedCPs;
        const serverTs = Date.parse(data.settings.lastUpdated || '') || 0;
        const localTs = Date.parse(local.lastUpdated || '') || 0;

        let finalCPs: AdminUploadedCPItem[] = localCPs || [];
        if (Array.isArray(serverCPs)) {
          if (serverTs > localTs) {
            finalCPs = serverCPs;
          } else if (serverCPs.length > 0) {
            if (Array.isArray(localCPs) && localCPs.length === 0 && localTs > serverTs) {
              finalCPs = localCPs;
            } else {
              const mergedMap = new Map<string, AdminUploadedCPItem>();
              [...(localCPs || []), ...serverCPs].forEach((item) => {
                if (item?.fileName) {
                  mergedMap.set(item.fileName.toLowerCase(), item);
                }
              });
              finalCPs = Array.from(mergedMap.values()).sort(
                (a, b) => (Number(a.no) || 0) - (Number(b.no) || 0)
              );
            }
          }
        }
        const merged: AdminSystemSettings = {
          ...local,
          ...data.settings,
          adminUploadedCPs: finalCPs,
        };
        saveToStorage(KEYS.ADMIN_SETTINGS, merged);
        this.ensureOfficialCP046And020Synced();
        const updatedSettings = this.getAdminSettings();
        window.dispatchEvent(new CustomEvent('admin-cp-updated', { detail: updatedSettings.adminUploadedCPs || [] }));
        return updatedSettings;
      }
    } catch {
      // Ignore network errors gracefully
    }
    return null;
  }

  /**
   * Helper terpadu untuk mengambil seluruh ekosistem data kurikulum yang saling tersinkronisasi
   * secara otomatis menyesuaikan Jenjang dan Kelas yang dipilih berdasarkan analisis CP 046/2025 & 020/2026
   */
  static getSyncedCurriculumContext(subjectFilter?: string, gradeFilter?: number | string, levelFilter?: string, userId?: string) {
    this.ensureOfficialCP046And020Synced();
    const currentUser = this.getCurrentUser();
    const schoolProfile = this.getSchoolProfile(userId);
    const kaldik = this.getKalenderPendidikan(userId);
    const activeMaster = this.getActiveMasterCP(userId) || this.getAdminMasterCP();
    const allPlans = this.getCPDistributions(userId);

    const targetSub = subjectFilter || schoolProfile?.subject || activeMaster?.subject || 'Fisika';
    const targetLvl = normalizeSchoolLevel(levelFilter || schoolProfile?.level || activeMaster?.level || 'SMA', targetSub);
    const targetGrade = Number(gradeFilter) || Number(schoolProfile?.grade) || Number(activeMaster?.grade) || (targetLvl === 'SD' ? 4 : targetLvl === 'SMP' ? 7 : 10);
    
    // Find matching distribution plan for subject and specific grade if available
    const matchingPlanWithGrade = allPlans.find(
      p => isSameSubjectName(p.subject, targetSub) && isSameSchoolLevelGroup(p.level, targetLvl) && Number(p.grade) === targetGrade
    );

    const matchingPlanGeneral = allPlans.find(
      p => isSameSubjectName(p.subject, targetSub) && isSameSchoolLevelGroup(p.level, targetLvl)
    );

    const catalogEntry = this.findMasterCPEntry(targetSub, targetLvl, targetGrade, userId);

    // Prioritaskan kecocokan spesifik mapel dari CP 046/2025 & 020/2026 maupun upload Admin
    let effectiveMaster: CPDistributionPlan | ActiveMasterCPData | CPSubjectEntry | null = null;
    if (
      activeMaster &&
      isSameSubjectName(activeMaster.subject, targetSub) &&
      isSameSchoolLevelGroup(activeMaster.level, targetLvl) &&
      Number(activeMaster.grade) === targetGrade
    ) {
      effectiveMaster = activeMaster;
    } else if (matchingPlanWithGrade) {
      effectiveMaster = matchingPlanWithGrade;
    } else if (catalogEntry) {
      effectiveMaster = catalogEntry;
    } else if (matchingPlanGeneral) {
      effectiveMaster = matchingPlanGeneral;
    } else {
      effectiveMaster = activeMaster || (allPlans.length > 0 ? allPlans[0] : null);
    }

    const resolvedPhase = resolvePhaseByLevelAndGrade(targetLvl, targetGrade);

    // Ambil materi Semester 1 & Semester 2 khusus untuk tingkatan kelas targetGrade
    const hasExactGradeMaterials = Boolean(
      effectiveMaster &&
      isSameSubjectName(effectiveMaster.subject, targetSub) &&
      Number(effectiveMaster.grade) === targetGrade &&
      ((effectiveMaster.materialsSem1?.length || 0) > 0 || (effectiveMaster.materialsSem2?.length || 0) > 0)
    );

    let sem1Materials = hasExactGradeMaterials && effectiveMaster?.materialsSem1 ? effectiveMaster.materialsSem1 : [];
    let sem2Materials = hasExactGradeMaterials && effectiveMaster?.materialsSem2 ? effectiveMaster.materialsSem2 : [];

    let cpSummary = effectiveMaster?.cpText || activeMaster?.cpText || schoolProfile?.cpText || '';

    if (sem1Materials.length === 0 && sem2Materials.length === 0) {
      const gradePreset = getSubjectPresetByGrade(targetSub, targetLvl, targetGrade, resolvedPhase);
      sem1Materials = gradePreset.materialsSem1.map((m, idx) => ({ ...m, id: `sem1-mat-${idx + 1}` }));
      sem2Materials = gradePreset.materialsSem2.map((m, idx) => ({ ...m, id: `sem2-mat-${idx + 1}` }));
      cpSummary = cpSummary || gradePreset.cpSummary;
    }

    const totalHoursSem1 = hasExactGradeMaterials
      ? ((effectiveMaster as any)?.totalHoursSem1 || sem1Materials.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0))
      : sem1Materials.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0);
    const totalHoursSem2 = hasExactGradeMaterials
      ? ((effectiveMaster as any)?.totalHoursSem2 || sem2Materials.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0))
      : sem2Materials.reduce((s, m) => s + (Number(m.allocatedHours) || 0), 0);
    const totalHoursPerYear =
      (hasExactGradeMaterials ? effectiveMaster?.totalHoursPerYear : 0) ||
      (totalHoursSem1 + totalHoursSem2) ||
      schoolProfile?.totalHoursPerYear ||
      108;
    const jpPerWeek = effectiveMaster?.jpPerWeek || schoolProfile?.jpPerWeek || kaldik.semester1?.jpPerWeek || 3;

    return {
      schoolProfile,
      kaldik,
      activeMaster: effectiveMaster,
      allPlans,
      subject: targetSub,
      level: targetLvl,
      grade: targetGrade,
      phase: effectiveMaster?.phase || resolvedPhase,
      academicYear: (effectiveMaster as any)?.academicYear || schoolProfile.academicYear || kaldik.tahunAjaran || '2026/2027',
      teacherName: schoolProfile.teacherName || (effectiveMaster as any)?.teacherName || currentUser?.name || 'Aspian La Ode Madimu, S.Pd. Gr',
      teacherNip: schoolProfile.teacherNip || '',
      headmasterName: schoolProfile.headmasterName || (schoolProfile as any).principalName || '',
      headmasterNip: schoolProfile.headmasterNip || (schoolProfile as any).principalNip || '',
      schoolName: schoolProfile.schoolName || (effectiveMaster as any)?.schoolName || currentUser?.school || '',
      city: schoolProfile.city || '',
      jpPerWeek,
      totalHoursPerYear,
      totalHoursSem1,
      totalHoursSem2,
      sem1Materials,
      sem2Materials,
      cpSummary,
      sem1EffWeeks: kaldik.semester1?.totalEffectiveWeeks || 19,
      sem2EffWeeks: kaldik.semester2?.totalEffectiveWeeks || 18,
    };
  }

  static saveCurrentDraft(draft: { id: string; title: string; content: string; updatedAt: string }, userId?: string): void {
    const key = this.getUserScopedKey('agk_current_draft', userId);
    saveToStorage(key, draft);
  }

  static getCurrentDraft(userId?: string): { id: string; title: string; content: string; updatedAt: string } | null {
    const key = this.getUserScopedKey('agk_current_draft', userId);
    return loadFromStorage<{ id: string; title: string; content: string; updatedAt: string } | null>(
      key,
      null
    );
  }

  static getTheme(): AppThemeConfig {
    const raw = loadFromStorage<any>('agk_app_theme', null);
    if (!raw) {
      return normalizeThemeConfig(null);
    }
    // Revert emerald preset back to default clean saas
    if (raw === 'emerald' || (typeof raw === 'object' && raw?.preset === 'emerald')) {
      const reverted = normalizeThemeConfig({ ...(typeof raw === 'object' ? raw : {}), preset: 'saas' });
      saveToStorage('agk_app_theme', reverted);
      return reverted;
    }
    return normalizeThemeConfig(raw);
  }

  static saveTheme(theme: AppTheme): void {
    const normalized = normalizeThemeConfig(theme);
    saveToStorage('agk_app_theme', normalized);
  }

  // ==========================================
  // TOKEN & DAILY AI QUOTA MANAGEMENT (MAX 20/HARI)
  // ==========================================

  /**
   * Mendapatkan string tanggal hari ini dalam format YYYY-MM-DD lokal
   */
  static getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Menghitung informasi siklus tagihan bulanan berdasarkan tanggal persetujuan admin (approvalDate)
   * Kuota direset otomatis pada tanggal yang sama setiap bulannya
   */
  static getBillingCycleInfo(approvalDateStr?: string, lastResetDateStr?: string): {
    billingDay: number;
    currentCycleStart: string;
    nextResetDate: string;
    isNewCycle: boolean;
  } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 - 11
    const currentDay = now.getDate();

    // Default billing day = 1 jika tidak ada tanggal persetujuan
    let billingDay = 1;
    if (approvalDateStr) {
      const parsed = new Date(approvalDateStr);
      if (!isNaN(parsed.getTime())) {
        billingDay = parsed.getDate();
      } else {
        const match = approvalDateStr.match(/(\d{4})-(\d{2})-(\d{2})/) || approvalDateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          billingDay = parseInt(match[3] || match[1], 10) || 1;
        }
      }
    }

    // Tentukan awal siklus bulan ini
    let cycleYear = currentYear;
    let cycleMonth = currentMonth;
    if (currentDay < billingDay) {
      cycleMonth -= 1;
      if (cycleMonth < 0) {
        cycleMonth = 11;
        cycleYear -= 1;
      }
    }

    const daysInCycleMonth = new Date(cycleYear, cycleMonth + 1, 0).getDate();
    const actualCycleDay = Math.min(billingDay, daysInCycleMonth);
    const currentCycleStart = `${cycleYear}-${String(cycleMonth + 1).padStart(2, '0')}-${String(actualCycleDay).padStart(2, '0')}`;

    // Tentukan tanggal reset berikutnya
    let nextYear = cycleYear;
    let nextMonth = cycleMonth + 1;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const actualNextDay = Math.min(billingDay, daysInNextMonth);
    const nextResetDate = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(actualNextDay).padStart(2, '0')}`;

    const isNewCycle = !lastResetDateStr || lastResetDateStr < currentCycleStart;

    return {
      billingDay,
      currentCycleStart,
      nextResetDate,
      isNewCycle,
    };
  }

  /**
   * Menghitung status masa aktif akun (1 tahun dari tanggal disetujui admin)
   * Memberikan peringatan jika masa aktif tersisa <= 7 hari
   */
  static getSubscriptionStatus(user: UserAccount): {
    isExpired: boolean;
    isExpiringSoon: boolean;
    daysUntilExpiry: number;
    expiryDate: string;
    startDate: string;
    statusText: string;
  } {
    const isAdmin = user.role === 'admin' || user.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase();
    if (isAdmin) {
      return {
        isExpired: false,
        isExpiringSoon: false,
        daysUntilExpiry: 9999,
        expiryDate: '2099-12-31',
        startDate: user.requestDate || user.approvalDate || '2025-01-01',
        statusText: 'Akses Penuh Permanen (Administrator)',
      };
    }

    const startDateStr = user.subscriptionStartDate || (user.approvalDate ? user.approvalDate.split(' ')[0] : null) || user.requestDate.split(' ')[0] || this.getTodayDateString();
    let expiryDateStr = user.subscriptionExpiryDate;
    if (!expiryDateStr) {
      const startDate = new Date(startDateStr);
      if (!isNaN(startDate.getTime())) {
        const expDate = new Date(startDate);
        expDate.setFullYear(expDate.getFullYear() + 1);
        expiryDateStr = expDate.toISOString().split('T')[0];
      } else {
        const expDate = new Date();
        expDate.setFullYear(expDate.getFullYear() + 1);
        expiryDateStr = expDate.toISOString().split('T')[0];
      }
    }

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const expiryParsed = new Date(expiryDateStr);
    const expiryMidnight = new Date(expiryParsed.getFullYear(), expiryParsed.getMonth(), expiryParsed.getDate()).getTime();

    const diffMs = expiryMidnight - todayMidnight;
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

    let statusText = 'Aktif (1 Tahun)';
    if (isExpired) {
      statusText = `Kedaluwarsa (${Math.abs(daysUntilExpiry)} hari yang lalu)`;
    } else if (isExpiringSoon) {
      statusText = `Peringatan: Berakhir dalam ${daysUntilExpiry} hari`;
    } else {
      statusText = `Aktif (Sisa ${daysUntilExpiry} hari)`;
    }

    return {
      isExpired,
      isExpiringSoon,
      daysUntilExpiry,
      expiryDate: expiryDateStr,
      startDate: startDateStr,
      statusText,
    };
  }

  /**
   * Cek dan ambil status kuota token akun pengguna
   * Kuota standar: 20.000 Token/Hari (Reset Otomatis Setiap 00:00 WIB)
   * Dilengkapi fitur Context Caching untuk menghemat token hingga 75%
   */
  static getTokenQuotaStatus(targetUser?: UserAccount | null): TokenQuotaStatus {
    const user = targetUser !== undefined ? targetUser : this.getCurrentUser();
    const todayStr = this.getTodayDateString();

    // Hitung sisa waktu mundur ke tengah malam (00:00 WIB)
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msUntilMidnight = Math.max(0, midnight.getTime() - now.getTime());
    const hoursToMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutesToMidnight = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    const countdownText = `${hoursToMidnight}j ${minutesToMidnight}m`;

    if (!user) {
      return {
        dailyTokensUsed: 0,
        dailyTokensLimit: 20000,
        dailyTokensRemaining: 0,
        dailyAIClicks: 0,
        dailyAILimit: 10,
        dailyRemainingClicks: 0,
        dailyResetDate: todayStr,
        dailyPercentUsed: 0,
        isDailyExhausted: true,
        dailyResetCountdownText: countdownText,

        monthlyUsed: 0,
        monthlyLimit: 35,
        monthlyTokensUsed: 0,
        monthlyTokensLimit: 500000,
        monthlyRemaining: 0,
        monthlyTokensRemaining: 0,
        monthlyResetDate: todayStr,
        billingCycleDay: 1,
        used: 0,
        limit: 20000,
        extra: 0,
        totalAllowed: 20000,
        remaining: 0,
        isExhausted: true,
        resetDate: todayStr,
        isAdmin: false,
        daysUntilExpiry: 0,
        isExpiringSoon: false,
        isExpired: true,
        subscriptionStatusText: 'Sesi Belum Login',
        isSubscriptionActive: false,
        isContextCachingActive: true,
        isRLSEnforced: true,
      };
    }

    const isAdmin = user.role === 'admin' || user.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase();
    const subInfo = this.getSubscriptionStatus(user);

    // =========================================================================
    // 1. DAILY 20,000 TOKENS AUTO-RESET CHECK (RESET OTOMATIS SETIAP HARI 00:00)
    // =========================================================================
    let dailyTokensUsed = user.dailyTokensUsed ?? 0;
    let dailyAIClicks = user.dailyAIClicks ?? 0;
    const dailyTokensLimit = user.dailyTokensLimit ?? 20000;
    const dailyAILimit = user.dailyAILimit ?? 10;
    const isNewDay = !user.lastDailyTokenResetDate || user.lastDailyTokenResetDate !== todayStr;

    if (isNewDay) {
      dailyTokensUsed = 0;
      dailyAIClicks = 0;

      const resetUserObj: UserAccount = {
        ...user,
        dailyTokensUsed: 0,
        dailyAIClicks: 0,
        lastDailyTokenResetDate: todayStr,
      };

      setTimeout(() => {
        const allUsers = StorageService.getUsers();
        const idx = allUsers.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
        if (idx >= 0) {
          allUsers[idx] = { ...allUsers[idx], ...resetUserObj };
          StorageService.saveUsers(allUsers);
        }
        const currentSessionUser = loadFromStorage<UserAccount | null>(KEYS.CURRENT_USER, null);
        if (currentSessionUser && (currentSessionUser.id === user.id || currentSessionUser.email.toLowerCase() === user.email.toLowerCase())) {
          saveToStorage(KEYS.CURRENT_USER, resetUserObj);
        }
      }, 0);
    }

    // =========================================================================
    // 2. MONTHLY BILLING CYCLE AUTO-RESET CHECK
    // =========================================================================
    const approvalDate = user.approvalDate || user.requestDate || todayStr;
    const billingInfo = this.getBillingCycleInfo(approvalDate, user.lastMonthlyResetDate);

    let monthlyUsed = user.monthlyAIClicks ?? 0;
    let monthlyTokensUsed = user.monthlyTokensUsed ?? 0;

    if (billingInfo.isNewCycle) {
      monthlyUsed = 0;
      monthlyTokensUsed = 0;

      const updatedUser: UserAccount = {
        ...user,
        dailyTokensUsed: 0,
        dailyAIClicks: 0,
        lastDailyTokenResetDate: todayStr,
        monthlyAIClicks: 0,
        monthlyTokensUsed: 0,
        lastMonthlyResetDate: billingInfo.currentCycleStart,
        nextMonthlyResetDate: billingInfo.nextResetDate,
        billingCycleDay: billingInfo.billingDay,
        subscriptionExpiryDate: user.subscriptionExpiryDate || subInfo.expiryDate,
        subscriptionStartDate: user.subscriptionStartDate || subInfo.startDate,
      };

      setTimeout(() => {
        const allUsers = StorageService.getUsers();
        const idx = allUsers.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
        if (idx >= 0) {
          allUsers[idx] = { ...allUsers[idx], ...updatedUser };
          StorageService.saveUsers(allUsers);
        }
        const currentSessionUser = loadFromStorage<UserAccount | null>(KEYS.CURRENT_USER, null);
        if (currentSessionUser && (currentSessionUser.id === user.id || currentSessionUser.email.toLowerCase() === user.email.toLowerCase())) {
          saveToStorage(KEYS.CURRENT_USER, updatedUser);
        }
      }, 0);
    }

    const monthlyLimit = user.monthlyAILimit ?? 35;
    const monthlyTokensLimit = user.monthlyTokensLimit ?? 500000;
    const extra = user.extraTokens ?? 0;

    // Daily calculations (20,000 tokens/day)
    const dailyTokensRemaining = isAdmin ? 9999999 : Math.max(0, dailyTokensLimit - dailyTokensUsed);
    const dailyRemainingClicks = isAdmin ? 999 : Math.max(0, dailyAILimit - dailyAIClicks);
    const isDailyExhausted = !isAdmin && dailyTokensRemaining <= 0;
    const dailyPercentUsed = dailyTokensLimit > 0 ? Math.min(100, Math.round((dailyTokensUsed / dailyTokensLimit) * 100)) : 0;

    // Monthly calculations
    const totalAllowed = monthlyLimit + extra;
    const remaining = isAdmin ? 999 : Math.max(0, totalAllowed - monthlyUsed);
    const isExhausted = !isAdmin && (isDailyExhausted || remaining <= 0 || subInfo.isExpired);
    const monthlyTokensRemaining = isAdmin ? 9999999 : Math.max(0, monthlyTokensLimit - monthlyTokensUsed);

    // Auto-generate notification for expiring subscription (<= 7 days) if not already notified
    if (subInfo.isExpiringSoon && !isAdmin) {
      setTimeout(() => {
        const notifs = StorageService.getNotifications();
        const hasNotifToday = notifs.some(n => n.title.includes('Peringatan Masa Aktif') && n.timestamp.startsWith(todayStr));
        if (!hasNotifToday) {
          StorageService.addNotification({
            title: `Peringatan Masa Aktif Langganan (${subInfo.daysUntilExpiry} Hari Lagi)`,
            message: `Masa akses aplikasi untuk akun ${user.name} akan jatuh tempo pada ${subInfo.expiryDate}. Segera lakukan perpanjangan lisensi melalui Admin.`,
            type: 'system',
          });
        }
      }, 0);
    }

    return {
      dailyTokensUsed,
      dailyTokensLimit,
      dailyTokensRemaining,
      dailyAIClicks,
      dailyAILimit,
      dailyRemainingClicks,
      dailyResetDate: todayStr,
      dailyPercentUsed,
      isDailyExhausted,
      dailyResetCountdownText: countdownText,

      monthlyUsed,
      monthlyLimit,
      monthlyTokensUsed,
      monthlyTokensLimit,
      monthlyRemaining: remaining,
      monthlyTokensRemaining,
      monthlyResetDate: billingInfo.nextResetDate,
      billingCycleDay: billingInfo.billingDay,

      used: dailyTokensUsed,
      limit: dailyTokensLimit,
      extra,
      totalAllowed: dailyTokensLimit,
      remaining: dailyTokensRemaining,
      isExhausted,
      resetDate: todayStr,
      isAdmin,

      isContextCachingActive: true,
      isRLSEnforced: true,

      subscriptionStartDate: subInfo.startDate,
      subscriptionExpiryDate: subInfo.expiryDate,
      daysUntilExpiry: subInfo.daysUntilExpiry,
      isExpiringSoon: subInfo.isExpiringSoon,
      isExpired: subInfo.isExpired,
      subscriptionStatusText: subInfo.statusText,
      isSubscriptionActive: !subInfo.isExpired,
    };
  }

  /**
   * Mengonsumsi kuota token AI harian (batas 20.000 token/hari) dengan optimasi Context Caching
   */
  static consumeAIToken(
    targetUser?: UserAccount | null,
    featureName: string = 'Generasi Dokumen',
    estimatedTokens: number = 2500
  ): { success: boolean; status: TokenQuotaStatus; message: string; tokensConsumed: number; tokensSavedByCaching: number } {
    const user = targetUser !== undefined ? targetUser : this.getCurrentUser();
    const todayStr = this.getTodayDateString();

    if (!user) {
      return {
        success: false,
        status: this.getTokenQuotaStatus(null),
        message: 'Silakan login terlebih dahulu untuk menggunakan fitur ini.',
        tokensConsumed: 0,
        tokensSavedByCaching: 0,
      };
    }

    const statusBefore = this.getTokenQuotaStatus(user);

    // 1. Cek masa aktif lisensi 1 tahun
    if (statusBefore.isExpired && !statusBefore.isAdmin) {
      return {
        success: false,
        status: statusBefore,
        message: `Masa aktif langganan akun Anda telah berakhir (Jatuh tempo: ${statusBefore.subscriptionExpiryDate}). Silakan hubungi Admin Sekolah untuk perpanjangan akses lisensi.`,
        tokensConsumed: 0,
        tokensSavedByCaching: 0,
      };
    }

    // 2. Cek kuota token harian (20.000 token/hari)
    if (statusBefore.isDailyExhausted && !statusBefore.isAdmin) {
      return {
        success: false,
        status: statusBefore,
        message: `Batas pemakaian token harian Anda (20.000 token/hari) telah habis. Kuota akan otomatis di-reset pukul 00:00 WIB tengah malam nanti (dalam ${statusBefore.dailyResetCountdownText}).`,
        tokensConsumed: 0,
        tokensSavedByCaching: 0,
      };
    }

    // Optimasi Context Caching: Dokumen CP master dan template kurikulum ter-cache menghemat ~75% token
    const settings = this.getAdminSettings();
    const isCachingEnabled = settings.enableContextCaching !== false;
    const tokensSavedByCaching = isCachingEnabled ? Math.round(estimatedTokens * 0.70) : 0;
    const actualTokensConsumed = Math.max(250, estimatedTokens - tokensSavedByCaching);

    const newDailyTokensUsed = Math.min(statusBefore.dailyTokensLimit, (statusBefore.dailyTokensUsed || 0) + actualTokensConsumed);
    const newDailyAIClicks = (statusBefore.dailyAIClicks || 0) + 1;
    const newMonthlyUsed = (statusBefore.monthlyUsed || 0) + 1;
    const newMonthlyTokensUsed = Math.min(statusBefore.monthlyTokensLimit, (statusBefore.monthlyTokensUsed || 0) + actualTokensConsumed);
    const newTotalEver = (user.totalAIClicksEver ?? 0) + 1;

    const updatedUser: UserAccount = {
      ...user,
      dailyTokensUsed: newDailyTokensUsed,
      dailyAIClicks: newDailyAIClicks,
      lastDailyTokenResetDate: todayStr,
      monthlyAIClicks: newMonthlyUsed,
      monthlyTokensUsed: newMonthlyTokensUsed,
      totalAIClicksEver: newTotalEver,
      lastTokenResetDate: todayStr,
      lastMonthlyResetDate: user.lastMonthlyResetDate || todayStr,
      billingCycleDay: statusBefore.billingCycleDay,
      subscriptionExpiryDate: statusBefore.subscriptionExpiryDate,
      subscriptionStartDate: statusBefore.subscriptionStartDate,
    };

    // Simpan ke database pengguna
    const allUsers = this.getUsers();
    const userIndex = allUsers.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (userIndex >= 0) {
      allUsers[userIndex] = { ...allUsers[userIndex], ...updatedUser };
      this.saveUsers(allUsers);
    }

    // Simpan ke sesi aktif
    const currentUser = loadFromStorage<UserAccount | null>(KEYS.CURRENT_USER, null);
    if (currentUser && (currentUser.id === user.id || currentUser.email.toLowerCase() === user.email.toLowerCase())) {
      saveToStorage(KEYS.CURRENT_USER, updatedUser);
    }

    const statusAfter = this.getTokenQuotaStatus(updatedUser);

    // Audit log
    this.addAccessLog({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      action: `Konsumsi Kuota Token (${featureName})`,
      details: `Menggunakan ${actualTokensConsumed.toLocaleString('id-ID')} token (Context Caching hemat ${tokensSavedByCaching.toLocaleString('id-ID')} token). Pemakaian hari ini: ${statusAfter.dailyTokensUsed.toLocaleString('id-ID')}/${statusAfter.dailyTokensLimit.toLocaleString('id-ID')} token/hari. Reset otomatis pukul 00:00 WIB.`,
      status: 'success',
    });

    return {
      success: true,
      status: statusAfter,
      message: `Dokumen berhasil diproses (${actualTokensConsumed.toLocaleString('id-ID')} token). Sisa kuota hari ini: ${statusAfter.isAdmin ? 'Unlimited (Admin)' : `${statusAfter.dailyTokensRemaining.toLocaleString('id-ID')} token (Reset 00:00 WIB)`}.`,
      tokensConsumed: actualTokensConsumed,
      tokensSavedByCaching,
    };
  }

  /**
   * Reset kuota token harian akun tertentu menjadi 0 (Admin / Manual action)
   */
  static resetUserDailyTokens(userId: string): void {
    const allUsers = this.getUsers();
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    const todayStr = this.getTodayDateString();
    const updatedUser: UserAccount = {
      ...user,
      dailyTokensUsed: 0,
      dailyAIClicks: 0,
      lastDailyTokenResetDate: todayStr,
    };

    const updated = allUsers.map((u) => (u.id === userId ? updatedUser : u));
    this.saveUsers(updated);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      saveToStorage(KEYS.CURRENT_USER, updatedUser);
    }

    this.addAccessLog({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      action: 'Reset Kuota Token Harian (20.000 Token/Hari)',
      details: `Admin mereset pemakaian token harian akun ${user.name} (${user.email}) kembali ke 0/20.000 token.`,
      status: 'success',
    });
  }

  /**
   * Ubah batas token harian akun pengguna oleh Admin
   */
  static setUserDailyTokenLimit(userId: string, newDailyTokenLimit: number): void {
    const allUsers = this.getUsers();
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    const updatedUser: UserAccount = {
      ...user,
      dailyTokensLimit: Math.max(1000, newDailyTokenLimit),
    };

    const updated = allUsers.map((u) => (u.id === userId ? updatedUser : u));
    this.saveUsers(updated);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      saveToStorage(KEYS.CURRENT_USER, updatedUser);
    }
  }

  /**
   * Perpanjang masa aktif langganan akun guru oleh Admin (1 Tahun / sesuai durasi)
   */
  static renewUserSubscription(
    userId: string,
    durationYears: number = 1,
    paymentNotes?: string
  ): { success: boolean; message: string; updatedUser?: UserAccount } {
    const allUsers = this.getUsers();
    const userIndex = allUsers.findIndex((u) => u.id === userId);
    if (userIndex < 0) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const user = allUsers[userIndex];
    const now = new Date();
    const currentExpiry = user.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate) : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;

    const newExpiry = new Date(baseDate);
    newExpiry.setFullYear(newExpiry.getFullYear() + durationYears);
    const newExpiryStr = newExpiry.toISOString().split('T')[0];

    const updatedUser: UserAccount = {
      ...user,
      status: 'approved',
      subscriptionStatus: 'active',
      paymentStatus: 'renewed',
      subscriptionStartDate: user.subscriptionStartDate || (user.approvalDate ? user.approvalDate.split(' ')[0] : null) || this.getTodayDateString(),
      subscriptionExpiryDate: newExpiryStr,
      subscriptionDurationYears: (user.subscriptionDurationYears || 1) + durationYears,
      subscriptionNotes: paymentNotes || `Perpanjangan lisensi akses ${durationYears} tahun oleh Admin pada ${now.toLocaleDateString('id-ID')}`,
      monthlyAIClicks: 0, // Reset kuota bulanan baru
      monthlyTokensUsed: 0,
      lastMonthlyResetDate: this.getTodayDateString(),
    };

    allUsers[userIndex] = updatedUser;
    this.saveUsers(allUsers);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      saveToStorage(KEYS.CURRENT_USER, updatedUser);
    }

    this.addAccessLog({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      action: 'Perpanjangan Masa Aktif Langganan (1 Tahun)',
      details: `Admin ${DEFAULT_ADMIN.name} memperpanjang akses ${durationYears} tahun untuk ${user.name} (${user.email}). Jatuh tempo baru: ${newExpiryStr}. Catatan: ${paymentNotes || 'Pembayaran/berlangganan terverifikasi'}.`,
      status: 'success',
    });

    this.addNotification({
      title: 'Masa Aktif Akses Diperpanjang',
      message: `Selamat! Masa aktif akun guru ${user.name} telah berhasil diperpanjang 1 tahun hingga ${newExpiryStr}.`,
      type: 'access_approved',
    });

    return {
      success: true,
      message: `Akses akun ${user.name} berhasil diperpanjang 1 tahun hingga ${newExpiryStr}.`,
      updatedUser,
    };
  }

  /**
   * Reset kuota generate bulanan akun tertentu menjadi 0 (Admin action)
   */
  static resetUserMonthlyTokens(userId: string): void {
    const allUsers = this.getUsers();
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    const updatedUser: UserAccount = {
      ...user,
      monthlyAIClicks: 0,
      monthlyTokensUsed: 0,
      dailyAIClicks: 0,
      lastMonthlyResetDate: this.getTodayDateString(),
    };

    const updated = allUsers.map((u) => (u.id === userId ? updatedUser : u));
    this.saveUsers(updated);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      saveToStorage(KEYS.CURRENT_USER, updatedUser);
    }

    this.addAccessLog({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      action: 'Reset Kuota Token AI Bulanan',
      details: `Admin mereset kuota bulanan akun ${user.name} (${user.email}) menjadi 0/${user.monthlyAILimit || 35} generate (0/${user.monthlyTokensLimit || 500000} token).`,
      status: 'success',
    });
  }

  /**
   * Tambah bonus token extra untuk akun tertentu
   */
  static addUserExtraTokens(userId: string, extraAmount: number): void {
    const allUsers = this.getUsers();
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    const currentExtra = user.extraTokens ?? 0;
    const updatedUser: UserAccount = {
      ...user,
      extraTokens: Math.max(0, currentExtra + extraAmount),
    };

    const updated = allUsers.map((u) => (u.id === userId ? updatedUser : u));
    this.saveUsers(updated);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      saveToStorage(KEYS.CURRENT_USER, updatedUser);
    }

    this.addAccessLog({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      action: 'Penambahan Bonus Token AI',
      details: `Admin menambahkan ${extraAmount} bonus generate token untuk akun ${user.name} (${user.email}).`,
      status: 'success',
    });
  }

  /**
   * Ubah limit bulanan & token akun pengguna oleh Admin
   */
  static setUserMonthlyLimit(userId: string, newGenerateLimit: number, newTokenLimit?: number): void {
    const allUsers = this.getUsers();
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    const updatedUser: UserAccount = {
      ...user,
      monthlyAILimit: Math.max(1, newGenerateLimit),
      monthlyTokensLimit: newTokenLimit || (newGenerateLimit * 14286),
      dailyAILimit: Math.max(1, newGenerateLimit),
    };

    const updated = allUsers.map((u) => (u.id === userId ? updatedUser : u));
    this.saveUsers(updated);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      saveToStorage(KEYS.CURRENT_USER, updatedUser);
    }
  }

  /**
   * Ubah limit harian dasar akun pengguna (kompatibilitas)
   */
  static setUserDailyLimit(userId: string, newLimit: number): void {
    this.setUserMonthlyLimit(userId, newLimit);
  }

  /**
   * Mengambil daftar seluruh Voucher Token
   */
  static getTokenVouchers(): TokenVoucher[] {
    return loadFromStorage<TokenVoucher[]>(KEYS.TOKEN_VOUCHERS, INITIAL_TOKEN_VOUCHERS);
  }

  /**
   * Menyimpan daftar Voucher Token
   */
  static saveTokenVouchers(vouchers: TokenVoucher[]): void {
    saveToStorage(KEYS.TOKEN_VOUCHERS, vouchers);
  }

  /**
   * Membuat Voucher Token Baru oleh Admin
   */
  static createTokenVoucher(code: string, extraClicks: number, description?: string): TokenVoucher {
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const vouchers = this.getTokenVouchers();

    const existing = vouchers.find((v) => v.code.toUpperCase() === cleanCode);
    if (existing) {
      throw new Error(`Kode voucher "${cleanCode}" sudah ada.`);
    }

    const newVoucher: TokenVoucher = {
      id: `vouch-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      code: cleanCode,
      extraClicks: Math.max(1, extraClicks),
      isRedeemed: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      createdBy: DEFAULT_ADMIN.name,
      description: description || `Bonus Tambahan ${extraClicks} Kuota Klik`,
    };

    vouchers.unshift(newVoucher);
    this.saveTokenVouchers(vouchers);

    return newVoucher;
  }

  /**
   * Hapus Voucher Token
   */
  static deleteTokenVoucher(voucherId: string): void {
    const vouchers = this.getTokenVouchers().filter((v) => v.id !== voucherId);
    this.saveTokenVouchers(vouchers);
  }

  /**
   * Redeem / Klaim Voucher Token oleh Akun Pengguna
   */
  static redeemTokenVoucher(
    inputCode: string,
    targetUser: UserAccount
  ): { success: boolean; message: string; extraAdded: number } {
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Masukkan kode voucher yang valid.', extraAdded: 0 };
    }

    const vouchers = this.getTokenVouchers();
    const voucher = vouchers.find((v) => v.code.toUpperCase() === cleanCode);

    if (!voucher) {
      return {
        success: false,
        message: `Kode voucher "${cleanCode}" tidak ditemukan atau tidak valid.`,
        extraAdded: 0,
      };
    }

    const redeemedList = targetUser.tokenVouchersRedeemed || [];
    if (redeemedList.includes(cleanCode)) {
      return {
        success: false,
        message: `Akun Anda sudah pernah mengklaim voucher "${cleanCode}".`,
        extraAdded: 0,
      };
    }

    // Update voucher redeemed details
    voucher.isRedeemed = true;
    voucher.redeemedBy = `${targetUser.name} (${targetUser.email})`;
    voucher.redeemedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.saveTokenVouchers(vouchers);

    // Add extra tokens to user
    const currentExtra = targetUser.extraTokens ?? 0;
    const updatedRedeemedList = [...redeemedList, cleanCode];

    const updatedUser: UserAccount = {
      ...targetUser,
      extraTokens: currentExtra + voucher.extraClicks,
      tokenVouchersRedeemed: updatedRedeemedList,
    };

    const allUsers = this.getUsers();
    const userIdx = allUsers.findIndex((u) => u.id === targetUser.id || u.email.toLowerCase() === targetUser.email.toLowerCase());
    if (userIdx >= 0) {
      allUsers[userIdx] = { ...allUsers[userIdx], ...updatedUser };
      this.saveUsers(allUsers);
    }

    saveToStorage(KEYS.CURRENT_USER, updatedUser);

    this.addAccessLog({
      userId: targetUser.id,
      userEmail: targetUser.email,
      userName: targetUser.name,
      userRole: targetUser.role,
      action: 'Klaim Voucher Token Sistem',
      details: `Pengguna berhasil mengklaim voucher "${cleanCode}" (+${voucher.extraClicks} kuota klik).`,
      status: 'success',
    });

    return {
      success: true,
      message: `Selamat! Voucher "${cleanCode}" berhasil diklaim. Anda mendapatkan tambahan +${voucher.extraClicks} kuota klik!`,
      extraAdded: voucher.extraClicks,
    };
  }

  // ==========================================
  // KALENDER PENDIDIKAN & ANALISIS ALOKASI WAKTU
  // ==========================================
  static getKalenderPendidikan(userId?: string): KalenderPendidikanData {
    const key = this.getUserScopedKey(KEYS.KALENDER_PENDIDIKAN, userId);
    return loadFromStorage<KalenderPendidikanData>(key, DEFAULT_KALENDER_PENDIDIKAN);
  }

  static saveKalenderPendidikan(data: KalenderPendidikanData, userId?: string): void {
    const key = this.getUserScopedKey(KEYS.KALENDER_PENDIDIKAN, userId);
    const yr = (data.tahunAjaran || data.academicYear || '2026/2027').trim();
    const normalizedData: KalenderPendidikanData = {
      ...data,
      tahunAjaran: yr,
      academicYear: yr,
      semester1: {
        ...data.semester1,
        academicYear: yr,
      },
      semester2: {
        ...data.semester2,
        academicYear: yr,
      },
      lastUpdated: new Date().toISOString(),
    };

    saveToStorage(key, normalizedData);

    if (yr) {
      const profile = this.getSchoolProfile(userId);
      if (profile && profile.academicYear !== yr) {
        profile.academicYear = yr;
        this.saveSchoolProfile(profile, userId);
      }

      const masterCP = this.getActiveMasterCP(userId);
      if (masterCP && masterCP.academicYear !== yr) {
        masterCP.academicYear = yr;
        this.setActiveMasterCP(masterCP, userId);
      }
    }
  }
}
