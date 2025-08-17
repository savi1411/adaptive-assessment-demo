// functions/src/core/summary.ts
export type Bucket = "strong" | "neutral" | "weak";
export type SkillCounts = { hit: number; miss: number };

const MIN_EVIDENCE = 4;
const SD_CUTOFF = 0.10;
const REL_GAP = 0.15;

function betaStdDev(hit: number, miss: number) {
  const a = hit + 1, b = miss + 1, s = a + b;
  return Math.sqrt((a*b) / (s*s*(s+1)));
}
function acc(hit: number, miss: number) {
  const t = hit + miss; return t ? hit / t : 0;
}

export function classifyOne(c: SkillCounts): Bucket {
  const attempts = c.hit + c.miss;
  if (attempts === 0) return "neutral";
  if (attempts < MIN_EVIDENCE) return "neutral";
  if (betaStdDev(c.hit, c.miss) > SD_CUTOFF) return "neutral";

  const a = acc(c.hit, c.miss);
  if (a >= 0.75) return "strong";
  if (a <= 0.45) return "weak";
  return "neutral";
}

export function buildSummary(counts: Record<string, SkillCounts>) {
  const strong: string[] = [], neutral: string[] = [], weak: string[] = [];
  const accMap: Record<string, number> = {};

  for (const [skill, c] of Object.entries(counts)) {
    accMap[skill] = acc(c.hit, c.miss);
    const b = classifyOne(c);
    (b === "strong" ? strong : b === "weak" ? weak : neutral).push(skill);
  }

  // fallback relativo: só se todos neutros
  if (strong.length === 0 && weak.length === 0 && Object.keys(counts).length >= 2) {
    const vals = Object.entries(counts).map(([skill, c]) => ({
      skill, a: accMap[skill], attempts: c.hit + c.miss
    }));
    const maxA = Math.max(...vals.map(v => v.a));
    const minA = Math.min(...vals.map(v => v.a));
    if (maxA - minA >= REL_GAP) {
      const top = vals.filter(v => Math.abs(v.a - maxA) < 1e-9 && v.attempts >= MIN_EVIDENCE).map(v => v.skill);
      const bot = vals.filter(v => Math.abs(v.a - minA) < 1e-9 && v.attempts >= MIN_EVIDENCE).map(v => v.skill);
      const rest = vals.map(v => v.skill).filter(s => !top.includes(s) && !bot.includes(s));
      return { strong: top, neutral: rest, weak: bot, acc: accMap };
    }
  }
  return { strong, neutral, weak, acc: accMap };
}