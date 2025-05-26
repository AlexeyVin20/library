"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Filter, BookMarked, ArrowUpDown, ChevronDown, Heart } from "lucide-react"
import BookCover from "@/components/BookCover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"

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

export default function BooksPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const currentUserId = user?.id

  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState("asc")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [favoriteBookIds, setFavoriteBookIds] = useState<Set<string>>(new Set())

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  useEffect(() => {
    const fetchBooksAndFavorites = async () => {
      try {
        setLoading(true)
        const booksResponse = await fetch(`${baseUrl}/api/books`)
        if (!booksResponse.ok) {
          throw new Error("Ошибка при получении книг")
        }
        const booksData = await booksResponse.json()
        const processedBooks = booksData.map((book: { 
          id: string; 
          title: string; 
          authors?: any; // Можно уточнить, если известен формат
          genre?: string; 
          cover?: string; 
          coverImage?: string; 
          coverImageUrl?: string; 
          image?: string; 
          coverUrl?: string; 
          imageUrl?: string; 
          availableCopies?: number; 
          // rating поле удалено из Book интерфейса, так что здесь оно не нужно
        }) => {
          const coverUrl =
            book.cover || book.coverImage || book.coverImageUrl || book.image || book.coverUrl || book.imageUrl || ""
          return {
            id: book.id,
            title: book.title,
            authors: Array.isArray(book.authors) ? book.authors.join(", ") : book.authors,
            genre: book.genre || "Общая литература",
            cover: coverUrl,
            availableCopies: book.availableCopies,
          }
        })
        const uniqueGenres = Array.from(new Set(processedBooks.map((book: Book) => book.genre || ""))).filter(Boolean)
        setGenres(uniqueGenres as string[])
        setBooks(processedBooks)
        setFilteredBooks(processedBooks)

        if (currentUserId) {
          const favResponse = await fetch(`${baseUrl}/api/FavoriteBook/user/${currentUserId}`)
          if (favResponse.ok) {
            const favoriteBooksData: { bookId: string }[] = await favResponse.json()
            setFavoriteBookIds(new Set(favoriteBooksData.map(fav => fav.bookId)))
          } else {
            console.warn("Не удалось загрузить избранные книги или их нет:", favResponse.status)
            setFavoriteBookIds(new Set())
          }
        }

      } catch (error) {
        console.error("Ошибка получения данных:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные для страницы книг.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBooksAndFavorites()
  }, [currentUserId, baseUrl])

  // Apply filters and sorting
  useEffect(() => {
    let result = [...books]

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (book.authors && book.authors.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (book.genre && book.genre.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply genre filter
    if (selectedGenres.length > 0) {
      result = result.filter((book) => book.genre && selectedGenres.includes(book.genre))
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.title.localeCompare(b.title)
      } else {
        return b.title.localeCompare(a.title)
      }
    })

    setFilteredBooks(result)
  }, [books, searchQuery, selectedGenres, sortOrder])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedGenres([])
    setSortOrder("asc")
  }

  // Функция для добавления/удаления из избранного
  const handleToggleFavorite = async (book: Book) => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему, чтобы добавлять книги в избранное.",
        variant: "default",
        action: <Link href="/auth/login"><Button variant="outline">Войти</Button></Link>,
      })
      return
    }

    const bookId = book.id
    const isCurrentlyFavorite = favoriteBookIds.has(bookId)
    const originalFavorites = new Set(favoriteBookIds)

    // Оптимистичное обновление UI
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

  return (
    <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <FadeInView>
          <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 border-b border-white/20 dark:border-gray-700/30 p-4 rounded-xl shadow-lg mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="h-6 w-6 text-emerald-500" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Каталог книг</h1>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Поиск книг..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-10 pr-4 py-2 text-gray-700 dark:text-gray-200 shadow-md w-[200px] md:w-[300px]"
                  />
                </form>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Жанры
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem onClick={clearFilters}>Сбросить фильтры</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {genres.map((genre) => (
                      <DropdownMenuCheckboxItem
                        key={genre}
                        checked={selectedGenres.includes(genre)}
                        onCheckedChange={() => toggleGenre(genre)}
                      >
                        {genre}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortOrder === "asc" ? "А-Я" : "Я-А"}
                </Button>
              </div>
            </div>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
              />
            </div>
          ) : filteredBooks.length === 0 ? (
            <motion.div
              className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-2xl p-12 shadow-lg border border-white/20 dark:border-gray-700/30 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-xl text-gray-700 dark:text-gray-200">Книги не найдены</p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Попробуйте изменить параметры поиска</p>
              <Button className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredBooks.map((book, index) => (
                <div key={book.id} className="relative group">
                  <Link href={`/readers/books/${book.id}`}>
                    <motion.div
                      className="text-gray-700 dark:text-white"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: 0.1 + index * 0.05, duration: 0.5 },
                      }}
                    >
                      <div className="relative w-full h-64 overflow-visible" style={{ perspective: "1000px" }}>
                        <motion.div
                          className="absolute inset-0 transform-gpu transition-all duration-500 preserve-3d"
                          initial={{ rotateY: 15 }}
                          whileHover={{ rotateY: 0, scale: 1.05 }}
                        >
                          <BookCover
                            coverColor="rgba(47, 47, 47, 0.5)"
                            coverImage={book.cover || ""}
                            variant="medium"
                            className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-lg w-full h-full"
                          />
                        </motion.div>
                      </div>
                      <motion.div
                        className="mt-2 backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-3 shadow-md border border-white/20 dark:border-gray-700/30"
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
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFavorite(book); 
                    }}
                    className="absolute top-2 right-2 z-20 text-gray-700 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Toggle Favorite"
                  >
                    <Heart fill={favoriteBookIds.has(book.id) ? "currentColor" : "none"} className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </FadeInView>
      </div>
    </div>
  )
}
