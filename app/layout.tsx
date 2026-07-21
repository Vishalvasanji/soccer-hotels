import type { Metadata, Viewport } from "next";
import { TEAM_NAME } from "@/lib/roster";
import Shell from "./shell";
import "./globals.css";

export const metadata: Metadata = {
  title: `${TEAM_NAME} — Team Travel Tracker`,
  description:
    "Track away games, tournaments, and team hotel bookings for Louisiana Elite Soccer 14U.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
