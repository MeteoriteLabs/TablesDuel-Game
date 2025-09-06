import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Loader2 } from "lucide-react";
import { useGameState } from "@/lib/game-state";
import { socketManager } from "@/lib/socket";

interface JoinPageProps {
  roomId: string;
}

export function JoinPage({ roomId }: JoinPageProps) {
  const {
    playerName,
    setPlayerName,
    setGameMode,
    setGameStatus,
    setRoomId,
    setPlayerId,
    resetGame,
  } = useGameState();

  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
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
        roomId: roomId.toUpperCase(),
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
        <div className="w-20 h-20 gradient-primary rounded-2xl mx-auto flex items-center justify-between mb-6">
          <span className="text-4xl text-primary-foreground font-bold">×</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground">Join Multiplayer Game</h2>
        <p className="text-muted-foreground">
          You're joining room <span className="font-semibold text-primary">{roomId}</span>
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
            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            data-testid="input-player-name"
            autoFocus
          />
        </div>
      </div>

      {/* Join Button */}
      <Button
        onClick={handleJoinRoom}
        className="w-full py-6 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
        disabled={isLoading}
        data-testid="button-join-room"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Joining Room...
          </>
        ) : (
          <>
            <Users className="w-5 h-5 mr-2" />
            Join Multiplayer Room
          </>
        )}
      </Button>
    </div>
  );
}