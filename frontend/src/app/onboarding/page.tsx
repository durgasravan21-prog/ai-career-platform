"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Role, Skill, SkillCategory, ProficiencyLevel, ApiError } from "@/types";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  Check,
  Rocket,
  User,
  Target,
  Code,
  Briefcase,
  Palette,
  Cloud,
  Shield,
  Database,
  Smartphone,
  Brain,
  BarChart3,
  Settings,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  frontend: <Code className="h-4 w-4" />,
  backend: <Settings className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  devops: <Cloud className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  ml_ai: <Brain className="h-4 w-4" />,
  design: <Palette className="h-4 w-4" />,
  soft_skills: <Briefcase className="h-4 w-4" />,
  cloud: <Cloud className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  data: <BarChart3 className="h-4 w-4" />,
  other: <Target className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  devops: "DevOps",
  mobile: "Mobile",
  ml_ai: "ML / AI",
  design: "Design",
  soft_skills: "Soft Skills",
  cloud: "Cloud",
  security: "Security",
  data: "Data",
  other: "Other",
};

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { register, isAuthenticated, user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<
    Map<string, ProficiencyLevel>
  >(new Map());
  const [skillSearch, setSkillSearch] = useState("");

  // API data
  const [roles, setRoles] = useState<Role[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Redirect if already authenticated (and not in onboarding flow)
  useEffect(() => {
    if (isAuthenticated && currentStep === 1) {
      setCurrentStep(3); // Skip to role selection if already logged in
    }
  }, [isAuthenticated, currentStep]);

  // Fetch roles when reaching step 3
  useEffect(() => {
    if (currentStep === 3 && roles.length === 0) {
      setRolesLoading(true);
      api.career
        .getRoles()
        .then(setRoles)
        .catch(() => {
          // Fallback roles
          setRoles([
            { id: "1", title: "Frontend Developer", description: "Build beautiful user interfaces with React, Vue, or Angular", category: "engineering", demand_level: "very_high" },
            { id: "2", title: "Backend Developer", description: "Design robust APIs and server-side systems", category: "engineering", demand_level: "very_high" },
            { id: "3", title: "Full Stack Developer", description: "Master both frontend and backend technologies", category: "engineering", demand_level: "very_high" },
            { id: "4", title: "Data Scientist", description: "Extract insights from data using ML and statistics", category: "data", demand_level: "high" },
            { id: "5", title: "DevOps Engineer", description: "Automate and optimize deployment pipelines", category: "engineering", demand_level: "high" },
            { id: "6", title: "Mobile Developer", description: "Build native and cross-platform mobile apps", category: "engineering", demand_level: "high" },
            { id: "7", title: "ML Engineer", description: "Build and deploy machine learning systems at scale", category: "data", demand_level: "very_high" },
            { id: "8", title: "Cloud Architect", description: "Design scalable cloud infrastructure solutions", category: "engineering", demand_level: "high" },
            { id: "9", title: "UX Designer", description: "Create intuitive and delightful user experiences", category: "design", demand_level: "high" },
          ]);
        })
        .finally(() => setRolesLoading(false));
    }
  }, [currentStep, roles.length]);

  // Fetch skills when reaching step 4
  useEffect(() => {
    if (currentStep === 4 && skills.length === 0) {
      setSkillsLoading(true);
      api.user
        .getSkills()
        .then(setSkills)
        .catch(() => {
          // Fallback skills
          const fallbackSkills: Skill[] = [
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
            { id: "32", name: "Figma", category: "design" },
          ];
          setSkills(fallbackSkills);
        })
        .finally(() => setSkillsLoading(false));
    }
  }, [currentStep, skills.length]);

  const toggleSkill = useCallback(
    (skillId: string) => {
      setSelectedSkills((prev) => {
        const next = new Map(prev);
        if (next.has(skillId)) {
          next.delete(skillId);
        } else {
          next.set(skillId, "intermediate");
        }
        return next;
      });
    },
    []
  );

  const setProficiency = useCallback(
    (skillId: string, level: ProficiencyLevel) => {
      setSelectedSkills((prev) => {
        const next = new Map(prev);
        next.set(skillId, level);
        return next;
      });
    },
    []
  );

  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const groupedSkills = filteredSkills.reduce(
    (acc, skill) => {
      const cat = skill.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return name.trim().length >= 2 && email.includes("@") && password.length >= 6;
      case 3:
        return selectedRole !== null;
      case 4:
        return selectedSkills.size >= 1;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    setError("");

    if (currentStep === 2 && !isAuthenticated) {
      setIsSubmitting(true);
      try {
        await register({ name, email, password });
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || "Registration failed");
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Update skills
      if (selectedSkills.size > 0) {
        const skillPayload = Array.from(selectedSkills.entries()).map(
          ([skill_id, proficiency]) => ({ skill_id, proficiency })
        );
        await api.user.updateSkills({ skills: skillPayload });
      }

      // Set target role and generate roadmap
      if (selectedRole) {
        await api.user.updateProfile({ target_role_id: selectedRole.id });
        await api.career.generateRoadmap(selectedRole.id);
      }

      router.push("/dashboard");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Something went wrong. Redirecting to dashboard...");
      // Still redirect after a short delay
      setTimeout(() => router.push("/dashboard"), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const proficiencyLevels: ProficiencyLevel[] = [
    "beginner",
    "intermediate",
    "advanced",
    "expert",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-sm text-muted">
              {Math.round((currentStep / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {["Welcome", "Account", "Role", "Skills", "Confirm"].map(
              (label, i) => (
                <div
                  key={label}
                  className={cn(
                    "text-xs transition-colors",
                    i + 1 <= currentStep ? "text-primary" : "text-muted/50"
                  )}
                >
                  {label}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl animate-fadeIn" key={currentStep}>
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center space-y-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center mx-auto animate-float">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Welcome to <span className="gradient-text">CareerAI</span>
                </h1>
                <p className="text-lg text-muted max-w-md mx-auto">
                  Let&apos;s set up your profile in just a few minutes. We&apos;ll
                  create a personalized career roadmap just for you.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                {[
                  { icon: Target, label: "Set your goal" },
                  { icon: Code, label: "Add your skills" },
                  { icon: Sparkles, label: "Get your roadmap" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="glass-card p-4 text-center"
                    >
                      <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Account */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Create Your Account
                </h2>
                <p className="text-muted">
                  Tell us a bit about yourself to get started.
                </p>
              </div>

              <div className="glass-card p-8 space-y-5 max-w-md mx-auto">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={name.length > 0 && name.length < 2 ? "Name must be at least 2 characters" : undefined}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={
                    password.length > 0 && password.length < 6
                      ? "Password must be at least 6 characters"
                      : undefined
                  }
                />
              </div>
            </div>
          )}

          {/* Step 3: Dream Role */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-secondary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Choose Your Dream Role
                </h2>
                <p className="text-muted">
                  What role are you working towards? We&apos;ll tailor
                  everything to this goal.
                </p>
              </div>

              {rolesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 bg-white/5 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        "glass-card p-5 text-left transition-all duration-200 group",
                        selectedRole?.id === role.id
                          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                          : "hover:border-white/20 hover:bg-white/[0.08]"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        {selectedRole?.id === role.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">
                        {role.title}
                      </h3>
                      <p className="text-xs text-muted line-clamp-2">
                        {role.description}
                      </p>
                      {role.demand_level && (
                        <Badge
                          variant={
                            role.demand_level === "very_high"
                              ? "success"
                              : role.demand_level === "high"
                                ? "primary"
                                : "default"
                          }
                          className="mt-3"
                        >
                          {role.demand_level === "very_high"
                            ? "🔥 High Demand"
                            : role.demand_level === "high"
                              ? "📈 Growing"
                              : "Stable"}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Skills */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                  <Code className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  What Do You Know?
                </h2>
                <p className="text-muted">
                  Select your current skills. Don&apos;t worry — you can update
                  these later.
                </p>
                <p className="text-xs text-primary mt-1">
                  {selectedSkills.size} skill{selectedSkills.size !== 1 ? "s" : ""} selected
                </p>
              </div>

              {/* Search */}
              <div className="max-w-md mx-auto">
                <Input
                  placeholder="Search skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>

              {skillsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-white/5 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                  {Object.entries(groupedSkills).map(([category, catSkills]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        {categoryIcons[category] || <Target className="h-4 w-4" />}
                        <h3 className="text-sm font-medium text-foreground">
                          {categoryLabels[category] || category}
                        </h3>
                        <span className="text-xs text-muted">
                          ({catSkills.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {catSkills.map((skill) => {
                          const isSelected = selectedSkills.has(skill.id);
                          return (
                            <div key={skill.id}>
                              <button
                                onClick={() => toggleSkill(skill.id)}
                                className={cn(
                                  "w-full px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-200 border",
                                  isSelected
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-white/5 border-white/10 text-muted hover:text-foreground hover:border-white/20"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{skill.name}</span>
                                  {isSelected && (
                                    <Check className="h-3.5 w-3.5 flex-shrink-0 ml-1" />
                                  )}
                                </div>
                              </button>
                              {isSelected && (
                                <div className="flex gap-1 mt-1">
                                  {proficiencyLevels.map((level) => (
                                    <button
                                      key={level}
                                      onClick={() =>
                                        setProficiency(skill.id, level)
                                      }
                                      className={cn(
                                        "flex-1 py-0.5 rounded text-[10px] capitalize transition-colors",
                                        selectedSkills.get(skill.id) === level
                                          ? "bg-primary/20 text-primary"
                                          : "bg-white/5 text-muted hover:bg-white/10"
                                      )}
                                    >
                                      {level.slice(0, 3)}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 animate-glow">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  You&apos;re All Set!
                </h2>
                <p className="text-muted">
                  Here&apos;s a summary of your profile. Let&apos;s generate your
                  personalized roadmap!
                </p>
              </div>

              <div className="glass-card p-8 space-y-6 max-w-md mx-auto">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">
                    Name
                  </p>
                  <p className="text-foreground font-medium">
                    {user?.name || name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">
                    Target Role
                  </p>
                  <p className="text-foreground font-medium">
                    {selectedRole?.title || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-2">
                    Selected Skills ({selectedSkills.size})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedSkills.entries()).map(
                      ([skillId, proficiency]) => {
                        const skill = skills.find((s) => s.id === skillId);
                        return (
                          <Badge key={skillId} variant="primary">
                            {skill?.name || skillId} · {proficiency}
                          </Badge>
                        );
                      }
                    )}
                    {selectedSkills.size === 0 && (
                      <span className="text-sm text-muted">No skills selected</span>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-error text-center bg-error/10 border border-error/20 rounded-lg px-4 py-2 max-w-md mx-auto">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={cn(currentStep === 1 && "invisible")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              isLoading={isSubmitting}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="min-w-[200px]"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Generate My Roadmap
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
