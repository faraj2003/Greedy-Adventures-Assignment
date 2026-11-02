import React from "react";
import "./globals.css";

export const metadata = {
  title: "Sea View Skydiving — Pattaya | Greedy Adventures",
  description: "Tandem skydiving over the Gulf of Thailand with Sea View Skydiving in Pattaya.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-paper antialiased">{children}</body>
    </html>
  );
}
