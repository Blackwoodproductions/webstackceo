import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance: Use concurrent features
const root = createRoot(document.getElementById("root")!);

// Wrap in StrictMode for development checks (can be removed in production for slight perf gain)
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
