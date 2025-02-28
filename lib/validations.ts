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
  title: z.string().min(1, "Название книги обязательно").max(255, "Название книги не должно превышать 255 символов"),
  authors: z.string(),
  genre: z.string().nullable().optional(),
  categorization: z.string().nullable().optional(),
  isbn: z.string().min(1, "ISBN обязателен").max(20, "ISBN не должен превышать 20 символов"),
  cover: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  publicationYear: z.number().int().nullable().optional(),
  publisher: z.string().nullable().optional(),
  pageCount: z.number().int().nullable().optional(),
  language: z.string().nullable().optional(),
  availableCopies: z.number().int().min(0, "Количество экземпляров не может быть отрицательным").default(0),
});

