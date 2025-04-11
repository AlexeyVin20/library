"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Users,
  Calendar,
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
  GitBranch,
  ChevronRight,
  PlusCircle,
  ScrollText,
  BookText,
  LayoutGrid,
  BookMarked,
  Heart,
} from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Интерфейс для элемента меню
interface MenuItem {
  label: string
  href?: string
  icon: React.ReactNode
  subItems?: MenuItem[]
}

// Интерфейс для секции меню
interface MenuSection {
  title: string
  items: MenuItem[]
}

const Footer = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Определение меню для мобильной версии
  const mobileMenuSections: MenuSection[] = [
    {
      title: "Основное",
      items: [
        { label: "Главная", href: "/admin", icon: <Home className="w-5 h-5" /> },
        { label: "Книги", href: "/admin/books", icon: <BookOpen className="w-5 h-5" /> },
        { label: "Пользователи", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
        { label: "Резервации", href: "/admin/reservations", icon: <Calendar className="w-5 h-5" /> },
      ],
    },
    {
      title: "Действия",
      items: [
        { label: "Добавить книгу", href: "/admin/books/create", icon: <PlusCircle className="w-5 h-5" /> },
        { label: "Добавить пользователя", href: "/admin/users/create", icon: <PlusCircle className="w-5 h-5" /> },
        { label: "Создать резервацию", href: "/admin/reservations/create", icon: <PlusCircle className="w-5 h-5" /> },
      ],
    },
  ]

  // Определение данных для разделов футера
  const footerSections: MenuSection[] = [
    {
      title: "Быстрые действия",
      items: [
        {
          label: "Добавить",
          icon: <Plus className="w-5 h-5" />,
          subItems: [
            { label: "Добавить книгу", href: "/admin/books/create", icon: <BookOpen className="w-4 h-4" /> },
            { label: "Добавить пользователя", href: "/admin/users/create", icon: <User className="w-4 h-4" /> },
            { label: "Создать резервацию", href: "/admin/reservations/create", icon: <Calendar className="w-4 h-4" /> },
          ],
        },
        {
          label: "Основные страницы",
          icon: <LayoutGrid className="w-5 h-5" />,
          subItems: [
            { label: "Главная", href: "/admin", icon: <Home className="w-4 h-4" /> },
            { label: "Книги", href: "/admin/books", icon: <BookOpen className="w-4 h-4" /> },
            { label: "Пользователи", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
            { label: "Резервации", href: "/admin/reservations", icon: <Calendar className="w-4 h-4" /> },
          ],
        },
      ],
    },
    {
      title: "Ресурсы",
      items: [
        { label: "Книги", href: "/admin/books", icon: <BookOpen className="w-5 h-5" /> },
        { label: "Журналы", href: "/admin/journals", icon: <ScrollText className="w-5 h-5" /> },
        { label: "Научные материалы", href: "/admin/academic", icon: <Library className="w-5 h-5" /> },
        {
          label: "Категории",
          icon: <BookMarked className="w-5 h-5" />,
          subItems: [
            { label: "Художественная", href: "/admin/books/fiction", icon: <BookText className="w-4 h-4" /> },
            { label: "Научная", href: "/admin/books/science", icon: <BookText className="w-4 h-4" /> },
            { label: "Учебная", href: "/admin/books/education", icon: <BookText className="w-4 h-4" /> },
          ],
        },
      ],
    },
    {
      title: "Пользователи",
      items: [
        { label: "Все пользователи", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
        { label: "Активные пользователи", href: "/admin/users/active", icon: <User className="w-5 h-5" /> },
        { label: "Штрафы", href: "/admin/users/fines", icon: <FileText className="w-5 h-5" /> },
      ],
    },
    {
      title: "Поддержка",
      items: [
        { label: "Справка", href: "/admin/help", icon: <HelpCircle className="w-5 h-5" /> },
        { label: "FAQ", href: "/admin/faq", icon: <FileQuestion className="w-5 h-5" /> },
        { label: "Связаться с нами", href: "/admin/contact", icon: <Mail className="w-5 h-5" /> },
      ],
    },
  ]

  // Анимация для сетки и колонок
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  // Анимация для элементов меню
  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: custom * 0.05,
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
    hover: {
      x: 3,
      transition: {
        duration: 0.2,
      },
    },
  }

  // Анимация для выпадающего меню
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <footer className="bg-green/20 dark:bg-gray-800/20 backdrop-blur-md">
      {/* Десктопная версия футера */}
      <div className="container mx-auto py-10 px-4 hidden md:block">

        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {footerSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              variants={columnVariants}
              className="space-y-4"
              onMouseEnter={() => setActiveSection(section.title)}
              onMouseLeave={() => setActiveSection(null)}
            >
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">{section.title}</h3>
              <div className="flex flex-col space-y-3">
                {section.items.map((item, itemIndex) =>
                  item.subItems ? (
                    <DropdownMenu
                      key={`${section.title}-${item.label}`}
                      onOpenChange={(open) => {
                        if (open) setActiveDropdown(`${section.title}-${item.label}`)
                        else setActiveDropdown(null)
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <motion.button
                          custom={itemIndex}
                          variants={menuItemVariants}
                          whileHover="hover"
                          className={cn(
                            "flex items-center justify-between w-full text-left px-2 py-1.5 rounded-lg text-sm",
                            activeDropdown === `${section.title}-${item.label}`
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                              : "text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700/50",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{
                                rotate: activeDropdown === `${section.title}-${item.label}` ? 5 : 0,
                                scale: activeDropdown === `${section.title}-${item.label}` ? 1.1 : 1,
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 15 }}
                              className="text-emerald-500"
                            >
                              {item.icon}
                            </motion.div>
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                        </motion.button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-56 p-2 rounded-xl backdrop-blur-md bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 shadow-xl"
                      >
                        <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
                          {item.subItems.map((subItem, subIndex) => (
                            <motion.div
                              key={`${section.title}-${item.label}-${subItem.label}`}
                              custom={subIndex}
                              variants={menuItemVariants}
                              whileHover="hover"
                              whileTap={{ scale: 0.98 }}
                              className="overflow-hidden rounded-lg"
                            >
                              <DropdownMenuItem asChild>
                                <Link
                                  href={subItem.href || "#"}
                                  className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 transition-colors text-sm w-full"
                                >
                                  <span className="text-emerald-500">{subItem.icon}</span>
                                  <span>{subItem.label}</span>
                                </Link>
                              </DropdownMenuItem>
                            </motion.div>
                          ))}
                        </motion.div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <motion.div
                      key={`${section.title}-${item.label}`}
                      custom={itemIndex}
                      variants={menuItemVariants}
                      whileHover="hover"
                    >
                      <Link
                        href={item.href || "#"}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm",
                          activeSection === section.title
                            ? "text-emerald-600 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            : "text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700/50",
                        )}
                      >
                        <motion.div
                          whileHover={{ rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          className="text-emerald-500"
                        >
                          {item.icon}
                        </motion.div>
                        <span>{item.label}</span>
                      </Link>
                    </motion.div>
                  ),
                )}
              </div>
            </motion.div>
          ))}

          {/* О системе */}
          <motion.div variants={columnVariants} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">О системе</h3>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <GitBranch className="w-5 h-5 text-emerald-500" />
                <span>Версия 2.5.0</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  Стабильная
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">© 2025 LibraryAdmin. Все права защищены</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Мобильная версия футера */}
      <div className="md:hidden">
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center mb-6">

            <div className="flex items-center gap-3">
              <motion.a
                href="https://github.com/library-admin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-emerald-500 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </motion.a>
              <motion.a
                href="https://twitter.com/library-admin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-emerald-500 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </motion.a>
            </div>
          </div>

          {/* Аккордеон для мобильной версии */}
          <div className="space-y-3">
            {mobileMenuSections.map((section) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: activeSection === section.title ? "rgba(16, 185, 129, 0.1)" : "transparent",
                  }}
                  className="px-4 py-3 flex justify-between items-center cursor-pointer"
                  onClick={() => setActiveSection(activeSection === section.title ? null : section.title)}
                >
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">{section.title}</h3>
                  <motion.div
                    initial={false}
                    animate={{ rotate: activeSection === section.title ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </motion.div>
                </motion.div>

                <AnimatePresence>
                  {activeSection === section.title && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-2 space-y-2 border-t border-gray-200 dark:border-gray-700">
                        {section.items.map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                          >
                            <Link
                              href={item.href || "#"}
                              className="flex items-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                            >
                              <span className="text-emerald-500">{item.icon}</span>
                              <span>{item.label}</span>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <GitBranch className="w-3 h-3" />
              <span>Версия 2.5.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

