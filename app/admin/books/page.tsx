'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { CreditCard, Box, BookOpen, List, Plus, Search, ArrowUpDown, Edit, Trash2, BookMarked, CheckSquare, Square, Printer, Brain } from 'lucide-react';
import BookCover from "@/components/BookCover";
import { Book } from "@/components/ui/book";
import { ButtonHoldAndRelease } from "@/components/ui/hold-and-release-button";
import AutoAssignGenres from "@/components/admin/AutoAssignGenres";
import IframePagePreviewCentered from "@/components/ui/iframe-page-preview-centered";
import { useSettings } from '@/hooks/use-settings'

/**
 * Interface for book item
 */
interface Book {
  id: string;
  title: string;
  authors?: string;
  genre?: string;
  cover?: string;
  availableCopies?: number;
  categorization?: string;
}

/**
 * Props interfaces for components
 */
interface BookImageProps {
  src?: string;
  alt: string;
  bookId?: string;
}
interface ViewProps {
  books: Book[];
  onDelete: (id: string) => void;
  selectedBooks?: string[];
  onSelectBook?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onPrintFormulars?: (selectedBookIds: string[], allBooks: Book[]) => void;
}
interface ViewModeMenuProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
}

// Компонент для анимированного появления
const FadeInView = ({
  children,
  delay = 0,
  duration = 0.5
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) => {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration,
    delay,
    ease: [0.22, 1, 0.36, 1]
  }}>
      {children}
    </motion.div>;
};

/**
 * BookImage component with DashboardPage-style hover effects
 */
const BookImage = ({
  src,
  alt,
  bookId
}: BookImageProps) => {
  const [error, setError] = useState(false);
  if (error || !src) {
    return <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-100">
        <BookOpen className="text-blue-500 w-12 h-12" />
      </div>;
  }
  const imageElement = <motion.div whileHover={{
    scale: 1.05
  }} transition={{
    type: "spring",
    stiffness: 300,
    damping: 15
  }} className="overflow-hidden rounded-xl shadow-md">
      <Image src={src || "/placeholder.svg"} alt={alt} width={192} height={192} className="w-full h-48 object-cover" onError={e => {
      console.error(`Ошибка загрузки изображения:`, src);
      setError(true);
    }} unoptimized />
    </motion.div>;
  return bookId ? <Link href={`/admin/books/${bookId}`}>{imageElement}</Link> : imageElement;
};

/**
 * CardsView with DashboardPage-style cards
 */
