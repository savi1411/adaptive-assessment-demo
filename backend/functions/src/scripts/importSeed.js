// functions/src/scripts/importSeed.js
const fs = require("fs");
const csv = require("csv-parser");
const admin = require("firebase-admin");

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Defina GOOGLE_APPLICATION_CREDENTIALS para o service account.");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const file = process.argv[2];
if (!file) {
  console.error("Uso: node importSeed.js src/scripts/seed/ai_assessment.csv");
  process.exit(1);
}

(async () => {
  const batch = db.batch();
  let count = 0;

  fs.createReadStream(file)
    .pipe(csv())
    .on("data", (row) => {
      const {
        id, skill, difficulty, stem,
        optionA, optionB, optionC, optionD,
        answer, commentary
      } = row;

      const ref = db.collection("adaptive_contents").doc(id.trim());
      batch.set(ref, {
        skill: skill.trim(),
        difficulty: difficulty.trim(),
        stem: stem.trim(),
        options: [optionA, optionB, optionC, optionD],
        answer: Number(answer),
        commentary: commentary?.trim() ?? ""
      });
      count++;
    })
    .on("end", async () => {
      await batch.commit();
      console.log(`✅ Importados ${count} documentos em 'adaptive_contents'`);
    })
    .on("error", (e) => {
      console.error("Erro ao ler CSV:", e);
      process.exit(1);
    });
})();
