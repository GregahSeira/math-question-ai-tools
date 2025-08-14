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
    if (!isSupabaseConfigured) {
      throw new Error("Supabase environment variables are not configured")
    }
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("sb-access-token")
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

      // Store token in localStorage
      if (typeof window !== "undefined" && data.access_token) {
        localStorage.setItem("sb-access-token", data.access_token)
        localStorage.setItem("sb-refresh-token", data.refresh_token)
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
        localStorage.removeItem("sb-access-token")
        localStorage.removeItem("sb-refresh-token")
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
