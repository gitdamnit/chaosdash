import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { authStorage } from "./storage";
import { pool } from "../../db";
import { sql } from "drizzle-orm";
import { db } from "../../db";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function ensureSessionsTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      sid  VARCHAR NOT NULL PRIMARY KEY,
      sess JSON    NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire)
  `);
}

async function ensureUsersTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`,
    `UPDATE users SET is_admin = TRUE WHERE username = 'evanzellner' AND (is_admin IS NULL OR is_admin = FALSE)`,
  ];
  for (const q of migrations) {
    try { await pool.query(q); } catch (_) {}
  }
}

export function getSession() {
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;
  const sessionTtlSec = 7 * 24 * 60 * 60;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,
    createTableIfMissing: false,
    ttl: sessionTtlSec,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET ?? "adhd-penguin-secret-change-me",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtlMs,
    },
  });
}

export async function setupAuth(app: Express): Promise<void> {
  await ensureUsersTable();
  await ensureSessionsTable();

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await authStorage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Invalid username or password" });
        const valid = await comparePasswords(password, user.password);
        if (!valid) return done(null, false, { message: "Invalid username or password" });
        return done(null, { id: user.id, username: user.username });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
}

export const isAuthenticated: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  res.status(401).json({ message: "Unauthorized" });
};
