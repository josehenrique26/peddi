// src/pages/courier-history.js — entregas concluídas pelo entregador (entregador-historico.html). Só leitura.
import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEntregador } from "../utils/guard.js";
import { hora, dataCurta, plural } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { carregarDados, escutarMudancas } from "../services/storage.js";
import { entregadorAtual, entregasConcluidas, obterPedido } from "../services/courier-orders.js";
import { el, mount } from "../components/dom.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarCasca, avisoDeInativo } from "../components/courier-shell.js";
import { seloDeEstado } from "../components/status-badge.js";
import { estadoVazio } from "../components/empty-state.js";

const $ = (seletor) => document.querySelector(seletor);

function cartaoDaEntrega(entrega) {
  const pedido = obterPedido(entrega.orderId);
  return el("div", { class: "card pad-sm" },
    el("div", { class: "row between" }, el("span", { class: "oid-d" }, pedido.id), seloDeEstado(pedido.state)),
    el("div", {}, pedido.contact.name),
    el("div", { class: "muted small" }, `${dataCurta(entrega.completedAt)} às ${hora(entrega.completedAt)} · viagem `,
      el("a", { href: rotas.entregadorViagem(entrega.tripId) }, entrega.tripId)));
}

function desenhar() {
  const entregador = entregadorAtual();
  const entregas = entregasConcluidas(entregador.id);
  montarCasca("hist", entregador);
  mount($("#main"),
    avisoDeInativo(entregador),
    el("div", {},
      el("h2", {}, "Histórico de entregas"),
      el("p", { class: "muted small" }, `${entregas.length} ${plural(entregas.length, "entrega concluída", "entregas concluídas")}. Registros finalizados são somente leitura.`)),
    entregas.length
      ? entregas.map(cartaoDaEntrega)
      : estadoVazio({ icone: "clock", titulo: "Sem entregas concluídas", texto: "As entregas que você concluir ficam registradas aqui." }));
}

aplicarTemaSalvo();
carregarDados();
if (exigirEntregador()) {
  montarBarraDemo($("#demo"));
  desenhar();
  escutarMudancas(desenhar);
}
