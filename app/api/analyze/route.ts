import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, githubUsername, targetRole, sessionId } = body;

    if (githubUsername === "mock-rate-limit") {
      return NextResponse.json(
        {
          error: "API rate limit exceeded. Multiple users are running analyses simultaneously, exceeding the Gemini API free-tier threshold.",
          details: "Resource has been exhausted (e.g. API quota limit reached).",
          isRateLimit: true,
          isOverload: false,
          cooldownSeconds: 45
        },
        { status: 429 }
      );
    }
    if (githubUsername === "mock-overload") {
      return NextResponse.json(
        {
          error: "API service is overloaded. Gemini model servers are currently experiencing high request volumes. API is cooling down.",
          details: "Service Unavailable (503 Overload).",
          isRateLimit: false,
          isOverload: true,
          cooldownSeconds: 45
        },
        { status: 503 }
      );
    }

    if (!resumeText || !githubUsername || !targetRole) {
      return NextResponse.json(
        { error: "Missing required fields: resumeText, githubUsername, and targetRole are all required." },
        { status: 400 }
      );
    }

    // 1. Fetch GitHub data via REST API
    let publicReposCount = 0;
    let topLanguages: string[] = [];
    let recentRepos: { name: string; description: string; language: string }[] = [];
    let githubFound = false;

    try {
      const userRes = await fetch(`https://api.github.com/users/${githubUsername}`, {
        headers: {
          "User-Agent": "CareerAI-Placement-Readiness-App",
        },
        next: { revalidate: 3600 } // Cache results for 1 hour
      });

      if (userRes.ok) {
        const userJson = await userRes.ok ? await userRes.json() : null;
        if (userJson) {
          publicReposCount = userJson.public_repos || 0;
          githubFound = true;
        }

        const reposRes = await fetch(
          `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=5`,
          {
            headers: {
              "User-Agent": "CareerAI-Placement-Readiness-App",
            },
            next: { revalidate: 3600 }
          }
        );

        if (reposRes.ok) {
          const reposJson = await reposRes.json();
          recentRepos = reposJson.map((repo: any) => ({
            name: repo.name,
            description: repo.description || "No description provided",
            language: repo.language || "Unknown",
          }));

          const languagesMap: Record<string, number> = {};
          reposJson.forEach((repo: any) => {
            if (repo.language) {
              languagesMap[repo.language] = (languagesMap[repo.language] || 0) + 1;
            }
          });

          topLanguages = Object.entries(languagesMap)
            .sort((a, b) => b[1] - a[1])
            .map(([lang]) => lang)
            .slice(0, 5);
        }
      }
    } catch (gitErr) {
      console.error("Warning: GitHub retrieval failed, continuing with empty github dataset.", gitErr);
    }

    // 2. Format Prompt and System Instructions for Gemini 2.5 Flash
    const rawApiKeyStr = process.env.GEMINI_API_KEY || "";
    const apiKeys = rawApiKeyStr
      .split(",")
      .map(k => k.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);

    if (apiKeys.length === 0) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server. Please check your environment variables." },
        { status: 500 }
      );
    }

    const truncatedResume = resumeText.slice(0, 2000);
    const languagesList = topLanguages.length > 0 ? topLanguages.join(", ") : "None detected";
    const recentReposList = recentRepos.length > 0
      ? recentRepos.map((r) => `${r.name}: ${r.description} (${r.language})`).join("\n")
      : "No public repositories found or username does not exist.";

    const userPrompt = `Analyze this candidate applying for ${targetRole}.

RESUME TEXT:
${truncatedResume}

GITHUB DATA:
Username: ${githubUsername}
Found: ${githubFound ? "Yes" : "No (using fallback empty values)"}
Public repos: ${publicReposCount}
Top languages: ${languagesList}
Recent repos:
${recentReposList}

Return ONLY this JSON with ALL fields filled:
{
  "readiness_score": number (0-100),
  "resume_summary": string (2-3 sentences about the candidate),
  "github_summary": string (2-3 sentences about their GitHub),
  "matched_skills": string[] (skills they already have for the role),
  "missing_critical_skills": string[] (must-have skills they lack),
  "missing_nice_to_have": string[] (good-to-have skills they lack),
  "strengths": string[] (3-4 specific strengths),
  "weaknesses": string[] (2-3 honest gaps),
  "top_3_priorities": [{ "skill": string, "reason": string, "resource": string }],
  "roadmap": {
    "week_1_2": { "focus": string, "tasks": string[], "hours_per_day": number },
    "month_1": { "focus": string, "tasks": string[], "milestone": string },
    "month_2": { "focus": string, "tasks": string[], "milestone": string },
    "month_3": { "focus": string, "tasks": string[], "milestone": string }
  },
  "project_suggestions": [
    { "name": string, "description": string, "skills_practiced": string[], "difficulty": string, "days_to_build": number }
  ],
  "executive_summary": string (3-4 sentences final assessment),
  "encouragement": string (personalized motivating message),
  "readiness_label": "Beginner" | "Developing" | "Ready" | "Strong"
}`;

    // 3. Make request to Gemini with automatic Key Rotation
    let responseText = "";
    let lastError: any = null;
    const errors: any[] = [];

    for (let i = 0; i < apiKeys.length; i++) {
      const activeKey = apiKeys[i];
      try {
        console.log(`Attempting analysis with Gemini API key ${i + 1}/${apiKeys.length}...`);
        const genAI = new GoogleGenerativeAI(activeKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
          },
          systemInstruction:
            "You are a senior technical recruiter and expert career advisor. Always respond with ONLY valid JSON. Never add markdown code fences, explanations, or any text before or after the JSON object.",
        });

        const result = await model.generateContent(userPrompt);
        const text = result.response.text();
        if (text && text.trim()) {
          responseText = text;
          console.log(`Success! Gemini request resolved with key index ${i + 1}.`);
          break;
        }
      } catch (err: any) {
        console.warn(`Gemini key index ${i + 1} failed:`, err.message || err);
        errors.push(err);
        lastError = err;
      }
    }

    if (!responseText) {
      // Analyze errors to see if rate limit or overload happened
      let isRateLimit = false;
      let isOverload = false;

      const checkErrorType = (err: any) => {
        const msg = String(err?.message || err).toLowerCase();
        const status = err?.status || err?.statusCode || 0;

        if (
          status === 429 ||
          msg.includes("429") ||
          msg.includes("quota") ||
          msg.includes("limit") ||
          msg.includes("exhausted") ||
          msg.includes("resource_exhausted")
        ) {
          isRateLimit = true;
        }

        if (
          status === 503 ||
          msg.includes("503") ||
          msg.includes("overload") ||
          msg.includes("unavailable") ||
          msg.includes("heating")
        ) {
          isOverload = true;
        }
      };

      errors.forEach(checkErrorType);

      const lastErrorMessage = lastError?.message || String(lastError);

      if (isRateLimit) {
        return NextResponse.json(
          {
            error: "API rate limit exceeded. Multiple users are running analyses simultaneously, exceeding the Gemini API free-tier threshold.",
            details: lastErrorMessage,
            isRateLimit: true,
            isOverload: false,
            cooldownSeconds: 60
          },
          { status: 429 }
        );
      } else if (isOverload) {
        return NextResponse.json(
          {
            error: "API service is overloaded. Gemini model servers are currently experiencing high request volumes. API is cooling down.",
            details: lastErrorMessage,
            isRateLimit: false,
            isOverload: true,
            cooldownSeconds: 60
          },
          { status: 503 }
        );
      } else {
        throw new Error(`All configured Gemini API keys failed to generate a response. Last error: ${lastErrorMessage}`);
      }
    }

    // 4. Safe parsing of response JSON (stripping markdown fences)
    let cleanJsonString = responseText.trim();
    if (cleanJsonString.startsWith("```")) {
      cleanJsonString = cleanJsonString
        .replace(/^```(?:json)?\n?/i, "")
        .replace(/\n?```$/i, "");
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanJsonString.trim());
    } catch (parseErr) {
      console.error("Raw response failed to parse as JSON:", responseText);
      throw new Error("Failed to parse analysis response payload as valid JSON. Raw output: " + responseText.slice(0, 100));
    }

    // Return the response payload
    return NextResponse.json(parsedResponse);
  } catch (err: any) {
    console.error("API error inside /api/analyze:", err);
    return NextResponse.json(
      { error: err.message || "An internal error occurred during profile evaluation." },
      { status: 500 }
    );
  }
}
