"use server";

export interface BookInput {
  id?: string;
  Title: string;
  Authors: string;
  Genre?: string | null;
  Categorization?: string | null;
  UDK?: string | null;
  BBK?: string | null;
  ISBN?: string | null;
  Cover?: string | null;
  Description?: string | null;
  Summary?: string | null;
  PublicationYear?: number | null;
  Publisher?: string | null;
  PageCount?: number | null;
  Language?: string | null;
  AvailableCopies: number;
  ShelfId?: number | null;
  Position?: number | null;
  Edition?: string | null;
  Price?: number | null;
  Format?: string | null;
  OriginalTitle?: string | null;
  OriginalLanguage?: string | null;
  IsEbook?: boolean;
  Condition?: string | null;
  DateAdded?: string;
  DateModified?: string;
}