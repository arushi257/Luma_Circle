"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, type NavKey } from "./NavSidebar";
import { useTheme } from "@/context/ThemeContext";

type PersistedSession = {
  stage: "email" | "otp" | "dashboard";
  email: string;
  userRole: "member" | "admin" | null;
};

const SESSION_KEY = "lc-session";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();

  const [navCollapsed, setNavCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"member" | "admin" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as PersistedSession;
      if (parsed.stage === "dashboard") {
        setIsLoggedIn(true);
        setUserRole(parsed.userRole);
      }
    } catch {
      // ignore
    }
  }, []);

  const currentNavKey: NavKey = useMemo(() => {
    if (pathname.startsWith("/safe-space")) return "safe-space";
    if (pathname.startsWith("/teams")) return "teams";
    if (pathname.startsWith("/mentormesh")) return "mentormesh";
    if (pathname.startsWith("/lab-hub")) return "lab-hub";
    if (pathname.startsWith("/career-tools/sentinel")) return "career-tools-sentinel";
    if (pathname.startsWith("/career-tools/salary")) return "career-tools-salary";
    if (pathname.startsWith("/career-tools/resume")) return "career-tools-resume";
    if (pathname.startsWith("/career-tools")) return "career-tools";
    if (pathname.startsWith("/profile")) return "profile";
    return "dashboard";
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
    setUserRole(null);
    router.push("/");
    router.refresh();
  };

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const pageBackground = isDark
    ? "bg-[radial-gradient(circle_at_20%_20%,#2f184d_0%,#130c26_45%,#05030d_100%)] text-[#f4edff]"
    : "bg-gradient-to-br from-[#fdf3e8] via-[#f8e7ff] to-[#ffe4d1] text-slate-900";

  const sidebarBg = isDark
    ? "bg-[rgba(20,12,34,0.95)] border-r border-[#9b65ff]/20"
    : "bg-white/95 border-r border-amber-100";

  const textMuted = isDark ? "text-[#cbb8f5]" : "text-slate-500";
  const pillBadge = isDark
    ? "border-[#9b65ff]/40 bg-[#1f1433]/90 text-[#f5e6ff]"
    : "border-amber-200 bg-white/90 text-amber-700";

  return (
    <div className={`flex min-h-screen ${pageBackground}`}>
      {/* Sidebar - fixed left column */}
      {isLoggedIn && (
        <aside
          className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${sidebarBg} ${
            navCollapsed ? "w-16" : "w-64"
          }`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between gap-2 p-4 border-b border-inherit">
            {!navCollapsed && (
              <h2
                className={`text-sm font-bold uppercase tracking-[0.18em] ${
                  isDark ? "text-[#f6d47c]" : "text-amber-700"
                }`}
              >
                LumaCircle
              </h2>
            )}
            <button
              type="button"
              onClick={() => setNavCollapsed((prev) => !prev)}
              aria-expanded={!navCollapsed}
              className={`rounded-full border px-2 py-1 text-xs font-semibold transition ${
                isDark
                  ? "border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff] hover:border-[#9b65ff]"
                  : "border-amber-200 bg-white text-amber-800 hover:border-amber-300"
              }`}
              title={navCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {navCollapsed ? "»" : "«"}
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className={`space-y-1 ${navCollapsed ? "px-2" : "px-3"}`}>
              {NAV_ITEMS.map((item) => {
                const active = currentNavKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavigate(item.href)}
                    className={`w-full text-left rounded-xl py-2.5 font-medium transition ${
                      isDark
                        ? "hover:bg-[#1f1433]/80 text-[#f4edff]"
                        : "hover:bg-amber-50 text-slate-900"
                    } ${navCollapsed ? "px-2 text-center text-xs" : "px-3 text-sm"} ${
                      item.indented && !navCollapsed ? "pl-6 text-xs" : ""
                    } ${
                      active
                        ? isDark
                          ? "bg-[#1f1433] border border-[#9b65ff]/40"
                          : "bg-amber-50 border border-amber-200"
                        : "border border-transparent"
                    }`}
                    title={navCollapsed ? item.label : undefined}
                  >
                    {navCollapsed ? "•" : item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar footer */}
          <div className={`p-4 border-t border-inherit ${navCollapsed ? "px-2" : ""}`}>
            {!navCollapsed && userRole && (
              <div
                className={`mb-3 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${pillBadge}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isDark ? "bg-[#9b65ff]" : "bg-amber-500"}`}
                />
                {userRole === "admin" ? "Admin" : "Member"}
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full rounded-xl py-2 text-xs font-semibold transition ${
                isDark
                  ? "border border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff] hover:border-[#9b65ff]"
                  : "border border-amber-200 bg-white text-amber-800 hover:border-amber-300"
              } ${navCollapsed ? "px-2" : "px-3"}`}
              title={navCollapsed ? "Log out" : undefined}
            >
              {navCollapsed ? "⏻" : "Log out"}
            </button>
          </div>
        </aside>
      )}

      {/* Main content area */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          isLoggedIn ? (navCollapsed ? "ml-16" : "ml-64") : ""
        }`}
      >
        {/* Theme toggle - top right */}
        <div className="fixed top-4 right-6 z-50">
          <button
            type="button"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            onClick={toggleTheme}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition shadow-lg ${
              isDark
                ? "border-[#9b65ff]/40 bg-[#1f1433]/90 text-[#f5e6ff]"
                : "border-amber-200 bg-white/95 text-amber-800"
            }`}
          >
            <span
              className={`relative flex h-5 w-10 items-center rounded-full transition ${
                isDark
                  ? "bg-gradient-to-r from-[#8f63ff] via-[#e08dfd] to-[#f6d47c]"
                  : "bg-amber-100"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${
                  isDark ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </span>
            <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}

