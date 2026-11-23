import { renderToString } from "react-dom/server";
import Router from "./Router";
import { routeFor } from "./news";

/** Static HTML for a path (relative to the site root), used at build time for crawlers and link previews. */
export function render(path: string) {
  return renderToString(<Router route={routeFor(path)} />);
}
export { NEWS } from "./news";
export { SITE } from "./seo";
