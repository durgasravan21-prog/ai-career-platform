"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn, getTimeGreeting } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress, CircularProgress } from "@/components/ui/progress";
import { SkeletonCard, Skeleton } from "@/components/ui/skeleton";
import type {
  RoadmapResult,
  Project,
  MissingSkill,
  LearningPathStep,
  ApiError,
  CVAnalysis,
} from "@/types";
import {
  Target,
  FolderKanban,
  Users,
  Settings,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  BookOpen,
  Zap,
  FileText,
  UploadCloud,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [learningPathOpen, setLearningPathOpen] = useState(false);

  // CV Upload state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvAnalysis, setCvAnalysis] = useState<CVAnalysis | null>(null);
  const [isAnalyzingCV, setIsAnalyzingCV] = useState(false);
  const [cvError, setCvError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadAndAnalyzeCV(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadAndAnalyzeCV(e.target.files[0]);
    }
  };

  const uploadAndAnalyzeCV = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setCvError("Invalid file type. Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    
    setCvFile(file);
    setIsAnalyzingCV(true);
    setCvError("");
    setCvAnalysis(null);
    
    try {
      const result = await api.user.analyzeCV(file);
      setCvAnalysis(result);
    } catch (err) {
      const apiErr = err as ApiError;
      setCvError(apiErr.message || "Failed to analyze CV. Please try again.");
    } finally {
      setIsAnalyzingCV(false);
    }
  };

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/?login=true");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [roadmapData, projectsData] = await Promise.allSettled([
          api.career.getSkillGap(),
          api.projects.getRecommendations(),
        ]);

        if (roadmapData.status === "fulfilled") {
          setRoadmap(roadmapData.value);
        }

        if (projectsData.status === "fulfilled") {
          setRecommendedProjects(projectsData.value);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load dashboard data");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  const completionPercent = roadmap?.skill_gap?.completion_percent ?? 0;
  const targetRole = roadmap?.skill_gap?.target_role;
  const missingSkills = roadmap?.skill_gap?.missing_skills ?? [];
  const learningPath = roadmap?.learning_path ?? [];

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return <Badge variant="success">Beginner</Badge>;
      case "intermediate":
        return <Badge variant="warning">Intermediate</Badge>;
      case "advanced":
        return <Badge variant="error">Advanced</Badge>;
      default:
        return <Badge variant="default">{difficulty}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="error">High Priority</Badge>;
      case "medium":
        return <Badge variant="warning">Medium</Badge>;
      case "low":
        return <Badge variant="success">Low</Badge>;
      default:
        return <Badge variant="default">{priority}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-3xl font-bold text-foreground">
            {getTimeGreeting()},{" "}
            <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-muted mt-1">
            {targetRole
              ? `Working towards: ${targetRole.title}`
              : "Let's set up your career goals"}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {isLoadingData ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <SkeletonCard />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Skill Gap Progress */}
              <Card className="animate-slideUp">
                <CardTitle className="flex items-center gap-2 mb-6">
                  <Target className="h-5 w-5 text-primary" />
                  Skill Gap Progress
                </CardTitle>

                <div className="flex flex-col items-center">
                  <CircularProgress value={completionPercent} size={140} strokeWidth={10}>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-foreground">
                        {Math.round(completionPercent)}%
                      </span>
                      <p className="text-xs text-muted mt-0.5">Complete</p>
                    </div>
                  </CircularProgress>

                  {targetRole && (
                    <div className="mt-4 text-center">
                      <p className="text-sm font-medium text-foreground">
                        {targetRole.title}
                      </p>
                      {roadmap?.skill_gap?.estimated_months && (
                        <p className="text-xs text-muted mt-1">
                          Est. {roadmap.skill_gap.estimated_months} months to goal
                        </p>
                      )}
                    </div>
                  )}

                  {!targetRole && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted mb-3">
                        No target role set yet
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/onboarding")}
                      >
                        Set Your Goal
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="animate-slideUp" style={{ animationDelay: "0.1s" }}>
                <CardTitle className="mb-4">Quick Actions</CardTitle>
                <div className="space-y-2">
                  {[
                    {
                      icon: FolderKanban,
                      label: "Browse Projects",
                      href: "/projects",
                      color: "text-primary",
                    },
                    {
                      icon: Users,
                      label: "Find a Mentor",
                      href: "/mentors",
                      color: "text-secondary",
                    },
                    {
                      icon: Settings,
                      label: "Update Skills",
                      href: "/onboarding",
                      color: "text-accent",
                    },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                          <Icon className={cn("h-4 w-4", action.color)} />
                        </div>
                        <span className="text-sm text-foreground">
                          {action.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted ml-auto group-hover:translate-x-1 transition-transform" />
                      </Link>
                    );
                  })}
                </div>
              </Card>

              {/* CV Resume Analyzer */}
              <Card className="animate-slideUp" style={{ animationDelay: "0.2s" }}>
                <CardTitle className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-accent" />
                  CV & Resume ATS Analyzer
                </CardTitle>
                
                <p className="text-xs text-muted mb-4">
                  Upload your CV to verify technical keywords match and get tailored improvements to prevent ATS filters rejection.
                </p>

                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "border border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative",
                    dragActive ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/25 hover:bg-white/[0.02] bg-white/[0.01]",
                    isAnalyzingCV && "pointer-events-none opacity-50"
                  )}
                >
                  <input
                    type="file"
                    id="cv-upload-input"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="cv-upload-input" className="cursor-pointer block">
                    <UploadCloud className="h-9 w-9 text-muted mx-auto mb-2" />
                    <span className="text-sm font-semibold text-foreground block">
                      {cvFile ? cvFile.name : "Select CV file or drop here"}
                    </span>
                    <span className="text-[10px] text-muted mt-1 block">
                      PDF, DOCX, or TXT formats (Max 5MB)
                    </span>
                  </label>
                </div>

                {cvError && (
                  <p className="text-xs text-error mt-3 flex items-center gap-1.5 bg-error/5 p-2.5 border border-error/15 rounded-xl animate-fadeIn">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {cvError}
                  </p>
                )}

                {isAnalyzingCV && (
                  <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-xs text-muted">AI is extracting and auditing your CV...</span>
                  </div>
                )}

                {cvAnalysis && (
                  <div className="mt-6 space-y-6 pt-6 border-t border-white/5 animate-fadeIn">
                    
                    {/* Score Gauge */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div>
                        <span className="text-xs text-muted block font-medium">ATS Match Score</span>
                        <span className="text-sm font-bold text-foreground mt-0.5 block truncate max-w-[170px]">
                          {cvAnalysis.target_role} CV Audit
                        </span>
                      </div>
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 shadow-inner",
                        cvAnalysis.ats_score >= 80 
                          ? "text-success border-success bg-success/5" 
                          : cvAnalysis.ats_score >= 60 
                            ? "text-warning border-warning bg-warning/5" 
                            : "text-error border-error bg-error/5"
                      )}>
                        {cvAnalysis.ats_score}
                      </div>
                    </div>

                    {/* Rejection Risks */}
                    {cvAnalysis.rejection_risks.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-error uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5" />
                          Rejection Risks ({cvAnalysis.rejection_risks.length})
                        </h4>
                        <ul className="space-y-1.5">
                          {cvAnalysis.rejection_risks.map((risk, index) => (
                            <li key={index} className="text-[11px] leading-relaxed text-muted p-2.5 rounded-xl bg-error/5 border border-error/10">
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Keywords */}
                    {cvAnalysis.missing_keywords.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-warning uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Missing Crucial Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {cvAnalysis.missing_keywords.map((kw, index) => (
                            <Badge key={index} variant="warning" className="text-[10px]">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actionable Recommendations */}
                    {cvAnalysis.actionable_recommendations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          Actionable Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {cvAnalysis.actionable_recommendations.map((rec, index) => (
                            <li key={index} className="text-xs text-muted flex items-start gap-2 bg-white/[0.01] p-2 border border-white/5 rounded-xl">
                              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                                {index + 1}
                              </span>
                              <span className="text-[11px] leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Formatting Issues */}
                    {cvAnalysis.formatting_issues.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                          Formatting Alerts
                        </h4>
                        <ul className="space-y-1 pl-3">
                          {cvAnalysis.formatting_issues.map((issue, index) => (
                            <li key={index} className="text-[11px] text-muted list-disc leading-relaxed">
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                )}
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Missing Skills */}
              <Card className="animate-slideUp" style={{ animationDelay: "0.05s" }}>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    Skills to Learn
                  </CardTitle>
                  <span className="text-xs text-muted">
                    {missingSkills.length} remaining
                  </span>
                </div>

                {missingSkills.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-success" />
                    </div>
                    <p className="text-foreground font-medium">
                      You&apos;re on track!
                    </p>
                    <p className="text-sm text-muted mt-1">
                      No missing skills detected. Keep building projects!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {missingSkills.slice(0, 6).map((ms: MissingSkill, idx) => (
                      <div
                        key={ms.skill.id || idx}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {ms.skill.name}
                            </p>
                            {getPriorityBadge(ms.priority)}
                          </div>
                          <p className="text-xs text-muted mt-0.5">
                            Required: {ms.required_proficiency}
                            {ms.current_proficiency &&
                              ` · Current: ${ms.current_proficiency}`}
                          </p>
                        </div>
                      </div>
                    ))}
                    {missingSkills.length > 6 && (
                      <p className="text-xs text-muted text-center pt-2">
                        +{missingSkills.length - 6} more skills
                      </p>
                    )}
                  </div>
                )}
              </Card>

              {/* Recommended Projects */}
              <Card className="animate-slideUp" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-accent" />
                    Recommended Projects
                  </CardTitle>
                  <Link
                    href="/projects"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    View all →
                  </Link>
                </div>

                {recommendedProjects.length === 0 &&
                (roadmap?.recommended_projects?.length ?? 0) === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <FolderKanban className="h-6 w-6 text-muted" />
                    </div>
                    <p className="text-foreground font-medium">
                      No projects yet
                    </p>
                    <p className="text-sm text-muted mt-1">
                      Set your target role to get personalized recommendations.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => router.push("/projects")}
                    >
                      Browse Projects
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(recommendedProjects.length > 0
                      ? recommendedProjects
                      : roadmap?.recommended_projects ?? []
                    )
                      .slice(0, 3)
                      .map((project) => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}/analyze`}
                          className="glass-card glass-card-hover p-4 block"
                        >
                          <div className="flex items-center justify-between mb-3">
                            {getDifficultyBadge(project.difficulty)}
                            {project.career_match_percent !== undefined && (
                              <span className="text-xs font-medium text-primary">
                                {project.career_match_percent}% match
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-1">
                            {project.title}
                          </h4>
                          <p className="text-xs text-muted line-clamp-2 mb-3">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {project.tech_stack.slice(0, 3).map((tech) => (
                              <span
                                key={tech}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted"
                              >
                                {tech}
                              </span>
                            ))}
                            {project.tech_stack.length > 3 && (
                              <span className="text-[10px] text-muted">
                                +{project.tech_stack.length - 3}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Clock className="h-3 w-3" />
                            {project.estimated_hours}h
                          </div>
                        </Link>
                      ))}
                  </div>
                )}
              </Card>

              {/* AI Learning Path */}
              <Card className="animate-slideUp" style={{ animationDelay: "0.15s" }}>
                <button
                  onClick={() => setLearningPathOpen(!learningPathOpen)}
                  className="w-full flex items-center justify-between"
                >
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    AI Learning Path
                  </CardTitle>
                  {learningPathOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted" />
                  )}
                </button>

                {learningPathOpen && (
                  <div className="mt-4 space-y-4 animate-slideDown">
                    {learningPath.length === 0 ? (
                      <div className="text-center py-6">
                        <Zap className="h-8 w-8 text-muted mx-auto mb-2" />
                        <p className="text-sm text-muted">
                          Complete your profile to generate a learning path.
                        </p>
                      </div>
                    ) : (
                      learningPath.map(
                        (step: LearningPathStep, idx: number) => (
                          <div
                            key={idx}
                            className="relative pl-8 pb-4 border-l border-white/10 last:border-l-0 last:pb-0"
                          >
                            <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                              <span className="text-[8px] text-white font-bold">
                                {step.order || idx + 1}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-foreground">
                                {step.title}
                              </h4>
                              <p className="text-xs text-muted mt-1">
                                {step.description}
                              </p>
                              {step.estimated_weeks && (
                                <p className="text-xs text-primary mt-1">
                                  ~{step.estimated_weeks} weeks
                                </p>
                              )}
                              {step.skills && step.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {step.skills.map((s) => (
                                    <Badge
                                      key={s.id}
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {s.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
