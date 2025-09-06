import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { gameManager } from "./game-manager";
import { gameSettingsSchema } from "@shared/schema";

interface WebSocketWithData extends WebSocket {
  playerId?: string;
  playerName?: string;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time multiplayer
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocketWithData) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'room:create': {
            const { playerName, settings } = data;
            const playerId = Math.random().toString(36).substring(7);
            
            // Validate settings
            const validatedSettings = gameSettingsSchema.parse(settings);
            
            const roomId = await gameManager.createRoom(playerId, playerName, validatedSettings);
            
            ws.playerId = playerId;
            ws.playerName = playerName;
            ws.roomId = roomId;
            
            ws.send(JSON.stringify({
              type: 'room:created',
              data: { roomId, playerId }
            }));
            
            const roomState = gameManager.getRoomState(roomId);
            if (roomState) {
              ws.send(JSON.stringify({
                type: 'room:state',
                data: roomState
              }));
            }
            break;
          }

          case 'room:join': {
            const { roomId, playerName } = data;
            const playerId = Math.random().toString(36).substring(7);
            
            const roomState = await gameManager.joinRoom(roomId, playerId, playerName);
            
            if (!roomState) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Room not found or full' }
              }));
              return;
            }
            
            ws.playerId = playerId;
            ws.playerName = playerName;
            ws.roomId = roomId;
            
            ws.send(JSON.stringify({
              type: 'room:joined',
              data: { roomId, playerId }
            }));
            
            // Notify all clients in room
            broadcastToRoom(roomId, {
              type: 'room:state',
              data: roomState
            });
            break;
          }

          case 'player:ready': {
            if (!ws.roomId || !ws.playerId) return;
            
            const roomState = await gameManager.setPlayerReady(ws.roomId, ws.playerId, true);
            
            if (roomState) {
              broadcastToRoom(ws.roomId, {
                type: 'room:state',
                data: roomState
              });
              
              // Check if all players are ready and start game
              const allReady = roomState.players.length >= 1 && 
                roomState.players.every(p => p.isReady);
              
              if (allReady) {
                const startedRoom = await gameManager.startGame(ws.roomId);
                if (startedRoom) {
                  broadcastToRoom(ws.roomId, {
                    type: 'game:start',
                    data: {
                      settings: startedRoom.settings,
                      question: startedRoom.currentQuestion,
                      seed: startedRoom.seed
                    }
                  });
                  
                  if (startedRoom.settings.mode === "time") {
                    gameManager.startGameTimer(ws.roomId, { 
                      to: (roomId: string) => ({ 
                        emit: (event: string, data: any) => broadcastToRoom(roomId, { type: event, data }) 
                      }) 
                    });
                  }
                }
              }
            }
            break;
          }

          case 'answer:submit': {
            if (!ws.roomId || !ws.playerId) return;
            
            const { answer } = data;
            const result = await gameManager.submitAnswer(ws.roomId, ws.playerId, answer);
            
            if (result) {
              // Send individual result to player
              ws.send(JSON.stringify({
                type: 'answer:result',
                data: { correct: result.correct }
              }));
              
              // Broadcast updated game state
              broadcastToRoom(ws.roomId, {
                type: 'game:update',
                data: {
                  question: result.roomState.currentQuestion,
                  questionIndex: result.roomState.questionIndex,
                  scores: Object.fromEntries(result.roomState.players.map(p => [p.id, p.score])),
                  streaks: Object.fromEntries(result.roomState.players.map(p => [p.id, p.streak])),
                  timeRemaining: result.roomState.timeRemaining,
                }
              });
            }
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid message format' }
        }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  function broadcastToRoom(roomId: string, message: any) {
    wss.clients.forEach((client: WebSocketWithData) => {
      if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}
