# Projeto adaptive-assessment-demo
Projeto Demo de IA Adaptativa para o evento AI Tinkeres de 2025

## 🔍 Contexto

O objetivo da demo é demonstrar como um sistema de **aprendizado adaptativo** pode personalizar a jornada de estudo de cada aluno com base em diagnósticos iniciais, estatísticas de desempenho e evolução individual ao longo do tempo.

## 🧠 Conceitos de IA Adaptativa aplicados

- **Personalização Adaptativa**  
  Inserida dentro do guarda-chuva do Machine Learning, a IA adaptativa se apoia em métodos estatísticos para ajustar a experiência de cada usuário. O motor seleciona conteúdos e rotas de estudo conforme os resultados do diagnóstico e a evolução do aluno.
    •	Ajuste dinâmico da trilha de questões.
    •	Identificação de pontos fortes e lacunas de conhecimento.
    •	Recomendação de próximos passos com base em evidência estatística.

- **Modelagem Probabilística (Beta-Bernoulli)**  
  Diferente da IA Generativa, esta demo utiliza fundamentos matemáticos clássicos para estimar o nível de conhecimento do aluno. Cada resposta atualiza distribuições de probabilidade (α e β), refletindo acertos e erros.
    •	Atualização contínua da “crença” sobre cada skill.
    •	Representação da incerteza com distribuições de probabilidade.
    •	Tomada de decisão baseada em confiança estatística, não em geração de texto.

- **Exploração e Exploitação (Bandit-like)**  
  Para escolher a próxima questão, o motor aplica uma lógica inspirada em algoritmos de multi-armed bandit: primeiro garante cobertura mínima das skills e, depois, explora onde a incerteza é maior.
    •	Cobertura: toda skill precisa de evidência mínima.
    •	Slot Machine: é como se cada alavanca fosse uma skill. O motor decide entre: 
      •	Exploração: puxar uma nova alavanca (selecionar questões em skills com pouca evidência, para reduzir incerteza).
      •	Exploitação: continuar puxando a mesma alavanca (reforçar áreas já identificadas como fortes ou frágeis, consolidando a confiança estatística).
    •	Término automático quando a precisão estatística é alcançada ou o número máximo de questões é atingido.

> ⚠️ Importante: A IA adaptativa é um dos pilares da **Aprendizagem Adaptativa** e se apoia em fundamentos de Machine Learning probabilístico/estatístico. Ela não atua isoladamente: em cenários reais, pode ser combinada a outras disciplinas, como IA Generativa para criação de conteúdos dinâmicos, feedback interativo e bots personalizados que ampliam a experiência de aprendizagem.

## 🛠️ Tecnologias Utilizadas

- **Front-end**: React + Tailwind CSS
- **Back-end API**: Node.js com Firebase Cloud Functions  
- **Banco de Dados**: Firebase Firestore  
  - Armazenamento dos assessments, diagnósticos e questionários.  
  - Registro da evolução dos alunos ao longo do tempo.  

[Ver modelo estatístico Beta-Bernoulli)](/frontend-app/docs/beta-bernoulli-bandit.png)

## 📂 Estrutura da Demo

1. **Diagnóstico Inicial** – O aluno responde a questões sobre fundamentos em IA.  
2. **Registro no Firestore** – O sistema salva os resultados e o perfil inicial.  
3. **Seleção de Conteúdo** – O motor adaptativo indica próximos passos de estudo.  
4. **Evolução** – O progresso do aluno é armazenado e atualizado em tempo real.  

## 🚀 Resultado

A demo mostra de forma prática como é possível construir um **motor adaptativo** que se baseia em dados do aluno para oferecer um ensino personalizado, escalável e com base em fundamentos estatísticos.
