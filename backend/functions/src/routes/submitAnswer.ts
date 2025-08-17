// functions/src/routes/submitAnswer.ts
import { Request, Response } from "express";
import { db } from "../core/firebase";
import { updateBandit, SkillDoc } from "../core/bandit";
import * as admin from "firebase-admin";
import { buildSummary } from "../core/summary";

/** Skills-alvo do diagnóstico (mova para config/DB quando quiser) */
const REQUIRED_SKILLS = ["cf_art1", "cf_art5", "cf_art37"] as const;

/** Parâmetros de parada do diagnóstico */
const MIN_ATTEMPTS_PER_SKILL = 6;   // de 3 -> 6
const MAX_SD_FOR_STOP = 0.17;       // de 0.10 -> 0.17
const MAX_QUESTIONS_DIAG = 21;      // teto de segurança

/** Limiar de classificação pedagógica */
const STRONG_MIN = 0.80;
const WEAK_MAX   = 0.50;

function betaStdDev(a: number, b: number) {
  const s = a + b;
  return Math.sqrt((a * b) / (s * s * (s + 1)));
}

export async function submitAnswer(req: Request, res: Response) {
  try {
    const {
      userId,
      contentId,
      skill,
      isCorrect,
      correct,
      mode,
    } = req.body as {
      userId?: string;
      contentId?: string;
      skill?: string;
      isCorrect?: boolean;
      correct?: boolean;
      mode?: "diagnostic" | "training";
    };

    const ok =
      typeof isCorrect === "boolean"
        ? isCorrect
        : typeof correct === "boolean"
        ? correct
        : undefined;

    if (!userId || !contentId || !skill || typeof ok !== "boolean") {
      return res.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const effectiveMode = mode ?? "diagnostic";

    // 1) Marca servido e resposta
    await db.doc(`users/${userId}/served/${contentId}`).set(
      { servedAt: now, skill, mode: effectiveMode },
      { merge: true }
    );
    await db.doc(`users/${userId}/answers/${contentId}`).set(
      { skill, isCorrect: ok, answeredAt: now, mode: effectiveMode },
      { merge: true }
    );

    // 2) Atualiza Beta
    const profRef = db.doc(`users/${userId}/proficiency/${skill}`);
    const prevSnap = await profRef.get();
    const prev = prevSnap.exists ? (prevSnap.data() as SkillDoc) : undefined;
    const updated = updateBandit(prev, ok);
    await profRef.set(updated, { merge: true });

    // 3) Regras de parada – prioriza PRECISION; maxQuestions é fallback
    let diagnosticDone = false as boolean;
    let diagnosticReason: "precisionOK" | "maxQuestions" | undefined;

    if (effectiveMode === "diagnostic") {
      // 3a) teto de segurança (conta só itens do diagnóstico)
      const servedDiagSnap = await db
        .collection(`users/${userId}/served`)
        .where("mode", "==", "diagnostic")
        .get();
      const totalDiagServed = servedDiagSnap.size;

      // 3b) precisão considerando TODAS as REQUIRED_SKILLS
      const profSnap = await db.collection(`users/${userId}/proficiency`).get();
      const betaById = new Map<string, SkillDoc>();
      profSnap.forEach((d) => betaById.set(d.id, d.data() as SkillDoc));

      // cobertura mínima por skill (usa REQUIRED_SKILLS; se não houver doc, conta 0)
      const coverageOK = REQUIRED_SKILLS.every((sk) => {
        const s = betaById.get(sk);
        const attempts = (s?.alpha ?? 1) + (s?.beta ?? 1) - 2;
        return attempts >= MIN_ATTEMPTS_PER_SKILL;
      });

      // precisão por skill (usa REQUIRED_SKILLS)
      const precisionOK = REQUIRED_SKILLS.every((sk) => {
        const s = betaById.get(sk);
        const a = (s?.alpha ?? 1);
        const b = (s?.beta  ?? 1);
        return betaStdDev(a, b) <= MAX_SD_FOR_STOP;
      });

      if (coverageOK && precisionOK) {
        diagnosticDone = true;
        diagnosticReason = "precisionOK";
      } else if (totalDiagServed >= MAX_QUESTIONS_DIAG) {
        diagnosticDone = true;
        diagnosticReason = "maxQuestions";
      }

      // Se terminou: grava flag + retorna resumo pronto + métricas
      if (diagnosticDone) {
        await db.doc(`users/${userId}`).set(
          {
            diagnosticDone: true,
            diagnosticEndedAt: now,
            diagnosticReason,
          },
          { merge: true }
        );

        // monta counts/acc por skill garantindo presença de todas REQUIRED_SKILLS
        const counts: Record<string, { hit: number; miss: number }> = {};
        for (const sk of REQUIRED_SKILLS) {
          const s = betaById.get(sk);
          const hit = (s?.alpha ?? 1) - 1;
          const miss = (s?.beta ?? 1) - 1;
          counts[sk] = { hit: Math.max(0, hit), miss: Math.max(0, miss) };
        }

        // mapa de acurácia
        const acc: Record<string, number> = {};
        for (const [k, c] of Object.entries(counts)) {
          const tot = c.hit + c.miss;
          acc[k] = tot ? c.hit / tot : 0;
        }

        // classificação server-side por limiares absolutos
        const strong: string[] = [];
        const weak: string[] = [];
        const neutral: string[] = [];
        for (const [k, a] of Object.entries(acc)) {
          if (a >= STRONG_MIN) strong.push(k);
          else if (a <= WEAK_MAX) weak.push(k);
          else neutral.push(k);
        }

        // Se nada cair em strong/weak (empate), use fallback relativo
        const summary =
          strong.length || weak.length
            ? { strong, neutral, weak }
            : buildSummary(counts);

        return res.status(200).json({
          success: true,
          diagnosticDone: true,
          diagnosticReason,
          summary,
          acc,
          metrics: {
            served: totalDiagServed,
            thresholds: {
              minAttemptsPerSkill: MIN_ATTEMPTS_PER_SKILL,
              maxStdDev: MAX_SD_FOR_STOP,
              maxQuestions: MAX_QUESTIONS_DIAG,
              strongMin: STRONG_MIN,
              weakMax: WEAK_MAX,
            },
          },
        });
      }
    }

    // 4) compat legado agregado
    const legacyRef = db.collection("adaptive_responses").doc(userId);
    const legacyDoc = await legacyRef.get();
    const curr = legacyDoc.exists ? legacyDoc.data() : {};
    const skillAgg =
      (curr?.[skill] as { hit: number; miss: number } | undefined) ?? { hit: 0, miss: 0 };
    await legacyRef.set(
      {
        [skill]: {
          hit: skillAgg.hit + (ok ? 1 : 0),
          miss: skillAgg.miss + (!ok ? 1 : 0),
        },
        lastUpdated: now,
        lastContentId: contentId,
      },
      { merge: true }
    );

    return res.status(200).json({ success: true, diagnosticDone: false });
  } catch (err) {
    console.error("Erro ao registrar resposta:", err);
    return res.status(500).json({ error: "Erro interno ao salvar resposta." });
  }
}