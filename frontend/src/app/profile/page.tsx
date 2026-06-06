"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load profile settings.");
      } finally {
        setLoadingData(false);
      }
    };

    loadProfileAndRoles();
  }, [isAuthenticated, user]);

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
    </div>
  );
}
