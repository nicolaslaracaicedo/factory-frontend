import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono, Roboto, Inter, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { CompanyThemeSync } from "@/src/components/company/company-theme-sync";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Factory | SaaS de Facturacion",
  description: "Sistema de facturacion modular tipo SaaS para Factory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${ibmPlexMono.variable} ${roboto.variable} ${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..1&display=swap" />
      </head>
      <body className="m-0 min-h-full flex flex-col text-app-foreground">
        <CompanyThemeSync />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
