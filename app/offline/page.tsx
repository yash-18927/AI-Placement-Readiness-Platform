"use client";

import { useEffect, useState } from "react";

export default function OfflinePage() {
  const [isDark, setIsDark] = useState<boolean>(false);

  // Set theme from localStorage on load
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const root = window.document.documentElement;
    if (storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      root.classList.add("dark");
    } else {
      setIsDark(false);
      root.classList.add("light");
    }
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
      isDark ? "bg-[#202124] text-[#e8eaed]" : "bg-[#f8f9fa] text-[#3c4043]"
    } font-sans`}>
      
      {/* Top Navbar */}
      <header className={`border-b no-print ${
        isDark ? "border-[#3c4043] bg-[#202124]/90" : "border-[#dadce0] bg-white/90 shadow-sm"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Desktop Brand Logo Monogram: left-aligned only on desktop */}
            <svg viewBox="0 0 100 100" className={`w-8 h-8 shrink-0 hidden md:block ${
              isDark ? "stroke-white" : "stroke-[#202124]"
            }`} fill="none" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M46 16 L20 78" />
              <path d="M46 16 L65 72" />
              <path d="M33 52 L57 52" />
              <path d="M57 52 L57 78" />
              <path d="M48 32 C68 28, 80 38, 77 52 C75 64, 66 68, 57 52" />
            </svg>
            <span className={`text-[13px] sm:text-md font-extrabold tracking-tight uppercase ${
              isDark ? "text-white" : "text-[#202124]"
            }`}>
              AI Placement Readiness Platform
            </span>
          </div>

          {/* Mobile Brand Logo Monogram: aligned far-right in mobile view */}
          <svg viewBox="0 0 100 100" className={`w-8 h-8 shrink-0 block md:hidden ${
            isDark ? "stroke-white" : "stroke-[#202124]"
          }`} fill="none" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M46 16 L20 78" />
            <path d="M46 16 L65 72" />
            <path d="M33 52 L57 52" />
            <path d="M57 52 L57 78" />
            <path d="M48 32 C68 28, 80 38, 77 52 C75 64, 66 68, 57 52" />
          </svg>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center gap-8 animate-fade-in">
        
        {/* Offline Graphic */}
        <div className={`w-28 h-28 rounded-full flex items-center justify-center border shadow-sm ${
          isDark ? "bg-[#2d2d30] border-[#3c4043] text-zinc-400" : "bg-white border-[#dadce0] text-zinc-500 shadow-sm"
        }`}>
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        {/* Informative text */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-bold tracking-wider border bg-[#ea4335]/5 dark:bg-[#ea4335]/10 border-[#ea4335]/20 text-[#ea4335] dark:text-[#e57373] mb-3">
            Offline Shell Loaded
          </span>
          <h1 className={`text-2xl font-bold tracking-tight mb-2.5 ${isDark ? "text-white" : "text-[#202124]"}`}>
            Network Connection Lost
          </h1>
          <p className={`text-xs leading-relaxed max-w-sm ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
            The Placement Readiness engine has cached your local application framework, but running fresh resume audits and compiling GitHub footprints requires a live network connection.
          </p>
        </div>

        {/* Retry Trigger Button */}
        <button
          onClick={handleRetry}
          className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-full transition shadow-sm active:scale-95 flex items-center gap-2"
        >
          <span>🔄</span> Attempt Reconnection
        </button>
      </main>

      {/* Footer */}
      <footer className={`border-t ${
        isDark ? "border-[#3c4043] bg-[#202124] text-zinc-500" : "border-[#dadce0] bg-[#f8f9fa] text-[#5f6368]"
      } py-6 text-center text-xs`}>
        <p>© {new Date().getFullYear()} AI Placement Readiness Platform. Offline Fallback Hub.</p>
      </footer>
    </div>
  );
}
