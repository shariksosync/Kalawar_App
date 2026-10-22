import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certified Referees",
  description: "Directory of official national and state certified referees.",
  alternates: {
    canonical: "/referees",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
