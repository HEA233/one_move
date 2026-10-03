import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ONE MOVE | Human Truth",
  description: "One shopper. One checked note. One more choice.",
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
