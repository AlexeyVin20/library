"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { adminSideBarLinks } from "@/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import { Session } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Menu, Moon, Sun, User, Book, BookOpen, FileText, ExternalLink, Bookmark, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CatalogMenu from "./CatalogMenu";
import React from "react";

// Интерфейсы для результатов поиска
interface SearchResult {
  id: string | number;
  title: string;
  subtitle?: string;
  type: 'user' | 'book' | 'journal' | 'page';
  url: string;
  icon: React.ReactElement;
}

interface SearchResultCategory {
  title: string;
  icon: React.ReactElement;
  results: SearchResult[];
}

const TopNavigation = ({ session }: { session: Session }) => {
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

  // Theme toggle effect
  useEffect(() => {
    // Определим текущую тему из системных настроек или localStorage
    const savedTheme = localStorage.getItem("theme") || "light";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme === "dark" || (savedTheme === "system" && prefersDark) ? "dark" : "light";
    
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

  // Эффект для обработки клика вне поля поиска
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Переключение темы
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

  // Функция для выполнения поиска
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      console.log("Выполняется поиск по запросу:", query);
      
      let categorizedResults: SearchResultCategory[] = [];
      
      // Получение базового URL API из переменных окружения
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) {
        console.error("NEXT_PUBLIC_BASE_URL не определен");
        return;
      }
      
      console.log("Используемый URL API:", baseUrl);

      // Выполнение запросов к API для поиска
      try {
        // Получаем всех пользователей и книги
        const [usersResponse, booksResponse] = await Promise.all([
          fetch(`${baseUrl}/api/User`),
          fetch(`${baseUrl}/api/Books`)
        ]);
        
        // Обработка результатов поиска пользователей
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log("Получены все пользователи:", usersData);
          
          // Фильтруем пользователей по поисковому запросу
          const filteredUsers = usersData.filter((user: any) => 
            (user.fullName && user.fullName.toLowerCase().includes(query.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(query.toLowerCase())) ||
            (user.username && user.username.toLowerCase().includes(query.toLowerCase()))
          );
          
          console.log("Отфильтрованные пользователи:", filteredUsers);
          
          if (filteredUsers && filteredUsers.length > 0) {
            const userResults: SearchResult[] = filteredUsers.map((user: any) => ({
              id: user.id,
              title: user.fullName || user.username || user.name,
              subtitle: user.email,
              type: "user" as const,
              url: `/admin/users/${user.id}`,
              icon: <User className="h-4 w-4 text-blue-500" />
            }));
            
            categorizedResults.push({
              title: "Пользователи",
              icon: <User className="h-4 w-4" />,
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
          const filteredBooks = booksData.filter((book: any) => 
            (book.title && book.title.toLowerCase().includes(query.toLowerCase())) ||
            (book.authors && book.authors.toLowerCase().includes(query.toLowerCase()))
          );
          
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
      const pageSearchResults = [
        {
          id: "dashboard",
          title: "Панель управления",
          type: "page" as const,
          url: "/admin",
          icon: <FileText className="h-4 w-4 text-purple-500" />
        },
        {
          id: "users",
          title: "Управление пользователями",
          type: "page" as const,
          url: "/admin/users",
          icon: <FileText className="h-4 w-4 text-purple-500" />
        },
        {
          id: "books",
          title: "Каталог книг",
          type: "page" as const,
          url: "/admin/books",
          icon: <FileText className="h-4 w-4 text-purple-500" />
        },
        {
          id: "journals",
          title: "Журналы и подписки",
          type: "page" as const,
          url: "/admin/journals",
          icon: <FileText className="h-4 w-4 text-purple-500" />
        },
        {
          id: "statistics",
          title: "Статистика",
          type: "page" as const,
          url: "/admin/statistics",
          icon: <FileText className="h-4 w-4 text-purple-500" />
        },
        {
          id: "Shelfs",
          title: "Полки",
          type: "page" as const,
          url: "/admin/shelfs",
          icon: <FileText className="h-4 w-4 text-purple-500" />
        }
      ].filter(page => 
        page.title.toLowerCase().includes(query.toLowerCase())
      );
      
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
      const newRecentSearches = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery).slice(0, 4)
      ];
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
    hidden: { opacity: 0, y: -5 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  // Variants for search results animation
  const searchResultsVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-gray-800/95 shadow-sm backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex-shrink-0"
            >
              <Image src="/icons/admin/logo.png" alt="logo" height={36} width={36} className="object-contain" />
            </motion.div>
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent"
            >
              Библиотека
            </motion.h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {adminSideBarLinks.map((link, index) => {
              // Пропускаем ссылку на книги, так как будем использовать CatalogMenu вместо неё
              if (link.route === "/admin/books") {
                return (
                  <motion.div
                    key={link.route}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={navItemVariants}
                  >
                    <CatalogMenu />
                  </motion.div>
                );
              }

              const isSelected =
                (link.route !== "/admin" &&
                  pathname.includes(link.route) &&
                  link.route.length > 1) ||
                pathname === link.route;
              
              return (
                <motion.div
                  key={link.route}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={navItemVariants}
                >
                  <Link href={link.route}>
                    <div
                      className={cn(
                        "relative px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 group",
                        isSelected ? "text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5">
                          <Image
                            src={link.img}
                            alt="icon"
                            fill
                            className={cn(
                              "object-contain transition-all", 
                              isSelected && "text-primary-600"
                            )}
                          />
                        </div>
                        <span>{link.text}</span>
                      </div>
                      
                      {/* Animated underline effect */}
                      {isSelected && (
                        <motion.div
                          layoutId="navIndicator"
                          className="absolute bottom-0 left-0 h-0.5 w-full bg-primary-600 dark:bg-primary-400"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggler */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {theme === "dark" ? (
                <Sun size={18} className="transition-all duration-200 rotate-0 scale-100" />
              ) : (
                <Moon size={18} className="transition-all duration-200 rotate-0 scale-100" />
              )}
            </Button>
            
            {/* Global Search */}
            <div className="relative">
              <motion.div
                animate={{ width: isSearchOpen ? "280px" : "40px" }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                {isSearchOpen && (
                  <Input
                    ref={searchInputRef}
                    placeholder="Поиск книг, журналов, страниц..."
                    className="pr-8 h-9 focus:ring-1 focus:ring-primary-500 text-sm"
                    autoFocus
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onClick={() => setIsSearchOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-0 h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
                    isSearchOpen ? "bg-transparent" : ""
                  )}
                  onClick={() => {
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
                  }}
                >
                  <Search size={18} />
                </Button>
              </motion.div>

              {/* Search Results */}
              {isSearchOpen && (
                <motion.div
                  ref={searchResultsRef}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={searchResultsVariants}
                  className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                  style={{ display: isSearchOpen ? 'block' : 'none' }}
                >
                  <div className="overflow-y-auto max-h-[70vh] p-2">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Поиск...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      // Результаты поиска, сгруппированные по категориям
                      <>
                        {searchResults.map((category, index) => (
                          <div key={index} className="mb-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              {category.icon}
                              <span>{category.title}</span>
                            </div>
                            <div className="mt-1">
                              {category.results.map((result) => (
                                <div 
                                  key={`${result.type}-${result.id}`}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/70 rounded-lg cursor-pointer"
                                  onClick={() => handleSearchResultClick(result)}
                                >
                                  <div className="flex-shrink-0">
                                    {result.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{result.title}</p>
                                    {result.subtitle && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</p>
                                    )}
                                  </div>
                                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : searchQuery ? (
                      // Ничего не найдено
                      <div className="text-center py-4 px-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ничего не найдено по запросу "{searchQuery}"</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Попробуйте изменить запрос или выбрать из истории поиска</p>
                      </div>
                    ) : recentSearches.length > 0 ? (
                      // История поиска
                      <div>
                        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          <Clock className="h-4 w-4" />
                          <span>Недавние поиски</span>
                        </div>
                        <div className="mt-1">
                          {recentSearches.map((query, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => selectRecentSearch(query)}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/70 rounded-lg cursor-pointer"
                            >
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-800 dark:text-gray-200">{query}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Пустой поиск, без истории
                      <div className="text-center py-4">
                        <Search className="h-6 w-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Введите запрос для поиска</p>
                      </div>
                    )}
                  </div>
                  
                  {(searchQuery.trim() !== "") && (
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        variant="ghost" 
                        className="w-full text-sm text-primary hover:bg-primary/10 dark:hover:bg-primary/5"
                        onClick={() => {
                          router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
                          setIsSearchOpen(false);
                        }}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Расширенный поиск по "{searchQuery}"
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell size={18} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700">
                <DropdownMenuLabel className="font-semibold text-sm text-gray-700 dark:text-gray-300">Уведомления</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <div className="max-h-[300px] overflow-auto py-1">
                  <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">Новая книга добавлена</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">2 часа назад</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">Обновление системы</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Вчера</span>
                    </div>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem className="flex justify-center py-2 text-sm font-medium text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Просмотреть все
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Avatar className="h-8 w-8 transition-transform hover:scale-105">
                    <AvatarFallback className="bg-amber-100 text-gray-800 text-sm font-medium">
                      {getInitials(session?.user?.name || "IN")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {session?.user?.name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px] p-2 rounded-xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700">
                <DropdownMenuLabel className="font-semibold text-sm text-gray-700 dark:text-gray-300">Мой аккаунт</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm">
                  Профиль
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm">
                  Настройки
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem className="py-2 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-sm text-red-500 dark:text-red-400">
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden text-gray-700 dark:text-gray-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden py-3 border-t dark:border-gray-700"
          >
            <nav className="flex flex-col gap-1.5">
              {adminSideBarLinks.map((link) => {
                const isSelected =
                  (link.route !== "/admin" &&
                    pathname.includes(link.route) &&
                    link.route.length > 1) ||
                  pathname === link.route;
                
                return (
                  <Link href={link.route} key={link.route}>
                    <div
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                        isSelected
                          ? "bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="relative w-5 h-5">
                        <Image
                          src={link.img}
                          alt="icon"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="font-medium text-sm">{link.text}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default TopNavigation;