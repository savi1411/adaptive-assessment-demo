// functions/src/core/nextSkillSelector.ts
import { db } from "./firebase";
import { SkillDoc, SkillCounts, toCounts, pickNextSkill } from "./bandit";
import { REQUIRED_SKILLS } from "../core/config";

type Mode = "diagnostic" | "training";

/** fallback para usuário novo = mesmas skills obrigatórias */
const SKILLS_FALLBACK = REQUIRED_SKILLS;

/** Política de treino (repetição controlada) */
const TRAINING_POLICY = {
  minHoursBeforeRepeat: 24,
  recentBufferSize: 10,
};

/** Cobertura mínima por skill ANTES da exploração (casado com submitAnswer) */
const MIN_ATTEMPTS_PER_SKILL = 6;

export async function getNextSkillAndContent(
  userId: string,
  currentId?: string | null,
  mode: Mode = "diagnostic"
): Promise<{ skill: string; contentId: string } | null> {
  console.log("📥 [getNextSkillAndContent]", { userId, currentId, mode });

  // trava de conclusão para modo diagnóstico
  const userRef = db.doc(`users/${userId}`);
  const userDoc = await userRef.get();
  if (userDoc.exists && userDoc.data()?.diagnosticDone && mode === "diagnostic") {
    console.log("✅ Diagnóstico já concluído para este usuário");
    return null;
  }

  // proficiência → contadores
  const profSnap = await db.collection(`users/${userId}/proficiency`).get();
  const skillsRaw: Record<string, SkillDoc> = {};
  profSnap.forEach((d) => (skillsRaw[d.id] = d.data() as SkillDoc));

  const skills: Record<string, SkillCounts> = {};
  for (const [k, v] of Object.entries(skillsRaw)) skills[k] = toCounts(v);

  // união: REQUIRED_SKILLS (garante cobertura) + o que já existe na proficiência
  const profSkills = Object.keys(skills);
  const allSkills = Array.from(new Set([...REQUIRED_SKILLS, ...profSkills, ...SKILLS_FALLBACK]));
  if (allSkills.length === 0) {
    console.log("⚠️ Nenhuma skill disponível.");
    return null;
  }

  // já vistos / respondidos
  const servedSnap = await db.collection(`users/${userId}/served`).get();
  const servedIds = new Set(servedSnap.docs.map((d) => d.id));
  if (currentId) servedIds.add(currentId);

  const answersSnap = await db.collection(`users/${userId}/answers`).get();
  const answeredIds = new Set(answersSnap.docs.map((d) => d.id));

  // política por modo
  let mustExclude: Set<string>;
  if (mode === "diagnostic") {
    // zero repetição no diagnóstico
    mustExclude = new Set<string>([...servedIds, ...answeredIds]);
  } else {
    // training: permitir repetição com regras
    mustExclude = new Set<string>();

    // buffer recente
    const recentServed = servedSnap.docs
      .sort((a, b) => {
        const ta =
          a.get("servedAt")?.toDate?.()?.getTime?.() ??
          a.updateTime?.toDate?.()?.getTime?.() ??
          a.createTime?.toDate?.()?.getTime?.() ??
          0;
        const tb =
          b.get("servedAt")?.toDate?.()?.getTime?.() ??
          b.updateTime?.toDate?.()?.getTime?.() ??
          b.createTime?.toDate?.()?.getTime?.() ??
          0;
        return tb - ta;
      })
      .slice(0, TRAINING_POLICY.recentBufferSize)
      .map((d) => d.id);
    recentServed.forEach((id) => mustExclude.add(id));

    // não repetir antes de X horas
    const cutoff = Date.now() - TRAINING_POLICY.minHoursBeforeRepeat * 3600 * 1000;
    answersSnap.docs.forEach((doc) => {
      const ts =
        doc.get("answeredAt")?.toDate?.()?.getTime?.() ??
        doc.updateTime?.toDate?.()?.getTime?.() ??
        doc.createTime?.toDate?.()?.getTime?.() ??
        0;
      if (ts > cutoff) mustExclude.add(doc.id);
    });
  }

  // 🎯 Fase 1: COBERTURA MÍNIMA por skill (round-robin com prioridade a quem tem menos tentativas)
  const countsBySkill: Record<string, number> = {};
  allSkills.forEach((s) => {
    const k = skills[s] ?? { hit: 0, miss: 0 };
    countsBySkill[s] = (k.hit ?? 0) + (k.miss ?? 0);
  });

  // prioriza quem ainda não atingiu MIN_ATTEMPTS_PER_SKILL, ordenando por menos tentativas
  const pendingCoverage = allSkills
    .filter((s) => (countsBySkill[s] ?? 0) < MIN_ATTEMPTS_PER_SKILL)
    .sort((a, b) => (countsBySkill[a] ?? 0) - (countsBySkill[b] ?? 0));

  const levels: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];

  const tryPick = async (skillList: string[]): Promise<{ skill: string; contentId: string } | null> => {
    for (const skill of skillList) {
      for (const level of levels) {
        const snap = await db
          .collection("adaptive_contents")
          .where("skill", "==", skill)
          .where("difficulty", "==", level)
          .get();

        const candidates = snap.docs.map((d) => d.id);
        const unseen = candidates.filter((id) => !mustExclude.has(id));
        if (unseen.length > 0) {
          console.log("✅ pick", { skill, level, chosen: unseen[0], phase: pendingCoverage.length ? "coverage" : "bandit" });
          return { skill, contentId: unseen[0] };
        }
      }
    }
    return null;
  };

  if (pendingCoverage.length > 0) {
    console.log("📌 pendingCoverage", pendingCoverage.map(s => ({ skill: s, attempts: countsBySkill[s] })));
    const pickedCoverage = await tryPick(pendingCoverage);
    if (pickedCoverage) return pickedCoverage;
    // Se não achou nada para cobertura (ex.: tudo visto), tenta seguir para exploração
  }

  // 🎯 Fase 2: Exploração “bandit-like” (após cobertura mínima)
  const acc = (s: SkillCounts) => s.hit / (s.hit + s.miss || 1);
  const allSkillsSorted = [...allSkills].sort(
    (a, b) => acc(skills[a] ?? { hit: 0, miss: 0 }) - acc(skills[b] ?? { hit: 0, miss: 0 })
  );
  const bestSkill = pickNextSkill(skills, allSkills); // mantém sua estratégia de seleção
  const orderedSkills = [bestSkill, ...allSkillsSorted.filter((s) => s !== bestSkill)];

  const picked = await tryPick(orderedSkills);
  if (picked) return picked;

  console.log("❌ Nenhuma questão elegível encontrada.");
  return null;
}