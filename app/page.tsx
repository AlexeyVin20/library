"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import ReaderNavigation from "@/components/reader-navigation"
import {
  BookOpen,
  Users,
  Shield,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Users2,
  Clock,
  Star,
  BookMarked,
  Loader2,
  Sparkles,
  Library,
  ChevronRight,
  Zap,
  Heart,
  Target,
  Rocket,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import dynamic from "next/dynamic"
import { formatNumber } from "@/lib/utils"
import { PinContainer } from "@/components/ui/3d-pin"
import { useLibraryStats } from "@/hooks/use-library-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LibraryFeaturesSectionWithHoverEffects } from "@/components/feature-section-with-hover-effects"

const PixelCanvas = dynamic(() => import("@/components/ui/pixel-canvas").then((mod) => mod.PixelCanvas), {
  ssr: false,
})

// Floating particles component - убираем Math.random() для избежания проблем с гидратацией
const FloatingParticles = () => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Предопределенные позиции для избежания проблем с гидратацией
  const particleConfigs = [
    { left: 10, top: 20, duration: 15, delay: 0 },
    { left: 25, top: 40, duration: 18, delay: 1 },
    { left: 45, top: 15, duration: 12, delay: 2 },
    { left: 60, top: 60, duration: 20, delay: 3 },
    { left: 80, top: 30, duration: 16, delay: 4 },
    { left: 15, top: 70, duration: 14, delay: 1 },
    { left: 35, top: 85, duration: 19, delay: 2 },
    { left: 55, top: 10, duration: 13, delay: 3 },
    { left: 75, top: 50, duration: 17, delay: 4 },
    { left: 90, top: 80, duration: 15, delay: 0 },
    { left: 5, top: 50, duration: 16, delay: 1 },
    { left: 30, top: 25, duration: 18, delay: 2 },
    { left: 50, top: 75, duration: 14, delay: 3 },
    { left: 70, top: 5, duration: 20, delay: 4 },
    { left: 85, top: 45, duration: 12, delay: 0 },
    { left: 20, top: 65, duration: 17, delay: 1 },
    { left: 40, top: 35, duration: 15, delay: 2 },
    { left: 65, top: 90, duration: 19, delay: 3 },
    { left: 78, top: 25, duration: 13, delay: 4 },
    { left: 95, top: 60, duration: 16, delay: 0 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particleConfigs.map((config, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: config.duration,
            repeat: Infinity,
            delay: config.delay,
          }}
          style={{
            left: `${config.left}%`,
            top: `${config.top}%`,
          }}
        />
      ))}
    </div>
  )
}

// Предположим, что у вас есть тип для роли пользователя
type UserRole = "Администратор" | "Пользователь" | null

