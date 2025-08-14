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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Loader2, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateQuestionDialogProps {
  packageId: string
}

export default function CreateQuestionDialog({ packageId }: CreateQuestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [questionType, setQuestionType] = useState<string>("")
  const [options, setOptions] = useState<{ [key: string]: string }>({ a: "", b: "", c: "", d: "" })
  const [correctAnswer, setCorrectAnswer] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const questionText = formData.get("questionText") as string
    const explanation = formData.get("explanation") as string
    const difficultyLevel = formData.get("difficultyLevel") as string

    try {
      let questionOptions = null
      let finalCorrectAnswer = correctAnswer

      // Handle different question types
      if (questionType === "multiple_choice") {
        // Validate that all options are filled
        const filledOptions = Object.entries(options).filter(([_, value]) => value.trim() !== "")
        if (filledOptions.length < 2) {
          setError("Minimal 2 pilihan jawaban harus diisi")
          return
        }
        if (!correctAnswer) {
          setError("Pilih jawaban yang benar")
          return
        }
        questionOptions = options
      } else if (questionType === "true_false") {
        finalCorrectAnswer = formData.get("trueFalseAnswer") as string
      } else if (questionType === "fill_blank" || questionType === "essay") {
        finalCorrectAnswer = formData.get("textAnswer") as string
      }

      const { error: insertError } = await supabase.from("questions").insert({
        package_id: packageId,
        question_text: questionText,
        question_type: questionType,
        options: questionOptions,
        correct_answer: finalCorrectAnswer,
        explanation: explanation || null,
        difficulty_level: difficultyLevel,
      })

      if (insertError) {
        setError(insertError.message)
        return
      }

      setOpen(false)
      setQuestionType("")
      setOptions({ a: "", b: "", c: "", d: "" })
      setCorrectAnswer("")
      router.refresh()
    } catch (err) {
      setError("Terjadi kesalahan saat membuat soal")
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (key: string, value: string) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const addOption = () => {
    const keys = Object.keys(options)
    const nextKey = String.fromCharCode(97 + keys.length) // a, b, c, d, e, f...
    if (keys.length < 6) {
      setOptions((prev) => ({ ...prev, [nextKey]: "" }))
    }
  }

  const removeOption = (key: string) => {
    if (Object.keys(options).length > 2) {
      const newOptions = { ...options }
      delete newOptions[key]
      setOptions(newOptions)
      if (correctAnswer === key) {
        setCorrectAnswer("")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Soal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Tambah Soal Baru</DialogTitle>
          <DialogDescription>Buat soal baru dengan berbagai jenis format pertanyaan.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="questionType">Jenis Soal *</Label>
            <Select value={questionType} onValueChange={setQuestionType} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis soal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                <SelectItem value="essay">Esai</SelectItem>
                <SelectItem value="true_false">Benar/Salah</SelectItem>
                <SelectItem value="fill_blank">Isian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionText">Pertanyaan *</Label>
            <Textarea
              id="questionText"
              name="questionText"
              placeholder="Tulis pertanyaan Anda di sini..."
              rows={3}
              required
            />
          </div>

          {/* Multiple Choice Options */}
          {questionType === "multiple_choice" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pilihan Jawaban *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Pilihan
                </Button>
              </div>
              <div className="space-y-2">
                {Object.entries(options).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium">{key.toUpperCase()}.</span>
                    <Input
                      value={value}
                      onChange={(e) => handleOptionChange(key, e.target.value)}
                      placeholder={`Pilihan ${key.toUpperCase()}`}
                      className="flex-1"
                    />
                    {Object.keys(options).length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(key)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Jawaban Benar *</Label>
                <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                  {Object.keys(options).map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key}>Pilihan {key.toUpperCase()}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* True/False Answer */}
          {questionType === "true_false" && (
            <div className="space-y-2">
              <Label>Jawaban Benar *</Label>
              <RadioGroup name="trueFalseAnswer" required>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true">Benar</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false">Salah</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Text Answer for Essay and Fill Blank */}
          {(questionType === "essay" || questionType === "fill_blank") && (
            <div className="space-y-2">
              <Label htmlFor="textAnswer">
                {questionType === "essay" ? "Jawaban/Poin Kunci" : "Jawaban yang Benar"} *
              </Label>
              <Textarea
                id="textAnswer"
                name="textAnswer"
                placeholder={
                  questionType === "essay" ? "Tulis poin-poin kunci jawaban..." : "Tulis jawaban yang benar..."
                }
                rows={3}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="explanation">Penjelasan (Opsional)</Label>
            <Textarea
              id="explanation"
              name="explanation"
              placeholder="Berikan penjelasan untuk jawaban ini..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficultyLevel">Tingkat Kesulitan *</Label>
            <Select name="difficultyLevel" defaultValue="medium" required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Mudah</SelectItem>
                <SelectItem value="medium">Sedang</SelectItem>
                <SelectItem value="hard">Sulit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || !questionType}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                "Buat Soal"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
