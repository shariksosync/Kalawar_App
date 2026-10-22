import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliation",
  description: "Become an affiliated club or dojo with the Kalawar Federation.",
  alternates: {
    canonical: "/affiliation",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
