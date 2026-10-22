import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certified Black Belts",
  description: "Directory of certified black belt candidates.",
  alternates: {
    canonical: "/certified-belts-candidates",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
