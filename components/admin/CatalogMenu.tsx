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
import {
  Book,
  BookOpen,
  ChevronDown,
  Library,
  Bookmark,
  PlusCircle,
  ScrollText,
  BookText,
  LayoutGrid,
  BookMarked
} from "lucide-react";
import { motion } from "framer-motion";

// Интерфейсы для данных
interface Book {
  id: string;
  title: string;
  authors: string;
}

interface Journal {
  id: number;
  title: string;
  category: string;
}

// Типизация для категорий журналов
type JournalCategory = "Scientific" | "Popular" | "Entertainment" | "Professional" | "Educational" | "Literary" | "News" | "Другое";

// Интерфейс для иконок категорий
interface CategoryIcons {
  [key: string]: JSX.Element;
}

export default function CatalogMenu() {
  const pathname = usePathname();
  const [books, setBooks] = useState<Book[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных о книгах и журналах
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) return;
        
        // Параллельная загрузка книг и журналов
        const [booksRes, journalsRes] = await Promise.all([
          fetch(`${baseUrl}/api/books`),
          fetch(`${baseUrl}/api/journals`)
        ]);
        
        if (booksRes.ok && journalsRes.ok) {
          const booksData = await booksRes.json();
          const journalsData = await journalsRes.json();
          
          setBooks(booksData);
          setJournals(journalsData);
        }
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
    const category = journal.category || 'Другое';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(journal);
    return acc;
  }, {} as Record<string, Journal[]>);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "relative px-8 py-3 rounded-lg text-xl font-medium transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 group min-w-[200px] text-center flex items-center justify-center gap-3 cursor-pointer",
            pathname.includes("/admin/books") && "text-primary-600 dark:text-primary-400"
          )}
        >
          <div className="relative w-6 h-6">
            <Library className="w-6 h-6" /> 
          </div>
          <span className="font-semibold">Каталог</span>
          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          
          {/* Animated underline effect */}
          {pathname.includes("/admin/books") && (
            <motion.div
              layoutId="navIndicator"
              className="absolute bottom-0 left-0 h-0.5 w-full bg-primary-600 dark:bg-primary-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-96 max-h-[80vh] overflow-auto p-4 rounded-xl backdrop-blur-md bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 shadow-xl"
        align="center"
        sideOffset={12}
      >
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-base text-gray-500 dark:text-gray-400">Загрузка данных...</p>
          </div>
        ) : (
          <>
            {/* Секция книг */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center font-bold text-primary text-lg pb-2">
                <Book className="mr-3 h-5 w-5" />
                <span>Книги</span>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className="bg-primary/20 h-[2px] my-2" />
              
              <div className="grid grid-cols-1 gap-2 my-2">
                <DropdownMenuItem asChild>
                  <Link href="/admin/books" className="flex items-center cursor-pointer hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                    <LayoutGrid className="mr-3 h-5 w-5 text-primary/80" />
                    <span>Все книги</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/admin/books/create" className="flex items-center cursor-pointer hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                    <PlusCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Добавить книгу</span>
                  </Link>
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                  <Bookmark className="mr-3 h-5 w-5 text-primary/80" />
                  <span>Популярные книги</span>
                </DropdownMenuSubTrigger>
                
                <DropdownMenuPortal>
                  <DropdownMenuSubContent 
                    className="max-h-[60vh] overflow-auto w-72 p-3 rounded-xl backdrop-blur-md bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 shadow-xl"
                  >
                    {books.slice(0, 8).map((book) => (
                      <DropdownMenuItem key={book.id} asChild>
                        <Link href={`/admin/books/${book.id}`} className="flex items-center gap-3 cursor-pointer hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-colors">
                          <Book className="flex-shrink-0 h-5 w-5 text-primary/80" />
                          <div className="overflow-hidden">
                            <p className="truncate font-medium text-base">{book.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{book.authors}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    
                    {books.length > 8 && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/books" className="flex items-center justify-center text-primary mt-2 text-base font-medium">
                          Показать все ({books.length})
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="my-3 bg-gray-200 dark:bg-gray-700 h-[2px]" />
            
            {/* Секция журналов */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center font-bold text-primary text-lg pb-2">
                <BookOpen className="mr-3 h-5 w-5" />
                <span>Журналы</span>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className="bg-primary/20 h-[2px] my-2" />
              
              <div className="grid grid-cols-1 gap-2 my-2">
                <DropdownMenuItem asChild>
                  <Link href="/admin/journals" className="flex items-center cursor-pointer hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                    <LayoutGrid className="mr-3 h-5 w-5 text-primary/80" />
                    <span>Все журналы</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/admin/journals/create" className="flex items-center cursor-pointer hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                    <PlusCircle className="mr-3 h-5 w-5 text-green-500" />
                    <span>Добавить журнал</span>
                  </Link>
                </DropdownMenuItem>
              </div>
              
              {/* Группировка журналов по категориям */}
              {Object.entries(categorizedJournals).map(([category, journals]) => (
                <DropdownMenuSub key={category}>
                  <DropdownMenuSubTrigger className="flex items-center hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-colors text-base font-medium">
                    {categoryIcons[category] || <BookOpen className="mr-3 h-5 w-5 text-primary/80" />}
                    <span>{category} ({journals.length})</span>
                  </DropdownMenuSubTrigger>
                  
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      className="max-h-[60vh] overflow-auto w-72 p-3 rounded-xl backdrop-blur-md bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 shadow-xl"
                    >
                      {journals.slice(0, 8).map((journal) => (
                        <DropdownMenuItem key={journal.id} asChild>
                          <Link href={`/admin/journals/${journal.id}`} className="flex items-center gap-3 cursor-pointer hover:bg-primary/10 rounded-lg px-3 py-2.5 transition-colors">
                            <BookOpen className="flex-shrink-0 h-5 w-5 text-primary/80" />
                            <p className="truncate font-medium text-base">{journal.title}</p>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      
                      {journals.length > 8 && (
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/admin/journals?category=${encodeURIComponent(category)}`} 
                            className="flex items-center justify-center text-primary mt-2 text-base font-medium"
                          >
                            Показать все ({journals.length})
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