const CardsView = ({
  books,
  onDelete,
  selectedBooks = [],
  onSelectBook,
  onSelectAll,
  onClearSelection,
  onPrintFormulars
}: ViewProps) => {
  const allSelected = books.length > 0 && selectedBooks.length === books.length;
  const someSelected = selectedBooks.length > 0 && selectedBooks.length < books.length;
  return <div className="relative">
    {/* Панель действий при выборе */}
    {books.length > 0 && (
      <div className="mb-4 flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <button
          onClick={allSelected ? onClearSelection : onSelectAll}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-500 transition-colors"
        >
          {allSelected ? (
            <CheckSquare className="w-4 h-4" />
          ) : someSelected ? (
            <div className="w-4 h-4 border-2 border-blue-500 rounded bg-blue-100 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded"></div>
            </div>
          ) : (
            <Square className="w-4 h-4" />
          )}
          {allSelected ? "Снять выделение" : "Выделить все"}
        </button>
        {selectedBooks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Выбрано: {selectedBooks.length} из {books.length}
            </span>
            <motion.button
              onClick={() => onPrintFormulars?.(selectedBooks, books)}
              className="px-3 py-1.5 shadow-md bg-green-500 hover:bg-green-700 text-white rounded-lg flex items-center gap-1"
              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
              whileTap={{ scale: 0.98 }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-sm ml-1">Печать формуляров</span>
            </motion.button>
            <ButtonHoldAndRelease
              onAction={async () => {
                for (const bookId of selectedBooks) {
                  await onDelete(bookId);
                }
                onClearSelection?.();
              }}
              className="px-3 py-1.5 shadow-md bg-red-500 hover:bg-red-700 text-white"
              holdDuration={3000}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-sm ml-1">Удалить выбранные</span>
            </ButtonHoldAndRelease>
          </div>
        )}
      </div>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {books.map((book, index) => {
        const isSelected = selectedBooks.includes(book.id);
        return <FadeInView key={book.id} delay={0.05 * index}>
          <motion.div
            className={`bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border flex overflow-hidden relative cursor-pointer ${isSelected ? 'border-4 border-blue-500 ring-2 ring-blue-300' : 'border-gray-100'}`}
            whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)" }}
            onClick={e => {
              if (onSelectBook) {
                e.stopPropagation();
                onSelectBook(book.id);
              }
            }}
          >
            {/* Чекбокс выбора */}
            <button
              onClick={e => { e.stopPropagation(); onSelectBook && onSelectBook(book.id); }}
              className="absolute top-2 left-2 z-10 bg-white rounded-full shadow p-1 border border-gray-200 hover:border-blue-500"
              title="Выбрать книгу"
            >
              {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 text-gray-400" />}
            </button>
            <div className="w-1/3">
              <BookImage src={book.cover} alt={book.title} bookId={book.id} />
            </div>
            <div className="flex-1 pl-4 flex flex-col justify-between">
              <div>
                <Link href={`/admin/books/${book.id}`}>
                  <h3 className="text-lg font-bold text-gray-800 hover:text-blue-500 transition-colors">{book.title}</h3>
                </Link>
                <p className="text-sm text-gray-500">{book.authors}</p>
                <p className="text-xs text-gray-500">{book.genre || ""}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs font-medium text-white bg-blue-500 px-2 py-1 rounded-full">
                    Доступно: {book.availableCopies || 0} шт.
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Link href={`/admin/books/${book.id}/update`}>
                  <motion.button className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md" whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }} whileTap={{ scale: 0.98 }}>
                    <Edit className="w-3.5 h-3.5" />
                    <span className="text-sm">Редактировать</span>
                  </motion.button>
                </Link>
                <ButtonHoldAndRelease
                  onAction={() => onDelete(book.id)}
                  className="px-3 py-1.5 shadow-md"
                  holdDuration={2000}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-sm ml-1">Удалить</span>
                </ButtonHoldAndRelease>
              </div>
            </div>
          </motion.div>
        </FadeInView>;
      })}
    </div>
  </div>;
};

/**
 * ThreeDBookView with DashboardPage-style 3D effects
 */
const ThreeDBookView = ({
  books,
  onDelete,
  selectedBooks = [],
  onSelectBook,
  onSelectAll,
  onClearSelection,
  onPrintFormulars
}: ViewProps) => {
  const [spineColors, setSpineColors] = useState<{ [id: string]: string }>({});
  const [hoverState, setHoverState] = useState<{ id: string | null; position: "left" | "right" | "top" | "bottom"; coords: { top: number; left: number } }>({ id: null, position: "right", coords: { top: 0, left: 0 } });
  const [previewState, setPreviewState] = useState<{ id: string | null; position: "left" | "right" | "top" | "bottom"; coords: { top: number; left: number } }>({ id: null, position: "right", coords: { top: 0, left: 0 } });
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const imgRefs = useRef<{ [id: string]: HTMLImageElement | null }>({});
  useEffect(() => {
    books.forEach(book => {
      if (book.cover && !spineColors[book.id]) {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = book.cover;
        img.onload = () => {
          setSpineColors(prev => ({ ...prev, [book.id]: "#3B82F6" }));
        };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books]);
  const allSelected = books.length > 0 && selectedBooks.length === books.length;
  const someSelected = selectedBooks.length > 0 && selectedBooks.length < books.length;

  // --- Новая логика ---
  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>, bookId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const previewWidth = 500; // Ширина превью
    const previewHeight = 900; // Высота превью
    const previewMargin = 16; // Отступ

    const hasSpaceOnRight = rect.right + previewMargin + previewWidth <= window.innerWidth;
    const hasSpaceOnLeft = rect.left - previewMargin - previewWidth >= 0;
    const hasSpaceOnBottom = rect.bottom + previewMargin + previewHeight <= window.innerHeight;
    const hasSpaceOnTop = rect.top - previewMargin - previewHeight >= 0;

    // Определяем наилучшую позицию и координаты
    let position: "left" | "right" | "top" | "bottom" = "right";
    let top = rect.top;
    let left = rect.right + previewMargin;

    if (hasSpaceOnRight) {
      position = "right";
      left = rect.right + previewMargin;
      top = Math.max(previewMargin, Math.min(rect.top, window.innerHeight - previewHeight - previewMargin));
    } else if (hasSpaceOnLeft) {
      position = "left";
      left = rect.left - previewWidth - previewMargin;
      top = Math.max(previewMargin, Math.min(rect.top, window.innerHeight - previewHeight - previewMargin));
    } else if (hasSpaceOnBottom) {
      position = "bottom";
      top = rect.bottom + previewMargin;
      left = Math.max(previewMargin, Math.min(rect.left, window.innerWidth - previewWidth - previewMargin));
    } else if (hasSpaceOnTop) {
      position = "top";
      top = rect.top - previewHeight - previewMargin;
      left = Math.max(previewMargin, Math.min(rect.left, window.innerWidth - previewWidth - previewMargin));
    } else {
      // Если нигде не помещается полностью, показываем справа с корректировкой по краям
      position = "right";
      left = Math.min(rect.right + previewMargin, window.innerWidth - previewWidth - previewMargin);
      top = Math.max(previewMargin, Math.min(rect.top, window.innerHeight - previewHeight - previewMargin));
    }

    setHoverState({ id: bookId, position, coords: { top, left } });
  };

  const handleMouseLeave = () => {
    // Задержка скрытия, чтобы дать время мыши перейти на превью
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => {
      if (!isPreviewHovered) {
        setPreviewState({ id: null, position: "right", coords: { top: 0, left: 0 } });
      }
    }, 200);
  };

  // --- Новый useEffect для hoverState ---
  useEffect(() => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    if (hoverState.id) {
      hoverTimeout.current = setTimeout(() => {
        setPreviewState(hoverState);
      }, 700);
    }
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, [hoverState]);

  // --- Новый useEffect для ухода мыши с превью ---
  useEffect(() => {
    if (!isPreviewHovered && previewState.id === null) {
      setHoverState({ id: null, position: "right", coords: { top: 0, left: 0 } });
    }
  }, [isPreviewHovered, previewState.id]);

  return <div className="relative">
    {/* Панель действий при выборе */}
    {books.length > 0 && (
      <div className="mb-4 flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <button
          onClick={allSelected ? onClearSelection : onSelectAll}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-500 transition-colors"
        >
          {allSelected ? (
            <CheckSquare className="w-4 h-4" />
          ) : someSelected ? (
            <div className="w-4 h-4 border-2 border-blue-500 rounded bg-blue-100 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded"></div>
            </div>
          ) : (
            <Square className="w-4 h-4" />
          )}
          {allSelected ? "Снять выделение" : "Выделить все"}
        </button>
        {selectedBooks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Выбрано: {selectedBooks.length} из {books.length}
            </span>
            <motion.button
              onClick={() => onPrintFormulars?.(selectedBooks, books)}
              className="px-3 py-1.5 shadow-md bg-green-500 hover:bg-green-700 text-white rounded-lg flex items-center gap-1"
              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
              whileTap={{ scale: 0.98 }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-sm ml-1">Печать формуляров</span>
            </motion.button>
            <ButtonHoldAndRelease
              onAction={async () => {
                for (const bookId of selectedBooks) {
                  await onDelete(bookId);
                }
                onClearSelection?.();
              }}
              className="px-3 py-1.5 shadow-md bg-red-500 hover:bg-red-700 text-white"
              holdDuration={3000}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-sm ml-1">Удалить выбранные</span>
            </ButtonHoldAndRelease>
          </div>
        )}
      </div>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6 p-6">
      {books.map((book, index) => {
        const isSelected = selectedBooks.includes(book.id);
        return <FadeInView key={book.id} delay={0.05 * index}>
          <div
            className={`group text-gray-800 relative cursor-pointer ${isSelected ? 'ring-4 ring-blue-400 border-blue-500 border-2 bg-blue-50' : ''}`}
            onClick={e => {
              if (onSelectBook) {
                e.stopPropagation();
                onSelectBook(book.id);
              }
            }}
          >
            {/* Чекбокс выбора */}
            <button
              onClick={e => { e.stopPropagation(); onSelectBook && onSelectBook(book.id); }}
              className="absolute top-2 left-2 z-10 bg-white rounded-full shadow p-1 border border-gray-200 hover:border-blue-500"
              title="Выбрать книгу"
            >
              {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 text-gray-400" />}
            </button>
            <div className="relative w-full overflow-visible flex items-center justify-center" style={{ height: "240px" }}>
              <motion.div className="transform-gpu transition-all duration-500" initial={{ rotateY: 0 }} whileHover={{ scale: 1.05 }}>
                <Link href={`/admin/books/${book.id}`}>
                  <Book
                    color={book.cover ? "#3B82F6" : "#6B7280"}
                    width={180}
                    depth={3}
                    variant="default"
                    illustration={book.cover ? <Image src={book.cover} alt={book.title} width={180} height={210} className="object-cover rounded" unoptimized /> : undefined}
                  >
                    <div></div>
                  </Book>
                </Link>
              </motion.div>
              {/* Превью страницы книги */}
              <IframePagePreviewCentered 
                route={`/admin/books/${book.id}`}
                isVisible={previewState.id === book.id}
                delay={1000}
                displayMode="api"
                coords={previewState.coords || { top: 0, left: 0 }}
                onMouseEnter={() => setIsPreviewHovered(true)}
                onMouseLeave={() => {
                  setIsPreviewHovered(false);
                  setPreviewState({ id: null, position: "right", coords: { top: 0, left: 0 } });
                }}
              />
            </div>
            <motion.div 
              className="mt-2 bg-white rounded-lg p-3 shadow-md border border-gray-100 text-center" 
              whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
              onMouseEnter={(e) => handleMouseEnter(e, book.id)}
              onMouseLeave={handleMouseLeave}
            >
              <Link href={`/admin/books/${book.id}`}>
                <p className="font-semibold line-clamp-1 hover:text-blue-500 transition-colors">{book.title}</p>
              </Link>
              <p className="text-sm text-gray-500 line-clamp-1">{book.authors}</p>
              {book.genre && <p className="text-xs text-gray-500">{book.genre}</p>}
              <div className="mt-1">
                <span className="text-xs font-medium text-white bg-blue-500 px-2 py-1 rounded-full">
                  Доступно: {book.availableCopies || 0} шт.
                </span>
              </div>
            </motion.div>
            <div className="mt-2 flex justify-center gap-2">
              <Link href={`/admin/books/${book.id}/update`}>
                <motion.button className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md" whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }} whileTap={{ scale: 0.98 }}>
                  <Edit className="w-3.5 h-3.5" />
                  <span className="text-sm">Ред.</span>
                </motion.button>
              </Link>
              <ButtonHoldAndRelease
                onAction={() => onDelete(book.id)}
                className="px-3 py-1.5 shadow-md"
                holdDuration={2000}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-sm ml-1">Удал.</span>
              </ButtonHoldAndRelease>
            </div>
          </div>
        </FadeInView>;
      })}
    </div>
  </div>;
};

/**
 * ListView component for books
 */
const ListView = ({
  books,
  onDelete,
  selectedBooks = [],
  onSelectBook,
  onSelectAll,
  onClearSelection,
  onPrintFormulars
}: ViewProps) => {
  const allSelected = books.length > 0 && selectedBooks.length === books.length;
  const someSelected = selectedBooks.length > 0 && selectedBooks.length < books.length;

  return <div className="overflow-x-auto p-6">
      {/* Selection controls */}
      {books.length > 0 && (
        <div className="mb-4 flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <button
            onClick={allSelected ? onClearSelection : onSelectAll}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-500 transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : someSelected ? (
              <div className="w-4 h-4 border-2 border-blue-500 rounded bg-blue-100 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded"></div>
              </div>
            ) : (
              <Square className="w-4 h-4" />
            )}
            {allSelected ? "Снять выделение" : "Выделить все"}
          </button>
          
          {selectedBooks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Выбрано: {selectedBooks.length} из {books.length}
              </span>
              <motion.button 
                onClick={() => onPrintFormulars?.(selectedBooks, books)}
                className="px-3 py-1.5 shadow-md bg-green-500 hover:bg-green-700 text-white rounded-lg flex items-center gap-1"
                whileHover={{
                  y: -2,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }}
                whileTap={{
                  scale: 0.98
                }}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="text-sm ml-1">Печать формуляров</span>
              </motion.button>
              <ButtonHoldAndRelease 
                onAction={async () => {
                  for (const bookId of selectedBooks) {
                    await onDelete(bookId);
                  }
                  onClearSelection?.();
                }}
                className="px-3 py-1.5 shadow-md bg-red-500 hover:bg-red-700 text-white"
                holdDuration={3000}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-sm ml-1">Удалить выбранные</span>
              </ButtonHoldAndRelease>
            </div>
          )}
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-100 rounded-t-lg">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider w-12">
              <button
                onClick={allSelected ? onClearSelection : onSelectAll}
                className="flex items-center"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                ) : someSelected ? (
                  <div className="w-4 h-4 border-2 border-blue-500 rounded bg-blue-100 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded"></div>
                  </div>
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider w-12"></th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Название</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Автор</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Жанр</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Доступно</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {books.map((book, index) => {
            const isSelected = selectedBooks.includes(book.id);
            return (
              <motion.tr 
                key={book.id} 
                initial={{
                  opacity: 0,
                  x: -20
                }} 
                animate={{
                  opacity: 1,
                  x: 0
                }} 
                transition={{
                  delay: 0.05 * index,
                  duration: 0.3
                }} 
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-100"} ${isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                whileHover={{
                  backgroundColor: isSelected ? "#EBF8FF" : "#F3F4F6"
                }}
              >
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelectBook?.(book.id)}
                    className="flex items-center"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                <div className="w-10 h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden shadow-md">
                  {book.cover ? <motion.img src={book.cover} alt={book.title} className="w-full h-full object-cover" loading="lazy" whileHover={{
                scale: 1.1
              }} transition={{
                type: "spring",
                stiffness: 300,
                damping: 15
              }} onError={e => {
                console.error(`Ошибка загрузки изображения для книги ${book.id}:`, book.cover);
                e.currentTarget.src = "/placeholder.svg";
              }} /> : <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-500" />
                    </div>}
                </div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/books/${book.id}`}>
                  <p className="text-gray-800 font-medium hover:text-blue-500 transition-colors">{book.title}</p>
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{book.authors || "—"}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{book.genre || "—"}</td>
              <td className="px-4 py-3">
                <span className="text-xs font-medium text-white bg-blue-500 px-2 py-1 rounded-full">
                  {book.availableCopies || 0} шт.
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <Link href={`/admin/books/${book.id}/update`}>
                    <motion.button className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 shadow-md" whileHover={{
                  y: -2,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }} whileTap={{
                  scale: 0.98
                }}>
                      <Edit className="w-3.5 h-3.5" />
                      <span className="text-sm">Ред.</span>
                    </motion.button>
                  </Link>
                  <ButtonHoldAndRelease 
                    onAction={() => onDelete(book.id)}
                    className="px-3 py-1.5 shadow-md"
                    holdDuration={2000}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-sm ml-1">Удал.</span>
                  </ButtonHoldAndRelease>
                </div>
              </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>;
};

/**
 * ViewModeMenu with DashboardPage-style navigation
 */
const ViewModeMenu = ({
  viewMode,
  setViewMode
}: ViewModeMenuProps) => {
  return <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-white text-blue-500 border border-blue-500 rounded-lg">
            {viewMode === "cards" && <CreditCard className="mr-2 h-4 w-4" />}
            {viewMode === "3d" && <Box className="mr-2 h-4 w-4" />}
            {viewMode === "list" && <List className="mr-2 h-4 w-4" />}
            Вид
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-white p-2 rounded-xl border border-gray-100 shadow-lg">
            <div className="grid gap-2 p-1 min-w-40">
              <motion.button onClick={() => setViewMode("cards")} className="flex items-center gap-2 p-2 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors" whileHover={{
              x: 3
            }}>
                <CreditCard className="h-4 w-4" />
                Карточки
              </motion.button>
              <motion.button onClick={() => setViewMode("3d")} className="flex items-center gap-2 p-2 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors" whileHover={{
              x: 3
            }}>
                <Box className="h-4 w-4" />
                3D вид
              </motion.button>
              <motion.button onClick={() => setViewMode("list")} className="flex items-center gap-2 p-2 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors" whileHover={{
              x: 3
            }}>
                <List className="h-4 w-4" />
                Список
              </motion.button>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>;
};

/**
 * Main BooksPage component
 */
export default function BooksPage() {
  const { settings, updateSettings } = useSettings();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  // const [viewMode, setViewMode] = useState("cards"); // Удаляем локальный стейт
  const [loading, setLoading] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [showAutoAssignGenres, setShowAutoAssignGenres] = useState(false);

  // Используем глобальный режим отображения
  const viewMode = settings.booksViewMode || 'cards';
  const handleViewModeChange = (mode: 'cards' | '3d' | 'list') => {
    updateSettings({ booksViewMode: mode });
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/books`);
        if (!response.ok) {
          throw new Error('Ошибка при получении книг');
        }
        const data = await response.json();
        console.log("API response data:", data);
        setBooks(data.map((book: any) => {
          // Получаем URL обложки из любого доступного поля
          const coverUrl = book.cover || book.coverImage || book.coverImageUrl || book.image || book.coverUrl || book.imageUrl || "";
          console.log(`Book ${book.id} - Cover URL:`, coverUrl);
          return {
            id: book.id,
            title: book.title,
            authors: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors,
            genre: book.genre,
            cover: coverUrl,
            availableCopies: book.availableCopies,
            categorization: book.categorization
          };
        }));
      } catch (error) {
        console.error("Ошибка получения книг", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить книги",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();

    // Слушаем обновления экземпляров книги для обновления счетчиков
    const handleInstancesUpdate = (event: CustomEvent) => {
      console.log("Получено обновление экземпляров на странице списка книг:", event.detail);
      // Обновляем данные о книгах для актуализации счетчиков доступных копий
      fetchBooks();
    };

    window.addEventListener('bookInstancesUpdated', handleInstancesUpdate as EventListener);

    return () => {
      window.removeEventListener('bookInstancesUpdated', handleInstancesUpdate as EventListener);
    };
  }, []);
  const filteredBooks = books.filter(book => book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.authors && book.authors.toLowerCase().includes(searchQuery.toLowerCase()));
  const sortedBooks = filteredBooks.sort((a, b) => sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
  const handleDelete = async (id: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/books/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Ошибка при удалении книги');
      }
      setBooks(books.filter(book => book.id !== id));
      setSelectedBooks(selectedBooks.filter(bookId => bookId !== id));
      toast({
        title: "Успешно",
        description: "Книга успешно удалена"
      });
    } catch (error) {
      console.error("Ошибка удаления книги", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить книгу",
        variant: "destructive"
      });
    }
  };

  const handleSelectBook = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleSelectAll = () => {
    setSelectedBooks(sortedBooks.map(book => book.id));
  };

  const handleClearSelection = () => {
    setSelectedBooks([]);
  };

  const handlePrintFormulars = (selectedBookIds: string[], allBooks: Book[]) => {
    // Получаем данные выбранных книг
    const selectedBooksData = allBooks.filter(book => selectedBookIds.includes(book.id));
    
    if (selectedBooksData.length === 0) {
      toast({
        title: "Ошибка",
        description: "Нет выбранных книг для печати",
        variant: "destructive"
      });
      return;
    }

    // Создаем URL для страницы печати с данными книг
    // Используем текущий protocol и hostname, но фиксируем порт 3000
    const baseUrl = window.location.origin;
    const bookIds = selectedBookIds.join(',');
    const printUrl = `${baseUrl}/admin/books/print-formulars?bookIds=${encodeURIComponent(bookIds)}`;
    
    // Открываем страницу печати в новой вкладке
    const printWindow = window.open(printUrl, '_blank');
    
    if (!printWindow) {
      toast({
        title: "Ошибка",
        description: "Не удалось открыть страницу печати. Проверьте настройки блокировки всплывающих окон.",
        variant: "destructive"
      });
    }
  };

  const handleGenreAssignmentComplete = () => {
    // Обновляем список книг после назначения жанров/категорий
    const fetchBooks = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/books`);
        if (!response.ok) {
          throw new Error('Ошибка при получении книг');
        }
        const data = await response.json();
        setBooks(data.map((book: any) => {
          const coverUrl = book.cover || book.coverImage || book.coverImageUrl || book.image || book.coverUrl || book.imageUrl || "";
          return {
            id: book.id,
            title: book.title,
            authors: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors,
            genre: book.genre,
            cover: coverUrl,
            availableCopies: book.availableCopies,
            categorization: book.categorization
          };
        }));
      } catch (error) {
        console.error("Ошибка обновления книг", error);
      }
    };
    fetchBooks();
  };
  return <div className="min-h-screen bg-gray-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <FadeInView>
          <motion.div className="sticky top-0 z-10 bg-white border border-gray-100 p-6 rounded-xl shadow-md mb-6" initial={{
          y: -20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          duration: 0.5
        }}>
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-800">Управление книгами</h1>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <Link href="/admin/books/create">
                  <motion.button className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }} whileTap={{
                  scale: 0.98
                }}>
                    <Plus className="h-4 w-4" />
                    Добавить книгу
                  </motion.button>
                </Link>
                
                <motion.button 
                  onClick={() => setShowAutoAssignGenres(true)}
                  className="bg-purple-500 hover:bg-purple-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md" 
                  whileHover={{
                    y: -3,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                  }} 
                  whileTap={{
                    scale: 0.98
                  }}
                >
                  <Brain className="h-4 w-4" />
                  ИИ Жанры/Категории
                </motion.button>
                
                <motion.button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="bg-white text-blue-500 font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md border border-blue-500" whileHover={{
                y: -3,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
              }} whileTap={{
                scale: 0.98
              }}>
                  <ArrowUpDown className="h-4 w-4" />
                  {sortOrder === "asc" ? "По возрастанию" : "По убыванию"}
                </motion.button>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <input type="text" placeholder="Поиск книг..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-white border border-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-10 pr-4 py-2 text-gray-800 shadow-md" />
                </div>
                
                <ViewModeMenu viewMode={viewMode} setViewMode={handleViewModeChange} />
              </div>
            </div>
          </motion.div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          {loading ? <div className="flex justify-center items-center h-64">
              <motion.div animate={{
            rotate: 360
          }} transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }} className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full" />
            </div> : sortedBooks.length === 0 ? <motion.div className="bg-white rounded-xl p-12 shadow-md border border-gray-100 text-center" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.3
        }}>
              <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-xl text-gray-800">Книги не найдены</p>
              <p className="mt-2 text-gray-500">
                Попробуйте изменить параметры поиска или добавьте новую книгу
              </p>
              <Link href="/admin/books/create">
                <motion.button className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md mx-auto" whileHover={{
              y: -3,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
            }} whileTap={{
              scale: 0.98
            }}>
                  <Plus className="h-4 w-4" />
                  Добавить книгу
                </motion.button>
              </Link>
            </motion.div> : <motion.div className="bg-white rounded-xl shadow-md border border-gray-100" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5,
          delay: 0.3
        }}>
              {viewMode === "cards" && <CardsView books={sortedBooks} onDelete={handleDelete} selectedBooks={selectedBooks} onSelectBook={handleSelectBook} onSelectAll={handleSelectAll} onClearSelection={handleClearSelection} onPrintFormulars={handlePrintFormulars} />}
              {viewMode === "3d" && <ThreeDBookView books={sortedBooks} onDelete={handleDelete} selectedBooks={selectedBooks} onSelectBook={handleSelectBook} onSelectAll={handleSelectAll} onClearSelection={handleClearSelection} onPrintFormulars={handlePrintFormulars} />}
              {viewMode === "list" && (
                <ListView 
                  books={sortedBooks} 
                  onDelete={handleDelete}
                  selectedBooks={selectedBooks}
                  onSelectBook={handleSelectBook}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                  onPrintFormulars={handlePrintFormulars}
                />
              )}
            </motion.div>}
        </FadeInView>

        {/* Модальное окно для автоматического назначения жанров и категорий */}
        <AutoAssignGenres
          open={showAutoAssignGenres}
          onOpenChange={setShowAutoAssignGenres}
          books={books}
          onAssignment={handleGenreAssignmentComplete}
        />
      </div>
    </div>;
}
