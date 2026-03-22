import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import {
  tasks, projectTasks, routines, goals, moodEntries, timeBlocks, pinnedNotes, brainDumps, workSessions,
  type Task, type InsertTask,
  type ProjectTask, type InsertProjectTask,
  type Routine, type InsertRoutine,
  type Goal, type InsertGoal,
  type MoodEntry, type InsertMoodEntry,
  type TimeBlock, type InsertTimeBlock,
  type PinnedNote, type InsertPinnedNote,
  type BrainDump,
  type WorkSession,
} from "@shared/schema";

/**
 * Strip fields that must never be overwritten by a client payload.
 * Prevents ownership reassignment and id spoofing via update endpoints.
 */
function sanitizeUpdate<T extends object>(data: T): Omit<T, 'id' | 'userId'> {
  const { id: _id, userId: _userId, ...safe } = data as T & { id?: unknown; userId?: unknown };
  return safe as Omit<T, 'id' | 'userId'>;
}

export interface IStorage {
  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  createTask(userId: string, task: InsertTask): Promise<Task>;
  updateTask(userId: string, id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(userId: string, id: string): Promise<void>;

  // Project Tasks
  getProjectTasks(userId: string): Promise<ProjectTask[]>;
  createProjectTask(userId: string, task: InsertProjectTask): Promise<ProjectTask>;
  updateProjectTask(userId: string, id: string, task: Partial<InsertProjectTask>): Promise<ProjectTask | undefined>;
  deleteProjectTask(userId: string, id: string): Promise<void>;

  // Routines
  getRoutines(userId: string): Promise<Routine[]>;
  createRoutine(userId: string, routine: InsertRoutine): Promise<Routine>;
  updateRoutine(userId: string, id: string, routine: Partial<InsertRoutine>): Promise<Routine | undefined>;
  deleteRoutine(userId: string, id: string): Promise<void>;

  // Goals
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(userId: string, goal: InsertGoal): Promise<Goal>;
  updateGoal(userId: string, id: string, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(userId: string, id: string): Promise<void>;

  // Mood Entries
  getMoodEntries(userId: string): Promise<MoodEntry[]>;
  createMoodEntry(userId: string, entry: InsertMoodEntry): Promise<MoodEntry>;
  updateMoodEntry(userId: string, id: string, entry: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined>;
  deleteMoodEntry(userId: string, id: string): Promise<void>;

  // Time Blocks
  getTimeBlocks(userId: string): Promise<TimeBlock[]>;
  createTimeBlock(userId: string, block: InsertTimeBlock): Promise<TimeBlock>;
  updateTimeBlock(userId: string, id: string, block: Partial<InsertTimeBlock>): Promise<TimeBlock | undefined>;
  deleteTimeBlock(userId: string, id: string): Promise<void>;

  // Pinned Notes
  getPinnedNotes(userId: string): Promise<PinnedNote[]>;
  createPinnedNote(userId: string, note: InsertPinnedNote): Promise<PinnedNote>;
  updatePinnedNote(userId: string, id: string, note: Partial<InsertPinnedNote>): Promise<PinnedNote | undefined>;
  deletePinnedNote(userId: string, id: string): Promise<void>;

  // Brain Dump
  getBrainDump(userId: string): Promise<string>;
  setBrainDump(userId: string, content: string): Promise<void>;

  // Work Sessions (Body Doubling)
  getActiveSessions(): Promise<WorkSession[]>;
  getUserActiveSession(userId: string): Promise<WorkSession | undefined>;
  createWorkSession(userId: string, username: string, task: string, durationMinutes: number): Promise<WorkSession>;
  updateWorkSession(id: number, userId: string, status: "completed" | "abandoned"): Promise<WorkSession | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Tasks
  async getTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(userId: string, task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values({ ...task, userId }).returning();
    return created;
  }

  async updateTask(userId: string, id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set(sanitizeUpdate(task))
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTask(userId: string, id: string): Promise<void> {
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  // Project Tasks
  async getProjectTasks(userId: string): Promise<ProjectTask[]> {
    return db.select().from(projectTasks).where(eq(projectTasks.userId, userId));
  }

  async createProjectTask(userId: string, task: InsertProjectTask): Promise<ProjectTask> {
    const [created] = await db.insert(projectTasks).values({ ...task, userId }).returning();
    return created;
  }

  async updateProjectTask(userId: string, id: string, task: Partial<InsertProjectTask>): Promise<ProjectTask | undefined> {
    const [updated] = await db
      .update(projectTasks)
      .set(sanitizeUpdate(task))
      .where(and(eq(projectTasks.id, id), eq(projectTasks.userId, userId)))
      .returning();
    return updated;
  }

  async deleteProjectTask(userId: string, id: string): Promise<void> {
    await db.delete(projectTasks).where(and(eq(projectTasks.id, id), eq(projectTasks.userId, userId)));
  }

  // Routines
  async getRoutines(userId: string): Promise<Routine[]> {
    return db.select().from(routines).where(eq(routines.userId, userId));
  }

  async createRoutine(userId: string, routine: InsertRoutine): Promise<Routine> {
    const [created] = await db.insert(routines).values({ ...routine, userId }).returning();
    return created;
  }

  async updateRoutine(userId: string, id: string, routine: Partial<InsertRoutine>): Promise<Routine | undefined> {
    const [updated] = await db
      .update(routines)
      .set(sanitizeUpdate(routine))
      .where(and(eq(routines.id, id), eq(routines.userId, userId)))
      .returning();
    return updated;
  }

  async deleteRoutine(userId: string, id: string): Promise<void> {
    await db.delete(routines).where(and(eq(routines.id, id), eq(routines.userId, userId)));
  }

  // Goals
  async getGoals(userId: string): Promise<Goal[]> {
    return db.select().from(goals).where(eq(goals.userId, userId));
  }

  async createGoal(userId: string, goal: InsertGoal): Promise<Goal> {
    const [created] = await db.insert(goals).values({ ...goal, userId }).returning();
    return created;
  }

  async updateGoal(userId: string, id: string, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updated] = await db
      .update(goals)
      .set(sanitizeUpdate(goal))
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return updated;
  }

  async deleteGoal(userId: string, id: string): Promise<void> {
    await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)));
  }

  // Mood Entries
  async getMoodEntries(userId: string): Promise<MoodEntry[]> {
    return db.select().from(moodEntries).where(eq(moodEntries.userId, userId));
  }

  async createMoodEntry(userId: string, entry: InsertMoodEntry): Promise<MoodEntry> {
    const [created] = await db.insert(moodEntries).values({ ...entry, userId }).returning();
    return created;
  }

  async updateMoodEntry(userId: string, id: string, entry: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined> {
    const [updated] = await db
      .update(moodEntries)
      .set(sanitizeUpdate(entry))
      .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)))
      .returning();
    return updated;
  }

  async deleteMoodEntry(userId: string, id: string): Promise<void> {
    await db.delete(moodEntries).where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId)));
  }

  // Time Blocks
  async getTimeBlocks(userId: string): Promise<TimeBlock[]> {
    return db.select().from(timeBlocks).where(eq(timeBlocks.userId, userId));
  }

  async createTimeBlock(userId: string, block: InsertTimeBlock): Promise<TimeBlock> {
    const [created] = await db.insert(timeBlocks).values({ ...block, userId }).returning();
    return created;
  }

  async updateTimeBlock(userId: string, id: string, block: Partial<InsertTimeBlock>): Promise<TimeBlock | undefined> {
    const [updated] = await db
      .update(timeBlocks)
      .set(sanitizeUpdate(block))
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTimeBlock(userId: string, id: string): Promise<void> {
    await db.delete(timeBlocks).where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)));
  }

  // Pinned Notes
  async getPinnedNotes(userId: string): Promise<PinnedNote[]> {
    return db.select().from(pinnedNotes).where(eq(pinnedNotes.userId, userId));
  }

  async createPinnedNote(userId: string, note: InsertPinnedNote): Promise<PinnedNote> {
    const [created] = await db.insert(pinnedNotes).values({ ...note, userId }).returning();
    return created;
  }

  async updatePinnedNote(userId: string, id: string, note: Partial<InsertPinnedNote>): Promise<PinnedNote | undefined> {
    const [updated] = await db
      .update(pinnedNotes)
      .set(sanitizeUpdate(note))
      .where(and(eq(pinnedNotes.id, id), eq(pinnedNotes.userId, userId)))
      .returning();
    return updated;
  }

  async deletePinnedNote(userId: string, id: string): Promise<void> {
    await db.delete(pinnedNotes).where(and(eq(pinnedNotes.id, id), eq(pinnedNotes.userId, userId)));
  }

  // Brain Dump
  async getBrainDump(userId: string): Promise<string> {
    const [row] = await db.select().from(brainDumps).where(eq(brainDumps.userId, userId));
    return row?.content ?? "";
  }

  async setBrainDump(userId: string, content: string): Promise<void> {
    await db
      .insert(brainDumps)
      .values({ userId, content })
      .onConflictDoUpdate({ target: brainDumps.userId, set: { content, updatedAt: new Date() } });
  }

  // Work Sessions (Body Doubling)
  async getActiveSessions(): Promise<WorkSession[]> {
    const now = Date.now();
    return db.select().from(workSessions)
      .where(and(eq(workSessions.status, "active"), gt(workSessions.endsAt, now)));
  }

  async getUserActiveSession(userId: string): Promise<WorkSession | undefined> {
    const now = Date.now();
    const [session] = await db.select().from(workSessions)
      .where(and(eq(workSessions.userId, userId), eq(workSessions.status, "active"), gt(workSessions.endsAt, now)));
    return session;
  }

  async createWorkSession(userId: string, username: string, task: string, durationMinutes: number): Promise<WorkSession> {
    const now = Date.now();
    const endsAt = now + durationMinutes * 60 * 1000;
    // Abandon any existing active sessions for this user
    await db.update(workSessions)
      .set({ status: "abandoned" })
      .where(and(eq(workSessions.userId, userId), eq(workSessions.status, "active")));
    const [session] = await db.insert(workSessions)
      .values({ userId, username, task, durationMinutes, startedAt: now, endsAt, status: "active" })
      .returning();
    return session;
  }

  async updateWorkSession(id: number, userId: string, status: "completed" | "abandoned"): Promise<WorkSession | undefined> {
    const [updated] = await db.update(workSessions)
      .set({ status })
      .where(and(eq(workSessions.id, id), eq(workSessions.userId, userId)))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
