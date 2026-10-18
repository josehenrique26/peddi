// src/components/order-tracker.js — barra de etapas e linha do tempo de um pedido.
import { el } from "./dom.js";
import { icone } from "./icon.js";
import { ESTADOS } from "../data/order-states.js";
import { ETAPAS } from "../data/order-rules.js";
import { hora, quando } from "../utils/format.js";

// Barra: Recebido → Em preparo → Pronto → Em entrega → Entregue.
export function barraDeEtapas(pedido) {
  const atual = ETAPAS.indexOf(pedido.state);

  const passos = ETAPAS.map((etapa, i) => {
    const registro = pedido.history.find((h) => h.state === etapa);
    const concluida = i < atual || (i === atual && etapa === "entregue");
    const classe = concluida ? "done" : i === atual ? "cur" : "";

    return el("li", { class: classe, "aria-current": i === atual ? "step" : null },
      el("span", { class: "dot" }, icone(concluida ? "check" : ESTADOS[etapa].icone, 16)),
      el("span", {}, ESTADOS[etapa].rotulo, registro && el("br"), registro && el("small", {}, hora(registro.at))),
    );
  });

  return el("ol", { class: "track", "aria-label": "Progresso do pedido" }, ...passos);
}

// Histórico completo, do mais recente para o mais antigo.
export function linhaDoTempo(pedido) {
  const eventos = [...pedido.history].reverse().map((h) =>
    el("li", {},
      el("div", { class: "strong" }, ESTADOS[h.state].rotulo),
      el("div", { class: "n" }, `${quando(h.at)} · ${h.by}`, h.note && el("br"), h.note),
    ));
  return el("ol", { class: "tl" }, ...eventos);
}
