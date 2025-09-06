import { create } from 'zustand';
import { GameSettings, Question, QuestionHistory, PlayerState } from '@shared/schema';

interface GameState {
  // Game settings
  playerName: string;
  gameMode: '1-player' | '2-player';
  settings: GameSettings;
  
  // Room state
  roomId: string | null;
  playerId: string | null;
  players: PlayerState[];
  
  // Game state
  currentQuestion: Question | null;
  lastQuestion: Question | null;
  lastAnswer: string;
  lastCorrectAnswer: number | null;
  questionHistory: QuestionHistory[];
  questionIndex: number;
  currentAnswer: string;
  timeRemaining: number | null;
  gameStatus: 'menu' | 'lobby' | 'active' | 'completed';
  
  // Statistics
  score: number;
  streak: number;
  correctAnswers: number;
  totalAnswers: number;
  
  // Sound settings
  soundEnabled: boolean;
  
  // Actions
  setPlayerName: (name: string) => void;
  setGameMode: (mode: '1-player' | '2-player') => void;
  setSettings: (settings: GameSettings) => void;
  setRoomId: (roomId: string | null) => void;
  setPlayerId: (playerId: string | null) => void;
  setPlayers: (players: PlayerState[]) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setLastQuestion: (question: Question | null, answer: string, correctAnswer: number | null) => void;
  addQuestionToHistory: (question: Question, userAnswer: string, correctAnswer: number, isCorrect: boolean) => void;
  setQuestionIndex: (index: number) => void;
  setCurrentAnswer: (answer: string) => void;
  setTimeRemaining: (time: number | null) => void;
  setGameStatus: (status: 'menu' | 'lobby' | 'active' | 'completed') => void;
  setScore: (score: number) => void;
  setStreak: (streak: number) => void;
  incrementCorrectAnswers: () => void;
  incrementTotalAnswers: () => void;
  toggleSound: () => void;
  resetGame: () => void;
}

export const useGameState = create<GameState>((set, get) => ({
  // Initial state
  playerName: '',
  gameMode: '1-player',
  settings: {
    mode: 'time',
    timeLimitSec: 60,
    targetScore: 20,
    minTable: 2,
    maxTable: 12,
    difficulty: 'medium',
  },
  roomId: null,
  playerId: null,
  players: [],
  currentQuestion: null,
  lastQuestion: null,
  lastAnswer: '',
  lastCorrectAnswer: null,
  questionHistory: [],
  questionIndex: 0,
  currentAnswer: '',
  timeRemaining: null,
  gameStatus: 'menu',
  score: 0,
  streak: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  soundEnabled: JSON.parse(localStorage.getItem('soundEnabled') || 'true'),

  // Actions
  setPlayerName: (name) => set({ playerName: name }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setSettings: (settings) => set({ settings }),
  setRoomId: (roomId) => set({ roomId }),
  setPlayerId: (playerId) => set({ playerId }),
  setPlayers: (players) => set({ players }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setLastQuestion: (question, answer, correctAnswer) => set({ 
    lastQuestion: question, 
    lastAnswer: answer, 
    lastCorrectAnswer: correctAnswer 
  }),
  addQuestionToHistory: (question, userAnswer, correctAnswer, isCorrect) => set(state => ({
    questionHistory: [...state.questionHistory, {
      question,
      userAnswer,
      correctAnswer,
      isCorrect,
      timestamp: Date.now()
    }]
  })),
  setQuestionIndex: (index) => set({ questionIndex: index }),
  setCurrentAnswer: (answer) => set({ currentAnswer: answer }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setGameStatus: (status) => set({ gameStatus: status }),
  setScore: (score) => set({ score }),
  setStreak: (streak) => set({ streak }),
  incrementCorrectAnswers: () => set(state => ({ correctAnswers: state.correctAnswers + 1 })),
  incrementTotalAnswers: () => set(state => ({ totalAnswers: state.totalAnswers + 1 })),
  toggleSound: () => {
    const newSoundEnabled = !get().soundEnabled;
    localStorage.setItem('soundEnabled', JSON.stringify(newSoundEnabled));
    set({ soundEnabled: newSoundEnabled });
  },
  resetGame: () => set({
    currentQuestion: null,
    lastQuestion: null,
    lastAnswer: '',
    lastCorrectAnswer: null,
    questionHistory: [],
    questionIndex: 0,
    currentAnswer: '',
    timeRemaining: null,
    score: 0,
    streak: 0,
    correctAnswers: 0,
    totalAnswers: 0,
  }),
}));
