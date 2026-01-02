"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

type ComingSoonProps = {
  title: string;
  description?: string;
};

export default function ComingSoon({ title, description }: ComingSoonProps) {
  const { isDark } = useTheme();

  const pageBackground = isDark
    ? "bg-[radial-gradient(circle_at_20%_20%,#2f184d_0%,#130c26_45%,#05030d_100%)] text-[#f4edff]"
    : "bg-gradient-to-br from-[#fdf3e8] via-[#f8e7ff] to-[#ffe4d1] text-slate-900";
  const textMuted = isDark ? "text-[#cbb8f5]" : "text-slate-500";
  const buttonStyle = isDark
    ? "border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff] shadow-sm shadow-[#8f63ff]/30 hover:border-[#9b65ff] hover:shadow-[#8f63ff]/40"
    : "border-amber-200 bg-white/90 text-amber-800 shadow-sm hover:border-amber-300";

  return (
    <main className={`flex min-h-screen items-center justify-center px-6 py-12 transition-colors duration-300 ${pageBackground}`}>
      <div className="max-w-xl space-y-4 text-center">
        <p className={`text-xs uppercase tracking-[0.18em] ${textMuted}`}>{title}</p>
        <h1 className="text-3xl font-semibold">Coming soon</h1>
        <p className={`text-sm ${textMuted}`}>
          {description ?? "We're building this experience. Check back shortly."}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${buttonStyle}`}
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

