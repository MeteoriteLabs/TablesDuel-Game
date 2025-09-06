import { type User, type InsertUser, type GameRoom, type GameParticipant, type InsertGameRoomSchema, type InsertGameParticipantSchema } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game Room operations
  createGameRoom(room: { hostId: string; settings: any; }): Promise<GameRoom>;
  getGameRoom(id: string): Promise<GameRoom | undefined>;
  updateGameRoomStatus(id: string, status: string): Promise<void>;
  
  // Game Participant operations
  addGameParticipant(participant: { roomId: string; playerId: string; playerName: string; }): Promise<GameParticipant>;
  getGameParticipants(roomId: string): Promise<GameParticipant[]>;
  updateParticipantScore(id: string, score: number, streak: number): Promise<void>;
  updateParticipantReady(id: string, isReady: boolean): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private gameRooms: Map<string, GameRoom>;
  private gameParticipants: Map<string, GameParticipant>;

  constructor() {
    this.users = new Map();
    this.gameRooms = new Map();
    this.gameParticipants = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createGameRoom(room: { hostId: string; settings: any; }): Promise<GameRoom> {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameRoom: GameRoom = {
      id,
      hostId: room.hostId,
      settings: room.settings,
      status: "waiting",
      createdAt: new Date(),
    };
    this.gameRooms.set(id, gameRoom);
    return gameRoom;
  }

  async getGameRoom(id: string): Promise<GameRoom | undefined> {
    return this.gameRooms.get(id);
  }

  async updateGameRoomStatus(id: string, status: string): Promise<void> {
    const room = this.gameRooms.get(id);
    if (room) {
      room.status = status;
      this.gameRooms.set(id, room);
    }
  }

  async addGameParticipant(participant: { roomId: string; playerId: string; playerName: string; }): Promise<GameParticipant> {
    const id = randomUUID();
    const gameParticipant: GameParticipant = {
      id,
      roomId: participant.roomId,
      playerId: participant.playerId,
      playerName: participant.playerName,
      score: 0,
      streak: 0,
      isReady: false,
      joinedAt: new Date(),
    };
    this.gameParticipants.set(id, gameParticipant);
    return gameParticipant;
  }

  async getGameParticipants(roomId: string): Promise<GameParticipant[]> {
    return Array.from(this.gameParticipants.values()).filter(
      (participant) => participant.roomId === roomId,
    );
  }

  async updateParticipantScore(id: string, score: number, streak: number): Promise<void> {
    const participant = this.gameParticipants.get(id);
    if (participant) {
      participant.score = score;
      participant.streak = streak;
      this.gameParticipants.set(id, participant);
    }
  }

  async updateParticipantReady(id: string, isReady: boolean): Promise<void> {
    const participant = this.gameParticipants.get(id);
    if (participant) {
      participant.isReady = isReady;
      this.gameParticipants.set(id, participant);
    }
  }
}

export const storage = new MemStorage();
