import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./ClientLayout"
import "./globals.css" // Import globals.css at the top of the file

export const metadata: Metadata = {
  title: "Sistem Diversifikasi Soal - AI-Powered Question Management",
  description: "Platform pendidikan Indonesia dengan AI untuk diversifikasi soal dan manajemen bank soal",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientLayout>{children}</ClientLayout>
}
