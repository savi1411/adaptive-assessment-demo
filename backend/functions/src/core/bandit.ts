import { FieldValue } from "./firebase";

/** Documento salvo no Firestore */
export interface SkillDoc {
  alpha: number; // acertos + 1
  beta: number;  // erros + 1
  p: number;     // alpha / (alpha + beta)
  updatedAt?: FirebaseFirestore.FieldValue;
}

/** Contador simples usado só em memória */
export type SkillCounts = { hit: number; miss: number };

/** Atualiza os parâmetros da distribuição Beta com base na resposta */
export function updateBandit(
  prev: SkillDoc | undefined,
  correct: boolean
): SkillDoc {
  const a = prev?.alpha ?? 1;
  const b = prev?.beta ?? 1;
  const alpha = correct ? a + 1 : a;
  const beta = correct ? b : b + 1;

  return {
    alpha,
    beta,
    p: alpha / (alpha + beta),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

/** Converte SkillDoc em contadores simples (sem offset de +1) */
export const toCounts = (d: SkillDoc): SkillCounts => ({
  hit: d.alpha - 1,
  miss: d.beta - 1,
});

/** Calcula acurácia */
const accuracy = (c: SkillCounts) => c.hit / (c.hit + c.miss || 1);

/**
 * Escolhe a próxima habilidade a ser praticada.
 * - Prioriza habilidades com poucos dados (< MIN_ATTEMPTS)
 * - Caso contrário, escolhe a de menor acurácia
 */
export function pickNextSkill(
  stats: Record<string, SkillCounts>,
  allSkills: string[],
  MIN_ATTEMPTS = 3
): string {
  // Usuário novo
  if (Object.keys(stats).length === 0) {
    return allSkills[Math.floor(Math.random() * allSkills.length)];
  }

  // A) Skills com poucas tentativas
  const under = allSkills
    .map(skill => [skill, stats[skill] ?? { hit: 0, miss: 0 }] as const)
    .filter(([, c]) => c.hit + c.miss < MIN_ATTEMPTS);

  if (under.length > 0) {
    const min = Math.min(...under.map(([, c]) => c.hit + c.miss));
    const pool = under.filter(([, c]) => c.hit + c.miss === min);
    return pool[Math.floor(Math.random() * pool.length)][0];
  }

  // B) Skill com pior acurácia
  const sorted = allSkills
    .map(skill => [skill, stats[skill] ?? { hit: 0, miss: 0 }] as const)
    .sort((a, b) => accuracy(a[1]) - accuracy(b[1]));

  return sorted[0][0];
}

/**
 * Verifica se a precisão (desvio padrão da Beta) está abaixo de um limite
 * Indica se a fase diagnóstica pode ser considerada encerrada
 */
export function banditPrecisionOK(
  sk: Record<string, SkillDoc>,
  MAX_SD = 0.10  // ← relaxado (antes era 0.08)
): boolean {
  return Object.values(sk).every(({ alpha, beta }) => {
    const v = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    return Math.sqrt(v) < MAX_SD;
  });
}