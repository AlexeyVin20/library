import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/admin.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { FontSizeProvider } from "@/components/FontSizeProvider";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Библиотека",
  description: "Система управления библиотекой",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased`,
          "min-h-screen bg-gray-200"
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <FontSizeProvider>
              <div className="flex flex-col min-h-screen">
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </FontSizeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
