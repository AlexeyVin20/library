"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { adminSideBarLinks } from "@/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import { Session } from "next-auth";
import { motion } from "framer-motion";
import { Bell, Search, Menu } from "lucide-react";
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

const TopNavigation = ({ session }: { session: Session }) => {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme toggle effect
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Animation variants for nav items
  const navItemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 1.0,
        ease: "easeOut"
      }
    })
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-800 shadow-md backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 1.5 }}
            >
              <Image src="/icons/admin/logo.png" alt="logo" height={48} width={48} className="object-contain" />
            </motion.div>
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl font-bold text-gray-800 dark:text-white"
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
                        "relative px-4 py-2 rounded-md text-2xl font-medium transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 group",
                        isSelected && "text-primary-600 dark:text-primary-400"
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
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <motion.div
                animate={{ width: isSearchOpen ? "200px" : "40px" }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                {isSearchOpen && (
                  <Input
                    placeholder="Поиск..."
                    className="pr-8 h-9 focus:ring-1 focus:ring-primary-500"
                    autoFocus
                    onBlur={() => setIsSearchOpen(false)}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-0 h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
                    isSearchOpen ? "bg-transparent" : ""
                  )}
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                >
                  <Search size={18} />
                </Button>
              </motion.div>
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell size={18} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Уведомления</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Новая книга добавлена</span>
                    <span className="text-xs text-gray-500">2 часа назад</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Обновление системы</span>
                    <span className="text-xs text-gray-500">Вчера</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 transition-transform hover:scale-105">
                    <AvatarFallback className="bg-amber-100 text-gray-800 text-sm">
                      {getInitials(session?.user?.name || "IN")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {session?.user?.name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Профиль</DropdownMenuItem>
                <DropdownMenuItem>Настройки</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">Выйти</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
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
            className="md:hidden py-4 border-t dark:border-gray-700"
          >
            <nav className="flex flex-col gap-2">
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
                        "flex items-center gap-3 p-3 rounded-md transition-colors",
                        isSelected
                          ? "bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
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
                      <span className="font-medium">{link.text}</span>
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