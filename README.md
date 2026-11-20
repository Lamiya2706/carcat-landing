# CarCat landing

Landing page for [CarCat](https://carcat.app) — Vite + React + TypeScript, with an EN/AZ switch and light/dark mode.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
For a custom domain (e.g. carcat.app), build with `BASE_PATH=/` and add a `public/CNAME` file.

- Copy: English strings live inline in `src/App.tsx`; Azerbaijani translations are in `src/i18n.ts`.
- Behaviour (hero steps, scroll reveal, partner map rotation, menu, theme, language): `src/useLanding.ts`.
- Styles: `src/landing.css`.
