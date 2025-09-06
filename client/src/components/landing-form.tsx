import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Zap, GamepadIcon, Settings } from "lucide-react";
import { useGameState } from "@/lib/game-state";
import { socketManager } from "@/lib/socket";
import { generateQuestions } from "@/lib/question-generator";
import { GameSettings } from "@shared/schema";

export function LandingForm() {
  const {
    playerName,
    roomId,
    settings,
    setPlayerName,
    setGameMode,
    setSettings,
    setGameStatus,
    setCurrentQuestion,
    setQuestionIndex,
    setRoomId,
    setPlayerId,
    resetGame,
  } = useGameState();

  const [isLoading, setIsLoading] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  // Use settings from game state
  const gameSettings = settings;
  const setGameSettings = (newSettings: GameSettings | ((prev: GameSettings) => GameSettings)) => {
    if (typeof newSettings === 'function') {
      setSettings(newSettings(gameSettings));
    } else {
      setSettings(newSettings);
    }
  };

  const handleSinglePlayer = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsLoading(true);
    resetGame();
    setGameMode('1-player');

    try {
      // Single player mode - generate questions locally
      const questionGen = generateQuestions(settings, Date.now() % 100000);
      const firstQuestion = questionGen.next().value;
      
      setCurrentQuestion(firstQuestion);
      setQuestionIndex(0);
      setGameStatus("active");
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Failed to start game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsLoading(true);
    resetGame();
    setGameMode('multiplayer');

    try {
      await socketManager.connect();
      
      socketManager.on("room:created", (data) => {
        setRoomId(data.roomId);
        setPlayerId(data.playerId);
        setGameStatus("lobby");
      });
      
      socketManager.send("room:create", {
        playerName: playerName.trim(),
        settings: settings,
      });
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    
    if (!joinRoomId.trim()) {
      alert("Please enter a room ID");
      return;
    }

    setIsLoading(true);
    resetGame();
    setGameMode('multiplayer');

    try {
      await socketManager.connect();
      
      socketManager.on("room:joined", (data) => {
        setRoomId(data.roomId);
        setPlayerId(data.playerId);
        setGameStatus("lobby");
      });

      socketManager.on("error", (data) => {
        alert(data.message || "Failed to join room");
        setGameStatus("menu");
      });

      socketManager.send("room:join", {
        roomId: joinRoomId.trim().toUpperCase(),
        playerName: playerName.trim(),
      });
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6 pt-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 gradient-primary rounded-2xl mx-auto flex items-center justify-center mb-6">
          <span className="text-4xl text-primary-foreground font-bold">×</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground">Tables Duel</h2>
        <p className="text-muted-foreground">
          {roomId ? `Join room ${roomId} and compete with a friend!` : "Master your times tables!"}
        </p>
      </div>

      {/* Player Name Input */}
      <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
        <div className="space-y-2">
          <Label htmlFor="player-name" className="text-sm font-medium text-foreground">
            Your Name
          </Label>
          <Input
            id="player-name"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            data-testid="input-player-name"
          />
        </div>
      </div>

      {/* Game Settings */}
      <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Game Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Game Mode */}
          <div className="space-y-2">
            <Label htmlFor="game-mode" className="text-sm font-medium text-foreground">
              Game Mode
            </Label>
            <Select 
              value={gameSettings.mode} 
              onValueChange={(value: 'time' | 'target' | 'endless') => 
                setGameSettings(prev => ({ ...prev, mode: value }))
              }
            >
              <SelectTrigger data-testid="select-game-mode">
                <SelectValue placeholder="Select game mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Time Challenge (60s)</SelectItem>
                <SelectItem value="target">Target Score</SelectItem>
                <SelectItem value="endless">Endless Mode</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Limit (only for time mode) */}
          {gameSettings.mode === 'time' && (
            <div className="space-y-2">
              <Label htmlFor="time-limit" className="text-sm font-medium text-foreground">
                Time Limit (seconds)
              </Label>
              <Select 
                value={gameSettings.timeLimitSec?.toString()} 
                onValueChange={(value) => 
                  setGameSettings(prev => ({ ...prev, timeLimitSec: parseInt(value) }))
                }
              >
                <SelectTrigger data-testid="select-time-limit">
                  <SelectValue placeholder="Select time limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="90">90 seconds</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Target Score (only for target mode) */}
          {gameSettings.mode === 'target' && (
            <div className="space-y-2">
              <Label htmlFor="target-score" className="text-sm font-medium text-foreground">
                Target Score
              </Label>
              <Select 
                value={gameSettings.targetScore?.toString()} 
                onValueChange={(value) => 
                  setGameSettings(prev => ({ ...prev, targetScore: parseInt(value) }))
                }
              >
                <SelectTrigger data-testid="select-target-score">
                  <SelectValue placeholder="Select target score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 points</SelectItem>
                  <SelectItem value="20">20 points</SelectItem>
                  <SelectItem value="30">30 points</SelectItem>
                  <SelectItem value="50">50 points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Difficulty */}
          <div className="space-y-2">
            <Label htmlFor="difficulty" className="text-sm font-medium text-foreground">
              Difficulty
            </Label>
            <Select 
              value={gameSettings.difficulty} 
              onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                setGameSettings(prev => ({ ...prev, difficulty: value }))
              }
            >
              <SelectTrigger data-testid="select-difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy (1-10)</SelectItem>
                <SelectItem value="medium">Medium (1-12)</SelectItem>
                <SelectItem value="hard">Hard (1-20)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tables Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="min-table" className="text-sm font-medium text-foreground">
                Min Table
              </Label>
              <Select 
                value={gameSettings.minTable.toString()} 
                onValueChange={(value) => {
                  const newMin = parseInt(value);
                  setGameSettings(prev => ({ 
                    ...prev, 
                    minTable: newMin,
                    maxTable: Math.max(newMin, prev.maxTable)
                  }));
                }}
              >
                <SelectTrigger data-testid="select-min-table">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 19 }, (_, i) => i + 2).map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-table" className="text-sm font-medium text-foreground">
                Max Table
              </Label>
              <Select 
                value={gameSettings.maxTable.toString()} 
                onValueChange={(value) => {
                  const newMax = parseInt(value);
                  setGameSettings(prev => ({ 
                    ...prev, 
                    maxTable: newMax,
                    minTable: Math.min(prev.minTable, newMax)
                  }));
                }}
              >
                <SelectTrigger data-testid="select-max-table">
                  <SelectValue placeholder="Max" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 19 }, (_, i) => i + 2).map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Game Options */}
      <div className="space-y-4">
        {/* Single Player Button */}
        <Button
          onClick={handleSinglePlayer}
          className="w-full py-6 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          disabled={isLoading}
          data-testid="button-single-player"
        >
          <Zap className="w-5 h-5 mr-2" />
          {isLoading ? "Starting..." : `Play Solo (${gameSettings.mode === 'time' ? `${gameSettings.timeLimitSec}s` : gameSettings.mode === 'target' ? `${gameSettings.targetScore} pts` : 'Endless'})`} 
        </Button>

        {/* Create Room Button */}
        <Button
          onClick={handleCreateRoom}
          variant="outline"
          className="w-full py-6 rounded-xl font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
          disabled={isLoading}
          data-testid="button-create-room"
        >
          <Users className="w-5 h-5 mr-2" />
          {isLoading ? "Creating..." : `Create Room (${gameSettings.mode === 'time' ? `${gameSettings.timeLimitSec}s` : gameSettings.mode === 'target' ? `${gameSettings.targetScore} pts` : 'Endless'})`}
        </Button>

        {/* Join Room Toggle */}
        {!showJoinForm ? (
          <Button
            onClick={() => setShowJoinForm(true)}
            variant="ghost"
            className="w-full py-4 text-muted-foreground hover:text-foreground"
            data-testid="button-show-join"
          >
            <GamepadIcon className="w-4 h-4 mr-2" />
            Join Existing Room
          </Button>
        ) : (
          <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Join Room</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowJoinForm(false)}
                data-testid="button-cancel-join"
              >
                Cancel
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-id" className="text-sm font-medium text-foreground">
                Room ID
              </Label>
              <Input
                id="room-id"
                type="text"
                placeholder="Enter room ID (e.g. ABC123)"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                data-testid="input-room-id"
              />
            </div>
            <Button
              onClick={handleJoinRoom}
              className="w-full py-3 gradient-secondary text-secondary-foreground font-semibold rounded-xl"
              disabled={isLoading}
              data-testid="button-join-room"
            >
              {isLoading ? "Joining..." : "Join Room"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
