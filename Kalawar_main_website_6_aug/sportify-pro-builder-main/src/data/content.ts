import { IMAGES, PORTRAITS } from "./images";

export type NewsCategory =
  | "News"
  | "Announcement"
  | "Notice"
  | "Achievement"
  | "Circular"
  | "Update"
  | "Championships"
  | "Development"
  | "Governance"
  | "Athletes";

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  category: NewsCategory;
  tag?: "Latest" | "Trending" | "Featured" | "Pinned" | "Urgent" | string;
  author: string;
  date: string;
  expiryDate?: string;
  location?: string;
  readTime: string;
  image: string;
  documentUrl?: string;
  documentName?: string;
  documentSize?: string;
  actionLink?: string;
  actionText?: string;
  pinned?: boolean;
  status?: "Published" | "Draft" | "Archived";
};

export const NEWS_CATEGORIES: NewsCategory[] = [
  "News",
  "Announcement",
  "Notice",
  "Achievement",
  "Circular",
  "Update",
];

export const news: NewsItem[] = [];

export const testimonials = [
  {
    name: "Priya Nair",
    role: "Olympian, Athletics",
    quote:
      "The federation's high-performance pathway took me from a district meet to a world final in four seasons. The support structure is world class.",
    image: PORTRAITS[1],
  },
  {
    name: "Diego Silva",
    role: "Head Coach, Meridian Academy",
    quote:
      "Accreditation, athlete records and event entries all run through one clean portal. It has transformed how our academy operates.",
    image: PORTRAITS[2],
  },
  {
    name: "Fatima Aziz",
    role: "International Referee",
    quote:
      "Transparent appointments and continuous education have raised officiating standards across every discipline.",
    image: PORTRAITS[6],
  },
  {
    name: "Liam Sullivan",
    role: "President, Northline Club",
    quote:
      "Affiliation gave our club access to grants, certified coaches and national ranking events within a single season.",
    image: PORTRAITS[4],
  },
];

export const galleryPhotos: { id: string; title: string; category: string; src: string; span: string }[] = [];

export const galleryVideos: { id: string; title: string; duration: string; thumb: string }[] = [];

export const downloads = [
  { id: "D1", title: "Official Rule Book 2026", type: "PDF", size: "4.2 MB", category: "Regulations", updated: "Jul 2026" },
  { id: "D2", title: "Player Registration Form", type: "PDF", size: "820 KB", category: "Forms", updated: "Jun 2026" },
  { id: "D3", title: "Coach Accreditation Handbook", type: "PDF", size: "2.7 MB", category: "Regulations", updated: "May 2026" },
  { id: "D4", title: "Club Affiliation Application", type: "DOCX", size: "460 KB", category: "Forms", updated: "Jul 2026" },
  { id: "D5", title: "Anti-Doping Charter", type: "PDF", size: "1.9 MB", category: "Governance", updated: "Jun 2026" },
  { id: "D6", title: "Event Hosting Guidelines", type: "PDF", size: "3.1 MB", category: "Governance", updated: "Apr 2026" },
  { id: "D7", title: "Referee Code of Conduct", type: "PDF", size: "1.1 MB", category: "Regulations", updated: "Mar 2026" },
  { id: "D8", title: "Annual Report 2025", type: "PDF", size: "8.6 MB", category: "Reports", updated: "Feb 2026" },
];

export const certificatesData = [
  {
    number: "KSM-CERT-2026-4471",
    holder: "Aarav Mehra",
    type: "Championship Winner",
    event: "Continental Football Cup 2025–26",
    issued: "22 July 2026",
    position: "Gold Medal",
  },
  {
    number: "KSM-CERT-2026-3320",
    holder: "Amara Okafor",
    type: "National Record",
    event: "National Athletics Grand Prix",
    issued: "06 July 2026",
    position: "400m — 49.42s",
  },
  {
    number: "KSM-CERT-2026-2098",
    holder: "Diego Silva",
    type: "Coaching Accreditation",
    event: "Elite Coaching Certification Camp",
    issued: "18 May 2026",
    position: "Level A",
  },
];

export const committee = [
  {
    name: "Mr. Santosh Uddhav Kasabe",
    role: "Founder & President – India",
    image: "/santosh-kasabe.png",
    since: 2018,
    bio: "Visionary founder steering martial arts education, black belt standards, and youth sporting pathways across all states of India.",
  },
  {
    name: "Ms. Ashwini Santosh Kasabe",
    role: "Director – India",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
    since: 2018,
    bio: "Directing strategic federation development, institutional affiliations, and national athlete wellness initiatives.",
  },
  {
    name: "Mr. Ashish Doiphode",
    role: "Working President – India",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
    since: 2020,
    bio: "Leading national operations, championship logistics, state association governance, and officiating standards.",
  },
];

