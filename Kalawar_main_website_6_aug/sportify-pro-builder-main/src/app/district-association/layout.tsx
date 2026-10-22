import { Metadata } from "next";

export const metadata: Metadata = {
  title: "District Associations",
  description: "Directory of affiliated district level martial arts associations.",
  alternates: {
    canonical: "/district-association",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
