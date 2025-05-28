"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, Moon, Sun, Book, BookOpen, Home, Heart, Clock, LogIn, Settings, UserIcon, ChevronDown, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, User } from "@/lib/auth";

// Reader navigation links
const readerNavLinks = [{
  text: "Главная",
  route: "/readers",
  img: "/icons/admin/dashboard.png",
  icon: <Home className="h-5 w-5" />
}, {
  text: "Книги",
  route: "/readers/books",
  img: "/icons/admin/books.png",
  icon: <Book className="h-5 w-5" />
}, {
  text: "Журналы",
  route: "/readers/journals",
  img: "/icons/admin/journals.png",
  icon: <BookOpen className="h-5 w-5" />
}, {
  text: "Избранное",
  route: "/readers/favorites",
  img: "/icons/admin/favorites.png",
  icon: <Heart className="h-5 w-5" />
}, {
  text: "История",
  route: "/readers/history",
  img: "/icons/admin/history.png",
  icon: <Clock className="h-5 w-5" />
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);

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
  }, []);

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

  // Загрузка пользователя из авторизации
  useEffect(() => {
    // Используем данные из контекста авторизации
    setUser(authUser);
  }, [authUser]);

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
  return <header ref={headerRef} className={cn("sticky top-0 z-50 w-full backdrop-blur-md transition-all duration-300", scrolled ? "bg-emerald-500/20 dark:bg-emerald-800/95 shadow-md backdrop-blur-xl" : "bg-emerald-500/30 dark:bg-emerald-800/90 backdrop-blur-xl")}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <motion.div variants={logoVariants} initial="initial" animate="animate" whileHover="hover" className="flex-shrink-0 cursor-pointer">
              <Link href="/">
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
              Библиотека
            </motion.h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {readerNavLinks.map((link, index) => {
            const isSelected = link.route !== "/readers" && pathname.includes(link.route) && link.route.length > 1 || pathname === link.route;
            return <motion.div key={link.route} custom={index} initial="hidden" animate="visible" whileHover="hover" variants={navItemVariants}>
                  <Link href={link.route}>
                    <div className={cn("relative px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 group", isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-black-700 dark:text-black-300 hover:text-emerald-600 dark:hover:text-emerald-400")}>
                      <div className="flex items-center gap-2">
                        {link.icon}
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
                </motion.div>;
          })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggler */}
            <motion.div whileTap={{
            scale: 0.9
          }}>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-black-500 dark:text-black-400 hover:text-black-700 dark:hover:text-black-300 relative overflow-hidden">
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
                      <Input ref={searchInputRef} placeholder="Поиск книг, журналов..." className="pr-8 h-9 focus:ring-1 focus:ring-emerald-500 text-sm border-emerald-200 dark:border-emerald-800" autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onClick={() => setIsSearchOpen(true)} onKeyDown={e => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      router.push(`/readers/search?q=${encodeURIComponent(searchQuery)}`);
                      setIsSearchOpen(false);
                    }
                  }} />
                    </motion.div>}
                </AnimatePresence>
                <motion.div whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }} className="flex-shrink-0">
                  <Button variant="ghost" size="icon" className={cn("relative h-9 w-9 text-black-500 dark:text-black-400 hover:text-emerald-600 dark:hover:text-emerald-400", isSearchOpen ? "bg-transparent" : "")} onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (!isSearchOpen) {
                    setTimeout(() => {
                      searchInputRef.current?.focus();
                    }, 100);
                  } else {
                    setSearchQuery("");
                  }
                }}>
                    <Search size={18} />
                  </Button>
                </motion.div>
              </motion.div>
            </div>

            {/* Login/Profile Button */}
            {user ? <DropdownMenu>
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.roles?.join(", ") || "Читатель"}
                        </p>
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
              </DropdownMenu> : <Link href="/auth/login">
                <motion.button whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                  <LogIn size={18} />
                  <span className="text-sm font-medium">Войти</span>
                </motion.button>
              </Link>}

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

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && <motion.div variants={mobileMenuVariants} initial="hidden" animate="visible" exit="exit" className="absolute top-16 left-0 right-0 md:hidden py-3 border-t dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl z-50">
                <nav className="flex flex-col gap-1.5 px-4">
                  {readerNavLinks.map((link, index) => {
                const isSelected = link.route !== "/readers" && pathname.includes(link.route) && link.route.length > 1 || pathname === link.route;
                return <motion.div key={link.route} variants={mobileMenuItemVariants} custom={index} whileHover={{
                  x: 5
                }}>
                        <Link href={link.route}>
                          <div className={cn("flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200", isSelected ? "bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30 text-black-700 dark:text-black-300")} onClick={() => setIsMobileMenuOpen(false)}>
                            {link.icon}
                            <span className="font-medium text-sm">{link.text}</span>
                          </div>
                        </Link>
                      </motion.div>;
              })}
                </nav>
              </motion.div>}
          </AnimatePresence>
        </div>
      </div>
    </header>;
};
export default ReaderNavigation;