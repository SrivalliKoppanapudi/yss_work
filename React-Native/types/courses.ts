export interface CourseSettings {
  visibility: 'public' | 'private' | 'invitation';
  is_paid: boolean;
  price: number;
  currency: string;
  subscription_type: 'one-time' | 'monthly' | 'yearly';
  subscription_price: number;
  scheduled_release: boolean;
  release_date: string | null;
  module_release_schedule: { module_id: string; release_date: string }[];
  access_restrictions: 'all' | 'specific-roles' | 'specific-users';
  allowed_roles: string[];
  allowed_users: string[];
  notify_on_enrollment: boolean;
  notify_on_completion: boolean;
  notify_on_assessment_submission: boolean;
  is_archived: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  categories?: any;
  prerequisites?: string;
  objectives?: any;
  modules?: any;
  resources?: any;
  status: 'draft' | 'published';
  created_at?: string;
  image?: string;
  enrollmentcount?: number;
  completionrate?: number;
  assessments?: string;
  user_id?: string;
  updated_at?: string;
  course_id?: string;
  currency?: string;
  discount?: number;
  final_price?: number;
  is_paid?: boolean;
  price?: number;
  flexibleDuration?: string;
  instructor?: string;
  institution?: string;
  rating?: number;
  duration?: string;
  level?: string;
  university?: string;
  specialization?: string;
  tags?: string[];
  thumbnail_url?: string | null;     
  includes: CourseInclusion[]; 
  course_settings?: CourseSettings | CourseSettings[] | null;
}

export interface CourseInclusion {
  id: string;
  iconName: string; 
  text: string;
}

export interface Resource {
  id: string;
  type: 'pdf' | 'presentation' | 'link' | 'video';
  title: string;
  url: string;
  resource_id?: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'assignment' | 'survey';
  questions?: Question[];
  dueDate?: Date;
  totalPoints: number;
  module_id?: string;
}

export interface Question {
  id: number;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
}

export interface Module {
  id: string;
  course_id?: string;
  title: string;
  lessons: Lesson[];
  moduleId?: string; 
  description?: string;
  order?: number;
  resources?: Resource[];
  durationHours?: string; 
  assessments?: Assessment[];
  discussion_enabled?: boolean;
}

export interface KeyElementsContentSection {
  title: string;
  points: string[];
  example?: string;
  exampleExplanation?: string;
}

export interface SummaryChecklistItem {
  element: string;
  lookFor: string;
  tryThis: string;
}

export interface Lesson {
  id: number | string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'pdf' | 'quiz' | 'forum' | 'key_elements_article' | string;
  duration: number;
  order_index: number;
  resources: Resource[];
  moduleId: string;
  module_id?: string;
  discussionEnabled: boolean;
  keyElementsContent?: {
    sections: KeyElementsContentSection[];
  };
  summaryChecklist?: SummaryChecklistItem[];
  reflectivePrompt?: string;
  completed?: boolean;
}

export interface CourseFeedback {
  id: string;
  course_id: string;
  user_id?: string;
  rating: number;
  content_rating: number;
  teaching_rating: number;
  difficulty_rating: number;
  feedback_text: string;
  content_feedback?: string;
  teaching_feedback?: string;
  overall_feedback?: string;
  anonymous?: boolean;
  is_anonymous?: boolean;
  created_at: string;
}

export interface FeedbackAnalytics {
  average_rating: number;
  content_rating: number;
  teaching_rating: number;
  difficulty_rating: number;
  total_feedback: number;
  anonymous_count: number;
  common_themes: string[];
  sentiment_analysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recent_feedback: CourseFeedback[];
}