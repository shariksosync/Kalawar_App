import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { KalawarEventModel } from "@/models/KalawarEvent";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// System Prompt for Generative AI (OpenAI / Gemini)
const SYSTEM_PROMPT = `
You are the official KALAWAR AI Assistant, the senior digital guide and technical advisor for the KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA (kalawarsports.org).

Federation Details:
- Official Name: KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA
- Tagline: Indian Martial Arts • Sports • Skill • Discipline • Excellence
- Mission: Apex national governing institution standardizing, advancing, and democratizing traditional and modern Indian martial arts, combat sports, and athletic pathways across India.
- Founder & President: Mr. Santosh Uddhav Kasabe
- Key Officials & Technical Board: Master Ashish Doiphode, Mr. Amar Prabhakar Talokar (National Coordination Head & Technical Committee).
- Nationwide Presence: Active across 28+ States, 150+ Affiliated Dojos/Clubs, 850+ Certified Black Belts, and 25,000+ Athletes trained.
- Registered Headquarters: Maharashtra, India.
- Official Helplines: +91 70833 14435 / +91 95614 27125 / +91 74984 62450
- Official Email: contact@kalawarsports.org / support@kalawarsports.org / kalawarmartialartsindia@gmail.com
- WhatsApp Hotline: +91 70833 14435 / +91 74984 62450
- Office Hours: Monday to Saturday, 9:00 AM – 6:00 PM IST (Closed Sundays & National Holidays).

The 5 Finalized Flagship Martial Arts Disciplines of KALAWAR:
1. KALAWAR KAYA YUDDHA (काय युद्ध): Hand Striking Combat – Punching, Timing, Speed, Defense, and Counter-Striking.
2. KALAWAR CHARANA YUDDHA (चरण युद्ध): Kicking Combat – Kicks, Spinning Kicks, Jumping Kicks, Agility, and Flexibility.
3. KALAWAR SANTULANA (संतुलन): Balance & Agility Events – Balance, Coordination, Movement, Speed, and Agility-based Challenges (Scored on technical execution & stability, no standard weight categories).
4. KALAWAR SPARSHA YUDDHA (स्पर्श युद्ध): Semi-Contact Fight – Controlled Hand & Foot Techniques, Scoring, Timing, and Defense.
5. KALAWAR SANGAMA KALA (संगम कला): Combined Martial Arts Event.
   - Sub-Events under Sangama Kala:
     • KALAWAR MALLA YUDDHA (मल्ल युद्ध): Traditional Wrestling / Grappling Combat.
     • KALAWAR DANDA YUDDHA (दंड युद्ध): Traditional Stick Combat.

CRITICAL RULE: Do NOT display Pada Yuddha, Sparring, Kata/Forms, or Self-Defense as separate Flagship Events. Only the 5 official disciplines and the 2 Sangama Kala sub-events above represent KALAWAR official disciplines.

Key Federation Portals & Modules:
- Player / Athlete Registration: Lifetime KALAWAR ID (KSM-PL-...), ID cards, tournament entry access (/register?type=player).
- Coach & Instructor Licensing: Level 1/2/3 licensing (KSM-CO-...), dojo accreditation (/register?type=coach).
- Referee & Judge Accreditation: National referee clinics, judging criteria (KSM-REF-...) (/register?type=referee).
- Club & Academy Affiliation: Official recognition certificate, district/state chapter affiliation (/affiliation or /register?type=club).
- Belt Examinations: 11 Official Anukkama Color Belts (Anukkama 1 Yellow to Anukkama 11 Junior Black Belt), candidate registration, QR admit cards, examiner boards (/belt-exams).
- Black Belt & Dan Grading: 1st Dan to 8th Dan grading, master examiner boards, cryptographic Dan diploma (/dan-grading).
- Championships & Tournaments: Upcoming state & national events at Balewadi Stadium, entry fees, live countdown, brackets (/events & /championship/register).
- Digital Verification: 100% tamper-proof QR code verification for certificates (KAC-CERT-...) and Member IDs (/verify).
- Federation Gear Shop: Official Gi / martial arts uniforms, belts, combat protective gear (/shop).
- Downloads: Constitution, bylaws, belt syllabus PDFs, waiver forms (/downloads).
- Rankings: All-India athlete rankings, state medal tallies (/ranking).

Provide concise, highly professional, polite, and actionable answers with clear next steps and internal links.
`;

type IntentDefinition = {
  id: string;
  // High-priority exact phrase or regex patterns (weight 100)
  highPriorityPatterns?: RegExp[];
  // Standard regex patterns (weight 50)
  patterns: RegExp[];
  // Keywords (weight 10 each)
  keywords?: string[];
  reply: string;
  quickReplies: string[];
  action?: { type: string; url?: string; label?: string };
};

