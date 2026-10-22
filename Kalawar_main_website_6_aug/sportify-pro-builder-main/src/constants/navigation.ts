export interface NavChildItem {
  label: string;
  to: string;
  desc: string;
}

export interface NavGroup {
  groupTitle: string;
  items: NavChildItem[];
}

export interface NavItem {
  label: string;
  to: string;
  groups?: NavGroup[];
  children?: NavChildItem[];
}

export const mainNav: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  {
    label: "Events",
    to: "/events",
    children: [
      { label: "Our Events", to: "/events", desc: "Flagship tournaments & championship overview" },
      { label: "Calendar", to: "/events/calendar", desc: "Annual national championship schedule" },
      { label: "Upcoming Events", to: "/events/upcoming", desc: "Upcoming tournaments & live registrations" },
      { label: "Championship", to: "/events/championship", desc: "National & state championships & title fixtures" },
      { label: "Results", to: "/results", desc: "Championship medal tallies & scores" },
    ],
  },
  {
    label: "Grading & Belts",
    to: "/belt-exams",
    children: [
      { label: "Belt Examinations", to: "/belt-exams", desc: "Official color belt syllabus, admit cards & results" },
      { label: "Black Belt & Dan Grading", to: "/dan-grading", desc: "1st to 10th Dan syllabus, thesis & certification" },
      { label: "Referee & Officials", to: "/referees", desc: "Technical official licensing, seminars & appointments" },
      { label: "Certified Belts Candidates", to: "/certified-belts-candidates", desc: "Official roster of verified belt exam & Dan grading certified candidates" },
    ],
  },
  /*
  {
    label: "Verification",
    to: "/verify",
    children: [
      { label: "Official ID Cards", to: "/id-cards", desc: "Digital identification & athlete / coach QR verification" },
      { label: "Search & Verification", to: "/verify", desc: "Central ID, Certificate & Dan Diploma lookup" },
    ],
  },
  */
  {
    label: "Media",
    to: "/news",
    children: [
      { label: "News & Circulars", to: "/news", desc: "Official updates, circulars & press releases" },
      { label: "Photo Gallery", to: "/gallery", desc: "Tournament & ceremony photo albums" },
      { label: "Video Gallery", to: "/gallery/videos", desc: "Championship highlights & films" },
      { label: "Downloads", to: "/downloads", desc: "Official forms, syllabi & circulars" },
    ],
  },
  { label: "Affiliation", to: "/affiliation" },
  { label: "Shop", to: "/shop" },
  { label: "Contact", to: "/contact" },
];

export const federation = {
  name: "KALAWAR Sports & Martial Arts Federation of India",
  short: "KALAWAR",
  tagline: "Pioneering Martial Arts & Sports Excellence Across India",
  address: "National Headquarters, India",
  googleMapsUrl: "https://share.google/31PQfjzetEDIADnHy",
  phone: "+91 70833 14435 / +91 95614 27125",
  phone1: "+91 70833 14435",
  phone2: "+91 95614 27125",
  rawPhone1: "7083314435",
  rawPhone2: "9561427125",
  email: "kalawarmartialartsindia@gmail.com",
  hours: "Monday – Saturday, 09:00 – 18:30 IST",
  whatsapp: "+91 70833 14435",
  whatsappNumber: "917083314435",
  social: {
    facebook: "https://www.facebook.com/share/1BXx4cAatG/",
    instagram: "https://www.instagram.com/kalawar_india?stkn=MTM3azkxdGx4MzE3Mw==",
    youtube: "https://youtube.com/@bma_action_universe_1988?si=jZ6U7jYeFpd3TMRv",
  },
  registrationStatus: "Certificate & Registration Documents Available",
  documentsAvailable: true,
  officials: {
    president: {
      name: "Mr. Santosh Uddhav Kasabe",
      role: "Founder & President – India",
    },
    director: {
      name: "Ms. Ashwini Santosh Kasabe",
      role: "Director – India",
    },
    workingPresident: {
      name: "Mr. Ashish Doiphode",
      role: "Working President – India",
    },
  },
};
