/* ------------------------------------------------------------------
 * DiagnosticQuestionCard.tsx
 * Mantém o visual Shadcn + Tailwind e replica as UX do componente antigo
 * ------------------------------------------------------------------ */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";   // ⬅️ no topo do arquivo …
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ProgressBar } from "../components/ui/progress-bar";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown"
import { Loader2, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "../components/ui/dialog";
import { skillLabel } from "../utils/labels";

export interface Question {
  id: string;
  stem: string;
  options: string[];
  answer: number;               // índice 1-4
  skill: string;
  commentary?: string;
  source?: { banca: string; concurso: string; ano: number };
}

type Props = {
  question: Question;
  progress?: number;
  total?: number;
  onAnswer: (correct: boolean, skill: string) => Promise<void> | void;
  onAbort: () => void;      /* 👈 novo */
};

export default function DiagnosticQuestionCard({
  question,
  progress,
  total,
  onAnswer,
  onAbort,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);   // ⬅️ novo
  const [showExit, setShowExit] = useState(false);   // controla saída segura

  /* Reinicia estado ao trocar de pergunta */
  useEffect(() => {
    setSelected(null);
    setIsAnswered(false);
    setLoadingNext(false);
  }, [question.id]);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    setIsAnswered(true);
  };

  /* Envia resposta e bloqueia botão até resolver */
  const handleNext = async () => {
    if (loadingNext || selected === null) return;
    setLoadingNext(true);
    try {
      await onAnswer(selected === question.answer, question.skill);
    } finally {
      setLoadingNext(false);      // garante reset mesmo se der erro
    }
  };

  /* Cor / estilo de cada alternativa */
  const getClasses = (idx: number) => {
    const base =
      "text-base md:text-lg py-3 rounded-pill w-full justify-start transition-colors duration-300";
    if (!isAnswered) return `${base} border border-gray-300 bg-white`;
    const isCorrect = idx === question.answer;
    const isChosen = idx === selected;
    if (isCorrect && isChosen) return `${base} bg-green-100 border-green-500 text-green-800`;
    if (isCorrect) return `${base} bg-green-50  border-green-400 text-green-700`;
    if (isChosen) return `${base} bg-red-100   border-red-500  text-red-800`;
    return `${base} bg-gray-100 border-gray-200 text-gray-400`;
  };

  const navigate = useNavigate();           // ⬅️ adiciona navegação

  return (
    <section className="min-h-screen flex flex-col items-center pt-24 pb-10 px-4 font-sans">
      {/* Barra de progresso ------------------------------------------------ */}
      <div className="fixed top-0 inset-x-0 px-6 pt-4 bg-white/70 backdrop-blur-sm z-10">
        {progress !== undefined && total !== undefined && (
          <>
            <ProgressBar value={progress} max={total} />
            <p className="text-xs text-muted-foreground text-center mt-1">
              Pergunta {progress} de {total}
            </p>
          </>
        )}
      </div>

      {/* Card da questão --------------------------------------------------- */}
      <Card className="w-full max-w-xl shadow-md border border-muted rounded-2xl animate-fade-in">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between px-6 pt-5">
          <span className="text-sm text-primary font-medium">
            Questão&nbsp;
            {Number(question.id.replace(/\D/g, "")) /* q001 → 1 */}
          </span>

          {/* rótulo da skill – centralizado */}
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-muted-foreground">
            {skillLabel(question.skill)}
          </span>

          <button
            onClick={() => setShowExit(true)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        <CardContent className="p-6 pt-4 flex flex-col gap-4">
          {/* Enunciado e fonte */}
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {question.stem}
            </h2>
            {question.source && (
              <p className="text-xs text-muted-foreground italic mt-1">
                {question.source.banca} · {question.source.concurso} ·{" "}
                {question.source.ano}
              </p>
            )}
          </div>

          {/* Alternativas */}
          <div className="flex flex-col gap-4">
            {question.options.map((opt, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.98 }}
                disabled={isAnswered}
                onClick={() => handleSelect(idx + 1)}
                className={getClasses(idx + 1)}
              >
                {opt}
              </motion.button>
            ))}
          </div>

          {/* Comentário explicativo */}
          <AnimatePresence>
            {isAnswered &&
              selected !== question.answer &&
              question.commentary && (
                <motion.div
                  key="commentary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4 }}
                  className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-800 rounded-md"
                >
                  <strong>Comentário:</strong>
                  <div className="prose prose-sm">
                    <ReactMarkdown>{question.commentary}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {/* Botão Próxima */}
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center mt-2"
            >
              <Button
                disabled={loadingNext}
                onClick={handleNext}
                className="px-6 py-2 rounded-full text-sm md:text-base flex items-center gap-2"
              >
                {loadingNext && <Loader2 className="w-4 h-4 animate-spin" />}
                {!loadingNext && "Próxima"}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Dialog “Sair do diagnóstico” ---------- */}
      <Dialog open={showExit} onOpenChange={setShowExit}>
        {/* --- Portal garante que overlay e conteúdo fiquem na <body> --- */}
        <DialogPortal>
          {/* Sobreposição que escurece o fundo */}
          <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />

          {/* Caixa branca do diálogo — agora centralizada na viewport */}
          <DialogContent
            className="
    fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
    sm:max-w-sm                /* largura */
    bg-white                   /* ← FUNDO BRANCO */
    rounded-lg border shadow-xl /* borda + sombra */
    p-6                        /* padding interno */
  "
          >
            <DialogHeader>
              <DialogTitle>Abandonar diagnóstico?</DialogTitle>
              <DialogDescription>
                Seu progresso neste teste será descartado. Deseja realmente sair?
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowExit(false)}>
                Continuar
              </Button>
              <Button
                variant="default"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => navigate("/")}
              >
                Sair
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </section>
  );
}