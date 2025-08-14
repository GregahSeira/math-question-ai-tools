import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"
import QuestionList from "@/components/question-list"
import CreateQuestionDialog from "@/components/create-question-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"
import Link from "next/link"

interface PackagePageProps {
  params: {
    id: string
  }
}

export default async function PackagePage({ params }: PackagePageProps) {
  // If Supabase is not configured, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent to-background">
        <h1 className="text-2xl font-bold text-primary">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // Get the package details
  const { data: packageData, error: packageError } = await supabase
    .from("question_packages")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (packageError || !packageData) {
    notFound()
  }

  // Get questions for this package
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("package_id", params.id)
    .order("created_at", { ascending: false })

  if (questionsError) {
    console.error("Error fetching questions:", questionsError)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="font-serif text-3xl font-bold text-primary">{packageData.title}</h1>
              <p className="text-muted-foreground">{packageData.description || "Tidak ada deskripsi"}</p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{packageData.subject}</Badge>
                {packageData.grade_level && <Badge variant="outline">{packageData.grade_level}</Badge>}
              </div>
            </div>
            <CreateQuestionDialog packageId={params.id} />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Daftar Soal</h2>
              <Badge variant="outline">{questions?.length || 0} soal</Badge>
            </div>
          </div>

          <QuestionList questions={questions || []} packageId={params.id} />
        </div>
      </main>
    </div>
  )
}
