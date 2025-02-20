"use server";

import { books } from "@/database/schema";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";
// Типизацию BookInput можно определить исходя из структуры формы и схемы
export type BookInput = {
  title: string;
  author: string;
  genre: string;
  rating: number;
  coverUrl: string;
  coverColor: string;
  description: string;
  totalCopies: number;
  summary: string;
  isbn: string;
  googleBooksId?: string;
};

export async function handleAddBook(values: BookInput) {
  console.log("handleAddBook called with", values);
  try {
    // Вставляем новую книгу в таблицу
    const [newBook] = await db.insert(books).values({
      title: values.title,
      author: values.author,
      genre: values.genre,
      rating: values.rating,
      coverUrl: values.coverUrl,
      coverColor: values.coverColor,
      description: values.description,
      totalCopies: values.totalCopies,
      availableCopies: values.totalCopies, // по умолчанию все экземпляры доступны
      summary: values.summary,
      isbn: values.isbn,
      googleBooksId: values.googleBooksId,
    }).returning();

    return { success: true, data: newBook };
  } catch (error: any) {
    console.error("Ошибка при добавлении книги:", error);
    return { success: false, message: error.message };
  }
}

export async function handleUpdateBook(values: BookInput & { id: string }) {
  try {
    const [updatedBook] = await db
      .update(books)
      .set({
        title: values.title,
        author: values.author,
        genre: values.genre,
        rating: values.rating,
        coverUrl: values.coverUrl,
        coverColor: values.coverColor,
        description: values.description,
        totalCopies: values.totalCopies,
        summary: values.summary,
        isbn: values.isbn,
        googleBooksId: values.googleBooksId,
      })
      .where(eq(books.id, values.id))
      .returning();
      
    return { success: true, data: updatedBook };
  } catch (error: any) {
    console.error("Ошибка при обновлении книги:", error);
    return { success: false, message: error.message };
  }
}

const handleDeleteBook = async (id: string) => {
  try {
    const res = await fetch(`/api/books/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setBooks(books.filter(book => book.id !== id));
      toast({
        title: "Успех",
        description: "Книга успешно удалена",
      });
    } else {
      throw new Error('Ошибка удаления книги');
    }
  } catch (error) {
    toast({
      title: "Ошибка",
      description: "Не удалось удалить книгу",
      variant: "destructive",
    });
  }
};