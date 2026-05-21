import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse(process.env);

if (env.JWT_SECRET === "change-me") {
  throw new Error('JWT_SECRET must be replaced with a long random value instead of "change-me"');
}

if (hasDefaultDatabaseCredentials(env.DATABASE_URL)) {
  const message = "DATABASE_URL still uses default postgres credentials";

  if (env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(`[security] ${message}. Rotate them before deployment.`);
}

function hasDefaultDatabaseCredentials(databaseUrl: string) {
  return databaseUrl.includes("://postgres:postgres@");
}
