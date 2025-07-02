"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, BookOpen, Edit, ArrowLeft, Clock, Calendar, LanguagesIcon as Language, Hash, BookCopy, Bookmark, Plus, Package } from "lucide-react";
import { Book } from "@/components/ui/book";
import BookInstanceManager from "@/components/admin/BookInstanceManager";
import { useRouter } from "next/navigation";

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

// Компонент для информационного поля
const InfoField = ({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) => {
  return <motion.div className="bg-gray-100 rounded-xl p-3 border border-gray-200 shadow-sm" whileHover={{
    y: -3,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
  }} transition={{
    duration: 0.2
  }}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-gray-800">{icon}</span>}
        <span className="font-medium text-gray-800">{label}</span>
      </div>
      <span className="text-gray-800">{value}</span>
    </motion.div>;
};

// Компонент для вкладок
const AnimatedTabsTrigger = ({
  value,
  label,
  isActive
}: {
  value: string;
  label: string;
  isActive: boolean;
}) => {
  return <TabsTrigger value={value} className="relative data-[state=active]:bg-transparent">
      <div className="flex items-center gap-2 py-2 px-3">
        <span className={isActive ? "text-white" : "text-gray-800 font-medium"}>
          {label}
        </span>
      </div>
      {isActive && <motion.div layoutId="activeBookTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.3
    }} />}
    </TabsTrigger>;
};

