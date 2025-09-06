import { GameSettings, Question, PlayerState, RoomState } from "@shared/schema";
import { storage } from "./storage";

export class GameManager {
  private rooms: Map<string, RoomState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  generateQuestion(settings: GameSettings, index: number, seed: number): Question {
    // Seeded random number generator
    let s = seed + index;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    
    const { minTable, maxTable, difficulty } = settings;
    const bCap = difficulty === "easy" ? 10 : difficulty === "hard" ? 20 : 12;
    
    const a = Math.floor(rnd() * (maxTable - minTable + 1)) + minTable;
    const b = Math.floor(rnd() * bCap) + 1;
    const c = a * b;
    
    const r = rnd();
    const variant = r < 0.7 ? "axb=?" : r < 0.85 ? "?xb=c" : "ax?=c";
    
    return { index, a, b, c, variant } as Question;
  }

  async createRoom(hostId: string, hostName: string, settings: GameSettings): Promise<string> {
    const seed = Math.floor(Math.random() * 100000);
    const room = await storage.createGameRoom({ hostId, settings });
    
    const participant = await storage.addGameParticipant({
      roomId: room.id,
      playerId: hostId,
      playerName: hostName,
    });

    const roomState: RoomState = {
      roomId: room.id,
      players: [{
        id: participant.playerId,
        name: participant.playerName,
        score: 0,
        streak: 0,
        isReady: false,
        correctAnswers: 0,
        totalAnswers: 0,
        accuracy: 0,
      }],
      settings,
      status: "waiting",
      questionIndex: 0,
      seed,
    };

    this.rooms.set(room.id, roomState);
    return room.id;
  }

  async joinRoom(roomId: string, playerId: string, playerName: string): Promise<RoomState | null> {
    const roomState = this.rooms.get(roomId);
    const dbRoom = await storage.getGameRoom(roomId);
    
    if (!roomState || !dbRoom || roomState.players.length >= 2) {
      return null;
    }

    const participant = await storage.addGameParticipant({
      roomId,
      playerId,
      playerName,
    });

    roomState.players.push({
      id: participant.playerId,
      name: participant.playerName,
      score: 0,
      streak: 0,
      isReady: false,
      correctAnswers: 0,
      totalAnswers: 0,
      accuracy: 0,
    });

    this.rooms.set(roomId, roomState);
    return roomState;
  }

  async setPlayerReady(roomId: string, playerId: string, isReady: boolean): Promise<RoomState | null> {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return null;

    const player = roomState.players.find(p => p.id === playerId);
    if (!player) return null;

    player.isReady = isReady;
    
    // Update in storage
    const participants = await storage.getGameParticipants(roomId);
    const participant = participants.find(p => p.playerId === playerId);
    if (participant) {
      await storage.updateParticipantReady(participant.id, isReady);
    }

    this.rooms.set(roomId, roomState);
    return roomState;
  }

  async startGame(roomId: string): Promise<RoomState | null> {
    const roomState = this.rooms.get(roomId);
    if (!roomState || roomState.status !== "waiting") return null;

    const allReady = roomState.players.length >= 1 && 
      roomState.players.every(p => p.isReady);
    
    if (!allReady) return null;

    roomState.status = "active";
    roomState.questionIndex = 0;
    roomState.currentQuestion = this.generateQuestion(roomState.settings, 0, roomState.seed);
    
    if (roomState.settings.mode === "time") {
      roomState.timeRemaining = roomState.settings.timeLimitSec || 60;
    }

    await storage.updateGameRoomStatus(roomId, "active");
    this.rooms.set(roomId, roomState);
    
    return roomState;
  }

  async submitAnswer(roomId: string, playerId: string, answer: number): Promise<{ correct: boolean; roomState: RoomState } | null> {
    const roomState = this.rooms.get(roomId);
    if (!roomState || !roomState.currentQuestion) return null;

    const player = roomState.players.find(p => p.id === playerId);
    if (!player) return null;

    const question = roomState.currentQuestion;
    let correct = false;
    let correctAnswer = 0;

    switch (question.variant) {
      case "axb=?":
        correctAnswer = question.c;
        break;
      case "?xb=c":
        correctAnswer = question.a;
        break;
      case "ax?=c":
        correctAnswer = question.b;
        break;
    }

    correct = answer === correctAnswer;

    // Update statistics
    player.totalAnswers += 1;
    if (correct) {
      player.correctAnswers += 1;
      const points = roomState.settings.difficulty === "easy" ? 1 : 
                    roomState.settings.difficulty === "medium" ? 2 : 3;
      player.score += points;
      player.streak += 1;
      
      // Streak bonus every 5 correct answers
      if (player.streak % 5 === 0) {
        player.score += 2;
      }
    } else {
      player.streak = 0;
    }

    // Calculate accuracy
    player.accuracy = Math.round((player.correctAnswers / player.totalAnswers) * 100);

    // Update in storage
    const participants = await storage.getGameParticipants(roomId);
    const participant = participants.find(p => p.playerId === playerId);
    if (participant) {
      await storage.updateParticipantScore(participant.id, player.score, player.streak);
    }

    // Generate next question
    roomState.questionIndex += 1;
    roomState.currentQuestion = this.generateQuestion(
      roomState.settings, 
      roomState.questionIndex, 
      roomState.seed
    );

    this.rooms.set(roomId, roomState);
    
    return { correct, roomState };
  }

  startGameTimer(roomId: string, io: any): void {
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId));
    }

    const timer = setInterval(() => {
      const roomState = this.rooms.get(roomId);
      if (!roomState || roomState.status !== "active") {
        clearInterval(timer);
        this.timers.delete(roomId);
        return;
      }

      if (roomState.timeRemaining !== undefined) {
        roomState.timeRemaining -= 1;
        
        io.to(roomId).emit("game:update", {
          timeRemaining: roomState.timeRemaining,
          scores: Object.fromEntries(roomState.players.map(p => [p.id, p.score])),
          streaks: Object.fromEntries(roomState.players.map(p => [p.id, p.streak])),
        });

        if (roomState.timeRemaining <= 0) {
          this.endGame(roomId, io);
        }
      }
    }, 1000);

    this.timers.set(roomId, timer);
  }

  async endGame(roomId: string, io: any): Promise<void> {
    const roomState = this.rooms.get(roomId);
    if (!roomState) return;

    roomState.status = "completed";
    await storage.updateGameRoomStatus(roomId, "completed");
    
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId));
      this.timers.delete(roomId);
    }

    const leaderboard = [...roomState.players].sort((a, b) => b.score - a.score);
    
    // Debug: Log the leaderboard data being sent
    console.log("Game ending, sending leaderboard:", JSON.stringify(leaderboard, null, 2));
    
    io.to(roomId).emit("game:end", {
      leaderboard,
      finalScores: Object.fromEntries(roomState.players.map(p => [p.id, p.score])),
    });

    this.rooms.set(roomId, roomState);
  }

  getRoomState(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }
}

export const gameManager = new GameManager();
