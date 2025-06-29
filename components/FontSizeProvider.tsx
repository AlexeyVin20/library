'use client'

import { useFontSize } from '@/hooks/use-font-size'

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  useFontSize() // Просто применяем эффект
  return <>{children}</>
} 