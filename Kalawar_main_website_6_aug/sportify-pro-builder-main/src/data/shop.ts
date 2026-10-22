export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  order: number;
}

export interface ShopProduct {
  id: string;
  code: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  availabilityStatus: "In Stock" | "Out of Stock" | "Pre-order";
  images: string[];
  status: "Active" | "Draft" | "Hidden";
  featured: boolean;
  tags?: string[];
  rating?: number;
  reviewsCount?: number;
  specifications?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export const defaultCategories: ShopCategory[] = [
  {
    id: "cat-uniforms",
    name: "Uniforms & Dobok",
    slug: "uniforms-dobok",
    description: "Official federation approved Taekwondo, Karate, Judo & Kung Fu uniforms.",
    image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
    icon: "Shirt",
    order: 1,
  },
  {
    id: "cat-belts",
    name: "Belts & Ranks",
    slug: "belts-ranks",
    description: "Premium embroidered martial arts rank belts from White to Master Black Belt.",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    icon: "Award",
    order: 2,
  },
  {
    id: "cat-gear",
    name: "Protective Gear",
    slug: "protective-gear",
    description: "WTF & WKF compliant chest guards, headgears, shin guards, and gloves.",
    image: "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=800&q=80",
    icon: "Shield",
    order: 3,
  },
  {
    id: "cat-equipment",
    name: "Training Equipment",
    slug: "training-equipment",
    description: "Kicking paddles, heavy punching bags, agility ladders, and focus mitts.",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    icon: "Target",
    order: 4,
  },
  {
    id: "cat-apparel",
    name: "Federation Apparel",
    slug: "federation-apparel",
    description: "Official Kalawar tracksuits, training dry-fit tees, hoodies, and athletic bags.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    icon: "ShoppingBag",
    order: 5,
  },
  {
    id: "cat-accessories",
    name: "Accessories & Medals",
    slug: "accessories-medals",
    description: "Tournament medals, federation lapel pins, water bottles, and equipment bags.",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    icon: "Medal",
    order: 6,
  },
];

export const defaultProducts: ShopProduct[] = [
  {
    id: "prd-001",
    code: "PRD-2026-0001",
    name: "Kalawar Elite Competition Dobok",
    slug: "kalawar-elite-competition-dobok",
    category: "Uniforms & Dobok",
    description:
      "World-class lightweight ribbed fabric uniform designed for competitive sparring and forms. Breathable mesh ventilation under arms and pants for maximum cooling during championship fights.",
    price: 1899,
    originalPrice: 2499,
    stock: 45,
    availabilityStatus: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    ],
    status: "Active",
    featured: true,
    tags: ["Uniform", "Dobok", "Sparring", "Taekwondo", "Competition"],
    rating: 4.9,
    reviewsCount: 28,
    specifications: {
      Material: "65% Polyester, 35% Cotton diamond weave",
      Collar: "Black V-Neck Collar (Federation approved)",
      Sizes: "120cm to 200cm",
      Certification: "Kalawar National Federation Standard",
    },
  },
  {
    id: "prd-002",
    code: "PRD-2026-0002",
    name: "Master Silk Embroidered Black Belt (1st - 5th Dan)",
    slug: "master-silk-embroidered-black-belt",
    category: "Belts & Ranks",
    description:
      "Custom double-layer satin/silk rank belt with golden metallic embroidery of Kalawar Federation seal and Dan stripes. Retains rigidity and develops an authentic aged look.",
    price: 999,
    originalPrice: 1499,
    stock: 60,
    availabilityStatus: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
    ],
    status: "Active",
    featured: true,
    tags: ["Belt", "Black Belt", "Dan", "Embroidery"],
    rating: 5.0,
    reviewsCount: 42,
    specifications: {
      Width: "4.5 cm / 5.0 cm",
      Material: "100% Heavy Satin Cotton core",
      Length: "260cm to 340cm",
    },
  },
  {
    id: "prd-003",
    code: "PRD-2026-0003",
    name: "Reversible Electronic-Style Chest Guard (Hogu)",
    slug: "reversible-chest-guard-hogu",
    category: "Protective Gear",
    description:
      "High-density shock-absorbing EVA foam chest protector with Red & Blue reversible sides. Heavy-duty strap system ensures snug fit and comprehensive rib cage protection.",
    price: 1599,
    originalPrice: 1999,
    stock: 35,
    availabilityStatus: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=800&q=80",
    ],
    status: "Active",
    featured: true,
    tags: ["Chest Guard", "Hogu", "Sparring", "Protective Gear"],
    rating: 4.8,
    reviewsCount: 19,
    specifications: {
      Padding: "Multi-layered high-density shock EVA foam",
      Sides: "Red (Hong) / Blue (Chong)",
      Closure: "Reinforced woven tie straps",
    },
  },
  {
    id: "prd-004",
    code: "PRD-2026-0004",
    name: "Federation Pro Headguard with Face Shield",
    slug: "federation-pro-headguard-face-shield",
    category: "Protective Gear",
    description:
      "Dipped foam headguard equipped with a detachable polycarbonate high-impact transparent face shield for full face and cranial protection in tournament combat.",
    price: 2199,
    originalPrice: 2799,
    stock: 22,
    availabilityStatus: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    ],
    status: "Active",
    featured: false,
    tags: ["Headguard", "Helmet", "Face Shield", "Safety"],
    rating: 4.7,
    reviewsCount: 15,
    specifications: {
      Shell: "High impact NBR dipped foam",
      Visor: "Clear impact-resistant polymer",
      Colors: "Red / Blue / White",
    },
  },
  {
    id: "prd-005",
    code: "PRD-2026-0005",
    name: "Double Target Kicking Paddle (Twin Clapper)",
    slug: "double-target-kicking-paddle",
    category: "Training Equipment",
    description:
      "Acoustic feedback double target pad designed to develop speed, precision, and kicking rhythm. Features wrist retention strap and ergonomic grip.",
    price: 649,
    originalPrice: 899,
    stock: 80,
    availabilityStatus: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=800&q=80",
    ],
    status: "Active",
    featured: false,
    tags: ["Kicking Pad", "Target", "Training", "Clapper"],
    rating: 4.8,
    reviewsCount: 31,
    specifications: {
      Cover: "Reinforced PU synthetic leather",
      Sound: "Loud crisp clack feedback",
      Handle: "Anti-slip foam grip with safety tether",
    },
  },
  {
    id: "prd-006",
    code: "PRD-2026-0006",
    name: "Kalawar India Official National Tracksuit",
    slug: "kalawar-india-official-national-tracksuit",
    category: "Federation Apparel",
    description:
      "Exclusive federation national team tracksuit crafted in luxury moisture-wicking poly-spandex with golden Kalawar crest and India federation branding.",
    price: 2499,
    originalPrice: 3299,
    stock: 25,
    availabilityStatus: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    ],
    status: "Active",
    featured: true,
    tags: ["Tracksuit", "National Team", "Apparel", "Jacket"],
    rating: 4.9,
    reviewsCount: 56,
    specifications: {
      Fit: "Athletic performance fit with zip pockets",
      Fabric: "Breathable thermal poly-fleece blend",
      Emblem: "3D Rubberized Golden Federation Crest",
    },
  },
  {
    id: "prd-007",
    code: "PRD-2026-0007",
    name: "Championship Gold, Silver & Bronze Medal Set",
    slug: "championship-gold-silver-bronze-medal-set",
    category: "Accessories & Medals",
    description:
      "Heavy cast zinc alloy 70mm custom tournament medals with embossed martial arts motif and woven tricolor neck ribbons. Ideal for clubs and sanctioned tournaments.",
    price: 499,
    originalPrice: 699,
    stock: 120,
    availabilityStatus: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    ],
    status: "Active",
    featured: false,
    tags: ["Medals", "Awards", "Tournament", "Trophy"],
    rating: 4.9,
    reviewsCount: 64,
    specifications: {
      Diameter: "70 mm",
      Thickness: "4.5 mm",
      Finish: "Polished Antique Gold / Silver / Bronze",
      Ribbon: "Sublimated premium satin ribbon",
    },
  },
  {
    id: "prd-008",
    code: "PRD-2026-0008",
    name: "Sparring Shin & Instep Guard Pair",
    slug: "sparring-shin-instep-guard-pair",
    category: "Protective Gear",
    description:
      "Ergonomic pre-curved tibia and foot protectors with dual elastic compression straps. Absorbs intense low kicks while allowing full ankle mobility.",
    price: 899,
    originalPrice: 1199,
    stock: 50,
    availabilityStatus: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=800&q=80",
    ],
    status: "Active",
    featured: false,
    tags: ["Shin Guard", "Instep", "Sparring", "Protection"],
    rating: 4.6,
    reviewsCount: 14,
    specifications: {
      Foam: "Dual-layer compressed foam",
      Straps: "Hook-and-loop quick fasteners",
    },
  },
];
