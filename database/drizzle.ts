// lib/database/drizzle.ts
import config from "@/lib/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const sql = postgres(config.env.databaseUrl);

export const db = drizzle(sql, { casing: "snake_case" });
