"use client";

import React from "react";
import Link from "next/link";
import { 
  Book, 
  Users, 
  Calendar, 
  Settings, 
  ChevronDown,
  FileText,
  BookOpen,
  Library,
  Plus,
  Home,
  User,
  Mail,
  HelpCircle,
  FileQuestion,
  GitBranch
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Варианты анимации для сетки и колонок
const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // Постепенное появление колонок
    }
  }
};

const columnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5 // Длительность анимации для каждой колонки
    }
  }
};

const Footer = () => {
  return (
    <footer className="dark:bg-gray-900/80 backdrop-blur-sm shadow-md">
      <div className="container mx-auto py-6 px-4">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-5 gap-6"
          initial="hidden"
          animate="visible"
          variants={gridVariants}
        >
          {/* Быстрые действия */}
          <motion.div variants={columnVariants} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Быстрые действия</h3>
            <div className="flex flex-col space-y-2">
              <Link 
                href="/admin/books/create" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
                <span>Добавить книгу</span>
              </Link>
              <Link 
                href="/admin/users/create" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
                <span>Добавить пользователя</span>
              </Link>
              <Link 
                href="/admin/reservations/create" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
                <span>Создать резервацию</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 font-normal text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <Book size={16} />
                    <span>Основные страницы</span>
                    <ChevronDown size={14} className="ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Link href="/admin" className="flex items-center gap-2 w-full">
                        <Home size={16} />
                        <span>Главная</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/admin/books" className="flex items-center gap-2 w-full">
                        <BookOpen size={16} />
                        <span>Книги</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/admin/users" className="flex items-center gap-2 w-full">
                        <Users size={16} />
                        <span>Пользователи</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/admin/reservations" className="flex items-center gap-2 w-full">
                        <Calendar size={16} />
                        <span>Резервации</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>

          {/* Ресурсы */}
          <motion.div variants={columnVariants} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ресурсы</h3>
            <div className="flex flex-col space-y-2">
              <Link 
                href="/admin/books" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <BookOpen size={16} />
                <span>Книги</span>
              </Link>
              <Link 
                href="/admin/journals" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText size={16} />
                <span>Журналы</span>
              </Link>
              <Link 
                href="/admin/academic" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Library size={16} />
                <span>Научные материалы</span>
              </Link>
            </div>
          </motion.div>

          {/* Пользователи */}
          <motion.div variants={columnVariants} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Пользователи</h3>
            <div className="flex flex-col space-y-2">
              <Link 
                href="/admin/users" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Users size={16} />
                <span>Все пользователи</span>
              </Link>
              <Link 
                href="/admin/users/active" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <User size={16} />
                <span>Активные пользователи</span>
              </Link>
              <Link 
                href="/admin/users/fines" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText size={16} />
                <span>Штрафы</span>
              </Link>
            </div>
          </motion.div>

          {/* Поддержка */}
          <motion.div variants={columnVariants} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Поддержка</h3>
            <div className="flex flex-col space-y-2">
              <Link 
                href="/admin/help" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <HelpCircle size={16} />
                <span>Справка</span>
              </Link>
              <Link 
                href="/admin/faq" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileQuestion size={16} />
                <span>FAQ</span>
              </Link>
              <Link 
                href="/admin/contact" 
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Mail size={16} />
                <span>Связаться с нами</span>
              </Link>
            </div>
          </motion.div>

          {/* О системе */}
          <motion.div variants={columnVariants} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">О системе</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <GitBranch size={16} />
                <span>Версия 2.5.0</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600/10 dark:bg-primary-400/20 text-primary-600 dark:text-primary-400">
                  Стабильная
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © 2025 LibraryAdmin
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Все права защищены
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;