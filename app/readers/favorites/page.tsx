"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Book } from "@/components/ui/book"
import {
  Heart,
  BookOpen,
  AlertTriangle,
  Trash2,
  Calendar,
  User,
  Star,
  Sparkles,
} from "lucide-react"

interface FavoriteBookEntry {
  userId: string
  bookId: string
  bookTitle: string
  bookAuthors?: string
  bookCover?: string
  dateAdded: string
  genre?: string
}

// Floating background elements
const FloatingElements = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 5,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          {i % 3 === 0 ? (
            <Heart className="w-6 h-6 text-pink-300" />
          ) : i % 3 === 1 ? (
            <BookOpen className="w-5 h-5 text-blue-300" />
          ) : (
            <Star className="w-4 h-4 text-yellow-300" />
          )}
        </motion.div>
      ))}
    </div>
  )
}

// Enhanced favorite book card
const FavoriteBookCard = ({
  book,
  onRemove,
}: {
  book: FavoriteBookEntry
  onRemove: (bookId: string) => void
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col items-center"
    >
      <Link href={`/readers/books/${book.bookId}`}>
        <Book color="#3B82F6" width={160} depth={3}>
          <div className="w-full h-full">
            {book.bookCover ? (
              <NextImage src={book.bookCover} alt={book.bookTitle} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 p-4 text-center">
                <p className="text-white font-bold">{book.bookTitle}</p>
              </div>
            )}
          </div>
        </Book>
      </Link>

      <div className="mt-4 w-40 text-center">
        <h3 className="font-bold text-gray-800 truncate" title={book.bookTitle}>
          {book.bookTitle}
        </h3>
        {book.bookAuthors && (
          <p className="text-sm text-gray-600 truncate" title={book.bookAuthors}>
            {book.bookAuthors}
          </p>
        )}
      </div>

      <motion.button
        className="absolute top-2 right-2 z-10 p-2 text-white bg-black/40 rounded-full hover:bg-red-500 transition-colors"
        onClick={() => onRemove(book.bookId)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        title="Удалить из избранного"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )
}

// Empty state component
const EmptyState = ({ icon: Icon, title, description, actionText, actionHref }: any) => {
  return (
    <motion.div
      className="min-h-[60vh] flex items-center justify-center px-4"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center max-w-md border border-white/20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-blue-500/5" />

        <motion.div
          className="relative z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-blue-100 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon className="w-10 h-10 text-pink-500" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">{title}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>

          <Link href={actionHref}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white rounded-2xl px-8 py-3 font-semibold shadow-lg">
                {actionText}
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const currentUserId = user?.id

  const [favoriteBooks, setFavoriteBooks] = useState<FavoriteBookEntry[]>([])
  const [filteredBooks, setFilteredBooks] = useState<FavoriteBookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"dateAdded" | "title" | "author">("dateAdded")

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false)
      return
    }

    const fetchFavoriteBooks = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${baseUrl}/api/FavoriteBook/user/${currentUserId}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Ошибка ${response.status} при загрузке избранных книг`)
        }
        const data: FavoriteBookEntry[] = await response.json()

        // Add mock data for better demo
        const enhancedData = data.map((book, index) => ({
          ...book,
          rating: Math.random() * 2 + 3, // Random rating between 3-5
          genre: ["Фантастика", "Детектив", "Роман", "Научная литература"][index % 4],
        }))

        setFavoriteBooks(enhancedData)
        setFilteredBooks(enhancedData)
      } catch (err) {
        console.error("Ошибка при загрузке избранных книг:", err)
        setError((err as Error).message || "Не удалось загрузить избранные книги.")
        toast({
          title: "Ошибка загрузки",
          description: (err as Error).message || "Не удалось загрузить избранные книги.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFavoriteBooks()
  }, [currentUserId, baseUrl])

  // Filter and sort books
  useEffect(() => {
    const filtered = [...favoriteBooks]

    // Sort books
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.bookTitle.localeCompare(b.bookTitle)
        case "author":
          return (a.bookAuthors || "").localeCompare(b.bookAuthors || "")
        case "dateAdded":
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      }
    })

    setFilteredBooks(filtered)
  }, [favoriteBooks, sortBy])

  const handleRemoveFromFavorites = async (bookId: string) => {
    if (!currentUserId) {
      toast({
        title: "Ошибка",
        description: "Пользователь не найден.",
        variant: "destructive",
      })
      return
    }

    const originalBooks = [...favoriteBooks]
    setFavoriteBooks((prevBooks) => prevBooks.filter((book) => book.bookId !== bookId))

    try {
      const response = await fetch(`${baseUrl}/api/FavoriteBook/${currentUserId}/${bookId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Ошибка ${response.status} при удалении книги из избранного`)
      }

      toast({
        title: "Успех!",
        description: "Книга удалена из избранного.",
      })
    } catch (err) {
      console.error("Ошибка при удалении из избранного:", err)
      setFavoriteBooks(originalBooks)
      toast({
        title: "Ошибка",
        description: (err as Error).message || "Не удалось удалить книгу из избранного.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
      <FloatingElements />
      <div className="container mx-auto py-8 px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Heart className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                    Мои избранные
                  </h1>
                  <p className="text-xl text-gray-600 mt-2">
                    {favoriteBooks.length}{" "}
                    {favoriteBooks.length === 1 ? "книга" : favoriteBooks.length < 5 ? "книги" : "книг"} в вашей
                    коллекции
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
                {/* Controls */}
                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 rounded-xl border border-white/30 bg-white/50 backdrop-blur-sm text-sm font-medium focus:bg-white/80 transition-all"
                  >
                    <option value="dateAdded">По дате добавления</option>
                    <option value="title">По названию</option>
                    <option value="author">По автору</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Books grid/list */}
        <AnimatePresence mode="wait">
          {filteredBooks.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-12 max-w-md mx-auto border border-white/20">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ничего не найдено</h3>
                <p className="text-gray-600">Попробуйте изменить поисковый запрос</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              className={
                "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-6 gap-y-12"
              }
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              initial="hidden"
              animate="show"
            >
              {filteredBooks.map((book) => (
                <FavoriteBookCard
                  key={book.bookId}
                  book={book}
                  onRemove={handleRemoveFromFavorites}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
        <FloatingElements />
        <EmptyState
          icon={AlertTriangle}
          title="Требуется авторизация"
          description="Пожалуйста, войдите в систему, чтобы просмотреть свои избранные книги."
          actionText="Войти в систему"
          actionHref="/auth/login"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
        <FloatingElements />
        <EmptyState
          icon={AlertTriangle}
          title="Ошибка загрузки"
          description={error}
          actionText="Попробовать снова"
          actionHref="/readers/favorites"
        />
      </div>
    )
  }

  if (favoriteBooks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
        <FloatingElements />
        <EmptyState
          icon={Heart}
          title="Список избранного пуст"
          description="Вы еще не добавили ни одной книги в избранное. Начните исследовать нашу коллекцию!"
          actionText="Найти книги"
          actionHref="/readers"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
      <FloatingElements />

      <div className="container mx-auto py-8 px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="bg-white/90 backdrop-blur-md shadow-lg border border-white/20 overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center shadow"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Heart className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                    Мои избранные
                  </h1>
                  <p className="text-base text-gray-600 mt-1">
                    {favoriteBooks.length}{" "}
                    {favoriteBooks.length === 1 ? "книга" : favoriteBooks.length < 5 ? "книги" : "книг"} в вашей коллекции
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-2 items-center justify-end">
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg border border-white/30 bg-white/70 backdrop-blur-sm text-sm font-medium focus:bg-white/90 transition-all"
                  >
                    <option value="dateAdded">По дате добавления</option>
                    <option value="title">По названию</option>
                    <option value="author">По автору</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Books grid/list */}
        <AnimatePresence mode="wait">
          {filteredBooks.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-12 max-w-md mx-auto border border-white/20">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ничего не найдено</h3>
                <p className="text-gray-600">Попробуйте изменить поисковый запрос</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              className={
                "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-6 gap-y-12"
              }
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              initial="hidden"
              animate="show"
            >
              {filteredBooks.map((book) => (
                <FavoriteBookCard
                  key={book.bookId}
                  book={book}
                  onRemove={handleRemoveFromFavorites}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
