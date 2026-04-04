import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DockStudio — AI App Builder · DraftDock",
  description:
    "DraftDock's AI-powered code-generation studio. Describe what you want, approve the plan, and watch your app come to life in-browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#000000",
          colorBackground: "#ffffff",
          colorInputBackground: "#f8f9fa",
          colorText: "#191c1d",
          colorTextSecondary: "#6b7280",
          colorTextOnPrimaryBackground: "#ffffff",
          colorNeutral: "#000000",
          borderRadius: "0.625rem",
        },
        elements: {
          card: "shadow-xl border border-slate-200",
          headerTitle: "text-slate-900 font-bold",
          headerSubtitle: "text-slate-500",
          formButtonPrimary: "bg-black hover:bg-gray-800 text-white",
          footerActionLink: "text-violet-600 hover:text-violet-700 font-semibold",
          identityPreviewText: "text-slate-700",
          formFieldInput: "border-slate-200 focus:border-violet-500 focus:ring-violet-500",
          dividerLine: "bg-slate-200",
          dividerText: "text-slate-400",
          socialButtonsIconButton: "border-slate-200 hover:bg-slate-50",
          navbar: "hidden",
          navbarMobileMenuButton: "hidden",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${spaceGrotesk.variable} ${inter.variable} antialiased bg-background text-foreground`}
        >
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1708287984162194"
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
