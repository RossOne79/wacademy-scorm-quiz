
export enum Step {
  Upload = 1,
  Generate = 2,
  Package = 3,
}

export enum QuestionType {
  MCQ = "mcq",
  TrueFalse = "true_false",
  ShortAnswer = "short_answer",
}

export enum Difficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard",
}

export enum CognitiveLevel {
  Recall = "recall",
  Understand = "understand",
  Apply = "apply",
}

export interface MCQChoice {
  [key: string]: string;
}

export interface QuizQuestion {
  type: QuestionType;
  difficulty: Difficulty;
  cognitive_level: CognitiveLevel;
  stem: string;
  choices?: MCQChoice[];
  correct_answer: string;
  rationale_correct: string;
  rationale_incorrect?: { [key: string]: string };
  source_timestamps: [number, number][];
  tags: string[];
}

export interface SCORMSettings {
  scormVersion: "1.2" | "2004";
  courseTitle: string;
  numQuestions: 5 | 10 | 15 | 20;
  randomizeOrder: boolean;
  passingScore: number;
  attemptLimit: number; // 0 for unlimited
  showVideoControls: boolean; // Mostra/nascondi controlli video nativi
}

export interface VideoData {
  file: File;
  url: string;
  thumbnail: string;
  duration: number;
}
   