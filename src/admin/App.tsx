import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { sb } from "./supabase";
import { Btn, Toasts, toast } from "./ui";
import { CentersPage, NewsPage, OrgsPage, SectionsPage, TeamPage, TextsPage, Loading } from "./pages";
import logo from "../assets/carcat-logo.png";

const SITE = "https://carcat.app/";
const TABS = [
  { id: "news", label: "News", icon: "M4 5h16v14H4zM8 9h8M8 13h8M8 17h5", el: NewsPage },
  { id: "team", label: "Team", icon: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M17 11a2.5 2.5 0 1 0 0-5M16 14.5a5 5 0 0 1 5 5.5", el: TeamPage },
  { id: "partners", label: "Sponsors & partners", icon: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z", el: OrgsPage },
  { id: "centers", label: "Service centers", icon: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", el: CentersPage },
  { id: "texts", label: "Section texts", icon: "M4 6h16M4 12h10M4 18h13", el: TextsPage },
  { id: "sections", label: "Sections", icon: "M4 4h16v6H4zM4 14h16v6H4z", el: SectionsPage },
] as const;

const tabFromHash = () => (TABS.find((t) => "#" + t.id === location.hash)?.id ?? "news") as (typeof TABS)[number]["id"];

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovery, setRecovery] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // links from invite / reset emails arrive with type=recovery|invite in the URL
    if (/type=(recovery|invite)/.test(location.hash + location.search)) setRecovery(true);
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((ev, s) => {
      if (ev === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    sb.rpc("is_admin").then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <>
      <Toasts />
      {session === undefined ? (
        <Center><Loading /></Center>
      ) : recovery && session ? (
        <SetPassword onDone={() => { setRecovery(false); history.replaceState(null, "", location.pathname); }} />
      ) : !session ? (
        <Login />
      ) : isAdmin === null ? (
        <Center><Loading /></Center>
      ) : !isAdmin ? (
        <Center>
          <div className="ad-auth">
            <img src={logo} alt="CarCat" className="ad-auth-logo" />
            <h1>No admin access</h1>
            <p>{session.user.email} isn't on the CarCat admin list. Ask Lamiya or Nemat to add you.</p>
            <Btn onClick={() => sb.auth.signOut()}>Sign out</Btn>
          </div>
        </Center>
      ) : (
        <Shell email={session.user.email ?? ""} />
      )}
    </>
  );
}

const Center = ({ children }: { children: React.ReactNode }) => <div className="ad-center">{children}</div>;

function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "reset" | "sent">("login");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "login") {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) toast(error.message === "Invalid login credentials" ? "Wrong email or password" : error.message, "err");
    } else {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if (error) toast(error.message, "err");
      else setMode("sent");
    }
    setBusy(false);
  };
  return (
    <Center>
      <form className="ad-auth" onSubmit={submit}>
        <img src={logo} alt="CarCat" className="ad-auth-logo" />
        <h1>{mode === "login" ? "Admin sign in" : "Set or reset password"}</h1>
        {mode === "sent" ? (
          <p>Check <b>{email}</b> for a link to set your password. It can take a minute; look in spam too.</p>
        ) : (
          <>
            <label className="ad-field"><span className="ad-label">Email</span><input className="ad-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            {mode === "login" && (
              <label className="ad-field"><span className="ad-label">Password</span><input className="ad-input" type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
            )}
            <button className="ad-btn primary big" disabled={busy}>{busy ? "…" : mode === "login" ? "Sign in" : "Email me a link"}</button>
          </>
        )}
        <button type="button" className="ad-link" onClick={() => setMode(mode === "login" ? "reset" : "login")}>
          {mode === "login" ? "First time here, or forgot your password?" : "Back to sign in"}
        </button>
      </form>
    </Center>
  );
}

