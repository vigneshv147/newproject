import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force dark mode for cybersecurity theme
document.documentElement.classList.add('dark');
localStorage.setItem('theme', 'dark');

createRoot(document.getElementById("root")!).render(<App />);
