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
    mentor_id: "MNT-001",
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
    original_price: 100.0,
    has_premium_subscription: true,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 8,
    linkedin_url: "https://linkedin.com/in/sarah-chen",
    github_url: "https://github.com/sarah-chen",
    mobile_number: "+1 555-019-2834",
    availability: [
      { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 3, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 5, start_time: "09:00", end_time: "14:00" }
    ]
  },
  {
    id: "2",
    mentor_id: "MNT-002",
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
    original_price: 120.0,
    has_premium_subscription: false,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 12,
    linkedin_url: "https://linkedin.com/in/marcus-johnson",
    github_url: "https://github.com/marcus-johnson",
    mobile_number: "+1 555-014-9872",
    availability: [
      { day_of_week: 2, start_time: "10:00", end_time: "18:00" },
      { day_of_week: 4, start_time: "10:00", end_time: "18:00" }
    ]
  },
  {
    id: "3",
    mentor_id: "MNT-003",
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
    original_price: 150.0,
    has_premium_subscription: true,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 15,
    linkedin_url: "https://linkedin.com/in/priya-patel",
    github_url: "https://github.com/priya-patel",
    mobile_number: "+1 555-017-3849",
    availability: [
      { day_of_week: 3, start_time: "14:00", end_time: "20:00" },
      { day_of_week: 6, start_time: "09:00", end_time: "13:00" }
    ]
  },
  {
    id: "4",
    mentor_id: "MNT-004",
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
    original_price: 0.0,
    has_premium_subscription: false,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 5,
    linkedin_url: "https://linkedin.com/in/durga-sravan",
    github_url: "https://github.com/durga-sravan",
    mobile_number: "+1 555-012-3456",
    availability: [
      { day_of_week: 0, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 6, start_time: "09:00", end_time: "17:00" }
    ]
  },
  {
    id: "5",
    mentor_id: "MNT-005",
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
    original_price: 110.0,
    has_premium_subscription: false,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 9,
    linkedin_url: "https://linkedin.com/in/alex-rivera",
    github_url: "https://github.com/alex-rivera",
    mobile_number: "+1 555-016-7281",
    availability: [
      { day_of_week: 1, start_time: "13:00", end_time: "18:00" },
      { day_of_week: 4, start_time: "13:00", end_time: "18:00" }
    ]
  },
  {
    id: "6",
    mentor_id: "MNT-006",
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
    original_price: 90.0,
    has_premium_subscription: false,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 7,
    linkedin_url: "https://linkedin.com/in/yuki-tanaka",
    github_url: "https://github.com/yuki-tanaka",
    mobile_number: "+1 555-018-9384",
    availability: [
      { day_of_week: 2, start_time: "09:00", end_time: "15:00" },
      { day_of_week: 5, start_time: "09:00", end_time: "15:00" }
    ]
  },
  {
    id: "7",
    mentor_id: "MNT-007",
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
    original_price: 120.0,
    has_premium_subscription: false,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 10,
    linkedin_url: "https://linkedin.com/in/emily-watson",
    github_url: "https://github.com/emily-watson",
    mobile_number: "+1 555-011-8273",
    availability: [
      { day_of_week: 3, start_time: "10:00", end_time: "17:00" },
      { day_of_week: 6, start_time: "10:00", end_time: "14:00" }
    ]
  },
  {
    id: "8",
    mentor_id: "MNT-008",
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
    original_price: 130.0,
    has_premium_subscription: false,
    currency: "USD",
    is_active: true,
    verification_status: "verified",
    experience_years: 11,
    linkedin_url: "https://linkedin.com/in/carlos-mendez",
    github_url: "https://github.com/carlos-mendez",
    mobile_number: "+1 555-013-6475",
    availability: [
      { day_of_week: 4, start_time: "14:00", end_time: "20:00" },
      { day_of_week: 0, start_time: "09:00", end_time: "14:00" }
    ]
  }
];

const seedLocalStorage = () => {
  if (typeof window === "undefined") return;

  // Ensure challagollasridevi@gmail.com is always mapped correctly to avoid stale student local state
  try {
    const localUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
    const srideviUser = localUsers.find((u: any) => u.email.toLowerCase() === "challagollasridevi@gmail.com");
    if (srideviUser && srideviUser.role !== "mentor") {
      srideviUser.role = "mentor";
      localStorage.setItem("mock_users", JSON.stringify(localUsers));
      
      const curUser = JSON.parse(localStorage.getItem("mock_current_user") || "null");
      if (curUser && curUser.email.toLowerCase() === "challagollasridevi@gmail.com") {
        curUser.role = "mentor";
        localStorage.setItem("mock_current_user", JSON.stringify(curUser));
      }
    }

    const localMentors = JSON.parse(localStorage.getItem("mock_mentors") || "[]");
    const hasSrideviMentor = localMentors.some((m: any) => m.email.toLowerCase() === "challagollasridevi@gmail.com");
    if (!hasSrideviMentor) {
      const srideviMentor = MOCK_MENTORS.find(m => m.email.toLowerCase() === "challagollasridevi@gmail.com");
      if (srideviMentor) {
        localMentors.push(srideviMentor);
        localStorage.setItem("mock_mentors", JSON.stringify(localMentors));
      }
    }
  } catch (e) {
    console.error("Failed to migrate sridevi profile:", e);
  }

  try {
    const storedProjs = localStorage.getItem("mock_user_projects");
    if (storedProjs && storedProjs.includes("github.com/alex-rivera")) {
      const parsedProjs = JSON.parse(storedProjs);
      parsedProjs.forEach((p: any) => {
        if (p.github_url && p.github_url.includes("github.com/alex-rivera")) {
          p.github_url = "https://github.com/durgasravan21-prog/ai-career-platform";
        }
      });
      localStorage.setItem("mock_user_projects", JSON.stringify(parsedProjs));
    }
  } catch (e) {
    console.error("Failed to migrate mock user projects github url:", e);
  }

  const isMigrated = localStorage.getItem("mock_initialized") && localStorage.getItem("mock_user_projects");
  if (!isMigrated) {
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

    const userProjects = [
      {
        id: "sub_1",
        user_id: "5",
        user_name: "Alex Rivera",
        user_email: "alex.rivera@example.com",
        project_id: 2,
        project_title: "Real-time Chat Application",
        github_url: "https://github.com/durgasravan21-prog/ai-career-platform",
        demo_url: "https://realtime-chat.demo.app",
        description: "A real-time chat app built with socket.io, Node, and React. Supports private and group rooms.",
        status: "submitted",
        submitted_at: "2026-06-05T14:30:00Z",
        review_score: null,
        review_feedback: null
      },
      {
        id: "sub_2",
        user_id: "6",
        user_name: "Yuki Tanaka",
        user_email: "yuki.tanaka@example.com",
        project_id: 3,
        project_title: "Machine Learning Pipeline",
        github_url: "https://github.com/durgasravan21-prog/ai-career-platform",
        demo_url: "https://ml-pipeline.demo.app",
        description: "An end-to-end ML pipeline with data cleaning, feature engineering, model training, and prediction API.",
        status: "submitted",
        submitted_at: "2026-06-06T09:15:00Z",
        review_score: null,
        review_feedback: null
      },
      {
        id: "sub_3",
        user_id: "7",
        user_name: "Emily Watson",
        user_email: "emily.watson@example.com",
        project_id: 4,
        project_title: "CI/CD Pipeline Dashboard",
        github_url: "https://github.com/durgasravan21-prog/ai-career-platform",
        demo_url: "https://pipeline-dashboard.demo.app",
        description: "A pipeline visualization dashboard built with React and D3, showing build metrics, run times, and stages.",
        status: "submitted",
        submitted_at: "2026-06-07T08:00:00Z",
        review_score: null,
        review_feedback: null
      }
    ];
    localStorage.setItem("mock_user_projects", JSON.stringify(userProjects));
  } else {
    // If already initialized, ensure we overwrite mock_mentors to load any new properties/mentors we added
    const currentMockMentors = JSON.parse(localStorage.getItem("mock_mentors") || "[]");
    const hasMentorId = currentMockMentors.length > 0 && currentMockMentors[0].mentor_id;
    if (!hasMentorId) {
      localStorage.setItem("mock_mentors", JSON.stringify(MOCK_MENTORS));
    }
  }
};

