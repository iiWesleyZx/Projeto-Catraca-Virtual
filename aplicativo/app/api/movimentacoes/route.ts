
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { ehModoPreviewLocal, obterUsuarioAutenticado } from "@/lib/auth";

// ========================================
// CONEXAO COM SUPABASE
// ========================================

function conectarSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;

  console.log("=== DIAGNOSTICO SUPABASE ===");
  console.log("URL existe:", Boolean(url));
  console.log("Chave existe:", Boolean(chave));
  console.log(
    "Chave tem formato secret:",
    chave?.startsWith("sb_secret_") ?? false
  );
  console.log("============================");

  if (!url || !chave) {
    throw new Error(
      "Variaveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY ausentes"
    );
  }

  return createClient(url, chave, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ========================================
// VERIFICACAO DO TOKEN DO ESP32
// ========================================

function autorizado(
  recebido: string | null,
  esperado?: string
): boolean {
  if (!recebido || !esperado) return false;

  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);

  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

// ========================================
// GET - CONSULTAR MOVIMENTACOES
// ========================================

export async function GET(request: NextRequest) {
  console.log("GET /api/movimentacoes iniciado");

  const usuario = await obterUsuarioAutenticado();
  const previewLocal = ehModoPreviewLocal();

  if (!usuario && !previewLocal) {
    return NextResponse.json(
      { erro: "Sessão não autenticada" },
      { status: 401 }
    );
  }

  if (
    previewLocal &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
  ) {
    return NextResponse.json([], {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  const limiteParam = Number(request.nextUrl.searchParams.get("limite"));
  const limite =
    Number.isFinite(limiteParam) && limiteParam > 0
      ? Math.min(Math.floor(limiteParam), 5000)
      : 1000;

  try {
    const supabase = conectarSupabase();

    const { data, error } = await supabase
      .from("movimentacoes")
      .select(
        "id, dispositivo_id, tipo, quantidade, criado_em"
      )
      .order("criado_em", { ascending: false })
      .limit(limite);

    if (error) {
      console.error("=== ERRO SUPABASE GET ===");
      console.error("Codigo:", error.code);
      console.error("Mensagem:", error.message);
      console.error("Detalhes:", error.details);
      console.error("Dica:", error.hint);
      console.error("=========================");

      return NextResponse.json(
        {
          erro: "Falha ao consultar Supabase",
          codigo: error.code ?? "DESCONHECIDO",
        },
        { status: 500 }
      );
    }

    console.log(
      "Consulta realizada. Registros encontrados:",
      data?.length ?? 0
    );

    return NextResponse.json(data ?? [], {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("=== ERRO GERAL GET ===");
    console.error(error);
    console.error("======================");

    return NextResponse.json(
      { erro: "Erro interno ao consultar movimentacoes" },
      { status: 500 }
    );
  }
}

// ========================================
// POST - RECEBER DADOS DO ESP32
// ========================================

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-device-token");

  if (!autorizado(token, process.env.ESP32_API_TOKEN)) {
    return NextResponse.json(
      { erro: "ESP32 nao autorizado" },
      { status: 401 }
    );
  }

  let corpo: unknown;

  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "JSON invalido" },
      { status: 400 }
    );
  }

  if (
    !corpo ||
    typeof corpo !== "object" ||
    Array.isArray(corpo)
  ) {
    return NextResponse.json(
      { erro: "Formato de dados invalido" },
      { status: 400 }
    );
  }

  const dados = corpo as Record<string, unknown>;
  const { dispositivo_id, tipo, quantidade } = dados;

  if (
    dispositivo_id !== "esp32-01" ||
    (tipo !== "entrada" && tipo !== "saida") ||
    quantidade !== 1
  ) {
    return NextResponse.json(
      { erro: "Movimentacao invalida" },
      { status: 400 }
    );
  }

  try {
    const supabase = conectarSupabase();

    const { data, error } = await supabase
      .from("movimentacoes")
      .insert({
        dispositivo_id,
        tipo,
        quantidade,
      })
      .select(
        "id, dispositivo_id, tipo, quantidade, criado_em"
      )
      .single();

    if (error) {
      console.error("=== ERRO SUPABASE POST ===");
      console.error("Codigo:", error.code);
      console.error("Mensagem:", error.message);
      console.error("Detalhes:", error.details);
      console.error("Dica:", error.hint);
      console.error("==========================");

      return NextResponse.json(
        { erro: "Falha ao salvar movimentacao" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        movimentacao: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("=== ERRO GERAL POST ===");
    console.error(error);
    console.error("======================");

    return NextResponse.json(
      { erro: "Erro interno ao salvar movimentacao" },
      { status: 500 }
    );
  }
}
