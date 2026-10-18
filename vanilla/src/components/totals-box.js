// src/components/totals-box.js — bloco "Subtotal / Taxa de entrega / Total".
import { el } from "./dom.js";
import { brl } from "../utils/format.js";

export function blocoDeTotais({ subtotal, taxa, rotuloSubtotal = "Subtotal" }) {
  return el("div", { class: "totals" },
    el("div", {}, el("span", {}, rotuloSubtotal), el("span", {}, brl(subtotal))),
    el("div", {}, el("span", {}, "Taxa de entrega"), el("span", {}, brl(taxa))),
    el("div", { class: "grand" }, el("span", {}, "Total"), el("span", {}, brl(subtotal + taxa))),
  );
}
