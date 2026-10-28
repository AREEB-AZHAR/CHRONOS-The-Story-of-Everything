import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const display = Space_Grotesk({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const mono = Space_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "CHRONOS 3D — Dive Through 13.8 Billion Years",
  description:
    "A cinematic 3D scroll experience: zoom into the fabric of spacetime and fly through 13.8 billion years — from the Big Bang and the first stars to dinosaurs, mass extinctions, and the Earth of today.",
  keywords: [
    "Big Bang",
    "history of the universe",
    "evolution",
    "mass extinctions",
    "cosmic timeline",
    "3D scroll experience",
  ],
  authors: [{ name: "Z.ai" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CHRONOS 3D — Dive Through 13.8 Billion Years",
    description:
      "Zoom into spacetime and fly through 13.8 billion years. 19 worlds, 5 mass extinctions, 1 extraordinary planet.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020107",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${mono.variable} antialiased bg-[#020107] text-white`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
