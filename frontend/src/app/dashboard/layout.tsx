"use client";

import { ReactNode } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FloatingAIAssistant from "@/components/dashboard/FloatingAIAssistant";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#03050a] text-slate-100">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(0,184,255,0.12),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(255,0,102,0.1),transparent_26%),#050812]">
        {/* Header */}
        <DashboardHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <FloatingAIAssistant />
    </div>
  );
}
