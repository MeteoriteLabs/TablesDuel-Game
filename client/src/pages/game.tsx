import { useEffect, useState } from "react";
import { GameHUD } from "@/components/game-hud";
import { QuestionCard } from "@/components/question-card";
import { Keypad } from "@/components/keypad";
import { ToastNotifications, useToastManager } from "@/components/toast-notifications";
import { useGameState } from "@/lib/game-state";
import { socketManager } from "@/lib/socket";
import { generateQuestions, getCorrectAnswer } from "@/lib/question-generator";

export default function Game() {
  const {
    gameMode,
    settings,
    currentQuestion,
    currentAnswer,
    questionIndex,
    timeRemaining,
    score,
    streak,
    playerId,
    setCurrentQuestion,
    setQuestionIndex,
    setCurrentAnswer,
    setTimeRemaining,
    setScore,
    setStreak,
    setPlayers,
    incrementCorrectAnswers,
    incrementTotalAnswers,
    setGameStatus,
  } = useGameState();

  const { toasts, addToast, removeToast } = useToastManager();
  const [questionGenerator, setQuestionGenerator] = useState<Generator<any> | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<boolean | null>(null);

  // Initialize single-player question generator
  useEffect(() => {
    if (gameMode === "1-player" && !questionGenerator) {
      const seed = Date.now() % 100000;
      const gen = generateQuestions(settings, seed);
      setQuestionGenerator(gen);
    }
  }, [gameMode, settings, questionGenerator]);

  // Start timer for single-player mode
  useEffect(() => {
    if (gameMode === "1-player" && settings.mode === "time" && timeRemaining === null) {
      setTimeRemaining(settings.timeLimitSec || 60);
    }
  }, [gameMode, settings, timeRemaining, setTimeRemaining]);

  // Timer countdown for single-player
  useEffect(() => {
    if (gameMode === "1-player" && timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      setGameStatus("completed");
    }
  }, [gameMode, timeRemaining, setTimeRemaining, setGameStatus]);

  const getDifficultyPoints = () => {
    switch (settings.difficulty) {
      case "easy": return 1;
      case "medium": return 2;
      case "hard": return 3;
      default: return 2;
    }
  };

  // WebSocket listeners for multiplayer
  useEffect(() => {
    if (gameMode === "2-player") {
      const handleAnswerResult = (data: any) => {
        setAnswerFeedback(data.correct);
        setTimeout(() => setAnswerFeedback(null), 600);

        if (data.correct) {
          addToast("success", `Correct! +${getDifficultyPoints()} points`);
          incrementCorrectAnswers();
        } else {
          addToast("error", "Try again!");
        }

        incrementTotalAnswers();
        setCurrentAnswer("");
      };

      const handleGameUpdate = (data: any) => {
        if (data.question) setCurrentQuestion(data.question);
        if (data.questionIndex !== undefined) setQuestionIndex(data.questionIndex);
        if (data.scores && playerId && data.scores[playerId] !== undefined) {
          setScore(data.scores[playerId]);
        }
        if (data.streaks && playerId && data.streaks[playerId] !== undefined) {
          setStreak(data.streaks[playerId]);
        }
        if (data.timeRemaining !== undefined) setTimeRemaining(data.timeRemaining);
      };

      const handleGameEnd = (data: any) => {
        // Update players with final scores from leaderboard
        if (data.leaderboard && data.leaderboard.length > 0) {
          setPlayers(data.leaderboard);
        }
        setGameStatus("completed");
      };

      socketManager.on("answer:result", handleAnswerResult);
      socketManager.on("game:update", handleGameUpdate);
      socketManager.on("game:end", handleGameEnd);

      return () => {
        socketManager.off("answer:result", handleAnswerResult);
        socketManager.off("game:update", handleGameUpdate);
        socketManager.off("game:end", handleGameEnd);
      };
    }
  }, [gameMode, playerId, setCurrentQuestion, setQuestionIndex, setScore, setStreak, setTimeRemaining, setGameStatus, addToast, incrementCorrectAnswers, incrementTotalAnswers, setCurrentAnswer]);

  const handleAnswerResult = (correct: boolean) => {
    setAnswerFeedback(correct);
    setTimeout(() => setAnswerFeedback(null), 600);

    if (correct) {
      addToast("success", `Correct! +${getDifficultyPoints()} points`);
      incrementCorrectAnswers();
    } else {
      addToast("error", "Try again!");
    }

    incrementTotalAnswers();
    setCurrentAnswer("");
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !currentAnswer) return;

    const answer = parseInt(currentAnswer);
    
    if (gameMode === "1-player") {
      // Single-player logic
      const correctAnswer = getCorrectAnswer(currentQuestion);
      const isCorrect = answer === correctAnswer;

      handleAnswerResult(isCorrect);

      if (isCorrect) {
        const points = getDifficultyPoints();
        setScore(score + points);
        setStreak(streak + 1);

        // Streak bonus
        if ((streak + 1) % 5 === 0) {
          setScore(score + points + 2);
          addToast("streak", "5 streak! Bonus points!");
        }
      } else {
        setStreak(0);
      }

      // Generate next question
      if (questionGenerator) {
        const nextQuestion = questionGenerator.next().value;
        setCurrentQuestion(nextQuestion);
        setQuestionIndex(questionIndex + 1);
      }

      // Check win conditions
      if (settings.mode === "target" && score >= (settings.targetScore || 20)) {
        setGameStatus("completed");
      }
    } else {
      // Multiplayer logic - send to server
      socketManager.send("answer:submit", { answer });
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key >= "0" && event.key <= "9") {
      const num = event.key;
      if (currentAnswer === "0" || currentAnswer === "") {
        setCurrentAnswer(num);
      } else {
        setCurrentAnswer(currentAnswer + num);
      }
    } else if (event.key === "Backspace") {
      setCurrentAnswer(currentAnswer.slice(0, -1));
    } else if (event.key === "Enter") {
      handleSubmitAnswer();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentAnswer, handleSubmitAnswer]);

  if (!currentQuestion) {
    return (
      <div className="space-y-4 pt-4">
        <div className="text-center py-8">
          <div className="text-lg text-muted-foreground">Loading game...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <GameHUD />
      <QuestionCard isCorrect={answerFeedback} />
      <Keypad onSubmit={handleSubmitAnswer} />
      <ToastNotifications toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
