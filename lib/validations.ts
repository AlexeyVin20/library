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
  title: z.string().trim().min(2, "Название должно содержать минимум 2 символа").max(100, "Максимальная длина 100 символов"),
  description: z.string().trim().min(10, "Описание должно содержать минимум 10 символов").max(1000, "Максимальная длина 1000 символов"),
  author: z.string().trim().min(2, "Имя автора должно содержать минимум 2 символа").max(100, "Максимальная длина 100 символов"),
  genre: z.string().trim().min(2, "Жанр должен содержать минимум 2 символа").max(50, "Максимальная длина 50 символов"),
  rating: z.coerce.number().min(1, "Рейтинг должен быть не меньше 1").max(5, "Рейтинг не может превышать 5"),
  totalCopies: z.coerce.number().int().positive("Количество экземпляров должно быть положительным").lte(10000, "Количество экземпляров не может превышать 10000"),
  coverUrl: z.string().nonempty("Обложка обязательна"),
  coverColor: z.string().trim().regex(/^#[0-9A-F]{6}$/i, "Некорректный формат цвета"),
  summary: z.string().trim().min(10, "Резюме должно содержать минимум 10 символов"),
  isbn: z.string().nonempty("ISBN обязателен"),
  googleBooksId: z.string().optional(),
});

