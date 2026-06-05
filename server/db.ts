import { eq, and, desc, asc, inArray } from "drizzle-orm";
import {
  users,
  skills,
  roles,
  roleSkills,
  userSkills,
  careerPaths,
  projects,
  projectSkills,
  userProjects,
  recommendations,
  userProfiles,
  type User,
  type InsertSkill,
  type InsertRole,
  type InsertRoleSkill,
  type InsertUserSkill,
  type InsertCareerPath,
  type InsertProject,
  type InsertProjectSkill,
  type InsertUserProject,
  type InsertRecommendation,
  type InsertUserProfile,
} from "../drizzle/schema";
import { callDataApi } from "./_core/dataApi";

/**
 * USER QUERIES
 */

export async function getUserByOpenId(openId: string): Promise<User | null> {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "users",
      where: { openId },
    },
  });
  const rows = Array.isArray(result) ? result : [];
  return rows[0] || null;
}

export async function upsertUser(data: Partial<User> & { openId: string }): Promise<User> {
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await callDataApi("Database/Update", {
      body: {
        table: "users",
        where: { id: existing.id },
        data,
      },
    });
    return { ...existing, ...data } as User;
  } else {
    const result = await callDataApi("Database/Insert", {
      body: {
        table: "users",
        data,
      },
    });
    return result as User;
  }
}

/**
 * SKILLS QUERIES
 */

export async function getAllSkills() {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "skills",
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function getSkillById(skillId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "skills",
      where: { id: skillId },
    },
  });
  const rows = Array.isArray(result) ? result : [];
  return rows[0] || null;
}

export async function getSkillsByCategory(category: string) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "skills",
      where: { category },
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function createSkill(data: InsertSkill) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "skills",
      data,
    },
  });
  return result;
}

/**
 * ROLES QUERIES
 */

export async function getAllRoles() {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "roles",
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function getRoleById(roleId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "roles",
      where: { id: roleId },
    },
  });
  const rows = Array.isArray(result) ? result : [];
  return rows[0] || null;
}

export async function getRoleByTitle(title: string) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "roles",
      where: { title },
    },
  });
  const rows = Array.isArray(result) ? result : [];
  return rows[0] || null;
}

export async function createRole(data: InsertRole) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "roles",
      data,
    },
  });
  return result;
}

/**
 * ROLE SKILLS QUERIES
 */

export async function getRoleSkills(roleId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "roleSkills",
      where: { roleId },
      orderBy: { priority: "asc" },
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function createRoleSkill(data: InsertRoleSkill) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "roleSkills",
      data,
    },
  });
  return result;
}

/**
 * USER SKILLS QUERIES
 */

export async function getUserSkills(userId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "userSkills",
      where: { userId },
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function getUserSkillById(userSkillId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "userSkills",
      where: { id: userSkillId },
    },
  });
  const rows = Array.isArray(result) ? result : [];
  return rows[0] || null;
}

export async function createUserSkill(data: InsertUserSkill) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "userSkills",
      data,
    },
  });
  return result;
}

export async function updateUserSkill(id: number, data: Partial<InsertUserSkill>) {
  await callDataApi("Database/Update", {
    body: {
      table: "userSkills",
      where: { id },
      data,
    },
  });
}

export async function deleteUserSkill(id: number) {
  await callDataApi("Database/Delete", {
    body: {
      table: "userSkills",
      where: { id },
    },
  });
}

/**
 * CAREER PATHS QUERIES
 */

export async function getUserCareerPath(userId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "careerPaths",
      where: { userId },
    },
  });
  const rows = Array.isArray(result) ? result : [];
  return rows[0] || null;
}

export async function createCareerPath(data: InsertCareerPath) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "careerPaths",
      data,
    },
  });
  return result;
}

export async function updateCareerPath(id: number, data: Partial<InsertCareerPath>) {
  await callDataApi("Database/Update", {
    body: {
      table: "careerPaths",
      where: { id },
      data,
    },
  });
}

/**
 * PROJECTS QUERIES
 */

export async function getAllProjects() {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "projects",
      orderBy: { createdAt: "desc" },
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function getProjectById(projectId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "projects",
      where: { id: projectId },
    },
  });
  const rows = Array.isArray(result) ? result : [];
  return rows[0] || null;
}

export async function getProjectsByDifficulty(difficulty: string) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "projects",
      where: { difficulty },
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function createProject(data: InsertProject) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "projects",
      data,
    },
  });
  return result;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  await callDataApi("Database/Update", {
    body: {
      table: "projects",
      where: { id },
      data,
    },
  });
}

/**
 * PROJECT SKILLS QUERIES
 */

