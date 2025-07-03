"use client"

import type React from "react"
export const dynamic = 'force-dynamic';

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

        // Fetch user data and roles in parallel
        const [userResponse, rolesResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User/${id}/roles`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        ])

        if (!userResponse.ok) {
          throw new Error("Не удалось загрузить данные пользователя")
        }

        const data = await userResponse.json()
        
        // Get user roles
        let userRoles: string[] = []
        let rolesData: Array<{roleId: number, roleName: string}> = []
        if (rolesResponse.ok) {
          rolesData = await rolesResponse.json()
          console.log("Роли пользователя:", rolesData) // Для отладки
          // API возвращает массив объектов: { userId, roleId, roleName }
          userRoles = rolesData.map((roleItem: any) => roleItem.roleName).filter((role: string) => role)
        }
        
        console.log("Обработанные роли:", userRoles) // Для отладки
        
        // Убедимся, что у нас есть все необходимые поля, или установим значения по умолчанию
        const processedUser: UserType = {
          id: data.id || id,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          registrationDate: data.dateRegistered || data.registrationDate || "",
          borrowedBooksCount: data.borrowedBooksCount || 0,
          fineAmount: data.fineAmount || 0,
          isActive: data.isActive ?? true,
          loanPeriodDays: data.loanPeriodDays || 0,
          maxBooksAllowed: data.maxBooksAllowed || 0,
          username: data.username || "",
          roles: userRoles,
          rolesData: rolesData,
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
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-500">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  // Рендеринг страницы ошибки
  if (error && !isLoading && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-red-100 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Ошибка
            </CardTitle>
            <CardDescription className="text-red-800">Произошла ошибка при загрузке профиля</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-4">{error}</p>
            <Button 
              variant="default" 
              className="w-full bg-blue-500 hover:bg-blue-700 text-white"
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
        author: reservation.book!.authors || "Автор не указан",
        dueDate: reservation.expirationDate, 
        borrowDate: reservation.reservationDate,
        returnDate: reservation.expirationDate,
        cover: reservation.book!.cover,
        isFromReservation: true,
      }));

    const allBooks = [...booksOnHold, ...booksFromReservations].filter(
      (book, index, self) =>
        index === self.findIndex((b) => b.id === book.id)
    );

    if (allBooks.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {allBooks.map((book, index) => (
            <motion.div
              key={`book-${book.id}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="p-3 max-w-xs bg-white rounded-lg border border-gray-200 flex items-start gap-3 mx-auto shadow-md"
              whileHover={{
                y: -2,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div className="w-14 h-20 relative flex-shrink-0 rounded-md overflow-hidden shadow-lg">
                {book.cover ? (
                  <Image
                    src={book.cover}
                    alt={book.title || "Книга"}
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-md"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-300 rounded-md">
                    <BookOpen className="h-8 w-8 text-blue-500" />
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-800 mb-1 line-clamp-2">{book.title}</h4>
                <p className="text-sm text-gray-500 mb-1 line-clamp-1">
                  Автор: {book.author || book.authors || "Автор не указан"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {book.genre && (
                    <span className="text-blue-500">{book.genre}</span>
                  )}
                  {book.publicationYear && (
                    <span className="text-gray-500">
                      {book.publicationYear} г.
                    </span>
                  )}
                  {book.publisher && (
                    <span className="text-gray-500">{book.publisher}</span>
                  )}
                </div>
                <div className="mt-2">
                  {book.borrowDate && (
                    <div className="text-xs text-gray-500">
                      Взята: {formatDate(book.borrowDate)}
                    </div>
                  )}
                  {(book.dueDate || book.returnDate) && (
                    <div
                      className={cn(
                        "text-xs font-medium mt-1",
                        new Date(book.dueDate || book.returnDate || "") < new Date()
                          ? "text-red-800"
                          : "text-blue-500"
                      )}
                    >
                      Вернуть до: {formatDate(book.dueDate || book.returnDate || "")}
                    </div>
                  )}
                </div>
                {book.isFromReservation && (
                  <span className="text-xs text-blue-500 mt-1 inline-block">
                    Из резервации
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500">У вас нет книг на руках</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen relative py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <FadeInView>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile sidebar */}
            <div className="w-full md:w-1/3">
              <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 border-4 border-blue-300">
                      <AvatarFallback className="bg-blue-300 text-blue-700 text-xl">
                        {user && user.fullName ? getInitials(user.fullName) : ""}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">{user?.fullName}</h2>
                    <p className="text-blue-500 mb-3">{user?.username}</p>

                    <div className="space-y-3 mb-4">
                      <h4 className="text-sm font-medium text-gray-600 text-center">Основная роль</h4>
                      {(() => {
                        const highestPriorityRole = user?.rolesData ? 
                          getHighestPriorityRoleFromApi(user.rolesData) : 
                          getHighestPriorityRole(user?.roles || []);
                        return (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                variant="outline"
                                className="bg-blue-300 border-blue-500 text-blue-700"
                              >
                                {highestPriorityRole.name}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {highestPriorityRole.description}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white rounded p-2 border">
                                <div className="font-medium text-blue-600">Макс. книг</div>
                                <div className="text-gray-800">{highestPriorityRole.maxBooksAllowed}</div>
                              </div>
                              <div className="bg-white rounded p-2 border">
                                <div className="font-medium text-blue-600">Срок займа</div>
                                <div className="text-gray-800">{highestPriorityRole.loanPeriodDays} дней</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {user?.roles && user.roles.length > 1 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Все роли ({user.roles.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {user.roles.map((role) => {
                              const roleInfo = Object.values(USER_ROLES).find(r => r.name === role);
                              return (
                                <div key={role} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge
                                      variant="outline"
                                      className="bg-gray-200 border-gray-400 text-gray-700 text-xs"
                                    >
                                      {role}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    {getRoleDescription(role)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </div>

                    <Separator className="my-4 bg-gray-200" />

                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <span>Книги на руках:</span>
                        </div>
                        <span className="font-medium text-gray-800">
                          {user?.borrowedBooksCount || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                          <CreditCard className="h-4 w-4 text-blue-500" />
                          <span>Штрафы:</span>
                        </div>
                        <span className="font-medium text-gray-800">{user?.fineAmount || 0} ₽</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>Срок займа:</span>
                        </div>
                        <span className="font-medium text-gray-800">
                          {(() => {
                            const highestRole = user?.rolesData ? 
                              getHighestPriorityRoleFromApi(user.rolesData) : 
                              getHighestPriorityRole(user?.roles || []);
                            return highestRole.loanPeriodDays;
                          })()} дней
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                          <BookMarked className="h-4 w-4 text-blue-500" />
                          <span>Макс. книг:</span>
                        </div>
                        <span className="font-medium text-gray-800">
                          {(() => {
                            const highestRole = user?.rolesData ? 
                              getHighestPriorityRoleFromApi(user.rolesData) : 
                              getHighestPriorityRole(user?.roles || []);
                            return highestRole.maxBooksAllowed;
                          })()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>Регистрация:</span>
                        </div>
                        <span className="font-medium text-gray-800">
                          {user?.registrationDate ? formatDate(user.registrationDate) : "Недоступно"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span>Статус:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {user?.isActive ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-600">Активен</span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-600">Неактивен</span>
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
              <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-800">Мой профиль</CardTitle>
                  <CardDescription className="text-gray-500">
                    Просмотр и управление вашей учетной записью
                  </CardDescription>
                </CardHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-gray-100 text-gray-800 rounded-none border-b border-gray-200 p-0 h-auto">
                    <AnimatedTabsTrigger
                      value="personal"
                      icon={<User className="h-4 w-4" />}
                      label="Личные данные"
                      isActive={activeTab === "personal"}
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
                    <AnimatedTabsTrigger
                      value="settings"
                      icon={<Settings className="h-4 w-4" />}
                      label="Настройки"
                      isActive={activeTab === "settings"}
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

                    </div>
                  </TabsContent>



                  <TabsContent value="security" className="p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Изменение пароля</h3>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-4"
                        >
                          <Alert variant="destructive" className="bg-red-100 border-red-500">
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
                          <Alert className="bg-green-100 border-green-500">
                            <CheckCircle2 className="h-4 w-4 text-green-800" />
                            <AlertTitle className="text-green-800">Успех</AlertTitle>
                            <AlertDescription className="text-green-800">
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
                              <FormLabel className="text-gray-800">Текущий пароль</FormLabel>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <FormControl>
                                  <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="********"
                                    {...field}
                                    disabled={isSubmitting}
                                    className="pl-12 pr-12 bg-gray-100 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 text-gray-800 shadow-sm"
                                  />
                                </FormControl>
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <FormMessage className="text-red-800" />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-800">Новый пароль</FormLabel>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <FormControl>
                                  <Input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="********"
                                    {...field}
                                    disabled={isSubmitting}
                                    className="pl-12 pr-12 bg-gray-100 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 text-gray-800 shadow-sm"
                                  />
                                </FormControl>
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <FormMessage className="text-red-800" />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-800">Подтверждение пароля</FormLabel>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <FormControl>
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="********"
                                    {...field}
                                    disabled={isSubmitting}
                                    className="pl-12 pr-12 bg-gray-100 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 text-gray-800 shadow-sm"
                                  />
                                </FormControl>
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <FormMessage className="text-red-800" />
                              </div>
                            </FormItem>
                          )}
                        />

                        <motion.div className="pt-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 shadow-md"
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
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Книги на руках</h3>
                    {renderBooks()}
                  </TabsContent>

                  <TabsContent value="settings" className="p-6">
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <Settings className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Настройки пользователя</h3>
                        <p className="text-gray-600 mb-6">
                          Персонализируйте свой опыт использования библиотеки
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push('/settings')}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-2 shadow-md"
                      >
                        Перейти к настройкам
                      </Button>
                    </div>
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
