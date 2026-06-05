import { invokeLLM } from "./_core/llm";
import * as db from "./db";

/**
 * AI Skill Gap Engine
 * Analyzes user's current skills against target role requirements
 * Uses LLM to generate personalized learning paths and recommendations
 */

interface SkillGapResult {
  missingSkills: Array<{
    id: number;
    name: string;
    category: string;
    priority: number;
    proficiencyNeeded: "beginner" | "intermediate" | "advanced";
  }>;
  priorityOrder: number[];
  suggestedProjects: Array<{
    id: number;
    title: string;
    difficulty: string;
    estimatedTime: number;
    relevanceScore: number;
    teachesSkills: string[];
  }>;
  learningPath: string;
  estimatedTimeToComplete: number; // in hours
  completionPercentage: number;
  nextSteps: string[];
}

/**
 * Generate comprehensive skill gap analysis for a user targeting a specific role
 */
export async function analyzeSkillGap(
  userId: number,
  roleId: number
): Promise<SkillGapResult> {
  // Get user's current skills with proficiency levels
  const userSkillsData = await db.getUserSkills(userId);
  const userSkillMap = new Map(
    userSkillsData.map((us: any) => [us.skillId, us.proficiencyLevel])
  );

  // Get target role and its required skills
  const role = await db.getRoleById(roleId);
  if (!role) throw new Error("Role not found");

  const roleSkillsData = await db.getRoleSkills(roleId);

  // Identify missing and insufficient skills
  const missingSkillsDetails: SkillGapResult["missingSkills"] = [];
  const missingSkillIds: number[] = [];

  for (const roleSkill of roleSkillsData) {
    const userProficiency = userSkillMap.get(roleSkill.skillId);

    // Check if skill is missing or proficiency is insufficient
    if (
      !userProficiency ||
      (userProficiency === "beginner" &&
        roleSkill.proficiencyLevel !== "beginner") ||
      (userProficiency === "intermediate" &&
        roleSkill.proficiencyLevel === "advanced")
    ) {
      const skillDetails = await db.getSkillById(roleSkill.skillId);
      if (skillDetails) {
        missingSkillsDetails.push({
          id: skillDetails.id,
          name: skillDetails.name,
          category: skillDetails.category,
          priority: roleSkill.priority,
          proficiencyNeeded: roleSkill.proficiencyLevel,
        });
        missingSkillIds.push(roleSkill.skillId);
      }
    }
  }

  // Sort by priority
  missingSkillsDetails.sort((a, b) => a.priority - b.priority);
  const priorityOrder = missingSkillsDetails.map((s) => s.id);

  // Get recommended projects for missing skills
  const allProjects = await db.getAllProjects();
  const suggestedProjects: SkillGapResult["suggestedProjects"] = [];

  for (const project of allProjects) {
    const projectSkills = await db.getProjectSkills(project.id);
    const teachesNewSkills = projectSkills.filter((ps: any) =>
      missingSkillIds.includes(ps.skillId)
    );

    if (teachesNewSkills.length > 0) {
      const skillNames = await Promise.all(
        teachesNewSkills.map(async (ps: any) => {
          const skill = await db.getSkillById(ps.skillId);
          return skill?.name || "";
        })
      );

      suggestedProjects.push({
        id: project.id,
        title: project.title,
        difficulty: project.difficulty,
        estimatedTime: project.estimatedTime || 0,
        relevanceScore: project.careerRelevance || 0,
        teachesSkills: skillNames.filter(Boolean),
      });
    }

    if (suggestedProjects.length >= 5) break;
  }

  // Sort projects by relevance
  suggestedProjects.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Estimate total time to complete all missing skills
  const estimatedTimeToComplete = suggestedProjects.reduce(
    (total, p) => total + p.estimatedTime,
    0
  );

  // Calculate completion percentage
  const completionPercentage =
    ((roleSkillsData.length - missingSkillsDetails.length) /
      roleSkillsData.length) *
    100;

  // Use LLM to generate personalized learning path
  const userProfile = await db.getUserProfile(userId);
  const skillNames = missingSkillsDetails.map((s) => s.name).join(", ");
  const projectTitles = suggestedProjects.map((p) => p.title).join(", ");

  const llmPrompt = `You are a career development advisor. Generate a personalized learning path for a user.

User Profile:
- Current Role: ${userProfile?.currentRole || "Not specified"}
- Years of Experience: ${userProfile?.yearsOfExperience || "Not specified"}
- Target Role: ${role.title}
- Target Role Seniority: ${role.seniority}

Missing Skills (in priority order):
${missingSkillsDetails.map((s) => `- ${s.name} (${s.category}) - Need ${s.proficiencyNeeded} level`).join("\n")}

Recommended Projects:
${suggestedProjects.map((p) => `- ${p.title} (${p.difficulty}, ~${p.estimatedTime} hours)`).join("\n")}

Please provide:
1. A brief analysis of the skill gap
2. A prioritized learning path with specific milestones
3. Recommended learning resources and strategies
4. Estimated timeline to reach the target role
5. Key success metrics to track progress

Format your response as a structured learning plan.`;

  const llmResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an expert career development advisor. Provide detailed, actionable learning paths.",
      },
      {
        role: "user",
        content: llmPrompt,
      },
    ],
  });

  const content = llmResponse.choices[0]?.message.content;
  const learningPath = typeof content === "string" ? content : "";

  // Extract next steps from LLM response
  const nextSteps = extractNextSteps(learningPath);

  return {
    missingSkills: missingSkillsDetails,
    priorityOrder,
    suggestedProjects,
    learningPath,
    estimatedTimeToComplete,
    completionPercentage,
    nextSteps,
  };
}

