# Projeto adaptive-assessment-demo
Projeto Demo de IA Adaptativa para o evento AI Tinkeres de 2025

## 🔍 Contexto

O objetivo da demo é demonstrar como um sistema de **aprendizado adaptativo** pode personalizar a jornada de estudo de cada aluno com base em diagnósticos iniciais, estatísticas de desempenho e evolução individual ao longo do tempo.

## 🧠 Conceitos de IA Adaptativa aplicados

- **Personalização Adaptativa**  
  O motor seleciona conteúdos e rotas de estudo de acordo com os resultados do diagnóstico inicial e com o histórico do aluno.  
  - Ajuste dinâmico da trilha de questões.  
  - Identificação de pontos fortes e lacunas de conhecimento.  
  - Recomendação de próximos passos com base na performance.

- **Análise Preditiva**  
  O sistema utiliza conceitos matemáticos e estatísticos (sem uso de modelos generativos) para estimar a evolução do aluno e antecipar dificuldades prováveis.  
  - Regressões e cálculos de probabilidade.  
  - Projeção de evolução a partir do desempenho passado.  
  - Detecção de padrões de acertos e erros para prever pontos de reforço.

> ⚠️ Importante: **não foi utilizada IA generativa** (LLMs, NLP ou RAG). O foco esteve em algoritmos matemáticos e adaptativos clássicos.

## 🛠️ Tecnologias Utilizadas

- **Front-end**: React + Tailwind CSS  
- **Back-end API**: Node.js com Firebase Cloud Functions  
- **Banco de Dados**: Firebase Firestore  
  - Armazenamento dos assessments, diagnósticos e questionários.  
  - Registro da evolução dos alunos ao longo do tempo.  

## 📂 Estrutura da Demo

1. **Diagnóstico Inicial** – O aluno responde a questões sobre fundamentos em IA.  
2. **Registro no Firestore** – O sistema salva os resultados e o perfil inicial.  
3. **Seleção de Conteúdo** – O motor adaptativo indica próximos passos de estudo.  
4. **Evolução** – O progresso do aluno é armazenado e atualizado em tempo real.  

## 🚀 Resultado

A demo mostra de forma prática como é possível construir um **motor adaptativo** que se baseia em dados do aluno para oferecer um ensino personalizado, escalável e com base em fundamentos estatísticos.
