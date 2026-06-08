import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { CursorParticles } from "@/components/cursor-particles";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CareerAI — AI-Powered Career & Project Intelligence",
  description:
    "Accelerate your tech career with AI-powered skill gap analysis, personalized project recommendations, and expert mentor matching.",
  keywords: [
    "career",
    "AI",
    "skill gap",
    "projects",
    "mentorship",
    "tech career",
    "portfolio",
  ],
  authors: [{ name: "CareerAI" }],
  openGraph: {
    title: "CareerAI — AI-Powered Career & Project Intelligence",
    description:
      "Accelerate your tech career with AI-powered skill gap analysis, personalized project recommendations, and expert mentor matching.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-sans bg-background text-foreground min-h-screen antialiased">
        <Providers>
          <CursorParticles />
          {children}
        </Providers>
      </body>
    </html>
  );
}
