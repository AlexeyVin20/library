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
  Github,
  Twitter,
  Linkedin,
  Send,
  Check,
} from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Интерфейс для элемента меню
interface MenuItem {
  label: string
  href?: string
  icon: React.ReactElement
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
  const [email, setEmail] = useState("")
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [subscribeMessage, setSubscribeMessage] = useState("")

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
    hidden: { opacity: 0, y: -10, scale: 0.95, transformOrigin: "top left" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transformOrigin: "top left",
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
      transformOrigin: "top left",
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  // Handle newsletter subscription
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      setSubscribeStatus("error")
      setSubscribeMessage("Пожалуйста, введите корректный email")
      return
    }

    setSubscribeStatus("loading")

    // Simulate API call
    setTimeout(() => {
      setSubscribeStatus("success")
      setSubscribeMessage("Вы успешно подписались на рассылку!")
      setEmail("")

      // Reset after 3 seconds
      setTimeout(() => {
        setSubscribeStatus("idle")
        setSubscribeMessage("")
      }, 3000)
    }, 1500)
  }

  return (
    <footer className="bg-green-500/20 dark:bg-gray-800/20 backdrop-blur-md border-t border-green-200/30 dark:border-gray-700/30">
      {/* Desktop version */}
      <div className="container mx-auto py-12 px-4 hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Menu sections */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {footerSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                variants={columnVariants}
                className="space-y-4"
                onMouseEnter={() => setActiveSection(section.title)}
                onMouseLeave={() => setActiveSection(null)}
              >
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  {section.title}
                </h3>
                <div className="flex flex-col space-y-2.5">
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
                          sideOffset={5}
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
          </motion.div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <GitBranch className="w-4 h-4 text-emerald-500" />
            <span>Версия 2.5.0</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              Стабильная
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href="/terms"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Условия использования
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Политика конфиденциальности
            </Link>
            <Link
              href="/cookies"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Cookies
            </Link>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">© 2025 LibraryAdmin. Все права защищены</p>
        </motion.div>
      </div>

      {/* Mobile version */}
      <div className="md:hidden">
        <div className="container mx-auto py-8 px-4">
          {/* Logo and about section */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Image src="/icons/admin/logo.png" alt="logo" height={36} width={36} className="object-contain" />
              </motion.div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent">
                Библиотека
              </h2>
            </div>
          </div>

          {/* Accordion for mobile */}
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

          {/* Bottom section */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
              <GitBranch className="w-4 h-4 text-emerald-500" />
              <span>Версия 2.5.0</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                Стабильная
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
              <Link
                href="/terms"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Условия использования
              </Link>
              <Link
                href="/privacy"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Политика конфиденциальности
              </Link>
              <Link
                href="/cookies"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
