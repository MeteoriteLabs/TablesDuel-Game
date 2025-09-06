import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGameState } from "@/lib/game-state";
import { socketManager } from "@/lib/socket";
import { generateQuestions } from "@/lib/question-generator";

export function LandingForm() {
  const {
    playerName,
    gameMode,
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

  const handleStartGame = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsLoading(true);
    resetGame();

    try {
      if (gameMode === "1-player") {
        // Single player mode - generate questions locally
        const questionGen = generateQuestions(settings, Date.now() % 100000);
        const firstQuestion = questionGen.next().value;
        
        setCurrentQuestion(firstQuestion);
        setQuestionIndex(0);
        setGameStatus("active");
      } else {
        // Two player mode - connect to WebSocket and create room
        await socketManager.connect();
        
        // Listen for room creation response
        socketManager.on("room:created", (data) => {
          setRoomId(data.roomId);
          setPlayerId(data.playerId);
        });
        
        socketManager.send("room:create", {
          playerName: playerName.trim(),
          settings,
        });
        setGameStatus("lobby");
      }
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Failed to start game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPlay = (difficulty: "easy" | "hard") => {
    const quickSettings = {
      ...settings,
      difficulty,
      mode: "time" as const,
      timeLimitSec: 60,
    };
    setSettings(quickSettings);
    setPlayerName("Player");
    setGameMode("1-player");
    setTimeout(handleStartGame, 100);
  };

  return (
    <div className="space-y-6 pt-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 gradient-primary rounded-2xl mx-auto flex items-center justify-center mb-6">
          <span className="text-4xl text-primary-foreground font-bold">×</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground">Tables Duel</h2>
        <p className="text-muted-foreground">Master your times tables — solo or with a friend!</p>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
        {/* Player Name Input */}
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

        {/* Game Mode Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Game Mode</Label>
          <div className="bg-muted p-1 rounded-lg flex">
            <Button
              variant={gameMode === "1-player" ? "default" : "ghost"}
              className="flex-1 py-2 px-4"
              onClick={() => setGameMode("1-player")}
              data-testid="button-single-player"
            >
              1 Player
            </Button>
            <Button
              variant={gameMode === "2-player" ? "default" : "ghost"}
              className="flex-1 py-2 px-4"
              onClick={() => setGameMode("2-player")}
              data-testid="button-two-player"
            >
              2 Players
            </Button>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 gap-4">
          {/* Tables Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Tables Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={settings.minTable.toString()}
                onValueChange={(value) => setSettings({ ...settings, minTable: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-min-table">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      From {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={settings.maxTable.toString()}
                onValueChange={(value) => setSettings({ ...settings, maxTable: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-max-table">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 12, 15, 20].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      To {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Game Mode & Difficulty */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Mode</Label>
              <Select
                value={settings.mode}
                onValueChange={(value) => setSettings({ ...settings, mode: value as any })}
              >
                <SelectTrigger data-testid="select-game-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Time Attack (60s)</SelectItem>
                  <SelectItem value="target">Target Score (20 pts)</SelectItem>
                  <SelectItem value="endless">Endless</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Difficulty</Label>
              <Select
                value={settings.difficulty}
                onValueChange={(value) => setSettings({ ...settings, difficulty: value as any })}
              >
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (× up to 10)</SelectItem>
                  <SelectItem value="medium">Medium (× up to 12)</SelectItem>
                  <SelectItem value="hard">Hard (× up to 20)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStartGame}
          className="w-full py-4 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] min-h-[56px]"
          disabled={isLoading}
          data-testid="button-start-game"
        >
          {isLoading ? "Starting..." : "Start Game"}
        </Button>
      </div>

      {/* Quick Play Buttons */}
      <div className="space-y-3">
        <p className="text-center text-sm text-muted-foreground">Quick Play</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleQuickPlay("easy")}
            className="py-3 px-4 rounded-xl text-sm font-medium"
            data-testid="button-quick-play-easy"
          >
            Easy Mode
          </Button>
          <Button
            variant="outline"
            onClick={() => handleQuickPlay("hard")}
            className="py-3 px-4 rounded-xl text-sm font-medium"
            data-testid="button-quick-play-hard"
          >
            Challenge Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
