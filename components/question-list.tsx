"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2, Brain, CheckCircle, XCircle, FileText, HelpCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DiversifyQuestionDialog } from "@/components/diversify-question-dialog"
import { DiversifiedQuestionsList } from "@/components/diversified-questions-list"

interface Question {
  id: string
  question_text: string
  question_type: "multiple_choice" | "essay" | "true_false" | "fill_blank"
  options?: any
  correct_answer?: string
  explanation?: string
  difficulty_level: "easy" | "medium" | "hard"
  created_at: string
}

interface QuestionListProps {
  questions: Question[]
  packageId: string
}

const questionTypeLabels = {
  multiple_choice: "Pilihan Ganda",
  essay: "Esai",
  true_false: "Benar/Salah",
  fill_blank: "Isian",
}

const questionTypeIcons = {
  multiple_choice: CheckCircle,
  essay: FileText,
  true_false: XCircle,
  fill_blank: HelpCircle,
}

const difficultyColors = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
}

const difficultyLabels = {
  easy: "Mudah",
  medium: "Sedang",
  hard: "Sulit",
}

export default function QuestionList({ questions, packageId }: QuestionListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()

  const supabase = createClient()

  const handleDelete = async (questionId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
      return
    }

    setLoading(questionId)
    setError("")

    try {
      const { error: deleteError } = await supabase.from("questions").delete().eq("id", questionId)

      if (deleteError) {
        setError(deleteError.message)
        return
      }

      router.refresh()
    } catch (err) {
      setError("Terjadi kesalahan saat menghapus soal")
    } finally {
      setLoading(null)
    }
  }

  const handleDiversified = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Brain className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">Belum Ada Soal</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Mulai dengan membuat soal pertama Anda. Klik tombol "Tambah Soal" untuk memulai.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {questions.map((question) => {
        const TypeIcon = questionTypeIcons[question.question_type]
        return (
          <Card key={question.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="h-4 w-4 text-primary" />
                    <Badge variant="outline">{questionTypeLabels[question.question_type]}</Badge>
                    <Badge className={difficultyColors[question.difficulty_level]}>
                      {difficultyLabels[question.difficulty_level]}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-medium leading-relaxed">{question.question_text}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={loading === question.id}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(question.id)}
                      disabled={loading === question.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Show options for multiple choice */}
              {question.question_type === "multiple_choice" && question.options && (
                <div className="space-y-2">
                  {Object.entries(question.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-2 rounded text-sm ${
                        key === question.correct_answer
                          ? "bg-green-50 border border-green-200 text-green-800"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <span className="font-medium">{key.toUpperCase()}.</span> {value as string}
                    </div>
                  ))}
                </div>
              )}

              {/* Show correct answer for other types */}
              {question.question_type !== "multiple_choice" && question.correct_answer && (
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Jawaban:</p>
                  <p className="text-sm bg-green-50 border border-green-200 rounded p-2">{question.correct_answer}</p>
                </div>
              )}

              {/* Show explanation if available */}
              {question.explanation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Penjelasan:</p>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
              )}

              <DiversifiedQuestionsList key={refreshKey} questionId={question.id} />

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Dibuat: {new Date(question.created_at).toLocaleDateString("id-ID")}</span>
                <DiversifyQuestionDialog questionId={question.id} onDiversified={handleDiversified} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
