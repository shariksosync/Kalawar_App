import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournament Results",
  description: "Official results from our championships and tournaments.",
  alternates: {
    canonical: "/results",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
