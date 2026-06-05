/**
 * LOCAL DEV MODE: In-memory database that mimics the Data API interface.
 * When BUILT_IN_FORGE_API_URL is set, uses the real Forge API.
 * Otherwise, uses a pre-seeded in-memory store so the app works locally.
 */
import { ENV } from "./env";

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

// ─── In-Memory Store ────────────────────────────────────────────────
type Row = Record<string, any>;
const store: Record<string, Row[]> = {};
const autoIncrementIds: Record<string, number> = {};

function getNextId(table: string): number {
  if (!autoIncrementIds[table]) {
    const rows = store[table] || [];
    autoIncrementIds[table] = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
  }
  return autoIncrementIds[table]++;
}

function matchesWhere(row: Row, where: Record<string, any>): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value);
}

function sortRows(rows: Row[], orderBy?: Record<string, string>): Row[] {
  if (!orderBy) return rows;
  const [key, direction] = Object.entries(orderBy)[0];
  return [...rows].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

function handleLocalQuery(apiId: string, options: DataApiCallOptions): unknown {
  const body = options.body || {};
  const table = body.table as string;

  if (!table) throw new Error(`Missing table in body for ${apiId}`);

  switch (apiId) {
    case "Database/Query": {
      const rows = store[table] || [];
      const where = body.where as Record<string, any> | undefined;
      const filtered = where ? rows.filter(r => matchesWhere(r, where)) : rows;
      return sortRows(filtered, body.orderBy as Record<string, string> | undefined);
    }

    case "Database/Insert": {
      if (!store[table]) store[table] = [];
      const data = body.data as Row;
      const id = getNextId(table);
      const now = new Date().toISOString();
      const newRow = { id, ...data, createdAt: now, updatedAt: now };
      store[table].push(newRow);
      return newRow;
    }

    case "Database/Update": {
      const rows = store[table] || [];
      const where = body.where as Record<string, any>;
      const data = body.data as Record<string, any>;
      for (const row of rows) {
        if (matchesWhere(row, where)) {
          Object.assign(row, data, { updatedAt: new Date().toISOString() });
        }
      }
      return { success: true };
    }

    case "Database/Delete": {
      const where = body.where as Record<string, any>;
      store[table] = (store[table] || []).filter(r => !matchesWhere(r, where));
      return { success: true };
    }

    default:
      throw new Error(`Unknown API: ${apiId}`);
  }
}

// ─── Seed Data ──────────────────────────────────────────────────────
function seedData() {
  if (store._seeded) return;
  (store as any)._seeded = true;

  // Users
  store.users = [
    {
      id: 1,
      openId: "local-dev-user",
      name: "Durga Sravan",
      email: "durga@example.com",
      loginMethod: "local",
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSignedIn: new Date().toISOString(),
    },
  ];
  autoIncrementIds.users = 2;

  // Skills
  store.skills = [
    { id: 1, name: "JavaScript", category: "Frontend", description: "Core web programming language" },
    { id: 2, name: "TypeScript", category: "Frontend", description: "Typed superset of JavaScript" },
    { id: 3, name: "React", category: "Frontend", description: "Component-based UI library" },
    { id: 4, name: "Node.js", category: "Backend", description: "Server-side JavaScript runtime" },
    { id: 5, name: "Python", category: "Backend", description: "General-purpose programming language" },
    { id: 6, name: "SQL", category: "Backend", description: "Database query language" },
    { id: 7, name: "Docker", category: "DevOps", description: "Container platform for application deployment" },
    { id: 8, name: "AWS", category: "Cloud", description: "Amazon cloud services platform" },
    { id: 9, name: "Git", category: "Tools", description: "Version control system" },
    { id: 10, name: "REST APIs", category: "Backend", description: "RESTful API design and implementation" },
    { id: 11, name: "GraphQL", category: "Backend", description: "Query language for APIs" },
    { id: 12, name: "CSS/Tailwind", category: "Frontend", description: "Styling and layout for web applications" },
    { id: 13, name: "Next.js", category: "Frontend", description: "React framework for production applications" },
    { id: 14, name: "MongoDB", category: "Backend", description: "NoSQL document database" },
    { id: 15, name: "PostgreSQL", category: "Backend", description: "Advanced relational database" },
    { id: 16, name: "CI/CD", category: "DevOps", description: "Continuous integration and deployment pipelines" },
    { id: 17, name: "Machine Learning", category: "AI/ML", description: "Building predictive models with data" },
    { id: 18, name: "TensorFlow", category: "AI/ML", description: "Open-source ML framework by Google" },
    { id: 19, name: "React Native", category: "Mobile", description: "Cross-platform mobile development" },
    { id: 20, name: "Kubernetes", category: "DevOps", description: "Container orchestration platform" },
  ];
  autoIncrementIds.skills = 21;

  // Roles
  store.roles = [
    { id: 1, title: "Full-Stack Developer", description: "Build both frontend and backend web applications", seniority: "mid" },
    { id: 2, title: "Frontend Engineer", description: "Specialize in user interfaces and client-side development", seniority: "mid" },
    { id: 3, title: "Backend Engineer", description: "Design and build server-side systems and APIs", seniority: "mid" },
    { id: 4, title: "DevOps Engineer", description: "Manage infrastructure, CI/CD, and cloud deployments", seniority: "mid" },
    { id: 5, title: "Machine Learning Engineer", description: "Build and deploy ML models and data pipelines", seniority: "mid" },
    { id: 6, title: "Mobile Developer", description: "Build native and cross-platform mobile applications", seniority: "mid" },
    { id: 7, title: "Senior Software Architect", description: "Design large-scale distributed systems", seniority: "senior" },
    { id: 8, title: "Data Engineer", description: "Build and maintain data infrastructure and pipelines", seniority: "mid" },
  ];
  autoIncrementIds.roles = 9;

  // Role Skills (which skills each role requires)
  store.roleSkills = [
    // Full-Stack Developer
    { id: 1, roleId: 1, skillId: 1, proficiencyLevel: "advanced", priority: 1 },
    { id: 2, roleId: 1, skillId: 2, proficiencyLevel: "advanced", priority: 2 },
    { id: 3, roleId: 1, skillId: 3, proficiencyLevel: "advanced", priority: 3 },
    { id: 4, roleId: 1, skillId: 4, proficiencyLevel: "intermediate", priority: 4 },
    { id: 5, roleId: 1, skillId: 6, proficiencyLevel: "intermediate", priority: 5 },
    { id: 6, roleId: 1, skillId: 9, proficiencyLevel: "intermediate", priority: 6 },
    { id: 7, roleId: 1, skillId: 10, proficiencyLevel: "intermediate", priority: 7 },
    // Frontend Engineer
    { id: 8, roleId: 2, skillId: 1, proficiencyLevel: "advanced", priority: 1 },
    { id: 9, roleId: 2, skillId: 2, proficiencyLevel: "advanced", priority: 2 },
    { id: 10, roleId: 2, skillId: 3, proficiencyLevel: "advanced", priority: 3 },
    { id: 11, roleId: 2, skillId: 12, proficiencyLevel: "advanced", priority: 4 },
    { id: 12, roleId: 2, skillId: 13, proficiencyLevel: "intermediate", priority: 5 },
    // Backend Engineer
    { id: 13, roleId: 3, skillId: 4, proficiencyLevel: "advanced", priority: 1 },
    { id: 14, roleId: 3, skillId: 5, proficiencyLevel: "intermediate", priority: 2 },
    { id: 15, roleId: 3, skillId: 6, proficiencyLevel: "advanced", priority: 3 },
    { id: 16, roleId: 3, skillId: 10, proficiencyLevel: "advanced", priority: 4 },
    { id: 17, roleId: 3, skillId: 15, proficiencyLevel: "intermediate", priority: 5 },
    // DevOps Engineer
    { id: 18, roleId: 4, skillId: 7, proficiencyLevel: "advanced", priority: 1 },
    { id: 19, roleId: 4, skillId: 8, proficiencyLevel: "advanced", priority: 2 },
    { id: 20, roleId: 4, skillId: 16, proficiencyLevel: "advanced", priority: 3 },
    { id: 21, roleId: 4, skillId: 20, proficiencyLevel: "intermediate", priority: 4 },
    // ML Engineer
    { id: 22, roleId: 5, skillId: 5, proficiencyLevel: "advanced", priority: 1 },
    { id: 23, roleId: 5, skillId: 17, proficiencyLevel: "advanced", priority: 2 },
    { id: 24, roleId: 5, skillId: 18, proficiencyLevel: "intermediate", priority: 3 },
    { id: 25, roleId: 5, skillId: 6, proficiencyLevel: "intermediate", priority: 4 },
  ];
  autoIncrementIds.roleSkills = 26;

  // Projects
  store.projects = [
    {
      id: 1, title: "Personal Portfolio Website", description: "Build a responsive portfolio showcasing your projects, skills, and experience using React and Tailwind CSS.",
      difficulty: "beginner", techStack: "[\"React\", \"Tailwind CSS\", \"JavaScript\"]", careerRelevance: 85, estimatedTime: 15,
    },
    {
      id: 2, title: "Task Management API", description: "Design and build a RESTful API with authentication, CRUD operations, and database integration using Node.js and PostgreSQL.",
      difficulty: "intermediate", techStack: "[\"Node.js\", \"Express\", \"PostgreSQL\", \"JWT\"]", careerRelevance: 90, estimatedTime: 25,
    },
    {
      id: 3, title: "E-Commerce Dashboard", description: "Create a full-stack dashboard with data visualization, user management, and real-time analytics.",
      difficulty: "advanced", techStack: "[\"Next.js\", \"TypeScript\", \"PostgreSQL\", \"Chart.js\"]", careerRelevance: 95, estimatedTime: 40,
    },
    {
      id: 4, title: "Chat Application", description: "Build a real-time chat app with WebSockets, message history, and user presence indicators.",
      difficulty: "intermediate", techStack: "[\"React\", \"Node.js\", \"Socket.io\", \"MongoDB\"]", careerRelevance: 88, estimatedTime: 30,
    },
    {
      id: 5, title: "Weather Dashboard", description: "Create a weather app consuming external APIs with search, favorites, and a 7-day forecast view.",
      difficulty: "beginner", techStack: "[\"React\", \"CSS\", \"REST API\"]", careerRelevance: 70, estimatedTime: 10,
    },
    {
      id: 6, title: "Blog Platform with CMS", description: "Build a full-stack blogging platform with markdown editor, categories, comments, and SEO optimization.",
      difficulty: "intermediate", techStack: "[\"Next.js\", \"TypeScript\", \"PostgreSQL\", \"MDX\"]", careerRelevance: 82, estimatedTime: 35,
    },
    {
      id: 7, title: "ML Image Classifier", description: "Train and deploy a convolutional neural network for image classification with a web interface.",
      difficulty: "advanced", techStack: "[\"Python\", \"TensorFlow\", \"Flask\", \"React\"]", careerRelevance: 92, estimatedTime: 45,
    },
    {
      id: 8, title: "DevOps Pipeline Setup", description: "Set up a complete CI/CD pipeline with Docker, GitHub Actions, and automated deployment to AWS.",
      difficulty: "intermediate", techStack: "[\"Docker\", \"GitHub Actions\", \"AWS\", \"Terraform\"]", careerRelevance: 88, estimatedTime: 20,
    },
    {
      id: 9, title: "Mobile Fitness Tracker", description: "Build a cross-platform fitness app tracking workouts, steps, and nutrition with data visualization.",
      difficulty: "intermediate", techStack: "[\"React Native\", \"TypeScript\", \"SQLite\"]", careerRelevance: 80, estimatedTime: 35,
    },
    {
      id: 10, title: "Social Media Analytics Tool", description: "Create a dashboard analyzing social media engagement metrics with automated reports and insights.",
      difficulty: "advanced", techStack: "[\"Python\", \"React\", \"GraphQL\", \"PostgreSQL\"]", careerRelevance: 87, estimatedTime: 50,
    },
  ];
  autoIncrementIds.projects = 11;

  // Project Skills
  store.projectSkills = [
    { id: 1, projectId: 1, skillId: 3, isPrimary: true },
    { id: 2, projectId: 1, skillId: 12, isPrimary: true },
    { id: 3, projectId: 1, skillId: 1, isPrimary: false },
    { id: 4, projectId: 2, skillId: 4, isPrimary: true },
    { id: 5, projectId: 2, skillId: 10, isPrimary: true },
    { id: 6, projectId: 2, skillId: 15, isPrimary: true },
    { id: 7, projectId: 3, skillId: 13, isPrimary: true },
    { id: 8, projectId: 3, skillId: 2, isPrimary: true },
    { id: 9, projectId: 3, skillId: 15, isPrimary: false },
    { id: 10, projectId: 4, skillId: 3, isPrimary: true },
    { id: 11, projectId: 4, skillId: 4, isPrimary: true },
    { id: 12, projectId: 4, skillId: 14, isPrimary: false },
    { id: 13, projectId: 5, skillId: 3, isPrimary: true },
    { id: 14, projectId: 5, skillId: 10, isPrimary: true },
    { id: 15, projectId: 7, skillId: 5, isPrimary: true },
    { id: 16, projectId: 7, skillId: 18, isPrimary: true },
    { id: 17, projectId: 7, skillId: 17, isPrimary: true },
    { id: 18, projectId: 8, skillId: 7, isPrimary: true },
    { id: 19, projectId: 8, skillId: 16, isPrimary: true },
    { id: 20, projectId: 8, skillId: 8, isPrimary: true },
    { id: 21, projectId: 9, skillId: 19, isPrimary: true },
    { id: 22, projectId: 9, skillId: 2, isPrimary: true },
    { id: 23, projectId: 10, skillId: 5, isPrimary: true },
    { id: 24, projectId: 10, skillId: 11, isPrimary: true },
  ];
  autoIncrementIds.projectSkills = 25;

  // Empty tables
  store.userSkills = [];
  store.careerPaths = [];
  store.userProjects = [];
  store.recommendations = [];
  store.userProfiles = [];

  autoIncrementIds.userSkills = 1;
  autoIncrementIds.careerPaths = 1;
  autoIncrementIds.userProjects = 1;
  autoIncrementIds.recommendations = 1;
  autoIncrementIds.userProfiles = 1;
}

// ─── Exported API ───────────────────────────────────────────────────
const useLocalMode = !ENV.forgeApiUrl || ENV.forgeApiUrl.trim().length === 0;

if (useLocalMode) {
  console.log("[DataAPI] 🔧 Running in LOCAL DEV MODE with in-memory database");
  seedData();
}

export async function callDataApi(
  apiId: string,
  options: DataApiCallOptions = {},
): Promise<unknown> {
  // If Forge API is configured, use the real API
  if (!useLocalMode) {
    if (!ENV.forgeApiKey) {
      throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
    }

    const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL("webdevtoken.v1.WebDevService/CallApi", baseUrl).toString();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "connect-protocol-version": "1",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        apiId,
        query: options.query,
        body: options.body,
        path_params: options.pathParams,
        multipart_form_data: options.formData,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Data API request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`,
      );
    }

    const payload = await response.json().catch(() => ({}));
    if (payload && typeof payload === "object" && "jsonData" in payload) {
      try {
        return JSON.parse((payload as Record<string, string>).jsonData ?? "{}");
      } catch {
        return (payload as Record<string, unknown>).jsonData;
      }
    }
    return payload;
  }

  // Local mode: use in-memory store
  return handleLocalQuery(apiId, options);
}
