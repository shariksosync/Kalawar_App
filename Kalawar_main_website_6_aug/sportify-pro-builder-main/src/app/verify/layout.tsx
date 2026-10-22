import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Document",
  description: "Verify ID cards, certificates, and official documents.",
  alternates: {
    canonical: "/verify",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
