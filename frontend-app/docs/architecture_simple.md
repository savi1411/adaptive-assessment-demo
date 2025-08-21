flowchart TB
  %% ---- UI ----
  subgraph UI[Front-end]
    Q[Card da questão]
  end

  %% ---- API ----
  subgraph API[Backend (Cloud Functions / Express)]
    SA[/POST /submitAnswer/]
    NX[/POST /next/]
    SEL[Seletor de Próxima Questão<br/>(cobertura mínima + bandit)]
    UPD[Atualiza Beta por skill<br/>(α=acertos+1, β=erros+1)]
    STOP{Parar agora?<br/>precisionOK<br/>OU maxQuestions}
    SUM[Build Summary<br/>(strong/neutral/weak,<br/>acc por skill)]
  end

  %% ---- DB ----
  subgraph DB[Firestore]
    S[users/{id}/served]
    A[users/{id}/answers]
    P[users/{id}/proficiency<br/>(α,β por skill)]
    C[adaptive_contents<br/>(itens por skill/dificuldade)]
    U[users/{id}<br/>(diagnosticDone,...)]
  end

  %% ---- Fluxo principal ----
  Q -- responder (acerto/erro) --> SA
  SA -->|grava| S
  SA -->|grava| A
  SA --> UPD --> P
  UPD --> STOP

  STOP -- NÃO --> NX
  NX --> SEL --> C
  SEL -->|contentId + skill| Q

  STOP -- SIM --> SUM --> U
  SUM -->|summary + acc| Q

  %% ---- Notas curtas ----
  classDef dim fill:#f7f7f7,stroke:#bbb,color:#333;
  class SEL,UPD,STOP,SUM dim