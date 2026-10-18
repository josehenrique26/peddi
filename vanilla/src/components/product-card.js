// src/components/product-card.js — cartão de um produto no cardápio.
import { el } from "./dom.js";
import { icone } from "./icon.js";
import { brl } from "../utils/format.js";
import { MAX_QTD } from "../data/order-rules.js";
import { imagemDoProduto } from "./product-image.js";
import { seletorDeQuantidade } from "./qty-stepper.js";

// qtdNoCarrinho: 0 se o produto ainda não foi adicionado.
export function cartaoDoProduto(produto, qtdNoCarrinho, { aoAdicionar, aoDiminuir }) {
  let acao;
  if (!produto.available) {
    acao = el("span", { class: "badge b-gray" }, "Indisponível");
  } else if (qtdNoCarrinho > 0) {
    acao = seletorDeQuantidade({
      nome: produto.name, qtd: qtdNoCarrinho, mais: qtdNoCarrinho < MAX_QTD,
      aoDiminuir: () => aoDiminuir(produto.id), aoAumentar: () => aoAdicionar(produto.id),
    });
  } else {
    acao = el("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => aoAdicionar(produto.id) },
      icone("plus", 15), "Adicionar");
  }

  return el("article", { class: produto.available ? "pcard" : "pcard off" },
    imagemDoProduto(produto),
    el("div", { class: "info" },
      el("h3", {}, produto.name),
      el("p", { class: "desc" }, produto.description),
      el("div", { class: "foot" }, el("span", { class: "price" }, brl(produto.price)), acao),
    ),
  );
}
