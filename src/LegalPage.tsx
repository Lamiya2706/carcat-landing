import type { ReactNode } from "react";
import Shell from "./Shell";
import privacy from "./legal/privacy.txt?raw";
import terms from "./legal/terms.txt?raw";

/**
 * Renders the plain-text legal documents (copied from the previous carcat.app site, same URLs).
 * Format: first line = title; "1." / "1.1" lines = headings; "### x" = minor heading; "- x" = list item.
 */
function renderDoc(src: string): { title: string; meta: string[]; body: ReactNode[] } {
  const lines = src.trim().split("\n");
  const title = lines.shift()!.trim();
  const meta: string[] = [];
  const body: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) body.push(<ul key={"ul" + body.length}>{list.map((x, i) => <li key={i}>{x}</li>)}</ul>);
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(Last Updated|Version|Language):/.test(line) && !body.length) { meta.push(line); continue; }
    if (line.startsWith("- ")) { list.push(line.slice(2)); continue; }
    flush();
    if (/^\d+\.\d+ /.test(line)) body.push(<h3 key={body.length}>{line}</h3>);
    else if (/^\d+\. /.test(line)) body.push(<h2 key={body.length}>{line}</h2>);
    else if (line.startsWith("### ")) body.push(<h4 key={body.length}>{line.slice(4)}</h4>);
    else {
      const link = line.match(/^(Email|Website): (\S+)$/);
      body.push(
        <p key={body.length}>
          {link ? (
            <>
              {link[1]}: <a href={link[1] === "Email" ? "mailto:" + link[2] : link[2]}>{link[2]}</a>
            </>
          ) : (
            line
          )}
        </p>,
      );
    }
  }
  flush();
  return { title, meta, body };
}

export default function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const d = renderDoc(doc === "privacy" ? privacy : terms);
  return (
    <Shell title={`${d.title} — CarCat`}>
      {() => (
        <article className="nd-wrap nd-article nd-legal">
          <h1>{d.title}</h1>
          <div className="nd-legal-meta">{d.meta.map((m) => <span key={m}>{m}</span>)}</div>
          {d.body}
        </article>
      )}
    </Shell>
  );
}
