"use client"

import { useState, useEffect, useRef, useCallback, createRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn, getInitials } from "@/lib/utils"
import { adminSideBarLinks } from "@/constants"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Search, Menu, Moon, Sun, UserIcon, Book, FileText, ExternalLink, Clock, LogOut, Settings, ChevronDown, X, BookOpen, Users, Calendar, BarChart2, Bookmark, CheckCircle2, AlertCircle, PlusCircle, ScrollText, LayoutGrid, Shield, PieChart, Home, HelpCircle, FileQuestion, Mail, Command, Zap, ChevronRight, Eye, Package } from 'lucide-react'
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
import React from "react"
import { useAuth, type User } from "@/lib/auth"
import { useNotifications } from "@/hooks/use-notifications"
import { 
  getNotificationIcon, 
  formatRelativeTime, 
  getPriorityColor,
  getPriorityTextColor,
  getNotificationTypeLabel
} from "@/lib/notification-utils"
import { Variants } from "framer-motion"
import { PreviewSwitcher, PreviewType } from "@/components/ui/preview-switcher"
import IframePagePreviewCentered from "@/components/ui/iframe-page-preview-centered"

// Интерфейсы для результатов поиска
interface SearchResult {
  id: string | number
  title: string
  subtitle?: string
  type: "user" | "book" | "journal" | "page"
  url: string
  icon: React.ReactElement
  previewType: PreviewType
}

interface SearchResultCategory {
  title: string
  icon: React.ReactElement
  results: SearchResult[]
}

// Убираем локальный интерфейс, используем из types

// Структура меню для мега-навигации
interface MegaMenuItem {
  title: string
  href: string
  description: string
  icon: React.ReactElement
  previewType: PreviewType
  gradientFrom: string
  gradientTo: string
}

interface MegaMenuSection {
  title: string
  items: MegaMenuItem[]
}

// Интерфейс для breadcrumb элементов
interface BreadcrumbItem {
  label: string
  href: string
  isLast: boolean
}

// Функция для генерации breadcrumb из pathname
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Убираем /admin из начала пути
  const cleanPath = pathname.replace(/^\/admin/, '') || '/'
  
  // Маппинг путей к человекочитаемым названиям
  const pathMapping: Record<string, string> = {
    '/': 'Главная',
    '/users': 'Пользователи',
    '/users/create': 'Создать пользователя',
    '/books': 'Книги',
    '/books/create': 'Добавить книгу',
    '/shelfs': 'Полки',
    '/shelfs/create': 'Создать полку',
    '/reservations': 'Резервирования',
    '/reservations/create': 'Создать резервацию',
    '/statistics': 'Статистика',
    '/roles': 'Роли',
    '/help': 'Справка',
    '/faq': 'FAQ',
    '/contact': 'Контакты',
    '/search': 'Поиск',
    '/users/quick-overview': 'Быстрый обзор',
    '/notifications': 'Уведомления',
    '/fines': 'Штрафы',
    '/books/print-formulars': 'Печать формуляров',
    '/books/{id}/instances': 'Экземпляры книг',
    '/books/instances/create': 'Создать экземпляр книги',
    '/books/instances/edit': 'Редактировать экземпляр книги',
    '/books/instances/delete': 'Удалить экземпляр книги',
    '/books/instances/view': 'Просмотр экземпляра книги',
    '/books/instances/list': 'Список экземпляров книг',
    '/books/instances/search': 'Поиск экземпляров книг',
  }

  const segments = cleanPath.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Всегда добавляем "СИНАПС" как корневой элемент
  breadcrumbs.push({
    label: 'СИНАПС',
    href: '/admin',
    isLast: cleanPath === '/'
  })

  // Строим путь пошагово
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    // Проверяем, есть ли маппинг для этого пути
    let label = pathMapping[currentPath]
    
    if (!label) {
      // Если это GUID (формат ASP.NET: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), показываем иконку в зависимости от родительского пути
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        const parentPath = currentPath.replace(`/${segment}`, '')
        if (parentPath === '/books') {
          label = '📖' // Иконка книги для книг
        } else if (parentPath === '/users') {
          label = '👤' // Иконка человека для пользователей
        } else if (parentPath === '/shelfs') {
          label = '📚' // Иконка полки для полок
        } else if (parentPath === '/reservations') {
          label = '📅' // Иконка календаря для резерваций
        } else {
          label = '📄' // Общая иконка для остальных
        }
      } else {
        // Иначе капитализируем первую букву и заменяем "Update" на "Редакт."
        if (segment.toLowerCase() === 'update') {
          label = 'Редакт.'
        } else {
          label = segment.charAt(0).toUpperCase() + segment.slice(1)
        }
      }
    }

    breadcrumbs.push({
      label,
      href: `/admin${currentPath}`,
      isLast
    })
  })

  return breadcrumbs
}

// Оптимизированный компонент AnimatedNavigationButton
interface AnimatedNavigationButtonProps {
  icon: React.ReactElement;
  title: string;
  description: string;
  href: string;
  gradientFrom: string;
  gradientTo: string;
  delay?: number;
  onClick: (href: string) => void;
  onIconHover?: (event: React.MouseEvent<HTMLDivElement>, href: string) => void;
  onIconLeave?: () => void;
}

