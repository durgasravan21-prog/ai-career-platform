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
  MentorReport,
  BookSessionPayload,
  Review,
  ReviewPayload,
  PaginatedResponse,
  ApiError,
  CVAnalysis,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://durga-career-ai.loca.lt/api/v1";

const MOCK_PROJECTS = [
  { id: 1, title: "E-Commerce Cloud Architecture", description: "Design a highly available microservices platform.", difficulty: "Advanced", tech_stack: ["AWS", "Kubernetes", "Docker", "Terraform"], estimated_hours: 40, career_relevance_score: 95.0 },
  { id: 2, title: "Real-time Chat Application", description: "Build a real-time messaging application with WebSockets.", difficulty: "Intermediate", tech_stack: ["React", "Node.js", "Express", "Socket.io"], estimated_hours: 25, career_relevance_score: 85.0 },
  { id: 3, title: "Machine Learning Pipeline", description: "Train and deploy a regression model to predict housing prices.", difficulty: "Beginner", tech_stack: ["Python", "Pandas", "Scikit-Learn", "Flask"], estimated_hours: 15, career_relevance_score: 75.0 },
  { id: 4, title: "DevOps CI/CD Pipeline Integration", description: "Automate code testing and deployment using GitHub Actions.", difficulty: "Intermediate", tech_stack: ["Docker", "GitHub Actions", "Shell", "AWS"], estimated_hours: 20, career_relevance_score: 90.0 },
  { id: 5, title: "Android Task Planner", description: "Develop a native task management app with offline sync.", difficulty: "Intermediate", tech_stack: ["Kotlin", "Android SDK", "Room", "SQLite"], estimated_hours: 30, career_relevance_score: 80.0 },
  { id: 6, title: "Decentralized Finance Portal", description: "Build a Web3 dashboard connecting to smart contracts.", difficulty: "Advanced", tech_stack: ["React", "Solidity", "Ethers.js", "Hardhat"], estimated_hours: 45, career_relevance_score: 88.0 },
  { id: 7, title: "Portfolio Website Template", description: "Create a modern, responsive developer portfolio using Next.js.", difficulty: "Beginner", tech_stack: ["Next.js", "React", "Tailwind CSS"], estimated_hours: 10, career_relevance_score: 65.0 },
  { id: 8, title: "Image Classification App", description: "Deploy a deep learning model to classify objects in photos.", difficulty: "Advanced", tech_stack: ["Python", "PyTorch", "FastAPI", "React"], estimated_hours: 35, career_relevance_score: 92.0 },
  { id: 9, title: "Social Media API Backend", description: "Implement a RESTful API with authentication, posts, and likes.", difficulty: "Intermediate", tech_stack: ["Node.js", "TypeScript", "PostgreSQL", "Prisma"], estimated_hours: 25, career_relevance_score: 82.0 },
  { id: 10, title: "Serverless Analytics Dashboard", description: "Collect and display real-time event analytics using serverless.", difficulty: "Advanced", tech_stack: ["AWS Lambda", "Python", "DynamoDB", "React"], estimated_hours: 30, career_relevance_score: 89.0 }
];

