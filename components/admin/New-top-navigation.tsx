"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn, getInitials } from "@/lib/utils"
import { adminSideBarLinks } from "@/constants"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Search, Menu, Moon, Sun, UserIcon, Book, FileText, ExternalLink, Clock, LogOut, Settings, ChevronDown, X, BookOpen, Users, Calendar, BarChart2, Bookmark, CheckCircle2, AlertCircle, PlusCircle, ScrollText, LayoutGrid, Shield, PieChart, Home, HelpCircle, FileQuestion, Mail, Command, Zap } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import type React from "react"
import { useAuth, type User } from "@/lib/auth"

// Интерфейсы для результатов поиска
interface SearchResult {
  id: string | number
  title: string
  subtitle?: string
  type: "user" | "book" | "journal" | "page"
  url: string
  icon: React.ReactElement
}

interface SearchResultCategory {
  title: string
  icon: React.ReactElement
  results: SearchResult[]
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: "info" | "warning" | "success" | "error"
}

// Структура меню для мега-навигации
interface MegaMenuItem {
  title: string
  href: string
  description: string
  icon: React.ReactElement
}

interface MegaMenuSection {
  title: string
  items: MegaMenuItem[]
}

const TopNavigation = ({ user }: { user: User | null }) => {
  const { logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultCategory[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Новая книга добавлена",
      message: 'Книга "Война и мир" была добавлена в каталог',
      time: "2 часа назад",
      read: false,
      type: "success",
    },
    {
      id: "2",
      title: "Обновление системы",
      message: "Система была обновлена до версии 2.5.0",
      time: "Вчера",
      read: false,
      type: "info",
    },
    {
      id: "3",
      title: "Просроченные книги",
      message: "У 5 пользователей есть просроченные книги",
      time: "3 дня назад",
      read: true,
      type: "warning",
    },
  ])
  const [unreadCount, setUnreadCount] = useState(0)

  // Мега-меню структура с изображениями
  const megaMenuSections: MegaMenuSection[] = [
    {
      title: "Управление контентом",
      items: [
        {
          title: "Все книги",
          href: "/admin/books",
          description: "Просмотр и управление каталогом книг",
          icon: <BookOpen className="h-5 w-5" />,
        },
        {
          title: "Добавить книгу",
          href: "/admin/books/create",
          description: "Добавить новую книгу в каталог",
          icon: <PlusCircle className="h-5 w-5" />,
        },
        {
          title: "Журналы",
          href: "/admin/journals",
          description: "Управление журналами и подписками",
          icon: <ScrollText className="h-5 w-5" />,
        },
        {
          title: "Полки",
          href: "/admin/shelfs",
          description: "Организация и управление полками",
          icon: <Bookmark className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Пользователи и роли",
      items: [
        {
          title: "Все пользователи",
          href: "/admin/users",
          description: "Управление пользователями системы",
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: "Добавить пользователя",
          href: "/admin/users/create",
          description: "Регистрация нового пользователя",
          icon: <PlusCircle className="h-5 w-5" />,
        },
        {
          title: "Управление ролями",
          href: "/admin/roles",
          description: "Настройка ролей и разрешений",
          icon: <Shield className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Резервации и отчеты",
      items: [
        {
          title: "Резервирования",
          href: "/admin/reservations",
          description: "Управление резервациями книг",
          icon: <Calendar className="h-5 w-5" />,
        },
        {
          title: "Создать резервацию",
          href: "/admin/reservations/create",
          description: "Новая резервация книги",
          icon: <PlusCircle className="h-5 w-5" />,
        },
        {
          title: "Статистика",
          href: "/admin/statistics",
          description: "Аналитика и отчеты системы",
          icon: <PieChart className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Поддержка и помощь",
      items: [
        {
          title: "Справка",
          href: "/admin/help",
          description: "Документация и руководства",
          icon: <HelpCircle className="h-5 w-5" />,
        },
        {
          title: "FAQ",
          href: "/admin/faq",
          description: "Часто задаваемые вопросы",
          icon: <FileQuestion className="h-5 w-5" />,
        },
        {
          title: "Связаться с нами",
          href: "/admin/contact",
          description: "Техническая поддержка",
          icon: <Mail className="h-5 w-5" />,
        },
      ],
    },
  ]

  // Keyboard shortcut handler for backslash
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "\\" || e.key === "/") {
      e.preventDefault()
      setIsSearchOpen(true)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
    if (e.key === "Escape" && isSearchOpen) {
      setIsSearchOpen(false)
      setSearchQuery("")
      setSearchResults([])
    }
  }, [isSearchOpen])

  // Theme toggle effect
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = savedTheme === "dark" || (savedTheme === "system" && prefersDark) ? "dark" : "light"

    setTheme(initialTheme as "light" | "dark")

    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    const savedSearches = localStorage.getItem("recentSearches")
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches))
    }
  }, [])

  // Keyboard event listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // Calculate unread notifications
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Click outside search handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      const categorizedResults: SearchResultCategory[] = []
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

      if (!baseUrl) {
        console.error("NEXT_PUBLIC_BASE_URL не определен")
        return
      }

      try {
        const [usersResponse, booksResponse] = await Promise.all([
          fetch(`${baseUrl}/api/User`),
          fetch(`${baseUrl}/api/Books`),
        ])

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const filteredUsers = usersData.filter(
            (user: any) => user.username && user.username.toLowerCase().includes(query.toLowerCase()),
          )

          if (filteredUsers && filteredUsers.length > 0) {
            const userResults: SearchResult[] = filteredUsers.map((user: any) => ({
              id: user.id,
              title: user.username,
              type: "user" as const,
              url: `/admin/users/${user.id}`,
              icon: <UserIcon className="h-4 w-4 text-emerald-400" />,
            }))

            categorizedResults.push({
              title: "Пользователи",
              icon: <UserIcon className="h-4 w-4" />,
              results: userResults,
            })
          }
        }

        if (booksResponse.ok) {
          const booksData = await booksResponse.json()
          const filteredBooks = booksData.filter(
            (book: any) =>
              (book.title && book.title.toLowerCase().includes(query.toLowerCase())) ||
              (book.authors && book.authors.toLowerCase().includes(query.toLowerCase())),
          )

          if (filteredBooks && filteredBooks.length > 0) {
            const bookResults: SearchResult[] = filteredBooks.map((book: any) => ({
              id: book.id,
              title: book.title,
              subtitle: book.authors,
              type: "book" as const,
              url: `/admin/books/${book.id}`,
              icon: <Book className="h-4 w-4 text-amber-400" />,
            }))

            categorizedResults.push({
              title: "Книги",
              icon: <Book className="h-4 w-4" />,
              results: bookResults,
            })
          }
        }
      } catch (fetchError) {
        console.error("Ошибка при выполнении запросов к API:", fetchError)
      }

      // Static page search results
      const pageSearchResults = [
        {
          id: "dashboard",
          title: "Панель управления",
          type: "page" as const,
          url: "/admin",
          icon: <FileText className="h-4 w-4 text-purple-400" />,
        },
        {
          id: "users",
          title: "Управление пользователями",
          type: "page" as const,
          url: "/admin/users",
          icon: <FileText className="h-4 w-4 text-purple-400" />,
        },
        {
          id: "books",
          title: "Каталог книг",
          type: "page" as const,
          url: "/admin/books",
          icon: <FileText className="h-4 w-4 text-purple-400" />,
        },
        {
          id: "journals",
          title: "Журналы и подписки",
          type: "page" as const,
          url: "/admin/journals",
          icon: <FileText className="h-4 w-4 text-purple-400" />,
        },
        {
          id: "statistics",
          title: "Статистика",
          type: "page" as const,
          url: "/admin/statistics",
          icon: <FileText className="h-4 w-4 text-purple-400" />,
        },
        {
          id: "Shelfs",
          title: "Полки",
          type: "page" as const,
          url: "/admin/shelfs",
          icon: <FileText className="h-4 w-4 text-purple-400" />,
        },
      ].filter((page) => page.title.toLowerCase().includes(query.toLowerCase()))

      if (pageSearchResults.length > 0) {
        categorizedResults.push({
          title: "Страницы",
          icon: <FileText className="h-4 w-4" />,
          results: pageSearchResults,
        })
      }

      setSearchResults(categorizedResults)
    } catch (error) {
      console.error("Ошибка при поиске:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Search change handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (!isSearchOpen) {
      setIsSearchOpen(true)
    }

    performSearch(query)
  }

  // Search result click handler
  const handleSearchResultClick = (result: SearchResult) => {
    if (searchQuery.trim()) {
      const newRecentSearches = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery).slice(0, 4)]
      setRecentSearches(newRecentSearches)
      localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches))
    }

    setIsSearchOpen(false)
    setSearchQuery("")
    setSearchResults([])
    router.push(result.url)
  }

  // Select recent search
  const selectRecentSearch = (query: string) => {
    setSearchQuery(query)
    performSearch(query)
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-400" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case "info":
      default:
        return <Bell className="h-4 w-4 text-blue-400" />
    }
  }

  // Animation variants
  const logoVariants = {
    initial: { rotate: -90, opacity: 0, scale: 0.8 },
    animate: {
      rotate: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, 0],
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },
  }

  const navItemVariants = {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
    hover: {
      y: -3,
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  }

  const searchVariants = {
    closed: {
      width: "40px",
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    open: {
      width: "320px",
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  const searchResultsVariants = {
    hidden: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      filter: "blur(4px)",
      transition: { 
        duration: 0.2,
      },
    },
  }

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  const mobileMenuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
    exit: { opacity: 0, x: -20 },
  }

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur-xl transition-all duration-500",
        scrolled
          ? "bg-emerald-500/25 dark:bg-emerald-600/30 shadow-xl shadow-emerald-500/10"
          : "bg-emerald-500/20 dark:bg-emerald-600/25",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-emerald-600/10" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <motion.div
              variants={logoVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              className="flex-shrink-0 cursor-pointer"
            >
              <Link href="/admin">
                <div className="relative">
                  <Image 
                    src="/icons/admin/logo.png" 
                    alt="logo" 
                    height={40} 
                    width={40} 
                    className="object-contain drop-shadow-lg" 
                  />
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl" />
                </div>
              </Link>
            </motion.div>
            <motion.h1
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="text-2xl font-bold bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent drop-shadow-sm"
            >
              <Link href="/admin">Библиотека</Link>
            </motion.h1>
          </div>

          {/* Desktop Navigation with Mega Menu */}
          <div className="hidden lg:flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-2">
                {/* Dashboard */}
                <NavigationMenuItem>
                  <motion.div
                    custom={0}
                    variants={navItemVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Link
                      href="/admin"
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                        pathname === "/admin"
                          ? "text-white bg-white/20 shadow-lg shadow-white/10 backdrop-blur-sm"
                          : "text-white/90 hover:text-white hover:bg-white/15 hover:shadow-lg hover:shadow-white/5",
                      )}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Главная
                    </Link>
                  </motion.div>
                </NavigationMenuItem>

                {/* Mega Menu */}
                <NavigationMenuItem>
                  <motion.div
                    custom={1}
                    variants={navItemVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <NavigationMenuTrigger className="text-white/90 hover:text-white hover:bg-white/15 hover:shadow-lg hover:shadow-white/5 rounded-xl transition-all duration-300">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Управление
                    </NavigationMenuTrigger>
                  </motion.div>
                  <NavigationMenuContent>
                    <div className="relative">
                      <div className="absolute inset-0 -z-10 rounded-2xl" />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-[900px] p-6 bg-green/20 dark:bg-green/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-2xl shadow-emerald-500/20 text-white overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-emerald-600/10 pointer-events-none rounded-2xl" />
                        <div className="relative grid grid-cols-2 gap-8">
                          {megaMenuSections.map((section, sectionIndex) => (
                            <div key={section.title} className="space-y-4">
                              <motion.h3
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: sectionIndex * 0.1 }}
                                className="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider"
                              >
                                {section.title}
                              </motion.h3>
                              <div className="space-y-2">
                                {section.items.map((item, itemIndex) => (
                                  <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                                    onHoverStart={() => setHoveredItem(item.href)}
                                    onHoverEnd={() => setHoveredItem(null)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Link
                                      href={item.href}
                                      className="group flex items-start gap-4 p-4 rounded-xl hover:bg-emerald-100/30 dark:hover:bg-emerald-800/30 transition-all duration-300 border border-transparent hover:border-emerald-200/40 dark:hover:border-emerald-700/40 text-white"
                                    >
                                      <div className="flex-shrink-0 mt-1">
                                        <motion.div
                                          animate={{
                                            rotate: hoveredItem === item.href ? 360 : 0,
                                            scale: hoveredItem === item.href ? 1.2 : 1,
                                          }}
                                          transition={{ duration: 0.3 }}
                                          className="text-emerald-600 dark:text-emerald-400"
                                        >
                                          {item.icon}
                                        </motion.div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-white group-hover:text-emerald-200 transition-colors">
                                          {item.title}
                                        </div>
                                        <div className="text-xs text-emerald-100/80 dark:text-emerald-300/80 mt-1 group-hover:text-emerald-200 transition-colors">
                                          {item.description}
                                        </div>
                                      </div>
                                    </Link>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Quick Links */}
                <NavigationMenuItem>
                  <motion.div
                    custom={2}
                    variants={navItemVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Link
                      href="/admin/statistics"
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                        pathname.includes("/admin/statistics")
                          ? "text-white bg-emerald-500/20 shadow-lg shadow-white/10 backdrop-blur-sm"
                          : "text-white/90 hover:text-white hover:bg-white/15 hover:shadow-lg hover:shadow-white/5",
                      )}
                    >
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Статистика
                    </Link>
                  </motion.div>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggler */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }}
                    variants={pulseVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="h-10 w-10 text-white hover:text-white hover:bg-white/20 relative overflow-hidden rounded-xl backdrop-blur-sm transition-all duration-300"
                    >
                      <AnimatePresence mode="wait">
                        {theme === "dark" ? (
                          <motion.div
                            key="sun"
                            initial={{ y: 30, opacity: 0, rotate: -180 }}
                            animate={{ y: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: -30, opacity: 0, rotate: 180 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <Sun size={20} />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="moon"
                            initial={{ y: 30, opacity: 0, rotate: 180 }}
                            animate={{ y: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: -30, opacity: 0, rotate: -180 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <Moon size={20} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-emerald-800/90 text-white border-emerald-600">
                  {theme === "dark" ? "Включить светлую тему" : "Включить темную тему"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Enhanced Search with Backslash Hotkey */}
            <div className="relative">
              <motion.div
                variants={searchVariants}
                animate={isSearchOpen ? "open" : "closed"}
                className="flex items-center"
              >
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "100%" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full"
                    >
                      <div className="relative">
                        <Input
                          ref={searchInputRef}
                          placeholder="Поиск... (нажмите \ для быстрого доступа)"
                          className="pr-10 h-10 focus:ring-2 focus:ring-emerald-300 text-sm border-white/30 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 rounded-xl"
                          autoFocus
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onClick={() => setIsSearchOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && searchQuery.trim()) {
                              router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
                              setIsSearchOpen(false)
                            }
                          }}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20 rounded-lg"
                              onClick={() => {
                                setSearchQuery("")
                                searchInputRef.current?.focus()
                              }}
                            >
                              <X size={12} />
                            </Button>
                          )}
                          <div className="text-xs text-white/50 bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
                            \
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }} 
                        className="flex-shrink-0"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative h-10 w-10 text-white hover:text-white hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all duration-300"
                          onClick={() => {
                            setIsSearchOpen(!isSearchOpen)
                            if (!isSearchOpen) {
                              setTimeout(() => {
                                searchInputRef.current?.focus()
                              }, 100)
                            } else {
                              setSearchQuery("")
                              setSearchResults([])
                            }
                          }}
                        >
                          <motion.div
                            animate={{ rotate: isSearchOpen ? 90 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Search size={20} />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-emerald-800/90 text-white border-emerald-600">
                      <div className="flex items-center gap-2">
                        Поиск
                        <kbd className="px-1.5 py-0.5 text-xs bg-white/20 rounded border">
                          \
                        </kbd>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>

              {/* Enhanced Search Results */}
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    ref={searchResultsRef}
                    variants={searchResultsVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-3 w-96 max-h-[70vh] overflow-hidden rounded-2xl bg-emerald-800/95 backdrop-blur-xl shadow-2xl border border-emerald-600/50 z-50"
                  >
                    <div className="overflow-y-auto max-h-[70vh] p-3">
                      {isSearching ? (
                        <div className="flex items-center justify-center py-8">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mr-3"
                          />
                          <span className="text-sm text-white">Поиск...</span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          {searchResults.map((category, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="mb-4"
                            >
                              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/80 uppercase tracking-wider">
                                {category.icon}
                                <span>{category.title}</span>
                              </div>
                              <div className="space-y-1">
                                {category.results.map((result, idx) => (
                                  <motion.div
                                    key={`${result.type}-${result.id}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: (index * 0.1) + (idx * 0.05) }}
                                    whileHover={{
                                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                                      x: 4,
                                      transition: { duration: 0.2 },
                                    }}
                                    className="flex items-center gap-3 px-3 py-3 hover:bg-white/10 rounded-xl cursor-pointer transition-all duration-200"
                                    onClick={() => handleSearchResultClick(result)}
                                  >
                                    <div className="flex-shrink-0">{result.icon}</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate text-white">{result.title}</p>
                                      {result.subtitle && (
                                        <p className="text-xs text-white/70 truncate">{result.subtitle}</p>
                                      )}
                                    </div>
                                    <motion.div
                                      whileHover={{ x: 3, scale: 1.1 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                      <ExternalLink className="h-4 w-4 text-white/60 flex-shrink-0" />
                                    </motion.div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </>
                      ) : searchQuery ? (
                        <div className="text-center py-8 px-4">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Search className="h-8 w-8 text-white/50 mx-auto mb-3" />
                            <p className="text-sm text-white mb-2">Ничего не найдено по запросу "{searchQuery}"</p>
                            <p className="text-xs text-white/70">
                              Попробуйте изменить запрос или выбрать из истории поиска
                            </p>
                          </motion.div>
                        </div>
                      ) : recentSearches.length > 0 ? (
                        <div>
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-white/80 uppercase tracking-wider">
                              <Clock className="h-4 w-4" />
                              <span>Недавние поиски</span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setRecentSearches([])
                                localStorage.setItem("recentSearches", JSON.stringify([]))
                              }}
                              className="text-xs text-white/70 hover:text-red-300 transition-colors"
                            >
                              Очистить
                            </motion.button>
                          </div>
                          <div className="space-y-1">
                            {recentSearches.map((query, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{
                                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  x: 4,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() => selectRecentSearch(query)}
                                className="flex items-center gap-3 px-3 py-3 hover:bg-white/10 rounded-xl cursor-pointer transition-all duration-200"
                              >
                                <Clock className="h-4 w-4 text-white/60" />
                                <span className="text-sm text-white">{query}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <Search className="h-6 w-6 text-white/50" />
                              <Zap className="h-4 w-4 text-emerald-400" />
                            </div>
                            <p className="text-sm text-white mb-2">Введите запрос для поиска</p>
                            <p className="text-xs text-white/70">
                              Используйте <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">\</kbd> для быстрого доступа
                            </p>
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {searchQuery.trim() !== "" && (
                      <div className="p-3 border-t border-white/20">
                        <Button
                          variant="ghost"
                          className="w-full text-sm text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                          onClick={() => {
                            router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
                            setIsSearchOpen(false)
                          }}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Расширенный поиск по "{searchQuery}"
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Notifications */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <motion.div 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }}
                        variants={pulseVariants}
                        initial="initial"
                        animate="animate"
                      >
                        <Button variant="ghost" size="icon" className="relative h-10 w-10 text-white hover:text-white hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all duration-300">
                          <Bell size={20} />
                          {unreadCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 flex items-center justify-center"
                            >
                              <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs font-bold bg-red-500 border-2 border-white">
                                {unreadCount}
                              </Badge>
                            </motion.div>
                          )}
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-emerald-800/90 text-white border-emerald-600">
                    Уведомления
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent
                align="end"
                className="w-80 p-3 rounded-2xl backdrop-blur-xl bg-emerald-800/95 border border-emerald-600/50 shadow-2xl"
                sideOffset={8}
              >
                <div className="flex items-center justify-between mb-3">
                  <DropdownMenuLabel className="font-bold text-sm text-white">
                    Уведомления
                  </DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-white hover:bg-white/20 rounded-lg"
                      onClick={markAllAsRead}
                    >
                      Отметить все как прочитанные
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-white/20" />
                <div className="max-h-[300px] overflow-auto py-2">
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "mb-2 last:mb-0 rounded-xl",
                          !notification.read && "bg-white/10",
                        )}
                      >
                        <DropdownMenuItem
                          className="py-4 px-4 rounded-xl hover:bg-white/10 cursor-default transition-all duration-200"
                          onSelect={() => markAsRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-white">{notification.title}</span>
                                <span className="text-xs text-white/70 ml-2">
                                  {notification.time}
                                </span>
                              </div>
                              <p className="text-xs text-white/80">{notification.message}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <Bell className="h-8 w-8 text-white/50 mx-auto mb-3" />
                      <p className="text-sm text-white">Нет новых уведомлений</p>
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem className="flex justify-center py-3 text-sm font-semibold text-white hover:bg-white/10 rounded-xl transition-all duration-200">
                  Просмотреть все
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Enhanced User Profile with Role Display */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Avatar className="h-9 w-9 transition-transform border-2 border-white/30 shadow-lg">
                            <AvatarFallback className="bg-emerald-200 text-emerald-800 text-sm font-bold">
                              {getInitials(user?.username || "U")}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div className="hidden lg:block text-left">
                          <span className="text-sm font-semibold text-white block">
                            {user?.username}
                          </span>
                          <span className="text-xs text-white/70">
                            {user?.roles[0] || "Администратор"}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-white/70 hidden lg:block" />
                      </motion.button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-emerald-800/90 text-white border-emerald-600">
                    Профиль пользователя
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent
                align="end"
                className="min-w-[240px] p-3 rounded-2xl backdrop-blur-xl bg-emerald-800/95 border border-emerald-600/50 shadow-2xl"
                sideOffset={8}
              >
                <div className="px-3 py-3 mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white/30 shadow-lg">
                      <AvatarFallback className="bg-emerald-200 text-emerald-800 text-base font-bold">
                        {getInitials(user?.username || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white">{user?.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                          {user?.roles[0] || "Администратор"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuGroup>
                  <Link href="/profile" className="w-full">
                    <motion.div whileHover={{ x: 4 }}>
                      <DropdownMenuItem className="py-3 px-3 rounded-xl hover:bg-white/10 cursor-pointer text-sm text-white transition-all duration-200">
                        <UserIcon className="h-4 w-4 mr-3 text-white" />
                        Профиль
                      </DropdownMenuItem>
                    </motion.div>
                  </Link>
                  <motion.div whileHover={{ x: 4 }}>
                    <DropdownMenuItem className="py-3 px-3 rounded-xl hover:bg-white/10 cursor-pointer text-sm text-white transition-all duration-200">
                      <Settings className="h-4 w-4 mr-3 text-white" />
                      Настройки
                    </DropdownMenuItem>
                  </motion.div>
                  <motion.div whileHover={{ x: 4 }}>
                    <DropdownMenuItem className="py-3 px-3 rounded-xl hover:bg-white/10 cursor-pointer text-sm text-white transition-all duration-200">
                      <BookOpen className="h-4 w-4 mr-3 text-white" />
                      Мои книги
                    </DropdownMenuItem>
                  </motion.div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/20" />
                <motion.div whileHover={{ x: 4 }}>
                  <DropdownMenuItem
                    className="py-3 px-3 rounded-xl hover:bg-red-500/20 cursor-pointer text-sm text-white transition-all duration-200"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Выйти
                  </DropdownMenuItem>
                </motion.div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 lg:hidden text-white hover:text-white hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Menu size={20} />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:hidden py-4 border-t border-white/20"
            >
              <nav className="flex flex-col gap-2">
                {adminSideBarLinks.map((link, index) => {
                  const isSelected =
                    (link.route !== "/admin" && pathname.includes(link.route) && link.route.length > 1) ||
                    pathname === link.route

                  return (
                    <motion.div 
                      key={link.route} 
                      variants={mobileMenuItemVariants} 
                      custom={index} 
                      whileHover={{ x: 8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link href={link.route}>
                        <div
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                            isSelected
                              ? "bg-white/20 text-white shadow-lg"
                              : "hover:bg-white/10 text-white/90 hover:text-white",
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className="relative w-6 h-6">
                            <Image 
                              src={link.img || "/placeholder.svg"} 
                              alt="icon" 
                              fill 
                              className="object-contain drop-shadow-sm" 
                            />
                          </div>
                          <span className="font-medium text-sm">{link.text}</span>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default TopNavigation
