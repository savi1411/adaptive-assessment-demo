// functions/src/routes/next.ts
import { Request, Response } from "express";
import { getNextSkillAndContent } from "../core/nextSkillSelector";

export async function next(req: Request, res: Response) {
  try {
    const { userId, currentId, mode } = req.body as {
      userId?: string;
      currentId?: string | null;
      mode?: "diagnostic" | "training";
    };

    if (!userId) {
      res.status(400).json({ message: "Parâmetro 'userId' ausente" });
      return;
    }

    const result = await getNextSkillAndContent(userId, currentId, mode ?? "diagnostic");

    if (!result) {
      res.status(404).json({ message: "Nenhum item disponível ou diagnóstico concluído" });
      return;
    }

    res.json({ nextContentId: result.contentId, skill: result.skill });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}