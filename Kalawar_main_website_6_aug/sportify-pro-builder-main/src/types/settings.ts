export type IntroVideoFrequency = "once_per_session" | "always" | "never";

export type BannerSlide = {
  id: string;
  image: string;
  alt?: string;
  title?: string;
  link?: string;
  active?: boolean;
};

export const defaultBannerSlides: BannerSlide[] = [
  {
    id: "slide-1",
    image: "/images/banners/slide1.png",
    alt: "Kalawar Sports & Martial Arts Championship Banner 1",
    title: "National Championship 2026",
    link: "/championship/register",
    active: true,
  },
  {
    id: "slide-2",
    image: "/images/banners/slide2.png",
    alt: "Kalawar Sports & Martial Arts Championship Banner 2",
    title: "Martial Arts Excellence",
    link: "/register",
    active: true,
  },
  {
    id: "slide-3",
    image: "/images/banners/slide3.png",
    alt: "Kalawar Sports & Martial Arts Championship Banner 3",
    title: "Skill, Discipline & Honor",
    link: "/events",
    active: true,
  },
  {
    id: "slide-4",
    image: "/images/banners/slide1.png",
    alt: "Kalawar Sports & Martial Arts Championship Banner 4",
    title: "Affiliated Clubs & Academies",
    link: "/clubs",
    active: true,
  },
  {
    id: "slide-5",
    image: "/images/banners/slide2.png",
    alt: "Kalawar Sports & Martial Arts Championship Banner 5",
    title: "Official Federation Accreditation",
    link: "/dan-grading",
    active: true,
  },
];

export type WebsiteSettings = {
  federationName: string;
  contactEmail: string;
  contactPhone: string;
  activeSeason: string;
  address: string;
  googleMapsUrl?: string;
  acceptRegistrations: boolean;
  publishResults: boolean;
  maintenanceMode: boolean;
  enableShop: boolean;
  announcementBanner?: string;
  announcementBannerEnabled?: boolean;
  // Step 1: Intro Video Settings
  introVideoEnabled?: boolean;
  introVideoUrl?: string;
  introVideoFrequency?: IntroVideoFrequency;
  introVideoTitle?: string;
  introVideoTagline?: string;
  // Step 2: Banner Slides Settings (Total 5 Banners)
  bannerSlides?: BannerSlide[];
  updatedAt?: string;
};

export const defaultSettings: WebsiteSettings = {
  federationName: "KALAWAR Sports & Martial Arts Federation of India",
  contactEmail: "kalawarmartialartsindia@gmail.com",
  contactPhone: "+91 70833 14435 / +91 95614 27125",
  activeSeason: "2026",
  address: "National Headquarters, India",
  googleMapsUrl: "https://share.google/31PQfjzetEDIADnHy",
  acceptRegistrations: true,
  publishResults: true,
  maintenanceMode: false,
  enableShop: true,
  announcementBanner: "🏆 National Championship 2026 Registrations Open • Join KALAWAR Sports Federation",
  announcementBannerEnabled: true,
  // Intro Video Defaults
  introVideoEnabled: true,
  introVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-karate-fighter-training-in-a-dojo-42866-large.mp4",
  introVideoFrequency: "once_per_session",
  introVideoTitle: "KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA",
  introVideoTagline: "Indian Martial Arts • Sports • Skill • Discipline • Excellence",
  // Banner Slides Defaults
  bannerSlides: defaultBannerSlides,
  updatedAt: new Date().toISOString(),
};
