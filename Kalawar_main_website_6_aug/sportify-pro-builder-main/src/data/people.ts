import { IMAGES, PORTRAITS } from "./images";

export type Discipline =
  | "Kalawar Martial Arts"
  | "Football"
  | "Basketball"
  | "Cricket"
  | "Athletics"
  | "Volleyball"
  | "Martial Arts"
  | "Swimming"
  | "Badminton"
  | "Gymnastics"
  | string;

export const disciplines: { name: Discipline; image: string; athletes: number }[] = [
  { name: "Kalawar Martial Arts", image: IMAGES.martialArts, athletes: 50000 },
  { name: "Martial Arts", image: IMAGES.martialArts, athletes: 19850 },
  { name: "Football", image: IMAGES.football, athletes: 41280 },
  { name: "Basketball", image: IMAGES.basketball, athletes: 22940 },
  { name: "Cricket", image: IMAGES.cricket, athletes: 33110 },
  { name: "Athletics", image: IMAGES.athletics, athletes: 28760 },
  { name: "Volleyball", image: IMAGES.volleyball, athletes: 15420 },
  { name: "Swimming", image: IMAGES.swimming, athletes: 12330 },
  { name: "Badminton", image: IMAGES.badminton, athletes: 14670 },
  { name: "Gymnastics", image: IMAGES.gymnastics, athletes: 8940 },
];

export const federationStats = [
  { label: "Registered Players", value: 1000, suffix: "+" },
  { label: "Events Conducted", value: 300, suffix: "+" },
  { label: "Affiliated Clubs", value: 180, suffix: "+" },
  { label: "Certified Coaches", value: 500, suffix: "+" },
];

export type MemberType = "Player" | "Coach" | "Referee" | "Club" | "StateAssociation" | "DistrictAssociation";

export type AcademicHistoryEntry = {
  id?: string;
  academy: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

export type BatchScheduleEntry = {
  name: string;
  time: string;
};

export type BeltHistoryEntry = {
  id?: string;
  examId?: string;
  belt: string;
  previousBelt?: string;
  date?: string;
  promotedDate?: string;
  examiner?: string;
  examinerName?: string;
  sessionName?: string;
  certificateNo?: string;
  certificateNumber?: string;
  academyName?: string;
  score?: number;
  grade?: "Distinction" | "First Class" | "Pass" | string;
  status?: "Passed" | "Conditional" | "Failed" | string;
  remarks?: string;
};

export type Player = {
  id: string;
  name: string;
  memberType?: MemberType;
  discipline: Discipline;
  state: string;
  club: string;
  age: number;
  dob?: string;
  gender?: string;
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
  rawPassword?: string;
  coachName?: string;
  idNumber?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  address?: string;
  district?: string;
  city?: string;
  tempStateAssociation?: string;
  tempDistrictAssociation?: string;
  pincode?: string;
  beltRank?: string;
  ageGroup?: string;
  weightCategory?: string;
  bio?: string;
  // Academic & Transfer History
  academicHistory?: AcademicHistoryEntry[];
  // Coach & Referee specific fields
  qualification?: string;
  experienceYears?: number | string;
  specialization?: string;
  officiatingGrade?: string;
  level?: string;
  matchesOfficiated?: number | string;
  // Club specific fields
  yearFounded?: string | number;
  registrationNumber?: string;
  registeredAddress?: string;
  presidentName?: string;
  secretaryName?: string;
  memberCount?: number | string;
  registrationType?: string;
  levelOfAffiliation?: string;
  levelsOfAffiliation?: string[];
  clubCategory?: string;
  affiliationDocument?: string;
  affiliationDocumentName?: string;
  affiliationDocumentSize?: string;
  certificationDocument?: string;
  certificationDocumentName?: string;
  certificationDocumentSize?: string;
  logo?: string;
  disciplines?: string[];
  headCoachName?: string;
  timings?: string;
  validFrom?: string;
  validUntil?: string;
  paymentStatus?: "Paid" | "Pending" | "Cash Verification Required" | string;
  paymentMethod?: "Razorpay" | "Cash" | "Bank Transfer" | string;
  affiliationCertificateId?: string;
  affiliationNumber?: string;
  certificateNumber?: string;
  photos?: string[];
  achievements?: string[];
  contactPerson?: string;
  alternatePhone?: string;
  website?: string;
  facilities?: string[];
  coachIds?: string[];
  batches?: BatchScheduleEntry[];
  beltHistory?: BeltHistoryEntry[];
  // Coach Affiliation Approval
  clubApprovalStatus?: "pending" | "confirmed" | "rejected";
  // Player-Coach Approval
  coachApprovalStatus?: "pending" | "confirmed" | "rejected";
  rank: number;
  points: number;
  medals: { gold: number; silver: number; bronze: number };
  status: "Active" | "Pending" | "Suspended" | "Incomplete" | "Verified" | "Affiliated" | "Under Review";
  image: string;
  registeredOn: string;
};




export const states = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];
export const clubs = [
  "Titan Athletic Club",
  "Meridian Sports Academy",
  "Royal Crest Club",
  "Vanguard Institute",
  "Northline Academy",
  "Apex Performance Club",
];
const firstNames = [
  "Aarav",
  "Isabella",
  "Rohan",
  "Amara",
  "Kenji",
  "Sofia",
  "Diego",
  "Nadia",
  "Liam",
  "Priya",
  "Mateo",
  "Zara",
  "Ethan",
  "Yuki",
  "Anaya",
  "Lucas",
  "Fatima",
  "Noah",
];
const lastNames = [
  "Mehra",
  "Rossi",
  "Kapoor",
  "Okafor",
  "Tanaka",
  "Alvarez",
  "Silva",
  "Rahman",
  "Sullivan",
  "Nair",
  "Fernandes",
  "Khan",
  "Whitmore",
  "Sato",
  "Deshpande",
  "Moreau",
  "Aziz",
  "Bennett",
];

