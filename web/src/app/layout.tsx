import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "AI News Digest",
    template: "%s | AI News Digest",
  },
  description:
    "Curated AI news, scored and summarized daily. Coding assistants, open source models, agents, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${playfairDisplay.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
