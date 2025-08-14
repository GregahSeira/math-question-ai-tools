"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface DiversifiedQuestion {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  correct_answer: string
  explanation: string
  diversification_strategy: string
  difficulty_level: string
  created_at: string
}

interface DiversifiedQuestionsListProps {
  questionId: string
}

export function DiversifiedQuestionsList({ questionId }: DiversifiedQuestionsListProps) {
  const [diversifiedQuestions, setDiversifiedQuestions] = useState<DiversifiedQuestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDiversifiedQuestions = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("diversified_questions")
        .select("*")
        .eq("original_question_id", questionId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDiversifiedQuestions(data || [])
    } catch (error) {
      console.error("Error fetching diversified questions:", error)
      toast.error("Gagal memuat variasi soal")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchDiversifiedQuestions()
    }
  }, [isOpen, questionId])

  const handleDeleteDiversified = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("diversified_questions").delete().eq("id", id)

      if (error) throw error

      setDiversifiedQuestions((prev) => prev.filter((q) => q.id !== id))
      toast.success("Variasi soal berhasil dihapus")
    } catch (error) {
      console.error("Error deleting diversified question:", error)
      toast.error("Gagal menghapus variasi soal")
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    const types = {
      multiple_choice: "Pilihan Ganda",
      essay: "Esai",
      true_false: "Benar/Salah",
      fill_blank: "Isian",
    }
    return types[type as keyof typeof types] || type
  }

  const getDifficultyColor = (level: string) => {
    const colors = {
      mudah: "bg-green-100 text-green-800",
      sedang: "bg-yellow-100 text-yellow-800",
      sulit: "bg-red-100 text-red-800",
    }
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (diversifiedQuestions.length === 0 && !isOpen) {
    return null
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 text-sm text-slate-600 hover:text-slate-900">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Sparkles className="h-4 w-4" />
          Variasi AI ({diversifiedQuestions.length})
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-3">
        {isLoading ? (
          <div className="text-center py-4 text-slate-500">Memuat variasi soal...</div>
        ) : diversifiedQuestions.length === 0 ? (
          <div className="text-center py-4 text-slate-500">Belum ada variasi soal</div>
        ) : (
          diversifiedQuestions.map((question) => (
            <Card key={question.id} className="border-l-4 border-l-purple-400">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {getQuestionTypeLabel(question.question_type)}
                    </Badge>
                    <Badge className={`text-xs ${getDifficultyColor(question.difficulty_level)}`}>
                      {question.difficulty_level}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {question.diversification_strategy.replace("_", " ")}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDiversified(question.id)}
                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">{question.question_text}</h4>

                  {question.options && question.options.length > 0 && (
                    <div className="space-y-1">
                      {question.options.map((option, index) => (
                        <div
                          key={index}
                          className={`text-sm p-2 rounded ${
                            option === question.correct_answer
                              ? "bg-green-50 text-green-800 border border-green-200"
                              : "bg-slate-50 text-slate-700"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                        </div>
                      ))}
                    </div>
                  )}

                  {(!question.options || question.options.length === 0) && (
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Jawaban: </span>
                      <span className="text-green-700 font-medium">{question.correct_answer}</span>
                    </div>
                  )}
                </div>

                {question.explanation && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                    <span className="font-medium">Penjelasan: </span>
                    {question.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
