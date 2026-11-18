import type {
  EscalaMetrica,
  Movimentacao,
  PontoPeriodo,
  TopMesItem,
  TopTrimestreItem,
} from "./types";

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MESES_CURTOS_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function calcularTotais(movimentacoes: Movimentacao[]) {
  let entradas = 0;
  let saidas = 0;

  for (const m of movimentacoes) {
    const qtd = Number.isFinite(m.quantidade) ? m.quantidade : 0;
    if (m.tipo === "entrada") {
      entradas += qtd;
    } else if (m.tipo === "saida") {
      saidas += qtd;
    }
  }

  return {
    entradas,
    saidas,
    presentes: entradas - saidas,
    total: entradas + saidas,
  };
}

export function obterChaveDataLocal(dataIso: string): string {
  const d = new Date(dataIso);
  if (Number.isNaN(d.getTime())) return "data-invalida";
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function formatarRotuloData(
  chaveData: string,
  referenciaHoje?: Date
): string {
  if (chaveData === "data-invalida") return "Data desconhecida";

  if (referenciaHoje) {
    const chaveHoje = obterChaveDataLocal(referenciaHoje.toISOString());

    const ontem = new Date(referenciaHoje);
    ontem.setDate(ontem.getDate() - 1);
    const chaveOntem = obterChaveDataLocal(ontem.toISOString());

    if (chaveData === chaveHoje) return "Hoje";
    if (chaveData === chaveOntem) return "Ontem";
  }

  const [ano, mes, dia] = chaveData.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function filtrarMovimentacoesHoje(
  movimentacoes: Movimentacao[],
  referenciaHoje?: Date
): Movimentacao[] {
  if (!referenciaHoje) return [];
  const chaveHoje = obterChaveDataLocal(referenciaHoje.toISOString());
  return movimentacoes.filter(
    (m) => obterChaveDataLocal(m.criado_em) === chaveHoje
  );
}

export function agruparPorData(
  movimentacoes: Movimentacao[],
  referenciaHoje?: Date
): Array<{ chave: string; rotulo: string; itens: Movimentacao[] }> {
  const mapa = new Map<string, Movimentacao[]>();

  for (const m of movimentacoes) {
    const chave = obterChaveDataLocal(m.criado_em);
    const lista = mapa.get(chave);
    if (lista) {
      lista.push(m);
    } else {
      mapa.set(chave, [m]);
    }
  }

  return Array.from(mapa.entries()).map(([chave, itens]) => ({
    chave,
    rotulo: formatarRotuloData(chave, referenciaHoje),
    itens,
  }));
}

export function agregarPorEscala(
  movimentacoes: Movimentacao[],
  escala: EscalaMetrica
): PontoPeriodo[] {
  const mapa = new Map<string, PontoPeriodo>();

  for (const m of movimentacoes) {
    const d = new Date(m.criado_em);
    if (Number.isNaN(d.getTime())) continue;

    const ano = d.getFullYear();
    const mes = d.getMonth(); // 0-11
    const dia = d.getDate();

    let chave = "";
    let rotulo = "";

    if (escala === "diario") {
      chave = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      rotulo = `${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}`;
    } else if (escala === "mensal") {
      chave = `${ano}-${String(mes + 1).padStart(2, "0")}`;
      rotulo = `${MESES_CURTOS_PT[mes]}/${String(ano).slice(-2)}`;
    } else {
      chave = String(ano);
      rotulo = String(ano);
    }

    const atual = mapa.get(chave) ?? {
      chave,
      rotulo,
      entradas: 0,
      saidas: 0,
      total: 0,
    };

    const qtd = Number.isFinite(m.quantidade) ? m.quantidade : 0;
    if (m.tipo === "entrada") {
      atual.entradas += qtd;
    } else if (m.tipo === "saida") {
      atual.saidas += qtd;
    }
    atual.total = atual.entradas + atual.saidas;
    mapa.set(chave, atual);
  }

  const pontos = Array.from(mapa.values()).sort((a, b) =>
    a.chave.localeCompare(b.chave)
  );

  if (escala === "diario" && pontos.length > 30) {
    return pontos.slice(-30);
  }

  return pontos;
}

export function calcularTopMeses(
  movimentacoes: Movimentacao[],
  limite = 3
): TopMesItem[] {
  const mapa = new Map<string, TopMesItem>();

  for (const m of movimentacoes) {
    const d = new Date(m.criado_em);
    if (Number.isNaN(d.getTime())) continue;

    const ano = d.getFullYear();
    const mes = d.getMonth();
    const chave = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    const rotulo = `${MESES_PT[mes]} de ${ano}`;

    const atual = mapa.get(chave) ?? {
      chave,
      rotulo,
      entradas: 0,
      saidas: 0,
      total: 0,
    };

    const qtd = Number.isFinite(m.quantidade) ? m.quantidade : 0;
    if (m.tipo === "entrada") {
      atual.entradas += qtd;
    } else if (m.tipo === "saida") {
      atual.saidas += qtd;
    }
    atual.total = atual.entradas + atual.saidas;
    mapa.set(chave, atual);
  }

  return Array.from(mapa.values())
    .sort((a, b) => b.total - a.total || b.chave.localeCompare(a.chave))
    .slice(0, limite);
}

const PERIODOS_TRIMESTRE: Record<number, string> = {
  1: "Jan – Mar",
  2: "Abr – Jun",
  3: "Jul – Set",
  4: "Out – Dez",
};

export function calcularTopTrimestres(
  movimentacoes: Movimentacao[],
  limite = 3
): TopTrimestreItem[] {
  const mapa = new Map<string, TopTrimestreItem>();

  for (const m of movimentacoes) {
    const d = new Date(m.criado_em);
    if (Number.isNaN(d.getTime())) continue;

    const ano = d.getFullYear();
    const trimestre = Math.floor(d.getMonth() / 3) + 1;
    const chave = `${ano}-T${trimestre}`;

    const atual = mapa.get(chave) ?? {
      chave,
      rotulo: `${trimestre}º Trimestre de ${ano}`,
      periodo: PERIODOS_TRIMESTRE[trimestre],
      entradas: 0,
      saidas: 0,
      total: 0,
    };

    const qtd = Number.isFinite(m.quantidade) ? m.quantidade : 0;
    if (m.tipo === "entrada") {
      atual.entradas += qtd;
    } else if (m.tipo === "saida") {
      atual.saidas += qtd;
    }
    atual.total = atual.entradas + atual.saidas;
    mapa.set(chave, atual);
  }

  return Array.from(mapa.values())
    .sort((a, b) => b.total - a.total || b.chave.localeCompare(a.chave))
    .slice(0, limite);
}

export function formatarTempoRelativo(
  dataIso: string,
  agoraMs?: number
): string {
  const d = new Date(dataIso);
  if (Number.isNaN(d.getTime()) || agoraMs === undefined) return "recentemente";

  const diffSeg = Math.max(0, Math.floor((agoraMs - d.getTime()) / 1000));
  if (diffSeg < 60) return `há ${diffSeg}s`;
  const diffMin = Math.floor(diffSeg / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;
  const diffDias = Math.floor(diffHoras / 24);
  return `há ${diffDias}d`;
}
