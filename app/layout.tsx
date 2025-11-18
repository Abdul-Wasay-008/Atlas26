import type { Metadata } from "next";
import { orbitron, poppins } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas26",
  description: "A Digital Window Into Our Living Cosmos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${poppins.variable}`}
    >
      <body className="antialiased bg-black text-white">
        {children}
      </body>
    </html>
  );
}