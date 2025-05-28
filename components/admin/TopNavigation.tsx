"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { adminSideBarLinks } from "@/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Menu, Moon, Sun, UserIcon, Book, FileText, ExternalLink, Clock, LogOut, Settings, ChevronDown, X, BookOpen, Users, Calendar, BarChart2, Library, Bookmark, CheckCircle2, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import CatalogMenu from "./CatalogMenu";
import type React from "react";
import { useAuth, User } from "@/lib/auth";

// Интерфейсы для результатов поиска
interface SearchResult {
  id: string | number;
  title: string;
  subtitle?: string;
  type: "user" | "book" | "journal" | "page";
  url: string;
  icon: React.ReactElement;
}
interface SearchResultCategory {
  title: string;
  icon: React.ReactElement;
  results: SearchResult[];
}
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}
const TopNavigation = ({
  user
}: {
  user: User | null;
}) => {
  const {
    logout
  } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultCategory[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([{
    id: '1',
    title: 'Новая книга добавлена',
    message: 'Книга "Война и мир" была добавлена в каталог',
    time: '2 часа назад',
    read: false,
    type: 'success'
  }, {
    id: '2',
    title: 'Обновление системы',
    message: 'Система была обновлена до версии 2.5.0',
    time: 'Вчера',
    read: false,
    type: 'info'
  }, {
    id: '3',
    title: 'Просроченные книги',
    message: 'У 5 пользователей есть просроченные книги',
    time: '3 дня назад',
    read: true,
    type: 'warning'
  }]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Theme toggle effect
  useEffect(() => {
    // Определим текущую тему из системных настроек или localStorage
    const savedTheme = localStorage.getItem("theme") || "light";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme === "dark" || savedTheme === "system" && prefersDark ? "dark" : "light";
    setTheme(initialTheme as "light" | "dark");
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Загрузим недавние поиски из localStorage
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Calculate unread notifications
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

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

  // Эффект для обработки клика вне поля поиска
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node) && searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? {
      ...notification,
      read: true
    } : notification));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
  };

  // Функция для выполнения поиска
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      console.log("Выполняется поиск по запросу:", query);
      const categorizedResults: SearchResultCategory[] = [];

      // Получение базового URL API из переменных окружения
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) {
        console.error("NEXT_PUBLIC_BASE_URL не определен");
        return;
      }
      console.log("Используемый URL API:", baseUrl);

      // Выполнение запросов к API для поиска
      try {
        // Получаем всех пользователей и книг
        const [usersResponse, booksResponse] = await Promise.all([fetch(`${baseUrl}/api/User`), fetch(`${baseUrl}/api/Books`)]);

        // Обработка результатов поиска пользователей
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log("Получены все пользователи:", usersData);

          // Фильтруем пользователей по поисковому запросу
          const filteredUsers = usersData.filter((user: any) => user.username && user.username.toLowerCase().includes(query.toLowerCase()));
          console.log("Отфильтрованные пользователи:", filteredUsers);
          if (filteredUsers && filteredUsers.length > 0) {
            const userResults: SearchResult[] = filteredUsers.map((user: any) => ({
              id: user.id,
              title: user.username,
              type: "user" as const,
              url: `/admin/users/${user.id}`,
              icon: <UserIcon className="h-4 w-4 text-emerald-500" />
            }));
            categorizedResults.push({
              title: "Пользователи",
              icon: <UserIcon className="h-4 w-4" />,
              results: userResults
            });
          }
        } else {
          console.error("Ошибка при получении пользователей:", usersResponse.status, await usersResponse.text());
        }

        // Обработка результатов поиска книг
        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          console.log("Получены все книги:", booksData);

          // Фильтруем книги по поисковому запросу
          const filteredBooks = booksData.filter((book: any) => book.title && book.title.toLowerCase().includes(query.toLowerCase()) || book.authors && book.authors.toLowerCase().includes(query.toLowerCase()));
          console.log("Отфильтрованные книги:", filteredBooks);
          if (filteredBooks && filteredBooks.length > 0) {
            const bookResults: SearchResult[] = filteredBooks.map((book: any) => ({
              id: book.id,
              title: book.title,
              subtitle: book.authors,
              type: "book" as const,
              url: `/admin/books/${book.id}`,
              icon: <Book className="h-4 w-4 text-amber-500" />
            }));
            categorizedResults.push({
              title: "Книги",
              icon: <Book className="h-4 w-4" />,
              results: bookResults
            });
          }
        } else {
          console.error("Ошибка при получении книг:", booksResponse.status, await booksResponse.text());
        }
      } catch (fetchError) {
        console.error("Ошибка при выполнении запросов к API:", fetchError);
      }

      // Добавляем поиск по страницам сайта (статический, всегда работает)
      const pageSearchResults = [{
        id: "dashboard",
        title: "Панель управления",
        type: "page" as const,
        url: "/admin",
        icon: <FileText className="h-4 w-4 text-purple-500" />
      }, {
        id: "users",
        title: "Управление пользователями",
        type: "page" as const,
        url: "/admin/users",
        icon: <FileText className="h-4 w-4 text-purple-500" />
      }, {
        id: "books",
        title: "Каталог книг",
        type: "page" as const,
        url: "/admin/books",
        icon: <FileText className="h-4 w-4 text-purple-500" />
      }, {
        id: "journals",
        title: "Журналы и подписки",
        type: "page" as const,
        url: "/admin/journals",
        icon: <FileText className="h-4 w-4 text-purple-500" />
      }, {
        id: "statistics",
        title: "Статистика",
        type: "page" as const,
        url: "/admin/statistics",
        icon: <FileText className="h-4 w-4 text-purple-500" />
      }, {
        id: "Shelfs",
        title: "Полки",
        type: "page" as const,
        url: "/admin/shelfs",
        icon: <FileText className="h-4 w-4 text-purple-500" />
      }].filter(page => page.title.toLowerCase().includes(query.toLowerCase()));
      if (pageSearchResults.length > 0) {
        categorizedResults.push({
          title: "Страницы",
          icon: <FileText className="h-4 w-4" />,
          results: pageSearchResults
        });
      }
      console.log("Итоговые результаты поиска:", categorizedResults);
      setSearchResults(categorizedResults);
    } catch (error) {
      console.error("Ошибка при поиске:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Обработчик изменения поискового запроса
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    console.log("Изменение поискового запроса:", query); // Отладка
    setSearchQuery(query);

    // Гарантируем, что поле поиска открыто при вводе
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    }

    // Выполняем поиск если запрос не пустой
    performSearch(query);
  };

  // Обработка перехода по результату поиска
  const handleSearchResultClick = (result: SearchResult) => {
    // Сохраняем поисковый запрос в истории поиска
    if (searchQuery.trim()) {
      const newRecentSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery).slice(0, 4)];
      setRecentSearches(newRecentSearches);
      localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches));
    }

    // Закрываем поиск и переходим по URL
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    router.push(result.url);
  };

  // Выбор недавнего поиска
  const selectRecentSearch = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Animation variants for nav items
  const navItemVariants = {
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
        ease: [0.22, 1, 0.36, 1]
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

  // Variants for search results animation
  const searchResultsVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transformOrigin: "center"
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transformOrigin: "center",
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transformOrigin: "center",
      transition: {
        duration: 0.15
      }
    }
  };

  // Mobile menu animation variants
  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      height: 0
    },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };
  const mobileMenuItemVariants = {
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

  // Logo animation variants
  const logoVariants = {
    initial: {
      rotate: -90,
      opacity: 0
    },
    animate: {
      rotate: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
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

  // Notification badge pulse animation
  const notificationBadgeVariants = {
    initial: {
      scale: 0
    },
    animate: {
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    pulse: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop" as const
      }
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };
  return <header ref={headerRef} className={cn("sticky top-0 z-50 w-full backdrop-blur-md transition-all duration-300", scrolled ? "bg-green-500/20 dark:bg-green-800/95 shadow-md backdrop-blur-xl" : "bg-green-500/30 dark:bg-green-800/90 backdrop-blur-xl")}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <motion.div variants={logoVariants} initial="initial" animate="animate" whileHover="hover" className="flex-shrink-0 cursor-pointer">
              <Link href="/admin">
                <Image src="/icons/admin/logo.png" alt="logo" height={36} width={36} className="object-contain" />
              </Link>
            </motion.div>
            <motion.h1 initial={{
            x: -20,
            opacity: 0
          }} animate={{
            x: 0,
            opacity: 1
          }} transition={{
            duration: 0.5,
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1]
          }} className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent">
              <Link href="/admin">Библиотека</Link>
            </motion.h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <TooltipProvider>
              {adminSideBarLinks.map((link, index) => {
              // Пропускаем ссылку на книги, так как будем использовать CatalogMenu вместо неё
              if (link.route === "/admin/books") {
                return <CatalogMenu key={link.route} />;
              }
              const isSelected = link.route !== "/admin" && pathname.includes(link.route) && link.route.length > 1 || pathname === link.route;
              return <Tooltip key={link.route}>
                    <TooltipTrigger asChild>
                      <motion.div custom={index} initial="hidden" animate="visible" whileHover="hover" variants={navItemVariants}>
                        <Link href={link.route}>
                          <div className={cn("relative px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 group", isSelected ? "text-green-600 dark:text-green-400" : "text-white dark:text-white hover:text-green-600 dark:hover:text-green-400")}>
                            <div className="flex items-center gap-2">
                              <div className="relative w-5 h-5">
                                <Image src={link.img || "/placeholder.svg"} alt="icon" fill className={cn("object-contain transition-all", isSelected && "text-emerald-600")} />
                              </div>
                              <span>{link.text}</span>
                            </div>
                            
                            {/* Animated underline effect */}
                            {isSelected && <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 h-0.5 w-full bg-emerald-600 dark:bg-emerald-400" initial={{
                          opacity: 0
                        }} animate={{
                          opacity: 1
                        }} transition={{
                          duration: 0.3
                        }} />}
                          </div>
                        </Link>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
                      {link.text}
                    </TooltipContent>
                  </Tooltip>;
            })}
            </TooltipProvider>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggler */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileTap={{
                  scale: 0.9
                }}>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-white dark:text-white hover:text-white dark:hover:text-white relative overflow-hidden">
                      <AnimatePresence mode="wait">
                        {theme === "dark" ? <motion.div key="sun" initial={{
                        y: 20,
                        opacity: 0,
                        rotate: -90
                      }} animate={{
                        y: 0,
                        opacity: 1,
                        rotate: 0
                      }} exit={{
                        y: -20,
                        opacity: 0,
                        rotate: 90
                      }} transition={{
                        duration: 0.3
                      }}>
                            <Sun size={18} />
                          </motion.div> : <motion.div key="moon" initial={{
                        y: 20,
                        opacity: 0,
                        rotate: 90
                      }} animate={{
                        y: 0,
                        opacity: 1,
                        rotate: 0
                      }} exit={{
                        y: -20,
                        opacity: 0,
                        rotate: -90
                      }} transition={{
                        duration: 0.3
                      }}>
                            <Moon size={18} />
                          </motion.div>}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {theme === "dark" ? "Включить светлую тему" : "Включить темную тему"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Global Search */}
            <div className="relative">
              <motion.div animate={{
              width: isSearchOpen ? "280px" : "40px",
              transition: {
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1]
              }
            }} className="flex items-center">
                <AnimatePresence>
                  {isSearchOpen && <motion.div initial={{
                  opacity: 0,
                  width: 0
                }} animate={{
                  opacity: 1,
                  width: "100%"
                }} exit={{
                  opacity: 0,
                  width: 0
                }} transition={{
                  duration: 0.3
                }} className="w-full">
                      <div className="relative">
                        <Input ref={searchInputRef} placeholder="Поиск книг, журналов, страниц..." className="pr-8 h-9 focus:ring-1 focus:ring-emerald-500 text-sm border-emerald-200 dark:border-emerald-800" autoFocus value={searchQuery} onChange={handleSearchChange} onClick={() => setIsSearchOpen(true)} onKeyDown={e => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
                        setIsSearchOpen(false);
                      }
                    }} />
                        {searchQuery && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600" onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}>
                            <X size={14} />
                          </Button>}
                      </div>
                    </motion.div>}
                </AnimatePresence>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div whileHover={{
                      scale: 1.05
                    }} whileTap={{
                      scale: 0.95
                    }} className="flex-shrink-0">
                        <Button variant="ghost" size="icon" className={cn("relative h-9 w-9 text-white dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400", isSearchOpen ? "bg-transparent" : "")} onClick={() => {
                        console.log("Клик по кнопке поиска"); // Отладка
                        setIsSearchOpen(!isSearchOpen);
                        if (!isSearchOpen) {
                          setTimeout(() => {
                            searchInputRef.current?.focus();
                          }, 100);
                        } else {
                          setSearchQuery("");
                          setSearchResults([]);
                        }
                      }}>
                          <Search size={18} />
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Поиск
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>

              {/* Search Results */}
              <AnimatePresence>
                {isSearchOpen && <motion.div ref={searchResultsRef} initial="hidden" animate="visible" exit="exit" variants={searchResultsVariants} className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-hidden rounded-xl bg-emerald-800/90 dark:bg-emerald-900/95 backdrop-blur-xl shadow-lg border border-emerald-700 dark:border-emerald-800 z-50">
                    <div className="overflow-y-auto max-h-[70vh] p-2">
                      {isSearching ? <div className="flex items-center justify-center py-4">
                          <div className="animate-spin w-5 h-5 border-2 border-emerald-300 border-t-transparent rounded-full mr-2"></div>
                          <span className="text-sm text-gray-200">Поиск...</span>
                        </div> : searchResults.length > 0 ?
                  // Результаты поиска, сгруппированные по категориям
                  <>
                          {searchResults.map((category, index) => <div key={index} className="mb-3">
                              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-200 uppercase">
                                {category.icon}
                                <span>{category.title}</span>
                              </div>
                              <div className="mt-1">
                                {category.results.map((result, idx) => <motion.div key={`${result.type}-${result.id}`} initial={{
                          opacity: 0,
                          y: 5
                        }} animate={{
                          opacity: 1,
                          y: 0,
                          transition: {
                            delay: idx * 0.03
                          }
                        }} whileHover={{
                          backgroundColor: theme === "dark" ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.15)",
                          x: 2,
                          transition: {
                            duration: 0.2
                          }
                        }} className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-700/50 dark:hover:bg-emerald-800/50 rounded-lg cursor-pointer" onClick={() => handleSearchResultClick(result)}>
                                    <div className="flex-shrink-0">
                                      {result.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate text-white">{result.title}</p>
                                      {result.subtitle && <p className="text-xs text-emerald-200 truncate">{result.subtitle}</p>}
                                    </div>
                                    <motion.div whileHover={{
                            x: 2
                          }} transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10
                          }}>
                                      <ExternalLink className="h-3.5 w-3.5 text-emerald-300 flex-shrink-0" />
                                    </motion.div>
                                  </motion.div>)}
                              </div>
                            </div>)}
                        </> : searchQuery ?
                  // Ничего не найдено
                  <div className="text-center py-4 px-2">
                          <motion.div initial={{
                      opacity: 0,
                      scale: 0.8
                    }} animate={{
                      opacity: 1,
                      scale: 1
                    }} transition={{
                      duration: 0.3
                    }}>
                            <Search className="h-6 w-6 text-emerald-300 mx-auto mb-2" />
                            <p className="text-sm text-white mb-1">Ничего не найдено по запросу "{searchQuery}"</p>
                            <p className="text-xs text-emerald-200">Попробуйте изменить запрос или выбрать из истории поиска</p>
                          </motion.div>
                        </div> : recentSearches.length > 0 ?
                  // История поиска
                  <div>
                          <div className="flex items-center justify-between px-3 py-1.5">
                            <div className="flex items-center gap-2 text-xs font-medium text-white uppercase">
                              <Clock className="h-4 w-4" />
                              <span>Недавние поиски</span>
                            </div>
                            <motion.button whileHover={{
                        scale: 1.05
                      }} whileTap={{
                        scale: 0.95
                      }} onClick={() => {
                        setRecentSearches([]);
                        localStorage.setItem("recentSearches", JSON.stringify([]));
                      }} className="text-xs text-white hover:text-red-300 transition-colors">
                              Очистить
                            </motion.button>
                          </div>
                          <div className="mt-1">
                            {recentSearches.map((query, idx) => <motion.div key={idx} initial={{
                        opacity: 0,
                        x: -5
                      }} animate={{
                        opacity: 1,
                        x: 0,
                        transition: {
                          delay: idx * 0.05
                        }
                      }} whileHover={{
                        backgroundColor: theme === "dark" ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.15)",
                        x: 2,
                        transition: {
                          duration: 0.2
                        }
                      }} onClick={() => selectRecentSearch(query)} className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-700/50 dark:hover:bg-emerald-800/50 rounded-lg cursor-pointer">
                                <Clock className="h-4 w-4 text-emerald-300" />
                                <span className="text-sm text-white">{query}</span>
                              </motion.div>)}
                          </div>
                        </div> :
                  // Пустой поиск, без истории
                  <div className="text-center py-4">
                          <motion.div initial={{
                      opacity: 0,
                      scale: 0.8
                    }} animate={{
                      opacity: 1,
                      scale: 1
                    }} transition={{
                      duration: 0.3
                    }}>
                            <Search className="h-6 w-6 text-emerald-300 mx-auto mb-2" />
                            <p className="text-sm text-white">Введите запрос для поиска</p>
                          </motion.div>
                        </div>}
                    </div>
                    
                    {searchQuery.trim() !== "" && <div className="p-2 border-t border-emerald-700 dark:border-emerald-800">
                        <Button variant="ghost" className="w-full text-sm text-emerald-200 hover:bg-emerald-700/50 dark:hover:bg-emerald-800/50" onClick={() => {
                    router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
                    setIsSearchOpen(false);
                  }}>
                          <Search className="h-4 w-4 mr-2" />
                          Расширенный поиск по "{searchQuery}"
                        </Button>
                      </div>}
                  </motion.div>}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <motion.div whileHover={{
                      scale: 1.05
                    }} whileTap={{
                      scale: 0.95
                    }}>
                        <Button variant="ghost" size="icon" className="relative h-9 w-9">
                          <Bell size={18} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" />
                          {unreadCount > 0 && <motion.div variants={notificationBadgeVariants} initial="initial" animate={["animate", "pulse"]} className="absolute top-1 right-1 flex items-center justify-center">
                              <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px] font-semibold">
                                {unreadCount}
                              </Badge>
                            </motion.div>}
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Уведомления
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="w-80 p-2 rounded-xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700" sideOffset={5}>
                <div className="flex items-center justify-between mb-2">
                  <DropdownMenuLabel className="font-semibold text-sm text-gray-700 dark:text-gray-300">Уведомления</DropdownMenuLabel>
                  {unreadCount > 0 && <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={markAllAsRead}>
                      Отметить все как прочитанные
                    </Button>}
                </div>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <div className="max-h-[300px] overflow-auto py-1">
                  {notifications.length > 0 ? notifications.map((notification, index) => <motion.div key={notification.id} initial={{
                  opacity: 0,
                  y: 5
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: index * 0.1
                }} className={cn("mb-1 last:mb-0", !notification.read && "bg-emerald-50/50 dark:bg-emerald-900/10")}>
                        <DropdownMenuItem className="py-3 px-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-default" onSelect={() => markAsRead(notification.id)}>
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{notification.title}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{notification.time}</span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">{notification.message}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </motion.div>) : <div className="py-6 text-center">
                      <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Нет новых уведомлений</p>
                    </div>}
                </div>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem className="flex justify-center py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                  Просмотреть все
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          
            {/* User Profile */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <motion.button whileHover={{
                      scale: 1.05
                    }} whileTap={{
                      scale: 0.95
                    }} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                        <Avatar className="h-8 w-8 transition-transform border-2 border-emerald-200 dark:border-emerald-800">
                          <AvatarFallback className="bg-emerald-100 text-emerald-800 text-sm font-medium">
                            {getInitials(user?.username || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user?.username}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-500 hidden lg:block" />
                      </motion.button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Профиль пользователя
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="min-w-[220px] p-2 rounded-xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700" sideOffset={5}>
                <div className="px-3 py-2 mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-emerald-200 dark:border-emerald-800">
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 text-sm font-medium">
                        {getInitials(user?.username || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{user?.username}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuGroup>
                  <Link href="/profile" className="w-full">
                    <motion.div whileHover={{
                    x: 2
                  }}>
                      <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer text-sm">
                        <UserIcon className="h-4 w-4 mr-2 text-emerald-500" />
                        Профиль
                      </DropdownMenuItem>
                    </motion.div>
                  </Link>
                  <motion.div whileHover={{
                  x: 2
                }}>
                    <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer text-sm">
                      <Settings className="h-4 w-4 mr-2 text-emerald-500" />
                      Настройки
                    </DropdownMenuItem>
                  </motion.div>
                  <motion.div whileHover={{
                  x: 2
                }}>
                    <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer text-sm">
                      <BookOpen className="h-4 w-4 mr-2 text-emerald-500" />
                      Мои книги
                    </DropdownMenuItem>
                  </motion.div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <motion.div whileHover={{
                x: 2
              }}>
                  <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-sm text-red-500 dark:text-red-400" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </motion.div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.9
          }}>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden text-gray-700 dark:text-gray-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu size={20} />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && <motion.div variants={mobileMenuVariants} initial="hidden" animate="visible" exit="exit" className="md:hidden py-3 border-t dark:border-gray-700">
              <nav className="flex flex-col gap-1.5">
                {adminSideBarLinks.map((link, index) => {
              const isSelected = link.route !== "/admin" && pathname.includes(link.route) && link.route.length > 1 || pathname === link.route;
              return <motion.div key={link.route} variants={mobileMenuItemVariants} custom={index} whileHover={{
                x: 5
              }}>
                      <Link href={link.route}>
                        <div className={cn("flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200", isSelected ? "bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30 text-white dark:text-white")} onClick={() => setIsMobileMenuOpen(false)}>
                          <div className="relative w-5 h-5">
                            <Image src={link.img || "/placeholder.svg"} alt="icon" fill className="object-contain" />
                          </div>
                          <span className="font-medium text-sm">{link.text}</span>
                        </div>
                      </Link>
                    </motion.div>;
            })}
              </nav>
            </motion.div>}
        </AnimatePresence>
      </div>
    </header>;
};
export default TopNavigation;