import { supabase } from './Superbase';
import { Course, Module, Lesson, CourseFeedback } from '../types/courses';

export interface CreateCourseData {
  title: string;
  description?: string;
  image?: string;
  categories?: any;
  prerequisites?: string;
  objectives?: any;
  modules?: any;
  resources?: any;
  status?: 'draft' | 'published';
  enrollmentcount?: number;
  completionrate?: number;
  assessments?: string;
  user_id?: string;
  course_id?: string;
  currency?: string;
  discount?: number;
  final_price?: number;
  is_paid?: boolean;
  level?: string;
  university?: string;
  specialization?: string;
  tags?: string[];
  price?: number;
  instructor?: string;
}

export interface CreateModuleData {
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  duration_hours?: string;
}

export interface CreateLessonData {
  module_id: string;
  title: string;
  content?: string;
  type?: string;
  duration?: number;
  order_index: number;
  discussion_enabled?: boolean;
  key_elements_content?: any;
  summary_checklist?: any;
  reflective_prompt?: string;
}

class CourseService {
  async createCourse(data: CreateCourseData): Promise<Course | null> {
    try {
      console.log('CourseService.createCourse called with data:', data);
      
      const { data: course, error } = await supabase
        .from('courses')
        .insert([data])
        .select()
        .single();

      console.log('Supabase response:', { course, error });

      if (error) throw error;
      return course;
    } catch (error) {
      console.error('Error creating course:', error);
      return null;
    }
  }

  async getCourses(userId?: string, status?: string): Promise<Course[]> {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: courses, error } = await query;

      if (error) throw error;
      return courses || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  async getCourseById(id: string): Promise<Course | null> {
    try {
      const { data: course, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return course;
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
    }
  }

  async updateCourse(id: string, data: Partial<CreateCourseData>): Promise<Course | null> {
    try {
      const { data: course, error } = await supabase
        .from('courses')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return course;
    } catch (error) {
      console.error('Error updating course:', error);
      return null;
    }
  }

  async createModule(data: CreateModuleData): Promise<Module | null> {
    try {
      const { data: module, error } = await supabase
        .from('modules')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return module;
    } catch (error) {
      console.error('Error creating module:', error);
      return null;
    }
  }

  async createLesson(data: CreateLessonData): Promise<Lesson | null> {
    try {
      const { data: lesson, error } = await supabase
        .from('lessons')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return lesson;
    } catch (error) {
      console.error('Error creating lesson:', error);
      return null;
    }
  }

  async publishCourse(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'published' })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error publishing course:', error);
      return false;
    }
  }
}

export const courseService = new CourseService();
