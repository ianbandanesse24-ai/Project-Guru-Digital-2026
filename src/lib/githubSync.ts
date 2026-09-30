import { GitHubConfig } from '../types';
import { StorageService } from './storage';
import { SupabaseService } from './supabase';

const GITHUB_CONFIG_KEY = 'agk_github_config';

export const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
  owner: '',
  repo: '',
  branch: 'main',
  token: '',
  autoSync: true,
  syncStatus: 'idle',
};

export class GitHubSyncService {
  private static cachedConfig: GitHubConfig | null = null;
  private static autoSyncTimer: any = null;
  private static isSyncingInProgress: boolean = false;

  static getConfig(): GitHubConfig {
    if (this.cachedConfig) return this.cachedConfig;

    try {
      const saved = localStorage.getItem(GITHUB_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.cachedConfig = {
          owner: parsed.owner || '',
          repo: parsed.repo || '',
          branch: parsed.branch || 'main',
          token: parsed.token || '',
          autoSync: parsed.autoSync ?? true,
          lastSyncedAt: parsed.lastSyncedAt || undefined,
          syncStatus: parsed.syncStatus || 'idle',
          errorMessage: parsed.errorMessage || undefined,
          lastCommitSha: parsed.lastCommitSha || undefined,
          lastCommitUrl: parsed.lastCommitUrl || undefined,
        };
        return this.cachedConfig;
      }
    } catch {
      // Fallback
    }

    this.cachedConfig = { ...DEFAULT_GITHUB_CONFIG };
    return this.cachedConfig;
  }

