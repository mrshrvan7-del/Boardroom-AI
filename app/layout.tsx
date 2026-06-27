import type { Metadata } from "next";
import "./globals.css";
import AppWrapper from "@/components/layout/AppWrapper";

export const metadata: Metadata = {
  title: "Boardroom-AI Analytics Platform",
  description: "Automated executive dashboard, statistical analysis, and business briefs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
