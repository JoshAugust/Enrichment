import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Corgi Enrichment",
  description: "Lead enrichment tool for insurance agency prospecting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-background">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 shrink-0">
            <Sidebar />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0 pb-16 md:pb-0">
            <div className="p-6 max-w-screen-2xl mx-auto">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Nav */}
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
