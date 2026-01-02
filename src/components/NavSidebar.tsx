"use client";

import { useMemo } from "react";

export type NavKey =
  | "dashboard"
  | "safe-space"
  | "teams"
  | "mentormesh"
  | "lab-hub"
  | "career-tools"
  | "career-tools-resume"
  | "career-tools-salary"
  | "career-tools-sentinel"
  | "profile";

export type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  indented?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard (Home)", href: "/" },
  { key: "safe-space", label: "Community (Chat)", href: "/safe-space" },
  { key: "teams", label: "• Team Match", indented: true, href: "/safe-space?section=team-match" },
  { key: "mentormesh", label: "• MentorMesh", indented: true, href: "/safe-space?section=mentor-mesh" },
  { key: "lab-hub", label: "• Lab Hub", indented: true, href: "/safe-space?section=lab-hub" },
  { key: "career-tools", label: "Career Tools", href: "/career-tools" },
  { key: "career-tools-resume", label: "• Resume Enhancer", indented: true, href: "/career-tools/resume" },
  { key: "career-tools-salary", label: "• Market Value Predictor", indented: true, href: "/career-tools/salary" },
  { key: "career-tools-sentinel", label: "• SentinelMirror", indented: true, href: "/career-tools/sentinel" },
  { key: "profile", label: "Profile & Settings", href: "/profile" },
];

export function NavSidebar({
  current,
  collapsed,
  onToggle,
  onNavigate,
  onLogout,
  isDark = true,
  className,
}: {
  current: NavKey;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: (href: string, key: NavKey) => void;
  onLogout?: () => void;
  isDark?: boolean;
  className?: string;
}) {
  const navClasses = useMemo(
    () =>
      `rounded-2xl border transition-all duration-300 ${
        isDark
          ? "border-[#9b65ff]/20 bg-[rgba(20,12,34,0.72)] shadow-lg shadow-[#8f63ff]/15"
          : "border-amber-100 bg-white/90 shadow-lg shadow-amber-100/40"
      } ${className ?? ""}`,
    [className, isDark],
  );

  return (
    <aside className={navClasses}>
      <div className="flex items-center justify-between gap-2 p-5 pb-3">
        {!collapsed && (
          <h3
            className={`text-sm font-semibold uppercase tracking-[0.2em] ${
              isDark ? "text-[#cbb8f5]" : "text-amber-700"
            }`}
          >
            Navigation
          </h3>
        )}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
              isDark
                ? "border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff]"
                : "border-amber-200 bg-white text-amber-800"
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>
      </div>

      <div className={`mt-1 space-y-1.5 ${collapsed ? "px-3 pb-3" : "px-5 pb-5"}`}>
        {NAV_ITEMS.map((item) => {
          const active = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.href, item.key)}
              className={`w-full text-left rounded-xl py-2 text-sm font-semibold transition ${
                isDark ? "hover:bg-[#1f1433]/80 text-[#f4edff]" : "hover:bg-amber-50 text-slate-900"
              } ${collapsed ? "px-2 text-center" : "px-3"} ${
                item.indented && !collapsed ? "pl-6 text-xs" : collapsed ? "text-xs" : ""
              } ${active ? (isDark ? "bg-[#1f1433]/80 border border-[#9b65ff]/30" : "bg-amber-50 border border-amber-100") : "border border-transparent"}`}
            >
              {collapsed ? "•" : item.label}
            </button>
          );
        })}
      </div>

      {!collapsed && onLogout && (
        <div className="px-5 pb-5">
          <button
            onClick={onLogout}
            className={`mt-4 w-full rounded-xl px-3 py-2 text-xs font-semibold transition ${
              isDark
                ? "border border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff] hover:border-[#9b65ff]"
                : "border border-amber-200 bg-white text-amber-800 hover:border-amber-300"
            }`}
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}

