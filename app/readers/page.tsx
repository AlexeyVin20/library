"use client"

import type React from "react"
import { useAuth } from "@/lib/auth"
import { Heart, Sparkles } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  Users,
  Award,
  Grid3X3,
  List,
} from "lucide-react"
import { Book } from "@/components/ui/book"
import { useRouter } from "next/navigation"
import { useLibraryStats } from "@/hooks/use-library-stats"
import GenreBookGroup from "@/components/genre-book-group"

interface Book {
  id: string
  title: string
  authors?: string
  genre?: string
  cover?: string
  availableCopies?: number
}

// Floating particles component
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
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
          {i % 4 === 0 ? (
            <BookOpen className="w-6 h-6 text-blue-300" />
          ) : i % 4 === 1 ? (
            <BookOpen className="w-4 h-4 text-yellow-300" />
          ) : i % 4 === 2 ? (
            <Heart className="w-5 h-5 text-pink-300" />
          ) : (
            <Sparkles className="w-4 h-4 text-purple-300" />
          )}
        </motion.div>
      ))}
    </div>
  )
}

// Stats component
const StatsSection = ({
  totalBooks,
  totalBorrowedBooks,
  totalUsers,
}: { totalBooks: number; totalBorrowedBooks: number; totalUsers: number }) => {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {[
        {
          icon: BookOpen,
          label: "Всего книг",
          value: totalBooks,
          color: "from-blue-500 to-cyan-500",
          bgColor: "bg-blue-50",
        },
        {
          icon: Users,
          label: "Читателей",
          value: totalUsers,
          color: "from-green-500 to-emerald-500",
          bgColor: "bg-green-50",
        },
        {
          icon: Award,
          label: "На руках",
          value: totalBorrowedBooks,
          color: "from-purple-500 to-pink-500",
          bgColor: "bg-purple-50",
        },
      ].map((stat, index) => (
        <motion.div
          key={stat.label}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <motion.div
                    className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    {stat.value.toLocaleString()}
                  </motion.div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

// Enhanced search component
const EnhancedSearch = ({ searchQuery, setSearchQuery, onSubmit, onClear }: any) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Защита от ошибок гидрации
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const focusInput = () => {
    if (typeof document !== 'undefined') {
      const input = document.querySelector('input[type="search"]') as HTMLInputElement
      input?.focus()
    }
  }

  return (
    <motion.div
      className="mb-16 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      <form onSubmit={onSubmit} className="relative">
        <motion.div
          className={`relative flex items-center bg-white/95 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 px-4 ${
            isFocused ? "border-blue-400 shadow-blue-200/50 shadow-2xl" : "border-white/40 hover:border-blue-300"
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={focusInput}
        >
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl pointer-events-none" />

          {/* Иконка лупы */}
          <motion.button
            type="button"
            className="relative z-10 p-2 rounded-full hover:bg-blue-100 transition-all duration-200"
            onClick={focusInput}
            animate={isMounted ? { rotate: isFocused ? 360 : 0 } : {}}
            transition={{ duration: 0.6 }}
            whileHover={isMounted ? { scale: 1.1 } : {}}
            whileTap={isMounted ? { scale: 0.9 } : {}}
          >
            <Search className="h-6 w-6 text-blue-500" />
          </motion.button>

          {/* Поле ввода */}
          <Input
            type="search"
            placeholder="Поиск книги..."
            className="flex-1 h-12 md:h-14 text-lg md:text-xl border-none focus:ring-0 bg-transparent placeholder:text-gray-500 font-medium px-4 relative z-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </motion.div>

        {/* Search suggestions */}
        <motion.div
          className="flex flex-wrap gap-3 mt-6 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {["Фантастика", "Детективы", "Романы", "Научная литература", "Биографии"].map((tag, index) => (
            <motion.button
              key={tag}
              type="button"
              className="px-5 py-3 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 border border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl"
              onClick={() => setSearchQuery(tag)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={isMounted ? { scale: 1.08, y: -2 } : {}}
              whileTap={isMounted ? { scale: 0.95 } : {}}
            >
              {tag}
            </motion.button>
          ))}
        </motion.div>
      </form>
    </motion.div>
  )
}

// Enhanced book card component
const EnhancedBookCard = ({ book, index, isFavorite, onToggleFavorite }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.6 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href={`/readers/books/${book.id}`}>
        <motion.div className="relative" whileHover={isMounted ? { y: -10 } : {}} transition={{ type: "spring", stiffness: 300 }}>
          {/* Book 3D representation */}
          <div
            className="relative w-full overflow-visible flex items-center justify-center"
            style={{ height: "280px" }}
          >
            <motion.div
              className="transform-gpu transition-all duration-500"
              whileHover={isMounted ? { scale: 1.1, rotateY: 15 } : {}}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Book
                color={book.cover ? "#3B82F6" : "#6B7280"}
                width={200}
                depth={4}
                variant="default"
                illustration={
                  book.cover ? (
                    <NextImage
                      src={book.cover}
                      alt={book.title}
                      width={200}
                      height={240}
                      className="object-cover rounded"
                    />
                  ) : undefined
                }
              >
                <div></div>
              </Book>
            </motion.div>


          </div>

          {/* Enhanced book info card */}
          <motion.div
            className="mt-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20 text-center relative overflow-hidden"
            whileHover={isMounted ? {
              y: -5,
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15)",
            } : {}}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Gradient overlay on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />

            <div className="relative z-10">
              <motion.h3
                className="font-bold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 mb-2"
                whileHover={isMounted ? { scale: 1.05 } : {}}
              >
                {book.title}
              </motion.h3>
              <p className="text-gray-600 text-sm line-clamp-1 mb-2">{book.authors}</p>
              {book.genre && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                  {book.genre}
                </Badge>
              )}

              {/* Additional info */}
              <div className="flex justify-center items-center gap-4 mt-3 text-xs text-gray-500">
                {book.availableCopies && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {book.availableCopies} экз.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Link>

      {/* Enhanced favorite button */}
      <motion.button
        className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/20 hover:bg-white transition-all duration-200"
        onClick={() => onToggleFavorite(book)}
        whileHover={isMounted ? { scale: 1.1 } : {}}
        whileTap={isMounted ? { scale: 0.9 } : {}}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 + index * 0.05 }}
      >
        <Heart
          fill={isFavorite ? "#ef4444" : "none"}
          className={`w-5 h-5 transition-colors ${isFavorite ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}
        />
      </motion.button>
    </motion.div>
  )
}

// Enhanced collection component
const EnhancedBookCollection = ({ title, icon, books, viewAll, favoriteBookIds, onToggleFavorite, delay = 0 }: any) => {
  return (
    <motion.div
      className="mb-20"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
    >
      <div className="flex items-center justify-between mb-8">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            {icon}
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h2>
            <p className="text-gray-500 text-sm">Откройте для себя лучшие книги</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href={viewAll}>
            <Button
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-blue-50 hover:border-blue-200 rounded-xl px-6 py-3 font-semibold transition-all duration-300"
            >
              Все книги
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
        {books.map((book: Book, index: number) => (
          <EnhancedBookCard
            key={book.id}
            book={book}
            index={index}
            isFavorite={favoriteBookIds.has(book.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </motion.div>
  )
}

// Enhanced loading component
const EnhancedLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <FloatingElements />

      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <motion.div
            className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-96 mx-auto mb-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-64 mx-auto"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
          />
        </div>

        {/* Search skeleton */}
        <motion.div
          className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl max-w-4xl mx-auto mb-16"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
        />

        {/* Loading animation */}
        <div className="flex justify-center items-center py-20">
          <motion.div
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full"></div>
            <motion.div
              className="absolute inset-2 border-4 border-purple-200 border-t-purple-500 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Main component
export default function ReadersHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const currentUserId = user?.id

  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([])
  const [popularBooks, setPopularBooks] = useState<Book[]>([])
  const [newBooks, setNewBooks] = useState<Book[]>([])
  const [allBooks, setAllBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [favoriteBookIds, setFavoriteBookIds] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  // Real library stats
  const { stats: libraryStats, loading: statsLoading } = useLibraryStats()
  const stats = {
    totalBooks: libraryStats?.totalBooks || 0,
    totalBorrowedBooks: libraryStats?.totalBorrowedBooks || 0,
    totalUsers: libraryStats?.totalUsers || 0,
  }

  // Группировка книг по жанрам
  const booksByGenre = useMemo(() => {
    const map = new Map<string, Book[]>()
    
    allBooks.forEach((book) => {
      // Обрабатываем жанры, разделенные запятыми
      const genres = book.genre ? 
        book.genre.split(',').map(g => g.trim()).filter(g => g.length > 0) : 
        ['Прочие']
      
      // Если жанров нет, добавляем в "Прочие"
      if (genres.length === 0) {
        genres.push('Прочие')
      }
      
      // Добавляем книгу в каждый жанр
      genres.forEach(genre => {
        if (!map.has(genre)) {
          map.set(genre, [])
        }
        map.get(genre)!.push(book)
      })
    })
    
    // Сортируем жанры по количеству книг (убывание)
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [allBooks])

  useEffect(() => {
    if (!currentUserId) return

    const fetchFavoriteBooks = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/FavoriteBook/user/${currentUserId}`)
        if (!response.ok) {
          console.warn("Не удалось загрузить избранные книги или их нет:", response.status)
          setFavoriteBookIds(new Set())
          return
        }
        const favoriteBooks: { bookId: string }[] = await response.json()
        setFavoriteBookIds(new Set(favoriteBooks.map((fav) => fav.bookId)))
      } catch (error) {
        console.error("Ошибка при загрузке избранных книг:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список избранных книг.",
          variant: "destructive",
        })
      }
    }

    fetchFavoriteBooks()
  }, [currentUserId, baseUrl])

  const handleToggleFavorite = async (book: Book) => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему, чтобы добавлять книги в избранное.",
        variant: "default",
        action: (
          <Button variant="outline" onClick={() => router.push("/auth/login")}>
            Войти
          </Button>
        ),
      })
      return
    }

    const bookId = book.id
    const isCurrentlyFavorite = favoriteBookIds.has(bookId)
    const originalFavorites = new Set(favoriteBookIds)

    setFavoriteBookIds((prevFavorites) => {
      const newFavorites = new Set(prevFavorites)
      if (isCurrentlyFavorite) {
        newFavorites.delete(bookId)
      } else {
        newFavorites.add(bookId)
      }
      return newFavorites
    })

    try {
      let response
      if (isCurrentlyFavorite) {
        response = await fetch(`${baseUrl}/api/FavoriteBook/${currentUserId}/${bookId}`, {
          method: "DELETE",
        })
      } else {
        const favoriteData = {
          userId: currentUserId,
          bookId: book.id,
          bookTitle: book.title || "Без названия",
          bookAuthors: book.authors || "Неизвестный автор",
          bookCover: book.cover || "/placeholder.svg",
          dateAdded: new Date().toISOString(),
        }

        response = await fetch(`${baseUrl}/api/FavoriteBook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(favoriteData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Server error data:", errorData)
        throw new Error(errorData.message || `Ошибка сервера: ${response.status}`)
      }

      toast({
        title: "Успех!",
        description: isCurrentlyFavorite ? "Книга удалена из избранного." : "Книга добавлена в избранное.",
      })
    } catch (error) {
      setFavoriteBookIds(originalFavorites)
      console.error("Ошибка при обновлении избранного:", error)
      toast({
        title: "Ошибка",
        description: (error as Error).message || "Не удалось обновить статус избранного.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${baseUrl}/api/books`)
        if (!response.ok) {
          throw new Error("Ошибка при получении книг")
        }
        const data = await response.json()
        const processedBooks = data.map((book: any) => {
          const coverUrl =
            book.cover || book.coverImage || book.coverImageUrl || book.image || book.coverUrl || book.imageUrl || ""
          return {
            id: book.id,
            title: book.title,
            authors: Array.isArray(book.authors) ? book.authors.join(", ") : book.authors,
            genre: book.genre,
            cover: coverUrl,
            availableCopies: book.availableCopies,
          }
        })

        setAllBooks(processedBooks)

        // Популярные книги - сортируем по количеству доступных экземпляров (убывание)
        const sortedByPopularity = [...processedBooks].sort((a, b) => {
          const aCount = a.availableCopies || 0
          const bCount = b.availableCopies || 0
          return bCount - aCount
        })

        // Недавние книги - сортируем по ID (предполагаем, что новые книги имеют больший ID)
        const sortedByRecent = [...processedBooks].sort((a, b) => {
          return Number.parseInt(b.id) - Number.parseInt(a.id)
        })

        setPopularBooks(sortedByPopularity.slice(0, 6))
        setNewBooks(sortedByRecent.slice(0, 6))
      } catch (error) {
        console.error("Ошибка получения книг", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить книги",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  // Фильтрация книг при поиске
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBooks([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const query = searchQuery.toLowerCase().trim()

    const filtered = allBooks.filter((book) => {
      const titleMatch = book.title?.toLowerCase().includes(query)
      const authorMatch = book.authors?.toLowerCase().includes(query)
      const genreMatch = book.genre?.toLowerCase().includes(query)

      return titleMatch || authorMatch || genreMatch
    })

    setFilteredBooks(filtered)
  }, [searchQuery, allBooks])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/readers/books?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
  }

  const handleBookClick = (book: Book) => {
    router.push(`/readers/books/${book.id}`)
  }

  if (loading || statsLoading) {
    return <EnhancedLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background elements */}
      <FloatingElements />

      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 relative z-10">
        {/* Enhanced Header */}
        <motion.header
          className="mb-16 text-center relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
            }}
          />

          <motion.h1
            className="text-5xl md:text-7xl font-extrabold mb-6 relative"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 bg-clip-text text-transparent">
              Добро пожаловать в
            </span>
            <br/>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent relative">
              Библиотеку
              <motion.div
                className="absolute -top-4 -right-4 text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                ✨
              </motion.div>
            </span>
          </motion.h1>

        </motion.header>

        {/* Stats Section */}
        <StatsSection totalBooks={stats.totalBooks} totalBorrowedBooks={stats.totalBorrowedBooks} totalUsers={stats.totalUsers} />

        {/* Enhanced Search */}
        <EnhancedSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSubmit={handleSearch}
          onClear={clearSearch}
        />

        {/* Search Results */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-8">
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ x: -30 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                      Результаты поиска для "{searchQuery}"
                    </h2>
                    <p className="text-gray-500">Найдено: {filteredBooks.length} книг(и)</p>
                  </div>
                </motion.div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-xl"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-xl"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
                  {filteredBooks.map((book, index) => (
                    <EnhancedBookCard
                      key={book.id}
                      book={book}
                      index={index}
                      isFavorite={favoriteBookIds.has(book.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">Книги не найдены</h3>
                  <p className="text-gray-500 text-lg mb-6">
                    Попробуйте изменить поисковый запрос или воспользуйтесь предложенными категориями
                  </p>
                  <Button
                    onClick={clearSearch}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl px-6 py-3"
                  >
                    Очистить поиск
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collections - only show when not searching */}
        {!isSearching && (
          <>
            {/* Popular Books */}
            {popularBooks.length > 0 && (
              <EnhancedBookCollection
                title="Популярные книги"
                icon={<TrendingUp className="w-6 h-6 text-white" />}
                books={popularBooks}
                viewAll="/readers/books?sort=popular"
                favoriteBookIds={favoriteBookIds}
                onToggleFavorite={handleToggleFavorite}
                delay={0.3}
              />
            )}

            {/* New Books */}
            {newBooks.length > 0 && (
              <EnhancedBookCollection
                title="Новинки"
                icon={<Clock className="w-6 h-6 text-white" />}
                books={newBooks}
                viewAll="/readers/books?sort=newest"
                favoriteBookIds={favoriteBookIds}
                onToggleFavorite={handleToggleFavorite}
                delay={0.4}
              />
            )}

            {/* Книги по жанрам */}
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-8">
                <motion.div
                  className="flex items-center gap-3"
                  whileHover={isMounted ? { scale: 1.02 } : {}}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center shadow-lg"
                    whileHover={isMounted ? { rotate: 360 } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <BookOpen className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Книги по жанрам</h2>
                    <p className="text-gray-500 text-sm">Исследуйте коллекцию по категориям</p>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {booksByGenre.map(([genreName, genreBooks]) => (
                  <GenreBookGroup
                    key={genreName}
                    genreName={genreName}
                    books={genreBooks}
                    onBookClick={handleBookClick}
                    onToggleFavorite={handleToggleFavorite}
                    favoriteBookIds={favoriteBookIds}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
