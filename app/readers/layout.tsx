import type React from "react"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import "../globals.css"
import { Suspense } from 'react';
import ReadersLayoutClient from './client-layout';

export const metadata: Metadata = {
  title: "Библиотека - Читательский портал",
  description: "Портал для читателей библиотеки",
}

export default function ReadersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={cn(
      "min-h-screen bg-gray-200"
    )}>
      <div className="flex flex-col min-h-screen">
        <Suspense fallback={<div>Loading...</div>}>
          <ReadersLayoutClient>{children}</ReadersLayoutClient>
        </Suspense>
      </div>
    </div>
  )
}
