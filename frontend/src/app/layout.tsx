import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-brand-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-brand-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ostora Frontend",
  description: "Enterprise job platform frontend with SSR and CSR architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${sourceSerif.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
