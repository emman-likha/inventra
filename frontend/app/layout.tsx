import type { Metadata } from "next";
import SmoothScroll from "../components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventra | Modern Asset Management",
  description: "Track, manage, and optimize your assets with Inventra.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 
        Loading Product Sans (Google Sans equivalent) from Google Fonts 
        If Google Sans is installed locally, font-family in globals.css will pick it up.
      */}
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Product+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
