export type TipoMovimentacao = "entrada" | "saida";

export interface Movimentacao {
  id: number;
  dispositivo_id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  criado_em: string;
  /** Campo opcional caso o backend passe a fornecer identificação individual no futuro */
  identificacao?: string | null;
}

export type StatusRealtime =
  | "CONECTANDO"
  | "CONECTADO"
  | "DESCONECTADO"
  | "INDISPONIVEL";

export type EscalaMetrica = "diario" | "mensal" | "anual";

export interface PontoPeriodo {
  chave: string;
  rotulo: string;
  entradas: number;
  saidas: number;
  total: number;
}

export interface TopMesItem {
  chave: string;
  rotulo: string;
  entradas: number;
  saidas: number;
  total: number;
}

export interface TopTrimestreItem {
  chave: string;
  rotulo: string;
  periodo: string;
  entradas: number;
  saidas: number;
  total: number;
}
