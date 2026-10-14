export type UserRole = 'user' | 'staff' | 'admin';

export type BiologicalSex = 'male' | 'female';

export type ConsentPurpose =
  | 'health_data_processing'
  | 'ai_consultation'
  | 'share_report';

export type ConsentChannel = 'booth' | 'web';

export type MeasurementGoal = 'lose' | 'maintain' | 'gain';

export type ActivityFactorValue = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface ProfileRow {
  id: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
}

export interface BoothSessionRow {
  id: string;
  name: string;
  location: string;
  starts_at: string;
  ends_at: string;
  created_by: string;
}

export interface SubjectRow {
  id: string;
  user_id: string | null;
  booth_session_id: string | null;
  created_by: string;
  sex: BiologicalSex;
  birth_year: number;
  claim_code_hash: string | null;
  claim_expires_at: string | null;
  created_at: string;
}

export interface ConsentRow {
  id: string;
  subject_id: string;
  purpose: ConsentPurpose;
  policy_version: string;
  granted_at: string;
  revoked_at: string | null;
  granted_via: ConsentChannel;
}

export interface MeasurementRow {
  id: string;
  subject_id: string;
  booth_session_id: string | null;
  measured_by: string;
  measured_at: string;
  height_cm: number;
  weight_kg: number;
  waist_cm: number;
  hip_cm: number;
  neck_cm: number | null;
  activity_factor: ActivityFactorValue;
  goal: MeasurementGoal;
  bmi: number;
  whr: number;
  body_fat_pct: number | null;
  bmr: number;
  tdee: number;
  calc_version: string;
}

export interface HealthScreeningRow {
  id: string;
  subject_id: string;
  measurement_id: string;
  is_pregnant_or_nursing: boolean;
  has_eating_disorder_history: boolean;
  has_diabetes: boolean;
  has_chronic_condition: boolean;
  requires_professional_referral: boolean;
}

export interface ReportShareRow {
  id: string;
  measurement_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

export interface PaymentRow {
  id: string;
  subject_id: string;
  booth_session_id: string | null;
  amount_idr: number;
  status: PaymentStatus;
  provider_ref: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          role?: UserRole;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          role?: UserRole;
          display_name?: string | null;
        };
      };
      booth_sessions: {
        Row: BoothSessionRow;
        Insert: {
          id?: string;
          name: string;
          location: string;
          starts_at: string;
          ends_at: string;
          created_by?: string;
        };
        Update: {
          name?: string;
          location?: string;
          starts_at?: string;
          ends_at?: string;
        };
      };
      subjects: {
        Row: SubjectRow;
        Insert: {
          id?: string;
          user_id?: string | null;
          booth_session_id?: string | null;
          created_by?: string;
          sex: BiologicalSex;
          birth_year: number;
          claim_code_hash?: string | null;
          claim_expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          booth_session_id?: string | null;
          sex?: BiologicalSex;
          birth_year?: number;
          claim_code_hash?: string | null;
          claim_expires_at?: string | null;
        };
      };
      consents: {
        Row: ConsentRow;
        Insert: {
          id?: string;
          subject_id: string;
          purpose: ConsentPurpose;
          policy_version: string;
          granted_at?: string;
          revoked_at?: string | null;
          granted_via: ConsentChannel;
        };
        Update: {
          revoked_at?: string | null;
        };
      };
      measurements: {
        Row: MeasurementRow;
        Insert: {
          id?: string;
          subject_id: string;
          booth_session_id?: string | null;
          measured_by?: string;
          measured_at?: string;
          height_cm: number;
          weight_kg: number;
          waist_cm: number;
          hip_cm: number;
          neck_cm?: number | null;
          activity_factor: ActivityFactorValue;
          goal: MeasurementGoal;
          bmi: number;
          whr: number;
          body_fat_pct?: number | null;
          bmr: number;
          tdee: number;
          calc_version?: string;
        };
        Update: never;
      };
      health_screenings: {
        Row: HealthScreeningRow;
        Insert: {
          id?: string;
          subject_id: string;
          measurement_id: string;
          is_pregnant_or_nursing?: boolean;
          has_eating_disorder_history?: boolean;
          has_diabetes?: boolean;
          has_chronic_condition?: boolean;
          requires_professional_referral?: boolean;
        };
        Update: never;
      };
      report_shares: {
        Row: ReportShareRow;
        Insert: {
          id?: string;
          measurement_id: string;
          token_hash: string;
          expires_at: string;
          revoked_at?: string | null;
        };
        Update: {
          revoked_at?: string | null;
        };
      };
      payments: {
        Row: PaymentRow;
        Insert: {
          id?: string;
          subject_id: string;
          booth_session_id?: string | null;
          amount_idr: number;
          status?: PaymentStatus;
          provider_ref?: string | null;
          created_at?: string;
        };
        Update: {
          status?: PaymentStatus;
          provider_ref?: string | null;
        };
      };
      audit_log: {
        Row: AuditLogRow;
        Insert: never;
        Update: never;
      };
    };
    Functions: {
      claim_subject: {
        Args: { code: string };
        Returns: string;
      };
      delete_my_data: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_my_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
  };
}