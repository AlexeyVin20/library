"use client";

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LibraryFeaturesSectionWithHoverEffects } from "@/components/feature-section-with-hover-effects"
import { useRouter } from "next/navigation"
import EdgePeekingOwl from "@/components/ui/edge-peeking-owl"
import AuthHeader from "@/components/auth/AuthHeader"

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

// Небольшие мерцающие звёзды для фона
const SparklingStars = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const stars = [
    { left: 15, top: 10, size: 4, delay: 0 },
    { left: 35, top: 25, size: 3, delay: 1 },
    { left: 55, top: 40, size: 5, delay: 2 },
    { left: 75, top: 60, size: 4, delay: 3 },
    { left: 90, top: 20, size: 3, delay: 4 },
    { left: 10, top: 70, size: 5, delay: 2 },
    { left: 45, top: 85, size: 4, delay: 1 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, index) => (
        <motion.div
          key={index}
          className="absolute bg-yellow-300 rounded-full shadow-lg"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            left: `${star.left}%`,
            top: `${star.top}%`,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.8, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: star.delay }}
        />
      ))}
    </div>
  )
}

// Предположим, что у вас есть тип для роли пользователя
type UserRole = "Администратор" | "Пользователь" | "Библиотекарь" | null

// Интерфейс для статистики
interface StatCard {
  label: string
  value: string
  icon: any
  color: string
  trend?: string
  bgGradient: string
}

// Добавляю массивы функций для разных ролей
const readerFeatures = [
  { text: "Интеллектуальный поиск по каталогу", icon: Target },
  { text: "Система резервирования книг", icon: Clock },
  { text: "Персональная история чтения", icon: BookMarked },
  { text: "Умные рекомендации на основе ИИ", icon: Sparkles },
]

const adminFeatures = [
  { text: "Управление каталогом и экземплярами", icon: BookOpen },
  { text: "Мониторинг статистики и отчетность", icon: BarChart3 },
  { text: "Управление ролями и пользователями", icon: Users },
  { text: "Система уведомлений и оповещений", icon: Zap },
]

// Компонент-обертка с 3D-наклоном (по аналогии с ReservationSummaryCard)
const InfoCard3D = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17deg", "-17deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17deg", "17deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / rect.width - 0.5
    const yPct = mouseY / rect.height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative"
    >
      {/* Градиентная подложка для усиления 3D-эффекта */}
      <div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 opacity-30"
        style={{ transform: "translateZ(0px)", transformStyle: "preserve-3d" }}
      />

      {/* Основной контент немного приподнят */}
      <div
        style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}
        className="h-full w-full"
      >
        {children}
      </div>
    </motion.div>
  )
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
  const router = useRouter()

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
      } else if (user.roles && user.roles.includes("Библиотекарь")) {
        setUserRole("Библиотекарь")
      } else {
        setUserRole("Пользователь")
      }
    } else if (!isLoading && !user) {
      setUserRole(null)
    }
  }, [user, isLoading])

  // Редиректим пользователей по ролям
  useEffect(() => {
    if (!mounted) return
    if (userRole === "Администратор" || userRole === "Библиотекарь") {
      if (typeof window !== "undefined" && window.location.pathname !== "/admin") {
        router.push("/admin")
      }
    } else if (userRole === "Пользователь") {
      if (typeof window !== "undefined" && window.location.pathname !== "/readers") {
        router.push("/readers")
      }
    }
  }, [userRole, mounted, router])

  // Если компонент еще не смонтирован, показываем базовую структуру без анимаций
  if (!mounted) {
    return (
      <div className="min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
        <ReaderNavigation />
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
        <SparklingStars />
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
            {/* Логотип программы */}
            <div className="mb-8 flex justify-center">
              <AuthHeader />
            </div>
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

            {(userRole === "Администратор" || userRole === "Библиотекарь") && (
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
              <InfoCard3D>
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
              </InfoCard3D>
            </PinContainer>
          </div>

          {/* Раздел для администраторов */}
          {(userRole === "Администратор" || userRole === "Библиотекарь") && (
            <div>
              <PinContainer title="Панель управления" href="/admin" className="h-full">
                <InfoCard3D>
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
                </InfoCard3D>
              </PinContainer>
            </div>
          )}
        </div>

        {/* Информационная секция */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          {/* Заголовок секции */}
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Возможности системы
          </motion.h2>

          {/* Grid карточек */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Карточка для читателей */}
            <InfoCard3D>
              <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-10">
                  <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
                    Для читателей
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="w-full space-y-4 py-8 px-4 md:px-12">
                    {readerFeatures.map((item, index) => (
                      <motion.div
                        key={item.text}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 cursor-pointer group"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                          <item.icon className="w-6 h-6 text-green-500 flex-shrink-0" />
                        </motion.div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </InfoCard3D>

            {/* Карточка для администраторов */}
            {(userRole === "Администратор" || userRole === "Библиотекарь") && (
              <InfoCard3D>
                <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-10">
                    <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
                      Для администраторов
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="w-full space-y-4 py-8 px-4 md:px-12">
                      {adminFeatures.map((item, index) => (
                        <motion.div
                          key={item.text}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 cursor-pointer group"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                            <item.icon className="w-6 h-6 text-pink-500 flex-shrink-0" />
                          </motion.div>
                          <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {item.text}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </InfoCard3D>
            )}
          </div>
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

      {/* Сова, выглядывающая из-за краёв */}
      <EdgePeekingOwl />
    </div>
  )
}
