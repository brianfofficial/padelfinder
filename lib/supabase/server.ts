import { createServerClient } from "@supabase/ssr";
import { createClient as createBareClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Chainable mock that returns empty results for any query shape
function createMockClient(): SupabaseClient<Database> {
  const emptyResult = { data: [], error: null, count: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mockChain(): any {
    return new Proxy(() => mockChain(), {
      get(_target, prop) {
        if (prop === "then") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (resolve: (v: typeof emptyResult) => void) =>
            resolve(emptyResult);
        }
        return () => mockChain();
      },
    });
  }

  return {
    from: () => mockChain(),
    rpc: () => mockChain(),
  } as unknown as SupabaseClient<Database>;
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    return createMockClient();
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies are read-only
          }
        },
      },
    }
  );
}

export async function createServiceClient() {
  if (!isSupabaseConfigured()) {
    return createMockClient();
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component
          }
        },
      },
    }
  );
}

/**
 * Cookie-free client for use in generateStaticParams and other
 * build-time / static-generation contexts where cookies() is unavailable.
 */
export function createStaticClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    return createMockClient();
  }

  return createBareClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
