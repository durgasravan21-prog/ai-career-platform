"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, TextArea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Project, ProjectFilters, ApiError } from "@/types";
import {
  Search,
  Clock,
  FolderKanban,
  ExternalLink,
  Github,
  Filter,
  X,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Plus,
  CheckCircle2,
} from "lucide-react";

const difficulties = ["all", "beginner", "intermediate", "advanced"] as const;

const techStackOptions = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Python",
  "Django",
  "FastAPI",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "AWS",
  "GraphQL",
  "Vue.js",
  "Go",
  "Rust",
  "TensorFlow",
  "Flutter",
];

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const isMentorOrAdmin =
    user?.role === "mentor" ||
    user?.role === "admin" ||
    user?.email === "durgasravan21@gmail.com";

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitData, setSubmitData] = useState({
    github_url: "",
    demo_url: "",
    description: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Custom Suggestions states
  const [customSuggestions, setCustomSuggestions] = useState<any[]>([]);
  const [sugFeatureName, setSugFeatureName] = useState("");
  const [sugDescription, setSugDescription] = useState("");
  const [sugDifficulty, setSugDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [sugHours, setSugHours] = useState("4");
  const [sugImpact, setSugImpact] = useState("80");
  const [sugCompanies, setSugCompanies] = useState("");
  const [sugLoading, setSugLoading] = useState(false);
  const [sugError, setSugError] = useState("");
  const [sugSuccess, setSugSuccess] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/?login=true");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load custom suggestions when a project is selected
  useEffect(() => {
    if (selectedProject) {
      const loadSuggestions = () => {
        const custom = JSON.parse(
          localStorage.getItem(`mock_suggestions_${selectedProject.id}`) || "[]"
        );
        setCustomSuggestions(custom);
      };
      loadSuggestions();
    } else {
      setCustomSuggestions([]);
    }
  }, [selectedProject]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const filters: ProjectFilters = {
        page,
        limit: 12,
      };
      if (selectedDifficulty !== "all") filters.difficulty = selectedDifficulty;
      if (selectedTech) filters.tech_stack = selectedTech;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const response = await api.projects.getAll(filters);
      setProjects(response.data);
      setTotalPages(response.total_pages);
      setTotalCount(response.total);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to load projects");
      // Fallback demo data
      setProjects([
        {
          id: "1",
          title: "AI-Powered Code Review Tool",
          description: "Build an intelligent code review assistant that analyzes pull requests and provides automated feedback on code quality, security vulnerabilities, and best practices.",
          difficulty: "advanced",
          estimated_hours: 80,
          tech_stack: ["Python", "FastAPI", "React", "OpenAI", "Docker"],
          career_match_percent: 92,
          skills_covered: [],
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Real-time Chat Application",
          description: "Create a full-featured real-time messaging platform with group chats, file sharing, read receipts, and end-to-end encryption.",
          difficulty: "intermediate",
          estimated_hours: 40,
          tech_stack: ["Next.js", "TypeScript", "Socket.io", "PostgreSQL"],
          career_match_percent: 85,
          skills_covered: [],
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Personal Finance Tracker",
          description: "Build a modern personal finance app with transaction categorization, budget planning, expense analytics, and bank API integration.",
          difficulty: "beginner",
          estimated_hours: 24,
          tech_stack: ["React", "Node.js", "MongoDB", "Chart.js"],
          career_match_percent: 78,
          skills_covered: [],
          created_at: new Date().toISOString(),
        },
        {
          id: "4",
          title: "E-Commerce Microservices Platform",
          description: "Design and implement a scalable e-commerce platform using microservices architecture with product catalog, cart, payment, and order services.",
          difficulty: "advanced",
          estimated_hours: 120,
          tech_stack: ["Go", "gRPC", "Docker", "Kubernetes", "PostgreSQL", "Redis"],
          career_match_percent: 88,
          skills_covered: [],
          created_at: new Date().toISOString(),
        },
        {
          id: "5",
          title: "Weather Dashboard with ML Predictions",
          description: "Create a beautiful weather dashboard that displays current conditions and uses machine learning to provide hyper-local weather predictions.",
          difficulty: "intermediate",
          estimated_hours: 35,
          tech_stack: ["Python", "TensorFlow", "React", "D3.js", "FastAPI"],
          career_match_percent: 72,
          skills_covered: [],
          created_at: new Date().toISOString(),
        },
        {
          id: "6",
          title: "Task Management CLI Tool",
          description: "Build a powerful command-line task manager with project organization, priority levels, due dates, and sync across devices.",
          difficulty: "beginner",
          estimated_hours: 16,
          tech_stack: ["Rust", "SQLite", "CLI"],
          career_match_percent: 65,
          skills_covered: [],
          created_at: new Date().toISOString(),
        },
      ]);
      setTotalPages(1);
      setTotalCount(6);
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedDifficulty, selectedTech, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const getCoreFeatures = (project: Project): string[] => {
    const title = project.title.toLowerCase();
    if (title.includes("code review") || title.includes("review tool")) {
      return [
        "Abstract Syntax Tree (AST) Parsing & Analysis",
        "Large Language Model Prompt Construction & Execution",
        "Git Repository Webhook & Event Integration",
        "Automated Line-by-Line Pull Request Annotations",
        "Developer Quality & Security Compliance Reports"
      ];
    }
    if (title.includes("chat")) {
      return [
        "Bidirectional WebSocket Connection & Room Management",
        "Real-time Message Broadcasting & Delivery Confirmation",
        "User Presence Tracking & Typing Status Updates",
        "End-to-End Chat Encryption & Security Layer",
        "Media Attachment & File Upload Management"
      ];
    }
    if (title.includes("finance")) {
      return [
        "Bank Transaction Aggregation & Ledger Registry",
        "Automated Merchant Category Code Classification",
        "Dynamic Budget Planning & Spend Limit Alerts",
        "Interactive Financial Visualization Graphs",
        "Secure OAuth Credit Institution Authentication"
      ];
    }
    if (title.includes("commerce") || title.includes("microservices")) {
      return [
        "Decoupled Microservice API Gateways & Service Discovery",
        "Distributed Cart, Inventory, & Checkout Coordinators",
        "Event-Driven Order Placement & Processing Pipeline",
        "Secure Stripe API Checkout Flow Integration",
        "Resilient Message Broker Notification Engine"
      ];
    }
    if (title.includes("weather") || title.includes("predictions")) {
      return [
        "Real-time Meteorological API Data Ingestion",
        "TensorFlow Weather Prediction Analytics Inference",
        "Interactive Geographical Charts & Dynamic Layers",
        "Historical Weather Data Caching Database",
        "Extreme Weather Alert Notification Hub"
      ];
    }
    if (title.includes("cli")) {
      return [
        "Highly Interactive Command Line Shell Interface",
        "Efficient Local SQLite Schema Persistence",
        "Device-to-Device Authentication & Sync Engine",
        "Flexible Task Scheduling & Cron Reminders",
        "Robust Markdown Task Export Utility"
      ];
    }
    // Generic fallback based on tech stack
    return [
      `Complete ${project.tech_stack.slice(0, 2).join(" & ")} integration framework`,
      "Secure JWT Authentication & Role-Based Access Controls",
      "Modern, Responsive Glassmorphic User Dashboard",
      "Optimized Relational Schema & Indices",
      "Comprehensive Automated Testing Suite"
    ];
  };

  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !sugFeatureName.trim()) return;

    setSugLoading(true);
    setSugError("");
    setSugSuccess(false);

    try {
      const payload = {
        feature_name: sugFeatureName.trim(),
        description: sugDescription.trim() || undefined,
        difficulty: sugDifficulty,
        estimated_hours: Number(sugHours) || 4,
        career_impact_score: Number(sugImpact) || 80,
        companies_that_value: sugCompanies
          ? sugCompanies.split(",").map((c) => c.trim()).filter(Boolean)
          : ["Tech Corp"],
      };

      await api.projects.addSuggestion(selectedProject.id, payload);
      
      // Reload suggestions from localStorage
      const custom = JSON.parse(
        localStorage.getItem(`mock_suggestions_${selectedProject.id}`) || "[]"
      );
      setCustomSuggestions(custom);

      // Reset form
      setSugFeatureName("");
      setSugDescription("");
      setSugDifficulty("medium");
      setSugHours("4");
      setSugImpact("80");
      setSugCompanies("");
      setSugSuccess(true);
      
      // Auto-clear success message
      setTimeout(() => setSugSuccess(false), 3000);
    } catch (err) {
      const apiErr = err as ApiError;
      setSugError(apiErr.message || "Failed to add suggestion");
    } finally {
      setSugLoading(false);
    }
  };

  const handleSubmitProject = async () => {
    if (!selectedProject || !submitData.github_url) return;
    setSubmitLoading(true);
    setSubmitError("");

    try {
      await api.projects.submit({
        project_id: selectedProject.id,
        github_url: submitData.github_url,
        demo_url: submitData.demo_url || undefined,
        description: submitData.description || undefined,
      });
      setShowSubmitModal(false);
      setSubmitData({ github_url: "", demo_url: "", description: "" });
      router.push(`/projects/${selectedProject.id}/analyze`);
    } catch (err) {
      const apiErr = err as ApiError;
      setSubmitError(apiErr.message || "Submission failed");
    } finally {
      setSubmitLoading(false);
    }
  };

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-primary" />
            Projects
          </h1>
          <p className="text-muted mt-1">
            Discover projects that build the skills you need.{" "}
            {totalCount > 0 && (
              <span className="text-foreground">{totalCount} projects</span>
            )}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4 animate-slideUp">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-white/10")}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Difficulty Pills */}
          <div className="flex flex-wrap gap-2">
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  setSelectedDifficulty(diff);
                  setPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                  selectedDifficulty === diff
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-white/5 border-white/10 text-muted hover:text-foreground hover:border-white/20"
                )}
              >
                {diff === "all" ? "All" : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>

          {/* Tech Stack Filter */}
          {showFilters && (
            <div className="glass-card p-4 animate-slideDown">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">
                  Tech Stack
                </p>
                {selectedTech && (
                  <button
                    onClick={() => {
                      setSelectedTech("");
                      setPage(1);
                    }}
                    className="text-xs text-muted hover:text-foreground flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {techStackOptions.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => {
                      setSelectedTech(selectedTech === tech ? "" : tech);
                      setPage(1);
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs transition-colors border",
                      selectedTech === tech
                        ? "bg-secondary/10 border-secondary/30 text-secondary"
                        : "bg-white/5 border-white/10 text-muted hover:text-foreground"
                    )}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
            <p className="text-sm text-warning">
              {error} — Showing demo projects.
            </p>
          </div>
        )}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="h-8 w-8 text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Projects Found
            </h3>
            <p className="text-muted text-sm mb-4">
              Try adjusting your filters or search query.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedDifficulty("all");
                setSelectedTech("");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, idx) => (
                <Card
                  key={project.id}
                  variant="interactive"
                  className="animate-slideUp group"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => handleProjectClick(project)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    {getDifficultyBadge(project.difficulty)}
                    {project.career_match_percent !== undefined && (
                      <span className="text-xs font-semibold text-primary">
                        {project.career_match_percent}% match
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tech_stack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted border border-white/5"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.tech_stack.length > 3 && (
                      <span className="text-xs text-muted">
                        +{project.tech_stack.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {project.estimated_hours}h estimated
                    </div>
                    {!isMentorOrAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setShowSubmitModal(true);
                        }}
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Project Detail Modal */}
      <Dialog
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="lg"
      >
        {selectedProject && (
          <>
            <DialogHeader onClose={() => setShowDetailModal(false)}>
              <DialogTitle>{selectedProject.title}</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {getDifficultyBadge(selectedProject.difficulty)}
                {selectedProject.career_match_percent !== undefined && (
                  <Badge variant="primary">
                    {selectedProject.career_match_percent}% Career Match
                  </Badge>
                )}
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedProject.estimated_hours}h
                </Badge>
              </div>

              <p className="text-foreground leading-relaxed">
                {selectedProject.description}
              </p>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Tech Stack
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tech_stack.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedProject.github_url && (
                <a
                  href={selectedProject.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  View Repository
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {isMentorOrAdmin && (
                <div className="border-t border-white/10 pt-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Core System Features
                    </h4>
                    <ul className="space-y-2 text-sm text-muted bg-white/5 p-4 rounded-xl border border-white/5">
                      {getCoreFeatures(selectedProject).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions List */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Proposed Custom Suggestions & Improvements
                    </h4>
                    {customSuggestions.length === 0 ? (
                      <div className="text-xs text-muted bg-white/5 p-4 rounded-xl text-center border border-white/5 border-dashed">
                        No custom improvements proposed yet for this project. Use the form below to add suggestions!
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {customSuggestions.map((sug, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">{sug.feature_name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={sug.difficulty === "easy" ? "success" : sug.difficulty === "hard" ? "error" : "warning"} className="text-[10px] py-0 px-2 h-4">
                                  {sug.difficulty}
                                </Badge>
                                <span className="text-[10px] text-muted">{sug.estimated_hours}h</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted line-clamp-2">{sug.description}</p>
                            <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-white/5">
                              <span>Impact: <strong className="text-primary">{sug.career_impact_score}</strong></span>
                              <span className="truncate max-w-[200px]">Valued by: {sug.companies_that_value?.join(", ")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Suggestion Form */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-4">
                    <h5 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      Propose an Improvement
                    </h5>

                    {sugSuccess && (
                      <p className="text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
                        Improvement proposed successfully!
                      </p>
                    )}

                    {sugError && (
                      <p className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                        {sugError}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Feature Name"
                        placeholder="e.g., Auth0 Integration"
                        value={sugFeatureName}
                        onChange={(e) => setSugFeatureName(e.target.value)}
                        required
                        className="text-xs"
                      />
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Difficulty
                        </label>
                        <select
                          value={sugDifficulty}
                          onChange={(e) => setSugDifficulty(e.target.value as any)}
                          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <TextArea
                      label="Description"
                      placeholder="Detail the technical additions, features to build..."
                      value={sugDescription}
                      onChange={(e) => setSugDescription(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Est. Hours"
                        type="number"
                        min="1"
                        value={sugHours}
                        onChange={(e) => setSugHours(e.target.value)}
                        required
                        className="text-xs"
                      />
                      <Input
                        label="Career Impact Score (1-100)"
                        type="number"
                        min="1"
                        max="100"
                        value={sugImpact}
                        onChange={(e) => setSugImpact(e.target.value)}
                        required
                        className="text-xs"
                      />
                      <Input
                        label="Target Companies"
                        placeholder="e.g. Google, Stripe"
                        value={sugCompanies}
                        onChange={(e) => setSugCompanies(e.target.value)}
                        className="text-xs"
                        helperText="Comma separated"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="button"
                        onClick={handleAddSuggestion}
                        disabled={!sugFeatureName.trim()}
                        isLoading={sugLoading}
                        size="sm"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Improvement
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDetailModal(false);
                  router.push(`/projects/${selectedProject.id}/analyze`);
                }}
              >
                <GitBranch className="h-4 w-4 mr-1" />
                Analyze Standards
              </Button>
              {!isMentorOrAdmin && (
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowSubmitModal(true);
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Submit My Work
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* Submit Project Modal */}
      <Dialog
        open={showSubmitModal}
        onClose={() => {
          setShowSubmitModal(false);
          setSubmitError("");
        }}
      >
        <DialogHeader
          onClose={() => {
            setShowSubmitModal(false);
            setSubmitError("");
          }}
        >
          <DialogTitle>Submit Your Project</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {selectedProject && (
            <div className="glass-card p-3 mb-2">
              <p className="text-sm font-medium text-foreground">
                {selectedProject.title}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {selectedProject.difficulty} · {selectedProject.estimated_hours}h
              </p>
            </div>
          )}
          <Input
            label="GitHub Repository URL"
            placeholder="https://github.com/you/project"
            value={submitData.github_url}
            onChange={(e) =>
              setSubmitData({ ...submitData, github_url: e.target.value })
            }
            icon={<Github className="h-4 w-4" />}
          />
          <Input
            label="Demo URL (optional)"
            placeholder="https://your-demo.vercel.app"
            value={submitData.demo_url}
            onChange={(e) =>
              setSubmitData({ ...submitData, demo_url: e.target.value })
            }
            icon={<ExternalLink className="h-4 w-4" />}
          />
          <TextArea
            label="Description (optional)"
            placeholder="Tell us about your implementation..."
            value={submitData.description}
            onChange={(e) =>
              setSubmitData({ ...submitData, description: e.target.value })
            }
            rows={3}
          />
          {submitError && (
            <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowSubmitModal(false);
              setSubmitError("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitProject}
            disabled={!submitData.github_url}
            isLoading={submitLoading}
          >
            Submit & Analyze
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
