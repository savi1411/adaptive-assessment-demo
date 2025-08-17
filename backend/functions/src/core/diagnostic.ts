// core/diagnostic.ts
import { db } from "./firebase";
import { banditPrecisionOK, SkillDoc } from "./bandit";

export async function checkIfDiagnosticIsDone(userId: string): Promise<{ diagnosticDone: boolean; reason: string }> {
  // A) Lê a distribuição Beta atual
  const profSnap = await db.collection(`users/${userId}/proficiency`).get();
  const skills: Record<string, SkillDoc> = {};
  profSnap.forEach(d => skills[d.id] = d.data() as SkillDoc);

  // B) Verifica precisão
  const precisionOK = banditPrecisionOK(skills);
  if (precisionOK) {
    await db.doc(`users/${userId}`).update({ diagnosticDone: true });
    return { diagnosticDone: true, reason: "precisionOK" };
  }

  // C) Verifica se todas as questões já foram servidas
  const servedSnap = await db.collection(`users/${userId}/served`).get();
  const servedIds = new Set(servedSnap.docs.map(d => d.id));

  let allSeen = true;
  for (const skill of Object.keys(skills)) {
    const snap = await db.collection("adaptive_contents")
      .where("skill", "==", skill)
      .get();

    const unseen = snap.docs.filter(doc => !servedIds.has(doc.id));
    if (unseen.length > 0) {
      allSeen = false;
      break;
    }
  }

  if (allSeen) {
    await db.doc(`users/${userId}`).update({ diagnosticDone: true });
    return { diagnosticDone: true, reason: "noUnseenItems" };
  }

  return { diagnosticDone: false, reason: "incomplete" };
}