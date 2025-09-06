import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Zap, GamepadIcon } from "lucide-react";
import { useGameState } from "@/lib/game-state";
import { socketManager } from "@/lib/socket";
import { generateQuestions } from "@/lib/question-generator";

export function LandingForm() {
  const {
    playerName,
    roomId,
    setPlayerName,
    setGameMode,
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
      const defaultSettings = {
        mode: 'time' as const,
        timeLimitSec: 60,
        targetScore: 20,
        minTable: 2,
        maxTable: 12,
        difficulty: 'medium' as const
      };
      
      const questionGen = generateQuestions(defaultSettings, Date.now() % 100000);
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
    setGameMode('2-player');

    try {
      await socketManager.connect();
      
      socketManager.on("room:created", (data) => {
        setRoomId(data.roomId);
        setPlayerId(data.playerId);
        setGameStatus("lobby");
      });
      
      const defaultSettings = {
        mode: 'time' as const,
        timeLimitSec: 60,
        targetScore: 20,
        minTable: 2,
        maxTable: 12,
        difficulty: 'medium' as const
      };
      
      socketManager.send("room:create", {
        playerName: playerName.trim(),
        settings: defaultSettings,
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
    setGameMode('2-player');

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
          {isLoading ? "Starting..." : "Play Solo (60s Challenge)"} 
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
          {isLoading ? "Creating..." : "Create Multiplayer Room"}
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
