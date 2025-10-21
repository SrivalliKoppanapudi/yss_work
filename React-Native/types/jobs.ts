// types/jobs.ts

export interface Job {
  id: number;
  job_name: string;
  job_title?: string | null;
  job_highlights?: string | null;
  phone?: string | null;
  qualification?: string | null;
  experience?: number | null; // This is the numeric total years from the 'jobs' table
  about?: string | null;
  details?: string | null;
  preferred_location?: string | null;
  additional_info?: string | null;
  duration?: number | null;
  job_id?: string | null;
  thumbnail_uri?: string | null;
  organization_id?: string | null;
  salary_range?: string | null;
  job_type?: string | null;
  required_skills?: string | null;
  benefits?: string | null;
  application_deadline?: string | null;
  status?: 'Active' | 'Inactive' | 'Expired' | 'Draft' | null;
  department?: string | null;
  education_level?: string | null;
  work_mode?: string | null;
  contact_email?: string | null;
  company_name?: string | null;
  industry?: string | null;
  employment_type?: string | null;
  user_id?: string | null; // User who posted the job
  created_at: string;
  updated_at: string;
  isBookmarked?: boolean; 
  organization_logo?: string | null;
}

export interface EducationEntry {
  id: string | number;
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string | null;
  isCurrent?: boolean; // <-- ADD THIS NEW PROPERTY
}

export interface ExperienceEntry {
  id: string | number;
  institution: string;
  position: string;
  location?: string | null;
  startDate: string;
  endDate: string;
  isCurrentPosition: boolean; // <--- This is boolean
  responsibilities?: string | null;
  achievements?: string | null;
}

export interface JobApplication {
  id?: string; // UUID from Supabase, optional for new application objects in frontend
  job_id: number; // Foreign key to jobs table
  user_id: string; // Foreign key to auth.users (applicant)

  first_name?: string | null;
  last_name?: string | null;
  dob?: string | null; // Format: 'YYYY-MM-DD'
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  pin_code?: string | null;

  education?: EducationEntry[] | null;
  teaching_level?: string | null; // e.g., 'Primary', 'Secondary'
  subjects_specialization?: string[] | null; // Array of subject strings

  is_experienced?: boolean | null; // True if user selects 'Experienced'
  experiences?: ExperienceEntry[] | null;
  experience?: string | null; // User input like 'Fresher', '1-2 years', 'Experienced'

  current_ctc?: string | null;
  expected_ctc?: string | null;
  board_experience?: string | null; // e.g., 'CBSE', 'ICSE', 'State Board'
  teaching_methodology?: string | null;
  languages_known?: string | null; // Could be comma-separated string or ideally string[]
  certifications?: string | null; // Could be comma-separated string or TEXT[]

  resume_url?: string | null; // URL from Supabase Storage

  application_date?: string; // Timestamp string, set by default in DB
  status?: 'Applied' | 'Viewed' | 'Shortlisted' | 'Interviewing' | 'Offered' | 'Hired' | 'Rejected' | 'Withdrawn';
  notes?: string | null; // For recruiter

  created_at?: string; // Timestamp string, set by default in DB
  updated_at?: string; // Timestamp string, set by default/trigger in DB

  // Related data
  job?: Job;
  interview_schedule?: InterviewSchedule;
}

export interface InterviewSchedule {
  id?: string;
  application_id: string;
  interview_date: string; // Format: 'YYYY-MM-DD'
  interview_time: string; // Format: 'HH:MM'
  interview_type: 'online' | 'offline';
  location?: string | null;
  meeting_link?: string | null;
  additional_notes?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  round?: string | null;
  duration?: number | null;
  cancelled_reason?: string | null;
  rescheduled_to?: string | null;
  updated_by?: string | null;
  updated_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  panelists?: InterviewPanelist[];
}

// --- DEPRECATED: Use InterviewPanelistV2 for new panelist table ---
export interface InterviewPanelist {
  id?: string;
  interview_id: string;
  name: string;
  email?: string;
  role?: string;
  organization?: string;
  phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// --- New robust type for interview_panelists table ---
export interface InterviewPanelistV2 {
  id: string;
  interview_id: string;
  name: string;
  email?: string;
  role?: string;
  organization?: string;
  phone?: string;
  photo_url?: string;
  linkedin_url?: string;
  notes?: string;
  availability?: 'Available' | 'Unavailable'; // Added for filtering and UI
  created_at: string;
  updated_at: string;
}

export interface InterviewDetails {
  jobTitle: string;
  companyName: string;
  round: string;
  interviewType: 'online' | 'offline';
  date: string;
  time?: string;
  duration: number; // in minutes
  panel: string[];
  notes?: string;
  meetingLink?: string;
  address?: string;
  instructions?: string;
}