"use server";

export interface BookInput {
  id?: string;
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