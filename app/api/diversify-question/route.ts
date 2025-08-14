import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"

const diversificationSchema = z.object({
  diversified_questions: z.array(
    z.object({
      question_text: z.string(),
      question_type: z.enum(["multiple_choice", "essay", "true_false", "fill_blank"]),
      options: z.array(z.string()).optional(),
      correct_answer: z.string(),
      explanation: z.string(),
      diversification_strategy: z.string(),
      difficulty_level: z.enum(["mudah", "sedang", "sulit"]),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questionId, strategies, count = 3 } = await request.json()

    // Get original question
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Create diversification prompt
    const strategiesText = strategies.join(", ")
    const optionsText = question.options ? `Pilihan: ${question.options.join(", ")}` : ""

    const prompt = `
Sebagai ahli pendidikan, buatlah ${count} variasi soal dari soal asli berikut dengan strategi diversifikasi: ${strategiesText}

SOAL ASLI:
Tipe: ${question.question_type}
Pertanyaan: ${question.question_text}
${optionsText}
Jawaban Benar: ${question.correct_answer}
Penjelasan: ${question.explanation || "Tidak ada penjelasan"}

STRATEGI DIVERSIFIKASI:
- context_change: Ubah konteks/situasi soal tapi konsep tetap sama
- difficulty_variation: Variasikan tingkat kesulitan (mudah/sedang/sulit)
- format_change: Ubah format soal (misal dari pilihan ganda ke isian)
- language_style: Ubah gaya bahasa (formal/informal, teknis/sederhana)

ATURAN:
1. Pertahankan konsep pembelajaran yang sama
2. Pastikan jawaban benar masih akurat
3. Berikan penjelasan yang jelas untuk setiap variasi
4. Gunakan bahasa Indonesia yang baik dan benar
5. Sesuaikan dengan tingkat pendidikan yang tepat

Buat variasi yang kreatif dan edukatif!
`

    // Generate diversified questions using Groq
    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      prompt,
      schema: diversificationSchema,
    })

    // Save diversified questions to database
    const diversifiedQuestions = object.diversified_questions.map((q) => ({
      original_question_id: questionId,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || null,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      diversification_strategy: q.diversification_strategy,
      difficulty_level: q.difficulty_level,
    }))

    const { data: savedQuestions, error: saveError } = await supabase
      .from("diversified_questions")
      .insert(diversifiedQuestions)
      .select()

    if (saveError) {
      console.error("Error saving diversified questions:", saveError)
      return NextResponse.json({ error: "Failed to save diversified questions" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      diversified_questions: savedQuestions,
    })
  } catch (error) {
    console.error("Error in diversify-question API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
