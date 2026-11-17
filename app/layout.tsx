import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Child & Adolescent Clinical Research Digest",
  description:
    "New child, family, and clinical psychology research from the last 30 days, across 23 journals.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
