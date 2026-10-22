import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events Calendar",
  description: "Upcoming martial arts tournaments, seminars, and federation events.",
  alternates: {
    canonical: "/events",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
