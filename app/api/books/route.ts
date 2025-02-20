import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";

// GET: Получить список всех книг
export async function GET() {
  try {
    const allBooks = await db.select().from(books);
    return NextResponse.json(allBooks);
  } catch (error) {
    console.error("Ошибка при получении книг:", error);
    return NextResponse.json({ error: "Ошибка при получении книг" }, { status: 500 });
  }
}

// POST: Добавить новую книгу
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, author, genre, rating, totalCopies, coverUrl, coverColor, description, summary, isbn, googleBooksId } = body;
    if (!title || !author || !genre || !rating || !totalCopies || !coverUrl || !description) {
      return NextResponse.json({ error: "Все поля должны быть заполнены" }, { status: 400 });
    }
    const newBook = await db.insert(books).values({
      title,
      author,
      genre,
      rating,
      totalCopies,
      coverUrl,
      coverColor,
      description,
      summary,
      isbn,
      googleBooksId,
      availableCopies: totalCopies,
    }).returning();
    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error("Ошибка при добавлении книги:", error);
    return NextResponse.json({ error: "Ошибка при добавлении книги" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    if (!params.bookId) {
      return NextResponse.json(
        { error: "Не указан ID книги" },
        { status: 400 }
      );
    }
    
    const deletedBooks = await db.delete(books)
      .where(eq(books.id, params.bookId))
      .returning();
      
    if (!deletedBooks || deletedBooks.length === 0) {
      return NextResponse.json(
        { error: "Книга не найдена" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Книга удалена", book: deletedBooks[0] });
  
  } catch (error) {
    console.error("Ошибка при удалении книги:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении книги" },
      { status: 500 }
    );
  }
}