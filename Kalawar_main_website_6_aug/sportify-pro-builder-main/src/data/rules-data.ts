export interface RuleSection {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  badge?: string;
  content: {
    intro?: string;
    points?: {
      title: string;
      description: string;
      details?: string[];
      highlight?: boolean;
    }[];
    table?: {
      headers: string[];
      rows: string[][];
    };
    alert?: {
      type: "info" | "warning" | "danger" | "gold";
      title: string;
      text: string;
    };
  };
}

export interface DisciplineRule {
  id: string;
  name: string;
  tagline: string;
  categoryType: "Combat" | "Striking" | "Performance" | "Point Combat" | "Artistic & Weapon";
  weightCategoryNote: string;
  roundsDuration: string;
  matDimensions: string;
  permittedStrikes: string[];
  prohibitedStrikes: string[];
  scoringSystem: {
    action: string;
    points: string;
    description: string;
  }[];
  winConditions: string[];
  mandatoryGear: string[];
  specialRegulations: string[];
}

export const FEDERATION_RULES_OVERVIEW = {
  rulebookVersion: "2026-27 National Edition",
  effectiveDate: "January 1, 2026",
  sanctioningBody: "KALAWAR Sports & Martial Arts Federation of India",
  jurisdiction: "All Sanctioned National, Zonal, State, District & Invitational Tournaments",
  protestFee: "₹2,000",
  protestTimeLimit: "15 Minutes from Bout Conclusion",
  totalSections: 12,
};

