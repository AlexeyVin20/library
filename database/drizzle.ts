import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "@/lib/config"; // Загружаем переменные окружения
import * as schema from "@/database/schema"; // Подключаем схему
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: config.host,
  port: Number(config.port),
  user: config.user,
  password: config.password,
  database: config.database,
});

export const db = drizzle(pool, { schema });
