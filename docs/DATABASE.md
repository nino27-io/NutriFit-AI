# Dokumentasi Database & Kepatuhan UU PDP — NutriFit AI

Dokumen ini menjelaskan arsitektur skema PostgreSQL (Supabase), alasan desain keamanan, dan panduan menjalankan migrasi serta pengujian Row Level Security (RLS).

---

## 1. Penjelasan Tabel

| Nama Tabel | Fungsi Utama |
| :--- | :--- |
| `profiles` | Menyimpan profil dasar pengguna (`user`, `staff`, `admin`) yang otomatis dibuat melalui trigger saat pendaftaran di `auth.users`. |
| `booth_sessions` | Mencatat jadwal dan lokasi operasional stan fisik (CFD, kampus, festival) beserta rentang waktu aktifnya (`starts_at` s.d. `ends_at`). |
| `subjects` | Entitas orang yang diukur. Mendukung mode **tanpa akun di stan** (`user_id` bernilai `NULL` saat awal diinput petugas) maupun **pengguna mandiri** (`user_id = auth.uid()`). |
| `consents` | Mencatat persetujuan eksplisit per tujuan (*granular consent*): `health_data_processing`, `ai_consultation`, dan `share_report` lengkap dengan versi kebijakan dan waktu pencabutan. |
| `measurements` | Menyimpan data antropometri (tinggi, berat, pinggang, pinggul, leher) serta hasil kalkulasi deterministik (`bmi`, `whr`, `body_fat_pct`, `bmr`, `tdee`, dan `calc_version`). |
| `health_screenings` | Dipisahkan dari `measurements` karena menyimpan kondisi medis sensitif (kehamilan/menyusui, riwayat gangguan makan, diabetes, penyakit kronis) dan flag rujukan profesional. |
| `report_shares` | Menyimpan hash SHA-256 dari token tautan berbagi laporan (`token_hash`) beserta waktu kedaluwarsa dan status pencabutan. |
| `payments` | Kerangka pencatatan transaksi pembayaran layanan stan/web (QRIS) dengan status `pending`, `paid`, atau `failed`. |
| `audit_log` | Mencatat setiap aksi pembuatan, perubahan, klaim, dan penghapusan data kesehatan oleh pengguna/petugas tanpa menyimpan isi data kesehatan tersebut. |

---

## 2. Alasan Desain & Keamanan (UU PDP)

1. **Pemisahan `subjects` dan `profiles` (Model Hybrid Stan & Mandiri):**
   Pengunjung stan di lapangan sering kali ingin diukur cepat tanpa registrasi akun terlebih dahulu. Petugas cukup membuat baris `subjects` dengan `claim_code_hash`. Pengunjung dapat membuat akun di rumah lalu memanggil fungsi `claim_subject(code)` untuk menautkan riwayat pengukuran stan ke akun pribadinya.
2. **Pembatasan Akses Petugas (`staff`) Berbasis Waktu (24 Jam):**
   Petugas stan hanya dapat menginput data pada `booth_session` yang sedang aktif dan hanya bisa melihat data yang ia input sendiri dalam 24 jam terakhir untuk keperluan koreksi salah ketik di lapangan. Petugas tidak bisa mengintip riwayat kesehatan pengguna lain.
3. **Pemisahan Hak Admin (`Zero Default Health Access`):**
   Role `admin` hanya mengelola jadwal `booth_sessions`, daftar `profiles`, dan memantau `audit_log`, tetapi tidak diberi kebijakan `SELECT` pada tabel data kesehatan (`subjects`, `measurements`, `health_screenings`).
4. **Pencegahan Rekursi RLS & Eskalasi Role:**
   Pemeriksaan role menggunakan fungsi `public.get_my_role()` berstatus `SECURITY DEFINER` dengan `search_path = public` yang terkunci. Trigger `trg_profiles_prevent_role_escalation` memastikan pengguna biasa tidak dapat memodifikasi kolom `role` miliknya sendiri.
5. **Hak Menghapus Data (`delete_my_data` - Pasal Penghapusan UU PDP):**
   Pengguna dapat menghapus seluruh jejak data kesehatannya kapan saja lewat satu pemanggilan RPC `delete_my_data()`. Sistem menghapus seluruh baris terkait secara kaskade (`ON DELETE CASCADE`) dan menyisakan log kejadian `PDP_DELETE_MY_DATA` tanpa nilai medis apa pun.

---

## 3. Cara Menerapkan Migrasi & Menguji RLS

### A. Menerapkan Migrasi via Supabase SQL Editor
1. Buka proyek Anda di [Supabase Dashboard](https://supabase.com/dashboard).
2. Masuk ke menu **SQL Editor** ➔ klik **New query**.
3. Salin seluruh isi file `supabase/migrations/0001_init.sql` dan tempelkan ke editor.
4. Klik **Run** (atau tekan `Ctrl + Enter`). Pastikan muncul pesan `Success. No rows returned`.

### B. Menjalankan Pengujian RLS
1. Di **SQL Editor**, buat lembar query baru (**New query**).
2. Salin seluruh isi file `supabase/tests/rls_test.sql` dan jalankan (**Run**).
3. Periksa tab **Messages / Notices** di bagian bawah editor. Seluruh 5 skenario wajib menampilkan status `LULUS Skenario 1` hingga `LULUS Skenario 5`.
4. Karena skrip uji diakhiri dengan `ROLLBACK;`, data sampel pengujian tidak akan mengotori database Anda.