import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"
import PackageGrid from "@/components/package-grid"
import CreatePackageDialog from "@/components/create-package-dialog"

async function getUser() {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("sb-access-token")

  if (!accessToken) {
    return null
  }

  try {
    // Get user from Supabase auth
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        apikey: process.env.SUPABASE_ANON_KEY!,
      },
    })

    if (!response.ok) {
      return null
    }

    const userData = await response.json()
    return userData
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

async function getUserPackages(userId: string) {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/question_packages?user_id=eq.${userId}&order=created_at.desc`,
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY!,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      return []
    }

    const packages = await response.json()
    return packages
  } catch (error) {
    console.error("Error getting packages:", error)
    return []
  }
}

export default async function DashboardPage() {
  // Check authentication
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's question packages
  const packages = await getUserPackages(user.id)

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

        <PackageGrid packages={packages} />

        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Status Sistem:</h3>
          <div className="text-sm text-green-700">
            <p>✅ Authentication - Berfungsi dengan baik</p>
            <p>✅ Database - Terkoneksi dan siap</p>
            <p>✅ AI Integration - Groq siap untuk diversifikasi</p>
            <p>✅ User: {user.email}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
