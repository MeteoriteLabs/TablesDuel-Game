import { motion } from "framer-motion";
import { useGameState } from "@/lib/game-state";
import { formatQuestion } from "@/lib/question-generator";

interface QuestionCardProps {
  isCorrect?: boolean | null;
}

export function QuestionCard({ isCorrect }: QuestionCardProps) {
  const { currentQuestion, questionIndex, currentAnswer, settings } = useGameState();

  if (!currentQuestion) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-xl text-center space-y-6 min-h-[200px] flex flex-col justify-center">
        <div className="text-lg text-muted-foreground">Loading question...</div>
      </div>
    );
  }

  const totalQuestions = settings.mode === "target" ? settings.targetScore : "∞";

  return (
    <motion.div
      className="bg-card rounded-2xl p-8 shadow-xl text-center space-y-6 min-h-[200px] flex flex-col justify-center"
      animate={
        isCorrect === true
          ? { scale: [1, 1.05, 1] }
          : isCorrect === false
          ? { x: [-8, 8, -8, 8, 0] }
          : {}
      }
      transition={{ duration: 0.5 }}
      data-testid="card-question"
    >
      <div className="space-y-4">
        <div className="text-4xl font-bold text-foreground" data-testid="text-question">
          {formatQuestion(currentQuestion)}
        </div>
        <div className="text-sm text-muted-foreground">
          Question <span data-testid="text-question-index">{questionIndex + 1}</span> of{" "}
          <span data-testid="text-total-questions">{totalQuestions}</span>
        </div>
      </div>

      {/* Answer Input Display */}
      <div className="flex items-center justify-center">
        <div 
          className="text-3xl font-bold text-primary bg-primary/10 rounded-lg py-3 px-6 min-w-[120px]"
          data-testid="text-current-answer"
        >
          {currentAnswer || "0"}
        </div>
      </div>
    </motion.div>
  );
}
