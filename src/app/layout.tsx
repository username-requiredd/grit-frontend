// gt/frontemd/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Footer from "./components/Footer"; // 1. Import the Footer

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grit",
  description: "A collaborative Kanban board",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 2. Add flex flex-col min-h-screen to ensure footer stays at the bottom */}
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950`}>
        <Providers>
          {/* Main content wrapper takes up available space using flex-grow */}
          <main className="flex-grow">
            {children}
          </main>
          
          {/* 3. Drop the Footer at the end */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}