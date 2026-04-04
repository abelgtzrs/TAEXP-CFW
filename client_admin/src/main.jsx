// --- FILE: client-admin/src/main.jsx (Verify This Is Correct) ---
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App.jsx";

// Terminal font packs (installed via @fontsource) so font switching uses real web fonts.
import "@fontsource/vt323";
import "@fontsource/major-mono-display";
import "@fontsource/share-tech-mono";
import "@fontsource/syne-mono";
import "@fontsource/cutive-mono";
import "@fontsource/jetbrains-mono";
import "@fontsource/ibm-plex-mono";
import "@fontsource/space-mono";
import "@fontsource/inconsolata";
import "@fontsource/anonymous-pro";
import "@fontsource/fira-mono";
import "@fontsource/ubuntu-mono";
import "@fontsource/source-code-pro";
import "@fontsource/roboto-mono";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* The single, top-level BrowserRouter wraps everything. */}
    <BrowserRouter>
      {/* The AuthProvider wraps the App to provide global auth state. */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
