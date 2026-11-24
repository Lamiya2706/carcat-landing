import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AdminApp from "./App";
import "../fonts.css";
import "./admin.css";
import { reloadIfStale } from "../stale";

reloadIfStale("admin");

createRoot(document.getElementById("admin")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
