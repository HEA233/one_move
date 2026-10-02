import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GHOSTED — Preview",
  description: "A keyless Stage 1 preview scaffold for EAT_HACK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
