import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certified Coaches",
  description: "Directory of certified martial arts coaches and instructors.",
  alternates: {
    canonical: "/coaches",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
