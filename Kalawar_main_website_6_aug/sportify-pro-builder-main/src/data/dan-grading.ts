export interface DanGradeLevel {
  dan: number; // 1 to 10
  rankName: string; // e.g. "1st Dan Black Belt"
  titleJapanese: string; // e.g. "Sho Dan (初段)"
  titleKorean: string; // e.g. "Il Dan (1단)"
  designation: string; // e.g. "Assistant Instructor / Competitor"
  minTrainingYears: number; // minimum training years required
  timeInPreviousGradeYears: number; // years required in previous Dan
  minAge: number; // minimum age required
  beltColor: string; // "Black Belt" / "Black Belt with Gold Stripe" / etc.
  fee: number; // in INR
  kataForms: string[];
  sparringRequirements: string[];
  selfDefenseWeapons: string[];
  breakingRequirements: string[];
  aadhaarRequired?: boolean;
  currentCertRequired?: boolean;
  medicalFitnessRequired?: boolean;
  theoryThesisRequired: boolean;
  thesisTopic?: string;
  technicalRequirements: string[];
  eligibilityNotes: string;
}

export interface DanExamSession {
  id: string; // e.g. "KAC-DAN-EXAM-2026-01"
  title: string;
  discipline: string;
  examDate: string; // "YYYY-MM-DD"
  reportingTime: string; // "08:00 AM"
  examEndTime: string; // "06:00 PM"
  venueName: string;
  venueAddress: string;
  city: string;
  state: string;
  chiefExaminer: string;
  chiefExaminerRank: string;
  examiners: string[];
  eligibleDans: number[]; // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  registrationDeadline: string;
  fee: number;
  maxCandidates: number;
  description: string;
  status: "Draft" | "Registration Open" | "In Progress" | "Completed" | "Results Published";
  bannerImage?: string;
  candidatesCount?: number;
}

export type DanApplicationStatus =
  | "Submitted"
  | "Under Verification"
  | "Documents Required"
  | "Payment Pending"
  | "Payment Verified"
  | "Eligible"
  | "Exam Scheduled"
  | "Exam Completed"
  | "Result Pending"
  | "Passed"
  | "Failed"
  | "Rejected"
  | "Re-test";

export interface DanAssessmentScore {
  formsScore: number; // 0-25
  sparringScore: number; // 0-25
  selfDefenseScore: number; // 0-25
  breakingScore: number; // 0-15
  theoryThesisScore: number; // 0-10
  totalScore: number; // 0-100
  grade: "Distinction (90%+)" | "First Class (75-89%)" | "Pass (60-74%)" | "Fail (<60%)";
  examinerRemarks: string;
  committeeApprovalDate?: string;
  technicalDirectorApproval: boolean;
  chiefExaminerSignature?: string;
}

export interface DanApplication {
  id: string; // e.g. "KAC-DAN-APP-2026-001"
  examId?: string;
  athleteId: string;
  fullName: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  email: string;
  phone: string;
  state: string;
  academyName: string;
  athletePhoto?: string;
  athletePhotoName?: string;
  
  // Dan Rank Details
  currentDanGrade: number; // 0 for 1st Dan candidate (Gup/Brown), 1 for 2nd Dan, etc.
  currentBeltTitle: string; // e.g. "Brown Belt (1st Gup)" or "1st Dan Black Belt"
  appliedDanGrade: number; // 1 to 10
  appliedDanTitle: string; // e.g. "1st Dan Black Belt (Sho Dan)"
  
  // Previous Dan Certificate & Master
  previousDanCertNo?: string;
  previousDanIssueDate?: string;
  previousDanIssuedBy?: string;
  instructorName: string;
  instructorDanGrade: string;
  
  // Document Uploads (Base64 / URL strings)
  aadhaarDoc?: string;
  aadhaarDocName?: string;
  currentCertDoc?: string;
  currentCertDocName?: string;
  medicalFitnessDoc?: string;
  medicalFitnessDocName?: string;
  thesisDoc?: string;
  thesisDocName?: string;
  paymentProofDoc?: string;
  paymentProofDocName?: string;
  paymentProofDocSize?: string;
  
  // Payment
  paymentStatus: "Paid" | "Pending" | "Cash Verification Required";
  paymentMethod: "Razorpay Online" | "Cash Verification at Venue" | "Direct Bank Transfer";
  transactionId?: string;
  paymentAmount: number;
  
  // Declaration & Timing
  declarationAccepted: boolean;
  appliedDate: string;
  
