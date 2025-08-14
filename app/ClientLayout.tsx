"use client"

import type React from "react"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
})

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  weight: ["400", "500", "600"],
})

function ClientLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()

  return (
    <html lang="id" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense
      fallback={
        <html lang="id" className={`${playfair.variable} ${sourceSans.variable}`}>
          <body className="font-sans antialiased">
            <div className="flex items-center justify-center min-h-screen">
              <div>Loading...</div>
            </div>
          </body>
        </html>
      }
    >
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </Suspense>
  )
}
