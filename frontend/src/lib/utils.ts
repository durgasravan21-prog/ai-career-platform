import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "beginner":
      return "text-success";
    case "intermediate":
      return "text-warning";
    case "advanced":
      return "text-error";
    default:
      return "text-muted";
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "default";
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDualCurrency(rate: number): string {
  if (rate === 0) return "Free (Passion Service)";
  const inrRate = Math.round(rate * 83.5);
  return `₹${inrRate.toLocaleString("en-IN")} ($${rate}/hr)`;
}

export function getMentorPriceDetails(baseRate: number) {
  return {
    currentRate: Math.round(baseRate * 1.1),
    originalRate: Math.round(baseRate * 1.5),
  };
}

export function formatDualCurrencyWithDiscount(baseRate: number): string {
  if (baseRate === 0) return "Free (Passion Service)";
  const { currentRate } = getMentorPriceDetails(baseRate);
  const inrCurrent = Math.round(currentRate * 83.5);
  return `₹${inrCurrent.toLocaleString("en-IN")} ($${currentRate}/hr)`;
}
