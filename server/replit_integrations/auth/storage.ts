import { users, type User } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IAuthStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(username: string, hashedPassword: string): Promise<User>;
  setResetToken(userId: string, token: string, expires: Date): Promise<void>;
  resetPassword(userId: string, hashedPassword: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  setAdmin(id: string, isAdmin: boolean): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(username: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ id: randomUUID(), username, password: hashedPassword })
      .returning();
    return user;
  }

  async setResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({ resetToken: token, resetTokenExpires: expires })
      .where(eq(users.id, userId));
  }

  async resetPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, resetToken: null, resetTokenExpires: null })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.username);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async setAdmin(id: string, isAdmin: boolean): Promise<void> {
    await db.update(users).set({ isAdmin }).where(eq(users.id, id));
  }
}

export const authStorage = new AuthStorage();
