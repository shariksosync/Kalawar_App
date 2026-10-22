import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Shop",
  description: "Purchase official KALAWAR federation gear, equipment, and merchandise.",
  alternates: {
    canonical: "/shop",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
