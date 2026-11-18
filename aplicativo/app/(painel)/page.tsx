"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  Cpu,
  History,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMovimentacoes } from "@/components/providers/MovimentacoesProvider";
import {
  calcularTotais,
  filtrarMovimentacoesHoje,
  formatarTempoRelativo,
} from "@/lib/movimentacoes-utils";

export default function DashboardPage() {
  const {
    movimentacoes,
    carregando,
    atualizando,
    erro,
    ultimaAtualizacao,
    realtimeStatus,
    recarregar,
  } = useMovimentacoes();

  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    const atualizarRelogio = () => setAgora(new Date());
    queueMicrotask(atualizarRelogio);
    const timer = setInterval(atualizarRelogio, 30000);
    return () => clearInterval(timer);
  }, []);

  const totais = useMemo(
    () => calcularTotais(movimentacoes),
    [movimentacoes]
  );

  const hoje = useMemo(() => {
    const movsHoje = filtrarMovimentacoesHoje(
      movimentacoes,
      agora ?? undefined
    );
    return calcularTotais(movsHoje);
  }, [movimentacoes, agora]);

  const ultimoEvento = movimentacoes[0] ?? null;

  const dataAtualFormatada = agora
    ? agora.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Carregando data...";

  const esp32Info = useMemo(() => {
    if (realtimeStatus === "CONECTADO" && ultimoEvento) {
      return {
        rotulo: "ESP32 integrado • Tempo real ativo",
        detalhe: `Último evento (${ultimoEvento.dispositivo_id}) ${formatarTempoRelativo(ultimoEvento.criado_em, agora?.getTime())}`,
        corBadge:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        ponto: "bg-emerald-500 dark:bg-emerald-400",
      };
    }
    if (realtimeStatus === "CONECTADO") {
      return {
        rotulo: "Tempo real ativo",
        detalhe: "Aguardando primeiro evento do ESP32",
        corBadge:
          "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        ponto: "bg-cyan-500 dark:bg-cyan-400",
      };
    }
    if (realtimeStatus === "CONECTANDO") {
      return {
        rotulo: "Conectando ao canal em tempo real...",
        detalhe: "Sincronizando estado do dispositivo",
        corBadge:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        ponto: "bg-amber-500 dark:bg-amber-400 animate-pulse",
      };
    }
    return {
      rotulo: "Monitoramento por consulta",
      detalhe: ultimoEvento
        ? `Último registro ${formatarTempoRelativo(ultimoEvento.criado_em, agora?.getTime())}`
        : "Sem eventos registrados",
      corBadge: "border-subtle bg-surface text-secondary",
      ponto: "bg-text-muted",
    };
  }, [realtimeStatus, ultimoEvento, agora]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Dashboard Operacional
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5 capitalize">
              <Calendar className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              {dataAtualFormatada}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-text-muted" />
              {carregando
                ? "Carregando..."
                : ultimaAtualizacao
                  ? `Atualizado às ${ultimaAtualizacao}`
                  : "Aguardando atualização"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={recarregar}
          disabled={atualizando}
          className={`self-start sm:self-auto inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            atualizando
              ? "border-badge-cyan-border bg-badge-cyan-bg text-badge-cyan-text cursor-wait"
              : "border-subtle bg-surface hover:bg-muted/70 text-secondary"
          }`}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${atualizando ? "animate-spin" : ""}`}
          />
          <span>{atualizando ? "Atualizando..." : "Atualizar"}</span>
        </button>
      </div>

      {/* Status do Sistema / ESP32 */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border px-4 py-3 text-xs ${esp32Info.corBadge}`}
      >
        <div className="flex items-center gap-2.5 font-medium">
          <span className={`h-2.5 w-2.5 rounded-full ${esp32Info.ponto}`} />
          <Cpu className="h-4 w-4 shrink-0" />
          <span>{esp32Info.rotulo}</span>
        </div>
        <span className="opacity-90 sm:text-right">{esp32Info.detalhe}</span>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300 flex items-center justify-between gap-3"
        >
          <span>{erro}</span>
          <button
            type="button"
            onClick={recarregar}
            className="rounded-lg bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Indicadores Principais */}
      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {/* DENTRO — Destaque Principal */}
        <div className="lg:col-span-1 relative overflow-hidden rounded-2xl border-2 border-badge-cyan-border bg-surface p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-badge-cyan-bg border border-badge-cyan-border px-3 py-1 text-xs font-bold uppercase tracking-wider text-badge-cyan-text">
              Ocupação Atual
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-cyan-bg text-badge-cyan-text">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              DENTRO
            </p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-primary tabular-nums">
              {carregando ? "—" : totais.presentes.toLocaleString("pt-BR")}
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Pessoas atualmente no ambiente monitorado
            </p>
          </div>
        </div>

        {/* ENTRADAS */}
        <div className="rounded-2xl border border-subtle bg-surface p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-badge-emerald-bg border border-badge-emerald-border px-3 py-1 text-xs font-bold uppercase tracking-wider text-badge-emerald-text">
              Fluxo de Entrada
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-emerald-bg text-badge-emerald-text">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              ENTRADAS
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-primary tabular-nums">
              {carregando ? "—" : totais.entradas.toLocaleString("pt-BR")}
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Total acumulado de entradas registradas
            </p>
          </div>
        </div>

        {/* SAÍDAS */}
        <div className="rounded-2xl border border-subtle bg-surface p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-badge-amber-bg border border-badge-amber-border px-3 py-1 text-xs font-bold uppercase tracking-wider text-badge-amber-text">
              Fluxo de Saída
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-amber-bg text-badge-amber-text">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              SAÍDAS
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-primary tabular-nums">
              {carregando ? "—" : totais.saidas.toLocaleString("pt-BR")}
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Total acumulado de saídas registradas
            </p>
          </div>
        </div>
      </section>

      {/* Resumo do dia e Acessos Rápidos */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Movimentação de Hoje
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-surface-elevated p-3 border border-subtle">
              <p className="text-[11px] text-text-muted">Entradas</p>
              <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {carregando ? "—" : hoje.entradas.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-xl bg-surface-elevated p-3 border border-subtle">
              <p className="text-[11px] text-text-muted">Saídas</p>
              <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {carregando ? "—" : hoje.saidas.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-xl bg-surface-elevated p-3 border border-subtle">
              <p className="text-[11px] text-text-muted">Total</p>
              <p className="mt-1 text-lg font-bold text-primary tabular-nums">
                {carregando ? "—" : hoje.total.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/historico"
          className="group rounded-2xl border border-subtle bg-surface hover:bg-muted/50 hover:border-badge-cyan-border p-5 flex flex-col justify-between transition-all shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-cyan-bg text-badge-cyan-text transition-colors">
              <History className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-base font-semibold text-primary">
              Histórico de Movimentações
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Consulte registros por data, horário, mês ou ano.
            </p>
          </div>
        </Link>

        <Link
          href="/metricas"
          className="group rounded-2xl border border-subtle bg-surface hover:bg-muted/50 hover:border-badge-emerald-border p-5 flex flex-col justify-between transition-all shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-emerald-bg text-badge-emerald-text transition-colors">
              <BarChart3 className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <h2 className="text-base font-semibold text-primary">
              Métricas e Estatísticas
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Gráficos diários, mensais, anuais, Top 3 meses e trimestres.
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}