function SetPassword({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Center>
      <form
        className="ad-auth"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 10) return toast("Use at least 10 characters", "err");
          setBusy(true);
          const { error } = await sb.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) return toast(error.message, "err");
          toast("Password saved");
          onDone();
        }}
      >
        <img src={logo} alt="CarCat" className="ad-auth-logo" />
        <h1>Choose a password</h1>
        <p>At least 10 characters. You'll use it with your email to sign in.</p>
        <label className="ad-field"><span className="ad-label">New password</span><input className="ad-input" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <button className="ad-btn primary big" disabled={busy}>Save password</button>
      </form>
    </Center>
  );
}

type Status = { status?: string; conclusion?: string | null; created_at?: string; url?: string; last_publish?: string; pending?: number };

function Publish() {
  const [st, setSt] = useState<Status>({});
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const { data, error } = await sb.functions.invoke("publish", { body: { action: "status" } });
    if (!error) setSt(data);
  }, []);
  useEffect(() => {
    refresh();
    const running = st.status && st.status !== "completed";
    const id = setInterval(refresh, running ? 6000 : 30000);
    return () => clearInterval(id);
  }, [refresh, st.status]);
  const running = !!st.status && st.status !== "completed";
  const failed = st.status === "completed" && st.conclusion && st.conclusion !== "success";
  const go = async () => {
    setBusy(true);
    const { data, error } = await sb.functions.invoke("publish", { body: { action: "publish" } });
    setBusy(false);
    if (error || data?.error) return toast("Publish failed: " + (data?.error ?? error?.message), "err");
    toast("Publishing… the site updates in about a minute");
    setSt((s) => ({ ...s, status: "queued", pending: 0 }));
    setTimeout(refresh, 4000);
  };
  return (
    <div className="ad-publish">
      <span className={"ad-dot " + (running ? "run" : failed ? "err" : st.pending ? "warn" : "ok")} />
      <span className="ad-publish-txt">
        {running ? "Publishing…" : failed ? <a href={st.url} target="_blank" rel="noreferrer">Last publish failed</a> : st.pending ? `${st.pending} unpublished change${st.pending === 1 ? "" : "s"}` : "Site is up to date"}
      </span>
      <Btn kind="dark" disabled={busy || running} onClick={go}>{running ? "Publishing…" : "Publish"}</Btn>
    </div>
  );
}

function Shell({ email }: { email: string }) {
  const [tab, setTab] = useState(tabFromHash);
  const [nav, setNav] = useState(false);
  useEffect(() => {
    const on = () => {
      setTab(tabFromHash());
      setNav(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNav(false);
    window.addEventListener("hashchange", on);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  const Page = TABS.find((t) => t.id === tab)!.el;
  return (
    <div className="ad-shell">
      {nav && <div className="ad-side-bg" onClick={() => setNav(false)} aria-hidden="true" />}
      <aside className={"ad-side" + (nav ? " open" : "")}>
        <div className="ad-side-top">
          <a href={SITE} target="_blank" rel="noreferrer" className="ad-brand"><img src={logo} alt="CarCat" /><span>Admin</span></a>
          <button type="button" className="ad-x ad-side-close" aria-label="Close menu" onClick={() => setNav(false)}>×</button>
        </div>
        <nav>
          {TABS.map((t) => (
            <a key={t.id} href={"#" + t.id} className={tab === t.id ? "on" : ""} onClick={() => setNav(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.icon} /></svg>
              {t.label}
            </a>
          ))}
        </nav>
        <div className="ad-side-foot">
          <a href={SITE} target="_blank" rel="noreferrer">Open carcat.app ↗</a>
          <span title={email}>{email}</span>
          <button type="button" className="ad-link" onClick={() => sb.auth.signOut()}>Sign out</button>
        </div>
      </aside>
      <div className="ad-main">
        <header className="ad-top">
          <button type="button" className="ad-burger" aria-label="Open menu" aria-expanded={nav} onClick={() => setNav(true)}>☰</button>
          <span className="ad-top-title">{TABS.find((t) => t.id === tab)!.label}</span>
          <Publish />
        </header>
        <main className="ad-page" key={tab}><Page /></main>
      </div>
    </div>
  );
}
