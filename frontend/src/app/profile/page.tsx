"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, TextArea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User as UserIcon,
  Briefcase,
  Link as LinkIcon,
  MapPin,
  Clock,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Mail,
} from "lucide-react";
import type { Role, UserProfile, ApiError } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, isAuthenticated, isLoading: authLoading } = useAuth();

  // Roles list & Profile data
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [targetRoleId, setTargetRoleId] = useState("");

  // Mentor Form Fields
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [mentorHourlyRate, setMentorHourlyRate] = useState("50");
  const [mentorCompany, setMentorCompany] = useState("");
  const [mentorExpertise, setMentorExpertise] = useState<string[]>([]);
  const [mentorExpertiseInput, setMentorExpertiseInput] = useState("");
  const [mentorAvailability, setMentorAvailability] = useState<any[]>([]);

  // Mail Composer Modal States
  const [showMailModal, setShowMailModal] = useState(false);
  const [requestedPrice, setRequestedPrice] = useState("");
  const [mailReason, setMailReason] = useState("");
  const [mailLoading, setMailLoading] = useState(false);
  const [mailSuccess, setMailSuccess] = useState(false);
  const [mailError, setMailError] = useState("");

  const DAYS_OF_WEEK = [
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
    { id: 0, name: "Sunday" },
  ];

  const handleToggleDay = (dayId: number) => {
    const exists = mentorAvailability.some(s => s.day_of_week === dayId);
    if (exists) {
      setMentorAvailability(mentorAvailability.filter(s => s.day_of_week !== dayId));
    } else {
      setMentorAvailability([...mentorAvailability, { day_of_week: dayId, start_time: "09:00", end_time: "17:00" }]);
    }
  };

  const handleTimeChange = (dayId: number, field: "start_time" | "end_time", value: string) => {
    setMentorAvailability(mentorAvailability.map(s => {
      if (s.day_of_week === dayId) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleAddExpertiseTag = () => {
    const trimmed = mentorExpertiseInput.trim();
    if (trimmed && !mentorExpertise.includes(trimmed)) {
      setMentorExpertise([...mentorExpertise, trimmed]);
      setMentorExpertiseInput("");
    }
  };

  const handleRemoveExpertiseTag = (tag: string) => {
    setMentorExpertise(mentorExpertise.filter(t => t !== tag));
  };

  // Route protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/?login=true");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load Data
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadProfileAndRoles = async () => {
      setLoadingData(true);
      setError("");
      try {
        const [rolesList, profileData] = await Promise.all([
          api.career.getRoles(),
          api.user.getProfile(),
        ]);

        setRoles(rolesList || []);
        
        // Prepopulate form fields
        setName(user?.name || "");
        setCurrentRole(profileData.current_role || "");
        setYearsOfExperience(
          profileData.years_of_experience !== undefined && profileData.years_of_experience !== null
            ? String(profileData.years_of_experience)
            : ""
        );
        setLocation(profileData.location || "");
        setBio(profileData.bio || "");
        setLinkedinUrl(profileData.linkedin_url || "");
        setPortfolioUrl(profileData.portfolio_url || "");
        setMobileNumber(profileData.mobile_number || "");
        setTargetRoleId(
          profileData.target_role_id !== undefined && profileData.target_role_id !== null
            ? String(profileData.target_role_id)
            : ""
        );

        // Fetch mentor profile status if applicable
        try {
          const mentorData = await api.mentors.getAppStatus();
          if (mentorData) {
            setMentorProfile(mentorData);
            setMentorHourlyRate(String(mentorData.hourly_rate));
            setMentorCompany(mentorData.company_name || "");
            setMentorExpertise(mentorData.expertise || []);
            setMentorAvailability(mentorData.availability || []);
          }
        } catch (e: any) {
          // 404 or other normal errors when user is not a mentor
          setMentorProfile(null);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load profile settings.");
      } finally {
        setLoadingData(false);
      }
    };

    loadProfileAndRoles();
  }, [isAuthenticated, user]);

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedPrice || !mailReason.trim()) return;
    setMailLoading(true);
    setMailError("");
    setMailSuccess(false);
    try {
      await api.mentors.requestPriceChange({
        requested_price: parseFloat(requestedPrice),
        reason: mailReason.trim()
      });
      setMailSuccess(true);
      setMailReason("");
      setRequestedPrice("");
      setTimeout(() => {
        setShowMailModal(false);
        setMailSuccess(false);
      }, 2500);
    } catch (err: any) {
      setMailError(err.message || "Failed to send request.");
    } finally {
      setMailLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        name: name.trim() || undefined,
        bio: bio.trim() || "",
        current_role: currentRole.trim() || "",
        location: location.trim() || "",
        linkedin_url: linkedinUrl.trim() || "",
        portfolio_url: portfolioUrl.trim() || "",
        mobile_number: mobileNumber.trim() || "",
        years_of_experience: yearsOfExperience ? Number(yearsOfExperience) : null,
        target_role_id: targetRoleId ? Number(targetRoleId) : null,
      };

      await api.user.updateProfile(payload);
      
      // Update mentor pricing and availability if they are a mentor, admin, or filled in coaching data
      const hasCoachingData = mentorCompany.trim() || mentorExpertise.length > 0 || mentorAvailability.length > 0 || mentorHourlyRate !== "50";
      if (mentorProfile || user?.email === "durgasravan21@gmail.com" || hasCoachingData) {
        const availabilityPayload = mentorAvailability.map(slot => {
          const start = slot.start_time || "09:00";
          const end = slot.end_time || "17:00";
          return {
            day_of_week: Number(slot.day_of_week),
            start_time: start.includes(":") && start.split(":").length === 2 ? `${start}:00` : start,
            end_time: end.includes(":") && end.split(":").length === 2 ? `${end}:00` : end,
          };
        });

        await api.mentors.apply({
          bio: bio.trim() || (mentorProfile ? mentorProfile.bio : "Professional Advisor"),
          hourly_rate: parseFloat(mentorHourlyRate || "50"),
          expertise: mentorExpertise.length > 0 ? mentorExpertise : ["Advising"],
          linkedin_url: linkedinUrl.trim() || (mentorProfile ? mentorProfile.linkedin_url : "") || "",
          github_url: portfolioUrl.trim() || (mentorProfile ? mentorProfile.github_url : "") || "",
          corporate_email: (mentorProfile ? mentorProfile.corporate_email : "") || `${user?.email.split("@")[0]}@corporate.com`,
          company_name: mentorCompany.trim() || "Self-Employed",
          signed_agreement: true,
          signature_svg_or_text: (mentorProfile ? mentorProfile.signature_svg_or_text : "") || "signed",
          availability: availabilityPayload,
        });
      }

      await refreshUser(); // Refresh global auth state (navbar name, etc.)
      
      setSuccess("Profile settings saved successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to save profile settings.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted text-sm">Loading profile settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Profile Settings
            </h1>
            <p className="text-sm text-muted">
              Manage your personal information, career details, and links.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-3 text-success animate-fadeIn">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-error animate-fadeIn">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Profile Card Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-white/5 pb-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Personal Details
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                    Full Name
                  </label>
                  <Input
                    required
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider block">
                    Email Address
                  </label>
                  <Input
                    disabled
                    value={user?.email || ""}
                    className="bg-white/5 text-muted-foreground border-white/5 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-muted block mt-1">
                    Your email address cannot be changed as it is used for login.
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <Input
                    placeholder="e.g. +1 (555) 019-2834"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                  <span className="text-[10px] text-muted block mt-1">
                    Used by administration to contact you in case of session issues.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Career details */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-white/5 pb-2">
                <Briefcase className="h-5 w-5 text-secondary" />
                Professional Credentials
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                    Current Job Title / Role
                  </label>
                  <Input
                    placeholder="e.g. Student, Frontend Intern, Backend Developer"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                    Years of Experience
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 1.5, 3"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                    Location
                  </label>
                  <Input
                    placeholder="e.g. New York, USA or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    icon={<MapPin className="h-4 w-4 text-muted" />}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    Target Career Goal (Dream Role)
                    <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0 px-1.5">
                      AI Gap Analysis
                    </Badge>
                  </label>
                  <div className="relative">
                    <select
                      value={targetRoleId}
                      onChange={(e) => setTargetRoleId(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-all duration-200"
                    >
                      <option value="">-- Select Target Dream Role --</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.title} {role.category ? `(${role.category})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted block">
                    Changing this goal recalculates your skill gaps and project recommendation matches on the dashboard.
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                  Biography / Bio
                </label>
                <textarea
                  placeholder="Tell us about yourself, your career path, achievements, and what technologies you love building with..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted"
                />
              </div>
            </div>

            {/* Section 3: Professional Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-white/5 pb-2">
                <LinkIcon className="h-5 w-5 text-accent" />
                Professional Links
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                    LinkedIn Profile URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                    GitHub or Portfolio URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://github.com/username"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Mentor Professional Settings */}
            {true && (
              <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-white/5 pb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Mentor Coaching & Availability Settings
                </h3>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                      Hourly Rate (USD)
                    </label>
                    {mentorProfile?.price_edited_by_admin ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">$</div>
                          <Input
                            type="number"
                            disabled
                            value={mentorHourlyRate}
                            className="pl-7 bg-white/5 border-white/5 text-muted-foreground cursor-not-allowed"
                          />
                        </div>
                        <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center gap-2 text-warning font-semibold text-xs">
                            <AlertCircle className="h-4 w-4" />
                            Pricing Locked by Administrator
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">
                            This price was set by the Admin and is locked. To request a change, please write an email to the admin.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMailModal(true)}
                            className="text-xs border-warning/30 hover:bg-warning/10 text-warning"
                          >
                            Request Price Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">$</div>
                          <Input
                            type="number"
                            min="0"
                            required
                            placeholder="e.g. 75"
                            value={mentorHourlyRate}
                            onChange={(e) => setMentorHourlyRate(e.target.value)}
                            className="pl-7"
                          />
                        </div>
                        <span className="text-[10px] text-muted block">
                          Setting this will adjust the discount price shown to students.
                        </span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                      Company Name / Affiliation
                    </label>
                    <Input
                      placeholder="e.g. Google, Self-Employed"
                      value={mentorCompany}
                      onChange={(e) => setMentorCompany(e.target.value)}
                    />
                  </div>
                </div>

                {/* Specialty Expertise */}
                <div className="space-y-3">
                  <label className="text-xs text-muted font-semibold uppercase tracking-wider block">
                    Specialty Expertise Areas
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. React Native, AWS, Kubernetes"
                      value={mentorExpertiseInput}
                      onChange={(e) => setMentorExpertiseInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddExpertiseTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddExpertiseTag}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {mentorExpertise.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs bg-white/5 border-white/10 flex items-center gap-1.5 py-1 px-2.5 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveExpertiseTag(tag)}
                          className="hover:text-error text-muted transition-colors"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                    {mentorExpertise.length === 0 && (
                      <span className="text-xs text-muted italic">No expertise areas added yet.</span>
                    )}
                  </div>
                </div>

                {/* Weekly Availability Grid */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted font-semibold uppercase tracking-wider block">
                      Weekly Availability Slots
                    </label>
                    <span className="text-[10px] text-muted block mt-0.5">
                      Select which days you are available for student 1-on-1 video calls.
                    </span>
                  </div>

                  <div className="grid gap-3 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                    {DAYS_OF_WEEK.map((day) => {
                      const activeSlot = mentorAvailability.find(s => Number(s.day_of_week) === day.id);
                      const isChecked = !!activeSlot;
                      
                      return (
                        <div
                          key={day.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0"
                        >
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleDay(day.id)}
                              className="w-4.5 h-4.5 rounded border-border bg-surface text-primary focus:ring-primary accent-primary"
                            />
                            <span className="text-sm font-bold text-foreground w-24">{day.name}</span>
                          </label>

                          {isChecked && activeSlot && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted">From:</span>
                              <input
                                type="time"
                                required
                                value={activeSlot.start_time ? activeSlot.start_time.slice(0, 5) : "09:00"}
                                onChange={(e) => handleTimeChange(day.id, "start_time", e.target.value)}
                                className="bg-surface border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                              />
                              <span className="text-muted">To:</span>
                              <input
                                type="time"
                                required
                                value={activeSlot.end_time ? activeSlot.end_time.slice(0, 5) : "17:00"}
                                onChange={(e) => handleTimeChange(day.id, "end_time", e.target.value)}
                                className="bg-surface border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                              />
                            </div>
                          )}

                          {!isChecked && (
                            <span className="text-xs text-muted italic">Unavailable</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="border-t border-white/5 pt-6 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-secondary text-white font-bold"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Profile Settings"
                )}
              </Button>
            </div>

          </form>
        </Card>

      </div>

      {/* Mail Request Composer Modal */}
      <Dialog
        open={showMailModal}
        onClose={() => {
          setShowMailModal(false);
          setMailError("");
          setMailSuccess(false);
        }}
      >
        <DialogHeader
          onClose={() => {
            setShowMailModal(false);
            setMailError("");
            setMailSuccess(false);
          }}
        >
          <DialogTitle>Write Mail to Admin</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Submit a pricing revision request. The administrator will review your proposed hourly rate and reason.
          </p>

          {mailSuccess && (
            <p className="text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
              Price lock revision request sent successfully! Redirecting...
            </p>
          )}

          {mailError && (
            <p className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {mailError}
            </p>
          )}

          <div className="space-y-2">
            <label className="text-xs text-muted font-medium">To:</label>
            <Input
              disabled
              value="admin@careerai.com (Platform Administrator)"
              className="bg-white/5 text-muted-foreground border-white/5 cursor-not-allowed text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted font-medium">Subject:</label>
            <Input
              disabled
              value="Locked Pricing Revision Request"
              className="bg-white/5 text-muted-foreground border-white/5 cursor-not-allowed text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted font-medium block mb-2">Current Locked Price</label>
              <Input
                disabled
                value={`$${mentorHourlyRate}/hr`}
                className="bg-white/5 text-muted-foreground border-white/5 cursor-not-allowed text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted font-medium block mb-2">Requested Price ($)</label>
              <Input
                type="number"
                min="0"
                required
                placeholder="e.g. 110"
                value={requestedPrice}
                onChange={(e) => setRequestedPrice(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <TextArea
            label="Reason / Case for Pricing Revision"
            placeholder="Explain why you are requesting a rate adjustment..."
            required
            value={mailReason}
            onChange={(e) => setMailReason(e.target.value)}
            rows={4}
            className="text-xs"
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowMailModal(false);
              setMailError("");
              setMailSuccess(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendMail}
            disabled={!requestedPrice || !mailReason.trim() || mailLoading}
            isLoading={mailLoading}
          >
            <Mail className="w-4 h-4 mr-1.5" />
            Send Request
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
