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
  title: z.string().min(1, { message: "Название книги обязательно" }).max(255),
  authors: z.string().min(1, { message: "Автор книги обязателен" }).max(500),
  genre: z.string().nullable().optional(),
  categorization: z.string().nullable().optional(),
  udk: z.string().nullable().optional(),
  bbk: z.string().nullable().optional(),
  isbn: z.string().min(1, { message: "ISBN обязателен" }),
  isbn10: z.string().nullable().optional(),
  cover: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  publicationYear: z.number().optional(),
  publisher: z.string().nullable().optional(),
  pageCount: z.number().optional(),
  language: z.string().nullable().optional(),
  availableCopies: z.number().min(0, { message: "Количество экземпляров не может быть отрицательным" }),
  dateAdded: z.string().optional(),
  dateModified: z.string().optional(),
  shelfId: z.number().optional(),
  position: z.number().optional(),
  edition: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  format: z.string().nullable().optional(),
  originalTitle: z.string().nullable().optional(),
  originalLanguage: z.string().nullable().optional(),
  isEbook: z.boolean().default(false),
  condition: z.string().nullable().optional()
});

export type BookFormData = z.infer<typeof bookSchema>;

export const bookInstanceCreateSchema = z.object({
  bookId: z.string().min(1, { message: "ID книги обязателен" }),
  instanceCode: z.string().min(1, { message: "Код экземпляра обязателен" }).max(100),
  status: z.string().min(1, { message: "Статус обязателен" }),
  condition: z.string().min(1, { message: "Состояние обязательно" }),
  purchasePrice: z.number().min(0, { message: "Цена не может быть отрицательной" }).optional(),
  dateAcquired: z.string().min(1, { message: "Дата поступления обязательна" }),
  notes: z.string().max(1000, { message: "Примечания не должны превышать 1000 символов" }).optional(),
  shelfId: z.number().optional(),
  position: z.number().min(0, { message: "Позиция не может быть отрицательной" }).optional(),
  location: z.string().max(200, { message: "Местоположение не должно превышать 200 символов" }).optional(),
  isActive: z.boolean().default(true)
});

export const bookInstanceUpdateSchema = z.object({
  instanceCode: z.string().min(1, { message: "Код экземпляра обязателен" }).max(100),
  status: z.string().min(1, { message: "Статус обязателен" }),
  condition: z.string().min(1, { message: "Состояние обязательно" }),
  purchasePrice: z.number().min(0, { message: "Цена не может быть отрицательной" }).optional(),
  dateAcquired: z.string().min(1, { message: "Дата поступления обязательна" }),
  dateLastChecked: z.string().optional(),
  notes: z.string().max(1000, { message: "Примечания не должны превышать 1000 символов" }).optional(),
  shelfId: z.number().optional(),
  position: z.number().min(0, { message: "Позиция не может быть отрицательной" }).optional(),
  location: z.string().max(200, { message: "Местоположение не должно превышать 200 символов" }).optional(),
  isActive: z.boolean().default(true)
});

export type BookInstanceCreateData = z.infer<typeof bookInstanceCreateSchema>;
export type BookInstanceUpdateData = z.infer<typeof bookInstanceUpdateSchema>;

