// pages/DiagnosticIntro.tsx
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import logoLight from "../assets/logo-ia-adaptativa.png";
import { useNavigate } from "react-router-dom";

export default function DiagnosticIntro() {
  const navigate = useNavigate();

  /* DiagnosticIntro.tsx */
  return (
<section className="min-h-[80vh] flex items-center justify-center px-4 font-sans">
  <Card className="max-w-xl w-full shadow-md border border-muted rounded-2xl">
    <CardContent className="p-4 flex flex-col gap-5 items-center text-center">
      <img
        src={logoLight}
        alt="MentorIA Concursos"
        className="w-48 mb-2"
      />
      <h1 className="text-3xl font-bold">Diagnóstico&nbsp;Inicial</h1>

      <div className="text-left text-base md:text-lg leading-relaxed space-y-4">
        <p><strong>Por que fazer este teste?</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Mapear seus conhecimentos em Inteligência Artificial.</li>
          <li>
            Personalizar seus estudos: as próximas questões são
            <span className="font-semibold"> ajustadas ao seu nível</span>.
          </li>
          <li>Leva poucos &nbsp;minutos.</li>
        </ul>

        <p>
          <strong>Como funciona?</strong> Você responderá entre
          <span className="font-semibold"> 12 e 30 questões</span>. <br />
          O teste termina assim que atingirmos confiança sobre seu nível.
          Não há nota – cada acerto ou erro nos ajuda a calibrar o próximo item.
        </p>
      </div>

      <Button
        size="lg"
        className="w-full rounded-full text-lg"
        onClick={() => navigate("/diagnostic-page")}
      >
        Iniciar&nbsp;🚀
      </Button>
    </CardContent>
  </Card>
</section>
  );
}