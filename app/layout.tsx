import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import SupabaseProvider from "@/lib/supabase/SupabaseProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Trello Clone - Project Management Made Simple",
    template: "%s | Trello Clone",
  },
  description:
    "A modern project management tool inspired by Trello. Organize your tasks, collaborate with your team, and boost productivity with boards, lists, and cards.",
  keywords: [
    "trello",
    "project management",
    "kanban",
    "task management",
    "productivity",
    "collaboration",
    "boards",
    "tasks",
  ],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://localhost:3000",
    title: "Trello Clone - Project Management Made Simple",
    description:
      "A modern project management tool inspired by Trello. Organize your tasks, collaborate with your team, and boost productivity.",
    siteName: "Trello Clone",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Trello Clone - Project Management Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trello Clone - Project Management Made Simple",
    description:
      "A modern project management tool inspired by Trello. Organize your tasks and boost productivity.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SupabaseProvider>{children}</SupabaseProvider>

          <SpeedInsights />
        </body>
      </ClerkProvider>
    </html>
  );
}
