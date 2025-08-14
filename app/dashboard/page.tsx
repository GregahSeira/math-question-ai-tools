import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"
import PackageGrid from "@/components/package-grid"
import CreatePackageDialog from "@/components/create-package-dialog"

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("Debug - Supabase URL:", supabaseUrl ? "✓ Available" : "✗ Missing")
  console.log("Debug - Supabase Anon Key:", supabaseAnonKey ? "✓ Available" : "✗ Missing")

  // Check if Supabase environment variables are available
  const isSupabaseConfigured =
    typeof supabaseUrl === "string" &&
    supabaseUrl.length > 0 &&
    typeof supabaseAnonKey === "string" &&
    supabaseAnonKey.length > 0

  // If Supabase is not configured, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent to-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Connect Supabase to get started</h1>
          <div className="text-sm text-muted-foreground">
            <p>URL: {supabaseUrl ? "✓ Available" : "✗ Missing"}</p>
            <p>Key: {supabaseAnonKey ? "✓ Available" : "✗ Missing"}</p>
          </div>
        </div>
      </div>
    )
  }

  try {
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
      .execute()

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
  } catch (error) {
    console.error("Dashboard error:", error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent to-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Error loading dashboard</h1>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    )
  }
}
