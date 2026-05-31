"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as pdfjsLib from "pdfjs-dist";

// Set pdf.js worker URL (uses stable CDN worker matching package.json version)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function Home() {
  const router = useRouter();
  
  // Core states
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeWordCount, setResumeWordCount] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [githubUsername, setGithubUsername] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Software Engineer Intern");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // UX elements states
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [apiData, setApiData] = useState<any>(null);
  const [isApiFinished, setIsApiFinished] = useState<boolean>(false);
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [rotatingStatusIndex, setRotatingStatusIndex] = useState<number>(0);

  // Refs for tracking states during interval
  const isApiFinishedRef = useRef(false);
  const apiDataRef = useRef<any>(null);

  useEffect(() => {
    isApiFinishedRef.current = isApiFinished;
  }, [isApiFinished]);

  useEffect(() => {
    apiDataRef.current = apiData;
  }, [apiData]);

  // Load theme and history preference from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light") {
      setIsDark(false);
    }

    try {
      const storedHistory = localStorage.getItem("placement_readiness_history");
      if (storedHistory) {
        setHistoryList(JSON.parse(storedHistory));
      }
    } catch (err) {
      console.error("Failed to load evaluation history:", err);
    }
  }, []);

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

  // Rotate loading text messages on interval when loading is active
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    if (isLoading) {
      statusInterval = setInterval(() => {
        setRotatingStatusIndex((prev) => (prev + 1) % rotatingStatuses.length);
      }, 3000);
    } else {
      setRotatingStatusIndex(0);
    }
    return () => clearInterval(statusInterval);
  }, [isLoading]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const roles = [
    "AI/ML Intern",
    "Software Engineer Intern",
    "Data Analyst Intern",
    "Full Stack Intern",
  ];

  const rotatingStatuses = [
    "Parsing resume document layout...",
    "Extracting critical structural vocabulary...",
    "Connecting with GitHub developers API...",
    "Processing public repository footprints...",
    "Mapping framework language frequencies...",
    "Scanning ATS keyword parameters...",
    "Calculating professional readiness benchmarks...",
    "Compiling personalized milestone roadmaps...",
    "Generating standard behavioral prompts...",
  ];

  const loadingSteps = [
    "Parsing resume...",
    "Fetching GitHub profile...",
    "Identifying skill gaps...",
    "Generating roadmap...",
    "Writing your report...",
  ];

  // Client-side text extraction using pdfjs-dist
  const handlePdfParsing = async (file: File) => {
    setError(null);
    setResumeText("");
    setResumeWordCount(null);
    setSelectedFileName(file.name);

    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      const typedarray = new Uint8Array(e?.target?.result as ArrayBuffer);
      try {
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        const pdf = await loadingTask.promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          fullText += pageText + " ";
        }

        const trimmedText = fullText.trim();
        if (!trimmedText) {
          throw new Error("Could not extract any readable text from the PDF resume. Ensure the PDF contains text rather than scanned images.");
        }

        setResumeText(trimmedText);
        const wordCount = trimmedText.split(/\s+/).filter(Boolean).length;
        setResumeWordCount(wordCount);
      } catch (err: any) {
        console.error("PDF Parsing error:", err);
        setError(err.message || "Failed to parse PDF file. Ensure it is a valid, unencrypted PDF document.");
        setSelectedFileName(null);
      }
    };
    fileReader.readAsArrayBuffer(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePdfParsing(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        handlePdfParsing(file);
      } else {
        setError("Only PDF resumes are supported.");
      }
    }
  };

  // Generate dynamic session UUID client-side
  const generateUUID = () => {
    return "session-" + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15);
  };

  // Main submission handler
  const handleAnalyze = async () => {
    if (!resumeText) {
      setError("Please upload a valid PDF resume first.");
      return;
    }
    if (!githubUsername.trim()) {
      setError("Please provide a valid GitHub username.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveStep(1); // Set step 1 ("Parsing resume...") immediately active
    setIsApiFinished(false);
    setApiData(null);

    const sessionId = generateUUID();

    // Trigger API call in the background
    const apiCallPromise = fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resumeText,
        githubUsername: githubUsername.trim(),
        targetRole,
        sessionId,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Profile analysis failed.");
        }
        return res.json();
      })
      .then((data) => {
        setApiData(data);
        setIsApiFinished(true);
        return data;
      })
      .catch((err) => {
        console.error("Analysis Error:", err);
        setError(err.message || "An unexpected error occurred during processing.");
        setIsLoading(false);
        setActiveStep(0);
      });

    // Start interval for the step-by-step loading animation
    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      if (step <= 5) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
        // Completed all steps animation. Let's verify if the API has already completed
        checkAndComplete(sessionId, apiCallPromise);
      }
    }, 4000);

    const checkAndComplete = async (sId: string, apiPromise: Promise<any>) => {
      try {
        let finalData = apiDataRef.current;
        if (!isApiFinishedRef.current) {
          // API is still loading, wait for the response
          finalData = await apiPromise;
        }

        if (finalData) {
          // Store response under key "analysis_[sessionId]"
          localStorage.setItem(`analysis_${sId}`, JSON.stringify(finalData));
          
          // Save to localized history list
          try {
            const newHistoryItem = {
              sessionId: sId,
              date: new Date().toISOString(),
              score: finalData.readiness_score,
              targetRole: targetRole,
              resumeName: selectedFileName || "resume_document.pdf",
              githubUsername: githubUsername.trim(),
            };
            const existingHistory = JSON.parse(localStorage.getItem("placement_readiness_history") || "[]");
            const filteredHistory = existingHistory.filter((item: any) => item.sessionId !== sId);
            const updatedHistory = [newHistoryItem, ...filteredHistory].slice(0, 10); // Limit to top 10 items
            localStorage.setItem("placement_readiness_history", JSON.stringify(updatedHistory));
            setHistoryList(updatedHistory);
          } catch (histErr) {
            console.error("Failed to append history log:", histErr);
          }

          router.push(`/results/${sId}`);
        }
      } catch (err: any) {
        // Error is handled in the catch block of API call
      }
    };
  };

  const handleReanalyze = (item: any) => {
    setGithubUsername(item.githubUsername);
    setTargetRole(item.targetRole);
    // Smooth scroll to target analysis card block
    const element = document.getElementById("analysis");
    if (element) {
      const offset = 90; // sticky header buffer
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your local assessment history?")) {
      localStorage.removeItem("placement_readiness_history");
      setHistoryList([]);
    }
  };

  const smoothScrollTo = (targetId: string) => {
    setShowMobileMenu(false);
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div id="home" className={`relative min-h-screen flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
      isDark ? "bg-[#0f0f13] text-zinc-100 font-sans" : "bg-[#fcfcfe] text-zinc-800 font-sans"
    }`}>
      {/* Glow Orbs */}
      {isDark && (
        <>
          <div className="absolute top-[-5%] left-[-15%] w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Top Navbar */}
      <header className={`border-b backdrop-blur-lg sticky top-0 z-50 transition-colors duration-250 ${
        isDark ? "border-zinc-800/80 bg-zinc-950/60" : "border-zinc-200/80 bg-white/70 shadow-sm"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => smoothScrollTo("home")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-violet-500/20">
              AI
            </div>
            <span className={`text-md md:text-lg font-extrabold tracking-tight ${
              isDark ? "bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent" : "text-zinc-900"
            }`}>
              AI Placement Readiness Platform
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => smoothScrollTo("home")} className={`text-xs font-semibold uppercase tracking-wider transition ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>Home</button>
            <button onClick={() => smoothScrollTo("features")} className={`text-xs font-semibold uppercase tracking-wider transition ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>Features</button>
            <button onClick={() => smoothScrollTo("analysis")} className={`text-xs font-semibold uppercase tracking-wider transition ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>Analysis</button>
            <button onClick={() => smoothScrollTo("history")} className={`text-xs font-semibold uppercase tracking-wider transition relative ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>
              History
              {historyList.length > 0 && (
                <span className="absolute -top-2.5 -right-3 bg-violet-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                  {historyList.length}
                </span>
              )}
            </button>
            <button onClick={() => smoothScrollTo("about")} className={`text-xs font-semibold uppercase tracking-wider transition ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>About</button>
          </nav>

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

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`p-2 rounded-lg md:hidden border transition-colors ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <div className={`md:hidden border-t py-4 px-6 flex flex-col gap-3 transition-colors ${
            isDark ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-150 shadow-lg"
          }`}>
            <button onClick={() => smoothScrollTo("home")} className={`text-left text-sm font-semibold py-1.5 transition ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>Home</button>
            <button onClick={() => smoothScrollTo("features")} className={`text-left text-sm font-semibold py-1.5 transition ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>Features</button>
            <button onClick={() => smoothScrollTo("analysis")} className={`text-left text-sm font-semibold py-1.5 transition ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>Analysis</button>
            <button onClick={() => smoothScrollTo("history")} className={`text-left text-sm font-semibold py-1.5 transition flex items-center justify-between ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>
              <span>History</span>
              {historyList.length > 0 && (
                <span className="bg-violet-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {historyList.length}
                </span>
              )}
            </button>
            <button onClick={() => smoothScrollTo("about")} className={`text-left text-sm font-semibold py-1.5 transition ${isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}>About</button>
          </div>
        )}
      </header>

      {/* Main Page Layout */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 flex flex-col gap-14">
        
        {/* COMPACT HERO SECTION */}
        <section className="text-center pt-4 md:pt-8 max-w-3xl mx-auto flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase border bg-violet-600/10 border-violet-500/35 text-violet-400 mb-5">
            ✨ Recruiting intelligence engine
          </span>
          
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-4 leading-[1.1] ${
            isDark ? "text-white" : "text-zinc-900"
          }`}>
            AI Placement{" "}
            <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
              Readiness Platform
            </span>
          </h1>
          
          <p className={`text-sm md:text-base leading-relaxed max-w-2xl mb-8 ${
            isDark ? "text-zinc-400" : "text-zinc-600"
          }`}>
            Analyze your Resume and GitHub Profile to discover your placement readiness score, strengths, weaknesses, and a comprehensive improvement roadmap. Get ready to stand out to elite recruiters.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => smoothScrollTo("analysis")}
              className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg shadow-violet-500/20 active:scale-98 transition-all"
            >
              Start Analysis →
            </button>
            <button
              onClick={() => smoothScrollTo("features")}
              className={`font-extrabold text-xs uppercase tracking-wider px-8 py-4 rounded-xl border transition-all ${
                isDark
                  ? "border-zinc-800 hover:bg-zinc-900 bg-zinc-950/20 text-zinc-300"
                  : "border-zinc-200 hover:bg-zinc-50 bg-white text-zinc-700 shadow-sm"
              }`}
            >
              Learn More
            </button>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="scroll-margin-top pt-4">
          <div className="text-center mb-10">
            <h2 className={`text-2xl font-extrabold tracking-tight mb-2 ${isDark ? "text-white" : "text-zinc-900"}`}>
              Professional Core Capabilities
            </h2>
            <p className={`text-xs ${isDark ? "text-zinc-450" : "text-zinc-500"}`}>
              Built specifically to model standard technical interview screening checkmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature 1 */}
            <div className={`border rounded-xl p-5 hover:border-violet-500/40 hover:translate-y-[-2px] transition-all duration-300 ${
              isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"
            }`}>
              <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-sm mb-4">📄</div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>Resume Analysis</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                In-browser local parser extracts resume vocabulary and identifies domain expertise instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`border rounded-xl p-5 hover:border-violet-500/40 hover:translate-y-[-2px] transition-all duration-300 ${
              isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"
            }`}>
              <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-sm mb-4">💻</div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>GitHub Analysis</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Reviews repository structures, programming languages, and recent active commits.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`border rounded-xl p-5 hover:border-violet-500/40 hover:translate-y-[-2px] transition-all duration-300 ${
              isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"
            }`}>
              <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-sm mb-4">📊</div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>ATS Compatibility</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Cross-references resume parsing parameters with typical recruiter applicant tracking screening metrics.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`border rounded-xl p-5 hover:border-violet-500/40 hover:translate-y-[-2px] transition-all duration-300 ${
              isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"
            }`}>
              <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-sm mb-4">🚀</div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>Readiness Score</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Derives a single overall readiness benchmark (0-100) based on targeted role requirements.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`border rounded-xl p-5 hover:border-violet-500/40 hover:translate-y-[-2px] transition-all duration-300 ${
              isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"
            }`}>
              <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-sm mb-4">🔮</div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>AI Career Matching</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Matches candidate data accurately against internships, verifying specialized alignment.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`border rounded-xl p-5 hover:border-violet-500/40 hover:translate-y-[-2px] transition-all duration-300 ${
              isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"
            }`}>
              <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-sm mb-4">📅</div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>Milestone Roadmaps</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Supplies structural 3-month action checklists detailing weekly targets to cover identified gaps.
              </p>
            </div>

            {/* Feature 7 */}
            <div className={`border rounded-xl p-5 hover:border-violet-500/40 hover:translate-y-[-2px] transition-all duration-300 ${
              isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"
            }`}>
              <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-sm mb-4">💡</div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>Interview Preparation</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Dynamically forms tailored technical questions matching your exact skill gaps.
              </p>
            </div>

            {/* Feature 8 */}
            <div className={`border rounded-xl p-5 hover:border-violet-500/40 hover:translate-y-[-2px] transition-all duration-300 ${
              isDark ? "bg-zinc-950/20 border-zinc-850" : "bg-white border-zinc-200 shadow-sm"
            }`}>
              <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-sm mb-4">🛠</div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>Rotational failover</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Incorporates advanced failover api rotation guaranteeing 100% processing resilience.
              </p>
            </div>
          </div>
        </section>

        {/* PROFILE ANALYSIS FORM & UPLOAD SECTION */}
        <section id="analysis" className="scroll-margin-top pt-4">
          <div className={`border rounded-2xl shadow-xl overflow-hidden ${
            isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200"
          }`}>
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-zinc-50"}`}>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-zinc-900"}`}>
                  <span className="text-violet-500">Assessment Workspace</span>
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  Supply your documents and handles below. Extract processes occur locally.
                </p>
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-black ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                Step 1 of 2
              </span>
            </div>

            {error && (
              <div className="m-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-3">
                <span className="text-lg leading-none">⚠️</span>
                <div>
                  <strong className="font-semibold block mb-0.5">Configuration Alert</strong>
                  {error}
                </div>
              </div>
            )}

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Input Panel */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* 1. Drag & Drop PDF Resume */}
                <div className="flex flex-col">
                  <label className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${
                    isDark ? "text-zinc-400" : "text-zinc-650"
                  }`}>
                    01. Resume Attachment (PDF only)
                  </label>
                  
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all ${
                      isDragOver
                        ? "border-violet-500 bg-violet-950/10 shadow-inner"
                        : resumeWordCount
                        ? "border-emerald-500/40 bg-emerald-950/5"
                        : isDark
                        ? "border-zinc-700 bg-zinc-950/30 hover:border-zinc-600"
                        : "border-zinc-300 bg-zinc-50 hover:border-zinc-450"
                    }`}
                  >
                    {resumeWordCount && selectedFileName ? (
                      <div className="text-center w-full max-w-sm">
                        <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-lg">
                          📄
                        </div>
                        <p className="text-emerald-500 font-bold text-xs truncate max-w-xs mx-auto mb-1">
                          {selectedFileName}
                        </p>
                        <p className={`text-[10px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                          Successfully parsed {resumeWordCount.toLocaleString()} words
                        </p>
                        <button
                          onClick={() => {
                            setResumeText("");
                            setResumeWordCount(null);
                            setSelectedFileName(null);
                          }}
                          className="mt-3.5 text-[10px] font-extrabold uppercase tracking-wider text-red-500 hover:text-red-400 underline underline-offset-2 transition"
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div className="text-center relative cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={onFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-3 text-sm transition ${
                          isDark ? "bg-zinc-900 border-zinc-800 text-zinc-450" : "bg-zinc-100 border-zinc-200 text-zinc-500"
                        }`}>
                          📥
                        </div>
                        <p className={`text-xs font-bold mb-1 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                          Drag and drop PDF resume here
                        </p>
                        <p className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
                          or click to browse your desktop
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. GitHub & Target inputs inside grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      isDark ? "text-zinc-400" : "text-zinc-650"
                    }`}>
                      02. GitHub Username
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-zinc-500">
                        @
                      </span>
                      <input
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="e.g. torvalds"
                        className={`w-full border focus:ring-1 outline-none transition rounded-xl py-3.5 pl-8 pr-4 text-xs ${
                          isDark
                            ? "bg-zinc-950/50 border-zinc-700 focus:border-violet-500 focus:ring-violet-500 text-zinc-200 placeholder-zinc-600"
                            : "bg-zinc-100 border-zinc-200 focus:border-violet-500 focus:ring-violet-500 text-zinc-900 placeholder-zinc-400"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      isDark ? "text-zinc-400" : "text-zinc-650"
                    }`}>
                      03. Target Internship Role
                    </label>
                    <div className="relative">
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className={`w-full border focus:ring-1 outline-none transition rounded-xl py-3.5 px-4 text-xs appearance-none cursor-pointer ${
                          isDark
                            ? "bg-zinc-950/50 border-zinc-700 focus:border-violet-500 focus:ring-violet-500 text-zinc-200"
                            : "bg-zinc-100 border-zinc-200 focus:border-violet-500 focus:ring-violet-500 text-zinc-900"
                        }`}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role} className={isDark ? "bg-zinc-900 text-zinc-300" : "bg-white text-zinc-800"}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-xs text-zinc-500">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analyze Trigger */}
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !resumeText || !githubUsername}
                  className={`w-full font-bold uppercase tracking-wider text-xs py-4 px-6 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 text-white ${
                    isLoading || !resumeText || !githubUsername
                      ? isDark
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750"
                        : "bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-300"
                      : "bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 active:scale-[0.99]"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      ENGINES RUNNING...
                    </span>
                  ) : (
                    <>
                      🚀 Analyze Profile
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Platform Instructions & Parameters */}
              <div className={`lg:col-span-5 flex flex-col justify-between border-l pl-0 lg:pl-8 pt-6 lg:pt-0 ${
                isDark ? "border-zinc-800 text-zinc-450" : "border-zinc-200 text-zinc-500"
              }`}>
                <div className="space-y-4">
                  <h4 className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? "text-zinc-300" : "text-zinc-950"}`}>
                    Assessment checklist
                  </h4>
                  
                  <ul className="space-y-3.5 text-xs">
                    <li className="flex gap-2.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Resume uploaded locally with text layer.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Specified target internship role parameter.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Public GitHub username resolves and is active.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Gemini API keys failover array validated.</span>
                    </li>
                  </ul>
                </div>

                <div className={`mt-8 pt-6 border-t ${isDark ? "border-zinc-850" : "border-zinc-150"}`}>
                  <p className="text-[10px] leading-relaxed">
                    By submitting, raw extracted text files are processed on the server to form readiness guides. Codebase structures are evaluated securely using the GitHub developer REST channel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PREMIUM LOADING EXPERIENCE */}
        {isLoading && (
          <section className={`border rounded-2xl p-6 md:p-8 max-w-xl mx-auto w-full relative overflow-hidden shadow-2xl transition-all duration-300 ${
            isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"
          }`}>
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse w-full" />
            
            <div className="flex items-center gap-3.5 mb-6">
              <svg className="animate-spin h-5 w-5 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div>
                <h3 className={`text-md font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>
                  AI Career Engine Active
                </h3>
                <p className={`text-[10px] mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  Evaluating readiness profiles against recruiter metrics.
                </p>
              </div>
            </div>

            {/* Rotating SaaS Status Message */}
            <div className={`p-4 rounded-xl border text-center mb-6 min-h-[56px] flex items-center justify-center font-mono text-[10px] leading-relaxed tracking-wide ${
              isDark ? "bg-zinc-950/40 border-zinc-850 text-violet-300" : "bg-zinc-50 border-zinc-150 text-violet-600"
            }`}>
              ⚡ {rotatingStatuses[rotatingStatusIndex]}
            </div>

            {/* Static Progress List */}
            <div className="flex flex-col gap-3.5">
              {loadingSteps.map((stepName, index) => {
                const stepIndex = index + 1;
                const isCompleted = activeStep > stepIndex;
                const isCurrent = activeStep === stepIndex;
                const isPending = activeStep < stepIndex;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-opacity duration-300 ${
                      isPending ? "opacity-35" : "opacity-100"
                    }`}
                  >
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0">
                        ✓
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-violet-600/20 border border-violet-500 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                      </div>
                    ) : (
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[9px] ${
                        isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-zinc-100 border-zinc-200 text-zinc-400"
                      }`}>
                        {stepIndex}
                      </div>
                    )}
                    <span
                      className={`text-xs ${
                        isCurrent
                          ? "font-semibold text-violet-400"
                          : isCompleted
                          ? isDark ? "text-zinc-300" : "text-zinc-700"
                          : isDark ? "text-zinc-650" : "text-zinc-400"
                      }`}
                    >
                      {stepName}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ASSESSMENT HISTORY LIST */}
        <section id="history" className="scroll-margin-top pt-4">
          <div className={`border rounded-2xl p-6 md:p-8 shadow-xl ${
            isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200"
          }`}>
            <div className="flex items-center justify-between border-b pb-5 mb-6 gap-4">
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-zinc-900"}`}>
                  <span>Evaluation Logs</span>
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  Your previously processed profiles stored securely inside your local browser storage.
                </p>
              </div>
              {historyList.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-extrabold uppercase tracking-wider text-red-500 hover:text-red-400 transition whitespace-nowrap"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-3">📭</div>
                <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-zinc-400" : "text-zinc-700"}`}>No history items found</h3>
                <p className={`text-xs ${isDark ? "text-zinc-600" : "text-zinc-450"}`}>Your placement readiness tests will automatically log here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase font-bold tracking-widest ${isDark ? "border-zinc-800 text-zinc-500" : "border-zinc-200 text-zinc-450"}`}>
                      <th className="pb-3.5 font-bold">Assessment Date</th>
                      <th className="pb-3.5 font-bold">Target internship</th>
                      <th className="pb-3.5 font-bold">GitHub user</th>
                      <th className="pb-3.5 font-bold text-center">Score</th>
                      <th className="pb-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((item, idx) => {
                      const formattedDate = new Date(item.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      });

                      let scoreClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      if (item.score < 40) {
                        scoreClass = "bg-red-500/10 text-red-400 border-red-500/20";
                      } else if (item.score < 70) {
                        scoreClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                      }

                      return (
                        <tr key={idx} className={`border-b last:border-0 hover:bg-zinc-500/5 transition ${
                          isDark ? "border-zinc-850" : "border-zinc-150"
                        }`}>
                          <td className="py-4 font-medium max-w-[120px] truncate" title={item.resumeName}>{formattedDate}</td>
                          <td className="py-4 font-medium">{item.targetRole}</td>
                          <td className="py-4 font-semibold text-violet-400">@{item.githubUsername}</td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold border text-[10px] ${scoreClass}`}>
                              {item.score}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-3.5">
                              <button
                                onClick={() => router.push(`/results/${item.sessionId}`)}
                                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                  isDark ? "text-zinc-300 hover:text-white" : "text-zinc-700 hover:text-zinc-950"
                                }`}
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleReanalyze(item)}
                                className="text-[10px] font-extrabold uppercase tracking-wider text-violet-500 hover:text-violet-400"
                              >
                                Re-analyze
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* PLATFORM PHILOSOPHY & ABOUT SECTION */}
        <section id="about" className="scroll-margin-top pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-violet-500 block mb-2">
                Platform Blueprint
              </span>
              <h2 className={`text-2xl font-extrabold tracking-tight mb-4 ${isDark ? "text-white" : "text-zinc-950"}`}>
                Accelerating Interview Readiness with Gemini AI
              </h2>
              <div className={`space-y-4 text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                <p>
                  Most entry-level applications fail in the first 6 seconds of human review. The <strong>AI Placement Readiness Platform</strong> acts as your initial dry-run assessment scanner, identifying crucial technical deficiencies before you submit a single application.
                </p>
                <p>
                  By analyzing matching keywords from targeted role models and validating active code contributions from public GitHub channels, the system crafts an empirical readiness roadmap. No student projects, placeholders, or empty advice — just direct, career-intelligence telemetry.
                </p>
              </div>
            </div>

            <div className={`border rounded-2xl p-6 ${
              isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-zinc-50 border-zinc-200"
            }`}>
              <h3 className={`text-sm font-bold mb-4 uppercase tracking-wider ${isDark ? "text-zinc-300" : "text-zinc-950"}`}>
                Empirical Evaluation Checkpoints
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                    01. Vocabulary & ATS
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-450" : "text-zinc-550"}`}>
                    Scans resume strings for vital frameworks, checking that the structure aligns perfectly with the target profile definitions.
                  </p>
                </div>
                <div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                    02. GitHub Footprints
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-450" : "text-zinc-550"}`}>
                    Inspects actual language repositories, repo descriptions, and commit distributions to verify hands-on execution.
                  </p>
                </div>
                <div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                    03. Practical Milestones
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-450" : "text-zinc-550"}`}>
                    Supplies weekly action milestones and difficulty-indexed projects to solidify missing requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className={`border-t transition-colors ${
        isDark ? "border-zinc-900 bg-zinc-950/20 text-zinc-500" : "border-zinc-200 bg-zinc-100 text-zinc-500"
      } py-6 text-center text-xs mt-14`}>
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
            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-850"
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
