-- ============================================================================
-- NUTRIFIT AI - INITIAL DATABASE SCHEMA & RLS MIGRATION (0001_init.sql)
-- Standar: PostgreSQL / Supabase + Kepatuhan UU PDP Indonesia
-- ============================================================================

BEGIN;

-- Ekstensi untuk UUID dan Hashing SHA-256 (kode klaim & token share)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. DEFINISI TABEL
-- ============================================================================

-- 1.1 Tabel: profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'staff', 'admin')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Tabel: booth_sessions
CREATE TABLE public.booth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT booth_sessions_valid_window CHECK (ends_at > starts_at)
);

-- 1.3 Tabel: subjects (Orang yang diukur di stan atau pengguna mandiri)
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booth_session_id uuid REFERENCES public.booth_sessions(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  sex text NOT NULL CHECK (sex IN ('male', 'female')),
  birth_year integer NOT NULL CHECK (
    birth_year BETWEEN (EXTRACT(YEAR FROM CURRENT_DATE)::int - 100)
                   AND (EXTRACT(YEAR FROM CURRENT_DATE)::int - 10)
  ),
  claim_code_hash text,
  claim_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.4 Tabel: consents (Persetujuan eksplisit per tujuan sesuai UU PDP)
CREATE TABLE public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (
    purpose IN ('health_data_processing', 'ai_consultation', 'share_report')
  ),
  policy_version text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  granted_via text NOT NULL CHECK (granted_via IN ('booth', 'web'))
);

-- 1.5 Tabel: measurements (Antropometri & hasil kalkulasi deterministik)
CREATE TABLE public.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  booth_session_id uuid REFERENCES public.booth_sessions(id) ON DELETE SET NULL,
  measured_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  measured_at timestamptz NOT NULL DEFAULT now(),
  height_cm numeric(5,2) NOT NULL CHECK (height_cm BETWEEN 100 AND 250),
  weight_kg numeric(5,2) NOT NULL CHECK (weight_kg BETWEEN 25 AND 300),
  waist_cm numeric(5,2) NOT NULL CHECK (waist_cm BETWEEN 40 AND 200),
  hip_cm numeric(5,2) NOT NULL CHECK (hip_cm BETWEEN 50 AND 200),
  neck_cm numeric(5,2) CHECK (neck_cm IS NULL OR (neck_cm BETWEEN 20 AND 70)),
  activity_factor numeric(4,3) NOT NULL CHECK (
    activity_factor IN (1.2, 1.375, 1.55, 1.725, 1.9)
  ),
  goal text NOT NULL CHECK (goal IN ('lose', 'maintain', 'gain')),
  bmi numeric(5,2) NOT NULL CHECK (bmi > 0),
  whr numeric(4,2) NOT NULL CHECK (whr > 0),
  body_fat_pct numeric(5,2) CHECK (body_fat_pct IS NULL OR (body_fat_pct BETWEEN 2 AND 75)),
  bmr integer NOT NULL CHECK (bmr > 0),
  tdee integer NOT NULL CHECK (tdee > 0),
  calc_version text NOT NULL DEFAULT 'v1.0'
);

-- 1.6 Tabel: health_screenings (Data sensitif penapisan risiko medis)
CREATE TABLE public.health_screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  measurement_id uuid NOT NULL UNIQUE REFERENCES public.measurements(id) ON DELETE CASCADE,
  is_pregnant_or_nursing boolean NOT NULL DEFAULT false,
  has_eating_disorder_history boolean NOT NULL DEFAULT false,
  has_diabetes boolean NOT NULL DEFAULT false,
  has_chronic_condition boolean NOT NULL DEFAULT false,
  requires_professional_referral boolean NOT NULL DEFAULT false
);

