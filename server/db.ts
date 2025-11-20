import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Load environment variables (only needed locally)
import dotenv from "dotenv";
dotenv.config();

const NEON_DB_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!NEON_DB_URL) {
  throw new Error("NEON_DATABASE_URL or DATABASE_URL is not defined in environment variables");
}

const sql = neon(NEON_DB_URL);
export const db = drizzle(sql, { schema });
