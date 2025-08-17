import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import DiagnosticIntro from "./pages/DiagnosticIntro";
import DiagnosticPage from "./pages/DiagnosticPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/intro" element={<DiagnosticIntro />} />
        <Route path="/diagnostico" element={<DiagnosticPage />} />
        <Route path="/diagnostic-page" element={<DiagnosticPage />} />
      </Routes>
    </Router>
  );
}