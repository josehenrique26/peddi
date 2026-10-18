// src/pages/admin-dashboard.js — lógica do dashboard da empresa (admin.html).
// Regra do projeto: o HTML fixo fica no .html; o JS só preenche valores (textContent)
// e cria os itens de LISTAS com document.createElement.

import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEmpresa } from "../utils/guard.js";
import { brl, quando, plural } from "../utils/format.js";
import { contarPorEstado, pedidosDeHoje, entreguesHoje, faturamentoDeHoje, aReceber, serieDePedidos } from "../utils/reports.js";
import { carregarDados, normalizarSessao, escutarMudancas } from "../services/storage.js";
import { obterEmpresa } from "../services/companies.js";
import { pedidosDaEmpresa, atividadesRecentes } from "../services/orders.js";
import { montarIcones } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarMenuLateral, ligarMenuMovel } from "../components/admin-shell.js";
import { seloDeEstado } from "../components/status-badge.js";
import { estadoVazio } from "../components/empty-state.js";
import { graficoDeBarras } from "../components/bar-chart.js";

const $ = (seletor) => document.querySelector(seletor);
const NOME_PERIODO = { dia: "hoje, por hora", semana: "últimos 7 dias", mes: "últimos 30 dias" };

let empresaId;
let periodo = "dia";    // "dia" | "semana" | "mes"
let visao = "grafico";  // "grafico" | "tabela"
let grafico;

/* ---------- cards ---------- */
// Cada elemento do HTML marcado com data-kpi="nome" recebe o valor de mesmo nome.
function montarCards() {
  const pedidos = pedidosDaEmpresa(empresaId);
  const fila = (estado) => contarPorEstado(pedidos, estado);

  const valores = {
    faturamento: brl(faturamentoDeHoje(pedidos)),
    "faturamento-legenda": `A receber: ${brl(aReceber(pedidos))}`,
    feitos: pedidosDeHoje(pedidos).length,
    entregues: entreguesHoje(pedidos).length,
    recebidos: fila("recebido"),
    preparo: fila("em_preparo"),
    prontos: fila("pronto"),
    entrega: fila("em_entrega"),
  };

  for (const [nome, valor] of Object.entries(valores)) {
    $(`[data-kpi="${nome}"]`).textContent = valor;
  }
}

/* ---------- controles do gráfico ---------- */
function montarControles() {
  document.querySelectorAll("#periodo button").forEach((botao) => {
    botao.addEventListener("click", () => {
      periodo = botao.dataset.periodo;
      atualizarGrafico();
      marcarBotoes();
    });
  });

  document.querySelectorAll("#visao button").forEach((botao) => {
    botao.addEventListener("click", () => {
      visao = botao.dataset.visao;
      atualizarGrafico();
      marcarBotoes();
    });
  });
}

// Mostra qual botão está ativo (aria-pressed).
function marcarBotoes() {
  document.querySelectorAll("#periodo button").forEach((botao) =>
    botao.setAttribute("aria-pressed", String(botao.dataset.periodo === periodo)));
  document.querySelectorAll("#visao button").forEach((botao) =>
    botao.setAttribute("aria-pressed", String(botao.dataset.visao === visao)));
}

/* ---------- gráfico / tabela ---------- */
// A tabela já existe no HTML; aqui só criamos as linhas (<tr>) do corpo.
function montarTabela(baldes) {
  $("#tabela-legenda").textContent = `Pedidos por intervalo — ${NOME_PERIODO[periodo]}`;

  const linhas = [];
  for (const balde of baldes) {
    if (balde.futuro) continue;
    const linha = document.createElement("tr");

    const celulaIntervalo = document.createElement("td");
    celulaIntervalo.dataset.label = "Intervalo";
    celulaIntervalo.textContent = balde.titulo;

    const celulaPedidos = document.createElement("td");
    celulaPedidos.dataset.label = "Pedidos";
    celulaPedidos.textContent = balde.pedidos;

    linha.append(celulaIntervalo, celulaPedidos);
    linhas.push(linha);
  }
  $("#tabela-corpo").replaceChildren(...linhas);
}

function atualizarGrafico() {
  const baldes = serieDePedidos(pedidosDaEmpresa(empresaId), periodo);
  const total = baldes.reduce((soma, balde) => soma + balde.pedidos, 0);
  $("#resumo-grafico").textContent = `${total} ${plural(total, "pedido", "pedidos")} · ${NOME_PERIODO[periodo]}`;

  const mostrarGrafico = visao === "grafico";
  $("#grafico").hidden = !mostrarGrafico;
  $("#tabela").hidden = mostrarGrafico;

  if (mostrarGrafico) grafico.atualizar(baldes);
  else montarTabela(baldes);
}

/* ---------- atividade recente ---------- */
function criarItemDeAtividade(pedido, evento) {
  const item = document.createElement("li");

  const caixa = document.createElement("div");
  caixa.className = "grow";

  const numero = document.createElement("a");
  numero.className = "oid";
  numero.href = `admin-pedidos.html?pedido=${encodeURIComponent(pedido.id)}`;
  numero.textContent = pedido.id;

  const cliente = document.createElement("span");
  cliente.className = "muted";
  cliente.textContent = ` · ${pedido.contact.name}`;

  const detalhe = document.createElement("div");
  detalhe.className = "muted small";
  detalhe.textContent = `${quando(evento.at)} · ${evento.by}`;

  caixa.append(numero, cliente, detalhe);
  item.append(seloDeEstado(evento.state), caixa);
  return item;
}

function montarAtividade() {
  const atividades = atividadesRecentes(empresaId, 8);

  if (atividades.length === 0) {
    $("#atividade").replaceChildren(
      estadoVazio({ icone: "clock", titulo: "Nenhuma atividade", texto: "As movimentações dos pedidos aparecem aqui." }));
    return;
  }

  const lista = document.createElement("ul");
  lista.className = "feed";
  for (const { pedido, evento } of atividades) {
    lista.append(criarItemDeAtividade(pedido, evento));
  }
  $("#atividade").replaceChildren(lista);
}

/* ---------- topo ---------- */
function montarTopo(empresa) {
  document.title = `Dashboard · ${empresa.name} · Peddi`;
  $("#aviso-inativa").hidden = empresa.active; // o aviso só aparece se a empresa estiver inativa
}

/* ---------- inicialização ---------- */
function desenharTudo() {
  montarTopo(obterEmpresa(empresaId));
  montarMenuLateral("dashboard", empresaId);
  montarCards();
  atualizarGrafico();
  montarAtividade();
  montarIcones(); // troca os <span data-icon> pelos ícones SVG
}

aplicarTemaSalvo();
carregarDados();
if (exigirEmpresa()) {
  empresaId = normalizarSessao().companyId;
  montarBarraDemo($("#demo"));
  ligarMenuMovel();
  grafico = graficoDeBarras($("#grafico"), { descricao: "Gráfico de colunas com a quantidade de pedidos por intervalo. A tabela traz os mesmos números." });
  montarControles();
  desenharTudo();
  escutarMudancas(desenharTudo); // outra aba mexeu nos dados: redesenha
}