const MOCK_MENTORS = [
  {
    id: "1",
    user_id: "1",
    mentor_name: "Sarah Chen",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    bio: "Senior Frontend Architect with 8+ years of experience. Ex-Google, Ex-Netflix. Passionate about building premium, highly accessible user interfaces with React and Next.js.",
    expertise: ["Frontend", "React", "Next.js", "TypeScript", "UI/UX", "Tailwind CSS"],
    rating: 4.9,
    total_sessions: 142,
    total_reviews: 94,
    hourly_rate: 75.0,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 8,
    availability: [
      { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 3, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 5, start_time: "09:00", end_time: "14:00" }
    ]
  },
  {
    id: "2",
    user_id: "2",
    mentor_name: "Marcus Johnson",
    name: "Marcus Johnson",
    email: "marcus.johnson@example.com",
    bio: "Cloud Systems & Backend Principal Engineer with 12+ years of experience. AWS Certified Solution Architect. Specialist in Kubernetes scaling, PostgreSQL optimization, and Go microservices.",
    expertise: ["Backend", "Node.js", "Go", "AWS", "Kubernetes", "Docker", "PostgreSQL", "DevOps"],
    rating: 4.8,
    total_sessions: 218,
    total_reviews: 148,
    hourly_rate: 95.0,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 12,
    availability: [
      { day_of_week: 2, start_time: "10:00", end_time: "18:00" },
      { day_of_week: 4, start_time: "10:00", end_time: "18:00" }
    ]
  },
  {
    id: "3",
    user_id: "3",
    mentor_name: "Dr. Priya Patel",
    name: "Dr. Priya Patel",
    email: "priya.patel@example.com",
    bio: "AI Research Lead and Machine Learning consultant with 15+ years of experience. Expert in deep learning models, natural language processing (NLP), PyTorch pipelines, and predictive analytics.",
    expertise: ["AI/ML", "Python", "PyTorch", "TensorFlow", "Data Science", "Pandas", "Scikit-Learn"],
    rating: 5.0,
    total_sessions: 89,
    total_reviews: 67,
    hourly_rate: 110.0,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 15,
    availability: [
      { day_of_week: 3, start_time: "14:00", end_time: "20:00" },
      { day_of_week: 6, start_time: "09:00", end_time: "13:00" }
    ]
  },
  {
    id: "4",
    user_id: "4",
    mentor_name: "Durga sravan Challagolla",
    name: "Durga sravan Challagolla",
    email: "challagollasridevi@gmail.com",
    bio: "Full-Stack Engineer with 5+ years of experience. Focuses on full-stack web applications, database architecture, and project-based student mentoring.",
    expertise: ["Full-Stack", "React", "Node.js", "Python", "SQL", "JavaScript"],
    rating: 4.7,
    total_sessions: 12,
    total_reviews: 8,
    hourly_rate: 0.0,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 5,
    availability: [
      { day_of_week: 0, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 6, start_time: "09:00", end_time: "17:00" }
    ]
  },
  {
    id: "5",
    user_id: "5",
    mentor_name: "Alex Rivera",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    bio: "Principal DevOps & Site Reliability Engineer with 9+ years of experience. Ex-AWS, Ex-HashiCorp. Expert in infrastructure as code, CI/CD pipelines, Docker, Kubernetes, and terraform architectures.",
    expertise: ["DevOps", "Kubernetes", "Docker", "Terraform", "AWS", "CI/CD"],
    rating: 4.8,
    total_sessions: 64,
    total_reviews: 42,
    hourly_rate: 85.0,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 9,
    availability: [
      { day_of_week: 1, start_time: "13:00", end_time: "18:00" },
      { day_of_week: 4, start_time: "13:00", end_time: "18:00" }
    ]
  },
  {
    id: "6",
    user_id: "6",
    mentor_name: "Yuki Tanaka",
    name: "Yuki Tanaka",
    email: "yuki.tanaka@example.com",
    bio: "Senior Mobile Developer specializing in React Native, Swift, and Android SDK with 7+ years of experience. Ex-Sony, Ex-Uber. Let's build slick, highly-responsive applications.",
    expertise: ["Mobile", "React Native", "Swift", "Kotlin", "Android SDK", "iOS"],
    rating: 4.9,
    total_sessions: 31,
    total_reviews: 20,
    hourly_rate: 70.0,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 7,
    availability: [
      { day_of_week: 2, start_time: "09:00", end_time: "15:00" },
      { day_of_week: 5, start_time: "09:00", end_time: "15:00" }
    ]
  },
  {
    id: "7",
    user_id: "7",
    mentor_name: "Emily Watson",
    name: "Emily Watson",
    email: "emily.watson@example.com",
    bio: "Lead Data Scientist and Analytics consultant with 10+ years of experience. Ex-Spotify, Ex-Airbnb. Specializes in PostgreSQL dashboards, pandas analytics, data visualization, and ML models.",
    expertise: ["Data Science", "Python", "Pandas", "PostgreSQL", "Data Visualization", "SQL"],
    rating: 4.7,
    total_sessions: 95,
    total_reviews: 73,
    hourly_rate: 90.0,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 10,
    availability: [
      { day_of_week: 3, start_time: "10:00", end_time: "17:00" },
      { day_of_week: 6, start_time: "10:00", end_time: "14:00" }
    ]
  },
  {
    id: "8",
    user_id: "8",
    mentor_name: "Carlos Mendez",
    name: "Carlos Mendez",
    email: "carlos.mendez@example.com",
    bio: "Lead Cybersecurity Architect with 11+ years of experience. Specialist in application security, web penetration testing, secure backend coding, and cloud security configurations.",
    expertise: ["Cybersecurity", "Backend", "Node.js", "Python", "Cloud Security", "SQL"],
    rating: 5.0,
    total_sessions: 48,
    total_reviews: 35,
    hourly_rate: 105.0,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 11,
    availability: [
      { day_of_week: 4, start_time: "14:00", end_time: "20:00" },
      { day_of_week: 0, start_time: "09:00", end_time: "14:00" }
    ]
  }
];

