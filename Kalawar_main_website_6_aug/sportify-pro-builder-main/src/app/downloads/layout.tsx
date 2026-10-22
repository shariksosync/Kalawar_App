import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Downloads",
  description: "Download official forms, rules, and federation documents.",
  alternates: {
    canonical: "/downloads",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
