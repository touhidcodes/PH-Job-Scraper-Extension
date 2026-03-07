import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../App.css";
import "../index.css";
import { Results } from "./results";

createRoot(document.getElementById("results-root")!).render(
  <StrictMode>
    <Results />
  </StrictMode>
);
