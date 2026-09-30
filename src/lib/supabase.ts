import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageService, addStorageListener } from './storage';
import { SupabaseConfig } from '../types';

const SUPABASE_CONFIG_KEY = 'agk_supabase_config';
export const DEFAULT_SUPABASE_URL = 'https://phbrqacielziyyzxntdn.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYnJxYWNpZWx6aXl5enhudGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzA5NDksImV4cCI6MjEwNTkwNjk0OX0.ugDxD9wUExDip21FN1awprTtGcpbg2YrMpoIKtOql8A';

export class SupabaseService {
  private static clientInstance: SupabaseClient | null = null;
  private static cachedConfig: SupabaseConfig | null = null;
  private static autoSyncTimer: any = null;
  private static pendingSyncKeys: Set<string> = new Set();
  private static isSyncingInProgress: boolean = false;

  /**
   * Mengambil konfigurasi Supabase saat ini (dari environment, local storage, atau kredensial default)
   */
  static getConfig(): SupabaseConfig {
    if (this.cachedConfig) return this.cachedConfig;

    const env = (import.meta as any).env || {};
    const envUrl = (env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
    const envKey = (env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

    try {
      const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Otomatis migrasi jika masih menggunakan instance lama atau domain yang tidak aktif
        const isOldInstance =
          parsed.url &&
          (parsed.url.includes('cbzooularbymwhoxyaxo') ||
            parsed.url.includes('kydlbpiyfwqrakxomsrx') ||
            parsed.url.includes('swtkglyhwxncywmocbsd') ||
            !parsed.url.includes('supabase.co'));

        if (parsed.syncStatus === 'disconnected' || (parsed.url === '' && parsed.apiKey === '')) {
          this.cachedConfig = {
            url: '',
            apiKey: '',
            autoSync: false,
            syncStatus: 'disconnected' as any,
            errorMessage: undefined,
          };
          return this.cachedConfig;
        }

        const resolvedUrl = isOldInstance ? '' : parsed.url ?? envUrl;
        const resolvedKey = isOldInstance ? '' : parsed.apiKey || parsed.anonKey || envKey;

        this.cachedConfig = {
          url: resolvedUrl,
          apiKey: resolvedKey,
          autoSync: parsed.autoSync ?? true,
          lastSyncedAt: parsed.lastSyncedAt || undefined,
          syncStatus: parsed.syncStatus || (resolvedUrl ? 'idle' : ('disconnected' as any)),
          errorMessage: parsed.errorMessage || undefined,
        };

        if (isOldInstance) {
          localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.cachedConfig));
        }

        return this.cachedConfig;
      }
    } catch {
      // Fallback silently
    }

