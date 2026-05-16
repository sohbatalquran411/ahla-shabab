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
  visibility?: 'public' | 'private'
  is_archived?: boolean
  original_project_id?: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectInvite {
  id: string
  project_id: string
  token: string
  max_uses: number
  use_count: number
  expires_at: string | null
  created_by: string
  created_at: string
}

export interface UserProject {
  id: string
  user_id: string
  project_id: string
  expires_at?: string | null
  created_at: string
}

export interface ProjectSupervisor {
  id: string
  project_id: string
  user_id: string
  created_by: string
  created_at: string
  profiles?: { name: string; email: string }
}

export interface ProjectBan {
  id: string
  project_id: string
  user_id: string
  created_by: string
  created_at: string
  profiles?: { name: string; email: string }
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body?: string
  type: string
  link?: string
  is_read: boolean
  created_at: string
}

// Curriculum types
export type LessonType = 'video' | 'audio' | 'text'

export interface Curriculum {
  id: string
  project_id: string
  title: string
  description?: string
  is_sequential?: boolean
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
  type: LessonType
  youtube_url?: string
  audio_url?: string
  content?: string
  allow_comments?: boolean
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

export interface LessonComment {
  id: string
  lesson_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: {
    name: string
  }
}

// Form types
export type QuestionType = 
  | 'text'
  | 'textarea'
  | 'single_choice'
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
  counter_target?: number | null
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
  has_counter?: boolean
}

export interface Form {
  id: string
  project_id: string
  name: string
  description: string
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

// Notification types
export type NotificationType = 'assignment' | 'info'

export interface NotificationPreference {
  id: string
  user_id: string
  notification_type: NotificationType
  enabled: boolean
  created_at: string
}

// Dashboard stats
export interface DashboardStats {
  total_users: number
  total_projects: number
  total_forms: number
  pending_approvals: number
  average_score: number
}