  static saveConfig(partial: Partial<GitHubConfig>): void {
    const current = this.getConfig();
    this.cachedConfig = { ...current, ...partial };
    try {
      localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(this.cachedConfig));
    } catch (e) {
      console.warn('Failed to save GitHub config to localStorage:', e);
    }
  }

  /**
   * Menguji koneksi ke repositori GitHub
   */
  static async testConnection(
    customOwner?: string,
    customRepo?: string,
    customToken?: string
  ): Promise<{ success: boolean; message: string; latencyMs?: number; repoUrl?: string; defaultBranch?: string }> {
    const config = this.getConfig();
    const owner = (customOwner !== undefined ? customOwner : config.owner).trim();
    const repo = (customRepo !== undefined ? customRepo : config.repo).trim();
    const token = (customToken !== undefined ? customToken : config.token || '').trim();

    if (!owner || !repo) {
      return {
        success: false,
        message: 'Username / Organisasi Owner dan Nama Repository GitHub wajib diisi.',
      };
    }

    try {
      const res = await fetch('/api/github/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, token }),
      });

      const data = await res.json();
      return {
        success: data.success,
        message: data.message,
        latencyMs: data.latencyMs,
        repoUrl: data.repoUrl,
        defaultBranch: data.defaultBranch,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal memverifikasi repository GitHub: ${err.message}`,
      };
    }
  }

  /**
   * Mengemas seluruh berkas data aplikasi menjadi struktur repositori GitHub
   */
  static buildRepositoryFiles(): Record<string, string> {
    const profile = StorageService.getSchoolProfile();
    const students = StorageService.getStudents();
    const classes = StorageService.getClasses();
    const attendance = StorageService.getAttendance();
    const schedules = StorageService.getSchedule();
    const agendas = StorageService.getAgenda();
    const journals = StorageService.getJournal();
    const dailyGrades = StorageService.getDailyGrades();
    const unifiedGrades = StorageService.getGrades();
    const aiDocs = StorageService.getAIDocuments();
    const cpDists = StorageService.getCPDistributions();
    const users = StorageService.getUsers();
    const logs = StorageService.getAccessLogs();
    const sqlSchema = SupabaseService.getSupabaseSQLSchema();

    const timestamp = new Date().toISOString();
    const readableDate = new Date().toLocaleString('id-ID');

    const files: Record<string, string> = {};

    // 1. Data JSON files
    files['data/school_profile.json'] = JSON.stringify(profile, null, 2);
    files['data/classes.json'] = JSON.stringify(classes, null, 2);
    files['data/students.json'] = JSON.stringify(students, null, 2);
    files['data/attendance_records.json'] = JSON.stringify(attendance, null, 2);
    files['data/schedules.json'] = JSON.stringify(schedules, null, 2);
    files['data/teaching_agendas.json'] = JSON.stringify(agendas, null, 2);
    files['data/teaching_journals.json'] = JSON.stringify(journals, null, 2);
    files['data/daily_grades.json'] = JSON.stringify(dailyGrades, null, 2);
    files['data/unified_grades.json'] = JSON.stringify(unifiedGrades, null, 2);
    files['data/cp_distributions.json'] = JSON.stringify(cpDists, null, 2);
    files['data/users.json'] = JSON.stringify(users, null, 2);
    files['data/access_logs.json'] = JSON.stringify(logs.slice(0, 50), null, 2);

    // 2. AI Curriculum Documents (Markdown per doc)
    aiDocs.forEach((doc, idx) => {
      const safeTitle = (doc.title || `dokumen_${idx + 1}`)
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .toLowerCase()
        .slice(0, 40);
      const fileName = `data/ai_curriculum/${safeTitle}.md`;
      const header = `---\nid: "${doc.id}"\ntitle: "${doc.title}"\ntool_type: "${doc.toolType || ''}"\nsubject: "${doc.subject || ''}"\ngrade: "${doc.grade || ''}"\nlevel: "${doc.level || ''}"\ncreated_at: "${doc.createdAt || timestamp}"\n---\n\n`;
      files[fileName] = header + (doc.content || '');
    });

    // 3. Database Schema File
    files['schema/supabase_schema.sql'] = sqlSchema;

    // 4. README.md & Backup Summary
    const summaryMd = `# E - Project Guru Digital: Cadangan Data Repositori

> **Waktu Sinkronisasi Otomatis:** ${readableDate}  
> **Status:** Terverifikasi Aktif & Tersinkron

---

## 🏫 Profil Satuan Pendidikan
- **Nama Sekolah:** ${profile?.schoolName || 'SMA / SMK / MA / SMP / SD'}
- **NPSN:** ${profile?.npsn || '-'}
- **Kepala Sekolah:** ${profile?.headmasterName || '-'} (NIP: ${profile?.headmasterNip || '-'})
- **Guru Pengampu:** ${profile?.teacherName || '-'} (NIP: ${profile?.teacherNip || '-'})
- **Tahun Ajaran / Semester:** ${profile?.academicYear || '2026/2027'} - Semester ${profile?.semester || 'Ganjil'}

---

## 📊 Statistik Cadangan Data
| Modul Data | Jumlah Baris / Item | Lokasi Berkas |
| :--- | :--- | :--- |
| **Profil Sekolah** | 1 Profil Lengkap | \`data/school_profile.json\` |
| **Rombel / Kelas** | ${classes.length} Kelas | \`data/classes.json\` |
| **Peserta Didik / Siswa** | ${students.length} Siswa | \`data/students.json\` |
| **Presensi & Absensi** | ${attendance.length} Pertemuan | \`data/attendance_records.json\` |
| **Jadwal Mengajar** | ${schedules.length} Sesi | \`data/schedules.json\` |
| **Agenda Mengajar** | ${agendas.length} Entri | \`data/teaching_agendas.json\` |
| **Jurnal Pembelajaran** | ${journals.length} Catatan | \`data/teaching_journals.json\` |
| **Nilai Harian (Formatif)** | ${dailyGrades.length} Siswa | \`data/daily_grades.json\` |
| **Nilai Terpadu / Rapor** | ${unifiedGrades.length} Siswa | \`data/unified_grades.json\` |
| **Distribusi CP & Alokasi Waktu** | ${cpDists.length} Pemetaan | \`data/cp_distributions.json\` |
| **Dokumen AI Kurikulum** | ${aiDocs.length} Dokumen | \`data/ai_curriculum/\` |
| **Akun Pengguna & Otorisasi** | ${users.length} Akun | \`data/users.json\` |
| **Skrip Skema Database** | PostgreSQL DDL | \`schema/supabase_schema.sql\` |

---

## 🔄 Pemulihan (Restore) & Eksekusi
1. Seluruh data di berkas \`data/*.json\` dapat diimpor langsung ke aplikasi **E - Project Guru Digital** melalui menu **Backup & Restore**.
2. Berkas \`schema/supabase_schema.sql\` dapat langsung disalin ke **Supabase SQL Editor** untuk membuat tabel database PostgreSQL secara instan.
`;

    files['README.md'] = summaryMd;
    files['data/backup_summary.json'] = JSON.stringify(
      {
        syncTimestamp: timestamp,
        humanDate: readableDate,
        school: profile?.schoolName,
        totals: {
          classes: classes.length,
          students: students.length,
          attendance: attendance.length,
          schedules: schedules.length,
          agendas: agendas.length,
          journals: journals.length,
          dailyGrades: dailyGrades.length,
          unifiedGrades: unifiedGrades.length,
          aiDocs: aiDocs.length,
          users: users.length,
        },
      },
      null,
      2
    );

    return files;
  }

  /**
   * Mengunggah dan melakukan commit seluruh data ke GitHub
   */
  static async pushAllToGitHub(isAutoSync: boolean = false): Promise<{
    success: boolean;
    message: string;
    repoUrl?: string;
    filesCount?: number;
  }> {
    const config = this.getConfig();
    if (!config.owner || !config.repo) {
      return {
        success: false,
        message: 'Owner dan Nama Repository GitHub belum diatur.',
      };
    }

    if (!config.token) {
      return {
        success: false,
        message: 'GitHub Personal Access Token (PAT) belum diisi. Masukkan token dengan hak akses repo.',
      };
    }

    this.saveConfig({ syncStatus: 'syncing' });

    try {
      const files = this.buildRepositoryFiles();
      const filesCount = Object.keys(files).length;
      const nowStr = new Date().toLocaleString('id-ID');
      const commitMessage = `Auto-Sync E-Project Guru Digital (${nowStr}) - ${filesCount} berkas`;

      const res = await fetch('/api/github/push-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: config.owner,
          repo: config.repo,
          branch: config.branch || 'main',
          token: config.token,
          files,
          commitMessage,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        this.saveConfig({
          syncStatus: 'error',
          errorMessage: result.message || 'Gagal commit ke GitHub.',
        });
        return {
          success: false,
          message: result.message || 'Gagal sinkronisasi ke GitHub.',
        };
      }

      this.saveConfig({
        syncStatus: 'success',
        lastSyncedAt: nowStr,
        errorMessage: undefined,
        lastCommitUrl: result.repoUrl,
      });

      if (!isAutoSync) {
        StorageService.addNotification({
          title: 'Sinkronisasi GitHub Berhasil',
          message: `Sebanyak ${filesCount} berkas data administrasi & dokumen kurikulum telah di-commit ke repositori GitHub ${config.owner}/${config.repo}.`,
          type: 'sync',
        });
      }

      return {
        success: true,
        message: `Sinkronisasi ke GitHub berhasil (${result.committedCount} berkas)!`,
        repoUrl: result.repoUrl,
        filesCount: result.committedCount,
      };
    } catch (err: any) {
      this.saveConfig({
        syncStatus: 'error',
        errorMessage: err.message || 'Koneksi ke GitHub gagal.',
      });
      return {
        success: false,
        message: `Gagal sinkronisasi ke GitHub: ${err.message}`,
      };
    }
  }

  /**
   * Menjadwalkan sinkronisasi otomatis ke GitHub (debounced 5 detik)
   */
  static triggerAutoSync(): void {
    const config = this.getConfig();
    if (!config.autoSync || !config.owner || !config.repo || !config.token) {
      return;
    }

    if (this.autoSyncTimer) {
      clearTimeout(this.autoSyncTimer);
    }

    this.autoSyncTimer = setTimeout(() => {
      this.performAutoSync();
    }, 5000);
  }

  private static async performAutoSync(): Promise<void> {
    if (this.isSyncingInProgress) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    try {
      this.isSyncingInProgress = true;
      await this.pushAllToGitHub(true);
    } catch (e) {
      console.warn('Background GitHub sync notice:', e);
    } finally {
      this.isSyncingInProgress = false;
    }
  }

  /**
   * Mengunduh seluruh bundel data repositori sebagai berkas JSON arsip tunggal
   * (Berguna jika pengguna belum memiliki Personal Access Token GitHub)
   */
  static downloadLocalBackupArchive(): void {
    const files = this.buildRepositoryFiles();
    const dateStr = new Date().toISOString().split('T')[0];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(files, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `github_repository_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
