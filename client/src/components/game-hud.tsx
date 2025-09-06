import { useGameState } from "@/lib/game-state";

export function GameHUD() {
  const { timeRemaining, score, streak, questionIndex } = useGameState();

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "∞";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-card rounded-xl p-3 text-center shadow-sm">
        <div className="text-xs text-muted-foreground mb-1">Time</div>
        <div 
          className={`text-xl font-bold ${timeRemaining !== null && timeRemaining <= 10 ? 'text-destructive animate-pulse-ring' : 'text-primary'}`}
          data-testid="text-time-remaining"
        >
          {formatTime(timeRemaining)}
        </div>
      </div>
      <div className="bg-card rounded-xl p-3 text-center shadow-sm">
        <div className="text-xs text-muted-foreground mb-1">Score</div>
        <div className="text-xl font-bold text-primary" data-testid="text-score">
          {score}
        </div>
      </div>
      <div className="bg-card rounded-xl p-3 text-center shadow-sm">
        <div className="text-xs text-muted-foreground mb-1">Streak</div>
        <div className="text-xl font-bold text-secondary" data-testid="text-streak">
          {streak}{streak > 0 && "🔥"}
        </div>
      </div>
    </div>
  );
}
