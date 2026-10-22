import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media Gallery",
  description: "Photos and videos from our martial arts events and championships.",
  alternates: {
    canonical: "/gallery",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
