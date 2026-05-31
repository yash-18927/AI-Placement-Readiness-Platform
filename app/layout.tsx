import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Placement Readiness Platform",
  description: "Evaluate your resume and GitHub profile to assess placement readiness and get interactive learning roadmaps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0f0f13] text-gray-100 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
