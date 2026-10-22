import { Metadata } from "next";

export const metadata: Metadata = {
  title: "National Rankings",
  description: "Official national athlete rankings for various martial arts disciplines.",
  alternates: {
    canonical: "/ranking",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
