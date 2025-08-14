"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreatePackageDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const subject = formData.get("subject") as string
    const gradeLevel = formData.get("gradeLevel") as string

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Anda harus login untuk membuat paket soal")
        return
      }

      const { error: insertError } = await supabase.from("question_packages").insert({
        title,
        description: description || null,
        subject,
        grade_level: gradeLevel || null,
        user_id: user.id,
      })

      if (insertError) {
        setError(insertError.message)
        return
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      setError("Terjadi kesalahan saat membuat paket soal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Buat Paket Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif">Buat Paket Soal Baru</DialogTitle>
          <DialogDescription>
            Buat paket soal baru untuk mengorganisir pertanyaan Anda berdasarkan mata pelajaran dan tingkat kelas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Judul Paket *</Label>
            <Input id="title" name="title" placeholder="Contoh: Matematika Kelas 10 - Trigonometri" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Deskripsi singkat tentang paket soal ini..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Mata Pelajaran *</Label>
              <Select name="subject" required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matematika">Matematika</SelectItem>
                  <SelectItem value="fisika">Fisika</SelectItem>
                  <SelectItem value="kimia">Kimia</SelectItem>
                  <SelectItem value="biologi">Biologi</SelectItem>
                  <SelectItem value="bahasa-indonesia">Bahasa Indonesia</SelectItem>
                  <SelectItem value="bahasa-inggris">Bahasa Inggris</SelectItem>
                  <SelectItem value="sejarah">Sejarah</SelectItem>
                  <SelectItem value="geografi">Geografi</SelectItem>
                  <SelectItem value="ekonomi">Ekonomi</SelectItem>
                  <SelectItem value="sosiologi">Sosiologi</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Tingkat Kelas</Label>
              <Select name="gradeLevel">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sd-1">SD Kelas 1</SelectItem>
                  <SelectItem value="sd-2">SD Kelas 2</SelectItem>
                  <SelectItem value="sd-3">SD Kelas 3</SelectItem>
                  <SelectItem value="sd-4">SD Kelas 4</SelectItem>
                  <SelectItem value="sd-5">SD Kelas 5</SelectItem>
                  <SelectItem value="sd-6">SD Kelas 6</SelectItem>
                  <SelectItem value="smp-7">SMP Kelas 7</SelectItem>
                  <SelectItem value="smp-8">SMP Kelas 8</SelectItem>
                  <SelectItem value="smp-9">SMP Kelas 9</SelectItem>
                  <SelectItem value="sma-10">SMA Kelas 10</SelectItem>
                  <SelectItem value="sma-11">SMA Kelas 11</SelectItem>
                  <SelectItem value="sma-12">SMA Kelas 12</SelectItem>
                  <SelectItem value="universitas">Universitas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                "Buat Paket"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