// Интерфейс для статистики
interface StatCard {
  label: string
  value: string
  icon: any
  color: string
  trend?: string
  bgGradient: string
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [mounted, setMounted] = useState(false)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, -50])
  const y2 = useTransform(scrollY, [0, 300], [0, -100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0.8])

  const { user, isLoading } = useAuth()
  const { stats: libraryStats, loading: statsLoading, error: statsError } = useLibraryStats()

  // Эффект для предотвращения гидратационных ошибок
  useEffect(() => {
    setMounted(true)
  }, [])

  // Эффект для темы
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") || "light"
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      const initialTheme = savedTheme === "dark" || (savedTheme === "system" && prefersDark) ? "dark" : "light"
      setTheme(initialTheme as "light" | "dark")
      if (initialTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [])

  // Эффект для установки роли пользователя из контекста аутентификации
  useEffect(() => {
    if (!isLoading && user) {
      if (user.roles && user.roles.includes("Администратор")) {
        setUserRole("Администратор")
      } else {
        setUserRole("Пользователь")
      }
    } else if (!isLoading && !user) {
      setUserRole(null)
    }
  }, [user, isLoading])

  // Формируем карточки статистики из реальных данных
  const getStatCards = (): StatCard[] => {
    if (!libraryStats) return []

    return [
      {
        label: "Всего книг",
        value: formatNumber(libraryStats.totalBooks),
        icon: BookOpen,
        color: "text-blue-600",
        bgGradient: "from-blue-500 to-cyan-500",
      },
      {
        label: "Всего читателей",
        value: formatNumber(libraryStats.totalUsers),
        icon: Users2,
        color: "text-emerald-600",
        bgGradient: "from-emerald-500 to-teal-500",
      },
      {
        label: "Книг в каталоге",
        value: formatNumber(libraryStats.totalAvailableBooks),
        icon: TrendingUp,
        color: "text-purple-600",
        bgGradient: "from-purple-500 to-pink-500",
      },
    ]
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  }

  // Если компонент еще не смонтирован, показываем базовую структуру без анимаций
  if (!mounted) {
    return (
      <div className="min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
        <ReaderNavigation />
        <main className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center space-y-12">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-blue-700 via-purple-600 to-blue-500 bg-clip-text text-transparent leading-tight">
              Библиотека
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                будущего
              </span>
            </h1>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Навигация */}
      <ReaderNavigation />

      {/* Анимированный фон */}
      <div className="fixed inset-0 z-0">
        <PixelCanvas
          colors={
            theme === "dark"
              ? ["#1e293b", "#334155", "#475569", "#64748b"]
              : ["#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8"]
          }
          speed={30}
          gap={8}
          noFocus={true}
        />
        <FloatingParticles />
      </div>

      {/* Gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-transparent via-white/10 to-blue-500/10 dark:from-transparent dark:via-black/10 dark:to-blue-900/20" />

      <main className="relative z-10 container mx-auto px-4 py-20 space-y-32">
        {/* Героическая секция */}
        <motion.div style={{ y: y1, opacity }} className="text-center space-y-12 relative">
          {/* Floating elements - убираем проверку window */}
          <motion.div
            className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute -top-10 -right-32 w-32 h-32 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 1.2,
              delay: 0.2,
              type: "spring",
              stiffness: 100,
            }}
            className="relative"
          >
            <motion.h1
              className="text-6xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-blue-700 via-purple-600 to-blue-500 bg-clip-text text-transparent leading-tight relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Библиотека
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent relative">
                будущего
                <motion.div
                  className="absolute -top-4 -right-4 text-2xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  ✨
                </motion.div>
              </span>
            </motion.h1>
          </motion.div>

          <motion.p
            className="text-xl md:text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 max-w-5xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            Откройте мир знаний с современными технологиями управления библиотечными ресурсами.
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium">
              {" "}
              Интуитивный интерфейс, мощная аналитика и персонализированный опыт.
            </span>
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-6 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 text-lg px-8 py-4 rounded-2xl relative overflow-hidden group"
                asChild
              >
                <Link href="/readers">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <Library className="w-6 h-6 mr-3" />
                  Начать чтение
                  <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>

            {userRole === "Администратор" && (
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 text-lg px-8 py-4 rounded-2xl backdrop-blur-sm bg-white/50 dark:bg-black/20 hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link href="/admin">
                    <Shield className="w-6 h-6 mr-3" />
                    Админ-панель
                  </Link>
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Улучшенная статистика */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {statsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl overflow-hidden">
                    <CardContent className="flex items-center justify-center p-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Loader2 className="w-12 h-12 text-blue-500" />
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : statsError ? (
              <motion.div variants={itemVariants} className="col-span-full">
                <Card className="bg-red-50/80 backdrop-blur-xl border-red-200 shadow-2xl rounded-3xl">
                  <CardContent className="p-8">
                    <p className="text-red-600 text-center text-lg">{statsError}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              getStatCards().map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.05,
                    y: -10,
                    rotateY: 5,
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group"
                >
                  <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden rounded-3xl relative">
                    {/* Gradient background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
                    />

                    <CardContent className="p-8 relative">
                      <div className="flex items-center justify-center mb-6">
                        <motion.div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center shadow-lg`}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                        >
                          <stat.icon className="w-8 h-8 text-white" />
                        </motion.div>
                      </div>
                      <motion.div
                        className={`text-4xl font-bold ${stat.color} mb-3 group-hover:scale-110 transition-transform duration-300`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: 0.3 + index * 0.1,
                        }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-gray-600 dark:text-gray-400 text-lg font-medium">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        </motion.div>

        {/* Секция возможностей */}
        <motion.div
          style={{ y: y2 }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="space-y-16"
        >
          <div className="text-center space-y-6">
            <motion.h2
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              whileInView={{ scale: [0.8, 1] }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Возможности платформы
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              Современные инструменты для эффективной работы с библиотечными ресурсами
            </motion.p>
          </div>
          <LibraryFeaturesSectionWithHoverEffects />
        </motion.div>

        {/* Основные разделы с улучшенными 3D-пинами */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Раздел для читателей */}
          <div>
            <PinContainer title="Перейти к чтению" href="/readers" className="h-full">
              <Card className="h-full border-0 shadow-none bg-transparent">
                <CardContent className="flex flex-col h-full p-8 space-y-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div
                        className="w-24 h-24 rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110 hover:rotate-3"
                      >
                        <BookOpen className="w-12 h-12 text-white" />
                      </div>
                      <motion.div
                        className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                        animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                      </motion.div>
                    </div>
                  </div>

                  <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
                    Читательский портал
                  </CardTitle>
                </CardContent>
              </Card>
            </PinContainer>
          </div>

          {/* Раздел для администраторов */}
          {userRole === "Администратор" && (
            <div>
              <PinContainer title="Панель управления" href="/admin" className="h-full">
                <Card className="h-full border-0 shadow-none bg-transparent">
                  <CardContent className="flex flex-col h-full p-8 space-y-8">
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative">
                        <div
                          className="w-24 h-24 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110 hover:-rotate-3"
                        >
                          <Shield className="w-12 h-12 text-white" />
                        </div>
                        <motion.div
                          className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-400 to-orange-500 rounded-full"
                          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      </div>
                    </div>

                    <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
                      Администрирование
                    </CardTitle>
                  </CardContent>
                </Card>
              </PinContainer>
            </div>
          )}
        </div>

        {/* Секция популярных категорий */}
        {libraryStats && libraryStats.categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <Card className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="text-center space-y-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-12">
                <motion.div
                  initial={{ scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Популярные категории
                  </CardTitle>
                </motion.div>
                <CardDescription className="text-xl text-gray-600 dark:text-gray-400">
                  Откройте для себя самые востребованные разделы нашей библиотеки
                </CardDescription>
              </CardHeader>

              <CardContent className="p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {libraryStats.categories.map((category, index) => (
                    <motion.div
                      key={category.name}
                      className="space-y-4 p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:shadow-xl transition-all duration-500 group cursor-pointer"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <motion.div
                            className={`w-4 h-4 rounded-full bg-gradient-to-r ${
                              index % 4 === 0
                                ? "from-blue-500 to-cyan-500"
                                : index % 4 === 1
                                  ? "from-purple-500 to-pink-500"
                                  : index % 4 === 2
                                    ? "from-green-500 to-emerald-500"
                                    : "from-orange-500 to-red-500"
                            } shadow-lg`}
                            whileHover={{ scale: 1.5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                          <span className="font-bold text-lg text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {category.name}
                          </span>
                        </div>

                        <Badge
                          variant="secondary"
                          className="bg-white/70 text-gray-700 border-gray-200 px-4 py-2 text-sm font-semibold shadow-sm"
                        >
                          {formatNumber(category.count)} книг
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Популярность</span>
                          <span className="font-bold">{category.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="relative">
                          <Progress value={category.percentage} className="h-3 bg-gray-200 dark:bg-gray-700" />
                          <motion.div
                            className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${category.percentage}%` }}
                            transition={{ duration: 1.5, delay: index * 0.2 }}
                            viewport={{ once: true }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Информационная секция */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <Card className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden rounded-3xl">
            <CardHeader className="text-center space-y-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-12">
              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Возможности системы
                </CardTitle>
              </motion.div>
              <CardDescription className="text-xl text-gray-600 dark:text-gray-400">
                Полный спектр инструментов для современной библиотеки
              </CardDescription>
            </CardHeader>

            <CardContent className="p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <motion.div
                  className="space-y-8"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <BookOpen className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Для читателей</h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      { text: "Интеллектуальный поиск по каталогу", icon: Target },
                      { text: "Система резервирования книг", icon: Clock },
                      { text: "Персональная история чтения", icon: BookMarked },
                      { text: "Умные рекомендации на основе ИИ", icon: Sparkles },
                    ].map((item, index) => (
                      <motion.div
                        key={item.text}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 cursor-pointer group"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ x: 10 }}
                        viewport={{ once: true }}
                      >
                        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                          <item.icon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </motion.div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="space-y-8"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-xl"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Shield className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Для администраторов</h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      { text: "Автоматизированное управление коллекцией", icon: Rocket },
                      { text: "Детальная аналитика и отчетность", icon: BarChart3 },
                      { text: "Гибкий контроль пользователей", icon: Users },
                      { text: "Система уведомлений в реальном времени", icon: Zap },
                    ].map((item, index) => (
                      <motion.div
                        key={item.text}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 cursor-pointer group"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ x: 10 }}
                        viewport={{ once: true }}
                      >
                        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                          <item.icon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        </motion.div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {item.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Улучшенный футер */}
      <footer className="relative z-10 container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl max-w-6xl mx-auto rounded-3xl overflow-hidden">
            <CardContent className="p-12">
              <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
                {[
                  { href: "#", icon: "/file.svg", label: "Справка", color: "hover:text-blue-600 hover:bg-blue-50" },
                  { href: "#", icon: "/window.svg", label: "Каталог", color: "hover:text-green-600 hover:bg-green-50" },
                  {
                    href: "#",
                    icon: "/globe.svg",
                    label: "Контакты",
                    color: "hover:text-purple-600 hover:bg-purple-50",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    viewport={{ once: true }}
                  >
                    <Button
                      variant="ghost"
                      className={`group flex items-center gap-4 text-gray-700 ${item.color} dark:hover:bg-opacity-20 transition-all duration-300 px-6 py-4 rounded-2xl text-lg`}
                      asChild
                    >
                      <Link href={item.href}>
                        <Image
                          aria-hidden
                          src={item.icon || "/placeholder.svg"}
                          alt={`${item.label} icon`}
                          width={28}
                          height={28}
                          className="group-hover:scale-110 transition-transform duration-300"
                        />
                        <span className="font-semibold">{item.label}</span>
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </footer>
    </div>
  )
}