const seedLocalStorage = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("mock_initialized")) {
    localStorage.setItem("mock_initialized", "true");
    
    const users = [
      { id: "1", email: "sarah.chen@example.com", name: "Sarah Chen", role: "mentor" },
      { id: "2", email: "marcus.johnson@example.com", name: "Marcus Johnson", role: "mentor" },
      { id: "3", email: "priya.patel@example.com", name: "Dr. Priya Patel", role: "mentor" },
      { id: "4", email: "challagollasridevi@gmail.com", name: "Durga sravan Challagolla", role: "mentor" },
      { id: "5", email: "alex.rivera@example.com", name: "Alex Rivera", role: "mentor" },
      { id: "6", email: "yuki.tanaka@example.com", name: "Yuki Tanaka", role: "mentor" },
      { id: "7", email: "emily.watson@example.com", name: "Emily Watson", role: "mentor" },
      { id: "8", email: "carlos.mendez@example.com", name: "Carlos Mendez", role: "mentor" }
    ];
    localStorage.setItem("mock_users", JSON.stringify(users));
    localStorage.setItem("mock_mentors", JSON.stringify(MOCK_MENTORS));

    const roles = [
      { id: 1, title: "Full-Stack Developer", description: "Builds both frontend and backend systems." },
      { id: 2, title: "Frontend Developer", description: "Specializes in user interfaces and browser logic." },
      { id: 3, title: "Backend Developer", description: "Designs servers, APIs, and databases." },
      { id: 4, title: "DevOps Engineer", description: "Automates deployments and manages infrastructure." },
      { id: 5, title: "ML Engineer", description: "Designs and trains machine learning models." },
      { id: 6, title: "Data Scientist", description: "Analyzes complex data to extract insights." },
      { id: 7, title: "Mobile Developer", description: "Builds native iOS and Android apps." },
      { id: 8, title: "Cloud Architect", description: "Designs large-scale cloud systems." }
    ];
    localStorage.setItem("mock_roles", JSON.stringify(roles));
    localStorage.setItem("mock_projects", JSON.stringify(MOCK_PROJECTS));
    
    localStorage.setItem("mock_sessions", JSON.stringify([]));
    localStorage.setItem("mock_reports", JSON.stringify([]));
  }
};

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
      "Bypass-Tunnel-Reminder": "true",
      ...(options.headers || {}),
    };

    // Use mock client if we are on Vercel and no production backend url is set
    const isVercel = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");
    if (isVercel && (!process.env.NEXT_PUBLIC_API_URL || API_URL.includes("localhost") || API_URL.includes("loca.lt"))) {
      return this.handleMockCall<T>(endpoint, options);
    }

    try {
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
    } catch (err: any) {
      // Fall back to mock client if backend server is not running or fails to respond
      if (typeof window !== "undefined" && (!err.status || err.status >= 500 || err.message === "Failed to fetch")) {
        console.warn("API server unreachable. Falling back to local Client Database.");
        return this.handleMockCall<T>(endpoint, options);
      }
      throw err;
    }
  }

  private handleMockCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    seedLocalStorage();

    const body = options.body ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body) : {};
    const method = options.method || "GET";

    const dummyUrl = new URL(endpoint, "http://localhost");
    const path = dummyUrl.pathname;
    const query = dummyUrl.searchParams;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
          const mockMentors = JSON.parse(localStorage.getItem("mock_mentors") || "[]");
          const mockSessions = JSON.parse(localStorage.getItem("mock_sessions") || "[]");
          const mockReports = JSON.parse(localStorage.getItem("mock_reports") || "[]");
          const mockProjects = JSON.parse(localStorage.getItem("mock_projects") || "[]");
          const mockRoles = JSON.parse(localStorage.getItem("mock_roles") || "[]");
          
          let currentUser = JSON.parse(localStorage.getItem("mock_current_user") || "null");

          // ─── AUTH ───
          if (path === "/auth/otp/send") {
            const email = body.email || "";
            const otpCode = String(Math.floor(100000 + Math.random() * 900000));
            sessionStorage.setItem(`otp_${email.toLowerCase()}`, otpCode);
            resolve({
              message: `OTP successfully sent to ${email} (client-side mock)`,
              debug_otp: otpCode
            } as any);
            return;
          }

          if (path === "/auth/otp/verify") {
            const email = body.email.toLowerCase();
            const otp = body.otp;
            const name = body.name || email.split("@")[0];
            const role = body.role || "student";
            const companyName = body.company_name;

            const storedOtp = sessionStorage.getItem(`otp_${email}`);
            if (otp !== "123456" && otp !== storedOtp) {
              reject({ message: "Invalid or expired OTP code", status: 400 });
              return;
            }

            let user = mockUsers.find((u: any) => u.email.toLowerCase() === email);
            if (!user) {
              user = { id: String(mockUsers.length + 1), email, name, role };
              mockUsers.push(user);
              localStorage.setItem("mock_users", JSON.stringify(mockUsers));
            }

            if (role === "mentor" && !mockMentors.find((m: any) => m.email === email)) {
              const newMentor = {
                id: String(mockMentors.length + 1),
                user_id: user.id,
                mentor_name: name,
                name,
                email,
                bio: `Professional Mentor with expertise in ${companyName || 'Technology'}.`,
                expertise: ["Full-Stack", "JavaScript", "Software Architecture"],
                rating: 5.0,
                total_sessions: 0,
                total_reviews: 0,
                hourly_rate: 0.0,
                currency: "USD",
                is_active: true,
                verification_status: "verified",
                company_name: companyName,
                availability: [
                  { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
                  { day_of_week: 3, start_time: "09:00", end_time: "17:00" }
                ]
              };
              mockMentors.push(newMentor);
              localStorage.setItem("mock_mentors", JSON.stringify(mockMentors));
            }

            localStorage.setItem("mock_current_user", JSON.stringify(user));
            this.setToken("mock-jwt-token-xyz");

            resolve({
              access_token: "mock-jwt-token-xyz",
              token_type: "bearer",
              user
            } as any);
            return;
          }

          if (path === "/auth/me") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }
            resolve(currentUser as any);
            return;
          }

          // ─── USER PROFILE ───
          if (path === "/users/profile") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }

            let profile = JSON.parse(localStorage.getItem(`mock_profile_${currentUser.id}`) || "null");
            if (!profile) {
              profile = {
                id: currentUser.id,
                user_id: currentUser.id,
                bio: currentUser.role === "mentor" ? "Expert mentor ready to help." : "Determined student learning software development.",
                current_role: currentUser.role === "mentor" ? "Senior Lead Engineer" : "Student",
                years_of_experience: currentUser.role === "mentor" ? 8 : 0,
                location: "San Francisco, CA",
                linkedin_url: "",
                portfolio_url: "",
                mobile_number: currentUser.mobile_number || ""
              };
              localStorage.setItem(`mock_profile_${currentUser.id}`, JSON.stringify(profile));
            }

            if (method === "PUT") {
              const updatedProfile = { ...profile, ...body };
              localStorage.setItem(`mock_profile_${currentUser.id}`, JSON.stringify(updatedProfile));
              if (body.name && body.name !== currentUser.name) {
                currentUser.name = body.name;
                localStorage.setItem("mock_current_user", JSON.stringify(currentUser));
                const userIdx = mockUsers.findIndex((u: any) => u.id === currentUser.id);
                if (userIdx > -1) {
                  mockUsers[userIdx].name = body.name;
                  localStorage.setItem("mock_users", JSON.stringify(mockUsers));
                }
              }
              resolve(updatedProfile as any);
              return;
            }

            resolve(profile as any);
            return;
          }

          if (path === "/users/skills" && method === "PUT") {
            localStorage.setItem(`mock_skills_${currentUser.id}`, JSON.stringify(body.skills));
            resolve({ message: "Skills updated successfully" } as any);
            return;
          }

          if (path === "/users/analyze-cv") {
            resolve({
              target_role: "Software Developer",
              ats_score: 75,
              matched_keywords: ["React", "JavaScript", "HTML", "CSS"],
              missing_keywords: ["Docker", "Kubernetes", "AWS", "SQL"],
              rejection_risks: [
                "No cloud or DevOps technologies mentioned. Modern standard profiles require containerization experience.",
                "Missing standard databases (e.g. PostgreSQL, SQL). Technical filters will reject profiles without backend database exposure."
              ],
              formatting_issues: [
                "No links to GitHub or LinkedIn portfolios found. Modern tech recruiters audit portfolios directly.",
                "Professional summary section is missing from the header block."
              ],
              actionable_recommendations: [
                "WHAT TO CHANGE: In your past jobs list, change the project descriptions. Instead of just listing tasks, write down the results you achieved, like: 'Built server using Node.js and PostgreSQL which made the website load 40% faster'.",
                "WHERE TO CHANGE: Scroll to the very top of your CV (first page header) and put your clickable GitHub and LinkedIn links under your name.",
                "WHAT TO ADD: Go to your 'Skills' section and add these missing key words: 'Docker', 'Kubernetes', 'AWS', and 'SQL'.",
                "ADDITIONAL THINGS TO ADD: Create a new section at the top called 'Professional Summary' (right below your name) and write 3 simple lines explaining your experience level, main skills, and your target role as a software developer."
              ]
            } as any);
            return;
          }

          // ─── ROLES & ROADMAPS ───
          if (path === "/roles") {
            resolve(mockRoles as any);
            return;
          }

          if (path === "/career/roadmap") {
            resolve({
              target_role: "Full-Stack Developer",
              completion_percentage: 45.0,
              skill_gap_analysis: {
                matching_skills: ["React", "CSS", "HTML"],
                missing_skills: [
                  { skill: "Node.js", priority: "High", proficiency_needed: "Intermediate" },
                  { skill: "Docker", priority: "Medium", proficiency_needed: "Beginner" },
                  { skill: "PostgreSQL", priority: "High", proficiency_needed: "Intermediate" }
                ],
                learning_suggestions: [
                  "Build simple CRUD servers in Node.js",
                  "Containerize your database using Docker"
                ]
              }
            } as any);
            return;
          }

          // ─── PROJECTS ───
          if (path === "/projects") {
            let filtered = [...mockProjects];
            
            // Search filter
            const search = query.get("search");
            if (search) {
              const s = search.toLowerCase();
              filtered = filtered.filter((p: any) => 
                p.title.toLowerCase().includes(s) || 
                p.description.toLowerCase().includes(s) ||
                (p.tech_stack || []).some((t: string) => t.toLowerCase().includes(s))
              );
            }

            // Difficulty filter
            const difficulty = query.get("difficulty");
            if (difficulty && difficulty !== "all") {
              filtered = filtered.filter((p: any) => p.difficulty.toLowerCase() === difficulty.toLowerCase());
            }

            // Tech Stack filter
            const tech = query.get("tech_stack");
            if (tech) {
              filtered = filtered.filter((p: any) => (p.tech_stack || []).some((t: string) => t.toLowerCase() === tech.toLowerCase()));
            }

            // Shuffle/randomize to make sure it loads differently on every refresh
            filtered.sort(() => Math.random() - 0.5);

            // Pagination
            const pageNum = parseInt(query.get("page") || "1");
            const limitNum = parseInt(query.get("limit") || "12");
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = startIndex + limitNum;
            const paginated = filtered.slice(startIndex, endIndex);

            resolve({
              projects: paginated,
              total: filtered.length
            } as any);
            return;
          }

          if (path === "/projects/recommendations") {
            const shuffled = [...mockProjects];
            shuffled.sort(() => Math.random() - 0.5);

            const recommendations = shuffled.slice(0, 3).map(p => {
              const relevance = Math.floor(65 + Math.random() * 30);
              return {
                project: p,
                relevance_score: relevance,
                reason: `This project is a high match for your current learning path and teaches missing tech stack keywords: ${p.tech_stack.slice(0, 2).join(", ")}.`
              };
            });
            resolve(recommendations as any);
            return;
          }

          if (path.startsWith("/projects/")) {
            const parts = path.split("/");
            const projectId = parseInt(parts[2]);

            if (path.endsWith("/analyze")) {
              resolve({
                problem_clarity: 8,
                technical_complexity: 7,
                career_relevance: 90,
                portfolio_grade: "A",
                missing_improvements: [
                  "Ensure environment variables are loaded securely from dotenv rather than hardcoded.",
                  "Add unit test suites to verify server controller endpoints."
                ],
                upgrade_suggestions: [
                  { feature_name: "Docker Containerization", impact_score: 95, estimated_hours: 4, companies_valuing: ["Google", "Stripe"] },
                  { feature_name: "Redis Session Caching", impact_score: 85, estimated_hours: 6, companies_valuing: ["Uber", "Meta"] }
                ]
              } as any);
              return;
            }

            const p = mockProjects.find((x: any) => x.id === projectId);
            if (p) {
              resolve(p as any);
            } else {
              reject({ message: "Project not found", status: 404 });
            }
            return;
          }

          // ─── MENTORS ───
          if (path === "/mentors") {
            let randomizedMentors = mockMentors.map((m: any) => {
              const variance = (Math.random() * 0.4) - 0.2;
              const newRating = Math.max(4.0, Math.min(5.0, m.rating + variance));
              const finalRating = Math.round(newRating * 10) / 10;
              return {
                ...m,
                rating: finalRating,
                total_sessions: m.total_sessions + (Math.random() > 0.5 ? 1 : 0)
              };
            });

            randomizedMentors.sort(() => Math.random() - 0.5);
            resolve(randomizedMentors as any);
            return;
          }

          if (path === "/mentors/application-status") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }
            const m = mockMentors.find((x: any) => String(x.user_id) === String(currentUser.id));
            if (m) {
              resolve(m as any);
            } else {
              reject({ message: "Mentor application not found", status: 404 });
            }
            return;
          }

          if (path === "/mentors/match") {
            const matches = mockMentors.map((m: any) => {
              const score = Math.floor(78 + Math.random() * 21);
              return {
                mentor: m,
                match_score: score,
                reasoning: `Highly compatible. Expert guidance in ${m.expertise.slice(0, 2).join(" and ")} matches your dream role roadmap.`
              };
            });
            matches.sort((a: any, b: any) => b.match_score - a.match_score);
            resolve(matches as any);
            return;
          }

          if (path === "/mentors/sessions" && method === "POST") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }

            const unreviewed = mockSessions.find(
              (s: any) => s.student_id === currentUser.id && s.status === "completed" && !s.is_reviewed
            );
            if (unreviewed) {
              const coachName = unreviewed.mentor_name || "Expert Coach";
              reject({
                message: `Mandatory Feedback Required: You must submit a review for your completed session with Coach ${coachName} before booking a new session.`,
                status: 400
              });
              return;
            }

            const mentor = mockMentors.find((m: any) => m.id === String(body.mentor_id));
            const newSession = {
              id: mockSessions.length + 1,
              student_id: currentUser.id,
              mentor_id: body.mentor_id,
              project_id: body.project_id || null,
              scheduled_at: body.scheduled_at,
              duration_minutes: body.duration_minutes || 60,
              status: mentor && mentor.hourly_rate === 0 ? "confirmed" : "pending",
              amount_cents: mentor ? Math.floor(mentor.hourly_rate * 100) : 0,
              mentor_name: mentor ? mentor.name : "Coach",
              is_reviewed: false,
              created_at: new Date().toISOString()
            };

            mockSessions.push(newSession);
            localStorage.setItem("mock_sessions", JSON.stringify(mockSessions));
            resolve(newSession as any);
            return;
          }

          if (path === "/mentors/sessions/me") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }

            const userSessions = mockSessions.filter(
              (s: any) => s.student_id === currentUser.id || String(s.mentor_id) === String(currentUser.id)
            );
            resolve(userSessions as any);
            return;
          }

          if (path === "/mentors/reviews" && method === "POST") {
            const sessionId = body.session_id;
            const ratingVal = body.rating;
            const commentVal = body.comment;

            const session = mockSessions.find((s: any) => s.id === sessionId);
            if (!session) {
              reject({ message: "Session not found", status: 404 });
              return;
            }

            session.is_reviewed = true;
            session.status = "completed";
            localStorage.setItem("mock_sessions", JSON.stringify(mockSessions));

            const mentor = mockMentors.find((m: any) => m.id === String(session.mentor_id));
            if (mentor) {
              mentor.total_reviews = (mentor.total_reviews || 0) + 1;
              mentor.total_sessions = (mentor.total_sessions || 0) + 1;
              mentor.rating = Math.round(((mentor.rating * (mentor.total_sessions - 1) + ratingVal) / mentor.total_sessions) * 10) / 10;
              localStorage.setItem("mock_mentors", JSON.stringify(mockMentors));
            }

            resolve({
              id: Math.floor(Math.random() * 1000),
              session_id: sessionId,
              rating: ratingVal,
              comment: commentVal,
              created_at: new Date().toISOString()
            } as any);
            return;
          }

          if (path.startsWith("/mentors/") && path.endsWith("/report") && method === "POST") {
            const parts = path.split("/");
            const mentorId = parts[2];
            const mentorObj = mockMentors.find((m: any) => m.id === mentorId);

            const newReport = {
              id: String(mockReports.length + 1),
              mentor_id: mentorId,
              student_id: currentUser ? currentUser.id : "1",
              reason: body.reason,
              status: "pending",
              created_at: new Date().toISOString(),
              mentor_name: mentorObj ? mentorObj.name : `Coach #${mentorId}`,
              student_name: currentUser ? currentUser.name : "Student",
              mentor_email: mentorObj ? mentorObj.email : `coach@example.com`
            };

            mockReports.push(newReport);
            localStorage.setItem("mock_reports", JSON.stringify(mockReports));
            resolve(newReport as any);
            return;
          }

          // ─── ADMIN ───
          if (path === "/admin/reports") {
            resolve(mockReports as any);
            return;
          }

          if (path.startsWith("/admin/reports/") && path.endsWith("/resolve") && method === "POST") {
            const parts = path.split("/");
            const reportId = parts[3];
            const report = mockReports.find((r: any) => r.id === reportId);
            if (report) {
              report.status = "resolved";
              localStorage.setItem("mock_reports", JSON.stringify(mockReports));
              resolve(report as any);
            } else {
              reject({ message: "Report not found", status: 404 });
            }
            return;
          }

          if (path.startsWith("/mentors/") && path.endsWith("/admin-approve") && method === "POST") {
            const parts = path.split("/");
            const mentorId = parts[2];
            const approveStatus = body.status;

            const mentor = mockMentors.find((m: any) => m.id === mentorId);
            if (mentor) {
              mentor.verification_status = approveStatus;
              if (approveStatus === "suspended" || approveStatus === "rejected") {
                mentor.is_active = false;
              } else {
                mentor.is_active = true;
              }
              localStorage.setItem("mock_mentors", JSON.stringify(mockMentors));
              resolve(mentor as any);
            } else {
              reject({ message: "Mentor not found", status: 404 });
            }
            return;
          }

          if (path === "/admin/mentors/pending") {
            const pending = mockMentors.filter((m: any) => m.verification_status === "pending");
            resolve(pending as any);
            return;
          }

          if (path.startsWith("/mentors/sessions/") && path.endsWith("/status") && method === "POST") {
            const parts = path.split("/");
            const sessionId = parseInt(parts[3]);
            const newStatus = body.status;

            const session = mockSessions.find((s: any) => s.id === sessionId);
            if (session) {
              session.status = newStatus;
              localStorage.setItem("mock_sessions", JSON.stringify(mockSessions));
              resolve(session as any);
            } else {
              reject({ message: "Session not found", status: 404 });
            }
            return;
          }

          reject({ message: `Mock handler not implemented for endpoint ${endpoint} (path: ${path})`, status: 404 });
        } catch (e: any) {
          reject({ message: e.message || "Mock engine error", status: 500 });
        }
      }, 400);
    });
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

    verifyOtp: async (email: string, otp: string, name?: string, role?: string, companyName?: string): Promise<AuthResponse> => {
      const response = await this.fetchApi<AuthResponse>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp, name, role, company_name: companyName }),
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

    create: async (payload: any): Promise<Project> => {
      const res = await this.fetchApi<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return this.normalizeProject(res);
    },

    getPendingSubmissions: async (): Promise<any[]> => {
      return this.fetchApi<any[]>("/projects/submissions/pending");
    },

    reviewSubmission: async (
      userProjectId: string | number,
      score: number,
      feedback: string
    ): Promise<any> => {
      return this.fetchApi<any>(`/projects/submissions/${userProjectId}/review`, {
        method: "POST",
        body: JSON.stringify({
          review_score: score,
          review_feedback: feedback,
        }),
      });
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

    match: async (body: any = {}): Promise<MentorMatch[]> => {
      return this.fetchApi<MentorMatch[]>("/mentors/match", {
        method: "POST",
        body: JSON.stringify(body),
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

    apply: async (data: any): Promise<Mentor> => {
      return this.fetchApi<Mentor>("/mentors/apply", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    verifyCorporate: async (email: string, token: string): Promise<{ message: string }> => {
      return this.fetchApi<{ message: string }>("/mentors/verify-corporate", {
        method: "POST",
        body: JSON.stringify({ email, token }),
      });
    },

    getAppStatus: async (): Promise<Mentor> => {
      return this.fetchApi<Mentor>("/mentors/application-status");
    },

    adminApprove: async (mentorId: string, status: string): Promise<Mentor> => {
      return this.fetchApi<Mentor>(`/mentors/${mentorId}/admin-approve`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
    },

    getPendingMentors: async (): Promise<Mentor[]> => {
      return this.fetchApi<Mentor[]>("/admin/mentors/pending");
    },

    updateSessionStatus: async (sessionId: string, status: string): Promise<MentorSession> => {
      return this.fetchApi<MentorSession>(`/mentors/sessions/${sessionId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
    },

    reportMentor: async (mentorId: string, reason: string): Promise<MentorReport> => {
      return this.fetchApi<MentorReport>(`/mentors/${mentorId}/report`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },

    getReports: async (): Promise<MentorReport[]> => {
      return this.fetchApi<MentorReport[]>("/admin/reports");
    },

    resolveReport: async (reportId: string): Promise<MentorReport> => {
      return this.fetchApi<MentorReport>(`/admin/reports/${reportId}/resolve`, {
        method: "POST",
      });
    },
  };
}

export const api = new ApiClient();
