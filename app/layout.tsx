import type { Metadata } from "next";
import "./globals.css";
import "./experience.css";
export const metadata: Metadata = {
  title: "Bentang Tambang — Pahami dampak. Kenali tanggung jawab.",
  description:
    "Jelajahi regulasi lingkungan hidup dan pertambangan batubara melalui bentang tambang interaktif.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
