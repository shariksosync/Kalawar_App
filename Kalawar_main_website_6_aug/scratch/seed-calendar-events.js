const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const CALENDAR_EVENTS = [
  // JAN
  {
    id: "EVT-CAL-01",
    title: "KALAWAR National Winter Selection Trials 2026",
    discipline: "Kalawar Kaya Yuddha & Sparsha Yuddha",
    category: "Trials",
    eventType: "calendar",
    city: "Pune, Maharashtra",
    venue: "Shiv Chhatrapati Sports Complex, Balewadi",
    startDate: "2026-01-10",
    endDate: "2026-01-12",
    month: "JAN",
    year: 2026,
    tier: "State Qualifiers",
    status: "Completed",
    registrationLive: false,
    entryFee: "₹500",
    slots: 120,
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
    summary: "National winter trials selecting state representatives for the senior National Championship."
  },
  {
    id: "EVT-CAL-02",
    title: "All-India Republic Day Martial Arts Open 2026",
    discipline: "Kalawar Charana Yuddha",
    category: "Championship",
    eventType: "calendar",
    city: "New Delhi",
    venue: "Indira Gandhi Indoor Stadium, ITO",
    startDate: "2026-01-24",
    endDate: "2026-01-26",
    month: "JAN",
    year: 2026,
    tier: "Open Cup",
    status: "Completed",
    registrationLive: false,
    entryFee: "₹750",
    slots: 100,
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    summary: "Open tournament celebrating Republic Day with high-action kicking and agility matches."
  },

  // FEB
  {
    id: "EVT-CAL-03",
    title: "My First Championship – Mumbai Suburban Debut Cup",
    discipline: "Sparsha Yuddha & Santulana",
    category: "League",
    eventType: "calendar",
    city: "Mumbai, Maharashtra",
    venue: "Andheri Sports Complex Indoor Arena",
    startDate: "2026-02-07",
    endDate: "2026-02-08",
    month: "FEB",
    year: 2026,
    tier: "Grassroots Debut",
    status: "Completed",
    registrationLive: false,
    entryFee: "₹750",
    slots: 100,
    image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    summary: "100% Guaranteed Podium Medals for debut athletes with electronic scoring."
  },
  {
    id: "EVT-CAL-04",
    title: "Karnataka State Kalawar Senior Qualifiers 2026",
    discipline: "Kalawar Kaya Yuddha",
    category: "Trials",
    eventType: "calendar",
    city: "Bengaluru, Karnataka",
    venue: "Kanteerava Indoor Stadium",
    startDate: "2026-02-21",
    endDate: "2026-02-22",
    month: "FEB",
    year: 2026,
    tier: "State Qualifiers",
    status: "Completed",
    registrationLive: false,
    entryFee: "₹600",
    slots: 80,
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
    summary: "Karnataka state selections for the 2026 National Championship."
  },

  // MAR
  {
    id: "EVT-CAL-05",
    title: "All-India West Zone Inter-Dojo Championship 2026",
    discipline: "All 5 KALAWAR Disciplines",
    category: "Championship",
    eventType: "calendar",
    city: "Ahmedabad, Gujarat",
    venue: "EKA Arena, The Arena by TransStadia",
    startDate: "2026-03-07",
    endDate: "2026-03-08",
    month: "MAR",
    year: 2026,
    tier: "Grand Prix",
    status: "Completed",
    registrationLive: false,
    entryFee: "₹1,000",
    slots: 150,
    image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=80",
    summary: "Premier inter-club west zone championship."
  },

  // APR
  {
    id: "EVT-CAL-06",
    title: "All-India Kaya Yuddha National Championship 2026",
    discipline: "Kalawar Kaya Yuddha",
    category: "Championship",
    eventType: "calendar",
    city: "Pune, Maharashtra",
    venue: "Shiv Chhatrapati Sports Complex, Balewadi",
    startDate: "2026-04-18",
    endDate: "2026-04-20",
    month: "APR",
    year: 2026,
    tier: "National Championship",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹1,200",
    slots: 128,
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
    summary: "Flagship senior national championship featuring all weight divisions and state federation champions."
  },

  // MAY
  {
    id: "EVT-CAL-07",
    title: "National Charana Yuddha Grand Prix 2026",
    discipline: "Kalawar Charana Yuddha",
    category: "Championship",
    eventType: "calendar",
    city: "Bengaluru, Karnataka",
    venue: "Kanteerava Indoor Stadium",
    startDate: "2026-05-15",
    endDate: "2026-05-17",
    month: "MAY",
    year: 2026,
    tier: "Grand Prix",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹1,000",
    slots: 96,
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    summary: "Premier leg-combat and dynamic agility kicking grand prix ranking tournament."
  },

  // JUN
  {
    id: "EVT-CAL-08",
    title: "National Sparsha Yuddha Point-Touch Open 2026",
    discipline: "Kalawar Sparsha Yuddha",
    category: "Championship",
    eventType: "calendar",
    city: "Mumbai, Maharashtra",
    venue: "Andheri Sports Complex Arena",
    startDate: "2026-06-13",
    endDate: "2026-06-14",
    month: "JUN",
    year: 2026,
    tier: "National Championship",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹850",
    slots: 110,
    image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    summary: "High-speed precision point sparring tournament."
  },

  // JUL
  {
    id: "EVT-CAL-09",
    title: "All-India Sangama Kala Heritage Championship 2026",
    discipline: "Kalawar Sangama Kala",
    category: "Championship",
    eventType: "calendar",
    city: "Jaipur, Rajasthan",
    venue: "Sawai Mansingh Indoor Stadium",
    startDate: "2026-07-18",
    endDate: "2026-07-20",
    month: "JUL",
    year: 2026,
    tier: "Heritage Championship",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹1,500",
    slots: 100,
    image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80",
    summary: "Ancient combat styles including Malla Yuddha and Danda Yuddha heritage championship."
  },

  // AUG
  {
    id: "EVT-CAL-10",
    title: "National Santulana Balance & Agility Open 2026",
    discipline: "Kalawar Santulana",
    category: "Championship",
    eventType: "calendar",
    city: "New Delhi",
    venue: "Talkatora Indoor Stadium",
    startDate: "2026-08-15",
    endDate: "2026-08-16",
    month: "AUG",
    year: 2026,
    tier: "National Championship",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹800",
    slots: 80,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
    summary: "Independence Day national balance, core stance, and acrobatic agility tournament."
  },

  // SEP
  {
    id: "EVT-CAL-11",
    title: "Kerala State Kalawar Martial Arts Championship 2026",
    discipline: "Kaya Yuddha & Sparsha Yuddha",
    category: "Championship",
    eventType: "calendar",
    city: "Kochi, Kerala",
    venue: "Regional Sports Centre (RSC), Rajiv Gandhi Indoor Stadium",
    startDate: "2026-09-12",
    endDate: "2026-09-13",
    month: "SEP",
    year: 2026,
    tier: "State Qualifiers",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹600",
    slots: 80,
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
    summary: "State qualifiers and ranking tournament for Kerala."
  },

  // OCT
  {
    id: "EVT-CAL-12",
    title: "All-India Autumn Martial Arts Trophy 2026",
    discipline: "Kalawar Charana Yuddha & Santulana",
    category: "Championship",
    eventType: "calendar",
    city: "Ludhiana, Punjab",
    venue: "Guru Nanak Stadium Indoor Complex",
    startDate: "2026-10-10",
    endDate: "2026-10-11",
    month: "OCT",
    year: 2026,
    tier: "Open Cup",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹750",
    slots: 100,
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    summary: "North zone open autumn trophy with cash awards."
  },

  // NOV
  {
    id: "EVT-CAL-13",
    title: "South India Zonal Kalawar Championship 2026",
    discipline: "All 5 KALAWAR Disciplines",
    category: "Championship",
    eventType: "calendar",
    city: "Chennai, Tamil Nadu",
    venue: "Jawaharlal Nehru Indoor Stadium",
    startDate: "2026-11-14",
    endDate: "2026-11-15",
    month: "NOV",
    year: 2026,
    tier: "Grand Prix",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹1,000",
    slots: 140,
    image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=80",
    summary: "Annual South India zonal championship."
  },

  // DEC
  {
    id: "EVT-CAL-14",
    title: "National Federation Cup Season Finale 2026",
    discipline: "All 5 KALAWAR Disciplines",
    category: "Championship",
    eventType: "calendar",
    city: "Pune, Maharashtra",
    venue: "Shiv Chhatrapati Sports Complex, Balewadi",
    startDate: "2026-12-18",
    endDate: "2026-12-20",
    month: "DEC",
    year: 2026,
    tier: "National Championship",
    status: "Upcoming",
    registrationLive: false,
    entryFee: "₹2,000",
    slots: 200,
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
    summary: "End-of-season grand championship crowning the undisputed Master of Champions."
  },

  // 2027
  {
    id: "EVT-CAL-15",
    title: "International Kalawar Asian Invitation Cup 2027",
    discipline: "All 5 KALAWAR Disciplines",
    category: "Championship",
    eventType: "calendar",
    city: "New Delhi, India",
    venue: "Indira Gandhi Arena",
    startDate: "2027-01-15",
    endDate: "2027-01-17",
    month: "2027",
    year: 2027,
    tier: "Grand Prix",
    status: "Upcoming",
    registrationLive: false,
    entryFee: "₹3,500",
    slots: 300,
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80",
    summary: "International Asian invitational tournament welcoming national teams."
  },

  // My First Championship
  {
    id: "EVT-MFC-01",
    title: "My First Championship – Maharashtra Novice Debut 2026",
    discipline: "Sparsha Yuddha & Santulana",
    category: "League",
    eventType: "my-first-championship",
    city: "Pune, Maharashtra",
    venue: "Balewadi Indoor Arena Tatami 4",
    startDate: "2026-04-25",
    endDate: "2026-04-26",
    month: "APR",
    year: 2026,
    tier: "Grassroots Debut",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹750",
    slots: 120,
    image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    summary: "Novice white and yellow belt introductory tournament. 100% guaranteed podium medals and zero knockouts."
  },
  {
    id: "EVT-MFC-02",
    title: "My First Championship – Western India Debut Cup",
    discipline: "Sparsha Yuddha (Point Touch)",
    category: "League",
    eventType: "my-first-championship",
    city: "Mumbai, Maharashtra",
    venue: "Andheri Sports Complex Arena",
    startDate: "2026-06-13",
    endDate: "2026-06-14",
    month: "JUN",
    year: 2026,
    tier: "Grassroots Debut",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹750",
    slots: 100,
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
    summary: "Friendly, high-support debut competition for junior, youth, and adult martial arts practitioners."
  },
  {
    id: "EVT-MFC-03",
    title: "My First Championship – South Zone Debut Open",
    discipline: "Kalawar Santulana Debut",
    category: "League",
    eventType: "my-first-championship",
    city: "Bengaluru, Karnataka",
    venue: "Koramangala Indoor Stadium",
    startDate: "2026-09-05",
    endDate: "2026-09-06",
    month: "SEP",
    year: 2026,
    tier: "Grassroots Debut",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹750",
    slots: 90,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
    summary: "Beginner-level form demonstration and stance stability showcase with personalized coach feedback."
  },

  // Upcoming
  {
    id: "EVT-UPC-01",
    title: "National All-India Kaya Yuddha Open Cup",
    discipline: "Kalawar Kaya Yuddha",
    category: "Championship",
    eventType: "upcoming",
    city: "Pune",
    venue: "Shiv Chhatrapati Sports Complex",
    startDate: "2026-04-18",
    endDate: "2026-04-20",
    month: "APR",
    year: 2026,
    tier: "National Championship",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹1,200",
    slots: 128,
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
    summary: "Premier full-contact martial arts combat tournament with official Dan grading points."
  },
  {
    "id": "EVT-UPC-02",
    title: "National Charana Yuddha Elite Grand Prix",
    discipline: "Kalawar Charana Yuddha",
    category: "Championship",
    eventType: "upcoming",
    city: "Bengaluru",
    venue: "Kanteerava Indoor Stadium",
    startDate: "2026-05-15",
    endDate: "2026-05-17",
    month: "MAY",
    year: 2026,
    tier: "Grand Prix",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹1,000",
    slots: 96,
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    summary: "Leg-combat and high-flying agility ranking tournament."
  },
  {
    id: "EVT-UPC-03",
    title: "All-India Sparsha Yuddha National Speed Trophy",
    discipline: "Kalawar Sparsha Yuddha",
    category: "Championship",
    eventType: "upcoming",
    city: "Mumbai",
    venue: "Andheri Sports Complex Arena",
    startDate: "2026-06-13",
    endDate: "2026-06-14",
    month: "JUN",
    year: 2026,
    tier: "National Championship",
    status: "Upcoming",
    registrationLive: true,
    entryFee: "₹850",
    slots: 110,
    image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    summary: "Light-touch point sparring championship emphasizing reaction speed and precision."
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas!");

  const Event = mongoose.models.Event || mongoose.model("Event", new mongoose.Schema({}, { strict: false }));

  // Delete all old test entries
  const delRes = await Event.deleteMany({});
  console.log(`Deleted ${delRes.deletedCount} old events from MongoDB`);

  // Insert complete fresh dynamic events
  const insRes = await Event.insertMany(CALENDAR_EVENTS);
  console.log(`Successfully seeded ${insRes.length} official KALAWAR events into MongoDB!`);

  // Update storage file as well
  const storagePath = path.join(__dirname, "..", "sportify-pro-builder-main", "src", "data", "storage", "events.json");
  fs.writeFileSync(storagePath, JSON.stringify(CALENDAR_EVENTS, null, 2), "utf-8");
  console.log("Saved dynamic events to local storage fallback file.");

  await mongoose.disconnect();
  console.log("Finished successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
