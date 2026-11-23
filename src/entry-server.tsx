import { renderToString } from "react-dom/server";
import App from "./App";
import NewsPage from "./NewsPage";

/** Static HTML for a route, used at build time so crawlers and link previews see real content. */
export function render(slug: string | null) {
  return renderToString(slug ? <NewsPage slug={slug} /> : <App />);
}
export { NEWS } from "./news";
export { SITE } from "./seo";
