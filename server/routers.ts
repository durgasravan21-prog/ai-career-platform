import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

/**
 * Input validation schemas
 */

const userSkillsSchema = z.array(
  z.object({
    skillId: z.number(),
    proficiencyLevel: z.enum(["beginner", "intermediate", "advanced"]),
    yearsOfExperience: z.number().optional(),
  })
);

const careerRoadmapSchema = z.object({
  targetRoleId: z.number(),
});

const projectSubmitSchema = z.object({
  projectId: z.number(),
  githubUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  description: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,

  /**
   * AUTHENTICATION ROUTES
   */
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * USER ROUTES
   */
  users: router({
    /**
     * GET /users/me - Get current user profile
     */
    getMe: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      const profile = await db.getUserProfile(ctx.user.id);
      return {
        user: ctx.user,
        profile,
      };
    }),

    /**
     * POST /users/skills - Update user's current skills
     */
    updateSkills: protectedProcedure
      .input(userSkillsSchema)
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        // Delete existing skills
        const existingSkills = await db.getUserSkills(ctx.user.id);
        for (const skill of existingSkills) {
          await db.deleteUserSkill(skill.id);
        }

        // Add new skills
        const createdSkills: number[] = [];
        for (const skillData of input) {
          const skillId = await db.createUserSkill({
            userId: ctx.user.id,
            skillId: skillData.skillId,
            proficiencyLevel: skillData.proficiencyLevel,
            yearsOfExperience: skillData.yearsOfExperience ? String(skillData.yearsOfExperience) : undefined,
          } as any);
          createdSkills.push(skillId as number);
        }

        return {
          success: true,
          skillCount: createdSkills.length,
        };
      }),

    /**
     * GET /users/skills - Get user's current skills
     */
    getSkills: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      return db.getUserSkills(ctx.user.id);
    }),

    /**
     * POST /users/profile - Update user profile
     */
    updateProfile: protectedProcedure
      .input(
        z.object({
          bio: z.string().optional(),
          currentRole: z.string().optional(),
          yearsOfExperience: z.number().optional(),
          location: z.string().optional(),
          linkedinUrl: z.string().url().optional(),
          portfolioUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        const profileData = {
          bio: input.bio,
          currentRole: input.currentRole,
          yearsOfExperience: input.yearsOfExperience ? String(input.yearsOfExperience) : undefined,
          location: input.location,
          linkedinUrl: input.linkedinUrl,
          portfolioUrl: input.portfolioUrl,
        };

        const existingProfile = await db.getUserProfile(ctx.user.id);
        if (existingProfile) {
          await db.updateUserProfile(ctx.user.id, profileData as any);
        } else {
          await db.createUserProfile({
            userId: ctx.user.id,
            ...profileData,
          } as any);
        }

        return { success: true };
      }),
  }),

  /**
   * CAREER ROUTES
   */
  career: router({
    /**
     * GET /career/roles - List all available roles
     */
    getRoles: publicProcedure.query(async () => {
      return db.getAllRoles();
    }),

    /**
     * GET /career/roles/:id - Get role details with required skills
     */
    getRoleDetails: publicProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        const role = await db.getRoleById(input.roleId);
        if (!role) throw new Error("Role not found");

        const requiredSkills = await db.getRoleSkills(input.roleId);
        return {
          role,
          requiredSkills,
        };
      }),

    /**
     * POST /career/roadmap - Generate skill gap analysis and learning path
     * Input: target_role_id
     * Output: missing_skills, priority_order, suggested_projects, completion_percentage
     */
    generateRoadmap: protectedProcedure
      .input(careerRoadmapSchema)
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        // Check if career path exists
        let careerPath = await db.getUserCareerPath(ctx.user.id);

        // Get skill gap analysis
        const skillGapAnalysis = await db.getSkillGapAnalysis(ctx.user.id, input.targetRoleId);

        // Get recommended projects
        const recommendedProjects = await db.getRecommendedProjects(ctx.user.id, 5);

        // Create or update career path
        if (!careerPath) {
          await db.createCareerPath({
            userId: ctx.user.id,
            targetRoleId: input.targetRoleId,
            status: "active" as const,
            skillGapAnalysis: JSON.stringify(skillGapAnalysis),
            completionPercentage: skillGapAnalysis.completionPercentage as any,
          });
        } else {
          await db.updateCareerPath(careerPath.id, {
            targetRoleId: input.targetRoleId,
            skillGapAnalysis: JSON.stringify(skillGapAnalysis),
            completionPercentage: skillGapAnalysis.completionPercentage as any,
          });
        }

        // Use LLM to generate personalized learning suggestions
        const userSkills = await db.getUserSkills(ctx.user.id);
        const role = await db.getRoleById(input.targetRoleId);

        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a career development advisor. Provide personalized learning suggestions based on skill gaps.",
            },
            {
              role: "user",
              content: `User has these skills: ${userSkills.map((s: any) => s.skillId).join(", ")}. They want to become a ${role?.title}. Missing skills: ${skillGapAnalysis.missingSkills.map((s: any) => s.name).join(", ")}. Provide 3-5 actionable learning suggestions.`,
            },
          ],
        });

        return {
          careerPath: {
            targetRoleId: input.targetRoleId,
            status: "active",
            completionPercentage: skillGapAnalysis.completionPercentage,
          },
          skillGapAnalysis,
          recommendedProjects,
          learningPath: llmResponse.choices[0]?.message.content || "",
        };
      }),

    /**
     * GET /career/roadmap - Get current career roadmap
     */
    getRoadmap: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      const careerPath = await db.getUserCareerPath(ctx.user.id);
      if (!careerPath) {
        return null;
      }

      const skillGapAnalysis = careerPath.skillGapAnalysis
        ? JSON.parse(careerPath.skillGapAnalysis)
        : null;

      return {
        careerPath,
        skillGapAnalysis,
      };
    }),
  }),

  /**
   * PROJECTS ROUTES
   */
  projects: router({
    /**
     * GET /projects - Get all projects with optional filters
     */
    getAll: publicProcedure
      .input(
        z.object({
          difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
          limit: z.number().default(20),
        })
      )
      .query(async ({ input }) => {
        let projects = await db.getAllProjects();

        if (input.difficulty) {
          projects = projects.filter((p: any) => p.difficulty === input.difficulty);
        }

        return projects.slice(0, input.limit);
      }),

    /**
     * GET /projects/:id - Get project details with required skills
     */
    getDetails: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");

        const projectSkills = await db.getProjectSkills(input.projectId);
        return {
          project,
          skills: projectSkills,
        };
      }),

    /**
     * GET /projects/recommendations - Get AI-recommended projects for user
     */
    getRecommendations: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      return db.getRecommendedProjects(ctx.user.id, 10);
    }),

    /**
     * POST /projects/submit - Submit a completed project
     */
    submit: protectedProcedure
      .input(projectSubmitSchema)
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        const projectId = await db.createUserProject({
          userId: ctx.user.id,
          projectId: input.projectId,
          status: "submitted" as const,
          githubUrl: input.githubUrl,
          portfolioUrl: input.portfolioUrl,
          description: input.description,
          submittedAt: new Date(),
        });

        // Create recommendation for future similar projects
        const project = await db.getProjectById(input.projectId);
        if (project) {
          await db.createRecommendation({
            userId: ctx.user.id,
            type: "project" as const,
            targetId: input.projectId,
            score: 100 as any,
            reason: "User completed this project",
            dismissed: false,
          });
        }

        return {
          success: true,
          userProjectId: projectId,
        };
      }),

    /**
     * GET /projects/user - Get user's submitted projects
     */
    getUserProjects: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      return db.getUserProjects(ctx.user.id);
    }),
  }),

  /**
   * SKILLS ROUTES
   */
  skills: router({
    /**
     * GET /skills - Get all available skills
     */
    getAll: publicProcedure.query(async () => {
      return db.getAllSkills();
    }),

    /**
     * GET /skills/category/:category - Get skills by category
     */
    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return db.getSkillsByCategory(input.category);
      }),
  }),

  /**
   * RECOMMENDATIONS ROUTES
   */
  recommendations: router({
    /**
     * GET /recommendations - Get user's active recommendations
     */
    getActive: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      return db.getUserRecommendations(ctx.user.id);
    }),

    /**
     * POST /recommendations/:id/dismiss - Dismiss a recommendation
     */
    dismiss: protectedProcedure
      .input(z.object({ recommendationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.dismissRecommendation(input.recommendationId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
