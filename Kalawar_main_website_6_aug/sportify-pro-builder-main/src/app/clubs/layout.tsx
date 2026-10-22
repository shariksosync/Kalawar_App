import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clubs Directory",
  description: "Find affiliated martial arts clubs and dojos across India.",
  alternates: {
    canonical: "/clubs",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
