import { Button } from "@/components/ui/button";
import { useGameState } from "@/lib/game-state";

interface KeypadProps {
  onSubmit: () => void;
}

export function Keypad({ onSubmit }: KeypadProps) {
  const { currentAnswer, setCurrentAnswer } = useGameState();

  const inputNumber = (num: string) => {
    if (currentAnswer === "0") {
      setCurrentAnswer(num);
    } else {
      setCurrentAnswer(currentAnswer + num);
    }
  };

  const clearAnswer = () => {
    setCurrentAnswer("");
  };

  const handleSubmit = () => {
    if (currentAnswer) {
      onSubmit();
    }
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-lg">
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
          <Button
            key={num}
            variant="outline"
            onClick={() => inputNumber(num.toString())}
            className="h-14 rounded-xl font-semibold text-lg transition-all transform active:scale-95"
            data-testid={`button-number-${num}`}
          >
            {num}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="destructive"
          onClick={clearAnswer}
          className="h-14 rounded-xl font-semibold transition-all transform active:scale-95"
          data-testid="button-clear"
        >
          Clear
        </Button>
        <Button
          variant="outline"
          onClick={() => inputNumber("0")}
          className="h-14 rounded-xl font-semibold text-lg transition-all transform active:scale-95"
          data-testid="button-number-0"
        >
          0
        </Button>
        <Button
          onClick={handleSubmit}
          className="h-14 bg-success hover:bg-success/80 text-success-foreground rounded-xl font-semibold transition-all transform active:scale-95"
          disabled={!currentAnswer}
          data-testid="button-submit"
        >
          ✓
        </Button>
      </div>
    </div>
  );
}