-- 1.7 Tabel: report_shares (Tautan berbagi laporan dengan hash token)
CREATE TABLE public.report_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL REFERENCES public.measurements(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

-- 1.8 Tabel: payments (Kerangka transaksi QRIS stan/web)
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  booth_session_id uuid REFERENCES public.booth_sessions(id) ON DELETE SET NULL,
  amount_idr integer NOT NULL CHECK (amount_idr >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.9 Tabel: audit_log (Jejak audit tanpa menyimpan isi data kesehatan)
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. INDEXING
-- ============================================================================

CREATE INDEX idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX idx_subjects_created_by_created_at ON public.subjects(created_by, created_at DESC);
CREATE INDEX idx_subjects_claim_code_hash ON public.subjects(claim_code_hash) WHERE claim_code_hash IS NOT NULL;

CREATE INDEX idx_consents_subject_id ON public.consents(subject_id);

CREATE INDEX idx_measurements_subject_id ON public.measurements(subject_id);
CREATE INDEX idx_measurements_measured_at ON public.measurements(measured_at DESC);
CREATE INDEX idx_measurements_measured_by_at ON public.measurements(measured_by, measured_at DESC);

CREATE INDEX idx_health_screenings_subject_id ON public.health_screenings(subject_id);
CREATE INDEX idx_health_screenings_measurement_id ON public.health_screenings(measurement_id);

CREATE INDEX idx_report_shares_measurement_id ON public.report_shares(measurement_id);
CREATE INDEX idx_payments_subject_id ON public.payments(subject_id);
CREATE INDEX idx_audit_log_actor_created_at ON public.audit_log(actor_id, created_at DESC);

-- ============================================================================
-- 3. FUNGSI KEAMANAN & HELPER (SECURITY DEFINER)
-- ============================================================================

-- 3.1 Membaca role pengguna saat ini tanpa memicu rekursi RLS pada tabel profiles
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 3.2 Mengecek apakah booth_session sedang aktif saat ini
CREATE OR REPLACE FUNCTION public.is_active_booth_session(p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.booth_sessions bs
    WHERE bs.id = p_session_id
      AND now() BETWEEN bs.starts_at AND bs.ends_at
  );
$$;

-- 3.3 Mengecek apakah subject adalah milik pengguna mandiri yang sedang login
CREATE OR REPLACE FUNCTION public.is_my_subject(p_subject_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subjects s
    WHERE s.id = p_subject_id
      AND s.user_id = auth.uid()
  );
$$;

-- 3.4 Mengecek apakah subject dibuat oleh petugas yang login dalam 24 jam terakhir
CREATE OR REPLACE FUNCTION public.is_staff_recent_subject(p_subject_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subjects s
    WHERE s.id = p_subject_id
      AND s.created_by = auth.uid()
      AND s.created_at >= (now() - interval '24 hours')
  );
$$;

-- 3.5 Mengecek apakah measurement dimiliki pengguna mandiri yang login
CREATE OR REPLACE FUNCTION public.is_my_measurement(p_measurement_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.measurements m
    JOIN public.subjects s ON s.id = m.subject_id
    WHERE m.id = p_measurement_id
      AND s.user_id = auth.uid()
  );
$$;

-- 3.6 Mengecek apakah measurement dibuat oleh petugas dalam 24 jam terakhir
CREATE OR REPLACE FUNCTION public.is_staff_recent_measurement(p_measurement_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.measurements m
    WHERE m.id = p_measurement_id
      AND m.measured_by = auth.uid()
      AND m.measured_at >= (now() - interval '24 hours')
  );
$$;

-- ============================================================================
-- 4. TRIGGER OTOMATISASI & PENJAGA INTEGRITAS
-- ============================================================================

-- 4.1 Trigger membuat baris profiles otomatis saat user mendaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4.2 Trigger mencegah pengguna mengubah kolom role miliknya sendiri
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Hanya admin atau superuser database (saat migrasi/seeding) yang boleh mengubah role
    IF auth.uid() IS NOT NULL AND public.get_my_role() IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Pelanggaran keamanan: Pengguna tidak diizinkan mengubah role sendiri.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();

-- 4.3 Trigger otomatis menghitung requires_professional_referral pada health_screenings
CREATE OR REPLACE FUNCTION public.compute_screening_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_birth_year integer;
  v_is_under_18 boolean := false;
BEGIN
  SELECT birth_year INTO v_birth_year
  FROM public.subjects
  WHERE id = NEW.subject_id;

  IF v_birth_year IS NOT NULL AND (EXTRACT(YEAR FROM CURRENT_DATE)::int - v_birth_year) < 18 THEN
    v_is_under_18 := true;
  END IF;

  NEW.requires_professional_referral := (
    COALESCE(NEW.requires_professional_referral, false)
    OR NEW.is_pregnant_or_nursing
    OR NEW.has_eating_disorder_history
    OR NEW.has_diabetes
    OR NEW.has_chronic_condition
    OR v_is_under_18
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_health_screenings_compute_referral
  BEFORE INSERT OR UPDATE ON public.health_screenings
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_screening_referral();

-- 4.4 Trigger pencatatan otomatis ke audit_log untuk tabel kesehatan
CREATE OR REPLACE FUNCTION public.log_health_data_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
  ELSE
    v_record_id := NEW.id;
  END IF;

  INSERT INTO public.audit_log (actor_id, action, table_name, record_id)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, v_record_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_subjects
  AFTER INSERT OR UPDATE OR DELETE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.log_health_data_mutation();

CREATE TRIGGER trg_audit_consents
  AFTER INSERT OR UPDATE OR DELETE ON public.consents
  FOR EACH ROW EXECUTE FUNCTION public.log_health_data_mutation();

CREATE TRIGGER trg_audit_measurements
  AFTER INSERT OR UPDATE OR DELETE ON public.measurements
  FOR EACH ROW EXECUTE FUNCTION public.log_health_data_mutation();

CREATE TRIGGER trg_audit_health_screenings
  AFTER INSERT OR UPDATE OR DELETE ON public.health_screenings
  FOR EACH ROW EXECUTE FUNCTION public.log_health_data_mutation();

CREATE TRIGGER trg_audit_report_shares
  AFTER INSERT OR UPDATE OR DELETE ON public.report_shares
  FOR EACH ROW EXECUTE FUNCTION public.log_health_data_mutation();

-- ============================================================================
-- 5. FUNGSI RPC UTAMA: CLAIM SUBJECT & DELETE MY DATA (UU PDP)
-- ============================================================================

-- 5.1 Fungsi: claim_subject(code)
-- Menghubungkan data pengukuran stan ke akun pengguna yang login memakai kode sekali pakai
CREATE OR REPLACE FUNCTION public.claim_subject(code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_code_hash text;
  v_subject_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan untuk mengklaim data.';
  END IF;

  IF code IS NULL OR length(trim(code)) = 0 THEN
    RAISE EXCEPTION 'Kode klaim tidak boleh kosong.';
  END IF;

  v_code_hash := encode(digest(trim(code), 'sha256'), 'hex');

  UPDATE public.subjects
  SET
    user_id = v_user_id,
    claim_code_hash = NULL,
    claim_expires_at = NULL
  WHERE claim_code_hash = v_code_hash
    AND user_id IS NULL
    AND claim_expires_at IS NOT NULL
    AND claim_expires_at > now()
  RETURNING id INTO v_subject_id;

  IF v_subject_id IS NULL THEN
    RAISE EXCEPTION 'Kode klaim tidak valid, sudah digunakan, atau telah kedaluwarsa.';
  END IF;

  INSERT INTO public.audit_log (actor_id, action, table_name, record_id)
  VALUES (v_user_id, 'CLAIM_SUBJECT', 'subjects', v_subject_id);

  RETURN v_subject_id;
END;
$$;

-- 5.2 Fungsi: delete_my_data()
-- Hak untuk dilupakan (Right to Erasure - UU PDP): menghapus seluruh data kesehatan pemanggil
CREATE OR REPLACE FUNCTION public.delete_my_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_deleted_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan untuk menghapus data.';
  END IF;

  -- Menghapus seluruh subjects milik user_id pemanggil.
  -- Karena ON DELETE CASCADE, baris terkait di measurements, health_screenings,
  -- consents, report_shares, dan payments ikut terhapus otomatis.
  WITH deleted AS (
    DELETE FROM public.subjects
    WHERE user_id = v_user_id
    RETURNING id
  )
  SELECT count(*)::integer INTO v_deleted_count FROM deleted;

  -- Catat bukti penghapusan di audit_log tanpa menyimpan isi data kesehatan
  INSERT INTO public.audit_log (actor_id, action, table_name, record_id)
  VALUES (v_user_id, 'PDP_DELETE_MY_DATA', 'subjects', v_user_id);

  RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_subject(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_data() TO authenticated;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) DI SEMUA TABEL
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 6.1 Policies: profiles
-- ----------------------------------------------------------------------------
CREATE POLICY profiles_select_own_or_admin
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.get_my_role() = 'admin');

CREATE POLICY profiles_update_own_no_role_change
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = public.get_my_role());

CREATE POLICY profiles_admin_update
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 6.2 Policies: booth_sessions
-- ----------------------------------------------------------------------------
CREATE POLICY booth_sessions_select_staff_or_admin
  ON public.booth_sessions FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('staff', 'admin'));

CREATE POLICY booth_sessions_manage_admin_only
  ON public.booth_sessions FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 6.3 Policies: subjects
-- (Catatan: Admin sengaja TIDAK diberi policy SELECT ke data kesehatan)
-- ----------------------------------------------------------------------------
-- Pengguna mandiri: baca/buat/ubah/hapus baris miliknya sendiri
CREATE POLICY subjects_user_select_own
  ON public.subjects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY subjects_user_insert_own
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'user'
    AND user_id = auth.uid()
    AND created_by = auth.uid()
    AND booth_session_id IS NULL
  );

