"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function LoginPage() {
  const router = useRouter();
  const { tema, alternarTema } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const dados = (await resposta.json().catch(() => ({}))) as {
        erro?: string;
      };

      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível realizar o login.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErro("Erro de conexão ao tentar autenticar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-app text-primary flex items-center justify-center p-4 relative overflow-hidden">
      <button
        type="button"
        onClick={alternarTema}
        aria-label={tema === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        className="absolute top-4 right-4 z-20 inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface px-3 py-2 text-xs font-medium text-secondary shadow-sm hover:bg-muted/60 cursor-pointer"
      >
        {tema === "dark" ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-cyan-600" />
        )}
        <span>{tema === "dark" ? "Claro" : "Escuro"}</span>
      </button>

      {/* Subtle background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border border-subtle bg-surface/95 p-7 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center mb-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-badge-cyan-bg border border-badge-cyan-border text-badge-cyan-text mb-4 shadow-sm">
              <Activity className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Catraca Virtual ESP32
            </h1>
            <p className="mt-1.5 text-sm text-text-muted">
              Acesse o painel de monitoramento e métricas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operador@empresa.com"
                  className="w-full rounded-xl border border-subtle bg-surface-elevated pl-10 pr-4 py-2.5 text-sm text-primary placeholder:text-text-muted focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  id="password"
                  type={mostrarSenha ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-subtle bg-surface-elevated pl-10 pr-11 py-2.5 text-sm text-primary placeholder:text-text-muted focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary p-1 cursor-pointer"
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-300"
              >
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/15 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {carregando ? "Autenticando..." : "Entrar no painel"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-subtle flex items-center justify-center gap-2 text-xs text-text-muted">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Autenticação protegida via Supabase Auth</span>
          </div>
        </div>
      </div>
    </main>
  );
}
