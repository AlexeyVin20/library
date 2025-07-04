import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import ReaderNavigation from "@/components/reader-navigation"
import Footer from "@/components/admin/Footer"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import "../globals.css"

export const metadata: Metadata = {
  title: "Библиотека - Читательский портал",
  description: "Портал для читателей библиотеки",
}

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={cn(
      "min-h-screen bg-gray-200"
    )}>
      <div className="flex flex-col min-h-screen">
        <ReaderNavigation />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
