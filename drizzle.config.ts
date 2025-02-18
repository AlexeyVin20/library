import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Загружаем переменные окружения из .env.local
dotenv.config({ path: ".env.local" });

// Проверяем необходимые переменные окружения
if (!process.env.DB_HOST) throw new Error("DB_HOST is required");
if (!process.env.DB_PORT) throw new Error("DB_PORT is required");
if (!process.env.DB_USER) throw new Error("DB_USER is required");
if (!process.env.DB_PASSWORD) throw new Error("DB_PASSWORD is required");
if (!process.env.DB_NAME) throw new Error("DB_NAME is required");

export default {
  schema: "./database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=disable&connect_timeout=5`,
  },
} satisfies Config;