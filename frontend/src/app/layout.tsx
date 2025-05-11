import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { inter, robotoMono } from "@/lib/font";


export const metadata: Metadata = {
  title: "Salon Agent",
  description: "Salon AI Assistant Supervisor Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${robotoMono.className}antialiased`}
      >
        <Toaster
          position="top-right" />
        {children}
      </body>
    </html>
  );
}