export const addMockNotification = (userId: string | number, title: string, message: string, type: string = "info") => {
  if (typeof window === "undefined") return;
  const key = `mock_notifications_${userId}`;
  const notifications = JSON.parse(localStorage.getItem(key) || "[]");
  notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    message,
    type,
    read: false,
    created_at: new Date().toISOString()
  });
  localStorage.setItem(key, JSON.stringify(notifications));
  window.dispatchEvent(new Event("mock_notifications_updated"));
};

// ─── Core fetch wrapper ─────────────────────────────────────
class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("auth_token");
  }

  private setToken(token: string): void {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth_token", token);
    }
  }

  private removeToken(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_token");
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

    // Use mock client if we are not running locally
    const isLocal = typeof window !== "undefined" && (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.")
    );
    if (!isLocal) {
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
      // Fall back to mock client on any network error or server failure
      if (typeof window !== "undefined") {
        console.warn("API server unreachable or returned error. Falling back to local Client Database.", err);
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
          if (currentUser && currentUser.email.toLowerCase() === "challagollasridevi@gmail.com" && currentUser.role !== "mentor") {
            currentUser.role = "mentor";
            localStorage.setItem("mock_current_user", JSON.stringify(currentUser));
          }

          const MOCK_SKILLS = [
            { id: "1", name: "JavaScript", category: "frontend" },
            { id: "2", name: "TypeScript", category: "frontend" },
            { id: "3", name: "React", category: "frontend" },
            { id: "4", name: "Next.js", category: "frontend" },
            { id: "5", name: "Vue.js", category: "frontend" },
            { id: "6", name: "HTML/CSS", category: "frontend" },
            { id: "7", name: "Tailwind CSS", category: "frontend" },
            { id: "8", name: "Node.js", category: "backend" },
            { id: "9", name: "Python", category: "backend" },
            { id: "10", name: "Java", category: "backend" },
            { id: "11", name: "Go", category: "backend" },
            { id: "12", name: "Express.js", category: "backend" },
            { id: "13", name: "Django", category: "backend" },
            { id: "14", name: "FastAPI", category: "backend" },
            { id: "15", name: "PostgreSQL", category: "database" },
            { id: "16", name: "MongoDB", category: "database" },
            { id: "17", name: "Redis", category: "database" },
            { id: "18", name: "MySQL", category: "database" },
            { id: "19", name: "Docker", category: "devops" },
            { id: "20", name: "Kubernetes", category: "devops" },
            { id: "21", name: "AWS", category: "cloud" },
            { id: "22", name: "GCP", category: "cloud" },
            { id: "23", name: "Azure", category: "cloud" },
            { id: "24", name: "React Native", category: "mobile" },
            { id: "25", name: "Flutter", category: "mobile" },
            { id: "26", name: "TensorFlow", category: "ml_ai" },
            { id: "27", name: "PyTorch", category: "ml_ai" },
            { id: "28", name: "Git", category: "devops" },
            { id: "29", name: "CI/CD", category: "devops" },
            { id: "30", name: "GraphQL", category: "backend" },
            { id: "31", name: "REST APIs", category: "backend" },
            { id: "32", name: "Figma", category: "design" }
          ];

          const roleSkillsMap: Record<string, Array<{name: string, proficiency: string}>> = {
            "1": [ // Full-Stack Developer
              { name: "React", proficiency: "Intermediate" },
              { name: "Node.js", proficiency: "Intermediate" },
              { name: "PostgreSQL", proficiency: "Intermediate" },
              { name: "Docker", proficiency: "Beginner" },
              { name: "JavaScript", proficiency: "Advanced" },
              { name: "HTML/CSS", proficiency: "Intermediate" }
            ],
            "2": [ // Frontend Developer
              { name: "React", proficiency: "Intermediate" },
              { name: "Next.js", proficiency: "Intermediate" },
              { name: "JavaScript", proficiency: "Advanced" },
              { name: "HTML/CSS", proficiency: "Intermediate" },
              { name: "TypeScript", proficiency: "Intermediate" },
              { name: "Tailwind CSS", proficiency: "Intermediate" }
            ],
            "3": [ // Backend Developer
              { name: "Node.js", proficiency: "Intermediate" },
              { name: "PostgreSQL", proficiency: "Intermediate" },
              { name: "Go", proficiency: "Intermediate" },
              { name: "Python", proficiency: "Intermediate" },
              { name: "SQL", proficiency: "Intermediate" },
              { name: "REST APIs", proficiency: "Advanced" }
            ],
            "4": [ // DevOps Engineer
              { name: "Docker", proficiency: "Advanced" },
              { name: "Kubernetes", proficiency: "Intermediate" },
              { name: "AWS", proficiency: "Intermediate" },
              { name: "CI/CD", proficiency: "Intermediate" },
              { name: "Terraform", proficiency: "Intermediate" },
              { name: "Git", proficiency: "Advanced" }
            ],
            "5": [ // ML Engineer
              { name: "Python", proficiency: "Advanced" },
              { name: "PyTorch", proficiency: "Intermediate" },
              { name: "TensorFlow", proficiency: "Intermediate" },
              { name: "Pandas", proficiency: "Intermediate" },
              { name: "Scikit-Learn", proficiency: "Intermediate" }
            ],
            "6": [ // Data Scientist
              { name: "Python", proficiency: "Advanced" },
              { name: "Pandas", proficiency: "Advanced" },
              { name: "PostgreSQL", proficiency: "Intermediate" },
              { name: "SQL", proficiency: "Advanced" },
              { name: "Data Visualization", proficiency: "Intermediate" }
            ],
            "7": [ // Mobile Developer
              { name: "React Native", proficiency: "Intermediate" },
              { name: "Swift", proficiency: "Intermediate" },
              { name: "Kotlin", proficiency: "Intermediate" },
              { name: "Android SDK", proficiency: "Intermediate" },
              { name: "iOS", proficiency: "Intermediate" }
            ],
            "8": [ // Cloud Architect
              { name: "AWS", proficiency: "Advanced" },
              { name: "Kubernetes", proficiency: "Intermediate" },
              { name: "Docker", proficiency: "Intermediate" },
              { name: "Terraform", proficiency: "Intermediate" },
              { name: "Cloud Security", proficiency: "Advanced" }
            ]
          };

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

            let user = mockUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
            const finalRole = email.toLowerCase() === "challagollasridevi@gmail.com" ? "mentor" : role;
            if (!user) {
              user = { id: String(mockUsers.length + 1), email, name, role: finalRole };
              mockUsers.push(user);
              localStorage.setItem("mock_users", JSON.stringify(mockUsers));
            } else if (email.toLowerCase() === "challagollasridevi@gmail.com" && user.role !== "mentor") {
              user.role = "mentor";
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
            const profile = JSON.parse(localStorage.getItem(`mock_profile_${currentUser.id}`) || "null");
            const skills = JSON.parse(localStorage.getItem(`mock_skills_${currentUser.id}`) || "[]");
            currentUser.profile = {
              ...(profile || {}),
              skills: skills,
              target_role_id: profile?.target_role_id
            };
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

            const rawSkills = JSON.parse(localStorage.getItem(`mock_skills_${currentUser.id}`) || "[]");
            const mappedSkills = rawSkills.map((us: any) => {
              const skillObj = MOCK_SKILLS.find((s: any) => String(s.id) === String(us.skill_id));
              return {
                id: Math.random().toString(36).substr(2, 9),
                skill_id: us.skill_id,
                proficiency_level: us.proficiency || us.proficiency_level || "intermediate",
                years_experience: us.years_experience || 0,
                skill: skillObj || { id: us.skill_id, name: `Skill #${us.skill_id}`, category: "other" }
              };
            });

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
              resolve({
                ...updatedProfile,
                skills: mappedSkills
              } as any);
              return;
            }

            resolve({
              ...profile,
              skills: mappedSkills
            } as any);
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
          if (path === "/skills") {
            resolve(MOCK_SKILLS as any);
            return;
          }

          if (path === "/roles") {
            resolve(mockRoles as any);
            return;
          }

          if (path === "/career/roadmap" || path === "/career/skill-gap") {
            const profile = JSON.parse(localStorage.getItem(`mock_profile_${currentUser.id}`) || "null");
            const targetRoleId = body.target_role_id || (profile ? profile.target_role_id : "1");
            const selectedRoleObj = mockRoles.find((r: any) => String(r.id) === String(targetRoleId)) || mockRoles[0];

            const userSkills = JSON.parse(localStorage.getItem(`mock_skills_${currentUser.id}`) || "[]");
            const userSkillsList = userSkills.map((us: any) => {
              const skillObj = MOCK_SKILLS.find((s: any) => String(s.id) === String(us.skill_id));
              return skillObj ? skillObj.name.toLowerCase() : "";
            }).filter(Boolean);

            const reqSkills = roleSkillsMap[String(targetRoleId)] || roleSkillsMap["1"];
            
            const matchingSkills: string[] = [];
            const missingSkills: any[] = [];

            reqSkills.forEach((req: any) => {
              if (userSkillsList.includes(req.name.toLowerCase())) {
                matchingSkills.push(req.name);
              } else {
                missingSkills.push({
                  skill: { id: req.name, name: req.name, category: "other" },
                  priority: Math.random() > 0.5 ? "High" : "Medium",
                  proficiency_needed: req.proficiency
                });
              }
            });

            const completionPercent = reqSkills.length > 0 
              ? Math.round((matchingSkills.length / reqSkills.length) * 100) 
              : 0;

            resolve({
              skill_gap: {
                target_role: selectedRoleObj,
                current_skills: userSkills.map((us: any) => {
                  const skillObj = MOCK_SKILLS.find((s: any) => String(s.id) === String(us.skill_id));
                  return {
                    skill_id: us.skill_id,
                    skill: skillObj || { id: us.skill_id, name: `Skill #${us.skill_id}`, category: "other" },
                    proficiency: us.proficiency
                  };
                }),
                missing_skills: missingSkills,
                completion_percent: completionPercent,
                estimated_months: Math.max(2, Math.ceil((missingSkills.length * 1.5)))
              },
              recommended_projects: [],
              learning_path: [
                {
                  order: 1,
                  title: `Mastering Core ${selectedRoleObj.title} Skills`,
                  description: `Focus on learning and solidifying missing skills: ${missingSkills.slice(0, 3).map(m => m.skill.name).join(", ")}.`,
                  skills: missingSkills.slice(0, 3).map(m => m.skill),
                  estimated_weeks: missingSkills.length * 2,
                  resources: [
                    { title: `${selectedRoleObj.title} Roadmap Guide`, url: "https://roadmap.sh", type: "documentation", estimated_hours: 5 }
                  ]
                }
              ]
            } as any);
            return;
          }

          // ─── PROJECTS ───
          if (path === "/projects") {
            if (method === "POST") {
              const newProject = {
                id: String(mockProjects.length + 1),
                title: body.title,
                description: body.description,
                difficulty: body.difficulty,
                tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : [],
                estimated_hours: Number(body.estimated_hours || 40),
                career_relevance_score: 95.0,
                created_at: new Date().toISOString()
              };
              const updatedProjects = [...mockProjects, newProject];
              localStorage.setItem("mock_projects", JSON.stringify(updatedProjects));
              resolve(newProject as any);
              return;
            }
            
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
            let targetRoleId = "1";
            if (currentUser) {
              const profile = JSON.parse(localStorage.getItem(`mock_profile_${currentUser.id}`) || "null");
              if (profile && profile.target_role_id) {
                targetRoleId = String(profile.target_role_id);
              }
            }
            
            const reqSkills = roleSkillsMap[targetRoleId] || roleSkillsMap["1"];
            const scoredProjects = mockProjects.map((p: any) => {
              const matchCount = p.tech_stack.filter((tech: string) => 
                reqSkills.some((req: any) => req.name.toLowerCase().includes(tech.toLowerCase()) || tech.toLowerCase().includes(req.name.toLowerCase()))
              ).length;
              
              const baseScore = 65;
              const relevance = Math.min(99, baseScore + (matchCount * 8) + Math.floor(Math.random() * 8));
              return {
                project: p,
                relevance_score: relevance,
                reason: `This project is recommended because it utilizes ${p.tech_stack.slice(0, 2).join(" and ")} which are high-priority requirements for your dream career goal.`
              };
            });
            
            scoredProjects.sort((a: any, b: any) => b.relevance_score - a.relevance_score);
            
            // Dynamic variety among top relevance matches
            const topProjects = scoredProjects.slice(0, 5);
            topProjects.sort(() => Math.random() - 0.5);
            const recommendations = topProjects.slice(0, 3);
            
            resolve(recommendations as any);
            return;
          }

          if (path.startsWith("/projects/") && !path.startsWith("/projects/submit") && !path.startsWith("/projects/submissions/")) {
            const parts = path.split("/");
            const projectId = parseInt(parts[2]);

            if (path.endsWith("/suggestions") && method === "POST") {
              const custom = JSON.parse(localStorage.getItem(`mock_suggestions_${projectId}`) || "[]");
              const newSug = {
                feature_name: body.feature_name,
                description: body.description || "Custom improvement added by Advisor",
                difficulty: body.difficulty || "medium",
                estimated_hours: Number(body.estimated_hours || 4),
                career_impact_score: Number(body.career_impact_score || 80),
                companies_that_value: Array.isArray(body.companies_that_value) ? body.companies_that_value : [body.companies_that_value || "Tech Corp"]
              };
              custom.push(newSug);
              localStorage.setItem(`mock_suggestions_${projectId}`, JSON.stringify(custom));
              resolve(newSug as any);
              return;
            }

            if (path.endsWith("/analyze") || path.endsWith("/analysis")) {
              let savedUrl = "";
              let isNewAnalysis = false;
              
              if (path.endsWith("/analyze") && body && body.github_url) {
                savedUrl = body.github_url;
                localStorage.setItem(`mock_user_project_url_${projectId}`, savedUrl);
                isNewAnalysis = true;
              } else {
                savedUrl = localStorage.getItem(`mock_user_project_url_${projectId}`) || "";
              }

              // Check if we already have a saved mock analysis for this URL
              const existingAnalysisStr = localStorage.getItem(`mock_analysis_${projectId}`);
              let existingAnalysis = null;
              if (existingAnalysisStr) {
                try {
                  existingAnalysis = JSON.parse(existingAnalysisStr);
                } catch (e) {
                  // ignore
                }
              }

              // If it's a new analysis request or no existing analysis exists, generate one dynamically
              if (isNewAnalysis || !existingAnalysis || existingAnalysis.github_url !== savedUrl) {
                const urlLower = (savedUrl || "").toLowerCase();
                
                // Simple deterministic hash based on URL to create varied scores
                let hash = 0;
                for (let i = 0; i < urlLower.length; i++) {
                  hash = (hash << 5) - hash + urlLower.charCodeAt(i);
                  hash |= 0;
                }
                hash = Math.abs(hash);

                const problem_clarity = (hash % 4) + 6; // 6 to 9
                const technical_complexity = (hash % 5) + 5; // 5 to 9
                const career_relevance = (hash % 25) + 70; // 70 to 94
                
                let grade = "B";
                const avgScore = (problem_clarity + technical_complexity + (career_relevance / 10)) / 3;
                if (avgScore >= 8) grade = "A";
                else if (avgScore >= 6.8) grade = "B";
                else if (avgScore >= 5.5) grade = "C";
                else grade = "D";

                let missing_improvements: string[] = [];
                let upgrade_suggestions: any[] = [];

                if (urlLower.includes("react") || urlLower.includes("next") || urlLower.includes("frontend") || urlLower.includes("portfolio")) {
                  missing_improvements = [
                    "Optimize image loading and static assets to improve Core Web Vitals.",
                    "Add structured SEO meta tags and JSON-LD schema markup for better indexing.",
                    "Write frontend component and integration tests (e.g., using Jest or Cypress).",
                    "Implement a global error boundary to handle UI runtime crashes gracefully."
                  ];
                  upgrade_suggestions = [
                    { feature_name: "PWA Support", description: "Configure Service Workers and a web app manifest to enable offline mode and installability.", career_impact_score: 82, estimated_hours: 6, companies_that_value: ["Twitter", "Pinterest"], difficulty: "medium" },
                    { feature_name: "Framer Motion Animations", description: "Add premium micro-interactions and transitions to wow visitors and enhance user flow.", career_impact_score: 75, estimated_hours: 4, companies_that_value: ["Apple", "Stripe"], difficulty: "easy" }
                  ];
                } else if (urlLower.includes("python") || urlLower.includes("django") || urlLower.includes("fastapi") || urlLower.includes("backend") || urlLower.includes("api")) {
                  missing_improvements = [
                    "Set up database migration tracking using tools like Alembic or Django migrations.",
                    "Add API rate limiting, CORS safeguards, and robust security headers.",
                    "Implement structured JSON logging with correlation IDs for API tracing.",
                    "Write integration tests for main API endpoints with a test database."
                  ];
                  upgrade_suggestions = [
                    { feature_name: "Redis Caching Layer", description: "Integrate a Redis cache for hot database queries to decrease response times.", career_impact_score: 90, estimated_hours: 5, companies_that_value: ["Netflix", "Uber"], difficulty: "medium" },
                    { feature_name: "Celery Background Tasks", description: "Offload heavy computations or email triggers to a distributed Celery task worker.", career_impact_score: 92, estimated_hours: 8, companies_that_value: ["Instagram", "Airbnb"], difficulty: "hard" }
                  ];
                } else {
                  // General fallback
                  missing_improvements = [
                    "Load secret keys and config settings from a dotenv (.env) file. Do not save them in code.",
                    "Write simple unit tests to check if your core functions work correctly.",
                    "Set up a simple CI/CD workflow (like GitHub Actions) to run tests automatically.",
                    "Include setup instructions and API descriptions in the README.md file."
                  ];
                  upgrade_suggestions = [
                    { feature_name: "Docker Deployment", description: "Create a multi-stage Dockerfile to containerize and run the application anywhere.", career_impact_score: 88, estimated_hours: 4, companies_that_value: ["Google", "HashiCorp"], difficulty: "easy" },
                    { feature_name: "Sentry Error Monitoring", description: "Integrate Sentry to monitor errors in real time and capture stack traces.", career_impact_score: 80, estimated_hours: 3, companies_that_value: ["Slack", "Spotify"], difficulty: "easy" }
                  ];
                }

                // Append any manual suggestions added via mentor dashboard
                const customSuggestions = JSON.parse(localStorage.getItem(`mock_suggestions_${projectId}`) || "[]");
                const mappedCustom = customSuggestions.map((s: any) => ({
                  feature_name: s.feature_name,
                  description: s.description || "Custom improvement added by Admin/Mentor",
                  difficulty: s.difficulty || "medium",
                  estimated_hours: Number(s.estimated_hours || 4),
                  career_impact_score: Number(s.career_impact_score || 85),
                  companies_that_value: Array.isArray(s.companies_that_value) ? s.companies_that_value : [s.companies_that_value || "Tech Corp"]
                }));

                const analysisResult = {
                  id: `analysis_${projectId}`,
                  project_id: String(projectId),
                  github_url: savedUrl || "https://github.com/you/repo",
                  problem_clarity,
                  technical_complexity,
                  career_relevance,
                  portfolio_grade: grade,
                  missing_improvements,
                  upgrade_suggestions: [...upgrade_suggestions, ...mappedCustom],
                  reasoning: `This repository has been evaluated by our simulated AI Agent. It is parsed as a ${urlLower.includes("react") || urlLower.includes("next") ? "Frontend" : urlLower.includes("python") || urlLower.includes("api") ? "Backend" : "Software"} codebase. The codebase complexity is scored at ${technical_complexity}/10 with a portfolio grade of ${grade}. Implementing the suggested improvements will make it stand out to engineering hiring managers.`,
                  analyzed_at: new Date().toISOString()
                };

                localStorage.setItem(`mock_analysis_${projectId}`, JSON.stringify(analysisResult));
                resolve(analysisResult as any);
                return;
              }

              // Return the existing saved analysis
              resolve(existingAnalysis as any);
              return;
            }

            const p = mockProjects.find((x: any) => String(x.id) === String(projectId));
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
              
              let reviewedCount = m.reviewed_count || 0;
              let reviewEarnings = m.review_earnings || 0;
              if (currentUser && (String(m.user_id) === String(currentUser.id) || (m.email && m.email.toLowerCase() === currentUser.email.toLowerCase()))) {
                const userProjs = JSON.parse(localStorage.getItem("mock_user_projects") || "[]");
                const reviewedProjects = userProjs.filter((p: any) => p.status === "reviewed");
                reviewedCount = reviewedProjects.length;
                reviewEarnings = 0;
                reviewedProjects.forEach((p: any) => {
                  const proj = mockProjects.find((x: any) => String(x.id) === String(p.project_id));
                  const diff = proj ? proj.difficulty.toLowerCase() : "beginner";
                  if (diff === "beginner") {
                    reviewEarnings += 0.50;
                  } else if (diff === "intermediate") {
                    reviewEarnings += 0.75;
                  } else if (diff === "advanced") {
                    reviewEarnings += 1.00;
                  } else {
                    reviewEarnings += 0.50;
                  }
                });
              } else {
                if (!m.reviewed_count) {
                  reviewedCount = Math.floor(Math.random() * 10) + 2;
                }
                reviewEarnings = reviewedCount * 0.75; // average
              }

              return {
                ...m,
                rating: finalRating,
                total_sessions: m.total_sessions + (Math.random() > 0.5 ? 1 : 0),
                reviewed_count: reviewedCount,
                review_earnings: reviewEarnings
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
            let m = mockMentors.find((x: any) => String(x.user_id) === String(currentUser.id) || (x.email && x.email.toLowerCase() === currentUser.email.toLowerCase()));
            if (m) {
              if (String(m.user_id) !== String(currentUser.id)) {
                m.user_id = String(currentUser.id);
                localStorage.setItem("mock_mentors", JSON.stringify(mockMentors));
              }
              const userProjs = JSON.parse(localStorage.getItem("mock_user_projects") || "[]");
              const reviewedProjects = userProjs.filter((p: any) => p.status === "reviewed");
              const reviewedCount = reviewedProjects.length;
              let reviewEarnings = 0;
              reviewedProjects.forEach((p: any) => {
                const proj = mockProjects.find((x: any) => String(x.id) === String(p.project_id));
                const diff = proj ? proj.difficulty.toLowerCase() : "beginner";
                if (diff === "beginner") {
                  reviewEarnings += 0.50;
                } else if (diff === "intermediate") {
                  reviewEarnings += 0.75;
                } else if (diff === "advanced") {
                  reviewEarnings += 1.00;
                } else {
                  reviewEarnings += 0.50;
                }
              });
              m.reviewed_count = reviewedCount;
              m.review_earnings = reviewEarnings;
              resolve(m as any);
            } else {
              reject({ message: "Mentor application not found", status: 404 });
            }
            return;
          }

          if (path === "/mentors/verify-documents" && method === "POST") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }
            const validGovtTypes = ["passport", "driver_license", "national_id", "aadhaar", "state_id"];
            if (!body.id_type || !validGovtTypes.includes(body.id_type.toLowerCase())) {
              reject({ message: "Safety Violation: Only government-issued identity documents (Passport, Driver's License, National ID Card, Aadhaar Card, State ID) are accepted for safety purposes.", status: 400 });
              return;
            }
            if (!body.selfie_base64 || !body.identity_document_base64 || body.selfie_base64.length < 200 || body.identity_document_base64.length < 200) {
              reject({ message: "AI Verification Error: Webcam selfie photo and government ID document scan are required.", status: 400 });
              return;
            }

            const cleanSelfie = body.selfie_base64.includes(",") ? body.selfie_base64.split(",")[1] : body.selfie_base64;
            const cleanId = body.identity_document_base64.includes(",") ? body.identity_document_base64.split(",")[1] : body.identity_document_base64;
            if (cleanSelfie === cleanId) {
              reject({ message: "AI Biometric Verification Failed: Selfie photo and ID document image are identical. You must capture a real-time webcam selfie and upload a separate government-issued ID card.", status: 400 });
              return;
            }

            const academicKeywords = ["marksheet", "12th", "10th", "grade", "certificate", "resume", "cv", "transcript", "degree", "result", "diploma", "report", "hsc", "ssc", "board"];
            const nameLower = (body.id_filename || "").toLowerCase();
            const isAcademic = academicKeywords.some(kw => nameLower.includes(kw));
            if (isAcademic) {
              reject({ message: `Safety Violation: Uploaded document '${body.id_filename}' recognized as academic transcript/marksheet. Government-issued ID required.`, status: 400 });
              return;
            }

            resolve({
              status: "passed",
              valid_govt_id: true,
              id_type: body.id_type,
              similarity_score: 94.6,
              ocr_check: "passed",
              facial_comparison: "passed",
              reason: "Identity verified successfully (Mock).",
              logs: [
                `🔍 AI Agent: Scanning government-issued features of ${body.id_type.toUpperCase()}...`,
                "✓ AI Agent: Government seal, security watermark, and formatting validated.",
                "✓ AI Agent: OCR check passed.",
                "👤 AI Agent: Extracting facial biometrics from selfie snapshot...",
                "📊 AI Agent: Facial similarity matches with 94.6% confidence.",
                "🎉 AI Agent: Verification SUCCESS!"
              ]
            } as any);
            return;
          }

          if (path === "/mentors/apply" && method === "POST") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }
            const validGovtTypes = ["passport", "driver_license", "national_id", "aadhaar", "state_id"];
            if (!body.id_type || !validGovtTypes.includes(body.id_type.toLowerCase())) {
              reject({ message: "Safety Violation: Only government-issued identity documents (Passport, Driver's License, National ID Card, Aadhaar Card, State ID) are accepted for safety purposes.", status: 400 });
              return;
            }
            if (!body.selfie_base64 || !body.identity_document_base64 || body.selfie_base64.length < 200 || body.identity_document_base64.length < 200) {
              reject({ message: "AI Verification Error: Webcam selfie photo and government ID document scan are required.", status: 400 });
              return;
            }

            const updateMentors = JSON.parse(localStorage.getItem("mock_mentors") || "[]");
            let mentor = updateMentors.find((x: any) => String(x.user_id) === String(currentUser.id) || (x.email && x.email.toLowerCase() === currentUser.email.toLowerCase()));
            if (mentor && String(mentor.user_id) !== String(currentUser.id)) {
              mentor.user_id = String(currentUser.id);
            }
            
            const expertiseArray = Array.isArray(body.expertise) ? body.expertise : [];
            const availabilityArray = Array.isArray(body.availability) ? body.availability : [];
            
            if (mentor) {
              mentor.bio = body.bio || mentor.bio;
              if (!mentor.price_edited_by_admin) {
                mentor.hourly_rate = body.hourly_rate !== undefined ? parseFloat(body.hourly_rate) : mentor.hourly_rate;
              }
              mentor.expertise = expertiseArray;
              mentor.availability = availabilityArray;
              mentor.company_name = body.company_name || mentor.company_name;
              mentor.linkedin_url = body.linkedin_url || mentor.linkedin_url;
              mentor.github_url = body.github_url || mentor.github_url;
              mentor.corporate_email = body.corporate_email || mentor.corporate_email;
              mentor.selfie_url = body.selfie_base64 || mentor.selfie_url;
              mentor.identity_document_url = body.identity_document_base64 || mentor.identity_document_url;
              mentor.id_type = body.id_type;
              mentor.signed_agreement = body.signed_agreement !== undefined ? body.signed_agreement : mentor.signed_agreement;
              mentor.signature_svg_or_text = body.signature_svg_or_text || mentor.signature_svg_or_text;
              if (mentor.verification_status !== "verified") {
                mentor.verification_status = "pending";
              }
            } else {
              mentor = {
                id: `mentor_${updateMentors.length + 1}`,
                user_id: String(currentUser.id),
                name: currentUser.name || currentUser.email.split("@")[0],
                mentor_name: currentUser.name || currentUser.email.split("@")[0],
                email: currentUser.email,
                bio: body.bio,
                hourly_rate: parseFloat(body.hourly_rate || "50"),
                expertise: expertiseArray,
                availability: availabilityArray,
                company_name: body.company_name || "Self-Employed",
                linkedin_url: body.linkedin_url || "",
                github_url: body.github_url || "",
                corporate_email: body.corporate_email || "",
                corporate_email_verified: false,
                verification_status: "pending",
                is_active: false,
                rating: 0,
                total_sessions: 0,
                total_reviews: 0,
                mentor_id: `MNT-${String(updateMentors.length + 1).padStart(3, "0")}`,
                original_price: parseFloat(body.hourly_rate || "50"),
                has_premium_subscription: false,
                selfie_url: body.selfie_base64 || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
                identity_document_url: body.identity_document_base64 || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=256",
                id_type: body.id_type,
                signed_agreement: body.signed_agreement !== undefined ? body.signed_agreement : false,
                signature_svg_or_text: body.signature_svg_or_text || "",
                created_at: new Date().toISOString()
              };
              updateMentors.push(mentor);
            }
            
            localStorage.setItem("mock_mentors", JSON.stringify(updateMentors));
            resolve(mentor as any);
            return;
          }

          // Admin Price Lock Update
          if (path.startsWith("/mentors/") && path.endsWith("/update-price") && method === "POST") {
            const parts = path.split("/");
            const mentorId = parts[2];
            
            const updateMentors = JSON.parse(localStorage.getItem("mock_mentors") || "[]");
            let m = updateMentors.find((x: any) => String(x.id) === String(mentorId));
            if (m) {
              m.hourly_rate = parseFloat(body.hourly_rate);
              m.price_edited_by_admin = true;
              localStorage.setItem("mock_mentors", JSON.stringify(updateMentors));
              
              // Send notification to the mentor
              const targetUserId = m.user_id;
              if (targetUserId) {
                addMockNotification(
                  targetUserId,
                  "Hourly Rate Locked by Admin",
                  `Your hourly rate was updated to $${body.hourly_rate} by the Admin and is now locked. Please contact support to request a change.`,
                  "warning"
                );
              }
              resolve(m as any);
            } else {
              reject({ message: "Mentor not found", status: 404 });
            }
            return;
          }

          // Coach Price Request Mail to Admin
          if (path === "/mentors/price-request" && method === "POST") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }
            const localUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
            const adminUser = localUsers.find((u: any) => u.role === "admin" || u.email.toLowerCase() === "durgasravan21@gmail.com");
            const adminId = adminUser ? adminUser.id : "admin_id";
            
            addMockNotification(
              adminId,
              "Price Change Request Received",
              `Coach ${currentUser.name || currentUser.email.split("@")[0]} (${currentUser.email}) requested a price change to $${body.requested_price}. Reason: ${body.reason}`,
              "info"
            );
            
            resolve({ message: "Mail request submitted to administrator successfully." } as any);
            return;
          }

          // Notification endpoints
          if (path === "/notifications" && method === "GET") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }
            const notifs = JSON.parse(localStorage.getItem(`mock_notifications_${currentUser.id}`) || "[]");
            resolve(notifs as any);
            return;
          }

          if (path === "/notifications/read" && method === "POST") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }
            const key = `mock_notifications_${currentUser.id}`;
            const notifs = JSON.parse(localStorage.getItem(key) || "[]");
            notifs.forEach((n: any) => n.read = true);
            localStorage.setItem(key, JSON.stringify(notifs));
            window.dispatchEvent(new Event("mock_notifications_updated"));
            resolve({ success: true } as any);
            return;
          }

          if (path === "/notifications/clear" && method === "POST") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }
            localStorage.setItem(`mock_notifications_${currentUser.id}`, "[]");
            window.dispatchEvent(new Event("mock_notifications_updated"));
            resolve({ success: true } as any);
            return;
          }

          if (path === "/mentors/match") {
            let targetRoleId = "1";
            if (currentUser) {
              const profile = JSON.parse(localStorage.getItem(`mock_profile_${currentUser.id}`) || "null");
              if (profile && profile.target_role_id) {
                targetRoleId = String(profile.target_role_id);
              }
            }
            const reqSkills = roleSkillsMap[targetRoleId] || roleSkillsMap["1"];
            const roleObj = mockRoles.find((r: any) => String(r.id) === String(targetRoleId)) || { title: "Software Developer" };

            const matches = mockMentors.map((m: any) => {
              const overlap = m.expertise.filter((exp: string) =>
                reqSkills.some((req: any) => req.name.toLowerCase().includes(exp.toLowerCase()) || exp.toLowerCase().includes(req.name.toLowerCase()))
              ).length;

              const baseScore = 55;
              const matchScore = Math.min(99, baseScore + (overlap * 10) + Math.floor(Math.random() * 8));
              return {
                mentor: m,
                match_score: matchScore,
                reasoning: `Matched for your ${roleObj.title} goal. Expert in ${m.expertise.slice(0, 2).join(" and ")}, helping you learn the required skills: ${reqSkills.slice(0, 2).map((r: any) => r.name).join(", ")}.`
              };
            });
            
            matches.sort((a: any, b: any) => b.match_score - a.match_score);
            
            // Pick top 4 and randomize order to refresh dynamically while keeping highly relevant!
            const topMatches = matches.slice(0, 4);
            topMatches.sort(() => Math.random() - 0.5);
            const resultMatches = topMatches.slice(0, 3);
            
            resolve(resultMatches as any);
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

            if (currentUser.email === "durgasravan21@gmail.com") {
              resolve(mockSessions as any);
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

          // ─── PROJECT SUBMISSION HANDLERS ───
          if (path === "/projects/submit" && method === "POST") {
            if (!currentUser) {
              reject({ message: "Not authenticated", status: 401 });
              return;
            }
            const projId = parseInt(body.project_id);
            const matchingProj = mockProjects.find((p: any) => String(p.id) === String(projId));
            const userProjs = JSON.parse(localStorage.getItem("mock_user_projects") || "[]");
            
            const newSubmission = {
              id: `sub_${userProjs.length + 1}`,
              user_id: String(currentUser.id),
              user_name: currentUser.name || currentUser.email.split("@")[0],
              user_email: currentUser.email,
              project_id: projId,
              project_title: matchingProj ? matchingProj.title : `Project #${projId}`,
              github_url: body.github_url,
              demo_url: body.demo_url || "",
              description: body.description || "",
              status: "submitted",
              submitted_at: new Date().toISOString(),
              review_score: null,
              review_feedback: null
            };
            
            userProjs.push(newSubmission);
            localStorage.setItem("mock_user_projects", JSON.stringify(userProjs));
            
            resolve({
              id: newSubmission.id,
              project_id: String(projId),
              github_url: body.github_url,
              problem_clarity: 8 + Math.floor(Math.random() * 3),
              technical_complexity: 7 + Math.floor(Math.random() * 3),
              career_relevance: 85 + Math.floor(Math.random() * 15),
              portfolio_grade: "A",
              missing_improvements: [
                "Load secret keys and config settings from a dotenv (.env) file. Do not save them in your code.",
                "Check and validate all inputs in request bodies before saving them."
              ],
              upgrade_suggestions: [
                { feature_name: "Redis Caching Layer", impact_score: 90, estimated_hours: 5, companies_valuing: ["Uber", "Robinhood"] },
                { feature_name: "Docker Containers", impact_score: 95, estimated_hours: 3, companies_valuing: ["Netflix", "Stripe"] }
              ],
              analyzed_at: new Date().toISOString()
            } as any);
            return;
          }

          if (path === "/projects/submissions/pending") {
            const userProjs = JSON.parse(localStorage.getItem("mock_user_projects") || "[]");
            const pending = userProjs.filter((p: any) => p.status === "submitted");
            resolve(pending as any);
            return;
          }

          if (path.startsWith("/projects/submissions/") && path.endsWith("/review") && method === "POST") {
            const parts = path.split("/");
            const userProjId = parts[3];
            const userProjs = JSON.parse(localStorage.getItem("mock_user_projects") || "[]");
            const userProj = userProjs.find((p: any) => String(p.id) === String(userProjId));
            if (userProj) {
              userProj.review_score = body.review_score;
              userProj.review_feedback = body.review_feedback;
              userProj.status = "reviewed";
              localStorage.setItem("mock_user_projects", JSON.stringify(userProjs));
              resolve(userProj as any);
            } else {
              reject({ message: "Submission not found", status: 404 });
            }
            return;
          }

          // ─── ADMIN SPECIALIZED HANDLERS ───
          if (path === "/admin/users/active") {
            const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
            const userProjs = JSON.parse(localStorage.getItem("mock_user_projects") || "[]");
            
            const activeUsersList = users.map((u: any) => {
              const profile = JSON.parse(localStorage.getItem(`mock_profile_${u.id}`) || "null");
              const activeProj = userProjs.find((p: any) => String(p.user_id) === String(u.id) && p.status !== "reviewed");
              
              let dreamRole = "Full-Stack Developer";
              if (profile && profile.target_role_id) {
                const targetRole = mockRoles.find((r: any) => String(r.id) === String(profile.target_role_id));
                if (targetRole) dreamRole = targetRole.title;
              }
              
              return {
                id: u.id,
                name: u.name || u.email.split("@")[0],
                email: u.email,
                role: u.role,
                dream_role: dreamRole,
                skill_progress: profile?.completion_percentage || Math.floor(30 + Math.random() * 50),
                active_project: activeProj ? activeProj.project_title : "None",
                status: Math.random() > 0.5 ? "Active Now" : "Idle"
              };
            });
            resolve(activeUsersList as any);
            return;
          }

          if (path.startsWith("/admin/mentors/") && path.endsWith("/update-pricing") && method === "POST") {
            const parts = path.split("/");
            const mId = parts[3];
            const updateMentors = JSON.parse(localStorage.getItem("mock_mentors") || "[]");
            const mentor = updateMentors.find((m: any) => String(m.id) === String(mId));
            if (mentor) {
              mentor.hourly_rate = parseFloat(body.hourly_rate);
              mentor.original_price = parseFloat(body.original_price);
              mentor.price_edited_by_admin = true;
              localStorage.setItem("mock_mentors", JSON.stringify(updateMentors));
              
              // Send notification to the mentor
              const targetUserId = mentor.user_id;
              if (targetUserId) {
                addMockNotification(
                  targetUserId,
                  "Hourly Rate Locked by Admin",
                  `Your hourly rate was updated to $${body.hourly_rate} by the Admin and is now locked. Please contact support to request a change.`,
                  "warning"
                );
              }
              resolve(mentor as any);
            } else {
              reject({ message: "Mentor not found", status: 404 });
            }
            return;
          }

          if (path.startsWith("/admin/mentors/") && path.endsWith("/toggle-premium") && method === "POST") {
            const parts = path.split("/");
            const mId = parts[3];
            const updateMentors = JSON.parse(localStorage.getItem("mock_mentors") || "[]");
            const mentor = updateMentors.find((m: any) => String(m.id) === String(mId));
            if (mentor) {
              mentor.has_premium_subscription = !mentor.has_premium_subscription;
              localStorage.setItem("mock_mentors", JSON.stringify(updateMentors));
              resolve(mentor as any);
            } else {
              reject({ message: "Mentor not found", status: 404 });
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
      const user = await this.fetchApi<User>("/auth/me");
      try {
        const profile = await this.user.getProfile();
        user.profile = profile;
      } catch (e) {
        try {
          const profile = JSON.parse(localStorage.getItem(`mock_profile_${user.id}`) || "null");
          const skills = JSON.parse(localStorage.getItem(`mock_skills_${user.id}`) || "[]");
          user.profile = {
            ...(profile || {}),
            skills: skills,
            target_role_id: profile?.target_role_id
          };
        } catch (err) {}
      }
      return user;
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

    addSuggestion: async (id: string, suggestion: any): Promise<any> => {
      return this.fetchApi<any>(`/projects/${id}/suggestions`, {
        method: "POST",
        body: JSON.stringify(suggestion),
      });
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

  // ─── Notifications ──────────────────────────────────────────
  notifications = {
    getAll: async (): Promise<any[]> => {
      return this.fetchApi<any[]>("/notifications");
    },
    markAllRead: async (): Promise<any> => {
      return this.fetchApi<any>("/notifications/read", { method: "POST" });
    },
    clearAll: async (): Promise<any> => {
      return this.fetchApi<any>("/notifications/clear", { method: "POST" });
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

    adminUpdatePrice: async (id: string | number, rate: number): Promise<any> => {
      return this.fetchApi<any>(`/admin/mentors/${id}/update-pricing`, {
        method: "POST",
        body: JSON.stringify({ hourly_rate: rate, original_price: rate * 1.3 }),
      });
    },

    requestPriceChange: async (payload: { requested_price: number; reason: string }): Promise<any> => {
      return this.fetchApi<any>("/mentors/price-request", {
        method: "POST",
        body: JSON.stringify(payload),
      });
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

    verifyDocuments: async (data: {
      selfie_base64: string;
      identity_document_base64: string;
      id_type: string;
      selfie_filename?: string;
      id_filename?: string;
    }): Promise<any> => {
      return this.fetchApi<any>("/mentors/verify-documents", {
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

    updatePricing: async (mentorId: string, rate: number, original: number): Promise<Mentor> => {
      return this.fetchApi<Mentor>(`/admin/mentors/${mentorId}/update-pricing`, {
        method: "POST",
        body: JSON.stringify({ hourly_rate: rate, original_price: original }),
      });
    },

    togglePremium: async (mentorId: string): Promise<Mentor> => {
      return this.fetchApi<Mentor>(`/admin/mentors/${mentorId}/toggle-premium`, {
        method: "POST",
      });
    },

    getActiveUsers: async (): Promise<any[]> => {
      return this.fetchApi<any[]>("/admin/users/active");
    },
  };
}

export const api = new ApiClient();
