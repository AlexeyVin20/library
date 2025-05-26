"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Heart, BookOpen, Search, AlertTriangle, Trash2 } from "lucide-react"
import BookCover from "@/components/BookCover" // Предполагаем, что этот компонент существует

interface FavoriteBookEntry {
  userId: string
  bookId: string
  bookTitle: string
  bookAuthors?: string
  bookCover?: string
  dateAdded: string
}

const FavoriteBookCard = ({ book, onRemove }: { book: FavoriteBookEntry; onRemove: (bookId: string) => void }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-xl shadow-lg backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 border border-white/30 dark:border-gray-700/40"
    >
      <Link href={`/readers/books/${book.bookId}`} className="block">
        <div className="relative w-full aspect-[2/3]">
          {book.bookCover ? (
            <NextImage src={book.bookCover} alt={book.bookTitle} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900">
              <BookOpen className="text-emerald-500 w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/readers/books/${book.bookId}`}>
          <h3 className="font-semibold text-lg line-clamp-2 text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {book.bookTitle}
          </h3>
        </Link>
        {book.bookAuthors && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mt-1">{book.bookAuthors}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(book.bookId)}
        className="absolute top-3 right-3 z-10 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm rounded-full p-1.5 transition-all"
        aria-label="Удалить из избранного"
      >
        <Trash2 className="w-5 h-5" />
      </Button>
    </motion.div>
  )
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const currentUserId = user?.id
  const [favoriteBooks, setFavoriteBooks] = useState<FavoriteBookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false)
      // Можно показать сообщение "Войдите, чтобы просмотреть избранное" или перенаправить на логин
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
        setFavoriteBooks(data)
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

  const handleRemoveFromFavorites = async (bookId: string) => {
    if (!currentUserId) {
      toast({ title: "Ошибка", description: "Пользователь не найден.", variant: "destructive" })
      return
    }

    // Оптимистичное удаление из UI
    const originalBooks = [...favoriteBooks]
    setFavoriteBooks(prevBooks => prevBooks.filter(book => book.bookId !== bookId))

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
      // Откат UI в случае ошибки
      setFavoriteBooks(originalBooks)
      toast({
        title: "Ошибка",
        description: (err as Error).message || "Не удалось удалить книгу из избранного.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">Требуется авторизация</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Пожалуйста, войдите в систему, чтобы просмотреть свои избранные книги.
        </p>
        <Link href="/auth/login">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <BookOpen className="mr-2 h-5 w-5" />
            Войти
          </Button>
        </Link>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">Ошибка загрузки</h2>
        <p className="text-gray-600 dark:text-gray-300">{error}</p>
         <Button onClick={() => window.location.reload()} variant="outline" className="mt-6">
            Попробовать снова
        </Button>
      </div>
    )
  }

  if (favoriteBooks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center">
        <Heart className="w-16 h-16 text-emerald-400 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">Список избранного пуст</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Вы еще не добавили ни одной книги в избранное. Начните исследовать нашу коллекцию!
        </p>
        <Link href="/readers">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Search className="mr-2 h-5 w-5" />
            Найти книги
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
          Мои <span className="text-emerald-600 dark:text-emerald-400">избранные</span> книги
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 md:mb-12">
          Здесь собраны все книги, которые вы отметили как избранные.
        </p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="hidden"
        animate="show"
      >
        {favoriteBooks.map(book => (
          <FavoriteBookCard key={book.bookId} book={book} onRemove={handleRemoveFromFavorites} />
        ))}
      </motion.div>
    </div>
  )
} 