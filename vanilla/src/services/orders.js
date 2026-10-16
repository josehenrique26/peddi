// src/services/orders.js — consultas sobre pedidos (somente leitura nesta etapa).
import { obterDados } from "./storage.js";

export const pedidosDaEmpresa = (empresaId) =>
  obterDados().orders.filter((p) => p.companyId === empresaId);

// Todas as movimentações (histórico) dos pedidos da empresa, da mais recente para a mais antiga.
export function atividadesRecentes(empresaId, limite = 8) {
  return pedidosDaEmpresa(empresaId)
    .flatMap((pedido) => pedido.history.map((evento) => ({ pedido, evento })))
    .sort((a, b) => b.evento.at - a.evento.at)
    .slice(0, limite);
}
