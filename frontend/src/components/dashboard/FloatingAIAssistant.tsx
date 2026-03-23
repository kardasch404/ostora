"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import RobotMascot from "@/components/dashboard/RobotMascot";

interface Position {
  x: number;
  y: number;
}

const defaultTips = [
  "I can help you prepare a message in one click.",
  "Drag me anywhere. I stay with you on every dashboard page.",
  "Use Fast Apply for high-volume outreach with status tracking.",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function FloatingAIAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const [position, setPosition] = useState<Position>({ x: 22, y: 100 });
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const contextTip = useMemo(() => {
    if (pathname.includes("/fast-apply")) {
      return "You are in Fast Apply mode. Pick jobs and I will help optimize your message templates.";
    }
    if (pathname.includes("/jobs")) {
      return "I marked previously applied jobs in red so you never re-apply by mistake.";
    }
    if (pathname === "/dashboard") {
      return "Your analytics panel now includes performance trends and funnel insights.";
    }
    return defaultTips[0];
  }, [pathname]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDragging(true);
    setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const cardWidth = expanded ? 320 : 72;
    const cardHeight = expanded ? 220 : 72;

    const nextX = clamp(event.clientX - dragOffset.x, 8, window.innerWidth - cardWidth - 8);
    const nextY = clamp(event.clientY - dragOffset.y, 70, window.innerHeight - cardHeight - 8);
    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className="fixed z-50"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className={`relative rounded-2xl border border-cyan-300/30 bg-[#04070e]/95 text-white shadow-[0_20px_50px_-20px_rgba(14,200,255,0.6)] transition-all duration-300 ${expanded ? "w-[340px] p-4" : "w-[120px] h-[84px] p-2"}`}
      >
        <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-[conic-gradient(from_0deg,#0ff5,#f0f0,#0ff5)] opacity-30 blur-sm" />
        <div className="relative flex h-full flex-col">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-[#0b1324] px-2 py-1 text-left"
          >
            <RobotMascot width={expanded ? 64 : 48} height={expanded ? 44 : 34} className="rounded-lg" />
            {expanded && (
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">AI Friend</span>
                <span className="block text-sm font-bold text-cyan-100">Ostora Copilot</span>
              </span>
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-center">
                <RobotMascot width={126} height={88} className="border border-cyan-300/30" />
              </div>
              <p className="text-xs leading-5 text-slate-200">{contextTip}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/fast-apply")}
                  className="rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-2 py-2 text-xs font-semibold text-cyan-100"
                >
                  Open Fast Apply
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/messages")}
                  className="rounded-lg border border-fuchsia-300/40 bg-fuchsia-500/10 px-2 py-2 text-xs font-semibold text-fuchsia-100"
                >
                  Templates
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Tip: drag this panel anywhere. It stays visible while you navigate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
