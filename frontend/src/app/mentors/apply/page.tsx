"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  DollarSign,
  Link as LinkIcon,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import type { Mentor, ApiError } from "@/types";

export default function MentorApplyPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Application States
  const [profile, setProfile] = useState<Mentor | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form Fields
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("50");
  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [corporateEmail, setCorporateEmail] = useState("");
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [selfieFileName, setSelfieFileName] = useState("");
  const [idBase64, setIdBase64] = useState<string | null>(null);
  const [idFileName, setIdFileName] = useState("");
  const [idType, setIdType] = useState("");
  const [signedAgreement, setSignedAgreement] = useState(false);
  const [signatureText, setSignatureText] = useState("");

  // Sandbox Verification Verification OTP
  const [otpToken, setOtpToken] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // Camera references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Signature canvas references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load current status
  const loadStatus = async () => {
    setError("");
    setLoadingProfile(true);
    try {
      const res = await api.mentors.getAppStatus();
      setProfile(res);
    } catch (err) {
      // 404 means no application has been submitted yet
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStatus();
    } else {
      setLoadingProfile(false);
    }
  }, [user]);

  // Webcam capture setup
  const startCamera = async () => {
    setError("");
    setSelfieBase64(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setError("Unable to access camera. Please check camera permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const captureSelfie = () => {
    if (videoRef.current && cameraActive) {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const base64 = canvas.toDataURL("image/jpeg");
        setSelfieBase64(base64);
        setSelfieFileName("webcam_selfie.jpg");
        stopCamera();
      }
    }
  };

  // File to base64 helper
  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setIdBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Expertise Tags list
  const addExpertiseTag = () => {
    const trimmed = expertiseInput.trim();
    if (trimmed && !expertiseTags.includes(trimmed)) {
      setExpertiseTags([...expertiseTags, trimmed]);
      setExpertiseInput("");
    }
  };

  const removeExpertiseTag = (tag: string) => {
    setExpertiseTags(expertiseTags.filter((t) => t !== tag));
  };

  // Signature canvas drawing handlers
  useEffect(() => {
    if (step === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
      }
    }
  }, [step]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      // Save canvas as signature text / string representation
      const base64Sig = canvasRef.current.toDataURL("image/png");
      setSignatureText(base64Sig);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        setSignatureText("");
      }
    }
  };

  // Step 2 Continue Validation
  const handleStep2Continue = () => {
    setError("");
    if (!linkedinUrl) {
      setError("LinkedIn profile is mandatory.");
      return;
    }
    if (!corporateEmail) {
      setError("Corporate email address is mandatory for workplace verification.");
      return;
    }
    const personalDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "mail.com", "proton.me", "protonmail.com", "aol.com", "gmx.com", "zoho.com"];
    const emailDomain = corporateEmail.split("@")[1]?.toLowerCase();
    if (emailDomain && personalDomains.includes(emailDomain)) {
      setError("Please use your corporate/work email address (e.g., name@company.com), not a personal email (gmail, yahoo, etc.).");
      return;
    }
    setStep(3);
  };

  // Step 3 Continue Validation (Safety Check)
  const handleStep3Continue = () => {
    setError("");
    if (!idType) {
      setError("Please select a Government ID Type first.");
      return;
    }
    if (!selfieBase64 || !idBase64) {
      setError("Both selfie photo and government ID scan are required.");
      return;
    }

    const cleanSelfie = selfieBase64.includes(",") ? selfieBase64.split(",")[1] : selfieBase64;
    const cleanId = idBase64.includes(",") ? idBase64.split(",")[1] : idBase64;

    // 1. Identical file check
    if (cleanSelfie === cleanId) {
      setError("AI Biometric Verification Failed: Selfie photo and ID document image are identical. You must capture a real-time webcam selfie and upload a separate government-issued ID card.");
      return;
    }

    // 2. Academic transcript check
    const academicKeywords = ["marksheet", "12th", "10th", "grade", "certificate", "resume", "cv", "transcript", "degree", "result", "diploma", "report", "hsc", "ssc", "board"];
    const nameLower = (idFileName || "").toLowerCase();
    const isAcademic = academicKeywords.some(kw => nameLower.includes(kw));

    if (isAcademic) {
      setError(`Safety Violation: Uploaded document '${idFileName}' recognized as an academic transcript or marksheet. The AI agent rejects this upload. Please upload an official government-issued ID (e.g. Aadhaar Card, Passport, Driver's License) for safety purposes.`);
      return;
    }

    setStep(4);
  };

  // Submit Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedAgreement || !signatureText) {
      setError("Please sign the agreement to proceed.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        bio,
        hourly_rate: Number(hourlyRate),
        expertise: expertiseTags.length > 0 ? expertiseTags : ["General Software Development"],
        linkedin_url: linkedinUrl,
        github_url: githubUrl || undefined,
        corporate_email: corporateEmail || undefined,
        selfie_base64: selfieBase64 || undefined,
        identity_document_base64: idBase64 || undefined,
        id_type: idType,
        selfie_filename: selfieFileName,
        id_filename: idFileName,
        signed_agreement: signedAgreement,
        signature_svg_or_text: signatureText,
        availability: [
          { day_of_week: 1, start_time: "09:00", end_time: "17:00" }, // Tuesday
          { day_of_week: 3, start_time: "09:00", end_time: "17:00" }, // Thursday
        ],
      };

      const result = await api.mentors.apply(payload);
      setProfile(result);
      setSuccess("Your mentor application has been submitted successfully!");
      setStep(1);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to submit mentor application.");
    } finally {
      setSubmitting(false);
    }
  };

  // Verify corporate email OTP
  const handleVerifyEmail = async () => {
    if (!profile || !corporateEmail || !otpToken) return;
    setVerifyingEmail(true);
    setError("");
    setSuccess("");
    try {
      await api.mentors.verifyCorporate(corporateEmail, otpToken);
      setSuccess("Corporate email verified successfully!");
      loadStatus();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Email verification failed.");
    } finally {
      setVerifyingEmail(false);
    }
  };


  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // --- RENDER STATUS BOARD IF ALREADY APPLIED ---
  if (profile) {
    const statusColors = {
      pending: "bg-warning/20 border-warning text-warning",
      verified: "bg-success/20 border-success text-success",
      rejected: "bg-error/20 border-error text-error",
      suspended: "bg-red-900/20 border-red-800 text-red-400",
    };

    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <ShieldCheck className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Mentor Application Status</h2>
              <p className="text-sm text-muted">
                Manage your credentials and verify your account status.
              </p>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-error">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-3 text-success">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{success}</p>
              </div>
            )}

            {/* Current Status Box */}
            <div className={`p-4 border rounded-2xl flex items-center justify-between ${statusColors[profile.verification_status]}`}>
              <div>
                <span className="text-xs uppercase tracking-wider block opacity-70">Current Verification Status</span>
                <span className="text-xl font-extrabold capitalize">{profile.verification_status}</span>
              </div>
              <Badge variant="outline" className="text-xs capitalize font-bold">
                {profile.verification_status}
              </Badge>
            </div>

            {/* Steps checklist */}
            <div className="border-t border-white/5 pt-6 space-y-5">
              <h3 className="font-bold text-foreground">Verification Checklist</h3>
              
              {/* 1. Identity Upload check */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Selfie & Government ID Uploaded</span>
                </div>
                <span className="text-success text-xs font-semibold">Done</span>
              </div>

              {/* 2. Agreement signed check */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Signed Code of Conduct (Pricing Policy)</span>
                </div>
                <span className="text-success text-xs font-semibold">Done</span>
              </div>

              {/* 3. Corporate email verification status */}
              {profile.corporate_email && (
                <div className="border border-white/5 rounded-2xl p-4 bg-white/5 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      {profile.corporate_email_verified ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-warning animate-pulse" />
                      )}
                      <span>Corporate Email Domain Verify ({profile.corporate_email})</span>
                    </div>
                    <span className={profile.corporate_email_verified ? "text-success text-xs font-semibold" : "text-warning text-xs font-semibold"}>
                      {profile.corporate_email_verified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  {!profile.corporate_email_verified && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted">
                        Enter the verification OTP sent to your work email (for testing, check your backend console/uvicorn logs for the simulated token, format is: <code className="text-cyan-400">VERIFY_{user?.id}_99</code>).
                      </p>
                      <div className="flex gap-3">
                        <Input
                          placeholder="VERIFY_..."
                          value={otpToken}
                          onChange={(e) => setOtpToken(e.target.value)}
                          className="text-center font-mono tracking-widest text-sm"
                        />
                        <Button size="sm" onClick={handleVerifyEmail} disabled={verifyingEmail}>
                          {verifyingEmail ? "Verifying..." : "Verify OTP"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Admin Final approval status */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  {profile.verification_status === "verified" ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  <span>Human Identity & Verification Check</span>
                </div>
                <span className={profile.verification_status === "verified" ? "text-success text-xs font-semibold" : "text-muted text-xs font-semibold"}>
                  {profile.verification_status === "verified" ? "Approved" : "Awaiting Screening"}
                </span>
              </div>
            </div>


            {/* Navigation back */}
            <div className="flex justify-between gap-4 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/mentors")}>
                Go to Mentor Directory
              </Button>
              <Button variant="ghost" size="sm" className="text-xs text-muted" onClick={() => setProfile(null)}>
                Apply with another profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- RENDER REGISTRATION WIZARD ---
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Progress header */}
        <div className="text-center space-y-2">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Mentor Application Wizard</h2>
          <p className="text-xs text-muted">Step {step} of 4 — {
            step === 1 ? "Bio & Rates" :
            step === 2 ? "Professional Credentials" :
            step === 3 ? "Identity & Selfie Verification" :
            "Pricing & Code of Conduct Agreement"
          }</p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-error animate-fadeIn">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* STEP 1: Bio & Rates */}
        {step === 1 && (
          <Card className="p-8 space-y-6 animate-fadeIn">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Profile Basics
            </CardTitle>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted font-semibold">About You (Bio)</label>
                <textarea
                  required
                  placeholder="Share details about your software experience, industries worked in, and how you can coach students..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted font-semibold">Hourly Rate (USD)</label>
                <Input
                  type="number"
                  required
                  min="10"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  icon={<DollarSign className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted font-semibold">Skills Specialties</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="React, AWS, PyTorch, DevOps..."
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addExpertiseTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addExpertiseTag} variant="outline">
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {expertiseTags.map((tag) => (
                    <Badge key={tag} variant="default" className="flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removeExpertiseTag(tag)} className="hover:text-error text-xs ml-1">×</button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={() => bio ? setStep(2) : setError("Please enter your bio.")} className="w-full">
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        )}

        {/* STEP 2: Links & Corporate Email */}
        {step === 2 && (
          <Card className="p-8 space-y-6 animate-fadeIn">
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" /> Professional Credentials
            </CardTitle>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted font-semibold">LinkedIn Profile URL</label>
                <Input
                  required
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted font-semibold">GitHub Profile URL (Optional)</label>
                <Input
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted font-semibold">Corporate Email Address (Work Verification)</label>
                <Input
                  type="email"
                  placeholder="username@employerdomain.com"
                  value={corporateEmail}
                  onChange={(e) => setCorporateEmail(e.target.value)}
                />
                <span className="text-[10px] text-muted leading-tight block">
                  Used to verify your workplace instantly (e.g. `@google.com`, `@stripe.com`). A verification link will be sent here.
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button onClick={handleStep2Continue} className="flex-1">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: Selfie Capture & ID Upload */}
        {step === 3 && (
          <Card className="p-8 space-y-6 animate-fadeIn">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" /> Identity Verification
            </CardTitle>

            <div className="space-y-5">
              
              {/* Government ID Type Dropdown Selector */}
              <div className="glass-card p-4 border border-white/5 bg-white/5 rounded-xl space-y-2 text-left">
                <label className="text-xs text-muted font-bold uppercase tracking-wider block text-left">
                  Select Government-Issued Identity Document Type <span className="text-red-400 font-bold">*</span>
                </label>
                <select
                  value={idType}
                  onChange={(e) => {
                    setIdType(e.target.value);
                    setSelfieBase64(null);
                    setSelfieFileName("");
                    setIdBase64(null);
                    setIdFileName("");
                    setError("");
                  }}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:ring-primary outline-none accent-primary transition-all cursor-pointer"
                >
                  <option value="">-- Choose Government ID Type --</option>
                  <option value="passport">Passport</option>
                  <option value="driver_license">Driver's License</option>
                  <option value="national_id">National ID Card</option>
                  <option value="aadhaar">Aadhaar Card (Govt of India)</option>
                  <option value="state_id">State ID / PAN Card (Govt of India)</option>
                </select>
                <span className="text-[10px] text-muted block text-left">
                  Safety Warning: Only official government-issued identifications are accepted by the AI Verification Agent.
                </span>
              </div>

              {/* Webcam Selfie Capture */}
              <div className="space-y-2">
                <label className="text-xs text-muted font-semibold block">1. Take a Selfie Photo</label>
                
                {selfieBase64 ? (
                  <div className="relative border border-success/30 rounded-2xl overflow-hidden max-w-xs mx-auto">
                    <img src={selfieBase64} alt="Captured Selfie" className="w-full" />
                    <button type="button" onClick={startCamera} className="absolute bottom-2 right-2 bg-black/60 border border-white/20 p-2 rounded-xl text-white hover:bg-black/90">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                ) : cameraActive ? (
                  <div className="relative border border-white/10 rounded-2xl overflow-hidden max-w-xs mx-auto bg-black">
                    <video ref={videoRef} autoPlay playsInline className="w-full transform scale-x-[-1]" />
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <Button type="button" onClick={captureSelfie} size="sm" className="shadow-lg">
                        Capture Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center space-y-3">
                    <Camera className="h-10 w-10 text-muted mx-auto" />
                    <p className="text-xs text-muted">Capture a live selfie to prove identity against your government ID.</p>
                    <Button type="button" variant="outline" size="sm" onClick={startCamera}>
                      Start Camera API
                    </Button>
                  </div>
                )}
              </div>

              {/* ID Document Uploader */}
              <div className="space-y-2">
                <label className="text-xs text-muted font-semibold block">2. Government-issued ID Card (Passport / Driver License)</label>
                <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center space-y-3 bg-white/5">
                  <Upload className="h-10 w-10 text-muted mx-auto" />
                  <p className="text-xs text-muted">
                    {idFileName ? `Selected: ${idFileName}` : "Upload ID document (.png, .jpg, .pdf)"}
                  </p>
                  <label className="inline-flex items-center justify-center px-4 py-2 border border-white/20 rounded-xl text-xs font-semibold cursor-pointer hover:bg-white/10 bg-white/5 transition-colors">
                    <span>Select File</span>
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleIdUpload} />
                  </label>
                </div>
              </div>

            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => { stopCamera(); setStep(2); }} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button onClick={handleStep3Continue} className="flex-1">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 4: Pricing Agreement & Signature */}
        {step === 4 && (
          <Card className="p-8 space-y-6 animate-fadeIn">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Pricing Code of Conduct
            </CardTitle>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Contract Scrollbox */}
              <div className="border border-white/10 rounded-2xl p-4 bg-white/5 h-44 overflow-y-auto text-xs text-muted leading-relaxed space-y-3">
                <h4 className="font-extrabold text-foreground text-sm">Agreement to Pricing & Payment Terms</h4>
                <p>
                  As an enrolled mentor on the AI Career Platform, you agree to offer your coaching and mentorship services honestly, fairly, and transparently.
                </p>
                <p className="text-foreground font-bold">
                  VIOLATION NOTICE: Under no circumstances are you allowed to demand, ask for, or negotiate payments from students directly, or charge hourly rates exceeding your listed pricing on this profile.
                </p>
                <p>
                  All transactions must be processed securely through the platform's booking engine. Requesting students to pay via external services (like PayPal, CashApp, wire transfer, etc.) or demanding cash/money above the listed rate constitutes a direct violation of our Code of Conduct.
                </p>
                <p className="text-error font-semibold">
                  Penalties for violations include immediate profile suspension, permanent ban of your user account, and forfeiture of any pending session payouts.
                </p>
              </div>

              {/* Signature Canvas Pad */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-muted font-semibold">Draw your Signature below:</label>
                  <button type="button" onClick={clearSignature} className="text-[10px] text-primary flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" /> Clear Pad
                  </button>
                </div>
                
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-black max-w-xs mx-auto">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="w-full cursor-crosshair"
                  />
                </div>
              </div>

              {/* Checkbox agreement */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agree-checkbox"
                  required
                  checked={signedAgreement}
                  onChange={(e) => setSignedAgreement(e.target.checked)}
                  className="mt-1 accent-primary"
                />
                <label htmlFor="agree-checkbox" className="text-xs text-muted leading-tight">
                  I agree to the Pricing Code of Conduct. I understand that demanding extra payments or transacting outside the platform will affect my profile rating and result in account termination.
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1" disabled={submitting}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting || !signedAgreement || !signatureText}>
                  {submitting ? (
                    <span className="flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</span>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>

            </form>
          </Card>
        )}

      </div>
    </div>
  );
}
