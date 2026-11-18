"use client";

import {
  AlertCircle,
  Award,
  BarChart3,
  CalendarDays,
  CalendarRange,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMovimentacoes } from "@/components/providers/MovimentacoesProvider";
import {
  agregarPorEscala,
  calcularTopMeses,
  calcularTopTrimestres,
  calcularTotais,
} from "@/lib/movimentacoes-utils";
import type { EscalaMetrica } from "@/lib/types";

const ESCALAS: Array<{ valor: EscalaMetrica; rotulo: string }> = [
  { valor: "diario", rotulo: "Diário" },
  { valor: "mensal", rotulo: "Mensal" },
  { valor: "anual", rotulo: "Anual" },
];

const TOOLTIP_STYLE = {
  backgroundColor: "var(--chart-tooltip-bg)",
  borderColor: "var(--chart-tooltip-border)",
  borderRadius: "12px",
  color: "var(--chart-tooltip-text)",
  fontSize: "12px",
};

export default function MetricasPage() {
  const { movimentacoes, carregando, atualizando, erro, recarregar } =
    useMovimentacoes();
  const [escala, setEscala] = useState<EscalaMetrica>("diario");

  const totais = useMemo(
    () => calcularTotais(movimentacoes),
    [movimentacoes]
  );

  const serieEscala = useMemo(
    () => agregarPorEscala(movimentacoes, escala),
    [movimentacoes, escala]
  );

  const serieMensal = useMemo(
    () => agregarPorEscala(movimentacoes, "mensal"),
    [movimentacoes]
  );

  const serieAnual = useMemo(
    () => agregarPorEscala(movimentacoes, "anual"),
    [movimentacoes]
  );

  const topMeses = useMemo(
    () => calcularTopMeses(movimentacoes, 3),
    [movimentacoes]
  );

  const topTrimestres = useMemo(
    () => calcularTopTrimestres(movimentacoes, 3),
    [movimentacoes]
  );

  const dadosDistribuicao = useMemo(
    () => [
      { nome: "Entradas", valor: totais.entradas, cor: "#10b981" },
      { nome: "Saídas", valor: totais.saidas, cor: "#f59e0b" },
    ],
    [totais.entradas, totais.saidas]
  );

  const mediaPorPeriodo =
    serieEscala.length > 0
      ? Math.round(
          serieEscala.reduce((acc, p) => acc + p.total, 0) / serieEscala.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Métricas e Estatísticas
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Análise diária, mensal, anual e trimestral com base nos registros reais
          </p>
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

      {erro && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300"
        >
          {erro}
        </div>
      )}

      {/* Seletor de Escala (Diário / Mensal / Anual) */}
      <section className="rounded-2xl border border-subtle bg-surface p-5 space-y-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-semibold text-primary">
              Evolução da Movimentação
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Escala de visualização"
            className="inline-flex rounded-xl border border-subtle bg-surface-elevated p-1 self-start"
          >
            {ESCALAS.map((item) => (
              <button
                key={item.valor}
                type="button"
                role="tab"
                aria-selected={escala === item.valor}
                onClick={() => setEscala(item.valor)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  escala === item.valor
                    ? "bg-badge-cyan-bg text-badge-cyan-text border border-badge-cyan-border shadow-sm"
                    : "text-text-muted hover:text-primary hover:bg-muted/70 border border-transparent"
                }`}
              >
                {item.rotulo}
              </button>
            ))}
          </div>
        </div>

        {/* Mini-resumo da escala */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-subtle bg-surface-elevated p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">
              Total Movimentações
            </p>
            <p className="mt-1 text-2xl font-bold text-primary tabular-nums">
              {carregando ? "—" : totais.total.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface-elevated p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">
              Entradas
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {carregando ? "—" : totais.entradas.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface-elevated p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">
              Saídas
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {carregando ? "—" : totais.saidas.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface-elevated p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">
              Média por{" "}
              {escala === "diario"
                ? "dia"
                : escala === "mensal"
                  ? "mês"
                  : "ano"}
            </p>
            <p className="mt-1 text-2xl font-bold text-cyan-600 dark:text-cyan-300 tabular-nums">
              {carregando ? "—" : mediaPorPeriodo.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Gráfico Principal */}
        <div className="h-72 w-full">
          {carregando ? (
            <div className="h-full rounded-xl bg-muted animate-pulse" />
          ) : serieEscala.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle text-text-muted text-sm">
              <BarChart3 className="h-8 w-8 mb-2 opacity-60" />
              Sem dados registrados para exibir no gráfico.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serieEscala}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                />
                <XAxis
                  dataKey="rotulo"
                  stroke="var(--chart-axis)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--chart-axis)"
                  fontSize={12}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="entradas"
                  name="Entradas"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="saidas"
                  name="Saídas"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Grid: Distribuição + Comparativo Mensal/Anual */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribuição Entradas vs Saídas */}
        <section className="rounded-2xl border border-subtle bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold text-primary">
              Distribuição de Entradas e Saídas
            </h2>
          </div>

          <div className="h-64 w-full">
            {totais.total === 0 ? (
              <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-subtle text-sm text-text-muted">
                Nenhuma movimentação registrada ainda.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosDistribuicao}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {dadosDistribuicao.map((entry) => (
                      <Cell key={entry.nome} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Comparativo entre Meses e Anos */}
        <section className="rounded-2xl border border-subtle bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary">
              Comparativo Mensal e Anual
            </h2>
            <span className="text-xs text-text-muted">
              {serieAnual.length}{" "}
              {serieAnual.length === 1 ? "ano com dados" : "anos com dados"}
            </span>
          </div>

          <div className="h-44 w-full">
            {serieMensal.length === 0 ? (
              <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-subtle text-sm text-text-muted">
                Sem dados mensais suficientes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={serieMensal}
                  margin={{ top: 5, right: 10, left: -14, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--chart-grid)"
                  />
                  <XAxis
                    dataKey="rotulo"
                    stroke="var(--chart-axis)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--chart-axis)"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#06b6d4"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {serieAnual.length < 2 ? (
            <div className="rounded-xl border border-subtle bg-surface-elevated px-3.5 py-2.5 text-xs text-text-muted flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Comparativo entre anos requer registros em pelo menos dois anos
                distintos. Atualmente há dados apenas em{" "}
                {serieAnual[0]?.rotulo ?? "nenhum ano"}.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {serieAnual.map((ano) => (
                <div
                  key={ano.chave}
                  className="rounded-xl border border-subtle bg-surface-elevated p-3"
                >
                  <p className="text-xs text-text-muted">{ano.rotulo}</p>
                  <p className="mt-0.5 text-lg font-bold text-primary tabular-nums">
                    {ano.total.toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Top 3 Meses + Top 3 Trimestres */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 3 Meses */}
        <section className="rounded-2xl border border-subtle bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-semibold text-primary">
              Top 3 Meses com Maior Movimentação
            </h2>
          </div>

          {topMeses.length === 0 ? (
            <p className="text-sm text-text-muted">
              Ainda não há movimentações registradas para ranquear meses.
            </p>
          ) : (
            <div className="space-y-3">
              {topMeses.map((mes, idx) => (
                <div
                  key={mes.chave}
                  className="flex items-center justify-between rounded-xl border border-subtle bg-surface-elevated px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                        idx === 0
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40"
                          : idx === 1
                            ? "bg-muted text-secondary border border-subtle"
                            : "bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30"
                      }`}
                    >
                      {idx + 1}º
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {mes.rotulo}
                      </p>
                      <p className="text-xs text-text-muted">
                        {mes.entradas.toLocaleString("pt-BR")} entradas •{" "}
                        {mes.saidas.toLocaleString("pt-BR")} saídas
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-cyan-600 dark:text-cyan-300 tabular-nums">
                    {mes.total.toLocaleString("pt-BR")} mov.
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top 3 Trimestres */}
        <section className="rounded-2xl border border-subtle bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-semibold text-primary">
              Top 3 Trimestres com Maior Movimentação
            </h2>
          </div>

          {topTrimestres.length === 0 ? (
            <p className="text-sm text-text-muted">
              Ainda não há movimentações registradas para ranquear trimestres.
            </p>
          ) : (
            <div className="space-y-3">
              {topTrimestres.map((tri, idx) => (
                <div
                  key={tri.chave}
                  className="flex items-center justify-between rounded-xl border border-subtle bg-surface-elevated px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                        idx === 0
                          ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40"
                          : idx === 1
                            ? "bg-muted text-secondary border border-subtle"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {idx + 1}º
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {tri.rotulo}{" "}
                        <span className="text-xs font-normal text-text-muted">
                          ({tri.periodo})
                        </span>
                      </p>
                      <p className="text-xs text-text-muted">
                        {tri.entradas.toLocaleString("pt-BR")} entradas •{" "}
                        {tri.saidas.toLocaleString("pt-BR")} saídas
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-cyan-600 dark:text-cyan-300 tabular-nums">
                    {tri.total.toLocaleString("pt-BR")} mov.
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
