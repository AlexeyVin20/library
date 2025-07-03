'use client';

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Clock,
  BookOpen,
  CreditCard,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  BookMarked,
  AlertCircle,
  CheckCircle2,
  Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn, getInitials } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { USER_ROLES, getRoleById, getRoleDescription, getHighestPriorityRole, getHighestPriorityRoleFromApi } from "@/lib/types"

// User model interface
interface UserType {
  id: string
  fullName: string
  email: string
  phone: string
  registrationDate: string
  borrowedBooksCount: number
  fineAmount: number
  isActive: boolean
  loanPeriodDays: number
  maxBooksAllowed: number
  username: string
  roles: string[]
  rolesData?: Array<{roleId: number, roleName: string}>
  borrowedBooks?: Book[]
  reservations?: Reservation[]
}

// Book model interface
interface Book {
  id: string
  title: string
  authors: string
  author?: string
  isbn: string
  genre?: string | null
  cover?: string | null
  publicationYear?: number | null
  publisher?: string | null
  dueDate?: string
  borrowDate?: string
  returnDate?: string
  isFromReservation?: boolean
}

// Reservation model interface
interface Reservation {
  id: string
  bookId: string
  bookTitle?: string
  reservationDate: string
  expirationDate: string
  status: string
  notes?: string
  userId?: string
  book?: Book
}

// Password change schema
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Текущий пароль обязателен"),
    newPassword: z.string().min(6, "Новый пароль должен содержать не менее 6 символов"),
    confirmPassword: z.string().min(6, "Подтверждение пароля обязательно"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5,
}: { children: React.ReactNode; delay?: number; duration?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Компонент для информационного поля
const InfoField = ({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) => {
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center gap-2 text-sm text-blue-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-base text-gray-800 font-medium pl-6">{value}</div>
    </div>
  )
}

// Компонент для вкладок
const AnimatedTabsTrigger = ({
  value,
  icon,
  label,
  isActive,
}: { value: string; icon: React.ReactNode; label: string; isActive: boolean }) => {
  return (
    <TabsTrigger value={value} className="relative">
      <div className="flex items-center gap-2 py-2 px-3">
        <span className={isActive ? "text-blue-500" : "text-gray-500"}>
          {icon}
        </span>
        <span className={isActive ? "text-blue-700" : "text-gray-500"}>
          {label}
        </span>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeProfileTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </TabsTrigger>
  )
}

export default function ProfilePageClient() {
  return <div>Загрузка профиля...</div>
} 