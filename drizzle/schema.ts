import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Skills table - represents individual skills that users can have
 */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Frontend", "Backend", "DevOps"
  description: text("description"),
  embedding: text("embedding"), // JSON string of embedding vector for pgvector similarity
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

/**
 * Roles table - represents career positions/roles
 */
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull().unique(),
  description: text("description"),
  seniority: mysqlEnum("seniority", ["junior", "mid", "senior", "lead"]).notNull(),
  embedding: text("embedding"), // JSON string of embedding for similarity search
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

/**
 * Role requirements - many-to-many relationship between roles and required skills
 */
export const roleSkills = mysqlTable("roleSkills", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull(),
  skillId: int("skillId").notNull(),
  proficiencyLevel: mysqlEnum("proficiencyLevel", ["beginner", "intermediate", "advanced"]).notNull(),
  priority: int("priority").notNull(), // 1 = highest priority
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoleSkill = typeof roleSkills.$inferSelect;
export type InsertRoleSkill = typeof roleSkills.$inferInsert;

/**
 * User skills - tracks user's current skill proficiency
 */
export const userSkills = mysqlTable("userSkills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillId: int("skillId").notNull(),
  proficiencyLevel: mysqlEnum("proficiencyLevel", ["beginner", "intermediate", "advanced"]).notNull(),
  yearsOfExperience: decimal("yearsOfExperience", { precision: 5, scale: 2 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = typeof userSkills.$inferInsert;

/**
 * Career paths - represents a user's career goal and progression
 */
export const careerPaths = mysqlTable("careerPaths", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetRoleId: int("targetRoleId").notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
  skillGapAnalysis: text("skillGapAnalysis"), // JSON: {missingSkills: [], priorityOrder: []}
  completionPercentage: decimal("completionPercentage", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CareerPath = typeof careerPaths.$inferSelect;
export type InsertCareerPath = typeof careerPaths.$inferInsert;

/**
 * Projects - represents learning/portfolio projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  techStack: text("techStack"), // JSON array of technologies
  careerRelevance: decimal("careerRelevance", { precision: 5, scale: 2 }), // 0-100 score
  estimatedTime: int("estimatedTime"), // hours
  createdBy: int("createdBy"), // admin/curator
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project skills - many-to-many: which skills does a project teach
 */
export const projectSkills = mysqlTable("projectSkills", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  skillId: int("skillId").notNull(),
  isPrimary: boolean("isPrimary").default(false), // true if this is a main skill for the project
});

export type ProjectSkill = typeof projectSkills.$inferSelect;
export type InsertProjectSkill = typeof projectSkills.$inferInsert;

/**
 * User project submissions - tracks completed projects by users
 */
export const userProjects = mysqlTable("userProjects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  status: mysqlEnum("status", ["in_progress", "submitted", "completed", "abandoned"]).notNull(),
  githubUrl: varchar("githubUrl", { length: 500 }),
  portfolioUrl: varchar("portfolioUrl", { length: 500 }),
  description: text("description"), // User's description of what they built
  submittedAt: timestamp("submittedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProject = typeof userProjects.$inferSelect;
export type InsertUserProject = typeof userProjects.$inferInsert;

/**
 * Recommendations - AI-generated recommendations for users
 */
export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["project", "skill", "role", "mentor"]).notNull(),
  targetId: int("targetId").notNull(), // ID of the recommended item (projectId, skillId, roleId, etc.)
  score: decimal("score", { precision: 5, scale: 2 }), // 0-100 relevance score
  reason: text("reason"), // Why this recommendation was made
  dismissed: boolean("dismissed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Recommendation validity period
});

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

/**
 * User profile extensions - additional user metadata
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  bio: text("bio"),
  profileImageUrl: varchar("profileImageUrl", { length: 500 }),
  currentRole: varchar("currentRole", { length: 255 }),
  yearsOfExperience: decimal("yearsOfExperience", { precision: 5, scale: 2 }),
  location: varchar("location", { length: 255 }),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  portfolioUrl: varchar("portfolioUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
