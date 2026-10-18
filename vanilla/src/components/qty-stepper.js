// src/components/qty-stepper.js — controle "− 2 +" de quantidade.
import { el } from "./dom.js";

export function seletorDeQuantidade({ nome, qtd, aoDiminuir, aoAumentar, mais = true }) {
  return el("div", { class: "qty", role: "group", "aria-label": `Quantidade de ${nome}` },
    el("button", { type: "button", "aria-label": `Diminuir quantidade de ${nome}`, onclick: aoDiminuir }, "−"),
    el("output", { "aria-live": "polite" }, String(qtd)),
    el("button", { type: "button", "aria-label": `Aumentar quantidade de ${nome}`, disabled: !mais, onclick: aoAumentar }, "+"),
  );
}
