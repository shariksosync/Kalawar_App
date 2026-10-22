import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kalawarsmfi.com"),
  title: {
    default: "KALAWAR Sports & Martial Arts Federation of India",
    template: "%s — KALAWAR Sports & Martial Arts Federation of India",
  },
  description:
    "Official national portal of KALAWAR Sports & Martial Arts Federation of India: martial arts registrations, coach certifications, black belt accreditation, tournament rankings, events, and official certificates.",
  authors: [{ name: "KALAWAR Sports & Martial Arts Federation of India" }],
  keywords: [
    "Kalawar Sports",
    "Martial Arts India",
    "Black Belt Certification",
    "Dan Grading",
    "Martial Arts Federation",
    "Coach Certification",
    "Sports India",
    "Dojo Accreditation",
  ],
  openGraph: {
    title: "KALAWAR Sports & Martial Arts Federation of India",
    description:
      "National governing body for martial arts, sports development, certified coaching, and black belt accreditation across India.",
    url: "https://www.kalawarsmfi.com",
    siteName: "KALAWAR Sports & Martial Arts Federation of India",
    images: [
      {
        url: "/images/banners/slide1.png",
        width: 1920,
        height: 1080,
        alt: "KALAWAR Sports & Martial Arts Federation of India Banner",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "KALAWAR Sports & Martial Arts Federation of India",
    description:
      "Official national portal of KALAWAR Sports & Martial Arts Federation of India: martial arts registrations, coach certifications, black belt accreditation, tournament rankings, events, and official certificates.",
    images: ["/images/banners/slide1.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

import { AuthProvider } from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";

const schemaData = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  "name": "KALAWAR Sports & Martial Arts Federation of India",
  "url": "https://www.kalawarsmfi.com",
  "logo": "https://www.kalawarsmfi.com/logo.png",
  "image": "https://www.kalawarsmfi.com/images/banners/slide1.png",
  "description":
    "Official national portal of KALAWAR Sports & Martial Arts Federation of India: martial arts registrations, coach certifications, black belt accreditation, tournament rankings, events, and official certificates.",
  "telephone": "+91 70833 14435",
  "email": "kalawarmartialartsindia@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary selection:text-background min-h-screen w-full overflow-x-hidden">
        <AuthProvider>
          <SettingsProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
              </WishlistProvider>
            </CartProvider>
          </SettingsProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

