// src/components/status-badge.js — selo colorido com ícone e texto do estado de um pedido.
import { h } from "../utils/dom.js";
import { ESTADOS } from "../data/order-states.js";
import { icone } from "./icon.js";

export function seloDeEstado(estado) {
  const { rotulo, icone: nomeIcone, cor } = ESTADOS[estado];
  return h("span", { class: `badge b-${cor}` }, icone(nomeIcone, 13), rotulo);
}
