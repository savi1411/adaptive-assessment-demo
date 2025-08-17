export const skillLabel = (id: string) =>
  ({
    ai_fundamentals: "Fundamentos de IA",
    genai: "IA Generativa",
    ml: "Aprendizado de Máquina",
  } as Record<string, string>)[id] ?? id;
  