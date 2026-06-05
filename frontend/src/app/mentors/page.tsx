"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
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
} from "lucide-react";

export default function MentorsPage() {
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

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("all");
  const [maxPrice, setMaxPrice] = useState(150);

  // Modal controls
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [notes, setNotes] = useState("");

  // Review states
  const [reviewingSession, setReviewingSession] = useState<MentorSession | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

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

      setSuccess(`Mentoring session booked successfully with ${bookingMentor.name}!`);
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
    const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesExpertise = selectedExpertise === "all" || 
      mentor.expertise.some(e => e.toLowerCase().includes(selectedExpertise.toLowerCase()));

    const matchesPrice = mentor.hourly_rate <= maxPrice;

    return matchesSearch && matchesExpertise && matchesPrice;
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

          {/* Tab switches */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 self-start">
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
                          <h4 className="font-bold text-foreground">{match.mentor.mentor_name}</h4>
                          <p className="text-xs text-muted">Hourly Rate: ${match.mentor.hourly_rate}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted italic leading-relaxed">&ldquo;{match.reasoning}&rdquo;</p>
                      <Button size="sm" onClick={() => setBookingMentor(match.mentor)} className="w-full">
                        Book Session Now
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Filter and Browse Section */}
            <div className="grid gap-8 lg:grid-cols-4">
              
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="p-6 space-y-6 sticky top-24">
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
                              <h4 className="font-bold text-foreground text-base">{mentor.mentor_name}</h4>
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
                            <span className="text-lg font-bold text-foreground flex items-center"><DollarSign className="h-4.5 w-4.5 text-success" />{mentor.hourly_rate}</span>
                          </div>
                          <Button size="sm" onClick={() => setBookingMentor(mentor)}>
                            Book Session
                          </Button>
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
                            <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />${(session.amount_cents / 100).toFixed(2)}</span>
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
                      <div className="flex items-center gap-3 self-end md:self-center">
                        {isPast && session.status !== "completed" && session.status !== "cancelled" && (
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
                          <Badge variant="outline" className="text-success flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Reviewed & Completed
                          </Badge>
                        )}
                      </div>

                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── MODAL: Book Session ─── */}
        {bookingMentor && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-slideUp">
              <div>
                <h3 className="text-xl font-bold text-foreground">Book Mentoring Session</h3>
                <p className="text-xs text-muted mt-1">Schedule a 60-minute call with {bookingMentor.name}</p>
              </div>

              <form onSubmit={handleBookSession} className="space-y-4">
                
                {/* Date */}
                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium">Date</label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium">Time Slot</label>
                  <input
                    type="time"
                    required
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Project Focus */}
                <div className="space-y-2">
                  <label className="text-xs text-muted font-medium">Focus Project (Optional)</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                    placeholder="Briefly explain what you would like to discuss..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Summary */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center text-sm font-semibold">
                  <span className="text-muted">Total (1 Hour)</span>
                  <span className="text-foreground">${bookingMentor.hourly_rate}</span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setBookingMentor(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isBooking} isLoading={isBooking} className="flex-1">
                    Confirm Booking
                  </Button>
                </div>

              </form>
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

      </div>
    </div>
  );
}
