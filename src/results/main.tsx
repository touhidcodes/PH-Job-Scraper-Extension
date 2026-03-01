import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { Results } from "./results";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Results />
  </StrictMode>
);
