import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  criarClienteSupabaseAuth,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const supabase = criarClienteSupabaseAuth();

  if (!supabase) {
    return NextResponse.json(
      {
        erro: "Serviço de autenticação Supabase não configurado no ambiente.",
      },
      { status: 503 }
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Requisição inválida." },
      { status: 400 }
    );
  }

  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
    return NextResponse.json(
      { erro: "Formato de dados inválido." },
      { status: 400 }
    );
  }

  const { email, password } = corpo as Record<string, unknown>;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return NextResponse.json(
      { erro: "Informe e-mail e senha para entrar." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.session || !data.user) {
    return NextResponse.json(
      { erro: "E-mail ou senha inválidos." },
      { status: 401 }
    );
  }

  const resposta = NextResponse.json({
    sucesso: true,
    usuario: {
      id: data.user.id,
      email: data.user.email ?? email.trim(),
    },
  });

  const isProd = process.env.NODE_ENV === "production";

  resposta.cookies.set(ACCESS_TOKEN_COOKIE, data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: data.session.expires_in ?? 3600,
  });

  resposta.cookies.set(REFRESH_TOKEN_COOKIE, data.session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return resposta;
}
