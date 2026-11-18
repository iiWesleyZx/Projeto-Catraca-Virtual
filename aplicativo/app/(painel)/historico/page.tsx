"use client";

import {
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  History,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMovimentacoes } from "@/components/providers/MovimentacoesProvider";
import {
  agruparPorData,
  obterChaveDataLocal,
} from "@/lib/movimentacoes-utils";

type FiltroTipo = "todos" | "entrada" | "saida";
type Ordem = "desc" | "asc";

const LOTE_INICIAL = 10;

export default function HistoricoPage() {
  const { movimentacoes, carregando, atualizando, erro, recarregar } =
    useMovimentacoes();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [busca, setBusca] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("desc");
  const [referenciaHoje, setReferenciaHoje] = useState<Date | undefined>(
    undefined
  );
  const [diasAbertos, setDiasAbertos] = useState<Record<string, boolean>>({});
  const [limitesPorDia, setLimitesPorDia] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    queueMicrotask(() => setReferenciaHoje(new Date()));
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const lista = movimentacoes.filter((m) => {
      if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return false;

      if (dataFiltro && obterChaveDataLocal(m.criado_em) !== dataFiltro) {
        return false;
      }

      if (termo) {
        const d = new Date(m.criado_em);
        const dataCurta = !Number.isNaN(d.getTime())
          ? d.toLocaleDateString("pt-BR").toLowerCase()
          : "";
        const dataExtenso = !Number.isNaN(d.getTime())
          ? d
              .toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
              .toLowerCase()
          : "";
        const horario = !Number.isNaN(d.getTime())
          ? d.toLocaleTimeString("pt-BR").toLowerCase()
          : "";
        const emIdentificacao = m.identificacao
          ? m.identificacao.toLowerCase().includes(termo)
          : false;

        const bateu =
          dataCurta.includes(termo) ||
          dataExtenso.includes(termo) ||
          horario.includes(termo) ||
          emIdentificacao;

        if (!bateu) return false;
      }

      return true;
    });

    return [...lista].sort((a, b) => {
      const ta = new Date(a.criado_em).getTime();
      const tb = new Date(b.criado_em).getTime();
      return ordem === "desc" ? tb - ta : ta - tb;
    });
  }, [movimentacoes, filtroTipo, busca, dataFiltro, ordem]);

  const grupos = useMemo(
    () => agruparPorData(filtradas, referenciaHoje),
    [filtradas, referenciaHoje]
  );

  function alternarDia(chave: string) {
    setDiasAbertos((prev) => ({
      ...prev,
      [chave]: !prev[chave],
    }));
  }

  function mostrarMais(chave: string) {
    setLimitesPorDia((prev) => ({
      ...prev,
      [chave]: (prev[chave] ?? LOTE_INICIAL) + 10,
    }));
  }

  function mostrarTudo(chave: string, total: number) {
    setLimitesPorDia((prev) => ({
      ...prev,
      [chave]: total,
    }));
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Histórico de Movimentações
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Clique em um dia para expandir e consultar entradas e saídas
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

      {/* Filtros e Busca */}
      <div className="rounded-2xl border border-subtle bg-surface p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { valor: "todos", rotulo: "Todos" },
                { valor: "entrada", rotulo: "Entradas" },
                { valor: "saida", rotulo: "Saídas" },
              ] as const
            ).map((item) => (
              <button
                key={item.valor}
                type="button"
                onClick={() => setFiltroTipo(item.valor)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  filtroTipo === item.valor
                    ? "bg-badge-cyan-bg text-badge-cyan-text border border-badge-cyan-border shadow-sm"
                    : "bg-surface-elevated text-text-muted border border-subtle hover:text-primary hover:bg-muted/70"
                }`}
              >
                {item.rotulo}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setOrdem((o) => (o === "desc" ? "asc" : "desc"))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-surface-elevated border border-subtle hover:bg-muted/70 px-3.5 py-2 text-xs font-medium text-secondary cursor-pointer"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{ordem === "desc" ? "Mais recentes" : "Mais antigos"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              aria-label="Filtrar por data específica"
              className="rounded-xl border border-subtle bg-surface-elevated px-3 py-1.5 text-xs text-primary focus:border-cyan-500 focus:outline-none"
            />
            {dataFiltro && (
              <button
                type="button"
                onClick={() => setDataFiltro("")}
                aria-label="Limpar filtro de data"
                className="rounded-lg border border-subtle bg-surface-elevated p-1.5 text-text-muted hover:text-primary cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar por dia, horário, mês ou ano (ex: 18/11, 14:30, novembro, 2026)..."
            aria-label="Buscar por data, horário, mês ou ano"
            className="w-full rounded-xl border border-subtle bg-surface-elevated pl-10 pr-3 py-2.5 text-xs text-primary placeholder:text-text-muted focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Estados */}
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

      {carregando ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl border border-subtle bg-surface animate-pulse"
            />
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <div className="rounded-2xl border border-subtle bg-surface p-10 text-center shadow-sm">
          <History className="mx-auto h-10 w-10 text-text-muted" />
          <h2 className="mt-3 text-base font-semibold text-primary">
            Nenhuma movimentação encontrada
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {movimentacoes.length === 0
              ? "Ainda não há registros de passagem salvos no sistema."
              : "Tente ajustar os filtros, a data ou o termo pesquisado."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((grupo) => {
            const aberto = Boolean(diasAbertos[grupo.chave]);
            const limite = limitesPorDia[grupo.chave] ?? LOTE_INICIAL;
            const itensVisiveis = grupo.itens.slice(0, limite);
            const temMais = grupo.itens.length > itensVisiveis.length;

            return (
              <section
                key={grupo.chave}
                className="overflow-hidden rounded-2xl border border-subtle bg-surface shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => alternarDia(grupo.chave)}
                  aria-expanded={aberto}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {aberto ? (
                      <ChevronDown className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                    )}
                    <Calendar className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary capitalize">
                      {grupo.rotulo}
                    </span>
                  </div>

                  <span className="rounded-full bg-surface-elevated border border-subtle px-2.5 py-0.5 text-xs font-medium text-text-muted">
                    {grupo.itens.length}{" "}
                    {grupo.itens.length === 1 ? "registro" : "registros"}
                  </span>
                </button>

                {aberto && (
                  <div className="border-t border-subtle divide-y divide-subtle">
                    {itensVisiveis.map((m) => {
                      const ehEntrada = m.tipo === "entrada";
                      const hora = new Date(m.criado_em).toLocaleTimeString(
                        "pt-BR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      );

                      const textoMovimento = ehEntrada
                        ? `${m.quantidade} ${m.quantidade === 1 ? "pessoa entrou" : "pessoas entraram"}`
                        : `${m.quantidade} ${m.quantidade === 1 ? "pessoa saiu" : "pessoas saíram"}`;

                      return (
                        <div
                          key={m.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                                ehEntrada
                                  ? "border-badge-emerald-border bg-badge-emerald-bg text-badge-emerald-text"
                                  : "border-badge-amber-border bg-badge-amber-bg text-badge-amber-text"
                              }`}
                            >
                              {ehEntrada ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-primary">
                                {textoMovimento}
                              </span>
                              {m.identificacao && (
                                <span className="rounded-md bg-badge-cyan-bg border border-badge-cyan-border px-2 py-0.5 text-[11px] font-medium text-badge-cyan-text">
                                  {m.identificacao}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-mono font-medium text-secondary tabular-nums">
                              {hora}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {temMais && (
                      <div className="flex flex-wrap items-center justify-center gap-2.5 bg-surface-elevated px-4 py-3">
                        <button
                          type="button"
                          onClick={() => mostrarMais(grupo.chave)}
                          className="rounded-xl border border-badge-cyan-border bg-badge-cyan-bg px-3.5 py-1.5 text-xs font-semibold text-badge-cyan-text hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Mostrar mais (+10)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            mostrarTudo(grupo.chave, grupo.itens.length)
                          }
                          className="rounded-xl border border-subtle bg-surface px-3.5 py-1.5 text-xs font-semibold text-secondary hover:bg-muted/70 transition-colors cursor-pointer"
                        >
                          Mostrar tudo ({grupo.itens.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
