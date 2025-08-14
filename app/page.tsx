import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Brain, BookOpen, Zap, Users } from "lucide-react"
import Link from "next/link"

export default async function HomePage() {
  // If Supabase is not configured, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent to-background">
        <h1 className="text-2xl font-bold text-primary">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Check if user is already logged in
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-primary">Sistem Diversifikasi Soal</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Question Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Masuk</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Daftar</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Hero Section */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl font-bold leading-tight text-primary lg:text-5xl">
                Berdayakan Pengajaran Anda dengan Wawasan Berbasis AI
              </h2>
              <p className="text-lg text-muted-foreground">
                Diversifikasi soal Anda dan tingkatkan keterlibatan siswa dengan mudah menggunakan teknologi AI
                terdepan.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Bank Soal Cerdas</h3>
                  <p className="text-sm text-muted-foreground">Kelola berbagai jenis soal dengan mudah</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Diversifikasi AI</h3>
                  <p className="text-sm text-muted-foreground">Otomatis variasi soal dengan AI</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Kolaborasi Tim</h3>
                  <p className="text-sm text-muted-foreground">Berbagi dan kelola bersama tim</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Analisis Cerdas</h3>
                  <p className="text-sm text-muted-foreground">Wawasan mendalam tentang performa</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Mulai Gratis Sekarang
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                  Sudah Punya Akun?
                </Button>
              </Link>
            </div>
          </div>

          {/* Image placeholder */}
          <div className="flex items-center justify-center">
            <div className="aspect-square w-full max-w-md rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 p-8">
              <div className="flex h-full items-center justify-center">
                <Brain className="h-32 w-32 text-primary/60" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Sistem Diversifikasi Soal. Platform pendidikan Indonesia dengan teknologi AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