  // Lifecycle & Results
  status: DanApplicationStatus;
  adminVerificationRemarks?: string;
  attendance: "Pending" | "Present" | "Absent";
  examDate?: string;
  examVenue?: string;
  examTime?: string;
  admitCardIssued?: boolean;
  admitCardIssuedAt?: string;
  assessment?: DanAssessmentScore;
  certificateNumber?: string; // e.g. "KAC-DAN-2026-1001"
  certificateIssuedDate?: string;
  idCardNumber?: string; // e.g. "KAC-DAN-ID-1001"
  discipline?: string;
  district?: string;
  bloodGroup?: string;
  emergencyPhone?: string;
}

export interface DanCertificateData {
  certificateNumber: string;
  idCardNumber: string;
  candidateName: string;
  athleteId: string;
  danRank: number;
  danRankTitle: string;
  japaneseTitle: string;
  koreanTitle: string;
  discipline: string;
  academyName: string;
  state: string;
  photoUrl?: string;
  dob?: string;
  issueDate: string;
  examDate: string;
  score: number;
  grade: string;
  presidentName: string; // "MR. SANTOSH KASBE"
  presidentRole: string; // "Founder & President – India | Head – Technical Committee, India"
  chiefExaminer: string;
  chiefExaminerRank: string;
  qrCodeUrl: string;
  status: "Valid" | "Suspended" | "Revoked";
}

