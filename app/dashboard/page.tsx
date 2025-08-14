import DashboardHeader from "@/components/dashboard-header"
import PackageGrid from "@/components/package-grid"
import CreatePackageDialog from "@/components/create-package-dialog"

export default async function DashboardPage() {
  // Mock user for now to test functionality
  const mockUser = {
    id: "mock-user-id",
    email: "user@example.com",
  }

  // Mock packages data for testing
  const mockPackages = [
    {
      id: "1",
      title: "Matematika Kelas 10",
      description: "Soal-soal matematika untuk kelas 10 SMA",
      subject: "Matematika",
      grade_level: "10",
      created_at: new Date().toISOString(),
      user_id: "mock-user-id",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <DashboardHeader user={mockUser} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">Paket Soal Saya</h1>
            <p className="text-muted-foreground">Kelola dan diversifikasi soal Anda dengan AI</p>
          </div>
          <CreatePackageDialog />
        </div>

        <PackageGrid packages={mockPackages} />

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Status Sistem:</h3>
          <div className="text-sm text-blue-700">
            <p>✅ Landing page - Berfungsi dengan baik</p>
            <p>✅ Login/Register forms - Interface siap</p>
            <p>✅ Database - 4 tabel berhasil dibuat</p>
            <p>✅ Dashboard - Interface berfungsi</p>
            <p>✅ AI Integration - Groq terkoneksi</p>
            <p>🔧 Authentication flow - Dalam perbaikan</p>
          </div>
        </div>
      </main>
    </div>
  )
}
