// src/components/empty-state.js — bloco "nada por aqui" reutilizável.
import { h } from "../utils/dom.js";
import { icone } from "./icon.js";

export function estadoVazio({ icone: nomeIcone = "receipt", titulo, texto }) {
  return h("div", { class: "empty" },
    h("span", { class: "ico-wrap" }, icone(nomeIcone, 24)),
    h("h3", {}, titulo),
    texto ? h("p", {}, texto) : null);
}
