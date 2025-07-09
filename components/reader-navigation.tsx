"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Search, Menu, Moon, Sun, Book, BookOpen, Home, Heart, Clock, LogIn, Settings, UserIcon, ChevronDown, LogOut, ExternalLink, X, FileText, Zap, Bell, Library } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAuth, User } from "@/lib/auth";
import { useNotifications } from "@/hooks/use-notifications";
import { 
  getNotificationIcon, 
  formatRelativeTime, 
  getPriorityColor,
  getPriorityTextColor,
  getNotificationTypeLabel
} from "@/lib/notification-utils";
import { PreviewSwitcher, PreviewType } from "@/components/ui/preview-switcher";

// Интерфейсы для результатов поиска
interface SearchResult {
  id: string | number
  title: string
  subtitle?: string
  type: "book" | "journal" | "page"
  url: string
  icon: React.ReactElement
}

interface SearchResultCategory {
  title: string
  icon: React.ReactElement
  results: SearchResult[]
}

interface ReaderNavLink {
  text: string;
  route: string;
  img: string;
  icon: React.ReactElement;
  previewType: PreviewType;
}

// Reader navigation links
const readerNavLinks: ReaderNavLink[] = [{
  text: "Главная",
  route: "/readers",
  img: "/icons/admin/dashboard.png",
  icon: <Home className="h-5 w-5" />,
  previewType: 'api'
}, {
  text: "Книги",
  route: "/readers/books",
  img: "/icons/admin/books.png",
  icon: <Book className="h-5 w-5" />,
  previewType: 'apiУ'
}, {
  text: "Полки",
  route: "/readers/shelfs",
  img: "/icons/admin/shelf.png",
  icon: <Library className="h-5 w-5" />,
  previewType: 'api'
}, {
  text: "Избранное",
  route: "/readers/favorites",
  img: "/icons/admin/favorites.png",
  icon: <Heart className="h-5 w-5" />,
  previewType: 'api'
}, {
  text: "История",
  route: "/readers/history",
  img: "/icons/admin/history.png",
  icon: <Clock className="h-5 w-5" />,
  previewType: 'api'
}];

// Вспомогательная функция для получения инициалов пользователя
const getInitials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map(part => part[0]).join("").toUpperCase().substring(0, 2);
};

