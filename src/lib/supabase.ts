import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const supabaseUrl = rawUrl.startsWith("http")
  ? rawUrl
  : "https://placeholder.supabase.co";
const supabaseAnonKey = rawKey.length > 10 ? rawKey : "placeholder-key-value";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, { ...options, cache: "no-store" as RequestCache });
    },
  },
});
