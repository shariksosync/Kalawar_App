import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Area",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
