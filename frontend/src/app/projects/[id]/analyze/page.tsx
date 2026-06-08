"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress, CircularProgress } from "@/components/ui/progress";
import { SkeletonCard, Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { Project, ProjectAnalysis, ApiError } from "@/types";
import {
  ArrowLeft,
  Sparkles,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileCode2,
  Cpu,
  Bookmark,
  Share2,
} from "lucide-react";

export default function ProjectAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (key: string) => {
    setFlippedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("saved_projects") || "[]");
      setIsSaved(saved.includes(projectId));
    }
  }, [projectId]);

  const handleSaveProject = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("saved_projects") || "[]");
      let updatedSaved: string[];
      if (saved.includes(projectId)) {
        updatedSaved = saved.filter((id: string) => id !== projectId);
        setIsSaved(false);
        setSuccessMsg("Project removed from saved list.");
      } else {
        updatedSaved = [...saved, projectId];
        setIsSaved(true);
        setSuccessMsg("Project saved to your list!");
      }
      localStorage.setItem("saved_projects", JSON.stringify(updatedSaved));
    } catch (err) {
      setError("Failed to save project.");
    }
  };

  const handleShareDetails = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setSuccessMsg("Copied share link to clipboard!");
      }
    } catch (err) {
      setError("Failed to copy link to clipboard.");
    }
  };

  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [projData, analysisData] = await Promise.all([
          api.projects.getById(projectId),
          api.projects.getAnalysis(projectId),
        ]);
        setProject(projData);
        setAnalysis(analysisData);
        if (analysisData && analysisData.github_url) {
          setGithubUrl(analysisData.github_url);
        } else if (projData.github_url) {
          setGithubUrl(projData.github_url);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load project analysis data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    setIsAnalyzing(true);
    setError("");
    setSuccessMsg("");
    try {
      const result = await api.projects.analyzeGithub(projectId, githubUrl);
      setAnalysis(result);
      setSuccessMsg("Repository analyzed successfully by AI!");
      
      // Update github_url in project state locally
      if (project) {
        setProject({ ...project, github_url: githubUrl });
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to run GitHub analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48 rounded" />
          <div className="grid gap-6 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Failed to Load Project</h2>
          <p className="text-muted mt-2">{error}</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push("/projects")}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const gradeColors: Record<string, string> = {
    A: "text-success border-success/30 bg-success/5",
    B: "text-primary border-primary/30 bg-primary/5",
    C: "text-warning border-warning/30 bg-warning/5",
    D: "text-error border-error/30 bg-error/5",
    F: "text-error border-error/50 bg-error/10",
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </Link>
        </div>

        {/* Global Success / Error Banners */}
        {successMsg && (
          <div className="mb-6 bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-3 text-success animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-error animate-fadeIn">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-error" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{project?.title}</h1>
              {project?.difficulty && (
                <Badge variant={project.difficulty === "beginner" ? "success" : project.difficulty === "intermediate" ? "warning" : "error"}>
                  {project.difficulty}
                </Badge>
              )}
            </div>
            <p className="text-muted mt-2 max-w-2xl">{project?.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isSaved ? "default" : "outline"}
              size="sm"
              onClick={handleSaveProject}
              className={isSaved ? "bg-gradient-to-r from-primary to-secondary text-white font-semibold border-transparent" : ""}
            >
              <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save Project"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareDetails}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Details
            </Button>
          </div>
        </div>

        {/* GitHub Repository Form */}
        <Card className="mb-8 p-6">
          <CardTitle className="flex items-center gap-2 mb-4 text-lg">
            <GitBranch className="h-5 w-5 text-primary" />
            GitHub Repository Analysis
          </CardTitle>
          <form onSubmit={handleRunAnalysis} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="https://github.com/yourusername/project-repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={isAnalyzing}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={isAnalyzing || !githubUrl.trim()} isLoading={isAnalyzing}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isAnalyzing ? "Analyzing Code..." : "Run AI Analysis"}
            </Button>
          </form>
          {successMsg && <p className="text-xs text-success mt-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{successMsg}</p>}
          {error && <p className="text-xs text-error mt-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{error}</p>}
        </Card>

        {/* Scores & Metrics Grid */}
        {analysis && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Portfolio Grade */}
              <div 
                className="w-full h-[230px] perspective-1000 group cursor-pointer"
                onClick={() => toggleFlip('grade')}
              >
                <div className={`w-full h-full flip-card-inner relative duration-700 preserve-3d ${flippedCards['grade'] ? '[transform:rotateY(180deg)]' : 'group-hover:[transform:rotateY(180deg)]'}`}>
                  
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-xs text-muted uppercase tracking-wider mb-2 font-medium">Portfolio Grade</p>
                      <div className={`w-24 h-24 rounded-full border flex items-center justify-center text-4xl font-extrabold shadow-lg ${gradeColors[analysis.portfolio_grade] || "text-foreground"}`}>
                        {analysis.portfolio_grade}
                      </div>
                      <p className="text-xs text-muted mt-3">Reflects general code quality & readiness</p>
                    </Card>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl glass-card rotate-y-180 backface-hidden overflow-hidden flex flex-col justify-end p-5 border border-white/10 shadow-2xl">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-75 transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url('/images/portfolio_badge.png')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <div className="relative z-10 space-y-2 text-left">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Portfolio Grade Details
                      </h3>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Your codebase rates a solid <strong className="text-success">{analysis.portfolio_grade}</strong> based on production readiness, structure, and readability.
                      </p>
                      <span className="text-[9px] text-primary flex items-center gap-1">
                        Click card to flip back
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Problem Clarity */}
              <div 
                className="w-full h-[230px] perspective-1000 group cursor-pointer"
                onClick={() => toggleFlip('clarity')}
              >
                <div className={`w-full h-full flip-card-inner relative duration-700 preserve-3d ${flippedCards['clarity'] ? '[transform:rotateY(180deg)]' : 'group-hover:[transform:rotateY(180deg)]'}`}>
                  
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-xs text-muted uppercase tracking-wider mb-4 font-medium">Problem Clarity</p>
                      <CircularProgress value={analysis.problem_clarity * 10} size={100} strokeWidth={8} className="text-primary">
                        <span className="text-xl font-bold text-foreground">{analysis.problem_clarity}/10</span>
                      </CircularProgress>
                      <p className="text-xs text-muted mt-3">Documentation & architecture design</p>
                    </Card>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl glass-card rotate-y-180 backface-hidden overflow-hidden flex flex-col justify-end p-5 border border-white/10 shadow-2xl">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-75 transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url('/images/clarity_flow.png')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <div className="relative z-10 space-y-2 text-left">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <GitBranch className="h-4 w-4 text-primary animate-pulse" /> Clarity & Documentation
                      </h3>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Scored at <strong className="text-primary">{analysis.problem_clarity}/10</strong>. Evaluates README detail, setup instructions, architecture structure, and schema clarity.
                      </p>
                      <span className="text-[9px] text-primary flex items-center gap-1">
                        Click card to flip back
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Technical Complexity */}
              <div 
                className="w-full h-[230px] perspective-1000 group cursor-pointer"
                onClick={() => toggleFlip('complexity')}
              >
                <div className={`w-full h-full flip-card-inner relative duration-700 preserve-3d ${flippedCards['complexity'] ? '[transform:rotateY(180deg)]' : 'group-hover:[transform:rotateY(180deg)]'}`}>
                  
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-xs text-muted uppercase tracking-wider mb-4 font-medium">Technical Complexity</p>
                      <CircularProgress value={analysis.technical_complexity * 10} size={100} strokeWidth={8} className="text-secondary">
                        <span className="text-xl font-bold text-foreground">{analysis.technical_complexity}/10</span>
                      </CircularProgress>
                      <p className="text-xs text-muted mt-3">Algorithms, dependencies & logic depth</p>
                    </Card>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl glass-card rotate-y-180 backface-hidden overflow-hidden flex flex-col justify-end p-5 border border-white/10 shadow-2xl">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-75 transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url('/images/complexity_chip.png')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <div className="relative z-10 space-y-2 text-left">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Cpu className="h-4 w-4 text-secondary animate-pulse" /> Code Complexity Insights
                      </h3>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Scored at <strong className="text-secondary">{analysis.technical_complexity}/10</strong>. Assesses business logic modularity, algorithmic depth, security safety, and package hygiene.
                      </p>
                      <span className="text-[9px] text-secondary flex items-center gap-1">
                        Click card to flip back
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Career Relevance */}
              <div 
                className="w-full h-[230px] perspective-1000 group cursor-pointer"
                onClick={() => toggleFlip('relevance')}
              >
                <div className={`w-full h-full flip-card-inner relative duration-700 preserve-3d ${flippedCards['relevance'] ? '[transform:rotateY(180deg)]' : 'group-hover:[transform:rotateY(180deg)]'}`}>
                  
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full backface-hidden">
                    <Card className="w-full h-full flex flex-col justify-center p-6">
                      <p className="text-xs text-muted uppercase tracking-wider mb-4 font-medium text-center md:text-left">Career Relevance</p>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-muted">Job Match Score</span>
                          <span className="text-accent">{analysis.career_relevance}%</span>
                        </div>
                        <Progress value={analysis.career_relevance} className="h-3" />
                        <p className="text-xs text-muted">Alignment with target role criteria</p>
                      </div>
                    </Card>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl glass-card rotate-y-180 backface-hidden overflow-hidden flex flex-col justify-end p-5 border border-white/10 shadow-2xl">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-75 transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url('/images/career_growth.png')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <div className="relative z-10 space-y-2 text-left">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-accent animate-pulse" /> Career Fit Analytics
                      </h3>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Rated at <strong className="text-accent">{analysis.career_relevance}%</strong> match. Reflects direct alignment against required skills lists posted by tier-1 tech recruiters.
                      </p>
                      <span className="text-[9px] text-accent flex items-center gap-1">
                        Click card to flip back
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Analysis Detail Breakdown */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Summary and Improvements */}
              <div className="md:col-span-2 space-y-6">
                <Card className="p-6">
                  <CardTitle className="mb-4 text-lg">AI Feedback Summary</CardTitle>
                  <p className="text-sm leading-relaxed text-muted">{analysis.reasoning}</p>
                </Card>

                <Card className="p-6">
                  <CardTitle className="mb-4 text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Recommended Improvements
                  </CardTitle>
                  {analysis.missing_improvements.length === 0 ? (
                    <p className="text-sm text-success flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Excellent! No missing improvements detected.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {analysis.missing_improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                          <div className="w-5 h-5 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-sm text-foreground">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              {/* Upgrade Suggestions */}
              <div className="space-y-6">
                <Card className="p-6">
                  <CardTitle className="mb-4 text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    AI-Powered Upgrade Path
                  </CardTitle>
                  <p className="text-xs text-muted mb-4">Add these features to boost your project score and land interviews.</p>
                  
                  <div className="space-y-4">
                    {analysis.upgrade_suggestions.map((upgrade, index) => (
                      <div key={index} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-foreground">{upgrade.feature_name}</h4>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {upgrade.difficulty}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{upgrade.description}</p>
                        
                        <div className="flex justify-between items-center pt-2 text-[10px] text-muted border-t border-white/5">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {upgrade.estimated_hours}h</span>
                          <span className="text-primary font-medium">+{upgrade.career_impact_score}% Impact</span>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {upgrade.companies_that_value.map((company) => (
                            <span key={company} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
