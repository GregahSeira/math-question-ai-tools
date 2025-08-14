"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

function getSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Sign in action
export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Data formulir tidak tersedia" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi" }
  }

  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Set auth cookies manually
    if (data.session) {
      const cookieStore = cookies()
      cookieStore.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: data.session.expires_in,
      })
      cookieStore.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi." }
  }
}

// Sign up action
export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Data formulir tidak tersedia" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")

  if (!email || !password || !fullName) {
    return { error: "Semua field wajib diisi" }
  }

  const supabase = getSupabaseClient()

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
        data: {
          full_name: fullName.toString(),
        },
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: email.toString(),
        full_name: fullName.toString(),
      })

      if (userError) {
        console.error("Error creating user record:", userError)
        // Don't return error here as auth user was created successfully
      }
    }

    return { success: "Periksa email Anda untuk mengkonfirmasi akun." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi." }
  }
}

// Sign out action
export async function signOut() {
  const supabase = getSupabaseClient()
  await supabase.auth.signOut()

  // Clear auth cookies
  const cookieStore = cookies()
  cookieStore.delete("sb-access-token")
  cookieStore.delete("sb-refresh-token")

  redirect("/auth/login")
}
