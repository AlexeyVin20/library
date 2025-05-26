"use client"

import type React from "react"
import { useAuth } from "@/lib/auth"
import { Heart } from "lucide-react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, ChevronRight, TrendingUp, Clock, BookOpenCheck, ChevronLeft } from "lucide-react"
import BookCover from "@/components/BookCover"
import { useRouter } from "next/navigation"

interface Book {
  id: string
  title: string
  authors?: string
  genre?: string
  cover?: string
  availableCopies?: number
}

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

// Featured Book Component
const FeaturedBook = ({ book, isFavorite, onToggleFavorite }: { book: Book; isFavorite: boolean; onToggleFavorite: (book: Book) => void }) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl shadow-lg h-[400px] md:h-[500px] backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
      {book.cover ? (
        <NextImage src={book.cover || "/placeholder.svg"} alt={book.title} fill className="object-cover" priority />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900">
          <BookOpen className="text-emerald-500 w-24 h-24" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{book.title}</h2>
        <p className="text-gray-200 mb-4">{book.authors}</p>
        <div className="flex items-center gap-4">
          <Link href={`/readers/books/${book.id}`}>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">Подробнее</Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(book)}
            className="text-white hover:text-emerald-400"
            aria-label="Toggle Favorite"
          >
            <Heart fill={isFavorite ? "currentColor" : "none"} className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Featured Book Small Component
const FeaturedBookSmall = ({ book, isFavorite, onToggleFavorite }: { book: Book; isFavorite: boolean; onToggleFavorite: (book: Book) => void }) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl shadow-lg h-[150px] backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 mb-4"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
      {book.cover ? (
        <NextImage src={book.cover || "/placeholder.svg"} alt={book.title} fill className="object-cover" priority />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900">
          <BookOpen className="text-emerald-500 w-12 h-12" />
        </div>
      )}
      <div className="absolute top-0 left-0 bottom-0 p-4 z-20 text-white flex flex-col justify-center max-w-[70%]">
        <h3 className="text-lg font-bold mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-gray-200 text-sm line-clamp-1">{book.authors}</p>
        <div className="flex items-center gap-2 mt-2">
          <Link href={`/readers/books/${book.id}`}>
            <Button size="sm" variant="outline" className="text-xs border-white/50 hover:bg-white/20">Подробнее</Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(book)}
            className="text-white hover:text-emerald-400 p-1"
            aria-label="Toggle Favorite"
          >
            <Heart fill={isFavorite ? "currentColor" : "none"} className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Featured Books Carousel
const FeaturedBooksCarousel = ({ books, favoriteBookIds, onToggleFavorite }: { books: Book[]; favoriteBookIds: Set<string>; onToggleFavorite: (book: Book) => void }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        {books.length > 0 && <FeaturedBook book={books[0]} isFavorite={favoriteBookIds.has(books[0].id)} onToggleFavorite={onToggleFavorite} />}
      </div>
      <div className="flex flex-col justify-between">
        {books.slice(1, 4).map((book, index) => (
          <FeaturedBookSmall key={book.id} book={book} isFavorite={favoriteBookIds.has(book.id)} onToggleFavorite={onToggleFavorite} />
        ))}
      </div>
    </div>
  )
}

