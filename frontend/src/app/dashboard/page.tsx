"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, API_URL } from "@/lib/api";
import { cn, getTimeGreeting, formatDualCurrency, formatDualCurrencyAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Bell,
  ShieldAlert,
  Shield,
  Lock,
  ShieldCheck,
  Calendar,
  Star,
  Loader2,
  Video,
  Camera,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Laptop,
  Circle,
  Square,
  Edit,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [mentorProfile, setMentorProfile] = useState<Mentor | null>(null);
  const [isTogglingVideoCalls, setIsTogglingVideoCalls] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState<"admin" | "mentor">("admin");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [learningPathOpen, setLearningPathOpen] = useState(false);
  const [pendingMentors, setPendingMentors] = useState<Mentor[]>([]);
  const [mentorSessions, setMentorSessions] = useState<MentorSession[]>([]);
  const [mentorReports, setMentorReports] = useState<any[]>([]);

  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [leaveCooldown, setLeaveCooldown] = useState<number>(0);

  // Admin Dashboard States
  const [adminActiveTab, setAdminActiveTab] = useState<"reviews" | "users" | "sessions" | "performance" | "pricing" | "agreements">("reviews");
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [editingMentorPricing, setEditingMentorPricing] = useState<string | null>(null);
  const [editHourlyRate, setEditHourlyRate] = useState<string>("");
  const [editOriginalPrice, setEditOriginalPrice] = useState<string>("");
  const [unlockingMentor, setUnlockingMentor] = useState<Mentor | null>(null);
  const [agreementPassword, setAgreementPassword] = useState<string>("");
  const [unlockError, setUnlockError] = useState<string>("");

  // Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<"mentor" | "student">("mentor");
  const [reportTargetMentorId, setReportTargetMentorId] = useState("");
  const [reportTargetMentorName, setReportTargetMentorName] = useState("");
  const [reportTargetStudentId, setReportTargetStudentId] = useState("");
  const [reportTargetStudentName, setReportTargetStudentName] = useState("");
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

  const handleToggleVideoCalls = async () => {
    setIsTogglingVideoCalls(true);
    setError("");
    setSuccess("");
    try {
      const updatedProfile = await api.mentors.toggleVideoCalls();
      setMentorProfile(updatedProfile);
      setSuccess(`Video call status toggled successfully to ${updatedProfile.video_calls_active !== false ? "active" : "inactive"}.`);
    } catch (err: any) {
      setError(err?.message || "Failed to toggle video calls status.");
    } finally {
      setIsTogglingVideoCalls(false);
    }
  };

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

  // AI Project Template Generator states
  const [aiProjectInput, setAiProjectInput] = useState<string>("");
  const [isGeneratingAIProject, setIsGeneratingAIProject] = useState<boolean>(false);

  // Mentor Onboarding Verification Blocker States
  const [wizStep, setWizStep] = useState(1);
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const [selfieFileName, setSelfieFileName] = useState<string>("");
  const [idFile, setIdFile] = useState<string | null>(null);
  const [idFileName, setIdFileName] = useState<string>("");

  // Camera & AI verification states
  const [selfieMode, setSelfieMode] = useState<"idle" | "camera" | "file">("idle");
  const [idMode, setIdMode] = useState<"idle" | "camera" | "file">("idle");
  const [aiVerifyStatus, setAiVerifyStatus] = useState<"idle" | "verifying" | "passed" | "failed">("idle");
  const [aiVerifyStep, setAiVerifyStep] = useState<number>(0);
  const [aiVerifyLogs, setAiVerifyLogs] = useState<string[]>([]);
  const [aiMatchScore, setAiMatchScore] = useState<number | null>(null);
  const [wizIdType, setWizIdType] = useState<string>("");

  const selfieVideoRef = useRef<HTMLVideoElement>(null);
  const idVideoRef = useRef<HTMLVideoElement>(null);
  const selfieStreamRef = useRef<MediaStream | null>(null);
  const idStreamRef = useRef<MediaStream | null>(null);

  // Camera cleanup on unmount
  useEffect(() => {
    return () => {
      if (selfieStreamRef.current) {
        selfieStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (idStreamRef.current) {
        idStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startSelfieCamera = async () => {
    if (!wizIdType) {
      setError("Please select a Government ID Type first.");
      return;
    }
    setSelfieMode("camera");
    setSelfieFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      });
      selfieStreamRef.current = stream;
      setTimeout(() => {
        if (selfieVideoRef.current) {
          selfieVideoRef.current.srcObject = stream;
        }
      }, 150);
      setError("");
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Unable to access front camera. Please upload an image instead.");
      setSelfieMode("idle");
    }
  };

  const stopSelfieCamera = () => {
    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach(track => track.stop());
      selfieStreamRef.current = null;
    }
    setSelfieMode("idle");
  };

  const captureSelfieSnapshot = () => {
    if (selfieVideoRef.current) {
      const video = selfieVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelfieFile(dataUrl);
        setSelfieFileName("webcam_selfie.jpg");
        setAiVerifyStatus("idle");
        setAiVerifyLogs([]);
      }
    }
    stopSelfieCamera();
  };

  const startIdCamera = async () => {
    if (!wizIdType) {
      setError("Please select a Government ID Type first.");
      return;
    }
    setIdMode("camera");
    setIdFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "environment" }
      });
      idStreamRef.current = stream;
      setTimeout(() => {
        if (idVideoRef.current) {
          idVideoRef.current.srcObject = stream;
        }
      }, 150);
      setError("");
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Unable to access back camera. Please upload a document image instead.");
      setIdMode("idle");
    }
  };

  const stopIdCamera = () => {
    if (idStreamRef.current) {
      idStreamRef.current.getTracks().forEach(track => track.stop());
      idStreamRef.current = null;
    }
    setIdMode("idle");
  };

  const captureIdSnapshot = () => {
    if (idVideoRef.current) {
      const video = idVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setIdFile(dataUrl);
        setIdFileName("webcam_id.jpg");
        setAiVerifyStatus("idle");
        setAiVerifyLogs([]);
      }
    }
    stopIdCamera();
  };

  const handleSelfieFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!wizIdType) {
      setError("Please select a Government ID Type first.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelfieFile(reader.result);
          setSelfieFileName(file.name);
          setSelfieMode("file");
          setAiVerifyStatus("idle");
          setAiVerifyLogs([]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!wizIdType) {
      setError("Please select a Government ID Type first.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setIdFile(reader.result);
          setIdFileName(file.name);
          setIdMode("file");
          setAiVerifyStatus("idle");
          setAiVerifyLogs([]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiVerification = () => {
    setAiVerifyStatus("verifying");
    setAiVerifyLogs([]);
    setAiVerifyStep(0);
    setError("");

    const cleanSelfie = selfieFile ? (selfieFile.includes(",") ? selfieFile.split(",")[1] : selfieFile) : "";
    const cleanId = idFile ? (idFile.includes(",") ? idFile.split(",")[1] : idFile) : "";

    // 1. Check duplicate/identical uploads (fast path)
    if (cleanSelfie && cleanSelfie === cleanId) {
      const logs = [
        "🔍 AI Verification Agent initiating...",
        "📡 Calibrating biometric scanners and visual filters...",
        "📂 Analyzing identity document structure...",
        "❌ AI Biometric Verification Failed: Selfie photo and ID document image are identical.",
        "⚠️ Safety Guard: You must capture a real-time webcam selfie and upload a separate government-issued ID card."
      ];
      logs.forEach((log, index) => {
        setTimeout(() => {
          setAiVerifyLogs(prev => [...prev, log]);
          setAiVerifyStep(index + 1);
          if (index === logs.length - 1) {
            setAiVerifyStatus("failed");
            setAiMatchScore(0);
            setError("Biometric verification failed: Selfie and ID document are identical.");
          }
        }, (index + 1) * 350);
      });
      return;
    }

    // 2. Check academic transcript / marksheet filename (fast path)
    const academicKeywords = ["marksheet", "12th", "10th", "grade", "certificate", "resume", "cv", "transcript", "degree", "result", "diploma", "report", "hsc", "ssc", "board"];
    const nameLower = (idFileName || "").toLowerCase();
    const isAcademic = academicKeywords.some(kw => nameLower.includes(kw));

    if (isAcademic) {
      const logs = [
        "🔍 AI Verification Agent initiating...",
        "📂 Analyzing identity document structure and typography...",
        "🔬 Running optical character recognition (OCR) check...",
        `❌ Safety Violation: Uploaded document recognized as an academic transcript or marksheet.`,
        `⚠️ The AI agent rejects '${idFileName}'. Please upload an official government-issued ID (e.g. Aadhaar Card, Passport, Driver's License) for safety purposes.`
      ];
      logs.forEach((log, index) => {
        setTimeout(() => {
          setAiVerifyLogs(prev => [...prev, log]);
          setAiVerifyStep(index + 1);
          if (index === logs.length - 1) {
            setAiVerifyStatus("failed");
            setAiMatchScore(0);
            setError(`Safety Violation: Uploaded document '${idFileName}' recognized as academic transcript/marksheet. Government-issued ID required.`);
          }
        }, (index + 1) * 350);
      });
      return;
    }

    // Start Backend API Call in the background
    const apiPromise = api.mentors.verifyDocuments({
      selfie_base64: selfieFile || "",
      identity_document_base64: idFile || "",
      id_type: wizIdType || "national_id",
      selfie_filename: selfieFileName || "webcam_selfie.jpg",
      id_filename: idFileName || "webcam_id.jpg"
    });

    // Run progressive logs animation (showing system activity while waiting for the LLM)
    const initialLogs = [
      "🔍 AI Verification Agent initiating...",
      "📡 Calibrating biometric scanners and visual filters...",
      "📂 Analyzing identity document structure and typography...",
      "🔬 Running optical character recognition (OCR) check..."
    ];

    let currentStep = 0;
    const playLogs = () => {
      if (currentStep < initialLogs.length) {
        setAiVerifyLogs(prev => [...prev, initialLogs[currentStep]]);
        setAiVerifyStep(currentStep + 1);
        currentStep++;
        setTimeout(playLogs, 400);
      } else {
        // Now wait for the backend API call to finish
        apiPromise.then((result) => {
          const finalLogs = [
            `✓ Identity document type verified: ${(wizIdType || "National ID").toUpperCase()}`,
            `✓ OCR Check: ${result.ocr_check === "passed" ? "Valid layout, hallmarks matching." : "Failed."}`,
            "👤 Initializing biometric face model and keypoint mapping...",
            "📊 Extracting structural facial vector comparison...",
            `✓ Biometric match vector comparison completed.`,
            `🎉 AI Verification PASSED. Facial similarity score: ${result.similarity_score}%.`
          ];
          
          let subStep = 0;
          const playSubLogs = () => {
            if (subStep < finalLogs.length) {
              setAiVerifyLogs(prev => [...prev, finalLogs[subStep]]);
              setAiVerifyStep(initialLogs.length + subStep + 1);
              subStep++;
              setTimeout(playSubLogs, 300);
            } else {
              setAiVerifyStatus("passed");
              setAiMatchScore(result.similarity_score);
            }
          };
          playSubLogs();
        }).catch((err) => {
          const errMsg = err?.message || "Verification failed. Please ensure the photos are clear and show a valid ID.";
          const finalLogs = [
            `❌ AI Identity Verification Failed.`,
            `⚠️ Reason: ${errMsg}`
          ];
          
          let subStep = 0;
          const playSubLogs = () => {
            if (subStep < finalLogs.length) {
              setAiVerifyLogs(prev => [...prev, finalLogs[subStep]]);
              setAiVerifyStep(initialLogs.length + subStep + 1);
              subStep++;
              setTimeout(playSubLogs, 300);
            } else {
              setAiVerifyStatus("failed");
              setAiMatchScore(0);
              setError(errMsg);
            }
          };
          playSubLogs();
        });
      }
    };

    playLogs();
  };

  const [signedAgreement, setSignedAgreement] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [wizHourlyRate, setWizHourlyRate] = useState("75");
  const [wizCompany, setWizCompany] = useState("");
  const [wizExpertise, setWizExpertise] = useState<string[]>(["Full-Stack", "React", "Node.js", "Python"]);
  const [wizExpertiseInput, setWizExpertiseInput] = useState("");
  const [wizAvailability, setWizAvailability] = useState<any[]>([
    { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
    { day_of_week: 3, start_time: "09:00", end_time: "17:00" },
    { day_of_week: 5, start_time: "09:00", end_time: "14:00" }
  ]);
  const [isSubmittingWiz, setIsSubmittingWiz] = useState(false);

  // Project template creator state
  const [projTitle, setProjTitle] = useState<string>("");
  const [projDesc, setProjDesc] = useState<string>("");
  const [projDifficulty, setProjDifficulty] = useState<string>("beginner");
  const [projTechStack, setProjTechStack] = useState<string>("");
  const [projHours, setProjHours] = useState<number>(40);
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);

  // Published templates and video call sandbox states
  const [myTemplates, setMyTemplates] = useState<any[]>([]);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState<boolean>(false);
  const [activeVideoSession, setActiveVideoSession] = useState<any | null>(null);
  const [activeCallSessionAlert, setActiveCallSessionAlert] = useState<any | null>(null);
  const [transcriptionLogs, setTranscriptionLogs] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [peerIsMuted, setPeerIsMuted] = useState<boolean>(false);
  const [peerIsVideoMuted, setPeerIsVideoMuted] = useState<boolean>(false);
  const [peerIsRecording, setPeerIsRecording] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 15));
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerVideoRef = useRef<HTMLVideoElement | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const isStudent = activeVideoSession
    ? (String(activeVideoSession.student_id) === String(user?.id) || 
       String(activeVideoSession.mentee_id) === String(user?.id) ||
       (user?.email?.toLowerCase() !== "durgasravan21@gmail.com" && user?.role !== "mentor"))
    : false;

  const localVideoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (node) {
      node.srcObject = localStream;
    }
  }, [localStream]);

  const peerVideoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    peerVideoRef.current = node;
    if (node) {
      node.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const [sidebarTab, setSidebarTab] = useState<"transcript" | "chat">("transcript");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInputText, setChatInputText] = useState<string>("");
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingSocketRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [callConnectionState, setCallConnectionState] = useState<"connecting" | "ringing" | "connected" | "reconnecting" | "failed">("connecting");

  const sendSignal = async (msg: any) => {
    const payload = JSON.stringify(msg);
    // Always broadcast on BroadcastChannel for same-browser communication
    try {
      broadcastChannelRef.current?.postMessage(payload);
    } catch (e) { /* channel may not be open yet */ }
    // Also send via HTTP for cross-device signaling
    if (activeVideoSession) {
      try {
        await api.mentors.postSignal(activeVideoSession.id, payload);
      } catch (err) {
        console.warn("[Signal] HTTP postSignal failed (non-critical):", err);
      }
    }
  };

  const sendChatMessage = () => {
    if (!chatInputText.trim()) return;
    const senderName = user?.name || user?.email?.split("@")[0] || "User";
    const newMsg = {
      sender: senderName,
      text: chatInputText,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    };
    setChatMessages((prev) => [...prev, newMsg]);
    sendSignal({
      type: "chat",
      message: newMsg
    });
    setChatInputText("");
  };

  const [dismissedReminderId, setDismissedReminderId] = useState<any>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPeerOfflineAlertVisible, setIsPeerOfflineAlertVisible] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const handleSendReminder = async (sessionId: string | number) => {
    try {
      const result = await api.mentors.sendJoinReminder(sessionId);
      // Create a local notification for the student so they see it in the bell
      if (result && result.student_id) {
        const { addMockNotification } = await import("@/lib/api");
        addMockNotification(
          result.student_id,
          "🔔 Call Join Reminder",
          `Your mentor ${result.mentor_name || "your coach"} is waiting for you in the video call. Please join now!`,
          "warning"
        );
      }
      alert("Join reminder sent successfully to student!");
      const sessionsData = await api.mentors.getMySessions();
      setMentorSessions(sessionsData || []);
    } catch (err) {
      console.error("Failed to send join reminder:", err);
      alert("Error sending joining reminder.");
    }
  };

  const startRecording = () => {
    if (!localStream) return;
    recordedChunksRef.current = [];
    const streamsToRecord = new MediaStream();
    localStream.getTracks().forEach((track) => streamsToRecord.addTrack(track));
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => streamsToRecord.addTrack(track));
    }

    try {
      // Prefer codecs that produce broadly playable files
      const mimeTypes = [
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8",
        "video/webm;codecs=vp9",
        "video/webm",
        "video/mp4"
      ];
      let selectedMimeType = "";
      for (const type of mimeTypes) {
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      const options: MediaRecorderOptions = selectedMimeType ? { mimeType: selectedMimeType } : {};
      // Request higher bitrate for quality
      if (selectedMimeType) {
        options.videoBitsPerSecond = 2500000;
        options.audioBitsPerSecond = 128000;
      }
      const recorder = new MediaRecorder(streamsToRecord, options);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const mimeUsed = recorder.mimeType || "video/webm";
        const extension = mimeUsed.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(recordedChunksRef.current, { type: mimeUsed });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = `mentoring_session_${activeVideoSession?.id || "record"}.${extension}`;
        a.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 5000);
        alert("Session recording saved to downloads! Open the .webm file in Chrome, Firefox, or VLC for best playback.");
      };
      recorder.start(1000);
      setIsRecording(true);
      
      // Broadcast recording start to peer
      const payload = JSON.stringify({
        type: "recording_state",
        isRecording: true,
        isStudent: isStudent,
        clientId: clientIdRef.current,
        timestamp: Date.now()
      });
      try { broadcastChannelRef.current?.postMessage(payload); } catch (e) {}
      if (activeVideoSession) {
        api.mentors.postSignal(activeVideoSession.id, payload).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      alert("Recording is not fully supported in this browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Broadcast recording stop to peer
      const payload = JSON.stringify({
        type: "recording_state",
        isRecording: false,
        isStudent: isStudent,
        clientId: clientIdRef.current,
        timestamp: Date.now()
      });
      try { broadcastChannelRef.current?.postMessage(payload); } catch (e) {}
      if (activeVideoSession) {
        api.mentors.postSignal(activeVideoSession.id, payload).catch(() => {});
      }
    }
  };

  const handleLeaveCall = () => {
    stopRecording();
    // Stop screen sharing if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }
    setPeerIsMuted(false);
    setPeerIsVideoMuted(false);
    setPeerIsRecording(false);
    setIsVideoCallOpen(false);
  };

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

  // Auth guard, incomplete profile redirection, and auto-restore backup for students
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/?login=true");
      return;
    }

    if (user && user.role !== "mentor" && user.email.toLowerCase() !== "durgasravan21@gmail.com") {
      const targetRoleId = user.profile?.target_role_id;
      const skills = user.profile?.skills || [];

      if (!targetRoleId || skills.length === 0) {
        // Try to auto-restore from local backup to prevent loop if DB reset (e.g. Render sleep)
        const backupStr = localStorage.getItem(`completed_onboarding_${user.email.toLowerCase()}`);
        if (backupStr) {
          try {
            const backup = JSON.parse(backupStr);
            if (backup.target_role_id && backup.skills && backup.skills.length > 0) {
              console.log("Auto-restoring target role and skills from local storage backup...");
              const restoreOnboarding = async () => {
                try {
                  await api.user.updateSkills({ skills: backup.skills });
                  await api.user.updateProfile({ target_role_id: backup.target_role_id });
                  await api.career.generateRoadmap(backup.target_role_id);
                  await refreshUser();
                } catch (restoreErr) {
                  console.error("Auto-restore failed:", restoreErr);
                  router.push("/onboarding");
                }
              };
              restoreOnboarding();
              return;
            }
          } catch (e) {
            console.error("Backup JSON parsing failed:", e);
          }
        }
        router.push("/onboarding");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Keep onboarding local backup updated whenever valid user profile data is loaded
  useEffect(() => {
    if (user && user.profile?.target_role_id && user.profile?.skills && user.profile.skills.length > 0) {
      const backupData = {
        target_role_id: user.profile.target_role_id,
        skills: user.profile.skills.map((us: any) => ({
          skill_id: us.skill_id,
          proficiency: us.proficiency_level
        }))
      };
      localStorage.setItem(`completed_onboarding_${user.email.toLowerCase()}`, JSON.stringify(backupData));
    }
  }, [user]);

  // Background sessions polling hook (polls every 8 seconds when not actively in a call)
  useEffect(() => {
    if (!isAuthenticated || isVideoCallOpen) {
      setActiveCallSessionAlert(null);
      return;
    }

    const pollSessions = async () => {
      try {
        const sessionsData = await api.mentors.getMySessions();
        setMentorSessions(sessionsData || []);

        // Check if there is a call session active right now (starts within 30 mins, or started less than 1 hour ago)
        const currentActive = (sessionsData || []).find((s: any) => {
          if (s.status !== "confirmed") return false;
          const schedTime = new Date(s.scheduled_at).getTime();
          const now = Date.now();
          return (now - schedTime > -30 * 60 * 1000) && (now - schedTime < 60 * 60 * 1000);
        });

        if (currentActive) {
          // Poll signals for this active session to see if peer is in room
          try {
            const signals = await api.mentors.getSignals(currentActive.id);
            const peerSignals = (signals || []).filter((sig: any) => String(sig.sender_id) !== String(user?.id));
            if (peerSignals.length > 0) {
              setActiveCallSessionAlert(currentActive);
            } else {
              setActiveCallSessionAlert(null);
            }
          } catch (e) {
            setActiveCallSessionAlert(null);
          }
        } else {
          setActiveCallSessionAlert(null);
        }
      } catch (pollErr) {
        console.warn("Sessions polling failed:", pollErr);
      }
    };

    pollSessions();
    const interval = setInterval(pollSessions, 8000);
    return () => {
      clearInterval(interval);
      setActiveCallSessionAlert(null);
    };
  }, [isAuthenticated, isVideoCallOpen, user]);

  // 1-minute peer connection offline detection timer
  useEffect(() => {
    if (!isVideoCallOpen) {
      setIsPeerOfflineAlertVisible(false);
      return;
    }

    if (remoteStream) {
      setIsPeerOfflineAlertVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!remoteStream) {
        setIsPeerOfflineAlertVisible(true);
      }
    }, 60000); // 60 seconds

    return () => clearTimeout(timer);
  }, [isVideoCallOpen, remoteStream]);

  // 1-minute call leave cooldown timer to prevent early declines/exits
  useEffect(() => {
    if (!isVideoCallOpen) {
      setLeaveCooldown(0);
      return;
    }

    setLeaveCooldown(60);

    const interval = setInterval(() => {
      setLeaveCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVideoCallOpen]);

  // Fetch dashboard data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      setError("");
      try {
        if (user?.email?.toLowerCase() === "durgasravan21@gmail.com") {
          // Admin View: Fetch pending mentors, reports, active users, all mentors, pending submissions, and the admin's mentor profile
          const [pending, reports, activeUsersList, mentorsList, pendingSub, allSessions, adminMentorProfile] = await Promise.all([
            api.mentors.getPendingMentors(),
            api.mentors.getReports(),
            api.mentors.getActiveUsers(),
            api.mentors.getAll(),
            api.projects.getPendingSubmissions(),
            api.mentors.getMySessions(),
            api.mentors.getAppStatus().catch(() => null)
          ]);
          setPendingMentors(pending || []);
          setMentorReports(reports || []);
          setActiveUsers(activeUsersList || []);
          setAllMentors(
            mentorsList && typeof mentorsList === "object" && "data" in mentorsList
              ? (mentorsList.data as Mentor[])
              : Array.isArray(mentorsList)
              ? mentorsList
              : []
          );
          setPendingSubmissions(pendingSub || []);
          setMentorSessions(allSessions || []);
          if (adminMentorProfile) {
            setMentorProfile(adminMentorProfile);
          }
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
        if (err.status === 503) {
          msg = "Your LocalTunnel backend is unavailable (503 Service Unavailable). Please make sure the localtunnel process is running on your laptop with subdomain 'durga-career-ai'.";
        } else if (
          err instanceof TypeError ||
          (err.message && err.message.includes("Failed to fetch")) ||
          err.status === undefined
        ) {
          msg = "Could not connect to the backend server. Please verify the API service is online and reachable.";
        }
        setError(msg);
      } finally {
        setIsLoadingData(false);
        if (typeof window !== "undefined") {
          setIsOfflineMode(
            sessionStorage.getItem("backend_offline") === "true" &&
            (window.location.hostname === "localhost" || 
             window.location.hostname === "127.0.0.1" || 
             window.location.hostname.includes("loca.lt") || 
             window.location.hostname.includes("ngrok"))
          );
        }
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadMyTemplates = async () => {
      try {
        const res = await api.projects.getAll();
        const allProjs = res?.data || [];
        const filtered = allProjs.filter((p: any) => p.id > 10);
        setMyTemplates(filtered);
      } catch (e) {
        console.error("Failed to load mentor templates:", e);
      }
    };
    loadMyTemplates();
  }, [isAuthenticated, mentorProfile, success]);

  // Webcam capture effect — starts camera when call opens
  useEffect(() => {
    if (!isVideoCallOpen) {
      setTranscriptionLogs([]);
      setLocalStream(null);
      return;
    }

    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        activeStream = stream;
        setLocalStream(stream);
      } catch (err) {
        console.warn("Camera/Mic access not granted or unavailable:", err);
      }
    };

    startCamera();
    setTranscriptionLogs(["System: [Waiting for peer to join the call...]"]);

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoCallOpen]);

  // Live transcription simulation — welcome message on peer connection
  useEffect(() => {
    if (!isVideoCallOpen || !remoteStream) return;

    setTranscriptionLogs((prev) => [
      ...prev,
      "System: [Peer connected — AI Live Speech-to-Text & Summarization Enabled. Start talking to see live transcription!]"
    ]);
  }, [isVideoCallOpen, remoteStream]);

  // Real-time voice transcription using Web Speech API
  useEffect(() => {
    if (!isVideoCallOpen || callConnectionState !== "connected" || !localStream || !activeVideoSession || !user) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[Speech] Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    const isStudent = String(activeVideoSession.student_id) === String(user?.id) || 
                      String(activeVideoSession.mentee_id) === String(user?.id);

    recognition.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      if (event.results[resultIndex]) {
        const transcript = event.results[resultIndex][0].transcript.trim();
        if (!transcript) return;

        console.log("[Speech] Local transcription text:", transcript);
        const rolePrefix = isStudent ? "Student: " : "Mentor: ";
        
        // Append locally
        setTranscriptionLogs(prev => {
          const isDuplicate = prev.length > 0 && prev[prev.length - 1] === (rolePrefix + transcript);
          if (isDuplicate) return prev;
          return [...prev, rolePrefix + transcript];
        });

        // Broadcast to peer
        const payloadObj = {
          type: "voice_transcript",
          text: transcript,
          isStudent,
          senderId: user.id,
          clientId: clientIdRef.current,
          timestamp: Date.now()
        };
        const payload = JSON.stringify(payloadObj);
        
        try {
          broadcastChannelRef.current?.postMessage(payload);
        } catch (e) {}
        
        api.mentors.postSignal(activeVideoSession.id, payload).catch((err: any) => {
          console.warn("[Speech] Failed to post voice signal:", err);
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("[Speech] Recognition error:", event.error);
      if (event.error === "network") {
        setTimeout(() => {
          try { recognition.start(); } catch (e) {}
        }, 5000);
      }
    };

    recognition.onend = () => {
      console.log("[Speech] Recognition ended. Restarting...");
      try {
        if (isVideoCallOpen && peerConnectionRef.current?.connectionState === "connected") {
          recognition.start();
        }
      } catch (e) {}
    };

    try {
      recognition.start();
      console.log("[Speech] Started SpeechRecognition service.");
    } catch (e) {
      console.error("[Speech] SpeechRecognition start failed:", e);
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isVideoCallOpen, callConnectionState, localStream, activeVideoSession, user]);

  // Sync active stream tracks with Mute toggles
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoMuted;
      });
    }
  }, [isVideoMuted, localStream]);

  // Broadcast local mute/video state changes to the peer
  useEffect(() => {
    if (isVideoCallOpen && activeVideoSession && user) {
      const payloadObj = {
        type: "peer_state",
        isMuted,
        isVideoMuted,
        clientId: clientIdRef.current,
        timestamp: Date.now()
      };
      const payload = JSON.stringify(payloadObj);
      try {
        broadcastChannelRef.current?.postMessage(payload);
      } catch (e) {}
      api.mentors.postSignal(activeVideoSession.id, payload).catch(() => {});
    }
  }, [isMuted, isVideoMuted, isVideoCallOpen, activeVideoSession, user]);

  // WebRTC Peer Connection & Signaling handler
  useEffect(() => {
    if (!isVideoCallOpen || !activeVideoSession || !localStream || !user) {
      setRemoteStream(null);
      setChatMessages([]);
      return;
    }

    const sessionId = activeVideoSession.id;
    const pcConfig: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        // Free TURN relay servers for NAT traversal
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
      iceCandidatePoolSize: 10,
    };

    setCallConnectionState("connecting");
    const pc = new RTCPeerConnection(pcConfig);
    peerConnectionRef.current = pc;

    const isStudent = String(activeVideoSession.student_id) === String(user?.id) || 
                      String(activeVideoSession.mentee_id) === String(user?.id);

    // Perfect Negotiation State Variables
    let makingOffer = false;
    let ignoreOffer = false;
    const polite = !isStudent; // Mentor is polite, Student is impolite

    // Track WebRTC connection state for UI feedback
    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      switch (pc.connectionState) {
        case "connecting":
          setCallConnectionState("ringing");
          break;
        case "connected":
          setCallConnectionState("connected");
          break;
        case "disconnected":
          setCallConnectionState("reconnecting");
          break;
        case "failed":
          setCallConnectionState("failed");
          // Student triggers ICE restart if connection fails
          if (isStudent) {
            console.log("[WebRTC] Connection failed. Student initiating ICE restart...");
            initiateOffer(true);
          }
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setCallConnectionState("connected");
      } else if (pc.iceConnectionState === "checking") {
        setCallConnectionState("ringing");
      } else if (pc.iceConnectionState === "disconnected") {
        setCallConnectionState("reconnecting");
      } else if (pc.iceConnectionState === "failed") {
        setCallConnectionState("failed");
        if (isStudent) {
          console.log("[WebRTC] ICE failed. Student initiating ICE restart...");
          initiateOffer(true);
        } else {
          try { pc.restartIce(); } catch (e) { console.warn("[WebRTC] ICE restart failed:", e); }
        }
      }
    };

    // Add local tracks to peer connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle remote stream tracks
    pc.ontrack = (event) => {
      console.log("[WebRTC] Received remote track:", event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        setRemoteStream(prev => {
          if (prev) {
            try { prev.addTrack(event.track); } catch (e) {}
            return prev;
          }
          const newStream = new MediaStream();
          newStream.addTrack(event.track);
          return newStream;
        });
      }
    };

    // ─── Unified signal sender: BroadcastChannel + HTTP ───
    const broadcastSend = (msg: any) => {
      const payloadObj = {
        ...msg,
        senderId: user.id,
        clientId: clientIdRef.current,
        timestamp: Date.now()
      };
      const payload = JSON.stringify(payloadObj);
      try {
        broadcastChannelRef.current?.postMessage(payload);
      } catch (e) { /* ignore */ }
      api.mentors.postSignal(sessionId, payload).catch((err: any) => {
        console.warn("[Signal] HTTP post failed (non-critical):", err);
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        broadcastSend({ type: "candidate", candidate: event.candidate });
      }
    };

    // Initiate Offer helper with optional ICE restart
    const initiateOffer = async (iceRestart = false) => {
      if (makingOffer) return;
      try {
        makingOffer = true;
        console.log(`[WebRTC] Creating offer (iceRestart=${iceRestart})...`);
        const offer = await pc.createOffer({ iceRestart });
        await pc.setLocalDescription(offer);
        broadcastSend({ type: "description", sdp: pc.localDescription });
      } catch (err) {
        console.error("[WebRTC] Error creating offer:", err);
      } finally {
        makingOffer = false;
      }
    };

    // Trigger offer automatically on negotiation needed (if signaling state is stable)
    pc.onnegotiationneeded = () => {
      if (isStudent && pc.signalingState === "stable") {
        initiateOffer(false);
      }
    };

    // ─── Signal message handler ───
    const handleSignal = async (dataStr: string) => {
      try {
        const msg = typeof dataStr === "object" ? dataStr : JSON.parse(dataStr);
        if (!msg) return;

        // Reject self-sent signals immediately to prevent loops
        if (msg.clientId && msg.clientId === clientIdRef.current) {
          return;
        }

        // Handle descriptions (offers and answers)
        if (msg.type === "description" || msg.type === "offer" || msg.type === "answer") {
          const sdp = msg.sdp || msg; // Support legacy and wrapped format
          const type = sdp.type;
          
          const offerCollision = (type === "offer") && 
                                 (makingOffer || pc.signalingState !== "stable");

          ignoreOffer = !polite && offerCollision;
          if (ignoreOffer) {
            console.log("[WebRTC] Collision detected. Impolite peer ignoring remote offer.");
            return;
          }

          if (offerCollision) {
            console.log("[WebRTC] Collision detected. Polite peer rolling back local offer.");
            await pc.setLocalDescription({ type: "rollback" }).catch(() => {});
          }

          // Safety check: if type is answer, we must be in have-local-offer state
          if (type === "answer" && pc.signalingState !== "have-local-offer") {
            console.log("[WebRTC] Ignoring answer received in wrong state:", pc.signalingState);
            return;
          }

          // Safety check: if type is offer, we must be in stable state (or rolled back)
          if (type === "offer" && pc.signalingState !== "stable" && !offerCollision) {
            console.log("[WebRTC] Ignoring offer received in wrong state:", pc.signalingState);
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          if (type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            broadcastSend({ type: "description", sdp: pc.localDescription });
          }
        } 
        // Handle candidates
        else if (msg.type === "candidate") {
          if (msg.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (err) {
              if (!ignoreOffer) {
                console.warn("[WebRTC] Failed to add ICE candidate:", err);
              }
            }
          }
        } 
        // Handle peer joined
        else if (msg.type === "join") {
          console.log(`[WebRTC] Peer joined signal received (isStudent=${msg.isStudent})`);
          // If we are the student, send a fresh offer to connect with the newly joined peer
          if (isStudent) {
            initiateOffer(true);
          }
        } 
        // Handle voice transcripts from the other peer
        else if (msg.type === "voice_transcript") {
          console.log("[SpeechRecognition] Remote transcription received:", msg.text);
          const peerPrefix = msg.isStudent ? "Student: " : "Mentor: ";
          setTranscriptionLogs(prev => {
            // Avoid duplicate transcript logging from double poll/broadcast
            const isDuplicate = prev.length > 0 && prev[prev.length - 1] === (peerPrefix + msg.text);
            if (isDuplicate) return prev;
            return [...prev, peerPrefix + msg.text];
          });
        }
        // Handle chat messages
        else if (msg.type === "chat") {
          setChatMessages(prev => [...prev, msg.message]);
        }
        // Handle peer mute/unmute states
        else if (msg.type === "peer_state") {
          setPeerIsMuted(!!msg.isMuted);
          setPeerIsVideoMuted(!!msg.isVideoMuted);
        }
        // Handle remote control commands from Mentor to Student
        else if (msg.type === "remote_control") {
          if (isStudent) {
            console.log("[RemoteControl] Student received remote control command from Mentor:", msg.action);
            if (msg.action === "mute_audio") {
              setIsMuted(true);
              setTranscriptionLogs(prev => [
                ...prev, 
                "System: [Your microphone was remotely disabled by the Mentor]"
              ]);
            } else if (msg.action === "unmute_audio") {
              setIsMuted(false);
              setTranscriptionLogs(prev => [
                ...prev, 
                "System: [Your microphone was remotely enabled by the Mentor]"
              ]);
            } else if (msg.action === "mute_video") {
              setIsVideoMuted(true);
              setTranscriptionLogs(prev => [
                ...prev, 
                "System: [Your camera was remotely disabled by the Mentor]"
              ]);
            } else if (msg.action === "unmute_video") {
              setIsVideoMuted(false);
              setTranscriptionLogs(prev => [
                ...prev, 
                "System: [Your camera was remotely enabled by the Mentor]"
              ]);
            }
          }
        }
        // Handle recording state updates from peer
        else if (msg.type === "recording_state") {
          setPeerIsRecording(!!msg.isRecording);
          setTranscriptionLogs(prev => {
            const status = msg.isRecording ? "started" : "stopped";
            const roleStr = msg.isStudent ? "Student" : "Mentor";
            return [...prev, `System: [${roleStr} has ${status} recording the session]`];
          });
        }
      } catch (err) {
        console.error("[Signal] Error handling signal:", err);
      }
    };

    // ─── BroadcastChannel: ALWAYS active for same-browser ───
    const channelName = `webrtc_signal_${sessionId}`;
    const channel = new BroadcastChannel(channelName);
    broadcastChannelRef.current = channel;
    channel.onmessage = (event) => {
      handleSignal(event.data);
    };

    // ─── HTTP Polling: for cross-device signaling ───
    let lastSignalId = 0;
    let pollingActive = true;
    const sessionStartTime = Date.now();

    const pollSignals = async () => {
      if (!pollingActive) return;
      try {
        const signals = await api.mentors.getSignals(sessionId, lastSignalId);
        if (signals && signals.length > 0) {
          signals.forEach((sig: any) => {
            if (sig.id > lastSignalId) {
              lastSignalId = sig.id;
            }
            
            let msgObj: any = null;
            try {
              msgObj = typeof sig.payload === "object" ? sig.payload : JSON.parse(sig.payload);
            } catch (e) {}

            const isLocalClient = msgObj && msgObj.clientId === clientIdRef.current;
            if (!isLocalClient) {
              // Only process fresh signals created within 10 minutes of joining
              const sigTime = new Date(sig.created_at).getTime();
              if (!isNaN(sigTime) && sigTime > sessionStartTime - 600000) {
                handleSignal(sig.payload);
              }
            }
          });
        }
      } catch (err) {
        console.warn("[Signal] HTTP poll failed:", err);
      }
    };

    // Start polling immediately, then every 1.5s
    pollSignals();
    const pollingInterval = setInterval(pollSignals, 1500);

    // Send join signal and initial offer if student
    const joinTimeout = setTimeout(async () => {
      try {
        broadcastSend({ type: "join", isStudent });
        if (isStudent) {
          initiateOffer(true);
        }
      } catch (err) {
        console.error("[Signal] Failed to send initial join/offer:", err);
      }
    }, 800);

    // Cleanup
    return () => {
      pollingActive = false;
      clearInterval(pollingInterval);
      clearTimeout(joinTimeout);
      try { channel.close(); } catch (e) { /* ignore */ }
      try {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      } catch (e) { /* ignore */ }
    };
  }, [isVideoCallOpen, activeVideoSession, localStream, user]);



  // Auto-scroll transcription logs to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptionLogs, chatMessages]);

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

  const handleTogglePremium = async (mentorId: string) => {
    setError("");
    setSuccess("");
    try {
      await api.mentors.togglePremium(mentorId);
      const mentorsList = await api.mentors.getAll();
      setAllMentors(
        mentorsList && typeof mentorsList === "object" && "data" in mentorsList
          ? (mentorsList.data as Mentor[])
          : Array.isArray(mentorsList)
          ? mentorsList
          : []
      );
      setSuccess("Mentor Premium subscription status updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to update premium status.");
    }
  };

  const handleUpdatePricing = async (mentorId: string, hourlyRate: number, originalPrice: number) => {
    setError("");
    setSuccess("");
    try {
      await api.mentors.updatePricing(mentorId, hourlyRate, originalPrice);
      const mentorsList = await api.mentors.getAll();
      setAllMentors(
        mentorsList && typeof mentorsList === "object" && "data" in mentorsList
          ? (mentorsList.data as Mentor[])
          : Array.isArray(mentorsList)
          ? mentorsList
          : []
      );
      setEditingMentorPricing(null);
      setSuccess("Mentor pricing updated successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to update pricing.");
    }
  };

  const handleReviewSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;
    setIsSubmittingReview(true);
    setError("");
    setSuccess("");
    try {
      await api.projects.reviewSubmission(reviewingSubmission.id, reviewScore, reviewFeedback);
      const [activeUsersList, pendingSub] = await Promise.all([
        api.mentors.getActiveUsers(),
        api.projects.getPendingSubmissions()
      ]);
      setActiveUsers(activeUsersList || []);
      setPendingSubmissions(pendingSub || []);
      setReviewingSubmission(null);
      setSuccess("Project submission reviewed successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadAgreement = () => {
    if (!unlockingMentor) return;
    const expectedPassword1 = `${unlockingMentor.mentor_name}@${unlockingMentor.mentor_id}`;
    const expectedPassword2 = `mentor@${unlockingMentor.mentor_id}`;
    const expectedPassword3 = "agreement123";
    if (
      agreementPassword !== expectedPassword1 &&
      agreementPassword !== expectedPassword2 &&
      agreementPassword !== expectedPassword3
    ) {
      setUnlockError("Incorrect password. Please verify the passcode.");
      return;
    }

    const docContent = `
# MENTOR ONBOARDING AGREEMENT
**Document Reference: AGC-${unlockingMentor.mentor_id}**
**Security Classification: CONFIDENTIAL**

---

### PARTIES
1. **CareerAI Platform** (hereinafter referred to as "the Platform")
2. **${unlockingMentor.mentor_name}** (hereinafter referred to as "the Mentor")

### TERMS & AGREEMENT
- **Mentor ID**: ${unlockingMentor.mentor_id}
- **Expertise Focus**: ${unlockingMentor.expertise.join(", ")}
- **Hourly Base Rate**: $${unlockingMentor.hourly_rate} USD
- **Premium Tier Status**: ${unlockingMentor.has_premium_subscription ? "Active - Collective Group Sessions Enabled" : "Inactive - Standard Individual Sessions Only"}

This document certifies that ${unlockingMentor.mentor_name} is a verified professional mentor on CareerAI. The Mentor agrees to guide students on project submissions, provide skill-gap reviews, and maintain professional conduct. All student code reviews and feedback shared on this platform are intellectual properties of the respective student or organization.

Signed Digitally by:
- CareerAI Admin: Durga sravan Challagolla
- Verified Coach: ${unlockingMentor.mentor_name}

*Timestamp: ${new Date().toLocaleDateString()}*
`;

    const blob = new Blob([docContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${unlockingMentor.mentor_name?.replace(/\s+/g, "_")}_Agreement.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setUnlockingMentor(null);
    setAgreementPassword("");
    setUnlockError("");
    setSuccess(`Agreement for ${unlockingMentor.mentor_name} downloaded successfully.`);
  };

  const handleOpenReportModal = (mentorId: string | number, mentorName: string) => {
    setReportType("mentor");
    setReportTargetMentorId(String(mentorId));
    setReportTargetMentorName(mentorName);
    setReportReason("");
    setReportFile(null);
    setReportFileBase64("");
    setIsReportModalOpen(true);
  };

  const handleOpenReportStudentModal = (studentId: string | number, studentName: string) => {
    setReportType("student");
    setReportTargetStudentId(String(studentId));
    setReportTargetStudentName(studentName);
    setReportReason("");
    setReportFile(null);
    setReportFileBase64("");
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportFileBase64) return;
    setIsSubmittingReport(true);
    setError("");
    setSuccess("");
    try {
      if (reportType === "mentor") {
        if (!reportTargetMentorId) return;
        await api.mentors.reportMentor(reportTargetMentorId, reportReason.trim(), reportFileBase64);
        setSuccess(`Report on coach ${reportTargetMentorName} submitted successfully with proof screenshot.`);
      } else {
        if (!reportTargetStudentId) return;
        await api.mentors.reportStudent(reportTargetStudentId, reportReason.trim(), reportFileBase64);
        setSuccess(`Report on student ${reportTargetStudentName} submitted successfully with proof screenshot.`);
      }
      setIsReportModalOpen(false);
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
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== "")
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "") 
      : typeof window !== "undefined"
      ? `${window.location.origin}/_/backend`
      : "";

    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                Platform Admin Dashboard
              </h1>
              <p className="text-muted mt-1">
                Welcome back, Administrator. Review pending applications, track user activity, configure rates, and audit digital agreements.
              </p>
            </div>
            <div className="flex gap-2 self-start flex-wrap">
              <Button onClick={() => setAdminViewMode("mentor")} className="bg-gradient-to-r from-primary to-secondary">
                <Video className="h-4 w-4 mr-2" /> Switch to Coach View
              </Button>
              <Button variant="outline" onClick={() => router.push("/profile")}>
                <Settings className="h-4 w-4 mr-2" /> Admin Settings
              </Button>
            </div>
          </div>

          {/* Success / Error Alerts */}
          {success && (
            <div className="mb-6 bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-3 text-success animate-fadeIn">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-error animate-fadeIn">
              <ShieldAlert className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Admin Stats */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
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
                <span className="text-xs text-muted block">Active Users</span>
                <span className="text-2xl font-bold text-foreground">{activeUsers.length}</span>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4 bg-white/5 border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-muted block">Verify Solutions</span>
                <span className="text-2xl font-bold text-foreground">{pendingSubmissions.length} pending</span>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4 bg-white/5 border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-muted block">Coaches Pool</span>
                <span className="text-2xl font-bold text-foreground">
                  {allMentors.filter(m => m.verification_status === "verified").length} verified
                </span>
              </div>
            </Card>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
            <button
              onClick={() => setAdminActiveTab("reviews")}
              className={cn(
                "py-3 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap",
                adminActiveTab === "reviews"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              Onboarding & Reports ({pendingMentors.length + mentorReports.filter(r => r.status === "pending").length})
            </button>
            <button
              onClick={() => setAdminActiveTab("users")}
              className={cn(
                "py-3 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap",
                adminActiveTab === "users"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              Active Users & Projects ({activeUsers.length})
            </button>
            <button
              onClick={() => setAdminActiveTab("sessions")}
              className={cn(
                "py-3 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap",
                adminActiveTab === "sessions"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              Video Call Sessions ({mentorSessions.length})
            </button>
            <button
              onClick={() => setAdminActiveTab("performance")}
              className={cn(
                "py-3 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap",
                adminActiveTab === "performance"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              Mentor Performance ({allMentors.filter(m => m.verification_status === "verified").length})
            </button>
            <button
              onClick={() => setAdminActiveTab("pricing")}
              className={cn(
                "py-3 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap",
                adminActiveTab === "pricing"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              Pricing Control
            </button>
            <button
              onClick={() => setAdminActiveTab("agreements")}
              className={cn(
                "py-3 px-6 font-semibold text-sm border-b-2 transition-all whitespace-nowrap",
                adminActiveTab === "agreements"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              Onboarding Agreements
            </button>
          </div>

          {/* TAB 1: REVIEWS (ONBOARDING APPLICATIONS & REPORTS) */}
          {adminActiveTab === "reviews" && (
            <div className="space-y-8">
              <Card className="p-6">
                <CardTitle className="mb-6 flex items-center gap-2 text-warning">
                  <ShieldAlert className="h-5 w-5" />
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

              {/* Reports Section */}
              <Card className="p-6">
                <CardTitle className="mb-6 flex items-center gap-2 text-error">
                  <ShieldAlert className="h-5 w-5" />
                  Reports Under Review ({mentorReports.length})
                </CardTitle>

                {mentorReports.length === 0 ? (
                  <div className="text-center py-12 text-muted text-sm bg-white/[0.01] rounded-2xl border border-white/5">
                    <Check className="h-10 w-10 text-success mx-auto mb-2 bg-success/15 p-2.5 rounded-full" />
                    No pending or active mentor reports.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {mentorReports.map((report) => {
                      const isReportedByMentor = report.reported_by === "mentor";
                      const screenshotFullUrl = report.screenshot_url 
                        ? (report.screenshot_url.startsWith("http") 
                            ? report.screenshot_url 
                            : `${apiBaseUrl}${report.screenshot_url}`)
                        : null;

                      return (
                        <div
                          key={report.id}
                          className="p-5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground">
                                {isReportedByMentor ? (
                                  <>Reported Student: {report.student_name || `Student #${report.student_id}`}</>
                                ) : (
                                  <>Reported Coach: {report.mentor_name || `Coach #${report.mentor_id}`}</>
                                )}
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
                              <Badge variant="outline" className="border-white/10 text-muted-foreground text-[10px]">
                                {isReportedByMentor ? "Filed by Coach" : "Filed by Student"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted">
                              {isReportedByMentor ? (
                                <>
                                  Submitted by Coach: <span className="text-foreground">{report.mentor_name || `Coach #${report.mentor_id}`}</span> on{" "}
                                </>
                              ) : (
                                <>
                                  Submitted by Student: <span className="text-foreground">{report.student_name || `Student #${report.student_id}`}</span> on{" "}
                                </>
                              )}
                              {new Date(report.created_at).toLocaleDateString()}
                            </p>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-muted-foreground italic mt-2">
                              &ldquo;{report.reason}&rdquo;
                            </div>

                            {screenshotFullUrl && (
                              <div className="mt-3 space-y-1">
                                <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Screenshot Proof:</span>
                                <div className="relative inline-block rounded-xl overflow-hidden border border-white/15 bg-black/40 hover:border-primary/50 transition-colors duration-200">
                                  <a href={screenshotFullUrl} target="_blank" rel="noopener noreferrer" title="Click to view full screenshot">
                                    <img
                                      src={screenshotFullUrl}
                                      alt="Screenshot proof"
                                      className="object-cover max-h-36 rounded-xl hover:scale-105 transition-transform duration-300"
                                    />
                                  </a>
                                </div>
                              </div>
                            )}
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
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 2: ACTIVE USERS & PROJECTS */}
          {adminActiveTab === "users" && (
            <div className="space-y-8">
              {/* Active Users Table */}
              <Card className="p-6">
                <CardTitle className="mb-6 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Active Users Registry ({activeUsers.length})
                </CardTitle>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-muted uppercase font-bold tracking-wider">
                        <th className="p-4">User Details</th>
                        <th className="p-4">System Role</th>
                        <th className="p-4">Target Career Goal</th>
                        <th className="p-4 text-center">Skill Progress</th>
                        <th className="p-4">Active Project</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {activeUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors text-foreground">
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{u.name}</div>
                            <div className="text-muted text-[10px]">{u.email}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant={u.role === "mentor" ? "default" : "outline"} className="capitalize text-[10px]">
                              {u.role}
                            </Badge>
                          </td>
                          <td className="p-4 text-muted">{u.dream_role || "Not Configured"}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 max-w-[120px] mx-auto">
                              <Progress value={u.skill_progress} className="h-1.5 flex-1" />
                              <span className="font-mono text-[10px] font-bold">{u.skill_progress}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted truncate max-w-[150px]">{u.active_project}</td>
                          <td className="p-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              u.status === "Active Now" 
                                ? "bg-success/10 text-success border-success/20" 
                                : "bg-white/5 text-muted border-white/10"
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", u.status === "Active Now" ? "bg-success animate-pulse" : "bg-muted")} />
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {activeUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted italic">No active users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Verify Proposed Solutions */}
              <Card className="p-6">
                <CardTitle className="mb-6 flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-secondary" />
                  Verify Proposed Student Solutions ({pendingSubmissions.length})
                </CardTitle>

                {pendingSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-muted text-sm bg-white/[0.01] rounded-2xl border border-white/5">
                    <Check className="h-10 w-10 text-success mx-auto mb-2 bg-success/15 p-2.5 rounded-full" />
                    All student project submissions have been reviewed and verified!
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {pendingSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-bold text-foreground text-sm leading-snug">{sub.project_title}</h4>
                              <p className="text-xs text-muted mt-0.5">Submitted by Student: <strong className="text-foreground">{sub.user_name}</strong></p>
                            </div>
                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 text-[10px] whitespace-nowrap">
                              Awaiting Verification
                            </Badge>
                          </div>
                          <p className="text-xs text-muted leading-relaxed line-clamp-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                            {sub.description || "No submission description provided."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                          <div className="flex gap-3 text-[10px] text-muted">
                            {sub.github_url && (
                              <a
                                href={sub.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Sparkles className="h-3 w-3" /> GitHub Repo
                              </a>
                            )}
                            {sub.portfolio_url && (
                              <a
                                href={sub.portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 font-semibold"
                              >
                                <BookOpen className="h-3 w-3" /> Demo Link
                              </a>
                            )}
                          </div>
                          <Button size="sm" onClick={() => {
                            setReviewingSubmission(sub);
                            setReviewScore(8);
                            setReviewFeedback("");
                          }}>
                            Verify & Grade
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 3: MENTOR PERFORMANCE & ONE-ON-ONE SESSIONS */}
          {adminActiveTab === "performance" && (
            <div className="space-y-8">
              {/* Mentors Earnings & Premium toggle */}
              <Card className="p-6">
                <CardTitle className="mb-6 flex items-center gap-2">
                  <Award className="h-5 w-5 text-success" />
                  Coach Performance & Subscription Control ({allMentors.filter(m => m.verification_status === "verified").length})
                </CardTitle>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-muted uppercase font-bold tracking-wider">
                        <th className="p-4">Mentor ID</th>
                        <th className="p-4">Coach Details</th>
                        <th className="p-4">Company</th>
                        <th className="p-4 text-center">Sessions</th>
                        <th className="p-4 text-center">Avg Rating</th>
                        <th className="p-4 text-center">Hourly Rate</th>
                        <th className="p-4 text-center">Total Payouts</th>
                        <th className="p-4 text-center">Premium Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allMentors.filter(m => m.verification_status === "verified").map((m) => {
                        const baseRate = m.hourly_rate || 50;
                        const completedSessionsCount = m.total_sessions || 0;
                        const reviewedSessionsCount = m.reviewed_count || 0;
                        const sessionEarnings = completedSessionsCount * baseRate;
                        const reviewEarnings = m.review_earnings ?? (reviewedSessionsCount * 0.75);
                        const totalPayouts = sessionEarnings + reviewEarnings;

                        return (
                          <tr key={m.id} className="hover:bg-white/[0.02] transition-colors text-foreground">
                            <td className="p-4 font-mono font-bold text-primary">{m.mentor_id || `MNT-${m.id}`}</td>
                            <td className="p-4">
                              <div className="font-semibold text-foreground">{m.mentor_name || m.name}</div>
                              <div className="text-muted text-[10px]">{m.email}</div>
                            </td>
                            <td className="p-4 text-muted">{m.company_name || "Self-Employed"}</td>
                            <td className="p-4 text-center font-semibold">{m.total_sessions} calls</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1 text-warning font-bold">
                                <Star className="h-3 w-3 fill-current" />
                                {m.rating ? m.rating.toFixed(1) : "0.0"}
                              </div>
                            </td>
                            <td className="p-4 text-center text-success font-semibold">{formatDualCurrency(m.hourly_rate)}</td>
                            <td className="p-4 text-center text-success font-bold">{formatDualCurrencyAmount(totalPayouts)}</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePremium(m.id)}
                                  className={cn(
                                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    m.has_premium_subscription ? "bg-primary" : "bg-white/10"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                      m.has_premium_subscription ? "translate-x-5" : "translate-x-0"
                                    )}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {allMentors.filter(m => m.verification_status === "verified").length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted italic">No verified coaches found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: VIDEO CALL SESSIONS */}
          {adminActiveTab === "sessions" && (
            <Card className="p-6 animate-fadeIn">
              <CardTitle className="mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                All Booked One-on-One Sessions & Video Calls ({mentorSessions.length})
              </CardTitle>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-muted uppercase font-bold tracking-wider">
                      <th className="p-4">Session ID</th>
                      <th className="p-4">Student</th>
                      <th className="p-4">Coach / Mentor</th>
                      <th className="p-4">Scheduled Date & Time</th>
                      <th className="p-4 text-center">Duration</th>
                      <th className="p-4 text-center">Price / Cost</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mentorSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-white/[0.02] transition-colors text-foreground">
                        <td className="p-4 font-mono text-[10px] text-muted">#SESS-{session.id}</td>
                        <td className="p-4 font-semibold text-muted">
                          {session.student_name || `Student #${(session as any).student_id || session.mentee_id}`}
                        </td>
                        <td className="p-4 font-semibold text-foreground">{session.mentor_name || `Coach #${session.mentor_id}`}</td>
                        <td className="p-4 text-muted">
                          {new Date(session.scheduled_at).toLocaleDateString()} at{" "}
                          {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-center font-semibold">{session.duration_minutes} min</td>
                        <td className="p-4 text-center text-success font-semibold">
                          {formatDualCurrency(session.price || (session.amount_cents ? session.amount_cents / 100 : 0))}
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            className={cn(
                              "capitalize text-[10px]",
                              session.status === "confirmed" && "bg-success/20 text-success border-success/30",
                              session.status === "pending" && "bg-warning/20 text-warning border-warning/30",
                              session.status === "completed" && "bg-primary/20 text-primary border-primary/30",
                              session.status === "cancelled" && "bg-error/20 text-error border-error/30"
                            )}
                          >
                            {session.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          {session.status === "confirmed" || session.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveVideoSession(session);
                                setIsVideoCallOpen(true);
                              }}
                              className="bg-success/20 hover:bg-success/30 text-success border border-success/30 py-1 px-3 rounded-lg font-bold transition-all inline-flex items-center gap-1.5 text-[10px] active:scale-95"
                            >
                              <Video className="h-3.5 w-3.5" /> Join Call
                            </button>
                          ) : (
                            <span className="text-muted text-[10px] italic">Not Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {mentorSessions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted italic">No booked mentoring sessions on the platform.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 4: PRICING CONTROL */}
          {adminActiveTab === "pricing" && (
            <Card className="p-6">
              <CardTitle className="mb-6 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Specialized Pricing Control (Marketplace Rates)
              </CardTitle>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-muted uppercase font-bold tracking-wider">
                      <th className="p-4">Mentor ID</th>
                      <th className="p-4">Coach Name</th>
                      <th className="p-4">Company</th>
                      <th className="p-4 text-center">Original Price (Strikethrough)</th>
                      <th className="p-4 text-center">Coaching Price (Discounted Rate)</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allMentors.filter(m => m.verification_status === "verified").map((m) => {
                      const isEditing = editingMentorPricing === m.id;
                      
                      return (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors text-foreground">
                          <td className="p-4 font-mono font-bold text-primary">{m.mentor_id || `MNT-${m.id}`}</td>
                          <td className="p-4 font-semibold">{m.mentor_name || m.name}</td>
                          <td className="p-4 text-muted">{m.company_name || "Self-Employed"}</td>
                          
                          {/* Original Price */}
                          <td className="p-4 text-center">
                            {isEditing ? (
                              <div className="relative max-w-[110px] mx-auto">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={editOriginalPrice}
                                  onChange={(e) => setEditOriginalPrice(e.target.value)}
                                  className="w-full bg-surface border border-border rounded-lg pl-6 pr-2 py-1 text-center font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                                />
                              </div>
                            ) : (
                              <span className="line-through text-muted font-semibold">
                                {m.original_price ? formatDualCurrency(m.original_price) : formatDualCurrency(m.hourly_rate)}
                              </span>
                            )}
                          </td>

                          {/* Coaching Price (Discounted) */}
                          <td className="p-4 text-center">
                            {isEditing ? (
                              <div className="relative max-w-[110px] mx-auto">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={editHourlyRate}
                                  onChange={(e) => setEditHourlyRate(e.target.value)}
                                  className="w-full bg-surface border border-border rounded-lg pl-6 pr-2 py-1 text-center font-bold text-success focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                                />
                              </div>
                            ) : (
                              <span className="text-success font-bold">
                                {formatDualCurrency(m.hourly_rate)}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdatePricing(m.id, parseFloat(editHourlyRate), parseFloat(editOriginalPrice))}
                                  className="bg-success hover:bg-success/80 text-white py-1 px-3 text-xs"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMentorPricing(null)}
                                  className="py-1 px-3 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMentorPricing(m.id);
                                  setEditHourlyRate(String(m.hourly_rate));
                                  setEditOriginalPrice(String(m.original_price || m.hourly_rate));
                                }}
                              >
                                Edit Rates
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {allMentors.filter(m => m.verification_status === "verified").length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted italic">No verified coaches found to edit pricing.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 5: ONBOARDING AGREEMENTS */}
          {adminActiveTab === "agreements" && (
            <Card className="p-6">
              <CardTitle className="mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Secure Mentor Onboarding Agreements (Protected Contracts)
              </CardTitle>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-muted uppercase font-bold tracking-wider">
                      <th className="p-4">Mentor ID</th>
                      <th className="p-4">Coach Name</th>
                      <th className="p-4">Company</th>
                      <th className="p-4">Corporate Domain Email</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allMentors.filter(m => m.verification_status === "verified").map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors text-foreground">
                        <td className="p-4 font-mono font-bold text-primary">{m.mentor_id || `MNT-${m.id}`}</td>
                        <td className="p-4 font-semibold">{m.mentor_name || m.name}</td>
                        <td className="p-4 text-muted">{m.company_name || "Self-Employed"}</td>
                        <td className="p-4 text-muted font-mono">{m.corporate_email || "No Corporate Domain Linked"}</td>
                        <td className="p-4 text-center">
                          <Badge variant="success" className="text-[10px]">
                            Verified & Signed
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setUnlockingMentor(m);
                              setAgreementPassword("");
                              setUnlockError("");
                            }}
                            className="bg-gradient-to-r from-primary to-secondary text-white font-bold"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" /> Download Agreement
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {allMentors.filter(m => m.verification_status === "verified").length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted italic">No verified mentors with signed contracts.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Secure Agreement Password Prompt Modal */}
          {unlockingMentor && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-slideUp">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center mx-auto text-accent">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Protected Agreement</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    The onboarding contract for <strong>{unlockingMentor.mentor_name}</strong> is password protected.
                    Enter the passcode to verify administrative clearance and decrypt the contract.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted">Passcode required</span>
                      <span className="text-primary font-mono italic">Format: name@id or "agreement123"</span>
                    </div>
                    <input
                      type="password"
                      placeholder=""
                      value={agreementPassword}
                      onChange={(e) => setAgreementPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleDownloadAgreement();
                        }
                      }}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono tracking-widest placeholder-muted"
                    />
                    <span className="text-[10px] text-muted block mt-1.5 text-center">
                      Hint: Decrypt using format <strong>[CoachName]@[MentorID]</strong> or use universal passcode <strong>agreement123</strong>.
                    </span>
                    {unlockError && (
                      <span className="text-[10px] text-error font-medium block text-center animate-pulse">{unlockError}</span>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUnlockingMentor(null);
                        setAgreementPassword("");
                        setUnlockError("");
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDownloadAgreement}
                      className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold"
                    >
                      Verify & Decrypt
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Solution Verification/Submission Review Modal (rendered for admin) */}
          {reviewingSubmission && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-slideUp">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Verify Student Submission</h3>
                  <p className="text-xs text-muted mt-1">
                    Evaluate the repository and grade <strong>{reviewingSubmission.user_name}</strong> for the project: <strong>{reviewingSubmission.project_title}</strong>
                  </p>
                </div>

                <form onSubmit={handleReviewSubmission} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted font-medium block">
                      GitHub Code Repository:
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
                    <label className="text-xs text-muted font-medium">Constructive Feedback / Review Comments</label>
                    <textarea
                      required
                      placeholder="Add assessment notes and suggestions for improvement..."
                      value={reviewFeedback}
                      onChange={(e) => setReviewFeedback(e.target.value)}
                      rows={6}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setReviewingSubmission(null)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmittingReview} isLoading={isSubmittingReview} className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold">
                      Verify & Grade
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  // ─── MENTOR VERIFICATION WIZARD BLOCKER ───────────────────────
  const renderMentorVerificationWizard = () => {
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
      const exists = wizAvailability.some(s => s.day_of_week === dayId);
      if (exists) {
        setWizAvailability(wizAvailability.filter(s => s.day_of_week !== dayId));
      } else {
        setWizAvailability([...wizAvailability, { day_of_week: dayId, start_time: "09:00", end_time: "17:00" }]);
      }
    };

    const handleTimeChange = (dayId: number, field: "start_time" | "end_time", value: string) => {
      setWizAvailability(wizAvailability.map(s => {
        if (s.day_of_week === dayId) {
          return { ...s, [field]: value };
        }
        return s;
      }));
    };

    const handleAddExpertiseTag = () => {
      const trimmed = wizExpertiseInput.trim();
      if (trimmed && !wizExpertise.includes(trimmed)) {
        setWizExpertise([...wizExpertise, trimmed]);
        setWizExpertiseInput("");
      }
    };

    const handleRemoveExpertiseTag = (tag: string) => {
      setWizExpertise(wizExpertise.filter(t => t !== tag));
    };

    const handleWizSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selfieFile || !idFile || !signedAgreement || !signatureText.trim()) {
        setError("Please complete all steps (webcam selfie, ID verification, agreement checkbox, and signature).");
        return;
      }
      setIsSubmittingWiz(true);
      setError("");
      setSuccess("");
      try {
        const availabilityPayload = wizAvailability.map(slot => {
          const start = slot.start_time || "09:00";
          const end = slot.end_time || "17:00";
          return {
            day_of_week: Number(slot.day_of_week),
            start_time: start.includes(":") && start.split(":").length === 2 ? `${start}:00` : start,
            end_time: end.includes(":") && end.split(":").length === 2 ? `${end}:00` : end,
          };
        });

        const updated = await api.mentors.apply({
          bio: mentorProfile?.bio || "Expert Mentor Coach",
          hourly_rate: parseFloat(wizHourlyRate || "75"),
          expertise: wizExpertise.length > 0 ? wizExpertise : ["Advising"],
          linkedin_url: mentorProfile?.linkedin_url || `https://linkedin.com/in/${user?.name.toLowerCase().replace(/\s+/g, "")}`,
          github_url: mentorProfile?.github_url || `https://github.com/${user?.name.toLowerCase().replace(/\s+/g, "")}`,
          corporate_email: mentorProfile?.corporate_email || `${user?.email.split("@")[0]}@corporate.com`,
          company_name: wizCompany.trim() || "Self-Employed",
          selfie_base64: selfieFile,
          identity_document_base64: idFile,
          id_type: wizIdType,
          selfie_filename: selfieFileName,
          id_filename: idFileName,
          signed_agreement: true,
          signature_svg_or_text: signatureText.trim(),
          availability: availabilityPayload,
        });

        setSuccess("Mentor onboarding profile verified successfully! Welcome to CareerAI.");
        setMentorProfile(updated);
        setWizStep(1);
      } catch (err: any) {
        setError(err?.message || "Failed to submit verification details.");
      } finally {
        setIsSubmittingWiz(false);
      }
    };

    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-3xl space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Complete Mentor Verification
            </h1>
            <p className="text-muted text-sm max-w-md mx-auto">
              Welcome Coach. Please complete your security profile, verification documents, and signed contract to unlock your dashboard.
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center text-xs">
            {["1. Photo & ID Verification", "2. Agreement & Signature", "3. Availability & Rates"].map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setWizStep(index + 1)}
                className={cn(
                  "font-semibold transition-colors",
                  wizStep === index + 1 ? "text-primary" : "text-muted hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Error and Success notifications */}
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-error">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-3 text-success">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <Card className="p-8">
            <div className="space-y-6">
              {/* STEP 1: UPLOADS */}
              {wizStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-lg font-bold text-foreground">Upload Verification Documents</h3>
                    <p className="text-xs text-muted mt-0.5">We require photo identification to list you on the public expert directory.</p>
                  </div>

                  {/* Government ID Type Dropdown Selector */}
                  <div className="glass-card p-4 border border-white/5 bg-white/5 rounded-xl space-y-2 text-left">
                    <label className="text-xs text-muted font-bold uppercase tracking-wider block text-left">
                      Select Government-Issued Identity Document Type <span className="text-red-400 font-bold">*</span>
                    </label>
                    <select
                      value={wizIdType}
                      onChange={(e) => {
                        setWizIdType(e.target.value);
                        setSelfieFile(null);
                        setIdFile(null);
                        setAiVerifyStatus("idle");
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

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Selfie Upload */}
                    <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Camera className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Webcam Selfie Capture</h4>
                        <p className="text-[11px] text-muted mt-1">Take a live photo of yourself to match against your document profile.</p>
                      </div>
                      
                      {selfieFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={selfieFile} alt="Selfie preview" className="w-20 h-20 object-cover rounded-full border border-primary/30" />
                          <Badge variant="success">Photo Saved</Badge>
                          <button type="button" onClick={() => { setSelfieFile(null); setSelfieMode("idle"); setAiVerifyStatus("idle"); }} className="text-[10px] text-error hover:underline">Retake Photo</button>
                        </div>
                      ) : selfieMode === "camera" ? (
                        <div className="w-full flex flex-col items-center space-y-3">
                          <video ref={selfieVideoRef} autoPlay playsInline className="w-full h-40 object-cover rounded-lg bg-black/40 border border-primary/20" />
                          <div className="flex gap-2 w-full">
                            <Button type="button" size="sm" onClick={captureSelfieSnapshot} className="flex-1 text-xs">
                              Capture Photo
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={stopSelfieCamera} className="flex-1 text-xs">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col space-y-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={startSelfieCamera}
                            disabled={!wizIdType}
                            className={cn(
                              "w-full text-xs flex items-center justify-center gap-1.5",
                              !wizIdType 
                                ? "bg-white/5 border border-white/10 text-muted cursor-not-allowed opacity-50" 
                                : "bg-primary/20 hover:bg-primary/30 border border-primary/30"
                            )}
                          >
                            <Video className="h-3.5 w-3.5" /> Start Camera
                          </Button>
                          <label className={cn("w-full block", !wizIdType && "cursor-not-allowed opacity-50")}>
                            <span className={cn(
                              "w-full block text-center py-1.5 px-3 border rounded-lg text-xs font-medium transition-all",
                              !wizIdType 
                                ? "bg-white/5 border-white/10 text-muted cursor-not-allowed" 
                                : "bg-white/5 hover:bg-white/10 border-white/10 text-foreground cursor-pointer font-medium"
                            )}>
                              Upload Photo
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSelfieFileSelect}
                              disabled={!wizIdType}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* ID Document Upload */}
                    <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Identity Verification Scan</h4>
                        <p className="text-[11px] text-muted mt-1">Upload a clear photo of your passport, driver&apos;s license, or national ID card.</p>
                      </div>

                      {idFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={idFile} alt="ID Document preview" className="w-24 h-16 object-cover rounded-lg border border-secondary/30" />
                          <Badge variant="success">Document Scan Saved</Badge>
                          <button type="button" onClick={() => { setIdFile(null); setIdMode("idle"); setAiVerifyStatus("idle"); }} className="text-[10px] text-error hover:underline">Re-upload Scan</button>
                        </div>
                      ) : idMode === "camera" ? (
                        <div className="w-full flex flex-col items-center space-y-3">
                          <video ref={idVideoRef} autoPlay playsInline className="w-full h-40 object-cover rounded-lg bg-black/40 border border-secondary/20" />
                          <div className="flex gap-2 w-full">
                            <Button type="button" size="sm" onClick={captureIdSnapshot} className="flex-1 text-xs">
                              Capture ID
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={stopIdCamera} className="flex-1 text-xs">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col space-y-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={startIdCamera}
                            disabled={!wizIdType}
                            className={cn(
                              "w-full text-xs flex items-center justify-center gap-1.5",
                              !wizIdType 
                                ? "bg-white/5 border border-white/10 text-muted cursor-not-allowed opacity-50" 
                                : "bg-secondary/20 hover:bg-secondary/30 border border-secondary/30"
                            )}
                          >
                            <Video className="h-3.5 w-3.5" /> Scan ID with Camera
                          </Button>
                          <label className={cn("w-full block", !wizIdType && "cursor-not-allowed opacity-50")}>
                            <span className={cn(
                              "w-full block text-center py-1.5 px-3 border rounded-lg text-xs font-medium transition-all",
                              !wizIdType 
                                ? "bg-white/5 border-white/10 text-muted cursor-not-allowed" 
                                : "bg-white/5 hover:bg-white/10 border-white/10 text-foreground cursor-pointer font-medium"
                            )}>
                              Upload ID Document
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleIdFileSelect}
                              disabled={!wizIdType}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI AGENT VERIFICATION BOX */}
                  {selfieFile && idFile && wizIdType && (
                    <div className="glass-card p-6 border border-white/10 rounded-2xl bg-gradient-to-br from-white/5 to-cyan/5 flex flex-col space-y-4">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan">
                          <Sparkles className="h-5 w-5 animate-pulse" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-sm text-foreground text-left">AI Agent Identity & Biometric Verification</h4>
                          <p className="text-[11px] text-muted text-left">Verify government document authenticity and biometric similarity.</p>
                        </div>
                      </div>

                      {aiVerifyStatus === "idle" && (
                        <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                          <p className="text-xs text-muted max-w-sm">Ready to check government document authenticity and facial biometric resemblance.</p>
                          <Button
                            type="button"
                            onClick={runAiVerification}
                            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 text-xs text-white"
                          >
                            Run AI Agent Verification
                          </Button>
                        </div>
                      )}

                      {aiVerifyStatus === "verifying" && (
                        <div className="space-y-4 py-2">
                          <div className="flex items-center gap-2.5 text-xs text-cyan font-medium">
                            <Loader2 className="h-4 w-4 animate-spin text-cyan" />
                            <span>AI Verification Agent is running analysis...</span>
                          </div>
                          
                          {/* Console logs box */}
                          <div className="bg-black/60 border border-white/5 p-4 rounded-xl font-mono text-[10px] text-green-400 space-y-1.5 h-36 overflow-y-auto scrollbar-thin text-left">
                            {aiVerifyLogs.map((log, i) => (
                              <div key={i} className="animate-fadeIn">{log}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiVerifyStatus === "passed" && (
                        <div className="space-y-4 py-2 animate-fadeIn">
                          <div className="bg-success/15 border border-success/30 rounded-xl p-4 flex flex-col md:flex-row items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center text-success">
                                <Check className="h-5 w-5" />
                              </div>
                              <div className="text-left">
                                <h5 className="font-bold text-xs text-success uppercase tracking-wider text-left">Government ID Verified</h5>
                                <p className="text-[11px] text-muted mt-0.5 text-left">Biometrics matched with official government portrait.</p>
                              </div>
                            </div>
                            <div className="flex gap-4 items-center">
                              <div className="text-center bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg">
                                <span className="text-[10px] text-muted block uppercase font-mono">Similarity</span>
                                <span className="text-sm font-bold text-cyan font-mono">{aiMatchScore}%</span>
                              </div>
                              <div className="text-center bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg">
                                <span className="text-[10px] text-muted block uppercase font-mono">Authenticity</span>
                                <span className="text-sm font-bold text-success font-mono">100% GOVT</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-black/60 border border-white/5 p-3 rounded-xl font-mono text-[10px] text-green-400 space-y-1 text-left">
                            <div>✓ Selfie matching features: {aiMatchScore}% similarity vector.</div>
                            <div>✓ Document OCR scan verified: Valid {wizIdType.toUpperCase()} security markings detected.</div>
                            <div>✓ Government registry check: Authentic, valid document database match.</div>
                            <div>✓ Status: AI check matches user database profile. Action authorized.</div>
                          </div>
                        </div>
                      )}

                      {aiVerifyStatus === "failed" && (
                        <div className="space-y-4 py-2 animate-fadeIn">
                          <div className="bg-error/15 border border-error/30 rounded-xl p-4 flex flex-col md:flex-row items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-error/20 flex items-center justify-center text-error">
                                <AlertCircle className="h-5 w-5" />
                              </div>
                              <div className="text-left">
                                <h5 className="font-bold text-xs text-error uppercase tracking-wider text-left">Verification Failed</h5>
                                <p className="text-[11px] text-muted mt-0.5 text-left">The AI agent rejected the uploaded files.</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                setSelfieFile(null);
                                setSelfieFileName("");
                                setIdFile(null);
                                setIdFileName("");
                                setAiVerifyStatus("idle");
                                setError("");
                                setAiVerifyLogs([]);
                              }}
                              className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-foreground"
                            >
                              Reset & Retry
                            </Button>
                          </div>

                          <div className="bg-black/60 border border-white/5 p-3 rounded-xl font-mono text-[10px] text-red-400 space-y-1 text-left">
                            {aiVerifyLogs.map((log, i) => (
                              <div key={i} className="animate-fadeIn">{log}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <Button type="button" onClick={() => setWizStep(2)} disabled={!selfieFile || !idFile || aiVerifyStatus !== "passed"}>
                      Next: Digital Agreement <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: CONTRACT & SIGNATURE */}
              {wizStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-lg font-bold text-foreground">Digital Onboarding Agreement</h3>
                    <p className="text-xs text-muted mt-0.5">Please review the platform coaching agreement terms below.</p>
                  </div>

                  {/* Contract Scroll Container */}
                  <div className="h-48 overflow-y-auto bg-black/45 border border-white/5 p-4 rounded-xl text-xs text-muted leading-relaxed space-y-4 font-mono select-none">
                    <h4 className="font-bold text-foreground uppercase">MENTOR SERVICE AGREEMENT</h4>
                    <p><strong>Ref Code: AGC-MNT-004</strong></p>
                    <p>1. <strong>Coaching Obligations:</strong> The Mentor agrees to provide constructive code reviews, target-role roadmap advice, and structured project feedback to platform students.</p>
                    <p>2. <strong>Intellectual Property:</strong> The Mentor acknowledges that all code repositories, solutions, and files submitted by students are the sole property of the students. Mentors may not copy, share, or redistribute student code.</p>
                    <p>3. <strong>Availability Integrity:</strong> The Mentor agrees to maintain up-to-date availability calendars and attend booked 1-on-1 calls on time.</p>
                    <p>4. <strong>Platform Commission:</strong> The Platform will process payments and credit rates directly. The Mentor agrees to the platform commission framework for paid slots.</p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer select-none bg-white/5 border border-white/5 p-4 rounded-xl">
                    <input
                      type="checkbox"
                      checked={signedAgreement}
                      onChange={(e) => setSignedAgreement(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-border bg-surface text-primary focus:ring-primary accent-primary mt-0.5"
                    />
                    <span className="text-xs text-muted">
                      I have read, understood, and agree to the terms listed in the digital onboarding agreement.
                    </span>
                  </label>

                  <div className="space-y-2">
                    <label className="text-xs text-muted font-bold uppercase tracking-wider block">
                      Digital Signature
                    </label>
                    <Input
                      placeholder="Type your full name to sign"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                    />
                    <span className="text-[10px] text-muted block">By typing your name, you execute this agreement electronically.</span>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-white/5">
                    <Button type="button" variant="outline" onClick={() => setWizStep(1)}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => setWizStep(3)} disabled={!signedAgreement || !signatureText.trim()}>
                      Next: Rates & Hours <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: DETAILS & RATES */}
              {wizStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-lg font-bold text-foreground">Coaching Rates & Availability</h3>
                    <p className="text-xs text-muted mt-0.5">Configure your expertise tags, hourly rate, and weekly slots.</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                        Hourly Rate (USD)
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">$</div>
                        <Input
                          type="number"
                          min="0"
                          required
                          placeholder="e.g. 75"
                          value={wizHourlyRate}
                          onChange={(e) => setWizHourlyRate(e.target.value)}
                          className="pl-7"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-muted font-semibold uppercase tracking-wider">
                        Company Affiliation
                      </label>
                      <Input
                        placeholder="e.g. Google, Self-Employed"
                        value={wizCompany}
                        onChange={(e) => setWizCompany(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Expertise Tags */}
                  <div className="space-y-3">
                    <label className="text-xs text-muted font-semibold uppercase tracking-wider block">Specialty Expertise Areas</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. React, AWS, Docker"
                        value={wizExpertiseInput}
                        onChange={(e) => setWizExpertiseInput(e.target.value)}
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
                      {wizExpertise.map(tag => (
                        <Badge key={tag} variant="outline" className="flex items-center gap-1">
                          {tag}
                          <button type="button" onClick={() => handleRemoveExpertiseTag(tag)} className="text-error font-bold ml-1 hover:text-red-400">&times;</button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Availability slots */}
                  <div className="space-y-4">
                    <label className="text-xs text-muted font-semibold uppercase tracking-wider block">Weekly Availability Slots</label>
                    <div className="grid gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs">
                      {DAYS_OF_WEEK.map(day => {
                        const activeSlot = wizAvailability.find(s => Number(s.day_of_week) === day.id);
                        const isChecked = !!activeSlot;
                        return (
                          <div key={day.id} className="flex items-center justify-between gap-3 pb-2 border-b border-white/5 last:border-0 last:pb-0">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleDay(day.id)}
                                className="w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                              />
                              <span className="font-bold text-foreground w-24">{day.name}</span>
                            </label>
                            {isChecked && activeSlot && (
                              <div className="flex items-center gap-2 text-[10px]">
                                <span>From:</span>
                                <input
                                  type="time"
                                  required
                                  value={activeSlot.start_time || "09:00"}
                                  onChange={(e) => handleTimeChange(day.id, "start_time", e.target.value)}
                                  className="bg-surface border border-border rounded px-1.5 py-0.5 text-foreground focus:ring-primary"
                                />
                                <span>To:</span>
                                <input
                                  type="time"
                                  required
                                  value={activeSlot.end_time || "17:00"}
                                  onChange={(e) => handleTimeChange(day.id, "end_time", e.target.value)}
                                  className="bg-surface border border-border rounded px-1.5 py-0.5 text-foreground focus:ring-primary"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation & Submit */}
                  <div className="flex justify-between pt-4 border-t border-white/5">
                    <Button type="button" variant="outline" onClick={() => setWizStep(2)}>
                      Back
                    </Button>
                    <Button type="button" onClick={handleWizSubmit} disabled={isSubmittingWiz} isLoading={isSubmittingWiz} className="bg-gradient-to-r from-primary to-secondary text-white font-bold px-8">
                      {isSubmittingWiz ? "Verifying..." : "Verify & Unlock Dashboard"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
    const upcomingBookings = mentorSessions.filter(
      (s) => s.status === "confirmed" && mentorProfile && String(s.mentor_id) === String(mentorProfile.id)
    );
    const completedBookings = mentorSessions.filter(
      (s) => s.status === "completed" && mentorProfile && String(s.mentor_id) === String(mentorProfile.id)
    );

    const activeSessions = [...pendingBookings, ...upcomingBookings].sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

    // Calculate mentoring payout details (base rate * hours)
    const baseRate = mentorProfile?.hourly_rate ?? 0;
    const completedHours = completedBookings.reduce((sum, s) => sum + s.duration_minutes / 60, 0);
    const mentoringEarnings = completedHours * baseRate;

    // Calculate project reviews payout details (Beginner: $1, Intermediate: $2, Advanced: $3)
    const reviewedCount = mentorProfile?.reviewed_count ?? 0;
    const reviewEarnings = mentorProfile?.review_earnings ?? 0;

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

    const handleSendJoinReminder = async (sessionId: string | number) => {
      setError("");
      setSuccess("");
      try {
        const result = await api.mentors.sendJoinReminder(sessionId);
        // Push a notification into the student's local notification store
        if (result && result.student_id) {
          const { addMockNotification } = await import("@/lib/api");
          addMockNotification(
            result.student_id,
            "🔔 Call Join Reminder",
            `Your mentor ${result.mentor_name || "your coach"} is waiting for you in the video call. Please join now!`,
            "warning"
          );
        }
        const sessionsData = await api.mentors.getMySessions();
        setMentorSessions(sessionsData || []);
        setSuccess("Joining reminder sent to student successfully!");
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to send joining reminder.");
      }
    };

    const handleGenerateAIProject = () => {
      if (!aiProjectInput.trim()) return;
      setIsGeneratingAIProject(true);
      setError("");
      setSuccess("");
      
      setTimeout(() => {
        const text = aiProjectInput.toLowerCase();
        let generatedTitle = "Advanced Distributed Microservices Architecture";
        let tech = "React, Node.js, Express, PostgreSQL, Docker, Redis";
        let difficulty = "advanced";
        let hours = 60;
        let details = "Build a scalable, real-time distributed application. In this project, you will learn to implement microservices, containerization, and low-latency cache synchronization.";

        if (text.includes("chat") || text.includes("websocket") || text.includes("realtime")) {
          generatedTitle = "Real-time Messaging & Event Engine";
          tech = "Next.js, WebSockets, Redis, Node.js, PostgreSQL";
          difficulty = "intermediate";
          hours = 45;
          details = "Implement a low-latency real-time chat application with group rooms and live status notifications. Learn message persistence and event buffering using Redis Pub/Sub.";
        } else if (text.includes("ecommerce") || text.includes("shop") || text.includes("stripe") || text.includes("payment")) {
          generatedTitle = "E-Commerce Micro-services Platform";
          tech = "React, Node.js, Stripe API, PostgreSQL, Docker";
          difficulty = "advanced";
          hours = 80;
          details = "Design and build a fully secure payment gateway integration and order processing microservice. You will implement stripe webhooks, inventory concurrency control, and transactional database integrity.";
        } else if (text.includes("ai") || text.includes("model") || text.includes("llm") || text.includes("openai") || text.includes("embedding")) {
          generatedTitle = "Intelligent AI-Powered Search Engine";
          tech = "Next.js, FastAPI, pgvector, Python, OpenAI API";
          difficulty = "advanced";
          hours = 70;
          details = "Build a vector-similarity document search system. Parse raw data into embeddings, index them using pgvector in PostgreSQL, and build a conversational AI interface to query files.";
        } else if (text.includes("dashboard") || text.includes("admin") || text.includes("chart")) {
          generatedTitle = "Operational SaaS Analytics Dashboard";
          tech = "React, Chart.js, Tailwind CSS, Node.js, Express";
          difficulty = "beginner";
          hours = 30;
          details = "Create a responsive data visualization platform with filterable time-series charts, user session logs, and report export features.";
        }

        setProjTitle(generatedTitle);
        setProjDifficulty(difficulty);
        setProjTechStack(tech);
        setProjHours(hours);
        setProjDesc(details + "\n\nCore features to include:\n1. Robust error boundaries and user notifications.\n2. Secure authentication and role-based permissions.\n3. Comprehensive API documentation (Swagger/OpenAPI).\n4. Production build configurations with Docker/CI-CD pipelines.");
        
        setIsGeneratingAIProject(false);
        setSuccess("AI has successfully expanded your previous work into a complete project template! Review and publish the details below.");
      }, 2500);
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
        
        if (editingProject) {
          await api.projects.update(editingProject.id, {
            title: projTitle,
            description: projDesc,
            difficulty: projDifficulty,
            estimated_hours: projHours,
            tech_stack: techStackArray,
          });
          setSuccess(`Project "${projTitle}" template updated successfully!`);
          setEditingProject(null);
        } else {
          await api.projects.create({
            title: projTitle,
            description: projDesc,
            difficulty: projDifficulty,
            estimated_hours: projHours,
            tech_stack: techStackArray,
          });
          setSuccess(`Project "${projTitle}" template created successfully!`);
        }
        
        setProjTitle("");
        setProjDesc("");
        setProjDifficulty("beginner");
        setProjTechStack("");
        setProjHours(40);
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to save project template.");
      } finally {
        setIsCreatingProject(false);
      }
    };

    const handleEditClick = (p: any) => {
      setEditingProject(p);
      setProjTitle(p.title);
      setProjDesc(p.description || "");
      setProjDifficulty(p.difficulty || "beginner");
      setProjTechStack(p.tech_stack ? p.tech_stack.join(", ") : "");
      setProjHours(p.estimated_hours || 40);
      
      const formElement = document.getElementById("project-template-form");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
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
            <div className="flex gap-2 self-start flex-wrap">
              {user?.email?.toLowerCase() === "durgasravan21@gmail.com" && (
                <Button onClick={() => setAdminViewMode("admin")} className="bg-gradient-to-r from-primary to-secondary">
                  Switch to Admin View
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push("/profile")}>
                <Settings className="h-4 w-4 mr-2" /> Edit Availability & Rates
              </Button>
            </div>
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
                  <span className="text-xl font-bold text-foreground">{formatDualCurrencyAmount(totalEarnings)}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5 text-xs text-muted">
                <div className="flex justify-between">
                  <span>Coaching Sessions ({completedHours}h):</span>
                  <span className="font-semibold text-foreground">{formatDualCurrencyAmount(mentoringEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peer Code Reviews ({reviewedCount}):</span>
                  <span className="font-semibold text-foreground">{formatDualCurrencyAmount(reviewEarnings)}</span>
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
              
              {/* Confirmed Sessions Quick Join (Highly Visible on Mobile) */}
              {activeSessions.length > 0 && (
                <Card className="p-6 border-success/30 bg-gradient-to-r from-surface to-success/5 animate-pulse-slow">
                  <CardTitle className="mb-4 flex items-center justify-between text-success">
                    <span className="flex items-center gap-2">
                      <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-success"></span>
                      </span>
                      Active Sessions & Join Options
                    </span>
                    <Badge variant="success" className="animate-pulse">Active Session Available</Badge>
                  </CardTitle>
                  <div className="space-y-4">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground text-sm">
                              {session.student_name ? `${session.student_name} (#${session.mentee_id})` : `Student #${session.mentee_id}`}
                            </h4>
                            {session.status === "confirmed" ? (
                              <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px]">Pending</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-success" />
                              {new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-success" />
                              {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {session.status === "pending" && (
                            <button
                              onClick={() => handleUpdateSessionStatus(session.id, "confirmed")}
                              className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-success/20 hover:bg-success/30 text-success font-medium transition-colors text-xs border border-success/20"
                            >
                              Accept
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, "cancelled")}
                            className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-error/10 hover:bg-error/20 text-error font-medium transition-colors text-xs border border-error/20"
                          >
                            Cancel
                          </button>
                          {session.status === "confirmed" && (
                            <button
                              onClick={() => handleUpdateSessionStatus(session.id, "completed")}
                              className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary font-medium transition-colors text-xs border border-primary/20"
                            >
                              Complete
                            </button>
                          )}
                          {session.status === "confirmed" && (
                            <button
                              onClick={() => handleSendJoinReminder(session.id)}
                              className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-warning/20 hover:bg-warning/30 text-warning font-medium transition-colors text-xs border border-warning/20 flex items-center justify-center gap-1"
                            >
                              <Bell className="h-3.5 w-3.5" /> Remind
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVideoSession(session);
                              setIsVideoCallOpen(true);
                            }}
                            className="flex-[2] sm:flex-initial py-2 px-5 rounded-xl bg-success hover:bg-success/80 text-white font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)] active:scale-95"
                          >
                            <Video className="h-4 w-4" /> Join Call
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Incoming Requests & Active Sessions (Direct Accept & Join Options) */}
              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2 text-warning">
                  <Calendar className="h-5 w-5 text-primary" />
                  Mentoring Session Requests & Active Calls ({pendingBookings.length + upcomingBookings.length})
                </CardTitle>

                {pendingBookings.length === 0 && upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted text-sm bg-white/[0.01] rounded-2xl border border-white/5">
                    No new session requests or active calls. Keep your profile updated to attract bookings!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Render pending requests */}
                    {pendingBookings.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground text-sm">Request from {session.student_name || `Student #${session.mentee_id}`}</h4>
                            <Badge variant="warning" className="text-[10px]">Pending</Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted">
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-warning" />{new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-warning" />{new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)</span>
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
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVideoSession(session);
                              setIsVideoCallOpen(true);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-success/20 hover:bg-success/30 text-success font-bold transition-all text-xs flex items-center justify-center gap-1 border border-success/30 active:scale-95"
                          >
                            <Video className="h-3.5 w-3.5" /> Join Call
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Render confirmed active calls directly in the list */}
                    {upcomingBookings.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-xl border border-success/30 bg-success/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground text-sm">Confirmed with {session.student_name || `Student #${session.mentee_id}`}</h4>
                            <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted">
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-success" />{new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-success" />{new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)</span>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, "cancelled")}
                            className="flex-1 sm:flex-initial py-1.5 px-3 rounded-lg bg-error/10 hover:bg-error/20 text-error font-medium transition-colors text-[10px] border border-error/20"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, "completed")}
                            className="flex-1 sm:flex-initial py-1.5 px-3 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary font-medium transition-colors text-[10px] border border-primary/20"
                          >
                            Mark Done
                          </button>
                          <button
                            onClick={() => handleSendJoinReminder(session.id)}
                            className="flex-1 sm:flex-initial py-1.5 px-3 rounded-lg bg-warning/20 hover:bg-warning/30 text-warning font-medium transition-colors text-[10px] border border-warning/20 flex items-center justify-center gap-1"
                          >
                            <Bell className="h-3 w-3" /> Remind
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVideoSession(session);
                              setIsVideoCallOpen(true);
                            }}
                            className="flex-[2] sm:flex-initial py-1.5 px-4 rounded-lg bg-success hover:bg-success/80 text-white font-bold transition-all text-[10px] flex items-center justify-center gap-1 shadow-[0_0_10px_rgba(34,197,94,0.2)] active:scale-95 animate-pulse"
                          >
                            <Video className="h-3.5 w-3.5" /> Join Call
                          </button>
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

              {/* AI Project Template Generator from Previous Work */}
              <Card className="p-6 border border-primary/20 bg-gradient-to-b from-surface to-[#151528] animate-fadeIn">
                <CardTitle className="mb-3 flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  AI Project Template Generator from Previous Work
                </CardTitle>
                <p className="text-xs text-muted mb-4 leading-relaxed">
                  Describe a project you built previously, a piece of custom code, or an architectural pattern you worked on.
                  Our AI will automatically construct a complete project template brief, list required features/technologies, and populate the project editor below.
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted font-medium block">
                      Previous Work Description / Project Concept
                    </label>
                    <textarea
                      placeholder="e.g. I built a chat app using WebSockets and Node.js with Redis pub-sub to broadcast messages in group rooms..."
                      value={aiProjectInput}
                      onChange={(e) => setAiProjectInput(e.target.value)}
                      rows={3}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleGenerateAIProject}
                    disabled={isGeneratingAIProject || !aiProjectInput.trim()}
                    className="w-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-bold"
                  >
                    {isGeneratingAIProject ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        AI is compiling project template details...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI & Populate Template Editor
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Upload / Create Project Template */}
              <Card id="project-template-form" className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-accent" />
                  {editingProject ? "Edit Project Template" : "Upload Project Template"}
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

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isCreatingProject} isLoading={isCreatingProject} className="flex-1">
                      {editingProject ? "Save Changes" : "Upload Template"}
                    </Button>
                    {editingProject && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingProject(null);
                          setProjTitle("");
                          setProjDesc("");
                          setProjDifficulty("beginner");
                          setProjTechStack("");
                          setProjHours(40);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Card>

              {/* My Published Project Templates */}
              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-primary" />
                    My Published Project Templates ({myTemplates.length})
                  </span>
                  <Badge variant="outline" className="text-xs text-muted">Active Catalog</Badge>
                </CardTitle>

                {myTemplates.length === 0 ? (
                  <p className="text-xs text-muted italic text-center py-4 bg-white/[0.01] rounded-xl border border-white/5">
                    No custom templates uploaded yet. Create one using the form or AI generator above!
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {myTemplates.map((p) => (
                      <div key={p.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-foreground text-sm line-clamp-1">{p.title}</h4>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {getDifficultyBadge(p.difficulty)}
                              <button
                                type="button"
                                onClick={() => handleEditClick(p)}
                                className="p-1 rounded bg-white/5 hover:bg-white/10 text-muted hover:text-foreground transition-all"
                                title="Edit Template"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.tech_stack?.slice(0, 3).map((tech: string) => (
                            <Badge key={tech} variant="outline" className="text-[9px] py-0 px-1.5">{tech}</Badge>
                          ))}
                          <span className="text-[10px] text-muted ml-auto font-mono">{p.estimated_hours}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Active Student Cohort */}
              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-secondary" />
                  Active Student Cohort (Enrolled in Your Projects)
                </CardTitle>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-muted uppercase font-bold tracking-wider">
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Enrolled Project</th>
                        <th className="p-3 text-center">Progress</th>
                        <th className="p-3 text-right">Incentive Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="hover:bg-white/[0.02] text-foreground">
                        <td className="p-3 font-semibold">Durga sravan Challagolla</td>
                        <td className="p-3 text-muted">SaaS Analytics Dashboard</td>
                        <td className="p-3 text-center font-bold text-primary">78% Complete</td>
                        <td className="p-3 text-right text-success font-mono font-bold">$15 review pending</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] text-foreground">
                        <td className="p-3 font-semibold">Jane Smith</td>
                        <td className="p-3 text-muted">Stripe Gateway Microservice</td>
                        <td className="p-3 text-center font-bold text-primary">45% Complete</td>
                        <td className="p-3 text-right text-muted font-mono">In Progress</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02] text-foreground">
                        <td className="p-3 font-semibold">Alex Rivera</td>
                        <td className="p-3 text-muted">AI pgvector Search Engine</td>
                        <td className="p-3 text-center font-bold text-primary">95% Complete</td>
                        <td className="p-3 text-right text-success font-mono font-bold">$15 review pending</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>

            {/* Right Column (Profile & Schedule) */}
            <div className="space-y-6">
              
              {/* Mentoring Join Panel */}
              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Mentoring Join Panel ({activeSessions.length})
                </CardTitle>

                {activeSessions.length === 0 ? (
                  <p className="text-xs text-muted italic">No upcoming or pending mentoring sessions.</p>
                ) : (
                  <div className="space-y-4">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-foreground">
                            {session.student_name ? `${session.student_name} (#${session.mentee_id})` : `Student #${session.mentee_id}`}
                          </span>
                          <div className="flex items-center gap-2">
                            {session.status === "confirmed" ? (
                              <Badge variant="success">Confirmed</Badge>
                            ) : (
                              <Badge variant="warning">Pending</Badge>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenReportStudentModal((session as any).student_id || session.mentee_id, session.student_name || `Student #${session.mentee_id}`)}
                              className="text-[10px] text-error hover:underline font-semibold"
                            >
                              Report
                            </button>
                          </div>
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
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {session.status === "pending" && (
                            <button
                              onClick={() => handleUpdateSessionStatus(session.id, "confirmed")}
                              className="flex-1 py-1 rounded bg-success/20 hover:bg-success/30 text-success font-medium transition-colors text-[10px] flex items-center justify-center gap-0.5"
                            >
                              <Check className="h-3 w-3" /> Accept
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateSessionStatus(session.id, "cancelled")}
                            className="flex-1 py-1 rounded bg-error/10 hover:bg-error/20 text-error font-medium transition-colors text-[10px]"
                          >
                            Cancel
                          </button>
                          {session.status === "confirmed" && (
                            <button
                              onClick={() => handleUpdateSessionStatus(session.id, "completed")}
                              className="flex-1 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary font-medium transition-colors text-[10px]"
                            >
                              Mark Done
                            </button>
                          )}
                          {session.status === "confirmed" && (
                            <button
                              onClick={() => handleSendJoinReminder(session.id)}
                              className="flex-1 py-1 rounded bg-warning/20 hover:bg-warning/30 text-warning font-medium transition-colors text-[10px] flex items-center justify-center gap-0.5 border border-warning/10"
                            >
                              <Bell className="h-3 w-3" /> Remind
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVideoSession(session);
                              setIsVideoCallOpen(true);
                            }}
                            className="flex-1 py-1 rounded bg-success hover:bg-success/80 text-white font-bold transition-all text-[10px] flex items-center justify-center gap-1"
                          >
                            <Video className="h-3 w-3" /> Join Call
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

                  {/* Video Call Availability Toggle */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Video Calls Active</span>
                        <span className="text-[11px] text-muted block mt-0.5">Allow students to book video calls</span>
                      </div>
                      <button
                        onClick={handleToggleVideoCalls}
                        disabled={isTogglingVideoCalls}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          mentorProfile?.video_calls_active !== false ? "bg-gradient-to-r from-primary to-secondary" : "bg-white/10"
                        } ${isTogglingVideoCalls ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform ${
                            mentorProfile?.video_calls_active !== false ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
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

                {(() => {
                  const getSubmissionIncentive = (sub: any) => {
                    if (!sub) return 0.50;
                    const diff = (sub.difficulty || "beginner").toLowerCase();
                    if (diff === "beginner") return 0.50;
                    if (diff === "intermediate") return 0.75;
                    if (diff === "advanced") return 1.00;
                    return 0.50;
                  };
                  const incentive = getSubmissionIncentive(reviewingSubmission);
                  return (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="text-xs text-muted">
                        Submitting this review will add a flat incentive of <strong className="text-foreground">${incentive.toFixed(2)} ({formatDualCurrencyAmount(incentive)})</strong> to your platform payouts stats.
                      </span>
                    </div>
                  );
                })()}

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
    // Check for active joining reminder sent within last 2 minutes
    const activeReminderSession = mentorSessions.find((session) => {
      if (session.status !== "confirmed") return false;
      if (!session.reminder_sent || !session.reminder_sent_at) return false;
      
      const reminderTime = new Date(session.reminder_sent_at).getTime();
      const now = Date.now();
      return now - reminderTime < 2 * 60 * 1000;
    });

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {activeReminderSession && (
            <div className="mb-6 bg-warning/20 border-2 border-warning/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <div className="flex items-center gap-3">
                <div className="bg-warning/30 p-2 rounded-xl text-warning">
                  <Bell className="h-6 w-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">🚨 Immediate Call Join Request</h4>
                  <p className="text-xs text-muted">
                    Your Coach <span className="text-warning font-semibold">{activeReminderSession.mentor_name || "your mentor"}</span> is waiting for you in the video call. Please join immediately.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setActiveVideoSession(activeReminderSession);
                  setIsVideoCallOpen(true);
                }}
                className="w-full sm:w-auto bg-warning hover:bg-warning/80 text-background font-bold text-xs"
              >
                <Video className="h-3.5 w-3.5 mr-1" /> Join Call Now
              </Button>
            </div>
          )}
          
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
              <Button size="sm" variant="outline" onClick={() => router.push("/profile")} className="w-full sm:w-auto border-success/30 hover:bg-success/20 text-foreground font-bold">
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

          {/* Prominent Active Sessions Banner — always visible when sessions exist */}
          {mentorSessions.filter(s => s.status === "confirmed" || s.status === "pending").length > 0 && (
            <div className="mb-6 animate-fadeIn">
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Active Coaching Sessions
                  </h3>
                  <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                    {mentorSessions.filter(s => s.status === "confirmed" || s.status === "pending").length} Session{mentorSessions.filter(s => s.status === "confirmed" || s.status === "pending").length > 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {mentorSessions.filter(s => s.status === "confirmed" || s.status === "pending").map((session) => (
                    <div
                      key={`active-banner-${session.id}`}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/[0.03] border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(session.mentor_name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {session.mentor_name || `Coach #${session.mentor_id}`}
                          </p>
                          <p className="text-[10px] text-muted">
                            {new Date(session.scheduled_at).toLocaleDateString()} at{" "}
                            {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            {" · "}{session.duration_minutes}min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Badge
                          className={cn(
                            "text-[10px]",
                            session.status === "confirmed"
                              ? "bg-success/20 text-success border-success/30"
                              : "bg-warning/20 text-warning border-warning/30"
                          )}
                        >
                          {session.status}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveVideoSession(session);
                            setIsVideoCallOpen(true);
                          }}
                          className="flex-1 sm:flex-initial bg-gradient-to-r from-success to-emerald-500 hover:brightness-110 text-white py-2 px-5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-success/20 active:scale-95"
                        >
                          <Video className="h-4 w-4" /> Join Call
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                              {(session.status === "confirmed" || session.status === "pending") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVideoSession(session);
                                    setIsVideoCallOpen(true);
                                  }}
                                  className="bg-success/20 hover:bg-success/30 text-success border border-success/30 py-1 px-2.5 text-[10px] rounded-lg font-bold transition-all flex items-center gap-1"
                                >
                                  <Video className="h-3 w-3" /> Join Call
                                </button>
                              )}
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

        {/* Report Coach / Student Modal */}
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 animate-slideUp">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {reportType === "mentor" ? "Report Coach" : "Report Student"}
                </h3>
                <p className="text-xs text-muted mt-1">
                  Submit a report regarding your experience or issues with{" "}
                  {reportType === "mentor" ? (
                    <>coach <strong>{reportTargetMentorName}</strong></>
                  ) : (
                    <>student <strong>{reportTargetStudentName}</strong></>
                  )}
                  .
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

  const renderVideoCallModal = () => {
    if (!activeVideoSession || !isMounted) return null;

    const isStudent = String(activeVideoSession.student_id) === String(user?.id) || 
                      (user?.email?.toLowerCase() !== "durgasravan21@gmail.com" && 
                       user?.role !== "mentor");

    const peerName = user?.email?.toLowerCase() === "durgasravan21@gmail.com" || (mentorProfile && mentorProfile.verification_status === "verified")
      ? (activeVideoSession.student_name || "Student")
      : (activeVideoSession.mentor_name || "Coach");

    const peerInitials = peerName.split(" ").map((n: string) => n[0]).join("").toUpperCase();
    const myInitials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "U";

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fadeIn">
        <div className="relative w-full h-full sm:max-w-6xl sm:h-[85vh] bg-[#0a0a0f]/90 border-0 sm:border border-white/10 sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              {isRecording && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-error/15 border border-error/30 text-error text-[10px] font-bold tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  REC ACTIVE
                </div>
              )}
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider group relative cursor-help border",
                callConnectionState === "connected" && "bg-success/15 border-success/30 text-success",
                callConnectionState === "connecting" && "bg-muted/15 border-white/10 text-muted animate-pulse",
                callConnectionState === "ringing" && "bg-primary/15 border-primary/30 text-primary animate-pulse",
                callConnectionState === "reconnecting" && "bg-warning/15 border-warning/30 text-warning animate-pulse",
                callConnectionState === "failed" && "bg-error/15 border-error/30 text-error",
              )}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {callConnectionState === "connected" ? "E2EE Connected" 
                  : callConnectionState === "ringing" ? "Ringing..." 
                  : callConnectionState === "reconnecting" ? "Reconnecting..."
                  : callConnectionState === "failed" ? "Connection Failed"
                  : "Connecting..."}
                <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-[#0a0a0f] border border-white/10 text-muted p-2 rounded-lg text-[10px] w-64 z-50 normal-case leading-relaxed shadow-xl">
                  {callConnectionState === "connected" 
                    ? "Your video call is live and secured end-to-end using WebRTC DTLS-SRTP encryption with TURN relay for reliable connectivity."
                    : callConnectionState === "failed"
                    ? "Connection could not be established. Try refreshing or check your network."
                    : "Establishing a secure peer-to-peer connection via STUN/TURN servers..."}
                </div>
              </div>
              <h3 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-2">
                <span className="text-primary hidden sm:inline">1-on-1 Mentoring Room</span>
                <span className="text-primary sm:hidden">Call</span>
                <span className="text-muted">|</span>
                <span className="text-[10px] sm:text-xs text-muted font-normal">Session #{activeVideoSession.id}</span>
              </h3>
            </div>
            <button
              onClick={() => {
                if (leaveCooldown > 0) return;
                handleLeaveCall();
              }}
              disabled={leaveCooldown > 0}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                leaveCooldown > 0
                  ? "text-muted/30 cursor-not-allowed"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
              title={leaveCooldown > 0 ? `Must wait ${leaveCooldown}s before leaving` : "Leave call"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Webcam Grid */}
            <div className="flex-1 p-2 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-4 bg-black/45 md:overflow-y-auto max-md:overflow-hidden relative min-h-0">
              {isPeerOfflineAlertVisible && (
                <div className="bg-error/20 border border-error/40 text-error px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold animate-pulse z-30">
                  <span>🚨 The other participant is currently offline. They will be notified to join soon.</span>
                  <button onClick={() => setIsPeerOfflineAlertVisible(false)} className="hover:text-foreground">Dismiss</button>
                </div>
              )}
              <div className="flex-1 relative md:grid md:grid-cols-2 gap-2 sm:gap-4 md:gap-6 min-h-0">
                {/* User Webcam Frame (Local) */}
              <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex flex-col items-center justify-center transition-all duration-300 md:relative md:aspect-auto md:h-full max-md:absolute max-md:bottom-4 max-md:right-4 max-md:w-32 max-md:h-24 max-md:z-20 max-md:shadow-xl max-md:border-white/20">
                {isVideoMuted ? (
                  <div className="absolute inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center gap-1.5 md:gap-3">
                    <div className="w-8 h-8 md:w-20 md:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted font-bold text-xs md:text-2xl">
                      {myInitials}
                    </div>
                    <span className="text-[9px] md:text-xs text-muted font-medium flex items-center gap-1.5 max-md:hidden">
                      <VideoOff className="h-3.5 w-3.5 text-error" /> Camera is off
                    </span>
                  </div>
                ) : (
                  <>
                    <video
                      ref={localVideoCallbackRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    />
                    <span className="absolute bottom-1 left-1 md:bottom-4 md:left-4 bg-black/60 backdrop-blur-md px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[9px] md:text-xs font-semibold text-foreground border border-white/10 z-10">
                      You (Live Camera)
                    </span>
                  </>
                )}
                {isMuted && (
                  <span className="absolute top-1 right-1 md:top-4 md:right-4 bg-error/20 border border-error/30 text-error p-1 md:p-1.5 rounded-full z-10">
                    <MicOff className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
                  </span>
                )}
              </div>

              {/* Peer (Coach/Student) Webcam Frame (Remote) */}
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex flex-col items-center justify-center transition-all duration-300 md:aspect-auto md:h-full max-md:w-full max-md:h-full max-md:absolute max-md:inset-0 max-md:z-10">
                {(remoteStream && !peerIsVideoMuted) ? (
                  <video
                    ref={peerVideoCallbackRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center gap-4 z-10">
                    <div className={cn(
                      "w-24 h-24 rounded-full border-2 flex items-center justify-center text-white font-extrabold text-3xl transition-all duration-500",
                      callConnectionState === "connecting" && "bg-white/5 border-white/10 animate-pulse",
                      callConnectionState === "ringing" && "bg-primary/10 border-primary/40 animate-pulse ring-4 ring-primary/20",
                      callConnectionState === "reconnecting" && "bg-warning/10 border-warning/40 animate-pulse",
                      callConnectionState === "failed" && "bg-error/10 border-error/40",
                      (callConnectionState === "connected" || peerIsVideoMuted) && "bg-white/5 border-white/10"
                    )}>
                      {peerInitials}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className={cn(
                        "text-xs font-semibold text-muted",
                        callConnectionState === "ringing" && "text-primary animate-pulse",
                        callConnectionState === "reconnecting" && "text-warning animate-pulse",
                        callConnectionState === "failed" && "text-error",
                      )}>
                        {peerIsVideoMuted ? "📹 Camera is off" : 
                         callConnectionState === "connecting" ? "📡 Establishing connection..." :
                         callConnectionState === "ringing" ? "📞 Ringing..." :
                         callConnectionState === "reconnecting" ? "🔄 Reconnecting..." :
                         callConnectionState === "failed" ? "❌ Connection failed" : "Camera is off"}
                      </span>
                      {callConnectionState === "ringing" && (
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0s" }} />
                          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.15s" }} />
                          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.3s" }} />
                        </div>
                      )}
                      {callConnectionState === "failed" && (
                        <button
                          onClick={() => {
                            // Retry by re-opening the call
                            setIsVideoCallOpen(false);
                            setTimeout(() => {
                              setIsVideoCallOpen(true);
                            }, 500);
                          }}
                          className="mt-2 px-4 py-1.5 bg-primary hover:bg-primary/80 text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                        >
                          Retry Connection
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-foreground border border-white/10 z-10 flex items-center gap-2 max-md:bottom-16 max-md:left-2 max-md:px-2 max-md:py-0.5 max-md:text-[10px] max-md:z-30">
                  <span>{peerName} (Live Stream)</span>
                  {peerIsMuted ? (
                    <MicOff className="h-3.5 w-3.5 text-error" />
                  ) : (
                    /* Waveform talk animation */
                    <div className="flex items-center gap-[3px] h-3.5 w-6">
                      <div className="w-[3px] bg-success h-2 rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.8s' }} />
                      <div className="w-[3px] bg-success h-3 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }} />
                      <div className="w-[3px] bg-success h-1.5 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.9s' }} />
                      <div className="w-[3px] bg-success h-2.5 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.7s' }} />
                    </div>
                  )}
                </span>
                {peerIsMuted && (
                  <span className="absolute top-4 right-4 bg-error/20 border border-error/30 text-error p-1.5 rounded-full z-20 max-md:top-2 max-md:right-2">
                    <MicOff className="h-4 w-4" />
                  </span>
                )}
              </div>
              </div>
            </div>

            {/* Sidebar (AI Live Transcription & Text Chat) */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-[200px] sm:h-[300px] md:h-full bg-white/[0.02] backdrop-blur-lg">
              {/* Sidebar Tab Header */}
              <div className="grid grid-cols-2 border-b border-white/10 bg-white/5 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setSidebarTab("transcript")}
                  className={cn(
                    "py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                    sidebarTab === "transcript"
                      ? "bg-white/10 text-foreground shadow"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", sidebarTab === "transcript" ? "bg-primary animate-pulse" : "bg-muted")} />
                  AI Transcript
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("chat")}
                  className={cn(
                    "py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                    sidebarTab === "chat"
                      ? "bg-white/10 text-foreground shadow"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", sidebarTab === "chat" ? "bg-success animate-pulse" : "bg-muted")} />
                  Room Chat
                </button>
              </div>

              {sidebarTab === "transcript" ? (
                /* Transcription Logs Container */
                <div
                  ref={scrollRef}
                  className="flex-1 p-5 overflow-y-auto space-y-4 text-xs font-sans scrollbar-thin"
                >
                  {transcriptionLogs.map((log, idx) => {
                    if (!log || typeof log !== "string") return null;
                    const isSystem = log.startsWith("System:");
                    const isMentor = log.startsWith("Mentor:");
                    const isStudent = log.startsWith("Student:");

                    let content = log;
                    let sender = "";
                    let bubbleStyle = "bg-white/5 text-muted border-white/5";

                    if (isSystem) {
                      sender = "AI Copilot";
                      content = log.substring(7).trim();
                      bubbleStyle = "bg-warning/10 text-warning border-warning/20 border";
                    } else if (isMentor) {
                      sender = user?.email?.toLowerCase() === "durgasravan21@gmail.com" || (mentorProfile && mentorProfile.verification_status === "verified") ? "You" : peerName;
                      content = log.substring(7).trim();
                      bubbleStyle = "bg-secondary/15 text-[#e2e8f0] border-secondary/30 border";
                    } else if (isStudent) {
                      sender = user?.email?.toLowerCase() === "durgasravan21@gmail.com" || (mentorProfile && mentorProfile.verification_status === "verified") ? peerName : "You";
                      content = log.substring(8).trim();
                      bubbleStyle = "bg-primary/15 text-[#e2e8f0] border-primary/30 border";
                    }

                    return (
                      <div key={idx} className={cn("flex flex-col gap-1", isSystem ? "items-center text-center" : "items-start")}>
                        <span className="text-[10px] text-muted font-bold px-1">{sender}</span>
                        <div className={cn("px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed max-w-[90%]", bubbleStyle)}>
                          {content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Room Chat Container */
                <div className="flex-1 flex flex-col min-h-0 bg-black/20">
                  {/* Messages list */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs scrollbar-thin">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <span className="text-muted italic text-[11px]">No chat messages yet.</span>
                        <span className="text-[10px] text-muted mt-1 leading-relaxed">Send a message to speak with the other participant in real time.</span>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isMe = msg.sender === (user?.name || user?.email?.split("@")[0]);
                        return (
                          <div key={idx} className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                            <div className="flex items-center gap-1.5 text-[9px] text-muted px-1">
                              <span className="font-bold">{msg.sender}</span>
                              <span>·</span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <div
                              className={cn(
                                "px-3 py-2 rounded-2xl text-[11px] max-w-[85%] break-words border",
                                isMe
                                  ? "bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground border-primary/30 rounded-tr-none"
                                  : "bg-white/5 text-[#e2e8f0] border-white/10 rounded-tl-none"
                              )}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* Message Input Box */}
                  <div className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendChatMessage();
                        }
                      }}
                      className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted"
                    />
                    <button
                      type="button"
                      onClick={sendChatMessage}
                      className="px-3.5 bg-primary hover:bg-primary/80 text-white text-[11px] font-bold rounded-xl active:scale-95 transition-all"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Controls Toolbar */}
          <div className="px-3 sm:px-6 py-3 sm:py-5 border-t border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-2">
            <div className="hidden sm:flex items-center gap-3">
              <Button
                size="sm"
                variant={isScreenSharing ? "destructive" : "outline"}
                className={cn("text-xs", isScreenSharing ? "bg-primary text-white animate-pulse" : "text-muted")}
                onClick={async () => {
                  if (isScreenSharing) {
                    // Stop screen sharing
                    if (screenStreamRef.current) {
                      screenStreamRef.current.getTracks().forEach((t) => t.stop());
                      screenStreamRef.current = null;
                    }
                    // Restore camera video track to peer connection
                    if (localStream && peerConnectionRef.current) {
                      const camTrack = localStream.getVideoTracks()[0];
                      if (camTrack) {
                        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
                        if (sender) sender.replaceTrack(camTrack);
                      }
                    }
                    setIsScreenSharing(false);
                    setTranscriptionLogs((prev) => [...prev, "System: [Screen sharing stopped]"]);
                  } else {
                    // Start real screen sharing
                    try {
                      const displayStream = await navigator.mediaDevices.getDisplayMedia({
                        video: { cursor: "always" } as any,
                        audio: false,
                      });
                      screenStreamRef.current = displayStream;
                      const screenTrack = displayStream.getVideoTracks()[0];
                      // Replace camera video track with screen track in peer connection
                      if (peerConnectionRef.current) {
                        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
                        if (sender) sender.replaceTrack(screenTrack);
                      }
                      // Show screen share in local video preview
                      if (localVideoRef.current) {
                        localVideoRef.current.srcObject = displayStream;
                      }
                      setIsScreenSharing(true);
                      setTranscriptionLogs((prev) => [...prev, "System: [User started sharing screen]"]);
                      // Handle user clicking browser's native "Stop sharing" button
                      screenTrack.onended = () => {
                        screenStreamRef.current = null;
                        if (localStream && peerConnectionRef.current) {
                          const camTrack = localStream.getVideoTracks()[0];
                          if (camTrack) {
                            const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
                            if (sender) sender.replaceTrack(camTrack);
                          }
                        }
                        if (localVideoRef.current && localStream) {
                          localVideoRef.current.srcObject = localStream;
                        }
                        setIsScreenSharing(false);
                        setTranscriptionLogs((prev) => [...prev, "System: [Screen sharing stopped]"]);
                      };
                    } catch (err) {
                      console.warn("Screen sharing cancelled or failed:", err);
                    }
                  }
                }}
              >
                <Laptop className="h-4 w-4 mr-2" /> {isScreenSharing ? "Stop Sharing" : "Share Screen"}
              </Button>
              
              {/* Recording Controls (Available to both Coach and Student) */}
              {isRecording ? (
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs font-bold flex items-center gap-1.5 animate-pulse bg-error hover:bg-error/80 text-white"
                  onClick={stopRecording}
                >
                  <Square className="h-4 w-4 fill-white" /> Stop Recording
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-muted flex items-center gap-1.5 border-dashed hover:border-error/50 hover:bg-error/5 border-white/20"
                  onClick={startRecording}
                >
                  <Circle className="h-4 w-4 fill-error text-error animate-pulse" /> Record Session
                </Button>
              )}

              {/* Status Badges & Remote Controls */}
              {!isStudent ? (
                /* Mentor Remote Controls for Student & Peer Recording Status */
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                  {peerIsRecording && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error/15 border border-error/30 text-error text-[10px] font-extrabold uppercase tracking-wider animate-pulse mr-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                      STUDENT RECORDING
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground mr-1 uppercase tracking-wider font-bold">Student:</span>
                  <button
                    onClick={() => {
                      sendSignal({
                        type: "remote_control",
                        action: peerIsMuted ? "unmute_audio" : "mute_audio",
                        clientId: clientIdRef.current
                      });
                      setPeerIsMuted(!peerIsMuted);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg border text-xs flex items-center justify-center transition-all",
                      peerIsMuted
                        ? "bg-error/10 hover:bg-error/20 border-error/30 text-error"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-muted-foreground"
                    )}
                    title={peerIsMuted ? "Unmute Student Mic" : "Mute Student Mic"}
                  >
                    {peerIsMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      sendSignal({
                        type: "remote_control",
                        action: peerIsVideoMuted ? "unmute_video" : "mute_video",
                        clientId: clientIdRef.current
                      });
                      setPeerIsVideoMuted(!peerIsVideoMuted);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg border text-xs flex items-center justify-center transition-all",
                      peerIsVideoMuted
                        ? "bg-error/10 hover:bg-error/20 border-error/30 text-error"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-muted-foreground"
                    )}
                    title={peerIsVideoMuted ? "Enable Student Camera" : "Disable Student Camera"}
                  >
                    {peerIsVideoMuted ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ) : (
                /* Student: Peer Recording Status Only */
                <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                  {peerIsRecording && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error/15 border border-error/30 text-error text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                      COACH RECORDING
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Core Mic & Video Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all shadow-md active:scale-90",
                  isMuted
                    ? "bg-error/20 hover:bg-error/30 text-error border-error/40"
                    : "bg-white/5 hover:bg-white/10 text-foreground border-white/10"
                )}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={cn(
                  "w-12 h-12 rounded-full border flex items-center justify-center transition-all shadow-md active:scale-90",
                  isVideoMuted
                    ? "bg-error/20 hover:bg-error/30 text-error border-error/40"
                    : "bg-white/5 hover:bg-white/10 text-foreground border-white/10"
                )}
              >
                {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>
            </div>

            {/* Leave button */}
            <div>
              <button
                onClick={() => {
                  if (leaveCooldown > 0) return;
                  handleLeaveCall();
                }}
                disabled={leaveCooldown > 0}
                className={cn(
                  "font-bold text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-full flex items-center gap-2 shadow-lg transition-all duration-200",
                  leaveCooldown > 0
                    ? "bg-white/5 border border-white/10 text-muted cursor-not-allowed opacity-50"
                    : "bg-error hover:bg-red-600 text-white hover:shadow-error/25 active:scale-95"
                )}
              >
                <PhoneOff className="h-4 w-4" /> 
                {leaveCooldown > 0 ? `Wait ${leaveCooldown}s` : "End Call"}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Dynamic Dashboard Router Switching
  const isMentorVerifiedAndComplete = 
    (user?.email?.toLowerCase() === "challagollasridevi@gmail.com" || user?.email?.toLowerCase() === "durgasravan21@gmail.com" || mentorProfile?.email?.toLowerCase() === "challagollasridevi@gmail.com" || mentorProfile?.email?.toLowerCase() === "durgasravan21@gmail.com") ||
    (mentorProfile && 
     mentorProfile.selfie_url && 
     mentorProfile.identity_document_url && 
     mentorProfile.signed_agreement && 
     mentorProfile.signature_svg_or_text);

  let dashboardContent;
  if (user?.email?.toLowerCase() === "durgasravan21@gmail.com") {
    if (adminViewMode === "mentor") {
      dashboardContent = renderMentorDashboard();
    } else {
      dashboardContent = renderAdminDashboard();
    }
  } else if (user?.role === "mentor" || user?.email?.toLowerCase() === "challagollasridevi@gmail.com") {
    if (isMentorVerifiedAndComplete) {
      dashboardContent = renderMentorDashboard();
    } else {
      dashboardContent = renderMentorVerificationWizard();
    }
  } else if (
    mentorProfile &&
    (mentorProfile.verification_status === "verified" ||
      mentorProfile.verification_status === "pending" ||
      mentorProfile.verification_status === "suspended")
  ) {
    if (isMentorVerifiedAndComplete) {
      dashboardContent = renderMentorDashboard();
    } else {
      dashboardContent = renderMentorVerificationWizard();
    }
  } else {
    dashboardContent = renderStudentDashboard();
  }

  return (
    <>
      {isOfflineMode && (
        <div className="bg-warning/20 border-b border-warning/30 text-warning px-4 py-2.5 text-center text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-2 animate-fadeIn z-45 sticky top-[73px] backdrop-blur-md">
          <span>⚠️ Offline Mode: The backend server is currently unreachable. You are viewing cached offline data.</span>
          <button 
            onClick={() => {
              sessionStorage.removeItem("backend_offline");
              window.location.reload();
            }}
            className="underline hover:text-foreground font-bold px-2 py-0.5 rounded bg-warning/20 hover:bg-warning/30 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}
      {dashboardContent}
      {isVideoCallOpen && renderVideoCallModal()}
    </>
  );
}
