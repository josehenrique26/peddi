// src/components/status-badge.js — selo colorido (ícone + texto) do estado de um pedido. Devolve um elemento.
import { ESTADOS, ESTADOS_VIAGEM } from "../data/order-states.js";
import { icone } from "./icon.js";

// "mapa" troca a tabela de estados (ex.: ESTADOS_VIAGEM para o selo de uma viagem).
export function seloDeEstado(estado, mapa = ESTADOS) {
  const { rotulo, icone: nomeIcone, cor } = mapa[estado];
  const selo = document.createElement("span");
  selo.className = `badge b-${cor}`;
  selo.append(icone(nomeIcone, 13), rotulo);
  return selo;
}

export const seloDeViagem = (estado) => seloDeEstado(estado, ESTADOS_VIAGEM);
