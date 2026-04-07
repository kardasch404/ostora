"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { getAppliedJobIds, getApplicationHistory, MESSAGE_TEMPLATES_STORAGE_KEY } from "@/lib/application-state";
import OstoraLogo from "@/components/brand/OstoraLogo";

type MenuChildItem = {
  name: string;
  href: string;
};

type MenuItem = {
  name: string;
  href?: string;
  icon: ReactNode;
  badge?: number;
  children?: MenuChildItem[];
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const messageBadge = (() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(MESSAGE_TEMPLATES_STORAGE_KEY);
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  })();

  const appliedBadge = (() => {
    if (typeof window === "undefined") return 0;
    return getAppliedJobIds().size;
  })();

  const failedBadge = (() => {
    if (typeof window === "undefined") return 0;
    return getApplicationHistory().filter((item) => item.status === "failed").length;
  })();

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "Find Jobs",
      href: "/dashboard/jobs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      name: "Applications",
      href: "/dashboard/applications",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: failedBadge,
    },
    {
      name: "Fast Apply",
      href: "/dashboard/fast-apply",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: appliedBadge,
    },
    {
      name: "Saved Jobs",
      href: "/dashboard/saved",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
    },
    {
      name: "Messages",
      href: "/dashboard/messages",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      badge: messageBadge,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      name: "Documents",
      href: "/dashboard/documents",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "OstoraCV",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-6-6h12" />
        </svg>
      ),
      children: [
        { name: "Resume", href: "/dashboard/ostoracv/resume" },
        { name: "Cover Letter", href: "/dashboard/ostoracv/cover-letter" },
      ],
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: "Payments",
      href: "/dashboard/settings/payments",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } border-r border-gray-200 bg-white flex flex-col transition-all duration-300`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!isCollapsed && (
          <OstoraLogo
            href="/dashboard"
            textClassName="text-xl font-bold text-black"
            containerClassName="flex items-center gap-2"
            iconWrapperClassName="grid h-8 w-8 place-items-center rounded-button bg-black"
            imageClassName="h-5 w-5 object-contain"
          />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-button hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.children?.length) {
            const parentActive = item.children.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));

            if (isCollapsed) {
              return (
                <Link
                  key={item.name}
                  href={item.children[0].href}
                  className={`flex items-center justify-center px-3 py-2.5 rounded-button transition-all duration-200 group relative ${
                    parentActive
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  <span>{item.icon}</span>
                  <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded-button opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                </Link>
              );
            }

            return (
              <div key={item.name} className="space-y-1">
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-button transition-all duration-200 ${
                    parentActive ? "bg-black text-white" : "text-gray-700 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>{item.icon}</span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25L12 15.75 4.5 8.25" />
                  </svg>
                </div>
                <div className="ml-4 space-y-1 border-l border-gray-200 pl-3">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block rounded-button px-3 py-2 text-sm transition-colors ${
                          childActive
                            ? "bg-black text-white"
                            : "text-gray-600 hover:bg-gray-100 hover:text-black"
                        }`}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center ${
                isCollapsed ? "justify-center" : "justify-between"
              } px-3 py-2.5 rounded-button transition-all duration-200 group relative ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span>{item.icon}</span>
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
              </div>
              {!isCollapsed && item.badge ? (
                <span className="px-2 py-0.5 text-xs font-semibold bg-black text-white rounded-full">
                  {item.badge}
                </span>
              ) : null}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded-button opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
