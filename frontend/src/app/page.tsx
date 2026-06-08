"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CursorParticles } from "@/components/cursor-particles";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Target,
  FolderKanban,
  Users,
  ArrowRight,
  Zap,
  TrendingUp,
  Shield,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login, register, isLoading, error, clearError, sendOtp, verifyOtp } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isMentorMode, setIsMentorMode] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [otpStep, setOtpStep] = useState<"email" | "otp">("email");
  const [otpCode, setOtpCode] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [formError, setFormError] = useState("");

  // Typing animation text state (initialized to avoid SSR hydration mismatch)
  const [typedText, setTypedText] = useState("Tech Career");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrases = [
      "Tech Career",
      "Coding Skills",
      "Project Portfolio",
      "Career Future"
    ];
    const currentPhrase = phrases[phraseIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (typedText !== currentPhrase) {
        timer = setTimeout(() => {
          setTypedText(currentPhrase.substring(0, typedText.length + 1));
        }, 120);
      } else {
        // Pause at full word
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    } else {
      if (typedText !== "") {
        timer = setTimeout(() => {
          setTypedText(currentPhrase.substring(0, typedText.length - 1));
        }, 60);
      } else {
        // Pause briefly before starting next word
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, phraseIndex]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Open login dialog from URL param
  useEffect(() => {
    if (searchParams?.get("login") === "true") {
      setIsRegisterMode(false);
      setShowLoginDialog(true);
    }
  }, [searchParams]);

  const handleCloseDialog = () => {
    setShowLoginDialog(false);
    clearError();
    setFormError("");
    setOtpStep("email");
    setOtpCode("");
    setDebugOtp("");
    setIsMentorMode(false);
    setCompanyName("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  // Flipped card state for mobile support on features section
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const toggleFlip = (key: string) => {
    setFlippedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Animated counter
  const [counts, setCounts] = useState({ skills: 0, projects: 0, mentors: 0 });
  useEffect(() => {
    const targets = { skills: 1200, projects: 500, mentors: 150 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounts({
        skills: Math.floor(targets.skills * eased),
        projects: Math.floor(targets.projects * eased),
        mentors: Math.floor(targets.mentors * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    clearError();
  
    if (otpStep === "email") {
      if (!formData.email) {
        setFormError("Please enter your email address.");
        return;
      }
      if (isMentorMode) {
        const personalDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "mail.com", "proton.me", "protonmail.com", "aol.com", "gmx.com", "zoho.com"];
        const emailDomain = formData.email.split("@")[1]?.toLowerCase();
        if (emailDomain && personalDomains.includes(emailDomain)) {
          setFormError("Mentors must use a corporate/work email address (e.g., name@company.com), not a personal email (gmail, yahoo, etc.).");
          return;
        }
      }
      if (isRegisterMode && !formData.name) {
        setFormError("Please enter your name.");
        return;
      }
      if (isRegisterMode && isMentorMode && !companyName) {
        setFormError("Please enter your company name.");
        return;
      }
  
      try {
        const res = await sendOtp(formData.email);
        setOtpStep("otp");
        if (res && res.debug_otp) {
          setDebugOtp(res.debug_otp);
        }
      } catch (err: any) {
        setFormError(err?.message || "Failed to send OTP. Please try again.");
      }
    } else {
      if (!otpCode || otpCode.length !== 6) {
        setFormError("Please enter a valid 6-digit OTP code.");
        return;
      }
  
      try {
        await verifyOtp(
          formData.email,
          otpCode,
          isRegisterMode ? formData.name : undefined,
          isRegisterMode && isMentorMode ? "mentor" : "student",
          isRegisterMode && isMentorMode ? companyName : undefined
        );
        setShowLoginDialog(false);
        setFormData({ name: "", email: "" });
        setOtpStep("email");
        setOtpCode("");
        setDebugOtp("");
        setIsMentorMode(false);
        setCompanyName("");
        
        if (isRegisterMode) {
          if (isMentorMode) {
            router.push("/mentors/apply");
          } else {
            router.push("/onboarding");
          }
        } else {
          router.push("/dashboard");
        }
      } catch (err: any) {
        setFormError(err?.message || "Invalid OTP code. Please try again.");
      }
    }
  };

  const features = [
    {
      icon: Target,
      title: "Skill Gap Analysis",
      description:
        "AI analyzes your current skills against your dream role and creates a personalized roadmap to bridge the gap.",
      gradient: "from-primary to-cyan-400",
      backImage: "/images/career_growth.png",
      backTitle: "Career Growth Analytics",
      backDescription: "Bridge your skill gaps with prioritized roadmaps and targeted learning milestones designed for career progression.",
      key: "skill-gap",
    },
    {
      icon: FolderKanban,
      title: "Project Recommendations",
      description:
        "Get AI-curated project suggestions that build the exact skills employers are looking for in your target role.",
      gradient: "from-secondary to-purple-400",
      backImage: "/images/complexity_chip.png",
      backTitle: "Code Complexity Insights",
      backDescription: "Build real-world developer projects optimized for difficulty, algorithmic depth, and production readiness.",
      key: "projects",
    },
    {
      icon: Users,
      title: "Mentor Matching",
      description:
        "Connect with experienced professionals who've walked your path. AI matches you with the perfect mentor.",
      gradient: "from-accent to-pink-400",
      backImage: "/images/portfolio_badge.png",
      backTitle: "Expert Onboarding Reviews",
      backDescription: "Schedule direct 1:1 sessions, receive peer reviews on your code submissions, and accelerate your growth.",
      key: "mentors",
    },
    {
      icon: Shield,
      title: "Automated Resume Audit",
      description:
        "AI inspects your CV against target job requirements, giving actionable improvements to stand out to recruiters.",
      gradient: "from-primary to-purple-500",
      backImage: "/images/target_analysis.png",
      backTitle: "Precision CV Audits",
      backDescription: "Instantly scan and score your resume layout, skill matches, and project relevance dynamically.",
      key: "resume-audit",
    },
  ];

  const stats = [
    { label: "Skills Tracked", value: counts.skills, suffix: "+" },
    { label: "Projects", value: counts.projects, suffix: "+" },
    { label: "Expert Mentors", value: counts.mentors, suffix: "+" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <CursorParticles />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-32">
          {/* Custom style block for typing cursor & mockups animations */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes float-slow {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-8px) rotate(0.5deg); }
            }
            @keyframes float-delay {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(8px) rotate(-0.5deg); }
            }
            @keyframes float-pulse {
              0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0.8; }
              50% { transform: translateY(-5px) scale(1.04) rotate(0.5deg); opacity: 0.95; }
            }
            @keyframes float-rotate {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-6px) rotate(3deg); }
            }
            .animate-float-slow {
              animation: float-slow 6s ease-in-out infinite;
            }
            .animate-float-delay {
              animation: float-delay 7s ease-in-out infinite;
            }
            .animate-float-pulse {
              animation: float-pulse 5s ease-in-out infinite;
            }
            .animate-float-rotate {
              animation: float-rotate 8s ease-in-out infinite;
            }
            .blink-cursor {
              border-right: 2px solid #06b6d4;
              animation: blink 0.75s step-end infinite;
            }
            @keyframes blink {
              from, to { border-color: transparent }
              50% { border-color: #06b6d4; }
            }
          `}} />

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start space-y-8 relative">
              {/* Decorative background visual graphic behind text for rich UI depth */}
              <div className="absolute -left-16 -top-16 w-40 h-40 opacity-[0.08] blur-[2px] animate-float-slow pointer-events-none z-0">
                <img src="/images/skill_synergy.png" className="w-full h-full object-contain" alt="" />
              </div>

              {/* Decorative background milestone graphic in the whitespace towards the right */}
              <div className="absolute right-0 bottom-4 w-28 h-28 opacity-15 blur-[0.5px] animate-float-delay pointer-events-none z-0 hidden sm:block">
                <img src="/images/career_milestone.png" className="w-full h-full object-contain" alt="" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium animate-fadeIn z-10">
                <Sparkles className="h-4 w-4" />
                AI-Powered Career Intelligence
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slideUp leading-[1.2] w-full flex flex-col items-center lg:items-start space-y-2 z-10">
                <span className="text-foreground block">Accelerate Your</span>
                <span className="gradient-text pb-1 pr-2 inline-block blink-cursor">
                  {typedText || "\u00A0"}
                </span>
                <span className="text-foreground block">with AI</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-muted max-w-xl animate-slideUp" style={{ animationDelay: "0.1s" }}>
                Identify skill gaps, discover custom projects, and connect with
                professional mentors — including free passion service coaching, support for INR conversions, and automated CV review.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 w-full animate-slideUp" style={{ animationDelay: "0.2s" }}>
                <Button
                  size="lg"
                  className="group min-w-[180px]"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setIsMentorMode(false);
                    setShowLoginDialog(true);
                  }}
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="min-w-[180px] border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setIsMentorMode(true);
                    setShowLoginDialog(true);
                  }}
                >
                  Join as Mentor
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="min-w-[100px]"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setShowLoginDialog(true);
                  }}
                >
                  Login
                </Button>
              </div>
            </div>

            {/* Right Column (Visual Mockups) */}
            <div className="lg:col-span-5 relative h-[420px] sm:h-[480px] w-full mt-12 lg:mt-0 select-none animate-fadeIn max-w-[450px] lg:max-w-none mx-auto" style={{ animationDelay: "0.15s" }}>
              {/* Decorative 3D graphic background accent 1 (behind Mockup 1) */}
              <div className="absolute top-[-30px] right-[160px] w-28 h-28 opacity-35 blur-[0.5px] animate-float-rotate pointer-events-none z-10">
                <img src="/images/portfolio_badge.png" className="w-full h-full object-contain" alt="" />
              </div>

              {/* Decorative 3D graphic background accent 2 (behind Mockup 2) */}
              <div className="absolute bottom-[20px] left-[150px] w-24 h-24 opacity-35 blur-[0.5px] animate-float-pulse pointer-events-none z-10">
                <img src="/images/clarity_flow.png" className="w-full h-full object-contain" alt="" />
              </div>

              {/* Decorative 3D graphic background accent 3 (behind Mockup 3) */}
              <div className="absolute top-[160px] left-[-30px] w-24 h-24 opacity-30 blur-[0.5px] animate-float-delay pointer-events-none z-10">
                <img src="/images/complexity_chip.png" className="w-full h-full object-contain" alt="" />
              </div>

              {/* Mockup 1: AI Mentor Match Card */}
              <div className="absolute top-0 right-0 w-[300px] h-fit animate-float-slow z-20 hover:z-50">
                <div className="glass-card p-5 bg-[#12121a]/85 border-white/10 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:shadow-primary/20 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/35 text-primary text-[10px] font-bold">
                      <Sparkles className="h-3 w-3" />
                      98% AI Match
                    </span>
                    <Badge variant="success" className="text-[9px] bg-success/20 text-success border-success/30 font-bold">Available</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      PC
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Priya Patel</h4>
                      <p className="text-[10px] text-muted font-medium">Senior ML Architect at Stripe</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted leading-relaxed italic mb-3.5 border-l-2 border-primary/40 pl-2">
                    &ldquo;I will review your ML project models, help deploy inference pipelines, and guide your resume review.&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div>
                      <span className="text-[9px] text-muted block uppercase tracking-wider font-semibold">Passion Rate</span>
                      <span className="text-xs font-bold text-success">₹0 / hr (Free Session)</span>
                    </div>
                    <div className="h-7 px-3 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-foreground flex items-center cursor-pointer hover:bg-white/10">
                      Book Call
                    </div>
                  </div>
                </div>
              </div>

              {/* Mockup 2: Skill Gap Circular Progress */}
              <div className="absolute bottom-4 left-0 w-[240px] h-fit animate-float-delay z-30 hover:z-50">
                <div className="glass-card p-5 bg-[#12121a]/90 border-white/10 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-secondary/50 hover:shadow-secondary/20 cursor-pointer">
                  <h4 className="text-xs font-bold text-foreground mb-4 flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary" />
                    Full-Stack Career Goal
                  </h4>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" className="stroke-white/5 fill-none" strokeWidth="5" />
                        <circle cx="32" cy="32" r="28" className="stroke-primary fill-none" strokeWidth="5" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * (1 - 0.74)} strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-xs font-black text-foreground">74%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Next Step:</span>
                      <span className="text-xs font-bold text-foreground block">System Architecture</span>
                      <span className="text-[9px] text-primary block mt-0.5">Est. 2 weeks left</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[9px] bg-white/5 border-white/5 py-0">Docker</Badge>
                    <Badge variant="outline" className="text-[9px] bg-white/5 border-white/5 py-0">Next.js</Badge>
                    <Badge variant="outline" className="text-[9px] bg-white/5 border-white/5 py-0">Python</Badge>
                  </div>
                </div>
              </div>

              {/* Mockup 3: GitHub Complexity Analysis */}
              <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-[220px] h-fit z-10 hover:z-50">
                <div className="glass-card p-4 bg-[#12121a]/80 border-white/5 shadow-xl transition-all duration-300 hover:scale-105 hover:border-accent/50 hover:shadow-accent/20 cursor-pointer">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                    <span className="text-[9px] text-muted font-bold block uppercase tracking-wider">GitHub Analyzer</span>
                    <Badge className="text-[8px] bg-primary/20 text-primary border-primary/35">Project Audited</Badge>
                  </div>
                  
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-[10px] font-medium mb-1">
                        <span className="text-muted">Problem Clarity</span>
                        <span className="text-foreground">8.8 / 10</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: "88%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-medium mb-1">
                        <span className="text-muted">Complexity</span>
                        <span className="text-foreground">9.4 / 10</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-secondary to-accent rounded-full" style={{ width: "94%" }} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-medium pt-1.5">
                      <span className="text-muted">Portfolio Grade:</span>
                      <span className="text-xs font-black text-success">Grade A</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-24 grid grid-cols-3 max-w-2xl mx-auto gap-8 animate-slideUp border-t border-white/5 pt-12" style={{ animationDelay: "0.3s" }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold gradient-text">
                  {stat.value.toLocaleString()}
                  {stat.suffix}
                </p>
                <p className="text-sm text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Level Up</span>
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Our AI analyzes thousands of job listings, projects, and career
              paths to give you personalized guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="w-full h-[280px] perspective-1000 group cursor-pointer"
                  onClick={() => toggleFlip(feature.key)}
                >
                  <div className={`w-full h-full flip-card-inner relative duration-700 preserve-3d ${flippedCards[feature.key] ? 'flipped' : ''}`}>
                    
                    {/* Front Side */}
                    <div className="absolute inset-0 w-full h-full backface-hidden">
                      <div className="glass-card p-8 flex flex-col h-full justify-between">
                        <div>
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-3">
                            {feature.title}
                          </h3>
                          <p className="text-muted text-sm leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                        <span className="text-[10px] text-primary mt-4 font-semibold uppercase tracking-wider group-hover:underline">Hover or Click for Details →</span>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-[#12121a]/95 border border-white/10 rotate-y-180 backface-hidden overflow-hidden flex flex-col justify-end p-6 shadow-2xl">
                      <img 
                        src={feature.backImage} 
                        alt={`${feature.title} Details Background`}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/95 via-[#0a0a0f]/50 to-transparent" />
                      <div className="relative z-10 space-y-2 text-left">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-base font-bold text-foreground">
                          {feature.backTitle}
                        </h3>
                        <p className="text-xs text-muted leading-relaxed">
                          {feature.backDescription}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Dashboard Preview Section */}
      <section className="py-24 relative overflow-hidden border-t border-white/5 bg-surface/10">
        {/* Background decorative gradient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              A Complete <span className="gradient-text">Career Control Center</span>
            </h2>
            <p className="text-muted text-base">
              Take a look inside the CareerAI workspace. Track your skills, audit projects against compiler benchmarks, and chat with matching mentors.
            </p>
          </div>

          {/* Interactive Mock Browser Window */}
          <div className="glass-card bg-[#12121a]/95 border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto text-left transition-all duration-500 hover:border-primary/30 hover:shadow-primary/5">
            
            {/* Browser Header Bar */}
            <div className="bg-[#0a0a0f] border-b border-white/5 px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg px-8 py-1 text-xs text-muted font-mono select-none w-1/2 text-center truncate">
                https://career-ai.platform/dashboard
              </div>
              <div className="w-12" />
            </div>

            {/* Browser Body Area */}
            <div className="grid md:grid-cols-12 min-h-[440px]">
              
              {/* Mock Sidebar */}
              <div className="md:col-span-3 border-r border-white/5 bg-[#0a0a0f]/50 p-4 space-y-6 hidden md:block">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">C</div>
                  <span className="text-xs font-bold text-foreground">CareerAI Platform</span>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[9px] text-muted block uppercase tracking-wider font-semibold px-2 mb-2">Workspace</span>
                  <div className="px-3 py-2 bg-white/5 rounded-lg text-xs font-semibold text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Dashboard
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-muted hover:text-foreground hover:bg-white/5 rounded-lg transition-all flex items-center gap-2 cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent" /> Technical Projects
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-muted hover:text-foreground hover:bg-white/5 rounded-lg transition-all flex items-center gap-2 cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent" /> Mentors & Coaches
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-muted hover:text-foreground hover:bg-white/5 rounded-lg transition-all flex items-center gap-2 cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent" /> Resume Audit
                  </div>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="md:col-span-9 p-6 space-y-6 bg-[#12121a]/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Welcome back, Alex!</h3>
                    <p className="text-[11px] text-muted">Here is your progress toward becoming a <span className="text-primary font-semibold">Senior Full-Stack Developer</span>.</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/35 self-start sm:self-auto text-[9px]">Step 3 of 5</Badge>
                </div>

                <div className="grid sm:grid-cols-12 gap-6">
                  
                  {/* Left Column: Progress Card */}
                  <div className="sm:col-span-5 glass-card p-5 bg-[#12121a]/85 border-white/5 space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Roadmap Progress</h4>
                      <p className="text-[10px] text-muted">Target role matches completed projects</p>
                    </div>
                    
                    <div className="flex items-center justify-center py-2">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" className="stroke-white/5 fill-none" strokeWidth="6" />
                          <circle cx="48" cy="48" r="40" className="stroke-secondary fill-none" strokeWidth="6" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - 0.68)} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-base font-black text-foreground">68%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] text-muted">
                        <span>Missing Skill Gap</span>
                        <span className="text-secondary font-bold">32% remaining</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "68%" }} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Missing Skills & Recommendations */}
                  <div className="sm:col-span-7 space-y-4">
                    
                    {/* Missing Skills Card */}
                    <div className="glass-card p-4 bg-[#12121a]/80 border-white/5 space-y-3">
                      <h4 className="text-xs font-bold text-foreground">Priority Skill Gaps</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-[11px] font-semibold text-foreground">System Architecture & Docker</span>
                          <Badge className="bg-error/20 text-error border-error/30 text-[8px] px-2 py-0">High Priority</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-[11px] font-semibold text-foreground">Redis Cache & Performance Optimization</span>
                          <Badge className="bg-warning/20 text-warning border-warning/30 text-[8px] px-2 py-0">Medium Priority</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Quick Recommendation */}
                    <div className="glass-card p-4 bg-[#12121a]/80 border-white/5 space-y-2">
                      <h4 className="text-xs font-bold text-foreground">AI Recommended Project</h4>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Microservices API Gateway</span>
                          <span className="text-[10px] text-muted">Build a resilient Dockerized gateway with rate-limiting.</span>
                        </div>
                        <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full whitespace-nowrap">+12% Match</span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          </div>
          
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Zap,
                title: "Tell Us Your Goals",
                description:
                  "Select your dream role and add your current skills. Our AI starts analyzing instantly.",
                image: "/images/clarity_flow.png",
                animationClass: "animate-float-slow",
              },
              {
                step: "02",
                icon: TrendingUp,
                title: "Get Your Roadmap",
                description:
                  "Receive a personalized learning path with prioritized skills, projects, and resources.",
                image: "/images/career_growth.png",
                animationClass: "animate-float-delay",
              },
              {
                step: "03",
                icon: Shield,
                title: "Build & Grow",
                description:
                  "Complete projects, connect with mentors, and track your progress toward your dream career.",
                image: "/images/complexity_chip.png",
                animationClass: "animate-float-pulse",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.step} 
                  className="glass-card p-6 bg-[#12121a]/85 border-white/5 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/20 flex flex-col justify-between items-center text-center overflow-hidden group relative h-[340px]"
                >
                  {/* Animated 3D Header Image */}
                  <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 relative border border-white/10 bg-[#0a0a0f] flex items-center justify-center select-none">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className={`object-cover w-full h-full opacity-80 transition-transform duration-500 group-hover:scale-105 ${item.animationClass}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/90 via-[#0a0a0f]/20 to-transparent" />
                  </div>

                  <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-xl font-black text-primary/30 font-mono">
                        {item.step}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-muted text-[11px] leading-relaxed max-w-[240px] mx-auto">{item.description}</p>
                  </div>

                  {index < 2 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 text-primary/25 z-20">
                      <ArrowRight className="h-5 w-5 animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Synergy Showcase Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Rich Animated 3D Artwork Showcase */}
            <div className="lg:col-span-6 flex justify-center items-center relative h-[420px] select-none">
              
              {/* Main Animated 3D Image Card */}
              <div className="relative w-[320px] h-[320px] glass-card p-6 bg-[#12121a]/85 border-white/10 shadow-2xl flex flex-col justify-between items-center group cursor-pointer overflow-hidden z-20 hover:border-primary/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 opacity-60" />
                
                {/* Glowing Background Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
                
                <div className="w-full h-full relative z-10 flex items-center justify-center">
                  <img 
                    src="/images/skill_synergy.png" 
                    alt="Skill Synergy" 
                    className="w-full h-full object-contain animate-float-slow group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                
                <div className="relative z-10 text-center space-y-1">
                  <span className="text-xs font-black uppercase tracking-widest text-primary">AI Skill Mapping</span>
                  <p className="text-[10px] text-muted">Synergistic connection pathways optimized by deep models</p>
                </div>
              </div>
              
              {/* Secondary Animated Floating Image 1 (Milestone) */}
              <div className="absolute -top-4 -right-2 w-28 h-28 glass-card p-2 bg-[#12121a]/90 border-white/10 shadow-xl flex items-center justify-center animate-float-delay hover:z-30 cursor-pointer">
                <img 
                  src="/images/career_milestone.png" 
                  alt="Career Milestone" 
                  className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Secondary Animated Floating Image 2 (Analysis Scan) */}
              <div className="absolute -bottom-4 -left-2 w-28 h-28 glass-card p-2 bg-[#12121a]/90 border-white/10 shadow-xl flex items-center justify-center animate-float-pulse hover:z-30 cursor-pointer">
                <img 
                  src="/images/target_analysis.png" 
                  alt="Target Analysis" 
                  className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="lg:col-span-6 space-y-8 text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-xs font-semibold">
                  <Zap className="h-3.5 w-3.5" />
                  Engineering Career Accelerations
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                  Maximize Your Potential with <br className="hidden sm:inline" />
                  <span className="gradient-text">Interactive AI Core Analytics</span>
                </h2>
                <p className="text-muted text-sm leading-relaxed">
                  CareerAI is built on modern neural mappings that align your actual repositories and completed milestones directly with industrial job demands. Learn what counts, verify with experts, and scale.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-primary/20 transition-all duration-300">
                  <h4 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    INR Passion Coaching
                  </h4>
                  <p className="text-[11px] text-muted">
                    No credit card blockages. Learn from industry leaders for free or clear INR micro-fees.
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-secondary/20 transition-all duration-300">
                  <h4 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    Real-time CV Audit
                  </h4>
                  <p className="text-[11px] text-muted">
                    Instant scan checks on your resume draft alignment for technical positions.
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-accent/20 transition-all duration-300">
                  <h4 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    GitHub Source Audits
                  </h4>
                  <p className="text-[11px] text-muted">
                    Connect your GitHub repo to check structure, algorithm complexity and clean standards.
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-success/20 transition-all duration-300">
                  <h4 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    Verified Onboardings
                  </h4>
                  <p className="text-[11px] text-muted">
                    Ensure administrative security with facial verification checks and password-secured contracts.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Ready to{" "}
                <span className="gradient-text">Transform Your Career</span>?
              </h2>
              <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
                Join thousands of developers who are using AI to accelerate their
                career growth.
              </p>
              <Button
                size="lg"
                className="group"
                onClick={() => router.push("/onboarding")}
              >
                Start Your Journey
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="text-sm font-semibold gradient-text">
                CareerAI
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link href="#" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-muted hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="text-muted hover:text-foreground transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="text-muted hover:text-foreground transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-muted mt-8">
            © {new Date().getFullYear()} CareerAI. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Login/Register Dialog */}
      <Dialog
        open={showLoginDialog}
        onClose={handleCloseDialog}
        size="sm"
      >
        <DialogHeader
          onClose={handleCloseDialog}
        >
          <DialogTitle>
            {isRegisterMode ? "Create Account" : "Welcome Back"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {otpStep === "email" && (
              <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMentorMode(false);
                    setCompanyName("");
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    !isMentorMode
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setIsMentorMode(true)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isMentorMode
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Mentor Coach
                </button>
              </div>
            )}

            {otpStep === "email" ? (
              <>
                {isRegisterMode && (
                  <>
                    <Input
                      label="Name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />

                    {isMentorMode && (
                      <Input
                        label="Company Name"
                        placeholder="Google, Stripe, Microsoft etc."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    )}
                  </>
                )}
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </>
            ) : (
              <>
                <div className="text-center py-2">
                  <p className="text-sm text-muted">
                    We've sent an OTP to <span className="font-semibold text-foreground">{formData.email}</span>
                  </p>
                  <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded-lg inline-block text-xs text-primary">
                    💡 Testing Code: <span className="font-bold font-mono">{debugOtp || "123456"}</span> (Or use master code <span className="font-bold font-mono">123456</span>)
                  </div>
                </div>
                <Input
                  label="One-Time Password (OTP)"
                  placeholder=""
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-xl font-bold tracking-[0.5em]"
                  helperText={`Hint: Enter the 6-digit code. (Testing code is ${debugOtp || "123456"})`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("email");
                    setOtpCode("");
                    setDebugOtp("");
                    setFormError("");
                  }}
                  className="text-xs text-primary hover:underline block mx-auto mt-2"
                >
                  Change email or resend code
                </button>
              </>
            )}
            
            {(formError || error) && (
              <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                {formError || error}
              </p>
            )}
            <Button type="submit" className="w-full" isLoading={isLoading}>
              {otpStep === "email"
                ? "Send Verification Code"
                : isRegisterMode
                ? "Verify & Create Account"
                : "Verify & Login"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted mt-4">
            {isRegisterMode ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setIsMentorMode(false);
                setCompanyName("");
                setFormError("");
                clearError();
                setOtpStep("email");
                setOtpCode("");
                setDebugOtp("");
              }}
              className="text-primary hover:text-primary/80 font-medium"
            >
              {isRegisterMode ? "Login" : "Sign up"}
            </button>
          </p>
        </DialogBody>
      </Dialog>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  );
}
