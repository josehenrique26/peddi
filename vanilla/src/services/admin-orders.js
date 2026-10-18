// src/services/admin-orders.js — o que a EMPRESA pode fazer com um pedido: avançar a etapa ou rejeitar.
// Os pedidos ficam em dados.orders (o mesmo lugar que o cliente usa), então o cliente vê a mudança na hora.
import { obterDados, salvarDados } from "./storage.js";
import { ESTADOS } from "../data/order-states.js";
import { PROXIMA_ETAPA, ESTADOS_REJEITAVEIS } from "../data/order-rules.js";

const falha = (erro) => ({ ok: false, erro });

// Só devolve o pedido se ele for desta empresa (uma empresa nunca mexe no pedido de outra).
export const obterPedidoDaEmpresa = (empresaId, id) =>
  obterDados().orders.find((p) => p.id === id && p.companyId === empresaId) ?? null;

// Troca o estado e anota no histórico quem fez, quando e por quê.
function registrar(pedido, estado, nota = "") {
  pedido.state = estado;
  pedido.history.push({ state: estado, at: Date.now(), by: "Estabelecimento", note: nota });
}

// recebido → em_preparo → pronto
export function avancarPedido(empresaId, id) {
  const pedido = obterPedidoDaEmpresa(empresaId, id);
  if (!pedido) return falha("Pedido não encontrado.");

  // Confere o estado AGORA: o cliente pode ter cancelado enquanto a tela estava aberta.
  const proximo = PROXIMA_ETAPA[pedido.state];
  if (!proximo) return falha(`O pedido ${id} está "${ESTADOS[pedido.state].rotulo}" e não pode ser avançado.`);

  registrar(pedido, proximo);
  salvarDados();
  return { ok: true, estado: proximo };
}

// Só vale para pedidos "recebido". O motivo aparece para o cliente.
export function rejeitarPedido(empresaId, id, motivo = "") {
  const pedido = obterPedidoDaEmpresa(empresaId, id);
  if (!pedido) return falha("Pedido não encontrado.");
  if (!ESTADOS_REJEITAVEIS.includes(pedido.state)) {
    return falha(`O pedido ${id} está "${ESTADOS[pedido.state].rotulo}" e não pode mais ser rejeitado.`);
  }

  const texto = motivo.trim() || "Rejeitado pelo estabelecimento.";
  pedido.reason = texto;
  registrar(pedido, "rejeitado", texto);
  salvarDados();
  return { ok: true };
}
