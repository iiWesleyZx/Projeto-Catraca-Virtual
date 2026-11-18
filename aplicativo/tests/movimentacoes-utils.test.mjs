import assert from "node:assert/strict";
import test from "node:test";
import {
  agregarPorEscala,
  agruparPorData,
  calcularTopMeses,
  calcularTopTrimestres,
  calcularTotais,
} from "../lib/movimentacoes-utils.ts";

const AMOSTRA = [
  {
    id: 1,
    dispositivo_id: "esp32-01",
    tipo: "entrada",
    quantidade: 1,
    criado_em: "2026-01-15T10:00:00.000Z",
  },
  {
    id: 2,
    dispositivo_id: "esp32-01",
    tipo: "entrada",
    quantidade: 1,
    criado_em: "2026-01-15T11:00:00.000Z",
  },
  {
    id: 3,
    dispositivo_id: "esp32-01",
    tipo: "saida",
    quantidade: 1,
    criado_em: "2026-01-15T12:00:00.000Z",
  },
  {
    id: 4,
    dispositivo_id: "esp32-01",
    tipo: "entrada",
    quantidade: 1,
    criado_em: "2026-04-20T14:00:00.000Z",
  },
  {
    id: 5,
    dispositivo_id: "esp32-01",
    tipo: "entrada",
    quantidade: 1,
    criado_em: "2026-04-21T14:00:00.000Z",
  },
  {
    id: 6,
    dispositivo_id: "esp32-01",
    tipo: "entrada",
    quantidade: 1,
    criado_em: "2026-04-22T14:00:00.000Z",
  },
  {
    id: 7,
    dispositivo_id: "esp32-01",
    tipo: "saida",
    quantidade: 1,
    criado_em: "2026-04-22T15:00:00.000Z",
  },
];

test("calcularTotais calcula entradas, saidas, presentes e total corretamente", () => {
  const res = calcularTotais(AMOSTRA);
  assert.equal(res.entradas, 5);
  assert.equal(res.saidas, 2);
  assert.equal(res.presentes, 3);
  assert.equal(res.total, 7);
});

test("agregarPorEscala agrega por mensal e anual sem duplicar eventos", () => {
  const mensal = agregarPorEscala(AMOSTRA, "mensal");
  assert.equal(mensal.length, 2);
  assert.equal(mensal[0].chave, "2026-01");
  assert.equal(mensal[0].total, 3);
  assert.equal(mensal[1].chave, "2026-04");
  assert.equal(mensal[1].total, 4);

  const anual = agregarPorEscala(AMOSTRA, "anual");
  assert.equal(anual.length, 1);
  assert.equal(anual[0].chave, "2026");
  assert.equal(anual[0].total, 7);
});

test("calcularTopMeses ordena do maior para o menor", () => {
  const top = calcularTopMeses(AMOSTRA, 3);
  assert.equal(top.length, 2);
  assert.equal(top[0].rotulo, "Abril de 2026");
  assert.equal(top[0].total, 4);
  assert.equal(top[1].rotulo, "Janeiro de 2026");
  assert.equal(top[1].total, 3);
});

test("calcularTopTrimestres agrupa e ordena trimestres corretamente", () => {
  const topTri = calcularTopTrimestres(AMOSTRA, 3);
  assert.equal(topTri.length, 2);
  assert.equal(topTri[0].chave, "2026-T2");
  assert.equal(topTri[0].rotulo, "2º Trimestre de 2026");
  assert.equal(topTri[0].periodo, "Abr – Jun");
  assert.equal(topTri[0].total, 4);
  assert.equal(topTri[1].chave, "2026-T1");
  assert.equal(topTri[1].total, 3);
});

test("agruparPorData agrupa registros por dia local", () => {
  const grupos = agruparPorData(
    AMOSTRA.slice(0, 3),
    new Date("2026-01-15T15:00:00.000Z")
  );
  assert.equal(grupos.length, 1);
  assert.equal(grupos[0].rotulo, "Hoje");
  assert.equal(grupos[0].itens.length, 3);
});
