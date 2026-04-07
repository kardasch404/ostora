import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import FloatingAIAssistant from "@/components/dashboard/FloatingAIAssistant";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ostora - Enterprise Job Platform",
  description: "AI-powered job matching platform with premium design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AppProviders>
          {children}
          <FloatingAIAssistant />
        </AppProviders>
      </body>
    </html>
  );
}
