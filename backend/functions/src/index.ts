/*
 * functions/src/index.ts
 * Ponto de entrada para as Cloud Functions (Express)
 */
import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";

import "./core/firebase";               // admin.initializeApp()
import { next } from "./routes/next";
import contentRoutes from "./routes/content";
import { submitAnswer } from "./routes/submitAnswer";
import { diagnostic } from "./routes/diagnostic"; // se quiser manter

const app = express();

// middlewares
app.use(cors({ origin: true }));
app.use(express.json());

// rotas
app.post("/next", next);
app.use("/content", contentRoutes);
app.post("/diagnostic", diagnostic);     // opcional na demo
app.post("/submitAnswer", submitAnswer);

// export
// Se quiser explicitar região: .region("us-central1")
export const api = functions.https.onRequest(app);