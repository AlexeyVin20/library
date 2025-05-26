"use client"

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
  FileText,
  MapPin,
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

// User model interface
interface UserType {
  id: string
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  passportNumber: string
  passportIssuedBy: string
  passportIssuedDate: string
  address: string
  registrationDate: string
  borrowedBooksCount: number
  fineAmount: number
  isActive: boolean
  loanPeriodDays: number
  maxBooksAllowed: number
  username: string
  roles: string[]
  borrowedBooks?: Book[]
  reservations?: Reservation[]
}

// Book model interface
interface Book {
  id: string
  title: string
  authors: string
  isbn: string
  genre?: string | null
  cover?: string | null
  publicationYear?: number | null
  publisher?: string | null
  dueDate?: string
  borrowDate?: string
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
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-base text-white dark:text-gray-200 font-medium pl-6">{value}</div>
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
        <span className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-white dark:text-gray-500"}>
          {icon}
        </span>
        <span className={isActive ? "text-emerald-700 dark:text-emerald-300" : "text-white dark:text-gray-500"}>
          {label}
        </span>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeProfileTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </TabsTrigger>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading } = useAuth()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("personal")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Проверка авторизации
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Доступ запрещен",
        description: "Для доступа к профилю необходима авторизация",
        variant: "destructive",
      })
      router.push("/auth/login")
    }
  }, [isAuthenticated, isLoading, router, toast])

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || isLoading) return
      
      setLoading(true)
      setError(null)

      try {
        // Get user ID from localStorage
        const userData = localStorage.getItem("user")
        if (!userData) {
          throw new Error("Пользователь не авторизован")
        }

        const { id } = JSON.parse(userData)
        const token = localStorage.getItem("token")

        if (!token) {
          throw new Error("Токен авторизации не найден")
        }

        // Fetch user data from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось загрузить данные пользователя")
        }

        const data = await response.json()
        
        // Убедимся, что у нас есть все необходимые поля, или установим значения по умолчанию
        const processedUser: UserType = {
          id: data.id || id,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth || "",
          passportNumber: data.passportNumber || "",
          passportIssuedBy: data.passportIssuedBy || "",
          passportIssuedDate: data.passportIssuedDate || "",
          address: data.address || "",
          registrationDate: data.registrationDate || "",
          borrowedBooksCount: data.borrowedBooksCount || 0,
          fineAmount: data.fineAmount || 0,
          isActive: data.isActive ?? true,
          loanPeriodDays: data.loanPeriodDays || 0,
          maxBooksAllowed: data.maxBooksAllowed || 0,
          username: data.username || "",
          roles: Array.isArray(data.roles) ? data.roles : [],
          borrowedBooks: Array.isArray(data.borrowedBooks) ? data.borrowedBooks : [],
          reservations: Array.isArray(data.reservations) ? data.reservations : [],
        }
        
        setUser(processedUser)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных")

        toast({
          title: "Ошибка",
          description: err instanceof Error ? err.message : "Произошла ошибка при загрузке данных",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isAuthenticated, isLoading, toast])

  // Рендеринг страницы загрузки
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-emerald-100 dark:text-emerald-200">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  // Рендеринг страницы ошибки
  if (error && !isLoading && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-xl bg-red-500/10 dark:bg-red-800/30 border-red-500/30 dark:border-red-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Ошибка
            </CardTitle>
            <CardDescription className="text-red-200 dark:text-red-300">Произошла ошибка при загрузке профиля</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-100 dark:text-red-200 mb-4">{error}</p>
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => router.push("/auth/login")}
            >
              Вернуться на страницу входа
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle password change
  const onSubmit = async (data: PasswordChangeFormValues) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Get user ID from localStorage
      const userData = localStorage.getItem("user")
      if (!userData) {
        throw new Error("Пользователь не авторизован")
      }

      const { id } = JSON.parse(userData)
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Токен авторизации не найден")
      }

      // Send password change request
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: id,
          oldPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Не удалось изменить пароль"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // If response is not JSON, use text
          errorMessage = (await response.text()) || errorMessage
        }
        throw new Error(errorMessage)
      }

      setSuccess("Пароль успешно изменен")
      form.reset()

      toast({
        title: "Успех",
        description: "Пароль успешно изменен",
      })
    } catch (err) {
      console.error("Error changing password:", err)
      setError(err instanceof Error ? err.message : "Произошла ошибка при изменении пароля")

      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Произошла ошибка при изменении пароля",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (e) {
      return "Недоступно"
    }
  }

  const renderBooks = () => {
    const booksOnHold = user?.borrowedBooks || [];
    const booksFromReservations = (user?.reservations || [])
      .filter(
        (reservation) =>
          reservation.status === "Выдана" &&
          reservation.book &&
          new Date(reservation.expirationDate) >= new Date()
      )
      .map((reservation) => ({
        ...(reservation.book!), 
        id: reservation.bookId, 
        title: reservation.bookTitle || reservation.book!.title,
        dueDate: reservation.expirationDate, 
        borrowDate: reservation.reservationDate, 
      }));

    const allBooks = [...booksOnHold, ...booksFromReservations].filter(
      (book, index, self) =>
        index === self.findIndex((b) => b.id === book.id)
    );

    if (allBooks.length > 0) {
      return (
        <div className="space-y-4">
          {allBooks.map((book) => (
            <motion.div
              key={`book-${book.id}`}
              className="backdrop-blur-xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-white/20 dark:border-gray-700/30 rounded-lg p-4 shadow-sm"
              whileHover={{
                y: -2,
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-16 h-24 relative">
                  {book.cover ? (
                    <Image
                      src={book.cover || "/placeholder.svg"}
                      alt={book.title}
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-500/20 rounded-md">
                      <BookOpen className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium text-white dark:text-white">{book.title}</h4>
                  <p className="text-sm text-gray-300 dark:text-gray-400">{book.authors}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs">
                    {book.genre && (
                      <span className="text-emerald-600 dark:text-emerald-400">{book.genre}</span>
                    )}
                    {book.publicationYear && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {book.publicationYear} г.
                      </span>
                    )}
                    {book.publisher && (
                      <span className="text-gray-500 dark:text-gray-400">{book.publisher}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  {book.borrowDate && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Взята: {formatDate(book.borrowDate)}
                    </div>
                  )}
                  {book.dueDate && (
                    <div
                      className={cn(
                        "text-xs font-medium mt-1",
                        new Date(book.dueDate) < new Date()
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      Вернуть до: {formatDate(book.dueDate)}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 dark:text-gray-400">У вас нет книг на руках</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen relative py-12 px-4">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto max-w-5xl relative z-10">
        <FadeInView>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile sidebar */}
            <div className="w-full md:w-1/3">
              <Card className="backdrop-blur-xl bg-emerald-500/10 dark:bg-emerald-900/20 border border-white/20 dark:border-gray-700/30 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 border-4 border-emerald-100 dark:border-emerald-900">
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xl">
                        {user && user.fullName ? getInitials(user.fullName) : ""}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold text-white dark:text-white mb-1">{user?.fullName}</h2>
                    <p className="text-emerald-600 dark:text-emerald-400 mb-3">{user?.username}</p>

                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {user?.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                        >
                          Пользователь
                        </Badge>
                      )}
                    </div>

                    <Separator className="my-4 bg-emerald-200/30 dark:bg-emerald-700/30" />

                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-300 dark:text-gray-400">
                          <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Книги на руках:</span>
                        </div>
                        <span className="font-medium text-white dark:text-gray-100">
                          {user?.borrowedBooksCount || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-300 dark:text-gray-400">
                          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Штрафы:</span>
                        </div>
                        <span className="font-medium text-white dark:text-gray-100">{user?.fineAmount || 0} ₽</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-300 dark:text-gray-400">
                          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Срок займа:</span>
                        </div>
                        <span className="font-medium text-white dark:text-gray-100">
                          {user?.loanPeriodDays || 0} дней
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-300 dark:text-gray-400">
                          <BookMarked className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Макс. книг:</span>
                        </div>
                        <span className="font-medium text-white dark:text-gray-100">{user?.maxBooksAllowed || 0}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-300 dark:text-gray-400">
                          <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Регистрация:</span>
                        </div>
                        <span className="font-medium text-white dark:text-gray-100">
                          {user?.registrationDate ? formatDate(user.registrationDate) : "Недоступно"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-300 dark:text-gray-400">
                          <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Статус:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {user?.isActive ? (
                            <>
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="font-medium text-green-600 dark:text-green-400">Активен</span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-500" />
                              <span className="font-medium text-red-600 dark:text-red-400">Неактивен</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div className="w-full md:w-2/3">
              <Card className="backdrop-blur-xl bg-emerald-500/10 dark:bg-emerald-900/20 border border-white/20 dark:border-gray-700/30 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-white dark:text-white">Мой профиль</CardTitle>
                  <CardDescription className="text-gray-200 dark:text-gray-300">
                    Просмотр и управление вашей учетной записью
                  </CardDescription>
                </CardHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-emerald-700/10 dark:bg-emerald-900/30 text-white rounded-none border-b border-emerald-200/30 dark:border-emerald-700/30 p-0 h-auto">
                    <AnimatedTabsTrigger
                      value="personal"
                      icon={<User className="h-4 w-4" />}
                      label="Личные данные"
                      isActive={activeTab === "personal"}
                    />
                    <AnimatedTabsTrigger
                      value="documents"
                      icon={<FileText className="h-4 w-4" />}
                      label="Документы"
                      isActive={activeTab === "documents"}
                    />
                    <AnimatedTabsTrigger
                      value="security"
                      icon={<Lock className="h-4 w-4" />}
                      label="Безопасность"
                      isActive={activeTab === "security"}
                    />
                    <AnimatedTabsTrigger
                      value="books"
                      icon={<BookOpen className="h-4 w-4" />}
                      label="Мои книги"
                      isActive={activeTab === "books"}
                    />
                  </TabsList>

                  <TabsContent value="personal" className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoField
                        label="Полное имя"
                        value={user?.fullName || "Не указано"}
                        icon={<User className="h-4 w-4" />}
                      />
                      <InfoField
                        label="Email"
                        value={user?.email || "Не указано"}
                        icon={<Mail className="h-4 w-4" />}
                      />
                      <InfoField
                        label="Телефон"
                        value={user?.phone || "Не указано"}
                        icon={<Phone className="h-4 w-4" />}
                      />
                      <InfoField
                        label="Дата рождения"
                        value={user?.dateOfBirth ? formatDate(user.dateOfBirth) : "Не указано"}
                        icon={<Calendar className="h-4 w-4" />}
                      />
                      <InfoField
                        label="Адрес"
                        value={user?.address || "Не указано"}
                        icon={<MapPin className="h-4 w-4" />}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoField
                        label="Номер паспорта"
                        value={user?.passportNumber || "Не указано"}
                        icon={<FileText className="h-4 w-4" />}
                      />
                      <InfoField
                        label="Кем выдан"
                        value={user?.passportIssuedBy || "Не указано"}
                        icon={<FileText className="h-4 w-4" />}
                      />
                      <InfoField
                        label="Дата выдачи"
                        value={user?.passportIssuedDate ? formatDate(user.passportIssuedDate) : "Не указано"}
                        icon={<Calendar className="h-4 w-4" />}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="p-6">
                    <h3 className="text-lg font-medium text-white dark:text-white mb-4">Изменение пароля</h3>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-4"
                        >
                          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Ошибка</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}

                      {success && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-4"
                        >
                          <Alert className="bg-emerald-500/10 border-emerald-500/30">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <AlertTitle className="text-emerald-700 dark:text-emerald-300">Успех</AlertTitle>
                            <AlertDescription className="text-emerald-600/80 dark:text-emerald-400/80">
                              {success}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200 dark:text-gray-300">Текущий пароль</FormLabel>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <FormControl>
                                  <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="********"
                                    {...field}
                                    disabled={isSubmitting}
                                    className="pl-10 pr-10 backdrop-blur-xl bg-emerald-500/10 dark:bg-emerald-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-white dark:text-gray-200 shadow-sm"
                                  />
                                </FormControl>
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <FormMessage className="text-red-500" />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200 dark:text-gray-300">Новый пароль</FormLabel>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <FormControl>
                                  <Input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="********"
                                    {...field}
                                    disabled={isSubmitting}
                                    className="pl-10 pr-10 backdrop-blur-xl bg-emerald-500/10 dark:bg-emerald-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-white dark:text-gray-200 shadow-sm"
                                  />
                                </FormControl>
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <FormMessage className="text-red-500" />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200 dark:text-gray-300">Подтверждение пароля</FormLabel>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <FormControl>
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="********"
                                    {...field}
                                    disabled={isSubmitting}
                                    className="pl-10 pr-10 backdrop-blur-xl bg-emerald-500/10 dark:bg-emerald-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-2 text-white dark:text-gray-200 shadow-sm"
                                  />
                                </FormControl>
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <FormMessage className="text-red-500" />
                              </div>
                            </FormItem>
                          )}
                        />

                        <motion.div className="pt-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="submit"
                            className="w-full bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 shadow-md backdrop-blur-md"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Сохранение...
                              </>
                            ) : (
                              "Изменить пароль"
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="books" className="p-6">
                    <h3 className="text-lg font-medium text-white dark:text-white mb-4">Книги на руках</h3>
                    {renderBooks()}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </FadeInView>
      </div>
    </div>
  )
}
