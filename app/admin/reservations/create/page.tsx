"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Plus, Calendar, Book, User, FileText, Search, X, Check, BookOpen } from "lucide-react"
import Image from "next/image"

interface UserType {
  id: string
  fullName: string
  email?: string
  phone?: string
}

interface BookType {
  id: string
  title: string
  authors?: string
  availableCopies: number
  cover?: string
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

export default function CreateReservationPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserType[]>([])
  const [books, setBooks] = useState<BookType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    userId: "",
    bookId: "",
    reservationDate: new Date().toISOString().split("T")[0],
    expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  const [showUserModal, setShowUserModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [bookSearch, setBookSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null)
  const userSearchRef = useRef<HTMLInputElement>(null)
  const bookSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersResponse, booksResponse] = await Promise.all([
        fetch(`${baseUrl}/api/User`),
        fetch(`${baseUrl}/api/Books`),
      ])

      if (!usersResponse.ok) throw new Error("Ошибка при загрузке пользователей")
      if (!booksResponse.ok) throw new Error("Ошибка при загрузке книг")

      const [usersData, booksData] = await Promise.all([usersResponse.json(), booksResponse.json()])

      setUsers(usersData)
      setBooks(booksData.filter((book: BookType) => book.availableCopies > 0))

      // Add this inside the useEffect after setting users and books
      if (formData.userId) {
        const user = usersData.find((u: UserType) => u.id === formData.userId)
        if (user) setSelectedUser(user)
      }
      if (formData.bookId) {
        const book = booksData.find((b: BookType) => b.id === formData.bookId)
        if (book) setSelectedBook(book)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Преобразуем даты в формат ISO
      const reservationDate = new Date(formData.reservationDate).toISOString();
      const expirationDate = new Date(formData.expirationDate).toISOString();
      
      const response = await fetch(`${baseUrl}/api/Reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reservationDate,
          expirationDate,
          status: "Обрабатывается",
        }),
      })

      if (!response.ok) throw new Error("Ошибка при создании резервирования")
      router.push("/admin/reservations")
    } catch (err) {
      console.error("Ошибка при создании резервирования:", err)
      alert(err instanceof Error ? err.message : "Ошибка при создании резервирования")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <>
      <div className="min-h-screen relative">
        {/* Floating shapes */}
        <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
        <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto p-6 relative z-10">
          {/* Header */}
          <FadeInView>
            <div className="mb-8 flex items-center gap-4">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
                <Link
                  href="/admin/reservations"
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="font-medium text-white">Назад к резервированиям</span>
                </Link>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl font-bold text-white"
              >
                Создание резервирования
              </motion.h1>
            </div>
          </FadeInView>

          {/* Main Content */}
          <FadeInView delay={0.2}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-red-500/20 border border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6"
              >
                {error}
              </motion.div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                <motion.div
                  className="backdrop-blur-xl bg-green-500/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30 text-white"
                  whileHover={{
                    y: -5,
                    boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                        <User className="h-4 w-4 text-white" />
                        Пользователь
                      </label>
                      <motion.button
                        type="button"
                        onClick={() => setShowUserModal(true)}
                        className="w-full backdrop-blur-xl bg-green-500/30 border border-white/20 dark:border-gray-700/30 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 rounded-lg px-4 py-2 text-left text-white shadow-sm flex justify-between items-center"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {selectedUser ? selectedUser.fullName : "Выберите пользователя"}
                        <User className="h-4 w-4 text-white" />
                      </motion.button>
                      <input type="hidden" name="userId" value={formData.userId} required />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                        <Book className="h-4 w-4 text-white" />
                        Книга
                      </label>
                      <motion.button
                        type="button"
                        onClick={() => setShowBookModal(true)}
                        className="w-full backdrop-blur-xl bg-green-500/30 border border-white/20 dark:border-gray-700/30 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 rounded-lg px-4 py-2 text-left text-white shadow-sm flex justify-between items-center"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {selectedBook ? selectedBook.title : "Выберите книгу"}
                        <Book className="h-4 w-4 text-white" />
                      </motion.button>
                      <input type="hidden" name="bookId" value={formData.bookId} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="reservationDate" className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-white" />
                          Дата резервирования
                        </label>
                        <input
                          type="date"
                          id="reservationDate"
                          name="reservationDate"
                          value={formData.reservationDate}
                          onChange={handleChange}
                          required
                          className="w-full backdrop-blur-xl bg-green-500/30 border border-white/20 dark:border-gray-700/30 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 rounded-lg px-4 py-2 text-white shadow-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="expirationDate" className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-white" />
                          Дата окончания
                        </label>
                        <input
                          type="date"
                          id="expirationDate"
                          name="expirationDate"
                          value={formData.expirationDate}
                          onChange={handleChange}
                          required
                          className="w-full backdrop-blur-xl bg-green-500/30 border border-white/20 dark:border-gray-700/30 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 rounded-lg px-4 py-2 text-white shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-white" />
                        Примечания (опционально)
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full backdrop-blur-xl bg-green-500/30 border border-white/20 dark:border-gray-700/30 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 rounded-lg px-4 py-2 text-white shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <motion.button
                      type="submit"
                      className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                      whileHover={{
                        y: -3,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="h-4 w-4" />
                      Создать резервирование
                    </motion.button>
                  </div>
                </motion.div>
              </form>
            )}
          </FadeInView>
        </div>
      </div>
      
      {/* Модальное окно для выбора пользователя */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              className="bg-green-500/20 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-white/20 shadow-xl"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Выберите пользователя</h2>
                  <motion.button
                    onClick={() => setShowUserModal(false)}
                    className="text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>

                <div className="mb-4 relative">
                  <div className="relative">
                    <Search className="h-5 w-5 text-emerald-300 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Поиск пользователя..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full backdrop-blur-xl bg-green-500/50 border border-white/20 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 rounded-lg text-white"
                      ref={userSearchRef}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[50vh] pr-2 space-y-2">
                  {users
                    .filter((user) => user.fullName.toLowerCase().includes(userSearch.toLowerCase()))
                    .map((user) => (
                      <motion.div
                        key={user.id}
                        className={`p-3 rounded-lg backdrop-blur-xl ${
                          formData.userId === user.id
                            ? "bg-emerald-600/80 border-white/40"
                            : "bg-green-500/30 hover:bg-green-500/50"
                        } border border-white/20 cursor-pointer transition-colors`}
                        whileHover={{ y: -2, backgroundColor: "rgba(16, 185, 129, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, userId: user.id }))
                          setSelectedUser(user)
                          setShowUserModal(false)
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-white">{user.fullName}</h3>
                            {user.email && <p className="text-sm text-white">{user.email}</p>}
                            {user.phone && <p className="text-sm text-white">{user.phone}</p>}
                          </div>
                          {formData.userId === user.id && <Check className="h-5 w-5 text-emerald-300" />}
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно для выбора книги */}
      <AnimatePresence>
        {showBookModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBookModal(false)}
          >
            <motion.div
              className="bg-green-500/20 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-white/20 shadow-xl"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Выберите книгу</h2>
                  <motion.button
                    onClick={() => setShowBookModal(false)}
                    className="text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>

                <div className="mb-4 relative">
                  <div className="relative">
                    <Search className="h-5 w-5 text-emerald-300 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Поиск книги..."
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full backdrop-blur-xl bg-green-500/50 border border-white/20 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300 rounded-lg text-white"
                      ref={bookSearchRef}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[50vh] pr-2 space-y-2">
                  {books
                    .filter(
                      (book) =>
                        book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
                        (book.authors && book.authors.toLowerCase().includes(bookSearch.toLowerCase()))
                    )
                    .map((book) => (
                      <motion.div
                        key={book.id}
                        className={`p-3 rounded-lg backdrop-blur-xl ${
                          formData.bookId === book.id
                            ? "bg-emerald-600/80 border-white/40"
                            : "bg-green-500/30 hover:bg-green-500/50"
                        } border border-white/20 cursor-pointer transition-colors`}
                        whileHover={{ y: -2, backgroundColor: "rgba(16, 185, 129, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, bookId: book.id }))
                          setSelectedBook(book)
                          setShowBookModal(false)
                        }}
                      >
                        <div className="flex gap-4">
                          {book.cover && (
                            <div className="flex-shrink-0 w-16 h-24 relative rounded-md overflow-hidden">
                              <Image
                                src={book.cover}
                                alt={book.title}
                                fill
                                style={{ objectFit: "cover" }}
                                className="rounded-md"
                              />
                            </div>
                          )}
                          
                          <div className="flex-grow flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium text-white">{book.title}</h3>
                              {book.authors && <p className="text-sm text-white">{book.authors}</p>}
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-emerald-300">
                                <BookOpen className="h-4 w-4 inline mr-1" />
                                {book.availableCopies} {book.availableCopies === 1 ? "доступная копия" : "доступные копии"}
                              </span>
                              {formData.bookId === book.id && <Check className="h-5 w-5 text-emerald-300" />}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

