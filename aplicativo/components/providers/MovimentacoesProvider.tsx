"use client";

import { createClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { Movimentacao, StatusRealtime } from "@/lib/types";

interface MovimentacoesContextValue {
  movimentacoes: Movimentacao[];
  carregando: boolean;
  atualizando: boolean;
  erro: string;
  ultimaAtualizacao: string;
  realtimeStatus: StatusRealtime;
  recarregar: () => Promise<void>;
}

const MovimentacoesContext = createContext<MovimentacoesContextValue>({
  movimentacoes: [],
  carregando: true,
  atualizando: false,
  erro: "",
  ultimaAtualizacao: "",
  realtimeStatus: "CONECTANDO",
  recarregar: async () => {},
});

export function MovimentacoesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<StatusRealtime>(() => {
    const temEnv =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    return temEnv ? "CONECTANDO" : "INDISPONIVEL";
  });

  const ativoRef = useRef(true);

  const carregar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) {
        setAtualizando(true);
      }

      try {
        const resposta = await fetch("/api/movimentacoes?limite=5000", {
          cache: "no-store",
        });

        if (resposta.status === 401) {
          router.replace("/login");
          return;
        }

        if (!resposta.ok) {
          throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const dados: unknown = await resposta.json();
        if (!Array.isArray(dados)) {
          throw new Error("Resposta inválida da API");
        }

        if (ativoRef.current) {
          setMovimentacoes(dados as Movimentacao[]);
          setErro("");
          setUltimaAtualizacao(new Date().toLocaleTimeString("pt-BR"));
        }
      } catch (error) {
        console.error("Erro ao carregar movimentações:", error);
        if (ativoRef.current) {
          setErro("Não foi possível carregar os dados do servidor.");
        }
      } finally {
        if (ativoRef.current) {
          setCarregando(false);
          setAtualizando(false);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    ativoRef.current = true;
    void Promise.resolve().then(() => carregar(true));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return () => {
        ativoRef.current = false;
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
          carregar(true);
        }
      )
      .subscribe((status) => {
        if (!ativoRef.current) return;
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("CONECTADO");
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeStatus("DESCONECTADO");
        } else {
          setRealtimeStatus("CONECTANDO");
        }
      });

    return () => {
      ativoRef.current = false;
      supabase.removeChannel(canal);
    };
  }, [carregar]);

  const recarregar = useCallback(async () => {
    await carregar(false);
  }, [carregar]);

  return (
    <MovimentacoesContext.Provider
      value={{
        movimentacoes,
        carregando,
        atualizando,
        erro,
        ultimaAtualizacao,
        realtimeStatus,
        recarregar,
      }}
    >
      {children}
    </MovimentacoesContext.Provider>
  );
}

export function useMovimentacoes() {
  return useContext(MovimentacoesContext);
}