export const DAN_GRADES: DanGradeLevel[] = [
  {
    dan: 1,
    rankName: "1st Dan Black Belt",
    titleJapanese: "Sho Dan (初段)",
    titleKorean: "Il Dan (1단)",
    designation: "Assistant Instructor / Senior Competitor",
    minTrainingYears: 3.5,
    timeInPreviousGradeYears: 1, // From 1st Gup / Brown Belt
    minAge: 16,
    beltColor: "Solid Black Belt (Gold 1-Stripe Tip)",
    fee: 3500,
    kataForms: [
      "Koryo Poomsae / Bassai Dai / Heian Series Mastery",
      "Taeguk 1 to 8 Sequential Demonstration",
      "Rhythm, Breathing (Kiai), and Hip Power Synchronization",
    ],
    sparringRequirements: [
      "Continuous Free Sparring (3 rounds x 2 mins, Olympic/WT Rules)",
      "High-speed counter-attack drills against multiple kicking combos",
      "Clinch control and safe takedowns",
    ],
    selfDefenseWeapons: [
      "10 Standard One-Step Self-Defense Applications (Ilbo Taeryon)",
      "Defense against straight knife thrust & wrist grabs",
      "Joint locks, pressure point release & takedowns",
    ],
    breakingRequirements: [
      "1-direction wood board break with Jumping Back Kick",
      "Hand strike breaking (Ridge Hand / Knife Hand)",
    ],
    theoryThesisRequired: false,
    technicalRequirements: [
      "Minimum 3.5 years of continuous martial arts training under certified Master",
      "Recommendation letter from Affiliated Club Head / Master Instructor",
      "Valid Federation Athlete ID & 1st Gup / Brown belt certificate",
    ],
    eligibilityNotes: "Open to candidates aged 16+ who have achieved 1st Gup / Brown Belt with minimum 12 months active training.",
  },
  {
    dan: 2,
    rankName: "2nd Dan Black Belt",
    titleJapanese: "Ni Dan (弐段)",
    titleKorean: "Ee Dan (2단)",
    designation: "Associate Instructor / Elite Athlete",
    minTrainingYears: 5.5,
    timeInPreviousGradeYears: 2, // 2 years as 1st Dan
    minAge: 18,
    beltColor: "Solid Black Belt (Gold 2-Stripe Tip)",
    fee: 4500,
    kataForms: [
      "Keumgang Poomsae / Kanku Dai / Seienchin",
      "Demonstration of 1st Dan + 2nd Dan syllabus forms with blindfold option",
      "Advanced bunkai (practical application) breakdown of each sequence",
    ],
    sparringRequirements: [
      "Free Sparring against 2 consecutive fresh opponents (2 mins each)",
      "Tactical point sparring and defense in cornered positions",
    ],
    selfDefenseWeapons: [
      "Defense against blunt weapon (Stick / Baton)",
      "Ground defense, mount escape and reversal joint locks",
      "Close-quarters defense against double grab and chokes",
    ],
    breakingRequirements: [
      "2-direction simultaneous break (Jump Front Kick + Turning Kick)",
      "Suspended target high-kick break",
    ],
    theoryThesisRequired: false,
    technicalRequirements: [
      "Minimum 2 years active training and teaching assistance as 1st Dan",
      "Participation in at least 2 State/National championships or grading camps",
      "Valid 1st Dan Federation / Kukkiwon / Recognized Certificate",
    ],
    eligibilityNotes: "Requires 2 full years of active service and training following 1st Dan certification.",
  },
  {
    dan: 3,
    rankName: "3rd Dan Black Belt",
    titleJapanese: "San Dan (参段)",
    titleKorean: "Sam Dan (3단)",
    designation: "Senior Instructor / Club Head Coach",
    minTrainingYears: 8.5,
    timeInPreviousGradeYears: 3, // 3 years as 2nd Dan
    minAge: 21,
    beltColor: "Solid Black Belt (Gold 3-Stripe Tip)",
    fee: 6000,
    kataForms: [
      "Taebaek Poomsae / Jion / Empi / Hangetsu",
      "Teaching-level demonstration with real-time student error correction",
      "Internal energy focus, breathing modulation & dynamic tension",
    ],
    sparringRequirements: [
      "Continuous Free Sparring against 3 opponents with varied fighting styles",
      "Mastery of offensive ring control and counter-timing",
    ],
    selfDefenseWeapons: [
      "Short Staff (Bo / Jo / Hanbo) foundational forms & defense",
      "Defense against multiple unarmed attackers (2 vs 1)",
      "Arresting techniques and non-lethal submission holds",
    ],
    breakingRequirements: [
      "3-direction spinning jumping breaking combination (Wood/Tiles)",
      "Speed break on unsupported target",
    ],
    theoryThesisRequired: false,
    technicalRequirements: [
      "Minimum 3 years active holding of 2nd Dan rank",
      "National Referee / Technical Official certified credential",
      "Track record of mentoring junior belt athletes to state/national podiums",
    ],
    eligibilityNotes: "Candidate must be at least 21 years of age and hold active federation referee credentials.",
  },
  {
    dan: 4,
    rankName: "4th Dan Black Belt",
    titleJapanese: "Yon Dan / Renshi (四段)",
    titleKorean: "Sa Dan / Sa-Bum-Nim (4단)",
    designation: "Master / Chief Instructor / Dojang Director",
    minTrainingYears: 12.5,
    timeInPreviousGradeYears: 4, // 4 years as 3rd Dan
    minAge: 25,
    beltColor: "Solid Black Belt (Gold 4-Stripe Tip & Master Crest)",
    fee: 8500,
    kataForms: [
      "Pyongwon & Sipjin Poomsae / Gojushiho / Unsu",
      "Philosophical and biomechanical dissection of Master-level forms",
      "Creation and defense of custom technical instructional drills",
    ],
    sparringRequirements: [
      "Senior Master combat assessment against National level fighters",
      "Defense and control demonstration under sustained physical fatigue",
    ],
    selfDefenseWeapons: [
      "Defense against edged weapons (Knife / Sword angle defense)",
      "Traditional Martial Arts Weapons Mastery (Nunchaku / Sai / Bo)",
      "Advanced multi-attacker tactical defense (3 vs 1)",
    ],
    breakingRequirements: [
      "4-target power breaking (Wood & Concrete Blocks)",
      "360-degree jumping turning kick target break",
    ],
    theoryThesisRequired: true,
    thesisTopic: "Thesis Submission: 'Advanced Pedagogical Frameworks & Biomechanics in Modern Indian Martial Arts Development' (Minimum 2,500 words).",
    technicalRequirements: [
      "Minimum 4 years active tenure as 3rd Dan Black Belt",
      "Certified National Dojang / Academy with registered student base",
      "Submission of approved research thesis to National Technical Committee",
      "Formal interview and unanimous approval by Technical Committee Panel",
    ],
    eligibilityNotes: "Master Rank (Sa-Bum-Nim). Requires thesis defense and National Technical Committee unanimous clearance.",
  },
  {
    dan: 5,
    rankName: "5th Dan Black Belt",
    titleJapanese: "Go Dan / Kyoshi (五段)",
    titleKorean: "O Dan / Senior Master (5단)",
    designation: "Senior Master / State Technical Director",
    minTrainingYears: 17.5,
    timeInPreviousGradeYears: 5, // 5 years as 4th Dan
    minAge: 30,
    beltColor: "Solid Black Belt (Gold 5-Stripe Tip & Gold Embroidery)",
    fee: 11000,
    kataForms: [
      "Jitae Poomsae / Meikyo / Chinte / Nijushiho",
      "Executive mastery and harmonic presentation of ancient forms",
      "Standardization of state syllabus and examiner calibration",
    ],
    sparringRequirements: [
      "Master-level tactical strategy evaluation & ringside coaching critique",
      "Live combat defense against dynamic multi-threat scenarios",
    ],
    selfDefenseWeapons: [
      "Advanced Dual-Weapons defense and disarm techniques",
      "Tactical law enforcement & VIP executive protection methods",
    ],
    breakingRequirements: [
      "Multiple power breaks including heavy brick/tile demolition",
      "Acrobatic aerial target breaking",
    ],
    theoryThesisRequired: true,
    thesisTopic: "Thesis Submission: 'Strategic Sports Administration & Injury Prevention Protocols in High-Performance Combat Sports' (Minimum 3,500 words).",
    technicalRequirements: [
      "Minimum 5 years active holding of 4th Dan Master Rank",
      "Organized at least 3 State / National level championships",
      "Publication of peer-reviewed training paper or technical manual",
      "Personal interview & oral defense with Grandmaster Panel",
    ],
    eligibilityNotes: "Senior Master Rank. Requires substantial administrative and technical service to the Federation.",
  },
  {
    dan: 6,
    rankName: "6th Dan Black Belt",
    titleJapanese: "Roku Dan / Shihan (六段)",
    titleKorean: "Yuk Dan / Kwan-Jang-Nim (6단)",
    designation: "Grandmaster / National Technical Board Member",
    minTrainingYears: 23.5,
    timeInPreviousGradeYears: 6, // 6 years as 5th Dan
    minAge: 36,
    beltColor: "Red & White Panelled / Embroidered Gold Black Belt",
    fee: 15000,
    kataForms: [
      "Cheonkwon Poomsae / Sochin / Wankan / Gankaku",
      "Supreme technical precision, breathing energy, and aesthetic perfection",
    ],
    sparringRequirements: [
      "High-level strategy adjudication, master combat philosophy evaluation",
    ],
    selfDefenseWeapons: [
      "Universal disarm doctrine against high-risk lethal threats",
      "Mastery of traditional weapons integration in combat",
    ],
    breakingRequirements: [
      "Supreme power break (River stones / Concrete slabs / Heavy wood)",
    ],
    theoryThesisRequired: true,
    thesisTopic: "Dissertation: 'The Socio-Economic Impact and Global Integration of Indian Traditional and Modern Martial Arts' (5,000 words).",
    technicalRequirements: [
      "Minimum 6 years active tenure as 5th Dan Senior Master",
      "Nominated by National Executive Board",
      "Produced minimum 10 Black Belt 1st-3rd Dan instructors",
      "Direct authorization by Founder & President Mr. Santosh Kasbe",
    ],
    eligibilityNotes: "Grandmaster Rank. Awarded strictly upon national technical committee and presidential sanction.",
  },
  {
    dan: 7,
    rankName: "7th Dan Black Belt",
    titleJapanese: "Nana Dan / Kyoshi (七段)",
    titleKorean: "Chil Dan / Senior Grandmaster (7단)",
    designation: "Senior Grandmaster / National Executive Officer",
    minTrainingYears: 30.5,
    timeInPreviousGradeYears: 7, // 7 years as 6th Dan
    minAge: 43,
    beltColor: "Red & White Panelled Grandmaster Belt (Gold Script)",
    fee: 20000,
    kataForms: [
      "Hansu Poomsae / Kanku Sho / Jitte / Bassai Sho",
      "Fluidity, stillness in motion, supreme philosophical expression",
    ],
    sparringRequirements: [
      "Grandmaster ring leadership, referee mentoring, supreme tactical vision",
    ],
    selfDefenseWeapons: [
      "Esoteric self-defense, empty hand neutralization of armed assailants",
    ],
    breakingRequirements: [
      "Grandmaster Power Demonstration",
    ],
    theoryThesisRequired: true,
    thesisTopic: "National Monograph: 'Lifelong Martial Arts Discipline: Cultivating Moral Leadership and Olympic Standards' (6,000 words).",
    technicalRequirements: [
      "Minimum 7 years active holding of 6th Dan Grandmaster rank",
      "Over 30 years of dedicated martial arts service to the nation",
      "Unanimous approval of the National Governing Council",
    ],
    eligibilityNotes: "Senior Grandmaster Rank. Requires 30+ years of martial arts eminence.",
  },
  {
    dan: 8,
    rankName: "8th Dan Black Belt",
    titleJapanese: "Hachi Dan / Hanshi (八段)",
    titleKorean: "Pal Dan / Executive Grandmaster (8단)",
    designation: "Executive Grandmaster / Federation Vice President",
    minTrainingYears: 38.5,
    timeInPreviousGradeYears: 8, // 8 years as 7th Dan
    minAge: 51,
    beltColor: "Red & Gold Panelled Executive Grandmaster Belt",
    fee: 25000,
    kataForms: [
      "Ilyeo Poomsae / Suparinpei / Seisan / Chinto",
      "Transcendence of form, supreme internal power and oneness of mind and body",
    ],
    sparringRequirements: [
      "Honorary combat critique, international rules harmonization",
    ],
    selfDefenseWeapons: [
      "Master of all 8 classical martial arts weapon systems",
    ],
    breakingRequirements: [
      "Lifetime mastery demonstration",
    ],
    theoryThesisRequired: true,
    thesisTopic: "Executive Treatise: 'Evolution of Indian Martial Arts in World Governance and Olympic Inclusion' (8,000 words).",
    technicalRequirements: [
      "Minimum 8 years tenure as 7th Dan Senior Grandmaster",
      "Over 38 years unbroken commitment to martial arts propagation",
      "International federation accreditation and endorsement",
    ],
    eligibilityNotes: "Executive Grandmaster Rank. Conferred by Supreme Council recommendation.",
  },
  {
    dan: 9,
    rankName: "9th Dan Black Belt",
    titleJapanese: "Ku Dan / Meijin (九段)",
    titleKorean: "Gu Dan / Supreme Grandmaster (9단)",
    designation: "Supreme Grandmaster / Technical Council Chairman",
    minTrainingYears: 47.5,
    timeInPreviousGradeYears: 9, // 9 years as 8th Dan
    minAge: 60,
    beltColor: "Supreme Gold Belt with Obsidian Embroidered Script",
    fee: 30000,
    kataForms: [
      "Ilyeo Ultimate Expression / Ancient Heritage Kata Compilation",
    ],
    sparringRequirements: ["Supreme Advisory Adjudication"],
    selfDefenseWeapons: ["Complete Martial Weaponry Hegemony"],
    breakingRequirements: ["Honorary Demolition Demonstration"],
    theoryThesisRequired: true,
    thesisTopic: "Supreme Council Memoir & Legacy Doctrine on National Martial Arts Sovereignty",
    technicalRequirements: [
      "Minimum 9 years tenure as 8th Dan Grandmaster",
      "Nearly half a century of national and international martial excellence",
      "Approved by President Mr. Santosh Kasbe & National Executive Board",
    ],
    eligibilityNotes: "Highest active technical rank attainable in the Federation.",
  },
  {
    dan: 10,
    rankName: "10th Dan Black Belt",
    titleJapanese: "Ju Dan / Supreme Patriarch (十段)",
    titleKorean: "Sip Dan / Honorary Grandmaster Patriarch (10단)",
    designation: "Federation Patriarch / Lifetime Honor of the Century",
    minTrainingYears: 55,
    timeInPreviousGradeYears: 10,
    minAge: 65,
    beltColor: "Supreme Platinum-Gold Patriarch Regalia Belt",
    fee: 0, // Conferred honor
    kataForms: ["Pinnacle Legacy Forms of Kalawar Martial Heritage"],
    sparringRequirements: ["Patriarch Adjudication"],
    selfDefenseWeapons: ["Universal Martial Arts Mastery"],
    breakingRequirements: ["N/A - Conferred Supreme Honor"],
    theoryThesisRequired: false,
    thesisTopic: "Lifetime Achievement & Federation Founding Heritage",
    technicalRequirements: [
      "Awarded exclusively to Federation Founders, Global Martial Arts Legends, or Posthumous Honors",
      "Direct unanimous conferral by President Mr. Santosh Kasbe and Supreme Governing Board",
    ],
    eligibilityNotes: "Supreme Honorary Rank. Awarded for transformative, lifelong dedication to martial arts in India.",
  },
];

export const INITIAL_DAN_EXAM_SESSIONS: DanExamSession[] = [];

export const INITIAL_DAN_APPLICATIONS: DanApplication[] = [];
