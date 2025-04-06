import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  universityId: z.coerce.number(),
  password: z.string().min(8),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const bookSchema = z.object({
  Title: z.string().min(1, { message: "Название книги обязательно" }).max(255),
  Authors: z.string().min(1, { message: "Автор книги обязателен" }).max(500),
  Genre: z.string().nullable().optional(),
  Categorization: z.string().nullable().optional(),
  UDK: z.string().nullable().optional(),
  BBK: z.string().nullable().optional(),
  ISBN: z.string().nullable().optional(),
  ISBN10: z.string().nullable().optional(),
  Cover: z.string().nullable().optional(),
  Description: z.string().nullable().optional(),
  Summary: z.string().nullable().optional(),
  PublicationYear: z.number().optional(),
  Publisher: z.string().nullable().optional(),
  PageCount: z.number().optional(),
  Language: z.string().nullable().optional(),
  AvailableCopies: z.number().min(0, { message: "Количество экземпляров не может быть отрицательным" }),
  DateAdded: z.string().optional(),
  DateModified: z.string().optional(),
  ShelfId: z.number().nullable().optional(),
  Position: z.number().nullable().optional(),
  Edition: z.string().nullable().optional(),
  Price: z.number().nullable().optional(),
  Format: z.string().nullable().optional(),
  OriginalTitle: z.string().nullable().optional(),
  OriginalLanguage: z.string().nullable().optional(),
  IsEbook: z.boolean().default(false),
  Condition: z.string().nullable().optional()
});

export type BookFormData = z.infer<typeof bookSchema>;

