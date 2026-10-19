// src/components/courier-shell.js — cabeçalho, navegação inferior e janelas das telas do entregador.
// O esqueleto (<header id="cr-topo">, <main id="main">, <nav id="cr-nav">) está no HTML de cada tela.
import { el, mount } from "./dom.js";
import { icone } from "./icon.js";
import { marcaLogo } from "./logo.js";
import { rotas } from "../utils/routes.js";
import { obterEmpresa } from "../services/companies.js";
import { pedidosProntos } from "../services/courier-orders.js";

const ABAS = [
  ["disp", rotas.entregador, "bag", "Disponíveis"],
  ["viagens", rotas.entregadorViagens, "route", "Viagens"],
  ["hist", rotas.entregadorHistorico, "clock", "Histórico"],
];

const $ = (seletor) => document.querySelector(seletor);

// Preenche o topo e a navegação. Pode ser chamada de novo quando os dados mudam.
export function montarCasca(aba, entregador) {
  const empresa = obterEmpresa(entregador.companyId);
  const prontos = pedidosProntos(entregador.companyId).length;
  document.title = `Entregas · ${empresa.name} · Peddi`;

  const logo = el("span", { class: "logo cr-logo" });
  logo.innerHTML = marcaLogo(26); // marca fixa do projeto, sem dados digitados
  logo.append("Peddi Entregas");

  mount($("#cr-topo"),
    el("div", { class: "row between nowrap" }, logo,
      entregador.active
        ? el("span", { class: "badge b-green" }, icone("check", 13), "Ativo")
        : el("span", { class: "badge b-gray" }, icone("ban", 13), "Inativo")),
    el("div", { class: "cr-sub" },
      el("div", { class: "small cr-muted" }, "Vinculado a"),
      el("div", { class: "strong cr-empresa" }, empresa.name),
      el("div", { class: "small cr-muted" }, `${entregador.name} · ${entregador.code}`)),
  );

  mount($("#cr-nav"), el("div", { class: "in" }, ABAS.map(([chave, destino, nomeIcone, rotulo]) =>
    el("a", { href: destino(), "aria-current": chave === aba ? "page" : null },
      icone(nomeIcone, 22), rotulo + (chave === "disp" && prontos ? ` (${prontos})` : "")))));
}

// Aviso no alto da tela quando o cadastro do entregador está inativo.
export function avisoDeInativo(entregador) {
  if (entregador.active) return null;
  return el("div", { class: "banner bn-warn", role: "status" }, icone("alert"),
    el("div", {}, el("strong", {}, "Cadastro inativo. "), "Você pode consultar o histórico, mas não pode assumir novas viagens. Fale com o estabelecimento."));
}

// Janela (<dialog>) no mesmo padrão do confirm-dialog. Devolve o <dialog> já aberto; ele se remove ao fechar.
export function abrirJanela({ titulo, subtitulo, corpo, rodape, aoEnviar }) {
  const formulario = el("form", { method: "dialog", novalidate: true },
    el("div", { class: "m-hd" }, el("h2", { id: "janela-titulo" }, titulo), subtitulo && el("div", { class: "muted small" }, subtitulo)),
    el("div", { class: "m-bd" }, corpo),
    el("div", { class: "m-ft" }, rodape),
  );
  const janela = el("dialog", { class: "modal", "aria-labelledby": "janela-titulo" }, formulario);
  if (aoEnviar) formulario.addEventListener("submit", (e) => { e.preventDefault(); aoEnviar(janela, e.submitter); });
  janela.addEventListener("close", () => janela.remove());
  document.body.append(janela);
  janela.showModal();
  return janela;
}

export const botaoFechar = (texto = "Voltar") =>
  el("button", { type: "button", class: "btn btn-ghost", onclick: (e) => e.target.closest("dialog").close() }, texto);