export const timeline = [
  { year: "1974", title: "Federation founded", text: "Established by twelve state associations with a mandate for unified governance." },
  { year: "1988", title: "First continental hosting", text: "Hosted the inaugural continental multi-sport championship across three cities." },
  { year: "2001", title: "Coaching institute opens", text: "The Federation Training Institute begins certifying coaches nationwide." },
  { year: "2013", title: "Integrity charter", text: "Adopted the first independent anti-doping and integrity framework." },
  { year: "2020", title: "Digital transformation", text: "Launched unified athlete registration, accreditation and results platform." },
  { year: "2026", title: "Record participation", text: "Crossed 197,000 registered athletes and 3,760 affiliated clubs." },
];

export const faqs = [
  { q: "Who is eligible to register as a player?", a: "Any athlete aged 12 and above affiliated with a recognised club, academy or school within a member state association may register." },
  { q: "How long does accreditation take?", a: "Standard verification is completed within 7 working days. Championship-tier accreditation is issued within 48 hours of submission." },
  { q: "Are certificates digitally verifiable?", a: "Yes. Every certificate carries a unique number and QR code that can be validated on the Certificates page." },
  { q: "What are the club affiliation requirements?", a: "A registered legal entity, a minimum of 25 active members, one certified coach and an approved training facility." },
  { q: "Is there an annual renewal fee?", a: "Player renewals are billed annually. Clubs renew on a three-year affiliation cycle with an annual compliance review." },
  { q: "How do I appeal a ranking decision?", a: "Appeals may be filed within 14 days of publication through your state association's competition officer." },
];

export const participationTrend = [
  { year: "2020", athletes: 94000 },
  { year: "2021", athletes: 108500 },
  { year: "2022", athletes: 126400 },
  { year: "2023", athletes: 148900 },
  { year: "2024", athletes: 167300 },
  { year: "2025", athletes: 182600 },
  { year: "2026", athletes: 197000 },
];

export const rankings = {
  national: [
    { rank: 1, name: "Aarav Mehra", discipline: "Football", points: 4820, change: 2 },
    { rank: 2, name: "Amara Okafor", discipline: "Athletics", points: 4712, change: 1 },
    { rank: 3, name: "Kenji Tanaka", discipline: "Martial Arts", points: 4590, change: -1 },
    { rank: 4, name: "Sofia Alvarez", discipline: "Swimming", points: 4488, change: 3 },
    { rank: 5, name: "Rohan Kapoor", discipline: "Cricket", points: 4402, change: 0 },
    { rank: 6, name: "Isabella Rossi", discipline: "Gymnastics", points: 4310, change: -2 },
    { rank: 7, name: "Zara Khan", discipline: "Badminton", points: 4218, change: 4 },
    { rank: 8, name: "Mateo Fernandes", discipline: "Basketball", points: 4130, change: 1 },
  ],
  state: [
    { rank: 1, name: "Maharashtra", discipline: "All Disciplines", points: 18420, change: 0 },
    { rank: 2, name: "Karnataka", discipline: "All Disciplines", points: 17860, change: 1 },
    { rank: 3, name: "Delhi", discipline: "All Disciplines", points: 17240, change: -1 },
    { rank: 4, name: "Punjab", discipline: "All Disciplines", points: 16110, change: 2 },
    { rank: 5, name: "Kerala", discipline: "All Disciplines", points: 15680, change: 0 },
    { rank: 6, name: "Tamil Nadu", discipline: "All Disciplines", points: 15020, change: -2 },
  ],
  club: [
    { rank: 1, name: "Titan Athletic Club", discipline: "Multi-Sport", points: 9840, change: 1 },
    { rank: 2, name: "Meridian Sports Academy", discipline: "Multi-Sport", points: 9520, change: -1 },
    { rank: 3, name: "Royal Crest Club", discipline: "Multi-Sport", points: 9210, change: 2 },
    { rank: 4, name: "Vanguard Institute", discipline: "Multi-Sport", points: 8890, change: 0 },
    { rank: 5, name: "Apex Performance Club", discipline: "Multi-Sport", points: 8640, change: 3 },
    { rank: 6, name: "Northline Academy", discipline: "Multi-Sport", points: 8320, change: -2 },
  ],
};
