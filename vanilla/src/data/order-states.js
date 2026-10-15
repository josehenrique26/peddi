// src/data/order-states.js — etapas do pedido (rótulo, ícone e cor). Usadas na comanda e nas telas de pedido.
export const ESTADOS = {
  recebido: { rotulo: "Recebido", icone: "check", cor: "blue" },
  em_preparo: { rotulo: "Em preparo", icone: "check", cor: "amber" },
  pronto: { rotulo: "Pronto", icone: "check", cor: "violet" },
  em_entrega: { rotulo: "Em entrega", icone: "bike", cor: "orange" },
  entregue: { rotulo: "Entregue", icone: "pin", cor: "green" },
};

// Linha do tempo mostrada na comanda de exemplo da tela inicial.
export const COMANDA_EXEMPLO = [
  { estado: "recebido", hora: "19:02", situacao: "feito" },
  { estado: "em_preparo", hora: "19:05", situacao: "feito" },
  { estado: "pronto", hora: "19:24", situacao: "feito" },
  { estado: "em_entrega", hora: "19:27", situacao: "atual" },
  { estado: "entregue", hora: "—", situacao: "pendente" },
];