CREATE POLICY subjects_user_update_own
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY subjects_user_delete_own
  ON public.subjects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Petugas stan (staff): buat dalam sesi stan aktif, baca hanya buatannya dalam 24 jam terakhir
CREATE POLICY subjects_staff_insert_active_booth
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'staff'
    AND created_by = auth.uid()
    AND booth_session_id IS NOT NULL
    AND public.is_active_booth_session(booth_session_id)
  );

CREATE POLICY subjects_staff_select_recent_own
  ON public.subjects FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'staff'
    AND created_by = auth.uid()
    AND created_at >= (now() - interval '24 hours')
  );

-- ----------------------------------------------------------------------------
-- 6.4 Policies: consents
-- ----------------------------------------------------------------------------
CREATE POLICY consents_user_select_own
  ON public.consents FOR SELECT
  TO authenticated
  USING (public.is_my_subject(subject_id));

CREATE POLICY consents_user_insert_own
  ON public.consents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_my_subject(subject_id)
    AND granted_via = 'web'
  );

CREATE POLICY consents_user_update_own
  ON public.consents FOR UPDATE
  TO authenticated
  USING (public.is_my_subject(subject_id))
  WITH CHECK (public.is_my_subject(subject_id));

CREATE POLICY consents_staff_insert_active_booth
  ON public.consents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'staff'
    AND granted_via = 'booth'
    AND public.is_staff_recent_subject(subject_id)
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = subject_id
        AND s.booth_session_id IS NOT NULL
        AND public.is_active_booth_session(s.booth_session_id)
    )
  );

