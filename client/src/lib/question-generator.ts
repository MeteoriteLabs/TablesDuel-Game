import { Question, GameSettings } from "@shared/schema";

export function* generateQuestions(settings: GameSettings, seed: number): Generator<Question> {
  let s = seed || 1;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  
  const { minTable, maxTable, difficulty } = settings;
  const bCap = difficulty === "easy" ? 10 : difficulty === "hard" ? 20 : 12;

  let index = 0;
  while (true) {
    const a = Math.floor(rnd() * (maxTable - minTable + 1)) + minTable;
    const b = Math.floor(rnd() * bCap) + 1;
    const c = a * b;
    
    const r = rnd();
    const variant = r < 0.7 ? "axb=?" : r < 0.85 ? "?xb=c" : "ax?=c";
    
    yield { index: index++, a, b, c, variant } as Question;
  }
}

export function formatQuestion(question: Question): string {
  switch (question.variant) {
    case "axb=?":
      return `${question.a} × ${question.b} = ?`;
    case "?xb=c":
      return `? × ${question.b} = ${question.c}`;
    case "ax?=c":
      return `${question.a} × ? = ${question.c}`;
    default:
      return "";
  }
}

export function getCorrectAnswer(question: Question): number {
  switch (question.variant) {
    case "axb=?":
      return question.c;
    case "?xb=c":
      return question.a;
    case "ax?=c":
      return question.b;
    default:
      return 0;
  }
}
