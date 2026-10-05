import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { queryOne } from "@/lib/db";
import "./globals.css";

export const dynamic = "force-dynamic";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Campus Events", template: "%s · Campus Events" },
  description: "Campus Club & Event Management System: a web dashboard over a MySQL database (CSE 364).",
};

async function serverVersion() {
  try {
    const row = await queryOne<{ v: string }>("SELECT VERSION() AS v");
    return row?.v ?? null;
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const version = await serverVersion();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex min-h-dvh">
            <Sidebar mysqlVersion={version} />
            <main className="min-w-0 flex-1">
              <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-10 lg:pt-10">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