CREATE POLICY consents_staff_select_recent_own
  ON public.consents FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'staff'
    AND granted_at >= (now() - interval '24 hours')
    AND public.is_staff_recent_subject(subject_id)
  );

-- ----------------------------------------------------------------------------
-- 6.5 Policies: measurements
-- ----------------------------------------------------------------------------
CREATE POLICY measurements_user_select_own
  ON public.measurements FOR SELECT
  TO authenticated
  USING (public.is_my_subject(subject_id));

CREATE POLICY measurements_user_insert_own
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_my_subject(subject_id)
    AND measured_by = auth.uid()
    AND booth_session_id IS NULL
  );

CREATE POLICY measurements_user_delete_own
  ON public.measurements FOR DELETE
  TO authenticated
  USING (public.is_my_subject(subject_id));

CREATE POLICY measurements_staff_insert_active_booth
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'staff'
    AND measured_by = auth.uid()
    AND booth_session_id IS NOT NULL
    AND public.is_active_booth_session(booth_session_id)
    AND public.is_staff_recent_subject(subject_id)
  );

CREATE POLICY measurements_staff_select_recent_own
  ON public.measurements FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'staff'
    AND measured_by = auth.uid()
    AND measured_at >= (now() - interval '24 hours')
  );

-- ----------------------------------------------------------------------------
-- 6.6 Policies: health_screenings
-- ----------------------------------------------------------------------------
CREATE POLICY screenings_user_select_own
  ON public.health_screenings FOR SELECT
  TO authenticated
  USING (public.is_my_subject(subject_id));

CREATE POLICY screenings_user_insert_own
  ON public.health_screenings FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_my_subject(subject_id)
    AND public.is_my_measurement(measurement_id)
  );

CREATE POLICY screenings_staff_insert_active_booth
  ON public.health_screenings FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'staff'
    AND public.is_staff_recent_subject(subject_id)
    AND public.is_staff_recent_measurement(measurement_id)
    AND EXISTS (
      SELECT 1 FROM public.measurements m
      WHERE m.id = measurement_id
        AND m.booth_session_id IS NOT NULL
        AND public.is_active_booth_session(m.booth_session_id)
    )
  );

CREATE POLICY screenings_staff_select_recent_own
  ON public.health_screenings FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'staff'
    AND public.is_staff_recent_measurement(measurement_id)
  );

-- ----------------------------------------------------------------------------
-- 6.7 Policies: report_shares
-- ----------------------------------------------------------------------------
CREATE POLICY report_shares_user_all_own
  ON public.report_shares FOR ALL
  TO authenticated
  USING (public.is_my_measurement(measurement_id))
  WITH CHECK (public.is_my_measurement(measurement_id));

CREATE POLICY report_shares_staff_insert_recent
  ON public.report_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'staff'
    AND public.is_staff_recent_measurement(measurement_id)
  );

CREATE POLICY report_shares_staff_select_recent
  ON public.report_shares FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'staff'
    AND public.is_staff_recent_measurement(measurement_id)
  );

-- ----------------------------------------------------------------------------
-- 6.8 Policies: payments
-- ----------------------------------------------------------------------------
CREATE POLICY payments_user_select_own
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.is_my_subject(subject_id));

CREATE POLICY payments_staff_insert_active_booth
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'staff'
    AND booth_session_id IS NOT NULL
    AND public.is_active_booth_session(booth_session_id)
    AND public.is_staff_recent_subject(subject_id)
  );

CREATE POLICY payments_staff_select_recent_own
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'staff'
    AND created_at >= (now() - interval '24 hours')
    AND public.is_staff_recent_subject(subject_id)
  );

-- ----------------------------------------------------------------------------
-- 6.9 Policies: audit_log
-- Hanya pengguna bisa melihat log miliknya sendiri, atau admin melihat jejak audit
-- ----------------------------------------------------------------------------
CREATE POLICY audit_log_select_actor_or_admin
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid() OR public.get_my_role() = 'admin');

COMMIT;