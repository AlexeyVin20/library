"use client";

import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Book {
  id: string;
  title: string;
  authors: string;
  genre?: string | null;
  categorization?: string | null;
  isbn: string;
  cover?: string | null;
  description?: string | null;
  summary?: string | null;
  publicationYear?: number | null;
  publisher?: string | null;
  pageCount?: number | null;
  language?: string | null;
  availableCopies: number;
  dateAdded?: string;
  dateModified?: string;
}

interface BookDetailsProps {
  book: Book;
}

export default function BookDetails({ book }: BookDetailsProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8 shadow-lg border-t-4 border-t-blue-600">
        <CardHeader className="bg-gray-50 rounded-t-lg">
          <CardTitle className="text-2xl font-bold">
            Просмотр книги
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Обложка */}
          <div className="mb-6 flex justify-center">
            {book.cover ? (
              <div className="relative w-[250px] h-[400px] shadow-lg rounded overflow-hidden">
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-[250px] h-[400px] bg-gray-300 flex items-center justify-center rounded">
                <span>Нет обложки</span>
              </div>
            )}
          </div>

          {/* Вкладки с информацией */}
          <Tabs defaultValue="basic-info">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="basic-info">
                Основная информация
              </TabsTrigger>
              <TabsTrigger value="details">
                Детали книги
              </TabsTrigger>
            </TabsList>
            <TabsContent value="basic-info" className="space-y-4">
              <div>
                <span className="font-semibold">Название:</span> {book.title}
              </div>
              <div>
                <span className="font-semibold">Авторы:</span> {book.authors}
              </div>
              <div>
                <span className="font-semibold">ISBN:</span> {book.isbn}
              </div>
              <div>
                <span className="font-semibold">Жанр:</span> {book.genre || "Не указан"}
              </div>
              <div>
                <span className="font-semibold">Категоризация:</span> {book.categorization || "Не указана"}
              </div>
            </TabsContent>
            <TabsContent value="details" className="space-y-4">
              <div>
                <span className="font-semibold">Издательство:</span> {book.publisher || "Не указано"}
              </div>
              <div>
                <span className="font-semibold">Год публикации:</span> {book.publicationYear || "Не указан"}
              </div>
              <div>
                <span className="font-semibold">Количество страниц:</span> {book.pageCount || "Не указано"}
              </div>
              <div>
                <span className="font-semibold">Язык:</span> {book.language || "Не указан"}
              </div>
              <div>
                <span className="font-semibold">Доступно копий:</span> {book.availableCopies}
              </div>
              <div>
                <span className="font-semibold">Описание:</span> {book.description || "Отсутствует"}
              </div>
              <div>
                <span className="font-semibold">Краткое содержание:</span> {book.summary || "Отсутствует"}
              </div>
              <div>
                <span className="font-semibold">Дата добавления:</span>{" "}
                {book.dateAdded ? new Date(book.dateAdded).toLocaleDateString() : "Не указана"}
              </div>
              <div>
                <span className="font-semibold">Дата обновления:</span>{" "}
                {book.dateModified ? new Date(book.dateModified).toLocaleDateString() : "Не указана"}
              </div>
            </TabsContent>
          </Tabs>

          {/* Кнопки */}
          <div className="flex gap-4 justify-end mt-4">
            <Link
              href={`/admin/books/${book.id}/update`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Редактировать
            </Link>
            <Link
              href="/admin/books"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Назад
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
