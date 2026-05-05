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
}

// Project types
export interface Project {
  id: string
  name: string
  description: string
  icon: string
  color: string
  target_gender: 'male' | 'female' | 'both'
  created_by: string
  created_at: string
  updated_at: string
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

export interface QuestionOption {
  id: string
  text: string
  points: number
  sub_options?: QuestionOption[]
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