// ─── User & Auth ────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  created_at: string;
  updated_at?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  user_id: string;
  bio?: string;
  avatar_url?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  target_role_id?: string;
  target_role?: Role;
  experience_level?: "beginner" | "intermediate" | "advanced" | "expert";
  years_of_experience?: number;
  current_role?: string;
  location?: string;
  skills: UserSkill[];
  mobile_number?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── Skills ─────────────────────────────────────────────────
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description?: string;
  icon?: string;
}

export interface UserSkill {
  skill_id: string;
  skill: Skill;
  proficiency: ProficiencyLevel;
}

export type SkillCategory =
  | "frontend"
  | "backend"
  | "database"
  | "devops"
  | "mobile"
  | "ml_ai"
  | "design"
  | "soft_skills"
  | "cloud"
  | "security"
  | "data"
  | "other";

export type ProficiencyLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export interface SkillUpdatePayload {
  skills: Array<{
    skill_id: string;
    proficiency: ProficiencyLevel;
  }>;
}

// ─── Roles ──────────────────────────────────────────────────
export interface Role {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string;
  avg_salary_min?: number;
  avg_salary_max?: number;
  demand_level?: "low" | "medium" | "high" | "very_high";
}

export interface RoleSkill {
  skill_id: string;
  skill: Skill;
  importance: "required" | "preferred" | "nice_to_have";
  min_proficiency: ProficiencyLevel;
}

export interface RoleDetail extends Role {
  required_skills: RoleSkill[];
  career_paths: CareerPath[];
}

// ─── Projects ───────────────────────────────────────────────
export interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_hours: number;
  tech_stack: string[];
  category?: string;
  github_url?: string;
  demo_url?: string;
  career_match_percent?: number;
  skills_covered: Skill[];
  created_at: string;
  updated_at?: string;
}

export interface ProjectSkill {
  skill_id: string;
  skill: Skill;
  relevance: number;
}

export interface ProjectSubmission {
  project_id: string;
  github_url: string;
  demo_url?: string;
  description?: string;
}

export interface ProjectAnalysis {
  id: string;
  project_id: string;
  github_url: string;
  problem_clarity: number;
  technical_complexity: number;
  career_relevance: number;
  portfolio_grade: "A" | "B" | "C" | "D" | "F";
  missing_improvements: string[];
  upgrade_suggestions: UpgradeSuggestion[];
  summary?: string;
  reasoning?: string;
  analyzed_at: string;
}

export interface UpgradeSuggestion {
  feature_name: string;
  description: string;
  career_impact_score: number;
  estimated_hours: number;
  companies_that_value: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface ProjectFilters {
  difficulty?: string;
  tech_stack?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Career ─────────────────────────────────────────────────
export interface CareerPath {
  id: string;
  from_role_id?: string;
  to_role_id: string;
  to_role: Role;
  estimated_months: number;
  description?: string;
}

export interface SkillGapAnalysis {
  target_role: Role;
  current_skills: UserSkill[];
  missing_skills: MissingSkill[];
  completion_percent: number;
  estimated_months: number;
}

export interface MissingSkill {
  skill: Skill;
  required_proficiency: ProficiencyLevel;
  current_proficiency?: ProficiencyLevel;
  priority: "high" | "medium" | "low";
  learning_resources?: LearningResource[];
}

export interface LearningResource {
  title: string;
  url: string;
  type: "course" | "tutorial" | "book" | "project" | "documentation";
  estimated_hours: number;
  provider?: string;
}

export interface RoadmapResult {
  skill_gap: SkillGapAnalysis;
  recommended_projects: Project[];
  learning_path: LearningPathStep[];
  mentors?: Mentor[];
}

export interface LearningPathStep {
  order: number;
  title: string;
  description: string;
  skills: Skill[];
  estimated_weeks: number;
  resources: LearningResource[];
}

// ─── Mentors ────────────────────────────────────────────────
export interface Mentor {
  id: string;
  user_id: string;
  name: string;
  mentor_name?: string;
  email?: string;
  mobile_number?: string;
  bio: string;
  avatar_url?: string;
  expertise: string[];
  rating: number;
  total_sessions: number;
  total_reviews: number;
  hourly_rate: number;
  currency: string;
  availability: MentorAvailability[];
  is_active: boolean;
  match_score?: number;
  match_reasoning?: string;
  created_at: string;

  // Verification and Agreement
  company_name?: string;
  verification_status: "pending" | "verified" | "rejected" | "suspended";
  linkedin_url?: string;
  github_url?: string;
  corporate_email?: string;
  corporate_email_verified?: boolean;
  selfie_url?: string;
  identity_document_url?: string;
  signed_agreement?: boolean;
  signature_svg_or_text?: string;
  verified_at?: string;
  rejected_at?: string;
  reviewed_count?: number;
  review_earnings?: number;
  experience_years?: number;
  mentor_id?: string;
  original_price?: number;
  has_premium_subscription?: boolean;
}

export interface ApplyMentorPayload {
  bio: string;
  hourly_rate: number;
  expertise: string[];
  linkedin_url: string;
  github_url?: string;
  corporate_email?: string;
  selfie_base64?: string;
  identity_document_base64?: string;
  signed_agreement: boolean;
  signature_svg_or_text?: string;
  availability: Array<{ day_of_week: number; start_time: string; end_time: string }>;
}

export interface MentorAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface MentorSession {
  id: string;
  mentor_id: string;
  mentor?: Mentor;
  mentor_name?: string;
  mentee_id: string;
  project_id?: string;
  project?: Project;
  scheduled_at: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  meeting_url?: string;
  price: number;
  amount_cents: number;
  review?: Review;
  is_reviewed?: boolean;
  created_at: string;
}

export interface BookSessionPayload {
  mentor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  project_id?: string;
  notes?: string;
}

export interface Review {
  id: string;
  session_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewPayload {
  session_id: string;
  rating: number;
  comment: string;
}

export interface MentorFilters {
  expertise?: string;
  min_rating?: number;
  max_rate?: number;
  min_rate?: number;
  availability_day?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MentorMatch {
  mentor: Mentor;
  match_score: number;
  reasoning: string;
}

export interface MentorReport {
  id: string;
  mentor_id: string;
  student_id: string;
  reason: string;
  status: "pending" | "resolved";
  created_at: string;
  mentor_name?: string;
  student_name?: string;
}

// ─── API Common ─────────────────────────────────────────────
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface CVAnalysis {
  ats_score: number;
  target_role: string;
  missing_keywords: string[];
  formatting_issues: string[];
  rejection_risks: string[];
  actionable_recommendations: string[];
  parsed_skills: string[];
  parsed_education: string[];
  parsed_experience: string[];
}
