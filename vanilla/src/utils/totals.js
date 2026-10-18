// src/utils/totals.js — somas do carrinho e do pedido (funções puras, com reduce).
export const contarItens = (itens) => itens.reduce((total, item) => total + item.qty, 0);

export const somarLinhas = (linhas) => linhas.reduce((total, linha) => total + linha.total, 0);
