"use client";

import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const getThemeClasses = () => {
  return {
    card: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    statsCard: "bg-white/70 dark:bg-neutral-200/70 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform hover:translate-y-[-5px] transition-all duration-300",
    mainContainer: "bg-gradient-to-r from-brand-800/30 via-neutral-800/30 to-brand-900/30 dark:from-neutral-200 dark:via-brand-200 dark:to-neutral-300",
    button: "bg-primary-admin/90 hover:bg-primary-admin text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2",
    tab: "bg-white/20 dark:bg-neutral-200/20 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-lg",
    tabActive: "bg-primary-admin/90 text-white rounded-lg",
    infoOval: "bg-white/40 dark:bg-neutral-300/40 backdrop-blur-sm border border-white/20 dark:border-neutral-700/20 rounded-full px-6 py-3 shadow-sm",
  };
};

export default function BookDetails({ book }: BookDetailsProps) {
  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.mainContainer} p-6`}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/30 dark:bg-neutral-100/30 border-b border-white/20 dark:border-neutral-700/20 p-4 flex items-center justify-between shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-neutral-100 dark:text-neutral-1000">Просмотр книги</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto space-y-8">
        <Card className={themeClasses.card}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-neutral-200 dark:text-neutral-100">
              {book.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                {book.cover ? (
                  <div className="relative w-[250px] h-[400px] rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                    <Image src={book.cover} alt={book.title} fill className="object-cover rounded-xl" priority />
                  </div>
                ) : (
                  <div className={`${themeClasses.card} w-[250px] h-[400px] flex items-center justify-center text-neutral-200 dark:text-neutral-400`}>
                    Нет обложки
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-grow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoOval label="Название" value={book.title} />
                  <InfoOval label="Авторы" value={book.authors} />
                  <InfoOval label="ISBN" value={book.isbn} />
                  <InfoOval label="Жанр" value={book.genre || "Не указан"} />
                  <InfoOval label="Издательство" value={book.publisher || "Не указано"} />
                  <InfoOval label="Год публикации" value={book.publicationYear?.toString() || "Не указан"} />
                  <InfoOval label="Количество страниц" value={book.pageCount?.toString() || "Не указано"} />
                  <InfoOval label="Язык" value={book.language || "Не указан"} />
                  {!book.isEbook && (
                    <InfoOval label="Доступно копий" value={book.availableCopies.toString()} />
                  )}
                  <InfoOval label="Электронная книга" value={book.isEbook ? "Да" : "Нет"} />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <Tabs defaultValue="details">
                <TabsList className="grid grid-cols-3 gap-4 mb-6 w-full max-w-2xl mx-auto bg-transparent">
                  
                  <TabsTrigger
                    value="details"
                    className={`${themeClasses.tab} flex items-center justify-center`}
                  >
                    Детальная информация
                  </TabsTrigger>
                  <TabsTrigger
                    value="additional"
                    className={`${themeClasses.tab} flex items-center justify-center`}
                  >
                    Дополнительно
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <InfoOval label="Категоризация" value={book.categorization || "Не указана"} />
                  <InfoOval label="Издательство" value={book.publisher || "Не указано"} />
                  {!book.isEbook && (
                    <>
                      <InfoOval label="Состояние" value={book.condition || "Не указано"} />
                    </>
                  )}
                  <InfoOval label="Формат" value={book.format || "Не указан"} />
                  <InfoOval label="Цена" value={book.price != null ? book.price.toString() : "Не указана"} />
                  <InfoOval label="УДК" value={book.udk || "Не указан"} />
                  <InfoOval label="ББК" value={book.bbk || "Не указан"} />
                  <div className={`col-span-full ${themeClasses.infoOval} overflow-auto max-h-60`}>
                    <span className="font-semibold text-neutral-200 dark:text-primary">Описание книги:</span>{" "}
                    <span className="text-neutral-400 dark:text-neutral-200">{book.description || "Отсутствует"}</span>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoOval label="Электронная книга" value={book.isEbook ? "Да" : "Нет"} />
                  <InfoOval label="Оригинальное название" value={book.originalTitle || "Не указано"} />
                  <InfoOval label="Оригинальный язык" value={book.originalLanguage || "Не указан"} />
                  <InfoOval label="Издание" value={book.edition || "Не указано"} />
                  <div className={`col-span-full ${themeClasses.infoOval} overflow-auto max-h-60`}>
                    <span className="font-semibold text-neutral-200 dark:text-primary">Резюме книги:</span>{" "}
                    <span className="text-neutral-400 dark:text-neutral-200">{book.summary || "Отсутствует"}</span>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-end mt-8">
              <Link
                href={`/admin/books/${book.id}/update`}
                className={themeClasses.button}
              >
                Редактировать
              </Link>
              <Link
                href="/admin/books"
                className="bg-neutral-500/90 hover:bg-neutral-500 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-2"
              >
                Назад
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// InfoOval Component
function InfoOval({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  const themeClasses = getThemeClasses();
  return (
    <div className={`${fullWidth ? "col-span-full" : ""} ${themeClasses.infoOval} ${fullWidth ? "overflow-auto max-h-60" : ""}`}>
      <span className="font-semibold text-neutral-200 dark:text-primary">{label}:</span>{" "}
      <span className="text-neutral-400 dark:text-neutral-200">{value}</span>
    </div>
  );
}