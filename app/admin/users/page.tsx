"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Users, UserPlus, ChevronRight, ArrowRight, ChevronLeft, Shield } from "lucide-react"
import { UsersPieChart } from "@/components/admin/UsersPieChart"
import { UserBorrowingChart } from "@/components/admin/UserBorrowingChart"
import { FinesChart } from "@/components/admin/FinesChart"

// CSS для анимации строк таблицы
const fadeInAnimation = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
`

interface User {
  id: string
  fullName: string
  email: string
  username: string
  borrowedBooksCount: number
  maxBooksAllowed: number
  fineAmount: number
  isActive: boolean
  phone: string
  role: string
}

interface Reservation {
  id: string
  userId: string
  bookId: string
  reservationDate: string
  expirationDate: string
  status: string
  book?: { title: string }
}

const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
)

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  delay = 0,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  color: string
  delay?: number
}) => (
  <FadeInView delay={delay}>
    <motion.div
      className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between border border-white/20 dark:border-gray-700/30 relative overflow-hidden"
      whileHover={{
        y: -5,
        boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-white dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <div
          className={`w-10 h-10 rounded-full ${color} bg-opacity-20 dark:bg-opacity-30 flex items-center justify-center shadow-inner`}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className={`text-4xl font-bold mb-2 ${color.replace("bg-", "text-")}`}>{value}</p>
        <p className="text-sm text-white dark:text-white">{subtitle}</p>
      </div>
      <Link href="/admin/statistics" className="mt-4">
        <span className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium flex items-center">
          Подробная статистика
          <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </Link>
    </motion.div>
  </FadeInView>
)

const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center h-screen">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
    />
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium"
    >
      Загрузка данных...
    </motion.p>
  </div>
)

// Добавляем определение компонента Section
const Section = ({
  title,
  children,
  action,
  delay = 0,
}: {
  title: string
  children: React.ReactNode
  action?: { label: string; href: string }
  delay?: number
}) => (
  <FadeInView delay={delay}>
    <motion.div
      className="backdrop-blur-xl bg-green/20 dark:bg-green/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-white/20 dark:border-gray-700/30"
      whileHover={{
        y: -5,
        boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white dark:text-white">{title}</h2>
        {action && (
          <Link href={action.href}>
            <motion.span
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors text-sm font-medium flex items-center"
              whileHover={{ x: 3 }}
            >
              {action.label}
              <ChevronRight className="w-4 h-4 ml-1" />
            </motion.span>
          </Link>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </motion.div>
  </FadeInView>
)

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof User>("fullName")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  // Вставка CSS анимации в DOM
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [usersResponse, reservationsResponse] = await Promise.all([
        fetch(`${baseUrl}/api/User`),
        fetch(`${baseUrl}/api/Reservation`),
      ])

      if (!usersResponse.ok) throw new Error("Ошибка при загрузке пользователей")
      if (!reservationsResponse.ok) throw new Error("Ошибка при загрузке резерваций")

      const usersData = await usersResponse.json()
      const reservationsData = await reservationsResponse.json()

      setUsers(usersData)
      setReservations(reservationsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных")
    } finally {
      setLoading(false)
    }
  }, [baseUrl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const usersWithNextReturn = useMemo(
    () =>
      users.map((user) => {
        const userReservations = reservations.filter((r) => r.userId === user.id && r.status === "Выполнена")
        const nextReservation =
          userReservations.length > 0
            ? userReservations.sort(
                (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime(),
              )[0]
            : null
        return {
          ...user,
          nextReturnDate: nextReservation?.expirationDate
            ? new Date(nextReservation.expirationDate).toLocaleDateString("ru-RU")
            : "Нет",
          nextReturnBook: nextReservation?.book?.title || "Нет",
        }
      }),
    [users, reservations],
  )

  const filteredUsers = useMemo(
    () =>
      usersWithNextReturn.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [usersWithNextReturn, searchTerm],
  )

  const sortedUsers = useMemo(
    () =>
      [...filteredUsers].sort((a, b) => {
        if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1
        if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1
        return 0
      }),
    [filteredUsers, sortField, sortDirection],
  )

  const activeUsersCount = useMemo(() => users.filter((u) => u.isActive).length, [users])
  const totalBorrowed = useMemo(() => users.reduce((sum, user) => sum + user.borrowedBooksCount, 0), [users])
  const totalFines = useMemo(() => users.reduce((sum, user) => sum + (user.fineAmount || 0), 0), [users])

  const finesData = useMemo(
    () =>
      users
        .filter((u) => u.fineAmount > 0)
        .map((u) => ({
          name: u.fullName,
          value: u.fineAmount,
        })),
    [users],
  )

  const borrowingChartData = useMemo(
    () => ({
      borrowed: totalBorrowed,
      available: users.reduce((sum, user) => sum + (user.maxBooksAllowed - user.borrowedBooksCount), 0),
      reservations: reservations.filter((r) => r.status === "Обрабатывается").length,
    }),
    [users, reservations, totalBorrowed],
  )

  const handleDeleteUser = useCallback(
    async (id: string) => {
      if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return
      try {
        const response = await fetch(`${baseUrl}/api/User/${id}`, {
          method: "DELETE",
        })
        if (!response.ok) throw new Error("Ошибка при удалении пользователя")
        setUsers(users.filter((user) => user.id !== id))
      } catch (err) {
        alert(err instanceof Error ? err.message : "Ошибка при удалении пользователя")
      }
    },
    [users, baseUrl],
  )

  const handleSort = (field: keyof User) => {
    setSortField(field)
    setSortDirection(sortField === field && sortDirection === "asc" ? "desc" : "asc")
  }

  if (loading) return <LoadingSpinner />

  if (error)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-screen p-6"
      >
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-red-600 dark:text-red-400 p-6 rounded-xl border border-white/20 dark:border-gray-700/30 max-w-md w-full text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Произошла ошибка</h2>
          <p>{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="mt-4 bg-emerald-500/90 hover:bg-emerald-600/90 text-white px-4 py-2 rounded-lg font-medium shadow-md backdrop-blur-md"
          >
            Попробовать снова
          </motion.button>
        </div>
      </motion.div>
    )

  return (
    <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <main className="max-w-7xl mx-auto space-y-8 relative z-10 p-6">
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              <Link
                href="/admin"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Назад</span>
              </Link>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-bold text-white dark:text-white"
            >
              Пользователи
            </motion.h1>

            <div className="ml-auto flex gap-3">
              <Link href="/admin/roles">
                <motion.button
                  className="bg-blue-500/90 hover:bg-blue-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                  whileHover={{
                    y: -3,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Shield className="h-4 w-4" />
                  Управление ролями
                </motion.button>
              </Link>
              <Link href="/admin/users/create">
                <motion.button
                  className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                  whileHover={{
                    y: -3,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <UserPlus className="h-4 w-4" />
                  Добавить пользователя
                </motion.button>
              </Link>
            </div>
          </div>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Активные пользователи"
            value={activeUsersCount}
            subtitle={`из ${users.length} пользователей`}
            icon={<Users className="w-5 h-5 text-emerald-500" />}
            color="bg-emerald-500"
            delay={0.1}
          />
          <StatCard
            title="Взято книг"
            value={totalBorrowed}
            subtitle="всего на руках"
            icon={<Users className="w-5 h-5 text-emerald-400" />}
            color="bg-emerald-400"
            delay={0.2}
          />
          <StatCard
            title="Штрафы"
            value={totalFines}
            subtitle="общая сумма"
            icon={<Users className="w-5 h-5 text-white" />}
            color="bg-emerald-500"
            delay={0.3}
          />
        </div>

        
        <Section title="Список пользователей" delay={0.7}>
          <motion.input
            type="text"
            placeholder="Поиск по имени или email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg bg-green/20 dark:bg-green-800/40 backdrop-blur-md border border-white/30 dark:border-gray-700/30 text-white dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          />
          <div className="max-h-[400px] bg-green/10 dark:bg-green-800/70 backdrop-blur-md rounded-xl overflow-hidden border border-white/30 dark:border-gray-700/30">
            <div className="overflow-auto" style={{ height: 400 }}>
              <table className="min-w-full" cellPadding={0} cellSpacing={0}>
                <thead className="sticky top-0 bg-emerald-50/80 dark:bg-emerald-900/30 backdrop-blur-md">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white dark:text-white uppercase tracking-wider cursor-pointer bg-green/60 backdrop-blur-md"
                      onClick={() => handleSort("fullName")}
                    >
                      Имя {sortField === "fullName" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white dark:text-white uppercase tracking-wider cursor-pointer bg-green/60 backdrop-blur-md"
                      onClick={() => handleSort("email")}
                    >
                      Email {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white dark:text-white uppercase tracking-wider cursor-pointer bg-green/60 backdrop-blur-md"
                      onClick={() => handleSort("borrowedBooksCount")}
                    >
                      Книги {sortField === "borrowedBooksCount" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white dark:text-white uppercase tracking-wider bg-green/60 backdrop-blur-md">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.slice(0, 50).map((user, index) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/20 dark:border-gray-700/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                      style={{
                        opacity: 0,
                        transform: "translateX(-20px)",
                        animation: `fadeIn 0.5s ease-out ${0.1 * index}s forwards`,
                      }}
                    >
                      <td className="px-6 py-4 text-white dark:text-white">{user.fullName}</td>
                      <td className="px-6 py-4 text-white dark:text-white">{user.email}</td>
                      <td className="px-6 py-4 text-white dark:text-white">
                        {user.borrowedBooksCount}/{user.maxBooksAllowed}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link href={`/admin/users/${user.id}`}>
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-3 py-1 shadow-md backdrop-blur-md"
                          >
                            Подробнее
                          </motion.button>
                        </Link>
                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500/90 hover:bg-red-600/90 text-white font-medium rounded-lg px-3 py-1 shadow-md backdrop-blur-md"
                        >
                          Удалить
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {sortedUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-white dark:text-white"
          >
            Нет пользователей, соответствующих критериям поиска
          </motion.div>
        )}
      </main>
    </div>
  )
}
