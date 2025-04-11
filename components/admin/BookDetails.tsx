"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, BookOpen, Edit, ArrowLeft } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  authors: string;
  isbn: string;
  genre?: string | null;
  categorization?: string | null;
  udk?: string | null;
  bbk?: string | null;
  summary?: string | null;
  cover?: string | null;
  description?: string | null;
  publicationYear?: number | null;
  publisher?: string | null;
  pageCount?: number | null;
  language?: string | null;
  availableCopies: number;
  shelfId?: number;
  edition?: string | null;
  price?: number | null;
  format?: string | null;
  originalTitle?: string | null;
  originalLanguage?: string | null;
  isEbook?: boolean;
  condition?: string | null;
  dateAdded?: string;
  dateModified?: string;
}

interface BookDetailsProps {
  book: Book;
}

// Компонент для анимированного появления
const FadeInView = ({ children, delay = 0, duration = 0.5 }: { children: React.ReactNode; delay?: number; duration?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Компонент для информационного поля
const InfoField = ({ label, value }: { label: string; value: string }) => {
  return (
    <motion.div 
      className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-3 border border-white/20 dark:border-gray-700/30 shadow-sm"
      whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
      transition={{ duration: 0.2 }}
    >
      <span className="font-medium text-gray-700 dark:text-gray-200">{label}:</span>{" "}
      <span className="text-gray-600 dark:text-gray-300">{value}</span>
    </motion.div>
  );
};

// Компонент для вкладок
const AnimatedTabsTrigger = ({ value, label, isActive }: { value: string; label: string; isActive: boolean }) => {
  return (
    <TabsTrigger value={value} className="relative">
      <div className="py-2 px-1">
        <span>{label}</span>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeBookTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </TabsTrigger>
  );
};

export default function BookDetails({ book }: BookDetailsProps) {
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div className="min-h-screen relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto p-6 relative z-10">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Link 
                href="/admin/books" 
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Назад к списку книг</span>
              </Link>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-bold text-gray-800 dark:text-white"
            >
              Просмотр книги
            </motion.h1>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          <motion.div 
            className="backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/30"
            whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)" }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{book.title}</h2>
              <p className="text-gray-600 dark:text-gray-300">{book.authors}</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                {book.cover ? (
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="relative w-[250px] h-[400px] rounded-xl shadow-lg overflow-hidden"
                  >
                    <Image src={book.cover || "/placeholder.svg"} alt={book.title} fill className="object-cover rounded-xl" priority />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="w-[250px] h-[400px] flex items-center justify-center backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl border border-white/20 dark:border-gray-700/30 shadow-lg"
                  >
                    <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-grow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Название" value={book.title} />
                  <InfoField label="Авторы" value={book.authors} />
                  <InfoField label="ISBN" value={book.isbn} />
                  <InfoField label="Жанр" value={book.genre || "Не указан"} />
                  <InfoField label="Издательство" value={book.publisher || "Не указано"} />
                  <InfoField label="Год публикации" value={book.publicationYear?.toString() || "Не указан"} />
                  <InfoField label="Количество страниц" value={book.pageCount?.toString() || "Не указано"} />
                  <InfoField label="Язык" value={book.language || "Не указан"} />
                  {!book.isEbook && (
                    <InfoField label="Доступно копий" value={book.availableCopies.toString()} />
                  )}
                  <InfoField label="Электронная книга" value={book.isEbook ? "Да" : "Нет"} />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <Tabs defaultValue="details" onValueChange={setActiveTab}>
                <TabsList className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md p-1 rounded-xl border border-white/20 dark:border-gray-700/30 shadow-md">
                  <AnimatedTabsTrigger 
                    value="details" 
                    label="Детальная информация" 
                    isActive={activeTab === "details"} 
                  />
                  <AnimatedTabsTrigger 
                    value="additional" 
                    label="Дополнительно" 
                    isActive={activeTab === "additional"} 
                  />
                </TabsList>

                <TabsContent value="details" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Категоризация" value={book.categorization || "Не указана"} />
                    <InfoField label="Издательство" value={book.publisher || "Не указано"} />
                    {!book.isEbook && (
                      <InfoField label="Состояние" value={book.condition || "Не указано"} />
                    )}
                    <InfoField label="Формат" value={book.format || "Не указан"} />
                    <InfoField label="Цена" value={book.price != null ? book.price.toString() : "Не указана"} />
                    <InfoField label="УДК" value={book.udk || "Не указан"} />
                    <InfoField label="ББК" value={book.bbk || "Не указан"} />
                  </div>
                  
                  <motion.div 
                    className="mt-4 backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-4 border border-white/20 dark:border-gray-700/30 shadow-sm"
                    whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Описание книги:</h3>
                    <p className="text-gray-600 dark:text-gray-300">{book.description || "Отсутствует"}</p>
                  </motion.div>
                </TabsContent>

                <TabsContent value="additional" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Электронная книга" value={book.isEbook ? "Да" : "Нет"} />
                    <InfoField label="Оригинальное название" value={book.originalTitle || "Не указано"} />
                    <InfoField label="Оригинальный язык" value={book.originalLanguage || "Не указан"} />
                    <InfoField label="Издание" value={book.edition || "Не указано"} />
                  </div>
                  
                  <motion.div 
                    className="mt-4 backdrop-blur-xl bg-white/20 dark:bg-gray-800/20 rounded-xl p-4 border border-white/20 dark:border-gray-700/30 shadow-sm"
                    whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Резюме книги:</h3>
                    <p className="text-gray-600 dark:text-gray-300">{book.summary || "Отсутствует"}</p>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-end mt-8">
              <Link href={`/admin/books/${book.id}/update`}>
                <motion.button
                  className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                  whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </motion.button>
              </Link>
              <Link href="/admin/books">
                <motion.button
                  className="bg-gray-500/90 hover:bg-gray-600/90 text-white font-medium rounded-lg px-4 py-2 flex items-center gap-2 shadow-md backdrop-blur-md"
                  whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </FadeInView>
      </div>
    </div>
  );
}