export const DISCIPLINE_RULES: DisciplineRule[] = [
  {
    id: "kaya-yuddha",
    name: "Kaya Yuddha",
    tagline: "Full Contact Martial Combat & Tactical Striking",
    categoryType: "Combat",
    weightCategoryNote: "Standard Weight Brackets (U-8, U-10, U-12, U-14, U-17, U-19: 12 weight classes from <40kg to >90kg, Open Category)",
    roundsDuration: "3 Rounds × 2 Minutes (Seniors & U-19) | 2 Rounds × 1.5 Minutes (Cadets U-14 / U-17)",
    matDimensions: "8m × 8m Contest Area with 1m Safety Outer Perimeter (Tatami)",
    permittedStrikes: [
      "Punches to padded torso area and headgear front/sides",
      "Roundhouse, front, side, and hook kicks to torso and legs above knee",
      "Axe kicks and spinning back kicks to legal target areas",
      "Sweep techniques followed immediately by controlled legal strike within 2 seconds",
      "Controlled clinching limited to 3 seconds for single strike execution",
    ],
    prohibitedStrikes: [
      "Direct strikes to the spine, nape of neck, throat, and groin",
      "Elbow strikes and knee strikes to the face/head",
      "Attacking an opponent who is down on the canvas",
      "Holding ropes or stepping out of bounds to avoid combat (Jogai)",
      "Biting, headbutts, eye-gouging, or grabbing the opponent's groin guard",
    ],
    scoringSystem: [
      { action: "Clean Punch to Torso", points: "1 Point", description: "Audible, controlled punch with hip rotation and immediate recoil" },
      { action: "Body Kick / Midsection Strike", points: "2 Points", description: "Solid roundhouse or front kick landing flush on legal chest protector" },
      { action: "Head Kick / High Strike", points: "3 Points", description: "Controlled kick making clean contact with approved headgear" },
      { action: "Swept Opponent with Follow-up Strike", points: "3 Points", description: "Legal sweep grounding opponent followed by instant controlled punch/kick" },
      { action: "Standing 8-Count Knockdown", points: "4 Points", description: "Strikes resulting in official referee standing count" },
    ],
    winConditions: [
      "Knockout (KO) / Technical Knockout (TKO)",
      "Point Superiority at final bell",
      "Referee Stoppage Contest (RSC) due to safety or skill mismatch",
      "Disqualification of opponent (Hansoku-Make)",
      "Corner Retirement / Surrender (Towel Thrown)",
    ],
    mandatoryGear: [
      "KALAWAR Approved Dogi / Uniform",
      "Head Guard with chin protection",
      "10oz / 12oz Competition Gloves",
      "Mouthguard (Gumshield)",
      "Groin Protector (Male/Female mandatory)",
      "Shin & Instep Guard",
      "Chest Protector (Cadets U-14/U-17 and Female divisions)",
    ],
    specialRegulations: [
      "Rest period between rounds is exactly 60 seconds.",
      "A competitor receiving 3 warnings (Keikoku/Chui) is penalized points.",
      "A third knockdown in a single round constitutes automatic TKO victory.",
    ],
  },
  {
    id: "charana-yuddha",
    name: "Charana Yuddha",
    tagline: "Dynamic Kicking Mastery & High-Octane Agility Combat",
    categoryType: "Striking",
    weightCategoryNote: "Standard Weight Brackets (U-8 to U-19 and Open Division)",
    roundsDuration: "2 Rounds × 2 Minutes (1 Minute Rest Period)",
    matDimensions: "8m × 8m Octagonal / Square Tatami",
    permittedStrikes: [
      "Exclusively foot and leg techniques above the waist",
      "360° and 540° jumping spinning kicks to torso and headgear",
      "Axe kicks, crescent kicks, and push kicks to torso target area",
      "Double and triple aerial combination kicks",
      "Hand blocks and defensive parries (No hand strikes to head)",
    ],
    prohibitedStrikes: [
      "Punches or hand strikes of any kind to the face or head",
      "Leg kicks below the waistline or knee strikes",
      "Grabbing the kicking leg for more than 1 second",
      "Pushing the opponent out of the ring without executing a technique",
      "Falling deliberately to avoid opponent's kicking attack",
    ],
    scoringSystem: [
      { action: "Linear Front / Push Kick to Body", points: "1 Point", description: "Direct penetrating kick to legal chest zone" },
      { action: "Turning / Roundhouse Kick to Torso", points: "2 Points", description: "Solid turning kick with full hip extension" },
      { action: "Direct High Kick to Headgear", points: "3 Points", description: "Clean head kick without grabbing or pushing" },
      { action: "Spinning Back Kick / 360° to Body", points: "4 Points", description: "Rotational kick executed with power and balance" },
      { action: "Jumping Spinning High Kick to Head", points: "5 Points", description: "High-difficulty aerial rotational head strike" },
    ],
    winConditions: [
      "Highest accumulated score at the end of regulation time",
      "Point Gap Rule: 12-point lead at end of Round 2 ends the match",
      "Knockout / Inability to continue after 10-count",
      "Opponent Disqualification via penalty accumulation",
    ],
    mandatoryGear: [
      "KALAWAR High-Mobility Kicking Uniform",
      "Electronic / Sensor Shin & Instep Foot Protectors",
      "Open-Finger Hand Guards",
      "Head Guard with Face Protection",
      "Groin Guard & Mouthguard",
    ],
    specialRegulations: [
      "Competitors must maintain continuous offensive engagement; 5 seconds of non-engagement prompts 'Fight' command.",
      "Exiting the boundary during a kicking exchange costs 1 penalty point.",
    ],
  },
  {
    id: "santulana",
    name: "Santulana",
    tagline: "Balance, Postural Equilibrium, Agility & Movement Showcase",
    categoryType: "Performance",
    weightCategoryNote: "NO WEIGHT CATEGORY — Performance & Skill-Based Category Across All Divisions",
    roundsDuration: "Individual Performance: 90 Seconds to 2 Minutes | Team Sync: 3 Minutes",
    matDimensions: "10m × 10m Non-Slip Performance Floor",
    permittedStrikes: [
      "Static balance postures held steadily for minimum 5 seconds (Yogasana & Martial Equilibrium)",
      "Dynamic transitions, rotational spins, and single-leg pivots",
      "High-kick holds (above 150° elevation) demonstrating supreme isometric control",
      "Aerial acrobatics, cartwheels, butterfly twists, and soft-landing recovery",
      "Cadence and musical rhythm synchronization (where applicable)",
    ],
    prohibitedStrikes: [
      "Uncontrolled falls or loss of footing (point deductions applied)",
      "Unbalanced trembling during held postures (>2 sec tremor = -0.5 pts)",
      "Stepping outside the designated 10m arena boundary",
      "Failure to complete mandatory 5-element core technical sequence",
      "Exceeding time limit (>2 min = -0.5 pts per 10 seconds)",
    ],
    scoringSystem: [
      { action: "Equilibrium & Balance (Static Holds)", points: "Max 2.5 Pts", description: "Steadiness, center of gravity, line alignment, hold duration" },
      { action: "Flexibility & Range of Motion", points: "Max 2.5 Pts", description: "Hip opening, spinal flexion, 180° splits, overhead kick elevation" },
      { action: "Dynamic Agility & Flow", points: "Max 2.5 Pts", description: "Seamless transition between ground, standing, and aerial maneuvers" },
      { action: "Artistic Presentation & Grace", points: "Max 2.5 Pts", description: "Focus (Drishti), posture (Anga Shuddhi), breathing rhythm, stage presence" },
    ],
    winConditions: [
      "Highest cumulative score out of 10.00 points by 5-Judge Panel",
      "Highest and lowest judge scores discarded to ensure statistical fairness",
      "Tie-breaker: Highest score in Equilibrium & Balance metric",
    ],
    mandatoryGear: [
      "Official KALAWAR Performance Attire (Fitted Uniform / Bodysuit)",
      "Barefoot on certified Tatami matting",
      "No jewelry, watches, or loose accessories permitted",
    ],
    specialRegulations: [
      "Judged on 8 core performance criteria: Equilibrium, Flexibility, Agility, Core Strength, Aerial Control, Rhythm, Symmetry, and Grace.",
      "Open to all body types and weights — evaluated solely on technical execution and artistic precision.",
    ],
  },
  {
    id: "sparsha-yuddha",
    name: "Sparsha Yuddha",
    tagline: "Point Combat, Tactical Reflexes & Speed-Touch Fighting",
    categoryType: "Point Combat",
    weightCategoryNote: "Standard Weight Brackets (U-8, U-10, U-12, U-14, U-17, U-19, Open)",
    roundsDuration: "2 Rounds × 1.5 Minutes (Stop-and-Point System)",
    matDimensions: "8m × 8m Contest Area",
    permittedStrikes: [
      "Clean, controlled fingertip or fist touch to padded chest protector and helmet",
      "Controlled foot touches to torso, sides, and headgear",
      "Rapid in-and-out evasive footwork and defensive countering",
      "Lead-hand jabs, reverse punches, and blitz combinations",
      "Controlled foot sweeps to front foot with immediate touch",
    ],
    prohibitedStrikes: [
      "Heavy impact, excessive force, or follow-through strikes",
      "Striking after the referee calls 'Yame' (Stop)",
      "Blind swinging without visual targeting",
      "Grabbing the opponent's limbs or uniform",
      "Striking the back of the head or lower spine",
    ],
    scoringSystem: [
      { action: "Punch to Body / Midsection", points: "1 Point", description: "Rapid touch with correct form, balance, and clean recoil" },
      { action: "Punch to Headgear Front", points: "1 Point", description: "Controlled light touch to front of head protector" },
      { action: "Kick to Torso / Ribs", points: "2 Points", description: "Clean foot contact on legal chest protector" },
      { action: "Kick to Headgear / High Touch", points: "3 Points", description: "Controlled high kick contact with zero excess force" },
      { action: "Sweep Followed by Immediate Touch", points: "3 Points", description: "Clean unbalancing sweep with instant valid touch" },
    ],
    winConditions: [
      "First athlete to reach 10 Points (Mercy Rule / Instant Win)",
      "Highest points at the expiration of 2 rounds",
      "Sudden Death Golden Point round if tied after regulation",
      "Disqualification of opponent due to heavy contact penalties",
    ],
    mandatoryGear: [
      "KALAWAR Semi-Contact Foam Hand Gloves (Point Gloves)",
      "Foam Foot Boots (Instep & Heel)",
      "Head Guard with top protection",
      "Mouthguard & Groin Cup",
      "Chest Protector",
    ],
    specialRegulations: [
      "Match halts immediately upon valid technique; corner judges signal points with colored flags.",
      "Minimum 2 out of 3 judges must agree for a point to be validated.",
    ],
  },
  {
    id: "sangama-kala",
    name: "Sangama Kala",
    tagline: "Weapon Forms, Traditional Synchronized Kata & Weapon Mastery",
    categoryType: "Artistic & Weapon",
    weightCategoryNote: "No Weight Classes — Age & Belt Division Based (U-8, U-10, U-12, U-14, U-17, U-19, Open / Masters)",
    roundsDuration: "Individual Routine: 1 to 2.5 Minutes | Synchronized Team (3 Athletes): 2 to 3.5 Minutes",
    matDimensions: "10m × 10m Performance Tatami",
    permittedStrikes: [
      "Traditional Indian Weaponry: Lathi (Short/Long Staff), Talwar (Sword), Shield, Trishul, and Surul Vaal (Flexible Sword)",
      "International Martial Weapons: Bo Staff, Katana, Sai, Kama, Tonfa, Nunchaku, and Broadsword",
      "Traditional Empty-Hand Kata & Forms (Bhartiya Martial Forms, Karate Kata, Taekwondo Poomsae)",
      "Synchronized Team Choreography with realistic martial application (Bunkai)",
      "Acrobatic martial arts movements integrated seamlessly into traditional weaponry sequences",
    ],
    prohibitedStrikes: [
      "Dropping weapons onto the floor (-1.0 point automatic deduction)",
      "Weapon breakage or structural failure during routine (-1.5 points)",
      "Live blades or sharp uninspected metal weapons (weapons must be blunted/competition certified)",
      "Stepping beyond the 10m safety boundary line (-0.5 point per occurrence)",
      "Exceeding allocated time limit (-0.1 point per 5 seconds over/under)",
    ],
    scoringSystem: [
      { action: "Weapon Handling & Control (Shastra Vidya)", points: "Max 3.0 Pts", description: "Grip stability, weapon trajectory, velocity, blade/staff orientation" },
      { action: "Martial Power & Focus (Shakti & Kime)", points: "Max 2.5 Pts", description: "Snapping strikes, dynamic kiai, eye focus, combat realism" },
      { action: "Body Mechanics & Posture (Anga Shuddhi)", points: "Max 2.5 Pts", description: "Deep stances, spinal alignment, footwork precision, transition balance" },
      { action: "Artistic Choreography & Synchronization", points: "Max 2.0 Pts", description: "Pacing, musical alignment (if applicable), team unison, aesthetic grace" },
    ],
    winConditions: [
      "Highest combined score out of 10.00 points by 5 Certified Masters",
      "Highest and lowest marks trimmed; average of median 3 scores taken",
      "Tie-breaker: Highest score in Weapon Handling & Control metric",
    ],
    mandatoryGear: [
      "Traditional Martial Arts Dogi / Traditional Indian Martial Costume",
      "Federation-inspected & tagged competition weapon",
      "Team uniform synchronization for pair/trio events",
    ],
    specialRegulations: [
      "All weapons must undergo mandatory inspection by the Chief Technical Marshal 30 minutes before division start.",
      "Team synchronization requires all members to execute movements within 0.1 second unison.",
    ],
  },
];

