"use client"

import type React from "react"
import { useAuth } from "@/lib/auth"
import { Heart, Sparkles, X } from "lucide-react"
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
  Grid3X3,
  List,
} from "lucide-react"
import { useRouter } from "next/navigation"
import GenreBookGroup from "@/components/genre-book-group"
import BookCarousel from "@/components/ui/book-carousel"
import ReservationSummaryCard from "@/components/ReservationSummaryCard"

interface Book {
  id: string
  title: string
  authors?: string
  genre?: string
  cover?: string
  availableCopies?: number
}

interface CarouselBook {
  id: number
  title: string
  author: string
  cover: string
  rating: number
  category: string
  year: number
  description: string
}

const toCarouselBook = (book: Book): CarouselBook => ({
  id: parseInt(book.id, 10) || 0, // Fallback to 0 if NaN
  title: book.title,
  author: book.authors || "Неизвестный автор",
  cover: book.cover || "/placeholder.svg",
  rating: 0,
  category: book.genre || "Без категории",
  year: 0,
  description: "",
})

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

// Enhanced search component
const EnhancedSearch = ({ searchQuery, setSearchQuery, onClear, isSearching }: any) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div
      className="mb-12 max-w-2xl mx-auto relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      layout
    >
      <motion.div
        className={`relative flex items-center bg-white/95 backdrop-blur-xl border-2 rounded-2xl shadow-lg transition-all duration-300 ${
          isFocused ? "border-blue-400 shadow-blue-200/50" : "border-white/40 hover:border-blue-300"
        } ${isSearching ? 'rounded-b-none' : ''}`}
        layout
      >
        <div className="pl-4">
          <Search className="h-6 w-6 text-blue-500" />
        </div>
        <Input
          type="search"
          placeholder="Поиск по названию, автору или жанру..."
          className="flex-1 h-14 text-lg border-none focus:ring-0 bg-transparent placeholder:text-gray-500 font-medium px-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
      </motion.div>
    </motion.div>
  )
}


const SearchResultItem = ({ book, onToggleFavorite, isFavorite, onBookClick }: any) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => onBookClick(book)}
            className="p-4 hover:bg-blue-50 cursor-pointer flex items-start gap-4 transition-colors duration-200"
        >
            <div className="w-16 h-24 relative flex-shrink-0">
                {book.cover ? (
                    <NextImage
                        src={book.cover}
                        alt={book.title}
                        fill
                        className="object-cover rounded-md"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                )}
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-md text-gray-800 line-clamp-2">{book.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-1">{book.authors}</p>
                {book.genre && (
                    <Badge variant="secondary" className="mt-2 text-xs bg-blue-100 text-blue-700 border-blue-200">
                        {book.genre}
                    </Badge>
                )}
            </div>
            <motion.button
                className="ml-auto bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/20 hover:bg-white transition-all duration-200"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(book);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <Heart
                    fill={isFavorite ? "#ef4444" : "none"}
                    className={`w-5 h-5 transition-colors ${isFavorite ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}
                />
            </motion.button>
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

  const [popularBooks, setPopularBooks] = useState<Book[]>([])
  const [allBooks, setAllBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [favoriteBookIds, setFavoriteBookIds] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

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
        const processedBooks: Book[] = data.map((book: any) => {
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
        
        const uniqueBooks = Array.from(new Map(processedBooks.map(book => [book.id, book])).values());

        setAllBooks(uniqueBooks)

        // Популярные книги - сортируем по количеству доступных экземпляров (убывание)
        const sortedByPopularity = [...uniqueBooks].sort((a, b) => {
          const aCount = a.availableCopies || 0
          const bCount = b.availableCopies || 0
          return bCount - aCount
        })

        setPopularBooks(sortedByPopularity.slice(0, 10))
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

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
  }

  const handleBookClick = (book: Book) => {
    router.push(`/readers/books/${book.id}`)
  }

  if (loading) {
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
          className="mb-12 text-center relative"
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
        </motion.header>

        {/* Enhanced Search */}
        <div className="relative">
            <EnhancedSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onClear={clearSearch}
                isSearching={isSearching}
            />

            <AnimatePresence>
            {isSearching && (
                <motion.div
                    className="absolute top-full left-0 right-0 max-w-2xl mx-auto z-20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <Card className="bg-white/95 backdrop-blur-xl border-t-0 rounded-t-none rounded-b-2xl shadow-2xl overflow-hidden">
                       <CardContent className="p-0">
                           {filteredBooks.length > 0 ? (
                               <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                                   {filteredBooks.map((book) => (
                                       <SearchResultItem
                                           key={book.id}
                                           book={book}
                                           isFavorite={favoriteBookIds.has(book.id)}
                                           onToggleFavorite={handleToggleFavorite}
                                           onBookClick={handleBookClick}
                                       />
                                   ))}
                               </div>
                           ) : (
                            <div className="text-center py-16 px-6">
                                <motion.div
                                    className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                >
                                    <BookOpen className="w-10 h-10 text-gray-400" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-gray-600 mb-2">Ничего не найдено</h3>
                                <p className="text-gray-500">Попробуйте изменить поисковый запрос.</p>
                            </div>
                           )}
                       </CardContent>
                    </Card>
                </motion.div>
            )}
            </AnimatePresence>
        </div>


        {/* Collections - only show when not searching */}
        <AnimatePresence>
        {!isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{delay: 0.2}}
          >
            {/* Reservation Summary */}
            <motion.div
                className="mb-16"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <ReservationSummaryCard userId={currentUserId} />
            </motion.div>

            {/* Popular Books */}
            {popularBooks.length > 0 && (
              <motion.div
                className="mb-16"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Популярные книги</h2>
                  </div>
                  <BookCarousel books={popularBooks.map(toCarouselBook)} />
              </motion.div>
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
                >
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg"
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
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  )
}
