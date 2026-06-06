"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn, getTimeGreeting, formatDualCurrency } from "@/lib/utils";
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
  Mentor,
  MentorSession,
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
  Check,
  X,
  DollarSign,
  Award,
  ShieldAlert,
  Calendar,
  Star,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [mentorProfile, setMentorProfile] = useState<Mentor | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [learningPathOpen, setLearningPathOpen] = useState(false);
  const [pendingMentors, setPendingMentors] = useState<Mentor[]>([]);
  const [mentorSessions, setMentorSessions] = useState<MentorSession[]>([]);
  const [mentorReports, setMentorReports] = useState<any[]>([]);

  // Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetMentorId, setReportTargetMentorId] = useState("");
  const [reportTargetMentorName, setReportTargetMentorName] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Session Review States
  const [reviewingSession, setReviewingSession] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingSessionReview, setIsSubmittingSessionReview] = useState(false);

  // Mentor Submissions & Creation Form states
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [reviewingSubmission, setReviewingSubmission] = useState<any | null>(null);
  const [reviewScore, setReviewScore] = useState<number>(8);
  const [reviewFeedback, setReviewFeedback] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Project template creator state
  const [projTitle, setProjTitle] = useState<string>("");
  const [projDesc, setProjDesc] = useState<string>("");
  const [projDifficulty, setProjDifficulty] = useState<string>("beginner");
  const [projTechStack, setProjTechStack] = useState<string>("");
  const [projHours, setProjHours] = useState<number>(40);
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);

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
      setError("");
      try {
        if (user?.email === "durgasravan21@gmail.com") {
          // Admin View: Fetch pending mentors and reports
          const [pending, reports] = await Promise.all([
            api.mentors.getPendingMentors(),
            api.mentors.getReports(),
          ]);
          setPendingMentors(pending || []);
          setMentorReports(reports || []);
        } else {
          // Check if mentor profile exists
          let currentMentor: Mentor | null = null;
          try {
            currentMentor = await api.mentors.getAppStatus();
            setMentorProfile(currentMentor);
          } catch (e: any) {
            // 404 is normal for students who have never applied.
            // If it is a network error (no status code, or Failed to fetch) or other server error, propagate it!
            if (e && e.status === 404) {
              // Ignore 404
            } else {
              throw e;
            }
          }

          if (currentMentor && currentMentor.verification_status === "verified") {
            // Mentor View: Fetch sessions and pending student submissions
            const [sessionsData, submissionsData] = await Promise.all([
              api.mentors.getMySessions(),
              api.projects.getPendingSubmissions(),
            ]);
            setMentorSessions(sessionsData || []);
            setPendingSubmissions(submissionsData || []);
          } else {
            // Student View: Always load student data as fallback or primary (since pending/non-mentors need it)
            const [roadmapData, projectsData, sessionsData] = await Promise.allSettled([
              api.career.getSkillGap(),
              api.projects.getRecommendations(),
              api.mentors.getMySessions(),
            ]);

            if (roadmapData.status === "fulfilled") {
              setRoadmap(roadmapData.value);
            } else {
              const reason = roadmapData.reason;
              if (reason && (!reason.status || reason.status !== 404)) {
                throw reason;
              }
            }

            if (projectsData.status === "fulfilled") {
              setRecommendedProjects(projectsData.value);
            } else {
              const reason = projectsData.reason;
              if (reason && (!reason.status || reason.status !== 404)) {
                throw reason;
              }
            }

            if (sessionsData.status === "fulfilled") {
              setMentorSessions(sessionsData.value || []);
            }
          }
        }
      } catch (err: any) {
        console.error("Dashboard error:", err);
        const apiErr = err as ApiError;
        let msg = apiErr.message || "Failed to load dashboard data";
        if (
          err instanceof TypeError ||
          (err.message && err.message.includes("Failed to fetch")) ||
          err.status === undefined
        ) {
          msg = "Could not connect to the backend server. Please verify the API service is online and reachable.";
        }
        setError(msg);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

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

  const getCooldownStatus = () => {
    if (!mentorProfile || mentorProfile.verification_status !== "rejected" || !mentorProfile.rejected_at) {
      return { isLocked: false, remainingDays: 0 };
    }
    const rejectedDate = new Date(mentorProfile.rejected_at);
    const now = new Date();
    const diffTime = now.getTime() - rejectedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 60) {
      return { isLocked: true, remainingDays: 60 - diffDays };
    }
    return { isLocked: false, remainingDays: 0 };
  };

  const handleAdminApprove = async (mentorId: string, status: "verified" | "rejected" | "suspended") => {
    setError("");
    setSuccess("");
    try {
      await api.mentors.adminApprove(mentorId, status);
      const [pending, reports] = await Promise.all([
        api.mentors.getPendingMentors(),
        api.mentors.getReports(),
      ]);
      setPendingMentors(pending || []);
      setMentorReports(reports || []);
      
      let label = "approved";
      if (status === "rejected") label = "rejected";
      if (status === "suspended") label = "suspended and put on hold";
      setSuccess(`Mentor profile successfully ${label}.`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Action failed.");
    }
  };

  const handleResolveReport = async (reportId: string) => {
    setError("");
    setSuccess("");
    try {
      await api.mentors.resolveReport(reportId);
      const reports = await api.mentors.getReports();
      setMentorReports(reports || []);
      setSuccess("Report resolved successfully.");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to resolve report.");
    }
  };

  const handleOpenReportModal = (mentorId: string | number, mentorName: string) => {
    setReportTargetMentorId(String(mentorId));
    setReportTargetMentorName(mentorName);
    setReportReason("");
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportTargetMentorId) return;
    setIsSubmittingReport(true);
    setError("");
    setSuccess("");
    try {
      await api.mentors.reportMentor(reportTargetMentorId, reportReason.trim());
      setIsReportModalOpen(false);
      setSuccess(`Report on coach ${reportTargetMentorName} submitted successfully for review.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to submit report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSubmitSessionReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSession) return;
    setIsSubmittingSessionReview(true);
    setError("");
    setSuccess("");
    try {
      await api.mentors.submitReview({
        session_id: reviewingSession.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setSuccess("Thank you! Review submitted successfully.");
      setReviewingSession(null);
      setReviewComment("");
      setReviewRating(5);
      
      const sessionsData = await api.mentors.getMySessions();
      setMentorSessions(sessionsData || []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to submit review.");
    } finally {
      setIsSubmittingSessionReview(false);
    }
  };

  const renderAdminDashboard = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "") 
      : "https://durga-career-ai.loca.lt";

    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Platform Admin Dashboard
            </h1>
            <p className="text-muted mt-1">
              Welcome back, Administrator. Approve and manage professional mentor applications.
            </p>
          </div>

          {/* Success / Error Alerts */}
          {success && (
            <div className="mb-6 bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-3 text-success animate-fadeIn">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-error animate-fadeIn">
              <ShieldAlert className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Admin Stats */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="p-6 flex items-center gap-4 bg-white/5 border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-muted block">Pending Applications</span>
                <span className="text-2xl font-bold text-foreground">{pendingMentors.length}</span>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4 bg-white/5 border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-muted block">Platform Admin</span>
                <span className="text-sm font-semibold text-foreground truncate max-w-[200px] block">{user?.email}</span>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4 bg-white/5 border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-muted block">System Health</span>
                <span className="text-sm font-bold text-success flex items-center gap-1">
                  <Check className="h-4 w-4" /> Operational
                </span>
              </div>
            </Card>
          </div>

          {/* Pending Reviews list */}
          <Card className="p-6">
            <CardTitle className="mb-6 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-warning" />
              Applications Requiring Review ({pendingMentors.length})
            </CardTitle>

            {pendingMentors.length === 0 ? (
              <div className="text-center py-16">
                <Check className="h-12 w-12 text-success mx-auto mb-4 bg-success/15 p-2.5 rounded-full" />
                <h3 className="text-lg font-bold text-foreground">All Caught Up!</h3>
                <p className="text-sm text-muted mt-1">There are no pending mentor applications awaiting verification.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col lg:flex-row gap-6 justify-between items-start"
                  >
                    {/* Mentor Details */}
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                          {mentor.mentor_name?.split(" ").map(n => n[0]).join("") || "M"}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-base">{mentor.mentor_name}</h3>
                          <p className="text-xs text-muted mt-0.5">{mentor.corporate_email || "No Corporate Email"}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 text-xs text-muted">
                        <div>
                          <span className="font-medium text-foreground block">Company:</span>
                          <span>{mentor.company_name || "Self-Employed / Not Specified"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground block">Proposed Rate:</span>
                          <span className="text-success font-semibold">{formatDualCurrency(mentor.hourly_rate)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground block">Contact Mobile:</span>
                          <span className="text-foreground">{mentor.mobile_number || "Not provided"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground block">Login Email:</span>
                          <span className="text-foreground">{mentor.email || "Not provided"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground block">LinkedIn Profile:</span>
                          {mentor.linkedin_url ? (
                            <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[250px]">
                              {mentor.linkedin_url}
                            </a>
                          ) : (
                            <span>Not provided</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-foreground block">Github Profile:</span>
                          {mentor.github_url ? (
                            <a href={mentor.github_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[250px]">
                              {mentor.github_url}
                            </a>
                          ) : (
                            <span>Not provided</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">Biography & Background</span>
                        <p className="text-xs text-muted leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">{mentor.bio}</p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">Specialty Expertise Areas</span>
                        <div className="flex flex-wrap gap-1.5">
                          {mentor.expertise.map((exp) => (
                            <Badge key={exp} variant="outline" className="text-[10px]">{exp}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Documents section */}
                      <div className="grid gap-4 sm:grid-cols-2 pt-2">
                        {mentor.selfie_url && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-foreground block">Captured Selfie Verification</span>
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`${apiBaseUrl}${mentor.selfie_url}`} alt="Webcam Selfie" className="object-cover w-full h-full" />
                            </div>
                          </div>
                        )}
                        {mentor.identity_document_url && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-foreground block">ID Document / Passport Scan</span>
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                              {mentor.identity_document_url.endsWith(".pdf") ? (
                                <a href={`${apiBaseUrl}${mentor.identity_document_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1.5">
                                  <FileText className="h-4 w-4" /> View ID Document PDF
                                </a>
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={`${apiBaseUrl}${mentor.identity_document_url}`} alt="ID Document Scan" className="object-cover w-full h-full" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex lg:flex-col gap-3 self-stretch lg:self-start lg:w-48 justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleAdminApprove(mentor.id, "verified")}
                        className="flex-1 bg-success hover:bg-success/80 text-white font-bold"
                      >
                        <Check className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdminApprove(mentor.id, "rejected")}
                        className="flex-1 border-error/30 hover:bg-error/10 text-error font-bold"
                      >
                        <X className="h-4 w-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Reports Under Review */}
          <Card className="p-6 mt-8">
            <CardTitle className="mb-6 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-error" />
              Reports Under Review ({mentorReports.length})
            </CardTitle>

            {mentorReports.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm bg-white/[0.01] rounded-2xl border border-white/5">
                <Check className="h-10 w-10 text-success mx-auto mb-2 bg-success/15 p-2.5 rounded-full" />
                No pending or active mentor reports.
              </div>
            ) : (
              <div className="space-y-6">
                {mentorReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">
                          Reported Mentor: {report.mentor_name || `Mentor #${report.mentor_id}`}
                        </span>
                        <Badge
                          className={
                            report.status === "pending"
                              ? "bg-error/20 text-error border-error/30"
                              : "bg-success/20 text-success border-success/30"
                          }
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted">
                        Submitted by Student: <span className="text-foreground">{report.student_name || `Student #${report.student_id}`}</span> on{" "}
                        {new Date(report.created_at).toLocaleDateString()} at{" "}
                        {new Date(report.created_at).toLocaleTimeString()}
                      </p>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-muted-foreground italic mt-2">
                        &ldquo;{report.reason}&rdquo;
                      </div>
                    </div>

                    <div className="flex gap-2 self-stretch md:self-auto justify-end">
                      {report.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAdminApprove(report.mentor_id, "suspended")}
                            className="bg-error hover:bg-error/80 text-white font-bold"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Suspend Mentor
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveReport(report.id)}
                            className="border-success/30 text-success hover:bg-success/10 font-bold"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Resolve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  };

  // ─── MENTOR COACH DASHBOARD ────────────────────────────────────
  const renderMentorDashboard = () => {
    if (mentorProfile && mentorProfile.verification_status === "suspended") {
      return (
        <div className="min-h-screen bg-background py-16 px-4">
          <div className="max-w-xl mx-auto text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-error/15 flex items-center justify-center mx-auto text-error border border-error/25">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Mentor Profile Suspended
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              Your professional mentor profile has been put on hold by the administrator due to student reports under review.
              Students can no longer find your profile in the marketplace, and you cannot accept bookings or review project submissions at this time.
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-muted-foreground flex flex-col gap-2">
              <p>For inquiries or to resolve this status, please contact the platform administrator at:</p>
              <a href="mailto:durgasravan21@gmail.com" className="text-primary font-bold hover:underline">
                durgasravan21@gmail.com
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Filter sessions
    const pendingBookings = mentorSessions.filter(
      (s) => s.status === "pending" && mentorProfile && String(s.mentor_id) === String(mentorProfile.id)
    );
    const upcomingBookings = mentorSessions.filter((s) => s.status === "confirmed");
    const completedBookings = mentorSessions.filter((s) => s.status === "completed");

    // Calculate mentoring payout details (base rate * hours)
    const baseRate = mentorProfile?.hourly_rate ?? 0;
    const completedHours = completedBookings.reduce((sum, s) => sum + s.duration_minutes / 60, 0);
    const mentoringEarnings = completedHours * baseRate;

    // Calculate project reviews payout details ($15 per review)
    const reviewedCount = mentorProfile?.reviewed_count ?? 0;
    const reviewEarnings = reviewedCount * 15;

    // Total earnings
    const totalEarnings = mentoringEarnings + reviewEarnings;

    const handleUpdateSessionStatus = async (
      sessionId: string | number,
      newStatus: "confirmed" | "cancelled" | "completed"
    ) => {
      setError("");
      setSuccess("");
      try {
        await api.mentors.updateSessionStatus(String(sessionId), newStatus);
        const sessionsData = await api.mentors.getMySessions();
        setMentorSessions(sessionsData || []);
        setSuccess(
          `Mentoring session successfully ${
            newStatus === "confirmed"
              ? "accepted & scheduled"
              : newStatus === "cancelled"
              ? "declined"
              : "completed"
          }.`
        );
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to update session status.");
      }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!projTitle || !projDesc || !projTechStack || !projHours) return;
      setIsCreatingProject(true);
      setError("");
      setSuccess("");
      try {
        const techStackArray = projTechStack
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        await api.projects.create({
          title: projTitle,
          description: projDesc,
          difficulty: projDifficulty,
          estimated_hours: projHours,
          tech_stack: techStackArray,
        });
        setSuccess(`Project "${projTitle}" template created successfully!`);
        setProjTitle("");
        setProjDesc("");
        setProjDifficulty("beginner");
        setProjTechStack("");
        setProjHours(40);
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to create project template.");
      } finally {
        setIsCreatingProject(false);
      }
    };

    const handleReviewSubmission = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!reviewingSubmission) return;
      setIsSubmittingReview(true);
      setError("");
      setSuccess("");
      try {
        await api.projects.reviewSubmission(
          reviewingSubmission.id,
          reviewScore,
          reviewFeedback
        );
        setSuccess("Student project submission reviewed and graded successfully!");
        setReviewingSubmission(null);
        setReviewScore(8);
        setReviewFeedback("");

        // Reload submissions
        const submissionsData = await api.projects.getPendingSubmissions();
        setPendingSubmissions(submissionsData || []);

        // Reload mentor profile status to update reviewed_count (earnings)
        const profileData = await api.mentors.getAppStatus();
        setMentorProfile(profileData);
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to submit project review.");
      } finally {
        setIsSubmittingReview(false);
      }
    };

    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-foreground">
                  Mentor Coach Dashboard
                </h1>
                {mentorProfile && (
                  <Badge
                    className={
                      mentorProfile.verification_status === "verified"
                        ? "bg-success/20 text-success border-success/30"
                        : "bg-warning/20 text-warning border-warning/30"
                    }
                  >
                    {mentorProfile.verification_status === "verified" ? "Verified Expert" : "Under Verification"}
                  </Badge>
                )}
              </div>
              <p className="text-muted mt-1">
                Manage student session requests, review peer submissions, and track your platform earnings.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/mentors/apply")} className="self-start">
              <Settings className="h-4 w-4 mr-2" /> Edit Availability & Rates
            </Button>
          </div>

          {/* Mentor Verification Pending Alert */}
          {mentorProfile && mentorProfile.verification_status === "pending" && (
            <div className="mb-6 bg-warning/10 border border-warning/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-warning flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Mentor Verification Pending Approval</h4>
                  <p className="text-xs text-muted">Your mentor profile is currently being reviewed by the administrator. You can customize your settings and upload project templates, but students cannot book sessions with you until your profile is verified.</p>
                </div>
              </div>
              <Button size="sm" onClick={() => router.push("/mentors/apply")} className="w-full sm:w-auto">
                Complete Verification Checklist
              </Button>
            </div>
          )}

          {/* Success / Error Alerts */}
          {success && (
            <div className="mb-6 bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-3 text-success animate-fadeIn">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-error animate-fadeIn">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Mentor Stats Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="p-6 bg-white/5 border-white/10 flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-muted block">Platform Payouts</span>
                  <span className="text-xl font-bold text-foreground">{formatDualCurrency(totalEarnings)}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5 text-xs text-muted">
                <div className="flex justify-between">
                  <span>Coaching Sessions ({completedHours}h):</span>
                  <span className="font-semibold text-foreground">{formatDualCurrency(mentoringEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peer Code Reviews ({reviewedCount}):</span>
                  <span className="font-semibold text-foreground">{formatDualCurrency(reviewEarnings)}</span>
                </div>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4 bg-white/5 border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-muted block">Confirmed Bookings</span>
                <span className="text-2xl font-bold text-foreground">
                  {upcomingBookings.length} scheduled
                </span>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4 bg-white/5 border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
                <Star className="h-6 w-6 fill-current" />
              </div>
              <div>
                <span className="text-xs text-muted block">Coach Rating</span>
                <span className="text-2xl font-bold text-foreground flex items-center gap-1">
                  {mentorProfile?.rating.toFixed(1) || "0.0"}{" "}
                  <span className="text-xs font-normal text-muted">({mentorProfile?.total_sessions} sessions)</span>
                </span>
              </div>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left/Middle Column (Incoming Requests, Submissions & Project Creator) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Incoming Session Requests */}
              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2 text-warning">
                  <AlertCircle className="h-5 w-5" />
                  Incoming Session Requests ({pendingBookings.length})
                </CardTitle>

                {pendingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted text-sm bg-white/[0.01] rounded-2xl border border-white/5">
                    No new session requests. Keep your profile updated to attract bookings!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBookings.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <h4 className="font-bold text-foreground text-sm">Request from Student #{session.mentee_id}</h4>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted">
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)</span>
                          </div>
                          {session.notes && (
                            <p className="text-xs text-muted mt-2 leading-relaxed bg-white/5 p-2 rounded-lg italic">
                              &ldquo;{session.notes}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateSessionStatus(session.id, "confirmed")}
                            className="flex-1 bg-success hover:bg-success/80 text-white font-bold"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateSessionStatus(session.id, "cancelled")}
                            className="flex-1 border-error/30 hover:bg-error/10 text-error font-bold"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Student Project Code Submissions to Review */}
              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2 text-primary">
                  <FolderKanban className="h-5 w-5" />
                  Student Project Submissions to Review ({pendingSubmissions.length})
                </CardTitle>

                {pendingSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted text-sm bg-white/[0.01] rounded-2xl border border-white/5">
                    <Check className="h-10 w-10 text-success mx-auto mb-2 bg-success/15 p-2.5 rounded-full" />
                    All student code submissions reviewed! Check back later.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{sub.project_title}</h4>
                            <p className="text-xs text-muted mt-0.5">Submitted by Student: {sub.user_name}</p>
                          </div>
                          <Badge variant="outline" className="text-primary self-start sm:self-center">
                            Awaiting Review
                          </Badge>
                        </div>
                        <p className="text-xs text-muted leading-relaxed line-clamp-2 bg-black/20 p-2.5 rounded-lg">
                          {sub.description || "No description provided."}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex gap-4 text-[11px] text-muted">
                            {sub.github_url && (
                              <a
                                href={sub.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <Sparkles className="h-3 w-3" /> GitHub Code
                              </a>
                            )}
                            {sub.portfolio_url && (
                              <a
                                href={sub.portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <BookOpen className="h-3 w-3" /> Live Demo
                              </a>
                            )}
                          </div>
                          <Button size="sm" onClick={() => {
                            setReviewingSubmission(sub);
                            setReviewScore(8);
                            setReviewFeedback("");
                          }}>
                            Review Submission
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Upload / Create Project Template */}
              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-accent" />
                  Upload Project Template
                </CardTitle>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted font-medium">Project Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chat App using WebSockets"
                        value={projTitle}
                        onChange={(e) => setProjTitle(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted font-medium">Difficulty Level</label>
                      <select
                        value={projDifficulty}
                        onChange={(e) => setProjDifficulty(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted font-medium">Tech Stack (comma-separated)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. React, Python, FastAPI, WebSockets"
                        value={projTechStack}
                        onChange={(e) => setProjTechStack(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted font-medium">Estimated Hours to Complete</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={500}
                        value={projHours}
                        onChange={(e) => setProjHours(Number(e.target.value))}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted font-medium">Project Description</label>
                    <textarea
                      required
                      placeholder="Write a clear brief describing the project features, learning objectives, and submission criteria..."
                      value={projDesc}
                      onChange={(e) => setProjDesc(e.target.value)}
                      rows={4}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <Button type="submit" disabled={isCreatingProject} isLoading={isCreatingProject} className="w-full">
                    Upload Template
                  </Button>
                </form>
              </Card>

            </div>

            {/* Right Column (Profile & Schedule) */}
            <div className="space-y-6">
              
              {/* Confirmed Schedule */}
              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-success" />
                  Confirmed Schedule ({upcomingBookings.length})
                </CardTitle>

                {upcomingBookings.length === 0 ? (
                  <p className="text-xs text-muted italic">No upcoming confirmed sessions.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-foreground">Student #{session.mentee_id}</span>
                          <Badge variant="success">Scheduled</Badge>
                        </div>
                        <div className="text-[10px] text-muted space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(session.scheduled_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, "cancelled")}
                            className="flex-1 py-1 rounded bg-error/10 hover:bg-error/20 text-error font-medium transition-colors text-[10px]"
                          >
                            Cancel Call
                          </button>
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, "completed")}
                            className="flex-1 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary font-medium transition-colors text-[10px]"
                          >
                            Mark Done
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Profile Overview Card */}
              <Card className="p-6 space-y-4">
                <CardTitle>Profile Overview</CardTitle>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-muted uppercase tracking-wider block">Billing Company</span>
                    <span className="text-sm font-semibold text-foreground">{mentorProfile?.company_name || "Self-Employed"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase tracking-wider block">Hourly Coaching Rate</span>
                    <span className="text-sm font-bold text-success">{mentorProfile && formatDualCurrency(mentorProfile.hourly_rate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase tracking-wider block">Areas of Expertise</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {mentorProfile?.expertise.map((exp) => (
                        <Badge key={exp} variant="outline" className="text-[10px]">{exp}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-muted uppercase tracking-wider block">Bio Description</span>
                    <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-4">{mentorProfile?.bio}</p>
                  </div>
                </div>
              </Card>

              {/* Completed Sessions history */}
              <Card className="p-6">
                <CardTitle className="mb-4">Session History ({completedBookings.length})</CardTitle>
                {completedBookings.length === 0 ? (
                  <p className="text-xs text-muted italic">No past completed sessions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {completedBookings.slice(0, 5).map((session) => (
                      <div key={session.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-foreground block">Student #{session.mentee_id}</span>
                          <span className="text-muted block mt-0.5">{new Date(session.scheduled_at).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="outline" className="text-success font-medium border-success/20 bg-success/5">
                          Completed
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

            </div>
          </div>
        </div>

        {/* Review Code Submission Modal */}
        {reviewingSubmission && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-slideUp">
              <div>
                <h3 className="text-xl font-bold text-foreground">Review Student Submission</h3>
                <p className="text-xs text-muted mt-1">
                  Grade and provide critical code feedback for <strong>{reviewingSubmission.user_name}</strong> on project: <strong>{reviewingSubmission.project_title}</strong>
                </p>
              </div>

              <form onSubmit={handleReviewSubmission} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium block">
                    GitHub Code Repository Link:
                  </label>
                  <a
                    href={reviewingSubmission.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-mono bg-white/5 px-3 py-2 rounded-xl block truncate"
                  >
                    {reviewingSubmission.github_url}
                  </a>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted">Review Score (1 - 10)</span>
                    <span className="text-primary font-bold">{reviewScore} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(Number(e.target.value))}
                    className="w-full accent-primary bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium">Constructive Code Feedback</label>
                  <textarea
                    required
                    placeholder="Provide detailed feedback on architectural improvements, code cleanliness, performance optimization, and styling..."
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    rows={6}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted">
                    Submitting this review will add a flat incentive of <strong className="text-foreground">$15 ({formatDualCurrency(15)})</strong> to your platform payouts stats.
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setReviewingSubmission(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingReview} isLoading={isSubmittingReview} className="flex-1">
                    Submit Review
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStudentDashboard = () => {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Mentor Application Status Banners */}
          {mentorProfile && mentorProfile.verification_status === "pending" && (
            <div className="mb-6 bg-warning/10 border border-warning/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-warning flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Mentor Application Pending Approval</h4>
                  <p className="text-xs text-muted">Your application for {mentorProfile.company_name || 'Mentor'} is currently being reviewed by the main admin. Complete your verification checklist to activate your profile.</p>
                </div>
              </div>
              <Button size="sm" onClick={() => router.push("/mentors/apply")} className="w-full sm:w-auto">
                Complete Verification Checklist
              </Button>
            </div>
          )}

          {mentorProfile && mentorProfile.verification_status === "verified" && (
            <div className="mb-6 bg-success/10 border border-success/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-success flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Mentor Account Active</h4>
                  <p className="text-xs text-muted font-medium">You are registered as a verified mentor from {mentorProfile.company_name}.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push("/mentors/apply")} className="w-full sm:w-auto border-success/30 hover:bg-success/20 text-foreground font-bold">
                Manage Profile
              </Button>
            </div>
          )}

          {mentorProfile && mentorProfile.verification_status === "rejected" && (() => {
            const { isLocked, remainingDays } = getCooldownStatus();
            return (
              <div className="mb-6 bg-error/10 border border-error/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <XCircle className="h-6 w-6 text-error flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Mentor Application Rejected</h4>
                    {isLocked ? (
                      <p className="text-xs text-muted">
                        Your application to become a mentor was rejected. Re-application is locked for{" "}
                        <span className="text-error font-semibold">{remainingDays} more days</span> (60-day cooldown period).
                      </p>
                    ) : (
                      <p className="text-xs text-muted">
                        Your application to become a mentor was rejected. You can now submit a new application.
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={isLocked}
                  onClick={() => router.push("/mentors/apply")}
                  className={cn(
                    "w-full sm:w-auto font-bold border-none",
                    isLocked
                      ? "bg-white/10 text-muted cursor-not-allowed"
                      : "bg-error hover:bg-error/80 text-white"
                  )}
                >
                  {isLocked ? `Locked (${remainingDays}d)` : "Re-apply as Mentor"}
                </Button>
              </div>
            );
          })()}

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

          {/* Mandatory Session Review Prompt */}
          {(() => {
            const unreviewed = mentorSessions.find(s => s.status === "completed" && !s.is_reviewed);
            if (!unreviewed) return null;
            return (
              <div className="mb-6 bg-primary/10 border border-primary/25 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning flex-shrink-0">
                    <Star className="h-6 w-6 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Mandatory Review Feedback Required</h4>
                    <p className="text-xs text-muted leading-relaxed mt-0.5">
                      You have a completed session with Coach <strong className="text-foreground">{unreviewed.mentor_name || 'Expert'}</strong> that has not been reviewed yet. Leaving reviews helps other students choose the best coaches.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenReportModal(unreviewed.mentor_id, unreviewed.mentor_name || 'Coach')}
                    className="border-error/20 hover:bg-error/10 text-error flex-1 sm:flex-initial"
                  >
                    Report Issue
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setReviewingSession(unreviewed)}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-primary to-secondary text-white font-bold"
                  >
                    Submit Review
                  </Button>
                </div>
              </div>
            );
          })()}

          {error && (
            <div className="mb-6 bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

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

              {/* Coaching Sessions & Bookings */}
              <Card className="animate-slideUp" style={{ animationDelay: "0.2s" }}>
                <CardTitle className="mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Your Coaching Sessions
                </CardTitle>

                {mentorSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted text-sm bg-white/[0.01] rounded-2xl border border-white/5">
                    No sessions booked yet. Book a session with a mentor to get expert guidance!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upcoming */}
                    {mentorSessions.filter(s => s.status === "pending" || s.status === "confirmed").length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Upcoming Sessions</h4>
                        {mentorSessions.filter(s => s.status === "pending" || s.status === "confirmed").map((session) => (
                          <div
                            key={session.id}
                            className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                          >
                            <div>
                              <span className="font-semibold text-foreground block">
                                Coach: {session.mentor_name || `Coach #${session.mentor_id}`}
                              </span>
                              <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-muted">
                                <span>{new Date(session.scheduled_at).toLocaleDateString()}</span>
                                <span>
                                  {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <Badge
                                className={
                                  session.status === "confirmed"
                                    ? "bg-success/20 text-success border-success/30"
                                    : "bg-warning/20 text-warning border-warning/30"
                                }
                              >
                                {session.status}
                              </Badge>
                              <button
                                type="button"
                                onClick={() => handleOpenReportModal(session.mentor_id, session.mentor_name || `Coach #${session.mentor_id}`)}
                                className="border border-error/20 hover:bg-error/10 text-error py-1 px-2.5 text-[10px] rounded-lg font-medium transition-all"
                              >
                                Report
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Completed */}
                    {mentorSessions.filter(s => s.status === "completed" || s.status === "cancelled").length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Session History</h4>
                        {mentorSessions.filter(s => s.status === "completed" || s.status === "cancelled").map((session) => (
                          <div
                            key={session.id}
                            className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                          >
                            <div>
                              <span className="font-semibold text-foreground block">
                                Coach: {session.mentor_name || `Coach #${session.mentor_id}`}
                              </span>
                              <span className="text-muted block mt-0.5 text-[10px]">
                                {new Date(session.scheduled_at).toLocaleDateString()} · {session.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <Badge
                                className={
                                  session.status === "completed"
                                    ? "bg-success/15 text-success border-success/20"
                                    : "bg-white/10 text-muted border-white/10"
                                }
                              >
                                {session.status}
                              </Badge>
                              {session.status === "completed" && !session.is_reviewed && (
                                <button
                                  type="button"
                                  onClick={() => setReviewingSession(session)}
                                  className="bg-primary/20 hover:bg-primary/30 text-primary py-1 px-2.5 text-[10px] rounded-lg font-medium transition-all"
                                >
                                  Leave Review
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenReportModal(session.mentor_id, session.mentor_name || `Coach #${session.mentor_id}`)}
                                className="border border-error/20 hover:bg-error/10 text-error py-1 px-2.5 text-[10px] rounded-lg font-medium transition-all"
                              >
                                Report
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* Report Coach Modal */}
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-slideUp">
              <div>
                <h3 className="text-xl font-bold text-foreground">Report Coach</h3>
                <p className="text-xs text-muted mt-1">
                  Submit a report regarding your experience or issues with coach <strong>{reportTargetMentorName}</strong>.
                </p>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium block">
                    Reason for Report:
                  </label>
                  <textarea
                    required
                    rows={4}
                    minLength={5}
                    maxLength={2000}
                    placeholder="Describe the issue, missed session details, or inappropriate behavior in detail..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted"
                  />
                  <span className="text-[10px] text-muted block">
                    Your report will be reviewed confidentially by the platform administrator.
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingReport || !reportReason.trim()}
                    className="flex-1 bg-error hover:bg-error/80 text-white font-bold"
                  >
                    {isSubmittingReport ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Leave Session Review Modal */}
        {reviewingSession && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-slideUp">
              <div>
                <h3 className="text-xl font-bold text-foreground">Review Mentoring Session</h3>
                <p className="text-xs text-muted mt-1">Leave feedback for {reviewingSession.mentor_name}</p>
              </div>

              <form onSubmit={handleSubmitSessionReview} className="space-y-4">
                {/* Rating Stars */}
                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="transition-transform active:scale-95"
                      >
                        <Star className={`h-8 w-8 ${star <= reviewRating ? "text-warning fill-warning" : "text-muted"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium">Your Review</label>
                  <textarea
                    placeholder="Describe your experience during this mentoring session..."
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setReviewingSession(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingSessionReview || !reviewComment.trim()} className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold">
                    {isSubmittingSessionReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Dynamic Dashboard Router Switching
  if (user?.email === "durgasravan21@gmail.com") {
    return renderAdminDashboard();
  }

  if (
    mentorProfile &&
    (mentorProfile.verification_status === "verified" ||
      mentorProfile.verification_status === "pending" ||
      mentorProfile.verification_status === "suspended")
  ) {
    return renderMentorDashboard();
  }

  return renderStudentDashboard();
}
