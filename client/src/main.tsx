import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Queue data is browser-session-only; no patient/token API is called.
const root = document.getElementById("root");
if (!root) throw new Error("Taxis root element is missing.");
createRoot(root).render(<App />);
