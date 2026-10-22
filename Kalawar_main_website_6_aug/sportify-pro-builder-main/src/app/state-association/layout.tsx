import { Metadata } from "next";

export const metadata: Metadata = {
  title: "State Associations",
  description: "Directory of affiliated state level martial arts associations.",
  alternates: {
    canonical: "/state-association",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