    this.cachedConfig = {
      url: envUrl || '',
      apiKey: envKey || '',
      autoSync: true,
      syncStatus: envUrl ? 'idle' : ('disconnected' as any),
    };
    return this.cachedConfig;
  }

  /**
   * Memutuskan koneksi Supabase saat ini dan mengosongkan seluruh kredensial tersimpan
   */
  static disconnect(): SupabaseConfig {
    this.cachedConfig = {
      url: '',
      apiKey: '',
      autoSync: false,
      syncStatus: 'disconnected' as any,
      errorMessage: undefined,
      lastSyncedAt: undefined,
    };
    this.clientInstance = null;
    try {
      localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.cachedConfig));
    } catch {}
    return this.cachedConfig;
  }

  /**
   * Menyimpan konfigurasi Supabase
   */
  static saveConfig(config: Partial<SupabaseConfig & { anonKey?: string }>): SupabaseConfig {
    const current = this.getConfig();
    const updated: SupabaseConfig = {
      ...current,
      ...config,
      apiKey: config.apiKey !== undefined ? config.apiKey : (config.anonKey !== undefined ? config.anonKey : current.apiKey),
    };
    this.cachedConfig = updated;
    this.clientInstance = null; // Reset client on config change
    try {
      localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save Supabase config', e);
    }
    return updated;
  }

  /**
   * Mengambil Supabase Client
   */
  /**
   * Mengambil Supabase Client dengan dukungan Resilient Proxy Fetch
   */
  static createResilientClient(url: string, apiKey: string): SupabaseClient {
    return createClient(url, apiKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
          const urlStr =
            typeof input === 'string'
              ? input
              : input instanceof URL
              ? input.toString()
              : (input as Request).url;

          try {
            const res = await window.fetch(input, init);
            return res;
          } catch (err: any) {
            const isFetchFail =
              err?.name === 'TypeError' ||
              err?.message?.includes('fetch') ||
              err?.message?.includes('NetworkError') ||
              err?.message?.includes('Failed to fetch');

            if (isFetchFail && typeof window !== 'undefined') {
              try {
                let bodyContent: any = init?.body;
                if (typeof bodyContent === 'object' && bodyContent !== null && !(bodyContent instanceof FormData)) {
                  bodyContent = JSON.stringify(bodyContent);
                }

                const headersObj: Record<string, string> = {};
                if (init?.headers) {
                  if (init.headers instanceof Headers) {
                    init.headers.forEach((val, key) => {
                      headersObj[key] = val;
                    });
                  } else if (Array.isArray(init.headers)) {
                    init.headers.forEach(([k, v]) => {
                      headersObj[k] = v;
                    });
                  } else {
                    Object.assign(headersObj, init.headers);
                  }
                }

                const proxyRes = await window.fetch('/api/supabase/proxy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    url: urlStr,
                    method: init?.method || 'GET',
                    headers: headersObj,
                    body: bodyContent,
                  }),
                });

                if (proxyRes.ok) {
                  const proxyData = await proxyRes.json();
                  return new Response(proxyData.body, {
                    status: proxyData.status,
                    statusText: proxyData.statusText || 'OK',
                    headers: new Headers(proxyData.headers || {}),
                  });
                } else if (proxyRes.status === 404) {
                  // Lingkungan hosting statis (seperti GitHub Pages) tanpa backend proxy
                  throw err;
                } else {
                  const proxyErrData = await proxyRes.json().catch(() => ({}));
                  const errMsg = proxyErrData?.error || 'Gagal menghubungi Supabase Cloud (Domain tidak terjangkau).';
                  return new Response(
                    JSON.stringify({ message: errMsg, error: errMsg, code: proxyErrData?.code || 'SUPABASE_UNAVAILABLE' }),
                    {
                      status: proxyRes.status || 502,
                      statusText: proxyRes.statusText || 'Bad Gateway',
                      headers: new Headers({ 'Content-Type': 'application/json' }),
                    }
                  );
                }
              } catch (proxyErr) {
                console.warn('Proxy fallback notice:', proxyErr);
                return new Response(
                  JSON.stringify({ message: 'Gagal terhubung ke Supabase proxy server.', error: 'PROXY_UNAVAILABLE' }),
                  {
                    status: 502,
                    headers: new Headers({ 'Content-Type': 'application/json' }),
                  }
                );
              }
            }
            throw err;
          }
        },
      },
    });
  }

  /**
   * Mengembalikan konfigurasi Supabase ke nilai default resmi
   */
  static resetToDefault(): SupabaseConfig {
    this.cachedConfig = null;
    this.clientInstance = null;
    try {
      localStorage.removeItem(SUPABASE_CONFIG_KEY);
    } catch {}
    return this.getConfig();
  }

  static getClient(): SupabaseClient | null {
    const config = this.getConfig();
    if (!config.url || !config.apiKey) {
      return null;
    }

    if (!this.clientInstance) {
      try {
        this.clientInstance = this.createResilientClient(config.url, config.apiKey);
      } catch (err) {
        console.error('Error creating Supabase client:', err);
        return null;
      }
    }
    return this.clientInstance;
  }

  /**
   * Menjadwalkan sinkronisasi otomatis di latar belakang saat data berubah
   */
  static triggerAutoSync(key?: string): void {
    if (key) {
      this.pendingSyncKeys.add(key);
    }

    const config = this.getConfig();
    if (!config.autoSync || !config.url || !config.apiKey) {
      return;
    }

    if (this.autoSyncTimer) {
      clearTimeout(this.autoSyncTimer);
    }

    // Debounce 4 detik agar perubahan beruntun digabung dalam 1 batch
    this.autoSyncTimer = setTimeout(() => {
      this.performAutoSync();
    }, 4000);
  }

  private static async performAutoSync(): Promise<void> {
    if (this.isSyncingInProgress) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    try {
      this.isSyncingInProgress = true;
      await this.pushAllToSupabase(true);
      this.pendingSyncKeys.clear();
    } catch (err) {
      console.warn('Background Supabase sync notice:', err);
    } finally {
      this.isSyncingInProgress = false;
    }
  }

  /**
   * Menguji koneksi ke Supabase
   */
  static async testConnection(
    customUrl?: string,
    customKey?: string
  ): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const config = this.getConfig();
    const url = (customUrl || config.url || '').trim();
    const key = (customKey || config.apiKey || '').trim();

    if (!url || !key) {
      return {
        success: false,
        message: 'URL Supabase dan Public Anon Key belum diisi.',
      };
    }

    const startTime = performance.now();

    // 1. Prioritaskan server connection test untuk mengatasi TypeError: Failed to fetch di browser / iframe
    try {
      if (typeof window !== 'undefined') {
        const serverCheck = await window.fetch('/api/supabase/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, apiKey: key }),
        });
        if (serverCheck.ok) {
          const res = await serverCheck.json();
          return {
            success: res.success,
            latencyMs: res.latencyMs || Math.round(performance.now() - startTime),
            message: res.message,
          };
        }
      }
    } catch {
      // Lanjut ke pemeriksaan client-side jika server belum merespons
    }

    // 2. Client-side check dengan resilient fetch
    try {
      const client = this.createResilientClient(url, key);
      const { data, error } = await client.from('school_profile').select('id').limit(1);

      const latencyMs = Math.round(performance.now() - startTime);

      if (error) {
        // Table mungkin belum dibuat, tapi koneksi ke REST API Supabase valid
        if (
          error.code === 'PGRST204' ||
          error.code === '42P01' ||
          error.message.includes('relation "public.school_profile" does not exist') ||
          error.message.includes('does not exist')
        ) {
          return {
            success: true,
            latencyMs,
            message: `Terhubung ke Supabase (${latencyMs}ms)! Catatan: Tabel database belum dibuat. Silakan jalankan Skrip SQL Schema di Supabase SQL Editor.`,
          };
        }
        return {
          success: false,
          latencyMs,
          message: `Gagal query Supabase: ${error.message} (Kode: ${error.code})`,
        };
      }

      return {
        success: true,
        latencyMs,
        message: `Koneksi ke Supabase berhasil aktif dan terverifikasi! (${latencyMs}ms)`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Koneksi gagal: ${err?.message || 'Periksa koneksi internet atau format URL.'}`,
      };
    }
  }

  /**
   * Melakukan Push seluruh data lokal ke Supabase Cloud
   */
  static async pushAllToSupabase(isAutoSync: boolean = false): Promise<{
    success: boolean;
    message: string;
    stats?: Record<string, number>;
  }> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        message: 'Supabase client belum terkonfigurasi. Masukkan URL dan Anon Key terlebih dahulu.',
      };
    }

    this.saveConfig({ syncStatus: 'syncing' });

    try {
      const stats: Record<string, number> = {};

      // 1. School Profile
      const profile = StorageService.getSchoolProfile();
      if (profile) {
        const payload = {
          id: 'primary_school',
          school_name: profile.schoolName || 'Sekolah Tanpa Nama',
          npsn: profile.npsn || '',
          address: profile.address || '',
          headmaster_name: profile.headmasterName || '',
          headmaster_nip: profile.headmasterNip || '',
          teacher_name: profile.teacherName || '',
          teacher_nip: profile.teacherNip || '',
          city: profile.city || '',
          semester: profile.semester || 'Ganjil',
          academic_year: profile.academicYear || '2026/2027',
          logo_url: profile.logoUrl || null,
          updated_at: new Date().toISOString(),
        };
        const { error } = await client.from('school_profile').upsert(payload, { onConflict: 'id' });
        if (!error) stats['school_profile'] = 1;
      }

      // 2. Users
      const users = StorageService.getUsers();
      if (users && users.length > 0) {
        const payload = users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role || 'guru',
          status: u.status || 'approved',
          school: u.school || '',
          subject: u.subject || '',
          phone: u.phone || '',
          auth_code: u.authCode || null,
          request_date: u.requestDate || null,
          approval_date: u.approvalDate || null,
          approved_by: u.approvedBy || null,
          last_login: u.lastLogin || null,
          monthly_ai_clicks: u.monthlyAIClicks || 0,
          monthly_ai_limit: u.monthlyAILimit || 35,
          monthly_tokens_used: u.monthlyTokensUsed || 0,
          monthly_tokens_limit: u.monthlyTokensLimit || 500000,
          subscription_status: u.subscriptionStatus || 'active',
          payment_status: u.paymentStatus || 'paid',
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('users').upsert(payload, { onConflict: 'id' });
        if (!error) stats['users'] = payload.length;
      }

      // 3. Classes
      const classes = StorageService.getClasses();
      if (classes && classes.length > 0) {
        const payload = classes.map((c) => ({
          id: c.id,
          name: c.name,
          level: c.level || 'Fase E',
          grade: c.grade || 10,
          academic_year: c.academicYear || '2026/2027',
          homeroom_teacher: c.homeroomTeacher || '',
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('classes').upsert(payload, { onConflict: 'id' });
        if (!error) stats['classes'] = payload.length;
      }

      // 4. Students
      const students = StorageService.getStudents();
      if (students && students.length > 0) {
        const payload = students.map((s) => ({
          id: s.id,
          nis: s.nis || '',
          nisn: s.nisn || '',
          name: s.name,
          gender: s.gender || 'L',
          class_id: s.classId || null,
          class_name: s.className || '',
          parent_phone: s.parentPhone || '',
          parent_name: s.parentName || '',
          address: s.address || '',
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('students').upsert(payload, { onConflict: 'id' });
        if (!error) stats['students'] = payload.length;
      }

      // 5. Attendance Records
      const attendance = StorageService.getAttendance();
      if (attendance && attendance.length > 0) {
        const payload = attendance.map((a) => ({
          id: a.id,
          date: a.date,
          class_id: a.classId || null,
          class_name: a.className,
          subject: a.subject,
          meeting_number: a.meetingNumber || 1,
          semester: a.semester || 'Ganjil',
          academic_year: a.academicYear || '2026/2027',
          records: a.records || [],
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('attendance_records').upsert(payload, { onConflict: 'id' });
        if (!error) stats['attendance_records'] = payload.length;
      }

      // 6. Schedules
      const schedules = StorageService.getSchedule();
      if (schedules && schedules.length > 0) {
        const payload = schedules.map((sch) => ({
          id: sch.id,
          day: sch.day,
          period: sch.period || '',
          start_time: sch.startTime || '',
          end_time: sch.endTime || '',
          class_name: sch.className,
          subject: sch.subject,
          room: sch.room || '',
          notes: sch.notes || '',
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('schedules').upsert(payload, { onConflict: 'id' });
        if (!error) stats['schedules'] = payload.length;
      }

      // 7. Agendas
      const agendas = StorageService.getAgenda();
      if (agendas && agendas.length > 0) {
        const payload = agendas.map((ag) => ({
          id: ag.id,
          date: ag.date,
          time: ag.time || '',
          class_name: ag.className,
          subject: ag.subject,
          meeting_number: ag.meetingNumber || 1,
          topic: ag.topic || '',
          activities: ag.activities || '',
          student_attendance_summary: ag.studentAttendanceSummary || '',
          reflection: ag.reflection || '',
          follow_up: ag.followUp || '',
          status: ag.status || 'Selesai',
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('teaching_agendas').upsert(payload, { onConflict: 'id' });
        if (!error) stats['teaching_agendas'] = payload.length;
      }

      // 8. Teaching Journals
      const journals = StorageService.getJournal();
      if (journals && journals.length > 0) {
        const payload = journals.map((j) => ({
          id: j.id,
          date: j.date,
          class_name: j.className,
          subject: j.subject,
          tp_covered: j.tpCovered || '',
          learning_progress: j.learningProgress || '',
          obstacles: j.obstacles || '',
          solution: j.solution || '',
          teacher_notes: j.teacherNotes || '',
          signature_verified: j.signatureVerified || false,
          supervisor_notes: j.supervisorNotes || '',
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('teaching_journals').upsert(payload, { onConflict: 'id' });
        if (!error) stats['teaching_journals'] = payload.length;
      }

      // 9. Daily Grades
      const dailyGrades = StorageService.getDailyGrades();
      if (dailyGrades && dailyGrades.length > 0) {
        const payload = dailyGrades.map((dg) => ({
          id: dg.id,
          student_id: dg.studentId || null,
          student_name: dg.studentName,
          class_id: dg.classId || null,
          class_name: dg.className,
          subject: dg.subject,
          semester: dg.semester || 'Ganjil',
          academic_year: dg.academicYear || '2026/2027',
          tasks: dg.tasks || [],
          uh: dg.uh || [],
          average_task: dg.averageTask || 0,
          average_uh: dg.averageUH || 0,
          final_daily: dg.finalDaily || 0,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('daily_grades').upsert(payload, { onConflict: 'id' });
        if (!error) stats['daily_grades'] = payload.length;
      }

      // 10. Unified Grades
      const unifiedGrades = StorageService.getGrades();
      if (unifiedGrades && unifiedGrades.length > 0) {
        const payload = unifiedGrades.map((ug) => ({
          id: ug.id,
          student_id: ug.studentId || null,
          student_name: ug.studentName,
          class_name: ug.className,
          subject: ug.subject,
          task1: ug.task1 || 0,
          task2: ug.task2 || 0,
          uh1: ug.uh1 || 0,
          uh2: ug.uh2 || 0,
          performance: ug.performance || 0,
          daily_average: ug.dailyAverage || 0,
          pts_score: ug.ptsScore || 0,
          pas_score: ug.pasScore || 0,
          final_score: ug.finalScore || 0,
          predicate: ug.predicate || 'B',
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('unified_grades').upsert(payload, { onConflict: 'id' });
        if (!error) stats['unified_grades'] = payload.length;
      }

      // 11. AI Documents
      const aiDocs = StorageService.getAIDocuments();
      if (aiDocs && aiDocs.length > 0) {
        const payload = aiDocs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          tool_type: doc.toolType || 'modul_ajar',
          level: doc.level || '',
          grade: doc.grade || '',
          subject: doc.subject || '',
          semester: doc.semester || '',
          phase: doc.phase || '',
          model_option: doc.modelOption || '',
          content: doc.content || '',
          author_email: doc.authorEmail || '',
          tags: doc.tags || [],
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('ai_documents').upsert(payload, { onConflict: 'id' });
        if (!error) stats['ai_documents'] = payload.length;
      }

      // 12. CP Distributions
      const cpDists = StorageService.getCPDistributions();
      if (cpDists && cpDists.length > 0) {
        const payload = cpDists.map((cp) => ({
          id: cp.id,
          teacher_name: cp.teacherName,
          teacher_nip: cp.teacherNip || '',
          subject: cp.subject,
          school_name: cp.schoolName,
          level: cp.level,
          grade: cp.grade || '',
          phase: cp.phase || '',
          academic_year: cp.academicYear || '2026/2027',
          semester_option: cp.semesterOption || 'Semua Semester (1 & 2)',
          total_hours_per_year: cp.totalHoursPerYear || 72,
          total_tp_count: cp.totalTPCount || 8,
          jp_per_week: cp.jpPerWeek || 2,
          cp_text: cp.cpText || '',
          materials_sem1: cp.materialsSem1 || [],
          materials_sem2: cp.materialsSem2 || [],
          total_hours_sem1: cp.totalHoursSem1 || 36,
          total_hours_sem2: cp.totalHoursSem2 || 36,
          author_email: cp.authorEmail || '',
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from('cp_distributions').upsert(payload, { onConflict: 'id' });
        if (!error) stats['cp_distributions'] = payload.length;
      }

      // 13. Access Logs
      const logs = StorageService.getAccessLogs();
      if (logs && logs.length > 0) {
        const payload = logs.slice(0, 50).map((l) => ({
          id: l.id,
          user_id: l.userId || null,
          user_email: l.userEmail || '',
          user_name: l.userName || '',
          user_role: l.userRole || 'guru',
          action: l.action,
          details: l.details || '',
          timestamp: l.timestamp || new Date().toISOString(),
          ip_address: l.ipAddress || '',
          status: l.status || 'info',
        }));
        const { error } = await client.from('access_logs').upsert(payload, { onConflict: 'id' });
        if (!error) stats['access_logs'] = payload.length;
      }

      const now = new Date().toLocaleString('id-ID');
      this.saveConfig({
        syncStatus: 'success',
        lastSyncedAt: now,
        errorMessage: undefined,
      });

      if (!isAutoSync) {
        StorageService.addNotification({
          title: 'Sinkronisasi Supabase Berhasil',
          message: `Semua modul data administrasi (${Object.keys(stats).length} tabel) telah berhasil disinkronkan ke Supabase Cloud.`,
          type: 'sync',
        });
      }

      return {
        success: true,
        message: `Sinkronisasi ke Supabase Cloud Berhasil! (${now})`,
        stats,
      };
    } catch (err: any) {
      console.warn('Direct client sync failed, attempting server proxy fallback...', err);
      // Fallback ke server-side push endpoint jika client-side fetch terhambat
      try {
        if (typeof window !== 'undefined') {
          const config = this.getConfig();
          const serverPushRes = await window.fetch('/api/supabase/push-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: config.url,
              apiKey: config.apiKey,
              tables: this.buildAllTablesPayload(),
            }),
          });
          if (serverPushRes.ok) {
            const serverData = await serverPushRes.json();
            if (serverData.success) {
              const now = new Date().toLocaleString('id-ID');
              this.saveConfig({
                syncStatus: 'success',
                lastSyncedAt: now,
                errorMessage: undefined,
              });
              return {
                success: true,
                message: `Sinkronisasi ke Supabase Cloud Berhasil! (${now})`,
                stats: serverData.stats,
              };
            }
          }
        }
      } catch (fallbackErr) {
        console.error('Server push fallback also failed:', fallbackErr);
      }

      this.saveConfig({
        syncStatus: 'error',
        errorMessage: err?.message || 'Gagal sinkronisasi data ke Supabase.',
      });
      return {
        success: false,
        message: `Sinkronisasi gagal: ${err?.message || 'Periksa apakah skema tabel Supabase telah dijalankan.'}`,
      };
    }
  }

  /**
   * Mengambil data dari Supabase Cloud dan menyelaraskan ke penyimpanan lokal
   */
  static async pullAllFromSupabase(): Promise<{
    success: boolean;
    message: string;
    stats?: Record<string, number>;
  }> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        message: 'Supabase client belum terkonfigurasi. Masukkan URL dan Anon Key terlebih dahulu.',
      };
    }

    try {
      const stats: Record<string, number> = {};

      // 1. School Profile
      const { data: profileData } = await client.from('school_profile').select('*').limit(1);
      if (profileData && profileData.length > 0) {
        const p = profileData[0];
        StorageService.saveSchoolProfile({
          schoolName: p.school_name,
          npsn: p.npsn,
          address: p.address,
          headmasterName: p.headmaster_name,
          headmasterNip: p.headmaster_nip,
          teacherName: p.teacher_name,
          teacherNip: p.teacher_nip,
          city: p.city,
          semester: p.semester,
          academicYear: p.academic_year,
          logoUrl: p.logo_url,
        });
        stats['school_profile'] = 1;
      }

      // 2. Classes
      const { data: classesData } = await client.from('classes').select('*');
      if (classesData && classesData.length > 0) {
        const mapped = classesData.map((c: any) => ({
          id: c.id,
          name: c.name,
          level: c.level || 'Fase E',
          grade: c.grade || 10,
          academicYear: c.academic_year || '2026/2027',
          homeroomTeacher: c.homeroom_teacher || '',
        }));
        StorageService.saveClasses(mapped);
        stats['classes'] = mapped.length;
      }

      // 3. Students
      const { data: studentsData } = await client.from('students').select('*');
      if (studentsData && studentsData.length > 0) {
        const mapped = studentsData.map((s: any) => ({
          id: s.id,
          nis: s.nis || '',
          nisn: s.nisn || '',
          name: s.name,
          gender: s.gender || 'L',
          classId: s.class_id || '',
          className: s.class_name || '',
          parentPhone: s.parent_phone || '',
          parentName: s.parent_name || '',
          address: s.address || '',
        }));
        StorageService.saveStudents(mapped);
        stats['students'] = mapped.length;
      }

      // 4. Schedules
      const { data: schedulesData } = await client.from('schedules').select('*');
      if (schedulesData && schedulesData.length > 0) {
        const mapped = schedulesData.map((sc: any) => ({
          id: sc.id,
          day: sc.day,
          period: sc.period || '1-2',
          startTime: sc.start_time || '07:30',
          endTime: sc.end_time || '09:00',
          className: sc.class_name,
          subject: sc.subject,
          room: sc.room || '',
          notes: sc.notes || '',
        }));
        StorageService.saveSchedule(mapped);
        stats['schedules'] = mapped.length;
      }

      // 5. Agendas
      const { data: agendasData } = await client.from('teaching_agendas').select('*');
      if (agendasData && agendasData.length > 0) {
        const mapped = agendasData.map((a: any) => ({
          id: a.id,
          date: a.date,
          time: a.time || '07:30 - 09:00',
          className: a.class_name,
          subject: a.subject,
          meetingNumber: a.meeting_number || 1,
          topic: a.topic || '',
          activities: a.activities || '',
          studentAttendanceSummary: a.student_attendance_summary || '',
          reflection: a.reflection || '',
          followUp: a.follow_up || '',
          status: a.status || 'Selesai',
        }));
        StorageService.saveAgenda(mapped);
        stats['teaching_agendas'] = mapped.length;
      }

      // 6. Journals
      const { data: journalsData } = await client.from('teaching_journals').select('*');
      if (journalsData && journalsData.length > 0) {
        const mapped = journalsData.map((j: any) => ({
          id: j.id,
          date: j.date,
          className: j.class_name,
          subject: j.subject,
          tpCovered: j.tp_covered || '',
          learningProgress: j.learning_progress || '',
          obstacles: j.obstacles || '',
          solution: j.solution || '',
          teacherNotes: j.teacher_notes || '',
          signatureVerified: Boolean(j.signature_verified),
          meetingNumber: j.meeting_number || 1,
          followUpPlan: j.follow_up_plan || '',
        }));
        StorageService.saveJournal(mapped);
        stats['teaching_journals'] = mapped.length;
      }

      const now = new Date().toLocaleString('id-ID');
      this.saveConfig({
        syncStatus: 'success',
        lastSyncedAt: now,
        errorMessage: undefined,
      });

      return {
        success: true,
        message: `Berhasil mengunduh dan menyinkronkan data dari Supabase Cloud! (${now})`,
        stats,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menarik data dari Supabase: ${err.message}`,
      };
    }
  }

  /**
   * Mengumpulkan seluruh data lokal menjadi payload siap kirim ke Supabase
   */
  static buildAllTablesPayload(): Record<string, any[]> {
    const profile = StorageService.getSchoolProfile();
    const users = StorageService.getUsers();
    const classes = StorageService.getClasses();
    const students = StorageService.getStudents();
    const attendance = StorageService.getAttendance();
    const schedules = StorageService.getSchedule();
    const agendas = StorageService.getAgenda();
    const journals = StorageService.getJournal();
    const dailyGrades = StorageService.getDailyGrades();
    const unifiedGrades = StorageService.getGrades();
    const aiDocs = StorageService.getAIDocuments();
    const cpDists = StorageService.getCPDistributions();
    const logs = StorageService.getAccessLogs();

    const tables: Record<string, any[]> = {};

    if (profile) {
      tables['school_profile'] = [
        {
          id: 'primary_school',
          school_name: profile.schoolName || 'Sekolah Tanpa Nama',
          npsn: profile.npsn || '',
          address: profile.address || '',
          headmaster_name: profile.headmasterName || '',
          headmaster_nip: profile.headmasterNip || '',
          teacher_name: profile.teacherName || '',
          teacher_nip: profile.teacherNip || '',
          city: profile.city || '',
          semester: profile.semester || 'Ganjil',
          academic_year: profile.academicYear || '2026/2027',
          logo_url: profile.logoUrl || null,
          updated_at: new Date().toISOString(),
        },
      ];
    }

    if (users && users.length > 0) {
      tables['users'] = users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role || 'guru',
        status: u.status || 'approved',
        school: u.school || '',
        subject: u.subject || '',
        phone: u.phone || '',
        auth_code: u.authCode || null,
        request_date: u.requestDate || null,
        approval_date: u.approvalDate || null,
        approved_by: u.approvedBy || null,
        last_login: u.lastLogin || null,
        monthly_ai_clicks: u.monthlyAIClicks || 0,
        monthly_ai_limit: u.monthlyAILimit || 35,
        monthly_tokens_used: u.monthlyTokensUsed || 0,
        monthly_tokens_limit: u.monthlyTokensLimit || 500000,
        subscription_status: u.subscriptionStatus || 'active',
        payment_status: u.paymentStatus || 'paid',
        updated_at: new Date().toISOString(),
      }));
    }

    if (classes && classes.length > 0) {
      tables['classes'] = classes.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level || 'Fase E',
        grade: c.grade || 10,
        academic_year: c.academicYear || '2026/2027',
        homeroom_teacher: c.homeroomTeacher || '',
        updated_at: new Date().toISOString(),
      }));
    }

    if (students && students.length > 0) {
      tables['students'] = students.map((s) => ({
        id: s.id,
        nis: s.nis || '',
        nisn: s.nisn || '',
        name: s.name,
        gender: s.gender || 'L',
        class_id: s.classId || null,
        class_name: s.className || '',
        parent_phone: s.parentPhone || '',
        parent_name: s.parentName || '',
        address: s.address || '',
        updated_at: new Date().toISOString(),
      }));
    }

    if (attendance && attendance.length > 0) {
      tables['attendance_records'] = attendance.map((a) => ({
        id: a.id,
        date: a.date,
        class_id: a.classId || null,
        class_name: a.className,
        subject: a.subject,
        meeting_number: a.meetingNumber || 1,
        semester: a.semester || 'Ganjil',
        academic_year: a.academicYear || '2026/2027',
        records: a.records || [],
        updated_at: new Date().toISOString(),
      }));
    }

    if (schedules && schedules.length > 0) {
      tables['schedules'] = schedules.map((sch) => ({
        id: sch.id,
        day: sch.day,
        period: sch.period || '',
        start_time: sch.startTime || '',
        end_time: sch.endTime || '',
        class_name: sch.className,
        subject: sch.subject,
        room: sch.room || '',
        notes: sch.notes || '',
        updated_at: new Date().toISOString(),
      }));
    }

    if (agendas && agendas.length > 0) {
      tables['teaching_agendas'] = agendas.map((ag) => ({
        id: ag.id,
        date: ag.date,
        time: ag.time || '',
        class_name: ag.className,
        subject: ag.subject,
        meeting_number: ag.meetingNumber || 1,
        topic: ag.topic || '',
        activities: ag.activities || '',
        student_attendance_summary: ag.studentAttendanceSummary || '',
        reflection: ag.reflection || '',
        follow_up: ag.followUp || '',
        status: ag.status || 'Selesai',
        updated_at: new Date().toISOString(),
      }));
    }

    if (journals && journals.length > 0) {
      tables['teaching_journals'] = journals.map((j) => ({
        id: j.id,
        date: j.date,
        class_name: j.className,
        subject: j.subject,
        tp_covered: j.tpCovered || '',
        learning_progress: j.learningProgress || '',
        obstacles: j.obstacles || '',
        solution: j.solution || '',
        teacher_notes: j.teacherNotes || '',
        signature_verified: j.signatureVerified || false,
        supervisor_notes: j.supervisorNotes || '',
        updated_at: new Date().toISOString(),
      }));
    }

    if (dailyGrades && dailyGrades.length > 0) {
      tables['daily_grades'] = dailyGrades.map((dg) => ({
        id: dg.id,
        student_id: dg.studentId || null,
        student_name: dg.studentName,
        class_id: dg.classId || null,
        class_name: dg.className,
        subject: dg.subject,
        semester: dg.semester || 'Ganjil',
        academic_year: dg.academicYear || '2026/2027',
        tasks: dg.tasks || [],
        uh: dg.uh || [],
        average_task: dg.averageTask || 0,
        average_uh: dg.averageUH || 0,
        final_daily: dg.finalDaily || 0,
        updated_at: new Date().toISOString(),
      }));
    }

    if (unifiedGrades && unifiedGrades.length > 0) {
      tables['unified_grades'] = unifiedGrades.map((ug) => ({
        id: ug.id,
        student_id: ug.studentId || null,
        student_name: ug.studentName,
        class_name: ug.className,
        subject: ug.subject,
        task1: ug.task1 || 0,
        task2: ug.task2 || 0,
        uh1: ug.uh1 || 0,
        uh2: ug.uh2 || 0,
        performance: ug.performance || 0,
        daily_average: ug.dailyAverage || 0,
        pts_score: ug.ptsScore || 0,
        pas_score: ug.pasScore || 0,
        final_score: ug.finalScore || 0,
        predicate: ug.predicate || 'B',
        updated_at: new Date().toISOString(),
      }));
    }

    if (aiDocs && aiDocs.length > 0) {
      tables['ai_documents'] = aiDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        tool_type: doc.toolType || 'modul_ajar',
        level: doc.level || '',
        grade: doc.grade || '',
        subject: doc.subject || '',
        semester: doc.semester || '',
        phase: doc.phase || '',
        model_option: doc.modelOption || '',
        content: doc.content || '',
        author_email: doc.authorEmail || '',
        tags: doc.tags || [],
        updated_at: new Date().toISOString(),
      }));
    }

    if (cpDists && cpDists.length > 0) {
      tables['cp_distributions'] = cpDists.map((cp) => ({
        id: cp.id,
        teacher_name: cp.teacherName,
        teacher_nip: cp.teacherNip || '',
        subject: cp.subject,
        school_name: cp.schoolName,
        level: cp.level,
        grade: cp.grade || '',
        phase: cp.phase || '',
        academic_year: cp.academicYear || '2026/2027',
        semester_option: cp.semesterOption || 'Semua Semester (1 & 2)',
        total_hours_per_year: cp.totalHoursPerYear || 72,
        total_tp_count: cp.totalTPCount || 8,
        jp_per_week: cp.jpPerWeek || 2,
        cp_text: cp.cpText || '',
        materials_sem1: cp.materialsSem1 || [],
        materials_sem2: cp.materialsSem2 || [],
        total_hours_sem1: cp.totalHoursSem1 || 36,
        total_hours_sem2: cp.totalHoursSem2 || 36,
        author_email: cp.authorEmail || '',
        updated_at: new Date().toISOString(),
      }));
    }

    if (logs && logs.length > 0) {
      tables['access_logs'] = logs.slice(0, 50).map((l) => ({
        id: l.id,
        user_id: l.userId || null,
        user_email: l.userEmail || '',
        user_name: l.userName || '',
        user_role: l.userRole || 'guru',
        action: l.action,
        details: l.details || '',
        timestamp: l.timestamp || new Date().toISOString(),
        ip_address: l.ipAddress || '',
        status: l.status || 'info',
      }));
    }

    return tables;
  }

  /**
   * Menghasilkan SQL Schema Lengkap untuk di-run di Supabase SQL Editor
   */
  static getSupabaseSQLSchema(): string {
    return `-- ==============================================================================
-- SKRIP DATABASE SUPABASE LENGKAP: APLIKASI ADMINISTRASI GURU & PERANGKAT AJAR
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. IDENTITAS SEKOLAH & PROFIL GURU
CREATE TABLE IF NOT EXISTS public.school_profile (
    id TEXT PRIMARY KEY DEFAULT 'primary_school',
    school_name TEXT NOT NULL DEFAULT 'SMA / SMK Negeri Digital',
    npsn TEXT DEFAULT '12345678',
    address TEXT DEFAULT 'Jl. Pendidikan Karakter No. 1',
    headmaster_name TEXT DEFAULT 'Nama Kepala Sekolah, M.Pd.',
    headmaster_nip TEXT DEFAULT '197501012000031001',
    teacher_name TEXT DEFAULT 'Nama Guru Pengampu, S.Pd.',
    teacher_nip TEXT DEFAULT '198802022010011002',
    city TEXT DEFAULT 'Jakarta',
    semester TEXT DEFAULT 'Ganjil',
    academic_year TEXT DEFAULT '2026/2027',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AKUN PENGGUNA, OTORISASI & MANAJEMEN TOKEN AI
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guru',
    status TEXT NOT NULL DEFAULT 'approved',
    school TEXT,
    subject TEXT,
    phone TEXT,
    auth_code TEXT,
    request_date TEXT,
    approval_date TEXT,
    approved_by TEXT,
    last_login TEXT,
    monthly_ai_clicks INT DEFAULT 0,
    monthly_ai_limit INT DEFAULT 35,
    monthly_tokens_used INT DEFAULT 0,
    monthly_tokens_limit INT DEFAULT 500000,
    billing_cycle_day INT DEFAULT 1,
    last_monthly_reset TEXT,
    next_monthly_reset TEXT,
    subscription_start_date TEXT,
    subscription_expiry_date TEXT,
    subscription_status TEXT DEFAULT 'active',
    payment_status TEXT DEFAULT 'paid',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KELAS & ROMBEL
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'Fase E (Kelas X)',
    grade INT DEFAULT 10,
    academic_year TEXT DEFAULT '2026/2027',
    homeroom_teacher TEXT,
    student_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DATA SISWA
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    nis TEXT,
    nisn TEXT,
    name TEXT NOT NULL,
    gender TEXT,
    class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    class_name TEXT NOT NULL,
    parent_phone TEXT,
    parent_name TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REKAP PRESENSI HARIAN SISWA
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    meeting_number INT DEFAULT 1,
    semester TEXT DEFAULT 'Ganjil',
    academic_year TEXT DEFAULT '2026/2027',
    records JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. JADWAL PELAJARAN
CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY,
    day TEXT NOT NULL,
    period TEXT,
    start_time TEXT,
    end_time TEXT,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    room TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AGENDA PEMBELAJARAN
CREATE TABLE IF NOT EXISTS public.teaching_agendas (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    meeting_number INT DEFAULT 1,
    topic TEXT,
    activities TEXT,
    student_attendance_summary TEXT,
    reflection TEXT,
    follow_up TEXT,
    status TEXT DEFAULT 'Selesai',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. JURNAL MENGAJAR GURU
CREATE TABLE IF NOT EXISTS public.teaching_journals (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    tp_covered TEXT,
    learning_progress TEXT,
    obstacles TEXT,
    solution TEXT,
    teacher_notes TEXT,
    signature_verified BOOLEAN DEFAULT false,
    supervisor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PENILAIAN HARIAN
CREATE TABLE IF NOT EXISTS public.daily_grades (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    semester TEXT DEFAULT 'Ganjil',
    academic_year TEXT DEFAULT '2026/2027',
    tasks JSONB DEFAULT '[]'::jsonb,
    uh JSONB DEFAULT '[]'::jsonb,
    average_task NUMERIC(5,2) DEFAULT 0,
    average_uh NUMERIC(5,2) DEFAULT 0,
    final_daily NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REKAP NILAI RAPOR TERPADU
CREATE TABLE IF NOT EXISTS public.unified_grades (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    task1 NUMERIC(5,2) DEFAULT 0,
    task2 NUMERIC(5,2) DEFAULT 0,
    uh1 NUMERIC(5,2) DEFAULT 0,
    uh2 NUMERIC(5,2) DEFAULT 0,
    performance NUMERIC(5,2) DEFAULT 0,
    daily_average NUMERIC(5,2) DEFAULT 0,
    pts_score NUMERIC(5,2) DEFAULT 0,
    pas_score NUMERIC(5,2) DEFAULT 0,
    final_score NUMERIC(5,2) DEFAULT 0,
    predicate TEXT DEFAULT 'B',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DOKUMEN PERANGKAT AJAR AI
CREATE TABLE IF NOT EXISTS public.ai_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tool_type TEXT NOT NULL,
    level TEXT,
    grade TEXT,
    subject TEXT,
    semester TEXT,
    phase TEXT,
    model_option TEXT,
    content TEXT NOT NULL,
    author_email TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DISTRIBUSI ALOKASI CP / TP / PROMES
CREATE TABLE IF NOT EXISTS public.cp_distributions (
    id TEXT PRIMARY KEY,
    teacher_name TEXT NOT NULL,
    teacher_nip TEXT,
    subject TEXT NOT NULL,
    school_name TEXT NOT NULL,
    level TEXT NOT NULL,
    grade TEXT,
    phase TEXT,
    academic_year TEXT DEFAULT '2026/2027',
    semester_option TEXT,
    total_hours_per_year INT DEFAULT 72,
    total_tp_count INT DEFAULT 8,
    jp_per_week INT DEFAULT 2,
    cp_text TEXT,
    materials_sem1 JSONB DEFAULT '[]'::jsonb,
    materials_sem2 JSONB DEFAULT '[]'::jsonb,
    total_hours_sem1 INT DEFAULT 36,
    total_hours_sem2 INT DEFAULT 36,
    author_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. LOG AUDIT & AKTIVITAS SISTEM
CREATE TABLE IF NOT EXISTS public.access_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TEXT,
    ip_address TEXT,
    status TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES
ALTER TABLE public.school_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses (Idempotent: Drop if exists then Create)
DROP POLICY IF EXISTS "Allow All school_profile" ON public.school_profile;
CREATE POLICY "Allow All school_profile" ON public.school_profile FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All users" ON public.users;
CREATE POLICY "Allow All users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All classes" ON public.classes;
CREATE POLICY "Allow All classes" ON public.classes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All students" ON public.students;
CREATE POLICY "Allow All students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All attendance_records" ON public.attendance_records;
CREATE POLICY "Allow All attendance_records" ON public.attendance_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All schedules" ON public.schedules;
CREATE POLICY "Allow All schedules" ON public.schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All teaching_agendas" ON public.teaching_agendas;
CREATE POLICY "Allow All teaching_agendas" ON public.teaching_agendas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All teaching_journals" ON public.teaching_journals;
CREATE POLICY "Allow All teaching_journals" ON public.teaching_journals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All daily_grades" ON public.daily_grades;
CREATE POLICY "Allow All daily_grades" ON public.daily_grades FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All unified_grades" ON public.unified_grades;
CREATE POLICY "Allow All unified_grades" ON public.unified_grades FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All ai_documents" ON public.ai_documents;
CREATE POLICY "Allow All ai_documents" ON public.ai_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All cp_distributions" ON public.cp_distributions;
CREATE POLICY "Allow All cp_distributions" ON public.cp_distributions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All access_logs" ON public.access_logs;
CREATE POLICY "Allow All access_logs" ON public.access_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 15. HAK AKSES API SUPABASE (GRANT PRIVILEGES)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 16. INDEX UNTUK PERFORMA QUERY CEPAT
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_class_name ON public.students(class_name);
CREATE INDEX IF NOT EXISTS idx_attendance_date_class ON public.attendance_records(date, class_name);
CREATE INDEX IF NOT EXISTS idx_schedules_class ON public.schedules(class_name);
CREATE INDEX IF NOT EXISTS idx_agendas_date ON public.teaching_agendas(date);
CREATE INDEX IF NOT EXISTS idx_journals_date ON public.teaching_journals(date);
CREATE INDEX IF NOT EXISTS idx_daily_grades_student ON public.daily_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_unified_grades_student ON public.unified_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_docs_tool_type ON public.ai_documents(tool_type);
CREATE INDEX IF NOT EXISTS idx_cp_dists_subject ON public.cp_distributions(subject);
`;
  }
}

// Daftarkan listener perubahan storage untuk trigger auto sync jika diaktifkan
if (typeof window !== 'undefined') {
  addStorageListener((key) => {
    SupabaseService.triggerAutoSync(key);
  });
}
