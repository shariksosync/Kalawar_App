import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Championships",
  description: "National and state level championship events and results.",
  alternates: {
    canonical: "/championship",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
