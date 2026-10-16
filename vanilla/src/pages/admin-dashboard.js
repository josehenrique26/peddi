// src/pages/admin-dashboard.js — lógica do dashboard da empresa (admin.html).
import "../styles/main.css";
import "../styles/pages/admin.css";

import { h } from "../utils/dom.js";
import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEmpresa } from "../utils/guard.js";
import { rotas } from "../utils/routes.js";
import { brl, quando, plural } from "../utils/format.js";
import { contarPorEstado, pedidosDeHoje, entreguesHoje, faturamentoDeHoje, aReceber, serieDePedidos } from "../utils/reports.js";
import { ESTADOS } from "../data/order-states.js";
import { carregarDados, normalizarSessao, escutarMudancas } from "../services/storage.js";
import { obterEmpresa } from "../services/companies.js";
import { pedidosDaEmpresa, atividadesRecentes } from "../services/orders.js";
import { icone } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarMenuLateral } from "../components/admin-shell.js";
import { seloDeEstado } from "../components/status-badge.js";
import { estadoVazio } from "../components/empty-state.js";
import { graficoDeBarras } from "../components/bar-chart.js";

const $ = (seletor) => document.querySelector(seletor);

const PERIODOS = [["dia", "Hoje"], ["semana", "7 dias"], ["mes", "30 dias"]];
const NOME_PERIODO = { dia: "hoje, por hora", semana: "últimos 7 dias", mes: "últimos 30 dias" };

let empresaId;
let periodo = "dia";
let visao = "grafico"; // "grafico" | "tabela"
let grafico;

/* ---------- cards ---------- */
function card({ estado, icone: nomeIcone, rotulo, valor, legenda, destaque }) {
  return h("a", { class: `kpi${destaque ? " money" : ""}`, href: rotas.adminPedidos() },
    h("span", { class: "l" }, icone(nomeIcone ?? ESTADOS[estado].icone, 16), rotulo),
    h("span", { class: "v" }, String(valor)),
    legenda ? h("span", { class: "muted small" }, legenda) : null);
}

function montarCards() {
  const pedidos = pedidosDaEmpresa(empresaId);
  const hoje = pedidosDeHoje(pedidos);
  const entregues = entreguesHoje(pedidos);
  const fila = (estado) => contarPorEstado(pedidos, estado);

  $("#kpis").replaceChildren(
    card({ icone: "bag", rotulo: "Faturamento do dia", valor: brl(faturamentoDeHoje(pedidos)), legenda: `A receber: ${brl(aReceber(pedidos))}`, destaque: true }),
    card({ icone: "receipt", rotulo: "Pedidos feitos", valor: hoje.length, legenda: "hoje" }),
    card({ estado: "entregue", rotulo: "Entregues", valor: entregues.length, legenda: "hoje" }),
    card({ estado: "recebido", rotulo: "Recebidos", valor: fila("recebido"), legenda: "aguardando aceite" }),
    card({ estado: "em_preparo", rotulo: "Em preparo", valor: fila("em_preparo"), legenda: "na cozinha" }),
    card({ estado: "pronto", rotulo: "Prontos", valor: fila("pronto"), legenda: "aguardando entregador" }),
    card({ estado: "em_entrega", rotulo: "Em entrega", valor: fila("em_entrega"), legenda: "a caminho" }),
  );
}

/* ---------- gráfico ---------- */
function montarControles() {
  $("#periodo").replaceChildren(...PERIODOS.map(([chave, rotulo]) =>
    h("button", {
      type: "button", "aria-pressed": String(chave === periodo),
      onclick: () => { periodo = chave; atualizarGrafico(); marcarBotoes(); },
    }, rotulo)));
  $("#visao").replaceChildren(...[["grafico", "Gráfico"], ["tabela", "Tabela"]].map(([chave, rotulo]) =>
    h("button", {
      type: "button", "aria-pressed": String(chave === visao),
      onclick: () => { visao = chave; atualizarGrafico(); marcarBotoes(); },
    }, rotulo)));
}

