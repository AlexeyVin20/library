"use server";

export interface BookInput {
  id?: string;
  title: string;
  authors: string;
  genre?: string | null;
  categorization?: string | null;
  udk?: string | null;
  bbk?: string | null;
  isbn: string;
  cover?: string | null;
  description?: string | null;
  summary?: string | null;
  publicationYear?: number | null;
  publisher?: string | null;
  pageCount?: number | null;
  language?: string | null;
  availableCopies: number;
  shelfId?: number | null;
  position?: number | null;
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