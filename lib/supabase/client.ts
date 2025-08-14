// HTTP-based Supabase client for browser
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

class SupabaseClient {
  private baseUrl: string
  private anonKey: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!this.baseUrl || !this.anonKey) {
      throw new Error("Supabase environment variables are not configured")
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null

    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      if (name === "sb-access-token") {
        return decodeURIComponent(value)
      }
    }
    return null
  }

  private setCookie(name: string, value: string, days = 7) {
    if (typeof window === "undefined") return

    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  }

  private deleteCookie(name: string) {
    if (typeof window === "undefined") return
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      apikey: this.anonKey,
      "Content-Type": "application/json",
    }

    const token = this.getAuthToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return headers
  }

  // Auth methods
  auth = {
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: this.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        return { data: null, error: data }
      }

      if (typeof window !== "undefined" && data.access_token) {
        this.setCookie("sb-access-token", data.access_token)
        this.setCookie("sb-refresh-token", data.refresh_token)
      }

      return { data, error: null }
    },

    signUp: async (credentials: { email: string; password: string; options?: any }) => {
      const response = await fetch(`${this.baseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: this.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        return { data: null, error: data }
      }

      return { data, error: null }
    },

    signOut: async () => {
      if (typeof window !== "undefined") {
        this.deleteCookie("sb-access-token")
        this.deleteCookie("sb-refresh-token")
      }
      return { error: null }
    },

    getUser: async () => {
      const token = this.getAuthToken()
      if (!token) {
        return { data: { user: null }, error: null }
      }

      const response = await fetch(`${this.baseUrl}/auth/v1/user`, {
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return { data: { user: null }, error: await response.json() }
      }

      const user = await response.json()
      return { data: { user }, error: null }
    },
  }

  // Database methods
  from(table: string) {
    return {
      select: (columns = "*") => ({
        eq: (column: string, value: any) => ({
          order: (column: string, options?: { ascending?: boolean }) => ({
            execute: async () => {
              const orderParam = options?.ascending === false ? `${column}.desc` : `${column}.asc`
              const response = await fetch(`${this.baseUrl}/rest/v1/${table}?select=${columns}&order=${orderParam}`, {
                headers: this.getHeaders(),
              })

              if (!response.ok) {
                return { data: null, error: await response.json() }
              }

              const data = await response.json()
              return { data, error: null }
            },
          }),

          single: async () => {
            const response = await fetch(
              `${this.baseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`,
              { headers: this.getHeaders() },
            )

            if (!response.ok) {
              return { data: null, error: await response.json() }
            }

            const data = await response.json()
            return { data: data[0] || null, error: null }
          },
        }),

        execute: async () => {
          const response = await fetch(`${this.baseUrl}/rest/v1/${table}?select=${columns}`, {
            headers: this.getHeaders(),
          })

          if (!response.ok) {
            return { data: null, error: await response.json() }
          }

          const data = await response.json()
          return { data, error: null }
        },
      }),

      insert: async (values: any) => {
        const response = await fetch(`${this.baseUrl}/rest/v1/${table}`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(values),
        })

        if (!response.ok) {
          return { data: null, error: await response.json() }
        }

        const data = await response.json()
        return { data, error: null }
      },

      delete: () => ({
        eq: (column: string, value: any) => ({
          execute: async () => {
            const response = await fetch(`${this.baseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
              method: "DELETE",
              headers: this.getHeaders(),
            })

            if (!response.ok) {
              return { data: null, error: await response.json() }
            }

            return { data: null, error: null }
          },
        }),
      }),
    }
  }
}

export function createClient() {
  return new SupabaseClient()
}

export const supabase = createClient()
