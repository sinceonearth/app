import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { StatusBar, Style } from "@capacitor/status-bar";
import { registerServiceWorker } from "./lib/pwaDetection";

const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);

if (isIos) {
  (async () => {
    try {
      // Prevent content from going under the notch
      await StatusBar.setOverlaysWebView({ overlay: false });

      // Match dark app theme
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (e) {
      console.warn("StatusBar setup failed", e);
    }
  })();
}

// Register service worker for offline support
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
