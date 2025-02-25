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
  title: z.string()
    .trim()
    .min(2, "Название должно содержать минимум 2 символа")
    .max(200, "Максимальная длина 200 символов"),

  description: z.string()
    .trim()
    .min(10, "Описание должно содержать минимум 10 символов")
    .max(5000, "Максимальная длина 5000 символов"),

  authors: z.array(
    z.string().trim().min(2, "Имя автора должно содержать минимум 2 символа").max(100, "Максимальная длина 100 символов")
  ).nonempty("Необходимо указать хотя бы одного автора"),

  genre: z.string()
    .trim()
    .min(2, "Жанр должен содержать минимум 2 символа")
    .max(50, "Максимальная длина 50 символов"),

  categorization: z.string()
    .trim()
    .max(100, "Максимальная длина рубрикатора 100 символов")
    .optional(),

  rating: z.coerce.number()
    .min(1, "Рейтинг должен быть не меньше 1")
    .max(5, "Рейтинг не может превышать 5"),

  totalCopies: z.coerce.number()
    .int()
    .positive("Количество экземпляров должно быть положительным")
    .lte(10000, "Количество экземпляров не может превышать 10000"),

  availableCopies: z.coerce.number()
    .int()
    .min(0, "Доступные экземпляры не могут быть отрицательными")
    .max(10000, "Доступные экземпляры не могут превышать 10000"),

  coverUrl: z.string()
    .url("Некорректный формат URL")
    .nonempty("Обложка обязательна"),

  coverColor: z.string()
    .trim()
    .regex(/^#[0-9A-F]{6}$/i, "Некорректный формат цвета"),

  summary: z.string()
    .trim()
    .min(10, "Резюме должно содержать минимум 10 символов")
    .max(1000, "Максимальная длина 1000 символов"),

  isbn: z.string()
    .trim()
    .regex(/^(97(8|9))?\d{9}(\d|X)$/, "Некорректный формат ISBN")
    .nonempty("ISBN обязателен"),

  publicationYear: z.coerce.number()
    .int()
    .min(1400, "Год публикации не может быть раньше 1400")
    .max(new Date().getFullYear(), "Год публикации не может быть в будущем"),

  publisher: z.string()
    .trim()
    .max(200, "Максимальная длина названия издателя 200 символов")
    .optional(),

  pageCount: z.coerce.number()
    .int()
    .positive("Количество страниц должно быть положительным")
    .max(5000, "Книга не может содержать больше 5000 страниц"),

  language: z.string()
    .trim()
    .min(2, "Язык должен содержать минимум 2 символа")
    .max(50, "Максимальная длина 50 символов"),
  
  dateAdded: z.string()
    .optional(),

  dateModified: z.string()
    .optional(),
});

