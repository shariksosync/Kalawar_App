import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest News",
  description: "Latest updates and announcements from the federation.",
  alternates: {
    canonical: "/news",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
