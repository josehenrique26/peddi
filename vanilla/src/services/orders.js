// src/services/orders.js — consultas dos pedidos de uma empresa (usadas pelo dashboard e pelo menu lateral).
import { obterDados } from "./storage.js";

export const pedidosDaEmpresa = (empresaId) => {
  const dados = obterDados();
  return Array.isArray(dados?.orders)
    ? dados.orders.filter((p) => p.companyId === empresaId)
    : [];
};

// Todas as movimentações (histórico) dos pedidos da empresa, da mais recente para a mais antiga.
export function atividadesRecentes(empresaId, limite = 8) {
  return pedidosDaEmpresa(empresaId)
    .flatMap((pedido) => pedido.history.map((evento) => ({ pedido, evento })))
    .sort((a, b) => b.evento.at - a.evento.at)
    .slice(0, limite);
}
