import type { Metadata } from "next";
import { orbitron, poppins } from "./fonts";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "Atlas26",
  description: "A Digital Window Into Our Living Cosmos",
  icons: {
    icon: "/icon.png",
  },
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
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  );
}