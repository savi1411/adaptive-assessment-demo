export type Question = {
  id: string;
  skill: string;
  difficulty: "easy" | "medium" | "hard";
  stem: string;
  options: string[];
  answer: number;
  commentary?: string;
};