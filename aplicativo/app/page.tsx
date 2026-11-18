
"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

type Movimentacao = {
  id: number;
  dispositivo_id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  criado_em: string;
};

export default function Home() {
  const [movimentacoes, setMovimentacoes] =
    useState<Movimentacao[]>([]);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] =
    useState<string>("");

  useEffect(() => {

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const canal = supabase
  .channel("movimentacoes-tempo-real")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "movimentacoes",
    },
    () => {
      // Nova entrada ou saida registrada:
      // busca novamente os dados atualizados.
      carregar();
    }
  )
  .subscribe((status) => {
    console.log("Realtime:", status);
  });

    let ativo = true;

    async function carregar() {
      try {
        const resposta = await fetch("/api/movimentacoes", {
          cache: "no-store",
        });

        if (!resposta.ok) {
          throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const dados: unknown = await resposta.json();

        if (!Array.isArray(dados)) {
          throw new Error("Resposta invalida da API");
        }

        if (ativo) {
          setMovimentacoes(dados as Movimentacao[]);
          setErro("");
          setUltimaAtualizacao(
            new Date().toLocaleTimeString("pt-BR")
          );
        }
      } catch (error) {
        console.error("Erro ao carregar:", error);

        if (ativo) {
          setErro("Não foi possível carregar os dados.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();

    // Atualizacao automatica temporariamente desativada
// const intervalo = setInterval(carregar, 5000);

    return () => {
      ativo = false;
      //clearInterval(intervalo);
    };
  }, []);

  const entradas = movimentacoes
    .filter((m) => m.tipo === "entrada")
    .reduce((total, m) => total + m.quantidade, 0);

  const saidas = movimentacoes
    .filter((m) => m.tipo === "saida")
    .reduce((total, m) => total + m.quantidade, 0);

  const presentes = entradas - saidas;

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">
          Catraca Virtual ESP32
        </h1>

        <p className="mt-2 text-slate-400">
          Monitoramento de movimentações
        </p>

        <p className="mt-3 text-sm text-slate-400">
          {carregando
            ? "Carregando dados..."
            : ultimaAtualizacao
              ? `Última atualização: ${ultimaAtualizacao}`
              : "Aguardando atualização"}
        </p>

        <div className="my-8 grid gap-4 md:grid-cols-3">
          {[
            { titulo: "Entradas", valor: entradas },
            { titulo: "Saídas", valor: saidas },
            { titulo: "Presentes", valor: presentes },
          ].map((item) => (
            <div
              key={item.titulo}
              className="rounded-xl bg-slate-800 p-6"
            >
              <p className="text-slate-400">
                {item.titulo}
              </p>
              <p className="mt-2 text-4xl font-bold">
                {item.valor}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mb-4 text-xl font-semibold">
          Histórico de movimentações
        </h2>

        {erro && (
          <p className="mb-4 text-red-400">
            {erro}
          </p>
        )}

        <div className="overflow-hidden rounded-xl bg-slate-800">
          {movimentacoes.length === 0 ? (
            <p className="p-6 text-slate-400">
              Nenhuma movimentação encontrada.
            </p>
          ) : (
            movimentacoes.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap justify-between gap-2 border-b border-slate-700 p-4"
              >
                <span>
                  {m.tipo === "entrada" ? "Entrada" : "Saída"}
                  {" — "}
                  {m.quantidade} pessoa(s)
                </span>

                <span className="text-slate-400">
                  {new Date(m.criado_em).toLocaleString(
                    "pt-BR"
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
