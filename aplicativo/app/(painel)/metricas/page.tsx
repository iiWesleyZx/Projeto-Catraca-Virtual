"use client";

import {
  AlertCircle,
  Award,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Clock,
  RefreshCw,
  X,
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
  calcularHorariosPico,
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
  const [verTop10Meses, setVerTop10Meses] = useState(false);

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

  const top10Meses = useMemo(
    () => calcularTopMeses(movimentacoes, 10),
    [movimentacoes]
  );

  const top3Meses = useMemo(() => top10Meses.slice(0, 3), [top10Meses]);

  const topTrimestres = useMemo(
    () => calcularTopTrimestres(movimentacoes, 3),
    [movimentacoes]
  );

  const horariosPico = useMemo(
    () => calcularHorariosPico(movimentacoes),
    [movimentacoes]
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
            Análise diária, mensal, anual e horários de maior fluxo com base nos
            registros reais
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
              Evolução do Fluxo
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
              Fluxo de Pessoas
            </p>
            <p className="mt-1 text-2xl font-bold text-primary tabular-nums">
              {carregando ? "—" : totais.fluxo.toLocaleString("pt-BR")}
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

      {/* Grid: Horários de Pico (Rosca + Top 3) + Comparativo Mensal/Anual */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Horários com Maior Movimento (Rosca à esquerda + Top 3 à direita) */}
        <section className="rounded-2xl border border-subtle bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-semibold text-primary">
              Horários com Maior Movimento (Média)
            </h2>
          </div>

          {horariosPico.grafico.length === 0 ? (
            <div className="h-56 flex items-center justify-center rounded-xl border border-dashed border-subtle text-sm text-text-muted">
              Nenhuma movimentação registrada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={horariosPico.grafico}
                      dataKey="media"
                      nameKey="rotulo"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {horariosPico.grafico.map((entry) => (
                        <Cell key={entry.rotulo} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value) => [
                        `${value} pessoas/dia`,
                        "Média",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Top 3 Horários
                </p>
                {horariosPico.top3.map((item, idx) => (
                  <div
                    key={item.hora}
                    className="flex items-center justify-between rounded-xl border border-subtle bg-surface-elevated px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.cor }}
                      />
                      <div>
                        <p className="text-xs font-bold text-primary">
                          {idx + 1}º • {item.faixa}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {item.fluxo.toLocaleString("pt-BR")} no total
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-badge-cyan-text tabular-nums">
                      {item.media}/dia
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Comparativo entre Meses e Anos */}
        <section className="rounded-2xl border border-subtle bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary">
              Comparativo Mensal e Anual (Fluxo)
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
                    name="Fluxo de pessoas"
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
        {/* Top 3 Meses com Ver mais (Top 10) */}
        <section className="relative rounded-2xl border border-subtle bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-semibold text-primary">
                Top 3 Meses com Maior Fluxo
              </h2>
            </div>

            {top10Meses.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setVerTop10Meses(true)}
                onMouseLeave={() => setVerTop10Meses(false)}
              >
                <button
                  type="button"
                  onClick={() => setVerTop10Meses((v) => !v)}
                  className="rounded-lg border border-badge-cyan-border bg-badge-cyan-bg px-2.5 py-1 text-xs font-semibold text-badge-cyan-text hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Ver mais (Top 10)
                </button>

                {verTop10Meses && (
                  <div className="absolute right-0 bottom-full mb-2 z-30 w-80 max-w-[85vw] rounded-2xl border border-subtle bg-surface p-4 shadow-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Top 10 Meses Rankeados
                      </p>
                      <button
                        type="button"
                        onClick={() => setVerTop10Meses(false)}
                        aria-label="Fechar Top 10 meses"
                        className="text-text-muted hover:text-primary p-0.5 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {top10Meses.map((mes, idx) => (
                        <div
                          key={mes.chave}
                          className="flex items-center justify-between rounded-lg border border-subtle bg-surface-elevated px-3 py-2 text-xs"
                        >
                          <span className="font-medium text-primary">
                            <span className="font-bold text-text-muted mr-1.5">
                              {idx + 1}º
                            </span>
                            {mes.rotulo}
                          </span>
                          <span className="font-bold text-badge-cyan-text tabular-nums">
                            {mes.total.toLocaleString("pt-BR")} pessoas
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {top3Meses.length === 0 ? (
            <p className="text-sm text-text-muted">
              Ainda não há movimentações registradas para ranquear meses.
            </p>
          ) : (
            <div className="space-y-3">
              {top3Meses.map((mes, idx) => (
                <div
                  key={mes.chave}
                  className="flex items-center justify-between rounded-xl border border-subtle bg-surface-elevated px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                        idx === 0
                          ? "bg-badge-amber-bg text-badge-amber-text border border-badge-amber-border"
                          : idx === 1
                            ? "bg-muted text-secondary border border-subtle"
                            : "bg-badge-emerald-bg text-badge-emerald-text border border-badge-emerald-border"
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
                  <p className="text-sm font-bold text-badge-cyan-text tabular-nums">
                    {mes.total.toLocaleString("pt-BR")} pessoas
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
              Top 3 Trimestres com Maior Fluxo
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
                          ? "bg-badge-cyan-bg text-badge-cyan-text border border-badge-cyan-border"
                          : idx === 1
                            ? "bg-muted text-secondary border border-subtle"
                            : "bg-badge-emerald-bg text-badge-emerald-text border border-badge-emerald-border"
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
                  <p className="text-sm font-bold text-badge-cyan-text tabular-nums">
                    {tri.total.toLocaleString("pt-BR")} pessoas
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
