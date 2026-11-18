import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "catraca_access_token";
export const REFRESH_TOKEN_COOKIE = "catraca_refresh_token";

export interface UsuarioAutenticado {
  id: string;
  email: string;
}

export function criarClienteSupabaseAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function verificarTokenSupabase(
  accessToken: string | undefined
): Promise<UsuarioAutenticado | null> {
  if (!accessToken) return null;

  const supabase = criarClienteSupabaseAuth();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email ?? "usuario@catraca.local",
    };
  } catch {
    return null;
  }
}

export async function obterUsuarioAutenticado(): Promise<UsuarioAutenticado | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  return verificarTokenSupabase(token);
}

export function ehModoPreviewLocal(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_PREVIEW_SEM_AUTH === "true"
  );
}
