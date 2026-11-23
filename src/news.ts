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
    slug: "westart-demo-day",
    image: imgWestart,
    fit: "cover",
    en: {
      date: "July 12, 2026",
      title: "CarCat wins 1st place and 56,000 AZN at WeStart Demo Day",
      lead: "CarCat took first place at WeStart Demo Day, the final stage of WeStart, the startup program by PASHA Holding.",
      body: [
        "The team was awarded 56,000 AZN, the largest amount WeStart has ever given to a single team.",
        "CarCat helps drivers in Azerbaijan keep their car always ready to drive: a maintenance plan for their exact car, reminders by date and mileage, service bookings at partner centers and a full digital service history.",
        "Thank you to the WeStart team, the jury and everyone who supported us on the way to Demo Day.",
      ],
    },
    az: {
      date: "12 iyul 2026",
      title: "CarCat WeStart Demo Day-də 1-ci yeri və 56 000 AZN qazandı",
      lead: "CarCat PASHA Holding-in startap proqramı olan WeStart-ın final mərhələsi — Demo Day-də birinci yeri tutdu.",
      body: [
        "Komanda 56 000 AZN ilə mükafatlandırıldı. Bu, WeStart tarixində bir komandaya verilən ən böyük məbləğdir.",
        "CarCat Azərbaycandakı sürücülərə avtomobillərini həmişə yola hazır saxlamağa kömək edir: məhz onların avtomobili üçün baxım planı, tarixə və yürüşə görə xatırlatmalar, tərəfdaş mərkəzlərdə servis növbəsi və tam rəqəmsal servis tarixçəsi.",
        "WeStart komandasına, münsiflərə və Demo Day yolunda bizi dəstəkləyən hər kəsə təşəkkür edirik.",
      ],
    },
  },
  {
    slug: "personal-data-register",
    image: imgCert,
    fit: "contain",
    en: {
      date: "July 31, 2026",
      title: "CarCat registered in the state register of personal data systems",
      lead: "CarCat's information system is now included in the state register of personal data information systems of the Republic of Azerbaijan.",
      body: [
        "Drivers keep their profile, their cars and their service history in CarCat. That data now lives in an officially registered system.",
        "Sign-in is confirmed through SIMA, and drivers decide when to share their history, for example with a QR code when they sell the car.",
      ],
    },
    az: {
      date: "31 iyul 2026",
      title: "CarCat fərdi məlumat sistemlərinin dövlət reyestrinə daxil edildi",
      lead: "CarCat-ın informasiya sistemi Azərbaycan Respublikasının fərdi məlumatlar informasiya sistemlərinin dövlət reyestrinə daxil edilib.",
      body: [
        "Sürücülər profillərini, avtomobillərini və servis tarixçələrini CarCat-da saxlayırlar. Bu məlumatlar artıq rəsmi qeydiyyatdan keçmiş sistemdə saxlanılır.",
        "Giriş SIMA vasitəsilə təsdiqlənir və tarixçəni nə vaxt paylaşmağı sürücü özü seçir — məsələn, avtomobili satarkən QR kod ilə.",
      ],
    },
  },
  {
    slug: "hyperservis-partnership",
    image: imgHyper,
    fit: "contain",
    en: {
      date: "July 2, 2026",
      title: "CarCat and HyperServis begin their first official partnership",
      lead: "HyperServis is CarCat's first official service partner.",
      body: [
        "Drivers can find HyperServis centers in the CarCat app, pick a free time slot and book a service in seconds. Every completed visit is saved to the car's history.",
        "For HyperServis, bookings arrive with the car, the service and the time slot, and completed work goes straight into the driver's digital service record.",
      ],
    },
    az: {
      date: "2 iyul 2026",
      title: "CarCat və HyperServis ilk rəsmi tərəfdaşlığa başladı",
      lead: "HyperServis CarCat-ın ilk rəsmi servis tərəfdaşıdır.",
      body: [
        "Sürücülər CarCat tətbiqində HyperServis mərkəzlərini tapa, boş vaxtı seçə və saniyələr içində növbə ala bilərlər. Hər tamamlanmış ziyarət avtomobilin tarixçəsinə yazılır.",
        "HyperServis üçün növbələr avtomobil, xidmət və vaxt məlumatı ilə gəlir, görülən iş isə birbaşa sürücünün rəqəmsal servis qeydinə düşür.",
      ],
    },
  },
];

export const newsUrl = (slug: string) => `${import.meta.env.BASE_URL}news/${slug}/`;

/** Slug of the article for the current URL, or null on the homepage. */
export const currentNewsSlug = (): string | null => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname.slice(base.length);
  const m = path.match(/^\/news\/([a-z0-9-]+)\/?$/);
  return m && NEWS.some((n) => n.slug === m[1]) ? m[1] : null;
};
