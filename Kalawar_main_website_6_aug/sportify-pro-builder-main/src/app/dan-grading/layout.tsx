import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dan Grading",
  description: "Official Dan (Black Belt) grading syllabus and requirements.",
  alternates: {
    canonical: "/dan-grading",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