function marcarBotoes() {
  $("#periodo").querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(PERIODOS[i][0] === periodo)));
  $("#visao").querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(["grafico", "tabela"][i] === visao)));
}

function montarTabela(baldes) {
  const linhas = baldes.filter((b) => !b.futuro).map((b) => h("tr", {},
    h("td", { "data-label": "Intervalo" }, b.titulo),
    h("td", { "data-label": "Pedidos" }, String(b.pedidos))));
  return h("table", { class: "tbl chart-table" },
    h("caption", { class: "sr" }, `Pedidos por intervalo — ${NOME_PERIODO[periodo]}`),
    h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Intervalo"), h("th", { scope: "col" }, "Pedidos"))),
    h("tbody", {}, ...linhas));
}

function atualizarGrafico() {
  const baldes = serieDePedidos(pedidosDaEmpresa(empresaId), periodo);
  const total = baldes.reduce((t, b) => t + b.pedidos, 0);
  $("#resumo-grafico").textContent = `${total} ${plural(total, "pedido", "pedidos")} · ${NOME_PERIODO[periodo]}`;

  const mostrarGrafico = visao === "grafico";
  $("#grafico").hidden = !mostrarGrafico;
  $("#tabela").hidden = mostrarGrafico;
  if (mostrarGrafico) {
    grafico.atualizar(baldes);
  } else {
    $("#tabela").replaceChildren(montarTabela(baldes));
  }
}

/* ---------- atividade recente ---------- */
function montarAtividade() {
  const itens = atividadesRecentes(empresaId, 8);
  $("#atividade").replaceChildren(
    itens.length
      ? h("ul", { class: "feed" }, ...itens.map(({ pedido, evento }) =>
          h("li", {},
            seloDeEstado(evento.state),
            h("div", { class: "grow" },
              h("a", { class: "oid", href: rotas.adminPedidos() }, pedido.id),
              h("span", { class: "muted" }, ` · ${pedido.contact.name}`),
              h("div", { class: "muted small" }, `${quando(evento.at)} · ${evento.by}`)))))
      : estadoVazio({ icone: "clock", titulo: "Nenhuma atividade", texto: "As movimentações dos pedidos aparecem aqui." }));
}

/* ---------- topo: atalhos e aviso ---------- */
function montarTopo(empresa) {
  document.title = `Dashboard · ${empresa.name} · Peddi`;
  $("#atalhos").replaceChildren(
    h("a", { class: "btn btn-primary btn-sm", href: rotas.adminCardapio() }, icone("plus", 15), "Novo produto"),
    h("a", { class: "btn btn-ghost btn-sm", href: rotas.adminPedidos() }, icone("receipt", 15), "Pedidos"),
    h("a", { class: "btn btn-ghost btn-sm", href: rotas.adminEntregadores() }, icone("bike", 15), "Entregadores"));
  $("#ver-pedidos").href = rotas.adminPedidos();
  $("#aviso-inativa").replaceChildren(
    ...(empresa.active ? [] : [h("div", { class: "banner bn-err", role: "status" },
      icone("ban"),
      h("div", {}, h("strong", {}, "Empresa inativa."), " Novos pedidos estão bloqueados. Reative em ",
        h("a", { href: rotas.adminConfig() }, "Configurações"), "."))]));
}

/* ---------- inicialização ---------- */
function desenharTudo() {
  const empresa = obterEmpresa(empresaId);
  montarTopo(empresa);
  montarMenuLateral("dashboard", empresaId);
  montarCards();
  atualizarGrafico();
  montarAtividade();
}

aplicarTemaSalvo();
carregarDados();
if (exigirEmpresa()) {
  empresaId = normalizarSessao().companyId;
  montarBarraDemo($("#demo"));
  grafico = graficoDeBarras($("#grafico"), { descricao: "Gráfico de colunas com a quantidade de pedidos por intervalo. A tabela traz os mesmos números." });
  montarControles();
  desenharTudo();
  escutarMudancas(desenharTudo);
}
