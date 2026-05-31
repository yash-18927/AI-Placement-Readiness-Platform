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
  targetRole?: string; // Optional target role if parsed
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

  // Load theme preference and analysis data from localStorage on mount
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

  // Dynamic Interview Question Generator
  const getInterviewQuestions = (role: string, gaps: string[]) => {
    const defaultQuestions = {
      "AI/ML Intern": [
        { q: "Explain the mathematical difference between L1 and L2 regularization. How do they affect sparsity of weights?", category: "Machine Learning Theory" },
        { q: "What is gradient vanishing in deep neural networks, and how do architectures like ResNet mitigate this?", category: "Deep Neural Networks" },
        { q: "How do you evaluate model accuracy under highly imbalanced datasets? Contrast Precision, Recall, and F1.", category: "Model Evaluation" }
      ],
      "Software Engineer Intern": [
        { q: "Explain the time and space complexity of sorting algorithms you typically use. In what cases is QuickSort preferred over MergeSort?", category: "Algorithms & Complexity" },
        { q: "What is the difference between a process and a thread? Explain standard synchronization primitives like Semaphores.", category: "Systems Concurrency" },
        { q: "Describe a real-world scenario where a relational SQL database is preferred over a non-relational NoSQL model.", category: "Systems & Architecture" }
      ],
      "Data Analyst Intern": [
        { q: "What is the difference between an INNER JOIN, LEFT JOIN, and FULL OUTER JOIN in SQL? Give a query example.", category: "Relational Queries" },
        { q: "Explain what a p-value represents in statistics. How would you explain statistical significance to a non-technical stakeholder?", category: "Applied Statistics" },
        { q: "How do you handle severe outliers or missing records in a raw dataset before drawing analytical conclusions?", category: "Data Wrangling" }
      ],
      "Full Stack Intern": [
        { q: "Contrast Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG) in React.", category: "Frontend Architectures" },
        { q: "What is CORS (Cross-Origin Resource Sharing)? How does the browser enforce preflight checks, and how do you resolve it?", category: "Web Standards" },
        { q: "How do database indexes improve query speeds? What write-performance trade-offs do they introduce?", category: "Database Indexing" }
      ]
    };

    const targetKey = (role || "Software Engineer Intern") as keyof typeof defaultQuestions;
    const list = defaultQuestions[targetKey] || defaultQuestions["Software Engineer Intern"];

    if (gaps && gaps.length > 0) {
      return [
        ...list,
        { q: `I notice from your profile analysis that you are working on expanding your skills in '${gaps[0]}'. How would you design a simple personal project to demonstrate hands-on execution using this technology?`, category: "Targeted Skills Verification" }
      ];
    }

    return [
      ...list,
      { q: "Walk me through the most complex technical bug you faced in a recent codebase. How did you diagnose and resolve it?", category: "Problem Solving" }
    ];
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-[#0f0f13]" : "bg-zinc-50"
      }`}>
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-violet-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className={`text-xs font-semibold ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Compiling placement evaluation reports...
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
        <div className="w-14 h-14 rounded-full bg-red-950/20 border border-red-800/40 flex items-center justify-center mb-4 text-xl">
          ⚠️
        </div>
        <h2 className={`text-xl font-bold mb-1.5 ${isDark ? "text-white" : "text-zinc-900"}`}>
          Evaluation Record Expired
        </h2>
        <p className={`max-w-xs mb-6 text-xs leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-650"}`}>
          No analysis result was found for this session identifier. Run a fresh assessment from the home terminal.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  const score = data.readiness_score;
  const inferredRole = data.targetRole || "Software Engineer Intern";

  let scoreColor = "#10b981"; // green (70+)
  let scoreBg = "bg-emerald-500/10";
  let scoreBorder = "border-emerald-500/20";
  let scoreText = "text-emerald-400";

  if (score < 40) {
    scoreColor = "#ef4444"; // red
    scoreBg = "bg-red-500/10";
    scoreBorder = "border-red-500/20";
    scoreText = "text-red-400";
  } else if (score < 70) {
    scoreColor = "#f59e0b"; // amber
    scoreBg = "bg-amber-500/10";
    scoreBorder = "border-amber-500/20";
    scoreText = "text-amber-400";
  }

  // Circular progress calculations: radius=42, circumference = 2 * PI * 42 = 263.89
  const circ = 263.89;
  const strokeOffset = circ - (circ * score) / 100;

  // Recharts target data
  const chartData = [
    { name: "Your score", score: score, fill: scoreColor },
    { name: "Recruiter standard", score: 80, fill: "#6366f1" },
  ];

  // Dynamic interview questions
  const computedQuestions = getInterviewQuestions(inferredRole, data.missing_critical_skills);

  return (
    <div className={`relative min-h-screen flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
      isDark ? "bg-[#0f0f13] text-zinc-150 font-sans" : "bg-[#fcfcfe] text-zinc-800 font-sans"
    }`}>
      {/* Decorative Orbs */}
      {isDark && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-[10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none animate-pulse" />
        </>
      )}

      {/* Top Navbar */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-lg transition-colors no-print ${
        isDark ? "border-zinc-800/80 bg-zinc-950/60" : "border-zinc-200/80 bg-white/70 shadow-sm"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-violet-500/20">
              AI
            </div>
            <span className={`text-md md:text-lg font-extrabold tracking-tight ${
              isDark ? "bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent" : "text-zinc-900"
            }`}>
              AI Placement Readiness Platform
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors border ${
                isDark
                  ? "bg-zinc-900/60 border-zinc-800 text-amber-400 hover:bg-zinc-800"
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

            {/* Print Trigger */}
            <button
              onClick={handlePrint}
              className={`text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg border transition ${
                isDark
                  ? "bg-violet-600/10 border-violet-500/20 text-violet-400 hover:bg-violet-600 hover:text-white"
                  : "bg-violet-50 border-violet-200 text-violet-650 hover:bg-violet-600 hover:text-white"
              }`}
            >
              🖨 Print
            </button>

            {/* Back Home */}
            <button
              onClick={() => router.push("/")}
              className={`text-xs font-semibold px-4 py-2.5 rounded-lg border transition ${
                isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-zinc-300" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-sm"
              }`}
            >
              ← Terminals
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* EXECUTIVE INTRO HEADER BLOCK */}
        <section className={`border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 print-card ${
          isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        }`}>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold tracking-widest uppercase border bg-violet-600/10 border-violet-500/35 text-violet-400 mb-3">
              Recruitment Screening telemetry
            </span>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-zinc-950"}`}>
              Placement Readiness Scorecard
            </h1>
            <p className={`text-xs mt-1.5 max-w-xl leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              Calculated for the targeted profile **{inferredRole}**. Formulated by weighing critical framework requirements against public active repository footprints.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={handlePrint}
              className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-98 transition-all flex items-center gap-2 no-print"
            >
              📥 Download PDF Report
            </button>
          </div>
        </section>

        {/* SECTION 1: OVERALL READINESS SCORE METRIC */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Circular progress */}
          <div className={`lg:col-span-4 border rounded-2xl p-6 flex flex-col items-center justify-center print-card ${
            isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          }`}>
            <h3 className={`text-xs font-extrabold uppercase tracking-widest mb-6 ${isDark ? "text-zinc-450" : "text-zinc-500"}`}>
              Assessment score
            </h3>
            
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="42"
                  stroke={isDark ? "#1f1f23" : "#e4e4e7"}
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="42"
                  stroke={scoreColor}
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={circ}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${isDark ? "text-white" : "text-zinc-900"}`}>{score}</span>
                <span className={`text-[8px] tracking-wider font-extrabold uppercase ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
                  INDEX
                </span>
              </div>
            </div>

            <span className={`mt-5 px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase border ${scoreBg} ${scoreBorder} ${scoreText}`}>
              {data.readiness_label}
            </span>
          </div>

          {/* Right panel: Executive Insights */}
          <div className={`lg:col-span-8 border rounded-2xl p-6 md:p-8 flex flex-col gap-6 print-card ${
            isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          }`}>
            <h3 className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? "text-zinc-400" : "text-zinc-550"}`}>
              Executive Screening highlights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400 mb-1.5">
                  📄 Resume Evaluation
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-650"}`}>
                  {data.resume_summary}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400 mb-1.5">
                  💻 GitHub active footprints
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-650"}`}>
                  {data.github_summary}
                </p>
              </div>
            </div>

            <div className={`border-t pt-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-[10px] leading-relaxed italic ${
              isDark ? "border-zinc-850 text-zinc-450" : "border-zinc-150 text-zinc-500"
            }`}>
              <span>Verified under Gemini 2.5 Flash analysis pipelines</span>
              <span>Compiled: {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: SKILL GAP & HISTOGRAM COMPARISON */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Have vs Need */}
          <div className={`lg:col-span-7 border rounded-2xl p-6 flex flex-col justify-between print-card ${
            isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          }`}>
            <div>
              <h3 className={`text-xs font-extrabold uppercase tracking-widest mb-5 ${isDark ? "text-zinc-450" : "text-zinc-550"}`}>
                Skill Vector Gaps
              </h3>

              <div className="space-y-4">
                <div className={`border rounded-xl p-4 ${isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-zinc-50 border-zinc-150"}`}>
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span>✓</span> Verified Capabilities
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {data.matched_skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-400"
                      >
                        {sk}
                      </span>
                    ))}
                    {data.matched_skills.length === 0 && (
                      <span className="text-[10px] text-zinc-500 italic">No matching keywords isolated.</span>
                    )}
                  </div>
                </div>

                <div className={`border rounded-xl p-4 ${isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-zinc-50 border-zinc-150"}`}>
                  <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span>⚠️</span> Deficient Targets
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {data.missing_critical_skills.map((sk, idx) => (
                      <span
                        key={`crit-${idx}`}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded bg-red-500/10 border border-red-500/15 text-red-400"
                      >
                        {sk} (Must-Have)
                      </span>
                    ))}
                    {data.missing_nice_to_have.map((sk, idx) => (
                      <span
                        key={`nice-${idx}`}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400"
                      >
                        {sk} (Nice-To-Have)
                      </span>
                    ))}
                    {data.missing_critical_skills.length === 0 && data.missing_nice_to_have.length === 0 && (
                      <span className="text-[10px] text-zinc-500 italic">Zero skill gaps discovered. Fully aligned.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className={`text-[10px] italic mt-4 ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
              * Deficient targets should remain focus areas inside priority suggestion logs.
            </p>
          </div>

          {/* Right panel: Recharts Histogram */}
          <div className={`lg:col-span-5 border rounded-2xl p-6 flex flex-col justify-between print-card ${
            isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          }`}>
            <div>
              <h3 className={`text-xs font-extrabold uppercase tracking-widest mb-5 ${isDark ? "text-zinc-450" : "text-zinc-550"}`}>
                Recruiter Baseline Index
              </h3>
              
              <div className="w-full h-40">
                {isClient ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 100]} stroke={isDark ? "#3f3f46" : "#a1a1aa"} style={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" stroke={isDark ? "#3f3f46" : "#a1a1aa"} width={80} style={{ fontSize: 9 }} />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{
                          backgroundColor: isDark ? "#18181b" : "#ffffff",
                          borderColor: isDark ? "#27272a" : "#e4e4e7",
                          borderRadius: "8px",
                          fontSize: 11,
                          color: isDark ? "#f3f4f6" : "#09090b",
                        }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-[10px]">
                    Constructing metric indexes...
                  </div>
                )}
              </div>
            </div>

            <p className={`text-[10px] leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
              Standard recruitment benchmark sits at **80 points**. Scores lower than 70 points indicate gaps requiring mitigation prior to hiring screens.
            </p>
          </div>
        </section>

        {/* SECTION 3: STRENGTHS & WEAKNESSES */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths Card */}
          <div className={`border rounded-2xl p-6 print-card ${
            isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          }`}>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-1.5">
              <span>🚀</span> Competitive Strengths
            </h3>
            <ul className="space-y-3.5">
              {data.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold shrink-0 text-xs">•</span>
                  <span className={`text-xs leading-relaxed ${isDark ? "text-zinc-350" : "text-zinc-700"}`}>{str}</span>
                </li>
              ))}
              {data.strengths.length === 0 && (
                <li className="text-xs text-zinc-500 italic">No specific strengths isolated.</li>
              )}
            </ul>
          </div>

          {/* Weaknesses Card */}
          <div className={`border rounded-2xl p-6 print-card ${
            isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          }`}>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-400 mb-4 flex items-center gap-1.5">
              <span>⚠️</span> Deficit Checkpoints
            </h3>
            <ul className="space-y-3.5">
              {data.weaknesses.map((weak, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0 text-xs">•</span>
                  <span className={`text-xs leading-relaxed ${isDark ? "text-zinc-350" : "text-zinc-700"}`}>{weak}</span>
                </li>
              ))}
              {data.weaknesses.length === 0 && (
                <li className="text-xs text-zinc-500 italic">No structural weaknesses reported.</li>
              )}
            </ul>
          </div>
        </section>

        {/* SECTION 4: PRIORITY MITIGATION RECOMMENDATIONS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.top_3_priorities.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className={`border rounded-2xl p-6 flex flex-col justify-between print-card ${
                isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
              }`}
            >
              <div>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black mb-4 ${
                  isDark ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "bg-violet-50 text-violet-600 border border-violet-100"
                }`}>
                  0{idx + 1}
                </span>
                <h3 className={`text-md font-bold mb-2 ${isDark ? "text-white" : "text-zinc-900"}`}>{item.skill}</h3>
                <p className={`text-xs leading-relaxed mb-6 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {item.reason}
                </p>
              </div>

              <div className={`pt-3.5 border-t text-[10px] flex items-center gap-1.5 font-mono ${
                isDark ? "border-zinc-850 text-violet-400" : "border-zinc-150 text-violet-600"
              }`}>
                <span className="font-bold uppercase tracking-wider shrink-0 text-zinc-500">Resource:</span>
                <span className="truncate" title={item.resource}>{item.resource}</span>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 5: LEARNING ROADMAP (SCREEN TABS & PRINT LISTING) */}
        <section className={`border rounded-2xl p-6 md:p-8 print-card ${
          isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        }`}>
          <h2 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-zinc-950"}`}>
            <span className="text-violet-500">03</span> Learning & Skill Mitigation Roadmap
          </h2>

          {/* Tab buttons - Hidden in Print */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 border-b pb-4 border-zinc-800/20 no-print">
            <button
              onClick={() => setActiveRoadmapTab("week_1_2")}
              className={`py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "week_1_2"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                  : isDark
                  ? "bg-zinc-950/20 text-zinc-500 border border-zinc-850 hover:text-zinc-300"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:text-zinc-700"
              }`}
            >
              Weeks 1-2
            </button>
            <button
              onClick={() => setActiveRoadmapTab("month_1")}
              className={`py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "month_1"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                  : isDark
                  ? "bg-zinc-950/20 text-zinc-500 border border-zinc-850 hover:text-zinc-300"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:text-zinc-700"
              }`}
            >
              Month 1
            </button>
            <button
              onClick={() => setActiveRoadmapTab("month_2")}
              className={`py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "month_2"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                  : isDark
                  ? "bg-zinc-950/20 text-zinc-500 border border-zinc-850 hover:text-zinc-300"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:text-zinc-700"
              }`}
            >
              Month 2
            </button>
            <button
              onClick={() => setActiveRoadmapTab("month_3")}
              className={`py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "month_3"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                  : isDark
                  ? "bg-zinc-950/20 text-zinc-500 border border-zinc-850 hover:text-zinc-300"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:text-zinc-700"
              }`}
            >
              Month 3
            </button>
          </div>

          {/* Dashboard Tab Content - Rendered for screen */}
          <div className="no-print">
            <div className={`border rounded-xl p-5 md:p-6 transition-all duration-300 ${
              isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-zinc-50 border-zinc-150"
            }`}>
              {activeRoadmapTab === "week_1_2" && data.roadmap.week_1_2 && (
                <div>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b ${isDark ? "border-zinc-850" : "border-zinc-200"}`}>
                    <div>
                      <span className={`text-[9px] tracking-widest font-extrabold uppercase block ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
                        Initial onboarding block
                      </span>
                      <h3 className={`text-md font-bold mt-0.5 ${isDark ? "text-white" : "text-zinc-950"}`}>
                        {data.roadmap.week_1_2.focus}
                      </h3>
                    </div>
                    <div className="bg-violet-500/15 border border-violet-500/20 text-violet-400 text-[10px] font-bold py-1.5 px-3 rounded shrink-0 w-fit">
                      ⏰ {data.roadmap.week_1_2.hours_per_day} hours/day targeted
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.roadmap.week_1_2.tasks.map((task, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-zinc-705"}`}>
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
                      <span className={`text-[9px] tracking-widest font-extrabold uppercase block ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
                        Milestone cycle 01
                      </span>
                      <h3 className={`text-md font-bold mt-0.5 ${isDark ? "text-white" : "text-zinc-950"}`}>
                        {data.roadmap.month_1.focus}
                      </h3>
                    </div>
                    <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold py-1.5 px-3 rounded shrink-0 w-fit">
                      🎯 Milestone: {data.roadmap.month_1.milestone}
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.roadmap.month_1.tasks.map((task, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-zinc-705"}`}>
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
                      <span className={`text-[9px] tracking-widest font-extrabold uppercase block ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
                        Milestone cycle 02
                      </span>
                      <h3 className={`text-md font-bold mt-0.5 ${isDark ? "text-white" : "text-zinc-950"}`}>
                        {data.roadmap.month_2.focus}
                      </h3>
                    </div>
                    <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold py-1.5 px-3 rounded shrink-0 w-fit">
                      🎯 Milestone: {data.roadmap.month_2.milestone}
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.roadmap.month_2.tasks.map((task, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-zinc-705"}`}>
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
                      <span className={`text-[9px] tracking-widest font-extrabold uppercase block ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
                        Milestone cycle 03
                      </span>
                      <h3 className={`text-md font-bold mt-0.5 ${isDark ? "text-white" : "text-zinc-950"}`}>
                        {data.roadmap.month_3.focus}
                      </h3>
                    </div>
                    <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold py-1.5 px-3 rounded shrink-0 w-fit">
                      🎯 Milestone: {data.roadmap.month_3.milestone}
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.roadmap.month_3.tasks.map((task, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-zinc-705"}`}>
                        <span className="text-violet-500 mt-1 shrink-0">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sequential layout - Rendered for dynamic PDF layout printing */}
          <div className="hidden roadmap-print-all space-y-6">
            <div className="roadmap-tab-panel">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Weeks 1-2 Focus: {data.roadmap.week_1_2?.focus}</h4>
              <ul className="space-y-2">
                {data.roadmap.week_1_2?.tasks.map((t, idx) => (
                  <li key={idx} className="text-xs">• {t}</li>
                ))}
              </ul>
            </div>
            <div className="roadmap-tab-panel">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Month 1 Focus: {data.roadmap.month_1?.focus}</h4>
              <ul className="space-y-2">
                {data.roadmap.month_1?.tasks.map((t, idx) => (
                  <li key={idx} className="text-xs">• {t}</li>
                ))}
              </ul>
            </div>
            <div className="roadmap-tab-panel">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Month 2 Focus: {data.roadmap.month_2?.focus}</h4>
              <ul className="space-y-2">
                {data.roadmap.month_2?.tasks.map((t, idx) => (
                  <li key={idx} className="text-xs">• {t}</li>
                ))}
              </ul>
            </div>
            <div className="roadmap-tab-panel">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Month 3 Focus: {data.roadmap.month_3?.focus}</h4>
              <ul className="space-y-2">
                {data.roadmap.month_3?.tasks.map((t, idx) => (
                  <li key={idx} className="text-xs">• {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 6: INTERVIEW PREPARATION MODULE (NEWLY IMPLEMENTED) */}
        <section className={`border rounded-2xl p-6 md:p-8 print-card ${
          isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        }`}>
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[9px] font-extrabold tracking-widest uppercase border bg-violet-600/10 border-violet-500/35 text-violet-400 mb-3">
              Recruiter screening simulator
            </span>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-zinc-950"}`}>
              🎯 Recommended Interview Questions
            </h2>
            <p className={`text-xs mt-1.5 ${isDark ? "text-zinc-400" : "text-zinc-550"}`}>
              Custom behavioral and algorithm prompts formed to challenge your specific missing requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {computedQuestions.map((qObj, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-5 flex flex-col justify-between ${
                  isDark ? "bg-zinc-950/25 border-zinc-850" : "bg-zinc-50 border-zinc-150 shadow-sm"
                }`}
              >
                <div className="mb-4">
                  <span className={`text-[8px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-widest ${
                    isDark ? "bg-zinc-900 text-violet-400 border-zinc-800" : "bg-violet-50 text-violet-600 border-violet-100"
                  }`}>
                    {qObj.category}
                  </span>
                  <p className={`text-xs leading-relaxed font-medium mt-3 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                    "{qObj.q}"
                  </p>
                </div>
                <div className={`pt-3 border-t text-[9px] ${isDark ? "border-zinc-850 text-zinc-500" : "border-zinc-200 text-zinc-450"}`}>
                  * Practice constructing a structured STAR-framework response.
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 7: PROJECTS TO BUILD */}
        <section className={`border rounded-2xl p-6 md:p-8 print-card ${
          isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        }`}>
          <h2 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-zinc-950"}`}>
            <span className="text-violet-500">04</span> Recommended Mitigation Projects
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.project_suggestions.slice(0, 3).map((proj, idx) => {
              let diffColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              if (proj.difficulty.toLowerCase() === "medium") {
                diffColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              } else if (proj.difficulty.toLowerCase() === "hard") {
                diffColor = "bg-red-500/10 text-red-400 border-red-500/20";
              }

              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-5 flex flex-col justify-between ${
                    isDark ? "bg-zinc-950/20 border-zinc-800" : "bg-zinc-50 border-zinc-200 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[8px] font-bold border px-2 py-0.5 rounded uppercase tracking-wider ${diffColor}`}>
                        {proj.difficulty}
                      </span>
                      <span className={`${isDark ? "text-zinc-500" : "text-zinc-400"} text-[10px] font-medium`}>
                        ⏱ ~{proj.days_to_build} days
                      </span>
                    </div>

                    <h3 className={`text-xs md:text-sm font-bold mb-2 ${isDark ? "text-white" : "text-zinc-900"}`}>{proj.name}</h3>
                    <p className={`text-[11px] leading-relaxed mb-5 ${isDark ? "text-zinc-400" : "text-zinc-655"}`}>
                      {proj.description}
                    </p>
                  </div>

                  <div className={`pt-3.5 border-t ${isDark ? "border-zinc-850" : "border-zinc-200"}`}>
                    <div className="flex flex-wrap gap-1">
                      {proj.skills_practiced.map((sk, index) => (
                        <span
                          key={index}
                          className={`text-[8px] font-semibold px-2 py-0.5 rounded border ${
                            isDark
                              ? "bg-zinc-900 text-zinc-450 border-zinc-800"
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

        {/* RECRUITER ASSESSMENT EXECUTIVE SUMMARY & ENCOURAGEMENT */}
        <section className={`border rounded-2xl p-6 md:p-8 relative overflow-hidden print-card ${
          isDark
            ? "from-violet-950/15 via-indigo-950/10 to-transparent border-violet-500/20 bg-gradient-to-r"
            : "from-violet-50/50 via-indigo-50/30 to-transparent border-violet-200 bg-gradient-to-r"
        }`}>
          {isDark && <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />}
          <h2 className="text-xs font-bold tracking-widest text-violet-400 uppercase mb-4 animate-pulse">
            Recruiter overall Assessment
          </h2>
          <p className={`text-sm leading-relaxed mb-5 italic ${isDark ? "text-zinc-200" : "text-zinc-700 font-medium"}`}>
            "{data.executive_summary}"
          </p>
          <div className={`rounded-xl border p-4 mb-6 ${
            isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-zinc-50 border-zinc-200"
          }`}>
            <h4 className={`text-[10px] font-bold mb-1 flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              <span>💡</span> Coach's Encouragement
            </h4>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
              {data.encouragement}
            </p>
          </div>

          <div className="flex justify-center gap-4 no-print flex-col sm:flex-row">
            <button
              onClick={() => router.push("/")}
              className={`font-extrabold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 border ${
                isDark
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-950 border-zinc-200"
                  : "bg-zinc-900 hover:bg-zinc-850 text-white border-zinc-800"
              }`}
            >
              🔄 Analyze Another Profile
            </button>
            <button
              onClick={handlePrint}
              className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95"
            >
              📥 Download evaluation PDF
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t transition-colors no-print ${
        isDark ? "border-zinc-900 bg-zinc-950/20 text-zinc-500" : "border-zinc-200 bg-zinc-100 text-zinc-500"
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
            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-805"
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setShowTerms(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg border transition ${
                isDark
                  ? "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800 text-zinc-450"
                  : "border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-650"
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