export default function BookDetails({
  book
}: BookDetailsProps) {
  const [activeTab, setActiveTab] = useState("details");
  const router = useRouter();

  const handleCreateInstance = () => {
    router.push(`/admin/books/${book.id}/instances/create`);
  };

  const handleEditInstance = (instanceId: string) => {
    router.push(`/admin/books/${book.id}/instances/${instanceId}/update`);
  };

  return <div className="min-h-screen bg-gray-200 relative">
      {/* Floating shapes */}
      <div className="fixed top-1/4 right-10 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-1/4 left-10 w-80 h-80 bg-blue-300/10 rounded-full blur-3xl"></div>
      <div className="fixed top-1/2 left-1/3 w-40 h-40 bg-blue-300/10 rounded-full blur-3xl"></div>
      <div className="container mx-auto p-6 relative z-10">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-center gap-4">
            <motion.div initial={{
            x: -20,
            opacity: 0
          }} animate={{
            x: 0,
            opacity: 1
          }} transition={{
            duration: 0.5
          }}>
              <Link href="/admin/books" className="flex items-center gap-2 text-gray-800 hover:text-blue-500 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Назад к списку книг</span>
              </Link>
            </motion.div>

            <motion.h1 initial={{
            opacity: 0,
            y: -20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }} className="text-3xl font-bold text-gray-800">
              Просмотр книги
            </motion.h1>
          </div>
        </FadeInView>

        {/* Main Content */}
        <FadeInView delay={0.2}>
          <motion.div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200" whileHover={{
          y: -5,
          boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)"
        }}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{book.title}</h2>
              <p className="text-gray-500">{book.authors}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                <Book color="#012B48" width={250} depth={5}>
                  {book.cover ? <Image src={book.cover} alt={book.title} width={250} height={400} className="object-cover w-full h-full rounded" priority /> : <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-gray-500" />
                    </div>}
                </Book>
                {/* Book status indicators */}
                <div className="mt-4 space-y-2">
                  {!book.isEbook && (
                    <div className="flex items-center gap-2 text-gray-800 bg-blue-300 p-2 rounded-lg">
                      <BookCopy className="w-5 h-5" />
                      <span>
                        Доступно копий: <strong>{book.availableCopies}</strong>
                      </span>
                    </div>
                  )}
                  {book.isEbook && <div className="flex items-center gap-2 text-gray-800 bg-gray-100 p-2 rounded-lg">
                      <Bookmark className="w-5 h-5" />
                      <span>Электронная книга</span>
                    </div>}
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-grow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="ISBN" value={book.isbn} icon={<Hash className="w-4 h-4" />} />
                  <InfoField label="Жанр" value={book.genre || "Не указан"} icon={<Bookmark className="w-4 h-4" />} />
                  <InfoField label="Издательство" value={book.publisher || "Не указано"} />
                  <InfoField label="Год публикации" value={book.publicationYear?.toString() || "Не указан"} icon={<Calendar className="w-4 h-4" />} />
                  <InfoField label="Количество страниц" value={book.pageCount?.toString() || "Не указано"} />
                  <InfoField label="Язык" value={book.language || "Не указан"} icon={<Language className="w-4 h-4" />} />
                </div>

                {/* Description preview */}
                <motion.div className="mt-4 bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm" whileHover={{
                y: -3,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
              }} transition={{
                duration: 0.2
              }}>
                  <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Описание книги:
                  </h3>
                  <p className="text-gray-800 line-clamp-3">
                    {book.description || "Описание отсутствует"}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <Tabs defaultValue="details" onValueChange={setActiveTab}>
                <TabsList className="border-b border-gray-200 p-0 rounded-none bg-blue-300 shadow-none">
                  <AnimatedTabsTrigger value="details" label="Детальная информация" isActive={activeTab === "details"} />
                  {!book.isEbook && <AnimatedTabsTrigger value="instances" label="Экземпляры" isActive={activeTab === "instances"} />}
                  <AnimatedTabsTrigger value="additional" label="Дополнительно" isActive={activeTab === "additional"} />
                </TabsList>

                <TabsContent value="details" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Категоризация" value={book.categorization || "Не указана"} />
                    <InfoField label="Издательство" value={book.publisher || "Не указано"} />
                    {!book.isEbook && <InfoField label="Состояние" value={book.condition || "Не указано"} />}
                    <InfoField label="Формат" value={book.format || "Не указан"} />
                    <InfoField label="Цена" value={book.price != null ? `${book.price} ₽` : "Не указана"} />
                    <InfoField label="УДК" value={book.udk || "Не указан"} />
                    <InfoField label="ББК" value={book.bbk || "Не указан"} />
                  </div>

                  <motion.div className="mt-6 bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm" whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }} transition={{
                  duration: 0.2
                }}>
                    <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Полное описание книги:
                    </h3>
                    <p className="text-gray-800">{book.description || "Описание отсутствует"}</p>
                  </motion.div>
                </TabsContent>

                {!book.isEbook && (
                  <TabsContent value="instances" className="mt-6">
                    <BookInstanceManager 
                      bookId={book.id}
                      bookData={{
                        isbn: book.isbn,
                        title: book.title
                      }}
                      onCreateInstance={handleCreateInstance}
                      onEditInstance={handleEditInstance}
                    />
                  </TabsContent>
                )}

                <TabsContent value="additional" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Оригинальное название" value={book.originalTitle || "Не указано"} />
                    <InfoField label="Оригинальный язык" value={book.originalLanguage || "Не указан"} />
                    <InfoField label="Издание" value={book.edition || "Не указано"} />
                    {book.dateAdded && <InfoField label="Дата добавления" value={new Date(book.dateAdded).toLocaleDateString()} icon={<Clock className="w-4 h-4" />} />}
                    {book.dateModified && <InfoField label="Дата изменения" value={new Date(book.dateModified).toLocaleDateString()} icon={<Clock className="w-4 h-4" />} />}
                  </div>

                  <motion.div className="mt-6 bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm" whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }} transition={{
                  duration: 0.2
                }}>
                    <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Резюме книги:
                    </h3>
                    <p className="text-gray-800">{book.summary || "Резюме отсутствует"}</p>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-end mt-8">
              {!book.isEbook && (
                <Link href={`/admin/books/${book.id}/instances`}>
                  <motion.button className="bg-purple-500 hover:bg-purple-700 text-white font-medium rounded-lg px-6 py-2.5 flex items-center gap-2 shadow-md" whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }} whileTap={{
                  scale: 0.98
                }}>
                    <BookCopy className="w-4 h-4" />
                    Экземпляры
                  </motion.button>
                </Link>
              )}
              <Link href={`/admin/books/${book.id}/update`}>
                <motion.button className="bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-2.5 flex items-center gap-2 shadow-md" whileHover={{
                y: -3,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
              }} whileTap={{
                scale: 0.98
              }}>
                  <Edit className="w-4 h-4" />
                  Редактировать
                </motion.button>
              </Link>
              {/* Быстрое резервирование */}
              <Link href={`/admin/reservations/create?bookId=${book.id}`}>
                <motion.button className="bg-green-500 hover:bg-green-700 text-white font-medium rounded-lg px-6 py-2.5 flex items-center gap-2 shadow-md" whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
                }} whileTap={{
                  scale: 0.98
                }}>
                  <Plus className="w-4 h-4" />
                  Быстрое резервирование
                </motion.button>
              </Link>
              <Link href="/admin/books">
                <motion.button className="bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg px-6 py-2.5 flex items-center gap-2 shadow-md" whileHover={{
                y: -3,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
              }} whileTap={{
                scale: 0.98
              }}>
                  <ArrowLeft className="w-4 h-4" />
                  Назад
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </FadeInView>
      </div>
    </div>;
}