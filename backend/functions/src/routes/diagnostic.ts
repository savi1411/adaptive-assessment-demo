// routes/diagnostic.ts
import { Request, Response } from "express";
import { checkIfDiagnosticIsDone } from "../core/diagnostic";

export async function diagnostic(req: Request, res: Response) {
  try {
    const { userId } = req.body as { userId?: string };

    if (!userId) {
      res.status(400).json({ message: "Parâmetro 'userId' ausente" });
      return;
    }

    const result = await checkIfDiagnosticIsDone(userId);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}