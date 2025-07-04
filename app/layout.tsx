import type { Metadata } from "next";
import "./globals.css";
import { Fira_Code as FontMono, Inter as FontSans } from "next/font/google";


const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "AI Airport assistant",
  description: "AI Airport assistant",
  icons: {
    icon: "/heygen-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
    suppressHydrationWarning
    className={`${fontSans.variable} ${fontMono.variable} font-sans`}
    lang="en"
  >
      <head>
        {/* <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" 
        /> */}
      </head>
      <body className="min-h-screen bg-black text-white">
        <main className="relative flex flex-col gap-6">
          {children}
        </main>
      </body>
    </html>
  );
}
