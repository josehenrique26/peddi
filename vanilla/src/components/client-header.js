// src/components/client-header.js — topo das telas do cliente. O <header id="topo"> está no HTML de cada tela.
import { el, mount } from "./dom.js";
import { icone } from "./icon.js";
import { plural } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { contarItens } from "../utils/totals.js";
import { lerSessao } from "../services/storage.js";
import { empresaPorSlug } from "../services/menu.js";
import { obterCarrinho } from "../services/cart.js";
import { clienteAtual } from "../services/client-orders.js";

const topo = () => document.getElementById("topo");
const interno = (...filhos) => el("div", { class: "container in" }, ...filhos);

// Topo da loja: marca da empresa, "Meus pedidos" e carrinho com o contador de itens.
export function montarTopoDaLoja(empresa) {
  const qtd = contarItens(obterCarrinho().items);

  mount(topo(), interno(
    el("a", { class: "logo shop-brand", href: rotas.loja(empresa.slug), "aria-label": `Cardápio de ${empresa.name}` },
      el("span", { class: "brandmark brandmark-sm", style: { background: empresa.brandColor } }, empresa.brandEmoji),
      el("span", {}, empresa.name),
    ),
    el("span", { class: "grow" }),
    el("a", { class: "btn btn-ghost btn-sm", href: rotas.pedidos(), "aria-label": "Meus pedidos" }, icone("receipt", 16), el("span", { class: "btn-label" }, "Meus pedidos")),
    el("a", { class: "btn btn-ghost btn-sm cartlink", href: rotas.carrinho(), "aria-label": `Carrinho, ${qtd} ${plural(qtd, "item", "itens")}` },
      icone("cart", 16), el("span", { class: "btn-label" }, "Carrinho"), qtd > 0 && el("span", { class: "cnt" }, String(qtd))),
  ));
}

// Topo das telas "Meus pedidos" e "Acompanhamento": volta ao último cardápio visitado (ou ao início).
export function montarTopoDoCliente() {
  const empresa = empresaPorSlug(lerSessao().lastShop);
  const voltar = empresa
    ? el("a", { class: "btn btn-ghost btn-sm", href: rotas.loja(empresa.slug) }, icone("back", 15), `Cardápio de ${empresa.name}`)
    : el("a", { class: "btn btn-ghost btn-sm", href: rotas.inicio() }, icone("back", 15), "Início");

  mount(topo(), interno(
    voltar,
    el("span", { class: "grow" }),
    el("span", { class: "muted small" }, icone("user", 15), ` ${clienteAtual()?.name ?? ""}`),
  ));
}
