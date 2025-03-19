import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.DB_HOST) throw new Error("DB_HOST is required");
if (!process.env.DB_PORT) throw new Error("DB_PORT is required");
if (!process.env.DB_USER) throw new Error("DB_USER is required");
if (!process.env.DB_PASSWORD) throw new Error("DB_PASSWORD is required");
if (!process.env.DB_NAME) throw new Error("DB_NAME is required");

export const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  //databaseUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=disable&connect_timeout=5`,
};

export default config;