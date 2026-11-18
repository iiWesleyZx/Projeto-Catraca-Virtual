"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Download,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  Radio,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { usePwa } from "@/components/pwa/PwaContext";
import { useMovimentacoes } from "@/components/providers/MovimentacoesProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

const ITENS_MENU = [
  { href: "/", rotulo: "Dashboard", icone: LayoutDashboard },
  { href: "/historico", rotulo: "Histórico", icone: History },
  { href: "/metricas", rotulo: "Métricas", icone: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { podeInstalar, instalar } = usePwa();
  const { realtimeStatus } = useMovimentacoes();
  const { tema, alternarTema } = useTheme();
  const [saindo, setSaindo] = useState(false);

  async function handleSair() {
    setSaindo(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const statusBadge =
    realtimeStatus === "CONECTADO"
      ? {
          cor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          ponto: "bg-emerald-500 dark:bg-emerald-400",
          texto: "Tempo real ativo",
        }
      : realtimeStatus === "CONECTANDO"
        ? {
            cor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
            ponto: "bg-amber-500 dark:bg-amber-400 animate-pulse",
            texto: "Conectando...",
          }
        : {
            cor: "bg-muted text-secondary border-subtle",
            ponto: "bg-text-muted",
            texto: "Modo consulta",
          };

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-subtle bg-surface/95 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-subtle">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-cyan-bg border border-badge-cyan-border text-badge-cyan-text shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-primary">
              Catraca Virtual
            </p>
            <p className="text-xs text-text-muted">Monitoramento ESP32</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5" aria-label="Menu principal">
          {ITENS_MENU.map((item) => {
            const ativo = pathname === item.href;
            const Icone = item.icone;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  ativo
                    ? "bg-badge-cyan-bg text-badge-cyan-text border border-badge-cyan-border shadow-sm"
                    : "text-text-muted hover:text-primary hover:bg-muted/70 border border-transparent"
                }`}
              >
                <Icone
                  className={`h-4 w-4 ${
                    ativo
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-text-muted"
                  }`}
                />
                <span>{item.rotulo}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-2.5 border-t border-subtle">
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${statusBadge.cor}`}
          >
            <span className={`h-2 w-2 rounded-full ${statusBadge.ponto}`} />
            <span>{statusBadge.texto}</span>
          </div>

          <button
            type="button"
            onClick={alternarTema}
            className="w-full flex items-center justify-between rounded-xl border border-subtle bg-surface-elevated hover:bg-muted/70 px-3.5 py-2 text-xs font-medium text-secondary transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {tema === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-cyan-600" />
              )}
              <span>{tema === "dark" ? "Modo claro" : "Modo escuro"}</span>
            </span>
          </button>

          {podeInstalar && (
            <button
              type="button"
              onClick={instalar}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 px-3 py-2.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Instalar aplicativo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSair}
            disabled={saindo}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-text-muted hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>{saindo ? "Saindo..." : "Sair da conta"}</span>
          </button>
        </div>
      </aside>

      {/* Top Header Mobile */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-subtle bg-surface/95 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-badge-cyan-bg border border-badge-cyan-border text-badge-cyan-text shrink-0">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary leading-tight">
              Catraca Virtual
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Radio className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
              <span>{statusBadge.texto}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={alternarTema}
            aria-label={tema === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            className="flex items-center justify-center rounded-lg border border-subtle bg-surface-elevated p-1.5 text-secondary"
          >
            {tema === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-cyan-600" />
            )}
          </button>

          {podeInstalar && (
            <button
              type="button"
              onClick={instalar}
              aria-label="Instalar aplicativo"
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-300"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Instalar</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSair}
            disabled={saindo}
            aria-label="Sair da conta"
            className="flex items-center gap-1.5 rounded-lg border border-subtle bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-secondary hover:text-rose-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pb-24 md:pb-10">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Mobile */}
      <nav
        aria-label="Navegação inferior"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-subtle bg-surface/95 backdrop-blur-xl pb-safe"
      >
        <div className="grid grid-cols-3 h-16">
          {ITENS_MENU.map((item) => {
            const ativo = pathname === item.href;
            const Icone = item.icone;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  ativo
                    ? "text-cyan-600 dark:text-cyan-300"
                    : "text-text-muted hover:text-primary"
                }`}
              >
                <Icone
                  className={`h-5 w-5 ${
                    ativo
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-text-muted"
                  }`}
                />
                <span>{item.rotulo}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
