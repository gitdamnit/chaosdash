import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  serial,
  bigint,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";
export * from "./models/chat";

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: varchar("status", { enum: ["inbox", "do_now", "done"] }).notNull().default("inbox"),
  createdAt: integer("created_at").notNull(),
  dueDate: integer("due_date"),
  priority: varchar("priority", { enum: ["low", "medium", "high"] }),
  notes: text("notes"),
  subtasks: jsonb("subtasks").$type<{ id: string; text: string; done: boolean }[]>().default([]),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ userId: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// ── Project Tasks ─────────────────────────────────────────────────────────────
export const projectTasks = pgTable("project_tasks", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: varchar("status", { enum: ["backlog", "doing", "done"] }).notNull().default("backlog"),
  tags: jsonb("tags").$type<string[]>().default([]),
});

export const insertProjectTaskSchema = createInsertSchema(projectTasks).omit({ userId: true });
export type InsertProjectTask = z.infer<typeof insertProjectTaskSchema>;
export type ProjectTask = typeof projectTasks.$inferSelect;

// ── Routines ──────────────────────────────────────────────────────────────────
export const routines = pgTable("routines", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: varchar("type", { enum: ["daily", "weekly", "monthly"] }).notNull().default("daily"),
  streak: integer("streak").notNull().default(0),
  lastCompleted: integer("last_completed"),
  completionDates: jsonb("completion_dates").$type<string[]>().default([]),
  steps: jsonb("steps").$type<{ id: string; title: string; durationMinutes: number | null }[]>().default([]),
});

export const insertRoutineSchema = createInsertSchema(routines).omit({ userId: true });
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;
export type Routine = typeof routines.$inferSelect;

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: varchar("target_date"),
  status: varchar("status", { enum: ["not_started", "in_progress", "completed"] }).notNull().default("not_started"),
  progress: integer("progress").notNull().default(0),
  category: varchar("category", { enum: ["health", "career", "personal", "financial", "learning", "other"] }),
  smart: jsonb("smart").$type<{
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  }>(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ userId: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// ── Mood Entries ──────────────────────────────────────────────────────────────
export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(),
  score: integer("score").notNull(),
  emoji: text("emoji").notNull(),
  note: text("note"),
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({ userId: true });
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;

// ── Time Blocks ───────────────────────────────────────────────────────────────
export const timeBlocks = pgTable("time_blocks", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  startMinutes: integer("start_minutes").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  color: varchar("color").notNull(),
  date: varchar("date").notNull(),
  category: varchar("category"),
});

export const insertTimeBlockSchema = createInsertSchema(timeBlocks).omit({ userId: true });
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;
export type TimeBlock = typeof timeBlocks.$inferSelect;

// ── Pinned Notes ──────────────────────────────────────────────────────────────
export const pinnedNotes = pgTable("pinned_notes", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  color: varchar("color").notNull(),
});

export const insertPinnedNoteSchema = createInsertSchema(pinnedNotes).omit({ userId: true });
export type InsertPinnedNote = z.infer<typeof insertPinnedNoteSchema>;
export type PinnedNote = typeof pinnedNotes.$inferSelect;

// ── Work Sessions (Body Doubling) ─────────────────────────────────────────────
export const workSessions = pgTable("work_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  task: text("task").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  startedAt: bigint("started_at", { mode: "number" }).notNull(),
  endsAt: bigint("ends_at", { mode: "number" }).notNull(),
  status: varchar("status", { enum: ["active", "completed", "abandoned"] }).notNull().default("active"),
});

export const insertWorkSessionSchema = createInsertSchema(workSessions).omit({ id: true, userId: true, username: true, startedAt: true, endsAt: true, status: true });
export type InsertWorkSession = z.infer<typeof insertWorkSessionSchema>;
export type WorkSession = typeof workSessions.$inferSelect;

// ── Brain Dump ────────────────────────────────────────────────────────────────
export const brainDumps = pgTable("brain_dumps", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type BrainDump = typeof brainDumps.$inferSelect;