export const players: Player[] = [];
export const PLAYERS = players;


export type Coach = {
  id: string;
  name: string;
  discipline: Discipline;
  level: "Level A" | "Level B" | "Level C";
  experience: number;
  academy: string;
  athletesTrained: number;
  status: "Verified" | "Pending";
  image: string;
};

export const coaches: Coach[] = [];


export type Referee = {
  id: string;
  name: string;
  discipline: Discipline;
  grade: "International" | "National" | "State";
  matches: number;
  verification: "Verified" | "In Review" | "Expired";
  validTill: string;
  image: string;
};

export const referees: Referee[] = Array.from({ length: 14 }, (_, i) => ({
  id: `KSM-RF-${7310 + i}`,
  name: `${firstNames[(i * 7) % firstNames.length]} ${lastNames[(i * 2) % lastNames.length]}`,
  discipline: disciplines[(i * 3) % disciplines.length].name,
  grade: (["International", "National", "State"] as const)[i % 3],
  matches: 60 + i * 23,
  verification: i % 7 === 0 ? "In Review" : i % 9 === 0 ? "Expired" : "Verified",
  validTill: `Dec 20${26 + (i % 3)}`,
  image: PORTRAITS[(i + 5) % PORTRAITS.length],
}));

export type Club = {
  id: string;
  name: string;
  city: string;
  tier: "Elite" | "Premier" | "Standard";
  members: number;
  founded: number;
  status: "Affiliated" | "Under Review";
  image: string;
};

export const clubsData: Club[] = Array.from({ length: 12 }, (_, i) => ({
  id: `KSM-CL-${2200 + i}`,
  name: `${clubs[i % clubs.length]} ${["North", "South", "East", "West"][i % 4]}`,
  city: states[i % states.length],
  tier: (["Elite", "Premier", "Standard"] as const)[i % 3],
  members: 120 + i * 64,
  founded: 1968 + i * 3,
  status: i % 5 === 0 ? "Under Review" : "Affiliated",
  image: [IMAGES.football, IMAGES.basketball, IMAGES.athletics, IMAGES.swimming][i % 4],
}));
