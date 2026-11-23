import imgWestart from "./assets/n_westart.webp";
import imgCert from "./assets/n_cert.webp";
import imgHyper from "./assets/n_hyper.webp";

export type NewsItem = {
  slug: string;
  image: string;
  /** "cover" for photos, "contain" for logos/documents */
  fit: "cover" | "contain";
  en: { date: string; title: string; lead: string; body: string[] };
  az: { date: string; title: string; lead: string; body: string[] };
};

// Newest first is decided by date below; the order here matches the homepage carousel.
export const NEWS: NewsItem[] = [
  {
    slug: "carcat-westart-demo-day-first-place",
    image: imgWestart,
    fit: "cover",
    en: {
      date: "July 12, 2026",
      title: "CarCat wins 1st place and 56,000 AZN at WeStart Demo Day",
      lead: "The grand finale of the \"WeStart\" Acceleration Program - the highly anticipated Demo Day - has officially concluded, and CarCat has emerged as the absolute champion of the cohort.",
      body: [
        "Following a rigorous and intensive 4-month sprint, 11 of the region's most promising startup teams took the stage to pitch their disruptive innovations. After a highly competitive round of presentations and fierce investment battles, CarCat was officially awarded 1st Place. 🥇",
        "But this victory is about more than just holding the trophy. CarCat made ecosystem history by setting an unprecedented milestone: 💰 Our team secured a 56,000 AZN pre-seed investment package - making it the LARGEST single investment ever awarded to a single startup in the entire history of the WeStart program.",
      ],
    },
    az: {
      date: "12 iyul 2026",
      title: "CarCat WeStart Demo Day-də 1-ci yeri və 56 000 AZN qazandı",
      lead: "\"WeStart\" Akselerasiya Proqramının böyük finalı — çoxdan gözlənilən Demo Day başa çatdı və CarCat bu axının mütləq qalibi oldu.",
      body: [
        "4 ay davam edən gərgin və intensiv proqramdan sonra regionun ən perspektivli 11 startap komandası innovativ ideyalarını səhnədə təqdim etdi. Rəqabətli təqdimatlar və investisiya uğrunda gərgin mübarizədən sonra CarCat rəsmi olaraq 1-ci yerə layiq görüldü. 🥇",
        "Amma bu qələbə təkcə kubokla bağlı deyil. CarCat ekosistemdə tarixi nailiyyətə imza atdı: 💰 komandamız 56 000 AZN həcmində pre-seed investisiya paketi qazandı — bu, WeStart proqramının bütün tarixində bir startapa verilən ən böyük investisiyadır.",
      ],
    },
  },
  {
    slug: "carcat-dovlet-qeydiyyati-2026",
    image: imgCert,
    fit: "contain",
    en: {
      date: "July 31, 2026",
      title: "CarCat officially registered by the state",
      lead: "On 31 July 2026, the National Cybersecurity Agency under the Ministry of Digital Development and Transport of the Republic of Azerbaijan registered the \"Electronic Management System for Vehicle Service Operations (CarCat MIS)\" in the state register of personal data information systems under number IS647005001.",
      body: [
        "This registration officially confirms that CarCat processes user data securely, transparently, and in full compliance with the requirements of the law.",
      ],
    },
    az: {
      date: "31 iyul 2026",
      title: "CarCat dövlət qeydiyyatından keçdi",
      lead: "31 iyul 2026-cı il tarixində Azərbaycan Respublikası Rəqəmsal İnkişaf və Nəqliyyat Nazirliyi yanında Milli Kibertəhlükəsizlik Agentliyi \"Avtomobil servis əməliyyatlarının elektron idarəetmə sistemi (CarCat MİS)\"-ni IS647005001 nömrəsi ilə fərdi məlumatlar informasiya sistemlərinin dövlət reyestrinə daxil etdi.",
      body: [
        "Bu qeydiyyat CarCat-ın istifadəçi məlumatlarını təhlükəsiz, şəffaf və qanunun tələblərinə tam uyğun şəkildə emal etdiyini rəsmi olaraq təsdiqləyir.",
      ],
    },
  },
  {
    slug: "carcat-hyperservis-partnership",
    image: imgHyper,
    fit: "contain",
    en: {
      date: "July 2, 2026",
      title: "CarCat and HyperServis begin partnership",
      lead: "A landmark day for CarCat - our team has launched its first official partnership with HyperServis.",
      body: [
        "Through this partnership, users can add vehicles serviced at HyperServis directly to the CarCat app. This means a car's complete maintenance history is gathered in one place, with no need for manual data entry.",
        "Inside the app, users can track their vehicle's current maintenance status, see how long until the next service is due, and get a full picture of the maintenance costs incurred so far.",
        "This is an important step in CarCat's mission to bring a transparent and effortless car maintenance experience to vehicle owners in Azerbaijan.",
      ],
    },
    az: {
      date: "2 iyul 2026",
      title: "CarCat və HyperServis tərəfdaşlığa başladı",
      lead: "CarCat üçün əlamətdar gün — komandamız HyperServis ilə ilk rəsmi tərəfdaşlığa başladı.",
      body: [
        "Bu tərəfdaşlıq sayəsində istifadəçilər HyperServis-də xidmət almış avtomobillərini birbaşa CarCat tətbiqinə əlavə edə bilərlər. Beləliklə, avtomobilin tam baxım tarixçəsi əl ilə məlumat daxil etmədən bir yerdə toplanır.",
        "Tətbiqdə istifadəçilər avtomobilin cari baxım vəziyyətini izləyə, növbəti servisə nə qədər qaldığını görə və indiyədək çəkilən baxım xərcləri barədə tam təsəvvür əldə edə bilərlər.",
        "Bu, CarCat-ın Azərbaycandakı avtomobil sahiblərinə şəffaf və rahat baxım təcrübəsi təqdim etmək missiyasında mühüm addımdır.",
      ],
    },
  },
];

export const newsUrl = (slug: string) => `${import.meta.env.BASE_URL}news/${slug}/`;

export type Route =
  | { page: "home" }
  | { page: "news"; slug: string }
  | { page: "newsIndex" }
  | { page: "legal"; doc: "privacy" | "terms" };

/** Route for a path relative to the site root, e.g. "/news/x/". Unknown paths fall back to home. */
export const routeFor = (rel: string): Route => {
  const p = rel.replace(/\/+$/, "") || "/";
  if (p === "/news") return { page: "newsIndex" };
  if (p === "/privacy-policy") return { page: "legal", doc: "privacy" };
  if (p === "/terms-of-service") return { page: "legal", doc: "terms" };
  const m = p.match(/^\/news\/([a-z0-9-]+)$/);
  if (m && NEWS.some((n) => n.slug === m[1])) return { page: "news", slug: m[1] };
  return { page: "home" };
};

export const currentRoute = (): Route => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return routeFor(window.location.pathname.slice(base.length) || "/");
};
