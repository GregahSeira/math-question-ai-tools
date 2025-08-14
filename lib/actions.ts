"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// HTTP-based auth functions
async function supabaseAuthRequest(endpoint: string, body: any) {
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return { data, error: response.ok ? null : data, ok: response.ok }
}

async function supabaseDbRequest(table: string, method: string, body?: any, query?: string) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`

  const response = await fetch(url, {
    method,
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY!,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()
  return { data, error: response.ok ? null : data, ok: response.ok }
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

  try {
    const { data, error, ok } = await supabaseAuthRequest("token?grant_type=password", {
      email: email.toString(),
      password: password.toString(),
    })

    if (!ok || error) {
      return { error: error?.message || "Login gagal" }
    }

    // Set auth cookies
    if (data.access_token) {
      const cookieStore = cookies()
      cookieStore.set("sb-access-token", data.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: data.expires_in || 3600,
      })
      cookieStore.set("sb-refresh-token", data.refresh_token, {
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

  try {
    const {
      data: authData,
      error: authError,
      ok,
    } = await supabaseAuthRequest("signup", {
      email: email.toString(),
      password: password.toString(),
      data: {
        full_name: fullName.toString(),
      },
    })

    if (!ok || authError) {
      return { error: authError?.message || "Registrasi gagal" }
    }

    // Create user record in custom users table
    if (authData.user) {
      await supabaseDbRequest("users", "POST", {
        id: authData.user.id,
        email: email.toString(),
        full_name: fullName.toString(),
      })
    }

    return { success: "Periksa email Anda untuk mengkonfirmasi akun." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi." }
  }
}

// Sign out action
export async function signOut() {
  // Clear auth cookies
  const cookieStore = cookies()
  cookieStore.delete("sb-access-token")
  cookieStore.delete("sb-refresh-token")

  redirect("/auth/login")
}
