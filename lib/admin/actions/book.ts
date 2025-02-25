"use server";

// Типизацию BookInput можно определить исходя из структуры формы и схемы
export interface BookInput {
  id?: string;
  title: string;
  authors: { id: string; fullName: string }[];
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