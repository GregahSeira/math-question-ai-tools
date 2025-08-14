"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface DiversifyQuestionDialogProps {
  questionId: string
  onDiversified: () => void
}

const strategies = [
  { id: "context_change", label: "Ubah Konteks", description: "Mengubah situasi/konteks soal" },
  { id: "difficulty_variation", label: "Variasi Kesulitan", description: "Mengubah tingkat kesulitan" },
  { id: "format_change", label: "Ubah Format", description: "Mengubah tipe soal" },
  { id: "language_style", label: "Gaya Bahasa", description: "Mengubah gaya penulisan" },
]

export function DiversifyQuestionDialog({ questionId, onDiversified }: DiversifyQuestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(["context_change"])
  const [count, setCount] = useState(3)
  const [isLoading, setIsLoading] = useState(false)

  const handleStrategyChange = (strategyId: string, checked: boolean) => {
    if (checked) {
      setSelectedStrategies([...selectedStrategies, strategyId])
    } else {
      setSelectedStrategies(selectedStrategies.filter((id) => id !== strategyId))
    }
  }

  const handleDiversify = async () => {
    if (selectedStrategies.length === 0) {
      toast.error("Pilih minimal satu strategi diversifikasi")
      return
    }

    if (count < 1 || count > 10) {
      toast.error("Jumlah variasi harus antara 1-10")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/diversify-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          strategies: selectedStrategies,
          count,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat variasi soal")
      }

      toast.success(`Berhasil membuat ${data.diversified_questions.length} variasi soal!`)
      setOpen(false)
      onDiversified()
    } catch (error) {
      console.error("Error diversifying question:", error)
      toast.error(error instanceof Error ? error.message : "Gagal membuat variasi soal")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Sparkles className="h-4 w-4" />
          Diversifikasi AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-cyan-800">Diversifikasi Soal dengan AI</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">Strategi Diversifikasi</Label>
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={strategy.id}
                    checked={selectedStrategies.includes(strategy.id)}
                    onCheckedChange={(checked) => handleStrategyChange(strategy.id, checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={strategy.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {strategy.label}
                    </Label>
                    <p className="text-xs text-slate-500">{strategy.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="count" className="text-sm font-medium text-slate-700">
              Jumlah Variasi (1-10)
            </Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="10"
              value={count}
              onChange={(e) => setCount(Number.parseInt(e.target.value) || 3)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button
              onClick={handleDiversify}
              disabled={isLoading || selectedStrategies.length === 0}
              className="flex-1 bg-cyan-800 hover:bg-cyan-900"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Membuat...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Buat Variasi
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
