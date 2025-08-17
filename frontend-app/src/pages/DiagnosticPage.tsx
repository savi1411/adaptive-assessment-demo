import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DiagnosticQuestionCard from "../components/DiagnosticQuestionCard";
import DiagnosticComplete from "./DiagnosticComplete";
import { v4 as uuid } from "uuid";
import axios from "axios";
import { produce } from "immer";

export default function DiagnosticPage() {
  const [current, setCurrent] = useState<any | null>(null);
  const [answered, setAnswered] = useState(0);
  const [done, setDone] = useState(false);
  const uidRef = useRef<string>(uuid());
  const [acc, setAcc] = useState<Record<string, number> | null>(null);
  const uid = uidRef.current;

  const [stats, setStats] = useState<Record<string, { hit: number; miss: number }>>({});
  const [summary, setSummary] = useState<{
    strong: string[];
    neutral: string[];   // 👈 novo
    weak: string[];
  }>({
    strong: [],
    neutral: [],         // 👈 novo
    weak: [],
  });

  const BASE = process.env.REACT_APP_API_BASE!;

  const acuracia = (s: { hit: number; miss: number }) =>
    s.hit / (s.hit + s.miss || 1);

  /** Busca a próxima questão e conteúdo */
  /** Busca a próxima questão e conteúdo */
  const fetchNext = useCallback(async (): Promise<boolean> => {
    try {
      // ✅ Logs úteis para depuração
      console.log("🧪 BASE:", BASE);
      console.log("🧪 UID:", uid);
      console.log("🧪 current:", current);

      console.log("📤 Enviando para /next:", {
        userId: uid,
        currentId: current?.id ?? null,
      });

      const { data: next } = await axios.post(`${BASE}/next`, {
        userId: uid,
        currentId: current?.id ?? null,
        mode: "diagnostic",     // <- explícito
      });

      console.log("📥 Resposta de /next:", next);

      const contentId = next?.nextContentId;
      const skill = next?.skill;

      if (!contentId || !skill) {
        console.warn("⚠️ Resposta sem contentId ou skill. Encerrando diagnóstico.");
        setDone(true);
        return false;
      }

      const { data: content } = await axios.get(`${BASE}/content/${contentId}`);

      setCurrent({
        ...content,
        id: contentId,
        skill: skill,
      });

      return true;
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        console.info("✔️ diagnóstico concluído – sem itens inéditos");
        setDone(true);
      } else {
        console.error("❌ erro ao buscar próxima questão", err);
      }
      return false;
    }
  }, [current, uid, BASE]);

  useEffect(() => {
    if (!current) {
      fetchNext();
    }
  }, [current, fetchNext]);

  useEffect(() => {
    // se o backend já encerrou e mandou summary, não recalcula no cliente
    if (done && (summary.strong.length + summary.neutral.length + summary.weak.length) > 0) {
      return;
    }

    if (!done) return;

    // regra de negócios simples
    const EPS = 0.05;        // tolerância para empates (5 p.p.)
    const MIN_ATTEMPTS = 2;  // com <= 2 tentativas fica "neutro"

    const entries = Object.entries(stats); // [skill, {hit,miss}][]
    if (entries.length === 0) {
      setSummary({ strong: [], neutral: [], weak: [] });
      return;
    }
    if (entries.length === 1) {
      const only = entries[0][0];
      setSummary({ strong: [only], neutral: [], weak: [] });
      return;
    }

    // calcula acurácia e tentativas
    const rows = entries.map(([skill, s]) => {
      const attempts = s.hit + s.miss;
      const acc = acuracia(s); // já definido no seu arquivo
      return { skill, acc, attempts };
    });

    // max/min de acurácia
    const maxAcc = Math.max(...rows.map(r => r.acc));
    const minAcc = Math.min(...rows.map(r => r.acc));

    // se todas iguais => tudo neutro
    if (Math.abs(maxAcc - minAcc) < 1e-9) {
      setSummary({
        strong: [],
        neutral: rows.map(r => r.skill),
        weak: []
      });
      return;
    }

    // classifica
    const strong: string[] = [];
    const neutral: string[] = [];
    const weak: string[] = [];

    for (const r of rows) {
      // amostra muito pequena -> neutro
      if (r.attempts <= MIN_ATTEMPTS) {
        neutral.push(r.skill);
        continue;
      }
      // perto do topo -> forte
      if (maxAcc - r.acc <= EPS) {
        strong.push(r.skill);
        continue;
      }
      // perto do fundo -> fraco
      if (r.acc - minAcc <= EPS) {
        weak.push(r.skill);
        continue;
      }
      // meio do caminho -> neutro
      neutral.push(r.skill);
    }

    setSummary({ strong, neutral, weak });
  }, [done, stats]);

  /** Registra resposta e avança */
  const handleAnswer = async (correct: boolean, skill: string) => {
    // atualiza placar local (segue útil para UI/telemetria durante o diagnóstico)
    const nextStats = produce(stats, draft => {
      const s = draft[skill] ?? { hit: 0, miss: 0 };
      correct ? s.hit++ : s.miss++;
      draft[skill] = s;
    });
    setStats(nextStats);

    try {
      const { data } = await axios.post(`${BASE}/submitAnswer`, {
        userId: uid,
        skill,
        correct,
        contentId: current!.id,
        mode: "diagnostic",           // 👈 importante!
      });

      // se o backend encerrou, ele já manda o resumo pronto
      if (data?.diagnosticDone) {
        if (data?.summary) {
          setSummary({
            strong: data.summary.strong ?? [],
            neutral: data.summary.neutral ?? [],
            weak: data.summary.weak ?? [],
          });
        }
        if (data?.acc) {
          setAcc(data.acc);           // 👈 acurácia por skill (0..1)
        }
        console.log("🏁 diagnóstico encerrado pelo backend:", {
          reason: data?.diagnosticReason,
          summary: data?.summary,
          acc: data?.acc,
        });
        setDone(true);
        return;
      }

      // caso ainda não tenha terminado, pega a próxima
      const hasNext = await fetchNext();
      if (hasNext) setAnswered(n => n + 1);
    } catch (err) {
      console.error("Erro ao enviar resposta", err);
    }
  };

  /** Abandona diagnóstico */
  const navigate = useNavigate();
  const abortDiagnostic = () => {
    setCurrent(null);
    setAnswered(0);
    navigate("/");
  };

  if (done) {
    // monta objeto metrics com acc e tentativas
    const metrics = Object.fromEntries(
      Object.entries(stats).map(([skill, s]) => {
        const attempts = s.hit + s.miss;
        const acc = attempts > 0 ? s.hit / attempts : 0;
        return [skill, { acc, attempts }];
      })
    );

    return (
      <DiagnosticComplete
        strong={summary.strong}
        neutral={summary.neutral}
        weak={summary.weak}
        metrics={metrics} // agora vai para a tela final
      />
    );
  }

  if (!current) {
    return <p className="text-center mt-20">Carregando…</p>;
  }

  return (
    <DiagnosticQuestionCard
      question={current}
      progress={answered + 1}
      total={30} // ou outro número de referência
      onAnswer={handleAnswer}
      onAbort={abortDiagnostic}
    />
  );
}