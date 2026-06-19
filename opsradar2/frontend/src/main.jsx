import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import HandoverCenterPage from "./handover/HandoverCenterPage";
import { installHandoffCompatibility } from "./handover/handoffStateAdapter";

installHandoffCompatibility();

const sessionRoot = document.getElementById("root");
if (sessionRoot) createRoot(sessionRoot).render(<React.StrictMode><App /></React.StrictMode>);

const handoverRoot = document.getElementById("s-knowledge");
if (handoverRoot) {
  handoverRoot.dataset.reactOwned = "true";
  createRoot(handoverRoot).render(<React.StrictMode><HandoverCenterPage /></React.StrictMode>);
}

window.__HANDOFF_REACT_READY__ = true;
