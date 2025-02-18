import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    if (!params.bookId) {
      return NextResponse.json(
        { error: "ID книги не указан" },
        { status: 400 }
      );
    }

    const book = await db.query.books.findFirst({
      where: eq(books.id, params.bookId),
    });

    if (!book) {
      return NextResponse.json(
        { error: "Книга не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
    
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при получении книги" },
      { status: 500 }
    );
  }
}
