-- ============================================================================
-- NUTRIFIT AI - RLS & CONSTRAINT VERIFICATION SUITE (rls_test.sql)
-- Cara menjalankan: Tempel dan jalankan di Supabase SQL Editor setelah 0001_init.sql.
-- Seluruh pengujian dibungkus transaksi BEGIN ... ROLLBACK sehingga tidak mengotori DB.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_user_a uuid := '11111111-1111-1111-1111-111111111111';
  v_user_b uuid := '22222222-2222-2222-2222-222222222222';
  v_staff_1 uuid := '33333333-3333-3333-3333-333333333333';
  v_admin_1 uuid := '44444444-4444-4444-4444-444444444444';

  v_booth_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_subject_a uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_subject_b uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_subject_staff_recent uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  v_subject_staff_old uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

  v_count integer;
  v_role text;
  v_failed boolean;
BEGIN
  -- --------------------------------------------------------------------------
  -- PERSIAPAN DATA UJI (Sebagai Superuser / Seed)
  -- --------------------------------------------------------------------------
  INSERT INTO auth.users (id, email) VALUES
    (v_user_a, 'user_a@nutrifit.test'),
    (v_user_b, 'user_b@nutrifit.test'),
    (v_staff_1, 'staff_1@nutrifit.test'),
    (v_admin_1, 'admin_1@nutrifit.test');

  -- Set role untuk staff dan admin
  UPDATE public.profiles SET role = 'staff' WHERE id = v_staff_1;
  UPDATE public.profiles SET role = 'admin' WHERE id = v_admin_1;

  -- Buat sesi booth aktif
  INSERT INTO public.booth_sessions (id, name, location, starts_at, ends_at, created_by)
  VALUES (v_booth_id, 'CFD Sudirman Makassar', 'Jl. Jend. Sudirman', now() - interval '1 hour', now() + interval '3 hours', v_admin_1);

  -- Buat subject milik User A dan User B
  INSERT INTO public.subjects (id, user_id, created_by, sex, birth_year)
  VALUES
    (v_subject_a, v_user_a, v_user_a, 'male', 2002),
    (v_subject_b, v_user_b, v_user_b, 'female', 2003);

  -- Buat subject buatan Staff 1: satu baru (<24 jam), satu lama (30 jam lalu)
  INSERT INTO public.subjects (id, user_id, booth_session_id, created_by, sex, birth_year, created_at)
  VALUES
    (v_subject_staff_recent, NULL, v_booth_id, v_staff_1, 'male', 2001, now() - interval '2 hours'),
    (v_subject_staff_old, NULL, v_booth_id, v_staff_1, 'female', 2000, now() - interval '30 hours');

  -- ==========================================================================
  -- SKENARIO 1: User A tidak bisa membaca data User B
  -- Hasil yang diharapkan:
  -- - Saat login sebagai User A, query ke subjects milik User B menghasilkan 0 baris.
  -- - Query ke subjects milik User A menghasilkan 1 baris.
  -- ==========================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO v_count FROM public.subjects WHERE id = v_subject_b;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'GAGAL Skenario 1: User A dapat membaca data User B!';
  END IF;

  SELECT count(*) INTO v_count FROM public.subjects WHERE id = v_subject_a;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'GAGAL Skenario 1: User A tidak dapat membaca datanya sendiri!';
  END IF;
  RAISE NOTICE 'LULUS Skenario 1: User A tidak bisa membaca data User B.';

  -- ==========================================================================
  -- SKENARIO 2: Petugas (staff) tidak bisa membaca data di luar 24 jam / bukan buatannya
  -- Hasil yang diharapkan:
  -- - Staff 1 hanya bisa membaca v_subject_staff_recent (dibuat 2 jam lalu).
  -- - Staff 1 TIDAK BISA membaca v_subject_staff_old (dibuat 30 jam lalu) -> 0 baris.
  -- - Staff 1 TIDAK BISA membaca v_subject_a (buatan User A) -> 0 baris.
  -- ==========================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_staff_1, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO v_count FROM public.subjects WHERE id = v_subject_staff_recent;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'GAGAL Skenario 2: Staff 1 gagal membaca datanya yang baru (<24 jam)!';
  END IF;

  SELECT count(*) INTO v_count FROM public.subjects WHERE id = v_subject_staff_old;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'GAGAL Skenario 2: Staff 1 masih bisa membaca data di luar 24 jam!';
  END IF;

  SELECT count(*) INTO v_count FROM public.subjects WHERE id = v_subject_a;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'GAGAL Skenario 2: Staff 1 bisa membaca data pengguna lain!';
  END IF;
  RAISE NOTICE 'LULUS Skenario 2: Petugas tidak bisa membaca data >24 jam atau bukan buatannya.';

  -- ==========================================================================
  -- SKENARIO 3: User tidak bisa menaikkan role dirinya sendiri
  -- Hasil yang diharapkan:
  -- - Upaya UPDATE profiles SET role = 'admin' oleh User A ditolak oleh Trigger/RLS.
  -- ==========================================================================
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

  v_failed := false;
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = v_user_a;
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
  END;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_a;
  IF v_role <> 'user' THEN
    RAISE EXCEPTION 'GAGAL Skenario 3: User A berhasil mengubah role menjadi %!', v_role;
  END IF;
  RAISE NOTICE 'LULUS Skenario 3: User tidak bisa menaikkan role dirinya sendiri.';

  -- ==========================================================================
  -- SKENARIO 4: Measurements di luar rentang wajar ditolak oleh CHECK constraint
  -- Hasil yang diharapkan:
  -- - Insert tinggi 300 cm (batas 100-250) atau berat 10 kg (batas 25-300) memicu error constraint.
  -- ==========================================================================
  v_failed := false;
  BEGIN
    INSERT INTO public.measurements (
      subject_id, measured_by, height_cm, weight_kg, waist_cm, hip_cm, neck_cm,
      activity_factor, goal, bmi, whr, bmr, tdee
    ) VALUES (
      v_subject_a, v_user_a, 310, 70, 80, 95, 38,
      1.55, 'maintain', 22.5, 0.84, 1650, 2550
    );
  EXCEPTION WHEN check_violation THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'GAGAL Skenario 4: Measurement dengan tinggi 310 cm tidak ditolak!';
  END IF;
  RAISE NOTICE 'LULUS Skenario 4: Measurements di luar rentang wajar ditolak otomatis.';

  -- ==========================================================================
  -- SKENARIO 5: delete_my_data() hanya menghapus data pemanggil & mencatat audit log
  -- Hasil yang diharapkan:
  -- - User A memanggil delete_my_data() -> data User A terhapus (0 baris tersisa).
  -- - Data User B tetap utuh (1 baris).
  -- - Tabel audit_log mencatat aksi 'PDP_DELETE_MY_DATA' untuk User A.
  -- ==========================================================================
  PERFORM public.delete_my_data();

  SELECT count(*) INTO v_count FROM public.subjects WHERE id = v_subject_a;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'GAGAL Skenario 5: Data User A belum terhapus setelah delete_my_data()!';
  END IF;

  -- Kembalikan ke superuser sementara untuk memverifikasi data User B tetap utuh di tabel
  PERFORM set_config('role', 'postgres', true);

  SELECT count(*) INTO v_count FROM public.subjects WHERE id = v_subject_b;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'GAGAL Skenario 5: Data User B ikut terhapus oleh panggilan User A!';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.audit_log
  WHERE actor_id = v_user_a AND action = 'PDP_DELETE_MY_DATA';
  IF v_count < 1 THEN
    RAISE EXCEPTION 'GAGAL Skenario 5: Penghapusan data tidak tercatat di audit_log!';
  END IF;

  RAISE NOTICE 'LULUS Skenario 5: delete_my_data() hanya menghapus data pemanggil dan tercatat di audit_log.';
END $$;

ROLLBACK;