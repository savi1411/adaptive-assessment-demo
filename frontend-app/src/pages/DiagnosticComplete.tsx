/* -------------------------------------------------------------------
 * DiagnosticComplete.tsx – Tela de conclusão (com “Neutros” + acc)
 * ------------------------------------------------------------------- */
import React from "react";
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { skillLabel } from "../utils/labels";

/* ---------- props -------------------------------------------------- */
type Props = {
  strong:  string[];
  neutral: string[];
  weak:    string[];
  // métricas opcionais retornadas pelo backend (apenas acc já agrega valor)
  metrics?: Record<
    string,
    { acc?: number; attempts?: number; sd?: number }
  >;
};

export default function DiagnosticComplete({ strong, neutral, weak, metrics }: Props) {
  const navigate = useNavigate();

  const ItemRow = ({ skillKey, colorClass }: { skillKey: string; colorClass: string }) => {
    const m = metrics?.[skillKey];
    const acc = typeof m?.acc === "number" ? m!.acc : undefined; // 0..1
    const pct = acc !== undefined ? Math.round(acc * 100) : undefined;

    return (
      <li key={skillKey} className={`font-medium ${colorClass}`}>
        <div className="flex items-center justify-between gap-3">
          <span>{skillLabel(skillKey)}</span>
          {pct !== undefined && (
            <span className="text-muted-foreground text-sm tabular-nums">{pct}%</span>
          )}
        </div>

        {/* mini barra só se houver acc */}
        {pct !== undefined && (
          <div className="mt-1 h-2 w-full rounded-full bg-slate-200/70">
            <div
              className="h-2 rounded-full bg-current transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </li>
    );
  };

  const Section = ({
    title,
    items,
    colorClass,
    empty = "—",
  }: {
    title: string;
    items: string[];
    colorClass: string;
    empty?: string;
  }) => (
    <div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <ul className="space-y-2 text-lg">
        {items.length
          ? items.map((s) => <ItemRow key={s} skillKey={s} colorClass={colorClass} />)
          : <li>{empty}</li>}
      </ul>
    </div>
  );

  return (
    <Card className="max-w-5xl mx-auto mt-10 shadow-md border-muted rounded-2xl animate-fade-in">
      <CardHeader className="text-center md:text-left">
        <h1 className="text-3xl font-bold flex items-center gap-2 justify-center md:justify-start">
          Diagnóstico concluído <span>🎉</span>
        </h1>
      </CardHeader>

      <CardContent className="p-8 space-y-6 text-center md:text-left">
        {/* grid: três colunas em md+, empilhado em telas menores */}
        <div className="grid md:grid-cols-3 gap-6">
          <Section title="Pontos fortes" items={strong}  colorClass="text-emerald-700" />
          <Section title="Neutros"       items={neutral} colorClass="text-slate-700"   />
          <Section title="A desenvolver"  items={weak}    colorClass="text-rose-700"    />
        </div>

        {/* legenda opcional */}
        <div className="text-sm text-muted-foreground mt-2">
          <p>
            <span className="font-medium">Forte</span>: alto desempenho e/ou baixa incerteza ·{" "}
            <span className="font-medium">Neutro</span>: desempenho intermediário ou evidência insuficiente ·{" "}
            <span className="font-medium">A desenvolver</span>: baixo desempenho ou alta incerteza.
          </p>
        </div>

        <p className="text-lg leading-relaxed">
          A partir de agora o sistema vai priorizar os tópicos a desenvolver para turbinar sua preparação.
        </p>

        <Button
          size="lg"
          className="w-full rounded-full text-lg"
          onClick={() => navigate("/study")}
        >
          Iniciar estudo
        </Button>
      </CardContent>
    </Card>
  );
}