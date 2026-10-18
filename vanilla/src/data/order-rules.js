// src/data/order-rules.js — regras fixas do pedido do ponto de vista do cliente.
export const MAX_QTD = 20; // unidades por item no carrinho

export const PAGAMENTOS = {
  pix: "Pix (simulado)",
  cartao: "Cartão na entrega (simulado)",
  dinheiro: "Dinheiro na entrega (simulado)",
};

// Etapas mostradas na barra de acompanhamento, em ordem.
export const ETAPAS = ["recebido", "em_preparo", "pronto", "em_entrega", "entregue"];

export const ESTADOS_FINAIS = ["entregue", "rejeitado", "cancelado"];

// O cliente só cancela antes de o entregador retirar o pedido.
export const ESTADOS_CANCELAVEIS = ["recebido", "em_preparo", "pronto"];