const AnimatedNavigationButton: React.FC<AnimatedNavigationButtonProps> = React.memo(({
  icon,
  title,
  description,
  href,
  gradientFrom,
  gradientTo,
  delay = 0,
  onClick,
  onIconHover,
  onIconLeave
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Упрощенные варианты анимации для лучшей производительности
  const buttonVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay,
        ease: "easeOut",
      },
    },
  };

  // Мемоизированные стили для предотвращения пересчета
  const buttonStyle = React.useMemo(() => ({
    background: `linear-gradient(135deg, 
      color-mix(in srgb, white 95%, ${gradientFrom}) 0%, 
      color-mix(in srgb, white 90%, ${gradientTo}) 100%)`,
    boxShadow: `
      0 2px 8px color-mix(in srgb, ${gradientFrom} 8%, transparent),
      inset 0 1px 0 rgba(255,255,255,0.4)
    `,
  }), [gradientFrom, gradientTo]);

  const iconStyle = React.useMemo(() => ({
    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
    boxShadow: `0 2px 6px color-mix(in srgb, ${gradientFrom} 20%, transparent)`,
  }), [gradientFrom, gradientTo]);

  const hoverOverlayStyle = React.useMemo(() => ({
    background: `linear-gradient(135deg, ${gradientFrom}10 0%, ${gradientTo}5 100%)`,
  }), [gradientFrom, gradientTo]);

  return (
    <motion.div
      className="relative"
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Упрощенный основной кнопка */}
      <motion.button
        className="relative w-full h-24 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 overflow-hidden group transition-all duration-200 hover:shadow-lg"
        onClick={() => onClick(href)}
        style={buttonStyle}
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {/* Простой оверлей при наведении */}
        <div
          className={`absolute inset-0 rounded-xl transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={hoverOverlayStyle}
        />

        {/* Контент */}
        <div className="relative z-10 flex items-start space-x-3 h-full">
          {/* Упрощенный контейнер иконки */}
          <motion.div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer relative group"
            style={iconStyle}
            onMouseEnter={(e) => {
              e.stopPropagation();
              onIconHover?.(e, href);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              onIconLeave?.();
            }}
            whileHover={{ 
              scale: 1.1,
              transition: { duration: 0.15 }
            }}
          >
            <div className="text-white text-lg">
              {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
            </div>
            {/* Упрощенный индикатор превью */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-full h-full bg-blue-300 rounded-full animate-pulse" />
            </div>
          </motion.div>

          {/* Текстовый контент */}
          <div className="flex-1 text-left">
            <h3 className="text-sm font-semibold text-gray-800 mb-1 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {/* Упрощенная декорация угла */}
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gray-300/40" />
      </motion.button>
    </motion.div>
  );
});

// Обновляем megaMenuSections с градиентами
const megaMenuSections: MegaMenuSection[] = [
  {
    title: "Управление фондом",
    items: [
      {
        title: "Все книги",
        href: "/admin/books",
        description: "Просмотр и управление каталогом книг",
        icon: <BookOpen className="h-5 w-5" />,
        previewType: 'iframe',
        gradientFrom: "#4f46e5",
        gradientTo: "#7c3aed",
      },
      {
        title: "Добавить книгу",
        href: "/admin/books/create",
        description: "Добавить новую книгу в каталог",
        icon: <PlusCircle className="h-5 w-5" />,
        previewType: 'quick',
        gradientFrom: "#059669",
        gradientTo: "#0d9488",
      },
      {
        title: "Полки",
        href: "/admin/shelfs",
        description: "Организация и управление полками",
        icon: <Bookmark className="h-5 w-5" />,
        previewType: 'iframe',
        gradientFrom: "#dc2626",
        gradientTo: "#ea580c",
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
        previewType: 'iframe',
        gradientFrom: "#7c2d12",
        gradientTo: "#a16207",
      },
      {
        title: "Быстрый просмотр",
        href: "/admin/users/quick-overview",
        description: "Быстрый обзор пользователей",
        icon: <Eye className="h-5 w-5" />,
        previewType: 'api',
        gradientFrom: "#be185d",
        gradientTo: "#c2410c",
      },
      {
        title: "Управление ролями",
        href: "/admin/roles",
        description: "Настройка ролей и разрешений",
        icon: <Shield className="h-5 w-5" />,
        previewType: 'quick',
        gradientFrom: "#1e40af",
        gradientTo: "#1e3a8a",
      },
    ],
  },
  {
    title: "Резервирования и статистика",
    items: [
      {
        title: "Резервирования",
        href: "/admin/reservations",
        description: "Управление резервациями книг",
        icon: <Calendar className="h-5 w-5" />,
        previewType: 'iframe',
        gradientFrom: "#9333ea",
        gradientTo: "#7e22ce",
      },
      {
        title: "Статистика",
        href: "/admin/statistics",
        description: "Аналитика и отчеты системы",
        icon: <PieChart className="h-5 w-5" />,
        previewType: 'iframe',
        gradientFrom: "#166534",
        gradientTo: "#15803d",
      },
      {
        title: "Уведомления",
        href: "/admin/notifications",
        description: "Просмотр и управление уведомлениями",
        icon: <Bell className="h-5 w-5" />,
        previewType: 'quick',
        gradientFrom: "#374151",
        gradientTo: "#4b5563",
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
        previewType: 'quick',
        gradientFrom: "#0f766e",
        gradientTo: "#0d9488",
      }
      
    ],
  },
];

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
  const [navigationMenuValue, setNavigationMenuValue] = useState<string>("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [activePreview, setActivePreview] = useState<{ href: string; type: PreviewType; coords: { top: number; left: number; }; } | null>(null);
  const previewTimer = useRef<NodeJS.Timeout | null>(null);
  const megaMenuContentRef = useRef<HTMLDivElement>(null);
  // --- ДОБАВЛЕНО: refs для кнопок мега-меню ---
  const megaMenuButtonRefs = useRef<Array<React.RefObject<HTMLAnchorElement>>>([]);
  // Инициализация ref-ов по количеству пунктов
  if (megaMenuButtonRefs.current.length !== megaMenuSections.flatMap(s => s.items).length) {
    megaMenuButtonRefs.current = megaMenuSections.flatMap(s => s.items).map(() => createRef<HTMLAnchorElement>());
  }
  // --- КОНЕЦ ДОБАВЛЕНИЯ ---
  
  // Используем хук для работы с уведомлениями
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useNotifications()

  // Добавляем состояние для отслеживания подключения
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  // Обновляем статус подключения на основе isConnected
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected')
    } else {
      // Если есть токен, показываем "connecting", иначе "disconnected"
      const token = localStorage.getItem('token')
      if (token) {
        setConnectionStatus('connecting')
        // Через некоторое время, если не подключились, показываем disconnected
        const timeout = setTimeout(() => {
          if (!isConnected) {
            setConnectionStatus('disconnected')
          }
        }, 5000)
        return () => clearTimeout(timeout)
      } else {
        setConnectionStatus('disconnected')
      }
    }
  }, [isConnected])

  // Новая логика для обработки наведения на иконку
  const handleIconHover = (event: React.MouseEvent<HTMLDivElement>, href: string, type: PreviewType) => {
    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    const previewWidth = 800;
    const previewHeight = 750;
    const previewMargin = 16;

    const hasSpaceOnRight = rect.right + previewMargin + previewWidth <= window.innerWidth;
    const hasSpaceOnLeft = rect.left - previewMargin - previewWidth >= 0;
    const hasSpaceOnBottom = rect.bottom + previewMargin + previewHeight <= window.innerHeight;
    const hasSpaceOnTop = rect.top - previewMargin - previewHeight >= 0;

    // Определяем наилучшую позицию и координаты
    let top = rect.top;
    let left = rect.right + previewMargin;

    if (hasSpaceOnRight) {
      left = rect.right + previewMargin;
      top = Math.max(previewMargin, Math.min(rect.top, window.innerHeight - previewHeight - previewMargin));
    } else if (hasSpaceOnLeft) {
      left = rect.left - previewWidth - previewMargin;
      top = Math.max(previewMargin, Math.min(rect.top, window.innerHeight - previewHeight - previewMargin));
    } else if (hasSpaceOnBottom) {
      top = rect.bottom + previewMargin;
      left = Math.max(previewMargin, Math.min(rect.left, window.innerWidth - previewWidth - previewMargin));
    } else if (hasSpaceOnTop) {
      top = rect.top - previewHeight - previewMargin;
      left = Math.max(previewMargin, Math.min(rect.left, window.innerWidth - previewWidth - previewMargin));
    } else {
      // Если нигде не помещается полностью, показываем справа с корректировкой по краям
      left = Math.min(rect.right + previewMargin, window.innerWidth - previewWidth - previewMargin);
      top = Math.max(previewMargin, Math.min(rect.top, window.innerHeight - previewHeight - previewMargin));
    }

    previewTimer.current = setTimeout(() => {
      setActivePreview({
        href,
        type,
        coords: { top, left },
      });
    }, 700);
  };

  const handleIconLeave = () => {
    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
    }
    previewTimer.current = setTimeout(() => {
      setActivePreview(null);
    }, 200);
  };

  const cancelHidePreview = () => {
    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
    }
  };

  // Генерируем breadcrumbs на основе текущего пути
  const breadcrumbs = generateBreadcrumbs(pathname)

  // Keyboard shortcut handler for Shift + slash
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "/" && e.shiftKey) {
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

  // Обновляем количество непрочитанных уведомлений при изменении списка
  // (теперь это управляется хуком useNotifications)

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

  // Функции для работы с уведомлениями теперь из хука
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
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
        const token = localStorage.getItem('token')
        const headers = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }

        // Используем правильные эндпоинты - оба должны быть в нижнем регистре
        const [usersResponse, booksResponse, instancesResponse] = await Promise.all([
          fetch(`${baseUrl}/api/User`, { headers }),
          fetch(`${baseUrl}/api/books`, { headers }), // Изменено с /api/Books на /api/books
          fetch(`${baseUrl}/api/BookInstance`, { headers }) // Получаем все экземпляры для поиска
        ])

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const filteredUsers = usersData.filter(
            (user: any) => {
              const username = user.username || ""
              const fullName = user.fullName || ""  // ФИО пользователя
              const email = user.email || ""
              
              return username.toLowerCase().includes(query.toLowerCase()) ||
                     fullName.toLowerCase().includes(query.toLowerCase()) ||  // Поиск по ФИО
                     email.toLowerCase().includes(query.toLowerCase())
            }
          )

          if (filteredUsers && filteredUsers.length > 0) {
            const userResults: SearchResult[] = filteredUsers.slice(0, 5).map((user: any) => ({
              id: user.id,
              title: user.fullName || user.username || "Пользователь",  // Приоритет ФИО над username
              subtitle: user.email || user.username || undefined,  // Показываем email или username в подзаголовке
              type: "user" as const,
              url: `/admin/users/${user.id}`,
              icon: <UserIcon className="h-4 w-4 text-blue-500" />,
              previewType: 'api',
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
            (book: any) => {
              const title = book.title || ""
              const authors = Array.isArray(book.authors) 
                ? book.authors.join(", ") 
                : (book.authors || "")
              const isbn = book.isbn || ""
              const genre = book.genre || ""
              
              return title.toLowerCase().includes(query.toLowerCase()) ||
                     authors.toLowerCase().includes(query.toLowerCase()) ||
                     isbn.toLowerCase().includes(query.toLowerCase()) ||
                     genre.toLowerCase().includes(query.toLowerCase())
            }
          )

          if (filteredBooks && filteredBooks.length > 0) {
            const bookResults: SearchResult[] = filteredBooks.slice(0, 5).map((book: any) => ({
              id: book.id,
              title: book.title,
              subtitle: Array.isArray(book.authors) 
                ? book.authors.join(", ") 
                : book.authors,
              type: "book" as const,
              url: `/admin/books/${book.id}`,
              icon: <Book className="h-4 w-4 text-blue-700" />,
              previewType: 'api',
            }))

            categorizedResults.push({
              title: "Книги",
              icon: <Book className="h-4 w-4" />,
              results: bookResults,
            })
          }
        }

        // Добавлен поиск экземпляров книг
        if (instancesResponse.ok) {
          const instancesData = await instancesResponse.json()
          const filteredInstances = instancesData.filter(
            (instance: any) => {
              const instanceCode = instance.instanceCode || ""
              const status = instance.status || ""
              const condition = instance.condition || ""
              const location = instance.location || ""
              const bookTitle = instance.book?.title || ""
              const bookAuthors = instance.book?.authors || ""
              
              return instanceCode.toLowerCase().includes(query.toLowerCase()) ||
                     status.toLowerCase().includes(query.toLowerCase()) ||
                     condition.toLowerCase().includes(query.toLowerCase()) ||
                     location.toLowerCase().includes(query.toLowerCase()) ||
                     bookTitle.toLowerCase().includes(query.toLowerCase()) ||
                     bookAuthors.toLowerCase().includes(query.toLowerCase())
            }
          )

          if (filteredInstances && filteredInstances.length > 0) {
            // Получаем резервации, чтобы правильно определить ссылку
            let reservationsData = []
            try {
              const reservationsResponse = await fetch(`${baseUrl}/api/Reservation`, { headers })
              if (reservationsResponse.ok) {
                reservationsData = await reservationsResponse.json()
              }
            } catch (reservationError) {
              console.warn("Не удалось загрузить резервации для определения ссылок:", reservationError)
            }

            const instanceResults: SearchResult[] = filteredInstances.slice(0, 5).map((instance: any) => {
              // Определяем URL в зависимости от статуса экземпляра
              let url = `/admin/books/${instance.bookId}/instances`
              let subtitle = `${instance.book?.title || 'Неизвестная книга'} - ${instance.status}`
              
              // Если экземпляр выдан или зарезервирован, ищем активную резервацию
              if (instance.status?.toLowerCase() === 'выдана' || instance.status?.toLowerCase() === 'зарезервирована') {
                // Ищем активную резервацию для этого экземпляра
                const activeReservation = reservationsData.find((reservation: any) => 
                  reservation.bookInstanceId === instance.id && 
                  reservation.status && 
                  !['отменена', 'истекла', 'возвращена', 'отменена_пользователем'].includes(reservation.status.toLowerCase())
                )
                
                if (activeReservation) {
                  url = `/admin/reservations/${activeReservation.id}`
                  subtitle = `${instance.book?.title || 'Неизвестная книга'} - ${instance.status} (Резервация)`
                }
              }

              return {
                id: instance.id,
                title: `📖 ${instance.instanceCode}`,
                subtitle: subtitle,
                type: "book" as const, // Используем тип book для экземпляров
                url: url,
                icon: <Package className="h-4 w-4 text-purple-500" />,
                previewType: 'api' as const,
              }
            })

            categorizedResults.push({
              title: "Экземпляры книг",
              icon: <Package className="h-4 w-4" />,
              results: instanceResults,
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
          icon: <FileText className="h-4 w-4 text-blue-300" />,
          previewType: 'quick' as const,
        },
        {
          id: "users",
          title: "Управление пользователями",
          type: "page" as const,
          url: "/admin/users",
          icon: <FileText className="h-4 w-4 text-blue-300" />,
          previewType: 'iframe' as const,
        },
        {
          id: "books",
          title: "Каталог книг",
          type: "page" as const,
          url: "/admin/books",
          icon: <FileText className="h-4 w-4 text-blue-300" />,
          previewType: 'api' as const,
        },
        {
          id: "journals",
          title: "Журналы и подписки",
          type: "page" as const,
          url: "/admin/journals",
          icon: <FileText className="h-4 w-4 text-blue-300" />,
          previewType: 'quick' as const,
        },
        {
          id: "statistics",
          title: "Статистика",
          type: "page" as const,
          url: "/admin/statistics",
          icon: <FileText className="h-4 w-4 text-blue-300" />,
          previewType: 'iframe' as const,
        },
        {
          id: "Shelfs",
          title: "Полки",
          type: "page" as const,
          url: "/admin/shelfs",
          icon: <FileText className="h-4 w-4 text-blue-300" />,
          previewType: 'iframe' as const,
        },
        {
          id: "Quick-overview",
          title: "Быстрый обзор",
          type: "page" as const,
          url: "/admin/users/quick-overview",
          icon: <FileText className="h-4 w-4 text-blue-300" />,
          previewType: 'api' as const,
        },
        {
          id: "Print-formulars",
          title: "Печать формуляров",
          type: "page" as const,
          url: "/admin/books/print-formulars",
          icon: <FileText className="h-4 w-4 text-blue-300" />,
          previewType: 'quick' as const,
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

  // Универсальный обработчик клика по пункту меню
  const handleMenuLinkClick = useCallback((url: string) => {
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
    setSearchQuery("")
    setSearchResults([])
    setNavigationMenuValue("") // Закрываем NavigationMenu на десктопе
    router.push(url)
  }, [router])

  // Search result click handler
  const handleSearchResultClick = (result: SearchResult) => {
    if (searchQuery.trim()) {
      const newRecentSearches = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery).slice(0, 4)]
      setRecentSearches(newRecentSearches)
      localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches))
    }
    handleMenuLinkClick(result.url)
  }

  // Select recent search
  const selectRecentSearch = (query: string) => {
    setSearchQuery(query)
    performSearch(query)
  }

  // Функция getNotificationIcon теперь импортируется из utils

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
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
  }

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: { duration: 0.4 },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.3 },
    },
  }

  const mobileMenuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1 },
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
          ? "bg-blue-500/90 dark:bg-blue-700/90 shadow-xl shadow-blue-500/20"
          : "bg-blue-500/80 dark:bg-blue-700/80",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-blue-400/20" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <motion.div
              variants={logoVariants as unknown as Variants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              className="flex-shrink-0 cursor-pointer"
            >
              <a href="/" onClick={e => { e.preventDefault(); handleMenuLinkClick('/') }}>
                <div className="relative group">
                  <motion.div
                    className="relative"
                    whileHover={{
                      scale: 1.15,
                      rotate: [0, -5, 5, -3, 3, 0],
                      transition: { 
                        duration: 0.6,
                        ease: "easeInOut"
                      }
                    }}
                    animate={{
                      y: [0, -2, 0],
                      transition: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <Image 
                      src="/images/owl-svgrepo-com.svg" 
                      alt="СИНАПС - Сова логотип" 
                      height={44} 
                      width={44} 
                      className="object-contain drop-shadow-xl transition-all duration-300 group-hover:drop-shadow-2xl" 
                    />
                    
                    {/* Магическое свечение вокруг совы */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-400/40 via-purple-400/40 to-blue-400/40 rounded-full blur-xl"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.2, 1],
                        transition: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                    />
                    
                    {/* Мерцающие звездочки вокруг совы */}
                    <motion.div
                      className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full"
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        rotate: [0, 180, 360],
                        transition: {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2
                        }
                      }}
                    />
                    
                    <motion.div
                      className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-300 rounded-full"
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.3, 1, 0.3],
                        rotate: [360, 180, 0],
                        transition: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.8
                        }
                      }}
                    />
                    
                    <motion.div
                      className="absolute top-1 -left-2 w-1 h-1 bg-white rounded-full"
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.2, 1, 0.2],
                        transition: {
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1.2
                        }
                      }}
                    />
                  </motion.div>
                  
                  {/* Эффект "глаз совы" при наведении */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ 
                      opacity: 1,
                      transition: { duration: 0.3 }
                    }}
                  >
                    {/* Левый глаз */}
                    <motion.div
                      className="absolute top-3 left-3 w-1 h-1 bg-yellow-400 rounded-full shadow-lg"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7],
                        transition: {
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                    />
                    
                    {/* Правый глаз */}
                    <motion.div
                      className="absolute top-3 right-3 w-1 h-1 bg-yellow-400 rounded-full shadow-lg"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7],
                        transition: {
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5
                        }
                      }}
                    />
                  </motion.div>
                </div>
              </a>
            </motion.div>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <motion.nav
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-1 min-w-0"
                aria-label="Breadcrumb"
              >
                {breadcrumbs.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.4 }}
                    className="flex items-center gap-1"
                  >
                    {/* Показываем "СИНАПС" только на главной странице или как ссылку на непоследних страницах */}
                    {(index === 0 && (pathname === "/admin" || !item.isLast)) && (
                      <>
                        {!item.isLast ? (
                          <a
                            href={item.href}
                            onClick={e => { e.preventDefault(); handleMenuLinkClick(item.href) }}
                            className="group flex items-center"
                          >
                            <motion.span
                              whileHover={{ 
                                scale: 1.05,
                                textShadow: "0 0 20px rgba(255,255,255,0.8)",
                                rotateX: 15,
                                rotateY: 10,
                                z: 50
                              }}
                              whileTap={{ scale: 0.95 }}
                              onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left - rect.width / 2;
                                const y = e.clientY - rect.top - rect.height / 2;
                                
                                e.currentTarget.style.transform = `
                                  perspective(1000px) 
                                  rotateY(${x / 10}deg) 
                                  rotateX(${-y / 10}deg) 
                                  translateZ(20px)
                                `;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
                              }}
                              className="text-white hover:text-blue-100 hover:bg-white/20 text-2xl font-black transition-all duration-300 px-4 py-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm shadow-lg border border-white/20 tracking-wider relative overflow-hidden"
                              style={{
                                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                                transformStyle: 'preserve-3d',
                              }}
                            >
                              <motion.span
                                className="relative z-10"
                                animate={{
                                  backgroundPosition: ['0% 50%', '200% 50%']
                                }}
                                transition={{
                                  duration: 6,
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                                style={{
                                  backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #ffffff 10%, #60a5fa 25%, #3b82f6 40%, #1d4ed8 50%, #3b82f6 60%, #60a5fa 75%, #ffffff 90%, #ffffff 100%)',
                                  backgroundSize: '200% 100%',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text',
                                  color: 'transparent',
                                  WebkitFontSmoothing: 'antialiased',
                                  textRendering: 'optimizeLegibility',
                                } as React.CSSProperties}
                              >
                                {item.label}
                              </motion.span>
                              {/* 3D карточка эффект - задний слой */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg"
                                style={{
                                  transform: 'translateZ(-10px)',
                                  transformStyle: 'preserve-3d',
                                }}
                                whileHover={{
                                  transform: 'translateZ(-20px) rotateX(-5deg)',
                                  transition: { duration: 0.3 }
                                }}
                              />
                            </motion.span>
                          </a>
                        ) : (
                          <motion.span
                            initial={{ scale: 0.9, opacity: 0, rotateX: -15 }}
                            animate={{ 
                              scale: 1, 
                              opacity: 1, 
                              rotateX: 0,
                              textShadow: [
                                "0 0 0px rgba(255,255,255,0)",
                                "0 0 10px rgba(255,255,255,0.5)",
                                "0 0 20px rgba(255,255,255,0.3)",
                                "0 0 10px rgba(255,255,255,0.5)",
                                "0 0 0px rgba(255,255,255,0)"
                              ]
                            }}
                            transition={{ 
                              delay: index * 0.1 + 0.5,
                              duration: 1.2,
                              textShadow: {
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }
                            }}
                            whileHover={{
                              scale: 1.1,
                              rotateY: [0, 5, -5, 0],
                              rotateX: 20,
                              z: 60,
                              textShadow: "0 0 30px rgba(255,255,255,0.9)",
                              transition: {
                                duration: 0.8,
                                ease: "easeInOut"
                              }
                            }}
                            onMouseMove={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = e.clientX - rect.left - rect.width / 2;
                              const y = e.clientY - rect.top - rect.height / 2;
                              
                              e.currentTarget.style.transform = `
                                perspective(1000px) 
                                rotateY(${x / 8}deg) 
                                rotateX(${-y / 8}deg) 
                                translateZ(30px)
                                scale(1.05)
                              `;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)';
                            }}
                            className="text-white text-2xl font-black px-4 py-2 rounded-lg bg-gradient-to-r from-white/30 to-white/20 backdrop-blur-sm shadow-xl border border-white/30 tracking-wider cursor-default relative overflow-hidden"
                            style={{
                              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.25) 100%)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
                              transformStyle: 'preserve-3d',
                            }}
                          >
                            <motion.span
                              className="relative z-10"
                              animate={{
                                backgroundPosition: ['0% 50%', '200% 50%']
                              }}
                              transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                              style={{
                                backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #ffffff 8%, #93c5fd 20%, #60a5fa 30%, #3b82f6 40%, #1d4ed8 50%, #3b82f6 60%, #60a5fa 70%, #93c5fd 80%, #ffffff 92%, #ffffff 100%)',
                                backgroundSize: '200% 100%',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                color: 'transparent',
                                WebkitFontSmoothing: 'antialiased',
                                textRendering: 'optimizeLegibility',
                              } as React.CSSProperties}
                            >
                              {item.label}
                            </motion.span>
                            {/* 3D карточка эффект - задний слой */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-blue-600/30 rounded-lg"
                              style={{
                                transform: 'translateZ(-15px)',
                                transformStyle: 'preserve-3d',
                              }}
                              whileHover={{
                                transform: 'translateZ(-30px) rotateX(-8deg) rotateY(3deg)',
                                transition: { duration: 0.4 }
                              }}
                            />
                            {/* Дополнительный слой для глубины */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-300/20 to-blue-500/20 rounded-lg"
                              style={{
                                transform: 'translateZ(-25px)',
                                transformStyle: 'preserve-3d',
                              }}
                              whileHover={{
                                transform: 'translateZ(-40px) rotateX(-12deg) rotateY(5deg)',
                                transition: { duration: 0.4, delay: 0.1 }
                              }}
                            />
                          </motion.span>
                        )}
                        
                        {!item.isLast && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.6 }}
                            className="flex-shrink-0"
                          >
                            <ChevronRight className="h-5 w-5 text-white/70 drop-shadow-sm" />
                          </motion.div>
                        )}
                      </>
                    )}
                    
                    {/* Остальные элементы breadcrumb (не "СИНАПС") */}
                    {index > 0 && (
                      <>
                        {!item.isLast ? (
                          <a
                            href={item.href}
                            onClick={e => { e.preventDefault(); handleMenuLinkClick(item.href) }}
                            className="group flex items-center"
                          >
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="text-base font-medium text-white/90 hover:text-white hover:bg-white/15 transition-all duration-300 px-3 py-1.5 rounded-lg truncate max-w-[180px]"
                            >
                              {item.label}
                            </motion.span>
                          </a>
                        ) : (
                          <motion.span
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                            className="text-base font-semibold text-white px-3 py-1.5 rounded-lg bg-white/25 backdrop-blur-sm shadow-lg truncate max-w-[160px]"
                          >
                            {item.label}
                          </motion.span>
                        )}
                        
                        {!item.isLast && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.6 }}
                            className="flex-shrink-0"
                          >
                            <ChevronRight className="h-4 w-4 text-white/60" />
                          </motion.div>
                        )}
                      </>
                    )}
                  </motion.div>
                ))}
              </motion.nav>
            </div>
          </div>

          {/* Desktop Navigation with Mega Menu - Centered */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <NavigationMenu value={navigationMenuValue} onValueChange={setNavigationMenuValue}>
              <NavigationMenuList className="gap-2">
                {/* Dashboard */}
                <NavigationMenuItem>
                  <motion.div
                    custom={0}
                    variants={navItemVariants as unknown as Variants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <a
                      href="/admin"
                      onClick={e => { e.preventDefault(); handleMenuLinkClick('/admin') }}
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
                        pathname === "/admin"
                          ? "text-white bg-white/25 shadow-lg shadow-white/10 backdrop-blur-sm"
                          : "text-white/90 hover:text-white hover:bg-white/20 hover:shadow-lg hover:shadow-white/5",
                      )}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Главная
                    </a>
                  </motion.div>
                </NavigationMenuItem>

                {/* Mega Menu */}
                <NavigationMenuItem value="management">
                  <motion.div
                    custom={1}
                    variants={navItemVariants as unknown as Variants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <NavigationMenuTrigger className="navigation-menu-trigger text-white hover:text-white hover:bg-white/20 hover:shadow-lg hover:shadow-white/5 rounded-lg transition-all duration-300 bg-transparent">
                      <LayoutGrid className="mr-2 h-4 w-4 text-white" />
                      <span className="text-white">Управление</span>
                    </NavigationMenuTrigger>
                  </motion.div>
                  <NavigationMenuContent
                    ref={megaMenuContentRef}
                    onMouseLeave={handleIconLeave}
                  >
                    <motion.div
                      onMouseEnter={cancelHidePreview}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-[900px] p-6 backdrop-blur-xl bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-gray-50/30 to-blue-50/50 pointer-events-none rounded-xl" />
                      <div className="relative grid grid-cols-2 gap-8">
                        {megaMenuSections.map((section, sectionIndex) => (
                          <div key={section.title} className="space-y-4">
                            <motion.h3
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: sectionIndex * 0.1 }}
                              className="text-sm font-bold text-blue-700 uppercase tracking-wider"
                            >
                              {section.title}
                            </motion.h3>
                            <div className="space-y-2">
                              {section.items.map((item, itemIndex) => {
                                const flatIndex = megaMenuSections.slice(0, sectionIndex).reduce((acc, s) => acc + s.items.length, 0) + itemIndex;
                                return (
                                  <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <AnimatedNavigationButton
                                      icon={item.icon}
                                      title={item.title}
                                      description={item.description}
                                      href={item.href}
                                      gradientFrom={item.gradientFrom}
                                      gradientTo={item.gradientTo}
                                      delay={itemIndex * 0.05}
                                      onClick={() => handleMenuLinkClick(item.href)}
                                      onIconHover={(e, href) => handleIconHover(e, href, item.previewType)}
                                      onIconLeave={handleIconLeave}
                                    />
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Quick Links */}
                <NavigationMenuItem>
                  <motion.div
                    custom={2}
                    variants={navItemVariants as unknown as Variants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <a
                      href="/admin/statistics"
                      onClick={e => { e.preventDefault(); handleMenuLinkClick('/admin/statistics') }}
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
                        pathname.includes("/admin/statistics")
                          ? "text-white bg-blue-600/30 shadow-lg shadow-white/10 backdrop-blur-sm"
                          : "text-white/90 hover:text-white hover:bg-white/20 hover:shadow-lg hover:shadow-white/5",
                      )}
                    >
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Статистика
                    </a>
                  </motion.div>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side actions (поиск, уведомления, профиль, меню) */}
          <div className="flex items-center gap-3 absolute right-0 top-0 h-full pr-2 z-10">
            {/* Theme Toggler */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }}
                    variants={pulseVariants as unknown as Variants}
                    initial="initial"
                    animate="animate"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="h-10 w-10 text-white hover:text-white hover:bg-white/25 relative overflow-hidden rounded-lg backdrop-blur-sm transition-all duration-300"
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
                <TooltipContent side="bottom" className="bg-blue-700/90 text-white border-blue-600">
                  {theme === "dark" ? "Включить светлую тему" : "Включить темную тему"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Только иконка поиска */}
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
                      className="relative h-10 w-10 text-white hover:text-white hover:bg-white/25 rounded-lg backdrop-blur-sm transition-all duration-300"
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
                <TooltipContent side="bottom" className="bg-blue-700/90 text-white border-blue-600">
                  <div className="flex items-center gap-2">
                    Поиск
                    <kbd className="px-1.5 py-0.5 text-xs bg-white/20 rounded border">
                      Shift + /
                    </kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Enhanced Notifications */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <motion.div 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }}
                        variants={pulseVariants as unknown as Variants}
                        initial="initial"
                        animate="animate"
                      >
                        <Button variant="ghost" size="icon" className="relative h-10 w-10 text-white hover:text-white hover:bg-white/25 rounded-lg backdrop-blur-sm transition-all duration-300">
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
                  <TooltipContent side="bottom" className="bg-blue-700/90 text-white border-blue-600">
                    Уведомления
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent
                align="end"
                className="w-96 p-0 rounded-xl backdrop-blur-xl bg-white/95 border border-gray-200 shadow-xl"
                sideOffset={8}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <DropdownMenuLabel className="font-bold text-sm text-gray-800 p-0">
                    Уведомления
                  </DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-blue-600 hover:bg-blue-50 rounded-lg"
                        onClick={handleMarkAllAsRead}
                        disabled={notificationsLoading}
                      >
                        Отметить все как прочитанные
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-[400px] overflow-auto">
                  {notificationsLoading ? (
                    <div className="py-8 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-blue-300 border-t-blue-500 rounded-full mx-auto mb-3"
                      />
                      <p className="text-sm text-gray-600">Загрузка уведомлений...</p>
                    </div>
                  ) : (notifications && Array.isArray(notifications) && notifications.length > 0) ? (
                    notifications.slice(0, 10).map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "border-b border-gray-100 last:border-b-0 relative",
                          !notification.isRead 
                            ? "bg-blue-50/50" 
                            : "bg-white"
                        )}
                      >
                        <div className="py-4 px-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 relative">
                          <div className="flex gap-3">
                            <div 
                              className="flex-shrink-0 mt-1"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div 
                              className="flex-1 min-w-0"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span className={cn(
                                  "text-sm pr-2",
                                  notification.isRead 
                                    ? "font-medium text-gray-700" 
                                    : "font-semibold text-gray-900"
                                )}>
                                  {notification.title}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatRelativeTime(notification.createdAt)}
                                  </span>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {notification.message}
                              </p>
                              
                              {/* Дополнительная информация о книге, если есть */}
                              {(notification as any).bookTitle && (
                                <div className="mb-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  📖 {(notification as any).bookTitle}
                                  {(notification as any).bookAuthors && (
                                    <span className="text-gray-500"> • {(notification as any).bookAuthors}</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Индикатор приоритета */}
                              {notification.priority && notification.priority !== 'Normal' && (
                                <div className="mb-2">
                                  <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                    notification.priority === 'Critical' 
                                      ? "bg-red-100 text-red-700"
                                      : notification.priority === 'High'
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-gray-100 text-gray-700"
                                  )}>
                                    {notification.priority === 'Critical' ? 'Критически важно' :
                                     notification.priority === 'High' ? 'Важно' : 'Обычное'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          

                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <Bell className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Нет новых уведомлений</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100 p-4">
                  <Button
                    variant="outline"
                    className="w-full text-sm font-semibold text-blue-600 hover:bg-blue-50 border-blue-200 rounded-lg transition-all duration-200"
                    onClick={() => handleMenuLinkClick('/admin/notifications')}
                  >
                    Управление уведомлениями
                  </Button>
                </div>
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
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/25 transition-all duration-300 backdrop-blur-sm"
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Avatar className="h-9 w-9 transition-transform border-2 border-white/30 shadow-lg">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">
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
                  <TooltipContent side="bottom" className="bg-blue-700/90 text-white border-blue-600">
                    Профиль пользователя
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent
                align="end"
                className="min-w-[240px] p-3 rounded-xl backdrop-blur-xl bg-white/95 border border-gray-200 shadow-xl"
                sideOffset={8}
              >
                <div className="px-3 py-3 mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-blue-200 shadow-lg">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-base font-bold">
                        {getInitials(user?.username || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800">{user?.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          {user?.roles[0] || "Администратор"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuGroup>
                  <motion.div whileHover={{ x: 4 }}>
                    <DropdownMenuItem 
                      className="py-3 px-3 rounded-lg hover:bg-blue-50 cursor-pointer text-sm text-gray-800 transition-all duration-200"
                      onClick={() => handleMenuLinkClick('/profile')}
                    >
                      <UserIcon className="h-4 w-4 mr-3 text-blue-500" />
                      Профиль
                    </DropdownMenuItem>
                  </motion.div>
                  <motion.div whileHover={{ x: 4 }}>
                    <DropdownMenuItem 
                      className="py-3 px-3 rounded-lg hover:bg-blue-50 cursor-pointer text-sm text-gray-800 transition-all duration-200"
                      onClick={() => handleMenuLinkClick('/settings')}
                    >
                      <Settings className="h-4 w-4 mr-3 text-blue-500" />
                      Настройки
                    </DropdownMenuItem>
                  </motion.div>
                  <motion.div whileHover={{ x: 4 }}>
                    <DropdownMenuItem 
                      className="py-3 px-3 rounded-lg hover:bg-blue-50 cursor-pointer text-sm text-gray-800 transition-all duration-200"
                      onClick={() => handleMenuLinkClick('/profile/mybooks')}
                    >
                      <BookOpen className="h-4 w-4 mr-3 text-blue-500" />
                      Мои книги
                    </DropdownMenuItem>
                  </motion.div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-gray-200" />
                <motion.div whileHover={{ x: 4 }}>
                  <DropdownMenuItem
                    className="py-3 px-3 rounded-lg hover:bg-red-50 cursor-pointer text-sm text-gray-800 transition-all duration-200"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-3 text-red-500" />
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
                className="h-10 w-10 lg:hidden text-white hover:text-white hover:bg-white/25 rounded-lg backdrop-blur-sm transition-all duration-300"
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
                      <a
                        href={link.route}
                        onClick={e => { e.preventDefault(); handleMenuLinkClick(link.route) }}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg transition-all duration-300",
                            isSelected
                              ? "bg-white/25 text-white shadow-lg"
                              : "hover:bg-white/15 text-white/90 hover:text-white",
                          )}
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
                      </a>
                    </motion.div>
                  )
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {activePreview && (
        <IframePagePreviewCentered
          route={activePreview.href}
          isVisible={!!activePreview}
          coords={activePreview.coords}
          displayMode={activePreview.type === 'iframe-enhanced' ? 'iframe' : activePreview.type as 'quick' | 'api' | 'iframe'}
          onMouseEnter={cancelHidePreview}
          onMouseLeave={handleIconLeave}
        />
      )}
      {/* Overlay Search (оверлей поверх всей шапки) */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            ref={searchResultsRef}
            variants={searchResultsVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-0 top-0 w-full z-50 bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200"
            style={{ minHeight: '80px' }}
          >
            <div className="container mx-auto px-4 pt-4 pb-2">
              <div className="relative max-w-xl mx-auto">
                <Input
                  ref={searchInputRef}
                  placeholder="Поиск... (нажмите ? для быстрого доступа)"
                  className="pr-10 h-12 focus:ring-2 focus:ring-blue-300 text-lg border-white/30 bg-white/80 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 rounded-xl shadow"
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
                      className="h-6 w-6 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg"
                      onClick={() => {
                        setSearchQuery("")
                        searchInputRef.current?.focus()
                      }}
                    >
                      <X size={14} />
                    </Button>
                  )}
                  <div className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                    Shift + /
                  </div>
                </div>
              </div>
            </div>
            <div className="container mx-auto px-4 pb-4">
              <div className="max-w-xl mx-auto">
                <div className="overflow-y-auto max-h-[60vh]">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-blue-300 border-t-blue-500 rounded-full mr-3"
                      />
                      <span className="text-sm text-gray-800">Поиск...</span>
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
                          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
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
                                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                                  x: 4,
                                  transition: { duration: 0.2 },
                                }}
                                className="flex items-center gap-3 px-3 py-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200"
                                onClick={() => handleSearchResultClick(result)}
                              >
                                <div className="flex-shrink-0">{result.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-gray-800">{result.title}</p>
                                  {result.subtitle && (
                                    <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                                  )}
                                </div>
                                <motion.div
                                  whileHover={{ x: 3, scale: 1.1 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                        <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-800 mb-2">Ничего не найдено по запросу "{searchQuery}"</p>
                        <p className="text-xs text-gray-500">
                          Попробуйте изменить запрос или выбрать из истории поиска
                        </p>
                      </motion.div>
                    </div>
                  ) : recentSearches.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
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
                          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
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
                              backgroundColor: "rgba(59, 130, 246, 0.1)",
                              x: 4,
                              transition: { duration: 0.2 },
                            }}
                            onClick={() => selectRecentSearch(query)}
                            className="flex items-center gap-3 px-3 py-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200"
                          >
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-800">{query}</span>
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
                          <Search className="h-6 w-6 text-gray-400" />
                          <Zap className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-800 mb-2">Введите запрос для поиска</p>
                        <p className="text-xs text-gray-500">
                          Используйте <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Shift + /</kbd> для быстрого доступа
                        </p>
                      </motion.div>
                    </div>
                  )}
                </div>
                {searchQuery.trim() !== "" && (
                  <div className="p-3 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-gray-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      onClick={() => { handleMenuLinkClick(`/admin/search?q=${encodeURIComponent(searchQuery)}`) }}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Расширенный поиск по "{searchQuery}"
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default TopNavigation
