import React from "react";
import { useNavigate } from "react-router-dom";

import logoLight from "../assets/logo-ia-adaptativa.png";
import { Button } from "../components/ui/button";

// substitua o array concursos por:
const apps = [
  { icone: "🧑‍💼", nome: "Recrutamento & Seleção", descricao: "Provas técnicas adaptativas" },
  { icone: "🎓", nome: "Avaliação para Cursos", descricao: "Placement automático" },
  { icone: "🏢", nome: "Assessment de Funcionários", descricao: "Mapeamento de skills" },
  { icone: "📚", nome: "Treinamentos Online", descricao: "Trilhas personalizadas" },
  { icone: "🗣️", nome: "Nivelamento de Idiomas", descricao: "Classificação CEFR" },
  { icone: "✅", nome: "Certificações & Compliance", descricao: "Provas com garantia" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Conteúdo limitado à largura máxima da tela */}
      <div className="w-full max-w-screen-xl mx-auto flex flex-col flex-1 px-6">
        {/* Barra superior */}
        <header className="flex items-center justify-between py-5">
          <img
            src={logoLight}
            alt="Logo"
            className="h-20 md:h-48 w-auto object-contain"
          />
          <span className="text-gray-400 font-semibold text-sm select-none">
            Português
          </span>
        </header>

        {/* Conteúdo central cresce para empurrar o rodapé */}
        <main className="flex-1 flex flex-col items-center justify-start px-4 text-center py-4">
          <div className="w-full max-w-xl">
            <h1 className="text-4xl font-bold text-sky-700 mb-4 leading-tight">
              Quando a IA se ajusta a você <br className="hidden md:block" />
              Um novo caminho no <span className="text-primary">aprendizado adaptativo</span>!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Diagnóstico adaptativo, simulados inteligentes, trilha de estudos personalizada e feedback interativo. O treinamento se adapta a você e não o contrário.
            </p>
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm mx-auto">
              <Button
                onClick={() => navigate("/intro")}
                className="text-lg py-5 px-8 rounded-pill w-full"
              >
                Comece agora
              </Button>
              <Button variant="outline" className="text-lg py-5 px-8 rounded-pill w-full">
                Já tenho conta
              </Button>
            </div>
          </div>
        </main>

        {/* Rodapé com apps */}
        <footer className="bg-gray-50 py-6 md:py-8 border-t border-gray-200">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
              {apps.map((a) => (
                <div key={a.nome} className="flex flex-col items-center text-center">
                  <span className="text-2xl md:text-3xl mb-1">{a.icone}</span>
                  <span className="text-sm font-semibold">{a.nome}</span>
                  <span className="text-xs text-gray-500">{a.descricao}</span>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
