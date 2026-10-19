// src/pages/home.js — lógica da tela inicial (index.html): acesso por link/código, comanda e perfis.
import "../styles/main.css";
import "../styles/pages/home.css";

import { aplicarTemaSalvo } from "../utils/theme.js";
import { preencherSelect } from "../utils/select.js";
import { rotas, rotaDoPerfil, navegar } from "../utils/routes.js";
import { COMANDA_EXEMPLO, ESTADOS } from "../data/order-states.js";
import { carregarDados, lerSessao, gravarSessao } from "../services/storage.js";
import { listarEmpresas, listarClientes, listarEntregadores, obterEmpresa, resolverEmpresa } from "../services/companies.js";
import { montarIcones, icone } from "../components/icon.js";
import { montarLogos } from "../components/logo.js";
import { montarBarraDemo } from "../components/demo-bar.js";

const $ = (seletor) => document.querySelector(seletor);

let modo = "link"; // "link" | "code"

/* ---------- acesso por link ou código ---------- */
const campo = $("#f-ref");
const erro = $("#e-ref");

function mostrarErro(mensagem) {
  erro.textContent = mensagem ?? "";
  if (mensagem) campo.setAttribute("aria-invalid", "true");
  else campo.removeAttribute("aria-invalid");
}

function definirModo(novoModo) {
  modo = novoModo;
  document.querySelectorAll(".access .seg button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.mode === modo)));
  $("#l-ref").textContent = modo === "link" ? "Link da empresa" : "Código da empresa";
  campo.placeholder = modo === "link" ? "peddi.app/forno-da-vila" : "Ex.: VILA482";
  mostrarErro("");
}

function preencher(novoModo, valor) {
  definirModo(novoModo);
  campo.value = valor;
  campo.focus();
}

// Botão de exemplo: ao clicar, preenche o formulário.
function criarChip(texto, novoModo, valor) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = texto;
  botao.addEventListener("click", () => preencher(novoModo, valor));
  return botao;
}

function montarExemplos() {
  const ativas = listarEmpresas().filter((c) => c.active);
  const inativa = listarEmpresas().find((c) => !c.active);
  const [primeira, segunda] = ativas;

  // append() só adiciona no fim, então o <span> de rótulo do HTML continua no lugar.
  if (primeira) $("#ex-validos").append(criarChip(`peddi.app/${primeira.slug}`, "link", `peddi.app/${primeira.slug}`));
  if (segunda) $("#ex-validos").append(criarChip(`código ${segunda.code}`, "code", segunda.code));

  $("#ex-erros").append(criarChip("código inexistente", "code", "XYZ000"));
  if (inativa) $("#ex-erros").append(criarChip("empresa inativa", "code", inativa.code));
}

function iniciarAcesso() {
  document.querySelectorAll(".access .seg button").forEach((b) =>
    b.addEventListener("click", () => { definirModo(b.dataset.mode); campo.focus(); }));

  $("#form-acesso").addEventListener("submit", (e) => {
    e.preventDefault();
    const resultado = resolverEmpresa(campo.value, modo);
    if (resultado.erro) return mostrarErro(resultado.erro);

    mostrarErro("");
    gravarSessao({ ...lerSessao(), role: "cliente", lastShop: resultado.empresa.slug });
    navegar(rotas.loja(resultado.empresa.slug));
  });
  campo.addEventListener("input", () => mostrarErro(""));

  definirModo("link");
  montarExemplos();
}

/* ---------- comanda de exemplo ---------- */
function montarComanda() {
  const itens = [];

  for (const { estado, hora, situacao } of COMANDA_EXEMPLO) {
    const { rotulo, icone: nomeIcone } = ESTADOS[estado];
    const marcador = situacao === "pendente" ? "pin" : nomeIcone;

    const item = document.createElement("li");
    item.className = { feito: "done", atual: "on", pendente: "" }[situacao];
    if (situacao === "atual") item.setAttribute("aria-current", "step");

    const bolinha = document.createElement("span");
    bolinha.className = "dot";
    bolinha.append(icone(marcador, 14));

    const horario = document.createElement("span");
    horario.className = "t";
    horario.textContent = hora;

    item.append(bolinha, rotulo, horario);
    itens.push(item);
  }

  $("#ladder").replaceChildren(...itens);
}

/* ---------- cards de perfil ---------- */
function montarPerfis() {
  preencherSelect($("#d-company"), listarEmpresas().map((c) => [c.id, c.name + (c.active ? "" : " (inativa)")]));
  preencherSelect($("#d-customer"), listarClientes().map((c) => [c.id, c.name]));
  preencherSelect($("#d-courier"), listarEntregadores().map((c) =>
    [c.id, `${c.name} · ${obterEmpresa(c.companyId)?.name ?? ""}${c.active ? "" : " (inativo)"}`]));

  const escolha = { admin: ["companyId", "#d-company"], cliente: ["customerId", "#d-customer"], entregador: ["courierId", "#d-courier"] };

  document.querySelectorAll("[data-enter]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const perfil = botao.dataset.enter;
      const [chave, seletor] = escolha[perfil];
      gravarSessao({ ...lerSessao(), role: perfil, [chave]: $(seletor).value });
      navegar(rotaDoPerfil[perfil]());
    });
  });
}

/* ---------- inicialização ---------- */
aplicarTemaSalvo();
carregarDados();
montarLogos();
montarBarraDemo($("#demo"), { inicio: true }); // no index a barra sempre começa sem perfil marcado
iniciarAcesso();
montarComanda();
montarPerfis();
montarIcones();