const ReaderNavigation = () => {
  const {
    user: authUser,
    logout
  } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultCategory[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<PreviewType>('iframe');
  const hidePreviewTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Используем хук для работы с уведомлениями
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useNotifications();

  const handleNavMouseEnter = (route: string) => {
    if (hidePreviewTimeout.current) {
      clearTimeout(hidePreviewTimeout.current);
    }
    setHoveredNavItem(route);
  };

  const handleNavMouseLeave = () => {
    hidePreviewTimeout.current = setTimeout(() => {
      setHoveredNavItem(null);
    }, 200); // Задержка перед скрытием
  };

  // Keyboard shortcut handler
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
    const savedTheme = localStorage.getItem("theme") || "light";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme === "dark" || savedTheme === "system" && prefersDark ? "dark" : "light";
    setTheme(initialTheme as "light" | "dark");
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Load recent searches
    const savedSearches = localStorage.getItem("recentSearches")
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches))
    }
  }, []);

  // Keyboard event listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  // Загрузка пользователя из авторизации
  useEffect(() => {
    // Используем данные из контекста авторизации
    setUser(authUser);
  }, [authUser]);

  // Функции для работы с уведомлениями
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  // Переключение темы с анимацией
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Продвинутый поиск книг
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
        // Поиск книг
        const booksResponse = await fetch(`${baseUrl}/api/books`)

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
            const bookResults: SearchResult[] = filteredBooks.slice(0, 8).map((book: any) => ({
              id: book.id,
              title: book.title,
              subtitle: Array.isArray(book.authors) 
                ? book.authors.join(", ") 
                : book.authors,
              type: "book" as const,
              url: `/readers/books/${book.id}`,
              icon: <Book className="h-4 w-4 text-blue-600" />,
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

      // Поиск по страницам сайта
      const pageSearchResults = [
        {
          id: "home",
          title: "Главная страница",
          type: "page" as const,
          url: "/readers",
          icon: <FileText className="h-4 w-4 text-green-500" />,
        },
        {
          id: "books",
          title: "Каталог книг",
          type: "page" as const,
          url: "/readers/books",
          icon: <FileText className="h-4 w-4 text-green-500" />,
        },
        {
          id: "favorites",
          title: "Избранные книги",
          type: "page" as const,
          url: "/readers/favorites",
          icon: <FileText className="h-4 w-4 text-green-500" />,
        },
        {
          id: "history",
          title: "История чтения",
          type: "page" as const,
          url: "/readers/history",
          icon: <FileText className="h-4 w-4 text-green-500" />,
        },
        {
          id: "profile",
          title: "Профиль",
          type: "page" as const,
          url: "/profile",
          icon: <FileText className="h-4 w-4 text-green-500" />,
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

  // Animation variants for nav items
  const navItemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: -5
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    }),
    hover: {
      y: -2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  // Logo animation variants
  const logoVariants: Variants = {
    initial: {
      rotate: -90,
      opacity: 0
    },
    animate: {
      rotate: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      rotate: 5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  // Search variants
  const searchVariants: Variants = {
    closed: {
      width: "40px",
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    open: {
      width: "320px",
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  }

  // Mobile menu animation variants
  const mobileMenuVariants: Variants = {
    hidden: {
      opacity: 0,
      height: 0
    },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const mobileMenuItemVariants: Variants = {
    hidden: {
      opacity: 0,
      x: -10
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2
      }
    },
    exit: {
      opacity: 0,
      x: -10
    }
  };

  return (
    <header 
      ref={headerRef} 
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur-md transition-all duration-300", 
        scrolled 
          ? "bg-white/95 dark:bg-gray-800/95 shadow-md backdrop-blur-xl" 
          : "bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <motion.div 
              variants={logoVariants} 
              initial="initial" 
              animate="animate" 
              whileHover="hover" 
              className="flex-shrink-0 cursor-pointer"
            >
              <Link href="/">
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
                      height={40} 
                      width={40} 
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
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex-shrink-0"
            >
              <motion.h1 
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left - rect.width / 2;
                  const y = e.clientY - rect.top - rect.height / 2;
                  
                  e.currentTarget.style.transform = `
                    perspective(1000px) 
                    rotateY(${x / 12}deg) 
                    rotateX(${-y / 12}deg) 
                    translateZ(20px)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
                }}
                className="text-2xl font-black px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-100/30 to-blue-50/20 backdrop-blur-sm shadow-lg border border-blue-200/30 tracking-wider cursor-default relative overflow-hidden transition-all duration-300"
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  textShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(59, 130, 246, 0.1) 100%)',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
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
                    backgroundImage: 'linear-gradient(90deg, #1e40af 0%, #1e40af 8%, #3b82f6 20%, #60a5fa 30%, #93c5fd 40%, #dbeafe 50%, #93c5fd 60%, #60a5fa 70%, #3b82f6 80%, #1e40af 92%, #1e40af 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                    WebkitFontSmoothing: 'antialiased',
                    textRendering: 'optimizeLegibility',
                  } as React.CSSProperties}
                >
                  СИНАПС
                </motion.span>
                
                {/* 3D карточка эффект - задний слой */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-lg"
                  style={{
                    transform: 'translateZ(-15px)',
                    transformStyle: 'preserve-3d',
                  }}
                  whileHover={{
                    transform: 'translateZ(-25px) rotateX(-8deg) rotateY(3deg)',
                    transition: { duration: 0.4 }
                  }}
                />
                
                {/* Дополнительный слой для глубины */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-300/15 to-blue-500/15 rounded-lg"
                  style={{
                    transform: 'translateZ(-25px)',
                    transformStyle: 'preserve-3d',
                  }}
                  whileHover={{
                    transform: 'translateZ(-35px) rotateX(-12deg) rotateY(5deg)',
                    transition: { duration: 0.4, delay: 0.1 }
                  }}
                />
              </motion.h1>
            </motion.div>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            {readerNavLinks.map((link, index) => {
              const isSelected = (link.route !== "/readers" && pathname.includes(link.route) && link.route.length > 1) || pathname === link.route;
              return (
                <motion.div 
                  key={link.route} 
                  custom={index} 
                  initial="hidden" 
                  animate="visible" 
                  whileHover="hover" 
                  variants={navItemVariants}
                  className="relative"
                  onMouseEnter={() => handleNavMouseEnter(link.route)}
                  onMouseLeave={() => handleNavMouseLeave()}
                >
                  <Link href={link.route}>
                    <div className={cn(
                      "relative px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 group",
                      isSelected 
                        ? "text-blue-500 dark:text-blue-400" 
                        : "text-gray-800 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                    )}>
                      <div className="flex items-center gap-2">
                        {link.icon}
                        <span>{link.text}</span>
                      </div>

                      {/* Animated underline effect */}
                      {isSelected && (
                        <motion.div 
                          layoutId="navIndicator" 
                          className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500 dark:bg-blue-400" 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          transition={{ duration: 0.3 }} 
                        />
                      )}
                    </div>
                  </Link>
                  
                  {/* Page Preview */}
                  <PreviewSwitcher
                    route={link.route}
                    isVisible={hoveredNavItem === link.route}
                    position="bottom"
                    className="left-1/2 transform -translate-x-1/2"
                    type={link.previewType}
                    enableScrollControl={true}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggler */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleTheme} 
                      className="h-9 w-9 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 relative overflow-hidden"
                    >
                      <AnimatePresence mode="wait">
                        {theme === "dark" ? (
                          <motion.div 
                            key="sun" 
                            initial={{ y: 20, opacity: 0, rotate: -90 }} 
                            animate={{ y: 0, opacity: 1, rotate: 0 }} 
                            exit={{ y: -20, opacity: 0, rotate: 90 }} 
                            transition={{ duration: 0.3 }}
                          >
                            <Sun size={18} />
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="moon" 
                            initial={{ y: 20, opacity: 0, rotate: 90 }} 
                            animate={{ y: 0, opacity: 1, rotate: 0 }} 
                            exit={{ y: -20, opacity: 0, rotate: -90 }} 
                            transition={{ duration: 0.3 }}
                          >
                            <Moon size={18} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Enhanced Notifications */}
            {user && (
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <motion.div 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button variant="ghost" size="icon" className="relative h-9 w-9 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                            <Bell size={18} />
                            {unreadCount > 0 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 flex items-center justify-center"
                              >
                                <Badge variant="destructive" className="h-4 min-w-4 px-1 text-xs font-bold bg-red-500 border-2 border-white">
                                  {unreadCount}
                                </Badge>
                              </motion.div>
                            )}
                          </Button>
                        </motion.div>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Уведомления
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent
                  align="end"
                  className="w-96 p-0 rounded-xl backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 shadow-xl"
                  sideOffset={8}
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-600">
                    <DropdownMenuLabel className="font-bold text-sm text-gray-800 dark:text-gray-200 p-0">
                      Уведомления
                    </DropdownMenuLabel>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">Загрузка уведомлений...</p>
                      </div>
                    ) : (notifications && Array.isArray(notifications) && notifications.length > 0) ? (
                      notifications.slice(0, 10).map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "border-b border-gray-100 dark:border-gray-600 last:border-b-0 relative",
                            !notification.isRead 
                              ? "bg-blue-50/50 dark:bg-blue-900/20" 
                              : "bg-white dark:bg-gray-800"
                          )}
                        >
                          <div className="py-4 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-all duration-200 relative">
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
                                      ? "font-medium text-gray-700 dark:text-gray-300" 
                                      : "font-semibold text-gray-900 dark:text-gray-100"
                                  )}>
                                    {notification.title}
                                  </span>
                                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                      {formatRelativeTime(notification.createdAt)}
                                    </span>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                  {notification.message}
                                </p>
                                
                                {/* Дополнительная информация о книге, если есть */}
                                {(notification as any).bookTitle && (
                                  <div className="mb-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                    📖 {(notification as any).bookTitle}
                                    {(notification as any).bookAuthors && (
                                      <span className="text-gray-500 dark:text-gray-400"> • {(notification as any).bookAuthors}</span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Индикатор приоритета */}
                                {notification.priority && notification.priority !== 'Normal' && (
                                  <div className="mb-2">
                                    <span className={cn(
                                      "text-xs px-2 py-0.5 rounded-full font-medium",
                                      notification.priority === 'Critical' 
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : notification.priority === 'High'
                                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300"
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">Нет новых уведомлений</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

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
                          placeholder="Поиск книг, авторов... (нажмите \ для быстрого доступа)"
                          className="pr-10 h-9 focus:ring-2 focus:ring-blue-500 text-sm border-gray-300 dark:border-gray-600"
                          autoFocus
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onClick={() => setIsSearchOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && searchQuery.trim()) {
                              router.push(`/readers/books?q=${encodeURIComponent(searchQuery)}`)
                              setIsSearchOpen(false)
                            }
                          }}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-500 hover:text-gray-800"
                              onClick={() => {
                                setSearchQuery("")
                                searchInputRef.current?.focus()
                              }}
                            >
                              <X size={12} />
                            </Button>
                          )}
                          <div className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border">
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
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "relative h-9 w-9 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400", 
                            isSearchOpen ? "bg-transparent" : ""
                          )} 
                          onClick={() => {
                            setIsSearchOpen(!isSearchOpen);
                            if (!isSearchOpen) {
                              setTimeout(() => {
                                searchInputRef.current?.focus();
                              }, 100);
                            } else {
                              setSearchQuery("");
                              setSearchResults([]);
                            }
                          }}
                        >
                          <motion.div
                            animate={{ rotate: isSearchOpen ? 90 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Search size={18} />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div className="flex items-center gap-2">
                        Поиск
                        <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 rounded border">
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-96 max-h-[70vh] overflow-hidden rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-xl border border-gray-200 dark:border-gray-600 z-50"
                  >
                    <div className="overflow-y-auto max-h-[70vh] p-3">
                      {isSearching ? (
                        <div className="flex items-center justify-center py-8">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-blue-300 border-t-blue-500 rounded-full mr-3"
                          />
                          <span className="text-sm text-gray-800 dark:text-gray-200">Поиск...</span>
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
                              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
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
                                    className="flex items-center gap-3 px-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-all duration-200"
                                    onClick={() => handleSearchResultClick(result)}
                                  >
                                    <div className="flex-shrink-0">{result.icon}</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{result.title}</p>
                                      {result.subtitle && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</p>
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
                            <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">Ничего не найдено по запросу "{searchQuery}"</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Попробуйте изменить запрос или выбрать из истории поиска
                            </p>
                          </motion.div>
                        </div>
                      ) : recentSearches.length > 0 ? (
                        <div>
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
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
                                className="flex items-center gap-3 px-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-all duration-200"
                              >
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-800 dark:text-gray-200">{query}</span>
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
                            <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">Введите запрос для поиска</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Используйте <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">\</kbd> для быстрого доступа
                            </p>
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {searchQuery.trim() !== "" && (
                      <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          variant="ghost"
                          className="w-full text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                          onClick={() => {
                            router.push(`/readers/books?q=${encodeURIComponent(searchQuery)}`)
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

            {/* Login/Profile Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }} 
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/20 transition-colors"
                  >
                    <Avatar className="h-8 w-8 transition-transform border-2 border-blue-300 dark:border-blue-600">
                      <AvatarFallback className="bg-blue-100 text-blue-800 text-sm font-medium">
                        {getInitials(user?.username || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline text-sm font-medium text-gray-800 dark:text-gray-300">
                      {user?.username}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500 hidden lg:block" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="min-w-[220px] p-2 rounded-xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border border-gray-300 dark:border-gray-600" 
                  sideOffset={5}
                >
                  <div className="px-3 py-2 mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-blue-300 dark:border-blue-600">
                        <AvatarFallback className="bg-blue-100 text-blue-800 text-sm font-medium">
                          {getInitials(user?.username || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{user?.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.roles?.join(", ") || "Читатель"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-300 dark:bg-gray-600" />
                  <DropdownMenuGroup>
                    <Link href="/profile" className="w-full">
                      <motion.div whileHover={{ x: 2 }}>
                        <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/20 cursor-pointer text-sm">
                          <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
                          Профиль
                        </DropdownMenuItem>
                      </motion.div>
                    </Link>
                    <Link href="/settings" className="w-full">
                      <motion.div whileHover={{ x: 2 }}>
                        <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/20 cursor-pointer text-sm">
                          <Settings className="h-4 w-4 mr-2 text-blue-500" />
                          Настройки
                        </DropdownMenuItem>
                      </motion.div>
                    </Link>
                    <Link href="/profile/mybooks" className="w-full">
                      <motion.div whileHover={{ x: 2 }}>
                        <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/20 cursor-pointer text-sm">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                          Мои книги
                        </DropdownMenuItem>
                      </motion.div>
                    </Link>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-300 dark:bg-gray-600" />
                  <motion.div whileHover={{ x: 2 }}>
                    <DropdownMenuItem 
                      className="py-2 px-3 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 cursor-pointer text-sm text-red-500 dark:text-red-400" 
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </DropdownMenuItem>
                  </motion.div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-700 text-white transition-colors"
                >
                  <LogIn size={18} />
                  <span className="text-sm font-medium">Войти</span>
                </motion.button>
              </Link>
            )}

            {/* Mobile menu button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 md:hidden text-gray-800 dark:text-gray-300" 
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

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                variants={mobileMenuVariants} 
                initial="hidden" 
                animate="visible" 
                exit="exit" 
                className="absolute top-16 left-0 right-0 md:hidden py-3 border-t border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl z-50"
              >
                <nav className="flex flex-col gap-1.5 px-4">
                  {readerNavLinks.map((link, index) => {
                    const isSelected = (link.route !== "/readers" && pathname.includes(link.route) && link.route.length > 1) || pathname === link.route;
                    return (
                      <motion.div 
                        key={link.route} 
                        variants={mobileMenuItemVariants} 
                        custom={index} 
                        whileHover={{ x: 5 }}
                      >
                        <Link href={link.route}>
                          <div 
                            className={cn(
                              "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200",
                              isSelected 
                                ? "bg-blue-100/80 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400" 
                                : "hover:bg-gray-100/80 dark:hover:bg-gray-700/30 text-gray-800 dark:text-gray-300"
                            )} 
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {link.icon}
                            <span className="font-medium text-sm">{link.text}</span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default ReaderNavigation;