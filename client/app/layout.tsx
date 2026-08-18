import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Engineering Demo — RFP Assistant",
  description:
    "Interactive demo of prompt engineering: execute prompt templates from a GitHub prompt library against the SPC-17765 ATO RFQ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}