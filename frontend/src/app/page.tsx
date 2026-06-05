"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [otpStep, setOtpStep] = useState<"email" | "otp">("email");
  const [otpCode, setOtpCode] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [formError, setFormError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Open login dialog from URL param
  useEffect(() => {
    if (searchParams?.get("login") === "true") {
      setShowLoginDialog(true);
    }
  }, [searchParams]);

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
      if (isRegisterMode && !formData.name) {
        setFormError("Please enter your name.");
        return;
      }
  
      try {
        const res = await sendOtp(formData.email);
        setOtpStep("otp");
        if (res && res.debug_otp) {
          setDebugOtp(res.debug_otp);
        }
      } catch {
        setFormError(error || "Failed to send OTP. Please try again.");
      }
    } else {
      if (!otpCode || otpCode.length !== 6) {
        setFormError("Please enter a valid 6-digit OTP code.");
        return;
      }
  
      try {
        await verifyOtp(formData.email, otpCode, isRegisterMode ? formData.name : undefined);
        setShowLoginDialog(false);
        setFormData({ name: "", email: "" });
        setOtpStep("email");
        setOtpCode("");
        setDebugOtp("");
        
        if (isRegisterMode) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } catch {
        setFormError(error || "Invalid OTP code. Please try again.");
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
    },
    {
      icon: FolderKanban,
      title: "Project Recommendations",
      description:
        "Get AI-curated project suggestions that build the exact skills employers are looking for in your target role.",
      gradient: "from-secondary to-purple-400",
    },
    {
      icon: Users,
      title: "Mentor Matching",
      description:
        "Connect with experienced professionals who've walked your path. AI matches you with the perfect mentor.",
      gradient: "from-accent to-pink-400",
    },
  ];

  const stats = [
    { label: "Skills Tracked", value: counts.skills, suffix: "+" },
    { label: "Projects", value: counts.projects, suffix: "+" },
    { label: "Expert Mentors", value: counts.mentors, suffix: "+" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-8 animate-fadeIn">
              <Sparkles className="h-4 w-4" />
              AI-Powered Career Intelligence
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slideUp">
              <span className="text-foreground">Accelerate Your</span>
              <br />
              <span className="gradient-text">Tech Career</span>
              <br />
              <span className="text-foreground">with AI</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 animate-slideUp" style={{ animationDelay: "0.1s" }}>
              Identify skill gaps, discover impactful projects, and connect with
              mentors — all powered by intelligent AI that understands your career
              goals.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideUp" style={{ animationDelay: "0.2s" }}>
              <Button
                size="lg"
                className="group min-w-[200px]"
                onClick={() => router.push("/onboarding")}
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px]"
                onClick={() => {
                  setIsRegisterMode(false);
                  setShowLoginDialog(true);
                }}
              >
                Login
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 max-w-lg mx-auto gap-8 animate-slideUp" style={{ animationDelay: "0.3s" }}>
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

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass-card glass-card-hover p-8 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
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
              },
              {
                step: "02",
                icon: TrendingUp,
                title: "Get Your Roadmap",
                description:
                  "Receive a personalized learning path with prioritized skills, projects, and resources.",
              },
              {
                step: "03",
                icon: Shield,
                title: "Build & Grow",
                description:
                  "Complete projects, connect with mentors, and track your progress toward your dream career.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative text-center">
                  <div className="text-6xl font-black text-white/5 mb-4">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted text-sm">{item.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-16 -right-4 w-8 text-white/10">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  )}
                </div>
              );
            })}
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
        onClose={() => {
          setShowLoginDialog(false);
          clearError();
          setFormError("");
          setOtpStep("email");
          setOtpCode("");
          setDebugOtp("");
        }}
        size="sm"
      >
        <DialogHeader
          onClose={() => {
            setShowLoginDialog(false);
            clearError();
            setFormError("");
            setOtpStep("email");
            setOtpCode("");
            setDebugOtp("");
          }}
        >
          <DialogTitle>
            {isRegisterMode ? "Create Account" : "Welcome Back"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {otpStep === "email" ? (
              <>
                {isRegisterMode && (
                  <Input
                    label="Name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
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
                  {debugOtp && (
                    <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded-lg inline-block text-xs text-primary">
                      💡 Testing Code: <span className="font-bold font-mono">{debugOtp}</span>
                    </div>
                  )}
                </div>
                <Input
                  label="One-Time Password (OTP)"
                  placeholder="123456"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-xl font-bold tracking-[0.5em]"
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
