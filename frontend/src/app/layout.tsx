"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import Providers from "@/components/layout/Providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ROUTES_WITHOUT_LAYOUT = ["/login", "/"];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showLayout = !ROUTES_WITHOUT_LAYOUT.some(route => 
    route === "/" ? pathname === route : pathname.startsWith(route)
  );

  return (
    <html lang="en">
      <head>
        <title>JUST Inventory Management System</title>
        <meta name="description" content="Jashore University of Science and Technology - Inventory Management System" />
        <link rel="icon" href="/JUST_Logo.svg" type="image/svg+xml" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <AuthProvider>
            {showLayout ? (
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-y-auto bg-gray-50">
                    <div className="max-w-7xl mx-auto p-4 md:p-8">
                      {children}
                    </div>
                  </main>
                  <Footer />
                </div>
              </div>
            ) : (
              children
            )}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
