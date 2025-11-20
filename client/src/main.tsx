import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { StatusBar, Style } from "@capacitor/status-bar";
import { registerServiceWorker } from "./lib/pwaDetection";
import { bootstrapCapacitorOffline } from "./lib/capacitorOffline";

const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);

if (isIos) {
  (async () => {
    try {
      // Prevent content from going under the notch AND fix overscroll white bar
      await StatusBar.setOverlaysWebView({ overlay: false });

      // Match dark app theme (black background)
      await StatusBar.setStyle({ style: Style.Dark });
      
      // Set status bar background to black to fix overscroll white bar
      await StatusBar.setBackgroundColor({ color: '#000000' });
    } catch (e) {
      console.warn("StatusBar setup failed", e);
    }
  })();
}

// Bootstrap offline data for Capacitor (hydrate from localStorage)
bootstrapCapacitorOffline();

// Register service worker for offline support (web only)
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
