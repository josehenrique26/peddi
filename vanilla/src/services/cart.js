// src/services/cart.js — carrinho do cliente. Fica no LocalStorage (dados.carts), um por cliente,
// sempre de uma única empresa. Cada item: { productId, qty, note }.
import { obterDados, salvarDados, lerSessao } from "./storage.js";
import { obterProduto } from "./menu.js";
import { obterEmpresa } from "./companies.js";
import { MAX_QTD } from "../data/order-rules.js";

export function obterCarrinho() {
  const dados = obterDados();
  dados.carts ||= {};
  return (dados.carts[lerSessao().customerId] ||= { companyId: null, items: [] });
}

// Retorna { ok: true }, { erro } ou { conflito: empresaDoCarrinho } (item de outra empresa).
export function adicionarAoCarrinho(produtoId) {
  const produto = obterProduto(produtoId);
  const empresa = produto && obterEmpresa(produto.companyId);
  if (!produto || !empresa) return { erro: "Produto não encontrado." };
  if (!empresa.active) return { erro: `${empresa.name} não está recebendo pedidos agora.` };
  if (!produto.available) return { erro: `“${produto.name}” está indisponível no momento.` };

  const carrinho = obterCarrinho();
  if (carrinho.items.length && carrinho.companyId !== produto.companyId) {
    return { conflito: obterEmpresa(carrinho.companyId) };
  }

  const item = carrinho.items.find((i) => i.productId === produtoId);
  if (item && item.qty >= MAX_QTD) return { erro: `Limite de ${MAX_QTD} unidades por item.` };

  carrinho.companyId = produto.companyId;
  if (item) item.qty += 1;
  else carrinho.items.push({ productId: produtoId, qty: 1, note: "" });
  salvarDados();
  return { ok: true };
}

export function diminuirQuantidade(produtoId) {
  const carrinho = obterCarrinho();
  const item = carrinho.items.find((i) => i.productId === produtoId);
  if (!item) return;
  item.qty -= 1;
  if (item.qty < 1) removerDoCarrinho(produtoId);
  else salvarDados();
}

export function removerDoCarrinho(produtoId) {
  const carrinho = obterCarrinho();
  carrinho.items = carrinho.items.filter((i) => i.productId !== produtoId);
  if (!carrinho.items.length) carrinho.companyId = null;
  salvarDados();
}

export function limparCarrinho() {
  const carrinho = obterCarrinho();
  carrinho.items = [];
  carrinho.companyId = null;
  salvarDados();
}

export function definirObservacao(produtoId, texto) {
  const item = obterCarrinho().items.find((i) => i.productId === produtoId);
  if (!item) return;
  item.note = String(texto).slice(0, 120);
  salvarDados();
}

// Itens do carrinho + dados do produto + total da linha (preço × quantidade).
export const linhasDoCarrinho = () =>
  obterCarrinho().items.map((item) => {
    const produto = obterProduto(item.productId);
    return {
      ...item,
      produto,
      indisponivel: !produto || !produto.available,
      total: produto ? produto.price * item.qty : 0,
    };
  });
