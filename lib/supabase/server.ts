import { cookies } from "next/headers"

// HTTP-based Supabase client for server
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

class SupabaseServerClient {
  private baseUrl: string
  private anonKey: string
  private authToken?: string

  constructor() {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase environment variables are not configured")
    }
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Get auth token from cookies
    const cookieStore = cookies()
    this.authToken = cookieStore.get("sb-access-token")?.value
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      apikey: this.anonKey,
      "Content-Type": "application/json",
    }

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`
    }

    return headers
  }

  // Auth methods
  auth = {
    getSession: async () => {
      if (!this.authToken) {
        return { data: { session: null }, error: null }
      }

      try {
        const response = await fetch(`${this.baseUrl}/auth/v1/user`, {
          headers: {
            apikey: this.anonKey,
            Authorization: `Bearer ${this.authToken}`,
          },
        })

        if (!response.ok) {
          return { data: { session: null }, error: await response.json() }
        }

        const user = await response.json()

        // Create a session-like object
        const session = {
          access_token: this.authToken,
          user: user,
          expires_at: Date.now() + 3600000, // 1 hour from now
        }

        return { data: { session }, error: null }
      } catch (error) {
        return { data: { session: null }, error }
      }
    },

    getUser: async () => {
      if (!this.authToken) {
        return { data: { user: null }, error: null }
      }

      const response = await fetch(`${this.baseUrl}/auth/v1/user`, {
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.authToken}`,
        },
      })

      if (!response.ok) {
        return { data: { user: null }, error: await response.json() }
      }

      const user = await response.json()
      return { data: { user }, error: null }
    },
  }

  // Database methods with improved query chain support
  from(table: string) {
    return {
      select: (columns = "*") => {
        const query = {
          columns,
          filters: [] as string[],
          orderBy: null as string | null,

          eq: (column: string, value: any) => {
            query.filters.push(`${column}=eq.${encodeURIComponent(value)}`)
            return query
          },

          order: (column: string, options?: { ascending?: boolean }) => {
            const direction = options?.ascending === false ? "desc" : "asc"
            query.orderBy = `order=${column}.${direction}`
            return query
          },

          execute: async () => {
            let url = `${this.baseUrl}/rest/v1/${table}?select=${query.columns}`

            if (query.filters.length > 0) {
              url += `&${query.filters.join("&")}`
            }

            if (query.orderBy) {
              url += `&${query.orderBy}`
            }

            const response = await fetch(url, {
              headers: this.getHeaders(),
            })

            if (!response.ok) {
              return { data: null, error: await response.json() }
            }

            const data = await response.json()
            return { data, error: null }
          },

          single: async () => {
            let url = `${this.baseUrl}/rest/v1/${table}?select=${query.columns}&limit=1`

            if (query.filters.length > 0) {
              url += `&${query.filters.join("&")}`
            }

            const response = await fetch(url, {
              headers: this.getHeaders(),
            })

            if (!response.ok) {
              return { data: null, error: await response.json() }
            }

            const data = await response.json()
            return { data: data[0] || null, error: null }
          },
        }

        return query
      },

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
  return new SupabaseServerClient()
}
