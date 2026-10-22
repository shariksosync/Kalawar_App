import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Belt Exams",
  description: "Information and syllabus for martial arts belt grading examinations.",
  alternates: {
    canonical: "/belt-exams",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
