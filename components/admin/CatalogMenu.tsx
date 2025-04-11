"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Book, BookOpen, ChevronDown, Library, Bookmark, PlusCircle, ScrollText, BookText, LayoutGrid, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

// Интерфейс для API-книги
interface ApiBook {
  id: number;
  title: string;
  authors: string[];
  publisher: string;
  publicationYear: number;
}

// Интерфейс для API-журнала
interface ApiJournal {
  id: number;
  title: string;
  issn?: string;
  publisher?: string;
  startYear?: number;
  category?: string;
}

// Типизация для категорий журналов
type JournalCategory = "Scientific" | "Popular" | "Entertainment" | "Professional" | "Educational" | "Literary" | "News" | "Другое";

// Интерфейсы для локальных данных компонента
interface BookType {
  id: number;
  title: string;
  authors: string[];
}

interface JournalType {
  id: number;
  title: string;
  category: JournalCategory;
}

// Интерфейс для иконок категорий
interface CategoryIcons {
  [key: string]: React.ReactNode;
}

export default function CatalogMenu() {
  const pathname = usePathname();
  const [books, setBooks] = useState<BookType[]>([]);
  const [journals, setJournals] = useState<JournalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Загрузка данных о книгах и журналах
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        
        // Параллельная загрузка книг и журналов через fetch
        const [booksResponse, journalsResponse] = await Promise.all([
          fetch(`${baseUrl}/api/books`),
          fetch(`${baseUrl}/api/journals`)
        ]);
        
        if (!booksResponse.ok || !journalsResponse.ok) {
          throw new Error('Ошибка при загрузке данных');
        }
        
        const booksData = await booksResponse.json();
        const journalsData = await journalsResponse.json();
        
        // Преобразование данных из API в нужный формат
        const formattedBooks: BookType[] = booksData.map((book: ApiBook) => ({
          id: book.id,
          title: book.title,
          authors: Array.isArray(book.authors) ? book.authors : [book.authors].filter(Boolean)
        }));
        
        // Преобразуем данные о журналах с учетом возможного отсутствия категории в API
        const formattedJournals: JournalType[] = journalsData.map((journal: ApiJournal) => {
          const category = (journal as any).category as JournalCategory || 'Другое';
          return {
            id: journal.id,
            title: journal.title,
            category
          };
        });
        
        setBooks(formattedBooks);
        setJournals(formattedJournals);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Группировка журналов по категориям для улучшенной навигации
  const categorizedJournals = journals.reduce((acc, journal) => {
    const category = journal.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(journal);
    return acc;
  }, {} as Record<string, JournalType[]>);

  // Иконки категорий с явной типизацией
  const categoryIcons: CategoryIcons = {
    "Scientific": <ScrollText className="h-4 w-4 mr-2" />,
    "Popular": <BookText className="h-4 w-4 mr-2" />,
    "Entertainment": <BookOpen className="h-4 w-4 mr-2" />,
    "Professional": <BookMarked className="h-4 w-4 mr-2" />,
    "Educational": <Library className="h-4 w-4 mr-2" />,
    "Literary": <Book className="h-4 w-4 mr-2" />,
    "News": <ScrollText className="h-4 w-4 mr-2" />,
    "Другое": <BookOpen className="h-4 w-4 mr-2" />
  };

  // Animation variants
  const menuItemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1]
      }
    }),
    hover: {
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      x: 3,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.98,
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      transition: {
        duration: 0.1
      }
    }
  };

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
        delayChildren: 0.05
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { 
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const iconVariants = {
    hidden: { rotate: 0 },
    visible: { rotate: 180, transition: { duration: 0.3 } }
  };

  const loadingVariants = {
    animate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear"
      }
    }
  };

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ 
            backgroundColor: "rgba(16, 185, 129, 0.05)",
            y: -2,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 group cursor-pointer",
            pathname.includes("/admin/books") 
              ? "text-emerald-600 dark:text-emerald-400" 
              : "text-black-700 dark:text-black-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
        >
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5" /> 
            <span>Каталог</span>
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate={isOpen ? "visible" : "hidden"}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
          
          {/* Background hover effect */}
          <motion.div 
            className="absolute inset-0 -z-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            layoutId={`navBg-/admin/books`}
            initial={{ opacity: 0 }}
            animate={{ opacity: pathname.includes("/admin/books") ? 1 : 0 }}
          />
          
          {/* Animated underline effect */}
          {pathname.includes("/admin/books") && (
            <motion.div
              layoutId="navIndicator"
              className="absolute bottom-0 left-0 h-0.5 w-full bg-emerald-600 dark:bg-emerald-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
      </DropdownMenuTrigger>
      
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent 
            asChild
            forceMount
            className="w-96 max-h-[80vh] overflow-auto p-4 rounded-xl backdrop-blur-xl bg-green-900/30 dark:bg-emerald-900/70 border border-emerald-200/50 dark:border-emerald-700/50 shadow-xl"
            align="center"
            sideOffset={12}
          >
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {loading ? (
                <div className="p-6 text-center">
                  <motion.div
                    variants={loadingVariants}
                    animate="animate"
                    className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"
                  ></motion.div>
                  <p className="text-base text-black-500 dark:text-black-400">Загрузка данных...</p>
                </div>
              ) : (
                <>
                  {/* Секция книг */}
                  <DropdownMenuGroup>
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <DropdownMenuLabel className="flex items-center font-bold text-emerald-600 dark:text-emerald-400 text-lg pb-2">
                        <Book className="mr-3 h-5 w-5" />
                        <span>Книги</span>
                      </DropdownMenuLabel>
                      
                      <DropdownMenuSeparator className="bg-emerald-200 dark:bg-emerald-800/50 h-[2px] my-2" />
                    </motion.div>
                    
                    <div className="grid grid-cols-1 gap-2 my-2">
                      <motion.div
                        custom={0}
                        variants={menuItemVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <DropdownMenuItem asChild>
                          <Link href="/admin/books" className="flex items-center cursor-pointer rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                            <LayoutGrid className="mr-3 h-5 w-5 text-emerald-500" />
                            <span>Все книги</span>
                          </Link>
                        </DropdownMenuItem>
                      </motion.div>
                      
                      <motion.div
                        custom={1}
                        variants={menuItemVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <DropdownMenuItem asChild>
                          <Link href="/admin/books/create" className="flex items-center cursor-pointer rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                            <PlusCircle className="mr-3 h-5 w-5 text-emerald-500" />
                            <span>Добавить книгу</span>
                          </Link>
                        </DropdownMenuItem>
                      </motion.div>
                    </div>
                    
                    <DropdownMenuSub>
                      <motion.div
                        custom={2}
                        variants={menuItemVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <DropdownMenuSubTrigger className="flex items-center rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                          <Bookmark className="mr-3 h-5 w-5 text-emerald-500" />
                          <span>Популярные книги</span>
                        </DropdownMenuSubTrigger>
                      </motion.div>
                      
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent 
                          className="max-h-[60vh] overflow-auto w-72 p-3 rounded-xl backdrop-blur-md bg-green-900/30 dark:bg-emerald-900/70 border border-emerald-200/50 dark:border-emerald-700/50 shadow-xl"
                        >
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            {books.slice(0, 8).map((book, index) => (
                              <motion.div
                                key={book.id}
                                custom={index}
                                variants={menuItemVariants}
                                whileHover="hover"
                                whileTap="tap"
                              >
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/books/${book.id}`} className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-colors">
                                    <Book className="flex-shrink-0 h-5 w-5 text-emerald-500" />
                                    <div className="overflow-hidden">
                                      <p className="truncate font-medium text-base">{book.title}</p>
                                      <p className="text-sm text-black-500 dark:text-black-400 truncate">{book.authors.join(', ')}</p>
                                    </div>
                                  </Link>
                                </DropdownMenuItem>
                              </motion.div>
                            ))}
                            
                            {books.length > 8 && (
                              <motion.div
                                custom={8}
                                variants={menuItemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <DropdownMenuItem asChild>
                                  <Link href="/admin/books" className="flex items-center justify-center text-white dark:text-emerald-400 mt-2 text-base font-medium">
                                    Показать все ({books.length})
                                  </Link>
                                </DropdownMenuItem>
                              </motion.div>
                            )}
                          </motion.div>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator className="my-3 bg-gray-200 dark:bg-gray-700 h-[2px]" />
                  
                  {/* Секция журналов */}
                  <DropdownMenuGroup>
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <DropdownMenuLabel className="flex items-center font-bold text-emerald-600 dark:text-emerald-400 text-lg pb-2">
                        <BookOpen className="mr-3 h-5 w-5" />
                        <span>Журналы</span>
                      </DropdownMenuLabel>
                      
                      <DropdownMenuSeparator className="bg-emerald-200 dark:bg-emerald-800/50 h-[2px] my-2" />
                    </motion.div>
                    
                    <div className="grid grid-cols-1 gap-2 my-2">
                      <motion.div
                        custom={3}
                        variants={menuItemVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <DropdownMenuItem asChild>
                          <Link href="/admin/journals" className="flex items-center cursor-pointer rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                            <LayoutGrid className="mr-3 h-5 w-5 text-emerald-500" />
                            <span>Все журналы</span>
                          </Link>
                        </DropdownMenuItem>
                      </motion.div>
                      
                      <motion.div
                        custom={4}
                        variants={menuItemVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <DropdownMenuItem asChild>
                          <Link href="/admin/journals/create" className="flex items-center cursor-pointer rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                            <PlusCircle className="mr-3 h-5 w-5 text-emerald-500" />
                            <span>Добавить журнал</span>
                          </Link>
                        </DropdownMenuItem>
                      </motion.div>
                    </div>
                    
                    {/* Группировка журналов по категориям */}
                    {Object.entries(categorizedJournals).map(([category, journals], catIndex) => (
                      <DropdownMenuSub key={category}>
                        <motion.div
                          custom={5 + catIndex}
                          variants={menuItemVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <DropdownMenuSubTrigger className="flex items-center rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                            {categoryIcons[category] || <BookOpen className="mr-3 h-5 w-5 text-emerald-500" />}
                            <span>{category} ({journals.length})</span>
                          </DropdownMenuSubTrigger>
                        </motion.div>
                        
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent
                            className="max-h-[60vh] overflow-auto w-72 p-3 rounded-xl backdrop-blur-md bg-green-900/30 dark:bg-emerald-900/70 border border-emerald-200/50 dark:border-emerald-700/50 shadow-xl"
                          >
                            <motion.div
                              variants={dropdownVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {journals.slice(0, 8).map((journal, index) => (
                                <motion.div
                                  key={journal.id}
                                  custom={index}
                                  variants={menuItemVariants}
                                  whileHover="hover"
                                  whileTap="tap"
                                >
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/journals/${journal.id}`} className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-colors">
                                      <BookOpen className="flex-shrink-0 h-5 w-5 text-emerald-500" />
                                      <p className="truncate font-medium text-base">{journal.title}</p>
                                    </Link>
                                  </DropdownMenuItem>
                                </motion.div>
                              ))}
                              
                              {journals.length > 8 && (
                                <motion.div
                                  custom={8}
                                  variants={menuItemVariants}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <DropdownMenuItem asChild>
                                    <Link 
                                      href={`/admin/journals?category=${encodeURIComponent(category)}`} 
                                      className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 mt-2 text-base font-medium"
                                    >
                                      Показать все ({journals.length})
                                    </Link>
                                  </DropdownMenuItem>
                                </motion.div>
                              )}
                            </motion.div>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}
