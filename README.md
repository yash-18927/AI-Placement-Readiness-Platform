# AI Placement Readiness Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.dot.js&style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-orange?logo=google-gemini&style=flat-square)](https://ai.google.dev/)
[![GitHub API](https://img.shields.io/badge/GitHub_API-REST-lightgrey?logo=github&style=flat-square)](https://docs.github.com/en/rest)

**AI PLACEMENT READINESS PLATFORM** is a premium, placement-readiness assessment web application powered by Next.js 14 and Gemini 2.5 Flash. It evaluates a student or candidate's placement readiness by cross-referencing their PDF resume and their actual GitHub coding footprint.

---

## 📸 Screenshots

*Placeholder: Launch the development environment and capture your personalized dashboard screenshots!*

---

## ✨ Features

- **Client-Side PDF Text Extraction**: Securely extracts text content directly inside the user's browser using `pdfjs-dist` workers. Resumes are processed completely locally in-browser.
- **GitHub Profile Analytics**: Dynamically pulls active repository metadata, programming language distributions, descriptions, and coding consistency.
- **AI Talent Evaluation**: Employs Gemini 2.5 Flash to score candidate capabilities, list matching and missing core skills, strengths, and weaknesses.
- **Dynamic CSS Score Indicator**: Renders dynamic colored circular progress rings tracking readiness progress entirely in lightweight CSS.
- **Interactive Roadmap Stops**: Displays an interactive chronological 3-month action plan outlining daily hours and weekly milestones.
- **Tailored Project Catalog**: Suggests 3 difficulty-rated practical portfolio projects complete with days-to-build timelines.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router & React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Backend**: Gemini 2.5 Flash API (`@google/generative-ai`)
- **Data Visualization**: Recharts (for placement benchmarks)
- **PDF Parser**: PDFJS-Dist (for client-side parsing)
- **API Fetching**: Native Fetching against the GitHub REST API

---

## 🚀 Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yash-18927/AI-Placement-Readiness-Platform.git
   cd AI-Placement-Readiness-Platform
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file by copying the template:
   ```bash
   cp .env.example .env.local
   ```
   Provide your Gemini API Key:
   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Launch development environment**:
   ```bash
   npm run dev
   ```

5. Visit https://ai-placement-readiness-platform-bp7y5ye4q.vercel.app inside your web browser.

---

## 🔍 How It Works

1. **Upload Resume**: A user uploads or drops a PDF resume onto the platform.
2. **In-Browser Parsing**: The system extracts the resume's raw text client-side using PDF.js workers, keeping processing fast and secure.
3. **GitHub Pulling**: When the username is supplied, CareerAI calls the GitHub REST API to fetch recent repository lists and language frequencies.
4. **AI Generation**: The Next.js API endpoint aggregates both data sets and queries Gemini 2.5 Flash using strict JSON structured templates.
5. **Local Preservation**: On success, the response JSON payload is cached inside browser `localStorage` linked to a unique sessionId.
6. **Dashboard Assembly**: The results dashboard loads the payload to display readiness levels, timeline tabs, interactive roadmaps, and custom projects.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
