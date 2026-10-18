// src/components/product-image.js — foto do produto; sem foto, mostra o emoji sobre um fundo colorido.
import { el } from "./dom.js";

const FUNDOS = ["#FFE3D1", "#E4F1DC", "#FFF0C2", "#E3E9FB", "#F3E4F7", "#FDE1E1", "#DDF1EF", "#EFE7DA"];

// A mesma categoria sempre recebe o mesmo fundo.
function fundoDaCategoria(categoria = "") {
  let hash = 0;
  for (const letra of categoria) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0;
  return FUNDOS[hash % FUNDOS.length];
}

// classe: "pimg" (cartão do cardápio) ou "pimg-sm" (linha do carrinho).
export function imagemDoProduto(produto, classe = "pimg") {
  const { src, emoji } = produto.img ?? {};
  if (src) return el("img", { class: classe, src, alt: produto.name, loading: "lazy" });

  return el("div", {
    class: classe, role: "img", "aria-label": produto.name, style: { background: fundoDaCategoria(produto.category) },
  }, el("span", { "aria-hidden": "true" }, emoji ?? "🍽️"));
}
