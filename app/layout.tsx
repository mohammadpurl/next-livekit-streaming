import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interactive Avatar Demo",
  description: "Interactive Avatar Demo with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" 
        />
      </head>
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
