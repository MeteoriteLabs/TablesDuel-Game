import { Trophy, RotateCcw, Settings, Share2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameState } from "@/lib/game-state";
import { useToast } from "@/hooks/use-toast";

export default function Results() {
  const {
    gameMode,
    score,
    streak,
    correctAnswers,
    totalAnswers,
    players,
    playerId,
    lastQuestion,
    lastAnswer,
    lastCorrectAnswer,
    setGameStatus,
    resetGame,
  } = useGameState();

  const { toast } = useToast();

  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const avgSpeed = totalAnswers > 0 ? (60 / totalAnswers).toFixed(1) : "0.0";

  const handlePlayAgain = () => {
    resetGame();
    setGameStatus("menu");
  };

  const handleShareResult = async () => {
    const text = `I just scored ${score} points with ${accuracy}% accuracy in Tables Duel! 🎯`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tables Duel Results",
          text: text,
          url: window.location.origin,
        });
      } catch (error) {
        console.log("Share cancelled or failed");
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Result copied!",
          description: "Share your score with friends!",
        });
      } catch (error) {
        toast({
          title: "Share failed",
          description: "Unable to copy result to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  // Get leaderboard for multiplayer
  const leaderboard = gameMode === "2-player" 
    ? [...players].sort((a, b) => b.score - a.score)
    : [];

  const currentPlayerResult = leaderboard.find(p => p.id === playerId);
  const isWinner = currentPlayerResult && leaderboard[0]?.id === playerId;

  // Format the last question for solution display
  const formatQuestion = (question: any) => {
    if (!question) return null;
    
    switch (question.variant) {
      case "axb=?":
        return `${question.a} × ${question.b} = ?`;
      case "?xb=c":
        return `? × ${question.b} = ${question.c}`;
      case "ax?=c":
        return `${question.a} × ? = ${question.c}`;
      default:
        return null;
    }
  };

  const getCorrectAnswer = (question: any) => {
    if (!question) return null;
    
    switch (question.variant) {
      case "axb=?":
        return question.a * question.b;
      case "?xb=c":
        return question.c / question.b;
      case "ax?=c":
        return question.c / question.a;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pt-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 gradient-secondary rounded-2xl mx-auto flex items-center justify-center animate-bounce-in">
          <Trophy className="w-10 h-10 text-secondary-foreground" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          {gameMode === "2-player" ? (isWinner ? "You Won!" : "Good Game!") : "Great Job!"}
        </h2>
        <p className="text-muted-foreground">
          You nailed <span className="font-semibold text-success" data-testid="text-correct-answers">{correctAnswers}</span> correct 
          with <span className="font-semibold text-success" data-testid="text-accuracy">{accuracy}%</span> accuracy!
        </p>
      </div>

      {gameMode === "1-player" ? (
        // Single Player Stats
        <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-lg font-semibold text-center text-foreground">Your Performance</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary" data-testid="text-final-score">{score}</div>
              <div className="text-sm text-muted-foreground">Final Score</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-secondary" data-testid="text-best-streak">{streak}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent" data-testid="text-avg-speed">{avgSpeed}s</div>
              <div className="text-sm text-muted-foreground">Avg Speed</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-success" data-testid="text-final-accuracy">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </div>
      ) : (
        // Two Player Leaderboard
        <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-lg font-semibold text-center text-foreground">Final Scores</h3>
          
          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className={`p-4 rounded-lg ${
                  index === 0 
                    ? 'bg-primary/10 border-2 border-primary' 
                    : 'bg-muted/50'
                }`}
                data-testid={`player-result-${index}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {index === 0 ? <Trophy className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground" data-testid={`text-player-name-${index}`}>
                        {player.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {index === 0 ? "Winner!" : "Good effort!"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${index === 0 ? 'text-primary' : 'text-foreground'}`}
                         data-testid={`text-player-score-${index}`}>
                      {player.score}
                    </div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>
                
                {/* Detailed Statistics */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="font-semibold text-foreground" data-testid={`text-player-correct-${index}`}>
                      {player.correctAnswers || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Correct</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="font-semibold text-foreground" data-testid={`text-player-accuracy-${index}`}>
                      {player.accuracy || 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <div className="font-semibold text-foreground" data-testid={`text-player-total-${index}`}>
                      {player.totalAnswers || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Question Solution */}
      {lastQuestion && (
        <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2 justify-center text-lg font-semibold text-foreground">
            <BookOpen className="w-5 h-5" />
            Last Question Solution
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="text-center">
              <div className="text-lg font-mono text-foreground mb-2" data-testid="text-last-question">
                {formatQuestion(lastQuestion)}
              </div>
              <div className="text-sm text-muted-foreground">
                Your answer: <span className={`font-semibold ${
                  parseInt(lastAnswer) === getCorrectAnswer(lastQuestion) 
                    ? 'text-success' 
                    : 'text-destructive'
                }`} data-testid="text-your-answer">
                  {lastAnswer || "No answer"}
                </span>
              </div>
            </div>
            
            <div className="border-t border-border pt-3 text-center">
              <div className="text-sm text-muted-foreground mb-1">Correct Answer:</div>
              <div className="text-2xl font-bold text-success" data-testid="text-correct-solution">
                {getCorrectAnswer(lastQuestion)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handlePlayAgain}
          className="w-full py-4 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          data-testid="button-play-again"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Play Again
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handlePlayAgain}
            className="py-3 px-4 rounded-lg font-medium"
            data-testid="button-change-settings"
          >
            <Settings className="w-4 h-4 mr-2" />
            Change Settings
          </Button>
          <Button
            variant="outline"
            onClick={handleShareResult}
            className="py-3 px-4 rounded-lg font-medium"
            data-testid="button-share-result"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Result
          </Button>
        </div>
      </div>
    </div>
  );
}
