import React from "react";
import logoLight from "../assets/logo-mentoria-concursos-light.png";
import { Button } from "../components/ui/button";

type DiagnosticStartProps = {
  onStart: () => void;
};

export default function DiagnosticStart({ onStart }: DiagnosticStartProps) {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center font-sans px-6 py-12 text-center">
      <img
        src={logoLight}
        alt="Logo MentorIA"
        className="mb-8 object-contain drop-shadow-md"
        style={{ width: 200, height: "auto" }}
      />

      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
        Bem-vindo(a) à Demo de IA Adaptativa!
      </h1>

      <p className="text-base md:text-lg text-gray-600 max-w-md mb-8">
        Teste seu conhecimento inicial em <strong>Inteligência Artificial</strong> e descubra seu nível de conhecimento.
      </p>

      <Button
        size="lg"
        className="text-lg px-10 py-5 rounded-pill shadow-md"
        onClick={onStart}
      >
        Iniciar 🚀
      </Button>
    </section>
  );
}