import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const gameRooms = pgTable("game_rooms", {
  id: varchar("id").primaryKey(),
  hostId: varchar("host_id").notNull(),
  settings: jsonb("settings").notNull(),
  status: varchar("status").notNull().default("waiting"), // waiting, active, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameParticipants = pgTable("game_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  playerId: varchar("player_id").notNull(),
  playerName: text("player_name").notNull(),
  score: integer("score").default(0),
  streak: integer("streak").default(0),
  isReady: boolean("is_ready").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Game Settings Schema
export const gameSettingsSchema = z.object({
  mode: z.enum(["time", "target", "endless"]),
  timeLimitSec: z.number().optional().default(60),
  targetScore: z.number().optional().default(20),
  minTable: z.number().min(2).max(20).default(2),
  maxTable: z.number().min(2).max(20).default(12),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

// Question Schema
export const questionSchema = z.object({
  index: z.number(),
  a: z.number(),
  b: z.number(),
  c: z.number(),
  variant: z.enum(["axb=?", "?xb=c", "ax?=c"]),
});

// Question History Schema
export const questionHistorySchema = z.object({
  question: questionSchema,
  userAnswer: z.string(),
  correctAnswer: z.number(),
  isCorrect: z.boolean(),
  timestamp: z.number(),
});

// Player State Schema
export const playerStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().default(0),
  streak: z.number().default(0),
  isReady: z.boolean().default(false),
  correctAnswers: z.number().default(0),
  totalAnswers: z.number().default(0),
  accuracy: z.number().default(0),
});

// Room State Schema
export const roomStateSchema = z.object({
  roomId: z.string(),
  players: z.array(playerStateSchema),
  settings: gameSettingsSchema,
  status: z.enum(["waiting", "active", "completed"]),
  currentQuestion: questionSchema.optional(),
  questionIndex: z.number().default(0),
  timeRemaining: z.number().optional(),
  seed: z.number(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameRoomSchema = createInsertSchema(gameRooms).omit({
  id: true,
  createdAt: true,
});

export const insertGameParticipantSchema = createInsertSchema(gameParticipants).omit({
  id: true,
  joinedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameRoom = typeof gameRooms.$inferSelect;
export type GameParticipant = typeof gameParticipants.$inferSelect;
export type GameSettings = z.infer<typeof gameSettingsSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionHistory = z.infer<typeof questionHistorySchema>;
export type PlayerState = z.infer<typeof playerStateSchema>;
export type RoomState = z.infer<typeof roomStateSchema>;