/**
 * Generate project recommendations for a user based on skill gaps
 */
export async function recommendProjects(
  userId: number,
  roleId: number,
  limit: number = 5
): Promise<SkillGapResult["suggestedProjects"]> {
  const skillGap = await analyzeSkillGap(userId, roleId);
  return skillGap.suggestedProjects.slice(0, limit);
}

/**
 * Generate learning suggestions using LLM
 */
export async function generateLearningSuggestions(
  userId: number,
  roleId: number
): Promise<{
  suggestions: string[];
  resources: string[];
  timeline: string;
}> {
  const skillGap = await analyzeSkillGap(userId, roleId);
  const role = await db.getRoleById(roleId);

  const llmPrompt = `Based on this learning path:

${skillGap.learningPath}

And these missing skills:
${skillGap.missingSkills.map((s) => `- ${s.name}`).join("\n")}

Please provide:
1. Top 5 specific learning suggestions (courses, books, projects)
2. Recommended learning resources (websites, platforms, communities)
3. Realistic timeline to reach ${role?.title} level

Format as JSON with keys: suggestions, resources, timeline`;

  const llmResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a career development expert providing learning recommendations.",
      },
      {
        role: "user",
        content: llmPrompt,
      },
    ],
  });

  try {
    const content = llmResponse.choices[0]?.message.content;
    const contentStr = typeof content === "string" ? content : "{}";
    const parsed = JSON.parse(contentStr);
    return {
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      timeline: parsed.timeline || "6-12 months",
    };
  } catch {
    return {
      suggestions: [],
      resources: [],
      timeline: "6-12 months",
    };
  }
}

/**
 * Track skill progression and update recommendations
 */
export async function updateSkillProgress(
  userId: number,
  skillId: number,
  newProficiency: "beginner" | "intermediate" | "advanced"
): Promise<void> {
  const userSkills = await db.getUserSkills(userId);
  const existingSkill = userSkills.find((us: any) => us.skillId === skillId);

  if (existingSkill) {
    await db.updateUserSkill(existingSkill.id, {
      proficiencyLevel: newProficiency,
    });
  } else {
    await db.createUserSkill({
      userId,
      skillId,
      proficiencyLevel: newProficiency,
    });
  }

  // Update career path completion percentage if user has one
  const careerPath = await db.getUserCareerPath(userId);
  if (careerPath) {
    const skillGap = await analyzeSkillGap(userId, careerPath.targetRoleId);
    await db.updateCareerPath(careerPath.id, {
      completionPercentage: skillGap.completionPercentage as any,
    });
  }
}

/**
 * Helper function to extract next steps from LLM response
 */
function extractNextSteps(learningPath: string): string[] {
  const steps: string[] = [];

  // Try to extract numbered or bulleted items
  const lines = learningPath.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.match(/^[\d]+\./) ||
      trimmed.match(/^[-*•]/) ||
      trimmed.match(/^Step \d+/i)
    ) {
      const cleaned = trimmed.replace(/^[\d]+\./, "").replace(/^[-*•]/, "").trim();
      if (cleaned.length > 10 && cleaned.length < 200) {
        steps.push(cleaned);
      }
    }
  }

  // Return top 5 steps
  return steps.slice(0, 5);
}

/**
 * Helper function to get skill by ID (needs to be added to db.ts)
 */
export async function getSkillById(skillId: number) {
  const allSkills = await db.getAllSkills();
  return allSkills.find((s: any) => s.id === skillId) || null;
}