const INTENTS: IntentDefinition[] = [
  // 1. Belt Examinations (11 Official Anukkama Color Belts)
  {
    id: "belt_exams",
    highPriorityPatterns: [
      /\b(anukkama|anukrama|color belt|color belts|11 color belts|11 anukkama|belt exam|belt examination|belt examinations|color belt exam|register for belt|belt registration|belt candidate|belt admit card|color belt grading|belt syllabus|belt progression|belt levels)\b/i,
      /\b(anukkama\s*(1[0-1]|[1-9])\b)/i,
      /\b(yellow belt|yellow belt-1|green belt|green belt-1|blue belt|blue belt-1|red belt|red belt-1|red belt-2|red belt-3|junior black belt)\b/i,
      /\b(aarambha|pravesh|gati|santulan|raksha|pratikrama|veg|shakti|kaushalya|yuddha|sangama)\b/i,
      /\b(belt.*(exam|grading|registration|admit|candidate|level|progression|syllabus))\b/i,
      /\b(register.*belt)\b/i,
    ],
    patterns: [
      /\b(color belt|belt progression|anukkama|color belts)\b/i,
    ],
    reply: `🥋 **11 Official Anukkama Color Belts & Examination Progression**:

The federation standardizes 11 syllabus-compliant Anukkama Color Belt levels across all affiliated dojos:

• 🟡 **Anukkama 1**: Yellow Belt (*Aarambha* / आरम्भ)
• 🟡 **Anukkama 2**: Yellow Belt-1 (*Pravesh* / प्रवेश)
• 🟢 **Anukkama 3**: Green Belt (*Gati* / गति)
• 🟢 **Anukkama 4**: Green Belt-1 (*Santulan* / संतुलन)
• 🔵 **Anukkama 5**: Blue Belt (*Raksha* / रक्षा)
• 🔵 **Anukkama 6**: Blue Belt-1 (*Pratikrama* / प्रतिक्रम)
• 🔴 **Anukkama 7**: Red Belt (*Veg* / वेग)
• 🔴 **Anukkama 8**: Red Belt-1 (*Shakti* / शक्ति)
• 🔴 **Anukkama 9**: Red Belt-2 (*Kaushalya* / कौशल्य)
• 🔴 **Anukkama 10**: Red Belt-3 (*Yuddha* / युद्ध)
• ⚫ **Anukkama 11**: Junior Black Belt (*Sangama* / संगम)

📋 **Examination & Certification Highlights**:
• 🎟️ **Candidate Registration & QR Admit Card**: Register online with Player ID for instant verified admit card.
• 🛡️ **Cryptographic Passing Certificate**: Tamper-proof QR-verified digital certificate permanently linked to national registry (**KAC-CERT-...**).
• 📚 **Examiner Panels**: National Master Examiners evaluate forms (Kata/Poomsae), kicks, sparring drills, breaking, and martial theory.

Click below to register candidates or explore the belt grading portal!`,
    quickReplies: [
      "Register for Belt Exam",
      "Anukkama 1 to 5 Details",
      "Anukkama 6 to 11 Details",
      "Black Belt & Dan Grading",
      "Verify Certificate / ID",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/belt-exams", label: "Open Belt Examinations Portal" },
  },

  // 1b. Anukkama Tier 1 Belts (Anukkama 1 to 5)
  {
    id: "anukkama_tier1",
    highPriorityPatterns: [
      /\b(anukkama 1 to 5|anukkama 1-5|yellow belt details|green belt details|blue belt details|anukkama 1\b|anukkama 2\b|anukkama 3\b|anukkama 4\b|anukkama 5\b|aarambha|pravesh|gati|santulan|raksha)\b/i,
    ],
    patterns: [
      /\b(yellow belt|yellow-1|green belt|green-1|blue belt)\b/i,
    ],
    reply: `🟡🟢🔵 **Anukkama 1 to 5 (Foundation to Intermediate Color Belts)**:

• 🟡 **Anukkama 1 (Yellow Belt - Aarambha / आरम्भ)**: 8th Gup • Min 3 mos • Forms: Saju Jirugi, Dan-Gun • Techniques: Gunnun Sogi, Niunja Sogi, Ap Chagi, Low Block.
• 🟡 **Anukkama 2 (Yellow Belt-1 - Pravesh / प्रवेश)**: 7th Gup • Min 3 mos • Forms: Taegeuk Il Jang • Techniques: Dollyo Chagi, Rising High Block, Sonkal Daebi Makgi.
• 🟢 **Anukkama 3 (Green Belt - Gati / गति)**: 6th Gup • Min 6 mos • Forms: Taegeuk Sam Jang / Do-San • Techniques: Dwi Chagi, Naeryeo Chagi, Double Forearm Block.
• 🟢 **Anukkama 4 (Green Belt-1 - Santulan / संतुलन)**: 5th Gup • Min 4 mos • Forms: Taegeuk Sam Jang • Techniques: Back Kick, Spear Finger Thrust, Semi-Free Sparring.
• 🔵 **Anukkama 5 (Blue Belt - Raksha / रक्षा)**: 4th Gup • Min 9 mos • Forms: Taegeuk Oh/Yuk Jang • Techniques: Spinning Hook Kick, Jumping Front Kick, Combat Sparring.`,
    quickReplies: [
      "Anukkama 6 to 11 Details",
      "Register for Belt Exam",
      "Black Belt & Dan Grading",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/belt-exams", label: "View Belt Syllabus" },
  },

  // 1c. Anukkama Tier 2 Belts (Anukkama 6 to 11)
  {
    id: "anukkama_tier2",
    highPriorityPatterns: [
      /\b(anukkama 6 to 11|anukkama 6-11|red belt details|junior black belt details|anukkama 6\b|anukkama 7\b|anukkama 8\b|anukkama 9\b|anukkama 10\b|anukkama 11\b|pratikrama|veg|shakti|kaushalya|yuddha|sangama)\b/i,
    ],
    patterns: [
      /\b(blue-1|red belt|red-1|red-2|red-3|junior black)\b/i,
    ],
    reply: `🔵🔴⚫ **Anukkama 6 to 11 (Advanced to Junior Black Belt)**:

• 🔵 **Anukkama 6 (Blue Belt-1 - Pratikrama / प्रतिक्रम)**: 3rd Gup • Min 5 mos • Forms: Taegeuk Oh Jang • Techniques: Twimyo Yop Chagi, X-Fist Pressing Block, Full-Contact Sparring.
• 🔴 **Anukkama 7 (Red Belt - Veg / वेग)**: 2nd Gup • Min 6 mos • Forms: Taegeuk Yuk Jang • Techniques: Jumping Spinning Hook Kick, Twin Knife-Hand Block, 2 vs 1 Sparring.
• 🔴 **Anukkama 8 (Red Belt-1 - Shakti / शक्ति)**: 1st Gup Senior • Min 6 mos • Forms: Taegeuk Chil Jang • Techniques: 360 Tornado Kick, Low Scissors Block, Clinch Control.
• 🔴 **Anukkama 9 (Red Belt-2 - Kaushalya / कौशल्य)**: 1st Gup Advanced • Min 6 mos • Forms: Taegeuk Pal Jang • Techniques: Flying Side Kick over Obstacles, Mountain Block.
• 🔴 **Anukkama 10 (Red Belt-3 - Yuddha / युद्ध)**: Pre-Black Candidate • Min 6 mos • Forms: All 8 Taegeuk Patterns • Techniques: 540 Kick, Iron Man 5-Round Sparring.
• ⚫ **Anukkama 11 (Junior Black Belt - Sangama / संगम)**: Poom/Junior Dan • Min 6 mos • Forms: Koryo Poomsae • Techniques: Pressure Point Mastery, Senior Tactical Sparring.`,
    quickReplies: [
      "Anukkama 1 to 5 Details",
      "Register for Belt Exam",
      "Black Belt & Dan Grading",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/belt-exams", label: "Register for Belt Exam" },
  },

  // 2. Black Belt & Dan Grading (1st Dan to 8th Dan)
  {
    id: "dan_grading",
    highPriorityPatterns: [
      /\b(dan grading|black belt|dan exam|dan rank|1st dan|2nd dan|3rd dan|4th dan|5th dan|6th dan|7th dan|8th dan|dan diploma|dan accreditation|kukkiwon|black belt license|dan certificate|kac-dan)\b/i,
      /\b(dan.*(exam|grading|certificate|diploma|rank|accreditation))\b/i,
      /\b(register.*(dan|black belt))\b/i,
    ],
    patterns: [
      /\bdan\b/i,
      /\bblack belt\b/i,
      /\bgrandmaster\b/i,
    ],
    reply: `🥋 **Black Belt & Dan Rank Accreditation (1st Dan to 8th Dan)**:

The apex national authority for legitimate Black Belt & Dan accreditation in India:

• 🎖️ **Dan Levels**: 1st Dan (Black Belt), 2nd Dan, 3rd Dan (Senior Master), up to 8th Dan (Grandmaster Governing Board).
• 📜 **Cryptographic Dan Diploma**: Official high-security Dan diploma registered on the All-India national database.
• 🪪 **Dan Lifetime ID Card**: Issued with permanent national registration serial (**KAC-DAN-...**).
• 📚 **Syllabus & Eligibility**: Rigorous testing across technical form execution, sparring mastery, martial ethics, and refereeing competence.

Click below to explore Dan grading criteria and register online!`,
    quickReplies: [
      "Dan Grading Portal",
      "11 Anukkama Color Belts",
      "Verify Certificate / ID",
      "Coach Registration",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/dan-grading", label: "Open Dan Grading Portal" },
  },

  // 3. Championship Registration & Tournament Entries
  {
    id: "championship_register",
    highPriorityPatterns: [
      /\b(championship register|register for championship|tournament registration|register for tournament|register for competition|tournament entry|championship registration|competition registration|fight registration|championship entry|register event|event registration)\b/i,
      /\b(register\s+(for|in)\s+.*(tournament|championship|competition|event))\b/i,
      /\b(register.*(tournament|championship|competition))\b/i,
    ],
    patterns: [
      /\b(tournament registration|championship entry)\b/i,
    ],
    reply: `🏆 **Championship & Tournament Online Registration**:

Register to compete on official national tatamis with computerized electronic scoring:

• 📍 **Upcoming Event**: *All-India Kaya Yuddha National Championship 2026*
• 🏟️ **Venue**: Shiv Chhatrapati Sports Complex, Balewadi, Pune, Maharashtra.
• 👥 **Age Categories**: Sub-Junior (U-8, U-10, U-12), Cadet (U-14), Junior (U-17), and Senior Open (18+).
• ⚖️ **Weight Divisions**: Standardized weight brackets for balanced, safe competition.
• 🥇 **Awards & Honors**: Gold, Silver, Bronze medals, Championship Trophies, merit certificates, and All-India ranking points.

Click below to complete your championship registration!`,
    quickReplies: [
      "Register for Championship",
      "View All Tournaments",
      "Tournament Rules & Scoring",
      "The 5 Flagship Disciplines",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/championship/register", label: "Register for Championship" },
  },

  // 4. Events, Championships & Tournament Calendar
  {
    id: "events_calendar",
    highPriorityPatterns: [
      /\b(upcoming championships|upcoming events|upcoming tournaments|tournament calendar|events calendar|event dates|championship calendar|tournament schedule|balewadi|pune championship|next tournament|competition schedule|tournament dates)\b/i,
      /\b((tournament|championship|event).*(calendar|schedule|dates|upcoming))\b/i,
    ],
    patterns: [
      /\b(tournaments|calendar|events list)\b/i,
    ],
    reply: `📅 **KALAWAR National Championship & Event Calendar 2026**:

• 🏆 **All-India Kaya Yuddha Championship** (Balewadi Sports Complex, Pune) — Open for registration!
• 🥋 **State & Zonal Qualifying Tournaments** (Maharashtra, Gujarat, Delhi-NCR, Karnataka, Punjab).
• 🎗️ **National Belt Grading Seminars** (Quarterly state-wide examiner clinics).
• 🎓 **Referee & Master Coach Clinics** (Annual rules & electronic scoring masterclasses).

Click below to browse full event details, dates, and venue guides!`,
    quickReplies: [
      "Register for Championship",
      "The 5 Flagship Disciplines",
      "Athlete Registration",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/events", label: "View Tournament Calendar" },
  },

  // 5. Coach & Instructor Accreditation
  {
    id: "coach_registration",
    highPriorityPatterns: [
      /\b(coach registration|instructor registration|register as coach|register as instructor|coaching license|coach license|become a coach|coach accreditation|ksm-co|wsf-co|coach clinic|master coach)\b/i,
      /\b(register.*(coach|instructor))\b/i,
    ],
    patterns: [
      /\b(coach|instructor|coaching)\b/i,
    ],
    reply: `👨‍🏫 **Coach & Instructor Accreditation (KSM-CO)**:

Empower your dojo with official federation credentials:

• 📜 **Official License**: Get licensed as a Level 1, Level 2, or Senior Master Coach (**KSM-CO-...**).
• 🏫 **Dojo & Student Management**: Register and manage student profiles, confirm athlete entries, and issue local progress cards.
• 🏆 **Corner Pass Access**: Official corner coach passes for state and national rings.
• 🎓 **National Coach Clinics**: Standardized syllabus seminars, sports psychology, and injury prevention workshops.
• 📋 **Requirements**: Valid Black Belt credentials (1st Dan+) and recognized instructor profile.`,
    quickReplies: [
      "Register as Coach",
      "Club Affiliation",
      "Black Belt & Dan Grading",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/register?type=coach", label: "Register as Coach" },
  },

  // 6. Referee & Judge Accreditation
  {
    id: "referee_registration",
    highPriorityPatterns: [
      /\b(referee registration|judge registration|register as referee|register as judge|referee license|judge license|referee accreditation|ksm-ref|ksm-rf|wsf-ref|wsf-rf|referee clinic|tatami official|scoring official|arbitrator)\b/i,
      /\b(register.*(referee|judge))\b/i,
    ],
    patterns: [
      /\b(referee|judge|tatami official)\b/i,
    ],
    reply: `⚖️ **Referee & Tournament Official Accreditation (KSM-REF)**:

Officiate high-standard state, zonal, and national championships:

• 🛡️ **Accredited License**: Verified Federation Referee License (**KSM-REF-...**).
• 📊 **Electronic Scoring**: Master computerized tatami point scoring, foul assessments, and ring safety management.
• 📚 **Rules Certification**: Standardized bylaws, legal strike zones, and penalty protocols.
• 🎓 **Annual Clinics**: National referee clinics with hands-on simulated bout assessments.`,
    quickReplies: [
      "Register as Referee",
      "The 5 Flagship Disciplines",
      "Tournament Rules & Scoring",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/register?type=referee", label: "Register as Referee" },
  },

  // 7. Club & Dojo Affiliation
  {
    id: "club_affiliation",
    highPriorityPatterns: [
      /\b(club affiliation|dojo affiliation|affiliate club|affiliate dojo|academy affiliation|affiliate academy|register club|register dojo|school affiliation|affiliation certificate|affiliation fee|how to affiliate|dojo accreditation)\b/i,
      /\b(affiliate.*(dojo|club|academy|school))\b/i,
    ],
    patterns: [
      /\b(affiliation|affiliate|dojo|club|academy)\b/i,
    ],
    reply: `🏫 **Club, Dojo & Academy Affiliation**:

Affiliate your martial arts academy with the KALAWAR National Governing Council:

• 📜 **Official Affiliation Certificate**: Recognized national accreditation certificate for your dojo.
• 🥋 **Belt Exam Hosting Rights**: Host official color belt grading examinations for your students at your own dojo.
• 🌐 **National Portal Listing**: Feature your dojo in the official federation public directory and club locator.
• 🏆 **Team Entry Discounts**: Subsidized tournament entries and bulk gear packages for affiliated dojos.
• 🛡️ **Direct State Chapter Representation**: Full voting and representation rights within your state association.`,
    quickReplies: [
      "Apply for Club Affiliation",
      "Coach Registration",
      "Belt Exams & Dan Grading",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/affiliation", label: "Apply for Club Affiliation" },
  },

  // 8. Athlete / Player Registration (General onboarding)
  {
    id: "player_registration",
    highPriorityPatterns: [
      /\b(player registration|athlete registration|register as player|register as athlete|register athlete|join as player|player id|athlete license|ksm-pl|wsf-pl|new athlete|player admission|how do i register as a player|register player)\b/i,
      /\b(how to register as.*(player|athlete|member))\b/i,
      /\b(how to get.*player id)\b/i,
    ],
    patterns: [
      /\b(athlete|player registration)\b/i,
    ],
    reply: `👤 **Athlete / Player Registration Guide**:

Join over 1,97,000+ registered martial artists across India:

• 🆔 **Lifetime KALAWAR Player ID**: Receive your permanent digital athlete ID (**KSM-PL-...**).
• 🪪 **Digital Player ID Card**: Download and print your verified athlete ID card with QR code.
• 🏆 **Tournament Eligibility**: Direct eligibility for state, zonal, and All-India national championships.
• 📜 **Grading Records**: Automatically track your belt exam promotions and Dan ranks in your personal portal.
• 📋 **Requirements**: Full Name, Mobile Number, Email Address, Date of Birth, State / District, and optional Dojang/Club name.

Registration takes less than 2 minutes online!`,
    quickReplies: [
      "Go to Player Registration",
      "Coach Registration",
      "Belt Exams & Dan Grading",
      "Upcoming Championships",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/register?type=player", label: "Register as Player" },
  },

  // 9. Digital Verification (Certificate & Member ID)
  {
    id: "verification",
    highPriorityPatterns: [
      /\b(verify certificate|certificate verification|verify id|verify player|verify member|check certificate|qr code verify|validate certificate|authentic certificate|fake certificate|kac-cert|verify credential|verify license)\b/i,
      /\b(verify.*(certificate|id|member|player|coach|referee|credential))\b/i,
      /\b(check.*(certificate|authenticity))\b/i,
    ],
    patterns: [
      /\b(verify|verification|validate)\b/i,
    ],
    reply: `🛡️ **100% Cryptographic Digital Verification**:

Authenticate any KALAWAR credential in real time with zero counterfeits:

• 📜 **Certificate Verification**: Enter your Certificate Serial (**KAC-CERT-...**) to view real-time passing status, Dan grade, examiner name, and issuance date.
• 🪪 **Member ID Verification**: Enter your Player ID (**KSM-PL-...**), Coach ID (**KSM-CO-...**), or Referee ID (**KSM-REF-...**) to verify active federation standing.
• 📱 **Instant QR Code Scan**: Scan the QR code printed on any certificate or ID card using your smartphone camera for immediate validation.`,
    quickReplies: [
      "Verify Certificate Online",
      "Athlete Registration",
      "11 Anukkama Color Belts",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/verify", label: "Verify Credential Now" },
  },

  // 10. Downloads & Personal ID Cards / Admit Cards
  {
    id: "personal_downloads",
    highPriorityPatterns: [
      /\b(download id card|download my id card|my id card|get id card|print id card|admit card download|download certificate|my receipts|my admit card|get my.*id card|download.*id card|print.*id card)\b/i,
      /\b((download|get|print|access).*(my id card|player id card|admit card|receipt))\b/i,
    ],
    patterns: [
      /\b(my id card|admit card download)\b/i,
    ],
    reply: `🪪 **Download ID Cards & Certificates**:

Access your official verified federation documents:

• 🪪 **Player ID Card**: Download high-resolution, printable athlete ID card with verified QR code.
• 🎟️ **Belt Exam Admit Cards**: Print candidate admit cards with venue and roll number details.
• 📜 **Certificates of Merit & Dan Diplomas**: Download your official verified certificates anytime.
• 🧾 **Payment Receipts**: View and download official payment receipts and GST invoices.`,
    quickReplies: [
      "Download My ID Card",
      "Verify Certificate / ID",
      "11 Anukkama Color Belts",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/my-id-card", label: "Download My ID Card" },
  },

  // 11. The 5 Flagship Disciplines Overview
  {
    id: "disciplines_all",
    highPriorityPatterns: [
      /\b(the 5 flagship disciplines|5 disciplines|flagship disciplines|martial arts disciplines|5 events|what disciplines|combat styles|martial arts styles|disciplines of kalawar|kalawar events|final 5 events|all disciplines)\b/i,
    ],
    patterns: [
      /\bdisciplines\b/i,
      /\bstyles\b/i,
      /\bflagship\b/i,
    ],
    reply: `🥋 **The 5 Flagship Martial Arts Disciplines of KALAWAR**:

The federation standardizes five official Indian combat disciplines and martial arts events:

1. 🥊 **KALAWAR KAYA YUDDHA (काय युद्ध)**: Hand Striking Combat – Punching, Timing, Speed, Defense, and Counter-Striking.
2. 🦵 **KALAWAR CHARANA YUDDHA (चरण युद्ध)**: Kicking Combat – Kicks, Spinning Kicks, Jumping Kicks, Agility, and Flexibility.
3. ⚖️ **KALAWAR SANTULANA (संतुलन)**: Balance & Agility Events – Balance, Coordination, Movement, Speed, and Agility-based Challenges (No weight categories; scored on technical stability & precision).
4. 🥋 **KALAWAR SPARSHA YUDDHA (स्पर्श युद्ध)**: Semi-Contact Fight – Controlled Hand & Foot Techniques, Point Scoring, Timing, and Defense.
5. ⚔️ **KALAWAR SANGAMA KALA (संगम कला)**: Combined Martial Arts Event.
   🔹 **Sangama Kala Sub-Events**:
   • 🤼 **KALAWAR MALLA YUDDHA (मल्ल युद्ध)**: Traditional Wrestling / Grappling Combat.
   • 🥢 **KALAWAR DANDA YUDDHA (दंड युद्ध)**: Traditional Stick Combat.

Click below to explore rules, weight categories, and upcoming tournaments!`,
    quickReplies: [
      "Kaya Yuddha Details",
      "Charana Yuddha Details",
      "Santulana Details",
      "Sparsha Yuddha Details",
      "Sangama Kala & Sub-Events",
      "Register for Championship",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/events", label: "Explore All Disciplines" },
  },

  // 12. Kaya Yuddha (Hand Striking Combat)
  {
    id: "kaya_yuddha",
    highPriorityPatterns: [
      /\b(kaya yuddha|hand striking|punching combat|kaya yudha|upper body combat|boxing style|kaya yudh)\b/i,
    ],
    patterns: [
      /\bkaya\b/i,
      /\bhand striking\b/i,
      /\bpunches\b/i,
    ],
    reply: `🥊 **KALAWAR KAYA YUDDHA (काय युद्ध) – Hand Striking Combat**:

• **Core Overview**: Upper-body hand striking mastery emphasizing punching precision, reaction timing, rapid footwork, defensive head movement, and counter-striking.
• **Key Focus Areas**: Straight punches (jabs/crosses), hooks, uppercuts, defensive slips, parries, infighting, and tactical distance control.
• **Equipment Required**: Federation-approved boxing/sparring gloves, headguard with cheek protection, mouthguard, groin guard, and official KALAWAR combat uniform.
• **Scoring Matrix**: 1 Point for single clean landing punch; 2 Points for combination strikes; scored via digital referee consoles.`,
    quickReplies: [
      "Charana Yuddha Details",
      "Santulana Details",
      "Sparsha Yuddha Details",
      "Register for Championship",
      "Official Uniforms & Gear",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/events", label: "View Kaya Yuddha Events" },
  },

  // 13. Charana Yuddha (Kicking Combat)
  {
    id: "charana_yuddha",
    highPriorityPatterns: [
      /\b(charana yuddha|kicking combat|charan yuddha|kicking discipline|spinning kicks|jumping kicks|charana yudha|charan yudh)\b/i,
    ],
    patterns: [
      /\bcharana\b/i,
      /\bcharan\b/i,
      /\bkicking combat\b/i,
      /\bkicks\b/i,
    ],
    reply: `🦵 **KALAWAR CHARANA YUDDHA (चरण युद्ध) – Kicking Combat**:

• **Core Overview**: High-impact dynamic kicking discipline testing lower-body power, acrobatic speed, flexibility, and tactical kicking range.
• **Key Focus Areas**: Roundhouse kicks, front snap kicks, side thrust kicks, axe kicks, 360° spinning hook kicks, and jumping dynamic kicks.
• **Equipment Required**: Federation-approved shin & instep protectors, chest protector (Hogu), headguard, groin guard, and official combat uniform.
• **Scoring Matrix**: 2 Points for legal body kicks; 3 Points for head kicks; 4 Points for turning/spinning jumping head kicks.`,
    quickReplies: [
      "Kaya Yuddha Details",
      "Santulana Details",
      "Sparsha Yuddha Details",
      "Register for Championship",
      "Official Uniforms & Gear",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/events", label: "View Charana Yuddha Events" },
  },

  // 14. Santulana (Balance & Agility)
  {
    id: "santulana",
    highPriorityPatterns: [
      /\b(santulana|balance & agility|agility challenges|equilibrium|santulan event|balance event|santulana scoring|balance discipline)\b/i,
    ],
    patterns: [
      /\bsantulana\b/i,
      /\bsantulan\b/i,
      /\bbalance\b/i,
      /\bagility\b/i,
    ],
    reply: `⚖️ **KALAWAR SANTULANA (संतुलन) – Balance & Agility Events**:

• **Core Overview**: Specialized agility, equilibrium, and martial coordination discipline testing athletic movement, posture control, reflex speed, and spatial awareness.
• **Key Focus Areas**: Single-leg stability tests, dynamic balance beam/pole routines, rapid hurdle transitions, obstacle agility courses, and evasive body movement.
• **Weight Categories**: **NO Weight Divisions** — open evaluation based purely on technical execution, balance retention, agility time, and posture precision.
• **Evaluation Criteria**: Scored on static balance duration, posture symmetry, speed of course traversal, faultless landing, and breathing control.`,
    quickReplies: [
      "Sparsha Yuddha Details",
      "Sangama Kala & Sub-Events",
      "The 5 Flagship Disciplines",
      "Register for Championship",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/events", label: "View Santulana Challenges" },
  },

  // 15. Sparsha Yuddha (Semi-Contact Fight)
  {
    id: "sparsha_yuddha",
    highPriorityPatterns: [
      /\b(sparsha yuddha|semi contact fight|point touch combat|sparsha yudha|controlled fight|semi contact|sparsh yuddha)\b/i,
    ],
    patterns: [
      /\bsparsha\b/i,
      /\bsemi contact\b/i,
      /\bpoint fight\b/i,
    ],
    reply: `🥋 **KALAWAR SPARSHA YUDDHA (स्पर्श युद्ध) – Semi-Contact Fight**:

• **Core Overview**: Precision-driven, light/semi-contact combat focused on instantaneous point scoring, lightning-fast defensive counters, and technical control.
• **Key Focus Areas**: Controlled punches, fast snap kicks, counter-evasions, distance management, and high-speed point touches without excessive force.
• **Safety Rules**: Strict prohibition of heavy knockout blows; combat pauses immediately upon scoring confirmation for point verification.
• **Equipment Required**: Open-palm sparring mitts, headguard, mouthguard, shin-instep guards, and chest protector.`,
    quickReplies: [
      "Sangama Kala & Sub-Events",
      "Kaya Yuddha Details",
      "Charana Yuddha Details",
      "Register for Championship",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/events", label: "View Sparsha Yuddha Events" },
  },

  // 16. Sangama Kala (Combined Martial Arts Event)
  {
    id: "sangama_kala",
    highPriorityPatterns: [
      /\b(sangama kala|combined martial arts|sangam kala|heritage combat|traditional weapons and wrestling|sub events of sangama)\b/i,
    ],
    patterns: [
      /\bsangama\b/i,
      /\bsangam\b/i,
      /\bcombined martial arts\b/i,
    ],
    reply: `⚔️ **KALAWAR SANGAMA KALA (संगम कला) – Combined Martial Arts Event**:

• **Core Overview**: Apex heritage combat umbrella bringing together ancient Indian battlefield arts, weapon mastery, and close-quarters submission wrestling under standardized sporting regulations.
• **🔹 Official Sub-Events**:
  1. 🤼 **KALAWAR MALLA YUDDHA (मल्ल युद्ध)**: Traditional Indian wrestling, throws, locks, takedowns, and mat grappling control.
  2. 🥢 **KALAWAR DANDA YUDDHA (दंड युद्ध)**: Traditional Indian stick combat, strikes, parries, disarms, and tactical staff sparring.

Click below for in-depth sub-event rules and registration details!`,
    quickReplies: [
      "Malla Yuddha Details",
      "Danda Yuddha Details",
      "The 5 Flagship Disciplines",
      "Register for Championship",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/events", label: "Explore Sangama Kala" },
  },

  // 16b. Malla Yuddha (Sub-Event of Sangama Kala)
  {
    id: "malla_yuddha",
    highPriorityPatterns: [
      /\b(malla yuddha|malla yudha|traditional wrestling|grappling combat|kushti combat|indian wrestling|malla yudh)\b/i,
    ],
    patterns: [
      /\bmalla\b/i,
      /\bgrappling\b/i,
      /\bwrestling\b/i,
      /\btakedowns\b/i,
    ],
    reply: `🤼 **KALAWAR MALLA YUDDHA (मल्ल युद्ध) – Traditional Wrestling & Grappling**:

• **Sub-Event Of**: **Kalawar Sangama Kala (संगम कला)**.
• **Core Overview**: Ancient Indian grappling discipline focusing on standing takedowns, clinch trips (Dhobi Pachhad, Multani), mat control, and submission holds.
• **Permitted Techniques**: Shoulder throws, hip tosses, leg trips, arm drags, waist locks, and pinning controls.
• **Prohibited**: Striking (punches/kicks), eye-gouging, biting, hair pulling, neck cranks, and joint hyperextensions.
• **Scoring & Victory**: Points awarded for high-amplitude throws (3 Pts), takedowns (2 Pts), and reversals (1 Pt); direct win by Pinfall (Chit).`,
    quickReplies: [
      "Danda Yuddha Details",
      "Sangama Kala & Sub-Events",
      "The 5 Flagship Disciplines",
      "Register for Championship",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/events", label: "View Malla Yuddha Regulations" },
  },

  // 16c. Danda Yuddha (Sub-Event of Sangama Kala)
  {
    id: "danda_yuddha",
    highPriorityPatterns: [
      /\b(danda yuddha|danda yudha|stick combat|traditional stick fighting|lathi combat|staff sparring|weapon combat|danda yudh)\b/i,
    ],
    patterns: [
      /\bdanda\b/i,
      /\bstick\b/i,
      /\blathi\b/i,
      /\bstaff\b/i,
    ],
    reply: `🥢 **KALAWAR DANDA YUDDHA (दंड युद्ध) – Traditional Stick Combat**:

• **Sub-Event Of**: **Kalawar Sangama Kala (संगम कला)**.
• **Core Overview**: Traditional Indian martial staff combat showcasing high-speed strikes, angled thrusts, defensive blocks, circular sweeps, and disarming tactics.
• **Equipment & Safety**: Standardized padded rattan/fiberglass practice sticks, full-face protective helmet with steel mesh, padded body vest, and hand guards.
• **Scoring System**: Clean touch strikes landing on designated torso zones and headgear earn 1–2 points; disarming the opponent grants 3 points.`,
    quickReplies: [
      "Malla Yuddha Details",
      "Sangama Kala & Sub-Events",
      "The 5 Flagship Disciplines",
      "Register for Championship",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/events", label: "View Danda Yuddha Regulations" },
  },

  // 17. Competition Rules & Scoring Framework
  {
    id: "rules_scoring",
    highPriorityPatterns: [
      /\b(competition rules|scoring system|tournament rules|rules and regulations|points system|foul rules|penalty|weight categories|weight classes|age categories|how is santulana scored|scoring in kaya yuddha|scoring in charana yuddha|scoring in sparsha yuddha)\b/i,
    ],
    patterns: [
      /\brules\b/i,
      /\bscoring\b/i,
      /\bweight\b/i,
      /\bpenalties\b/i,
    ],
    reply: `📚 **KALAWAR Competition Rules & Scoring Framework**:

The federation governs 5 official combat disciplines under strict referee adjudication:

• 🥊 **Kaya Yuddha**: 1 Pt per legal punch to body/headgear; full contact with protective gloves & headgear.
• 🦵 **Charana Yuddha**: 2 Pts for body kicks; 3 Pts for head kicks; 4 Pts for spinning jump kicks.
• ⚖️ **Santulana**: No weight categories; scored 1–10 by judges on stability duration, agility course speed, posture precision, and landing faults.
• 🥋 **Sparsha Yuddha**: Semi-contact point scoring; 1 Pt hand touches, 2 Pts kick touches; paused on touch confirmation.
• ⚔️ **Sangama Kala**:
  - 🤼 **Malla Yuddha**: 2–3 Pts for throws/takedowns; victory by Pinfall (Chit).
  - 🥢 **Danda Yuddha**: 1–2 Pts per legal padded stick strike; 3 Pts for disarm.

Click below to download the official 12-section rulebook PDF!`,
    quickReplies: [
      "The 5 Flagship Disciplines",
      "Download Rules PDF",
      "Register for Championship",
      "Referee Registration",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/rules", label: "View Official Rulebook" },
  },

  // 18. Gear Store & Official Uniforms
  {
    id: "shop_gear",
    highPriorityPatterns: [
      /\b(store|shop|buy uniform|buy gi|dobok|martial arts suit|sparring gloves|headguard|shin guard|chest guard|buy belt|gear prices|equipment store|uniform price)\b/i,
    ],
    patterns: [
      /\bshop\b/i,
      /\bstore\b/i,
      /\buniform\b/i,
      /\bgear\b/i,
      /\bequipment\b/i,
    ],
    reply: `🛒 **Official KALAWAR Gear & Uniform Store**:

Order tournament-approved martial arts uniforms, protection gear, and federation apparel:

• 🥋 **Official Uniforms (Gi/Dobok)**: Heavyweight & lightweight tournament uniforms with embroidered federation crest.
• 🥊 **Protective Sparring Gear**: Approved boxing/sparring gloves, foam headguards, chest protectors, shin guards & mouthguards.
• 🎗️ **Belts**: High-density stitched color belts and master Black Belts.
• 💳 **Payment Modes**: UPI, Debit/Credit Cards, NetBanking, and Cash on Delivery / Cash to Coach.
• 🚚 **Pan-India Delivery**: Fast 3–5 business days shipping with downloadable GST invoices.`,
    quickReplies: [
      "Visit Federation Store",
      "Track My Orders",
      "Athlete Registration",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/shop", label: "Visit Federation Store" },
  },

  // 19. Orders, Tracking & Shipping
  {
    id: "orders_tracking",
    highPriorityPatterns: [
      /\b(order status|track order|track my order|delivery time|shipping status|order invoice|order receipt|return policy|cancel order)\b/i,
    ],
    patterns: [
      /\border\b/i,
      /\btrack\b/i,
      /\bshipping\b/i,
      /\bdelivery\b/i,
    ],
    reply: `📦 **Order Tracking & Delivery Information**:

• 🚚 **Fast Delivery**: Orders are dispatched within 24 hours and delivered in 3–5 business days across all Indian states.
• 🧾 **GST Invoice**: Download official GST invoice directly from your orders page.
• 🔍 **Real-Time Tracking**: Track live dispatch and delivery stages via your account.
• 🔄 **Returns & Exchanges**: 7-day hassle-free replacement for defective or incorrect sizing.`,
    quickReplies: [
      "Track Orders",
      "Visit Federation Store",
      "Contact Secretariat",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/orders", label: "Track My Orders" },
  },

  // 20. Official Downloads & Rulebooks Repository
  {
    id: "downloads_center",
    highPriorityPatterns: [
      /\b(download pdf|downloads|downloads center|constitution pdf|bylaws pdf|syllabus pdf|download forms|rulebook pdf|medical waiver form|parental consent form)\b/i,
    ],
    patterns: [
      /\bdownload\b/i,
      /\bdownloads\b/i,
      /\bpdf\b/i,
      /\bconstitution\b/i,
      /\bbylaws\b/i,
    ],
    reply: `📂 **Official Downloads & Document Repository**:

Access official PDFs, statutory guidelines, and federation rulebooks:

• 📘 **KALAWAR National Constitution & Bylaws**
• 🥋 **Standardized Dan Syllabus & Examination Guidelines**
• 🥊 **Competition Rulebook & Electronic Scoring Manual**
• 📄 **Medical Waiver & Parental Consent Forms**
• 🏫 **Club Affiliation Application Guidelines**

Download free copies directly from our portal!`,
    quickReplies: [
      "Open Downloads Center",
      "The 5 Flagship Disciplines",
      "11 Anukkama Color Belts",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/downloads", label: "Open Downloads Center" },
  },

  // 21. Rankings & Leaderboards
  {
    id: "rankings",
    highPriorityPatterns: [
      /\b(rankings|ranking|leaderboard|athlete ranking|state medal tally|points table|top players|top states|national ranking)\b/i,
    ],
    patterns: [
      /\branking\b/i,
      /\brankings\b/i,
      /\bleaderboard\b/i,
      /\bmedal tally\b/i,
    ],
    reply: `🥇 **All-India Athlete Rankings & State Medal Tally**:

Track competitive standing and national performance:

• 🏆 **Athlete Rankings**: Point-based national rankings computed from district, state, and All-India championship medal finishes.
• 🗺️ **State Medal Tally**: Live leaderboard tracking gold, silver, and bronze tallies across 28+ states.
• 🥋 **Top Dojos**: Recognizing premier clubs and academies producing championship podium finishers.`,
    quickReplies: [
      "View All-India Rankings",
      "Upcoming Championships",
      "Athlete Registration",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/ranking", label: "View National Rankings" },
  },

  // 22. Results & Medals
  {
    id: "results",
    highPriorityPatterns: [
      /\b(tournament results|championship results|competition results|match results|who won|medal winners|podium finishers|certificate of merit)\b/i,
    ],
    patterns: [
      /\bresults\b/i,
      /\bwinners\b/i,
      /\bmedals\b/i,
    ],
    reply: `🏆 **Official Tournament Results & Medal Records**:

• 🥇 **Live Results**: View gold, silver, and bronze winners across all categories from state and national championships.
• 📜 **Merit Certificates**: Download verified digital certificates of merit for podium finishers.
• 📊 **Match Brackets**: Review full fight brackets and electronic score sheets.`,
    quickReplies: [
      "View Results Portal",
      "All-India Rankings",
      "Upcoming Championships",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/results", label: "View Championship Results" },
  },

  // 23. Gallery & Videos
  {
    id: "gallery",
    highPriorityPatterns: [
      /\b(gallery|photo gallery|video gallery|fight replays|tournament photos|photos|videos|highlights|visual chronicle)\b/i,
    ],
    patterns: [
      /\bgallery\b/i,
      /\bphotos\b/i,
      /\bvideos\b/i,
      /\breplays\b/i,
    ],
    reply: `📸 **KALAWAR Media & Visual Chronicle**:

Relive championship moments and masterclass seminars:

• 📷 **Photo Gallery**: High-resolution albums covering national championships, belt examinations, referee clinics, and podium celebrations.
• 🎥 **Video Broadcasts**: Full fight replays, technique demonstrations, master interviews, and seminar masterclasses.`,
    quickReplies: [
      "Open Photo Gallery",
      "Open Video Gallery",
      "Upcoming Championships",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/gallery", label: "View Photo Gallery" },
  },

  // 24. News & Circulars
  {
    id: "news",
    highPriorityPatterns: [
      /\b(news|latest news|announcements|circulars|circular|press release|federation notices|updates)\b/i,
    ],
    patterns: [
      /\bnews\b/i,
      /\bannouncements\b/i,
      /\bcircular\b/i,
      /\bnotices\b/i,
    ],
    reply: `📰 **Federation News & Official Circulars**:

Stay updated with official bulletins, rule amendments, and tournament notifications:

• 📢 **Latest Circulars**: Annual calendar announcements, referee seminar notices, and Dan grading schedules.
• 📰 **Press Releases**: National championship coverage and athlete achievements.`,
    quickReplies: [
      "Read Latest News",
      "Upcoming Championships",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/news", label: "Read Federation News" },
  },

  // 25. Founder, Leadership & History
  {
    id: "about_leadership",
    highPriorityPatterns: [
      /\b(about us|about federation|who is founder|santosh kasabe|santosh uddhav kasabe|president|leadership|management|governing council|ashish doiphode|amar talokar|history of kalawar|federation history)\b/i,
    ],
    patterns: [
      /\babout\b/i,
      /\bfounder\b/i,
      /\bpresident\b/i,
      /\bleadership\b/i,
      /\bhistory\b/i,
    ],
    reply: `🏛️ **Federation Leadership & Governing Council**:

• 👑 **Founder & President**: **Mr. Santosh Uddhav Kasabe** — Visionary martial artist and sports administrator leading the national movement to unite Indian martial arts under ethical governance.
• 🎖️ **Technical Committee & Leadership**: **Master Ashish Doiphode**, **Mr. Amar Prabhakar Talokar** (National Coordination Head & Technical Committee).
• 📖 **History**: Founded in 2018, expanding to 12 state chapters by 2020, organizing inaugural national championships in 2022, pioneering digital QR verification in 2024, and now governing units across 28+ states in 2026.`,
    quickReplies: [
      "Read Full About Us",
      "The 5 Flagship Disciplines",
      "Club Affiliation",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/about", label: "Read Federation History" },
  },

  // 26. Headquarters, Contact & Helplines
  {
    id: "contact",
    highPriorityPatterns: [
      /\b(contact|contact us|phone number|helpline|mobile number|office address|where is office|headquarters|email address|whatsapp number|working hours|office timing)\b/i,
    ],
    patterns: [
      /\bcontact\b/i,
      /\bphone\b/i,
      /\bhelpline\b/i,
      /\bemail\b/i,
      /\baddress\b/i,
      /\bwhatsapp\b/i,
    ],
    reply: `📍 **Get in Touch with KALAWAR Secretariat**:

• 📞 **Primary Helplines**: 
  - [+91 70833 14435](tel:+917083314435)
  - [+91 95614 27125](tel:+919561427125)
  - [+91 74984 62450](tel:+917498462450)
• 💬 **WhatsApp Hotline**: [+91 70833 14435](https://wa.me/917083314435)
• ✉️ **Official Email**: [contact@kalawarsports.org](mailto:contact@kalawarsports.org) / [support@kalawarsports.org](mailto:support@kalawarsports.org)
• 🏢 **National Headquarters**: Registered Secretariat Office in Maharashtra, India.
• 🗺️ **Google Maps Location**: [Open in Google Maps](https://share.google/31PQfjzetEDIADnHy)
• ⏰ **Working Hours**: Monday – Saturday, 9:00 AM – 6:00 PM IST (Closed Sundays & Gazetted Holidays).

Click below to request an instant phone callback or submit an inquiry!`,
    quickReplies: [
      "Request Callback",
      "Submit Online Inquiry",
      "How to Register as an Athlete?",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/contact", label: "Open Contact Page" },
  },

  // 27. Callback Request
  {
    id: "callback",
    highPriorityPatterns: [
      /\b(request callback|call me|request a call|phone callback|talk to officer|speak to official|callback request)\b/i,
    ],
    patterns: [
      /\bcallback\b/i,
      /\bcall me\b/i,
    ],
    reply: `📞 **Request a Phone Callback from the Secretariat**:

Our federation officials are available to help you with:
• Athlete, Coach & Referee Registrations
• Belt Grading & Dan Rank Verifications
• Club / Dojo Affiliation Procedures
• Championship Entries & Team Accommodations

Click the button below to open the Callback Request form!`,
    quickReplies: [
      "Request Callback",
      "Athlete Registration",
      "Club Affiliation",
      "Main Menu",
    ],
    action: { type: "open_callback", label: "Open Callback Request Form" },
  },

  // 28. Member Login & Dashboard
  {
    id: "dashboard_login",
    highPriorityPatterns: [
      /\b(login|sign in|my account|dashboard|member login|athlete login|coach login|forgot password|reset password)\b/i,
    ],
    patterns: [
      /\blogin\b/i,
      /\baccount\b/i,
      /\bdashboard\b/i,
    ],
    reply: `🔐 **Member Portal & Dashboard**:

Access your personalized athlete/coach dashboard:

• 🆔 View your digital Player ID & license credentials.
• 📜 Access your verified Belt & Dan certificates.
• 🎟️ View active Championship entry passes & admit cards.
• 📦 Track your gear store orders and downloadable invoices.`,
    quickReplies: [
      "Go to Member Dashboard",
      "Athlete Registration",
      "Download My ID Card",
      "Main Menu",
    ],
    action: { type: "navigate", url: "/dashboard", label: "Open Member Dashboard" },
  },

  // 29. Greetings
  {
    id: "greetings",
    highPriorityPatterns: [
      /^(hi|hello|hey|namaste|greetings|good morning|good afternoon|good evening|pranam)$/i,
      /\b(hi assistant|hello bot|hey bot|namaste)\b/i,
    ],
    patterns: [
      /\b(hi|hello|hey|greetings|namaste)\b/i,
    ],
    reply: `Namaste! 🙏 Welcome to **KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA**.

I am your **KALAWAR AI Assistant**. How can I assist you with martial arts events, registrations, certifications, or gear today?

Popular topics:
• 🥋 **Explore the 5 Disciplines** (Kaya Yuddha, Charana Yuddha, Santulana, Sparsha Yuddha, Sangama Kala)
• 📝 **Register as an Athlete / Coach / Referee**
• 🏫 **Affiliate your Dojo / Club**
• 📜 **11 Anukkama Color Belts & Dan Grading**
• 🏆 **Upcoming State & National Championships**
• 🛡️ **Verify Digital Certificate or Athlete ID**
• 📞 **Request Instant Callback**`,
    quickReplies: [
      "The 5 Flagship Disciplines",
      "Kaya Yuddha Details",
      "Charana Yuddha Details",
      "Santulana Details",
      "Sparsha Yuddha Details",
      "Sangama Kala & Sub-Events",
      "How to Register as an Athlete?",
      "11 Anukkama Color Belts",
      "Upcoming Championships",
      "Verify Certificate / ID",
      "Request Callback",
    ],
  },

  // 30. Main Menu / Help
  {
    id: "main_menu",
    highPriorityPatterns: [
      /\b(main menu|start over|reset chat|help menu|menu|options)\b/i,
    ],
    patterns: [
      /\bmenu\b/i,
      /\bhelp\b/i,
    ],
    reply: `👋 Welcome to the **KALAWAR Federation Help Desk**!

Select an area to explore with our AI Guide:
• 🥋 **The 5 Flagship Disciplines** (Kaya Yuddha, Charana Yuddha, Santulana, Sparsha Yuddha, Sangama Kala)
• 👤 **Athlete Registration** (Lifetime KALAWAR ID, ID card & license)
• 👨‍🏫 **Coach & Referee Licensing** (Examiner clinics, referee accreditation)
• 🏫 **Club & Academy Affiliation** (Affiliate your dojo, chapter rights)
• 📜 **11 Anukkama Color Belts & Dan Grading** (11 Anukkama levels, QR admit cards, Black Belt 1st–8th Dan)
• 🏆 **Championships & Tournaments** (National tournaments, live brackets, Balewadi stadium)
• 🛡️ **Verify Certificate / ID** (100% cryptographic QR verification)
• 🛒 **Federation Store** (Official Gi uniforms, combat protective gear)
• 📞 **Contact & Headquarters** (Helpline, office address, WhatsApp desk)`,
    quickReplies: [
      "The 5 Flagship Disciplines",
      "Kaya Yuddha Details",
      "Charana Yuddha Details",
      "Santulana Details",
      "Sparsha Yuddha Details",
      "Sangama Kala & Sub-Events",
      "Athlete Registration",
      "11 Anukkama Color Belts",
      "Upcoming Championships",
      "Verify Certificate / ID",
      "Request Callback",
    ],
  },
];

// Match query against Intent Definitions using weighted scoring
function matchIntent(userMessage: string): IntentDefinition | null {
  const text = userMessage.trim().toLowerCase();

  let bestIntent: IntentDefinition | null = null;
  let highestScore = 0;

  for (const intent of INTENTS) {
    let score = 0;

    // 1. High Priority Patterns (Weight 100 per match)
    if (intent.highPriorityPatterns) {
      for (const pattern of intent.highPriorityPatterns) {
        if (pattern.test(text)) {
          score += 100;
        }
      }
    }

    // 2. Standard Regex Patterns (Weight 30 per match)
    for (const pattern of intent.patterns) {
      if (pattern.test(text)) {
        score += 30;
      }
    }

    // 3. Keywords (Weight 10 per match)
    if (intent.keywords) {
      for (const kw of intent.keywords) {
        if (text.includes(kw.toLowerCase())) {
          score += 10;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestIntent = intent;
    }
  }

  // Minimum score threshold to consider a match
  if (highestScore >= 30) {
    return bestIntent;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userMessage = String(body.message || "").trim();
    const history: Message[] = Array.isArray(body.history) ? body.history : [];

    if (!userMessage) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // 0. Dynamic Database Events Synchronization
    let dynamicEvents: any[] = [];
    try {
      await connectToDatabase();
      dynamicEvents = await KalawarEventModel.find({}).lean();
    } catch (dbErr) {
      // DB connection fallback
    }

    // 1. Check for Generative AI API Key (OpenAI) if configured
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        let systemPromptWithDynamic = SYSTEM_PROMPT;
        if (dynamicEvents && dynamicEvents.length > 0) {
          const dynamicEventsSummary = dynamicEvents
            .map(
              (e: any, idx: number) =>
                `${idx + 1}. ${e.name} (${e.marathiName || ""}): ${e.subtitle || ""} - ${e.tagline || ""}. Rules format: ${e.rules?.format || "Standard"}.`
            )
            .join("\n");
          systemPromptWithDynamic += `\n\nLive Database Events:\n${dynamicEventsSummary}`;
        }

        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPromptWithDynamic },
              ...history.slice(-6),
              { role: "user", content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 450,
          }),
        });

        if (aiRes.ok) {
          const data = await aiRes.json();
          const replyText = data.choices?.[0]?.message?.content;
          if (replyText) {
            return NextResponse.json({
              reply: replyText,
              quickReplies: [
                "The 5 Flagship Disciplines",
                "Kaya Yuddha Details",
                "Charana Yuddha Details",
                "Santulana Details",
                "Sparsha Yuddha Details",
                "Sangama Kala & Sub-Events",
                "How to Register as an Athlete?",
                "11 Anukkama Color Belts",
                "Upcoming Championships",
                "Verify Certificate / ID",
                "Request Callback",
              ],
            });
          }
        }
      } catch (err) {
        console.warn("OpenAI API call failed, using internal NLP engine:", err);
      }
    }

    // 2. High-Precision Weighted Intent Matching Engine
    const matched = matchIntent(userMessage);

    if (matched) {
      // If user matched a specific discipline or all disciplines and we have dynamic DB records, enrich response
      let finalReply = matched.reply;
      if (dynamicEvents && dynamicEvents.length > 0) {
        if (matched.id === "disciplines_all") {
          const list = dynamicEvents
            .map(
              (ev, idx) =>
                `${idx + 1}. **${ev.name}** ${ev.marathiName ? `(${ev.marathiName})` : ""}: ${ev.subtitle || ev.tagline || "Official KALAWAR Combat Discipline"}`
            )
            .join("\n");
          if (list) {
            finalReply = `🥋 **The 5 Flagship Martial Arts Disciplines of KALAWAR (Live Federation Registry)**:\n\n${list}\n\n🔹 **Sangama Kala Sub-Events**:\n• 🤼 **KALAWAR MALLA YUDDHA (मल्ल युद्ध)**: Traditional Wrestling / Grappling Combat\n• 🥢 **KALAWAR DANDA YUDDHA (दंड युद्ध)**: Traditional Stick Combat\n\nClick below to explore rules, weight categories, and tournament schedules!`;
          }
        } else {
          // Check if matched intent matches a specific dynamic discipline
          const matchedDbEvent = dynamicEvents.find((e) => {
            const n = (e.name || "").toLowerCase();
            const s = (e.slug || "").toLowerCase();
            return (
              (matched.id === "kaya_yuddha" && (n.includes("kaya") || s.includes("kaya"))) ||
              (matched.id === "charana_yuddha" && (n.includes("charan") || s.includes("charan"))) ||
              (matched.id === "santulana" && (n.includes("santulan") || s.includes("santulan"))) ||
              (matched.id === "sparsha_yuddha" && (n.includes("sparsha") || s.includes("sparsha"))) ||
              (matched.id === "sangama_kala" && (n.includes("sangama") || s.includes("sangama")))
            );
          });

          if (matchedDbEvent && matchedDbEvent.introduction?.overview) {
            finalReply = `🥋 **${matchedDbEvent.name} ${matchedDbEvent.marathiName ? `(${matchedDbEvent.marathiName})` : ""}**:

• **Overview**: ${matchedDbEvent.introduction.overview}
• **Focus & Category**: ${matchedDbEvent.subtitle || matchedDbEvent.tagline || matchedDbEvent.category}
• **Rules Format**: ${matchedDbEvent.rules?.format || "Standard Sanctioned Format"}
• **Scoring System**: ${matchedDbEvent.scoring?.system || "Electronic Tatami Point Scoring"}`;
            if (matchedDbEvent.slug === "sangama-kala" && Array.isArray(matchedDbEvent.sangamaKalaSubDisciplines)) {
              const subs = matchedDbEvent.sangamaKalaSubDisciplines
                .map((sub: any) => `  • **${sub.name}**: ${sub.tagline || sub.description}`)
                .join("\n");
              if (subs) {
                finalReply += `\n\n🔹 **Sangama Kala Sub-Disciplines**:\n${subs}`;
              }
            }
          }
        }
      }

      return NextResponse.json({
        reply: finalReply,
        quickReplies: matched.quickReplies,
        action: matched.action,
      });
    }

    // 3. Fallback Reply
    const fallbackReply = `Thank you for your inquiry! **KALAWAR SPORTS & MARTIAL ARTS FEDERATION OF INDIA** is the apex national governing institution dedicated to standardizing traditional Indian martial arts, governing 5 flagship combat disciplines (*Kaya Yuddha, Charana Yuddha, Santulana, Sparsha Yuddha, Sangama Kala*), conducting Dan belt gradings, and hosting All-India national championships.

How can I assist you further?
• 🥋 **The 5 Flagship Disciplines** (Kaya Yuddha, Charana Yuddha, Santulana, Sparsha Yuddha, Sangama Kala)
• 🤼 **Sangama Kala Sub-Events** (Malla Yuddha, Danda Yuddha)
• 📝 **Register as an Athlete / Coach / Referee**
• 🏫 **Affiliate your Martial Arts Club / Dojo**
• 📜 **11 Anukkama Color Belts & Dan Grading**
• 🏆 **Upcoming State & National Championships**
• 🛡️ **Verify Certificate or Athlete ID**
• 📞 **Request Instant Callback**`;

    return NextResponse.json({
      reply: fallbackReply,
      quickReplies: [
        "The 5 Flagship Disciplines",
        "Kaya Yuddha Details",
        "Charana Yuddha Details",
        "Santulana Details",
        "Sparsha Yuddha Details",
        "Sangama Kala & Sub-Events",
        "How to Register as an Athlete?",
        "11 Anukkama Color Belts",
        "Upcoming Championships",
        "Verify Certificate / ID",
        "Request Callback",
      ],
      action: { type: "navigate", url: "/events", label: "Explore KALAWAR Sports" },
    });
  } catch (error) {
    console.error("AI Chatbot API error:", error);
    return NextResponse.json(
      {
        reply:
          "I am experiencing a brief connection issue, but you can contact the federation secretariat directly at **+91 70833 14435** / **+91 95614 27125** or email **contact@kalawarsports.org**!",
        quickReplies: ["Request Callback", "The 5 Flagship Disciplines", "Athlete Registration"],
        action: { type: "navigate", url: "/contact", label: "Contact Secretariat" },
      },
      { status: 500 }
    );
  }
}
