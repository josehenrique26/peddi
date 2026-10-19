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

// Fluxo da empresa no quadro Kanban: de cada etapa, para qual ela pode avançar o pedido.
// "pronto" → "em_entrega" não está aqui: quem retira o pedido é o entregador.
export const PROXIMA_ETAPA = { recebido: "em_preparo", em_preparo: "pronto" };

// A empresa só rejeita um pedido que acabou de chegar.
export const ESTADOS_REJEITAVEIS = ["recebido"];

// Entregador: pedidos por viagem, tentativas de código por entrega e motivos de entrega não concluída.
export const MAX_PEDIDOS_VIAGEM = 3;
export const MAX_TENTATIVAS = 3;
export const MOTIVOS_FALHA = [
  { id: "cliente_ausente", rotulo: "Cliente ausente" },
  { id: "endereco_nao_encontrado", rotulo: "Endereço não encontrado" },
  { id: "codigo_perdido", rotulo: "Cliente sem o código de confirmação" },
  { id: "outro", rotulo: "Outro motivo" },
];
