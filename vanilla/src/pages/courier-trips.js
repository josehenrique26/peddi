// src/pages/courier-trips.js — viagens do entregador (entregador-viagens.html).
import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEntregador } from "../utils/guard.js";
import { quando, plural } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { carregarDados, escutarMudancas } from "../services/storage.js";
import { entregadorAtual, viagensDoEntregador } from "../services/courier-orders.js";
import { el, mount } from "../components/dom.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarCasca, avisoDeInativo } from "../components/courier-shell.js";
import { seloDeViagem } from "../components/status-badge.js";
import { estadoVazio } from "../components/empty-state.js";

const $ = (seletor) => document.querySelector(seletor);

function cartaoDaViagem(viagem) {
  const qtd = viagem.orderIds.length;
  return el("a", { class: "card tripcard", href: rotas.entregadorViagem(viagem.id) },
    el("div", { class: "row between" }, el("span", { class: "oid-d" }, viagem.id), seloDeViagem(viagem.state)),
    el("div", { class: "muted small", style: { margin: "4px 0" } }, `${qtd} ${plural(qtd, "pedido", "pedidos")} · criada ${quando(viagem.createdAt)}`),
    el("div", { class: "row" }, viagem.orderIds.map((id) => el("span", { class: "badge b-gray" }, id))));
}

function desenhar() {
  const entregador = entregadorAtual();
  const viagens = viagensDoEntregador(entregador.id);
  montarCasca("viagens", entregador);
  mount($("#main"),
    avisoDeInativo(entregador),
    el("h2", {}, "Minhas viagens"),
    viagens.length
      ? viagens.map(cartaoDaViagem)
      : estadoVazio({
          icone: "route", titulo: "Nenhuma viagem ainda", texto: "Selecione pedidos prontos para criar sua primeira viagem.",
          acao: el("a", { class: "btn btn-primary", href: rotas.entregador() }, "Ver pedidos disponíveis"),
        }));
}

aplicarTemaSalvo();
carregarDados();
if (exigirEntregador()) {
  montarBarraDemo($("#demo"));
  desenhar();
  escutarMudancas(desenhar);
}
