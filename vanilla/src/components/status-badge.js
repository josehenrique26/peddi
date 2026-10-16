// src/components/status-badge.js — selo colorido (ícone + texto) do estado de um pedido. Devolve um elemento.
import { ESTADOS } from "../data/order-states.js";
import { icone } from "./icon.js";

export function seloDeEstado(estado) {
  const { rotulo, icone: nomeIcone, cor } = ESTADOS[estado];
  const selo = document.createElement("span");
  selo.className = `badge b-${cor}`;
  selo.append(icone(nomeIcone, 13), rotulo);
  return selo;
}