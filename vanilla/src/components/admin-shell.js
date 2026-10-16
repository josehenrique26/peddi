// src/components/admin-shell.js — menu lateral das telas do perfil empresa (e o botão que o abre no celular).
// O esqueleto (<aside id="menu-lateral">, <div id="scrim">, botão #abrir-menu) está no HTML de cada tela.
import { h } from "../utils/dom.js";
import { icone } from "./icon.js";
import { logoCompleto } from "./logo.js";
import { rotas } from "../utils/routes.js";
import { obterEmpresa } from "../services/companies.js";
import { pedidosDaEmpresa } from "../services/orders.js";

const NAV = [
  ["dashboard", "grid", "Dashboard", rotas.admin],
  ["pedidos", "receipt", "Pedidos", rotas.adminPedidos],
  ["cardapio", "book", "Cardápio", rotas.adminCardapio],
  ["entregadores", "bike", "Entregadores", rotas.adminEntregadores],
  ["config", "sliders", "Configurações", rotas.adminConfig],
];

export function montarMenuLateral(ativo, empresaId) {
  const empresa = obterEmpresa(empresaId);
  const novos = pedidosDaEmpresa(empresaId).filter((p) => p.state === "recebido").length;

  const selo = empresa.active
    ? h("span", { class: "badge b-green" }, icone("check", 13), "Recebendo pedidos")
    : h("span", { class: "badge b-red" }, icone("ban", 13), "Empresa inativa");

  const links = NAV.map(([chave, nomeIcone, rotulo, rota]) =>
    h("a", { class: "nl", href: rota(), "aria-current": chave === ativo ? "page" : null },
      icone(nomeIcone, 19), rotulo,
      chave === "pedidos" && novos ? h("span", { class: "cnt", "aria-label": `${novos} novos` }, String(novos)) : null));

  const menu = document.getElementById("menu-lateral");
  menu.replaceChildren(
    h("span", { class: "side-logo" }, logoCompleto()),
    h("div", { class: "co" },
      h("div", { class: "strong" }, empresa.name),
      h("div", { class: "small co-sub" }, `${empresa.category} · código ${empresa.code}`),
      h("div", { class: "co-badge" }, selo)),
    h("nav", {}, ...links),
    h("span", { class: "sp" }),
    h("a", { class: "nl", href: rotas.loja(empresa.slug) }, icone("eye", 19), "Ver como cliente"));

  ligarMenuMovel();
}

// Em telas estreitas o menu vira uma gaveta: abre pelo botão, fecha pelo fundo escuro ou com Esc.
function ligarMenuMovel() {
  const menu = document.getElementById("menu-lateral");
  const fundo = document.getElementById("scrim");
  const botao = document.getElementById("abrir-menu");
  const definir = (aberto) => {
    menu.classList.toggle("open", aberto);
    fundo.classList.toggle("on", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
  };
  botao.append(icone("menu", 20));
  botao.addEventListener("click", () => definir(true));
  fundo.addEventListener("click", () => definir(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") definir(false); });
}
