import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FeedbackWidget } from "./components/FeedbackWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ModelMentions | AI Website Optimization & SEO Services for LLMs",
  description: "The comprehensive SEO services platform for the AI era. Track marketing performance, optimize brand visibility, and master AI website optimization across ChatGPT, Claude, and Gemini.",
  keywords: ["SEO services", "marketing", "AI website optimization", "LLM analytics", "brand visibility", "generative engine optimization"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
