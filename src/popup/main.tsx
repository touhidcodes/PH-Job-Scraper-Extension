import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../App.css";
import "../index.css";
import { Popup } from "./popup";

createRoot(document.getElementById("popup-root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>
);
