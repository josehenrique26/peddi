// src/data/order-states.js — etapas do pedido (rótulo, ícone e cor). Usadas na comanda, nos selos e nos painéis.
// A cor combina com as classes .badge.b-<cor> do CSS.
export const ESTADOS = {
  recebido: { rotulo: "Recebido", icone: "inbox", cor: "blue" },
  em_preparo: { rotulo: "Em preparo", icone: "clock", cor: "amber" },
  pronto: { rotulo: "Pronto", icone: "checkc", cor: "violet" },
  em_entrega: { rotulo: "Em entrega", icone: "bike", cor: "orange" },
  entregue: { rotulo: "Entregue", icone: "check", cor: "green" },
  rejeitado: { rotulo: "Rejeitado", icone: "xc", cor: "red" },
  cancelado: { rotulo: "Cancelado", icone: "ban", cor: "gray" },
};

// Etapas da viagem do entregador (mesmas cores dos selos do pedido).
export const ESTADOS_VIAGEM = {
  aguardando_retirada: { rotulo: "Aguardando retirada", icone: "clock", cor: "amber" },
  em_andamento: { rotulo: "Em andamento", icone: "bike", cor: "orange" },
  concluida: { rotulo: "Concluída", icone: "check", cor: "green" },
  cancelada: { rotulo: "Desfeita", icone: "ban", cor: "gray" },
};

// Pedidos que ainda estão em andamento (valor "a receber" no dashboard).
export const ESTADOS_EM_ANDAMENTO = ["recebido", "em_preparo", "pronto", "em_entrega"];

// Linha do tempo mostrada na comanda de exemplo da tela inicial.
export const COMANDA_EXEMPLO = [
  { estado: "recebido", hora: "19:02", situacao: "feito" },
  { estado: "em_preparo", hora: "19:05", situacao: "feito" },
  { estado: "pronto", hora: "19:24", situacao: "feito" },
  { estado: "em_entrega", hora: "19:27", situacao: "atual" },
  { estado: "entregue", hora: "—", situacao: "pendente" },
];
