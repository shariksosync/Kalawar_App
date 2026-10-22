import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rules & Regulations",
  description: "Official sporting and competition rules for federation events.",
  alternates: {
    canonical: "/rules",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