export async function getProjectSkills(projectId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "projectSkills",
      where: { projectId },
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function createProjectSkill(data: InsertProjectSkill) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "projectSkills",
      data,
    },
  });
  return result;
}

/**
 * USER PROJECTS QUERIES
 */

export async function getUserProjects(userId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "userProjects",
      where: { userId },
      orderBy: { createdAt: "desc" },
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function getUserProjectById(userProjectId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "userProjects",
      where: { id: userProjectId },
    },
  });
  const rows = Array.isArray(result) ? result : [];
  return rows[0] || null;
}

export async function createUserProject(data: InsertUserProject) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "userProjects",
      data,
    },
  });
  return result;
}

export async function updateUserProject(id: number, data: Partial<InsertUserProject>) {
  await callDataApi("Database/Update", {
    body: {
      table: "userProjects",
      where: { id },
      data,
    },
  });
}

/**
 * RECOMMENDATIONS QUERIES
 */

export async function getUserRecommendations(userId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "recommendations",
      where: { userId, dismissed: false },
      orderBy: { score: "desc" },
    },
  });
  return Array.isArray(result) ? result : [];
}

export async function createRecommendation(data: InsertRecommendation) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "recommendations",
      data,
    },
  });
  return result;
}

export async function dismissRecommendation(recommendationId: number) {
  await callDataApi("Database/Update", {
    body: {
      table: "recommendations",
      where: { id: recommendationId },
      data: { dismissed: true },
    },
  });
}

/**
 * USER PROFILES QUERIES
 */

export async function getUserProfile(userId: number) {
  const result = await callDataApi("Database/Query", {
    body: {
      table: "userProfiles",
      where: { userId },
    },
  });
  const rows = Array.isArray(result) ? result : [];
  return rows[0] || null;
}

export async function createUserProfile(data: InsertUserProfile) {
  const result = await callDataApi("Database/Insert", {
    body: {
      table: "userProfiles",
      data,
    },
  });
  return result;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUserProfile>) {
  await callDataApi("Database/Update", {
    body: {
      table: "userProfiles",
      where: { userId },
      data,
    },
  });
}

/**
 * COMPLEX QUERIES
 */

/**
 * Get skill gap analysis for a user targeting a specific role
 * Returns: missing skills, priority order, and recommended projects
 */
export async function getSkillGapAnalysis(userId: number, roleId: number) {
  // Get user's current skills
  const userSkillsData = await getUserSkills(userId);
  const userSkillIds = new Set(userSkillsData.map((us: typeof userSkillsData[0]) => us.skillId));

  // Get role's required skills
  const roleSkillsData = await getRoleSkills(roleId);

  // Find missing skills
  const missingSkillIds = roleSkillsData
    .filter((rs: typeof roleSkillsData[0]) => !userSkillIds.has(rs.skillId))
    .map((rs: typeof roleSkillsData[0]) => rs.skillId);

  // Get skill details for missing skills
  const allSkills = await getAllSkills();
  const missingSkillsDetails = allSkills.filter((s: typeof allSkills[0]) =>
    missingSkillIds.includes(s.id)
  );

  return {
    missingSkills: missingSkillsDetails,
    priorityOrder: roleSkillsData
      .filter((rs: typeof roleSkillsData[0]) => missingSkillIds.includes(rs.skillId))
      .map((rs: typeof roleSkillsData[0]) => rs.skillId),
    totalMissingSkills: missingSkillIds.length,
    totalRequiredSkills: roleSkillsData.length,
    completionPercentage:
      ((roleSkillsData.length - missingSkillIds.length) / roleSkillsData.length) * 100,
  };
}

/**
 * Get recommended projects for a user based on their skill gaps
 */
export async function getRecommendedProjects(userId: number, limit: number = 5) {
  // Get user's current skills
  const userSkillsData = await getUserSkills(userId);
  const userSkillIds = userSkillsData.map((us: typeof userSkillsData[0]) => us.skillId);

  if (userSkillIds.length === 0) {
    // If user has no skills, recommend beginner projects
    const allProjects = await getAllProjects();
    return allProjects
      .filter((p: typeof allProjects[0]) => p.difficulty === "beginner")
      .slice(0, limit);
  }

  // Get all projects and filter those that teach new skills
  const projectsData = await getAllProjects();
  const recommendedProjects: typeof projectsData = [];

  for (const project of projectsData) {
    const projectSkillsData = await getProjectSkills(project.id);
    const hasNewSkill = projectSkillsData.some(
      (ps: typeof projectSkillsData[0]) => !userSkillIds.includes(ps.skillId)
    );

    if (hasNewSkill) {
      recommendedProjects.push(project);
      if (recommendedProjects.length >= limit) break;
    }
  }

  return recommendedProjects;
}
