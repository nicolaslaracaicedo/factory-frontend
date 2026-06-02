import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono, Roboto, Inter, Poppins, Geist } from "next/font/google";
import { Toaster } from "sonner";
import { AlertCircle, CheckCircle2, TriangleAlert, Info } from "lucide-react";
import { CompanyThemeSync } from "@/src/components/company/company-theme-sync";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
      suppressHydrationWarning
      className={cn("h-full", "antialiased", manrope.variable, ibmPlexMono.variable, roboto.variable, inter.variable, poppins.variable, "font-sans", geist.variable)}
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..1&display=swap" />
        <script src="/scripts/boot-theme.js" />
      </head>
      <body className="m-0 min-h-full flex flex-col text-app-foreground">
        <CompanyThemeSync />
        {children}
        <Toaster
          position="bottom-right"
          icons={{
            success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
            error: <AlertCircle className="h-5 w-5 text-red-500" />,
            warning: <TriangleAlert className="h-5 w-5 text-amber-500" />,
            info: <Info className="h-5 w-5 text-blue-500" />,
          }}
          toastOptions={{
            style: {
              border: "none",
              background: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            },
          }}
        />
      </body>
    </html>
  );
}
