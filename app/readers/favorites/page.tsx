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
import { Input } from "@/components/ui/input"
import {
  Heart,
  BookOpen,
  Search,
  AlertTriangle,
  Trash2,
  Grid3X3,
  List,
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

// Enhanced loading component
const EnhancedLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4 relative overflow-hidden">
      <FloatingElements />

      <motion.div
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 flex flex-col items-center border border-white/20 relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="relative mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <div className="w-20 h-20 border-4 border-pink-200 border-t-pink-500 rounded-full"></div>
          <motion.div
            className="absolute inset-2 border-4 border-purple-200 border-t-purple-500 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Загружаем избранное</h3>
          <p className="text-gray-600">Собираем ваши любимые книги...</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Enhanced favorite book card
const FavoriteBookCard = ({
  book,
  onRemove,
  viewMode,
}: {
  book: FavoriteBookEntry
  onRemove: (bookId: string) => void
  viewMode: "grid" | "list"
}) => {
  const [isHovered, setIsHovered] = useState(false)

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 overflow-hidden"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="flex items-center p-6 gap-6">
          <Link href={`/readers/books/${book.bookId}`} className="flex-shrink-0">
            <div className="relative w-16 h-20 rounded-lg overflow-hidden shadow-md">
              {book.bookCover ? (
                <NextImage
                  src={book.bookCover}
                  alt={book.bookTitle}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                  <BookOpen className="text-blue-500 w-6 h-6" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/readers/books/${book.bookId}`}>
              <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                {book.bookTitle}
              </h3>
            </Link>
            {book.bookAuthors && <p className="text-gray-600 text-sm mt-1 truncate">{book.bookAuthors}</p>}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(book.dateAdded).toLocaleDateString("ru-RU")}
              </div>
            </div>
          </div>

          <motion.button
            className="flex-shrink-0 p-3 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all duration-200"
            onClick={() => onRemove(book.bookId)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-2xl transition-all duration-500"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href={`/readers/books/${book.bookId}`} className="block">
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          {book.bookCover ? (
            <NextImage
              src={book.bookCover}
              alt={book.bookTitle}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
              <BookOpen className="text-blue-500 w-16 h-16" />
            </div>
          )}

          {/* Gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Date added badge */}
          <motion.div
            className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3 }}
          >
            <Calendar className="w-3 h-3" />
            {new Date(book.dateAdded).toLocaleDateString("ru-RU")}
          </motion.div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/readers/books/${book.bookId}`}>
          <motion.h3
            className="font-bold text-lg line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors mb-2"
            whileHover={{ scale: 1.02 }}
          >
            {book.bookTitle}
          </motion.h3>
        </Link>
        {book.bookAuthors && (
          <p className="text-sm text-gray-600 line-clamp-1 mb-3 flex items-center">
            <User className="w-3 h-3 mr-1" />
            {book.bookAuthors}
          </p>
        )}
        {book.genre && (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200 mb-3">
            {book.genre}
          </Badge>
        )}
      </div>

      {/* Remove button */}
      <motion.button
        className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full p-2 shadow-lg border border-white/20 text-red-500 hover:text-red-600 transition-all duration-200"
        onClick={() => onRemove(book.bookId)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>

      {/* Sparkle effect on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute top-2 left-2 text-yellow-400"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 180 }}
            exit={{ scale: 0, rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
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
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
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
    const filtered = favoriteBooks.filter(
      (book) =>
        book.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.bookAuthors && book.bookAuthors.toLowerCase().includes(searchQuery.toLowerCase())),
    )

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
  }, [favoriteBooks, searchQuery, sortBy])

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
    return <EnhancedLoading />
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
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Input
                    type="search"
                    placeholder="Поиск по названию или автору..."
                    className="pl-12 pr-4 py-3 rounded-2xl border-white/30 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>

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

                  {/* View mode */}
                  <div className="flex items-center bg-white/50 backdrop-blur-sm rounded-xl p-1 border border-white/30">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-lg"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-lg"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
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
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ничего не найдено</h3>
                <p className="text-gray-600">Попробуйте изменить поисковый запрос</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
                  : "space-y-4"
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
                  viewMode={viewMode}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
