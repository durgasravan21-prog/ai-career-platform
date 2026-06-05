import type {
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  User,
  UserProfile,
  Skill,
  SkillUpdatePayload,
  Role,
  RoleDetail,
  RoadmapResult,
  Project,
  ProjectSubmission,
  ProjectAnalysis,
  ProjectFilters,
  Mentor,
  MentorFilters,
  MentorMatch,
  MentorSession,
  BookSessionPayload,
  Review,
  ReviewPayload,
  PaginatedResponse,
  ApiError,
  CVAnalysis,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ─── Core fetch wrapper ─────────────────────────────────────
class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  private setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  private removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  private normalizeProject(project: any): Project {
    if (!project) return project;
    let flatTech: string[] = [];
    if (Array.isArray(project.tech_stack)) {
      flatTech = project.tech_stack;
    } else if (project.tech_stack && typeof project.tech_stack === "object") {
      flatTech = Object.values(project.tech_stack)
        .filter(Array.isArray)
        .flat() as string[];
    }
    return {
      ...project,
      tech_stack: flatTech,
    };
  }

  async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.removeToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
      throw {
        message: "Session expired. Please log in again.",
        status: 401,
      } as ApiError;
    }

    if (!response.ok) {
      let errorBody: Record<string, any> = {};
      try {
        errorBody = await response.json();
      } catch {
        // ignore parse errors
      }

      let errorMessage = `Request failed with status ${response.status}`;
      if (errorBody.detail) {
        if (typeof errorBody.detail === "string") {
          errorMessage = errorBody.detail;
        } else if (Array.isArray(errorBody.detail)) {
          errorMessage = errorBody.detail
            .map((err: any) => {
              const loc = err.loc ? err.loc.join(".") : "";
              return `${loc ? loc + ": " : ""}${err.msg || JSON.stringify(err)}`;
            })
            .join(", ");
        } else if (typeof errorBody.detail === "object") {
          errorMessage = JSON.stringify(errorBody.detail);
        }
      } else if (errorBody.message && typeof errorBody.message === "string") {
        errorMessage = errorBody.message;
      }

      throw {
        message: errorMessage,
        status: response.status,
        errors: errorBody.errors,
      } as ApiError;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // ─── Auth ───────────────────────────────────────────────────
  auth = {
    register: async (payload: RegisterPayload): Promise<AuthResponse> => {
      const response = await this.fetchApi<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      this.setToken(response.access_token);
      return response;
    },

    login: async (payload: LoginPayload): Promise<AuthResponse> => {
      const response = await this.fetchApi<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      this.setToken(response.access_token);
      return response;
    },

    sendOtp: async (email: string): Promise<{ debug_otp: string; message: string }> => {
      return this.fetchApi<{ debug_otp: string; message: string }>("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    verifyOtp: async (email: string, otp: string, name?: string): Promise<AuthResponse> => {
      const response = await this.fetchApi<AuthResponse>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp, name }),
      });
      this.setToken(response.access_token);
      return response;
    },

    getMe: async (): Promise<User> => {
      return this.fetchApi<User>("/auth/me");
    },

    logout: (): void => {
      this.removeToken();
    },
  };

  // ─── User ──────────────────────────────────────────────────
  user = {
    getProfile: async (): Promise<UserProfile> => {
      return this.fetchApi<UserProfile>("/users/profile");
    },

    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
      return this.fetchApi<UserProfile>("/users/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    updateSkills: async (payload: SkillUpdatePayload): Promise<UserProfile> => {
      return this.fetchApi<UserProfile>("/users/skills", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },

    getSkills: async (): Promise<Skill[]> => {
      return this.fetchApi<Skill[]>("/skills");
    },

    analyzeCV: async (file: File): Promise<CVAnalysis> => {
      const formData = new FormData();
      formData.append("file", file);
      return this.fetchApi<CVAnalysis>("/users/analyze-cv", {
        method: "POST",
        body: formData,
      });
    },
  };

  // ─── Career ─────────────────────────────────────────────────
  career = {
    getRoles: async (): Promise<Role[]> => {
      return this.fetchApi<Role[]>("/roles");
    },

    getRoleDetails: async (id: string): Promise<RoleDetail> => {
      return this.fetchApi<RoleDetail>(`/roles/${id}`);
    },

    generateRoadmap: async (targetRoleId: string): Promise<RoadmapResult> => {
      const res = await this.fetchApi<RoadmapResult>("/career/roadmap", {
        method: "POST",
        body: JSON.stringify({ target_role_id: targetRoleId }),
      });
      if (res.recommended_projects) {
        res.recommended_projects = res.recommended_projects.map(p => this.normalizeProject(p));
      }
      return res;
    },

    getSkillGap: async (): Promise<RoadmapResult> => {
      const res = await this.fetchApi<RoadmapResult>("/career/skill-gap");
      if (res.recommended_projects) {
        res.recommended_projects = res.recommended_projects.map(p => this.normalizeProject(p));
      }
      return res;
    },
  };

  // ─── Projects ───────────────────────────────────────────────
  projects = {
    getAll: async (
      filters?: ProjectFilters
    ): Promise<PaginatedResponse<Project>> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "" && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const query = params.toString();
      const res = await this.fetchApi<{ projects: Project[]; total: number }>(
        `/projects${query ? `?${query}` : ""}`
      );
      const limit = filters?.limit || 12;
      const page = filters?.page || 1;
      return {
        data: (res.projects || []).map(p => this.normalizeProject(p)),
        total: res.total || 0,
        page,
        limit,
        total_pages: Math.ceil((res.total || 0) / limit) || 1,
      };
    },

    getById: async (id: string): Promise<Project> => {
      const res = await this.fetchApi<Project>(`/projects/${id}`);
      return this.normalizeProject(res);
    },

    getRecommendations: async (): Promise<Project[]> => {
      const recs = await this.fetchApi<Array<{ project: Project; relevance_score: number; reason: string }>>("/projects/recommendations");
      return recs.map(r => ({
        ...this.normalizeProject(r.project),
        career_match_percent: r.relevance_score,
      }));
    },

    submit: async (data: ProjectSubmission): Promise<ProjectAnalysis> => {
      return this.fetchApi<ProjectAnalysis>("/projects/submit", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    analyzeGithub: async (
      projectId: string,
      githubUrl: string
    ): Promise<ProjectAnalysis> => {
      return this.fetchApi<ProjectAnalysis>(
        `/projects/${projectId}/analyze`,
        {
          method: "POST",
          body: JSON.stringify({ github_url: githubUrl }),
        }
      );
    },

    getAnalysis: async (id: string): Promise<ProjectAnalysis> => {
      return this.fetchApi<ProjectAnalysis>(`/projects/${id}/analysis`);
    },
  };

  // ─── Mentors ────────────────────────────────────────────────
  mentors = {
    getAll: async (
      filters?: MentorFilters
    ): Promise<PaginatedResponse<Mentor>> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "" && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const query = params.toString();
      const res = await this.fetchApi<Mentor[] | PaginatedResponse<Mentor>>(
        `/mentors${query ? `?${query}` : ""}`
      );
      if (Array.isArray(res)) {
        return {
          data: res,
          total: res.length,
          page: 1,
          limit: res.length,
          total_pages: 1,
        };
      }
      return res;
    },

    getById: async (id: string): Promise<Mentor> => {
      return this.fetchApi<Mentor>(`/mentors/${id}`);
    },

    match: async (): Promise<MentorMatch[]> => {
      return this.fetchApi<MentorMatch[]>("/mentors/match", {
        method: "POST",
      });
    },

    bookSession: async (data: BookSessionPayload): Promise<MentorSession> => {
      return this.fetchApi<MentorSession>("/mentors/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    getMySessions: async (): Promise<MentorSession[]> => {
      return this.fetchApi<MentorSession[]>("/mentors/sessions/me");
    },

    submitReview: async (data: ReviewPayload): Promise<Review> => {
      return this.fetchApi<Review>("/mentors/reviews", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  };
}

export const api = new ApiClient();