export const RULES_SECTIONS: RuleSection[] = [
  {
    id: "general-federation-rules",
    number: "01",
    title: "General Federation Rules",
    subtitle: "Governance, Jurisdiction, Sanctioning & Institutional Authority",
    icon: "Shield",
    description: "Foundational charter outlining the constitutional and sporting jurisdiction of KALAWAR Sports & Martial Arts Federation of India.",
    badge: "Constitutional Core",
    content: {
      intro: "KALAWAR Sports & Martial Arts Federation of India is the sovereign national governing organization responsible for the development, promotion, and standardization of all sanctioned martial arts and multi-sport competitions across all States and Union Territories.",
      points: [
        {
          title: "Sovereign Sanctioning Authority",
          description: "No state tournament, national championship, belt grading, or technical clinic may utilize the KALAWAR name, emblem, or rules without written sanction from the National Secretariat.",
          details: [
            "All sanctioned tournaments are issued an official KALAWAR Event Sanction Code (ESC).",
            "Results from unsanctioned tournaments are null and void for national ranking points and Dan rankings.",
          ],
        },
        {
          title: "Universal Member Registration",
          description: "All participating athletes, coaches, technical officials, and club administrators must hold an active KALAWAR National Unique ID (K-UID) with verified credentials.",
          details: [
            "Annual membership must be renewed prior to event registration deadlines.",
            "Possession of official KALAWAR Athlete Passport is mandatory at weigh-ins and accreditation.",
          ],
        },
        {
          title: "Anti-Discrimination & Equal Opportunity",
          description: "KALAWAR enforces a zero-tolerance policy against discrimination based on caste, religion, gender, region, or physical background. All competitors are guaranteed equitable access to competition rings.",
        },
        {
          title: "Standard Arena & Tatami Specifications",
          description: "All official combat rings must utilize certified high-density EVA shock-absorbent mats with minimum 25mm to 40mm thickness, measuring 8m × 8m active zone plus 1m safety buffer.",
        },
      ],
      alert: {
        type: "gold",
        title: "Official Rulebook Supremacy",
        text: "In any conflict between local tournament notices and this National Rulebook, the provisions of this National Rulebook shall supersede without exception.",
      },
    },
  },
  {
    id: "kalawar-rules",
    number: "02",
    title: "KALAWAR Universal Rules & Philosophy",
    subtitle: "The Four Pillars of Martial Excellence & Universal Etiquette",
    icon: "Compass",
    description: "The moral, spiritual, and technical ethos governing every athlete, official, and master practitioner within the KALAWAR brotherhood.",
    badge: "Philosophy & Ethos",
    content: {
      intro: "The KALAWAR martial system combines ancient Indian battlefield disciplines (Dhanurveda & Malla-Yuddha) with modern Olympic-standard sports science. Every engagement is governed by four cardinal pillars: Bala (Strength), Laghavam (Agility), Vinaya (Discipline), and Yukti (Tactical Strategy).",
      points: [
        {
          title: "Pranama & Salutation Protocol (Tatami Etiquette)",
          description: "Every athlete and coach must perform the traditional standing bow (Pranama) upon entering and exiting the competition arena, before the referee, and towards the opponent.",
          details: [
            "Bowing before and after the bout is a mandatory expression of mutual respect; refusal to bow results in immediate disqualification.",
            "Athletes must shake hands or touch gloves cordially when instructed by the Center Referee.",
          ],
        },
        {
          title: "Official Uniform & Appearance Standards",
          description: "Athletes must wear clean, tear-free official KALAWAR uniforms (White/Black Dogi or approved Federation Rashguard/Shorts) with the official national emblem on the left chest.",
          details: [
            "Fingernails and toenails must be cut short to prevent cuts and eye injuries.",
            "Long hair must be secured neatly with non-metallic bands.",
            "No jewelry, piercings, rings, necklaces, or metallic hairpins are permitted during competition.",
          ],
        },
        {
          title: "Spirit of Ahimsa & Controlled Force",
          description: "True martial mastery lies in control. Techniques must demonstrate maximum velocity and kinetic accuracy with controlled terminal impact appropriate to each division.",
        },
      ],
    },
  },
  {
    id: "event-specific-rules",
    number: "03",
    title: "Discipline-Specific Event Rules",
    subtitle: "Deep Technical Regulations for All 5 Flagship Martial Arts Disciplines",
    icon: "Swords",
    description: "Granular scoring criteria, prohibited zones, match durations, and gear requirements for Kaya Yuddha, Charana Yuddha, Santulana, Sparsha Yuddha, and Sangama Kala.",
    badge: "5 Disciplines",
    content: {
      intro: "The Federation administers five distinct flagship sporting categories, each engineered to test distinct facets of martial prowess, from full-contact power to aesthetic mastery.",
      points: [
        {
          title: "Kaya Yuddha (Full Contact Combat)",
          description: "Tests full-spectrum striking power, boxing precision, and high-impact kicking combinations inside an 8x8m Tatami ring.",
          highlight: true,
        },
        {
          title: "Charana Yuddha (Kicking Mastery)",
          description: "High-octane agility combat exclusively focusing on dynamic turning, spinning, jumping, and aerial kicking techniques above the waist.",
          highlight: true,
        },
        {
          title: "Santulana (Equilibrium & Movement) — NO WEIGHT CATEGORY",
          description: "Performance-based division evaluating static balance holds, isometric flexibility, aerial agility, and postural symmetry across 8 criteria. No weight classes apply.",
          highlight: true,
        },
        {
          title: "Sparsha Yuddha (Point Touch Combat)",
          description: "Precision point-fighting where matches stop upon clean touch; rewards lightning reflexes, timing, and ring generalship.",
          highlight: true,
        },
        {
          title: "Sangama Kala (Weapons & Kata Showcase)",
          description: "Traditional Indian & international weapons artistry and synchronized forms judged on speed, weapon control, focus, and power.",
          highlight: true,
        },
      ],
    },
  },
  {
    id: "competition-rules",
    number: "04",
    title: "Competition & Tournament Protocols",
    subtitle: "Weigh-Ins, Brackets, Timing, Age Divisions & Victory Determinations",
    icon: "Trophy",
    description: "Standard operating procedures for weigh-in verification, electronic draws, bout progression, and medal distributions.",
    badge: "Tournament Operations",
    content: {
      points: [
        {
          title: "Official Weigh-In Protocol",
          description: "Official weigh-ins take place 24 hours prior or the morning of the tournament on calibrated digital scales under supervision of the Chief Weigh-in Officer.",
          details: [
            "Athletes are weighed in standard undergarments or light uniform shorts.",
            "Weight allowance is exactly 0.00 kg. Exceeding the upper weight limit of the entered category results in automatic disqualification or optional bump to higher category upon payment of transfer fee.",
            "Athletes have 1 hour within the official weigh-in window to make their contracted weight.",
          ],
        },
        {
          title: "Electronic Draws & Seeding",
          description: "Brackets are generated using an automated randomized double-blind tournament draw algorithm.",
          details: [
            "The top 4 seeded athletes based on national ranking points are placed in opposing quadrants to ensure fair finals progression.",
            "Athletes from the same academy or district are separated in early rounds wherever possible.",
          ],
        },
        {
          title: "Official Match Timer & Stoppages",
          description: "The bout clock starts on the referee's command 'Hajime' and pauses only when the referee calls 'Yame' or signals time to the timekeeper.",
        },
        {
          title: "Victory Classifications",
          description: "Match outcomes are officially categorized into: Knockout (KO), Technical Knockout (TKO), Points Decision (PTS), Referee Stopped Contest (RSC), Disqualification (DQ), or Walkover (WO).",
        },
      ],
    },
  },
  {
    id: "referee-rules",
    number: "05",
    title: "Referee & Technical Officials Charter",
    subtitle: "Officiating Hierarchy, Mat Commands, Hand Signals & Impartiality",
    icon: "UserCheck",
    description: "Guidelines governing the deployment, conduct, signaling standards, and ethical responsibilities of certified KALAWAR referees and judges.",
    badge: "Officiating Standards",
    content: {
      points: [
        {
          title: "Tatami Officiating Team Composition",
          description: "Every official ring is staffed by a qualified 7-member technical officiating crew:",
          details: [
            "1 Center Referee (Master of the Tatami — manages safety, commands, warnings, and stops).",
            "4 Corner Judges (Record points and boundary exits using electronic scoring tablets or colored flags).",
            "1 Official Timekeeper & 1 Official Scorekeeper / Arbitrator.",
            "1 Tatami Manager / Kansa (Oversees judge scoring compliance and reviews electronic logs).",
          ],
        },
        {
          title: "Standard Japanese / Sanskrit Mat Commands",
          description: "Referees utilize universal voice commands for seamless national and international officiating:",
          details: [
            "'Hajime' / 'Arambha' — Begin the round or match.",
            "'Yame' / 'Virama' — Stop fighting immediately.",
            "'Tsuzukete' — Continue combat without pause.",
            "'Torimasen' — No point / strike not valid.",
            "'Jogai' — Boundary exit violation.",
          ],
        },
        {
          title: "Strict Neutrality & Conflict of Interest",
          description: "A referee or judge shall not officiate any bout in which an athlete from their own academy, direct club, or immediate family is competing. Mandatory replacement takes effect immediately.",
        },
        {
          title: "Official Attire for Technical Officials",
          description: "All referees must wear the official KALAWAR technical uniform: Navy blue federation blazer, crisp white shirt, federation tie, grey trousers, and non-marking referee shoes.",
        },
      ],
    },
  },
  {
    id: "player-code-of-conduct",
    number: "06",
    title: "Player Code of Conduct & Ethics",
    subtitle: "Sportsmanship, Integrity, Respect & Anti-Harassment Standards",
    icon: "Award",
    description: "Mandatory behavioral standards for all competitors on the mat, in warm-up zones, in athlete villages, and across public media.",
    badge: "Athlete Integrity",
    content: {
      points: [
        {
          title: "Respect for Opponents & Officials",
          description: "Athletes must treat competitors, referees, volunteers, and tournament staff with the utmost dignity. Gestures of anger, throwing headgear, or profanity result in instant Hansoku-Make.",
        },
        {
          title: "Doping & Substance Prohibition",
          description: "Competitors are strictly bound by the WADA / NADA Prohibited List. Random urine and blood sampling may be conducted at any national event without prior notice.",
        },
        {
          title: "Digital & Social Media Decorum",
          description: "Athletes must not post defamatory, threatening, or unsportsmanlike content targeting opponents, referees, or federation office bearers on digital platforms.",
        },
        {
          title: "Punctuality & Ring Call Compliance",
          description: "Athletes must report to the warm-up marshal within 3 calls (maximum 2 minutes from first announcement). Failure to present results in automatic Walkover (WO) forfeit.",
        },
      ],
    },
  },
  {
    id: "coach-rules",
    number: "07",
    title: "Coach & Cornerman Regulations",
    subtitle: "Corner Accreditation, Ring Conduct, Protocol & Protests",
    icon: "Users",
    description: "Regulations governing accredited coaches, permissible corner staff, attire, in-bout tactical instructions, and grievance protocols.",
    badge: "Coaching License",
    content: {
      points: [
        {
          title: "Mandatory Coaching Accreditation",
          description: "Only coaches holding a valid KALAWAR National Coach License (Level 1, Level 2, or Master Coach) wearing an official coach badge are permitted inside the corner zone.",
        },
        {
          title: "Permissible Corner Staff Size",
          description: "Maximum two individuals permitted in the corner: One Head Coach and One Assistant / Cutman. Both must remain seated in designated corner chairs during active rounds.",
        },
        {
          title: "Corner Attire Requirements",
          description: "Coaches must wear official academy tracksuits or formal attire with athletic closed-toe footwear. Jeans, slippers, shorts, or unbranded street clothing are strictly prohibited.",
        },
        {
          title: "Permissible In-Bout Communication",
          description: "Coaches may give tactical advice to their athlete during active rounds in an encouraging, sportsmanlike manner. Shouting insults at the referee or opponent triggers instant coach ejection.",
        },
      ],
    },
  },
  {
    id: "academy-rules",
    number: "08",
    title: "Academy & Club Affiliation Rules",
    subtitle: "Dojo Accreditation, Safety Standards, Belt Promotion Authority & Compliance",
    icon: "Building2",
    description: "Standards required for martial arts dojos, sports clubs, and institutions to maintain recognized affiliated status with KALAWAR.",
    badge: "Institutional Governance",
    content: {
      points: [
        {
          title: "Annual Affiliation & Certification",
          description: "All academies must renew their institutional affiliation annually with the KALAWAR National Board, displaying their official Affiliation Certificate with unique QR validation.",
        },
        {
          title: "Chief Instructor Qualifications",
          description: "The Head Instructor of an affiliated academy must hold a minimum Black Belt 1st Dan credential certified or ratified by KALAWAR Sports & Martial Arts Federation of India.",
        },
        {
          title: "Dojo Safety & Equipment Mandate",
          description: "Affiliated dojos must maintain certified shock-absorbent flooring, accessible first-aid kits, working ice packs, emergency evacuation plans, and signed medical waivers for all students.",
        },
        {
          title: "Belt Examination & Certification Protocol",
          description: "Kyu (Color Belt) and Dan (Black Belt) examinations must follow the official KALAWAR Syllabus. Only official KALAWAR serialized belt certificates are recognized across India.",
        },
      ],
    },
  },
  {
    id: "disciplinary-rules",
    number: "09",
    title: "Disciplinary Code & Judicial Tribunal",
    subtitle: "Violations, Investigative Due Process, Suspensions & Sanctions",
    icon: "Scale",
    description: "The institutional judicial framework for investigating misconduct, age fraud, unsportsmanlike behavior, and administering penalties.",
    badge: "Disciplinary Tribunal",
    content: {
      points: [
        {
          title: "National Disciplinary Committee (NDC)",
          description: "A standing 5-member judicial bench comprising senior martial arts masters and legal advisors responsible for hearing formal disciplinary charges.",
        },
        {
          title: "Zero Tolerance for Age & Document Fraud",
          description: "Falsification of birth certificates, Aadhaar cards, medical clearances, or belt ranks results in an immediate minimum 2-year national ban and revocation of all medals.",
        },
        {
          title: "Sanctions Spectrum",
          description: "Penalties range through: Written Warning, Monetary Fine (₹5,000 to ₹50,000), Temporary Suspension from National Events (6 to 24 Months), and Permanent Expulsion from the Federation.",
        },
        {
          title: "Right to Fair Hearing",
          description: "Any individual or club facing disciplinary proceedings is guaranteed the right to submit evidence, present witnesses, and receive a written verdict within 14 business days.",
        },
      ],
    },
  },
  {
    id: "safety-rules",
    number: "10",
    title: "Ringside Medical & Safety Protocols",
    subtitle: "Emergency Preparedness, Concussion Protocol & Protective Equipment",
    icon: "HeartPulse",
    description: "Comprehensive health and safety directives ensuring zero compromise on athlete wellness during high-intensity competition.",
    badge: "Athlete Safety",
    content: {
      points: [
        {
          title: "Mandatory Ringside Medical Team & Ambulance",
          description: "No sanctioned tournament bout may commence without a licensed medical doctor, qualified sports paramedic, and fully equipped Advanced Life Support (ALS) ambulance on site.",
        },
        {
          title: "Concussion & Head Trauma Protocol (SCAT-5)",
          description: "Any athlete suffering a knockout (KO), loss of consciousness, or suspected concussion is immediately suspended from competition and placed under mandatory 30-day medical hiatus.",
          details: [
            "Athletes under concussion hiatus must obtain a certified neurologist clearance certificate before resuming full-contact sparring.",
            "Second concussion within a 12-month period mandates a 90-day minimum medical suspension.",
          ],
        },
        {
          title: "Pre-Competition Medical Screening",
          description: "All athletes must undergo a rapid pre-fight health screening (blood pressure, pulse, pupillary reflex, and skin check) prior to stepping onto the Tatami.",
        },
        {
          title: "Mandatory Protective Equipment Standards",
          description: "All safety gear must carry the official KALAWAR approved seal. Referees will inspect mouthguards, groin guards, shin guards, and headgear prior to every bout.",
        },
      ],
    },
  },
  {
    id: "protest-appeal-rules",
    number: "11",
    title: "Official Protest & Appeal Procedure",
    subtitle: "Grievance Timelines, Video Review, Appeal Fees & Jury Decisions",
    icon: "FileQuestion",
    description: "The formal 3-step legal process for lodging protests against scoring irregularities or referee rule misinterpretations.",
    badge: "Grievance Protocol",
    content: {
      points: [
        {
          title: "Time Limit for Lodging Protest (15 Minutes)",
          description: "A formal protest must be submitted in writing by the accredited Head Coach to the Chief Technical Table within exactly 15 minutes of the conclusion of the contested bout.",
        },
        {
          title: "Mandatory Appeal Fee (₹2,000 INR)",
          description: "Every protest submission must be accompanied by an official non-refundable statutory processing fee of ₹2,000 INR. If the protest is upheld and the decision overturned, the entire fee is refunded in full.",
        },
        {
          title: "Jury of Appeal & Video Review",
          description: "A 3-member Senior Technical Jury reviews official multi-angle video recordings and judge scorecards. The Jury's ruling is final, binding, and cannot be appealed further.",
        },
        {
          title: "Grounds for Valid Protest",
          description: "Protests are accepted only for: Mathematical scoring errors, failure to apply a mandatory penalty, or gross misinterpretation of written rules. Subjective judgment calls (e.g. speed or touch depth) cannot be protested.",
        },
      ],
    },
  },
  {
    id: "penalty-system",
    number: "12",
    title: "Penalty Escalation & Disqualification System",
    subtitle: "Tier 1 (Keikoku) → Tier 2 (Chui) → Tier 3 (Hansoku-Make)",
    icon: "AlertOctagon",
    description: "The 3-tier progressive disciplinary scale enforced by center referees to maintain mat safety, fair play, and sportsmanship.",
    badge: "Penalty System",
    content: {
      points: [
        {
          title: "Tier 1: Keikoku (Official Warning / Minor Infraction)",
          description: "Issued for minor unintentional violations: Stepping out of bounds (Jogai), passive stalling without engagement, minor pushing, or delayed obedience to referee commands.",
          details: [
            "Signal: Referee points index finger towards offender's feet at 45° angle.",
            "Penalty: No point deduction on scoreboard. Recorded in bout logbook.",
          ],
        },
        {
          title: "Tier 2: Chui (Formal Caution / Penalty Point)",
          description: "Issued for repeated boundary exits, excessive contact after stop command, grabbing opponent's uniform, or unsportsmanlike whining.",
          details: [
            "Signal: Referee points index finger horizontally towards offender's chest and announces 'Chui'.",
            "Penalty: 1 Point awarded directly to the opponent's scoreboard score.",
          ],
        },
        {
          title: "Tier 3: Hansoku-Make (Direct Disqualification / Grave Violation)",
          description: "Issued for dangerous intentional strikes (groin, spine, throat), biting, striking a downed opponent, abusing officials, or accumulating 3 Tier-2 penalties.",
          details: [
            "Signal: Referee points index finger upwards at 45° angle towards offender's face and commands 'Hansoku-Make'.",
            "Penalty: Immediate bout forfeiture, opponent declared winner. Case forwarded to Disciplinary Committee.",
          ],
        },
      ],
    },
  },
];
