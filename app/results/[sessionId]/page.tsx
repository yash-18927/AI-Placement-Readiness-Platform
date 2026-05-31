"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface AnalysisResult {
  readiness_score: number;
  resume_summary: string;
  github_summary: string;
  matched_skills: string[];
  missing_critical_skills: string[];
  missing_nice_to_have: string[];
  strengths: string[];
  weaknesses: string[];
  top_3_priorities: Array<{ skill: string; reason: string; resource: string }>;
  roadmap: {
    week_1_2: { focus: string; tasks: string[]; hours_per_day: number };
    month_1: { focus: string; tasks: string[]; milestone: string };
    month_2: { focus: string; tasks: string[]; milestone: string };
    month_3: { focus: string; tasks: string[]; milestone: string };
  };
  project_suggestions: Array<{
    name: string;
    description: string;
    skills_practiced: string[];
    difficulty: string;
    days_to_build: number;
  }>;
  executive_summary: string;
  encouragement: string;
  readiness_label: "Beginner" | "Developing" | "Ready" | "Strong";
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRoadmapTab, setActiveRoadmapTab] = useState<
    "week_1_2" | "month_1" | "month_2" | "month_3"
  >("week_1_2");
  const [isClient, setIsClient] = useState<boolean>(false);

  // Terms and Conditions Modal State
  const [showTerms, setShowTerms] = useState<boolean>(false);

  // Light / Dark Mode state
  const [isDark, setIsDark] = useState<boolean>(true);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light") {
      setIsDark(false);
    }

    if (!sessionId) return;

    try {
      const stored = localStorage.getItem(`analysis_${sessionId}`);
      if (stored) {
        setData(JSON.parse(stored));
      } else {
        console.warn("No evaluation data found for sessionId:", sessionId);
      }
    } catch (err) {
      console.error("Failed to parse analysis data from localStorage:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Dynamically apply theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.backgroundColor = "#0f0f13";
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.backgroundColor = "#fafafa";
      root.style.colorScheme = "light";
    }
  }, [isDark]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-[#0f0f13]" : "bg-zinc-50"
      }`}>
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-violet-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className={isDark ? "text-zinc-400 text-sm" : "text-zinc-650 text-sm font-medium"}>
            Retrieving profile report...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 ${
        isDark ? "bg-[#0f0f13]" : "bg-zinc-50"
      }`}>
        <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-800/60 flex items-center justify-center mb-4 text-2xl">
          ⚠️
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-zinc-950"}`}>
          Report Not Found
        </h2>
        <p className={`max-w-md mb-6 text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
          No analysis result was found for this session. Please return to the homepage to run a new assessment.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-6 rounded-lg transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  // 1. Core metric definitions
  const score = data.readiness_score;
  let scoreColor = "#22c55e"; // green (70+)
  let scoreBg = "bg-emerald-950/20";
  let scoreBorder = "border-emerald-500/30";
  let scoreText = "text-emerald-400";

  if (score < 40) {
    scoreColor = "#ef4444"; // red
    scoreBg = "bg-red-950/20";
    scoreBorder = "border-red-500/30";
    scoreText = "text-red-400";
  } else if (score < 70) {
    scoreColor = "#f97316"; // orange
    scoreBg = "bg-orange-950/20";
    scoreBorder = "border-orange-500/30";
    scoreText = "text-orange-400";
  }

  // Circular calculations: radius 40, circumference = 2 * PI * 40 = 251.3
  const circ = 251.3;
  const strokeOffset = circ - (circ * score) / 100;

  // Recharts data format
  const chartData = [
    { name: "Your Score", score: score, fill: scoreColor },
    { name: "Target", score: 80, fill: "#7c3aed" },
  ];

  return (
    <div className={`relative min-h-screen flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
      isDark ? "bg-[#0f0f13] text-gray-100" : "bg-zinc-50 text-zinc-900"
    }`}>
      {/* Glow effects */}
      {isDark && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Top Navbar */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors ${
        isDark ? "border-zinc-800/80 bg-zinc-950/40" : "border-zinc-200 bg-white/80"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer animate-fade-in"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
              AI
            </div>
            <span className={`text-lg md:text-xl font-extrabold tracking-tight ${
              isDark ? "bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent" : "text-zinc-900"
            }`}>
              AI Placement Readiness Platform
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors border ${
                isDark
                  ? "bg-zinc-900/60 border-zinc-800 text-amber-400 hover:bg-zinc-850"
                  : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Back Button */}
            <button
              onClick={() => router.push("/")}
              className={`text-xs font-semibold px-4 py-2.5 rounded-lg border transition ${
                isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-700 shadow-sm"
              }`}
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col gap-10">
        
        {/* SECTION 1: Your Readiness Score */}
        <section className={`border rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center shadow-xl transition-colors duration-300 ${
          isDark ? "bg-zinc-900/40 border-zinc-800/80" : "bg-white border-zinc-200 text-zinc-850"
        }`}>
          {/* Circular Score Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                {/* Track circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="40"
                  stroke={isDark ? "#27272a" : "#e4e4e7"}
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Score bar */}
                <circle
                  cx="80"
                  cy="80"
                  r="40"
                  stroke={scoreColor}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circ}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Inner score label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-extrabold ${isDark ? "text-white" : "text-zinc-950"}`}>{score}</span>
                <span className={`text-[10px] tracking-wider font-semibold uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                  SCORE
                </span>
              </div>
            </div>

            {/* Label Badge */}
            <div
              className={`mt-4 px-4 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${scoreBg} ${scoreBorder} ${scoreText}`}
            >
              {data.readiness_label}
            </div>
          </div>

          {/* Summaries */}
          <div className={`md:col-span-2 flex flex-col gap-5 border-l md:pl-8 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
            <div>
              <h3 className={`text-xs font-bold tracking-wider uppercase mb-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                📄 Resume Highlights
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                {data.resume_summary}
              </p>
            </div>
            <div>
              <h3 className={`text-xs font-bold tracking-wider uppercase mb-2 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                💻 GitHub Footprint
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                {data.github_summary}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: Skill Gap Analysis */}
        <section className={`border rounded-2xl p-6 md:p-8 shadow-xl transition-colors duration-300 ${
          isDark ? "bg-zinc-900/40 border-zinc-800/80" : "bg-white border-zinc-200"
        }`}>
          <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-zinc-950"}`}>
            <span className="text-violet-400">02</span> Skill Gap Analysis
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Columns */}
            <div className={`border rounded-xl p-5 ${isDark ? "bg-zinc-950/20 border-zinc-800/50" : "bg-zinc-50 border-zinc-200"}`}>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>✅</span> You Have
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.matched_skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  >
                    {skill}
                  </span>
                ))}
                {data.matched_skills.length === 0 && (
                  <span className="text-xs text-zinc-500 italic">No matched skills identified.</span>
                )}
              </div>
            </div>

            <div className={`border rounded-xl p-5 ${isDark ? "bg-zinc-950/20 border-zinc-800/50" : "bg-zinc-50 border-zinc-200"}`}>
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>❌</span> You Need
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Critical gaps */}
                {data.missing_critical_skills.map((skill, i) => (
                  <span
                    key={`crit-${i}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                    title="Critical gap"
                  >
                    {skill} (Critical)
                  </span>
                ))}
                {/* Nice to have gaps */}
                {data.missing_nice_to_have.map((skill, i) => (
                  <span
                    key={`nice-${i}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400"
                    title="Recommended skill"
                  >
                    {skill}
                  </span>
                ))}
                {data.missing_critical_skills.length === 0 &&
                  data.missing_nice_to_have.length === 0 && (
                    <span className="text-xs text-zinc-500 italic">No outstanding gaps identified.</span>
                  )}
              </div>
            </div>
          </div>

          {/* Recharts BarChart */}
          <div className={`border-t pt-6 ${isDark ? "border-zinc-850" : "border-zinc-200"}`}>
            <h4 className={`text-xs font-bold tracking-wider uppercase mb-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              PLACEMENT READINESS TARGET COMPARISON
            </h4>
            <div className={`w-full h-44 rounded-xl border p-4 ${
              isDark ? "bg-zinc-950/30 border-zinc-850" : "bg-zinc-50 border-zinc-200 shadow-inner"
            }`}>
              {isClient ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  >
                    <XAxis type="number" domain={[0, 100]} stroke={isDark ? "#52525b" : "#71717a"} />
                    <YAxis dataKey="name" type="category" stroke={isDark ? "#52525b" : "#71717a"} width={80} />
                    <Tooltip
                      cursor={{ fill: isDark ? "rgba(124, 58, 237, 0.05)" : "rgba(124, 58, 237, 0.03)" }}
                      contentStyle={{
                        backgroundColor: isDark ? "#18181b" : "#ffffff",
                        borderColor: isDark ? "#27272a" : "#e4e4e7",
                        borderRadius: "8px",
                        color: isDark ? "#f3f4f6" : "#18181b",
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-650 text-xs">
                  Loading performance metrics...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: Your Top 3 Priorities */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.top_3_priorities.slice(0, 3).map((item, i) => (
            <div
              key={i}
              className={`border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-colors duration-300 ${
                isDark ? "bg-zinc-900/40 border-zinc-800/80" : "bg-white border-zinc-200"
              }`}
            >
              <div>
                <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs mb-4 ${
                  isDark ? "bg-violet-600/10 border-violet-500/20 text-violet-400" : "bg-violet-50 border-violet-200 text-violet-600"
                }`}>
                  0{i + 1}
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-zinc-950"}`}>{item.skill}</h3>
                <p className={`text-sm leading-relaxed mb-6 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {item.reason}
                </p>
              </div>
              <div className={`pt-4 border-t flex items-center gap-2 text-xs font-semibold ${
                isDark ? "border-zinc-800/50 text-violet-400" : "border-zinc-150 text-violet-600"
              }`}>
                <span>📚 Resource:</span>
                <span className={`truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`} title={item.resource}>
                  {item.resource}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 4: 3-Month Learning Roadmap */}
        <section className={`border rounded-2xl p-6 md:p-8 shadow-xl transition-colors duration-300 ${
          isDark ? "bg-zinc-900/40 border-zinc-800/80" : "bg-white border-zinc-200"
        }`}>
          <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-zinc-950"}`}>
            <span className="text-violet-400">04</span> 3-Month Learning Roadmap
          </h2>

          {/* Timeline tabs */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 border-b pb-4 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
            <button
              onClick={() => setActiveRoadmapTab("week_1_2")}
              className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "week_1_2"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : isDark
                  ? "bg-zinc-950/20 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:text-zinc-700"
              }`}
            >
              Weeks 1-2
            </button>
            <button
              onClick={() => setActiveRoadmapTab("month_1")}
              className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "month_1"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : isDark
                  ? "bg-zinc-950/20 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:text-zinc-700"
              }`}
            >
              Month 1
            </button>
            <button
              onClick={() => setActiveRoadmapTab("month_2")}
              className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "month_2"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : isDark
                  ? "bg-zinc-950/20 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:text-zinc-700"
              }`}
            >
              Month 2
            </button>
            <button
              onClick={() => setActiveRoadmapTab("month_3")}
              className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "month_3"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : isDark
                  ? "bg-zinc-950/20 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:text-zinc-700"
              }`}
            >
              Month 3
            </button>
          </div>

          {/* Details */}
          <div className={`border rounded-xl p-5 md:p-6 transition-all duration-300 ${
            isDark ? "bg-zinc-950/25 border-zinc-800/60" : "bg-zinc-50 border-zinc-200"
          }`}>
            {activeRoadmapTab === "week_1_2" && data.roadmap.week_1_2 && (
              <div>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b ${isDark ? "border-zinc-850" : "border-zinc-200"}`}>
                  <div>
                    <span className={`text-[10px] tracking-widest font-bold uppercase block ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      CURRENT ACTION PLAN
                    </span>
                    <h3 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-zinc-950"}`}>
                      {data.roadmap.week_1_2.focus}
                    </h3>
                  </div>
                  <div className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold py-1.5 px-3 rounded-lg shrink-0 w-fit">
                    ⏰ {data.roadmap.week_1_2.hours_per_day} hours / day target
                  </div>
                </div>
                <ul className="space-y-3 pl-1">
                  {data.roadmap.week_1_2.tasks.map((task, i) => (
                    <li key={i} className={`text-sm flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-zinc-650"}`}>
                      <span className="text-violet-500 mt-1 shrink-0">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeRoadmapTab === "month_1" && data.roadmap.month_1 && (
              <div>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b ${isDark ? "border-zinc-850" : "border-zinc-200"}`}>
                  <div>
                    <span className={`text-[10px] tracking-widest font-bold uppercase block ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      MONTHLY MILESTONE ONE
                    </span>
                    <h3 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-zinc-950"}`}>
                      {data.roadmap.month_1.focus}
                    </h3>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold py-1.5 px-3 rounded-lg shrink-0 w-fit">
                    🎯 Milestone: {data.roadmap.month_1.milestone}
                  </div>
                </div>
                <ul className="space-y-3 pl-1">
                  {data.roadmap.month_1.tasks.map((task, i) => (
                    <li key={i} className={`text-sm flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-zinc-650"}`}>
                      <span className="text-violet-500 mt-1 shrink-0">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeRoadmapTab === "month_2" && data.roadmap.month_2 && (
              <div>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b ${isDark ? "border-zinc-850" : "border-zinc-200"}`}>
                  <div>
                    <span className={`text-[10px] tracking-widest font-bold uppercase block ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      MONTHLY MILESTONE TWO
                    </span>
                    <h3 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-zinc-950"}`}>
                      {data.roadmap.month_2.focus}
                    </h3>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold py-1.5 px-3 rounded-lg shrink-0 w-fit">
                    🎯 Milestone: {data.roadmap.month_2.milestone}
                  </div>
                </div>
                <ul className="space-y-3 pl-1">
                  {data.roadmap.month_2.tasks.map((task, i) => (
                    <li key={i} className={`text-sm flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-zinc-650"}`}>
                      <span className="text-violet-500 mt-1 shrink-0">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeRoadmapTab === "month_3" && data.roadmap.month_3 && (
              <div>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b ${isDark ? "border-zinc-850" : "border-zinc-200"}`}>
                  <div>
                    <span className={`text-[10px] tracking-widest font-bold uppercase block ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      MONTHLY MILESTONE THREE
                    </span>
                    <h3 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-zinc-950"}`}>
                      {data.roadmap.month_3.focus}
                    </h3>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold py-1.5 px-3 rounded-lg shrink-0 w-fit">
                    🎯 Milestone: {data.roadmap.month_3.milestone}
                  </div>
                </div>
                <ul className="space-y-3 pl-1">
                  {data.roadmap.month_3.tasks.map((task, i) => (
                    <li key={i} className={`text-sm flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-zinc-650"}`}>
                      <span className="text-violet-500 mt-1 shrink-0">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: Projects to Build */}
        <section className={`border rounded-2xl p-6 md:p-8 shadow-xl transition-colors duration-300 ${
          isDark ? "bg-zinc-900/40 border-zinc-800/80" : "bg-white border-zinc-200"
        }`}>
          <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-zinc-950"}`}>
            <span className="text-violet-400">05</span> Recommended Practical Projects
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.project_suggestions.slice(0, 3).map((proj, i) => {
              let diffColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
              if (proj.difficulty.toLowerCase() === "medium") {
                diffColor = "bg-amber-500/10 text-amber-400 border-amber-500/25";
              } else if (proj.difficulty.toLowerCase() === "hard") {
                diffColor = "bg-red-500/10 text-red-400 border-red-500/25";
              }

              return (
                <div
                  key={i}
                  className={`border rounded-xl p-5 flex flex-col justify-between ${
                    isDark ? "bg-zinc-950/20 border-zinc-800/60" : "bg-zinc-50 border-zinc-200 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded uppercase tracking-wider ${diffColor}`}>
                        {proj.difficulty}
                      </span>
                      <span className={`${isDark ? "text-zinc-500" : "text-zinc-400"} text-xs font-medium`}>
                        ⏱ ~{proj.days_to_build} days
                      </span>
                    </div>

                    <h3 className={`text-base font-bold mb-2 ${isDark ? "text-white" : "text-zinc-900"}`}>{proj.name}</h3>
                    <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-zinc-400" : "text-zinc-655"}`}>
                      {proj.description}
                    </p>
                  </div>

                  <div className={`pt-4 border-t ${isDark ? "border-zinc-850" : "border-zinc-200"}`}>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.skills_practiced.map((sk, index) => (
                        <span
                          key={index}
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
                            isDark
                              ? "bg-zinc-900 text-zinc-400 border-zinc-800"
                              : "bg-zinc-200 text-zinc-600 border-zinc-300"
                          }`}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FOOTER: Executive Summary & Action Box */}
        <section className={`border rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden bg-gradient-to-r ${
          isDark
            ? "from-violet-950/15 via-indigo-950/10 to-transparent border-violet-500/20"
            : "from-violet-50/50 via-indigo-50/30 to-transparent border-violet-200"
        }`}>
          {isDark && <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />}
          <h2 className="text-lg font-bold tracking-wide text-violet-400 uppercase mb-4 animate-pulse">
            Recruiter Assessment
          </h2>
          <p className={`text-sm leading-relaxed mb-5 italic ${isDark ? "text-zinc-200" : "text-zinc-700 font-medium"}`}>
            "{data.executive_summary}"
          </p>
          <div className={`rounded-xl border p-4 mb-6 ${
            isDark ? "bg-zinc-950/40 border-zinc-800/50" : "bg-zinc-50 border-zinc-200"
          }`}>
            <h4 className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              <span>💡</span> Coach's Encouragement
            </h4>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
              {data.encouragement}
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => router.push("/")}
              className={`font-extrabold text-sm py-3 px-8 rounded-xl transition-all shadow-md active:scale-95 border ${
                isDark
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950 border-zinc-200"
                  : "bg-zinc-900 hover:bg-zinc-850 text-white border-zinc-800"
              }`}
            >
              🔄 Analyze Another Profile
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t transition-colors ${
        isDark ? "border-zinc-900 bg-zinc-950/20 text-zinc-600" : "border-zinc-200 bg-zinc-100 text-zinc-500"
      } py-6 text-center text-xs mt-10`}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AI Placement Readiness Platform. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTerms(true)}
              className={`hover:underline font-semibold ${
                isDark ? "text-violet-400" : "text-violet-600"
              }`}
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <p>Powered by Gemini 2.5 Flash.</p>
          </div>
        </div>
      </footer>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto ${
            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-800"
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setShowTerms(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg border transition ${
                isDark
                  ? "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800 text-zinc-400"
                  : "border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className={`text-2xl font-extrabold mb-6 ${
              isDark ? "text-white" : "text-zinc-950"
            }`}>
              Terms & Conditions
            </h2>

            <div className={`space-y-4 text-sm leading-relaxed mb-8 ${
              isDark ? "text-zinc-300" : "text-zinc-600"
            }`}>
              <p>
                Welcome to the <strong>AI Placement Readiness Platform</strong>. By uploading your resume and specifying your GitHub profile, you acknowledge and agree to the following terms:
              </p>
              <h3 className="font-bold text-base mt-4 text-violet-400">1. Data Collection & Processing</h3>
              <p>
                Resume data text content is extracted entirely inside your browser client-side. No resume file is uploaded or stored on any server. Raw text payloads and public GitHub data are temporarily transmitted to the Gemini API routes strictly to generate your readiness analysis.
              </p>
              <h3 className="font-bold text-base mt-4 text-violet-400">2. Accuracy of Assessments</h3>
              <p>
                Placements evaluations, score metrics, timelines, milestones, and project recommendations are AI-generated based on specific candidate parameters and public data sets. The assessment functions as a supplementary preparatory guide and does not guarantee job placement or recruiting results.
              </p>
              <h3 className="font-bold text-base mt-4 text-violet-400">3. Usage Terms</h3>
              <p>
                This platform is provided solely for educational, interview preparation, and placement evaluation purposes. Users agree not to abuse the analysis pipelines, input malformed payloads, or reverse-engineer the query aggregation handlers.
              </p>
            </div>

            {/* Developer Mention */}
            <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold ${
              isDark ? "border-zinc-800 text-zinc-400" : "border-zinc-200 text-zinc-500"
            }`}>
              <span>Developed & Maintained by: <strong className="text-violet-500 text-sm font-extrabold">Yash Vardhan Singh</strong></span>
              <button
                onClick={() => setShowTerms(false)}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-6 rounded-xl transition"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
