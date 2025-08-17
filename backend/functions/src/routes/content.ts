import express from "express";
import { db } from "../core/firebase";

const router = express.Router();

// GET /content/:id → retorna o conteúdo completo da questão com esse ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = db.collection("adaptive_contents").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Content not found" });
    }

    return res.json(doc.data());
  } catch (error) {
    console.error("❌ Erro ao buscar conteúdo:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;