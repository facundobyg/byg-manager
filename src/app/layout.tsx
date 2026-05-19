import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BYG Manager",
  description: "Financial Management System",
  icons: {
    icon: "/brand/bg-icon-light.png",
    apple: "/brand/bg-icon-light.png",
  },
};

// Inline script runs before paint — reads localStorage and applies .dark to <html>
const themeScript = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
} catch(e) {}
`.trim();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} antialiased bg-byg-bg text-byg-text`}>
        {children}
      </body>
    </html>
  );
}
