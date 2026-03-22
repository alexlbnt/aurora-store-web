import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aurora | Premium Sleepwear",
  description: "Ressignificando o seu descanso com elegância e conforto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${playfairDisplay.variable} ${montserrat.variable} antialiased text-slate-900 bg-background-light dark:bg-background-dark dark:text-slate-100 min-h-screen`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
