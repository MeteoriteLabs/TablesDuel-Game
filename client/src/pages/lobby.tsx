import { useEffect, useState } from "react";
import { Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareLink } from "@/components/share-link";
import { useGameState } from "@/lib/game-state";
import { socketManager } from "@/lib/socket";

export default function Lobby() {
  const { 
    players, 
    playerId, 
    setPlayers, 
    setGameStatus, 
    setCurrentQuestion, 
    setQuestionIndex 
  } = useGameState();
  
  const [allReady, setAllReady] = useState(false);

  useEffect(() => {
    // Listen for room state updates
    const handleRoomState = (data: any) => {
      setPlayers(data.players);
    };

    const handleGameStart = (data: any) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(0);
      setGameStatus("active");
    };

    socketManager.on("room:state", handleRoomState);
    socketManager.on("game:start", handleGameStart);

    return () => {
      socketManager.off("room:state", handleRoomState);
      socketManager.off("game:start", handleGameStart);
    };
  }, [setPlayers, setGameStatus, setCurrentQuestion, setQuestionIndex]);

  useEffect(() => {
    const readyPlayers = players.filter(p => p.isReady);
    setAllReady(players.length >= 2 && readyPlayers.length === players.length);
  }, [players]);

  const handleReady = () => {
    socketManager.send("player:ready", {});
  };

  const currentPlayer = players.find(p => p.id === playerId);
  const isCurrentPlayerReady = currentPlayer?.isReady || false;

  return (
    <div className="space-y-6 pt-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 gradient-secondary rounded-2xl mx-auto flex items-center justify-center">
          <Users className="w-8 h-8 text-secondary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Game Lobby</h2>
        <p className="text-muted-foreground">Share this link to invite a friend!</p>
      </div>

      <ShareLink />

      {/* Player List */}
      <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
        <h3 className="font-semibold text-foreground text-center">Players</h3>
        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.isReady 
                  ? 'bg-primary/10 border-2 border-primary' 
                  : 'bg-muted/50'
              }`}
              data-testid={`player-${index}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  player.isReady 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index === 0 ? <Crown className="w-4 h-4" /> : player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-foreground" data-testid={`text-player-name-${index}`}>
                    {player.name}
                  </div>
                  {index === 0 && <div className="text-xs text-muted-foreground">Host</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  player.isReady ? 'bg-success' : 'bg-muted-foreground'
                }`}></div>
                <span className={`text-xs font-medium ${
                  player.isReady ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {player.isReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            </div>
          ))}

          {players.length < 2 && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">?</span>
                </div>
                <span className="text-muted-foreground">Waiting for player 2...</span>
              </div>
            </div>
          )}
        </div>

        {players.length >= 1 && (
          <div className="pt-4 border-t border-border">
            {!isCurrentPlayerReady ? (
              <Button
                onClick={handleReady}
                className="w-full py-4 gradient-primary text-primary-foreground font-semibold rounded-xl"
                data-testid="button-ready"
              >
                I'm Ready!
              </Button>
            ) : allReady ? (
              <Button
                className="w-full py-4 gradient-secondary text-secondary-foreground font-semibold rounded-xl"
                disabled
                data-testid="button-starting"
              >
                Starting Game...
              </Button>
            ) : (
              <Button
                className="w-full py-4 bg-muted text-muted-foreground font-semibold rounded-xl cursor-not-allowed"
                disabled
                data-testid="button-waiting"
              >
                Waiting for All Players...
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
