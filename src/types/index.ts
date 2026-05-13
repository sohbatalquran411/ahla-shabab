// User types
export type UserRole = 'volunteer' | 'supervisor' | 'admin'
export type Gender = 'male' | 'female'
export type AccountStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  phone: string
  name: string
  gender: Gender
  role: UserRole
  status: AccountStatus
  avatar_url?: string
  created_at: string
  updated_at: string
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
  allow_multiple?: boolean
}

// Project types
export interface ProjectModules {
  forms?: boolean
  curriculum?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  icon: string
  color: string
  target_gender: 'male' | 'female' | 'both'
  image_url?: string | null
  modules?: ProjectModules
  created_by: string
  created_at: string
  updated_at: string
}

// Curriculum types
export interface Curriculum {
  id: string
  project_id: string
  title: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  curriculum_id: string
  title: string
  description?: string
  youtube_url: string
  order_index: number
  created_by: string
  created_at: string
  updated_at: string
  progress?: LessonProgress
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at?: string
  created_at: string
}

// Form types
export type QuestionType = 
  | 'text'
  | 'textarea'
  | 'single_choice'
  | 'single_choice_with_counter'
  | 'multiple_choice'
  | 'scale'
  | 'ranking'
  | 'matrix'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'file_upload'

export interface QuestionOption {
  id: string
  text: string
  points: number
  sub_options?: QuestionOption[]
  max_count?: number
}

export interface Question {
  id: string
  form_id: string
  text: string
  type: QuestionType
  order: number
  required: boolean
  points: number
  options?: QuestionOption[]
}

export interface Form {
  id: string
  project_id: string
  name: string
  description: string
  target_gender: 'male' | 'female' | 'both'
  created_by: string
  created_at: string
  updated_at: string
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
  allow_multiple?: boolean
  questions?: Question[]
}

// Response types
export interface FormResponse {
  id: string
  form_id: string
  user_id: string
  score: number
  max_score: number
  submitted_at: string
}

// Dashboard stats
export interface DashboardStats {
  total_users: number
  total_projects: number
  total_forms: number
  pending_approvals: number
  average_score: number
}