// Book Collection Component
const BookCollection = ({
  title,
  icon,
  books,
  viewAll,
  favoriteBookIds,
  onToggleFavorite,
}: {
  title: string
  icon: React.ReactNode
  books: Book[]
  viewAll: string
  favoriteBookIds: Set<string>
  onToggleFavorite: (book: Book) => void
}) => {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
        </div>
        <Link href={viewAll}>
          <Button
            variant="ghost"
            className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          >
            Все книги
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {books.map((book, index) => (
          <div key={book.id} className="relative">
            <Link href={`/readers/books/${book.id}`}>
              <motion.div
                className="group text-gray-700 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.1 + index * 0.05, duration: 0.5 },
                }}
              >
                <div className="relative w-full overflow-visible" style={{ perspective: "1000px", height: "240px" }}>
                  <motion.div
                    className="absolute inset-0 transform-gpu transition-all duration-500 preserve-3d"
                    initial={{ rotateY: 15 }}
                    whileHover={{ rotateY: 0, scale: 1.05 }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="relative" style={{ width: "180px", height: "260px" }}>
                        <BookCover
                          coverColor="rgba(168, 212, 218, 0.5)"
                          coverImage={book.cover || ""}
                          variant="medium"
                          className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 rounded-xl shadow-lg w-full h-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
                <motion.div
                  className="mt-2 backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-3 shadow-md border border-white/20 dark:border-gray-700/30 text-center"
                  whileHover={{
                    y: -3,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <p className="font-semibold line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {book.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{book.authors}</p>
                  {book.genre && <p className="text-xs text-gray-500 dark:text-gray-400">{book.genre}</p>}
                </motion.div>
              </motion.div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(book)}
              className="absolute top-2 right-2 z-10 text-gray-700 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full p-1.5"
              aria-label="Toggle Favorite"
            >
              <Heart fill={favoriteBookIds.has(book.id) ? "currentColor" : "none"} className="w-5 h-5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReadersHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const currentUserId = user?.id

  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([])
  const [popularBooks, setPopularBooks] = useState<Book[]>([])
  const [newBooks, setNewBooks] = useState<Book[]>([])
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [favoriteBookIds, setFavoriteBookIds] = useState<Set<string>>(new Set())

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

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
        setFavoriteBookIds(new Set(favoriteBooks.map(fav => fav.bookId)))
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

        // For demo purposes, we'll just shuffle the books and use them for different sections
        const shuffled = [...processedBooks].sort(() => 0.5 - Math.random())

        setFeaturedBooks(shuffled.slice(0, 4)) // Берем 4 книги для карусели
        setPopularBooks(shuffled.slice(4, 10))
        setNewBooks(shuffled.slice(10, 16))
        setRecommendedBooks(shuffled.slice(16, 22))
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

  const handleToggleFavorite = async (book: Book) => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему, чтобы добавлять книги в избранное.",
        variant: "default",
        action: <Link href="/auth/login"><Button variant="outline">Войти</Button></Link>
      })
      return
    }

    const bookId = book.id
    const isCurrentlyFavorite = favoriteBookIds.has(bookId)
    const originalFavorites = new Set(favoriteBookIds)

    setFavoriteBookIds(prevFavorites => {
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
        console.log("Sending to POST /api/FavoriteBook:", favoriteData)
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/readers/books?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 dark:from-slate-900 dark:via-gray-900 dark:to-teal-900 min-h-screen">
        {/* Header Section */}
        <FadeInView>
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-4">
              Добро пожаловать в <span className="text-emerald-600 dark:text-emerald-400">Библиотеку</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Откройте для себя мир знаний и приключений. Найдите свою следующую любимую книгу.
            </p>
          </header>
        </FadeInView>

        {/* Search Bar */}
        <FadeInView delay={0.1}>
          <form onSubmit={handleSearch} className="mb-12 max-w-2xl mx-auto">
            <div className="relative backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 border border-white/30 dark:border-gray-700/40 rounded-xl shadow-lg">
              <Input
                type="search"
                placeholder="Поиск книг, авторов, жанров..."
                className="w-full pl-12 pr-4 py-6 text-lg border-none focus:ring-2 focus:ring-emerald-500 rounded-xl bg-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
          </form>
        </FadeInView>

        {/* Loading Indicator */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 min-h-screen">
      {/* Header Section */}
      <FadeInView>
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-4">
            Добро пожаловать в <span className="text-emerald-600 dark:text-emerald-400">Библиотеку</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Откройте для себя мир знаний и приключений. Найдите свою следующую любимую книгу.
          </p>
        </header>
      </FadeInView>

      {/* Search Bar */}
      <FadeInView delay={0.1}>
        <form onSubmit={handleSearch} className="mb-12 max-w-2xl mx-auto">
          <div className="relative backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 border border-white/30 dark:border-gray-700/40 rounded-xl shadow-lg">
            <Input
              type="search"
              placeholder="Поиск книг, авторов, жанров..."
              className="w-full pl-12 pr-4 py-6 text-lg border-none focus:ring-2 focus:ring-emerald-500 rounded-xl bg-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
        </form>
      </FadeInView>

      {/* Featured Books Carousel */}
      {featuredBooks.length > 0 && (
        <FadeInView delay={0.2}>
          <FeaturedBooksCarousel books={featuredBooks} favoriteBookIds={favoriteBookIds} onToggleFavorite={handleToggleFavorite} />
        </FadeInView>
      )}
      
      <div className="mt-12"></div> {/* Spacer */}

      {/* Popular Books */}
      {popularBooks.length > 0 && (
        <FadeInView delay={0.3}>
          <BookCollection
            title="Популярные книги"
            icon={<TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
            books={popularBooks}
            viewAll="/readers/books?sort=popular"
            favoriteBookIds={favoriteBookIds}
            onToggleFavorite={handleToggleFavorite}
          />
        </FadeInView>
      )}

      {/* New Books */}
      {newBooks.length > 0 && (
        <FadeInView delay={0.4}>
          <BookCollection
            title="Новинки"
            icon={<Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
            books={newBooks}
            viewAll="/readers/books?sort=newest"
            favoriteBookIds={favoriteBookIds}
            onToggleFavorite={handleToggleFavorite}
          />
        </FadeInView>
      )}

      {/* Recommended Books */}
      {recommendedBooks.length > 0 && (
        <FadeInView delay={0.5}>
          <BookCollection
            title="Рекомендации для вас"
            icon={<BookOpenCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
            books={recommendedBooks}
            viewAll="/readers/books?category=recommended"
            favoriteBookIds={favoriteBookIds}
            onToggleFavorite={handleToggleFavorite}
          />
        </FadeInView>
      )}
    </div>
  )
}
