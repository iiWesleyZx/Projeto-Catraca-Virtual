import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  criarClienteSupabaseAuth,
  ehModoPreviewLocal,
  verificarTokenSupabase,
} from "@/lib/auth";

const ROTAS_PUBLICAS = new Set(["/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar APIs (cada endpoint trata sua própria autenticação: ESP32 token ou sessão),
  // arquivos estáticos, PWA manifest e service worker.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let usuario = await verificarTokenSupabase(accessToken);
  let novaSessao: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
  } | null = null;

  if (!usuario && refreshToken) {
    const supabase = criarClienteSupabaseAuth();
    if (supabase) {
      try {
        const { data } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });
        if (data.session && data.user) {
          usuario = {
            id: data.user.id,
            email: data.user.email ?? "usuario@catraca.local",
          };
          novaSessao = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
          };
        }
      } catch {
        usuario = null;
      }
    }
  }

  const ehRotaPublica = ROTAS_PUBLICAS.has(pathname);

  if (!usuario && !ehRotaPublica) {
    if (ehModoPreviewLocal()) {
      return NextResponse.next();
    }
    const urlLogin = new URL("/login", request.url);
    return NextResponse.redirect(urlLogin);
  }

  if (usuario && ehRotaPublica) {
    const urlDashboard = new URL("/", request.url);
    const resposta = NextResponse.redirect(urlDashboard);
    if (novaSessao) {
      const isProd = process.env.NODE_ENV === "production";
      resposta.cookies.set(ACCESS_TOKEN_COOKIE, novaSessao.access_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: novaSessao.expires_in ?? 3600,
      });
      resposta.cookies.set(REFRESH_TOKEN_COOKIE, novaSessao.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return resposta;
  }

  const resposta = NextResponse.next();
  if (novaSessao) {
    const isProd = process.env.NODE_ENV === "production";
    resposta.cookies.set(ACCESS_TOKEN_COOKIE, novaSessao.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: novaSessao.expires_in ?? 3600,
    });
    resposta.cookies.set(REFRESH_TOKEN_COOKIE, novaSessao.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
