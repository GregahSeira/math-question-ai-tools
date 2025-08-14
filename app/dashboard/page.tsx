import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"
import PackageGrid from "@/components/package-grid"
import CreatePackageDialog from "@/components/create-package-dialog"

export default async function DashboardPage() {
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

  // Get user's question packages
  const { data: packages, error } = await supabase
    .from("question_packages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching packages:", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">Paket Soal Saya</h1>
            <p className="text-muted-foreground">Kelola dan diversifikasi soal Anda dengan AI</p>
          </div>
          <CreatePackageDialog />
        </div>

        <PackageGrid packages={packages || []} />
      </main>
    </div>
  )
}
