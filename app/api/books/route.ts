import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";

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
