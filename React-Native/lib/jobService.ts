import { supabase } from './Superbase';
import { Job, JobApplication, InterviewSchedule, InterviewPanelist, InterviewPanelistV2 } from '../types/jobs';

export class JobService {
  // Job Management
  static async getJobs(filters?: {
    status?: string;
    search?: string;
    location?: string;
    jobType?: string;
    workMode?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'Active');

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`job_name.ilike.${searchTerm},company_name.ilike.${searchTerm}`);
      }

      if (filters?.location) {
        query = query.ilike('preferred_location', `%${filters.location}%`);
      }

      if (filters?.jobType && filters.jobType !== 'All') {
        query = query.eq('job_type', filters.jobType);
      }

      if (filters?.workMode && filters.workMode !== 'All') {
        query = query.eq('work_mode', filters.workMode);
      }

      query = query.order('created_at', { ascending: false });

      if (filters?.page && filters?.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = filters.page * filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as Job[];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  static async getJobById(jobId: number): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data as Job;
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  }

  // Application Management
  static async getApplications(filters?: {
    jobId?: number;
    userId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs(job_name, company_name, preferred_location),
          interview_schedule:interview_schedules(*)
        `);

      if (filters?.jobId) {
        query = query.eq('job_id', filters.jobId);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('created_at', { ascending: false });

      if (filters?.page && filters?.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = filters.page * filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as JobApplication[];
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  }

  static async getApplicationById(applicationId: string): Promise<JobApplication | null> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs(job_name, company_name, preferred_location),
          interview_schedule:interview_schedules(*)
        `)
        .eq('id', applicationId)
        .single();

      if (error) throw error;
      return data as JobApplication;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  }

  static async updateApplicationStatus(applicationId: string, status: string) {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  // Interview Management
  static async scheduleInterview(applicationId: string, interviewData: {
    interview_date: string;
    interview_time: string;
    interview_type: 'online' | 'offline';
    location?: string;
    meeting_link?: string;
    additional_notes?: string;
  }) {
    try {
      // First, create or update the interview schedule
      const scheduleData = {
        application_id: applicationId,
        ...interviewData,
        status: 'scheduled'
      };

      // Check if interview already exists
      const { data: existingInterview } = await supabase
        .from('interview_schedules')
        .select('id')
        .eq('application_id', applicationId)
        .single();

      let operation;
      if (existingInterview) {
        // Update existing schedule
        operation = supabase
          .from('interview_schedules')
          .update(scheduleData)
          .eq('id', existingInterview.id);
      } else {
        // Create new schedule
        operation = supabase
          .from('interview_schedules')
          .insert([scheduleData]);
      }

      const { error: scheduleError } = await operation;
      if (scheduleError) throw scheduleError;

      // Update application status to Interviewing
      const { error: statusError } = await supabase
        .from('job_applications')
        .update({ status: 'Interviewing' })
        .eq('id', applicationId);

      if (statusError) throw statusError;

      return true;
    } catch (error) {
      console.error('Error scheduling interview:', error);
      throw error;
    }
  }

  static async getInterviewSchedule(applicationId: string): Promise<InterviewSchedule | null> {
    try {
      const { data, error } = await supabase
        .from('interview_schedules')
        .select('*')
        .eq('application_id', applicationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as InterviewSchedule | null;
    } catch (error) {
      console.error('Error fetching interview schedule:', error);
      throw error;
    }
  }

  static async updateInterviewStatus(applicationId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled') {
    try {
      const { error } = await supabase
        .from('interview_schedules')
        .update({ status })
        .eq('application_id', applicationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating interview status:', error);
      throw error;
    }
  }

  // Analytics and Statistics
  static async getApplicationStats() {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        applied: data?.filter(app => app.status === 'Applied').length || 0,
        interviewing: data?.filter(app => app.status === 'Interviewing').length || 0,
        hired: data?.filter(app => app.status === 'Hired').length || 0,
        rejected: data?.filter(app => app.status === 'Rejected').length || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw error;
    }
  }

  static async getInterviewStats() {
    try {
      const { data, error } = await supabase
        .from('interview_schedules')
        .select('status, interview_type');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        scheduled: data?.filter(int => int.status === 'scheduled').length || 0,
        completed: data?.filter(int => int.status === 'completed').length || 0,
        cancelled: data?.filter(int => int.status === 'cancelled').length || 0,
        online: data?.filter(int => int.interview_type === 'online').length || 0,
        offline: data?.filter(int => int.interview_type === 'offline').length || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching interview stats:', error);
      throw error;
    }
  }

  // Utility Methods
  static async checkIfUserApplied(jobId: number, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if user applied:', error);
      return false;
    }
  }

  static async getUpcomingInterviews(userId?: string) {
    try {
      let query = supabase
        .from('interview_schedules')
        .select(`
          *,
          job_applications!inner(
            id,
            first_name,
            last_name,
            user_id,
            jobs!inner(
              job_name,
              company_name
            )
          )
        `)
        .gte('interview_date', new Date().toISOString().split('T')[0])
        .eq('status', 'scheduled')
        .order('interview_date', { ascending: true })
        .order('interview_time', { ascending: true });

      if (userId) {
        query = query.eq('job_applications.user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching upcoming interviews:', error);
      throw error;
    }
  }

  // --- DEPRECATED: Use V2 functions for new interview_panelists table ---
  static async getPanelists(interviewId: string): Promise<InterviewPanelist[]> {
    try {
      const { data, error } = await supabase
        .from('interview_panel')
        .select('*')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as InterviewPanelist[];
    } catch (error) {
      console.error('Error fetching panelists:', error);
      throw error;
    }
  }

  // --- New robust CRUD for interview_panelists table ---
  static async getPanelistsV2(interviewId: string): Promise<InterviewPanelistV2[]> {
    try {
      const { data, error } = await supabase
        .from('interview_panelists')
        .select('*')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as InterviewPanelistV2[];
    } catch (error) {
      console.error('Error fetching panelists V2:', error);
      throw error;
    }
  }

  static async addPanelistV2(interviewId: string, panelist: Omit<InterviewPanelistV2, 'id' | 'created_at' | 'updated_at' | 'interview_id'>): Promise<InterviewPanelistV2> {
    try {
      // Remove id if present in the panelist object
      const { id, ...panelistWithoutId } = panelist as any;
      const { data, error } = await supabase
        .from('interview_panelists')
        .insert([{ ...panelistWithoutId, interview_id: interviewId }])
        .select()
        .single();
      if (error) throw error;
      return data as InterviewPanelistV2;
    } catch (error) {
      console.error('Error adding panelist V2:', error);
      throw error;
    }
  }

  static async updatePanelistV2(panelistId: string, updates: Partial<Omit<InterviewPanelistV2, 'id' | 'created_at' | 'updated_at'>>): Promise<InterviewPanelistV2> {
    try {
      const { data, error } = await supabase
        .from('interview_panelists')
        .update(updates)
        .eq('id', panelistId)
        .select()
        .single();
      if (error) throw error;
      return data as InterviewPanelistV2;
    } catch (error) {
      console.error('Error updating panelist V2:', error);
      throw error;
    }
  }

  static async deletePanelistV2(panelistId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('interview_panelists')
        .delete()
        .eq('id', panelistId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting panelist V2:', error);
      throw error;
    }
  }

  // --- Update interview fetching to include panelists ---
  static async getInterviewScheduleWithPanel(interviewId: string): Promise<InterviewSchedule | null> {
    try {
      const { data, error } = await supabase
        .from('interview_schedules')
        .select('*, interview_panel(*)')
        .eq('id', interviewId)
        .single();
      if (error) throw error;
      if (!data) return null;
      const schedule: InterviewSchedule = {
        ...data,
        panelists: data.interview_panel || [],
      };
      return schedule;
    } catch (error) {
      console.error('Error fetching interview schedule with panel:', error);
      throw error;
    }
  }

  // --- Fetch interview schedule + panel by application_id (for application-centric flows) ---
  static async getInterviewScheduleWithPanelByApplicationId(applicationId: string): Promise<InterviewSchedule | null> {
    try {
      const { data, error } = await supabase
        .from('interview_schedules')
        .select('*, interview_panel(*)')
        .eq('application_id', applicationId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const schedule: InterviewSchedule = {
        ...data,
        panelists: data && data.interview_panel ? data.interview_panel : [],
      };
      return schedule;
    } catch (error) {
      console.error('Error fetching interview schedule with panel by applicationId:', error);
      throw error;
    }
  }
} 