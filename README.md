# 🎓 E - Project Guru Digital

Aplikasi Administrasi Guru Kreatif & Perangkat Ajar Kurikulum Merdeka & Deep Learning terpadu (Presensi, Jadwal, Agenda, Jurnal Mengajar, Penilaian Rapor, Perangkat Ajar AI, dan Sinkronisasi Cloud PostgreSQL).

---

## 🌐 Deploy Otomatis ke GitHub Pages (`github.io`)

Aplikasi ini sudah dilengkapi dengan **GitHub Actions Workflow** otomatis (`.github/workflows/deploy-pages.yml`) yang akan mem-build dan mempublikasikan aplikasi ke GitHub Pages setiap kali Anda melakukan `git push` ke branch `main` atau `master`.

### Format URL Deployment:
```text
https://<username-github>.github.io/<nama-repository>/
```
*Contoh:* Jika username GitHub Anda adalah `ianbandanesse` dan nama repositori adalah `e-project-guru-digital`, maka URL otomatisnya adalah:
👉 **`https://ianbandanesse.github.io/e-project-guru-digital/`**

---

## ⚙️ 2 Pengaturan Wajib di Repositori GitHub Anda (Cukup 1 Kali Saja)

Agar aplikasi dapat di-deploy dan diakses secara sempurna tanpa kendala perizinan (Error 403 / 404):

### 1. Aktifkan Sumber GitHub Pages (Pages Source)
1. Buka repositori Anda di GitHub: `https://github.com/<username>/<repository>`
2. Klik tab **Settings** (di menu atas repositori).
3. Di bilah menu kiri, pilih **Pages** (di bawah kelompok *Code and automation*).
4. Di bagian **Build and deployment > Source**, pilih: **`GitHub Actions`**  
   *(⚠️ Sangat penting: Jangan pilih "Deploy from a branch", pastikan memilih "GitHub Actions")*.

### 2. Atur Izin Alur Kerja (Workflow Permissions)
1. Di tab **Settings** yang sama, di bilah menu kiri klik **Actions** > pilih **General**.
2. Gulir ke bawah hingga bagian **Workflow permissions**.
3. Pilih opsi: **`Read and write permissions`**.
4. Centang kotak: **`Allow GitHub Actions to create and approve pull requests`**.
5. Klik **Save**.

Setelah 2 pengaturan di atas aktif:
- Setiap kali Anda melakukan `git push`, workflow di `.github/workflows/deploy-pages.yml` akan berjalan otomatis.
- Link aplikasi aktif akan langsung muncul di tab **Actions** (di ringkasan langkah kerja) dan di menu **Environments > github-pages**.

---

## 🚀 Fitur Kompatibilitas GitHub Pages yang Telah Diterapkan

- 🔄 **SPA Routing Resilient (`404.html` & `index.html`)**: Mencegah error 404 saat pengguna me-refresh (*reload*) halaman di subpath repositori GitHub Pages.
- 🚫 **Bypass Jekyll (`.nojekyll`)**: Memastikan seluruh berkas Vite, aset modern, dan modul JavaScript disajikan tanpa diabaikan oleh sistem Jekyll GitHub.
- 📱 **Progressive Web App (PWA) Berbasis Relatif**: `manifest.json` dan `sw.js` secara otomatis menyesuaikan dengan subpath repositori (`/<nama-repo>/`).
- ☁️ **Integrasi Supabase Langsung**: Query data dan sinkronisasi cloud berjalan langsung dari browser tanpa mewajibkan server perantara.
- 🤖 **Asisten AI Fleksibel**: Mendukung input API Key Google Gemini langsung di peramban serta generator bundel kurikulum otomatis jika offline.

---

## 💻 Menjalankan di Lokal (Development)

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server lokal
npm run dev

# 3. Build untuk produksi
npm run build:pages
```

---

Dibuat dengan ❤️ untuk kemajuan pendidikan digital Indonesia.
