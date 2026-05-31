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
  targetRole?: string;
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

  // Light / Dark Mode state (Google theme defaults to clean Light mode)
  const [isDark, setIsDark] = useState<boolean>(false);

  // PDF Export Options Panel State
  const [showExportPanel, setShowExportPanel] = useState<boolean>(false);
  const [exportAction, setExportAction] = useState<"download" | "print">("download");

  // Load theme preference and analysis data from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setIsDark(true);
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
      root.style.backgroundColor = "#202124"; // Google Dark Background
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.backgroundColor = "#f8f9fa"; // Google Light Background
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
      ],
      "Cloud Engineer Intern": [
        { q: "Explain the core differences between horizontal and vertical scaling in AWS/GCP. When is horizontal scaling preferred?", category: "Cloud Scaling" },
        { q: "What are security groups vs network ACLs in a virtual private cloud (VPC)? How do they secure network traffic?", category: "Cloud Network Security" },
        { q: "What is Serverless computing (e.g. AWS Lambda)? Discuss the benefits and the classic 'cold start' performance trade-off.", category: "Serverless Architectures" }
      ],
      "DevOps Intern": [
        { q: "What is containerization? Contrast the resource efficiency and isolation of Docker containers vs traditional Virtual Machines.", category: "Containerization" },
        { q: "What is Git Rebase vs Git Merge? In what development workflow scenarios would you advise a team to use rebase?", category: "Version Control" },
        { q: "Explain the purpose of a Continuous Integration (CI) server. What tasks should be automated during every pull request?", category: "Continuous Integration" }
      ],
      "Software Engineer (Full-Time)": [
        { q: "Explain how you would design a highly available, distributed rate limiter (e.g. token bucket) to protect an API gateway.", category: "System Design" },
        { q: "How does the virtual memory system map pages to physical frames? Explain page faults and translation lookaside buffers (TLB).", category: "OS Memory Management" },
        { q: "Contrast optimistic concurrency control with pessimistic locking. In what database transaction environments is Suited?", category: "Concurrency Controls" }
      ],
      "Machine Learning Engineer": [
        { q: "What is the difference between data parallelism and model parallelism when training large deep learning architectures (e.g. Transformers) across GPUs?", category: "Distributed Deep Learning" },
        { q: "Explain the bias-variance trade-off. How do techniques like dropout, early stopping, and weight decay prevent overfitting?", category: "Model Regularization" },
        { q: "How do you deploy and monitor ML models in production? Discuss feature stores and drift detection (concept vs data drift).", category: "MLOps & Deployments" }
      ],
      "Data Science Engineer": [
        { q: "Explain the difference between supervised, unsupervised, and semi-supervised learning. When would you use a Random Forest vs a Gradient Boosted Tree?", category: "Machine Learning Algorithms" },
        { q: "Describe how you would design an A/B test for a new landing page. How do you calculate sample size and statistical power?", category: "Experimentation & Stats" },
        { q: "What are the standard database normal forms (1NF, 2NF, 3NF)? When is denormalization preferred in a data warehouse environment?", category: "Data Warehousing" }
      ],
      "Cloud Engineer": [
        { q: "Explain the core difference between horizontal and vertical scaling. How does load balancing handle stateful user sessions?", category: "Cloud Infrastructure" },
        { q: "What is Infrastructure as Code (IaC)? Contrast declarative tools like Terraform with imperative tools like AWS CDK or shell scripts.", category: "IaC & Terraform" },
        { q: "Describe the shared responsibility model in cloud platforms (e.g. AWS or GCP). Who is responsible for patching guest operating systems vs hypervisors?", category: "Cloud Platform Security" }
      ],
      "Full Stack Developer": [
        { q: "Explain how WebSockets facilitate full-duplex communication. How would you scale a real-time chat application to handle 100k active connections?", category: "Real-Time Systems" },
        { q: "Describe the architectural difference between REST and GraphQL. In what frontend rendering scenarios is GraphQL preferred?", category: "API Architectures" },
        { q: "How do security risks like CSRF (Cross-Site Request Forgery) differ from XSS (Cross-Site Scripting)? How do you mitigate them in Next.js?", category: "Application Security" }
      ],
      "DevOps Engineer": [
        { q: "Explain the containerization model of Docker vs Virtual Machines. How does Kubernetes manage namespace routing and pod lifecycles?", category: "Containers & Kubernetes" },
        { q: "Describe a modern CI/CD pipeline flow. How do you implement canary deployments or blue-green updates to achieve zero-downtime releases?", category: "CI/CD Workflows" },
        { q: "Explain the concepts of GitOps and continuous deployment. How do tools like ArgoCD or Flux verify active state alignment?", category: "GitOps Infrastructure" }
      ],
      "Data Analyst (Full-Time)": [
        { q: "What is the difference between an OLTP and an OLAP database schema? Contrast star schemas with snowflake schemas for analytical pipelines.", category: "Data Architecture" },
        { q: "Explain statistical correlation vs causation. How would you handle variables that demonstrate multicollinearity in a regression analysis?", category: "Quantitative Analysis" },
        { q: "Describe how window functions in SQL (like PARTITION BY and DENSE_RANK) differ from standard GROUP BY aggregations.", category: "Advanced SQL Queries" }
      ],
      "Cybersecurity Engineer": [
        { q: "What is the OWASP Top 10? Explain SQL Injection, Cross-Site Scripting (XSS), and how to defend against them using proper inputs and security headers.", category: "Web Security" },
        { q: "Describe how public key cryptography (RSA/ECC) works. How does TLS establish a secure session between a client and a server?", category: "Cryptography & TLS" },
        { q: "Explain the concept of Zero Trust architecture. How do you implement access controls and least privilege in an enterprise network?", category: "Network Security" }
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
    const root = window.document.documentElement;
    if (exportAction === "download") {
      root.classList.add("print-digital-theme");
    } else {
      root.classList.remove("print-digital-theme");
    }
    
    // Trigger native print workflow
    window.print();
    
    // Clean up class after dialog opens to prevent style leakage
    setTimeout(() => {
      root.classList.remove("print-digital-theme");
    }, 1000);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-[#202124]" : "bg-zinc-50"
      }`}>
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-[#1a73e8] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
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
        isDark ? "bg-[#202124]" : "bg-zinc-50"
      }`}>
        <div className="w-14 h-14 rounded-full bg-red-950/20 border border-red-800/40 flex items-center justify-center mb-4 text-xl">
          ⚠️
        </div>
        <h2 className={`text-xl font-bold mb-1.5 ${isDark ? "text-white" : "text-zinc-900"}`}>
          Evaluation Record Expired
        </h2>
        <p className={`max-w-xs mb-6 text-xs leading-relaxed ${isDark ? "text-zinc-550" : "text-zinc-650"}`}>
          No analysis result was found for this session identifier. Run a fresh assessment from the home terminal.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-full transition shadow-sm"
        >
          Return Home
        </button>
      </div>
    );
  }

  const score = data.readiness_score;
  const inferredRole = data.targetRole || "Software Engineer Intern";

  let scoreColor = "#34a853"; // Google Green (70+)
  let scoreBg = "bg-[#34a853]/10";
  let scoreBorder = "border-[#34a853]/25";
  let scoreText = "text-[#34a853] dark:text-[#81c784]";

  if (score < 40) {
    scoreColor = "#ea4335"; // Google Red
    scoreBg = "bg-[#ea4335]/10";
    scoreBorder = "border-[#ea4335]/25";
    scoreText = "text-[#ea4335] dark:text-[#e57373]";
  } else if (score < 70) {
    scoreColor = "#fbbc05"; // Google Yellow
    scoreBg = "bg-[#fbbc05]/10";
    scoreBorder = "border-[#fbbc05]/25";
    scoreText = "text-[#fbbc05] dark:text-[#ffd54f]";
  }

  // Circular progress calculations: radius=42, circumference = 2 * PI * 42 = 263.89
  const circ = 263.89;
  const strokeOffset = circ - (circ * score) / 100;

  // Recharts target data
  const chartData = [
    { name: "Your score", score: score, fill: scoreColor },
    { name: "Baseline standard", score: 80, fill: "#1a73e8" },
  ];

  // Dynamic interview questions
  const computedQuestions = getInterviewQuestions(inferredRole, data.missing_critical_skills);

  return (
    <div className={`relative min-h-screen flex flex-col justify-between overflow-x-hidden transition-colors duration-250 ${
      isDark ? "bg-[#202124] text-[#e8eaed] font-sans" : "bg-[#f8f9fa] text-[#3c4043] font-sans"
    }`}>
      
      {/* Top Navbar */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors no-print ${
        isDark ? "border-[#3c4043] bg-[#202124]/90" : "border-[#dadce0] bg-white/90 shadow-sm"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <svg viewBox="0 0 100 100" className={`w-8 h-8 shrink-0 ${
              isDark ? "stroke-white" : "stroke-[#202124]"
            }`} fill="none" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M46 16 L20 78" />
              <path d="M46 16 L65 72" />
              <path d="M33 52 L57 52" />
              <path d="M57 52 L57 78" />
              <path d="M48 32 C68 28, 80 38, 77 52 C75 64, 66 68, 57 52" />
            </svg>
            <span className={`text-md font-bold tracking-tight ${
              isDark ? "text-white" : "text-[#202124]"
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
                  ? "bg-[#2d2d30] border-[#3c4043] text-amber-400 hover:bg-[#3c4043]"
                  : "bg-white border-[#dadce0] text-[#5f6368] hover:bg-[#dadce0] shadow-sm"
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

            {/* Back Home */}
            <button
              onClick={() => router.push("/")}
              className={`text-xs font-bold px-4 py-2.5 rounded-full border transition ${
                isDark ? "bg-[#2d2d30] border-[#3c4043] hover:bg-[#3c4043] text-zinc-300" : "bg-white border-[#dadce0] hover:bg-zinc-50 text-[#3c4043] shadow-sm"
              }`}
            >
              ← Terminals
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8 animate-fade-in">
        
        {/* EXECUTIVE INTRO HEADER BLOCK */}
        <section className={`border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 print-card ${
          isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
        }`}>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[9px] font-bold tracking-wider border bg-[#1a73e8]/5 dark:bg-[#1a73e8]/10 border-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] mb-3">
              Placement Telemetry Scorecard
            </span>
            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-[#202124]"}`}>
              Placement Readiness Evaluation
            </h1>
            <p className={`text-xs mt-1.5 max-w-xl leading-relaxed ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
              Target Role: **{inferredRole}**. Calculated by analyzing technical credentials alongside public software indices.
            </p>
          </div>
        </section>

        {/* SECTION 1: OVERALL READINESS SCORE METRIC */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Circular progress */}
          <div className={`lg:col-span-4 border rounded-2xl p-6 flex flex-col items-center justify-center print-card ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 ${isDark ? "text-zinc-450" : "text-[#5f6368]"}`}>
              Assessment Score Index
            </h3>
            
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="42"
                  stroke={isDark ? "#1f1f23" : "#e4e4e7"}
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="42"
                  stroke={scoreColor}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circ}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-extrabold ${isDark ? "text-white" : "text-[#202124]"}`}>{score}</span>
                <span className={`text-[8px] tracking-wider font-bold uppercase ${isDark ? "text-zinc-500" : "text-[#5f6368]"}`}>
                  INDEX
                </span>
              </div>
            </div>

            <span className={`mt-5 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${scoreBg} ${scoreBorder} ${scoreText}`}>
              {data.readiness_label}
            </span>
          </div>

          {/* Right panel: Executive Insights */}
          <div className={`lg:col-span-8 border rounded-2xl p-6 md:p-8 flex flex-col gap-6 print-card ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-[#5f6368]"}`}>
              Assessment Highlights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#1a73e8] dark:text-[#8ab4f8] mb-1.5">
                  📄 Credential Audit
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-[#5f6368]"}`}>
                  {data.resume_summary}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#34a853] dark:text-[#81c784] mb-1.5">
                  💻 Verification Indices
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-[#5f6368]"}`}>
                  {data.github_summary}
                </p>
              </div>
            </div>

            <div className={`border-t pt-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-[10px] leading-relaxed italic ${
              isDark ? "border-[#3c4043] text-zinc-500" : "border-[#dadce0] text-zinc-450"
            }`}>
              <span>Verified using advanced placement analytics.</span>
              <span>Date: {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: SKILL GAP & HISTOGRAM COMPARISON */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Have vs Need */}
          <div className={`lg:col-span-7 border rounded-2xl p-6 flex flex-col justify-between print-card ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
          }`}>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-5 ${isDark ? "text-zinc-450" : "text-[#5f6368]"}`}>
                Analyzed Skill Matrix
              </h3>

              <div className="space-y-4">
                <div className={`border rounded-xl p-4 ${isDark ? "bg-[#202124]/40 border-[#3c4043]" : "bg-[#f8f9fa] border-[#dadce0]"}`}>
                  <h4 className="text-[10px] font-bold text-[#34a853] dark:text-[#81c784] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span>✓</span> Verified Core Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {data.matched_skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded bg-[#34a853]/10 border border-[#34a853]/15 text-[#34a853]"
                      >
                        {sk}
                      </span>
                    ))}
                    {data.matched_skills.length === 0 && (
                      <span className="text-[10px] text-zinc-500 italic">No matching indices isolated.</span>
                    )}
                  </div>
                </div>

                <div className={`border rounded-xl p-4 ${isDark ? "bg-[#202124]/40 border-[#3c4043]" : "bg-[#f8f9fa] border-[#dadce0]"}`}>
                  <h4 className="text-[10px] font-bold text-[#ea4335] dark:text-[#e57373] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span>⚠️</span> Identified Skill Deficiencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {data.missing_critical_skills.map((sk, idx) => (
                      <span
                        key={`crit-${idx}`}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded bg-[#ea4335]/10 border border-[#ea4335]/15 text-[#ea4335]"
                      >
                        {sk} (Required)
                      </span>
                    ))}
                    {data.missing_nice_to_have.map((sk, idx) => (
                      <span
                        key={`nice-${idx}`}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded bg-[#fbbc05]/10 border border-[#fbbc05]/15 text-[#fbbc05] dark:text-[#ffd54f]"
                      >
                        {sk} (Recommended)
                      </span>
                    ))}
                    {data.missing_critical_skills.length === 0 && data.missing_nice_to_have.length === 0 && (
                      <span className="text-[10px] text-zinc-500 italic">Skill matrix aligned. Deficiencies not detected.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className={`text-[10px] italic mt-4 ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
              * Skill gaps should occupy prioritized roadmap schedules.
            </p>
          </div>

          {/* Right panel: Recharts Histogram */}
          <div className={`lg:col-span-5 border rounded-2xl p-6 flex flex-col justify-between print-card ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
          }`}>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-5 ${isDark ? "text-zinc-450" : "text-[#5f6368]"}`}>
                Industry Baseline Comparison
              </h3>
              
              <div className="w-full h-40">
                {isClient ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 100]} stroke={isDark ? "#5f6368" : "#dadce0"} style={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" stroke={isDark ? "#5f6368" : "#dadce0"} width={80} style={{ fontSize: 9 }} />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{
                          backgroundColor: isDark ? "#2d2d30" : "#ffffff",
                          borderColor: isDark ? "#3c4043" : "#dadce0",
                          borderRadius: "8px",
                          fontSize: 11,
                          color: isDark ? "#e8eaed" : "#202124",
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
                    Structuring indicators...
                  </div>
                )}
              </div>
            </div>

            <p className={`text-[10px] leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-450"}`}>
              Optimal baseline baseline benchmark lies at **80 points**. Deficit markers suggest specific study focuses prior to applying.
            </p>
          </div>
        </section>

        {/* SECTION 3: STRENGTHS & WEAKNESSES */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths Card */}
          <div className={`border rounded-2xl p-6 print-card ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#34a853] dark:text-[#81c784] mb-4 flex items-center gap-1.5">
              <span>🚀</span> Key Professional Strengths
            </h3>
            <ul className="space-y-3.5">
              {data.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#34a853] font-bold shrink-0 text-xs">•</span>
                  <span className={`text-xs leading-relaxed ${isDark ? "text-zinc-350" : "text-[#5f6368]"}`}>{str}</span>
                </li>
              ))}
              {data.strengths.length === 0 && (
                <li className="text-xs text-zinc-500 italic">No specific strengths isolated.</li>
              )}
            </ul>
          </div>

          {/* Weaknesses Card */}
          <div className={`border rounded-2xl p-6 print-card ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ea4335] dark:text-[#e57373] mb-4 flex items-center gap-1.5">
              <span>⚠️</span> Target Growth deficts
            </h3>
            <ul className="space-y-3.5">
              {data.weaknesses.map((weak, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#ea4335] font-bold shrink-0 text-xs">•</span>
                  <span className={`text-xs leading-relaxed ${isDark ? "text-zinc-350" : "text-[#5f6368]"}`}>{weak}</span>
                </li>
              ))}
              {data.weaknesses.length === 0 && (
                <li className="text-xs text-zinc-500 italic">No structural deficts identified.</li>
              )}
            </ul>
          </div>
        </section>

        {/* SECTION 4: PRIORITY RECOMMENDED LEARNING PATHS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.top_3_priorities.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className={`border rounded-2xl p-6 flex flex-col justify-between print-card ${
                isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
              }`}
            >
              <div>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold mb-4 ${
                  isDark ? "bg-[#1a73e8]/10 text-[#8ab4f8] border border-[#1a73e8]/20" : "bg-[#1a73e8]/5 text-[#1a73e8] border border-[#1a73e8]/10"
                }`}>
                  0{idx + 1}
                </span>
                <h3 className={`text-md font-bold mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>{item.skill}</h3>
                <p className={`text-xs leading-relaxed mb-6 ${isDark ? "text-zinc-400" : "text-[#5f6368]"}`}>
                  {item.reason}
                </p>
              </div>

              <div className={`pt-3.5 border-t text-[10px] flex items-center gap-1.5 font-mono ${
                isDark ? "border-[#3c4043] text-[#8ab4f8]" : "border-[#dadce0] text-[#1a73e8]"
              }`}>
                <span className="font-bold uppercase tracking-wider shrink-0 text-zinc-550">Resource:</span>
                <span className="truncate" title={item.resource}>{item.resource}</span>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 5: SKILL ROADMAP TABS */}
        <section className={`border rounded-2xl p-6 md:p-8 print-card ${
          isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
        }`}>
          <h2 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-[#202124]"}`}>
            <span className="text-[#1a73e8] dark:text-[#8ab4f8]">03</span> Learning & Strategic Roadmap
          </h2>

          {/* Tab buttons - Hidden in Print */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 border-b pb-4 border-[#dadce0] dark:border-[#3c4043] no-print">
            <button
              onClick={() => setActiveRoadmapTab("week_1_2")}
              className={`py-3 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "week_1_2"
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : isDark
                  ? "bg-[#202124] text-zinc-400 border border-[#3c4043] hover:text-white"
                  : "bg-white text-zinc-650 border border-[#dadce0] hover:text-zinc-900 shadow-sm"
              }`}
            >
              Weeks 1-2
            </button>
            <button
              onClick={() => setActiveRoadmapTab("month_1")}
              className={`py-3 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "month_1"
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : isDark
                  ? "bg-[#202124] text-zinc-400 border border-[#3c4043] hover:text-white"
                  : "bg-white text-zinc-655 border border-[#dadce0] hover:text-zinc-900 shadow-sm"
              }`}
            >
              Month 1
            </button>
            <button
              onClick={() => setActiveRoadmapTab("month_2")}
              className={`py-3 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "month_2"
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : isDark
                  ? "bg-[#202124] text-zinc-400 border border-[#3c4043] hover:text-white"
                  : "bg-white text-zinc-655 border border-[#dadce0] hover:text-zinc-900 shadow-sm"
              }`}
            >
              Month 2
            </button>
            <button
              onClick={() => setActiveRoadmapTab("month_3")}
              className={`py-3 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                activeRoadmapTab === "month_3"
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : isDark
                  ? "bg-[#202124] text-zinc-400 border border-[#3c4043] hover:text-white"
                  : "bg-white text-zinc-655 border border-[#dadce0] hover:text-zinc-900 shadow-sm"
              }`}
            >
              Month 3
            </button>
          </div>

          {/* Dashboard Tab Content - Screen */}
          <div className="no-print">
            <div className={`border rounded-xl p-5 md:p-6 transition-all duration-300 ${
              isDark ? "bg-[#202124]/40 border-[#3c4043]" : "bg-[#f8f9fa] border-[#dadce0]"
            }`}>
              {activeRoadmapTab === "week_1_2" && data.roadmap.week_1_2 && (
                <div>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b ${isDark ? "border-[#3c4043]" : "border-[#dadce0]"}`}>
                    <div>
                      <span className={`text-[9px] tracking-widest font-bold uppercase block ${isDark ? "text-zinc-500" : "text-[#5f6368]"}`}>
                        Onboarding targets
                      </span>
                      <h3 className={`text-md font-bold mt-0.5 ${isDark ? "text-white" : "text-[#202124]"}`}>
                        {data.roadmap.week_1_2.focus}
                      </h3>
                    </div>
                    <div className="bg-[#1a73e8]/10 border border-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] text-[10px] font-bold py-1.5 px-3 rounded-full shrink-0 w-fit">
                      ⏰ {data.roadmap.week_1_2.hours_per_day} hours/day study guide
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.roadmap.week_1_2.tasks.map((task, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-[#3c4043]"}`}>
                        <span className="text-[#1a73e8] mt-1 shrink-0">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeRoadmapTab === "month_1" && data.roadmap.month_1 && (
                <div>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b ${isDark ? "border-[#3c4043]" : "border-[#dadce0]"}`}>
                    <div>
                      <span className={`text-[9px] tracking-widest font-bold uppercase block ${isDark ? "text-zinc-500" : "text-[#5f6368]"}`}>
                        First month goals
                      </span>
                      <h3 className={`text-md font-bold mt-0.5 ${isDark ? "text-white" : "text-[#202124]"}`}>
                        {data.roadmap.month_1.focus}
                      </h3>
                    </div>
                    <div className="bg-[#34a853]/10 border border-[#34a853]/20 text-[#34a853] dark:text-[#81c784] text-[10px] font-bold py-1.5 px-3 rounded-full shrink-0 w-fit">
                      🎯 Milestone: {data.roadmap.month_1.milestone}
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.roadmap.month_1.tasks.map((task, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-[#3c4043]"}`}>
                        <span className="text-[#1a73e8] mt-1 shrink-0">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeRoadmapTab === "month_2" && data.roadmap.month_2 && (
                <div>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b ${isDark ? "border-[#3c4043]" : "border-[#dadce0]"}`}>
                    <div>
                      <span className={`text-[9px] tracking-widest font-bold uppercase block ${isDark ? "text-zinc-500" : "text-[#5f6368]"}`}>
                        Second month goals
                      </span>
                      <h3 className={`text-md font-bold mt-0.5 ${isDark ? "text-white" : "text-[#202124]"}`}>
                        {data.roadmap.month_2.focus}
                      </h3>
                    </div>
                    <div className="bg-[#34a853]/10 border border-[#34a853]/20 text-[#34a853] dark:text-[#81c784] text-[10px] font-bold py-1.5 px-3 rounded-full shrink-0 w-fit">
                      🎯 Milestone: {data.roadmap.month_2.milestone}
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.roadmap.month_2.tasks.map((task, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-[#3c4043]"}`}>
                        <span className="text-[#1a73e8] mt-1 shrink-0">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeRoadmapTab === "month_3" && data.roadmap.month_3 && (
                <div>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b ${isDark ? "border-[#3c4043]" : "border-[#dadce0]"}`}>
                    <div>
                      <span className={`text-[9px] tracking-widest font-bold uppercase block ${isDark ? "text-zinc-500" : "text-[#5f6368]"}`}>
                        Third month goals
                      </span>
                      <h3 className={`text-md font-bold mt-0.5 ${isDark ? "text-white" : "text-[#202124]"}`}>
                        {data.roadmap.month_3.focus}
                      </h3>
                    </div>
                    <div className="bg-[#34a853]/10 border border-[#34a853]/20 text-[#34a853] dark:text-[#81c784] text-[10px] font-bold py-1.5 px-3 rounded-full shrink-0 w-fit">
                      🎯 Milestone: {data.roadmap.month_3.milestone}
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.roadmap.month_3.tasks.map((task, i) => (
                      <li key={i} className={`text-xs flex items-start gap-2.5 ${isDark ? "text-zinc-300" : "text-[#3c4043]"}`}>
                        <span className="text-[#1a73e8] mt-1 shrink-0">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sequential roadmap - Dynamic print PDF styling */}
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

        {/* SECTION 6: INTERVIEW PREPARATION MODULE */}
        <section className={`border rounded-2xl p-6 md:p-8 print-card ${
          isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
        }`}>
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[9px] font-bold tracking-wider border bg-[#1a73e8]/5 dark:bg-[#1a73e8]/10 border-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] mb-3">
              Assessment Prep Simulator
            </span>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-[#202124]"}`}>
              🎯 Targeted Interview Preparation Questions
            </h2>
            <p className={`text-xs mt-1.5 ${isDark ? "text-[#9aa0a6]" : "text-[#5f6368]"}`}>
              Custom software engineering screening prompts generated to test your specific deficiency gap categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {computedQuestions.map((qObj, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-5 flex flex-col justify-between ${
                  isDark ? "bg-[#202124]/40 border-[#3c4043]" : "bg-[#f8f9fa] border-[#dadce0] shadow-sm"
                }`}
              >
                <div className="mb-4">
                  <span className={`text-[8px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isDark ? "bg-zinc-800 text-[#8ab4f8] border-zinc-700" : "bg-[#1a73e8]/5 text-[#1a73e8] border-[#1a73e8]/10"
                  }`}>
                    {qObj.category}
                  </span>
                  <p className={`text-xs leading-relaxed font-bold mt-3 ${isDark ? "text-zinc-200" : "text-[#202124]"}`}>
                    "{qObj.q}"
                  </p>
                </div>
                <div className={`pt-3 border-t text-[9px] ${isDark ? "border-[#3c4043] text-zinc-500" : "border-zinc-200 text-[#5f6368]"}`}>
                  * Formulate structural practice responses using STAR alignment.
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 7: RECOMMENDED PRACTICAL PROJECTS */}
        <section className={`border rounded-2xl p-6 md:p-8 print-card ${
          isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
        }`}>
          <h2 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? "text-white" : "text-[#202124]"}`}>
            <span className="text-[#1a73e8] dark:text-[#8ab4f8]">04</span> Recommended Audited Projects
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.project_suggestions.slice(0, 3).map((proj, idx) => {
              let diffColor = "bg-[#34a853]/10 text-[#34a853] border-[#34a853]/20";
              if (proj.difficulty.toLowerCase() === "medium") {
                diffColor = "bg-[#fbbc05]/10 text-[#fbbc05] border-[#fbbc05]/20 dark:text-[#ffd54f]";
              } else if (proj.difficulty.toLowerCase() === "hard") {
                diffColor = "bg-[#ea4335]/10 text-[#ea4335] border-[#ea4335]/20";
              }

              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-5 flex flex-col justify-between ${
                    isDark ? "bg-[#202124]/30 border-[#3c4043]" : "bg-[#f8f9fa] border-[#dadce0] shadow-sm"
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

                    <h3 className={`text-xs md:text-sm font-bold mb-2 ${isDark ? "text-white" : "text-[#202124]"}`}>{proj.name}</h3>
                    <p className={`text-[11px] leading-relaxed mb-5 ${isDark ? "text-zinc-400" : "text-[#5f6368]"}`}>
                      {proj.description}
                    </p>
                  </div>

                  <div className={`pt-3.5 border-t ${isDark ? "border-[#3c4043]" : "border-[#dadce0]"}`}>
                    <div className="flex flex-wrap gap-1">
                      {proj.skills_practiced.map((sk, index) => (
                        <span
                          key={index}
                          className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                            isDark
                              ? "bg-zinc-900 text-zinc-400 border-zinc-800"
                              : "bg-white text-zinc-650 border-[#dadce0]"
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
            ? "from-[#1a73e8]/10 via-[#34a853]/5 to-transparent border-[#3c4043] bg-gradient-to-r"
            : "from-[#1a73e8]/5 via-[#34a853]/3 to-transparent border-[#dadce0] bg-gradient-to-r"
        }`}>
          <h2 className="text-xs font-bold tracking-wider text-[#1a73e8] dark:text-[#8ab4f8] uppercase mb-4 animate-pulse">
            Auditing Executive Summary
          </h2>
          <p className={`text-sm leading-relaxed mb-5 italic ${isDark ? "text-zinc-200" : "text-[#202124] font-medium"}`}>
            "{data.executive_summary}"
          </p>
          <div className={`rounded-xl border p-4 mb-6 ${
            isDark ? "bg-[#2d2d30] border-[#3c4043]" : "bg-white border-[#dadce0] shadow-sm"
          }`}>
            <h4 className={`text-[10px] font-bold mb-1 flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-[#5f6368]"}`}>
              <span>💡</span> Coach's Encouragement
            </h4>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-[#5f6368]"}`}>
              {data.encouragement}
            </p>
          </div>

          {/* Interactive Print & Download Control Card */}
          <div className="flex justify-center gap-4 no-print flex-col sm:flex-row mb-6">
            <button
              onClick={() => router.push("/")}
              className={`font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-full transition-all shadow-sm active:scale-95 border ${
                isDark
                  ? "bg-[#202124] hover:bg-[#3c4043] text-white border-[#3c4043]"
                  : "bg-white hover:bg-zinc-150 text-[#3c4043] border-[#dadce0]"
              }`}
            >
              🔄 Analyze Another Profile
            </button>
            <button
              onClick={() => setShowExportPanel(!showExportPanel)}
              className={`font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-full transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 ${
                showExportPanel
                  ? "bg-[#ea4335] hover:bg-[#d93025] text-white"
                  : "bg-[#1a73e8] hover:bg-[#1557b0] text-white"
              }`}
            >
              <span>🖨</span> {showExportPanel ? "Hide Export Options" : "Print & Download"}
            </button>
          </div>

          {/* Smooth Expanding Export Panel */}
          {showExportPanel && (
            <div className={`mb-6 p-5 rounded-2xl border transition-all duration-300 animate-fade-in no-print text-left ${
              isDark ? "bg-[#2d2d30] border-[#3c4043] shadow-lg" : "bg-white border-[#dadce0] shadow-md"
            }`}>
              <div className="mb-4">
                <h4 className={`text-sm font-bold tracking-tight ${isDark ? "text-white" : "text-[#202124]"}`}>
                  Configure Export Settings
                </h4>
                <p className={`text-xs mt-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  Customize the format for saving or printing your Career Telemetry Report.
                </p>
              </div>

              {/* Segmented Control Toggle Pill */}
              <div className={`p-1 rounded-full flex gap-1 mb-4 ${
                isDark ? "bg-[#202124]" : "bg-zinc-100"
              }`}>
                <button
                  type="button"
                  onClick={() => setExportAction("download")}
                  className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    exportAction === "download"
                      ? isDark
                        ? "bg-[#1a73e8] text-white shadow-md"
                        : "bg-white text-[#1a73e8] shadow-sm"
                      : isDark
                        ? "text-zinc-400 hover:text-white"
                        : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <span>📥</span> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setExportAction("print")}
                  className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    exportAction === "print"
                      ? isDark
                        ? "bg-[#34a853] text-white shadow-md"
                        : "bg-white text-[#34a853] shadow-sm"
                      : isDark
                        ? "text-zinc-400 hover:text-white"
                        : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <span>🖨</span> Print PDF
                </button>
              </div>

              {/* Dynamic Tip Message */}
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 mb-5 ${
                exportAction === "download"
                  ? isDark
                    ? "bg-[#1a73e8]/10 border-[#1a73e8]/25 text-[#8ab4f8]"
                    : "bg-[#1a73e8]/5 border-[#1a73e8]/20 text-[#1a73e8]"
                  : isDark
                    ? "bg-[#34a853]/10 border-[#34a853]/25 text-[#81c784]"
                    : "bg-[#34a853]/5 border-[#34a853]/20 text-[#34a853]"
              }`}>
                <span className="text-sm">💡</span>
                <div>
                  <p className="font-bold">
                    {exportAction === "download" ? "Save Digitally (Dashboard Theme)" : "Physical Printer Friendly (Ink-Saver)"}
                  </p>
                  <p className={`mt-0.5 text-[11px] ${isDark ? "text-zinc-350" : "text-zinc-650"}`}>
                    {exportAction === "download"
                      ? "Generates a gorgeous full-color dashboard document preserving your dark/light modes. Simply select 'Save as PDF' as the destination in the print screen."
                      : "Strips background fills and uses pure white base styles with optimized dark high-contrast typography, perfect for physical printing to standard A4 paper without wasting ink."}
                  </p>
                </div>
              </div>

              {/* Export Trigger Button */}
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowExportPanel(false)}
                  className={`text-xs font-bold px-4 py-2 rounded-full border transition ${
                    isDark ? "border-[#3c4043] text-zinc-300 hover:bg-[#3c4043]" : "border-[#dadce0] text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className={`text-xs font-bold px-6 py-2 rounded-full text-white shadow-sm active:scale-95 transition flex items-center gap-1.5 ${
                    exportAction === "download"
                      ? "bg-[#1a73e8] hover:bg-[#1557b0]"
                      : "bg-[#34a853] hover:bg-[#2c8c47]"
                  }`}
                >
                  {exportAction === "download" ? (
                    <>
                      <span>📥</span> Proceed to Download
                    </>
                  ) : (
                    <>
                      <span>🖨</span> Proceed to Print
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t transition-colors no-print ${
        isDark ? "border-[#3c4043] bg-[#202124] text-zinc-500" : "border-[#dadce0] bg-[#f8f9fa] text-[#5f6368]"
      } py-6 text-center text-xs mt-10`}>
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
                Evaluations, scores, roadmaps, and suggestions are AI-generated based on specific candidate parameters and public data sets. The reports function as a preparatory guide and do not guarantee recruitment outcomes.
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
