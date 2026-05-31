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
  const [isDark, setIsDark] = useState<boolean>(false); // Google theme defaults to crisp clean Light mode
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
    if (storedTheme === "dark") {
      setIsDark(true);
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
      root.style.backgroundColor = "#202124"; // Google Dark Background
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.backgroundColor = "#f8f9fa"; // Google Light Background
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
    "Parsing resume layout structures...",
    "Extracting technical domain keywords...",
    "Resolving public repository indices...",
    "Analyzing framework and language metrics...",
    "Mapping verified software achievements...",
    "Verifying industry baseline alignment...",
    "Compiling strategic improvement milestones...",
    "Generating targeted interview preparation content...",
  ];

  const loadingSteps = [
    "Analyzing resume qualifications...",
    "Reviewing public developer profile...",
    "Calculating core readiness baseline...",
    "Compiling mitigation roadmap...",
    "Formulating technical interview prep...",
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
      setError("Please select a valid PDF resume file first.");
      return;
    }
    if (!githubUsername.trim()) {
      setError("Please specify a valid GitHub developer username.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveStep(1); // Set step 1 immediately active
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

    // Start interval for step-by-step progress
    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      if (step <= 5) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
        checkAndComplete(sessionId, apiCallPromise);
      }
    }, 4000);

    const checkAndComplete = async (sId: string, apiPromise: Promise<any>) => {
      try {
        let finalData = apiDataRef.current;
        if (!isApiFinishedRef.current) {
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
            const updatedHistory = [newHistoryItem, ...filteredHistory].slice(0, 10);
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
    smoothScrollTo("analysis");
  };

  const clearHistory = () => {
    if (confirm("Clear local assessment history?")) {
      localStorage.removeItem("placement_readiness_history");
      setHistoryList([]);
    }
  };

  const smoothScrollTo = (targetId: string) => {
    setShowMobileMenu(false);
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
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
    <div id="home" className={`relative min-h-screen flex flex-col justify-between overflow-x-hidden transition-colors duration-250 ${
      isDark ? "bg-[#202124] text-[#e8eaed] font-sans" : "bg-[#f8f9fa] text-[#3c4043] font-sans"
    }`}>
      
      {/* Top Navbar (Google Style) */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors duration-200 ${
        isDark ? "border-[#3c4043] bg-[#202124]/90" : "border-[#dadce0] bg-white/90 shadow-sm"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => smoothScrollTo("home")}>
            <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center font-bold text-white shadow-sm">
              G
            </div>
            <span className={`text-md font-bold tracking-tight ${
              isDark ? "text-white" : "text-[#202124]"
            }`}>
              AI Placement Readiness Platform
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => smoothScrollTo("home")} className={`text-xs font-bold transition hover:text-[#1a73e8] ${isDark ? "text-zinc-300" : "text-[#5f6368]"}`}>Home</button>
            <button onClick={() => smoothScrollTo("features")} className={`text-xs font-bold transition hover:text-[#1a73e8] ${isDark ? "text-zinc-300" : "text-[#5f6368]"}`}>Features</button>
            <button onClick={() => smoothScrollTo("analysis")} className={`text-xs font-bold transition hover:text-[#1a73e8] ${isDark ? "text-zinc-300" : "text-[#5f6368]"}`}>Analysis</button>
            <button onClick={() => smoothScrollTo("history")} className={`text-xs font-bold transition hover:text-[#1a73e8] relative ${isDark ? "text-zinc-300" : "text-[#5f6368]"}`}>
              History
              {historyList.length > 0 && (
                <span className="absolute -top-2 -right-3.5 bg-[#ea4335] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                  {historyList.length}
                </span>
              )}
            </button>
            <button onClick={() => smoothScrollTo("about")} className={`text-xs font-bold transition hover:text-[#1a73e8] ${isDark ? "text-zinc-300" : "text-[#5f6368]"}`}>About</button>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors border ${
                isDark
                  ? "bg-[#2d2d30] border-[#3c4043] text-amber-400 hover:bg-[#3c4043]"
                  : "bg-white border-[#dadce0] text-zinc-700 hover:bg-zinc-100 shadow-sm"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`p-2 rounded-lg md:hidden border transition-colors ${
                isDark
                  ? "bg-[#2d2d30] border-[#3c4043] text-[#9aa0a6] hover:text-white"
                  : "bg-white border-[#dadce0] text-[#5f6368] hover:text-[#202124]"
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

        {/* Mobile Nav Menu */}
        {showMobileMenu && (
          <div className={`md:hidden border-t py-4 px-6 flex flex-col gap-3.5 transition-colors ${
            isDark ? "bg-[#202124] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-md"
          }`}>
            <button onClick={() => smoothScrollTo("home")} className={`text-left text-xs font-bold py-1 transition ${isDark ? "text-zinc-300 hover:text-white" : "text-[#5f6368] hover:text-[#202124]"}`}>Home</button>
            <button onClick={() => smoothScrollTo("features")} className={`text-left text-xs font-bold py-1 transition ${isDark ? "text-zinc-300 hover:text-white" : "text-[#5f6368] hover:text-[#202124]"}`}>Features</button>
            <button onClick={() => smoothScrollTo("analysis")} className={`text-left text-xs font-bold py-1 transition ${isDark ? "text-zinc-300 hover:text-white" : "text-[#5f6368] hover:text-[#202124]"}`}>Analysis</button>
            <button onClick={() => smoothScrollTo("history")} className={`text-left text-xs font-bold py-1 transition flex items-center justify-between ${isDark ? "text-zinc-300 hover:text-white" : "text-[#5f6368] hover:text-[#202124]"}`}>
              <span>History</span>
              {historyList.length > 0 && (
                <span className="bg-[#ea4335] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {historyList.length}
                </span>
              )}
            </button>
            <button onClick={() => smoothScrollTo("about")} className={`text-left text-xs font-bold py-1 transition ${isDark ? "text-zinc-300 hover:text-white" : "text-[#5f6368] hover:text-[#202124]"}`}>About</button>
          </div>
        )}
      </header>

      {/* Main Page Layout */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col gap-16">
        
        {/* COMPACT HERO SECTION */}
        <section className="text-center pt-2 md:pt-6 max-w-3xl mx-auto flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider border bg-[#1a73e8]/5 dark:bg-[#1a73e8]/10 border-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] mb-6">
            Google Cloud Platform Partner Style
          </span>
          
          <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-[1.15] ${
            isDark ? "text-white" : "text-[#202124]"
          }`}>
            AI Placement{" "}
            <span className="text-[#1a73e8] dark:text-[#8ab4f8]">
              Readiness Platform
            </span>
          </h1>
          
          <p className={`text-sm md:text-base leading-relaxed max-w-2xl mb-8 ${
            isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"
          }`}>
            Analyze your credentials and dynamic software metrics to determine placement indices, qualified core competencies, critical growth roadmaps, and targeted technical preparation points.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => smoothScrollTo("analysis")}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-full shadow-sm hover:shadow active:scale-98 transition-all"
            >
              Start Analysis →
            </button>
            <button
              onClick={() => smoothScrollTo("features")}
              className={`font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-full border transition-all ${
                isDark
                  ? "border-[#3c4043] hover:bg-[#3c4043] bg-transparent text-[#e8eaed]"
                  : "border-[#dadce0] hover:bg-zinc-50 bg-white text-[#3c4043] shadow-sm"
              }`}
            >
              Learn More
            </button>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="scroll-margin-top pt-4">
          <div className="text-center mb-10">
            <h2 className={`text-2xl font-bold tracking-tight mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>
              Core Placement Assessment Vectors
            </h2>
            <p className={`text-xs ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
              Direct, metrics-focused parameters to verify and accelerate structural alignment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className={`border rounded-xl p-5 hover:shadow-md transition-all duration-250 ${
              isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0]"
            }`}>
              <div className="w-10 h-10 rounded-lg bg-[#1a73e8]/10 flex items-center justify-center text-md mb-4 text-[#1a73e8]">📄</div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>Resume Audit</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                Extracts resume strings locally and isolates critical operational language profiles.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`border rounded-xl p-5 hover:shadow-md transition-all duration-250 ${
              isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0]"
            }`}>
              <div className="w-10 h-10 rounded-lg bg-[#34a853]/10 flex items-center justify-center text-md mb-4 text-[#34a853]">💻</div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>Software Index</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                Inspects coding repositories to calculate actual development footprint parameters.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`border rounded-xl p-5 hover:shadow-md transition-all duration-250 ${
              isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0]"
            }`}>
              <div className="w-10 h-10 rounded-lg bg-[#ea4335]/10 flex items-center justify-center text-md mb-4 text-[#ea4335]">📊</div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>ATS Scoring</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                Cross-references qualifications against typical organizational keyword indices.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`border rounded-xl p-5 hover:shadow-md transition-all duration-250 ${
              isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0]"
            }`}>
              <div className="w-10 h-10 rounded-lg bg-[#fbbc05]/10 flex items-center justify-center text-md mb-4 text-[#fbbc05]">🏆</div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>Readiness Metric</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                Compiles data streams to construct an empirical performance index (0 to 100).
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`border rounded-xl p-5 hover:shadow-md transition-all duration-250 ${
              isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0]"
            }`}>
              <div className="w-10 h-10 rounded-lg bg-[#1a73e8]/10 flex items-center justify-center text-md mb-4 text-[#1a73e8]">🎯</div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>Role Alignment</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                Identifies domain placement parameters matching candidates' actual strengths.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`border rounded-xl p-5 hover:shadow-md transition-all duration-250 ${
              isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0]"
            }`}>
              <div className="w-10 h-10 rounded-lg bg-[#34a853]/10 flex items-center justify-center text-md mb-4 text-[#34a853]">📅</div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>Mitigation Roadmaps</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                Supplies precise weekly target checklists to balance deficient skill structures.
              </p>
            </div>

            {/* Feature 7 */}
            <div className={`border rounded-xl p-5 hover:shadow-md transition-all duration-250 ${
              isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0]"
            }`}>
              <div className="w-10 h-10 rounded-lg bg-[#ea4335]/10 flex items-center justify-center text-md mb-4 text-[#ea4335]">💡</div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>Technical Prep</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                Generates dynamic technical questions target-matched to isolated skill gaps.
              </p>
            </div>

            {/* Feature 8 */}
            <div className={`border rounded-xl p-5 hover:shadow-md transition-all duration-250 ${
              isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0]"
            }`}>
              <div className="w-10 h-10 rounded-lg bg-[#fbbc05]/10 flex items-center justify-center text-md mb-4 text-[#fbbc05]">🔒</div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>Data Protection</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                Ensures local security frameworks where files never leave client-side runtimes.
              </p>
            </div>
          </div>
        </section>

        {/* PROFILE ANALYSIS FORM & UPLOAD SECTION */}
        <section id="analysis" className="scroll-margin-top pt-4">
          <div className={`border rounded-2xl overflow-hidden ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
          }`}>
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? "border-[#3c4043] bg-[#2d2d30]/60" : "border-[#dadce0] bg-[#f8f9fa]"}`}>
              <div>
                <h2 className={`text-md font-bold ${isDark ? "text-white" : "text-[#202124]"}`}>
                  Candidate Assessment Workspace
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                  Provide file attachments and account specifications below.
                </p>
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-zinc-500" : "text-[#5f6368]"}`}>
                Step 1 of 2
              </span>
            </div>

            {error && (
              <div className="m-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[#ea4335] text-xs flex items-start gap-3">
                <span className="text-md leading-none">⚠️</span>
                <div>
                  <strong className="font-bold block mb-0.5">Input Specification Alert</strong>
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
                    isDark ? "text-zinc-400" : "text-[#5f6368]"
                  }`}>
                    01. Resume Attachment (PDF formatted text)
                  </label>
                  
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`min-h-[150px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all ${
                      isDragOver
                        ? "border-[#1a73e8] bg-[#1a73e8]/5 shadow-inner"
                        : resumeWordCount
                        ? "border-[#34a853]/40 bg-[#34a853]/5"
                        : isDark
                        ? "border-[#3c4043] bg-[#202124]/30 hover:border-zinc-500"
                        : "border-[#dadce0] bg-[#f8f9fa] hover:border-zinc-400"
                    }`}
                  >
                    {resumeWordCount && selectedFileName ? (
                      <div className="w-full max-w-md">
                        <div className="flex items-center justify-between p-3.5 rounded-xl border bg-white dark:bg-[#2d2d30] border-[#dadce0] dark:border-[#3c4043] shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#ea4335]/15 flex items-center justify-center text-xs font-bold text-[#ea4335]">
                              PDF
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold truncate max-w-[180px] dark:text-white" title={selectedFileName}>
                                {selectedFileName}
                              </p>
                              <p className={`text-[10px] ${isDark ? "text-zinc-400" : "text-[#5f6368]"}`}>
                                {resumeWordCount.toLocaleString()} parsed words
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setResumeText("");
                              setResumeWordCount(null);
                              setSelectedFileName(null);
                            }}
                            className="text-xs font-bold text-[#ea4335] hover:text-red-700 transition px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center relative cursor-pointer w-full h-full flex flex-col items-center justify-center py-4">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={onFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-3 text-sm transition ${
                          isDark ? "bg-[#2d2d30] border-[#3c4043] text-zinc-450" : "bg-white border-[#dadce0] text-zinc-500 shadow-sm"
                        }`}>
                          📥
                        </div>
                        <p className={`text-xs font-bold mb-1 ${isDark ? "text-zinc-200" : "text-[#202124]"}`}>
                          Select your resume PDF
                        </p>
                        <p className={`text-[10px] ${isDark ? "text-zinc-500" : "text-[#5f6368]"}`}>
                          Drag and drop file here, or click to upload
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. GitHub & Target inputs inside grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      isDark ? "text-zinc-400" : "text-[#5f6368]"
                    }`}>
                      02. GitHub Account username
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
                            ? "bg-[#202124]/50 border-[#3c4043] focus:border-[#1a73e8] focus:ring-[#1a73e8] text-white placeholder-zinc-650"
                            : "bg-[#f8f9fa] border-[#dadce0] focus:border-[#1a73e8] focus:ring-[#1a73e8] text-[#202124] placeholder-zinc-400 shadow-sm"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      isDark ? "text-zinc-400" : "text-[#5f6368]"
                    }`}>
                      03. Targeted Internship path
                    </label>
                    <div className="relative">
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className={`w-full border focus:ring-1 outline-none transition rounded-xl py-3.5 px-4 text-xs appearance-none cursor-pointer ${
                          isDark
                            ? "bg-[#202124]/50 border-[#3c4043] focus:border-[#1a73e8] focus:ring-[#1a73e8] text-white"
                            : "bg-[#f8f9fa] border-[#dadce0] focus:border-[#1a73e8] focus:ring-[#1a73e8] text-[#202124] shadow-sm"
                        }`}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role} className={isDark ? "bg-[#202124] text-zinc-300" : "bg-white text-[#202124]"}>
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
                  className={`w-full font-bold uppercase tracking-wider text-xs py-4 px-6 rounded-full transition-all shadow-sm mt-2 flex items-center justify-center gap-2 text-white ${
                    isLoading || !resumeText || !githubUsername
                      ? isDark
                        ? "bg-[#2d2d30] text-zinc-600 cursor-not-allowed border border-[#3c4043]"
                        : "bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-300"
                      : "bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.99] shadow-md shadow-[#1a73e8]/10"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      COMPILING DATA...
                    </span>
                  ) : (
                    <>
                      🚀 Begin Evaluation
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Platform Instructions */}
              <div className={`lg:col-span-5 flex flex-col justify-between border-l pl-0 lg:pl-8 pt-6 lg:pt-0 ${
                isDark ? "border-[#3c4043] text-[#9aa0a6]" : "border-[#dadce0] text-[#5f6368]"
              }`}>
                <div className="space-y-4">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-300" : "text-[#202124]"}`}>
                    Verification metrics
                  </h4>
                  
                  <ul className="space-y-3.5 text-xs">
                    <li className="flex gap-2.5">
                      <span className="text-[#34a853] font-bold">✓</span>
                      <span>Extracted PDF credentials validated locally.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-[#34a853] font-bold">✓</span>
                      <span>Specified dynamic target internship parameters.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-[#34a853] font-bold">✓</span>
                      <span>Public software codebase profiles verified.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-[#34a853] font-bold">✓</span>
                      <span>Secure analytics infrastructure confirmed.</span>
                    </li>
                  </ul>
                </div>

                <div className={`mt-8 pt-6 border-t ${isDark ? "border-[#3c4043]" : "border-[#dadce0]"}`}>
                  <p className="text-[10px] leading-relaxed text-[#5f6368] dark:text-zinc-500">
                    Calculations are run securely. Parsed credentials and GitHub profile logs are processed to produce placement dashboards. All user session records remain locally cached inside your client browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PREMIUM LOADING EXPERIENCE */}
        {isLoading && (
          <section className={`border rounded-2xl p-6 md:p-8 max-w-xl mx-auto w-full relative overflow-hidden transition-all duration-350 ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-md"
          }`}>
            <div className="absolute top-0 left-0 h-1 bg-[#1a73e8] w-full" />
            
            <div className="flex items-center gap-3.5 mb-6">
              <svg className="animate-spin h-5 w-5 text-[#1a73e8] shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div>
                <h3 className={`text-md font-bold ${isDark ? "text-white" : "text-[#202124]"}`}>
                  Placement Analytics Core Active
                </h3>
                <p className={`text-[10px] mt-0.5 ${isDark ? "text-zinc-450" : "text-[#5f6368]"}`}>
                  Compiling profiles against industry benchmarks.
                </p>
              </div>
            </div>

            {/* Rotating SaaS Status Message */}
            <div className={`p-4 rounded-xl border text-center mb-6 min-h-[56px] flex items-center justify-center font-mono text-[10px] leading-relaxed tracking-wide ${
              isDark ? "bg-[#202124]/40 border-[#3c4043] text-[#8ab4f8]" : "bg-[#f8f9fa] border-[#dadce0] text-[#1a73e8]"
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
                      <div className="w-5 h-5 rounded-full bg-[#34a853]/15 border border-[#34a853] flex items-center justify-center text-[10px] text-[#34a853] font-bold shrink-0">
                        ✓
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-[#1a73e8]/10 border border-[#1a73e8] flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] animate-pulse" />
                      </div>
                    ) : (
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[9px] ${
                        isDark ? "bg-zinc-800 border-[#3c4043] text-zinc-500" : "bg-white border-[#dadce0] text-zinc-400"
                      }`}>
                        {stepIndex}
                      </div>
                    )}
                    <span
                      className={`text-xs ${
                        isCurrent
                          ? "font-bold text-[#1a73e8]"
                          : isCompleted
                          ? isDark ? "text-zinc-300" : "text-[#202124]"
                          : isDark ? "text-zinc-650" : "text-zinc-450"
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
          <div className={`border rounded-2xl p-6 md:p-8 ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
          }`}>
            <div className="flex items-center justify-between border-b pb-5 mb-6 gap-4 border-[#dadce0] dark:border-[#3c4043]">
              <div>
                <h2 className={`text-md font-bold ${isDark ? "text-white" : "text-[#202124]"}`}>
                  Evaluation History Logs
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                  Your previously processed profiles stored securely inside your local browser cache.
                </p>
              </div>
              {historyList.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#ea4335] hover:underline transition whitespace-nowrap"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-2 text-zinc-450">📭</div>
                <h3 className={`text-xs font-bold mb-1 ${isDark ? "text-zinc-450" : "text-[#5f6368]"}`}>No historical assessments</h3>
                <p className={`text-[10px] ${isDark ? "text-zinc-650" : "text-zinc-450"}`}>Your placement readiness tests will automatically list here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${isDark ? "border-[#3c4043] text-zinc-550" : "border-[#dadce0] text-zinc-450"}`}>
                      <th className="pb-3.5 font-bold">Assessment Date</th>
                      <th className="pb-3.5 font-bold">Targeted path</th>
                      <th className="pb-3.5 font-bold">GitHub account</th>
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

                      let scoreClass = "bg-[#34a853]/10 text-[#34a853] border-[#34a853]/25";
                      if (item.score < 40) {
                        scoreClass = "bg-[#ea4335]/10 text-[#ea4335] border-[#ea4335]/25";
                      } else if (item.score < 70) {
                        scoreClass = "bg-[#fbbc05]/10 text-[#fbbc05] border-[#fbbc05]/25";
                      }

                      return (
                        <tr key={idx} className={`border-b last:border-0 hover:bg-zinc-500/5 transition ${
                          isDark ? "border-[#3c4043]" : "border-[#dadce0]"
                        }`}>
                          <td className="py-4 font-medium max-w-[120px] truncate" title={item.resumeName}>{formattedDate}</td>
                          <td className="py-4 font-medium">{item.targetRole}</td>
                          <td className="py-4 font-bold text-[#1a73e8] dark:text-[#8ab4f8]">@{item.githubUsername}</td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold border text-[10px] ${scoreClass}`}>
                              {item.score}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-3.5">
                              <button
                                onClick={() => router.push(`/results/${item.sessionId}`)}
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  isDark ? "text-zinc-300 hover:text-white" : "text-[#5f6368] hover:text-[#202124]"
                                }`}
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleReanalyze(item)}
                                className="text-[10px] font-bold uppercase tracking-wider text-[#1a73e8] hover:underline"
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
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#1a73e8] dark:text-[#8ab4f8] block mb-2">
                Operational Framework
              </span>
              <h2 className={`text-2xl font-bold tracking-tight mb-4 ${isDark ? "text-white" : "text-[#202124]"}`}>
                Accelerating Placement Readiness via Empirical Auditing
              </h2>
              <div className={`space-y-4 text-xs leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                <p>
                  Most software engineering applications undergo initial scanning before technical review. The **AI Placement Readiness Platform** acts as your screening companion, flagging keyword alignment deficits prior to application submittals.
                </p>
                <p>
                  By analyzing matching qualifications against standard role structures and verifying software implementations inside public repository histories, the pipeline constructs detailed mitigation milestones to prepare you for hiring loops.
                </p>
              </div>
            </div>

            <div className={`border rounded-2xl p-6 ${
              isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
            }`}>
              <h3 className={`text-xs font-bold mb-4 uppercase tracking-wider ${isDark ? "text-zinc-300" : "text-[#202124]"}`}>
                Structural Audit Indicators
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? "text-zinc-200" : "text-[#202124]"}`}>
                    01. Vocabulary Alignment
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                    Scans parsed strings for critical technologies and frameworks required in typical recruiters' indices.
                  </p>
                </div>
                <div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? "text-zinc-200" : "text-[#202124]"}`}>
                    02. Verified Code Telemetry
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                    Examines public repositories, language frequencies, and operational histories to confirm practical execution.
                  </p>
                </div>
                <div>
                  <h4 className={`text-xs font-bold mb-1 ${isDark ? "text-zinc-200" : "text-[#202124]"}`}>
                    03. Mitigation Checklists
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
                    Provides granular week-by-week goals and recommended projects to balance missing skill categories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className={`border-t transition-colors ${
        isDark ? "border-[#3c4043] bg-[#202124] text-zinc-500" : "border-[#dadce0] bg-[#f8f9fa] text-[#5f6368]"
      } py-6 text-center text-xs mt-14`}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AI Placement Readiness Platform. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTerms(true)}
              className={`hover:underline font-bold ${
                isDark ? "text-[#8ab4f8]" : "text-[#1a73e8]"
              }`}
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <p>Powered by advanced placement analytics.</p>
          </div>
        </div>
      </footer>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto ${
            isDark ? "bg-[#2d2d30] border-[#3c4043] text-[#e8eaed]" : "bg-white border-[#dadce0] text-[#3c4043]"
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setShowTerms(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg border transition ${
                isDark
                  ? "border-[#3c4043] bg-[#202124] hover:bg-[#3c4043] text-zinc-450"
                  : "border-[#dadce0] bg-[#f8f9fa] hover:bg-[#dadce0] text-zinc-650"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className={`text-2xl font-bold mb-6 ${
              isDark ? "text-white" : "text-[#202124]"
            }`}>
              Terms & Conditions
            </h2>

            <div className={`space-y-4 text-xs leading-relaxed mb-8 ${
              isDark ? "text-zinc-300" : "text-[#5f6368]"
            }`}>
              <p>
                Welcome to the <strong>AI Placement Readiness Platform</strong>. By uploading your resume and specifying your GitHub profile, you acknowledge and agree to the following terms:
              </p>
              <h3 className="font-bold text-sm mt-4 text-[#1a73e8] dark:text-[#8ab4f8]">1. Data Collection & Processing</h3>
              <p>
                Resume text extraction is performed entirely inside the local client sandbox. No files are stored on outside servers. Raw text payloads and public GitHub data are temporarily transmitted strictly to form the readiness indices.
              </p>
              <h3 className="font-bold text-sm mt-4 text-[#1a73e8] dark:text-[#8ab4f8]">2. Accuracy of Assessments</h3>
              <p>
                Evaluations, scores, roadmaps, and suggestions are AI-generated based on specific candidate parameters and public indices. The reports function as a preparatory guide and do not guarantee recruitment outcomes.
              </p>
              <h3 className="font-bold text-sm mt-4 text-[#1a73e8] dark:text-[#8ab4f8]">3. Usage Terms</h3>
              <p>
                This platform is provided solely for educational, interview preparation, and placement evaluation purposes. Users agree not to abuse the analysis pipelines, input malformed payloads, or reverse-engineer the query aggregation handlers.
              </p>
            </div>

            {/* Developer Mention */}
            <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold ${
              isDark ? "border-[#3c4043] text-zinc-450" : "border-[#dadce0] text-[#5f6368]"
            }`}>
              <span>Developed & Maintained by: <strong className="text-[#1a73e8] dark:text-[#8ab4f8] text-xs font-bold">Yash Vardhan Singh</strong></span>
              <button
                onClick={() => setShowTerms(false)}
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold py-2 px-6 rounded-full transition shadow-sm"
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
