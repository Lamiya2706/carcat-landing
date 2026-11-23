import App from "./App";
import NewsPage, { NewsIndex } from "./NewsPage";
import LegalPage from "./LegalPage";
import type { Route } from "./news";

export default function Router({ route }: { route: Route }) {
  switch (route.page) {
    case "news":
      return <NewsPage slug={route.slug} />;
    case "newsIndex":
      return <NewsIndex />;
    case "legal":
      return <LegalPage doc={route.doc} />;
    default:
      return <App />;
  }
}
