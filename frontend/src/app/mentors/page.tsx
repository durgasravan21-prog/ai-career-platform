"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDualCurrency, getMentorPriceDetails } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SkeletonCard, Skeleton } from "@/components/ui/skeleton";
import type { Mentor, MentorSession, MentorMatch, Project, ApiError } from "@/types";
import {
  Users,
  Search,
  Star,
  Sparkles,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  ChevronRight,
  BookOpen,
  Linkedin,
  Github,
  Mail,
  Phone,
  Shield,
  Lock,
  UploadCloud,
  Video,
  VideoOff,
  X,
  XCircle,
} from "lucide-react";

export default function MentorsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.email === "durgasravan21@gmail.com";
  // States
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [matches, setMatches] = useState<MentorMatch[]>([]);
  
  // Loading & error
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("all");
  const [maxPrice, setMaxPrice] = useState(150);
  const [minRating, setMinRating] = useState<number>(0);
  const [minExperience, setMinExperience] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [onlineSessionsOnly, setOnlineSessionsOnly] = useState(false);

  // Modal controls
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [notes, setNotes] = useState("");

  // Admin Price Edit states
  const [adminEditPrice, setAdminEditPrice] = useState("");
  const [adminPriceLoading, setAdminPriceLoading] = useState(false);
  const [adminPriceSuccess, setAdminPriceSuccess] = useState(false);
  const [adminPriceError, setAdminPriceError] = useState("");

  // Review states
  const [reviewingSession, setReviewingSession] = useState<MentorSession | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Report states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetMentorId, setReportTargetMentorId] = useState("");
  const [reportTargetMentorName, setReportTargetMentorName] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportFileBase64, setReportFileBase64] = useState<string>("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReportFile(null);
      setReportFileBase64("");
    }
  };

  const handleOpenReportModal = (mentorId: string | number, mentorName: string) => {
    setReportTargetMentorId(String(mentorId));
    setReportTargetMentorName(mentorName);
    setReportReason("");
    setReportFile(null);
    setReportFileBase64("");
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportTargetMentorId || !reportFileBase64) return;
    setIsSubmittingReport(true);
    setError("");
    setSuccess("");
    try {
      await api.mentors.reportMentor(reportTargetMentorId, reportReason.trim(), reportFileBase64);
      setIsReportModalOpen(false);
      setSuccess(`Report on coach ${reportTargetMentorName} submitted successfully with proof screenshot.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to submit report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Tabs: 'marketplace' | 'sessions'
  const [activeTab, setActiveTab] = useState<"marketplace" | "sessions">("marketplace");

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [mentorsData, sessionsData, projectsData] = await Promise.all([
          api.mentors.getAll(),
          api.mentors.getMySessions(),
          api.projects.getAll().then(res => res.data),
        ]);
        
        // Handle paginated vs list responses safely
        setMentors(Array.isArray(mentorsData) ? mentorsData : (mentorsData as any).data || []);
        setSessions(sessionsData || []);
        setProjects(projectsData || []);
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load mentor marketplace data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Update edit price state when modal is opened
  useEffect(() => {
    if (bookingMentor) {
      setAdminEditPrice(String(bookingMentor.hourly_rate));
      setAdminPriceSuccess(false);
      setAdminPriceError("");
    }
  }, [bookingMentor]);

  // AI Matching Request
  const handleAiMatch = async () => {
    setIsMatching(true);
    setError("");
    setMatches([]);
    try {
      const matchResults = await api.mentors.match();
      setMatches(matchResults);
      if (matchResults.length === 0) {
        setError("No highly compatible AI matches found at this time. Try updating your skills!");
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "AI Mentor Matching failed.");
    } finally {
      setIsMatching(false);
    }
  };

  const handleAdminUpdatePrice = async () => {
    if (!bookingMentor || !adminEditPrice) return;
    setAdminPriceLoading(true);
    setAdminPriceError("");
    setAdminPriceSuccess(false);
    try {
      await api.mentors.adminUpdatePrice(bookingMentor.id, parseFloat(adminEditPrice));
      setAdminPriceSuccess(true);
      // Update local mentors list
      const updated = mentors.map(m => {
        if (String(m.id) === String(bookingMentor.id)) {
          return { ...m, hourly_rate: parseFloat(adminEditPrice), price_edited_by_admin: true };
        }
        return m;
      });
      setMentors(updated);
    } catch (err: any) {
      setAdminPriceError(err.message || "Failed to update price");
    } finally {
      setAdminPriceLoading(false);
    }
  };

  const handleOpenBookingModal = (mentor: Mentor) => {
    if (user?.role === "mentor") {
      setError("Mentors are not allowed to book sessions.");
      return;
    }
    const unreviewed = sessions.find(s => s.status === "completed" && !s.is_reviewed);
    if (unreviewed) {
      setError(`Mandatory Feedback Required: You must submit a review for your completed session with Coach ${unreviewed.mentor_name || 'Expert'} before booking a new session.`);
      setReviewingSession(unreviewed);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBookingMentor(mentor);
  };

  // Submit Booking
  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingMentor || !selectedDate || !selectedTime) return;

    setIsBooking(true);
    setError("");
    setSuccess("");
    try {
      const scheduledAt = `${selectedDate}T${selectedTime}:00Z`;
      await api.mentors.bookSession({
        mentor_id: bookingMentor.id,
        scheduled_at: scheduledAt,
        duration_minutes: 60,
        project_id: selectedProject || undefined,
        notes: notes || undefined,
      });

      setSuccess(`Mentoring session booked successfully with ${bookingMentor.mentor_name || bookingMentor.name}!`);
      setBookingMentor(null);
      setSelectedDate("");
      setSelectedTime("");
      setSelectedProject("");
      setNotes("");
      
      // Reload sessions list
      const sessionsData = await api.mentors.getMySessions();
      setSessions(sessionsData);
      setActiveTab("sessions");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to book session.");
    } finally {
      setIsBooking(false);
    }
  };

  // Submit Review
  const handleReviewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSession) return;

    setIsReviewing(true);
    setError("");
    setSuccess("");
    try {
      await api.mentors.submitReview({
        session_id: reviewingSession.id,
        rating,
        comment,
      });

      setSuccess("Thank you! Review submitted successfully.");
      setReviewingSession(null);
      setComment("");
      setRating(5);
      
      // Reload sessions list
      const sessionsData = await api.mentors.getMySessions();
      setSessions(sessionsData);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to submit review.");
    } finally {
      setIsReviewing(false);
    }
  };

  // Filter Logic
  const filteredMentors = mentors.filter((mentor) => {
    const nameStr = mentor.mentor_name || mentor.name || "";
    const bioStr = mentor.bio || "";
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bioStr.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesExpertise = selectedExpertise === "all" || 
      (mentor.expertise || []).some(e => e.toLowerCase().includes(selectedExpertise.toLowerCase()));

    const matchesPrice = (mentor.hourly_rate || 0) <= maxPrice;

    const matchesRating = mentor.rating >= minRating;

    // Parse experience from bio or use custom property if available
    const yearsOfExp = mentor.experience_years || 
      (mentor.bio.match(/(\d+)\+?\s*years/)?.[1] ? parseInt(mentor.bio.match(/(\d+)\+?\s*years/)![1]) : 5);
    
    let matchesExperience = true;
    if (minExperience === "1-3") {
      matchesExperience = yearsOfExp >= 1 && yearsOfExp <= 3;
    } else if (minExperience === "4-7") {
      matchesExperience = yearsOfExp >= 4 && yearsOfExp <= 7;
    } else if (minExperience === "8+") {
      matchesExperience = yearsOfExp >= 8;
    }

    let matchesTime = true;
    if (selectedDay !== "all") {
      const availDays = (mentor.availability || []).map(a => String(a.day_of_week));
      if (selectedDay === "weekday") {
        matchesTime = (mentor.availability || []).some(a => a.day_of_week >= 1 && a.day_of_week <= 5);
      } else if (selectedDay === "weekend") {
        matchesTime = (mentor.availability || []).some(a => a.day_of_week === 0 || a.day_of_week === 6);
      } else {
        matchesTime = availDays.includes(selectedDay);
      }
    }

    const matchesOnlineStatus = !onlineSessionsOnly || mentor.video_calls_active !== false;

    return matchesSearch && matchesExpertise && matchesPrice && matchesRating && matchesExperience && matchesTime && matchesOnlineStatus;
  });

  // Unique expertise list for filtering
  const allExpertiseAreas = Array.from(
    new Set(mentors.flatMap((m) => m.expertise))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-96 rounded-xl" />
          <div className="grid gap-6 md:grid-cols-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mentor Marketplace</h1>
            <p className="text-muted mt-1">Book 1-on-1 sessions with industry experts tailored to your career roadmap.</p>
          </div>

          {/* Tab switches & Apply Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("marketplace")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "marketplace" ? "bg-primary text-white" : "text-muted hover:text-foreground"}`}
              >
                Browse Mentors
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "sessions" ? "bg-primary text-white" : "text-muted hover:text-foreground"}`}
              >
                My Bookings ({sessions.length})
              </button>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {success && (
          <div className="mb-6 bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-3 text-success animate-fadeIn">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-error animate-fadeIn">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {activeTab === "marketplace" ? (
          <div className="space-y-8">
            
            {/* AI Coach Match Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/25 border border-primary/30 text-primary text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                  AI Matching
                </div>
                <h3 className="text-xl font-bold text-foreground">Find Your Perfect Mentor Match</h3>
                <p className="text-sm text-muted">Let our AI analyze your missing skill gaps and active projects to find the mentors best suited to help you level up.</p>
              </div>
              <Button onClick={handleAiMatch} disabled={isMatching} className="w-full md:w-auto shadow-lg shadow-primary/25">
                <Sparkles className="h-4 w-4 mr-2" />
                {isMatching ? "Finding Matches..." : "Request AI Match"}
              </Button>
            </div>

            {/* AI Match Results */}
            {matches.length > 0 && (
              <div className="space-y-4 animate-slideUp">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Top AI Matches
                </h3>
                <div className="grid gap-6 md:grid-cols-3">
                  {matches.slice(0, 3).map((match, idx) => (
                    <Card key={idx} className="relative overflow-hidden border-primary/30 bg-primary/5 p-6 space-y-4">
                      <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {match.match_score}% Match
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {match.mentor.mentor_name?.split(" ").map(n => n[0]).join("") || "M"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-foreground">{match.mentor.mentor_name}</h4>
                            {match.mentor.video_calls_active === false && (
                              <Badge variant="default" className="bg-error/20 text-error border-error/30 text-[10px] py-0.5 font-bold">
                                🚫 Inactive
                              </Badge>
                            )}
                          </div>
                          {match.mentor.hourly_rate === 0 ? (
                            <p className="text-xs text-success">Free (Passion Service)</p>
                          ) : (
                            <p className="text-xs text-muted flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span>Hourly Rate:</span>
                              <span className="line-through opacity-60">
                                {formatDualCurrency(getMentorPriceDetails(match.mentor.hourly_rate, match.mentor.original_price).originalRate)}
                              </span>
                              <span className="text-primary font-bold">
                                {formatDualCurrency(getMentorPriceDetails(match.mentor.hourly_rate, match.mentor.original_price).currentRate)}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted italic leading-relaxed">&ldquo;{match.reasoning}&rdquo;</p>
                      {user && String(match.mentor.user_id) === String(user.id) ? (
                        <div className="text-center py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-primary font-semibold">
                          This is You
                        </div>
                      ) : user?.role === "mentor" ? (
                        <div className="text-center py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-muted font-semibold">
                          Mentors cannot book sessions
                        </div>
                      ) : isAdmin ? (
                        <Button size="sm" variant="outline" onClick={() => setBookingMentor(match.mentor)} className="w-full">
                          View Profile
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleOpenBookingModal(match.mentor)} className="w-full">
                          Book Session Now
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Filter and Browse Section */}
            <div className="grid gap-8 lg:grid-cols-4">
              
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="p-6 space-y-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                  <CardTitle className="text-base">Filters</CardTitle>
                  
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted font-medium">Search</label>
                    <Input
                      placeholder="Name, bio keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>

                  {/* Expertise */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted font-medium">Expertise Area</label>
                    <select
                      value={selectedExpertise}
                      onChange={(e) => setSelectedExpertise(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">All Specialties</option>
                      {allExpertiseAreas.map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>

                  {/* Hourly Rate */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted">Max Hourly Rate</span>
                      <span className="text-foreground">${maxPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="250"
                      step="10"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-primary bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Minimum Rating */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted font-medium">Minimum Rating</label>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="0">All Ratings</option>
                      <option value="4.5">4.5+ Stars</option>
                      <option value="4.8">4.8+ Stars</option>
                      <option value="5.0">5.0 Stars</option>
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted font-medium">Experience Level</label>
                    <select
                      value={minExperience}
                      onChange={(e) => setMinExperience(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">All Experience Levels</option>
                      <option value="1-3">1 - 3 Years</option>
                      <option value="4-7">4 - 7 Years</option>
                      <option value="8+">8+ Years</option>
                    </select>
                  </div>

                  {/* Availability */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted font-medium">Availability Day</label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">Any Day</option>
                      <option value="weekday">Weekdays (Mon - Fri)</option>
                      <option value="weekend">Weekends (Sat - Sun)</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                      <option value="0">Sunday</option>
                    </select>
                  </div>

                  {/* Online Sessions Only */}
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onlineSessionsOnly}
                        onChange={(e) => setOnlineSessionsOnly(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-border bg-surface text-primary focus:ring-primary accent-primary"
                      />
                      <span className="text-xs text-muted font-medium">Online Sessions Only</span>
                    </label>
                    <p className="text-[10px] text-muted-foreground pl-7">
                      Only show mentors currently active to take video calls.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Mentors Grid */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted">Showing {filteredMentors.length} mentors</p>
                </div>

                {filteredMentors.length === 0 ? (
                  <div className="text-center py-16 glass-card">
                    <Users className="h-12 w-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">No Mentors Found</h3>
                    <p className="text-sm text-muted mt-1">Try broadening your search or filter keywords.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {filteredMentors.map((mentor) => (
                      <Card key={mentor.id} className="p-6 flex flex-col justify-between space-y-5">
                        <div className="space-y-4">
                          
                          {/* Profile Header */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/25 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                              {mentor.mentor_name?.split(" ").map(n => n[0]).join("") || "M"}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-foreground text-base">{mentor.mentor_name}</h4>
                                {mentor.mentor_id && (
                                  <span className="text-[10px] bg-white/5 text-muted/60 border border-white/10 px-1.5 py-0.5 rounded-md font-mono">
                                    {mentor.mentor_id}
                                  </span>
                                )}
                                {mentor.video_calls_active === false && (
                                  <Badge variant="default" className="bg-error/20 text-error border-error/30 text-[10px] py-0.5 font-bold">
                                    🚫 Inactive
                                  </Badge>
                                )}
                                {mentor.has_premium_subscription && (
                                  <Badge variant="default" className="bg-accent/20 text-accent border-accent/30 text-[10px] py-0.5 font-bold">
                                    🔥 Group Sessions
                                  </Badge>
                                )}
                                {user && String(mentor.user_id) === String(user.id) && (
                                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0.5">This is You</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1 text-warning text-xs font-semibold">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                {mentor.rating.toFixed(1)}
                                <span className="text-muted font-normal">({mentor.total_sessions} sessions)</span>
                              </div>
                            </div>
                          </div>

                          {/* Bio */}
                          <p className="text-xs text-muted leading-relaxed line-clamp-3">{mentor.bio}</p>

                          {/* Expertise Tags */}
                          <div className="flex flex-wrap gap-1.5">
                            {mentor.expertise.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Bottom booking block */}
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-muted uppercase tracking-wider block">Price per hour</span>
                            {mentor.hourly_rate === 0 ? (
                              <span className="text-sm font-bold text-success">Free (Passion Service)</span>
                            ) : (
                              <div className="flex flex-col items-start">
                                <span className="text-[11px] text-muted/60 line-through leading-none mb-0.5">
                                  {formatDualCurrency(getMentorPriceDetails(mentor.hourly_rate, mentor.original_price).originalRate)}
                                </span>
                                <span className="text-sm font-bold text-primary leading-none">
                                  {formatDualCurrency(getMentorPriceDetails(mentor.hourly_rate, mentor.original_price).currentRate)}
                                </span>
                              </div>
                            )}
                          </div>
                          {user && String(mentor.user_id) === String(user.id) ? (
                            <Button size="sm" variant="outline" disabled className="opacity-50">
                              This is You
                            </Button>
                          ) : user?.role === "mentor" ? (
                            <Button size="sm" variant="outline" disabled className="opacity-50">
                              Booking Disabled
                            </Button>
                          ) : isAdmin ? (
                            <Button size="sm" variant="outline" onClick={() => setBookingMentor(mentor)}>
                              View Profile
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleOpenBookingModal(mentor)}>
                              Book Session
                            </Button>
                          )}
                        </div>

                      </Card>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          
          /* Bookings/Sessions Tab */
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-foreground">My Mentoring Sessions</h3>
            {sessions.length === 0 ? (
              <div className="text-center py-16 glass-card">
                <Calendar className="h-12 w-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground">No Sessions Booked</h3>
                <p className="text-sm text-muted mt-1">Start matching or booking sessions to view them here.</p>
                <Button className="mt-4" onClick={() => setActiveTab("marketplace")}>Browse Marketplace</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const isPast = new Date(session.scheduled_at) < new Date();
                  const statusColors: Record<string, string> = {
                    pending: "warning",
                    confirmed: "success",
                    completed: "primary",
                    cancelled: "error",
                  };

                  return (
                    <Card key={session.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      
                      {/* Booking Info */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground font-semibold">
                          {session.mentor_name?.split(" ").map(n => n[0]).join("") || "M"}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-foreground">{session.mentor_name}</h4>
                            <Badge variant={statusColors[session.status] as any || "default"}>
                              {session.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted">
                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)</span>
                            <span className="flex items-center gap-1.5">{formatDualCurrency(session.amount_cents / 100)}</span>
                          </div>
                          {session.project_id && (
                            <p className="text-[11px] text-primary mt-2 flex items-center gap-1.5">
                              <BookOpen className="h-3 w-3" />
                              Focus: {projects.find(p => p.id === session.project_id)?.title || `Project #${session.project_id}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 flex-wrap justify-end self-end md:self-center">
                        {((isPast && session.status !== "completed" && session.status !== "cancelled") || 
                          (session.status === "completed" && !session.is_reviewed)) && (
                          <Button size="sm" onClick={() => setReviewingSession(session)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Leave Review
                          </Button>
                        )}
                        {!isPast && session.status === "pending" && (
                          <Badge variant="outline" className="text-warning">
                            Awaiting Confirmation
                          </Badge>
                        )}
                        {session.status === "completed" && (
                          <Badge 
                            variant="outline" 
                            className={session.is_reviewed 
                              ? "text-success flex items-center gap-1 border-success/20 bg-success/5" 
                              : "text-warning flex items-center gap-1 border-warning/20 bg-warning/5"
                            }
                          >
                            {session.is_reviewed ? (
                              <>
                                <CheckCircle className="h-3 w-3" /> Reviewed & Completed
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3" /> Completed - Review Required
                              </>
                            )}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReportModal(session.mentor_id, session.mentor_name || "Coach")}
                          className="border-error/20 hover:bg-error/10 text-error font-medium"
                        >
                          Report Coach
                        </Button>
                      </div>

                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── MODAL: Book Session / View Profile ─── */}
        {bookingMentor && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className={`w-full ${isAdmin ? 'max-w-lg' : 'max-w-4xl'} bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-slideUp max-h-[90vh] overflow-y-auto`}>
              {isAdmin ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/25 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                        {bookingMentor.mentor_name?.split(" ").map(n => n[0]).join("") || "M"}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-foreground">{bookingMentor.mentor_name}</h3>
                          {bookingMentor.mentor_id && (
                            <span className="text-[10px] bg-white/5 text-muted/60 border border-white/10 px-1.5 py-0.5 rounded-md font-mono">
                              {bookingMentor.mentor_id}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-warning text-xs font-semibold">
                          <Star className="h-4 w-4 fill-current" />
                          {bookingMentor.rating.toFixed(1)}
                          <span className="text-muted font-normal">({bookingMentor.total_sessions} sessions completed)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-white/5">
                    <div>
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">About Coach</h4>
                      <p className="text-sm text-foreground leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                        {bookingMentor.bio}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-center">
                        <span className="text-[10px] text-muted uppercase tracking-wider block">Experience</span>
                        <span className="text-sm font-bold text-foreground">
                          {bookingMentor.experience_years || 5}+ Years
                        </span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-[10px] text-muted uppercase tracking-wider block">Hourly Rate (USD)</span>
                        <div className="flex gap-2 items-center">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs font-semibold">$</span>
                            <input
                              type="number"
                              min="0"
                              value={adminEditPrice}
                              onChange={(e) => setAdminEditPrice(e.target.value)}
                              className="w-full bg-surface border border-border rounded-xl pl-6 pr-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={handleAdminUpdatePrice}
                            disabled={adminPriceLoading || !adminEditPrice}
                          >
                            {adminPriceLoading ? "Updating..." : "Update"}
                          </Button>
                        </div>
                        {adminPriceSuccess && (
                          <span className="text-[9px] text-success block">Price updated and locked!</span>
                        )}
                        {adminPriceError && (
                          <span className="text-[9px] text-error block">{adminPriceError}</span>
                        )}
                      </div>
                    </div>

                    {/* Socials & Contacts */}
                    <div>
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Socials & Direct Contacts</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={bookingMentor.linkedin_url || "https://linkedin.com"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/5 hover:bg-[#0077b5]/20 border border-white/10 hover:border-[#0077b5]/50 px-3 py-2 rounded-xl text-xs text-foreground transition-all duration-200"
                        >
                          <Linkedin className="h-4 w-4 text-[#0077b5]" />
                          <span className="truncate font-semibold">LinkedIn Profile</span>
                        </a>

                        <a
                          href={bookingMentor.github_url || "https://github.com"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/5 hover:bg-[#24292e]/40 border border-white/10 hover:border-[#24292e]/80 px-3 py-2 rounded-xl text-xs text-foreground transition-all duration-200"
                        >
                          <Github className="h-4 w-4 text-foreground" />
                          <span className="truncate font-semibold">GitHub Profile</span>
                        </a>

                        <a
                          href={`mailto:${bookingMentor.email || "support@careerai.com"}`}
                          className="flex items-center gap-2 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/50 px-3 py-2 rounded-xl text-xs text-foreground transition-all duration-200"
                        >
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="truncate font-semibold">Email Coach</span>
                        </a>

                        <a
                          href={`tel:${bookingMentor.mobile_number || "+15550192834"}`}
                          className="flex items-center gap-2 bg-white/5 hover:bg-success/20 border border-white/10 hover:border-success/50 px-3 py-2 rounded-xl text-xs text-foreground transition-all duration-200"
                        >
                          <Phone className="h-4 w-4 text-success" />
                          <span className="truncate font-semibold">Call Coach</span>
                        </a>
                      </div>
                    </div>

                    {/* Platform Admin Support */}
                    <div>
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Platform Admin Support</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href="mailto:durgasravan21@gmail.com"
                          className="flex items-center gap-2 bg-white/5 hover:bg-secondary/20 border border-white/10 hover:border-secondary/50 px-3 py-2 rounded-xl text-xs text-foreground transition-all duration-200"
                        >
                          <Mail className="h-4 w-4 text-secondary" />
                          <span className="truncate font-semibold">Email Admin</span>
                        </a>

                        <a
                          href="tel:+15550123456"
                          className="flex items-center gap-2 bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-accent/50 px-3 py-2 rounded-xl text-xs text-foreground transition-all duration-200"
                        >
                          <Phone className="h-4 w-4 text-accent" />
                          <span className="truncate font-semibold">Call Admin</span>
                        </a>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Expertise & Technologies</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {bookingMentor.expertise.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {bookingMentor.availability && bookingMentor.availability.length > 0 && (
                      <div>
                        <h4 className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Weekly Availability</h4>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {bookingMentor.availability.map((slot, idx) => {
                            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                            return (
                              <div key={idx} className="flex justify-between items-center text-xs text-muted bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                <span className="font-medium text-foreground">{days[slot.day_of_week]}</span>
                                <span>{slot.start_time} - {slot.end_time}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5 flex">
                    <Button onClick={() => setBookingMentor(null)} className="w-full">
                      Close Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Column: Coach Profile details */}
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/25 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                        {bookingMentor.mentor_name?.split(" ").map(n => n[0]).join("") || "M"}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-foreground">{bookingMentor.mentor_name}</h3>
                          {bookingMentor.mentor_id && (
                            <span className="text-[10px] bg-white/5 text-muted/60 border border-white/10 px-1.5 py-0.5 rounded-md font-mono">
                              {bookingMentor.mentor_id}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-warning text-xs font-semibold">
                          <Star className="h-4 w-4 fill-current" />
                          {bookingMentor.rating.toFixed(1)}
                          <span className="text-muted font-normal">({bookingMentor.total_sessions} sessions completed)</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">About Coach</h4>
                      <p className="text-xs text-foreground leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 max-h-40 overflow-y-auto">
                        {bookingMentor.bio}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-center">
                        <span className="text-[10px] text-muted uppercase tracking-wider block">Experience</span>
                        <span className="text-xs font-bold text-foreground">
                          {bookingMentor.experience_years || 5}+ Years
                        </span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-center">
                        <span className="text-[10px] text-muted uppercase tracking-wider block">Hourly Rate</span>
                        <span className="text-xs font-bold text-success">
                          {bookingMentor.hourly_rate === 0 ? "Free" : `$${bookingMentor.hourly_rate}/hr`}
                        </span>
                      </div>
                    </div>

                    {/* Socials */}
                    <div>
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Socials</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={bookingMentor.linkedin_url || "https://linkedin.com"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/5 hover:bg-[#0077b5]/20 border border-white/10 hover:border-[#0077b5]/50 px-3 py-2 rounded-xl text-xs text-foreground transition-all duration-200"
                        >
                          <Linkedin className="h-4 w-4 text-[#0077b5]" />
                          <span className="truncate font-semibold">LinkedIn</span>
                        </a>

                        <a
                          href={bookingMentor.github_url || "https://github.com"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/5 hover:bg-[#24292e]/40 border border-white/10 hover:border-[#24292e]/80 px-3 py-2 rounded-xl text-xs text-foreground transition-all duration-200"
                        >
                          <Github className="h-4 w-4 text-foreground" />
                          <span className="truncate">GitHub</span>
                        </a>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Expertise</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {bookingMentor.expertise.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Booking Form */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Book Mentoring Session</h3>
                      <p className="text-xs text-muted mt-1">Schedule a 60-minute call with {bookingMentor.mentor_name || bookingMentor.name}</p>
                    </div>

                    <form onSubmit={handleBookSession} className="space-y-4">
                      
                      {/* Meeting Format */}
                      <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted font-medium">Meeting Format</span>
                          {bookingMentor.video_calls_active !== false ? (
                            <div className="flex items-center gap-1 bg-success/15 border border-success/30 px-2 py-0.5 rounded-full text-[10px] font-bold text-success">
                              <Shield className="h-3 w-3" /> E2EE
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-error/15 border border-error/30 px-2 py-0.5 rounded-full text-[10px] font-bold text-error">
                              <AlertCircle className="h-3 w-3" /> Inactive
                            </div>
                          )}
                        </div>
                        {bookingMentor.video_calls_active !== false ? (
                          <>
                            <div className="flex items-center gap-2 mt-1 text-foreground text-sm font-semibold">
                              <Video className="h-4 w-4 text-primary animate-pulse" />
                              <span>Premium Video Call</span>
                              <span className="text-xs text-muted font-normal">(Only option available)</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              This session is secured with end-to-end encryption to protect your privacy.
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mt-1 text-error text-sm font-semibold">
                              <VideoOff className="h-4 w-4 text-error animate-bounce" />
                              <span>Video Calls Unavailable</span>
                            </div>
                            <p className="text-[10px] text-error mt-0.5">
                              This coach has temporarily disabled video call bookings.
                            </p>
                          </>
                        )}
                      </div>

                      {/* Date */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted font-medium">Date</label>
                        <input
                          type="date"
                          required
                          disabled={bookingMentor.video_calls_active === false}
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Time */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted font-medium">Time Slot</label>
                        <input
                          type="time"
                          required
                          disabled={bookingMentor.video_calls_active === false}
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Project Focus */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted font-medium">Focus Project (Optional)</label>
                        <select
                          disabled={bookingMentor.video_calls_active === false}
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">General Career Mentoring</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted font-medium">Notes / Questions (Optional)</label>
                        <textarea
                          placeholder={bookingMentor.video_calls_active !== false ? "Briefly explain what you would like to discuss..." : "Bookings are currently disabled."}
                          disabled={bookingMentor.video_calls_active === false}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Summary */}
                      <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center text-sm font-semibold">
                        <span className="text-muted">Total (1 Hour)</span>
                        {bookingMentor.hourly_rate === 0 ? (
                          <span className="text-success">Free (Passion Service)</span>
                        ) : (
                          <div className="text-right">
                            <span className="text-[11px] text-muted/60 line-through block leading-none mb-1">
                              {formatDualCurrency(getMentorPriceDetails(bookingMentor.hourly_rate, bookingMentor.original_price).originalRate)}
                            </span>
                            <span className="text-foreground leading-none">
                              {formatDualCurrency(getMentorPriceDetails(bookingMentor.hourly_rate, bookingMentor.original_price).currentRate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => setBookingMentor(null)} className="flex-1">
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isBooking || bookingMentor.video_calls_active === false}
                          isLoading={isBooking}
                          className="flex-1"
                        >
                          {bookingMentor.video_calls_active !== false ? "Confirm Booking" : "Bookings Unavailable"}
                        </Button>
                      </div>

                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── MODAL: Leave Review ─── */}
        {reviewingSession && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-slideUp">
              <div>
                <h3 className="text-xl font-bold text-foreground">Review Mentoring Session</h3>
                <p className="text-xs text-muted mt-1">Leave feedback for {reviewingSession.mentor_name}</p>
              </div>

              <form onSubmit={handleReviewSession} className="space-y-4">
                
                {/* Rating Stars */}
                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-95"
                      >
                        <Star className={`h-8 w-8 ${star <= rating ? "text-warning fill-warning" : "text-muted"}`} />
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
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setReviewingSession(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isReviewing} isLoading={isReviewing} className="flex-1">
                    Submit Review
                  </Button>
                </div>

              </form>
            </div>
          </div>
        )}

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
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium block">
                    Upload Screenshot Proof: <span className="text-error font-bold">*Required</span>
                  </label>
                  <div className="relative border border-dashed border-white/10 hover:border-primary/50 bg-white/5 rounded-2xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group">
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleReportFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <UploadCloud className="h-8 w-8 text-muted group-hover:text-primary mb-2 transition-colors duration-200" />
                    {reportFile ? (
                      <div className="text-xs font-semibold text-foreground truncate max-w-full">
                        {reportFile.name} ({(reportFile.size / 1024).toFixed(1)} KB)
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-foreground">Click to upload screenshot</span>
                        <span className="text-[10px] text-muted mt-1">PNG, JPG, JPEG up to 5MB</span>
                      </>
                    )}
                  </div>
                  {reportFileBase64 && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-white/10 max-h-32 bg-black/40 flex items-center justify-center">
                      <img src={reportFileBase64} alt="Screenshot proof preview" className="object-contain max-h-28" />
                    </div>
                  )}
                  <span className="text-[10px] text-muted block">
                    Your report and screenshot proof will be reviewed confidentially by the platform administrator.
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
                    disabled={isSubmittingReport || !reportReason.trim() || !reportFileBase64}
                    className="flex-1 bg-error hover:bg-error/80 text-white font-bold"
                  >
                    {isSubmittingReport ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
