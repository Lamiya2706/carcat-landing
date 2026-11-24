import React from "react";
import ReactDOM from "react-dom/client";
import Router from "./Router";
import { currentRoute } from "./news";
import "./fonts.css";
import "./landing.css";
import { reloadIfStale } from "./stale";

reloadIfStale("main");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router route={currentRoute()} />
  </React.StrictMode>,
);
