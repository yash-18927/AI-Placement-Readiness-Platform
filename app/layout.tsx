import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Placement Readiness Platform",
  description: "Evaluate your resume and GitHub profile to assess placement readiness and get interactive learning roadmaps.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Placement Readiness",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#1a73e8" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('PWA Service Worker registered successfully:', reg.scope);
                  }).catch(function(err) {
                    console.warn('PWA Service Worker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-[#0f0f13] text-gray-100 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
