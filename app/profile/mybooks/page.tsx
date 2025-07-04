"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  BookOpen,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Hash,
  Library,
  Tag,
  FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { Book } from "@/components/ui/book"

// Interfaces
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
  rolesData?: Array<{ roleId: number; roleName: string }>
  borrowedBooks?: Book[]
  reservations?: Reservation[]
}

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
  bookInstance?: {
    instanceCode: string
  }
}

export default function MyBooksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast({
        title: "Доступ запрещен",
        description: "Для доступа к этой странице необходима авторизация",
        variant: "destructive",
      })
      router.push("/auth/login")
    }
  }, [isAuthenticated, isAuthLoading, router, toast])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || isAuthLoading) return
      setLoading(true)
      setError(null)

      try {
        const userData = localStorage.getItem("user")
        if (!userData) throw new Error("Пользователь не авторизован")

        const { id } = JSON.parse(userData)
        const token = localStorage.getItem("token")
        if (!token) throw new Error("Токен авторизации не найден")

        const [userResponse, reservationsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/User/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/Reservation?userId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!userResponse.ok) throw new Error("Не удалось загрузить данные пользователя")
        const data = await userResponse.json()

        let reservations: Reservation[] = []
        if (reservationsResponse.ok) {
          const rawReservations = await reservationsResponse.json()
          reservations = await Promise.all(
            rawReservations.map(async (res: Reservation) => {
              let enrichedBookDetails = res.book
              if (res.bookId) {
                try {
                  const bookDetailsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/books/${res.bookId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                  if (bookDetailsRes.ok) {
                    const detailedBookData = await bookDetailsRes.json()
                    enrichedBookDetails = {
                      id: detailedBookData.id,
                      title: detailedBookData.title,
                      authors: Array.isArray(detailedBookData.authors)
                        ? detailedBookData.authors.join(", ")
                        : detailedBookData.authors,
                      cover: detailedBookData.cover || "",
                      isbn: detailedBookData.isbn || "",
                      genre: detailedBookData.genre,
                      publicationYear: detailedBookData.publicationYear,
                      publisher: detailedBookData.publisher,
                    }
                  }
                } catch (bookErr) {
                  console.warn(`Не удалось загрузить детали для книги ${res.bookId} в резервации ${res.id}`)
                }
              }
              return { ...res, book: enrichedBookDetails }
            })
          )
        }

        const processedUser: UserType = {
          ...data,
          id: data.id || id,
          borrowedBooks: Array.isArray(data.borrowedBooks) ? data.borrowedBooks : [],
          reservations: reservations,
        }
        setUser(processedUser)
      } catch (err) {
        console.error("Error fetching user data:", err)
        const message = err instanceof Error ? err.message : "Произошла ошибка при загрузке данных"
        setError(message)
        toast({ title: "Ошибка", description: message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isAuthenticated, isAuthLoading, toast])

  const formatDate = (dateString: string) => {
    if (!dateString) return "Недоступно"
    try {
      return new Date(dateString).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })
    } catch (e) {
      return "Неверный формат"
    }
  }

  const renderBooks = () => {
    const booksOnHold = (user?.borrowedBooks || []).map((b) => ({ ...b, author: b.authors }))
    const booksFromReservations = (user?.reservations || [])
      .filter((r) => r.status === "Выдана" && r.book && new Date(r.expirationDate) >= new Date())
      .map((r) => ({
        ...(r.book!),
        id: r.bookId,
        title: r.bookTitle || r.book!.title,
        author: r.book!.authors || "Автор не указан",
        dueDate: r.expirationDate,
        borrowDate: r.reservationDate,
        returnDate: r.expirationDate,
        cover: r.book!.cover,
        isFromReservation: true,
      }))

    const allBooks = [...booksOnHold, ...booksFromReservations].filter(
      (book, index, self) => index === self.findIndex((b) => b.id === book.id)
    )

    if (allBooks.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">У вас нет книг на руках</h3>
          <p className="text-gray-500 mt-2">Когда вы возьмете книгу, она появится здесь.</p>
          <Button asChild className="mt-6">
            <Link href="/readers/books">Искать книги</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {allBooks.map((book) => {
          const reservationDetails = user?.reservations?.find(
            (r) => r.bookId === book.id && (r.status === "Выдана" || r.status === "Обрабатывается")
          )

          return (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 p-6 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <Link href={`/readers/books/${book.id}`}>
                      <Book
                        color={book.cover ? "#3B82F6" : "#6B7280"}
                        width={180}
                        depth={3}
                        variant="default"
                        illustration={
                          book.cover ? (
                            <Image
                              src={book.cover}
                              alt={book.title}
                              width={180}
                              height={210}
                              className="object-cover rounded"
                              unoptimized
                            />
                          ) : undefined
                        }
                      >
                        <div></div>
                      </Book>
                    </Link>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className="text-2xl font-bold text-gray-800">{book.title}</CardTitle>
                      <CardDescription className="text-base text-gray-500">{book.author}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                        <InfoField
                          icon={<Hash />}
                          label="Код экземпляра"
                          value={reservationDetails?.bookInstance?.instanceCode || "Не назначен"}
                        />
                        <InfoField icon={<Tag />} label="Жанр" value={book.genre || "Не указан"} />
                        <InfoField icon={<Library />} label="Издатель" value={book.publisher || "Не указан"} />
                        <InfoField
                          icon={<Calendar />}
                          label="Год издания"
                          value={book.publicationYear || "Не указан"}
                        />
                      </div>

                      {reservationDetails && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Информация о резервировании
                              <Badge variant={reservationDetails.status === "Выдана" ? "default" : "secondary"}>
                                {reservationDetails.status}
                              </Badge>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <InfoField
                                icon={<Calendar />}
                                label="Дата резерва"
                                value={formatDate(reservationDetails.reservationDate)}
                              />
                              <InfoField
                                icon={<Clock />}
                                label="Резерв до"
                                value={formatDate(reservationDetails.expirationDate)}
                                isUrgent={new Date(reservationDetails.expirationDate) < new Date()}
                              />
                            </div>
                            {reservationDetails.notes && (
                              <p className="text-xs italic text-gray-500 mt-2">
                                Примечание: {reservationDetails.notes}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    )
  }

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-500">Загрузка ваших книг...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-red-100 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle /> Ошибка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-4">{error}</p>
            <Button onClick={() => router.push("/profile")}>Вернуться в профиль</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <Link href="/profile" className="text-blue-500 hover:text-blue-700 flex items-center gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Назад в профиль
            </Link>
            <h1 className="text-4xl font-bold text-gray-800">Мои книги</h1>
            <p className="text-lg text-gray-500 mt-1">Здесь находятся все книги, которые вы взяли в библиотеке.</p>
          </div>
        </motion.div>
        {renderBooks()}
      </div>
    </div>
  )
}

const InfoField = ({
  icon,
  label,
  value,
  isUrgent = false,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  isUrgent?: boolean
}) => (
  <div className="flex items-start gap-3">
    <div className="text-gray-400 mt-1">{icon}</div>
    <div>
      <p className="text-gray-500 font-medium">{label}</p>
      <p className={`font-semibold ${isUrgent ? "text-red-600" : "text-gray-800"}`}>{value}</p>
    </div>
  </div>
) 