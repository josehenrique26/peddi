// src/pages/client-tracking.js — acompanhamento do pedido, com o código de entrega (pedido.html?id=PED-1011).
// Se a empresa mudar o estado em outra aba, a tela se atualiza sozinha.
import "../styles/main.css";
import "../styles/pages/client.css";

import { aplicarTemaSalvo } from "../utils/theme.js";
import { entrarComoCliente } from "../utils/guard.js";
import { brl, quando } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { ESTADOS } from "../data/order-states.js";
import { PAGAMENTOS, ESTADOS_FINAIS } from "../data/order-rules.js";
import { carregarDados, escutarMudancas } from "../services/storage.js";
import { obterEmpresa } from "../services/companies.js";
import { obterPedidoDoCliente, itensDoPedido, podeCancelar, cancelarPedido, enderecoEmTexto } from "../services/client-orders.js";
import { el, mount } from "../components/dom.js";
import { icone, montarIcones } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarTopoDoCliente } from "../components/client-header.js";
import { seloDeEstado } from "../components/status-badge.js";
import { barraDeEtapas, linhaDoTempo } from "../components/order-tracker.js";
import { blocoDeTotais } from "../components/totals-box.js";
import { estadoVazio } from "../components/empty-state.js";
import { confirmar } from "../components/confirm-dialog.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);
const campo = (nome) => $(`[data-campo="${nome}"]`);

const parametros = new URLSearchParams(location.search);
const pedidoId = parametros.get("id");
const recemCriado = parametros.get("novo") === "1";

/* ---------- partes da tela ---------- */
// Pedido em andamento mostra a barra de etapas; rejeitado ou cancelado mostra o motivo.
function montarAcompanhamento(pedido) {
  if (pedido.state !== "rejeitado" && pedido.state !== "cancelado") {
    mount($("#acompanhamento"), barraDeEtapas(pedido));
    return;
  }
  const rotulo = ESTADOS[pedido.state].rotulo;
  mount($("#acompanhamento"), el("div", { class: `banner ${pedido.state === "rejeitado" ? "bn-err" : "bn-warn"}`, role: "status" },
    icone(ESTADOS[pedido.state].icone, 20),
    el("div", {},
      el("strong", {}, `Pedido ${rotulo.toLowerCase()}.`),
      pedido.reason && el("br"), pedido.reason && `Motivo: ${pedido.reason}`,
      el("br"), "Este é um estado final: o pedido não pode mais ser alterado."),
  ));
}

function montarCodigo(pedido) {
  const entregue = pedido.state === "entregue";
  $("#codigo").hidden = ESTADOS_FINAIS.includes(pedido.state) && !entregue;
  campo("codigo-rotulo").textContent = entregue ? "Código usado na entrega" : "Código de confirmação da entrega";
  campo("codigo-nota").textContent = entregue ? "Entrega validada." : "Informe este código ao entregador quando receber o pedido.";
  $("#codigo-valor").textContent = pedido.code;
  $("#codigo-valor").setAttribute("aria-label", pedido.code.split("").join(" "));
}

function montarItens(pedido) {
  const linhas = itensDoPedido(pedido.id).map((item) =>
    el("tr", {},
      el("td", { "data-label": "Item" }, item.name, item.note && el("div", { class: "muted small" }, `Obs.: ${item.note}`)),
      el("td", { class: "right", "data-label": "Qtd." }, String(item.qty)),
      el("td", { class: "right", "data-label": "Unitário" }, brl(item.unitPrice)),
      el("td", { class: "right", "data-label": "Total" }, brl(item.unitPrice * item.qty)),
    ));
  mount($("#itens-pedido"), linhas);
  mount($("#totais-pedido"), blocoDeTotais({ subtotal: pedido.subtotal, taxa: pedido.fee }));
}

function montarAcoes(pedido) {
  const retirado = pedido.state === "em_entrega";
  $("#cancelar").hidden = !podeCancelar(pedido);
  $("#aviso-retirado").hidden = !retirado;
}

/* ---------- tela completa ---------- */
function desenhar() {
  const pedido = obterPedidoDoCliente(pedidoId);
  if (!pedido) return mostrarNaoEncontrado();

  const empresa = obterEmpresa(pedido.companyId);
  const ultimo = pedido.history[pedido.history.length - 1];
  document.title = `Pedido ${pedido.id} · Peddi`;

  $("#h-pedido").textContent = pedido.id;
  campo("subtitulo").textContent = `${empresa.name} · feito ${quando(pedido.createdAt)}`;
  mount($("#selo-estado"), seloDeEstado(pedido.state));

  $("#aviso-novo").hidden = !recemCriado;
  campo("empresa-recebeu").textContent = empresa.name;

  montarAcompanhamento(pedido);
  $("#aviso-entregue").hidden = pedido.state !== "entregue";
  campo("texto-entregue").textContent = `Entrega confirmada ${quando(ultimo.at)}. Bom apetite!`;

  montarCodigo(pedido);
  montarItens(pedido);

  campo("para").textContent = pedido.contact.name;
  campo("endereco").textContent = enderecoEmTexto(pedido);
  campo("pagamento").textContent = PAGAMENTOS[pedido.payment];
  mount($("#historico"), linhaDoTempo(pedido));
  montarAcoes(pedido);

  $("#pedido").hidden = false;
  $("#nao-encontrado").hidden = true;
}

function mostrarNaoEncontrado() {
  const acao = el("a", { class: "btn btn-primary", href: rotas.pedidos() }, "Meus pedidos");
  mount($("#nao-encontrado"), estadoVazio({ icone: "search", titulo: "Pedido não encontrado", texto: "Este pedido não existe ou pertence a outra conta.", acao }));
  $("#nao-encontrado").hidden = false;
  $("#pedido").hidden = true;
}

/* ---------- cancelamento ---------- */
async function cancelar() {
  const resposta = await confirmar({
    titulo: `Cancelar o pedido ${pedidoId}?`,
    texto: "O cancelamento só é possível antes de o entregador retirar o pedido.",
    textoConfirmar: "Cancelar pedido", perigo: true, pedirMotivo: true,
  });
  if (!resposta) return;

  const resultado = cancelarPedido(pedidoId, resposta.motivo);
  if (resultado.erro) avisar(resultado.erro, "err");
  else avisar(`Pedido ${pedidoId} cancelado.`);
  desenhar();
}

/* ---------- inicialização ---------- */
aplicarTemaSalvo();
carregarDados();
entrarComoCliente();
montarBarraDemo($("#demo"));
montarTopoDoCliente();

$("#cancelar").addEventListener("click", cancelar);
escutarMudancas(desenhar);
desenhar();
montarIcones();
