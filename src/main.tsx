import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import NewsPage from "./NewsPage";
import { currentNewsSlug } from "./news";
import "./landing.css";

const slug = currentNewsSlug();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{slug ? <NewsPage slug={slug} /> : <App />}</React.StrictMode>,
);
