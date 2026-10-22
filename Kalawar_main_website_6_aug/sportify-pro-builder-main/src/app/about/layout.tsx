import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the KALAWAR Sports & Martial Arts Federation of India, our history, structure, and mission to empower India's athletes.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
