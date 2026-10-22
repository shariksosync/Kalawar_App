import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certificate Verification",
  description: "Verify official KALAWAR federation certificates online.",
  alternates: {
    canonical: "/certificates",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
