"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as pdfjsLib from "pdfjs-dist";

// Set pdf.js worker URL (uses stable CDN worker matching package.json version)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function Home() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeWordCount, setResumeWordCount] = useState<number | null>(null);
  const [githubUsername, setGithubUsername] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Software Engineer Intern");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Loading animation step state
  const [activeStep, setActiveStep] = useState<number>(0);
  const [apiData, setApiData] = useState<any>(null);
  const [isApiFinished, setIsApiFinished] = useState<boolean>(false);

  // Terms and Conditions Modal State
  const [showTerms, setShowTerms] = useState<boolean>(false);

  // Light / Dark Mode state
  const [isDark, setIsDark] = useState<boolean>(true);

  // Refs for tracking states during interval
  const isApiFinishedRef = useRef(false);
  const apiDataRef = useRef<any>(null);

  useEffect(() => {
    isApiFinishedRef.current = isApiFinished;
  }, [isApiFinished]);

  useEffect(() => {
    apiDataRef.current = apiData;
  }, [apiData]);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light") {
      setIsDark(false);
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
    // Each step gets marked as done every 4 seconds.
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
          router.push(`/results/${sId}`);
        }
      } catch (err: any) {
        // Error is handled in the catch block of API call
      }
    };
  };

  return (
    <div className={`relative min-h-screen flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
      isDark ? "bg-[#0f0f13] text-gray-100" : "bg-zinc-50 text-zinc-900"
    }`}>
      {/* Decorative Glow Spheres */}
      {isDark && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
        </>
      )}

      {/* Top Navbar */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-40 transition-colors ${
        isDark ? "border-zinc-800/80 bg-zinc-950/40" : "border-zinc-200 bg-white/80"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
              AI
            </div>
            <span className={`text-lg md:text-xl font-extrabold tracking-tight ${
              isDark ? "bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent" : "text-zinc-900"
            }`}>
              AI Placement Readiness Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Tagline */}
            <p className={`text-xs font-medium italic hidden lg:block ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              "Know your gaps. Own your future."
            </p>

            {/* Theme Toggle Button */}
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 ${
            isDark ? "text-white" : "text-zinc-950"
          }`}>
            AI Placement{" "}
            <span className="bg-gradient-to-r from-violet-500 to-indigo-400 bg-clip-text text-transparent">
              Readiness Platform
            </span>
          </h1>
          <p className={`text-base md:text-lg max-w-2xl mx-auto ${
            isDark ? "text-zinc-400" : "text-zinc-600"
          }`}>
            Evaluate your resume and GitHub repositories against your target role. 
            Identify critical skill gaps and generate a customized 3-month roadmap to secure your dream internship.
          </p>
        </section>

        {/* Input Card Container */}
        <section className={`relative z-10 w-full backdrop-blur-lg border rounded-2xl shadow-2xl p-6 md:p-8 mb-8 overflow-hidden transition-colors duration-350 ${
          isDark ? "bg-zinc-900/60 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-800"
        }`}>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <strong className="font-semibold block mb-0.5">Analysis Issue</strong>
                {error}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: PDF Resume Upload */}
            <div className="flex flex-col">
              <label className={`text-sm font-semibold tracking-wider uppercase mb-3 flex items-center gap-2 ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}>
                <span>01</span> Resume PDF
              </label>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`flex-1 min-h-[180px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 transition-all ${
                  isDragOver
                    ? "border-violet-500 bg-violet-950/10 shadow-inner"
                    : resumeWordCount
                    ? "border-emerald-500/50 bg-emerald-950/5"
                    : isDark
                    ? "border-zinc-700 bg-zinc-950/20 hover:border-zinc-600"
                    : "border-zinc-300 bg-zinc-50 hover:border-zinc-400"
                }`}
              >
                {resumeWordCount ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-emerald-500 font-semibold text-sm mb-1">
                      ✅ Resume loaded
                    </p>
                    <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      ({resumeWordCount.toLocaleString()} words parsed)
                    </p>
                    <button
                      onClick={() => {
                        setResumeText("");
                        setResumeWordCount(null);
                      }}
                      className={`mt-3 text-xs font-semibold underline underline-offset-2 transition ${
                        isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
                      }`}
                    >
                      Change resume
                    </button>
                  </div>
                ) : (
                  <div className="text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={onFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center mx-auto mb-3 ${
                      isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"
                    }`}>
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                      Drag & drop PDF here
                    </p>
                    <p className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      or click to upload from computer
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: GitHub Username */}
            <div className="flex flex-col">
              <label className={`text-sm font-semibold tracking-wider uppercase mb-3 flex items-center gap-2 ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}>
                <span>02</span> GitHub Profile
              </label>
              <div className="flex-1 flex flex-col justify-center">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg
                      className={`w-5 h-5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="Username (e.g. torvalds)"
                    className={`w-full border focus:ring-1 outline-none transition rounded-xl py-3.5 pl-11 pr-4 text-sm ${
                      isDark
                        ? "bg-zinc-950/60 border-zinc-700 focus:border-violet-500 focus:ring-violet-500 text-zinc-100 placeholder-zinc-500"
                        : "bg-zinc-100 border-zinc-200 focus:border-violet-500 focus:ring-violet-500 text-zinc-900 placeholder-zinc-400"
                    }`}
                  />
                </div>
                <p className={`mt-3 text-xs leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                  We'll automatically analyze public repositories, language distribution, and coding consistency.
                </p>
              </div>
            </div>

            {/* Column 3: Target Role Selection */}
            <div className="flex flex-col">
              <label className={`text-sm font-semibold tracking-wider uppercase mb-3 flex items-center gap-2 ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}>
                <span>03</span> Target Role
              </label>
              <div className="flex-1 flex flex-col justify-center">
                <div className="relative">
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className={`w-full border focus:ring-1 outline-none transition rounded-xl py-3.5 px-4 text-sm appearance-none cursor-pointer ${
                      isDark
                        ? "bg-zinc-950/60 border-zinc-700 focus:border-violet-500 focus:ring-violet-500 text-zinc-100"
                        : "bg-zinc-100 border-zinc-200 focus:border-violet-500 focus:ring-violet-500 text-zinc-900"
                    }`}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role} className={isDark ? "bg-zinc-900 text-zinc-200" : "bg-white text-zinc-800"}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ${
                    isDark ? "text-zinc-500" : "text-zinc-400"
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className={`mt-3 text-xs leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                  Customizes evaluation metrics, roadmap milestones, and suggested projects for this specific path.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className={`mt-8 pt-6 border-t ${isDark ? "border-zinc-800/80" : "border-zinc-200"}`}>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !resumeText || !githubUsername}
              className={`w-full relative flex items-center justify-center gap-2 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg ${
                isLoading || !resumeText || !githubUsername
                  ? isDark
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-300/50"
                  : "bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 hover:shadow-violet-600/20 active:scale-[0.99] border border-violet-500/30"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing profile...
                </span>
              ) : (
                <>
                  Analyze My Profile
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Loading Step Progress */}
        {isLoading && (
          <section className={`border rounded-2xl p-6 md:p-8 max-w-xl mx-auto w-full relative overflow-hidden transition-all duration-300 ${
            isDark ? "bg-zinc-900/40 border-zinc-800/60" : "bg-white border-zinc-200 shadow-xl"
          }`}>
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse w-full" />
            <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${
              isDark ? "text-white" : "text-zinc-950"
            }`}>
              <svg className="animate-spin h-4.5 w-4.5 text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI Assessment Engines Initialized
            </h3>
            <div className="flex flex-col gap-4">
              {loadingSteps.map((stepName, index) => {
                const stepIndex = index + 1;
                const isCompleted = activeStep > stepIndex;
                const isCurrent = activeStep === stepIndex;
                const isPending = activeStep < stepIndex;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-opacity duration-300 ${
                      isPending ? "opacity-30" : "opacity-100"
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
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] ${
                        isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-zinc-100 border-zinc-200 text-zinc-400"
                      }`}>
                        {stepIndex}
                      </div>
                    )}
                    <span
                      className={`text-sm ${
                        isCurrent
                          ? "font-semibold text-violet-400"
                          : isCompleted
                          ? isDark ? "text-zinc-300" : "text-zinc-700"
                          : isDark ? "text-zinc-600" : "text-zinc-400"
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
      </main>

      {/* Footer */}
      <footer className={`border-t transition-colors ${
        isDark ? "border-zinc-900 bg-zinc-950/20 text-zinc-600" : "border-zinc-200 bg-zinc-100 text-zinc-500"
      } py-6 text-center text-xs`}>
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
