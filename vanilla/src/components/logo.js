// src/components/logo.js — logo do Peddi: símbolo (public/img/logo.svg) + nome em texto.
import { h } from "../utils/dom.js";

const base = import.meta.env.BASE_URL; // "/" no dev, "/peddi/" no build
const LOGO = `${base}img/logo.svg`;

// Só o símbolo (barra de demonstração, cabeçalhos pequenos).
export function marcaLogo(tamanho = 30) {
  return h("img", { src: LOGO, alt: "", height: tamanho, "aria-hidden": "true" });
}

// Símbolo + nome "Peddi". O texto usa a cor do tema, então funciona no claro e no escuro.
export function logoCompleto(tamanho = 30) {
  return h("span", { class: "logo" },
    marcaLogo(tamanho),
    h("span", null, "Peddi"),
  );
}

// Substitui <span data-logo> do HTML pelo logo.
export function montarLogos(raiz = document) {
  raiz.querySelectorAll("[data-logo]").forEach((m) => m.replaceWith(logoCompleto()));
}