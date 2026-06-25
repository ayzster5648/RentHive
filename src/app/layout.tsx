import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentHive — Property Management",
  description: "Manage properties, tenants, rent, and maintenance in one place.",
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
