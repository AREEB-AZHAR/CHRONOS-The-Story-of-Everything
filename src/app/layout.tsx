import type { Metadata, Viewport } from "next";
import { Fraunces, Space_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
});

const mono = Space_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "CHRONOS ∞ — Stand at the Centre of Spacetime",
  description:
    "You are the centre of the universe. Thirty worlds orbit around you in an infinite 4D stream — from the Big Bang and the first stars to dinosaurs, five mass extinctions, humanity and the present day. Scroll to travel 13.8 billion years; click any moment and it flies to you.",
  keywords: [
    "Big Bang",
    "history of the universe",
    "evolution",
    "mass extinctions",
    "dinosaurs",
    "cosmic timeline",
    "3D scroll experience",
    "WebGL",
  ],
  authors: [{ name: "Z.ai" }],
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "CHRONOS ∞ — Stand at the Centre of Spacetime",
    description:
      "An infinite 4D stream of 13.8 billion years. 30 worlds, 5 mass extinctions, 1 extraordinary planet — orbiting all around you.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020107",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      </body>
    </html>
  );
}
